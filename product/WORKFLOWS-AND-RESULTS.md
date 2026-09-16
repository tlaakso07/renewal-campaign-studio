# Complete client workflows and the results connection

September 15, 2026 · Sections 1 and 2 of the completeness review

## Scope and status

This package completes the next design pass: six missing product flows plus creative-to-Meta matching and CRM outcome mapping. It specifies interactions, records, edge states and acceptance criteria. Screens 15–22 are visual concepts, not production integrations. Quality/provider validation and commercial launch decisions remain for the subsequent sections 3 and 4 discussion.

The client controls creation and downloads after initial setup. None of these flows adds an agency or manager approval queue. Internal workspace activation is an onboarding step performed before handoff.

## One connected journey

Internal setup → client invitation → campaign brief → source assets → static/video/UGC production → targeted revisions → immediate campaign download → client uploads to Meta → match Meta ads to creative versions → import actual outcomes → inspect results → create a new variation brief.

The assistant and dedicated screens operate on the same records. A client can enter at any step without repeating already saved information. Reporting and community publishing are separate: connecting Meta or importing CRM outcomes does not publish them to other companies.

## 15. Campaigns and monthly brief

**Entry:** Campaigns, assistant-generated brief, Duplicate campaign, or a studio's campaign selector.

**List:** searchable campaigns with Draft, In progress and Archived states; dates, service/market, last activity, thumbnail and deliverable counts. A campaign's dates do not automatically mean its ads are running. New campaign and Duplicate are primary actions.

**Detail tabs:** Overview, Brief & offer, Creatives, Results. Store campaign name, goal, product/service, market, dates, audience notes, current offer, exact disclosures, CTA and landing page. An awareness campaign may omit a promotion. Missing essential information triggers one focused question when needed, not a mandatory large form before brainstorming.

**Duplicate month:** copy selected brief fields and creative references into a new draft; ask for the new dates and offer. Mark inherited time-sensitive terms for review. Keep the source campaign, historic outputs and results intact.

**Change offer:** save a new offer version, identify affected creative versions and preview proposed text substitutions. Client selects outputs to update. Produce new versions while preserving earlier files. Long disclosures or changed layouts may require regeneration or manual edits; show that before starting work.

**Exit:** Create ads opens the appropriate studio with saved campaign context. Download opens the export flow. Results shows only matched ad data and its source coverage.

**Acceptance:** create a campaign with and without a promotion, duplicate it, update terms, trace old/new outputs to their offer versions and resume it from the assistant without losing edits.

## 16. My Assets and saved creations

**Views:** Company assets, Saved creations, Collections. Templates remain reusable starting points, while saved creations are versioned outputs. Search/filter by media type, product, project, orientation and campaign.

**Intake:** upload or authorized Drive import → select originals → review metadata → import queue → ready or needs attention. Catalog links are not imported files. Preserve originals and create thumbnails/playback proxies separately. Detect likely duplicates before duplicating storage and retain source provenance.

**Asset detail:** preview, source, format/dimensions/duration, product/project tags, usage notes, versions and campaigns using the asset. Use in campaign transfers the actual reference into the studio. Download original retrieves the original file where accessible.

**Saved creations:** display format, latest version, campaign, status and exact source versions; actions Edit, Create variation, Download and Archive. Archive removes clutter without erasing campaign history. Destructive deletion explains affected references and follows company access rules.

**States:** empty library with upload action; missing original; unsupported file; corrupt source; import interrupted; duplicate; archived asset; revoked source access. Existing durable imported files are distinguished from unavailable remote links.

**Acceptance:** import real sources, find a tagged product, use it in a creative, reopen a prior creative version and recover an interrupted import without duplicate entries.

## 17. Campaign export

Select ready creative versions and available placement formats. Show preview, filename, format, duration if applicable, version and readiness. Requested formats that have not been rendered become explicit additional jobs; never silently stretch or crop an existing composition.

**Package:** selected media, matching primary text/headlines/CTA, a readable copy sheet and a machine-readable manifest. Suggested filename includes campaign, creative ID, version and placement. The manifest includes tenant-scoped creative/version IDs, brand/offer versions, format, content hash and export timestamp. It contains no provider credentials or private CRM data.

**Immediate download:** ready outputs are downloadable while other work continues. Show completed and pending files clearly. A failed packaging step can be retried, or the client can download individual media. No approval role is introduced.

**After download:** offer Match Meta ads as an optional next action after the client publishes through their normal process. Download does not establish that the ad was published. A local manifest helps trace versions but does not guarantee that Meta retains an embedded identifier after upload/transcoding.

**Acceptance:** ZIP contains the selected playable/openable files and matching copy/manifest; exported version IDs resolve to the original immutable creative records; pending outputs are excluded visibly.

## 18. Team, usage and subscription

**Tabs:** Team, Usage, Subscription, Integrations. The concept shows all four entry points without deciding prices or allowances.

**Proposed baseline roles:** Owner manages workspace access, integrations and billing; Creator creates, edits and downloads; Viewer browses permitted work. Exact brand-edit and download permissions are configurable and remain a discussion item. Any authorized creator downloads without an approval gate. A company always retains an owner; invite expiry, resending, removal and ownership transfer have explicit states.

**Usage:** list activity by generation job, model, media type and date. Distinguish estimated, reserved, completed, canceled and adjusted usage. Show current estimate and output count before a paid batch. A materially different retry has an updated estimate; an identical billing event is not counted twice.

**Subscription:** plan summary, configured allowance, invoices, payment method, plan changes and cancellation. These are interface slots until commercial terms are selected. Payment failures and limit-reached states explain which actions remain available. Retention and subscription-end download terms must be decided and shown before launch, not invented in the prototype.

**Acceptance:** owner invites creator; creator generates/downloads without billing-admin access; usage reconciles to jobs; canceled and retried jobs do not create unexplained charges.

## 19. Internal company setup

This is a separate platform-operator interface. Steps: Company → Assets → Interface theme → Creative system → Sample campaign → Activate.

Capture company identity and source access; inspect import errors; map source marks/fonts/product assets; configure colors/type/navigation; configure layouts, captions/end cards, voice, product facts and claims; preview the client workspace. Track unresolved inputs with actionable errors.

Run representative static, video and UGC examples, including revisions and export. The operator records setup results and activates a versioned brand package before handoff. This does not create an ongoing approval dependency for client outputs.

Brand updates create a draft package and preview its impact before activation. Old campaign versions remain reproducible against the recorded package. Support access is scoped and logged. The client uses its own workspace; it does not see the platform's full company list.

**Acceptance:** a second operator can onboard a second test company from the same flow; theme, media and company knowledge remain isolated without a separate code fork.

## 20. Activity, generation and recovery

One persistent activity center serves assistant and studio requests. Filters: All, In progress, Ready, Needs attention. Job detail includes campaign, source versions, stage, saved intermediate outputs and intended deliverables.

**Lifecycle:** queued → generating → composing/rendering → ready; failed and canceled are explicit alternatives. Report stage progress from actual work. Show time estimates only when justified by observed execution.

**Partial failures:** preserve completed scenes and outputs. Retry targets the failed component and shows any changed usage estimate. Cancel remaining stops unstarted work where possible; in-flight provider work may still finish or incur usage and must be reconciled honestly.

Ready files can be opened or downloaded at any time. Optional in-app notifications and selected delivery channels notify on completion/failure according to user preferences. Reopening the app restores server-side jobs; a closed browser does not cancel production.

**Acceptance:** refresh during rendering, simulate a failed scene, retry only that scene, cancel queued work and download completed results with traceable usage.

## 21. Match exported creative to Meta ads

**Entry:** export follow-up, Insights unmatched badge, integration backfill or campaign Results. The Meta connection must already be authorized for the current company.

**Review UI:** source ad account/date filters; list Matched, Needs review and Unmatched; side-by-side Meta creative and local creative version; copy, formats, timestamps and available source identifiers. Search other versions when the suggested candidate is wrong.

**Evidence:** exact available identifiers and file metadata may support matching; name, timestamps, image similarity and transcription only suggest candidates. Transcoding/cropping/editing can change bytes and content. A suggestion is not a confirmed relationship. Offer Confirm match, Not the same creative and Leave unmatched.

**Records:** company_id, Meta account/ad/creative IDs, studio creative_version_id, relationship type, validity dates, method, evidence references, reviewer, confirmation time and audit history. One local version may run in many Meta ads. A platform ad may contain several assets/variants; represent those associations without assigning an unsupported individual result to each asset.

**Rollups:** deduplicate source ad facts before aggregating across linked creatives. Do not multiply one ad's spend because several assets are linked. If an ad creative changes over time, preserve effective mapping periods. Version-level metrics unavailable from the source remain unavailable.

**Corrections:** unmatch/rematch preserves prior mapping history and invalidates affected derived reports. Wrong-company account or creative links are rejected server-side. Unmatched Meta ads remain reportable as source ads.

**Acceptance:** correctly match a manual upload, reject a visually similar wrong version, map one output to two ads without duplicate facts, leave an external ad unmatched and correct an earlier mistake with traceability.

## 22. CRM outcomes and next variation

Use a neutral validated report-import path now; choose native CRM/call-tracking providers later. Wizard: Upload → Map fields → Validate → Review → Import. The preview never changes live reporting until the user imports.

**Fields:** stable lead ID, supported Meta/ad or campaign identifiers, acquisition timestamp, qualification flag/date, appointment ID/date/status, job ID/status and revenue amount/currency/basis. Missing fields disable dependent metrics rather than inventing values. Preview timestamp formats, timezone, duplicates, malformed currency and unrecognized statuses.

**Matching:** use client-supplied stable identifiers or explicit reviewed attribution mappings. Do not guess an ad from a customer's name, a similar campaign name or the timing of a sale. Preserve campaign-level attribution when ad-level attribution is unavailable. Keep unmatched records separate; never spread them across ads to fill a report.

**Coverage:** show source rows, unique leads, duplicates, valid rows, linked/unmatched leads and exclusions. In the sample: 120 unique source leads, 118 linked, 2 unmatched, 98.3% coverage. The linked sample retains the existing analytics fixture: 50 qualified leads, 21 appointments, 5 sold jobs and $30,000 completed-job revenue. This is illustrative and not Renewal performance.

**Time and revenue:** distinguish leads acquired during a period from sales occurring during a period. Show outcome cutoff, conversion lag, revenue basis and currency. Reimport updates stable source IDs and recomputes affected reports; it does not add the same lead or job again. Removing/reversing a qualification or sale is also a source change.

**Next test:** report → evidence-linked recommendation → variation brief containing parent creative/version, period, source metrics, proposed single change, intended outcome and current campaign/brand context. The client can edit and generate immediately. Store parent-child creative lineage, then match the resulting ad after publication. Comparison is observational unless a valid experiment establishes more.

**Acceptance:** duplicate reimport leaves counts unchanged; malformed and unmatched records are explained; qualified/appointment/revenue measures reconcile to included source records; the next variation preserves evidence and private company scope.

## Linked screens and documentation

- [Concept gallery, beginning at Campaigns](ui-concepts/index.html?screen=14)
- [Workflow image prompts](ui-concepts/WORKFLOW-PROMPTS.md)
- [Meta authorization and sync](META-CONNECTION.md)
- [Metric definitions and reporting](CREATIVE-INSIGHTS.md)
- [Build plan](BUILD-PLAN.md)

## Return to sections 3 and 4

**Confirmed:** Use Renewal's supplied assets for the first prototype. A different company will launch first. Demonstrate the campaign workflow with Renewal, then repeat intake, theme/creative configuration and representative output checks using the launch company's own sources. Never carry Renewal assets, offers or knowledge into that customer's workspace.

After reviewing this package, discuss proof of output quality, actual provider availability, data/library evidence, source import and forecast validation; then pilot scope, pricing/allowances, CRM choice and client-access terms. These remain open decisions. The workflow designs do not imply those validation tasks have been completed.
