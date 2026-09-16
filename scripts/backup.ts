import { backup } from "node:sqlite";
import { mkdirSync, cpSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { db, DATA } from "../server/db.ts";
const target = resolve(
  process.argv[2] ||
    resolve(DATA, "backups", new Date().toISOString().replaceAll(":", "-")),
);
if (existsSync(target))
  throw new Error(
    "Backup requires a new directory; existing snapshots are never overwritten.",
  );
mkdirSync(target, { recursive: true });
await backup(db, resolve(target, "studio.sqlite"));
for (const directory of ["objects", "published"]) {
  try {
    cpSync(resolve(DATA, directory), resolve(target, directory), {
      recursive: true,
      errorOnExist: true,
    });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}
writeFileSync(
  resolve(target, "backup.json"),
  JSON.stringify(
    {
      schema: 1,
      created: new Date().toISOString(),
      note: "Stop web and worker for a consistent database + object snapshot. Private database and media included; .env is not copied.",
    },
    null,
    2,
  ),
);
console.log("Backup written:", target);
