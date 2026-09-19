import { z } from "zod";
import {
  Actor,
  db,
  check,
  creator,
  createRecord,
  getRecord,
  updateRecord,
  getAsset,
  brand,
  listRecords,
  id,
  now,
  tx,
  json,
  hash,
} from "./db.ts";
import {
  campaignSchema,
  documentSchema,
  CreativeDoc,
  dimensions,
  layerSchema,
  adContentSchema,
  type AdContent,
} from "./types.ts";
import { validateGenerationRequest } from "./generation.ts";
import {
  adLayers,
  adLayouts,
  adLayoutNames,
  adProblems,
  defaultHeadlines,
  offerEnds,
  seasonOf,
  type AdCopy,
  type AdLayout,
} from "./adLayouts.ts";
import { brandFonts, textSvg } from "./render.ts";
import { buildAdPrompt, pickConcepts, requiredAdText } from "./adPrompt.ts";
export function saveCampaign(
  a: Actor,
  input: unknown,
  rid?: string,
  expected?: number,
) {
  const body = campaignSchema.parse(input);
  if (!rid) return createRecord(a, "campaign", body);
  const old = getRecord(a, rid, "campaign");
  body.offerVersion =
    old.body.offerVersion +
    (["offer", "terms", "start", "end", "tiers"].some(
      (k) =>
        JSON.stringify(old.body[k] ?? []) !==
        JSON.stringify(body[k as keyof typeof body] ?? []),
    )
      ? 1
      : 0);
  return updateRecord(a, rid, expected!, body);
}
export function duplicateCampaign(a: Actor, rid: string) {
  const old = getRecord(a, rid, "campaign");
  return saveCampaign(a, {
    ...old.body,
    name: `${old.body.name} · Copy`,
    start: "",
    end: "",
    status: "Draft",
    reviewInherited: true,
    offerVersion: 1,
  });
}
export function newCreative(
  a: Actor,
  input: {
    campaignId?: string;
    kind: "static" | "video";
    assetId?: string;
    layout?: string;
    format?: string;
    reference?: string;
    headline?: number;
    cta?: number;
    cutoutAssetId?: string;
    content?: Partial<AdContent>;
  },
) {
  creator(a);
  const b = brand(a);
  check(b, "Configure company brand first");
  // Owners create ads straight from the Studio; ads without a campaign are filed in "Studio ads".
  const campaign = input.campaignId
    ? getRecord(a, input.campaignId, "campaign")
    : studioCampaign(a);
  const photoId = input.content?.photoAssetId ?? input.assetId ?? null;
  const photo = photoId ? getAsset(a, photoId) : null;
  if (photo) {
    check(photo.status === "preview_ready", "Choose an imported asset");
    if (input.kind === "static") {
      check(photo.kind === "image", "Static ads require an original image");
      check(
        photo.metadata.historical !== true,
        "Historical ads are reference-only. Choose original company photography or start an explicit remix.",
        422,
      );
    }
  }
  const format = (input.format || "portrait") as CreativeDoc["format"],
    layout = toAdLayout(input.layout),
    adVariant = { headline: input.headline || 0, cta: input.cta || 0 },
    pool = b.body.adPhotos;
  const content = adContentSchema.parse({
    ...contentFromCampaign(campaign.body, adVariant),
    ...input.content,
    // No photo chosen: take one from the brand's curated ad pool rather than leaving an empty ad.
    photoAssetId:
      photo?.id || (input.kind === "static" ? pool?.scenes?.[0] : null) || null,
    cutoutAssetId:
      input.content?.cutoutAssetId ||
      input.cutoutAssetId ||
      pool?.cutouts?.[0] ||
      null,
  });
  const layers = adLayers(
    layout,
    format,
    adCopy(content),
    adMedia(content, b.body),
    brandFonts(a, b.body),
  );
  const doc = documentSchema.parse({
    name: `${campaign.body.name} · ${input.kind === "video" ? "Video" : adLayoutNames[layout]}`,
    kind: input.kind,
    campaignId: campaign.id,
    brandId: b.id,
    brandVersion: b.rev,
    offerVersion: campaign.body.offerVersion,
    format,
    layout,
    layers,
    scenes:
      input.kind === "video"
        ? [
            {
              id: id(),
              assetId: photo?.id || null,
              duration: 6,
              caption: "A brighter view starts here.",
              mute: true,
            },
            {
              id: id(),
              assetId: photo?.id || null,
              duration: 6,
              caption: "Explore your options.",
              mute: true,
            },
          ]
        : [],
    reference: input.reference || null,
    copy: campaign.body.offer || "A brighter view starts here.",
    terms: finePrint(content, b.body),
    content: input.kind === "static" ? content : undefined,
    adVariant,
  });
  return createRecord(a, "creative", doc);
}
const toAdLayout = (layout?: string): AdLayout =>
  (adLayouts as readonly string[]).includes(layout || "")
    ? (layout as AdLayout)
    : "band";
// Starting content when an ad is created from (or filed in) a campaign.
function contentFromCampaign(campaign: any, v: CreativeDoc["adVariant"]): AdContent {
  const headlines = campaign.headlines?.length
      ? campaign.headlines
      : defaultHeadlines(campaign),
    ctas = campaign.ctaLabels?.length
      ? campaign.ctaLabels
      : ["Book your FREE Design Consultation"];
  return adContentSchema.parse({
    headline: headlines[v.headline % headlines.length],
    cta: ctas[v.cta % ctas.length],
    tiers: (campaign.tiers || []).slice(0, 2),
    ends: /^\d{4}-\d{2}-\d{2}$/.test(campaign.end || "") ? campaign.end : "",
    terms: campaign.terms || "",
    legalApproved: campaign.legalApproved === true,
  });
}
const adCopy = (c: AdContent): AdCopy => ({
  headline: c.headline,
  cta: c.cta,
  tiers: c.tiers,
  ends: offerEnds(c.ends),
});
const adMedia = (c: AdContent, brand: any) => ({
  photo: c.photoAssetId,
  cutout: c.cutoutAssetId,
  logo: brand.logoAssetId,
  logoReverse: brand.logoReverseAssetId || null,
  focusY: c.photoFocusY,
});
const finePrint = (c: { terms?: string }, brand: any) =>
  [c.terms, brand.requiredFinePrint].filter(Boolean).join(" ");
// ponytail: found by name; add a flag to campaignSchema if owners start renaming it.
function studioCampaign(a: Actor) {
  return (
    listRecords(a, "campaign").find((c: any) => c.body.name === "Studio ads") ||
    saveCampaign(a, { name: "Studio ads", goal: "Lead generation" })
  );
}
// Older template ads have no stored content; derive it from their campaign and existing layers.
function contentOf(a: Actor, doc: CreativeDoc): AdContent {
  if (doc.content) return doc.content;
  const campaign = getRecord(a, doc.campaignId, "campaign");
  const find = (id: string) => doc.layers.find((l) => l.id === id);
  return adContentSchema.parse({
    ...contentFromCampaign(campaign.body, doc.adVariant),
    ...(find("headline")?.text ? { headline: find("headline")!.text } : {}),
    ...(find("cta")?.text ? { cta: find("cta")!.text } : {}),
    photoAssetId: find("photo")?.assetId || null,
    cutoutAssetId: find("cutout")?.assetId || null,
  });
}
// Rebuild a template ad from its content in a given layout/format. The only way template layers change.
export function adaptLayout(
  a: Actor,
  doc: CreativeDoc,
  layout: string = doc.layout,
  format = doc.format,
  patch: Partial<AdContent> = {},
): CreativeDoc {
  check(doc.layout !== "ai", "AI-designed ads are changed by remixing or regenerating, not by layout edits", 422);
  const b = brand(a);
  const content = adContentSchema.parse({ ...contentOf(a, doc), ...patch });
  const pool = b.body.adPhotos;
  if (!content.cutoutAssetId) content.cutoutAssetId = pool?.cutouts?.[0] || null;
  for (const id of [content.photoAssetId, content.cutoutAssetId].filter(Boolean)) {
    const asset = getAsset(a, id!);
    check(asset.kind === "image" && asset.metadata.historical !== true, "Choose original company photography", 422);
  }
  const layers = adLayers(
    toAdLayout(layout),
    format,
    adCopy(content),
    adMedia(content, b.body),
    brandFonts(a, b.body),
  );
  return documentSchema.parse({
    ...doc,
    format,
    layout: toAdLayout(layout),
    layers,
    content: doc.kind === "static" ? content : doc.content,
    terms: finePrint(content, b.body),
  });
}
// Unsaved ad for live previews on the create screen.
export function draftAd(
  a: Actor,
  input: { layout?: string; format?: string; content?: unknown },
): CreativeDoc {
  const b = brand(a);
  check(b, "Configure company brand first");
  const content = adContentSchema.parse(input.content || {});
  const pool = b.body.adPhotos;
  if (!content.cutoutAssetId) content.cutoutAssetId = pool?.cutouts?.[0] || null;
  for (const id of [content.photoAssetId, content.cutoutAssetId].filter(Boolean)) {
    const asset = getAsset(a, id!);
    check(asset.kind === "image" && asset.metadata.historical !== true, "Choose original company photography", 422);
  }
  const layout = toAdLayout(input.layout),
    format = (["square", "portrait", "vertical"].includes(input.format || "") ? input.format : "portrait") as CreativeDoc["format"];
  return documentSchema.parse({
    name: "Preview",
    kind: "static",
    campaignId: "",
    brandId: b.id,
    brandVersion: b.rev,
    offerVersion: 1,
    format,
    layout,
    layers: adLayers(layout, format, adCopy(content), adMedia(content, b.body), brandFonts(a, b.body)),
    content,
    terms: finePrint(content, b.body),
  });
}
// Zuops-style Create/Remix: build a 4-ad GPT Image batch from the brand design system.
export const adBatchSchema = z.object({
  mode: z.enum(["create", "remix"]),
  content: adContentSchema.pick({ headline: true, tiers: true, ends: true, cta: true }),
  aspect: z.enum(["1:1", "4:5", "9:16"]).default("4:5"),
  sourceAssetId: z.string().optional(),
  referenceAssetIds: z.array(z.string()).max(3).default([]),
  instructions: z.string().max(2000).default(""),
  concept: z.string().max(300).optional(),
  angle: z.string().max(80).optional(),
  tone: z.string().max(80).optional(),
  model: z.enum(["sunburst", "flare"]).default("sunburst"),
  variations: z.number().int().min(1).max(4).default(4),
  // Rendered from the brand's real font files by the route; tells the model the only allowed typeface.
  typeSpecimenAssetId: z.string().optional(),
  confirmBillable: z.literal(true),
});
export function adBatchPayload(a: Actor, input: unknown, seed = Date.now()) {
  const req = adBatchSchema.parse(input);
  const b = brand(a);
  check(b, "Configure company brand first");
  check(req.content.tiers.length, "Add at least one offer, e.g. “Buy 5 Windows” · “Save $1,000”.");
  check(req.mode === "create" || req.sourceAssetId, "Choose the ad to remix");
  if (req.sourceAssetId) {
    const source = getAsset(a, req.sourceAssetId);
    check(source.kind === "image" && source.preview, "Remix needs an image ad");
  }
  // Source ad first (the prompt refers to it), then the logo, then real brand ads for style.
  // A different slice of the company's real ads each batch, so the AI sees their range of styles.
  const pool = (b.body.styleReferences || []).filter((id: string) => id !== req.sourceAssetId);
  const start = pool.length ? seed % pool.length : 0;
  const styleRefs = [...pool.slice(start), ...pool.slice(0, start)].slice(0, req.mode === "remix" ? 2 : 3);
  const sourceAssetIds = [
    ...(req.sourceAssetId ? [req.sourceAssetId] : []),
    ...(b.body.logoAssetId ? [b.body.logoAssetId] : []),
    ...(req.typeSpecimenAssetId ? [req.typeSpecimenAssetId] : []),
    ...styleRefs,
    ...req.referenceAssetIds,
  ].slice(0, 8);
  const concepts = pickConcepts(req.variations, req.concept, seed);
  const prompts = concepts.map((concept) =>
    buildAdPrompt({
      mode: req.mode,
      brand: b.body,
      content: req.content,
      concept,
      aspect: req.aspect,
      angle: req.angle,
      tone: req.tone,
      instructions: req.instructions,
      hasSource: !!req.sourceAssetId,
      styleReferenceCount: styleRefs.length,
      hasTypeSpecimen: !!req.typeSpecimenAssetId,
    }),
  );
  return {
    kind: "image" as const,
    model: req.model,
    prompt: prompts[0],
    prompts,
    variations: req.variations,
    aspect: req.aspect,
    sourceAssetIds,
    requiredText: requiredAdText(req.content),
    season: seasonOf(req.content.ends),
    confirmBillable: true as const,
  };
}
// Save one generated ad into the Ads Library as a normal creative (single full-canvas image).
export function saveGeneratedAd(a: Actor, input: { assetId: string; campaignId?: string; name?: string }) {
  creator(a);
  const asset = getAsset(a, input.assetId);
  check(asset.metadata.origin === "generated" && asset.kind === "image", "Choose a generated ad", 422);
  const b = brand(a);
  const campaign = input.campaignId ? getRecord(a, input.campaignId, "campaign") : studioCampaign(a);
  const ratio = (asset.metadata.width || 1) / (asset.metadata.height || 1);
  const format: CreativeDoc["format"] = ratio > 0.9 ? "square" : ratio > 0.7 ? "portrait" : "vertical";
  const [w, h] = dimensions[format];
  return createRecord(
    a,
    "creative",
    documentSchema.parse({
      name: input.name || `${campaign.body.name} · AI ad`,
      kind: "static",
      campaignId: campaign.id,
      brandId: b.id,
      brandVersion: b.rev,
      offerVersion: campaign.body.offerVersion,
      format,
      layout: "ai",
      layers: [layerSchema.parse({ id: "photo", role: "photo", type: "photo", x: 0, y: 0, w, h, assetId: asset.id })],
      copy: asset.metadata.prompt || "",
    }),
  );
}
// Problems that keep a template ad from meeting the standard (empty list = ready).
export function templateProblems(a: Actor, doc: CreativeDoc): string[] {
  if (doc.kind !== "static" || doc.layout === "ai") return [];
  const fonts = brandFonts(a, brand(a).body);
  return adProblems(toAdLayout(doc.layout), contentOf(a, doc), doc.layers, (l) => {
    try {
      textSvg(fonts, layerSchema.parse(l));
      return true;
    } catch {
      return false;
    }
  });
}
export function validateDocument(a: Actor, input: unknown) {
  const doc = documentSchema.parse(input);
  check(
    new Set(doc.layers.map((l) => l.id)).size === doc.layers.length,
    "Layer IDs must be unique",
  );
  check(
    new Set(doc.scenes.map((s) => s.id)).size === doc.scenes.length,
    "Scene IDs must be unique",
  );
  getRecord(a, doc.campaignId, "campaign");
  const b = getRecord(a, doc.brandId, "brand");
  check(b.company === a.company, "Wrong company brand", 403);
  check(
    db
      .prepare("SELECT rev FROM versions WHERE record=? AND rev=?")
      .get(b.id, doc.brandVersion),
    "Brand version not found",
  );
  for (const assetId of [
    ...doc.layers.map((l) => l.assetId),
    ...doc.scenes.map((s) => s.assetId),
    doc.musicAssetId,
    doc.voiceAssetId,
  ].filter(Boolean))
    getAsset(a, assetId!);
  for (const scene of doc.scenes) {
    if (!scene.assetId || scene.mute) continue;
    const asset = getAsset(a, scene.assetId);
    check(
      asset.metadata.hasAudio !== true || scene.caption.trim(),
      "Unmuted source audio requires a scene caption transcript",
    );
  }
  check(
    doc.scenes.every((scene) => scene.source !== "presenter"),
    "Generated presenters are not configured",
    422,
  );
  for (const scene of doc.scenes.filter(
    (value) => value.source === "generated",
  )) {
    check(scene.assetId, "Generated scenes require a stored generated asset");
    check(
      getAsset(a, scene.assetId).metadata.origin === "generated",
      "Generated scenes must use a generated asset",
    );
  }
  return doc;
}
export function saveCreative(
  a: Actor,
  rid: string,
  expected: number,
  input: unknown,
) {
  getRecord(a, rid, "creative");
  return updateRecord(a, rid, expected, validateDocument(a, input));
}
// Allowance units: one per render, one per generated image (a 4-ad batch costs 4).
const jobUnits = (kind: string, payload: any) =>
  kind === "render" ? 1 : kind === "generation" ? payload?.frameQA?.maxAttempts || payload?.variations || 1 : 0;
export function queueJob(
  a: Actor,
  kind: string,
  payload: any,
  key: string,
  availability?: { gateway?: boolean; higgsfield?: boolean },
) {
  creator(a);
  check(key && key.length < 180, "An idempotency key is required");
  if (kind === "generation")
    payload = validateGenerationRequest(a, payload, availability);
  return tx(() => {
    const old = db
      .prepare("SELECT * FROM jobs WHERE company=? AND idempotency=?")
      .get(a.company, key) as any;
    if (old) {
      check(
        old.kind === kind && old.payload === JSON.stringify(payload),
        "Idempotency key already used for a different request",
        409,
      );
      return old;
    }
    if (kind === "render") {
      const r = getRecord(a, payload.creativeId, "creative");
      check(r.rev === payload.version, "Render version changed; reload", 409);
      validateDocument(a, r.body);
      check(!payload.modelId, "Selected model is unavailable", 422);
    }
    if (kind === "intake") getAsset(a, payload.assetId);
    const units = jobUnits(kind, payload);
    const entitlement = listRecords(a, "entitlements")[0]?.body || {
      renderUnits: 200,
      concurrency: 2,
    };
    const used = (
      db
        .prepare(
          "SELECT COALESCE(SUM(CASE WHEN state='reserved' THEN reserved ELSE actual END),0) n FROM usage WHERE company=?",
        )
        .get(a.company) as any
    ).n;
    check(
      used + units <= entitlement.renderUnits,
      "Prototype render allowance reached. Owner can change the configured limit.",
      422,
    );
    const pending = (
      db
        .prepare(
          "SELECT COUNT(*) n FROM jobs WHERE company=? AND status IN ('queued','running')",
        )
        .get(a.company) as any
    ).n;
    check(
      pending < 20,
      "Job queue is full. Wait for current work to finish.",
      429,
    );
    const jid = id();
    db.prepare(
      "INSERT INTO jobs(id,company,user,kind,status,payload,idempotency,created,updated) VALUES(?,?,?,?,?,?,?,?,?)",
    ).run(
      jid,
      a.company,
      a.user,
      kind,
      "queued",
      JSON.stringify(payload),
      key,
      now(),
      now(),
    );
    db.prepare("INSERT INTO usage VALUES(?,?,?,?,?,?)").run(
      id(),
      a.company,
      jid,
      units,
      0,
      "reserved",
    );
    return db.prepare("SELECT * FROM jobs WHERE id=?").get(jid);
  });
}
export function job(a: Actor, jid: string) {
  const j = db
    .prepare("SELECT * FROM jobs WHERE id=? AND company=?")
    .get(jid, a.company) as any;
  check(j, "Job not found", 404);
  return {
    ...j,
    payload: json(j.payload),
    progress: json(j.progress),
    output: j.output ? json(j.output) : null,
  };
}
export function cancelJob(a: Actor, jid: string) {
  creator(a);
  const j = job(a, jid);
  check(
    ["queued", "running"].includes(j.status),
    "Only active jobs can be canceled",
    409,
  );
  db.prepare("UPDATE jobs SET status='canceled',updated=? WHERE id=?").run(
    now(),
    jid,
  );
  db.prepare("UPDATE usage SET reserved=0,state='released' WHERE job=?").run(
    jid,
  );
  return job(a, jid);
}
export function retryJob(a: Actor, jid: string) {
  creator(a);
  return tx(() => {
    const j = job(a, jid);
    check(
      ["failed", "partial", "canceled"].includes(j.status),
      "Only unfinished jobs can be retried",
      409,
    );
    const units = jobUnits(j.kind, j.payload);
    const limit = listRecords(a, "entitlements")[0]?.body.renderUnits || 200;
    const used = (
      db
        .prepare(
          "SELECT COALESCE(SUM(CASE WHEN state='reserved' THEN reserved ELSE actual END),0) n FROM usage WHERE company=?",
        )
        .get(a.company) as any
    ).n;
    check(used + units <= limit, "Render allowance reached", 422);
    db.prepare(
      "UPDATE usage SET reserved=?,actual=0,state='reserved' WHERE job=?",
    ).run(units, jid);
    db.prepare(
      "UPDATE jobs SET status='queued',error=NULL,updated=? WHERE id=?",
    ).run(now(), jid);
    return job(a, jid);
  });
}
