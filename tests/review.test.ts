import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { passwordHash, passwordMatches, signReviewSession, validReviewSession, reviewGate, REVIEW_COOKIE } from "../server/review-access.ts";

test("private review password, tampering, expiry and secret rotation", () => {
  const encoded = passwordHash("test-password-only-not-a-deployment-secret");
  assert(passwordMatches("test-password-only-not-a-deployment-secret", encoded));
  assert(!passwordMatches("incorrect", encoded));
  assert(!passwordMatches("a".repeat(300), encoded));
  assert(!passwordMatches("x", "malformed"));
  const secret = "unit-test-only-".repeat(4), time = Date.now();
  const token = signReviewSession(secret, time);
  assert(validReviewSession(token, secret, time));
  assert(!validReviewSession(token + "x", secret, time));
  assert(!validReviewSession(token, secret + "rotated", time));
  assert(!validReviewSession(token, secret, time + 8 * 3600000));
  assert(!validReviewSession(token.replace(/^\d+/, "9999999999999"), secret, time));
});

test("gate protects API, scripts, media and arbitrary paths; login has origin checks and secure cookies", async () => {
  process.env.REVIEW_PASSWORD_HASH = passwordHash("test-passphrase");
  process.env.REVIEW_COOKIE_SECRET = "test-session-secret-".repeat(4);
  async function request(url: string, options: any = {}) {
    const req = Readable.from(options.body ? [Buffer.from(options.body)] : []) as any;
    req.url = url; req.method = options.method || "GET"; req.headers = { host: "review.example", ...options.headers }; req.socket = { remoteAddress: "test" };
    const headers: Record<string, any> = {};
    const res = { statusCode: 200, setHeader(k: string, v: any) { headers[k] = v; }, end(body?: any) { this.body = String(body || ""); }, body: "" };
    const allowed = await reviewGate(req, res as any);
    return { allowed, headers, ...res };
  }
  for (const path of ["/", "/assets/app.js", "/api/bootstrap", "/api/assets/private/original", "/api/index", "/.env", "/unknown?password=anything"]) {
    const result = await request(path);
    assert.equal(result.allowed, false);
    assert.match(result.headers["Cache-Control"], /no-store/);
    assert(!result.body.includes("BLOB_READ_WRITE_TOKEN"));
  }
  const denied = await request("/unlock", { method: "POST", body: "password=test-passphrase", headers: { origin: "https://evil.example", "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(denied.statusCode, 403);
  const wrong = await request("/unlock", { method: "POST", body: "password=wrong", headers: { origin: "https://review.example", "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(wrong.statusCode, 401);
  const login = await request("/unlock", { method: "POST", body: "password=test-passphrase", headers: { origin: "https://review.example", "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(login.statusCode, 303);
  assert.match(login.headers["Set-Cookie"], /Secure; HttpOnly; SameSite=Strict/);
  assert((await request("/api/bootstrap", { headers: { cookie: login.headers["Set-Cookie"].split(";")[0] } })).allowed);
  const logout = await request("/api/auth/logout", { method: "POST", headers: { cookie: login.headers["Set-Cookie"].split(";")[0], origin: "https://review.example", "x-studio-request": "1" } });
  assert.match(logout.headers["Set-Cookie"], new RegExp(`${REVIEW_COOKIE}=;`));
  delete process.env.REVIEW_COOKIE_SECRET;
  assert.equal((await request("/")).statusCode, 503);
});

test("private snapshot survives a cold restore, verifies media and rejects concurrent overwrite", async () => {
  process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "renewal-review-store-test-"));
  const database = await import("../server/db.ts");
  const { ReviewStore, serialQueue } = await import("../server/review-store.ts");
  database.migrate();
  const objects = new Map<string, { bytes: Buffer; etag: string }>();
  let counter = 0;
  const transport = {
    async read(key: string) { return objects.get(key) || null; },
    async write(key: string, bytes: Buffer, expected?: string) {
      const prior = objects.get(key);
      if (prior && expected !== prior.etag) throw new database.AppError(409, "Conflict");
      const etag = String(++counter); objects.set(key, { bytes: Buffer.from(bytes), etag }); return etag;
    },
  };
  database.db.prepare("INSERT INTO companies VALUES(?,?,?,1)").run("renewal", "Before", "{}");
  const folder = join(database.DATA, "objects/renewal"); mkdirSync(folder, { recursive: true });
  const file = join(folder, "fixture.png"); writeFileSync(file, "verified fixture bytes");
  database.db.prepare("INSERT INTO assets(id,company,name,kind,status,path) VALUES(?,?,?,?,?,?)").run("fixture", "renewal", "fixture", "image", "original_stored", "fixture.png");
  const first = new ReviewStore(transport, "state"); await first.commit();
  const second = new ReviewStore(transport, "state"); await second.load();
  database.db.prepare("UPDATE companies SET name='Saved'").run(); await first.commit();
  database.db.prepare("UPDATE companies SET name='Stale'").run();
  await assert.rejects(second.commit(), (e: any) => e.status === 409);
  const cold = new ReviewStore(transport, "state"); await cold.load();
  assert.equal((database.db.prepare("SELECT name FROM companies").get() as any).name, "Saved");
  rmSync(file); await cold.ensure(file); assert.equal(readFileSync(file, "utf8"), "verified fixture bytes");
  await assert.rejects(cold.ensure(join(database.DATA, "../escape")), (e: any) => e.status === 403);
  const ref = cold.state.files["objects/renewal/fixture.png"];
  objects.set(ref.key, { bytes: Buffer.from("corrupt"), etag: "broken" });
  const broken = new ReviewStore(transport, "state"); await broken.load();
  await assert.rejects(broken.ensure(file), /verified/);
  const order: number[] = [], exclusive = serialQueue();
  await Promise.all([exclusive(async () => { await new Promise(r => setTimeout(r, 20)); order.push(1); }), exclusive(async () => { order.push(2); })]);
  assert.deepEqual(order, [1, 2]);
  database.db.close();
});
