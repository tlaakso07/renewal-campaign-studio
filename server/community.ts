import { ensureLocalFile } from "./storage.ts";
import { z } from "zod";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  Actor,
  db,
  DATA,
  id,
  now,
  check,
  creator,
  owner,
  createRecord,
  getRecord,
  listRecords,
  updateRecord,
  audit,
  json,
} from "./db.ts";
import { job, newCreative } from "./services.ts";
import { safePath } from "./assets.ts";
import { publicStructure } from "./discovery.ts";
export function posts(a: Actor) {
  return listRecords(a, "post")
    .filter((p) => !p.body.removed)
    .map((p) => ({
      ...p,
      reactions: listRecords(a, "reaction").filter(
        (r) => r.body.postId === p.id,
      ).length,
      comments: listRecords(a, "comment").filter(
        (r) => r.body.postId === p.id && !r.body.removed,
      ).length,
      votes: p.body.options.map(
        (_: string, i: number) =>
          listRecords(a, "vote").filter(
            (v) => v.body.postId === p.id && v.body.choice === i,
          ).length,
      ),
    }));
}
export function post(a: Actor, pid: string) {
  const p = getRecord(a, pid, "post");
  check(!p.body.removed, "Post removed", 404);
  return p;
}
export function writePost(a: Actor, input: unknown) {
  const b = z
    .object({
      title: z.string().trim().min(1).max(180),
      text: z.string().trim().min(1).max(10000),
      audience: z.enum(["company", "shared"]),
      category: z.string().max(60),
      options: z.array(z.string().trim().min(1).max(160)).max(8).default([]),
    })
    .parse(input);
  check(
    !b.options.length ||
      (b.options.length >= 2 && new Set(b.options).size === b.options.length),
    "Poll needs at least two distinct choices",
  );
  return createRecord(
    a,
    "post",
    { ...b, author: a.name, authorId: a.user },
    b.audience === "shared",
  );
}
export function react(a: Actor, pid: string) {
  const p = post(a, pid);
  const prior = listRecords(a, "reaction").find(
    (r) => r.owner === a.user && r.body.postId === pid,
  );
  if (prior) {
    db.prepare("DELETE FROM versions WHERE record=?").run(prior.id);
    db.prepare("DELETE FROM records WHERE id=?").run(prior.id);
    return { active: false };
  }
  createRecord(a, "reaction", { postId: pid }, !p.company);
  return { active: true };
}
export function vote(a: Actor, pid: string, choice: number) {
  const p = post(a, pid);
  check(
    Number.isInteger(choice) && choice >= 0 && choice < p.body.options.length,
    "Unknown poll choice",
  );
  const prior = listRecords(a, "vote").find(
    (r) => r.owner === a.user && r.body.postId === pid,
  );
  if (prior) {
    db.prepare("UPDATE records SET body=? WHERE id=?").run(
      JSON.stringify({ postId: pid, choice }),
      prior.id,
    );
    return { ok: true };
  }
  createRecord(a, "vote", { postId: pid, choice }, !p.company);
  return { ok: true };
}
export function comment(
  a: Actor,
  pid: string,
  text: unknown,
  parentId?: string,
) {
  const p = post(a, pid);
  parentId = z.string().uuid().optional().parse(parentId);
  let parent = null;
  if (parentId) {
    parent = getRecord(a, parentId, "comment");
    check(parent.body.postId === pid, "Reply must belong to this thread");
    check(
      !parent.body.removed,
      "This comment was removed. Reply to the thread instead.",
    );
    // One reply level keeps long discussions readable on small screens.
    if (parent.body.parentId)
      parent = getRecord(a, parent.body.parentId, "comment");
    check(
      !parent.body.removed,
      "This comment was removed. Reply to the thread instead.",
    );
  }
  return createRecord(
    a,
    "comment",
    {
      postId: pid,
      author: a.name,
      parentId: parent?.id || null,
      text: z.string().trim().min(1).max(5000).parse(text),
    },
    !p.company,
  );
}
export function thread(a: Actor, pid: string) {
  const p = post(a, pid);
  const comments = listRecords(a, "comment")
    .filter((c) => c.body.postId === pid)
    .sort(
      (x, y) => x.created.localeCompare(y.created) || x.id.localeCompare(y.id),
    )
    .map((c) => ({
      ...c,
      canEdit: c.owner === a.user && !c.body.removed,
      canRemove: (c.owner === a.user || a.staff) && !c.body.removed,
      canRestore:
        !!c.body.removed &&
        (a.staff || (c.owner === a.user && !c.body.moderated)),
    }));
  return { post: p, comments };
}
export function changeComment(
  a: Actor,
  pid: string,
  cid: string,
  input: unknown,
) {
  post(a, pid);
  const c = getRecord(a, cid, "comment");
  check(c.body.postId === pid, "Comment not found in this thread", 404);
  const b = z
    .object({
      action: z.enum(["edit", "remove", "restore"]),
      expectedVersion: z.number().int().positive(),
      text: z.string().trim().min(1).max(5000).optional(),
    })
    .parse(input);
  check(c.owner === a.user || a.staff, "Author or moderator required", 403);
  let body = { ...c.body };
  if (b.action === "edit") {
    check(c.owner === a.user, "Only the author can edit comment text", 403);
    check(!body.removed && b.text, "Restore a removed comment before editing");
    body = { ...body, text: b.text, edited: true };
  } else if (b.action === "remove") {
    check(!body.removed, "Comment already removed", 409);
    body = {
      ...body,
      text: "",
      removed: true,
      moderated: a.staff && c.owner !== a.user,
    };
  } else {
    check(body.removed, "Comment is not removed", 409);
    check(
      !body.moderated || a.staff,
      "Only a moderator can restore this comment",
      403,
    );
    const prior = (
      db
        .prepare("SELECT body FROM versions WHERE record=? ORDER BY rev DESC")
        .all(cid) as any[]
    )
      .map((v) => json(v.body))
      .find((v) => !v.removed);
    check(prior, "Comment history unavailable", 404);
    body = { ...prior, removed: false, moderated: false };
  }
  const changed = updateRecord(a, cid, b.expectedVersion, body);
  audit(a, `comment.${b.action}`, cid);
  return changed;
}
export function removePost(a: Actor, pid: string) {
  const p = post(a, pid);
  check(a.staff || p.owner === a.user, "Author or moderator required", 403);
  db.prepare("UPDATE records SET body=?,updated=? WHERE id=?").run(
    JSON.stringify({ ...p.body, removed: true }),
    now(),
    p.id,
  );
  audit(a, "post.remove", p.id);
  return { ok: true };
}
const publicDir = () => {
  const p = resolve(DATA, "published");
  mkdirSync(p, { recursive: true });
  return p;
};
export function publish(a: Actor, input: unknown) {
  creator(a);
  const b = z
    .object({
      jobId: z.string(),
      title: z.string().trim().min(1).max(180),
      description: z.string().max(2000),
      confirmed: z.literal(true),
      industry: z.string().max(80).default("Home services"),
      platform: z.string().max(80).default("Unspecified"),
      style: z.string().max(80).default(""),
      sourceUrl: z
        .union([z.literal(""), z.url().refine((v) => /^https?:\/\//.test(v))])
        .default(""),
    })
    .parse(input);
  const j = job(a, b.jobId);
  check(j.status === "ready" && j.output?.file, "Choose a completed render");
  const path = safePath(a.company, j.output.file);
  check(existsSync(path), "Rendered file unavailable", 404);
  const ext = j.output.file.endsWith(".mp4") ? "mp4" : "png",
    publicFile = id() + "." + ext;
  copyFileSync(path, resolve(publicDir(), publicFile));
  const version = db
    .prepare("SELECT body FROM versions WHERE record=? AND rev=?")
    .get(j.payload.creativeId, j.payload.version) as any;
  check(version, "Rendered creative version unavailable", 404);
  const r = createRecord(
    a,
    "publication",
    {
      title: b.title,
      description: b.description,
      publicFile,
      mediaType: ext === "mp4" ? "video" : "image",
      evidence: "Curated reference",
      evidenceType: "curated",
      industry: b.industry,
      platform: b.platform,
      style: b.style,
      sourceUrl: b.sourceUrl,
      capturedAt: now(),
      usage:
        "Published derivative for study. Original files and source media are not licensed for reuse.",
      structure: publicStructure(json(version.body)),
      state: "published",
    },
    true,
  );
  audit(a, "publication.publish", r.id);
  return r;
}
export function publications(a: Actor) {
  return listRecords(a, "publication")
    .filter((r) => r.body.state === "published")
    .map((r) => ({
      ...r,
      owner: undefined,
      body: {
        title: r.body.title,
        description: r.body.description,
        mediaType: r.body.mediaType,
        evidence: r.body.evidence,
        evidenceType: r.body.evidenceType || "curated",
        industry: r.body.industry || "Unspecified",
        platform: r.body.platform || "Unspecified",
        style: r.body.style || "",
        sourceUrl: r.body.sourceUrl || "",
        capturedAt: r.body.capturedAt || r.created,
        usage: r.body.usage || "Published derivative for study only.",
        structure: r.body.structure || null,
      },
    }));
}
export function publicationFile(a: Actor, pid: string) {
  const p = getRecord(a, pid, "publication");
  check(p.body.state === "published", "Publication removed", 404);
  check(
    /^[a-f0-9-]+\.(png|mp4)$/.test(p.body.publicFile),
    "Invalid publication",
  );
  return resolve(publicDir(), p.body.publicFile);
}
export function remix(a: Actor, pid: string, campaignId: string) {
  const p = getRecord(a, pid, "publication");
  check(p.body.state === "published", "Publication removed", 404);
  return newCreative(a, {
    campaignId,
    kind: p.body.mediaType === "video" ? "video" : "static",
    reference: pid,
  });
}
export function registerCommunity(app: any, route: any) {
  app.get(
    "/api/feed",
    route((req: any, res: any) => res.json(posts(req.actor))),
  );
  app.post(
    "/api/feed",
    route((req: any, res: any) => res.json(writePost(req.actor, req.body))),
  );
  app.get(
    "/api/feed/:id",
    route((req: any, res: any) => res.json(thread(req.actor, req.params.id))),
  );
  app.post(
    "/api/feed/:id/comments",
    route((req: any, res: any) =>
      res.json(
        comment(req.actor, req.params.id, req.body.text, req.body.parentId),
      ),
    ),
  );
  app.patch(
    "/api/feed/:id/comments/:commentId",
    route((req: any, res: any) =>
      res.json(
        changeComment(req.actor, req.params.id, req.params.commentId, req.body),
      ),
    ),
  );
  app.post(
    "/api/feed/:id/react",
    route((req: any, res: any) => res.json(react(req.actor, req.params.id))),
  );
  app.post(
    "/api/feed/:id/vote",
    route((req: any, res: any) =>
      res.json(vote(req.actor, req.params.id, req.body.choice)),
    ),
  );
  app.post(
    "/api/feed/:id/report",
    route((req: any, res: any) => {
      post(req.actor, req.params.id);
      res.json(
        createRecord(req.actor, "moderation-report", { postId: req.params.id }),
      );
    }),
  );
  app.delete(
    "/api/feed/:id",
    route((req: any, res: any) =>
      res.json(removePost(req.actor, req.params.id)),
    ),
  );
  app.post(
    "/api/drafts",
    route((req: any, res: any) => {
      const body = z
        .object({
          type: z.literal("feed"),
          title: z.string().max(180),
          text: z.string().max(10000),
        })
        .parse(req.body.body);
      if (req.body.id) getRecord(req.actor, req.body.id, "draft");
      res.json(
        req.body.id
          ? updateRecord(req.actor, req.body.id, req.body.expectedVersion, body)
          : createRecord(req.actor, "draft", body),
      );
    }),
  );
  app.delete(
    "/api/drafts/:id",
    route((req: any, res: any) => {
      getRecord(req.actor, req.params.id, "draft");
      db.prepare("DELETE FROM versions WHERE record=?").run(req.params.id);
      db.prepare("DELETE FROM records WHERE id=?").run(req.params.id);
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/publications",
    route((req: any, res: any) => res.json(publications(req.actor))),
  );
  app.post(
    "/api/publications",
    route((req: any, res: any) => res.json(publish(req.actor, req.body))),
  );
  app.get(
    "/api/publications/:id/media",
    route(async (req: any, res: any) => {
      const path = publicationFile(req.actor, req.params.id);
      await ensureLocalFile(path);
      res.sendFile(path, { dotfiles: "allow" });
    }),
  );
  app.post(
    "/api/publications/:id/remix",
    route((req: any, res: any) =>
      res.json(remix(req.actor, req.params.id, req.body.campaignId)),
    ),
  );
  app.delete(
    "/api/publications/:id",
    route((req: any, res: any) => {
      const p = getRecord(req.actor, req.params.id, "publication");
      check(
        req.actor.staff || p.owner === req.actor.user,
        "Author or staff required",
        403,
      );
      db.prepare("UPDATE records SET body=? WHERE id=?").run(
        JSON.stringify({ ...p.body, state: "removed" }),
        p.id,
      );
      audit(req.actor, "publication.remove", p.id);
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/playback",
    route((req: any, res: any) => {
      const kind = z
          .enum(["lesson", "recording"])
          .parse(req.body.kind || "lesson"),
        contentId = z.string().parse(req.body.contentId || req.body.lessonId),
        content = getRecord(req.actor, contentId, kind),
        seconds = z
          .number()
          .finite()
          .min(0)
          .max(100000)
          .parse(req.body.seconds);
      const prior = listRecords(req.actor, "playback").find(
        (r) => (r.body.contentId || r.body.lessonId) === content.id,
      );
      res.json(
        prior
          ? updateRecord(req.actor, prior.id, prior.rev, {
              contentId: content.id,
              kind,
              seconds,
            })
          : createRecord(req.actor, "playback", {
              contentId: content.id,
              kind,
              seconds,
            }),
      );
    }),
  );
  app.get(
    "/api/operator",
    route((req: any, res: any) => {
      check(req.actor.staff, "Platform staff access required", 403);
      audit(req.actor, "operator.inspect", "health");
      res.json({
        companies: db.prepare("SELECT id,name,active FROM companies").all(),
        failures: db
          .prepare(
            "SELECT id,kind,error FROM jobs WHERE company=? AND status IN ('failed','partial')",
          )
          .all(req.actor.company),
        reports: (
          db
            .prepare("SELECT * FROM records WHERE kind='moderation-report'")
            .all() as any[]
        ).map((r) => ({ ...r, body: json(r.body) })),
      });
    }),
  );
}
