import { existsSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
const [sourceArg, destinationArg] = process.argv.slice(2);
if (!sourceArg || !destinationArg)
  throw new Error(
    "Usage: npm run restore -- BACKUP_DIRECTORY NEW_EMPTY_DATA_DIRECTORY",
  );
const source = resolve(sourceArg),
  destination = resolve(destinationArg);
if (existsSync(destination))
  throw new Error(
    "Restore requires a new directory; existing data will never be overwritten.",
  );
const db = new DatabaseSync(resolve(source, "studio.sqlite"), {
  readOnly: true,
});
if (
  (db.prepare("PRAGMA integrity_check").get() as any).integrity_check !== "ok"
)
  throw new Error("Backup integrity check failed");
db.close();
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log(
  "Restored to",
  destination,
  "— start with DATA_DIR set to this directory.",
);
