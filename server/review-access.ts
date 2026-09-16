import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export const REVIEW_COOKIE = "__Host-renewal_review";
const lifetime = 8 * 60 * 60 * 1000;
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordMatches(password: string, encoded: string) {
  const [salt, expected] = encoded.split(":");
  if (!/^[a-f0-9]{32}$/.test(salt || "") || !/^[a-f0-9]{128}$/.test(expected || "") || password.length > 256) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, "hex"));
}
export function signReviewSession(secret: string, time = Date.now()) {
  const payload = `${time + lifetime}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
export function validReviewSession(token: string, secret: string, time = Date.now()) {
  if (secret.length < 32 || !/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, nonce, mac] = token.split(".");
  if (Number(expires) <= time || Number(expires) > time + lifetime) return false;
  const expected = createHmac("sha256", secret).update(`${expires}.${nonce}`).digest();
  return timingSafeEqual(expected, Buffer.from(mac, "hex"));
}
const attempts = new Map<string, { count: number; until: number }>();
const page = (error = "") => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Renewal Studio · Private review</title><style>body{margin:0;background:#f6f6f3;color:#171917;font:16px system-ui;display:grid;min-height:100dvh;place-items:center}main{width:min(360px,80vw);padding:32px;border:1px solid #ddd;background:white;border-radius:16px}h1{font-size:28px}p{line-height:1.6;color:#535853}label{display:block;margin:24px 0 8px}input,button{box-sizing:border-box;width:100%;padding:14px;border:1px solid #aaa;border-radius:8px;font:inherit}button{margin-top:16px;background:#6CC14C;color:black;border:0;font-weight:650;cursor:pointer}input:focus-visible,button:focus-visible{outline:3px solid #254b19;outline-offset:3px}.error{color:#922}</style><main><h1>Renewal Studio</h1><p>This workspace is a private review. Enter the password shared with you to continue.</p>${error ? `<p class="error" role="alert">${error}</p>` : ""}<form method="post" action="/unlock"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256" autofocus><button>Open workspace</button></form></main></html>`;

/** Runs before the application, including static files, downloads and error routes. */
export async function reviewGate(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const secret = process.env.REVIEW_COOKIE_SECRET || "";
  const encoded = process.env.REVIEW_PASSWORD_HASH || "";
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  // Native form POSTs under no-referrer send Origin: null in browsers. Keep
  // same-origin form submissions verifiable without sending referrers off-site.
  res.setHeader("Referrer-Policy", "same-origin");
  if (secret.length < 32 || !encoded) {
    res.statusCode = 503;
    res.end("Private workspace is not configured.");
    return false;
  }
  const path = new URL(req.url || "/", "https://review.invalid").pathname;
  const cookie = req.headers.cookie?.split(";").map(x => x.trim()).find(x => x.startsWith(`${REVIEW_COOKIE}=`))?.slice(REVIEW_COOKIE.length + 1) || "";
  const signedIn = validReviewSession(cookie, secret);
  const sameOrigin = req.headers.origin === `https://${req.headers.host}`;
  if (path === "/unlock" && req.method === "POST") {
    if (!sameOrigin || !String(req.headers["content-type"]).startsWith("application/x-www-form-urlencoded")) {
      res.statusCode = 403; res.end("Origin denied"); return false;
    }
    const ip = String(req.headers["x-vercel-forwarded-for"] || req.socket.remoteAddress || "unknown");
    const time = Date.now();
    for (const [key, value] of attempts) if (value.until < time) attempts.delete(key);
    const attempt = attempts.get(ip) || { count: 0, until: time + 15 * 60000 };
    if (++attempt.count > 10 || attempts.size > 10000) {
      res.statusCode = 429; res.setHeader("Retry-After", "900"); res.end("Too many attempts. Try again in 15 minutes."); return false;
    }
    attempts.set(ip, attempt);
    let body = "";
    for await (const chunk of req) {
      body += chunk.toString();
      if (body.length > 4096) { res.statusCode = 413; res.end("Request too large"); return false; }
    }
    const password = new URLSearchParams(body).get("password") || "";
    if (passwordMatches(password, encoded)) {
      attempts.delete(ip);
      res.setHeader("Set-Cookie", `${REVIEW_COOKIE}=${signReviewSession(secret)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`);
      res.statusCode = 303; res.setHeader("Location", "/"); res.end(); return false;
    }
    res.statusCode = 401; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(page("That password didn’t match. Please try again.")); return false;
  }
  if (signedIn && path === "/api/auth/logout" && req.method === "POST") {
    if (!sameOrigin || req.headers["x-studio-request"] !== "1") { res.statusCode = 403; res.end("Origin denied"); return false; }
    res.setHeader("Set-Cookie", `${REVIEW_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`);
    res.setHeader("Content-Type", "application/json"); res.end('{"ok":true}'); return false;
  }
  if (signedIn) return true;
  res.statusCode = path.startsWith("/api/") ? 401 : 200;
  res.setHeader("Content-Type", path.startsWith("/api/") ? "application/json" : "text/html; charset=utf-8");
  res.end(path.startsWith("/api/") ? '{"error":"Enter the workspace password to continue."}' : page());
  return false;
}
