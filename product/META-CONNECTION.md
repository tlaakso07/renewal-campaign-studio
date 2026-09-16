# Meta account connections

September 15, 2026 · Confirmed core requirement · Implementation specification

## Product decision

Each company connects its authorized Meta ad accounts to its private branded workspace. Performance data automatically populates Creative Insights, campaign reports and the assistant. Connection is part of client onboarding and the connected pilot; CSV import remains a fallback and reconciliation tool.

This repository currently contains plans and UI concepts. No live Meta connection, production backend or account authorization has been established by this specification.

## Client experience

1. A company owner or integration administrator opens **Settings → Integrations → Meta Ads → Connect Meta**. An empty Insights page also offers this action.
2. The client completes Meta's supported business authorization flow on Meta's domain. Our app never collects their Facebook password.
3. Show the authorized ad accounts, with names, IDs, currency and timezone. The client explicitly selects the accounts belonging in this company workspace. Support multiple regional accounts per company.
4. Show **Connected — importing history** and progress. Proposed initial history: 90 days where available. Load recent results first so the client can start using reports.
5. Show **Connected**, selected accounts, connection owner, last successful sync, imported date coverage, next scheduled attempt and **Sync now**, **Manage accounts**, **Reconnect**, **Disconnect** actions.
6. Insights and the assistant read the same scoped performance data. A connection never shares the company's ads or metrics into the cross-company library automatically.

A person with access to several companies must explicitly select the destination workspace before authorization. Never attach every accessible account automatically. Selecting a different account does not merge currencies or silently overwrite existing history.

### Required states

Not connected; authorizing; canceled; permission missing; no accessible accounts; selecting accounts; importing history; connected; sync delayed; reconnect required; disconnected. A company without running ads sees an honest empty state, not a connection error or demo results.

## Data coverage

| Data | Use |
|---|---|
| Ad-account identity, timezone and currency | Correct reporting context and account selection |
| Campaigns, ad sets, ads and supported status/objective fields | Navigation, filtering and report grouping |
| Creative IDs, copy, accessible previews and media references | Match performance to the actual creative |
| Spend, impressions, clicks and supported video measures | Delivery and creative reporting |
| Reported lead/conversion events and values | CPL and source-labeled conversion reporting |
| Supported placement/platform breakdowns | Compare Facebook/Instagram delivery and creative fit |

Exact fields, media access and breakdown combinations require validation against the selected API version and granted permissions. Unsupported data appears unavailable. Connecting an ad account does not promise organic Page/Instagram analytics or unrestricted media downloads.

Reported lead counts are distinct from retrieving identifiable lead-form submissions. Personal lead retrieval is a separate capability with its own permission assessment. Qualified leads, appointments and sold jobs need mapped CRM data or corresponding reliably reported conversion events; do not infer them from clicks. Revenue ROAS is available only with suitable reported values and a stated attribution basis.

## Freshness contract

The product promise is **automatically refreshed reporting with visible freshness**. Do not promise an instantaneous or finalized stream of results.

- Proposed initial schedule: attempt an incremental refresh every **15–30 minutes** for active accounts, subject to measured API capacity. This is our engineering target, not a Meta update guarantee.
- Sync now queues a deduplicated refresh within rate limits. It cannot make upstream results arrive earlier.
- Re-fetch recent periods and run nightly reconciliation for delayed or revised outcomes; configure the lookback around supported attribution settings and observed revision lag.
- Store last attempt, last successful completion, date coverage and any partial failures separately. A completed API call does not establish that today's source data is final.
- Display reporting timezone, currency and attribution basis next to the period. Label current-period data provisional.
- Preserve last good results during delays and show the stale state. Never replace a failed sync with zeros.

Polling is the planned reporting mechanism. Any future webhook supplements must be validated for their specific event type; do not assume a webhook provides every spend or conversion update.

## Authorization and launch dependencies

Meta's official Marketing API collection says apps accessing other people's ad accounts require Advanced Access for relevant permissions. Start the reporting integration with **ads_read** as the intended permission. Assess any additional permission against the exact supported endpoint; avoid assuming business, Page, lead retrieval or ad-management scopes are all required. [Meta's official documentation collection](https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi)

Implementation work must include:

- A production Meta developer app owned by the operating business, supported business login configuration and HTTPS callback URLs.
- App Review/Advanced Access submission for the required functionality; complete business verification and any further requirements presented by the actual app configuration. Confirm these in the developer dashboard before setting a customer launch date.
- A working reviewer demonstration of sign-in, explicit account selection and actual reporting, with privacy and data-deletion information accessible.
- Development-account testing followed by an authorized external-client connection after the required access is granted.

The current direct Meta login/authorization documentation pages were unavailable to the research tool. The precise login configuration, token type/lifecycle, review checklist and API version must therefore be verified during implementation. Do not hardcode an assumed token lifetime or promise automatic refresh-token support. External review timing is not under our control.

## Backend design

**Client authorization → server callback → encrypted connection → scoped account selection → sync queue → source snapshots → normalized performance facts → metric service → Insights and assistant.**

- Require the workspace's integration role for connect, account changes and disconnect. Bind one-time OAuth state to the initiating user, session, company and allowed return destination; reject expired/replayed or mismatched callbacks.
- Exchange credentials server-side; store secrets encrypted and redact them from URLs/logs. Never send provider tokens to the LLM or browser storage.
- Validate each selected account against the provider's accessible accounts and the workspace connection before scheduling work. Enforce company scope on cache keys, jobs, database queries, media access, reports and exports.
- Store granted scopes, credential version, known expiry/access-expiry metadata and health. Support reauthorization after revocation, expired access or loss of account permissions.
- Fetch paginated results. Use asynchronous report jobs for larger queries where supported. Meta's official collection documents these report patterns. [Insights API collection](https://www.postman.com/meta/facebook-marketing-api/folder/zzd6d5p/insights-api)
- Partition backfills into recoverable jobs. Use bounded retries with jitter/backoff, provider usage signals and per-account/app throttling. Incremental syncs and history jobs should not starve one another.
- Make writes idempotent using company, account, date, level/entity, attribution settings and breakdown dimensions. Replacement snapshots update facts rather than adding duplicate spend.
- Keep aggregate facts separate from breakdown facts so reports cannot double-count delivery. Store the request/API/metric versions used to reproduce a report.
- Record source ad and creative IDs and local creative-version links. For ads downloaded and uploaded manually, offer mapping with a preview; names alone do not establish identity. Unmapped ads can still be analyzed.
- On disconnect, stop queued/future syncs, invalidate connection access and remove credential references. Ignore in-flight results from an older connection generation. Handle retained history and deletion according to the declared retention/deletion policy; label retained data historical.

## Delivery order and acceptance

1. Build the real authorization, account-selection and connection-state flow against an authorized development account.
2. Implement scoped history import, incremental sync and metric reconciliation against the same account/date/attribution settings in Ads Manager.
3. Connect Creative Insights and assistant retrieval; prove one ad can be traced from observed results into a private branded variation.
4. Complete required external access review and validate one authorized client, then a second company to prove isolation. Expand onboarding across the cohort after this works.

Checks include canceled authorization, missing account access, wrong-workspace callbacks, replayed state, token revocation, partial sync failure, pagination, retries without duplicate spend, multi-account currency separation, timezone boundaries, revised conversions, disconnect during a job and denial of cross-company reads/exports. Test freshness states with failures, not just the happy path.

This integration imports reporting data. Clients retain the existing immediate download workflow. Ad publishing and budget management remain separately scoped product capabilities.

## Related plans

- [Creative Insights](CREATIVE-INSIGHTS.md)
- [Build plan](BUILD-PLAN.md)
- [Company assistant](COMPANY-ASSISTANT.md)

## Visual example

[Meta connection and sync-health concept](ui-concepts/14-meta-connection.png) illustrates account selection and a possible connected state. Both are labeled as design previews; no client authorization or live integration has occurred.
