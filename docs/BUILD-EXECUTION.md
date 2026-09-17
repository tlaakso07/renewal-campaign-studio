# Lead engineering handoff

This is the active delivery queue. Read it with IMPLEMENTATION-STATUS.md and the original acceptance matrix. A section is finished only when its usable path, failure states and tenant boundaries have evidence. A screen alone does not close a section.

## Current direction

The persistent local foundation works. Complete the missing product flows in this order, keeping each connected to the existing studios and services:

| Order                                                                     | Section                            | Concrete deliverable                                                                                                                                                              | Acceptance            |
| ------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1 — initial browser paths verified September 17; broader cases open       | Discovery, remix and export        | Search/filter references; private favorites and collections; evidence detail; explicit adaptation brief using destination assets/current offer; campaign/version export selection | A12–A13               |
| 2 — implementation extended; reconciliation open                          | Measurement and creative decisions | CSV column mapping; ad performance detail/comparison; saved views; evidence-based review and next variation                                                                       | A14, A16, A18         |
| 3 — storyboard added; provider/audio work open                            | Video and UGC                      | Script/storyboard editing tied to scenes; timing/audio checks; repeatable recovery; verified provider integration where available                                                 | A07–A08, A11          |
| 4 — thread and Classroom administration delivered; broader Community open | Community and Classroom            | Complete threads/moderation, useful company directory and events; add eligible original recordings to the working Classroom player/resources/archives                             | A19–A21               |
| 5                                                                         | Accounts and release               | Workspace lifecycle and support, account recovery/delivery, commercial policy, deployment/rollback and responsive/keyboard verification                                           | A02, A21–A23          |
| Throughout                                                                | Assistant, assets and integrations | Shared application tools, complete intake, verified models, Meta authorization/sync, truthful setup states                                                                        | A03–A04, A09–A10, A15 |

## Latest section handoff — September 17

**Delivered:** connected the assistant's first real reasoning route through Vercel AI Gateway using verified `openai/gpt-6-astra`, with hosted OIDC/local-key detection, grounded company context and deterministic application writes. Finished the Classroom service and UI for searchable/tagged lessons, detail/transcripts/resources, company/platform audiences, draft/publish/version management, Past Events/Help Sessions archives, recording media failure states and personal playback resume. The earlier discovery/reporting/thread work remains intact.

**Evidence:** production build and all 21 tests pass. Tests cover company/private training boundaries, owner draft creation/versioned publication and rejection of a published recording without media. An isolated Chrome check created, published and opened a company-only written lesson and inspected its honest no-recording state. Gateway code type-checks against AI SDK v6; no paid inference call was made because this shell has neither a Gateway key nor a Vercel OIDC token.

**Remaining:** publish original eligible training recordings/resources and verify real media resume/captions in the browser. The Gateway adapter still needs a protected deployment smoke test with automatic OIDC (or a local key supplied outside chat). Video/mobile/a11y walkthroughs, advanced report reconciliation, Community attachments/directory/events/notifications and complete moderation remain. Changes are local, not deployed to Ryan. CRM outcomes remain retired.

**Next:** deploy this isolated milestone with existing protection, smoke-test one grounded Astra response through OIDC, then publish one owned training recording/resource and verify playback resume. After that, continue Community directory/events and the remaining browser/operational checks.

## Latest section handoff — September 16

**Delivered:** discovery search/saved collections, explicit private remix briefs, campaign exports, mapped ad-performance CSV imports, ad detail/review and script/storyboard controls. Open the named sidebar destinations; Video & UGC contains the storyboard controls. The previously delivered CRM summary is retired from the current product surface.

**Evidence:** build and 16 automated tests passed at that historical checkpoint, including privacy, remix rollback, exact export versions and targeted storyboard edits. See VERIFICATION.md. Browser coverage of the new screens was still pending.

**Remaining:** broader discovery taxonomy/evidence curation; reporting acquisition-cohort costs and advanced comparisons; synthetic media/presenters and real reasoning; Meta; community/Classroom depth; production account/billing/release. Current provider states remain truthful and unavailable.

**Next:** perform the connected browser journeys, then implement content administration/resources/archives and community threads/directory/events. Do not rework the working foundation. Do not claim entire A07/A13/A14 rows passed on these focused tests; A17 is retired from scope.

## Required section handoff

Every section update must state:

1. **Delivered:** what the user can now do and where to open it.
2. **Evidence:** checks actually run, important failure cases and artifacts.
3. **Remaining:** missing implementation separately from external dependencies.
4. **Next:** the next concrete flow and why it follows; continue unblocked implementation without asking for routine approval.

Keep the status and verification documents current with the code. Preserve historical evidence with dates; do not present an old test count as validation of new changes. Do not call full acceptance rows complete when only one path passes.

## External work requiring actual setup

Reasoning/media/presenter providers, Meta developer app and authorized account, payment service, production identity/email/hosting, permitted brand font use and remaining Drive originals. Credentials belong in server-side configuration, never chat. Missing adapters are implementation work; absent credentials do not make an adapter complete.

## Immediate next-session entry

Read this queue and the latest status; inspect current files before editing a shared workspace. Run the relevant checks. Finish the active section, record its evidence, then take the next section. Start locally with the README commands. Never reset existing campaign data or restart another agent's process without identifying it.
