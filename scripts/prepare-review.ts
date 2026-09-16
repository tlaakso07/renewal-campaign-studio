import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

// Build a separate review copy. Never mutate the local workspace or copy logins.
const source = resolve(process.argv[2] || ".runtime");
const destination = resolve(process.argv[3] || ".runtime/hosted-review");
if (source === destination || existsSync(destination)) throw new Error("Use a new review directory");
mkdirSync(destination, { recursive: true, mode: 0o700 });
const original = new DatabaseSync(resolve(source, "studio.sqlite"), { readOnly: true });
await backup(original, resolve(destination, "studio.sqlite"));
original.close();
const review = new DatabaseSync(resolve(destination, "studio.sqlite"));
review.exec(`
  PRAGMA foreign_keys=ON;
  DELETE FROM sessions;
  DELETE FROM versions WHERE record IN (SELECT id FROM records WHERE
    (company IS NOT NULL AND company<>'renewal') OR kind NOT IN ('brand','campaign','creative','entitlements','lesson'));
  DELETE FROM records WHERE (company IS NOT NULL AND company<>'renewal')
    OR kind NOT IN ('brand','campaign','creative','entitlements','lesson');
  DELETE FROM usage WHERE job IN (SELECT id FROM jobs WHERE company<>'renewal' OR status<>'ready');
  DELETE FROM jobs WHERE company<>'renewal' OR status<>'ready';
  DELETE FROM assets WHERE company<>'renewal';
  DELETE FROM facts; DELETE FROM crm; DELETE FROM audit; DELETE FROM worker_health;
  INSERT INTO users(id,name,email,staff) VALUES('review-creator','Ryan · Private review','review@example.invalid',0);
  UPDATE records SET owner='review-creator' WHERE owner IS NOT NULL;
  UPDATE jobs SET user='review-creator';
  DELETE FROM memberships;
  DELETE FROM users WHERE id<>'review-creator';
  DELETE FROM companies WHERE id<>'renewal';
  INSERT INTO memberships(company,user,role,revoked) VALUES('renewal','review-creator','creator',0);
  PRAGMA wal_checkpoint(TRUNCATE);
`);
if ((review.prepare("PRAGMA integrity_check").get() as any).integrity_check !== "ok") throw new Error("Review database integrity failed");
review.close();
process.env.DATA_DIR = destination;
const { ReviewStore, storedFiles } = await import("../server/review-store.ts");
const database = await import("../server/db.ts");
for (const file of storedFiles()) {
  if (!/^(objects\/[a-zA-Z0-9_-]+|published)\/[^/]+$/.test(file)) throw new Error("Invalid media path");
  const target = resolve(destination, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(source, file), target);
}
console.log(`Prepared ${storedFiles().length} referenced files in isolated review copy.`);
if (process.argv.includes("--upload")) {
  const store = new ReviewStore();
  if (await store.transport.read(store.key)) throw new Error("Cloud review already exists; refusing to overwrite it");
  await store.commit();
  console.log(`Uploaded private review snapshot and ${Object.keys(store.state.files).length} file references.`);
}
database.db.close();
