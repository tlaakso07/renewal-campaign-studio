# Motion reference review

September 15, 2026 · Public primary sources and user-supplied screenshots

## Findings

Motion's public site presents visual creative analytics, grouping, creative tags, comparisons and recommendations. It also describes third-party attribution integrations. These are vendor-described capabilities, not independently tested integrations in our app. [Motion](https://motionapp.com/)

Its report documentation covers date controls, performance filters, grouping, selectable metrics, saved reports and visual views. Ad detail provides supported video and delivery breakdowns. These patterns inform our Creative Insights report and shared-ad evidence panel. [Building a report](https://help.motionapp.com/en/articles/7090459-building-your-first-report-in-motion)

Motion's recorded tutorial describes proprietary Hook, Watch, Click and Convert scores. It specifically says its Convert Score is purchase-oriented and advises lead-focused advertisers to use an appropriate outcome metric. Hook/watch measures do not apply to static images. We should implement documented home-service definitions and evidence-linked assessments, not claim to reproduce these proprietary formulas. [Find iteration opportunities](https://motionapp.com/library/talk/find-iteration-opportunities/)

## User screenshot observations

- Zuops detail displays predicted CPL, a creative score, a percentile claim and remix actions. The screenshot does not establish how the prediction was trained or validated, or whether the ad has measured delivery results.
- Motion examples display creative cards, period selection, grouping, metric chips, changes and an advanced filter builder.
- The supplied examples establish a desired experience, not access to their underlying data or score calculations.

## Limits

No signed-in Motion account or customer dataset was inspected. No actual Renewal spend, lead, appointment or revenue data was acquired. We have not verified the user's statement about Zuops deriving its implementation from Motion.

An older Motion metrics help link returned 404. Meta's public Insights documentation fetch returned HTTP 429; exact connector permissions and fields remain an implementation verification task. The product specification's metric arithmetic is explicitly our proposed contract.

## Product implication

Keep assistant Home simple. Add a dedicated Creative Insights destination and integrate its results into Winning Ads, Campaigns and the assistant. Actual analytics enters core scope. Forecasts remain a separately labeled capability that requires calibration. [Specification](../../product/CREATIVE-INSIGHTS.md)
