// Video & UGC studio service: plan → per-segment stills → per-segment clips → voice → assembled video creative.
// Each paid step is its own confirmed job; segments stay independent so one bad scene never costs the rest.
import { z } from "zod";
import { Actor, brand, check, createRecord, creator, db, getAsset, getRecord, json, updateRecord } from "./db.ts";
import { storeAsset } from "./assets.ts";
import { documentSchema, layerSchema, dimensions, adContentSchema, type CreativeDoc } from "./types.ts";
import { adLayers, offerEnds } from "./adLayouts.ts";
import { brandFonts, ensureBrandFonts } from "./render.ts";
import { queueJob, validateDocument } from "./services.ts";
import { framePrompt, motionPrompt, videoPlanSchema, writeVideoPlan, type PlanDependencies, type VideoPlan } from "./videoPlan.ts";
import { alignWords, captionChunks, speak, wordTimes, type Word } from "./voice.ts";

const FORMAT: Record<VideoPlan["aspect"], CreativeDoc["format"]> = { "1:1": "square", "4:5": "portrait", "9:16": "vertical" };
const stored = videoPlanSchema.extend({
  segments: z.array(
    videoPlanSchema.shape.segments.element.extend({ stillJobId: z.string().nullable().default(null), clipJobId: z.string().nullable().default(null) }),
  ),
});
type Stored = z.infer<typeof stored>;

const jobState = (a: Actor, jobId: string | null) => {
  if (!jobId) return null;
  const j = db.prepare("SELECT status,error,output FROM jobs WHERE id=? AND company=?").get(jobId, a.company) as any;
  return j ? { status: j.status as string, error: j.error as string | null, assetId: j.output ? json(j.output).assetId : null } : null;
};
// Plans resolve finished jobs into asset ids on read, so progress survives reloads without a callback.
export function getPlan(a: Actor, id: string) {
  const r = getRecord(a, id, "videoPlan");
  const body = stored.parse(r.body);
  const segments = body.segments.map((s) => {
    const still = jobState(a, s.stillJobId),
      clip = jobState(a, s.clipJobId);
    return {
      ...s,
      stillAssetId: still?.status === "ready" ? still.assetId : s.stillAssetId,
      clipAssetId: clip?.status === "ready" ? clip.assetId : s.clipAssetId,
      stillJob: still,
      clipJob: clip,
    };
  });
  return { ...r, body: { ...body, segments } };
}

export async function createPlan(a: Actor, input: unknown, deps: PlanDependencies = {}) {
  creator(a);
  const b = brand(a);
  check(b, "Configure company brand first");
  const req = z
    .object({
      style: z.enum(["commercial", "ugc"]),
      content: adContentSchema.pick({ tiers: true, ends: true, cta: true }),
      targetSeconds: z.number().int().min(10).max(45),
      aspect: z.enum(["1:1", "4:5", "9:16"]).default("4:5"),
      instructions: z.string().max(2000).default(""),
      name: z.string().max(160).optional(),
    })
    .parse(input);
  const plan = await writeVideoPlan(b.body, req, deps);
  return createRecord(a, "videoPlan", stored.parse({ ...plan, name: req.name || `${req.style === "ugc" ? "UGC" : "Commercial"} · ${req.targetSeconds}s` }));
}
// Owner edits to the script/shots; clears a segment's still/clip only when its visuals or line changed.
export function savePlan(a: Actor, id: string, expected: number, input: unknown) {
  const old = stored.parse(getRecord(a, id, "videoPlan").body);
  const next = stored.parse(input);
  next.segments = next.segments.map((s) => {
    const before = old.segments.find((o) => o.id === s.id);
    const line = s.shots.map((x) => x.phrase).join(" ");
    const changed = !before || JSON.stringify(before.shots) !== JSON.stringify(s.shots) || before.setting !== s.setting;
    return { ...s, line, ...(changed && before ? { clipAssetId: null, clipJobId: null } : {}) };
  });
  next.script = next.segments.map((s) => s.line).join(" ");
  if (next.script !== old.script) Object.assign(next, { voiceAssetId: null, words: [] });
  return updateRecord(a, id, expected, next);
}

const segmentOf = (plan: Stored, segmentId: string) => {
  const s = plan.segments.find((x) => x.id === segmentId);
  check(s, "Segment not found", 404);
  return s!;
};
function patchSegment(a: Actor, id: string, segmentId: string, patch: object) {
  const r = getRecord(a, id, "videoPlan");
  const body = stored.parse(r.body);
  return updateRecord(a, id, r.rev, { ...body, segments: body.segments.map((s) => (s.id === segmentId ? { ...s, ...patch } : s)) });
}
// Keyframe still (GPT Image). Previous segment's still is a reference so the home and people stay consistent.
export function queueStill(a: Actor, id: string, input: { segmentId: string; key: string; confirmBillable: true }, availability?: object) {
  const plan = stored.parse(getPlan(a, id).body);
  const segment = segmentOf(plan, input.segmentId);
  const b = brand(a);
  const index = plan.segments.indexOf(segment);
  const references = [
    ...(plan.style === "ugc" ? [plan.segments[0].stillAssetId] : []),
    plan.segments[index - 1]?.stillAssetId,
    ...(b.body.adPhotos?.scenes || []).slice(index, index + 2),
  ].filter((x, i, all): x is string => !!x && all.indexOf(x) === i);
  const job: any = queueJob(
    a,
    "generation",
    { kind: "image", model: "sunburst", prompt: framePrompt(plan, segment, b.body), aspect: plan.aspect, sourceAssetIds: references.slice(0, 4), variations: 1, confirmBillable: input.confirmBillable },
    input.key,
    availability,
  );
  patchSegment(a, id, segment.id, { stillJobId: job.id, stillAssetId: null, clipJobId: null, clipAssetId: null });
  return job;
}
// Swap in a real brand photo instead of an AI still.
export function useBrandStill(a: Actor, id: string, segmentId: string, assetId: string) {
  const asset = getAsset(a, assetId);
  check(asset.kind === "image" && asset.metadata.historical !== true, "Choose original company photography", 422);
  return patchSegment(a, id, segmentId, { stillAssetId: assetId, stillJobId: null, clipJobId: null, clipAssetId: null });
}
// One Seedance image-to-video clip per segment, from its approved still.
export function queueClip(a: Actor, id: string, input: { segmentId: string; key: string; confirmBillable: true }, availability?: object) {
  const plan = stored.parse(getPlan(a, id).body);
  const segment = segmentOf(plan, input.segmentId);
  check(segment.stillAssetId, "Approve a still for this scene first", 422);
  const job: any = queueJob(
    a,
    "generation",
    {
      kind: "video",
      model: "seedance-2-5",
      operation: "image-to-video",
      sourceAssetIds: [segment.stillAssetId],
      prompt: motionPrompt(plan, segment),
      duration: Math.max(4, Math.ceil(segment.seconds)),
      resolution: "720p",
      aspectRatio: plan.aspect === "4:5" ? "3:4" : plan.aspect,
      generateAudio: plan.style === "ugc",
      confirmBillable: input.confirmBillable,
    },
    input.key,
    availability,
  );
  patchSegment(a, id, segment.id, { clipJobId: job.id, clipAssetId: null });
  return job;
}

export type VoiceDependencies = { speak?: typeof speak; wordTimes?: typeof wordTimes; duration?: (bytes: Buffer) => Promise<number> };
// One voiceover take for the whole script (commercial style), with word timings for captions and cuts.
export async function makeVoice(a: Actor, id: string, input: { voice?: string; confirmBillable: true }, deps: VoiceDependencies = {}) {
  creator(a);
  check(input.confirmBillable === true, "Confirm the paid voice request", 422);
  const r = getRecord(a, id, "videoPlan");
  const plan = stored.parse(r.body);
  const take = await (deps.speak || speak)(plan.script, input.voice || plan.voice);
  const asset = await storeAsset(a, `voice-${id}-v${r.rev}`, take.bytes, `Voiceover ${plan.name.replace(/[^\w -]/g, "")} v${r.rev}${(take as any).extension || ".mp3"}`);
  let heard: Word[] = [];
  try {
    heard = (await (deps.wordTimes || wordTimes)(take.bytes)).words;
  } catch {
    // Timing falls back to an even spread; the voice itself is still usable.
  }
  const duration = Number(getAsset(a, asset.id).metadata.duration) || plan.script.split(/\s+/).length / 2.4;
  const words = alignWords(plan.script, heard, duration);
  const latest = getRecord(a, id, "videoPlan");
  return updateRecord(a, id, latest.rev, { ...stored.parse(latest.body), voice: input.voice || plan.voice, voiceAssetId: asset.id, words });
}

// Shot timeline: each shot starts when its first word is spoken (or evenly, without a voice track).
function shotTimes(plan: Stored) {
  const shots = plan.segments.flatMap((s) => s.shots.map((shot) => ({ segment: s, shot })));
  const total = plan.segments.reduce((n, s) => n + s.seconds, 0);
  const starts: number[] = [];
  if (plan.words.length) {
    let w = 0;
    for (const { shot } of shots) {
      starts.push(plan.words[Math.min(w, plan.words.length - 1)].start);
      w += shot.phrase.split(/\s+/).filter(Boolean).length;
    }
    starts[0] = 0;
  } else {
    let t = 0;
    for (const { segment } of shots) {
      starts.push(t);
      t += segment.seconds / segment.shots.length;
    }
  }
  const end = plan.words.length ? plan.words.at(-1)!.end + 0.4 : total;
  return shots.map((x, i) => ({ ...x, start: starts[i], end: starts[i + 1] ?? end }));
}

// Assemble a normal video creative: clips trimmed to the shot timeline, voice + pill captions, logo end card.
export async function buildVideo(a: Actor, id: string, input: { campaignId?: string; endCard?: "logo" | "offer"; musicAssetId?: string | null } = {}) {
  creator(a);
  const r = getPlan(a, id);
  const plan = stored.parse(r.body);
  const b = brand(a);
  check(plan.segments.every((s) => s.clipAssetId || s.stillAssetId), "Every scene needs a clip or a still", 422);
  check(plan.style === "ugc" || plan.voiceAssetId, "Generate the voiceover first", 422);
  const format = FORMAT[plan.aspect];
  const timeline = shotTimes(plan);
  const scenes = [] as CreativeDoc["scenes"];
  const media = (s: Stored["segments"][number]) => {
    const asset = getAsset(a, (s.clipAssetId || s.stillAssetId)!);
    return { asset, source: (asset.metadata.origin === "generated" ? "generated" : "company") as "generated" | "company", length: asset.kind === "video" ? Number(asset.metadata.duration) || s.seconds : Infinity };
  };
  if (plan.style === "ugc")
    for (const s of plan.segments)
      scenes.push({ id: s.id, assetId: s.clipAssetId || s.stillAssetId, duration: Math.min(s.seconds, Math.floor(media(s).length * 10) / 10), trim: 0, caption: s.line, narration: s.line, shotDirection: s.shots[0].visual, mute: !s.clipAssetId, volume: 1, source: media(s).source });
  else
    for (const [i, t] of timeline.entries()) {
      const s = t.segment;
      const local = s.shots.indexOf(t.shot);
      // Each shot plays its own slice of the segment clip, so the model's cuts and ours line up.
      const m = media(s);
      const slice = (Number.isFinite(m.length) ? m.length : s.seconds) / s.shots.length;
      const duration = Math.max(0.5, Math.round((t.end - t.start) * 100) / 100);
      // Never trim past the end of the clip.
      const trim = m.asset.kind === "video" ? Math.max(0, Math.min(local * slice, m.length - duration - 0.05)) : 0;
      scenes.push({ id: `${s.id}-${local + 1}`, assetId: m.asset.id, duration: m.asset.kind === "video" ? Math.min(duration, Math.max(0.5, m.length - trim - 0.05)) : duration, trim: Math.round(trim * 100) / 100, caption: "", narration: t.shot.phrase, shotDirection: t.shot.visual, mute: true, volume: 1, source: m.source });
      void i;
    }
  const spokenEnd = scenes.reduce((n, s) => n + s.duration, 0);
  const captionTrack =
    plan.style === "commercial"
      ? captionChunks(plan.words).filter((c) => c.start < spokenEnd).map((c) => ({ ...c, end: Math.min(c.end, spokenEnd) }))
      : [];
  await ensureBrandFonts(a, b.body);
  const content = adContentSchema.parse({ ...plan.content, headline: "", photoAssetId: null, cutoutAssetId: b.body.adPhotos?.cutouts?.[0] || null });
  const layers = adLayers("diagonal", format, { headline: plan.content.tiers.length ? "Save On Custom\nWindow & Door Replacement:" : b.body.name, cta: plan.content.cta, tiers: plan.content.tiers, ends: offerEnds(plan.content.ends) }, { photo: null, cutout: content.cutoutAssetId, logo: b.body.logoAssetId, logoReverse: b.body.logoReverseAssetId || null }, brandFonts(a, b.body));
  const campaignId =
    input.campaignId ||
    (db.prepare("SELECT id FROM records WHERE company=? AND kind='campaign' AND json_extract(body,'$.name')='Studio ads'").get(a.company) as any)?.id;
  check(campaignId, "Create a static ad or campaign first so videos have a folder", 422);
  const campaign = getRecord(a, campaignId, "campaign");
  const doc = documentSchema.parse({
    name: plan.name,
    kind: "video",
    campaignId: campaign.id,
    brandId: b.id,
    brandVersion: b.rev,
    offerVersion: campaign.body.offerVersion,
    format,
    layout: "diagonal",
    layers: layers.map((l) => layerSchema.parse(l)),
    scenes,
    voiceAssetId: plan.voiceAssetId,
    musicAssetId: input.musicAssetId || null,
    captionTrack,
    captionStyle: "pill",
    endCard: input.endCard || "logo",
    copy: plan.script,
    videoBrief: { style: plan.style === "ugc" ? "ugc" : "commercial", script: plan.script, presenterDirection: plan.presenter, voiceDirection: plan.voice },
  });
  void dimensions;
  const creative = createRecord(a, "creative", validateDocument(a, doc));
  const latest = getRecord(a, id, "videoPlan");
  updateRecord(a, id, latest.rev, { ...stored.parse(latest.body), creativeId: creative.id });
  return creative;
}

export function registerVideoStudio(app: any, route: any, availability: (req: any) => object) {
  app.get("/api/video/plans", route((req: any, res: any) => res.json((db.prepare("SELECT id FROM records WHERE company=? AND kind='videoPlan' ORDER BY updated DESC LIMIT 30").all(req.actor.company) as any[]).map((x) => getPlan(req.actor, x.id)))));
  app.post("/api/video/plans", route(async (req: any, res: any) => res.json(getPlan(req.actor, (await createPlan(req.actor, req.body)).id))));
  app.get("/api/video/plans/:id", route((req: any, res: any) => res.json(getPlan(req.actor, req.params.id))));
  app.put("/api/video/plans/:id", route((req: any, res: any) => { savePlan(req.actor, req.params.id, req.body.expectedVersion, req.body.body); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/still", route((req: any, res: any) => { queueStill(req.actor, req.params.id, req.body, availability(req)); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/brand-still", route((req: any, res: any) => { useBrandStill(req.actor, req.params.id, req.body.segmentId, req.body.assetId); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/clip", route((req: any, res: any) => { queueClip(req.actor, req.params.id, req.body, availability(req)); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/voice", route(async (req: any, res: any) => { await makeVoice(req.actor, req.params.id, req.body); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/build", route(async (req: any, res: any) => res.json(await buildVideo(req.actor, req.params.id, req.body))));
}
