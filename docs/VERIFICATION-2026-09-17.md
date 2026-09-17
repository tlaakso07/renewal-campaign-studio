# Connected walkthrough and Community directory milestone

September 17, 2026. The CRM-removal, Assistant/OIDC and expanded Classroom changes are deployed to Ryan's protected review. No production-readiness or complete acceptance-row claim is made.

## CRM scope removal

The user removed CRM Outcomes from product scope. The client navigation and route, CRM import choice, Insights coverage card, ad-detail CRM panel, CRM aggregation service and API endpoint were removed. Ad-performance CSV imports, Creative Insights, creative matching and variation workflows remain.

Production TypeScript/Vite build passes and all **22 tests pass**. Tests now reject the retired CRM import type. Connected Chrome confirms the sidebar and Insights import no longer expose CRM and the former `#/crm` route shows Page not found. The existing SQLite table was not dropped, avoiding a destructive migration of local and hosted-review snapshots.

## Assistant provider and Classroom

- Installed AI SDK v6 and integrated the verified `openai/gpt-6-astra` route through Vercel AI Gateway. The adapter uses server-only Gateway/OIDC authentication, eligible tenant-scoped context and a 30-second bounded request. Existing campaign/creative actions and metrics remain deterministic services. A missing or failed Gateway connection produces an explicit local-guide fallback.
- Current-model and authentication behavior were checked against the installed AI SDK docs and current official Vercel AI Gateway model/authentication pages. Hosted request-scoped OIDC was detected and reached Gateway; after a payment method was added, inference still returned a 403 requiring paid credits for this model, so no successful live Astra response is claimed.
- Added company/platform lesson and recording administration with draft/published/archived states, expected-revision updates, tags, related-tool targets, published video selection, optional company thumbnails/resources and protection against exposing company assets through platform content.
- Added catalog category pills, URL-retained search/filter state, three/two/one-column cards, deep-linked lesson/recording detail, updated date, About/transcript/resources, honest missing-media state, Past Events/Help Sessions archives and resume storage for lessons or recordings.
- Automated tests pass **22/22** and cover owner draft creation/versioned publication, company isolation/private resources and media, request-scoped OIDC detection, unpublished platform content and rejection of published recordings without media.
- In the isolated port-8788 QA workspace, Chrome created a company-only written lesson draft, published revision 2, opened its deep-linked detail and verified the correct About/transcript/action and explicit no-recording state. No main local or hosted data was reset. A pre-fix owner-draft return-path error found during this check was corrected and added to automated coverage.
- The main local workspace was restarted and seeded twice: two legacy guide titles migrated as revision 2, five missing guides were added, and the second run remained at exactly eight platform guides. A real 14.16-second H.264 1280×720 screen walkthrough and two-page PDF were stored as company-private assets. Browser playback saved 6.25 seconds and reloaded at 6.25 seconds.
- Protected Vercel release `c697eac` / `dpl_29WSKYYPG8AqPVHUniEDf92UadK1` retained both protection layers and migrated the hosted curriculum to eight guides. The same owned recording appears under Help Sessions; connected Chrome played it through, downloaded the PDF and reloaded at 0:10 of 0:14.
- Vercel OIDC is correctly detected from the function request header and AI SDK reached AI Gateway. The second protected inference smoke test at 14:59 PDT was not successful: Gateway reported that free-tier users cannot access this model and the team must purchase paid credits. The app showed its explicit local-guide fallback, and no successful Astra response is claimed.

## Community profiles, events and notifications

- Added opt-in public profiles with unique handles, display names, presence, interests and biographies. Directory responses intentionally omit email and private home-company fields and show a documented contribution total based on shared posts, shared comments and published ads.
- Added shared and company-only events with staff-only creation/versioned updates, draft/published/canceled states, local-time display and secure HTTPS join links.
- Added post/comment attachments that resolve only explicitly published derivative records. Private company records and arbitrary identifiers are rejected rather than exposed through Community.
- Added direct post/comment image and video attachments. Originals remain in private company asset storage; Community serves only normalized, metadata-stripped PNG or H.264/AAC derivatives. Attachments require descriptions, inherit an explicit company/shared audience and are included in hosted snapshots. Company-only media is rejected from shared posts/comments.
- Community copy safely adds paragraph, external-URL and public-handle links with React elements; user text is never inserted as HTML. Mention links open the filtered opt-in directory.
- Added automatic author follow, explicit follow/unfollow, handle mentions, deduplicated persisted notifications and user-scoped notification preferences. Notification reads and preference records are personal, not shared across company members.
- Added versioned post edit/remove/restore, moderator-locked removal, reasoned reports and operator remove/dismiss resolution with audit records. Published shared/company events now notify only members who opt in and are eligible for that audience.
- In an isolated port-8788 QA workspace, Renewal published a profile and shared event; Cedar saw both under its independent theme, published its own opt-in profile, followed and replied to a Renewal discussion, and mentioned the Renewal handle. Renewal then received separate mention and follow-update notifications. The temporary QA server was stopped and the main workspace received no synthetic activity.
- A second isolated walkthrough created and version-edited a shared post, soft-removed/restored it, reported it from Cedar with a privacy reason, displayed that exact reason in the operator queue and dismissed it to the truthful empty state. Notification preference controls were present with stored defaults. The isolated server was stopped after inspection.
- Automated coverage now passes **23/23** and verifies handle uniqueness, public-field sanitization, published and direct attachment boundaries, normalized PNG signatures, transcoded H.264/AAC video, company/shared event visibility, staff-only event management and notification scoping.

## Video audio and recovery

- Added recorded-voice volume and start timing plus an explicit music-ducking control. When music and voice are selected, the renderer delays/gains the voice and uses FFmpeg sidechain compression before the final deterministic mix.
- Render manifests now record music/voice asset IDs, gains, voice start and ducking state so a downloaded output can be traced to its exact mix.
- The A07/A11 test creates real 48 kHz music and voice WAV fixtures, preserves the first-scene cache through a partial failure, renders the replacement to a duration-validated H.264/AAC MP4, verifies the exact mix manifest, then re-queues a simulated interrupted `running` job and settles its retained usage reservation on the recovered attempt.
- Connected Chrome opened the existing 15-second real-footage document and verified labeled keyboard-accessible controls for source mute/volume, music selection/volume, recorded voice selection/volume/start and automatic ducking. No main-workspace document was changed or rerendered during this inspection.
- This is state-recovery coverage, not a claim that an OS-level kill during FFmpeg has been exercised. Unmuted source-footage mixing and the new controls still need a connected browser/render walkthrough.

## Delivered

- Insights date/account/currency/attribution filters persist in URLs and survive reload, performance-detail navigation and return to Insights. Both variation entry points pass their selected report scope. New variations refresh the shared creative list.
- Performance has the correct breadcrumb and Insights navigation highlight. Opening an ad's matching form uses that ad's saved mapping and resets confirmation/direction. Changing report filters closes the old ad selection. Loading/error states no longer look like an empty report.
- Feed has persistent search/category filters, a keyboard-accessible discussion dialog, full discussion links, one level of replies, author comment edits, and reversible removal/restoration. Active comment counts include replies. Removed parent comments retain their replies.
- Moderator removals can only be restored by moderators. Comment edits use expected revisions; the editor retains a conflicting draft and requires explicit review before applying it to a newer version. Removed text is blank in ordinary record reads; historical community text is restricted to the author or platform staff. Comments below removed posts cannot be retrieved directly.

## Evidence

### Isolated Chrome walkthrough

Used a SQLite backup and copied media under ignored `.runtime/qa-browser-20260917`, served on loopback port 8788. Main local workspace 8787 and hosted review received no test reports, publications, remixes or posts. Synthetic source names and test content are labeled QA.

1. Prepared a curated reference from an existing rendered derivative in the isolated copy through the publication service. In Chrome, checked reference details/usage, saved a named private collection, and verified the empty Verified results category.
2. Selected destination company media/current campaign, created a private editable remix, changed its headline, and rendered a PNG. Campaign export showed exact document/offer versions and separately identified an older creative's unrendered latest version.
3. Selected one PNG and one MP4. Chrome blocked download navigation with `ERR_BLOCKED_BY_CLIENT`; browser download completion is **not** claimed. Downloaded the same selection through an authenticated local HTTP client: ZIP integrity passed, both media SHA-256 checksums matched stored outputs, and the archive contained matching manifests/copy plus video captions.
4. Pasted a two-row synthetic CSV, read/mapped columns, previewed validation, and committed. Totals were spend 300, leads 15, CPL 20 and outbound CTR 2%. Unavailable video measures stayed unavailable.
5. Reviewed a mapping to the exact new render version, opened its performance preview, checked the separate insufficient-data forecast, and created a private variation that opened in Static Studio.
6. Reproduced and fixed scope loss: filtering September 2 showed spend 200, but the old detail link showed spend 300 across both days. After the fix, dates persist through detail/back/reload, detail shows 200 and the September 1 baseline shows 100. A variation created from filtered Insights stored only September 2 evidence, verified in the isolated database.
7. Created a company-only Feed discussion, filtered Feedback, opened the dialog, posted a comment/reply, edited the parent, removed it, and restored it. Counts changed 2 → 1 → 2; the child survived removal. Escape restored focus to the originating Comments button after list refresh. Full discussion and reload retained the thread. Desktop dialog appearance was inspected.
8. Simulated a concurrent comment edit while the browser held an unsaved draft. Save returned a version conflict without losing the draft. Refresh showed the latest saved text alongside the retained draft and disabled Save until explicit conflict review; the reviewed save then succeeded.

### Automated checks

Production TypeScript/Vite build passes. **23 tests pass**, using temporary databases. HTTP tests require local network access outside the sandbox. New/extended checks cover:

- Filtered performance/prior-period totals and exact variation evidence, including cross-company rejection.
- Shared/private thread eligibility, cross-thread parent rejection, flattened reply ancestry and stale-edit conflicts.
- Author-only editing, moderator remove/restore restrictions, reply preservation, active counts and restoring the latest pre-removal edit.
- Removed-text redaction on direct reads, denied historical-text access for other members, and denied comment access below a removed post.
- Opt-in public profiles and unique handles without private identity fields, safe published-derivative attachments, follows/mentions/notification preferences and shared/company event isolation.

Earlier render, persistence, deduplication, tenant isolation, review authentication, cloud snapshot conflict and backup/restore tests remain passing. Main local database retains one campaign, six creative documents, six completed renders, seven imported originals and no report/CRM facts or test posts.

References checked: [React effects](https://react.dev/reference/react/useEffect) and [native dialog behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## Remaining and next

- These checks cover specific static-remix/export/report/thread paths. CRM import interaction, video remix/storyboard/audio/crash recovery, interrupted imports, full mobile/keyboard/a11y coverage and browser ZIP completion remain open.
- Community direct media and safe link/mention composition are implemented. A connected synthetic file submission plus broader mobile/keyboard/accessibility coverage remain; replies use one level and full-page discussions remain available alongside the dialog.
- Classroom content administration, scoped resources, archives and player/resume now have local and hosted evidence; timed captions and broader device/accessibility coverage remain.
- Continue acquisition-cohort reporting reconciliation, provider/Meta adapters and customer identity/operations. External access, real reports, remaining originals, source-font permission and commercial policy remain required for their live capabilities.
- Application commit `c697eac` is pushed and deployed behind the existing protection. The release-documentation update is tracked separately from the already-deployed code.
