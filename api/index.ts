import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { waitUntil } from "@vercel/functions";
import { reviewGate } from "../server/review-access.ts";

export const config = { api: { bodyParser: false } };
let runtime: ReturnType<typeof initialize> | undefined;
async function initialize() {
  // These settings are deliberately separate from local development identities.
  if (process.env.VERCEL !== "1" || process.env.APP_ENV !== "hosted-review" || process.env.DEV_AUTH === "true") throw new Error("Invalid hosted review configuration");
  process.env.DATA_DIR = "/tmp/renewal-review";
  process.env.SERVE_BUILD = "true";
  process.env.RENDER_FALLBACK_FONT = resolve(process.cwd(), "vendor/fonts/Lato-Regular.ttf");
  const require = createRequire(import.meta.url);
  process.env.FFMPEG_PATH = require("ffmpeg-static");
  process.env.FFPROBE_PATH = require("ffprobe-static").path;
  const [{ app }, { ReviewStore, serialQueue }, database, worker] = await Promise.all([
    import("../server/index.ts"), import("../server/review-store.ts"), import("../server/db.ts"), import("../server/worker.ts"),
  ]);
  const store = new ReviewStore(), exclusive = serialQueue();
  let processing = false;
  async function processPending() {
    if (processing) return;
    processing = true;
    try {
      await exclusive(async () => {
        await store.load();
        const { db, now } = database;
        // A terminated function leaves a durable claim. Recover only after the
        // maximum execution window, so two workers cannot own an active attempt.
        db.prepare("UPDATE jobs SET status='queued' WHERE status='running' AND updated<?").run(new Date(Date.now() - 15 * 60000).toISOString());
        const job = db.prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1").get() as any;
        if (!job) return;
        db.prepare("UPDATE jobs SET status='running',attempt=attempt+1,updated=? WHERE id=?").run(now(), job.id);
        const attempt = job.attempt + 1;
        await store.commit(); // Conditional durable claim before any rendering.
        await worker.processJob(job);
        const result = database.db.prepare("SELECT * FROM jobs WHERE id=?").get(job.id) as any;
        const usage = database.db.prepare("SELECT * FROM usage WHERE job=?").get(job.id) as any;
        const asset = job.kind === "intake" ? database.db.prepare("SELECT * FROM assets WHERE company=? AND id=?").get(job.company, JSON.parse(job.payload).assetId) as any : null;
        await store.captureFiles();
        const outputFiles = { ...store.state.files };
        for (let retry = 0; retry < 3; retry++) {
          await store.load();
          const current = database.db.prepare("SELECT status,attempt FROM jobs WHERE id=?").get(job.id) as any;
          if (current?.status !== "running" || current.attempt !== attempt) return;
          const member = database.db.prepare("SELECT role FROM memberships WHERE company=? AND user=? AND revoked=0").get(job.company, job.user) as any;
          if (!member || !["owner", "creator"].includes(member.role)) return;
          database.db.prepare("UPDATE jobs SET status=?,progress=?,error=?,output=?,updated=? WHERE id=?").run(result.status, result.progress, result.error, result.output, now(), job.id);
          if (usage) database.db.prepare("UPDATE usage SET reserved=?,actual=?,state=? WHERE job=?").run(usage.reserved, usage.actual, usage.state, job.id);
          if (asset) database.db.prepare("UPDATE assets SET status=?,checksum=?,path=?,preview=?,bytes=?,metadata=?,error=? WHERE company=? AND id=?").run(asset.status, asset.checksum, asset.path, asset.preview, asset.bytes, asset.metadata, asset.error, job.company, asset.id);
          // Only immutable file references merge; user records always come from
          // the newest snapshot. Concurrent cancellation is never overwritten.
          store.state.files = { ...outputFiles, ...store.state.files };
          try { await store.commit(); return; }
          catch (e) { if (!(e instanceof database.AppError) || e.status !== 409 || retry === 2) throw e; }
        }
      });
    } catch (e) {
      console.error("Private review worker did not commit", e instanceof database.AppError ? e.status : "storage-or-render-failure");
    } finally { processing = false; }
  }
  return { app, store, exclusive, processPending, database };
}
export default async function handler(req: IncomingMessage & { reviewAuthorized?: boolean }, res: ServerResponse) {
  try {
    if (!(await reviewGate(req, res))) return;
    req.reviewAuthorized = true;
    const rt = await (runtime ||= initialize());
    const pathname = new URL(req.url || "/", "https://review.invalid").pathname;
    if (!pathname.startsWith("/api/")) { rt.app(req, res); return; }
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(req.method || "GET");
    await rt.exclusive(async () => {
      await rt.store.load();
      await new Promise<void>((done, reject) => {
        const end = res.end.bind(res);
        let ending = false;
        res.once("finish", done);
        res.once("close", done);
        res.once("error", reject);
        if (mutation) {
          // JSON mutations are acknowledged only after the durable CAS succeeds.
          res.end = ((...args: any[]) => {
            if (ending) return res;
            ending = true;
            (async () => {
              if (res.statusCode < 400) await rt.store.commit();
              (end as any)(...args);
            })().catch(e => {
              if (res.headersSent) return res.destroy();
              res.removeHeader("Content-Length"); res.removeHeader("ETag");
              res.statusCode = e instanceof rt.database.AppError ? e.status : 503;
              res.setHeader("Content-Type", "application/json");
              end(JSON.stringify({ error: res.statusCode === 409 ? "The workspace changed while saving. Reload and try again." : "Your change was not saved. Storage is unavailable; try again." }));
            });
            return res;
          }) as any;
        }
        rt.app(req, res);
      });
    });
    if (pathname === "/api/jobs" || (mutation && pathname.startsWith("/api/jobs/"))) waitUntil(rt.processPending());
  } catch {
    if (res.headersSent) { res.destroy(); return; }
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end('{"error":"Private workspace temporarily unavailable. Please try again."}');
  }
}
