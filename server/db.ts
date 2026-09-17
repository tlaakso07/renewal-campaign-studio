import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
export const ROOT = resolve(import.meta.dirname, "..");
export const DATA = resolve(process.env.DATA_DIR || resolve(ROOT, ".runtime"));
mkdirSync(DATA, { recursive: true });
export let db = new DatabaseSync(resolve(DATA, "studio.sqlite"));
db.exec(
  "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
);
// Hosted review uses an authoritative private snapshot. The local database is
// only a request working copy; a failed conditional commit never acknowledges a save.
export function replaceDatabase(bytes: Buffer) {
  db.close();
  for (const suffix of ["-wal", "-shm"])
    rmSync(resolve(DATA, "studio.sqlite" + suffix), { force: true });
  writeFileSync(resolve(DATA, "studio.sqlite"), bytes, { mode: 0o600 });
  db = new DatabaseSync(resolve(DATA, "studio.sqlite"));
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
}
export function migrate() {
  db.exec(`
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY, name TEXT NOT NULL, theme TEXT NOT NULL, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT, staff INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS memberships(company TEXT REFERENCES companies(id), user TEXT REFERENCES users(id), role TEXT NOT NULL, revoked INTEGER DEFAULT 0, PRIMARY KEY(company,user));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT REFERENCES users(id),company TEXT REFERENCES companies(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,company TEXT REFERENCES companies(id),kind TEXT NOT NULL,owner TEXT,rev INTEGER NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL,updated TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS records_scope ON records(company,kind);
CREATE TABLE IF NOT EXISTS versions(record TEXT REFERENCES records(id),rev INTEGER,body TEXT NOT NULL,created TEXT NOT NULL,PRIMARY KEY(record,rev));
CREATE TABLE IF NOT EXISTS assets(id TEXT, company TEXT REFERENCES companies(id),source_id TEXT,name TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,source_url TEXT,collection TEXT,checksum TEXT,path TEXT,preview TEXT,bytes INTEGER,metadata TEXT NOT NULL DEFAULT '{}',error TEXT,PRIMARY KEY(company,id),UNIQUE(company,source_id));
CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,company TEXT REFERENCES companies(id),user TEXT REFERENCES users(id),kind TEXT NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL,idempotency TEXT NOT NULL,attempt INTEGER DEFAULT 0,progress TEXT NOT NULL DEFAULT '{}',error TEXT,output TEXT,created TEXT NOT NULL,updated TEXT NOT NULL,UNIQUE(company,idempotency));
CREATE TABLE IF NOT EXISTS usage(id TEXT PRIMARY KEY,company TEXT,job TEXT UNIQUE REFERENCES jobs(id),reserved INTEGER NOT NULL,actual INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS facts(company TEXT NOT NULL,identity TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(company,identity));
CREATE TABLE IF NOT EXISTS crm(company TEXT NOT NULL,identity TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(company,identity));
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,company TEXT,user TEXT,action TEXT,target TEXT,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS worker_health(id TEXT PRIMARY KEY,heartbeat TEXT NOT NULL);
INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));
`);
}
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export const hash = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
export const json = <T = any>(s: string): T => JSON.parse(s);
export function tx<T>(f: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = f();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function check(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new AppError(status, message);
}
export interface Actor {
  user: string;
  company: string;
  role: string;
  staff: boolean;
  name: string;
}
export function audit(a: Actor, action: string, target: string) {
  db.prepare("INSERT INTO audit VALUES(?,?,?,?,?,?)").run(
    id(),
    a.company,
    a.user,
    action,
    target,
    now(),
  );
}
export function creator(a: Actor) {
  check(["owner", "creator"].includes(a.role), "Creator access required", 403);
}
export function owner(a: Actor) {
  check(a.role === "owner", "Owner access required", 403);
}
export function getRecord(a: Actor, rid: string, kind?: string) {
  const r = db
    .prepare(
      "SELECT * FROM records WHERE id=? AND (company=? OR company IS NULL)",
    )
    .get(rid, a.company) as any;
  check(r && (!kind || r.kind === kind), "Record not found", 404);
  if (r.company === null)
    check(
      [
        "lesson",
        "recording",
        "post",
        "comment",
        "reaction",
        "vote",
        "publication",
        "template",
        "community-profile",
        "community-event",
        "community-media",
      ].includes(r.kind),
      "Record not found",
      404,
    );
  if (r.kind === "invite") owner(a);
  if (r.kind === "lesson" || r.kind === "recording")
    check(
      json(r.body).state === "published" ||
        a.staff ||
        (r.company === a.company && a.role === "owner"),
      "Lesson not found",
      404,
    );
  if (
    [
      "conversation",
      "memory",
      "draft",
      "playback",
      "bookmark",
      "collection",
      "community-follow",
      "community-notification",
      "community-notification-preference",
    ].includes(r.kind)
  )
    check(r.owner === a.user, "Record not found", 404);
  const body = json(r.body);
  if (r.kind === "comment") {
    const parent = getRecord(a, body.postId, "post");
    check(!parent.body.removed, "Post removed", 404);
  }
  if (r.kind === "post" && body.removed)
    check(a.staff || r.owner === a.user, "Post removed", 404);
  return { ...r, body };
}
export function listRecords(a: Actor, kind: string) {
  return (
    db
      .prepare(
        "SELECT * FROM records WHERE kind=? AND (company=? OR company IS NULL) ORDER BY updated DESC",
      )
      .all(kind, a.company) as any[]
  )
    .filter(
      (r) =>
        ![
          "conversation",
          "memory",
          "draft",
          "playback",
          "bookmark",
          "collection",
          "community-follow",
          "community-notification",
          "community-notification-preference",
        ].includes(kind) || r.owner === a.user,
    )
    .map((r) => ({ ...r, body: json(r.body) }))
    .filter(
      (r) =>
        !["lesson", "recording"].includes(kind) ||
        r.body.state === "published" ||
        a.staff,
    );
}
export function createRecord(
  a: Actor,
  kind: string,
  body: unknown,
  shared = false,
) {
  creator(a);
  const rid = id(),
    t = now();
  db.prepare("INSERT INTO records VALUES(?,?,?,?,?,?,?,?)").run(
    rid,
    shared ? null : a.company,
    kind,
    a.user,
    1,
    JSON.stringify(body),
    t,
    t,
  );
  db.prepare("INSERT INTO versions VALUES(?,?,?,?)").run(
    rid,
    1,
    JSON.stringify(body),
    t,
  );
  audit(a, `${kind}.create`, rid);
  return getRecord(a, rid);
}
export function updateRecord(
  a: Actor,
  rid: string,
  expected: number,
  body: unknown,
) {
  creator(a);
  return tx(() => {
    const r = getRecord(a, rid);
    check(
      r.company === a.company ||
        a.staff ||
        (!r.company &&
          ["post", "comment", "community-profile"].includes(r.kind) &&
          r.owner === a.user),
      "Cannot edit shared content",
      403,
    );
    check(
      r.rev === expected,
      "This record changed. Reload the latest version before saving.",
      409,
    );
    const rev = r.rev + 1;
    db.prepare("UPDATE records SET body=?,rev=?,updated=? WHERE id=?").run(
      JSON.stringify(body),
      rev,
      now(),
      rid,
    );
    db.prepare("INSERT INTO versions VALUES(?,?,?,?)").run(
      rid,
      rev,
      JSON.stringify(body),
      now(),
    );
    audit(a, `${r.kind}.update`, rid);
    return getRecord(a, rid);
  });
}
export function getAsset(a: Actor, aid: string) {
  const r = db
    .prepare("SELECT * FROM assets WHERE company=? AND id=?")
    .get(a.company, aid) as any;
  check(r, "Asset not found", 404);
  return { ...r, metadata: json(r.metadata) };
}
export function brand(a: Actor) {
  return listRecords(a, "brand")[0];
}
export function readPackage(path: string) {
  return json(readFileSync(resolve(ROOT, path), "utf8"));
}
