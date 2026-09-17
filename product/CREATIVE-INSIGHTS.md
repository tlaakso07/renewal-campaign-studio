# Creative Insights: measure, understand, remix

September 15, 2026 · Core product requirement · Proposed implementation, not a live integration

> **Current scope update — September 17, 2026:** CRM outcomes are no longer part of the product. CRM metrics, imports and connector plans below are retained only as historical context. Creative Insights now covers authorized ad-performance reporting, creative matching, review and variations without CRM-derived outcomes.

## Product decision

Winning Ads needs actual performance reporting, connected to the company's personal assistant and creation tools. Preserve the simple assistant Home. Put the detailed reporting in **Creative Insights**, and open the same ad-detail experience from Insights, Campaigns and Winning Ads.

The loop is: **create → download and run → measure → identify an opportunity → create a branded variation → compare results**. Direct ad publishing and automated spend changes are separate future capabilities. Downloads remain immediate.

## 1. Three distinct kinds of evidence

| View                       | What it tells the client                                           | Required evidence                                                                         |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Actual results             | What the ad delivered in a stated period                           | Authorized ad-account data or a traceable client report; CRM outcomes when available      |
| Benchmarks                 | How a metric compares with similar measured ads                    | Defined comparison group, metric, dates, sample size and calculation version              |
| Creative review / forecast | What looks promising before launch, or a model's estimated outcome | Review rubric; a validated forecasting model and relevant history for numeric predictions |

The supplied Zuops example labels its CPL as **predicted**. Its score and percentile do not establish actual lead costs. A creative image cannot reveal its spend, leads, sales or ROAS. Public competitor references without performance evidence remain useful inspiration.

Never turn an AI opinion into an “actual” metric. If a forecast is not supported, show **Not enough data for a reliable forecast** alongside a useful creative review. Motion's proprietary scores are a reference for the experience; we have not reproduced or verified their formulas.

## 2. Creative Insights report

Use the company's interface theme with a visual, Motion-inspired reporting layout:

- **Scope:** My company's results / Shared library results. Shared browsing never grants access to another company's private account.
- **Controls:** date range, previous-period comparison, campaign, market, service, static/video/UGC, placement and evidence source.
- **Advanced filters:** nested AND/OR conditions, including minimum spend, lead counts, offer type, hook and creative tags.
- **Grouping:** individual ad ID, exact creative/version, campaign, format, hook, offer or landing page. Names are display labels, not identity keys.
- **Metric picker:** add, remove and reorder metrics; save a view. Default home-service preset: Spend, Leads, CPL, Qualified leads, Cost per qualified lead, Booked appointments.
- **Views:** visual cards, sortable table and trend/comparison charts. Each card includes the actual creative preview, selected metrics and changes from a comparable period.
- **Context:** currency, reporting timezone, attribution settings, source, last successful sync and missing-data status.
- **Actions:** Analyze this report, View ad, Compare creatives, Save report, Export report and Remix for my brand.

Use neutral styling for increased spend: higher spend is not automatically good. Indicate whether improvement means an increase or decrease for each metric. A zero prior value produces “No comparable baseline,” not an infinite percentage increase.

## 3. Ad detail

Left: static preview or playable video, transcript where available, creative tags, source and version.

Right: **Actual results**, **Creative review**, and **Forecast** tabs. Default to Actual results when present; otherwise explain the missing connection and offer creative review.

Actual results includes:

1. Selected period, reporting source, spend, selected outcome and cost per outcome.
2. Time trend and comparison with relevant company creatives.
3. Video attention/retention measures when supplied by the source; label their denominators. Never invent frame-level drop-off from coarse quartile data. Static ads have no watch-rate metric.
4. Funnel: leads → qualified leads → appointments → sold jobs, with unavailable stages clearly marked.
5. Placement/market breakdowns where supported, without summing overlapping breakdowns.
6. Evidence, an interpretation, and a proposed next test.
7. **Remix this ad**, **Create variations**, **Open in studio**, and **Download** for accessible outputs.

Benchmark scores, when enabled, show their metric and comparison group on inspection. Keep creative-quality assessments separate from measured-outcome rankings. A single unexplained “90” must not hide which outcome the ad is good at.

## 4. Home-service metric contract

These are our proposed definitions; source fields and compatibility must be validated during connector implementation.

| Metric                      | Calculation / requirement                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| CPM                         | Spend ÷ impressions × 1,000                                                                     |
| Outbound CTR                | Outbound clicks ÷ impressions × 100; separate from all-click CTR                                |
| Outbound CPC                | Spend ÷ outbound clicks                                                                         |
| CPL                         | Spend ÷ leads under the selected source's event definition                                      |
| Cost per qualified lead     | Spend ÷ CRM-qualified leads attributed to the selected ads                                      |
| Cost per booked appointment | Spend ÷ attributed booked appointments                                                          |
| Lead-to-appointment rate    | Appointments ÷ leads in the same defined lead cohort                                            |
| Cost per sold job           | Spend ÷ attributed sold jobs; label this separately from fully loaded customer acquisition cost |
| Revenue ROAS                | Attributed revenue ÷ spend, with the revenue basis and attribution source visible               |

Do not combine Meta-reported leads and CRM leads into one count. Distinguish website leads, instant-form leads and calls. Deduplicate CRM leads/jobs with stable source IDs. Unmatched outcomes remain unmatched; never assign them to an ad by guesswork.

For CRM outcomes, distinguish an acquisition cohort (leads acquired during the period and their subsequent outcomes) from a calendar activity report (jobs sold during the period). Show the outcome cutoff and conversion lag. Booked contract value, completed-job revenue and collected revenue are different measures; do not silently substitute one for another.

Aggregate ratios using **summed numerators ÷ summed denominators**, not an average of per-ad rates. Do not sum unique reach across ads. Missing data is not zero; a zero denominator displays an unavailable rate with its reason. Keep account currencies separate unless an explicit conversion policy is selected.

### Illustrative calculation only — not Renewal performance

| Creative              |  Spend | Leads | Qualified leads | Appointments |    CPL | Cost / appointment |
| --------------------- | -----: | ----: | --------------: | -----------: | -----: | -----------------: |
| Window showcase       | $1,200 |    30 |              18 |            9 |    $40 |            $133.33 |
| Presenter walkthrough | $1,200 |    48 |              12 |            4 |    $25 |               $300 |
| Combined              | $2,400 |    78 |              30 |           13 | $30.77 |            $184.62 |

The presenter has cheaper leads; the showcase has cheaper appointments in this fictional cohort. That is the comparison a home-service marketing manager needs. It does not prove the creative alone caused the difference: audience, offer, market, delivery and follow-up can also differ.

## 5. The assistant closes the loop

Example request: “Which window ads generated the best appointment costs this month, and what should we make next?”

The assistant retrieves a scoped report, cites the creatives and period, checks sample size and missing outcomes, then explains the observed pattern. Recommendations remain testable hypotheses. Each recommendation can become a structured brief containing the source creative, evidence, proposed change, target metric, current campaign offer and brand version.

**Create three new hooks** preserves the remaining scenes and exact company branding. Save parent/variation lineage. When those variations run, compare their results with compatible reporting settings. Client-requested generation follows the normal visible usage flow; analysis does not automatically spend generation credits, publish ads or change media budgets.

## 6. Shared results and meaningful winner labels

All companies browse the same published reference collection. Each contribution specifies which creative and which metrics may be shared. Publish a separate redacted evidence record; keep credentials, CRM records and private campaign data isolated.

Evidence labels: **Connected account**, **Client-supplied report**, **Curated reference**, and **AI assessment**. A client-supplied report is not represented as independently verified. Include dates, objective, market, source and measurement context on shared results.

Define “winner” against an outcome and comparison group, with minimum spend/outcome evidence. A low CPL alone does not imply good lead quality. Early results receive a **Limited data** label. Avoid ranking unrelated industries, currencies or attribution windows together.

Cross-company benchmarks require permission to use the data, sufficiently large comparable groups and suppression of identifying detail. Start with within-company comparisons. Do not claim a home-service industry percentile based on a handful of selected examples.

## 7. Data and engineering plan

### Inputs

**Confirmed connection requirement:** each company authorizes and selects its Meta ad accounts. History import, automatic refresh, account health and reconnect/disconnect controls belong to the connected pilot. See [Meta connection specification](META-CONNECTION.md). CSV imports remain useful for fallback and reconciliation.

- Authorized read-only Meta account connection for delivery metrics and creative identity. Validate permissions, review requirements, fields and available breakdowns against current provider documentation during implementation.
- Validated CSV import for a pilot and fallback, with mapping preview, account/currency/timezone selection, attribution metadata and error reporting.
- CRM export first, then a selected CRM/call-tracking connector for qualification, bookings and sold-job outcomes. Map source/ad identifiers; surface match coverage.

Neither account connections nor actual Renewal performance data have been obtained in this design phase. The existing asset catalog contains creative files and brand materials, not proof of performance.

### Processing

Read-only connector/import → durable sync jobs → raw source snapshots → normalized daily facts → deterministic metric service → reports → evidence-linked assistant analysis → creative brief/remix.

Records: company connection, sync run, source ad/creative ID, local creative/version mapping, daily fact, attribution configuration, conversion event, CRM outcome, metric definition/version, report configuration/snapshot, creative tag, benchmark cohort and publication evidence.

Use idempotent upserts and recoverable sync cursors. Backfill recent periods for delayed conversions and record revisions. Preserve source creative identity: identical names do not mean identical ads, and dynamic variants do not automatically share one exact asset. Imported and connected facts must not double-count the same delivery.

Enforce company authorization on reports, assistant retrieval, exports and shared publication. Store credentials server-side. A disconnected account has a visible stale-data state. The LLM interprets calculated results; the metric service computes the numbers.

## 8. Build sequence and acceptance

1. **Pilot foundation:** Meta authorization and explicit account selection, actual-result cards/table, metric definitions, ad detail, source labels, saved reports and assistant analysis. Build against an authorized development account and retain CSV fallback. Reconcile results before claiming measured insights work.
2. **Connected pilot:** required external account access, history import, read-only Meta sync, refresh status, date comparisons, tags/filtering, supported video metrics and creative/version mapping. Actual analytics is core scope, not an optional distant add-on.
3. **Business outcomes:** CRM mapping, match coverage, qualified leads, appointments, sold jobs and clearly defined revenue. Imports can establish this before a native connector.
4. **Evidence maturity:** opt-in shared benchmarks, documented relative scores and calibrated forecasts. Numeric CPL forecasting stays unavailable until it meets validation requirements on held-out future periods and new-client conditions.

Acceptance checks: reconcile spend/counts to the same source report and settings; weighted ratios; zero/missing cases; no duplicates after retry/import; timezone boundaries; delayed conversions; cross-tenant access denial; shared-field redaction; correct static/video availability; no causal claims from observational differences; a recommendation opens a private branded remix with evidence attached. Download still requires no agency approval.

## Research

See [Motion research notes](../research/motion/REVIEW.md). This specification adapts an observed reporting pattern to our home-service workflow; it does not assert how Zuops implemented its scores or that it uses Motion internally.

## Visual examples

- [Report dashboard](ui-concepts/11-creative-insights.png)
- [Individual ad results and CPL](ui-concepts/12-ad-performance.png)
- [Forecast and creative rubric](ui-concepts/13-cpl-forecast.png)

All displayed figures are fictional UI examples. [Example data and source labels](ui-concepts/analytics-demo-data.json). The original two-ad calculation above remains a smaller worked example; the gallery adds a third ad and therefore has different totals. No forecast model or live account has been validated by these images.
