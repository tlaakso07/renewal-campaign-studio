# Company Campaign Studio — Renewal prototype

A working **local development prototype** using actual supplied Renewal by Andersen assets. React/TypeScript, Express, SQLite, private local media storage, a separate render worker, Sharp and FFmpeg. This is not yet the complete product or a hosted customer release.

**Private hosted review is now available:** [Vercel workspace](https://renewal-campaign-studio-tlaakso11-3399s-projects.vercel.app). Ryan's share link and password are in the ignored `.runtime/Ryan-review-email.txt` file. See [hosted review status and operations](docs/VERCEL-REVIEW.md). This is a separate editable review copy; it does not synchronize changes back to the local workspace.

**Open the running app:** <http://127.0.0.1:8787> and select **Alex · Renewal**. The separate **Local operator** identity opens Company setup. The synthetic **Cedar Home · Test company** workspace exercises company isolation.

- [Current engineering handoff](handoff.md)
- [Five-minute walkthrough](docs/WALKTHROUGH.md)
- [Current implementation and acceptance status](docs/IMPLEMENTATION-STATUS.md)
- [Verification evidence](docs/VERIFICATION.md)
- [Architecture](docs/ARCHITECTURE.md)

## Run locally

Prerequisites: Node **24** (`.nvmrc` pins the tested 24.11.1), npm, `ffmpeg`, `ffprobe`, and `pdftoppm` on PATH. Rendering uses Arial on macOS or DejaVu Sans on Linux until a permitted source font is mapped. The imported Franklin Gothic font is retained privately; its presence does not establish webfont permission.

For a fresh checkout, from this directory:

```sh
npm ci
# Create local configuration only if it does not already exist.
test -f .env || cp .env.example .env
npm run migrate
npm run seed
npm run intake
npm run dev
```

Open <http://127.0.0.1:8787>. `npm run dev` starts both web server and the single local worker. If the prototype is already running, use it rather than starting a second worker. Stop the command with Ctrl+C.

`seed` is idempotent and creates explicit development identities, two workspaces, eight original written guides, and all 424 source ledger entries. It does not fabricate campaigns, performance metrics, recordings or community activity. Existing legacy guide titles are upgraded in place with version history. `intake` imports a representative seven-file subset and maps the official logo/font when available. Drive access failures stay visible; authorized original uploads are an alternative. The complete inventory can be processed with `npm run intake -- --all`; this can transfer substantial media and is not required to review the prototype.

The company assistant uses Vercel AI Gateway when server-side authentication is available. Vercel deployments receive project OIDC automatically; local development can set `AI_GATEWAY_API_KEY` in the private `.env`. `ASSISTANT_MODEL_ID` defaults to the verified `openai/gpt-6-astra` route. Without either authentication method, the app clearly falls back to its deterministic local workspace guide.

To create the labeled awareness exercise after the assets are imported, run this in another terminal while the worker is running:

```sh
npm run exercise
```

This queues three distinct statics and 15-/30-second real-footage walkthroughs. It creates no current discount offer, performance claim, generated presenter or testimonial.

## What works

- Campaigns, immutable offer versions, editable static layers/crops, autosave, undo/redo and version restore.
- Real-footage/image video assembly, scene replacement, captions, source-audio controls, timed recorded voice/music inputs, optional music ducking and branded end cards.
- Persistent jobs, partial failures, scene cache reuse, cancellation/retry, PNG/MP4 and ZIP downloads with exact copy and manifests.
- Company-scoped data/files, local identity, invitations, membership revocation and last-owner protection.
- Validated CSV ad-performance imports, weighted metrics, reviewed creative matching and private variation briefs.
- Feed discussions/replies with versioned editing, reasoned moderation, sanitized direct image/video or published-ad attachments, safe URL/mention links, an opt-in directory, scoped events and preference-aware notifications; explicit shared derivatives/remix; searchable Classroom guides, content administration, private resources, archives and playback resume; operator setup and independent interface theme versions.

The assistant keeps all application writes in the same deterministic services and uses the Gateway only for open-ended responses grounded in eligible workspace data. The protected hosted review now receives request-scoped Vercel OIDC and exposes the Astra route, but live inference remains unavailable until the Vercel team purchases paid AI Gateway credits; adding a payment method alone still returned the model's free-tier 403. Generated media/presenters, Meta and payment services are **not connected**. Development authentication is rejected in production. The hosted Classroom has eight platform guides plus one company-private owned orientation recording and PDF resource.

Current saved Renewal workspace: **7 imported source originals plus 2 company-private training assets, 417 other catalog entries awaiting import, 1 awareness campaign, 4 static documents, 2 video documents, and 6 completed renders**. Later edits create new document versions; older downloads remain unchanged.

## Checks

```sh
npm run check
```

This builds the client/type-checks the code and runs 23 tests using isolated temporary databases. HTTP tests need permission to bind/connect to a local test port. Tests include tenant denial, stale edits, malformed uploads, render/usage idempotency, scene failure recovery, report reconciliation, invitation replay/revocation, theme separation, Community privacy/notification/event boundaries, request-scoped OIDC detection, unpublished/private training and backup restoration.

## Backup, restore and local rollback

Keep `.runtime`, backups and `.env` private. Database backups include user/session/password-hash records; `.env` is not copied. Stop the web server and worker before backing up the actual workspace so the database and objects are consistent.

```sh
npm run backup -- .runtime/backups/manual-2026-09-16
npm run restore -- .runtime/backups/manual-2026-09-16 .runtime/restored-2026-09-16
```

Use new directory names each time: both commands reject an existing destination. Restore checks SQLite integrity. To inspect a restored workspace, stop the existing app and run `DATA_DIR=.runtime/restored-2026-09-16 npm run dev`. Returning to `npm run dev` uses the original configured data directory. Never merge two SQLite files or point concurrent workers at the same data directory.

Restoration was tested against an isolated persisted workspace with byte-for-byte media checks. A hosted recovery plan, off-device backup schedule, schema downgrade and deployment rollback are still required before launch.

## Product package and original research

Requirements remain in [AGENTS.md](AGENTS.md), [CURSOR-HANDOFF.md](CURSOR-HANDOFF.md), [build plan](product/BUILD-PLAN.md), [implementation contract](product/IMPLEMENTATION-CONTRACT.md) and [acceptance matrix](product/ACCEPTANCE-MATRIX.md). Handoff statements that no app exists describe the pre-implementation state; the status document records current evidence.

The 22 raster concepts, Drive-linked catalog, brand research and fictional analytics fixtures are preserved. They are separate from the application and actual measured results. The concept gallery can still be served with `python3 -m http.server 8766 --bind 127.0.0.1 --directory product` at `/ui-concepts/index.html`. Do not serve the repository or private runtime directory publicly.

Remote source and deployment state are recorded in [handoff.md](handoff.md). The protected review is deployed, but individual production identity, scalable persistence/queues, operational backups and other launch requirements remain before a customer release.
