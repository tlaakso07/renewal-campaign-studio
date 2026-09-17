import { z } from "zod";
import {
  Actor,
  check,
  createRecord,
  db,
  getAsset,
  getRecord,
  json,
  now,
  audit,
  updateRecord,
} from "./db.ts";
import { ensureLocalFile } from "./storage.ts";
import { publicationFile } from "./community.ts";
import { safePath } from "./assets.ts";

const lessonCategories = [
  "Getting Started",
  "Static Ads",
  "Video & UGC",
  "Remix",
  "Meta & Insights",
  "Brand System",
] as const;
const target = z.enum([
  "campaigns",
  "static",
  "video",
  "insights",
  "assets",
  "brand",
  "shared",
]);
const resource = z.object({
  label: z.string().trim().min(1).max(120),
  assetId: z.string().trim().min(1).max(200),
});
const contentInput = z.object({
  kind: z.enum(["lesson", "recording"]),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(2000),
  transcript: z.string().trim().max(30000).default(""),
  category: z.enum(lessonCategories).default("Getting Started"),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  audience: z.enum(["company", "platform"]),
  publicationId: z.string().trim().min(1).nullable().default(null),
  mediaAssetId: z.string().trim().min(1).nullable().default(null),
  thumbnailAssetId: z.string().trim().min(1).nullable().default(null),
  resources: z.array(resource).max(8).default([]),
  target: target.default("campaigns"),
  archive: z.enum(["past-events", "help-sessions"]).nullable().default(null),
  state: z.enum(["draft", "published", "archived"]),
});

function contentManager(a: Actor) {
  check(a.staff || a.role === "owner", "Company owner access required", 403);
}

function managedRecord(a: Actor, rid: string) {
  contentManager(a);
  const row = db
    .prepare(
      "SELECT * FROM records WHERE id=? AND kind IN ('lesson','recording') AND (company=? OR company IS NULL)",
    )
    .get(rid, a.company) as any;
  check(row, "Training content not found", 404);
  check(row.company !== null || a.staff, "Platform staff required", 403);
  return { ...row, body: json(row.body) };
}

function validateReferences(a: Actor, input: z.infer<typeof contentInput>) {
  check(
    input.audience !== "platform" || a.staff,
    "Platform staff required for shared training",
    403,
  );
  check(
    input.kind === "recording" ? !!input.archive : input.archive === null,
    input.kind === "recording"
      ? "Choose a recording archive"
      : "Lessons do not use a recording archive",
  );
  check(
    !(input.publicationId && input.mediaAssetId),
    "Choose either a company recording or a published video",
  );
  if (input.publicationId) {
    const publication = getRecord(a, input.publicationId, "publication");
    check(
      publication.body.state === "published" &&
        publication.body.mediaType === "video",
      "Select a published video",
    );
  }
  if (input.mediaAssetId) {
    check(
      input.audience === "company",
      "Platform training cannot expose company recording files",
    );
    const media = getAsset(a, input.mediaAssetId);
    check(
      media.kind === "video" && !!media.path,
      "Select an available company video",
    );
  }
  check(
    input.kind !== "recording" ||
      input.state !== "published" ||
      !!input.publicationId ||
      !!input.mediaAssetId,
    "A published recording needs a video",
  );
  if (input.audience === "platform") {
    check(
      !input.mediaAssetId &&
        !input.thumbnailAssetId &&
        input.resources.length === 0,
      "Platform training cannot expose company asset files",
    );
  } else {
    if (input.thumbnailAssetId) {
      const thumbnail = getAsset(a, input.thumbnailAssetId);
      check(!!thumbnail.preview, "Thumbnail needs an available image preview");
    }
    for (const item of input.resources) getAsset(a, item.assetId);
  }
}

export function manageClassroom(a: Actor) {
  contentManager(a);
  const where = a.staff
    ? "kind IN ('lesson','recording') AND (company=? OR company IS NULL)"
    : "kind IN ('lesson','recording') AND company=?";
  return (
    db
      .prepare(`SELECT * FROM records WHERE ${where} ORDER BY updated DESC`)
      .all(a.company) as any[]
  ).map((row) => ({ ...row, body: json(row.body) }));
}

export function saveClassroomContent(a: Actor, input: unknown, rid?: string) {
  contentManager(a);
  const body = contentInput.parse(input);
  validateReferences(a, body);
  const normalized = {
    ...body,
    tags: [...new Set(body.tags.map((tag) => tag.toLowerCase()))],
    format:
      body.publicationId || body.mediaAssetId
        ? body.kind === "recording"
          ? "Recording"
          : "Video lesson"
        : "Written guide",
  };
  if (!rid) {
    const created = createRecord(
      a,
      body.kind,
      normalized,
      body.audience === "platform",
    );
    return created;
  }
  const existing = managedRecord(a, rid);
  check(existing.kind === body.kind, "Content type cannot be changed", 409);
  check(
    (existing.company === null) === (body.audience === "platform"),
    "Audience cannot be changed after creation",
    409,
  );
  const expectedVersion = z
    .number()
    .int()
    .positive()
    .parse((input as any).expectedVersion);
  const updated = updateRecord(a, rid, expectedVersion, normalized);
  return updated;
}

export function registerClassroom(app: any, route: any) {
  app.get(
    "/api/classroom/manage",
    route((req: any, res: any) => res.json(manageClassroom(req.actor))),
  );
  app.post(
    "/api/classroom/content",
    route((req: any, res: any) =>
      res.json(saveClassroomContent(req.actor, req.body)),
    ),
  );
  app.put(
    "/api/classroom/content/:id",
    route((req: any, res: any) =>
      res.json(saveClassroomContent(req.actor, req.body, req.params.id)),
    ),
  );
  app.get(
    "/api/classroom/:kind/:id/media",
    route(async (req: any, res: any) => {
      check(
        req.params.kind === "lesson" || req.params.kind === "recording",
        "Unknown training content",
        404,
      );
      const content = getRecord(req.actor, req.params.id, req.params.kind);
      check(
        content.body.state === "published" &&
          (content.body.publicationId || content.body.mediaAssetId),
        "No published recording",
        404,
      );
      const path = content.body.mediaAssetId
        ? (() => {
            const media = getAsset(req.actor, content.body.mediaAssetId);
            check(
              media.kind === "video" && media.path,
              "Recording unavailable",
              404,
            );
            return safePath(req.actor.company, media.path);
          })()
        : publicationFile(req.actor, content.body.publicationId);
      await ensureLocalFile(path);
      res.sendFile(path, { dotfiles: "allow" });
    }),
  );
}

const starterGuides = [
  [
    "Your first campaign",
    null,
    "Getting Started",
    "Create a campaign from Campaigns. Add your actual offer and exact terms, or leave the offer empty for awareness. Save your brief. Open Static Studio and select an imported company photo. Your offer is a version: changing it will not rewrite previous downloads.",
    "campaigns",
    ["offer", "brief", "campaign"],
  ],
  [
    "Make a static ad with real assets",
    "Create, revise, download",
    "Static Ads",
    "Choose a campaign and layout. Select a layer to change its copy, position or source image. Undo returns the last local edit; Version history restores an earlier saved document as a new version. Save, then Render PNG. Activity shows the actual job. When ready, download the image or ZIP with copy and manifest.",
    "static",
    ["static", "assets", "download"],
  ],
  [
    "Build a video with company footage and AI scenes",
    null,
    "Video & UGC",
    "Start from the current campaign and select company-owned footage or an approved generated scene. Keep each scene editable, preserve the exact offer and end card, then render through Activity. A provider must be enabled before paid generation can run.",
    "video",
    ["video", "footage", "scenes"],
  ],
  [
    "Create presenter-style ads",
    null,
    "Video & UGC",
    "Use Video & UGC for a presenter-led concept with branded captions and a company end card. Confirm that the presenter media is permitted for advertising, keep claims within the approved brief, and review the final timeline before download.",
    "video",
    ["presenter", "ugc", "captions"],
  ],
  [
    "Remix an ad into your design system",
    null,
    "Remix",
    "Open a published Winning Ad, review its evidence and usage notes, then remix only the visible structure into your private company workspace. The remix uses your campaign, brand, offer and assets; it does not copy private source files from another company.",
    "shared",
    ["remix", "winning ads", "design system"],
  ],
  [
    "Connect Meta and read actual results",
    "Read a source report",
    "Meta & Insights",
    "Import a report with account, date, ad ID, spend, currency, timezone and attribution. Preview validation before committing. Reimporting a row replaces the same source fact. CPL is total spend divided by total leads, not an average of individual CPLs.",
    "insights",
    ["meta", "results", "cpl"],
  ],
  [
    "Compare lead costs with qualified appointments",
    null,
    "Meta & Insights",
    "Use the available result fields and their definitions before comparing performance. Keep ad-platform observations separate from qualified appointment outcomes unless a validated company report supplies both. Never treat a forecast, benchmark or AI assessment as an actual result.",
    "insights",
    ["leads", "appointments", "evidence"],
  ],
  [
    "Use your brand and asset library",
    null,
    "Brand System",
    "Open Brand System to confirm the approved logo, primary color, font permissions and source notes. Use My Assets to review provenance and select real company media. Historical offers are references only; enter the current offer in the campaign brief.",
    "brand",
    ["brand", "logo", "assets", "typography"],
  ],
] as const;

function starterBody(guide: (typeof starterGuides)[number]) {
  const [title, , category, content, target, tags] = guide;
  return {
    title,
    category,
    description: content,
    transcript: content,
    target,
    tags,
    audience: "platform",
    state: "published",
    publicationId: null,
    mediaAssetId: null,
    thumbnailAssetId: null,
    archive: null,
    format: "Written guide",
    resources: [],
  };
}

/** Idempotently installs the versioned platform curriculum in any workspace. */
export function ensureClassroomCatalog(a: Actor) {
  let changed = false;
  for (const guide of starterGuides) {
    const [title, legacyTitle] = guide;
    const rows = (
      db
        .prepare(
          "SELECT * FROM records WHERE kind='lesson' AND company IS NULL",
        )
        .all() as any[]
    ).map((row) => ({ ...row, body: json(row.body) }));
    if (rows.some((row) => row.body.title === title)) continue;
    const legacy = legacyTitle
      ? rows.find((row) => row.body.title === legacyTitle)
      : null;
    const body = starterBody(guide);
    if (!legacy) {
      createRecord(a, "lesson", body, true);
    } else {
      const revision = legacy.rev + 1;
      const updated = now();
      db.prepare("UPDATE records SET body=?,rev=?,updated=? WHERE id=?").run(
        JSON.stringify(body),
        revision,
        updated,
        legacy.id,
      );
      db.prepare("INSERT INTO versions VALUES(?,?,?,?)").run(
        legacy.id,
        revision,
        JSON.stringify(body),
        updated,
      );
      audit(a, "lesson.curriculum-update", legacy.id);
    }
    changed = true;
  }
  return changed;
}
