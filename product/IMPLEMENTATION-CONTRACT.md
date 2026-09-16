# Implementation completion contract

September 15, 2026 · Engineering detail added by the final handoff audit

This supplements the feature specifications. It closes details that the images cannot express. It does not choose exact library versions, claim live provider access or add an approval queue. The first working environment uses Renewal; the later customer is configured separately.

## 1. Reproducible foundation

Record the stack, runtime versions, database/migration strategy, object storage, authentication, background jobs and rendering tools in an architecture decision before substantial implementation. A typed web client/API, relational database, private object store and durable workers are the intended architecture. Select actual vendors and versions from current official documentation at implementation time.

Supply install/run/migrate/seed/test commands, a lockfile, `.env.example` with names and explanations only, health checks and a documented local storage/worker setup. Choose an application port independently of the gallery on 8766. Preserve research and gallery artifacts.

Use development, staging and production configuration. Sample fixtures must be explicit opt-in seeds and never the default source for a real company's Insights. Development authentication and provider simulators must refuse production configuration. Do not label simulated generations or connections successful live operations.

## 2. Route and interaction completeness

Screens 01–22 are representative concepts, not the complete route inventory. Include functional sign-in/invitation/recovery, campaign list/detail, asset detail/import, editor/version history, export/activity, integration configuration, ad matching/import preview, shared-reference detail/contribution, community thread/profile and lesson player, plus internal setup/content administration.

Every visible action either works, is disabled with an actionable reason, or is removed from the current release view. Do not ship buttons that merely toast success. Deep links, back navigation, preserved filters, pagination and refresh must retain the correct company and record. A guessed URL cannot select another company's data.

Keyboard navigation, visible focus, dialog focus restoration, labels, contrast, reduced motion and readable empty/error states are part of implementation. Client theme configuration cannot override critical accessibility behavior. Design for narrow screens; complex editing can have an explicit simplified layout rather than unreadably shrinking the desktop canvas. Do not treat a mobile native app as required.

## 3. Minimum persistent domain

| Domain | Required records |
|---|---|
| Access | User, company, membership/role, invite, session, support-access audit |
| Brand | Interface-theme version, creative-system version, source asset, derivative, product, business fact/claim with evidence |
| Campaign | Campaign, immutable offer version, structured creative document/version, source dependencies, parent/variation relation |
| Production | Job, attempt, scene state, output, source/model configuration, cancellation, usage reservation/event/adjustment |
| Delivery | Export and manifest, included creative versions/formats, download event |
| Assistant | Conversation, message, retrieved source, personal memory, task run, tool invocation |
| Measurement | Connection, account, sync run, normalized fact, attribution/metric version, creative mapping, CRM outcome, saved report |
| Discovery | Template/style, shared publication, public derivative, evidence snapshot, taxonomy, saved reference |
| Community | Profile, post/comment/version, reaction, poll/vote, event, report/moderation action, notification preference |
| Learning | Lesson/version, resources, audience, recording, playback state |
| Commercial | Subscription state, entitlement configuration, usage ledger and payment reconciliation |

Company-owned records are scoped server-side. Shared platform records have explicit public/member eligibility; they do not inherit access to company originals. Personal conversation scope is narrower than general company membership where specified. Use optimistic version checks to prevent assistant/editor or multi-user changes silently overwriting one another.

## 4. Intake all Renewal assets without pretending every file is renderable

Use the 424-entry manifest as a resumable import ledger. Track discovered, queued, importing, original stored, preview ready, unsupported-preview, source inaccessible and failed states separately. Import a representative usable subset first to establish the creation pipeline, then continue the full inventory. A catalog entry is not successful intake.

Record source ID/URL, original filename/type, content checksum, byte count, dimensions/duration where extractable, color profile/orientation, collection and usage metadata. Retain layered/vector/font originals even when the studio cannot edit their proprietary format. Safely render derived previews where supported; do not silently flatten and discard the original.

Use bounded/resumable transfers, duplicate-content detection, file-size/type limits and isolated media parsers. Reject path traversal, executable masquerades and active document content. Sanitize SVG before inline rendering or rasterize it. Remote reference/import fetches need SSRF protection, redirect limits and allowed provider handling. Source permission failure should be an actionable item rather than a false ready state.

Never treat model-generated photos or screenshot crops as original Renewal product evidence. The supplied historical ads may conflict with general brand rules; preserve them as references and keep current rules and current offers explicit.

## 5. Static editor and exact compositor

Store a structured document with canvas/placement, source image crop/transform, editable headline/body/offer/CTA/disclosure layers, exact logo asset and font-role references, colors, stacking order and positions. Use stable element IDs so natural-language edits can target one element. Provide undo/redo, autosave, version restore, text edits, asset replacement, crop/position, supported layout changes and explicit save state.

Reference starting exports: square 1080×1080, portrait 1080×1350 and vertical 1080×1920. These are proposed prototype formats; verify current placement constraints and safe areas before claiming placement certification. Resize recomposes the layout and allows review; it does not stretch a flattened bitmap.

Compose actual branding and copy through deterministic rendering. AI can propose layouts/backgrounds, but source logos, offer terms and final text must remain exact. Embed or supply permitted fonts, detect missing glyphs/fallbacks and flag text overflow. Export PNG/JPEG as supported; do not rely solely on a browser screenshot or cross-origin canvas that cannot export. Separate production size from preview size.

Checks assist the creator: offer expiry, missing terms, overflow, low resolution, source mismatch and brand deviations. They do not create an agency approval queue. Technical inability to produce a valid file is an error; a user preference or internal review is not a reason to withhold an already completed valid download.

## 6. Video, UGC, voice and sound

Persist an editable scene/timeline document: scenes, source clips, trims, transforms, timing, script, presenter/voice selection, caption cues, graphics, transitions and end card. Distinguish source footage, generated scene, generated presenter and reference-only media. Save continuity references so changing one scene does not unexpectedly change the product/person/style elsewhere.

Support real-footage assembly and mixed productions as well as generated clips. Obtain a verified presenter/voice provider capability before enabling its controls. Custom voice or real-person likeness requires the appropriate source setup; never silently clone a staff member or turn generated speech into an actual customer testimonial. Built-in application tools are not a future provider contract.

Include source audio controls, mute, voiceover timing, music selection from available usable assets, volume/ducking and final mix. Use actual timestamps for captions; support correction, wrapping, placement and export of captions where implemented. Handle missing audio, variable frame rates, mismatched aspect ratios and longer scripts than scenes. Do not imply that a provider generates a complete branded ad if it only supplies a clip.

Render a durable playable MP4 with a documented compatible video/audio configuration; initially demonstrate 15- and 30-second assembled examples where source/provider capabilities allow. Validate duration, dimensions, audio, captions, ending and playback. A UGC-style walkthrough can use real footage; a generated presenter path is a distinct capability to prove.

## 7. Job and provider contract

Provider adapters expose verified capabilities, estimate, submit, status, cancel when supported and output retrieval. Record endpoint/model version and attempt configuration. Client-specified unavailable models return a clear unavailable state; do not silently swap a materially different model or price.

Persist jobs before submission. Use idempotency keys, transactional/outbox-style dispatch where appropriate, per-company concurrency/spend limits and bounded retries. Verify callback authenticity and handle duplicate/out-of-order events. Recover from worker restarts and process long rendering outside web request timeouts.

Reserve estimated usage, reconcile actual cost, release unused reservation and record adjustments. Distinguish an internal retry from a new user-requested creative. Cancellation may not cancel an already running provider charge; show its actual result. Download provider outputs into durable scoped storage before expiring links disappear.

An output is ready only when the file exists, basic integrity checks pass and the user can retrieve it. Do not equate an API acceptance response with completed media.

## 8. Assistant, memory and instruction boundaries

Use scoped retrieval over actual imported/parsed sources with source references, dates and version context. Brand facts, current offers, personal preferences and conversation history are separate. Let users inspect/update/forget personal memory; revocation/deletion must invalidate retrieval indexes and caches according to retention rules.

Bound tool schemas and validate server-side authorization on every call. External source text cannot override developer instructions or authorize actions. Limit runaway tool loops and generation scope. Editing an outdated creative requires a version conflict response rather than silent overwrite.

Provide streaming/cancel/retry where supported, persisted history, recoverable interruptions and genuine job cards. A text answer promising a file is not a file. Optional contextual actions must call the same campaign, editor, export and measurement services used by the UI.

## 9. Measurement and mapping details

Follow the existing Meta/Insights/Workflow contracts. CRM imports need a mapping preview and stable keys, not a generic CSV drop-zone that invents linkage. Preserve source attribution independently from local creative matching. Account reports and manually imported facts need source precedence/deduplication to avoid double counting.

Dynamic ads or multiple asset associations cannot each inherit the full ad spend as an independent additive fact. Maintain effective mapping dates and only report asset-level outcomes when supported. Distinguish unique leads, appointment events, distinct jobs, net/canceled job states and revenue basis; funnel ratios need compatible cohorts and denominators.

Track current provisional data, late conversions, stale syncs and disconnect. Historical facts may remain according to configured retention, but disconnected must never display live. The assistant cites actual report scope and proposes hypotheses; it cannot guarantee a lower CPL.

## 10. Shared content, classrooms and operational controls

Internal staff need template/style administration, shared-ad curation/evidence correction, publication removal, taxonomy, lessons/recordings/events and moderation tools. These were less visible in the 22 concepts but are required to operate the confirmed library, Feed and Classroom.

Keep private originals distinct from explicitly published derivatives/evidence. Publish only the selected fields/media; stripping a company ID from a raw report is not sufficient redaction. Removal and corrections update discovery without silently deleting a client's existing private work.

Content seeds must be owned/usable source content or labeled examples. Existing Zuops lesson videos, member posts and all ad media were not imported by the audit. Create original training for implemented features. Do not show unavailable recordings as playable lessons.

## 11. Authentication, commercial states and release operation

Implement sign-in, invitations, recovery/revocation, membership changes and a last-owner safeguard. Authorize asset/report export and storage URLs; workspace scoping in the frontend alone is insufficient. Expired signed links can be renewed for currently authorized users; leaked URLs must not become permanent access.

Represent subscription/usage independently of any one payment provider. Configure prototype entitlements explicitly; do not fabricate prices, paid customers or unlimited allowances. Reconcile payment events idempotently and handle trial/active/past-due/canceled states as defined when commercial policy is selected. Cancellation, deletion and retention must be distinct.

Provide correlation IDs across requests/jobs/provider attempts, redacted logs, sync/job health, actionable failures and a support view with scoped audited access. Monitor cost and failure rates per company without putting confidential content into generic telemetry. Define backup/restore, database migrations, object-version recovery, staging deployment and rollback. Demonstrate restoration before calling storage durable for launch.

Account export/deletion, credential revocation, source-media removal and derived-index cleanup require a documented lifecycle. Resolve concrete policy values before paid launch; do not invent them for the prototype or hold development hostage to unselected pricing.

## 12. Definition of progress

Maintain an implementation status record with: feature, implemented path, actual evidence/test, development-only behavior, external blocker and next step. Complete the connected Renewal prototype before claiming customer readiness. Check the same pipeline with a synthetic second company to prove configurability and boundaries while Ryan's future assets are pending.

The acceptance matrix is the release evidence list. The first vertical slice is a milestone, not a reduction of the full product to a static template editor.
