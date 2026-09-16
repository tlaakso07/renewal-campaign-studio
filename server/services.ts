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
} from "./types.ts";
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
    (["offer", "terms", "start", "end"].some(
      (k) => old.body[k] !== body[k as keyof typeof body],
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
function layer(
  role: string,
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
  extra: object = {},
) {
  return layerSchema.parse({ id: role, role, type, x, y, w, h, ...extra });
}
export function newCreative(
  a: Actor,
  input: {
    campaignId: string;
    kind: "static" | "video";
    assetId?: string;
    layout?: string;
    format?: string;
    reference?: string;
  },
) {
  creator(a);
  const campaign = getRecord(a, input.campaignId, "campaign"),
    b = brand(a);
  check(b, "Configure company brand first");
  const photo = input.assetId ? getAsset(a, input.assetId) : null;
  if (photo)
    check(photo.status === "preview_ready", "Choose an imported asset");
  const format = (input.format || "portrait") as CreativeDoc["format"],
    layout = (input.layout || "editorial") as CreativeDoc["layout"];
  const [, h] = dimensions[format] || dimensions.portrait;
  const layers = [
    layer("photo", "photo", 0, 0, 1080, Math.round(h * 0.57), {
      assetId: photo?.id || null,
    }),
    layer(
      "panel",
      "shape",
      0,
      Math.round(h * 0.57),
      1080,
      Math.round(h * 0.43),
    ),
    layer("logo", "logo", 64, Math.round(h * 0.6), 310, 92, {
      assetId: b.body.logoAssetId,
    }),
    layer("headline", "text", 64, Math.round(h * 0.7), 930, 145, {
      text: campaign.body.offer || "A brighter view starts here.",
      fontSize: 66,
    }),
    layer("cta-background", "shape", 64, h - 156, 550, 66, {
      fill: b.body.color,
    }),
    layer("cta", "text", 86, h - 146, 504, 50, {
      text: campaign.body.cta,
      fontSize: 30,
    }),
    layer("terms", "text", 64, h - 72, 950, 60, {
      text: campaign.body.terms,
      fontSize: 18,
    }),
  ];
  const doc = documentSchema.parse({
    name: `${campaign.body.name} · ${input.kind === "video" ? "Video" : "Static"}`,
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
  });
  return createRecord(a, "creative", adaptLayout(doc, layout));
}
export function adaptLayout(
  doc: CreativeDoc,
  layout = doc.layout,
  format = doc.format,
): CreativeDoc {
  const [w, h] = dimensions[format];
  const prevH = dimensions[doc.format][1];
  let layers = doc.layers.map((l) => ({
    ...l,
    y: Math.round((l.y * h) / prevH),
  }));
  const set = (role: string, v: object) => {
    layers = layers.map((l) => (l.role === role ? { ...l, ...v } : l));
  };
  if (layout === "split" && format !== "vertical") {
    set("photo", { x: 480, y: 0, w: 600, h });
    set("panel", { x: 0, y: 0, w: 480, h });
    set("logo", { x: 45, y: 64, w: 360, h: 115 });
    set("headline", {
      x: 45,
      y: Math.round(h * 0.3),
      w: 395,
      h: Math.round(h * 0.4),
      fontSize: 58,
    });
    set("cta-background", { x: 45, y: h - 228, w: 390, h: 74 });
    set("cta", { x: 65, y: h - 213, w: 348, h: 62, fontSize: 28 });
    set("terms", { x: 45, y: h - 132, w: 390, h: 115, fontSize: 17 });
  } else if (layout === "showcase") {
    set("photo", { x: 0, y: 0, w, h: Math.round(h * 0.64) });
    set("panel", { x: 0, y: Math.round(h * 0.64), w, h: Math.round(h * 0.36) });
    set("logo", { x: 54, y: Math.round(h * 0.665), w: 300, h: 90 });
    set("headline", {
      x: 54,
      y: Math.round(h * 0.76),
      w: 960,
      h: 128,
      fontSize: 56,
    });
    set("cta-background", { x: 54, y: h - 150, w: 510, h: 62 });
    set("cta", { x: 74, y: h - 141, w: 470, h: 52, fontSize: 28 });
    set("terms", { x: 54, y: h - 69, w: 965, h: 60, fontSize: 17 });
  } else {
    set("photo", { x: 0, y: 0, w, h: Math.round(h * 0.53) });
    set("panel", { x: 0, y: Math.round(h * 0.53), w, h: Math.round(h * 0.47) });
    set("logo", { x: 64, y: Math.round(h * 0.55), w: 310, h: 95 });
    set("headline", {
      x: 64,
      y: Math.round(h * 0.65),
      w: 950,
      h: Math.round(h * 0.18),
      fontSize: 64,
    });
    set("cta-background", { x: 64, y: h - 161, w: 550, h: 66 });
    set("cta", { x: 86, y: h - 150, w: 504, h: 53, fontSize: 30 });
    set("terms", { x: 64, y: h - 78, w: 950, h: 67, fontSize: 18 });
  }
  return documentSchema.parse({ ...doc, format, layout, layers });
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
  check(
    doc.scenes.every((s) => s.source === "company"),
    "Generated providers are not configured",
    422,
  );
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
export function queueJob(a: Actor, kind: string, payload: any, key: string) {
  creator(a);
  check(key && key.length < 180, "An idempotency key is required");
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
    const units = kind === "render" ? 1 : 0;
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
    const units = j.kind === "render" ? 1 : 0;
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
