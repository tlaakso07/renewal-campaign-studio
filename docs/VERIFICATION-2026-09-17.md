# Connected walkthrough and Community thread milestone

September 17, 2026. These changes run locally; Ryan's hosted review remains at the September 16 deployment. No production readiness or complete acceptance-row claim is made.

## CRM scope removal

The user removed CRM Outcomes from product scope. The client navigation and route, CRM import choice, Insights coverage card, ad-detail CRM panel, CRM aggregation service and API endpoint were removed. Ad-performance CSV imports, Creative Insights, creative matching and variation workflows remain.

Production TypeScript/Vite build passes and all **21 tests pass**. Tests now reject the retired CRM import type. Connected Chrome confirms the sidebar and Insights import no longer expose CRM and the former `#/crm` route shows Page not found. The existing SQLite table was not dropped, avoiding a destructive migration of local and hosted-review snapshots.

## Assistant provider and Classroom

- Installed AI SDK v6 and integrated the verified `openai/gpt-6-astra` route through Vercel AI Gateway. The adapter uses server-only Gateway/OIDC authentication, eligible tenant-scoped context and a 30-second bounded request. Existing campaign/creative actions and metrics remain deterministic services. A missing or failed Gateway connection produces an explicit local-guide fallback.
- Current-model and authentication behavior were checked against the installed AI SDK docs and current official Vercel AI Gateway model/authentication pages. This shell reports both `AI_GATEWAY_API_KEY` and `VERCEL_OIDC_TOKEN` unset; therefore no live inference success is claimed here. The protected deployment still needs the OIDC smoke test after deployment.
- Added company/platform lesson and recording administration with draft/published/archived states, expected-revision updates, tags, related-tool targets, published video selection, optional company thumbnails/resources and protection against exposing company assets through platform content.
- Added catalog category pills, URL-retained search/filter state, three/two/one-column cards, deep-linked lesson/recording detail, updated date, About/transcript/resources, honest missing-media state, Past Events/Help Sessions archives and resume storage for lessons or recordings.
- Automated tests pass **21/21** and cover owner draft creation/versioned publication, company isolation/private resources, unpublished platform content and rejection of published recordings without media.
- In the isolated port-8788 QA workspace, Chrome created a company-only written lesson draft, published revision 2, opened its deep-linked detail and verified the correct About/transcript/action and explicit no-recording state. No main local or hosted data was reset. A pre-fix owner-draft return-path error found during this check was corrected and added to automated coverage.

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

Production TypeScript/Vite build passes. **20 tests pass**, using temporary databases. HTTP tests require local network access outside the sandbox. New/extended checks cover:

- Filtered performance/prior-period totals and exact variation evidence, including cross-company rejection.
- Shared/private thread eligibility, cross-thread parent rejection, flattened reply ancestry and stale-edit conflicts.
- Author-only editing, moderator remove/restore restrictions, reply preservation, active counts and restoring the latest pre-removal edit.
- Removed-text redaction on direct reads, denied historical-text access for other members, and denied comment access below a removed post.

Earlier render, persistence, deduplication, tenant isolation, review authentication, cloud snapshot conflict and backup/restore tests remain passing. Main local database retains one campaign, six creative documents, six completed renders, seven imported originals and no report/CRM facts or test posts.

References checked: [React effects](https://react.dev/reference/react/useEffect) and [native dialog behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## Remaining and next

- These checks cover specific static-remix/export/report/thread paths. CRM import interaction, video remix/storyboard/audio/crash recovery, interrupted imports, full mobile/keyboard/a11y coverage and browser ZIP completion remain open.
- Community still needs post editing/lifecycle UI, attachments, mentions, follows/notifications, directory/events and complete moderation operations. Replies use one level; full-page discussions are available alongside the dialog.
- Classroom content administration, scoped resources, archives and player/resume verification are the next implementation section.
- Continue acquisition-cohort reporting reconciliation, provider/Meta adapters and customer identity/operations. External access, real reports, remaining originals, source-font permission and commercial policy remain required for their live capabilities.
- Changes are local and uncommitted. Hosted deployment has not changed; review and deploy this milestone separately with existing protection intact.
