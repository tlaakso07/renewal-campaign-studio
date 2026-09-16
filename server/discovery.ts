import { z } from "zod";
import { existsSync } from "node:fs";
import {
  Actor,
  db,
  check,
  creator,
  getRecord,
  getAsset,
  listRecords,
  createRecord,
  updateRecord,
  json,
  id,
  tx,
} from "./db.ts";
import { newCreative, validateDocument, job } from "./services.ts";
import { safePath } from "./assets.ts";
import { documentSchema } from "./types.ts";

// Only composition geometry and timing cross the publication boundary.
export function publicStructure(input: unknown) {
  const doc = documentSchema.parse(input);
  return {
    format: doc.format,
    layout: doc.layout,
    layers: doc.layers.map(({ role, x, y, w, h, fontSize }) => ({
      role,
      x,
      y,
      w,
      h,
      fontSize,
    })),
    scenes: doc.scenes.map(({ duration }) => ({ duration })),
  };
}
export function saveBookmark(a: Actor, input: unknown) {
  const b = z
    .object({
      publicationId: z.string(),
      saved: z.boolean(),
      collection: z.string().trim().max(80).default(""),
    })
    .parse(input);
  const p = getRecord(a, b.publicationId, "publication");
  check(p.body.state === "published" || !b.saved, "Publication removed", 404);
  const old = listRecords(a, "bookmark").find(
    (r) => r.body.publicationId === p.id,
  );
  return old
    ? updateRecord(a, old.id, old.rev, b)
    : createRecord(a, "bookmark", b);
}
export function createRemix(a: Actor, input: unknown) {
  creator(a);
  const b = z
    .object({
      sourceType: z.enum(["publication", "asset"]),
      sourceId: z.string(),
      campaignId: z.string(),
      assetId: z.string().min(1),
      kind: z.enum(["static", "video"]),
      format: z.enum(["square", "portrait", "vertical"]),
      layout: z.enum(["editorial", "showcase", "split"]),
      adapt: z
        .array(
          z.enum([
            "hook",
            "layout",
            "narrative",
            "shots",
            "pacing",
            "captions",
          ]),
        )
        .min(1)
        .max(6),
      direction: z.string().trim().min(1).max(5000),
      hook: z.string().trim().max(1000).default(""),
      captions: z.array(z.string().max(5000)).max(12).default([]),
      durations: z.array(z.number().min(1).max(30)).max(12).default([]),
    })
    .parse(input);
  const source =
    b.sourceType === "publication"
      ? getRecord(a, b.sourceId, "publication")
      : getAsset(a, b.sourceId);
  if (b.sourceType === "publication")
    check(source.body.state === "published", "Publication removed", 404);
  else check(source.status === "preview_ready", "Import the reference first");
  const asset = getAsset(a, b.assetId);
  check(
    asset.status === "preview_ready",
    "Import your destination media first",
  );
  check(
    b.kind === "video" || asset.kind === "image",
    "Choose a photograph for a static remix",
  );
  check(
    !b.adapt.includes("hook") || b.hook.length > 0,
    "Write a hook for your company",
  );
  if (b.kind === "static")
    check(
      !b.adapt.some((k) =>
        ["shots", "pacing", "captions", "narrative"].includes(k),
      ),
      "Choose a video remix for scene adaptations",
    );
  const structure =
    b.sourceType === "publication" ? source.body.structure : null;
  // One transaction: validation failure cannot leave an orphaned creative.
  return tx(() => {
    const record = newCreative(a, {
      campaignId: b.campaignId,
      kind: b.kind,
      assetId: b.assetId,
      format: b.format,
      layout: b.layout,
      reference: b.sourceId,
    });
    const doc = record.body;
    if (b.adapt.includes("layout") && structure?.format === b.format) {
      doc.layout = structure.layout;
      doc.layers = doc.layers.map((layer: any) => {
        const geometry = structure.layers.find(
          (l: any) => l.role === layer.role,
        );
        return geometry ? { ...layer, ...geometry } : layer;
      });
    }
    if (b.adapt.includes("hook")) {
      doc.layers = doc.layers.map((l: any) =>
        l.role === "headline" ? { ...l, text: b.hook } : l,
      );
      doc.copy = b.hook;
    }
    if (b.kind === "video") {
      const timings = b.durations.length
        ? b.durations
        : b.adapt.includes("pacing") && structure?.scenes?.length
          ? structure.scenes.map((s: any) => s.duration)
          : [6, 6];
      check(
        !b.captions.length || b.captions.length === timings.length,
        "Provide one caption per scene",
      );
      doc.scenes = timings.map((duration: number, i: number) => ({
        id: id(),
        assetId: asset.id,
        duration,
        trim: 0,
        caption: b.captions[i] || (i === 0 ? b.hook : ""),
        mute: true,
        volume: 1,
        source: "company",
      }));
    }
    doc.remixBrief = {
      sourceType: b.sourceType,
      sourceId: b.sourceId,
      ...(source.rev ? { sourceVersion: source.rev } : {}),
      adapt: [...new Set(b.adapt)],
      direction: b.direction,
      hook: b.hook,
      usage:
        "Structure reference only. Destination company media and current campaign terms; no source advertiser media license is transferred.",
    };
    const parsed = validateDocument(a, doc);
    db.prepare("UPDATE records SET body=? WHERE id=?").run(
      JSON.stringify(parsed),
      record.id,
    );
    db.prepare("UPDATE versions SET body=? WHERE record=? AND rev=1").run(
      JSON.stringify(parsed),
      record.id,
    );
    return getRecord(a, record.id, "creative");
  });
}
export function campaignExports(a: Actor, campaignId: string) {
  getRecord(a, campaignId, "campaign");
  const creatives = listRecords(a, "creative").filter(
    (r) => r.body.campaignId === campaignId,
  );
  const ids = new Set(creatives.map((r) => r.id));
  const jobs = (
    db
      .prepare(
        "SELECT id,payload FROM jobs WHERE company=? AND kind='render' ORDER BY created DESC",
      )
      .all(a.company) as any[]
  )
    .filter((r) => ids.has(json(r.payload).creativeId))
    .map((r) => {
      const j = job(a, r.id);
      const version = db
        .prepare("SELECT body FROM versions WHERE record=? AND rev=?")
        .get(j.payload.creativeId, j.payload.version) as any;
      const doc = version ? json(version.body) : null;
      const files = [
        j.output?.file,
        j.output?.manifestFile,
        j.output?.copyFile,
        ...(j.output?.captionsFile ? [j.output.captionsFile] : []),
      ];
      const downloadable =
        j.status === "ready" &&
        files.every((f) => f && existsSync(safePath(a.company, f)));
      return {
        id: j.id,
        creativeId: j.payload.creativeId,
        version: j.payload.version,
        name: doc?.name,
        format: doc?.format,
        kind: doc?.kind,
        offerVersion: doc?.offerVersion,
        status: j.status,
        downloadable,
        reason: downloadable
          ? null
          : j.status === "ready"
            ? "Stored output is missing"
            : j.error || j.status,
        created: j.created,
      };
    });
  return {
    jobs,
    unrendered: creatives
      .filter(
        (c) =>
          !jobs.some(
            (j) =>
              j.creativeId === c.id && j.version === c.rev && j.downloadable,
          ),
      )
      .map((c) => ({
        id: c.id,
        name: c.body.name,
        version: c.rev,
        kind: c.body.kind,
      })),
  };
}
export function registerDiscovery(app: any, route: any) {
  app.get(
    "/api/bookmarks",
    route((req: any, res: any) =>
      res.json(listRecords(req.actor, "bookmark").filter((r) => r.body.saved)),
    ),
  );
  app.post(
    "/api/bookmarks",
    route((req: any, res: any) => res.json(saveBookmark(req.actor, req.body))),
  );
  app.post(
    "/api/remixes",
    route((req: any, res: any) => res.json(createRemix(req.actor, req.body))),
  );
  app.get(
    "/api/campaigns/:id/exports",
    route((req: any, res: any) =>
      res.json(campaignExports(req.actor, req.params.id)),
    ),
  );
}
