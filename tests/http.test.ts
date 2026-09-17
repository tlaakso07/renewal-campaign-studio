import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
const directory = mkdtempSync(join(tmpdir(), "renewal-http-"));
const port = 19000 + Math.floor(Math.random() * 1000),
  base = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  APP_ENV: "development",
  DEV_AUTH: "true",
  DATA_DIR: directory,
  PORT: String(port),
  SERVE_BUILD: "true",
};
execFileSync(process.execPath, ["--import", "tsx", "scripts/seed.ts"], {
  env,
  stdio: "pipe",
});
test("A02/A12/A23: real HTTP auth, CSRF, invitations, revocation, company isolation and production guard", async () => {
  const server = spawn(
    process.execPath,
    ["--import", "tsx", "server/index.ts"],
    { env, stdio: "pipe" },
  );
  let log = "";
  server.stderr.on("data", (s) => (log += s));
  async function req(
    path: string,
    body?: any,
    cookie?: string,
    method?: string,
  ) {
    const r = await fetch(base + "/api" + path, {
      method: method || (body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": "application/json",
        "X-Studio-Request": "1",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      cookie: r.headers.get("set-cookie")?.split(";")[0],
      body: await r.json(),
    };
  }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(base + "/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 80));
    }
    assert.ok(ready, "Server did not start: " + log);
    assert.equal((await req("/bootstrap")).status, 401);
    const denied = await fetch(base + "/api/auth/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: "renewal-owner", company: "renewal" }),
    });
    assert.equal(denied.status, 403);
    const a = (
      await req("/auth/local", { user: "renewal-owner", company: "renewal" })
    ).cookie!;
    const b = (
      await req("/auth/local", {
        user: "test-company-owner",
        company: "test-company",
      })
    ).cookie!;
    const c = await req("/campaigns", { name: "HTTP test campaign" }, a);
    assert.equal(c.status, 200);
    assert.equal((await req("/record/" + c.body.id, undefined, b)).status, 404);
    assert.equal(
      (
        await req(
          "/assets/1CfC6DCbekJWGEfKJ4MnFzddOwySR59sa/original",
          undefined,
          b,
        )
      ).status,
      404,
    );
    assert.equal(
      (await req("/assistant", { message: "hello", campaignId: c.body.id }, b))
        .status,
      404,
    );
    assert.equal(
      (await req("/export?jobs=not-my-job", undefined, b)).status,
      404,
    );
    assert.equal((await req("/operator", undefined, a)).status, 403);
    assert.equal((await req("/crm-outcomes", undefined, a)).status, 404);
    assert.equal(
      (
        await req(
          "/imports/preview",
          {
            type: "crm",
            mapping: {},
            sourceName: "Retired CRM import",
            csv: "leadId\nL1",
          },
          a,
        )
      ).status,
      400,
    );
    // A report-derived variation must retain the selected evidence window.
    const reportPreview = await req(
      "/imports/preview",
      {
        type: "report",
        mapping: {},
        sourceName: "HTTP synthetic scope fixture",
        csv: "account,adId,date,currency,timezone,attribution,spend,impressions,clicks,leads\nacct,ad1,2026-09-01,USD,UTC,7-day-click,100,1000,20,5\nacct,ad1,2026-09-02,USD,UTC,7-day-click,200,2000,40,10",
      },
      a,
    );
    assert.equal(reportPreview.status, 200);
    assert.equal(
      (await req(`/imports/${reportPreview.body.id}/commit`, {}, a)).status,
      200,
    );
    const doc = await req(
      "/creatives",
      { campaignId: c.body.id, kind: "static" },
      a,
    );
    const match = await req(
      "/mappings",
      {
        account: "acct",
        adId: "ad1",
        creativeId: doc.body.id,
        version: 1,
        evidence: "Synthetic exact-version fixture",
        confirmed: true,
      },
      a,
    );
    assert.equal(match.status, 200);
    const scope = {
      account: "acct",
      adId: "ad1",
      start: "2026-09-02",
      end: "2026-09-02",
    };
    const detail = await req(
      "/performance?" + new URLSearchParams(scope),
      undefined,
      a,
    );
    assert.equal(detail.body.ad.metrics.spend, 200);
    assert.equal(detail.body.previous.ad.metrics.spend, 100);
    const variation = await req(
      "/next-variation",
      { mappingId: match.body.id, change: "Test headline", filters: scope },
      a,
    );
    assert.equal(variation.status, 200);
    assert.deepEqual(
      variation.body.body.testBrief.evidence.map((r: any) => r.date),
      ["2026-09-02"],
    );
    assert.equal(
      (
        await req(
          "/next-variation",
          { mappingId: match.body.id, change: "Denied", filters: scope },
          b,
        )
      ).status,
      404,
    );
    const sharedPost = await req(
      "/feed",
      {
        title: "HTTP thread",
        text: "Test only",
        category: "Feedback",
        audience: "shared",
      },
      a,
    );
    const message = await req(
      `/feed/${sharedPost.body.id}/comments`,
      { text: "Private edit history" },
      a,
    );
    assert.equal(
      (
        await req(
          `/feed/${sharedPost.body.id}/comments/${message.body.id}`,
          { action: "remove", expectedVersion: 1 },
          a,
          "PATCH",
        )
      ).status,
      200,
    );
    assert.equal(
      (await req(`/record/${message.body.id}`, undefined, b)).body.body.text,
      "",
    );
    assert.equal(
      (await req(`/record/${message.body.id}/versions`, undefined, b)).status,
      403,
    );
    assert.equal(
      (await req(`/record/${message.body.id}/versions`, undefined, a)).status,
      200,
    );
    assert.equal(
      (await req("/members/renewal-owner/revoke", {}, a)).status,
      200,
    ); // operator is a second owner
    assert.equal((await req("/bootstrap", undefined, a)).status, 401);
    const op = (
      await req("/auth/local", { user: "operator", company: "renewal" })
    ).cookie!;
    assert.equal((await req("/members/operator/revoke", {}, op)).status, 409);
    const before = (await req("/bootstrap", undefined, op)).body;
    assert.equal(
      (await req("/theme", { color: "#000000", expectedVersion: 1 }, op, "PUT"))
        .status,
      400,
    );
    assert.equal(
      (await req("/theme", { color: "#D5AE74", expectedVersion: 1 }, op, "PUT"))
        .status,
      200,
    );
    assert.equal(
      (await req("/theme", { color: "#D5AE74", expectedVersion: 1 }, op, "PUT"))
        .status,
      409,
    );
    const after = (await req("/bootstrap", undefined, op)).body;
    assert.deepEqual(after.brand, before.brand);
    assert.equal(
      (
        await req(
          "/operator/companies",
          { name: "Denied", color: "#D5AE74" },
          b,
        )
      ).status,
      403,
    );
    const configured = await req(
      "/operator/companies",
      { name: "Isolated setup test", color: "#D5AE74" },
      op,
    );
    assert.equal(configured.status, 200);
    const configuredLogin = await req("/auth/local", {
      user: "operator",
      company: configured.body.id,
    });
    assert.equal(
      (await req("/bootstrap", undefined, configuredLogin.cookie)).body
        .creatives.length,
      0,
    );
    const draft = await req(
      "/classroom/content",
      {
        kind: "lesson",
        title: "Draft lesson",
        description: "Test",
        transcript: "Original text",
        category: "Getting Started",
        tags: ["draft"],
        audience: "platform",
        publicationId: null,
        mediaAssetId: null,
        thumbnailAssetId: null,
        resources: [],
        target: "campaigns",
        archive: null,
        state: "draft",
      },
      op,
    );
    assert.equal(draft.status, 200);
    assert.equal(
      (await req("/record/" + draft.body.id, undefined, b)).status,
      404,
    );
    assert.equal(
      (await req("/records/lesson", undefined, b)).body.some(
        (l: any) => l.id === draft.body.id,
      ),
      false,
    );
    assert.equal(
      (await req("/classroom/manage", undefined, b)).body.some(
        (item: any) => item.id === draft.body.id,
      ),
      false,
    );
    const invite = await req(
      "/invites",
      { email: "invited@example.invalid", role: "creator" },
      op,
    );
    assert.equal(invite.status, 200);
    const token = new URL(invite.body.url, base).searchParams.get("token");
    const accepted = await req("/auth/accept", {
      token,
      name: "Invited creator",
      password: "long-local-test-password",
    });
    assert.equal(accepted.status, 200);
    assert.equal(
      (
        await req("/auth/accept", {
          token,
          name: "Replay",
          password: "long-local-test-password",
        })
      ).status,
      409,
    );
    const who = await req("/bootstrap", undefined, accepted.cookie);
    assert.equal(who.body.actor.role, "creator");
    assert.equal(
      (
        await req(
          "/invites",
          { email: "other@example.invalid", role: "creator" },
          accepted.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (await req("/members/" + who.body.actor.user + "/revoke", {}, op)).status,
      200,
    );
    assert.equal(
      (await req("/bootstrap", undefined, accepted.cookie)).status,
      401,
    );
    assert.throws(
      () =>
        execFileSync(process.execPath, ["--import", "tsx", "server/index.ts"], {
          env: { ...env, NODE_ENV: "production" },
          stdio: "pipe",
          timeout: 5000,
        }),
      /Command failed/,
    );
  } finally {
    server.kill("SIGTERM");
  }
});
