# Implementation status — local Renewal prototype

Updated September 16, 2026. Latest automated build and test pass follows the discovery, reporting and storyboard additions. This document supersedes pre-build “no app exists” descriptions for implementation status only. Product requirements and the full acceptance matrix remain in force.

## Latest delivery

- **Discovery:** search, media/industry and evidence-category filters; personal saved references and named collections; reference details and usage context. Verified-results remains honestly empty: no verified performance evidence has been published.
- **Remix:** dedicated destination campaign/media selection, explicit adaptation choices, company-written hook/direction, editable scene durations/captions, reference lineage, and current destination brand/offer/terms. Shared structure contains geometry/timing only, never source asset IDs. Uploaded references use manually entered direction; visual analysis is not connected.
- **Export:** campaign-specific exact-version selection, missing/latest-unrendered states, and visible exclusion of unfinished/missing outputs. ZIP includes source-version copy/manifests/captions where available.
- **Measurement:** visual CSV column mapping/validation/commit; saved filter views; source-ad performance detail, exact rendered preview when mapped, compatible previous-period comparisons, supplied video counts, deterministic document-readiness review, and evidence-bearing variation briefs. No numerical forecast is claimed.
- **CRM:** source-date filtering; unique lead/job counts; qualification/appointments; canceled/conflicting jobs; revenue separated by currency/basis; unavailable revenue and unmatched attribution remain explicit. This is not yet the full acquisition-cohort cost/ROAS reconciliation contract.
- **Video planning:** persisted commercial/product/UGC direction, working script, per-scene narration and shot notes, scene timeline, and explicit script-to-caption application preserving media/timing/IDs. Notes do not synthesize speech or presenters.
- **Engineering handoff:** active delivery queue and mandatory Delivered / Evidence / Remaining / Next reporting format in BUILD-EXECUTION.md; CURSOR-HANDOFF.md points to current implementation evidence.

**Latest validation:** production build passes; **16 automated tests pass** against temporary databases. New screen interactions still need a full browser walkthrough; the earlier browser evidence predates these additions. The running development server must reload/restart to register new backend routes. Existing persisted Renewal campaign data was not reset.

**Next concrete step:** browser-verify the new discovery → remix → export and report import → ad detail → variation flows, then finish community/Classroom content administration, threads, directory and events. Continue video/audio recovery and reporting reconciliation alongside those flows. Live integrations remain separate implementation work, not completed code awaiting only credentials.

**Working local paths:** persistent campaign → exact-source static → edit → PNG/ZIP; source-media scene assembly → MP4; versioning, scoped files, job state, CSV reporting, basic community and shared derivatives. Seven actual originals and six completed outputs are stored. No real performance data is seeded.

**Development-only:** loopback identity and invited local accounts, single-process local queue, local render-unit allowances, deterministic assistant guide. Hosted startup is blocked. The guide is not an LLM and does not satisfy the live assistant requirement.

**Blocked externally:** verified reasoning/media/presenter provider credentials and endpoints; Meta developer app/review and authorized account; real ad/CRM reports; source font usage permission; payment account/commercial policy; deployment/transactional email and launch retention decisions. Missing access must not be confused with completed integration code.

**Not implemented or incomplete:** full source import, broader assistant retrieval/streaming, live provider/Meta/payment adapters, production identity/recovery, full lesson/media/content administration, advanced community flows, comprehensive accessibility and production operations. Do not call the complete product finished.

## Acceptance evidence and open work

The table distinguishes tested paths from the work needed to close each complete acceptance row. A passing test bearing an acceptance ID does not establish every requirement in that row.

| ID | Verified/current path | Still required to close the full row |
|---|---|---|
| A01 | TypeScript/client build; migrations, idempotent development seed, web/worker commands; 16 tests | Fresh-machine installation exercise across documented platforms |
| A02 | Two scoped workspaces; direct API/file/assistant/export denial; invite acceptance/replay, revocation, last-owner guard | Production identity, recovery, delivery and broader role/user journeys; local identity remains development-only |
| A03 | All 424 ledger IDs; 7 originals with matching checksums; resumable skip of stored originals; upload validation | 417 original imports outstanding; full inventory transfer interruption exercise |
| A04 | Official logo mapped; independent theme update leaves creative brand unchanged; historical brand versions | Permitted font use and complete source-rule mapping; currently explicit fallback typography |
| A05 | Create/duplicate, immutable offer version, affected-creative listing and separate-process reopening | Complete date/expiry and campaign lifecycle review |
| A06 | Real photographs, layered copy/crop/position, undo/redo, autosave, restore; correct PNG dimensions and terms | Exhaustive placement/crop/overflow usability review; placement certification not claimed |
| A07 | Actual 15-/30-second H.264/AAC exports; captions/end card; partial scene failure/cache/replacement test | Script/storyboard UI browser checks; full audio/ducking/voice timing coverage and mid-render process-crash exercise; samples use muted source audio |
| A08 | Unavailable models cannot submit or fake success | Verified generated-video/presenter provider adapter and actual returned media |
| A09 | Local guide cites sources and invokes actual services; personal scope, stale edit and instruction-boundary tests | Real reasoning provider, retrieval/index lifecycle, streaming/cancel/retry and broader bounded tool schemas |
| A10 | Full observed inventory preserved and disabled, consistent unavailable submission handling | Provider/endpoint/capability verification and official logo sourcing before enabling entries |
| A11 | Persistent idempotent jobs, reservation/release/retry, revoked-worker denial, per-scene cache; restart recovery code and single-worker lock | Process-crash end-to-end exercise, provider callbacks/charges and production concurrency limits |
| A12 | PNG/MP4, copy, immutable manifests, SRT, ZIP; actual ZIP integrity and MP4 browser playback checked | Campaign export selector now includes unavailable-output states; browser walkthrough and broader format/batch combinations remain |
| A13 | Explicit copied public derivative, private branded remix, two-company publication privacy test | Saved references/collections and structured private remix now implemented; complete evidence curation, taxonomy and correction lifecycle remain |
| A14 | CSV validation/upserts, weighted ratios, missing/zero handling, separate measurement scopes; empty until imported | Real client reconciliation, richer saved-view UI and additional supported video metrics |
| A15 | Explicit Not connected state and setup requirements | Live Meta OAuth, account selection, sync, replay/pagination/rate-limit/disconnect coverage; adapter not implemented |
| A16 | Reviewed exact-version mapping and correction test; account facts not multiplied by mappings | Dynamic creative/effective-date mapping and complete correction/report invalidation behavior |
| A17 | Stable lead/job import identities, validation, idempotency, unmatched rows and match coverage | Unique qualification/appointment/job totals and separated revenue summaries now implemented; full acquisition-cohort costs, ambiguous attribution and conversion-lag reconciliation remain |
| A18 | Evidence-bearing private variation brief using mapped source version/current offer and brand | End-to-end actual-report → revised creative → measured follow-up demonstration |
| A19 | Persisted posts/comments/polls/reactions, audiences, private drafts, reports/removal | Rich text/attachments, replies, mentions, notifications, directory/events and full moderation workflow |
| A20 | Three owned written guides, searchable eligible catalog, private/draft lesson denial; player/resume code | Real instructional recordings/resources and player/resume verification; no recordings seeded |
| A21 | Staff-only company creation, contrast-validated independent theme, publication and lesson controls tested | Activation/lifecycle controls, complete content administration and audited cross-company support access |
| A22 | Configured local allowances, invitations, usage reservations/settlement | Real billing adapter/reconciliation and agreed commercial, cancellation and retention policy |
| A23 | Build + 16 tests, parser/path boundaries, production-mode denial, mobile Home width check, isolated backup/restore with exact media | Full keyboard/accessibility audit, isolated parsers, hosted security/observability, off-device backups and deployment/schema rollback |

## Current files and verification

- `app/`: real client screens. `server/`: API, application services, rendering and worker.
- `.runtime/`: private local database and source/render objects; ignored by Git.
- `tests/core.test.ts`, `tests/http.test.ts`: reproducible isolated checks, including restored DB/media.
- `scripts/backup.ts` / `restore.ts`: refuse existing destinations; restoration was demonstrated with a test workspace, not a production recovery incident.
- `README.md`: current start/stop/setup procedure. `WALKTHROUGH.md`: review sequence. `VERIFICATION.md`: evidence and limitations.

No public deployment or remote upload. Working files are still uncommitted. Full product scope is retained; the present milestone is a reviewable local prototype.
