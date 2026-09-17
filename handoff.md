# Renewal / Company Campaign Studio — complete engineering handoff

Updated September 17, 2026. This is the current entry point for continuing the project. Preserve the original requirements and research. The user wants all missing product areas completed, clear engineering direction at every milestone, a private GitHub repository, and a private Vercel deployment.

## Latest local milestone — September 17

**AI model identity and logo milestone — delivered:** sourced and stored checksum-pinned official marks for Google Gemini/Veo, OpenAI, ByteDance Seed, Kling AI, Alibaba Wan, MiniMax, Black Forest Labs and Anthropic Claude. Nineteen of the 21 observed catalog labels now display a verified provider mark. Provider-name search and the Assistant filter work across the complete registry, Sora 2 is visibly retired, and all models remain disabled until a real adapter and access are configured.

**Evidence:** production build and all **21 tests pass**, including a new registry/provenance checksum test. Connected Chrome shows all 21 cards, the official marks, provider status, the four-entry Assistant filter and provider-name search. **Happy Horse 1.1** remains provider-unverified; **Zuops** remains a competitor platform reference rather than a provider model. Neither receives a fabricated logo.

**Remaining:** verify the unresolved Happy Horse identity and the exact version/tier labels for WAN 3.0, WAN 3.0 Prime, Seedance 2 Mini, Hailuo 3 and Gemini Omni 1.1 Flash before enabling them. No live image, video or reasoning provider adapter is connected.

**Next:** select the first production provider path, verify its current endpoint/capabilities and account access, then implement one real job adapter with durable output storage and failure/retry coverage.

**Latest polish release:** `6694fd1`, deployment `dpl_3tQEzVxpJStzB31XXG387Qr9Rxyd`, removes two decorative studio/Classroom label borders. Both design-hook findings fixed; none suppressed. Build, Chrome checks and hosted asset/access verification pass.

**Workspace design follow-up:** extended the approved Renewal-green glass treatment across all workspace pages, including campaign briefs, static/video editors, template/model cards, reporting, assets, community, Classroom and Settings. Desktop/mobile route checks, tablet detail checks, build and all 20 tests passed. No stored client data or creative output geometry changed. See [workspace design and evidence](docs/WORKSPACE-DESIGN.md). Pushed and deployed as `35e1a79`, deployment `dpl_AUKMRHxe9p8f3WermRrZEt14zUZe`; existing access, built-asset checksums and saved cloud data verified. Release evidence is recorded in VERCEL-REVIEW.md.

**Release update:** this milestone is now pushed and deployed to Ryan's existing private review. Code commit `7936a41`; deployment `dpl_BjyFC1bR6Y7v2QQCDuLkhX3TqsNS`. Existing share link/password verified, saved cloud data retained, client/logo checksums matched, build and all 20 tests passed. This supersedes the local-only notes below. See [hosted release evidence](docs/VERCEL-REVIEW.md#september-17-release).

**Home design follow-up:** applied the user's second Zuops reference to Home using Renewal green, black/gray text, a refined assistant composer, compact toolkit pills and six featured model cards. Official OpenAI, Gemini, Veo and ByteDance artwork is stored locally with checksums/provenance; the six identities and descriptions were checked against provider sources. All generation remains disabled. Cards open a filtered catalog and retain the search on reload; Remix now links to its dedicated flow. Build and Chrome desktop/390px checks passed, with all six logos loaded and no mobile horizontal overflow. Local only. See [Home design and logo sources](docs/HOME-DESIGN.md).

**Sidebar design follow-up:** implemented the user's Zuops reference with a Renewal Green outlined active pill, diffused green glow, translucent white sidebar/account surfaces and consistent thin outline icons. Group chevrons now collapse/expand sections; the active route is revealed when navigating. The user clarified that the sidebar glow must use Renewal green; black selected labels/icons retain brand contrast. Build passes; Chrome checked at desktop and 390px, including keyboard group toggling, active Home/Classroom/Settings and mobile route selection. Local only, not deployed. Design details: [sidebar reference treatment](docs/SIDEBAR-DESIGN.md).

**Delivered:** connected Chrome walkthrough for discovery → private remix → PNG → export selection and CSV import → exact mapping → performance → variation. Fixed lost reporting filters/evidence scope, stale mapping form state and the performance breadcrumb. Added persistent Feed filters, discussion dialog/full-page links, replies, author comment edits, reversible removal and moderator restoration boundaries.

**Evidence:** build and **20 tests pass**. Browser-tested replies/edit/remove/restore, counts, Escape focus return and full-page reload. Selected PNG/MP4 ZIP verified over authenticated HTTP with matching media hashes; Chrome itself blocked the download navigation. Synthetic test data lives only in an ignored isolated QA copy. See [September 17 verification](docs/VERIFICATION-2026-09-17.md).

**Remaining:** broader CRM/video/mobile/accessibility walkthroughs, advanced reporting reconciliation, Community attachments/notifications/directory/events and full moderation, Classroom content/resources/archives, live integrations and customer-release operations. No complete acceptance row is newly declared passed.

**Next:** Classroom content administration and scoped resources/archives, followed by player/resume checks. Local code is uncommitted and has not been deployed to Ryan's review. Older implementation/test counts below are historical; the next section remains authoritative for the existing hosted review.

**Latest deployment checkpoint:** a working private review for Ryan is now hosted on Vercel. Read [docs/VERCEL-REVIEW.md](docs/VERCEL-REVIEW.md) first for its URL, architecture, actual verification, access-file locations and remaining limits. It supersedes the pre-deployment blocker/proposal at the bottom of this handoff for the private review only. The full product/customer launch remains unfinished. No paid dedicated backend was provisioned; the review uses the existing private Vercel Blob store and protected Functions.

## Start here

Read AGENTS.md, this file, CURSOR-HANDOFF.md, product/BUILD-PLAN.md, product/WORKFLOWS-AND-RESULTS.md, product/IMPLEMENTATION-CONTRACT.md and product/ACCEPTANCE-MATRIX.md. Read the corresponding feature specification before changing a module.

- [Active delivery order and handoff rules](docs/BUILD-EXECUTION.md)
- [Detailed status against A01–A23](docs/IMPLEMENTATION-STATUS.md)
- [Actual verification evidence](docs/VERIFICATION.md)
- [Walkthrough](docs/WALKTHROUGH.md)
- [Local setup and backup/restore](README.md)
- [Architecture](docs/ARCHITECTURE.md)

Renewal by Andersen is the prototype company, with actual supplied source assets. A future customer's assets are not required to continue. The local application works, but the full product and hosted release are not complete. Do not turn a passing narrow test into a claim that a complete acceptance row passes.

## Latest user direction

Finish all gaps previously identified: dedicated remix; richer Winning Ads discovery/evidence; performance detail and review/forecast states; Meta account selection/history/sync; CRM report mapping and business outcomes; scripts/storyboards/generated video/presenters/voices; community profiles/events/threads; Classroom recordings/resources/archives/content administration; campaign exports; account setup/recovery/lifecycle/billing; broader assistant/model/asset discovery.

Every milestone handoff must state **Delivered → Evidence → Remaining → Next**, with a concrete next action and continued unblocked work. Do not stop at attractive nonworking screens. Do not ask again for routine reversible implementation choices. Keep missing code separate from missing credentials.

## What is implemented locally

| Area             | Actual delivered behavior                                                                                                                                                           | Important limits                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation       | React/TypeScript client, Express API, persistent SQLite records/versions, private local objects, isolated workspaces, roles and local sessions                                      | Development identity is explicitly opt-in; hosted production startup is rejected                                                         |
| Campaigns        | Create/duplicate, current offer and exact terms, immutable offer versions, historical documents and affected creatives                                                              | Complete lifecycle/date/expiry review remains                                                                                            |
| Static Studio    | Actual imported photos/logo, editable copy/crop/geometry, undo/redo, autosave/conflict/history, placement adaptation, PNG render                                                    | Broader layout/overflow/placement review; source font permission unresolved                                                              |
| Video            | Real images/footage, stable scenes, duration/trim/captions, source audio and recorded voice/music inputs, branded end card, MP4/SRT; partial-scene caching/retry                    | Generated media/presenters/voices are unavailable; further audio/ducking/crash testing remains                                           |
| Storyboard       | Script, commercial/product/UGC direction, narration/shot notes, timeline, explicit one-line-per-scene caption application                                                           | Direction text does not synthesize speech or presenters                                                                                  |
| Jobs/downloads   | Persistent queue and usage reservations, cancel/retry, scoped PNG/MP4/ZIP/copy/manifests/captions                                                                                   | Local single-worker process, not a deployed distributed queue                                                                            |
| Campaign export  | Exact campaign/render-version selection; pending/canceled/missing outputs visibly excluded; unrendered latest versions link to studios                                              | New browser walkthrough and broader batch/format cases remain                                                                            |
| Discovery/remix  | Reference search, media/industry/evidence filters, private bookmarks/collections, source/usage detail; explicit private remix with destination campaign/assets/brand/terms; lineage | Rich evidence curation/taxonomy/correction still incomplete; no verified result records seeded; uploaded references use manual direction |
| Reporting        | Validated idempotent CSV import, visual column mapping, deterministic weighted metrics, exact-version ad matching, saved filters, ad detail and compatible prior-period comparison  | No actual client reports seeded; advanced grouping/filtering and complete attribution/cohort reconciliation remain                       |
| CRM              | Stable source lead/job IDs, unique qualification/appointment/job counts, canceled/conflicting job handling, missing revenue, separate currencies/revenue bases, unmatched leads     | Full acquisition-cohort costs/ROAS and conversion-lag reconciliation are unfinished                                                      |
| Review/variation | Deterministic document-readiness rubric, explicit insufficient-data forecast, evidence-bearing private variation brief with current brand/offer                                     | Not AI scoring; no validated numerical forecast or industry benchmark                                                                    |
| Assistant/models | Persistent personal conversations, deterministic guide invoking real application services, full observed registry unavailable until verified                                        | No live reasoning/media provider adapter; broader retrieval, tools, streaming/cancel remain                                              |
| Community        | Persistent posts/comments/polls/reactions, audiences/private drafts, reports/removal; explicit copied shared final derivatives                                                      | Rich threads/attachments/mentions/follows/notifications, directory/events and complete moderation remain                                 |
| Classroom        | Original written guides, eligible catalog/search/category, private/draft access checks, playback/resume code                                                                        | Recordings/resources/archives and complete content editor/player validation remain                                                       |
| Operator/account | Staff company creation, independent versioned theme, invitations/revocation/last-owner protection, usage/entitlements, lesson/publication basics                                    | Hosted identity/recovery/email, billing/lifecycle/support/retention/deployment remain                                                    |

## Latest verification

- `npm run build`: successful TypeScript and Vite build.
- `npm test`: **16 passed, 0 failed**, isolated temporary databases, including HTTP session/CSRF/invitation/role boundaries.
- Evidence includes immutable offers, targeted edits, true renders/manifests, usage idempotency, partial-scene failure/recovery, backup/restore byte checks, company/personal privacy, safe shared composition metadata, remix transaction rollback, exact export versions, CSV header validation, missing measures, unique CRM job revenue and targeted storyboard persistence.
- Earlier browser evidence: static creation/render/download and autosave across reload; actual 30-second MP4 playback; ZIP integrity; original module routes; Home at 390px without overflow.
- **New discovery/remix/export, mapping/detail/CRM/review and storyboard screens still require a full connected browser walkthrough.** The earlier browser evidence does not cover them.
- No live AI, presenter, Meta, payment or production authentication evidence. No real performance claim is made.

## Saved local data and repository boundaries

Last read-only verification: 424 catalog ledger entries; **7 imported originals and 417 awaiting import**. Seven originals and six completed outputs matched stored SHA-256 checksums. SQLite integrity was `ok`. Existing awareness exercise: one campaign, four static documents, two real-footage video documents, six renders. Actual video durations were 15.021333 and 30.021333 seconds, square 1080 H.264/AAC. The samples mute source audio; an AAC stream is not proof of narration.

The seven originals are the official AI logo, a Franklin Gothic font original, three product/home photos and two actual MOV clips. Catalog/provenance remain in `library/renewal-by-andersen/`; imported bytes and all working company data are in ignored `.runtime/`.

Source control includes application/server/scripts/tests, lockfile, specifications, 22 raster concepts, catalogs/brand rules and research. Raster concepts are references, not the app. **Do not commit `.env`, credentials, session databases, `.runtime`, generated private outputs, backups, dependencies or local assistant/browser state.** Those remain on this machine, not in GitHub. Use the documented private backup/restore process for actual campaign data; a Git push is not a runtime-data backup.

## Preserved product decisions

- One codebase, isolated company workspaces; interface theme and creative design-system versions are independent.
- Assistant-first Home, then model/shared-ad discovery; dedicated studios remain available.
- Static/video/UGC, real and generated media, templates/original/remix, targeted edits and version history are core.
- Company enters its current monthly offer; immediate creator downloads, no agency/manager approval gate.
- Client owns created content as a product requirement; public sharing is explicit; originals/reports/conversations stay private.
- Feed, Classroom, read-only company-scoped Meta and Creative Insights are core. Chat/DM, ad publishing/budget automation and full CRM are not implied scope.
- Renewal Green `#6CC14C` with black text. Use actual logos and permitted fonts; historical offers are not defaults.
- All observed models remain accounted for. Astra and Seedance 2.5 are preferences, not verified endpoints. Do not enable unverified providers or invent logos/capabilities.

## Stack and file map

Node 24 (tested pin 24.11.1), TypeScript, React 19, Vite 8, Express 5, built-in `node:sqlite`, Sharp/opentype, FFmpeg/ffprobe, Archiver, Zod; package-lock pins the installed dependency graph.

- `app/main.tsx`: application shell, navigation, Home/local guide.
- `app/pages.tsx`: campaigns/studios/assets/activity/brand/models/Insights/Feed/Classroom/settings/operator.
- `app/discovery.tsx`: discovery, saved references, structured remix, campaign exports.
- `app/measurement.tsx`: import wizard, saved views, CRM summaries, ad detail, readiness review.
- `app/setup.tsx`, `app/ui.tsx`, `app/api.ts`, `app/style.css`: setup, shared UI, requests and styling.
- `server/db.ts`: scoped records, versions, SQLite and audit.
- `server/index.ts`: HTTP/auth/CSRF/scoped files/application routes and local startup guard.
- `server/services.ts`, `server/types.ts`: typed campaign/creative/job services and document contracts.
- `server/assets.ts`, `server/render.ts`, `server/worker.ts`: provenance/intake, exact rendering, durable local jobs.
- `server/discovery.ts`: private bookmarks, sanitized composition metadata, transactional remixes and campaign export inventory.
- `server/insights.ts`, `server/measurement.ts`: CSV facts/matching/metric calculation, review and CRM aggregation.
- `server/assistant.ts`, `server/community.ts`, `server/operator.ts`: guide, community/publications/playback, setup.
- `scripts/`: migrate, seed, intake, exercise, web/worker launcher, backup/restore.
- `tests/core.test.ts`, `tests/http.test.ts`: current isolated automated evidence.

## Run and resume

Read README.md for prerequisites and exact commands. Fresh setup: `npm ci`, create `.env` from `.env.example` if absent, `npm run migrate`, `npm run seed`, `npm run intake`, then `npm run dev`. Open `http://127.0.0.1:8787`. The development command starts web and worker. Do not run duplicate workers against the same database. Restart the existing development command to register new backend routes; preserve `.runtime`.

Use `npm run check` for build and tests. HTTP tests require local port access. The existing local app and gallery may belong to another active thread; identify processes before restarting anything. Never reset existing campaign data to make a test pass.

## Ordered remaining work

1. Browser-verify discovery → save/reference → private remix → render → exact export and CSV import → reviewed mapping → performance → variation. Fix usability/failure states before claiming section completion.
2. Finish reporting reconciliation: comparable scopes, acquisition cohorts/outcome cutoff, cost per qualified lead/appointment/sold job, ambiguous mappings, selectable metrics, richer grouping/filtering/comparison, evidence correction/publication.
3. Finish Video/UGC: audio/ducking/timing and real crash recovery; verified provider adapters for generated scenes/presenters/voices; actual provider outputs when configured. Keep blocked controls truthful.
4. Community/Classroom: robust threads/replies/attachments and moderation; opt-in profiles/directory/events; authored recordings/resources/archives; company-owner content administration and player/resume access checks.
5. Broaden assistant retrieval and bounded studio tools, shared discovery on Home, saved asset use/collections; verify complete model capabilities/official marks and finish source intake.
6. Meta: real read-only authorization, account selection, durable history/sync/reconnect/disconnect, callback replay isolation, pagination/rate-limit/late-conversion checks and reconciliation with an authorized account.
7. Accounts/release: hosted identity/recovery/delivery, workspace activation/lifecycle/support, configurable commercial and retention policy, real billing test integration, persistent cloud storage/worker, deployment/rollback, responsive/keyboard/a11y and operational recovery checks.

External dependencies: provider accounts/verified endpoints, Meta developer app/review/test account, actual client reports, source-font permission, payment/commercial settings, production identity/email/hosting and remaining authorized originals. Ask for variable names/configuration setup, never secret values in chat.

## GitHub and Vercel checkpoint

Requested destination: private GitHub repository `tlaakso07/renewal-campaign-studio`. The private repository has been created. Source push and deployment verification are recorded below as they complete.

Vercel deployment must be protected before any app/source content is uploaded. Check actual project/team protection, then verify unauthenticated access is denied. A private GitHub repository does not make a deployment private.

**Architecture blocker:** the current backend requires persistent local SQLite, private durable disk and a separately running FFmpeg worker; its development login deliberately refuses production startup. Vercel's function filesystem cannot serve as durable application storage. A full working hosted deployment requires cloud database/object storage, durable worker execution and hosted identity, or a separately hosted persistent backend behind the Vercel frontend. Never remove the development-auth guard or use ephemeral `/tmp` SQLite to pretend that the complete app is deployed.

A protected frontend-only deployment, if chosen, must explicitly identify the unavailable hosted backend and must not claim working campaign/render/report services. The user explicitly chose the **full working hosted app** on September 16 at 02:51 PDT. A frontend-only preview does not satisfy the request. Complete the persistent backend, identity and render-worker deployment before reporting success.

### Verified remote result — September 16

- **GitHub saved:** https://github.com/tlaakso07/renewal-campaign-studio — verified `isPrivate: true`, branch `main`, initial checkpoint `fef2d70`. Initial commit contains 317 source/package/research files. Credentials and local runtime data are excluded.
- **Vercel project created:** `renewal-campaign-studio` in `tlaakso11-3399s-projects`, ID `prj_c8wsJlGQkPZhPoJsk3YM6ZfQIwCR`.
- **Privacy configured and read back:** `ssoProtection.deploymentType: all`, Node `24.x`, automatic custom-domain assignment disabled; public source not enabled (API reports `null`). No deployment URL exists yet, so anonymous URL denial has not been tested.
- **Full app deployment remains blocked:** no dedicated persistent backend has been provisioned, and hosted authentication/gateway/worker changes are not implemented. No fake frontend-only substitute was deployed. Existing Google Cloud project's Compute and Billing APIs are disabled; no marketplace resources are installed on Vercel.
- **Concrete next step:** approve/provision the dedicated backend described in [HOSTING-PLAN.md](docs/HOSTING-PLAN.md), then implement/test hosted mode and private media transfer, deploy through the protected Vercel project, and verify persistence/render/download and anonymous denial. Proposed light backend budget is roughly $20–30/month plus exceptional traffic/scale; no paid backend has been created.

This checkpoint preserves the current working local application. It does not claim the full product plan or hosted migration is complete.
