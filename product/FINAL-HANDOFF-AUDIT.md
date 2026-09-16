# Final Cursor handoff audit

September 15, 2026 · Repository and requirements audit

## Conclusion

All major product areas explicitly requested in this conversation are represented in the handoff. Important implementation details and a few scope inconsistencies remained; this audit records and resolves them below. This is not a claim that every engineering issue is knowable in advance, that the software exists, or that external APIs have been reverified today.

**Current objective:** build a working Renewal prototype now, using the supplied sources. Another company launches first after Ryan supplies its materials. Those future materials are not a reason to defer development.

## Verified repository facts

- 22 selected concept PNGs are present and referenced by the gallery.
- The source catalog contains 424 unique file IDs: 358 brand/source and 66 historical Meta files. All 424 have `linked_to_drive` storage state. They are not imported original binaries.
- The model inventory contains 21 observations: 17 media models and 4 assistant/tool labels. All 21 are disabled and marked observed/not integrated; provider IDs, exact endpoints and official logo assets require implementation checks.
- Existing Markdown links to local files resolved at the audit. Relative links allow the three source folders to move together.
- No app dependency manifest, app scaffold, backend or live integration existed at audit start. This turn added handoff/specification files, not application code.
- The project has a Git directory, but the existing `library/`, `product/` and `research/` collections were untracked. No private repository push or commit was performed.
- Browser authentication, remote app tools and running local preview servers belong to the current environment; they are not application dependencies the Cursor build can assume it owns.

## Scope accounted for

| Product area | Handoff coverage |
|---|---|
| Personalized enterprise workspace | Versioned interface and creative systems, private membership, internal onboarding |
| Company assistant | Simple Home, source knowledge, memory, campaign/asset tools, persisted task/job results |
| Monthly campaigns | Brief/offer versions, regional facts, duplicates, affected creatives and export |
| Static/video/UGC | Real + generated media, exact brand composition, timeline/layers, targeted revisions |
| Assets and saved work | All source links, binary import ledger, metadata, originals/derivatives and versions |
| Creative discovery | Optional templates/styles, shared references/results, private remix and full model inventory |
| Meta and Insights | Actual reporting, explicit account selection/sync, ad matching, CRM outcomes and next test |
| Feed and Classroom | Shared discussion, private/company learning, players/archives and content administration |
| Account operations | Team access, subscriptions/usage, activity, notifications, support and internal setup |
| Ownership and control | Client-created content ownership requirement, immediate downloads, no agency approval gate |

## Gaps closed in the handoff

1. **No root entry point or Cursor instructions.** Added README, AGENTS and a paste-ready handoff prompt with source order and no dependency on future client assets.
2. **Images did not define an implementation.** Added structured editor/timeline, exact compositing, resizing/overflow, voice/audio/captions, export and actual-ready requirements.
3. **No unified completion standard.** Added 23 acceptance areas with meaningful persistence, failure, access and integration evidence.
4. **Development/live distinction was distributed.** Defined explicit test fixtures/adapters, production exclusion, exact external blockers and truthful status reporting.
5. **Library and learning operations were less visible than client screens.** Made template curation, evidence correction, publishing/removal, lesson/event administration and moderation explicit.
6. **Asset storage could be mistaken for completion.** Documented original-file import, provenance, derivatives, unsupported formats and resumable intake for every catalog entry.
7. **Rendering and provider lifecycle were underspecified.** Added durable output handling, callback/idempotency behavior, actual usage reconciliation and focused scene retries.
8. **Business-outcome mapping needed edge cases.** Added dynamic creative associations, effective mapping dates, CRM-to-Meta versus Meta-to-local links, unique event definitions and reimport corrections.
9. **Operational foundations were scattered.** Added sign-in/invite/revocation, configuration boundaries, source fetch/parser safety, recoverable jobs, observability, backup/restore and deployment/rollback evidence.
10. **Older wording conflicted with current scope.** Clarified Renewal prototype versus future customer, removed waiting for UI selection/brand pack, preserved confirmed Feed/Classroom against an older strategy note, and clarified Carousel as expansion.

## Known dependencies that remain open

These are visible work items, not overlooked requirements:

- Authorized source-file import in the implementation environment; selected brand-guide pages have been examined, not all 424 files or all 145 standards pages.
- Exact provider/model/voice/presenter APIs, credentials, prices and usable source logos. This session's tools do not automatically become the application's APIs.
- Meta developer app, callback configuration, test-account access and required external-client access review; a design preview is not authorization.
- Real source performance/CRM data and a defined qualification/revenue basis. Public references and illustrative CPL values do not establish actual performance.
- Full shared-library media acquisition/publication eligibility and supporting result evidence. No complete reusable copy of Zuops's library has been imported.
- Original lesson recordings/resources and real initial community content. Observed Zuops course material remains research.
- Agreed pricing/allowances, output volume, quality/cost/latency targets, retention/access after cancellation and concrete deployment requirements before paid launch.
- The future real customer's intake and separate setup, once Ryan supplies the materials. A synthetic second test company can validate architecture now.

## Explicit expansion scope

Separate community Chat/DM; autonomous publishing or ad-spend changes; broad CRM replacement; referrals; additional Zuops specialty tools; richer carousel/bulk/localization; SSO/custom domains when required; calibrated numerical forecasting and cross-company benchmark percentiles after adequate evidence. Do not silently implement these as live features or remove already-confirmed core capabilities while sequencing work.

## Transfer instructions

Open the entire project folder in Cursor and begin with [CURSOR-HANDOFF](../CURSOR-HANDOFF.md). No need to recreate the conversation. Keep all source folders together. Local gallery/catalog previews can be served using the README commands; they are reference artifacts and not the future production app.

The next agent should start coding, record its routine stack choices and maintain implementation status. Ask for missing access only when that capability needs it, while continuing independent work. Do not start by asking again which brand to prototype or which major modules the user wants.
