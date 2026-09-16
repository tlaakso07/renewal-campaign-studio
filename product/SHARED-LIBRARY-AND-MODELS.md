# Shared winning-ad library and model discovery

September 15, 2026 · Confirmed product addition · Design and implementation specification

## 1. The product has a private workspace and a shared discovery layer

Every company keeps its own dashboard, assistant, theme, brand system, users, campaign data and original assets. Every company can also browse the platform's shared Winning Ads library and common AI model catalog.

The same reference ad can be visible inside Renewal's green workspace and another company's differently branded workspace. Its original visual treatment remains visible for study. A remix becomes a new private creative in the destination company's system.

The shared library is a core feature, not a separate premium VIP area in the current plan. Client originals and drafts do not automatically become shared records. Platform-curated references and explicitly contributed examples populate the shared collection. This preserves both cross-company inspiration and client ownership.

## 2. Home page order

1. **Assistant welcome and composer:** preserve the simple approved Home at first load.
2. **Your toolkit:** compact shortcuts to creation and editing tools.
3. **Creative Studio:** six featured model cards with provider marks, model names, task labels and concise descriptions; Browse all models opens the full catalog.
4. **Latest winning ads:** a horizontally browsable collection drawn from the shared library, with previews, format/industry and a direct library link.
5. Optional quiet resume/history access.

Models and winning ads are below the initial assistant area. Do not shrink the welcome or place a large feed above it. During an active conversation, collapse discovery content so the user can focus on the task; sidebar access remains available.

Add **AI Models** and **Winning Ads** under a Discover group in the sidebar. Keep **My Assets**, **Templates** and **Brand System** distinct. Update this navigation consistently across screens when building the clickable prototype; older concept screenshots may retain the preceding sidebar.

## 3. Winning Ads experience

### Browse

- Search hooks, advertiser/service categories and creative descriptions.
- Filter industry, static/video/UGC, placement/aspect ratio, platform, creative style, date range and evidence type.
- Start with relevant home-service examples, while allowing the client to explore other industries.
- Preview video with captions, inspect static ads, favorite references and organize saved collections.
- Each card offers **View results** and **Remix for my brand** where applicable.

### Evidence tabs

**Verified results** contains examples with attributable performance evidence. **Curated inspiration** contains useful unmeasured creative references. **Saved** contains the user's bookmarks. Shared availability does not turn every item into a measured winner.

The user's Zuops screenshot shows 80+ creative scores. Those visible scores alone do not establish actual campaign performance. Creative assessments and predicted CPL are labeled separately from measured results; numeric forecasts require validation. See [Creative Insights](CREATIVE-INSIGHTS.md).

### Results detail

**Core requirement:** actual reporting and numerical analysis use [Creative Insights](CREATIVE-INSIGHTS.md). Shared-library and private campaign details use common report components with different access scopes. Add selectable metrics, date comparisons, visual cards/table, advanced filters, creative grouping and an assistant action that turns evidence into a branded variation. Prioritize qualified leads, appointments and sold jobs for home services.

Show the metric definition, objective, reporting period, market, placement, currency and available spend/sample context. Link the supporting source. Explain whether a metric is creative-level or campaign-level; campaign-wide results cannot be assigned to an individual ad without evidence.

Compare similar objectives and measurement windows. CTR and cost per lead answer different questions. Date and evidence freshness remain visible. Historical successful creative can remain useful after its offer expires, but the destination remix must use the client's current offer.

The visual concepts show explicitly labeled demo results to explain this interface. No new ad-performance data has been acquired or verified during this design update.

The Community Feed right rail shows recent published ads from this same library. Feedback discussions can link a published reference; Classroom lessons can lead into its remix flow. These links do not expose private source assets or company metrics. See [Community and Classroom](COMMUNITY-AND-CLASSROOM.md).

## 4. Remix for my brand

1. Select a reference and inspect its structure and evidence.
2. Choose what to adapt: hook, layout, narrative, shot sequence, pacing or caption treatment.
3. Use the already selected company; select or enter the destination campaign.
4. Retrieve the company's assets, product references, current offer and creative rules.
5. Replace the source advertiser's identity, offer, product, evidence and people with suitable destination material. Source-media reuse depends on its recorded usage scope.
6. Generate an editable static or storyboard/video through the normal studio pipeline.
7. Save the new creative in the company's private campaign and provide immediate download.

The assistant can perform the same flow: “Use this hook for our October window campaign.” Record reference lineage and what was adapted. Reference selection does not silently update the brand system or authorize a public post.

## 5. Populating and maintaining the shared collection

Sources can include platform-curated public references, licensed reusable media, examples contributed by clients, and performance-linked creative supplied for sharing. Store source links, capture date, usage scope, advertiser identity, media type and evidence alongside each example.

Company contributions are explicit: an authorized company user chooses which creative and which results to share. This is a sharing action, not an approval requirement for generating or downloading. Do not publish private source assets, internal briefs, personal chat history or ad-account credentials. The shared item is a separate publication record, not an unrestricted pointer into a company's media bucket.

A curated item may be retired or corrected without deleting the client's original. Removal from discovery prevents new selection; handling existing remixes follows the recorded usage terms. Deduplicate source versions, track evidence corrections and retain attribution.

The existing Zuops audit is a research input. It is not an imported copy of Zuops's full library, nor proof that every observed media file is reusable. Build our shared catalog from recorded accessible sources and appropriate reusable material.

## 6. Model cards and correct identities

The full model catalog covers all model entries observed in the Zuops audit. Home shows a useful featured subset; the full catalog and studio selectors read the same registry.

### Dedicated All Models page — confirmed

The user supplied Zuops's full AI Models grid as the visual reference. Add a first-class page, not only the six featured Home cards:

- Entry from **Discover → AI Models** and Home's **Browse all models**.
- **AI Models** heading, a concise introduction, model search and grid/list toggle.
- **All Models**, **Image Models** and **Video Models** filters, with a visible result count.
- Three-column desktop grid; responsive two-column and single-column layouts at smaller widths.
- Cards with provider/model identity, name, task label, concise use description and availability. Read capabilities from the shared registry; never copy stale specifications into display-only text.
- The complete 17-entry observed image/video inventory is represented in the concept. Astra and other reasoning choices remain in the assistant selector rather than being mislabeled as media models.
- Card selection opens the appropriate studio with the model preselected and preserves company, campaign and existing brief. For a model supporting multiple tasks, offer its supported task choices.
- Unavailable entries are visibly unavailable and cannot submit generation. Compatible alternatives remain easy to choose.
- Search works with names and verified provider aliases; filters and list/grid switching preserve search and campaign context. Include clear no-results, loading and catalog-error states in implementation.

The All Models concept is included in the gallery as screen 08. Its card artwork illustrates the reference identities; production uses exact sourced marks and verified endpoint/capability mappings. A provisional text identity is not a verified logo.

Each model entry needs:

- Observed display name, verified provider and actual API identifier.
- Official model-specific or provider logo asset, source URL, checked date, light/dark treatment, accessible text and sizing rules.
- Task type and supported capabilities, reference limits, aspect ratios, duration, resolution and audio behavior.
- Availability, compatible tools, usage estimate, retirement/replacement state and last capability check.

Provider marks keep their native colors and shapes. Renewal Green styles the surrounding app controls, not OpenAI, Gemini, ByteDance or another provider's logo. Use exact source assets in production; do not trace raster screenshots or ask an image generator to create production logos. If a product has no separate mark, use its verified provider identity rather than inventing one.

### Logo source checks started

OpenAI's source guidance provides official assets and says to preserve the supplied logo. Google provides product-icon and API-integration guidance; its Gemini Image page establishes the Nano Banana product family. ByteDance's Seed site establishes the Seedance family. These checks identify source locations, not verification of every version displayed by Zuops.

- [OpenAI design assets and guidelines](https://openai.com/brand/)
- [Google product identity resources](https://about.google/brand-resource-center/products-and-services/)
- [Google Gemini Image / Nano Banana](https://deepmind.google/models/gemini-image/)
- [ByteDance Seedance](https://seed.bytedance.com/en/seedance2_0)

The model identities in generated UI studies are visual approximations based on the supplied screenshots. **Exact logo-file sourcing and provider/version verification remain implementation work.** No model is described as integrated merely because a card appears in a concept.

### Complete observed image/video inventory

The names and task types below are the Zuops audit inventory; they are not independently verified current provider specifications. In particular, a familiar model-family name does not prove the version or even its displayed task classification.

| Observed name | Observed task | Logo sourcing treatment |
|---|---|---|
| Nano Banana 2 | Image | Verify exact version and use official Gemini/model identity |
| GPT Image 2 | Image | Verify exact version and use official OpenAI/model identity |
| GPT Image 2.5 | Image | Verify exact version and use official OpenAI/model identity |
| Nano Banana Pro | Image | Official Gemini/model identity; validate integrated endpoint |
| Sora 2 | Video | Official Sora/OpenAI identity; check availability before enabling |
| Kling 3.0 | Video | Verify exact Kling version and source its official identity |
| WAN 3.0 | Video | Verify provider/version and source official Wan identity |
| WAN 3.0 Prime | Video | Verify whether Prime is a provider tier or platform alias |
| VEO 3.1 | Video | Verify exact Veo version and appropriate Google product identity |
| Seedance 2.5 | Video | Verify exact version; official ByteDance/Seed model identity |
| Seedance 2.0 | Video | Official ByteDance/Seed model identity; validate integrated endpoint |
| Seedance 2 Mini | Video | Verify whether Mini is provider naming or a platform alias |
| Happy Horse 1.1 | Video | Resolve exact provider/model before assigning an official mark |
| Hailuo 3 | Video | Resolve exact Hailuo version and official provider identity |
| Omni Flash | Video | Resolve exact provider/model; screenshot icon is not proof |
| Gemini Omni 1.1 Flash | Video | Resolve exact provider/model and its relationship to Omni Flash |
| Flux 3 | Video | Resolve provider, version and task classification before assigning a mark |

The assistant/tool audit additionally observed **GPT Astra 6**, **GPT Sol 5.6**, a **Zuops** default option and **Claude Fable 5** in a specific tool. Astra remains the preferred reasoning direction. Zuops is a competitor's platform label, not a provider endpoint to ship under their name in our app. Its default-selection behavior becomes our own recommended/default option. The other observed entries require exact endpoint and identity mapping.

See [the machine-readable inventory](model-inventory.json). All entries remain design/backlog records until integrated and verified. An unavailable model can have a clear unavailable state; it cannot accept a generation request. “All models” means full inventory coverage and support for verified, accessible services, not fictional working integrations.

## 7. Shared discovery architecture

Add platform-scoped shared-reference, publication, evidence and taxonomy records. Company-private assets and creative records remain company-scoped. Search combines only the requesting user's accessible private content and published shared references, with clear source labels.

The remix job reads a shared reference, then writes a private destination creative under the requesting company. No cross-company original asset fetch is permitted merely because a related ad was shared. Results APIs expose only the evidence included in the publication.

The assistant can search this shared collection and explain its source. It must not inherit instructions from ad copy or scrape content. Model cards, job submission and billing all use the same verified capability registry.

## 8. Acceptance criteria

- Two differently branded workspaces can browse the same published shared ad.
- Their private assets, drafts, conversations and unshared results remain inaccessible to each other.
- A shared reference becomes a private remix using the destination logo, product, offer, fonts and video treatment.
- Verified results expose their source and scope; AI assessments cannot masquerade as measured performance.
- The assistant remains the first-load focal point, with discovery below it.
- Every observed model has a registry entry and verification state; no invented logo or endpoint ships as verified.
- Home cards, full catalog, studio dropdowns and job submission agree on model identity and availability.
- Completed remixes download immediately without an agency approval queue.

## Updated visual concepts

- **Home discovery:** the scrolled Home section with model cards and shared ad examples.
- **Winning Ads:** full shared browsing and a remix detail panel.

The existing assistant welcome and conversation concepts remain the primary entry flow. These additions complete the discovery sections the user highlighted.
