import express, { Request, Response, NextFunction } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { ZipArchive } from "archiver";
import { z } from "zod";
import {
  db,
  migrate,
  ROOT,
  DATA,
  Actor,
  AppError,
  check,
  hash,
  now,
  id,
  json,
  tx,
  owner,
  creator,
  createRecord,
  getRecord,
  listRecords,
  updateRecord,
  getAsset,
  brand,
  readPackage,
  audit,
} from "./db.ts";
import { storeAsset, safePath } from "./assets.ts";
import {
  saveCampaign,
  duplicateCampaign,
  newCreative,
  saveCreative,
  queueJob,
  job,
  cancelJob,
  retryJob,
  adaptLayout,
} from "./services.ts";
import {
  previewImport,
  commitImport,
  report,
  saveMapping,
} from "./insights.ts";
import {
  assistantGatewayConfigured,
  assistantModel,
  assistantTurn,
} from "./assistant.ts";
import { registerOperator } from "./operator.ts";
import { registerCommunity } from "./community.ts";
import { registerClassroom } from "./classroom.ts";
import { registerMeasurement } from "./measurement.ts";
import { registerDiscovery } from "./discovery.ts";
import { ensureLocalFile } from "./storage.ts";
import { renderStatic } from "./render.ts";
const hosted = process.env.APP_ENV === "hosted-review";
const app = express();
migrate();
app.disable("x-powered-by");
export function assertEnvironment() {
  check(
    process.env.NODE_ENV !== "production" &&
      process.env.APP_ENV === "development" &&
      process.env.DEV_AUTH === "true",
    "This local prototype requires APP_ENV=development and DEV_AUTH=true. Hosted startup is blocked until production authentication is configured.",
    500,
  );
}
if (hosted) {
  check(
    process.env.DEV_AUTH !== "true" &&
      process.env.VERCEL === "1" &&
      !!process.env.REVIEW_COOKIE_SECRET &&
      !!process.env.REVIEW_PASSWORD_HASH,
    "Hosted review authentication is not configured",
    500,
  );
} else assertEnvironment();
app.use((req, res, next) => {
  check(
    hosted
      ? (req as any).reviewAuthorized === true
      : ["127.0.0.1", "localhost"].includes(
          (req.headers.host || "").split(":")[0],
        ),
    "Host denied",
    403,
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Request-ID", id());
  if (
    req.path.startsWith("/api") &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {
    const origin = req.headers.origin;
    check(
      hosted
        ? origin === `https://${req.headers.host}`
        : !origin ||
            [
              "http://127.0.0.1:8787",
              "http://localhost:8787",
              "http://127.0.0.1:8788",
              "http://localhost:8788",
            ].includes(origin),
      "Origin denied",
      403,
    );
    check(
      req.headers["x-studio-request"] === "1",
      "Missing request protection",
      403,
    );
  }
  next();
});
app.use(express.json({ limit: "3mb" }));
if (hosted)
  app.use("/api/auth", (_req, res) =>
    res.status(404).json({ error: "Use the workspace password to sign in." }),
  );
const route =
  (fn: (req: any, res: Response) => any) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
const send = (res: Response, value: any) => res.json(value);
const tokenFrom = (req: Request) =>
  req.headers.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("studio_session="))
    ?.split("=")[1];
function session(res: Response, user: string, company: string) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(
    hash(token),
    user,
    company,
    Date.now() + 12 * 60 * 60 * 1000,
  );
  res.cookie("studio_session", token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  });
}
app.get(
  "/api/health",
  route((req, res) =>
    send(res, {
      status: "ok",
      mode: hosted ? "hosted-review" : "development",
      worker: db.prepare("SELECT * FROM worker_health").get() || null,
    }),
  ),
);
app.get(
  "/api/auth/options",
  route((req, res) =>
    send(
      res,
      db
        .prepare(
          "SELECT u.id,u.name,m.company,m.role,c.name companyName FROM users u JOIN memberships m ON m.user=u.id JOIN companies c ON c.id=m.company WHERE m.revoked=0",
        )
        .all(),
    ),
  ),
);
app.post(
  "/api/auth/local",
  route((req, res) => {
    assertEnvironment();
    const m = db
      .prepare(
        "SELECT * FROM memberships WHERE user=? AND company=? AND revoked=0",
      )
      .get(req.body.user, req.body.company);
    check(m, "Unknown development identity", 403);
    session(res, req.body.user, req.body.company);
    send(res, { ok: true });
  }),
);
app.post(
  "/api/auth/logout",
  route((req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(
      hash(tokenFrom(req) || ""),
    );
    res.clearCookie("studio_session");
    send(res, { ok: true });
  }),
);
app.post(
  "/api/auth/accept",
  route((req, res) => {
    const invite = (
      db.prepare("SELECT * FROM records WHERE kind='invite'").all() as any[]
    ).find((r) => json(r.body).tokenHash === hash(req.body.token || ""));
    check(invite, "Invalid invite", 404);
    const b = json(invite.body);
    check(
      !b.accepted && b.expires > Date.now(),
      "Invite expired or already used",
      409,
    );
    check(
      typeof req.body.name === "string" &&
        req.body.name.length > 0 &&
        req.body.password?.length >= 12,
      "Name and a password of at least 12 characters are required",
    );
    const salt = randomBytes(16).toString("hex"),
      password =
        salt + ":" + scryptSync(req.body.password, salt, 64).toString("hex");
    const user = id();
    tx(() => {
      db.prepare(
        "INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)",
      ).run(user, req.body.name, b.email, password);
      db.prepare(
        "INSERT INTO memberships(company,user,role) VALUES(?,?,?)",
      ).run(invite.company, user, b.role);
      db.prepare("UPDATE records SET body=? WHERE id=?").run(
        JSON.stringify({ ...b, accepted: true }),
        invite.id,
      );
    });
    session(res, user, invite.company);
    send(res, { ok: true });
  }),
);
app.post(
  "/api/auth/login",
  route((req, res) => {
    const u = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(req.body.email) as any;
    check(u?.password, "Invalid credentials", 401);
    const [salt, expected] = u.password.split(":");
    check(
      timingSafeEqual(
        scryptSync(String(req.body.password), salt, 64),
        Buffer.from(expected, "hex"),
      ),
      "Invalid credentials",
      401,
    );
    const m = db
      .prepare("SELECT * FROM memberships WHERE user=? AND revoked=0 LIMIT 1")
      .get(u.id) as any;
    check(m, "Membership is revoked", 403);
    session(res, u.id, m.company);
    send(res, { ok: true });
  }),
);
app.use("/api", (req: any, res, next) => {
  try {
    if (hosted) {
      check(req.reviewAuthorized === true, "Workspace password required", 401);
      const row = db
        .prepare(
          "SELECT u.id user,u.name,m.company,m.role FROM users u JOIN memberships m ON m.user=u.id JOIN companies c ON c.id=m.company WHERE u.id='review-creator' AND m.company='renewal' AND m.revoked=0 AND c.active=1",
        )
        .get() as any;
      check(row && row.role === "creator", "Review access is unavailable", 403);
      req.actor = { ...row, staff: false };
      return next();
    }
    const token = tokenFrom(req);
    check(token, "Sign in to your workspace", 401);
    const row = db
      .prepare(
        "SELECT s.user,s.company,u.name,u.staff,m.role FROM sessions s JOIN users u ON u.id=s.user JOIN memberships m ON m.company=s.company AND m.user=s.user JOIN companies c ON c.id=s.company WHERE s.token=? AND s.expires>? AND m.revoked=0 AND c.active=1",
      )
      .get(hash(token), Date.now()) as any;
    check(row, "Session expired or access revoked", 401);
    req.actor = { ...row, staff: !!row.staff };
    next();
  } catch (e) {
    next(e);
  }
});
app.use("/api", (req: any, _res, next) => {
  if (
    !hosted ||
    !(
      /export/.test(req.path) ||
      (req.method === "POST" && req.path === "/publications")
    )
  )
    return next();
  (async () => {
    const rows = db
      .prepare("SELECT output FROM jobs WHERE company=? AND status='ready'")
      .all(req.actor.company) as any[];
    for (const row of rows) {
      const output = json(row.output);
      for (const key of ["file", "copyFile", "manifestFile", "captionsFile"])
        if (output[key])
          await ensureLocalFile(safePath(req.actor.company, output[key]));
    }
  })().then(() => next(), next);
});
app.get(
  "/api/bootstrap",
  route((req, res) => {
    const a = req.actor,
      assistantConnected = assistantGatewayConfigured(
        req.headers["x-vercel-oidc-token"],
      );
    send(res, {
      actor: a,
      company: db.prepare("SELECT * FROM companies WHERE id=?").get(a.company),
      brand: brand(a),
      campaigns: listRecords(a, "campaign"),
      creatives: listRecords(a, "creative"),
      models: readPackage("product/model-inventory.json").models,
      mode: hosted ? "hosted-review" : "development",
      assistant: {
        mode: assistantConnected ? "ai-gateway" : "local-guide",
        model: assistantConnected ? assistantModel : null,
      },
    });
  }),
);
app.get(
  "/api/records/:kind",
  route((req, res) => {
    check(
      [
        "campaign",
        "creative",
        "conversation",
        "memory",
        "lesson",
        "recording",
        "saved-report",
        "playback",
        "template",
        "draft",
      ].includes(req.params.kind),
      "Unknown collection",
      404,
    );
    send(res, listRecords(req.actor, req.params.kind));
  }),
);
app.get(
  "/api/record/:id",
  route((req, res) => send(res, getRecord(req.actor, req.params.id))),
);
app.get(
  "/api/record/:id/versions",
  route((req, res) => {
    const record = getRecord(req.actor, req.params.id);
    if (["post", "comment"].includes(record.kind))
      check(
        req.actor.staff || record.owner === req.actor.user,
        "Author or moderator required",
        403,
      );
    send(
      res,
      (
        db
          .prepare("SELECT * FROM versions WHERE record=? ORDER BY rev DESC")
          .all(req.params.id) as any[]
      ).map((v) => ({ ...v, body: json(v.body) })),
    );
  }),
);
app.post(
  "/api/campaigns",
  route((req, res) => send(res, saveCampaign(req.actor, req.body))),
);
app.put(
  "/api/campaigns/:id",
  route((req, res) =>
    send(
      res,
      saveCampaign(
        req.actor,
        req.body.body,
        req.params.id,
        req.body.expectedVersion,
      ),
    ),
  ),
);
app.post(
  "/api/campaigns/:id/duplicate",
  route((req, res) => send(res, duplicateCampaign(req.actor, req.params.id))),
);
app.post(
  "/api/creatives",
  route((req, res) => send(res, newCreative(req.actor, req.body))),
);
app.put(
  "/api/creatives/:id",
  route((req, res) =>
    send(
      res,
      saveCreative(
        req.actor,
        req.params.id,
        req.body.expectedVersion,
        req.body.body,
      ),
    ),
  ),
);
app.post(
  "/api/creatives/:id/variation",
  route((req, res) => {
    const r = getRecord(req.actor, req.params.id, "creative");
    send(
      res,
      createRecord(req.actor, "creative", {
        ...r.body,
        name: r.body.name + " · Variation",
        parent: r.id,
      }),
    );
  }),
);
app.post(
  "/api/creatives/:id/adapt",
  route((req, res) => {
    const r = getRecord(req.actor, req.params.id, "creative");
    check(
      ["square", "portrait", "vertical"].includes(req.body.format),
      "Unknown format",
    );
    send(
      res,
      saveCreative(
        req.actor,
        r.id,
        req.body.expectedVersion,
        adaptLayout(r.body, req.body.layout || r.body.layout, req.body.format),
      ),
    );
  }),
);
app.post(
  "/api/creatives/:id/apply-offer",
  route((req, res) => {
    const r = getRecord(req.actor, req.params.id, "creative"),
      c = getRecord(req.actor, r.body.campaignId, "campaign");
    send(
      res,
      saveCreative(req.actor, r.id, req.body.expectedVersion, {
        ...r.body,
        offerVersion: c.body.offerVersion,
        layers: r.body.layers.map((l: any) => ({
          ...l,
          text:
            l.role === "headline"
              ? c.body.offer || l.text
              : l.role === "terms"
                ? c.body.terms
                : l.role === "cta"
                  ? c.body.cta
                  : l.text,
        })),
      }),
    );
  }),
);
app.get(
  "/api/creatives/:id/preview",
  route(async (req, res) => {
    const r = getRecord(req.actor, req.params.id, "creative");
    const { buffer } = await renderStatic(req.actor, r.body);
    res.type("png").send(buffer);
  }),
);
app.get(
  "/api/assets",
  route((req, res) => {
    const assets = (
      db
        .prepare(
          "SELECT * FROM assets WHERE company=? ORDER BY CASE WHEN preview IS NOT NULL THEN 0 ELSE 1 END,name",
        )
        .all(req.actor.company) as any[]
    ).map((r) => ({
      ...r,
      path: undefined,
      preview: !!r.preview,
      metadata: json(r.metadata),
    }));
    send(res, assets);
  }),
);
app.post(
  "/api/assets/upload",
  express.raw({ type: "application/octet-stream", limit: "100mb" }),
  route(async (req, res) => {
    creator(req.actor);
    const filename = decodeURIComponent(
      String(req.headers["x-file-name"] || "upload"),
    );
    const aid = req.headers["x-catalog-id"]
      ? String(req.headers["x-catalog-id"])
      : id();
    if (req.headers["x-catalog-id"]) getAsset(req.actor, aid);
    send(res, await storeAsset(req.actor, aid, req.body, filename));
  }),
);
app.get(
  "/api/assets/:id/:mode",
  route(async (req, res) => {
    const a = getAsset(req.actor, req.params.id);
    const preview = req.params.mode === "preview";
    check(
      preview ? a.preview : a.path,
      "Original or preview is not available",
      404,
    );
    const path = safePath(req.actor.company, preview ? a.preview : a.path);
    await ensureLocalFile(path);
    if (preview) res.type("png").sendFile(path, { dotfiles: "allow" });
    else if (req.params.mode === "play" && ["video", "audio"].includes(a.kind))
      res.sendFile(path, { dotfiles: "allow" });
    else res.download(path, a.name, { dotfiles: "allow" });
  }),
);
app.post(
  "/api/jobs",
  route((req, res) => {
    check(["render", "intake"].includes(req.body.kind), "Unknown job type");
    send(
      res,
      queueJob(req.actor, req.body.kind, req.body.payload, req.body.key),
    );
  }),
);
app.get(
  "/api/jobs",
  route((req, res) =>
    send(
      res,
      (
        db
          .prepare(
            "SELECT id FROM jobs WHERE company=? ORDER BY created DESC LIMIT 100",
          )
          .all(req.actor.company) as any[]
      ).map((r) => job(req.actor, r.id)),
    ),
  ),
);
app.post(
  "/api/jobs/:id/:action",
  route((req, res) => {
    check(["cancel", "retry"].includes(req.params.action), "Unknown action");
    send(
      res,
      req.params.action === "cancel"
        ? cancelJob(req.actor, req.params.id)
        : retryJob(req.actor, req.params.id),
    );
  }),
);
app.get(
  "/api/jobs/:id/file",
  route(async (req, res) => {
    const j = job(req.actor, req.params.id);
    check(j.status === "ready" && j.output?.file, "Output is not ready", 409);
    await ensureLocalFile(safePath(req.actor.company, j.output.file));
    audit(req.actor, "download", j.id);
    if (req.query.play === "1")
      res.sendFile(safePath(req.actor.company, j.output.file), {
        dotfiles: "allow",
      });
    else
      res.download(
        safePath(req.actor.company, j.output.file),
        j.output.filename,
        { dotfiles: "allow" },
      );
  }),
);
app.get(
  "/api/jobs/:id/captions.vtt",
  route(async (req, res) => {
    const j = job(req.actor, req.params.id);
    check(
      j.status === "ready" && j.output?.captionsFile,
      "Captions are not available",
      404,
    );
    const path = safePath(req.actor.company, j.output.captionsFile);
    await ensureLocalFile(path);
    const captions = readFileSync(path, "utf8")
      .replace(/^\uFEFF/, "")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    res.type("text/vtt").send(`WEBVTT\n\n${captions}`);
  }),
);
app.get(
  "/api/export",
  route((req, res) => {
    const ids = String(req.query.jobs || "")
      .split(",")
      .filter(Boolean);
    check(ids.length > 0 && ids.length <= 30, "Select up to 30 outputs");
    const jobs = ids.map((j) => job(req.actor, j)),
      ready = jobs.filter(
        (j) =>
          j.status === "ready" &&
          [
            j.output?.file,
            j.output?.manifestFile,
            j.output?.copyFile,
            ...(j.output?.captionsFile ? [j.output.captionsFile] : []),
          ].every((f) => f && existsSync(safePath(req.actor.company, f))),
      );
    check(ready.length, "No ready files selected", 409);
    res.attachment("campaign-export.zip");
    const zip = new ZipArchive({ zlib: { level: 5 } });
    zip.on("error", (e) => res.destroy(e));
    zip.pipe(res);
    for (const j of ready) {
      const stem = j.id.slice(0, 8);
      zip.file(safePath(req.actor.company, j.output.file), {
        name: `${stem}/${j.output.filename}`,
      });
      zip.file(safePath(req.actor.company, j.output.manifestFile), {
        name: `${stem}/manifest.json`,
      });
      zip.file(safePath(req.actor.company, j.output.copyFile), {
        name: `${stem}/copy.txt`,
      });
      if (j.output.captionsFile)
        zip.file(safePath(req.actor.company, j.output.captionsFile), {
          name: `${stem}/captions.srt`,
        });
    }
    zip.append(
      JSON.stringify(
        {
          included: ready.map((j) => j.id),
          excluded: jobs
            .filter((j) => !ready.includes(j))
            .map((j) => ({
              id: j.id,
              status: j.status,
              reason:
                j.status === "ready"
                  ? "Stored output is missing"
                  : j.error || j.status,
            })),
        },
        null,
        2,
      ),
      { name: "export-summary.json" },
    );
    audit(req.actor, "export", ready.map((j) => j.id).join(","));
    void zip.finalize();
  }),
);
app.post(
  "/api/assistant",
  route(async (req, res) =>
    send(
      res,
      await assistantTurn(
        req.actor,
        req.body,
        assistantGatewayConfigured(req.headers["x-vercel-oidc-token"]),
      ),
    ),
  ),
);
app.post(
  "/api/memory",
  route((req, res) =>
    send(
      res,
      createRecord(
        req.actor,
        "memory",
        z.object({ text: z.string().max(2000) }).parse(req.body),
      ),
    ),
  ),
);
app.delete(
  "/api/memory/:id",
  route((req, res) => {
    getRecord(req.actor, req.params.id, "memory");
    db.prepare("DELETE FROM versions WHERE record=?").run(req.params.id);
    db.prepare("DELETE FROM records WHERE id=?").run(req.params.id);
    send(res, { ok: true });
  }),
);
app.post(
  "/api/imports/preview",
  route((req, res) => {
    check(req.body.type === "report", "Unknown import type");
    send(res, previewImport(req.actor, req.body));
  }),
);
app.post(
  "/api/imports/:id/commit",
  route((req, res) => send(res, commitImport(req.actor, req.params.id))),
);
app.get(
  "/api/insights",
  route((req, res) => send(res, report(req.actor, req.query))),
);
app.post(
  "/api/mappings",
  route((req, res) => send(res, saveMapping(req.actor, req.body))),
);
app.post(
  "/api/saved-reports",
  route((req, res) =>
    send(
      res,
      createRecord(
        req.actor,
        "saved-report",
        z
          .object({
            name: z.string().max(120),
            filters: z.record(z.string(), z.string()),
          })
          .parse(req.body),
      ),
    ),
  ),
);
app.post(
  "/api/next-variation",
  route((req, res) => {
    const mapping = getRecord(req.actor, req.body.mappingId, "mapping"),
      current = getRecord(req.actor, mapping.body.creativeId, "creative"),
      original = {
        ...current,
        body: json(
          (
            db
              .prepare("SELECT body FROM versions WHERE record=? AND rev=?")
              .get(current.id, mapping.body.version) as any
          ).body,
        ),
      },
      campaign = getRecord(req.actor, original.body.campaignId, "campaign"),
      b = brand(req.actor);
    check(req.body.change?.trim(), "Describe the proposed change");
    const evidence = report(
      req.actor,
      z.record(z.string(), z.string()).parse(req.body.filters || {}),
    ).rows.filter(
      (r: any) =>
        r.adId === mapping.body.adId && r.account === mapping.body.account,
    );
    check(evidence.length, "No source evidence");
    const creative = createRecord(req.actor, "creative", {
      ...original.body,
      name: original.body.name + " · Next test",
      parent: original.id,
      brandId: b.id,
      brandVersion: b.rev,
      offerVersion: campaign.body.offerVersion,
      layers: original.body.layers.map((l: any) =>
        l.role === "headline"
          ? { ...l, text: campaign.body.offer || l.text }
          : l.role === "terms"
            ? { ...l, text: campaign.body.terms }
            : l.role === "cta"
              ? { ...l, text: campaign.body.cta }
              : l.role === "logo"
                ? { ...l, assetId: b.body.logoAssetId }
                : l,
      ),
      testBrief: {
        change: req.body.change,
        metric: req.body.metric || "CPL",
        evidence,
        interpretation: "Observational hypothesis; not a causal claim",
      },
    });
    send(res, creative);
  }),
);
app.get(
  "/api/settings",
  route((req, res) => {
    const a = req.actor,
      assistantConnected = assistantGatewayConfigured(
        req.headers["x-vercel-oidc-token"],
      );
    send(res, {
      members: db
        .prepare(
          "SELECT u.id,u.name,u.email,m.role,m.revoked FROM memberships m JOIN users u ON u.id=m.user WHERE m.company=?",
        )
        .all(a.company),
      usage: db.prepare("SELECT * FROM usage WHERE company=?").all(a.company),
      entitlements: listRecords(a, "entitlements")[0],
      integrations: {
        meta: {
          state: "Not connected",
          reason:
            "Meta developer app, ads_read review, authorized account and verified API version required.",
        },
        reasoning: {
          state: assistantConnected ? "Connected" : "Not configured",
          reason: assistantConnected
            ? `Vercel AI Gateway · ${assistantModel}`
            : "Vercel deployments use OIDC automatically. Local development needs AI_GATEWAY_API_KEY or a refreshed Vercel OIDC token.",
        },
        media: {
          state: "Unavailable",
          reason:
            "Model inventory is preserved; no model is enabled without verified access.",
        },
        billing: {
          state: "Not connected",
          reason: "Payment account and commercial policy not selected.",
        },
      },
    });
  }),
);
app.post(
  "/api/invites",
  route((req, res) => {
    owner(req.actor);
    const body = z
        .object({ email: z.email(), role: z.enum(["creator", "viewer"]) })
        .parse(req.body),
      token = randomBytes(24).toString("hex");
    const r = createRecord(req.actor, "invite", {
      ...body,
      tokenHash: hash(token),
      expires: Date.now() + 48 * 3600000,
      accepted: false,
    });
    send(res, {
      id: r.id,
      url: `/invite?token=${token}`,
      delivery: "Copy link; email delivery is not configured",
      expiresIn: "48 hours",
    });
  }),
);
app.post(
  "/api/members/:id/revoke",
  route((req, res) => {
    owner(req.actor);
    const m = db
      .prepare(
        "SELECT * FROM memberships WHERE company=? AND user=? AND revoked=0",
      )
      .get(req.actor.company, req.params.id) as any;
    check(m, "Member not found", 404);
    if (m.role === "owner") {
      const n = (
        db
          .prepare(
            "SELECT COUNT(*) n FROM memberships WHERE company=? AND role='owner' AND revoked=0",
          )
          .get(req.actor.company) as any
      ).n;
      check(n > 1, "Cannot revoke the last owner", 409);
    }
    db.prepare(
      "UPDATE memberships SET revoked=1 WHERE company=? AND user=?",
    ).run(req.actor.company, req.params.id);
    audit(req.actor, "membership.revoke", req.params.id);
    send(res, { ok: true });
  }),
);
app.put(
  "/api/entitlements",
  route((req, res) => {
    owner(req.actor);
    const e = listRecords(req.actor, "entitlements")[0];
    const input = z
      .object({ renderUnits: z.number().int().min(1).max(10000) })
      .parse(req.body);
    send(res, updateRecord(req.actor, e.id, e.rev, { ...e.body, ...input }));
  }),
);
app.put(
  "/api/brand",
  route((req, res) => {
    owner(req.actor);
    const b = brand(req.actor),
      input = z
        .object({
          logoAssetId: z.string().nullable(),
          fontAssetId: z.string().nullable(),
          renderFontApproved: z.boolean(),
          fontUsage: z.string().max(1000),
        })
        .parse(req.body);
    if (input.logoAssetId)
      check(
        getAsset(req.actor, input.logoAssetId).preview,
        "Logo needs a usable preview",
      );
    if (input.fontAssetId)
      check(
        getAsset(req.actor, input.fontAssetId).kind === "font",
        "Select a font original",
      );
    send(
      res,
      updateRecord(req.actor, b.id, req.body.expectedVersion, {
        ...b.body,
        ...input,
      }),
    );
  }),
);
registerCommunity(app, route);
registerClassroom(app, route);
registerDiscovery(app, route);
registerMeasurement(app, route);
registerOperator(app, route);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Endpoint not found" }),
);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const status =
    err instanceof AppError
      ? err.status
      : err instanceof z.ZodError
        ? 400
        : 500;
  res.status(status).json({
    error:
      err instanceof z.ZodError
        ? err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
        : status === 500
          ? "The request could not be completed. Check the local operator log."
          : err.message,
  });
  if (status === 500)
    console.error(
      "Request failed",
      req.method,
      req.path,
      err.name,
      err.message?.replace(/(?:Bearer|token|secret)[^\s]*/gi, "[redacted]"),
    );
});
if (process.env.SERVE_BUILD === "true") {
  app.use(express.static(resolve(ROOT, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(resolve(ROOT, "dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    configFile: resolve(ROOT, "vite.config.ts"),
    server: { middlewareMode: true, proxy: {} },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 8787);
if (!hosted)
  app.listen(port, "127.0.0.1", () =>
    console.log(
      `Renewal Studio: http://127.0.0.1:${port} (explicit local development identity)`,
    ),
  );
export { app };
