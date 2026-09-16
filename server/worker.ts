import {
  readFileSync,
  writeFileSync,
  existsSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import {
  db,
  DATA,
  getAsset,
  migrate,
  now,
  tx,
  json,
  getRecord,
  hash,
  Actor,
  check,
} from "./db.ts";
import { safePath, importDrive } from "./assets.ts";
import { renderStatic, renderVideo, brandVersion } from "./render.ts";
import { pathToFileURL } from "node:url";
export async function processJob(j: any) {
  const member = db
    .prepare(
      "SELECT m.*,u.name,u.staff FROM memberships m JOIN users u ON u.id=m.user WHERE company=? AND user=? AND revoked=0",
    )
    .get(j.company, j.user) as any;
  try {
    check(
      member && ["owner", "creator"].includes(member.role),
      "Creator membership was revoked",
      403,
    );
    const a: Actor = {
      company: j.company,
      user: j.user,
      role: member.role,
      staff: !!member.staff,
      name: member.name,
    };
    const payload = json(j.payload);
    let output: any;
    const canceled = () =>
      (db.prepare("SELECT status FROM jobs WHERE id=?").get(j.id) as any)
        ?.status === "canceled";
    if (j.kind === "intake") {
      const asset = await importDrive(a, payload.assetId);
      output = { assetId: asset.id };
    } else {
      const record = getRecord(a, payload.creativeId, "creative");
      const version = db
        .prepare("SELECT body FROM versions WHERE record=? AND rev=?")
        .get(record.id, payload.version) as any;
      check(version, "Creative version unavailable");
      const doc = json(version.body);
      const progress = (p: any) =>
        db
          .prepare("UPDATE jobs SET progress=?,updated=? WHERE id=?")
          .run(JSON.stringify(p), now(), j.id);
      const rendered =
        doc.kind === "video"
          ? await renderVideo(a, doc, j.id, progress, canceled)
          : await renderStatic(a, doc);
      if (canceled()) return;
      const ext = doc.kind === "video" ? "mp4" : "png";
      const file = `${j.id}.${ext}`;
      writeFileSync(safePath(a.company, file), rendered.buffer, {
        mode: 0o600,
      });
      const manifest = {
        schemaVersion: 1,
        company: a.company,
        creativeId: record.id,
        creativeVersion: payload.version,
        campaignId: doc.campaignId,
        brandId: doc.brandId,
        brandVersion: doc.brandVersion,
        offerVersion: doc.offerVersion,
        format: doc.format,
        kind: doc.kind,
        copy: doc.copy,
        layers: doc.layers,
        scenes: doc.scenes,
        checksum: hash(rendered.buffer),
        created: now(),
        warnings: rendered.warnings,
        renderer: "local deterministic compositor",
        sourceAssets: [
          ...new Set(
            [
              ...doc.layers.map((l: any) => l.assetId),
              ...doc.scenes.map((s: any) => s.assetId),
              doc.musicAssetId,
              doc.voiceAssetId,
              brandVersion(a, doc).fontAssetId,
            ].filter(Boolean),
          ),
        ].map((assetId: any) => {
          const asset = getAsset(a, assetId);
          return {
            id: asset.id,
            checksum: asset.checksum,
            sourceId: asset.source_id,
            name: asset.name,
          };
        }),
      };
      const manifestFile = `${j.id}-manifest.json`,
        copyFile = `${j.id}-copy.txt`;
      writeFileSync(
        safePath(a.company, manifestFile),
        JSON.stringify(manifest, null, 2),
      );
      writeFileSync(
        safePath(a.company, copyFile),
        [
          doc.name,
          doc.copy,
          ...doc.layers
            .filter((l: any) => l.type === "text")
            .map((l: any) => `${l.role}: ${l.text}`),
        ].join("\n\n"),
      );
      output = {
        file,
        manifestFile,
        copyFile,
        filename: `${doc.name.replace(/[^a-zA-Z0-9-]/g, "-")}-v${payload.version}-${doc.format}.${ext}`,
        checksum: manifest.checksum,
        warnings: rendered.warnings,
      };
      if ("captions" in rendered) {
        const srt = `${j.id}.srt`;
        writeFileSync(safePath(a.company, srt), String(rendered.captions));
        output.captionsFile = srt;
        output.duration = "duration" in rendered ? rendered.duration : null;
      }
    }
    if (canceled()) return;
    tx(() => {
      db.prepare(
        "UPDATE jobs SET status='ready',output=?,updated=? WHERE id=? AND status='running'",
      ).run(JSON.stringify(output), now(), j.id);
      db.prepare(
        "UPDATE usage SET actual=reserved,reserved=0,state='settled' WHERE job=?",
      ).run(j.id);
    });
  } catch (e) {
    const row = db
      .prepare("SELECT status,progress FROM jobs WHERE id=?")
      .get(j.id) as any;
    if (row.status === "canceled") return;
    const partial = json(row.progress).scenes?.some(
      (s: any) => s.status === "ready",
    );
    db.prepare("UPDATE jobs SET status=?,error=?,updated=? WHERE id=?").run(
      partial ? "partial" : "failed",
      (e as Error).message.slice(0, 1000),
      now(),
      j.id,
    );
    db.prepare("UPDATE usage SET reserved=0,state='released' WHERE job=?").run(
      j.id,
    );
  }
}
export async function tick() {
  const j = tx(() => {
    const r = db
      .prepare(
        "SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1",
      )
      .get() as any;
    if (r)
      db.prepare(
        "UPDATE jobs SET status='running',attempt=attempt+1,updated=? WHERE id=?",
      ).run(now(), r.id);
    return r;
  });
  if (j) await processJob(j);
  return !!j;
}
export function recoverInterruptedJobs() {
  db.prepare("UPDATE jobs SET status='queued' WHERE status='running'").run();
}
function acquireWorkerLock() {
  const path = DATA + "/worker.lock";
  if (existsSync(path)) {
    const pid = Number(readFileSync(path, "utf8"));
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch {}
    check(!alive, "A local worker is already running", 409);
    unlinkSync(path);
  }
  const fd = openSync(path, "wx", 0o600);
  writeFileSync(fd, String(process.pid));
  closeSync(fd);
  process.on("exit", () => {
    try {
      unlinkSync(path);
    } catch {}
  });
  for (const signal of ["SIGTERM", "SIGINT"] as const)
    process.on(signal, () => process.exit(0));
}
async function main() {
  check(
    process.env.NODE_ENV !== "production" &&
      process.env.APP_ENV === "development" &&
      process.env.DEV_AUTH === "true",
    "Worker requires explicit local development mode",
    500,
  );
  migrate();
  acquireWorkerLock();
  recoverInterruptedJobs();
  console.log("Render worker running (single local worker).");
  setInterval(
    () =>
      db
        .prepare("INSERT OR REPLACE INTO worker_health VALUES(?,?)")
        .run("local", now()),
    3000,
  ).unref();
  while (true) {
    if (!(await tick()))
      await new Promise((resolve) => setTimeout(resolve, 750));
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
