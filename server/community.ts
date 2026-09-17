import { ensureLocalFile } from "./storage.ts";
import { z } from "zod";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import sharp from "sharp";
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
  getAsset,
  listRecords,
  updateRecord,
  audit,
  json,
  tx,
} from "./db.ts";
import { job, newCreative } from "./services.ts";
import { safePath } from "./assets.ts";
import { publicStructure } from "./discovery.ts";

const exec = promisify(execFile);

const handlePattern = /^[a-z0-9][a-z0-9_-]{1,29}$/;
const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(handlePattern, "Use 2–30 lowercase letters, numbers, dashes or underscores"),
  headline: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(1000).default(""),
  interests: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  listed: z.boolean().default(false),
  presence: z.enum(["available", "away", "hidden"]).default("hidden"),
});
const eventSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(3000),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  host: z.string().trim().min(1).max(120),
  joinUrl: z
    .union([z.literal(""), z.url().refine((url) => /^https:\/\//.test(url))])
    .default(""),
  audience: z.enum(["shared", "company"]),
  state: z.enum(["draft", "published", "canceled"]),
});

function rawRecords(kind: string) {
  return (db.prepare("SELECT * FROM records WHERE kind=?").all(kind) as any[]).map(
    (record) => ({ ...record, body: json(record.body) }),
  );
}

function companyName(company: string) {
  return (
    (db.prepare("SELECT name FROM companies WHERE id=?").get(company) as any)
      ?.name || "Company member"
  );
}

function publicProfile(record: any) {
  const sharedPosts = rawRecords("post").filter(
      (post) => !post.company && post.owner === record.owner && !post.body.removed,
    ).length,
    sharedComments = rawRecords("comment").filter(
      (comment) =>
        !comment.company && comment.owner === record.owner && !comment.body.removed,
    ).length,
    publishedAds = rawRecords("publication").filter(
      (publication) =>
        publication.owner === record.owner &&
        publication.body.state === "published",
    ).length;
  return {
    id: record.id,
    created: record.created,
    updated: record.updated,
    owner: record.owner,
    body: {
      displayName: record.body.displayName,
      handle: record.body.handle,
      headline: record.body.headline,
      bio: record.body.bio,
      interests: record.body.interests,
      presence: record.body.presence,
      listed: record.body.listed,
      companyName: record.body.companyName,
      contributions: {
        posts: sharedPosts,
        comments: sharedComments,
        publishedAds,
        score: sharedPosts * 3 + sharedComments + publishedAds * 5,
      },
    },
  };
}

export function communityProfile(a: Actor) {
  return (
    rawRecords("community-profile").find((profile) => profile.owner === a.user) ||
    null
  );
}

export function saveCommunityProfile(a: Actor, input: unknown) {
  creator(a);
  const parsed = profileSchema
      .extend({ expectedVersion: z.number().int().positive().optional() })
      .parse(input),
    { expectedVersion, ...body } = parsed,
    existing = communityProfile(a),
    duplicate = rawRecords("community-profile").find(
      (profile) =>
        profile.owner !== a.user && profile.body.handle === body.handle,
    );
  check(!duplicate, "That community handle is already in use", 409);
  if (existing)
    check(
      expectedVersion === existing.rev,
      "This profile changed. Reload before saving.",
      409,
    );
  const saved = existing
    ? updateRecord(a, existing.id, expectedVersion!, {
        ...body,
        companyName: companyName(a.company),
        homeCompany: a.company,
      })
    : createRecord(
        a,
        "community-profile",
        {
          ...body,
          companyName: companyName(a.company),
          homeCompany: a.company,
        },
        true,
      );
  return { ...saved, body: { ...saved.body, homeCompany: undefined } };
}

export function communityDirectory(a: Actor) {
  return rawRecords("community-profile")
    .filter((profile) => profile.body.listed || profile.owner === a.user)
    .map(publicProfile)
    .sort(
      (left, right) =>
        right.body.contributions.score - left.body.contributions.score ||
        left.body.displayName.localeCompare(right.body.displayName),
    );
}

function postAttachment(
  a: Actor,
  publicationId?: string | null,
  communityMediaId?: string | null,
) {
  check(
    !(publicationId && communityMediaId),
    "Choose one community attachment",
  );
  if (communityMediaId) {
    const media = getRecord(a, communityMediaId, "community-media");
    check(media.body.state === "published", "Attachment is unavailable", 404);
    return {
      communityMediaId: media.id,
      title: media.body.alt || "Community media",
      mediaType: media.body.mediaType,
      mediaUrl: `/api/community/media/${media.id}/file`,
      note: "Member-uploaded community derivative",
    };
  }
  if (!publicationId) return null;
  const publication = getRecord(a, publicationId, "publication");
  check(publication.body.state === "published", "Attachment is not published", 404);
  return {
    publicationId: publication.id,
    title: publication.body.title,
    mediaType: publication.body.mediaType,
    href: `#/shared?reference=${publication.id}`,
    mediaUrl: `/api/publications/${publication.id}/media`,
    note: "Explicitly published community derivative",
  };
}

export async function createCommunityMedia(a: Actor, input: unknown) {
  creator(a);
  const parsed = z
      .object({
        assetId: z.string().min(1),
        audience: z.enum(["company", "shared"]),
        alt: z.string().trim().min(1).max(300),
      })
      .parse(input),
    asset = getAsset(a, parsed.assetId);
  check(["image", "video"].includes(asset.kind), "Attach an image or video");
  check(asset.path, "Uploaded media is unavailable", 404);
  if (asset.kind === "video")
    check(
      Number(asset.metadata.duration) <= 60,
      "Community videos must be 60 seconds or shorter",
    );
  const source = safePath(a.company, asset.path);
  await ensureLocalFile(source);
  const extension = asset.kind === "video" ? "mp4" : "png",
    publicFile = `${id()}.${extension}`,
    destination = resolve(publicDir(), publicFile),
    partial = destination + (asset.kind === "video" ? ".partial.mp4" : ".partial");
  try {
    if (asset.kind === "image")
      await sharp(source, { limitInputPixels: 100_000_000 })
        .rotate()
        .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(partial);
    else
      await exec(
        process.env.FFMPEG_PATH || "ffmpeg",
        [
          "-y",
          "-v",
          "error",
          "-i",
          source,
          "-t",
          "60",
          "-vf",
          "scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease,setsar=1",
          "-map_metadata",
          "-1",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-ac",
          "2",
          "-ar",
          "48000",
          "-movflags",
          "+faststart",
          partial,
        ],
        { timeout: 180000, maxBuffer: 2 * 1024 * 1024 },
      );
    renameSync(partial, destination);
  } catch (error) {
    rmSync(partial, { force: true });
    throw error;
  }
  const media = createRecord(
    a,
    "community-media",
    {
      publicFile,
      mediaType: asset.kind,
      alt: parsed.alt,
      state: "published",
    },
    parsed.audience === "shared",
  );
  audit(a, "community-media.publish", media.id);
  return media;
}

export function communityMediaFile(a: Actor, mediaId: string) {
  const media = getRecord(a, mediaId, "community-media");
  check(media.body.state === "published", "Attachment is unavailable", 404);
  check(
    /^[a-f0-9-]+\.(png|mp4)$/.test(media.body.publicFile),
    "Invalid community media",
  );
  return resolve(publicDir(), media.body.publicFile);
}

function notificationPreference(user: string, company: string) {
  const record = rawRecords("community-notification-preference").find(
    (item) => item.owner === user && item.company === company,
  );
  return {
    follows: record?.body.follows ?? true,
    mentions: record?.body.mentions ?? true,
    events: record?.body.events ?? false,
  };
}

function createOwnedRecord(
  actor: Actor,
  company: string,
  user: string,
  kind: string,
  body: any,
) {
  const duplicate = rawRecords(kind).find(
    (record) =>
      record.company === company &&
      record.owner === user &&
      record.body.dedupeKey &&
      record.body.dedupeKey === body.dedupeKey,
  );
  if (duplicate) return duplicate;
  const recordId = id(),
    created = now();
  db.prepare("INSERT INTO records VALUES(?,?,?,?,?,?,?,?)").run(
    recordId,
    company,
    kind,
    user,
    1,
    JSON.stringify(body),
    created,
    created,
  );
  db.prepare("INSERT INTO versions VALUES(?,?,?,?)").run(
    recordId,
    1,
    JSON.stringify(body),
    created,
  );
  audit(actor, `${kind}.emit`, recordId);
  return { id: recordId, company, kind, owner: user, rev: 1, body, created, updated: created };
}

function notifyDiscussion(
  a: Actor,
  postRecord: any,
  sourceId: string,
  text: string,
) {
  const recipients = new Map<string, { company: string; user: string; kind: string }>();
  for (const follow of rawRecords("community-follow").filter(
    (record) => record.body.postId === postRecord.id && record.owner !== a.user,
  )) {
    if (notificationPreference(follow.owner, follow.company).follows)
      recipients.set(`${follow.company}:${follow.owner}:follow`, {
        company: follow.company,
        user: follow.owner,
        kind: "follow",
      });
  }
  const handles = new Set(
    [...text.matchAll(/(?:^|\s)@([a-z0-9][a-z0-9_-]{1,29})\b/gi)].map((match) =>
      match[1].toLowerCase(),
    ),
  );
  for (const profile of rawRecords("community-profile").filter(
    (record) => record.body.listed && handles.has(record.body.handle),
  )) {
    if (
      profile.owner !== a.user &&
      notificationPreference(profile.owner, profile.body.homeCompany).mentions
    )
      recipients.set(`${profile.body.homeCompany}:${profile.owner}:mention`, {
        company: profile.body.homeCompany,
        user: profile.owner,
        kind: "mention",
      });
  }
  for (const recipient of recipients.values())
    createOwnedRecord(a, recipient.company, recipient.user, "community-notification", {
      kind: recipient.kind,
      postId: postRecord.id,
      sourceId,
      message:
        recipient.kind === "mention"
          ? `${a.name} mentioned you in “${postRecord.body.title}”.`
          : `${a.name} added to “${postRecord.body.title}”.`,
      read: false,
      dedupeKey: `${recipient.kind}:${sourceId}:${recipient.user}`,
    });
}
export function posts(a: Actor) {
  return listRecords(a, "post")
    .filter((p) => !p.body.removed || p.owner === a.user || a.staff)
    .map((p) => ({
      ...p,
      attachment: p.body.removed
        ? null
        : postAttachment(
            a,
            p.body.publicationId,
            p.body.communityMediaId,
          ),
      canEdit: p.owner === a.user && !p.body.removed,
      canRemove: (p.owner === a.user || a.staff) && !p.body.removed,
      canRestore:
        !!p.body.removed &&
        (a.staff || (p.owner === a.user && !p.body.moderated)),
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
      publicationId: z.string().uuid().nullable().optional(),
      communityMediaId: z.string().uuid().nullable().optional(),
    })
    .parse(input);
  check(
    !b.options.length ||
      (b.options.length >= 2 && new Set(b.options).size === b.options.length),
    "Poll needs at least two distinct choices",
  );
  postAttachment(a, b.publicationId, b.communityMediaId);
  if (b.communityMediaId && b.audience === "shared")
    check(
      !getRecord(a, b.communityMediaId, "community-media").company,
      "Shared posts need shared community media",
    );
  const created = createRecord(
    a,
    "post",
    {
      ...b,
      publicationId: b.publicationId || null,
      communityMediaId: b.communityMediaId || null,
      author: a.name,
      authorId: a.user,
      authorCompany: b.audience === "shared" ? companyName(a.company) : "",
    },
    b.audience === "shared",
  );
  createRecord(a, "community-follow", { postId: created.id });
  notifyDiscussion(a, created, created.id, b.text);
  return created;
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
  publicationId?: string | null,
  communityMediaId?: string | null,
) {
  const p = post(a, pid);
  parentId = z.string().uuid().optional().parse(parentId);
  publicationId = z.string().uuid().nullable().optional().parse(publicationId);
  communityMediaId = z
    .string()
    .uuid()
    .nullable()
    .optional()
    .parse(communityMediaId);
  postAttachment(a, publicationId, communityMediaId);
  if (communityMediaId && !p.company)
    check(
      !getRecord(a, communityMediaId, "community-media").company,
      "Shared comments need shared community media",
    );
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
  const created = createRecord(
    a,
    "comment",
    {
      postId: pid,
      author: a.name,
      parentId: parent?.id || null,
      text: z.string().trim().min(1).max(5000).parse(text),
      publicationId: publicationId || null,
      communityMediaId: communityMediaId || null,
    },
    !p.company,
  );
  notifyDiscussion(a, p, created.id, created.body.text);
  return created;
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
      attachment: postAttachment(
        a,
        c.body.publicationId,
        c.body.communityMediaId,
      ),
      canEdit: c.owner === a.user && !c.body.removed,
      canRemove: (c.owner === a.user || a.staff) && !c.body.removed,
      canRestore:
        !!c.body.removed &&
        (a.staff || (c.owner === a.user && !c.body.moderated)),
    }));
  return {
    post: {
      ...p,
      attachment: postAttachment(
        a,
        p.body.publicationId,
        p.body.communityMediaId,
      ),
    },
    comments,
    following: listRecords(a, "community-follow").some(
      (record) => record.body.postId === pid,
    ),
  };
}

export function toggleFollow(a: Actor, pid: string) {
  post(a, pid);
  const prior = listRecords(a, "community-follow").find(
    (record) => record.body.postId === pid,
  );
  if (prior) {
    db.prepare("DELETE FROM versions WHERE record=?").run(prior.id);
    db.prepare("DELETE FROM records WHERE id=?").run(prior.id);
    audit(a, "community-follow.remove", pid);
    return { following: false };
  }
  createRecord(a, "community-follow", { postId: pid });
  return { following: true };
}

export function communityNotifications(a: Actor) {
  return listRecords(a, "community-notification");
}

export function readCommunityNotification(a: Actor, notificationId: string) {
  const notification = getRecord(
    a,
    notificationId,
    "community-notification",
  );
  return updateRecord(a, notification.id, notification.rev, {
    ...notification.body,
    read: true,
  });
}

export function communityNotificationPreference(a: Actor) {
  const current = listRecords(a, "community-notification-preference")[0];
  return current
    ? { ...current, body: notificationPreference(a.user, a.company) }
    : { id: null, rev: 0, body: notificationPreference(a.user, a.company) };
}

export function saveCommunityNotificationPreference(a: Actor, input: unknown) {
  const body = z
      .object({
        follows: z.boolean(),
        mentions: z.boolean(),
        events: z.boolean(),
      })
      .parse(input),
    current = listRecords(a, "community-notification-preference")[0];
  return current
    ? updateRecord(a, current.id, current.rev, body)
    : createRecord(a, "community-notification-preference", body);
}

export function changePost(a: Actor, pid: string, input: unknown) {
  const current = getRecord(a, pid, "post"),
    parsed = z
      .object({
        action: z.enum(["edit", "remove", "restore"]),
        expectedVersion: z.number().int().positive(),
        title: z.string().trim().min(1).max(180).optional(),
        text: z.string().trim().min(1).max(10000).optional(),
        category: z.string().trim().min(1).max(60).optional(),
        publicationId: z.string().uuid().nullable().optional(),
        communityMediaId: z.string().uuid().nullable().optional(),
      })
      .parse(input);
  check(current.owner === a.user || a.staff, "Author or moderator required", 403);
  let body = { ...current.body };
  if (parsed.action === "edit") {
    check(current.owner === a.user, "Only the author can edit post text", 403);
    check(!body.removed, "Restore a removed post before editing");
    check(parsed.title && parsed.text && parsed.category, "Post fields are required");
    postAttachment(a, parsed.publicationId, parsed.communityMediaId);
    if (parsed.communityMediaId && !current.company)
      check(
        !getRecord(a, parsed.communityMediaId, "community-media").company,
        "Shared posts need shared community media",
      );
    body = {
      ...body,
      title: parsed.title,
      text: parsed.text,
      category: parsed.category,
      publicationId: parsed.publicationId || null,
      communityMediaId: parsed.communityMediaId || null,
      edited: true,
    };
  } else if (parsed.action === "remove") {
    check(!body.removed, "Post already removed", 409);
    body = {
      ...body,
      removed: true,
      moderated: a.staff && current.owner !== a.user,
    };
  } else {
    check(body.removed, "Post is not removed", 409);
    check(!body.moderated || a.staff, "Only a moderator can restore this post", 403);
    body = { ...body, removed: false, moderated: false };
  }
  const changed = updateRecord(a, current.id, parsed.expectedVersion, body);
  audit(a, `post.${parsed.action}`, current.id);
  return changed;
}

export function reportPost(a: Actor, pid: string, input: unknown = {}) {
  post(a, pid);
  const body = z
    .object({
      reason: z
        .enum(["spam", "privacy", "harassment", "misleading", "other"])
        .default("other"),
      details: z.string().trim().max(1000).default(""),
    })
    .parse(input);
  const existing = listRecords(a, "moderation-report").find(
    (report) =>
      report.owner === a.user &&
      report.body.postId === pid &&
      report.body.state === "open",
  );
  check(!existing, "You already reported this post", 409);
  return createRecord(a, "moderation-report", {
    postId: pid,
    ...body,
    state: "open",
  });
}

export function resolveModerationReport(
  a: Actor,
  reportId: string,
  input: unknown,
) {
  check(a.staff, "Platform staff access required", 403);
  const action = z.enum(["dismiss", "remove"]).parse((input as any)?.action),
    report = rawRecords("moderation-report").find(
      (record) => record.id === reportId,
    );
  check(report && report.body.state === "open", "Open report not found", 404);
  return tx(() => {
    if (action === "remove") {
      const target = rawRecords("post").find(
        (record) => record.id === report.body.postId,
      );
      check(target, "Reported post not found", 404);
      if (!target.body.removed) {
        const targetBody = { ...target.body, removed: true, moderated: true },
          targetRev = target.rev + 1,
          changedAt = now();
        db.prepare("UPDATE records SET body=?,rev=?,updated=? WHERE id=?").run(
          JSON.stringify(targetBody),
          targetRev,
          changedAt,
          target.id,
        );
        db.prepare("INSERT INTO versions VALUES(?,?,?,?)").run(
          target.id,
          targetRev,
          JSON.stringify(targetBody),
          changedAt,
        );
        audit(a, "post.remove", target.id);
      }
    }
    const reportBody = {
        ...report.body,
        state: action === "remove" ? "actioned" : "dismissed",
        resolvedBy: a.user,
        resolvedAt: now(),
      },
      reportRev = report.rev + 1;
    db.prepare("UPDATE records SET body=?,rev=?,updated=? WHERE id=?").run(
      JSON.stringify(reportBody),
      reportRev,
      reportBody.resolvedAt,
      report.id,
    );
    db.prepare("INSERT INTO versions VALUES(?,?,?,?)").run(
      report.id,
      reportRev,
      JSON.stringify(reportBody),
      reportBody.resolvedAt,
    );
    audit(a, `moderation-report.${action}`, report.id);
    return { ...report, rev: reportRev, body: reportBody };
  });
}

export function communityEvents(a: Actor, includeUnpublished = false) {
  return listRecords(a, "community-event")
    .filter(
      (event) =>
        (includeUnpublished && a.staff) || event.body.state === "published",
    )
    .sort((left, right) => left.body.startsAt.localeCompare(right.body.startsAt));
}

function notifyEvent(a: Actor, event: any) {
  for (const preference of rawRecords("community-notification-preference").filter(
    (record) =>
      record.body.events &&
      (!event.company || record.company === event.company),
  ))
    createOwnedRecord(
      a,
      preference.company,
      preference.owner,
      "community-notification",
      {
        kind: "event",
        eventId: event.id,
        sourceId: `${event.id}:${event.rev}`,
        message: `Community event published: “${event.body.title}”.`,
        read: false,
        dedupeKey: `event:${event.id}:${event.rev}:${preference.owner}`,
      },
    );
}

export function saveCommunityEvent(a: Actor, input: unknown, eventId?: string) {
  check(a.staff, "Platform staff access required", 403);
  const body = eventSchema.parse(input);
  check(
    new Date(body.endsAt).getTime() > new Date(body.startsAt).getTime(),
    "Event end must be after its start",
  );
  if (eventId) {
    const existing = getRecord(a, eventId, "community-event");
    check(
      (existing.company === null) === (body.audience === "shared"),
      "Create a new event to change its audience",
    );
    const changed = updateRecord(a, existing.id, existing.rev, body);
    if (body.state === "published") notifyEvent(a, changed);
    return changed;
  }
  const created = createRecord(
    a,
    "community-event",
    body,
    body.audience === "shared",
  );
  if (body.state === "published") notifyEvent(a, created);
  return created;
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
  const p = getRecord(a, pid, "post");
  return changePost(a, pid, {
    action: "remove",
    expectedVersion: p.rev,
  });
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
  app.patch(
    "/api/feed/:id",
    route((req: any, res: any) =>
      res.json(changePost(req.actor, req.params.id, req.body)),
    ),
  );
  app.post(
    "/api/feed/:id/comments",
    route((req: any, res: any) =>
      res.json(
        comment(
          req.actor,
          req.params.id,
          req.body.text,
          req.body.parentId,
          req.body.publicationId,
          req.body.communityMediaId,
        ),
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
    "/api/feed/:id/follow",
    route((req: any, res: any) =>
      res.json(toggleFollow(req.actor, req.params.id)),
    ),
  );
  app.post(
    "/api/feed/:id/report",
    route((req: any, res: any) =>
      res.json(reportPost(req.actor, req.params.id, req.body)),
    ),
  );
  app.delete(
    "/api/feed/:id",
    route((req: any, res: any) =>
      res.json(removePost(req.actor, req.params.id)),
    ),
  );
  app.patch(
    "/api/community/moderation/:id",
    route((req: any, res: any) =>
      res.json(resolveModerationReport(req.actor, req.params.id, req.body)),
    ),
  );
  app.post(
    "/api/community/media",
    route(async (req: any, res: any) =>
      res.json(await createCommunityMedia(req.actor, req.body)),
    ),
  );
  app.get(
    "/api/community/media/:id/file",
    route(async (req: any, res: any) => {
      const path = communityMediaFile(req.actor, req.params.id);
      await ensureLocalFile(path);
      res.sendFile(path, { dotfiles: "allow" });
    }),
  );
  app.get(
    "/api/community/profile",
    route((req: any, res: any) => {
      const profile = communityProfile(req.actor);
      res.json(
        profile
          ? { ...profile, body: { ...profile.body, homeCompany: undefined } }
          : null,
      );
    }),
  );
  app.put(
    "/api/community/profile",
    route((req: any, res: any) =>
      res.json(saveCommunityProfile(req.actor, req.body)),
    ),
  );
  app.get(
    "/api/community/members",
    route((req: any, res: any) => res.json(communityDirectory(req.actor))),
  );
  app.get(
    "/api/community/events",
    route((req: any, res: any) =>
      res.json(
        communityEvents(req.actor, req.query.manage === "1"),
      ),
    ),
  );
  app.post(
    "/api/community/events",
    route((req: any, res: any) =>
      res.json(saveCommunityEvent(req.actor, req.body)),
    ),
  );
  app.put(
    "/api/community/events/:id",
    route((req: any, res: any) =>
      res.json(saveCommunityEvent(req.actor, req.body, req.params.id)),
    ),
  );
  app.get(
    "/api/community/notifications",
    route((req: any, res: any) =>
      res.json(communityNotifications(req.actor)),
    ),
  );
  app.patch(
    "/api/community/notifications/:id/read",
    route((req: any, res: any) =>
      res.json(readCommunityNotification(req.actor, req.params.id)),
    ),
  );
  app.get(
    "/api/community/notifications/preferences",
    route((req: any, res: any) =>
      res.json(communityNotificationPreference(req.actor)),
    ),
  );
  app.put(
    "/api/community/notifications/preferences",
    route((req: any, res: any) =>
      res.json(saveCommunityNotificationPreference(req.actor, req.body)),
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
        )
          .map((r) => ({ ...r, body: json(r.body) }))
          .filter((r) => r.body.state === "open"),
      });
    }),
  );
}
