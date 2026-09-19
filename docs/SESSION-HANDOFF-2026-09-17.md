# Session handoff — Renewal Campaign Studio

Date: 2026-09-17

## Canonical product workspace

There is one user-facing local app and one data store:

- URL: `http://127.0.0.1:8787`
- Start command: `PORT=8787 DATA_DIR=.runtime SERVE_BUILD=true APP_ENV=development DEV_AUTH=true npm run dev`
- Data directory: `.runtime`
- Primary route for created ads: `http://127.0.0.1:8787/#/ads`

Do not use or present port `8788` as the product. A separate QA run previously used a copied database and produced synthetic records such as “QA remix.” It is not the customer workspace and must not be merged into `.runtime`.

## What is currently in the real workspace

- Renewal by Andersen company workspace and local development identity.
- 426 catalog sources; 420 originals stored after Drive intake.
- Brand system v2 with Renewal Green `#6CC14C`, mapped logo artwork, and supplied source fonts.
- Campaign: **October 2026 Fall Savings**.
- Offer v1: buy five windows and save $1,000, or buy ten and save $3,000; valid before 10/31/2026.
- Official legal disclaimer is still pending; current October creatives are internal drafts only.
- Ads Library route (`#/ads`) lists all private creatives, sorts October campaign work first, and shows source-image thumbnails or a truthful no-source placeholder.
- Recommended draft: **October 2026 Fall Savings · Clean lifestyle draft** (`af5a692a-5f4c-4916-b90e-595e71e7c6bc`).
- Historical-image draft uses baked-in `40% OFF` artwork and must not be treated as an October-ready ad.

## Important product decisions

- CRM outcomes are out of scope and must not be restored.
- Templates are deferred for now; do not prioritize them over campaign/creative work.
- No ad is publish-ready until the official legal disclaimer is supplied and reviewed.
- GPT Image / Seedance generation remains provider-authentication and billing dependent; do not submit paid generation jobs without explicit action-time confirmation.

## Recent implementation changes

- Added Ads Library navigation and page for all company-created static/video creatives.
- Added current-campaign-first sorting and visual source thumbnails.
- Added explicit “No source image selected” state instead of broken image icons.
- Campaign workspace now displays the saved current offer text, not only its version number.
- Added AVIF/DOCX intake handling improvements in `server/assets.ts`.
- Standardized local Vite/config origin handling on port 8787; removed 8788 from runtime API origins.

## Verification

- `npm run build` passes.
- `git diff --check` passes.
- Canonical Ads Library and the recommended October Static Studio document load from `.runtime` when the canonical server is running.
- Full `npm test` has one HTTP integration failure in this sandbox because test-time socket binding is denied; do not report the suite as fully green without rerunning in a normal local terminal.

## Next session checklist

1. Start only the canonical command above.
2. Open `http://127.0.0.1:8787/#/ads` in the user’s actual Chrome window.
3. Verify the October cards and open the clean lifestyle draft.
4. Do not navigate to or create a second QA data directory/port.
5. Obtain the official legal disclaimer before approving or exporting October ads.
6. Continue with preview/review and video/AI generation only after explicit confirmation of any billable provider action.
