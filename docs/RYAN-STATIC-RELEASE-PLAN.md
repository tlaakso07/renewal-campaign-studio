# Plan: let Ryan make static ads on the hosted review

Written 2026-09-21. Status: **not started.** Trevor must say "go" before any deploy or cloud-state change.

## Where things stand

- `main` on GitHub = `static-ai-generator` (fast-forwarded 2026-09-21, commit `57bf595`). Build and all 32 tests pass.
- Pushing `main` does NOT deploy. The Vercel project `renewal-campaign-studio` has no Git link; releases are manual CLI deploys. The live production deploy is from 2026-09-17, before the static generator existed.
- Ryan's hosted review runs on a separate cloud snapshot in private Vercel Blob (`REVIEW_STATE_KEY`). Per `docs/VERCEL-REVIEW.md` it was initialised with one campaign and seven originals. It does not have the brand kit that `scripts/renewal-ads-setup.ts` wrote into local `.runtime`: Franklin Gothic font files, reverse logo, 21 `styleReferences`, ad photo pools. The live snapshot has not been read to confirm this.
- Without the kit, `adBatchPayload` (`server/services.ts`) still runs but sends only the logo. That is not the client-approved quality.

## Steps

1. Deploy `main`: `vercel deploy --prod --scope tlaakso11-3399s-projects`. Keep deployment protection, share link and password unchanged.
2. Build a fresh review snapshot from local `.runtime` with `scripts/prepare-review.ts <source> <new-destination> --upload` under a NEW state key. It refuses an existing destination or cloud state by design. Needs `BLOB_READ_WRITE_TOKEN` in the process environment. Never copy the development `.env` to Vercel.
3. Point `REVIEW_STATE_KEY` at the new key, redeploy, verify database integrity and file checksums.
4. Verify on the hosted site with one real 4-ad Create batch (paid, about $0.32 to $0.50). Ask Trevor before spending.

The old cloud state stays in Blob, so step 2 can be undone by switching `REVIEW_STATE_KEY` back.

## Decisions Trevor has not made yet

- Anything Ryan saved in the current hosted review will not appear in the new snapshot (it stays recoverable in storage). OK?
- Ryan's generations bill Trevor's Vercel AI Gateway balance (about $19 on 2026-09-19). Each batch asks for confirmation.

## Risk check — 2026-09-21 (code read, no cloud change)

- **Creator role can Generate:** yes. `/api/ads/generate` gates only on `creator()`, which accepts `owner` and `creator`. Usage allowance 50/200 used.
- **Snapshot carries the brand kit:** yes. All 67 kit assets (2 logos, 9 fonts, 21 style references, 18 scene photos, 11 cutouts, 6 video-kit photos) have rows and files, all matching the script's path pattern. The type specimen does not exist locally for brand rev 7; the Generate route builds it on first use and the request commit uploads it. Fixed: `prepare-review.ts` now keeps `recording` records too (Ryan's Classroom orientation recording would have been dropped). Build and 32 tests pass. Franklin Gothic rendering on hosted is approved (Trevor, 2026-09-21); the older "not approved" note in VERCEL-REVIEW.md is superseded.
- **GPT Image on hosted:** code path is sound (OIDC from request context at call time, jobs run under `waitUntil` from the `/api/jobs` poll, 800s limit covers a 4-image batch). Two things only a live run confirms: the Vercel team must hold paid AI Gateway credits (the Sept 17 403 was for missing credits), and OIDC inside `waitUntil` is untested. Fallback if it fails: set `AI_GATEWAY_API_KEY` in Vercel (cloud change, ask first).
- **Blocker found by dry run:** the local `.runtime/objects/renewal` folder is **8.9 GB** (five real footage files of 320–470 MB each) and the Mac has about 560 MB free, so step 2 fails with `ENOSPC`. Options: free 10+ GB before running, or write the destination to an external drive. Everything in `.runtime` is referenced, so nothing can be trimmed by the script without changing what it copies.
- Video studio ships in this deploy; frames and voice bill the Gateway balance, Animate fails on hosted (no Higgsfield key). Accepted.

## Open risks to check during step 4

- The hosted login is a `creator` role, not owner. Not confirmed that this role may call the ad-batch Generate route (`server/index.ts`, near the `queueJob(req.actor, "generation", ...)` call).
- Hosted image generation uses Vercel OIDC, not `AI_GATEWAY_API_KEY`. Not yet live-tested on the hosted deploy for GPT Image.
- `prepare-review.ts` keeps only record kinds `brand, campaign, creative, entitlements, lesson`. Confirm the brand kit assets and the type specimen survive the copy.

## Rules

- One agent touches production and the Blob state. No parallel deploys.
- Confirm with Trevor before every paid step and before every production change.
- Never commit `.env*`, `.runtime`, `.vercel`, or generated private outputs.
