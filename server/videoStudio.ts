// Video & UGC studio service: plan → per-segment stills → per-segment clips → voice → assembled video creative.
// Each paid step is its own confirmed job; segments stay independent so one bad scene never costs the rest.
import { z } from "zod";
import { Actor, brand, check, createRecord, creator, db, getAsset, getRecord, json, updateRecord } from "./db.ts";
import { storeAsset } from "./assets.ts";
import { documentSchema, layerSchema, dimensions, adContentSchema, type CreativeDoc } from "./types.ts";
import { adLayers, offerEnds } from "./adLayouts.ts";
import { brandFonts, ensureBrandFonts } from "./render.ts";
import { queueJob, validateDocument } from "./services.ts";
import { motionPrompt, secondsFor, videoPlanSchema, writeVideoPlan, type PlanDependencies, type VideoPlan } from "./videoPlan.ts";
import { alignWords, captionChunks, speak, wordTimes, type Word } from "./voice.ts";
import { directPlan, sceneKeyframePrompt, type DirectorDependencies } from "./videoDirector.ts";
import { writeBrief, type BriefDependencies } from "./videoBrief.ts";
import { FORMATS, isKeyNote, lintBrief, type Check } from "./videoLint.ts";

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
const frameQAOf = (a: Actor, assetId: string) => {
  try {
    return getAsset(a, assetId).metadata.frameQA || null;
  } catch {
    return null;
  }
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
      stillQA: s.stillAssetId || still?.assetId ? frameQAOf(a, (still?.status === "ready" ? still.assetId : s.stillAssetId) as string) : null,
      clipJob: clip,
    };
  });
  // The Editor Checklist runs on every read, so an edit can never leave a stale green tick.
  const format = FORMATS[body.format];
  const checks = body.brief && format ? lintBrief(body, format, brand(a).body) : [];
  return { ...r, body: { ...body, segments }, checks };
}
// Standard §6: a failed checklist line blocks the next paid step. Plans without a brief have no checklist.
const gate = (checks: Check[]) => {
  const failed = checks.filter((c) => !c.ok).length;
  check(!failed, `Fix the ${failed} checklist item${failed === 1 ? "" : "s"} first`, 422);
};

export async function createPlan(a: Actor, input: unknown, deps: PlanDependencies & BriefDependencies = {}) {
  creator(a);
  const b = brand(a);
  check(b, "Configure company brand first");
  const req = z
    .object({
      style: z.enum(["commercial", "ugc"]).default("commercial"),
      content: adContentSchema.pick({ tiers: true, ends: true, cta: true }),
      targetSeconds: z.number().int().min(10).max(45).default(30),
      aspect: z.enum(["1:1", "4:5", "9:16"]).default("4:5"),
      instructions: z.string().max(2000).default(""),
      name: z.string().max(160).optional(),
      // "own": the owner writes every scene and line themself (default). "ai": draft a script to edit.
      // "brief": the agent writes a full production brief in a named format (product/VIDEO-BRIEF-STANDARD.md).
      write: z.enum(["own", "ai", "brief"]).default("own"),
      scenes: z.number().int().min(1).max(12).default(4),
      format: z.enum(Object.keys(FORMATS) as [string, ...string[]]).optional(),
      campaign: z.string().max(200).default("This month's offer"),
    })
    .parse(input);
  check(req.write !== "brief" || req.format, "Choose a video format", 422);
  const plan =
    req.write === "brief"
      ? (await writeBrief(b.body, { format: req.format!, content: adContentSchema.pick({ tiers: true, ends: true, cta: true, terms: true }).parse(input && (input as any).content), campaign: req.campaign, aspect: req.aspect, instructions: req.instructions }, deps)).plan
      : req.write === "ai"
      ? await writeVideoPlan(b.body, req, deps)
      : videoPlanSchema.parse({
          style: req.style,
          aspect: req.aspect,
          targetSeconds: req.targetSeconds,
          content: req.content,
          instructions: req.instructions,
          script: "",
          segments: Array.from({ length: req.scenes }, (_, i) => ({ id: `s${i + 1}`, seconds: 3, line: "", setting: "", shots: [{ phrase: "", visual: "" }] })),
        });
  return createRecord(a, "videoPlan", stored.parse({ ...plan, name: req.name || (req.write === "brief" ? plan.name : `${req.style === "ugc" ? "UGC" : "Commercial"} · ${req.targetSeconds}s`) }));
}
// The Director pass: exact cinematography prompts for every scene. Re-run after script edits.
export async function directVideo(a: Actor, id: string, deps: DirectorDependencies = {}) {
  creator(a);
  const r = getRecord(a, id, "videoPlan");
  const plan = stored.parse(r.body);
  const direction = await directPlan(plan, brand(a).body, deps);
  const latest = getRecord(a, id, "videoPlan");
  const body = stored.parse(latest.body);
  return updateRecord(a, id, latest.rev, {
    ...body,
    bible: direction.bible,
    segments: body.segments.map((s) => {
      const d = direction.segments.find((x) => x.id === s.id);
      return d ? { ...s, keyframePrompt: d.keyframePrompt, motionPrompt: d.motionPrompt } : s;
    }),
  });
}
// Owner edits to the script/shots; clears a segment's still/clip only when its visuals or line changed.
export function savePlan(a: Actor, id: string, expected: number, input: unknown) {
  const old = stored.parse(getRecord(a, id, "videoPlan").body);
  const next = stored.parse(input);
  next.segments = next.segments.map((s) => {
    const before = old.segments.find((o) => o.id === s.id);
    const line = s.shots.map((x) => x.phrase.trim()).filter(Boolean).join(" ");
    // Everything the Director reads (server/videoDirector.ts directorBrief): a camera or note edit must rebuild the prompts too.
    const seen = (x: typeof s) => JSON.stringify([x.shots, x.setting, x.camera, x.editorNote, x.kind, x.graphic]);
    const changed = !before || seen(before) !== seen(s);
    // Script changes invalidate the Director's prompts for that scene (unless the owner edited the prompts themself).
    const promptsEdited = before && (before.keyframePrompt !== s.keyframePrompt || before.motionPrompt !== s.motionPrompt);
    const visualsChanged = !before || JSON.stringify(before.shots.map((x) => x.visual)) !== JSON.stringify(s.shots.map((x) => x.visual));
    return {
      ...s,
      line,
      // Length follows the words unless the owner set it by hand. A brief's durations are fixed: the checklist flags a misfit.
      seconds: next.brief || (before && before.seconds !== s.seconds) ? s.seconds : secondsFor(line),
      ...(changed && before ? { clipAssetId: null, clipJobId: null, ...(promptsEdited ? {} : { keyframePrompt: "", motionPrompt: "" }) } : {}),
      // A rewritten picture needs a new frame and a new sign-off; rewording the voice does not.
      ...(visualsChanged && before ? { approved: false } : {}),
      // The board tint follows the editor note; the server decides, so the client carries no rule.
      key: isKeyNote(s.editorNote),
    };
  });
  next.script = next.segments.map((s) => s.line).filter(Boolean).join(" ");
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
  const r = getPlan(a, id);
  gate(r.checks);
  const plan = stored.parse(r.body);
  const segment = segmentOf(plan, input.segmentId);
  check(segment.kind === "footage", "Cards are rendered exactly, never generated", 422);
  const b = brand(a);
  const index = plan.segments.indexOf(segment);
  // Brand kit first (vehicle, uniform, product) so crews, trucks and windows come out correctly branded.
  const kit = b.body.videoKit;
  const kitRefs: [string, string][] = kit
    ? [
        ...kit.vehicle.slice(0, 1).map((x: string) => [x, "the company vehicle — match its livery and logo exactly"] as [string, string]),
        ...kit.uniform.slice(0, 2).map((x: string) => [x, "the crew uniform — match the polo, cap and trousers, but follow the prompt for which chest logos to include"] as [string, string]),
        ...kit.product.slice(0, 1).map((x: string) => [x, "the product — match the window's frame, grilles and finish"] as [string, string]),
        ...(b.body.logoAssetId ? [[b.body.logoAssetId, "the exact logo artwork — wherever the logo appears (vehicle, cap, chest) reproduce THIS artwork precisely, upright and unaltered"] as [string, string]] : []),
      ]
    : [];
  const continuity = [...(plan.style === "ugc" ? [plan.segments[0].stillAssetId] : []), plan.segments[index - 1]?.stillAssetId].filter(Boolean) as string[];
  const references = [...kitRefs.map(([x]) => x), ...continuity].filter((x, i, all) => all.indexOf(x) === i);
  const legend = [
    ...kitRefs.map(([, label], i) => `Reference image ${i + 1}: ${label}.`),
    ...continuity.map((_, i) => `Reference image ${kitRefs.length + i + 1}: an earlier frame of this same ad — keep the same home, people and light.`),
  ].join(" ");
  // A single-scene Redo after an edit keeps the Avatar/Product Bible (brief plans); non-brief plans use the generic frame prompt.
  const job: any = queueJob(
    a,
    "generation",
    { kind: "image", model: "sunburst", prompt: `${legend}\n\n${sceneKeyframePrompt(plan, segment, b.body)}`.trim(), aspect: plan.aspect, sourceAssetIds: references.slice(0, 6), variations: 1, confirmBillable: input.confirmBillable,
      // Every keyframe is inspected against the real brand photos and regenerated until clean (up to 3 paid attempts).
      frameQA: { context: `${segment.setting}. First shot: ${segment.shots[0].visual}. ${kit?.notes || ""}`.slice(0, 6000), referenceAssetIds: kitRefs.map(([x]) => x).slice(0, 4), maxAttempts: 3 } },
    input.key,
    availability,
  );
  patchSegment(a, id, segment.id, { stillJobId: job.id, stillAssetId: null, clipJobId: null, clipAssetId: null, approved: false });
  return job;
}
// Owner sign-off on board frames. Nothing is animated until its frame is approved.
export function approveScenes(a: Actor, id: string, input: { segmentId?: string; approved?: boolean }) {
  const current = stored.parse(getPlan(a, id).body);
  const r = getRecord(a, id, "videoPlan");
  const body = stored.parse(r.body);
  return updateRecord(a, id, r.rev, {
    ...body,
    segments: body.segments.map((s) => {
      if (input.segmentId && s.id !== input.segmentId) return s;
      const still = current.segments.find((x) => x.id === s.id)?.stillAssetId || null;
      check(input.approved === false || still || s.kind !== "footage", "Generate a frame for every scene before approving", 422);
      // Persist the resolved frame so the approval is tied to the image the owner actually saw.
      return { ...s, stillAssetId: still, approved: input.approved !== false };
    }),
  });
}
// Build the whole board in one step: exact prompts from the Director, then a frame for every scene that lacks one.
export async function generateBoard(a: Actor, id: string, input: { confirmBillable: true }, availability?: object, deps: DirectorDependencies = {}) {
  check(input.confirmBillable === true, "Confirm the paid board generation", 422);
  const r = getPlan(a, id);
  gate(r.checks);
  let plan = stored.parse(r.body);
  plan.segments.forEach((s, i) => check(s.kind !== "footage" || s.shots.some((x) => x.visual.trim()), `Scene ${i + 1}: describe what we see`, 422));
  if (plan.segments.some((s) => s.kind === "footage" && !s.keyframePrompt)) {
    await directVideo(a, id, deps);
    plan = stored.parse(getPlan(a, id).body);
  }
  // A scene needs a frame when it has none and no live job; a failed job counts as none, so the button never no-ops.
  const needsFrame = (s: Stored["segments"][number]) => s.kind === "footage" && !s.stillAssetId && (!s.stillJobId || jobState(a, s.stillJobId)?.status === "failed");
  // ponytail: all frames queue at once; continuity comes from the Director's shared bible. Chain them if frames drift.
  for (const s of plan.segments) if (needsFrame(s)) queueStill(a, id, { segmentId: s.id, key: `board-${id}-${s.id}-${Date.now()}`, confirmBillable: true }, availability);
  return getPlan(a, id);
}
// Swap in a real brand photo instead of an AI still.
export function useBrandStill(a: Actor, id: string, segmentId: string, assetId: string) {
  const asset = getAsset(a, assetId);
  check(asset.kind === "image" && asset.metadata.historical !== true, "Choose original company photography", 422);
  const current = segmentOf(stored.parse(getPlan(a, id).body), segmentId);
  const generatedStillAssetId = current.stillAssetId?.startsWith("generated-") ? current.stillAssetId : current.generatedStillAssetId;
  // A new picture (or the undo back to the old one) is a new picture: the owner signs it off again before any clip.
  return patchSegment(a, id, segmentId, { stillAssetId: assetId, generatedStillAssetId, stillJobId: null, clipJobId: null, clipAssetId: null, approved: false });
}
// One Seedance image-to-video clip per segment, from its approved still.
export function queueClip(a: Actor, id: string, input: { segmentId: string; key: string; confirmBillable: true }, availability?: object) {
  const plan = stored.parse(getPlan(a, id).body);
  const segment = segmentOf(plan, input.segmentId);
  check(segment.stillAssetId, "Approve a still for this scene first", 422);
  check(segment.approved, "Approve this scene on the vision board before animating it", 422);
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
export async function buildVideo(a: Actor, id: string, input: { campaignId?: string; endCard?: "logo" | "offer"; musicAssetId?: string | null; captionStyle?: "pill" | "headline"; offerBuild?: boolean } = {}) {
  creator(a);
  const r = getPlan(a, id);
  const plan = stored.parse(r.body);
  const b = brand(a);
  check(plan.segments.every((s) => s.clipAssetId || s.stillAssetId), "Every scene needs a clip or a still", 422);
  check(plan.segments.every((s) => s.approved), "Approve every scene on the vision board first", 422);
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
  const style = input.captionStyle || "pill";
  // Headline style: one caption per scene — its whole line, from its first spoken word to the next scene's.
  const sceneStarts = plan.segments.map((s) => timeline.find((t) => t.segment.id === s.id)!.start);
  const captionTrack =
    style === "headline"
      ? plan.segments.map((s, i) => ({ start: sceneStarts[i], end: Math.min(sceneStarts[i + 1] ?? spokenEnd, spokenEnd), text: s.line })).filter((c) => c.text.trim() && c.end > c.start)
      : plan.style === "commercial"
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
    captionStyle: style,
    offerBuild: input.offerBuild !== false && plan.content.tiers.length > 0,
    content,
    terms: [plan.content && (plan as any).content.terms, b.body.requiredFinePrint].filter(Boolean).join(" "),
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
  app.get("/api/video/formats", route((_req: any, res: any) => res.json(Object.fromEntries(Object.entries(FORMATS).map(([k, f]) => [k, { label: f.label, runtime: f.runtime, scenes: f.scenes, tone: f.tone, pace: f.pace }])))));
  app.get("/api/video/plans", route((req: any, res: any) => res.json((db.prepare("SELECT id FROM records WHERE company=? AND kind='videoPlan' ORDER BY updated DESC LIMIT 30").all(req.actor.company) as any[]).map((x) => getPlan(req.actor, x.id)))));
  app.post("/api/video/plans", route(async (req: any, res: any) => res.json(getPlan(req.actor, (await createPlan(req.actor, req.body)).id))));
  app.get("/api/video/plans/:id", route((req: any, res: any) => res.json(getPlan(req.actor, req.params.id))));
  app.put("/api/video/plans/:id", route((req: any, res: any) => { savePlan(req.actor, req.params.id, req.body.expectedVersion, req.body.body); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/direct", route(async (req: any, res: any) => { await directVideo(req.actor, req.params.id); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/board", route(async (req: any, res: any) => res.json(await generateBoard(req.actor, req.params.id, req.body, availability(req)))));
  app.post("/api/video/plans/:id/approve", route((req: any, res: any) => { approveScenes(req.actor, req.params.id, req.body); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/still", route((req: any, res: any) => { queueStill(req.actor, req.params.id, req.body, availability(req)); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/brand-still", route((req: any, res: any) => { useBrandStill(req.actor, req.params.id, req.body.segmentId, req.body.assetId); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/clip", route((req: any, res: any) => { queueClip(req.actor, req.params.id, req.body, availability(req)); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/voice", route(async (req: any, res: any) => { await makeVoice(req.actor, req.params.id, req.body); res.json(getPlan(req.actor, req.params.id)); }));
  app.post("/api/video/plans/:id/build", route(async (req: any, res: any) => res.json(await buildVideo(req.actor, req.params.id, req.body))));
}
