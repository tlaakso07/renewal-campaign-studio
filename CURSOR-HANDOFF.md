# Cursor + Codex implementation handoff

September 15, 2026

## Current engineering entry point

The local application now exists. Read [handoff.md](handoff.md) for the latest complete checkpoint and private hosting direction. Start with [the active delivery queue](docs/BUILD-EXECUTION.md), [implementation status](docs/IMPLEMENTATION-STATUS.md), [verification evidence](docs/VERIFICATION.md) and [the runnable walkthrough](docs/WALKTHROUGH.md). The original scope below remains authoritative. Complete missing sections in connected, tested increments; every handoff must identify what works, what remains and the next concrete implementation step. Do not restart foundation work or treat a completed slice as a finished product.

## Latest user decision

We currently work with Renewal and have its assets. Use those for a working prototype now. Ryan has not supplied the future launch company's brand pack. Another company launches first, and the platform will be configured for it later. Do not spend another planning turn asking for that company or wait for its materials.

The immediate deliverable is software that works through a real campaign, not another image gallery. Implement the retained product scope in demonstrated, persistent vertical slices. **September 17 scope update:** CRM outcomes are no longer part of the product; do not restore a CRM destination, import path or CRM-derived reporting from the older material below.

## Starting prompt to paste into Codex in Cursor

> Read AGENTS.md and CURSOR-HANDOFF.md, then the linked build plan, implementation contract and acceptance matrix. Build the working Company Campaign Studio using Renewal by Andersen as the prototype brand. Another company will launch later; do not wait for its materials. Preserve the approved assistant-first design and company-specific branding. Start with a runnable, persistent foundation and a real asset → campaign → editable static → download path, then continue through assistant tools, video/UGC, remix/library, reporting/Meta, community/Classroom and operator/account workflows. CRM outcomes are not in scope. Use the 22 concepts as visual references, not images standing in for app screens. Import actual supplied assets through authorized access. Verify provider APIs before enabling models. Keep demo data and development adapters unmistakably separate from live services. Record routine stack decisions, add reproducible setup and meaningful tests, and keep building without repeated permission requests. When external credentials or access are required, identify that precise dependency and continue all unblocked work. Do not claim the complete product works until the acceptance matrix is demonstrated.

## Read order and source map

| Need                                           | Source                                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Product scope and shared architecture          | [BUILD-PLAN](product/BUILD-PLAN.md)                                                                                                |
| Eight connecting workflows                     | [WORKFLOWS-AND-RESULTS](product/WORKFLOWS-AND-RESULTS.md)                                                                          |
| Rendering, operations and integration details  | [IMPLEMENTATION-CONTRACT](product/IMPLEMENTATION-CONTRACT.md)                                                                      |
| Evidence required to call features working     | [ACCEPTANCE-MATRIX](product/ACCEPTANCE-MATRIX.md)                                                                                  |
| Home, memory and agent tool behavior           | [COMPANY-ASSISTANT](product/COMPANY-ASSISTANT.md)                                                                                  |
| Shared ads and media model discovery           | [SHARED-LIBRARY-AND-MODELS](product/SHARED-LIBRARY-AND-MODELS.md)                                                                  |
| Metric calculations and attribution            | [CREATIVE-INSIGHTS](product/CREATIVE-INSIGHTS.md)                                                                                  |
| Meta authorization, sync, disconnect           | [META-CONNECTION](product/META-CONNECTION.md)                                                                                      |
| Feed, lesson player, content operations        | [COMMUNITY-AND-CLASSROOM](product/COMMUNITY-AND-CLASSROOM.md)                                                                      |
| Approved visual direction                      | [22-screen gallery](product/ui-concepts/index.html)                                                                                |
| Renewal original-file intake manifest          | [catalog.json](library/renewal-by-andersen/catalog.json)                                                                           |
| Brand sources and exact values                 | [Brand notes](library/renewal-by-andersen/BRAND-SYSTEM-NOTES.md), [brand-rules.json](library/renewal-by-andersen/brand-rules.json) |
| Candidate models, all disabled until verified  | [model-inventory.json](product/model-inventory.json)                                                                               |
| Fictional analytics fixtures                   | [Analytics](product/ui-concepts/analytics-demo-data.json), [workflow states](product/ui-concepts/workflow-demo-data.json)          |
| What the final audit did and did not establish | [FINAL-HANDOFF-AUDIT](product/FINAL-HANDOFF-AUDIT.md)                                                                              |

## Implementation order

1. **Runnable foundation:** choose stack and record an architecture decision; app shell, persistent database/migrations, company identity and membership, versioned theme/brand, private storage, local setup, environment example and test harness. Use a synthetic second test company to check boundaries; the future real customer is not needed.
2. **Real intake and static slice:** import a representative official logo, approved font and product photos first; maintain resumable intake for the full 424-file inventory, including unsupported originals. Create/duplicate campaign, save offer versions, edit actual layered static compositions, adapt requested placement sizes, export image + copy + manifest, reopen and revise after restart.
3. **Assistant:** persistent conversations, company-source retrieval and cited answers; bounded tools operate the same campaigns/assets/documents/jobs. Show working outputs and failures truthfully. It must not be a separate mock chat.
4. **Video and UGC:** source footage, scripts/storyboards, scene editing, real provider adapters, presenters/voices where available, captions and branding, audio mix, durable render jobs, playback and download. Include partial failure and single-scene retry. Static-only is not the completed prototype.
5. **Templates, remix and discovery:** original reusable layouts/styles, full catalog with verified availability, shared published references, source/evidence detail, private branded remixes. Complete library administration alongside client browsing.
6. **Measurement:** deterministic ad-performance report import and account data model, Meta authorization/account selection/sync, exact creative mappings, ad details and the next variation. Begin Meta developer configuration early since access review is an external dependency. Report import is a fallback, not a claim of live Meta connection.
7. **Community and learning:** persistent posts/comments/polls/reactions, moderation, platform/private lessons and original lesson content, player/resources/archives. No fake member activity or copied competitor course content.
8. **Operations and release readiness:** company setup console, invitations, usage reconciliation, configurable subscription and retention policy, support, deployment/rollback/backups and cross-company checks. Implement each prerequisite as needed earlier; this stage closes the remaining operations work.

## Dependencies to surface without blocking independent work

| Dependency                                                | Needed for                             | Work that can continue                                                              |
| --------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| Authorized access to supplied Drive originals             | Actual asset import                    | Catalog indexing, import queue, upload alternative, schema, editor and error states |
| Provider account/API credentials and verified model IDs   | Real reasoning/image/video/voice calls | Adapters, document renderer, real-asset compositions, queue and failure tests       |
| Meta developer app and authorized test account            | Real authorization and report sync     | Account UI, metric service, import mapping and integration contracts                |
| Real ad-performance source reports                        | Actual performance claims              | Deterministic fixtures explicitly labeled test data and importer validation         |
| Payment account and agreed commercial settings            | Paid subscriptions                     | Usage ledger, configurable entitlements, test billing adapter and account screens   |
| Hosting/domain choices and transactional delivery service | External deployment/invites            | Local operation, authentication contracts, templates and deployment runbook         |

Keep external access in environment/configuration. Never reuse the Codex session's tools or a browser sign-in as an assumed permanent backend capability. Availability in this assistant environment does not grant the future web application a provider API.

## Design interpretation

The central assistant Home is the approved entry, not a dense KPI dashboard. Insights has its own destination. Each company receives a theme through configuration; the client sees its own company, while platform staff have a separate company-management console. Preserve native provider logo colors.

All primary screens need empty, loading, ready and error states; studio work also needs unsaved/conflict, partial, failed and canceled states. The 22 raster images show representative arrangements rather than every route, dialog or responsive size. Use the written specifications for behavior and exact brand sources for production assets.

## Deferred decisions

Real launch customer/brand pack, prices/allowances, target volume, exact quality/latency/cost targets, subscription-end retention, and launch deployment requirements remain open. None prevents building the Renewal prototype. Use visible configuration and documented provisional choices, not invented commercial promises.

Direct publishing/scheduling, ad-budget changes, live community Chat/DM, referral programs, specialty Zuops tools, advanced bulk/carousel/localization and calibrated numerical forecasts remain expansion scope unless the user changes it. CRM outcomes are explicitly excluded. Basic placement adaptation, video/UGC, Feed/Classroom, shared discovery and real analytics are already core.
