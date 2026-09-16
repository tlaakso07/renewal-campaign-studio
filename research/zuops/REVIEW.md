# Zuops review and enterprise product direction

Reviewed September 15, 2026 · Signed-in Chrome walkthrough

## Executive assessment

Zuops is a broad marketing workspace connecting AI creative production, inspiration, Meta performance, agency operations, and training. Its strongest pattern is the path from an existing idea or creative to a variation, edit, animation, saved asset, and publishing action. Structured briefs and reusable settings make sophisticated generation approachable.

Your product should use that workflow as its starting point and make **each company's approved design system and product library the foundation of every campaign**. Company context should persist through strategy, static design, video, editing, resizing, review, publishing, and performance analysis.

Zuops already has substantive brand functionality: logos, colors, font names, aesthetic and voice tags, descriptions, website scanning, asset folders, and brand selection inside creation tools. The opportunity is to turn this into enforceable, versioned production rules with accurate product representation and a reliable final rendering process.

GPT Astra 6 and Seedance 2.5 are both already visible in Zuops. Your stated preference is to make Astra the lead reasoning/creative-planning model and Seedance 2.5 the lead video model, while retaining selectable alternatives. Static image generation needs its own image-model layer.

## What was actually reviewed

- **92 saved UI snapshots** covering page states, forms, menus, and sub-tabs.
- **24 screenshots**, including the dashboard, generator, copier, remix, editor, brand kit, video tools, model catalog, library, analytics, and automation setup.
- All 17 entries in the AI Models catalog, including their individual creation forms.
- All 17 specialized AI Marketing Tools, plus the core Generator, Copier, Remix, and Editor.
- Brand management, Meta Insights, Auto Ads, all nine agency administration sections, team settings, account settings, billing/credits, API/MCP, community, classroom, support, and VIP access screens.
- One concrete interaction check: selecting an existing brand in Ad Generator filled the company name, industry, and logo, updated preview text/domain, and exposed the Brand Assets picker.

### Method and limits

Firecrawl's live dashboard scrape redirected to `/login` and returned `Loading…`; its URL map found 12 public URLs. Firecrawl did not inherit Chrome authentication. The authenticated inspection used the user's already-open Chrome tab. Both Firecrawl responses are saved here.

This was a product and interaction review. No new generation jobs, ad publishing, purchases, account creation, invitations, or campaign changes were submitted. Existing job details and output controls were inspected; generated media were not subjected to a full audiovisual quality benchmark.

The account has no sub-accounts. Populated CRM workflows therefore could not be exercised. VIP Booking and the real-performance VIP Ad Library showed upgrade gates. Their descriptions were reviewed, but their protected workflows were not. Classroom organization and lesson descriptions were inspected; every video was not watched. Every library item and historical community post was not reviewed. Provider implementation, tenant isolation, scoring accuracy, and backend reliability were not audited.

**Evidence labels used below:** observed UI behavior; product-described capability; proposed enterprise requirement. Model names/specifications are Zuops's displayed labels, not independent verification of every provider API.

See [the complete capture index](COVERAGE.md) for the visited URLs and source snapshots.

## 1. How Zuops fits together

| Area | Observed interface | Why it helps |
|---|---|---|
| Home | Assistant, model selector, image attachment, sub-account/Meta context, tool shortcuts, model cards, recent winning ads, news and tutorials | Gives users multiple starting points and keeps relevant actions close |
| Core ad tools | Generator, Copier, Remix, Editor, image/video modes | Makes each creative intent explicit |
| Inspiration | Community library, filters, scores, favorites, image/video/character/logo categories | Provides a starting point when users lack a concept |
| Production memory | Job history, reuse settings, save, download, send to another tool | Reduces repeated setup |
| Brand context | Saved brands, kit fields, asset folders, scan/upload, picker in generator | Reuses company information |
| Meta performance | Winning ads, campaign metrics, overview, rules, report links | Connects creative work with observed campaign outcomes |
| Auto Ads | Campaign-specific offers, engines, score thresholds, pacing, active hours, publish behavior | Turns individual generation actions into recurring production |
| Agency | Sub-accounts, usage, contracts, onboarding links, payments, white-label, embeds, activity, settings | Supports operating an agency and delivering a client workspace |
| Community and education | Feed, chat channels, polls, tutorials, coaching archive | Helps users learn what to create and how to use the tools |
| Integrations | API documentation, job status, retry/cancel, webhooks, MCP, CRM and Meta endpoints | Allows workflows to be orchestrated outside the UI |

### Main creative loop

1. Choose a brand and a campaign offer, or start from a reference ad.
2. Write a structured brief or custom prompt.
3. Choose generation settings and references.
4. Generate variations in a background job.
5. Inspect results and their settings; edit, remix, animate, or reuse.
6. Save/download, publish to the community library, or enter Meta publishing.
7. Review actual Meta results and create the next iteration.

The observed handoff buttons support this loop. A complete generation-to-publishing transaction was not executed in this review.

## 2. Core creation workflows

### Static Ad Generator

Inputs include saved brand/business name, industry, service area, offer, awareness stage, ratio, logo, up to five reference images, and custom instructions. Advanced options expose roughly 30 concepts, ten psychology angles, tone, objective, and a Facebook Safe Mode setting. Concepts include problem–solution, before/after, social proof, comparisons, objection handling, and offer-led ads.

Controls include variations, output quality, scoring, holiday theming, Winning Offers, and a deliberately unconventional creative mode. The right column shows an ad-shaped preview; previous jobs expose generation details and downstream actions.

**Enterprise implication:** offer, audience, approved claims, company context, and required assets should arrive from the selected campaign. Advanced creativity must operate within company rules.

### Video Ad Generator

Seven front-facing choices were visible: Seedance 2.5, Sora 2, Flux 3, Seedance 2.0, Omni Flash, WAN 3.0, and WAN 3.0 Prime. Guided Brief asks what the video should say/show, company, industry, location, offer, and instructions; a separate action writes the prompt/script and shot list. Custom Prompt is also available. Reference image, ratio, duration, resolution, text-overlay setting, cost, preview, and recent jobs follow.

**Enterprise implication:** separate script/storyboard approval from costly rendering. Preserve the chosen product, presenter, offer, and voice across shots.

### Copier and Remix

Image Copier combines a source ad with a logo, references, brand, offer, output settings, and transformation controls. Results can go to Editor, animation, saved ads, or Meta.

Video Copier accepts an upload or Facebook Ad Library link. Its form says videos over 29 seconds are trimmed. It describes extracting shot timing, framing, spoken script, and roles, then rebuilding with reference people/products/clothing. Branding choices are Keep original, Remove brand, and Replace with mine. A Read this ad action precedes later processing.

Remix explicitly changes the target industry and offer. It provides subtle/balanced/very unique variation strength, optional AI improvement, scoring, seasonal changes, references, and output settings.

**Enterprise implication:** keep composition and creative-analysis workflows, but default to the selected company's own approved assets and original approved messaging. Require explicit treatment of inspiration versus reusable licensed material.

### Editor

Single-image and up-to-50-image bulk modes are visible. Editing categories cover logo removal/replacement, product insertion, headline changes, text extraction/replacement, translation, background cleanup, color enhancement, resizing, and AI improvements. Resize presets cover Meta/social placements and Google Display sizes. Optional animation follows editing.

Bulk mode explicitly disables product insertion and text extraction/replacement. AI Boost can alter colors, offers, urgency, social proof, and trust badges.

**Enterprise implication:** approved logo, exact fonts, offer terms, and product layers should be editable without regenerating the whole image. AI must select approved claims and proof rather than invent them.

## 3. Brand system: what exists and what needs to change

### Observed in Zuops

- Brand name, industry, website, slogan, description.
- Logo and favicon; website scan and logo-color detection are described in the edit form.
- Primary, secondary, and accent colors.
- Heading/body font names entered as text.
- Aesthetic tags and brand voice tags.
- Brand-specific Ads, Assets, and Brand kit tabs.
- Asset upload, scanning, folders, search, and sorting.
- Brand selection in generation fills name, industry, and logo and enables asset selection.

The help text claims every generation uses the brand profile. The interaction test confirms the visible autofill behavior, but does not prove consistent enforcement across models. The inspected brand had zero saved assets; a populated asset-selection workflow could not be tested. Its body-font field contained “Bold,” illustrating why font family, weight, and actual font files need distinct fields.

### Proposed enterprise system

| Layer | Required contents and behavior |
|---|---|
| Company workspace | Client-specific identity, access, asset storage, campaign data, and model policy |
| Visual identity | Approved vector/raster logos, lockups, clear space, minimum sizes, font files/weights, color roles, type scale, grid, spacing, borders, image treatment |
| Product catalog | Exact products/SKUs, variants, packaging, approved angles, transparent cutouts, dimensions, features, and prohibited substitutions |
| Brand world | Locations, uniforms, vehicles, staff/talent, props, character sheets, authorized voice references, motion and audio style |
| Messaging | Voice examples, approved claims and substantiation, prohibited language, CTA vocabulary, offer conditions, required disclosures |
| Templates | Approved static layouts, carousel structures, title cards, lower thirds, captions, transitions, end cards, placement variants |
| Versioning | Draft/approved/retired versions; every output records the version and assets used |
| Validation | Exact logo/typography/layout checks plus image/video review for product and identity drift |
| Review | Roles for creator, brand reviewer, approver, and publisher; comments, revisions, and approval history |

**Key architectural decision:** use models to generate the parts that benefit from generation, then compose exact brand elements using a renderer. Fonts, logos, offer copy, and disclosures should remain controlled layers. For physical product fidelity, prefer approved photography/cutouts or controlled product renders where possible. Reference prompting alone cannot guarantee an exact product in every frame.

Generated material that fails brand/product checks should require correction or review before it becomes an approved deliverable. “Every ad is on brand” is a workflow guarantee to engineer, not a promise to delegate to a prompt.

## 4. All model choices observed

### Chat and tool-specific text models

| Displayed name | Observed placement |
|---|---|
| Zuops | Free default chat option |
| GPT Sol 5.6 | Balanced chat option; usage-based estimate |
| GPT Astra 6 | Premium chat option; usage-based estimate; your preferred reasoning lead |
| Claude Fable 5 | Named in Design & UX Improver; not observed as a general chat option |

### Image and video catalog

These are UI claims and settings captured on the review date. Costs are the initial form's displayed credit quote, where recorded; they are not comparable provider prices or a promise of future pricing.

| Model | Type | Notable displayed controls/capabilities | Initial quote |
|---|---|---|---|
| Nano Banana 2 | Image | Generate/edit/guided FB ad/copier/remix; 2K/4K; catalog says 14 references, visible form says 4 | 1 credit |
| GPT Image 2 | Image | Generate/edit/guided FB ad/copier/remix; four references in form | 1 credit |
| GPT Image 2.5 | Image | Same task modes; quality tiers, background mode including transparency; up to 4K | 1 credit |
| Nano Banana Pro | Image | Generate/edit; eight references; resolution and ratio | 1 credit |
| Sora 2 | Video | Prompt, orientation, duration, reference image, auto start frame | 15 credits at 20s |
| Kling 3.0 | Video | 3–15s; 720p/1080p; sound, multi-shot, first/last frames | 8 credits at initial settings |
| WAN 3.0 | Video | 2–30s; 480p/720p/1080p; sound, frames, three subject references | 10 credits at 5s |
| WAN 3.0 Prime | Video | Same visible input structure; premium tier | 15 credits at 5s |
| VEO 3.1 | Video | 8s; quality/resolution; first/last frames; audio included | 14 credits |
| Seedance 2.5 | Video | 4–30s; 480p/720p; up to 30 image, 10 video, 10 audio references; first/last frames; native audio | 27 credits at 5s/720p |
| Seedance 2.0 | Video | Normal/fast quality; 4–15s slider; nine image, three video/audio references; frames | 13 credits at initial settings |
| Seedance 2 Mini | Video | 4–15s; 480p/720p; nine image, three video/audio references; frames | 7 credits at initial settings |
| Happy Horse 1.1 | Video | 5/8/10/15s; 720p/1080p; first-frame image | 10 credits at 5s |
| Hailuo 3 | Video | 5–15s; described as 2K; image, video, and audio references | 12 credits at 10s |
| Omni Flash | Video | 4/6/8/10s; 720p/1080p/4K; image/video references; custom voice UI | 9 credits at initial settings |
| Gemini Omni 1.1 Flash | Video | 360p–4K; frames, seven image references, video input; frame/reference modes have exclusions | 5 credits at initial settings |
| Flux 3 | Video | 5–20s; 720p/1080p; text/image/frame/extension workflows; native audio | 15 credits at 5s |

Common video controls include text-overlay suppression, background-music suppression, auto-generated first frames, sample previews, and recent jobs. They are not identical across all models.

### Model strategy for your product

- **Astra:** brief interpretation, strategy, audience/offer reasoning, script/storyboard planning, asset selection, creative critiques, and suggested revisions.
- **Seedance 2.5:** preferred video generation route, with approved references attached automatically.
- **Image models:** selectable static-ad and storyboard rendering routes, including the observed OpenAI and Nano Banana families.
- **Alternatives:** expose model choice and relevant tradeoffs while retaining identical company context and review requirements.
- **Capability registry:** one versioned definition per provider model for accepted inputs, mutually exclusive modes, reference limits, duration/resolution, price quote, availability, and retirement status.
- **Provider adapters:** map an internal creative brief to each provider without allowing one model's limitations to leak into every workflow.

Sora requires special treatment: OpenAI's [API reference](https://developers.openai.com/api/reference/typescript/resources/videos/methods/extend) states that its API is scheduled to shut down September 24, 2026. Preserve existing outputs and model provenance; do not base long-term generation availability on the current Zuops catalog. Other model labels and production API access still require provider verification during implementation.

## 5. Specialized tools inventory

| Tool | Observed purpose/input |
|---|---|
| Google Ads Campaign Builder | Business, industry, offer, site, location, lead goal, tone → campaign setup |
| Ad Performance Predictor | Up to ten image/video creatives → described 0–100 score, CPL/CPA estimate, recommendations |
| YouTube Thumbnail Copier | Upload/paste image or YouTube source → thumbnail variations |
| Landing Page / Website Cloner | URL → described HTML/Tailwind clone; explicitly mentions Firecrawl |
| Image Reimaginer | Image URL/upload → variations |
| Video Scene Builder | Guided, single prompt, or up to five shots; scene/dialogue/style/voice controls |
| Logo Generator | Brand kit, audience, personality, colors, type/style; separate copier tab |
| Character Cast | Named reusable character; reference photos, traits, image model, cast sheet |
| UGC Creator | Guided/Copy Person/Single Prompt; 14 visual styles, demographics, scene, voice description, product/logo references |
| Facebook Ad Copy Generator | Up to 20 image/video files, CTA, instructions → copy |
| Website & Landing Headline Generator | URL → described website analysis/headlines |
| Business Offer Generator | Industry or website; market, ticket size, leads/sales goal → ranked offers |
| Landing Page Copy Generator | One to three competitor URLs → page blueprint/copy |
| Design & UX Improver | URL → described desktop/mobile conversion audit and AI-builder handoff |
| Ad Angle / Hook Generator | Website/industry and channel/content type → 20 hooks |
| Instant Form Architect | Industry, offer category, lead-quality goal, follow-up action → form plan |
| Carousel Ad Generator | Brand, offer, references, style, slide count and ratio → multi-slide creative |

Carousel styles include story arc, continuous split, before/after, product showcase, data/proof, feature highlights, talking post, tips, myth/truth, and testimonials. This is useful parity for company campaign systems.

The Scene Builder's multi-shot UI tells users to assemble clips in CapCut. Its voice field explicitly says voice is regenerated per clip and the description is guidance. Integrated assembly and stronger continuity handling are worthwhile enterprise improvements.

## 6. Meta and automated production

### Observed analytics

Winning Ads displayed actual account-linked spend, leads, CPL, CTR, impressions, media type, and campaign state. Filters included campaign, status, media, spend, dates, and sort order. Actions included publishing, exporting, creative copying, ad/campaign start, and budget editing. These action controls were not submitted.

Multi-Account Overview allows selection of up to 25 accounts per load. Reporting offers read-only client report links.

Six automation setup cards were visible: business hours, underperformer pausing, budget scaling, creative fatigue, stalled-campaign restart, and wasted-spend pausing.

### Observed Auto Ads setup

The setup form selects a Meta campaign/ad set, CRM sub-account, industry, brand/logo, and rotating offers. It chooses among Remix, Copier, and Generator engines; can bias toward saved inspiration; accepts campaign-wide instructions; and applies a score threshold.

Pacing, active hours, automatic publishing, email notifications, and a pause-after-three-failures control are present. Auto-publish was on in the inspected creation form. The generated-ad view separates published, pending, below-threshold, and failed items, alongside queue and inspiration tabs.

### Enterprise changes

Use a campaign brief as the unit of work: objective, audience, product, offer, channel, placements, creative variants, review status, and performance. Maintain separate measures for brand compliance, technical validity, predicted creative quality, and measured campaign results.

Default to human approval before external publishing. Tie approval to the exact creative version, copy, destination, and placement. A high AI score alone should not make a creative publishable. Keep budget and campaign-state actions under explicit permissions.

## 7. Why the product design works

These are design judgments based on the inspected interface, not measured usability/conversion claims.

1. **Concrete tasks lower the starting effort.** “Copy,” “Remix,” and “Edit” clarify what input is needed and what outcome to expect.
2. **Guided and advanced paths coexist.** A novice can supply a short business brief; an experienced user can choose concepts, psychology, models, and references.
3. **Reusing references is easier than describing everything.** The brand picker, cast sheets, source ads, and reusable job settings reduce repeated work.
4. **Output handoffs support iteration.** Edit, animate, copy back, save, and publish controls sit near completed creatives.
5. **The ad-shaped preview provides context.** Users see the approximate placement rather than just a settings form. Samples need clearer labeling where they do not reflect the selected output.
6. **Inspiration and education are nearby.** Library filters, example ads, tutorials, and community reduce the blank-page problem.
7. **Background jobs fit slow generation.** Users can move elsewhere while jobs run, and later inspect results/settings.
8. **Measured results are connected to creation.** The Meta view enables choosing what to iterate from actual campaign evidence.

Visually, the inspected app uses a light neutral canvas, white rounded panels, a persistent grouped sidebar, restrained blue accents, upload dropzones, and compact settings. Dense forms are softened by grouping and advanced sections. Your enterprise UI can retain the useful hierarchy while giving campaigns, brand state, and approvals more prominence.

## 8. Friction and evidence-based cautions

| Observation | Consequence for our design |
|---|---|
| Brand profile exists, but many rules are open text and assets remain optional | Add validated structured rules, approved asset selection, and explicit coverage status |
| Body font contains “Bold” | Validate real font families/files separately from weight |
| Nano Banana 2 catalog says 14 references while its form says four | Drive catalog and form from the same capability registry |
| Seedance 2.0 description lists 5/10/15s while form has a 4–15s slider | Keep model specifications and controls synchronized |
| Generator scoring tooltip says free while switch label says 1 credit per three ads; other screens quote different scoring prices | Use one authoritative cost estimate before submission |
| GPT Image 2 promotional news says 0.10 credits while model form shows one | Display current pricing and distinguish old announcements |
| Some sample video badges differ from current resolution/duration settings | Clearly separate demonstration media from the selected job configuration |
| Job views say seven-day retention yet older items remain visible | Specify actual retention behavior; keep approved enterprise deliverables durable |
| General library “winning” labels can be based on AI score; VIP real-data library is separate | Label predictions and actual results distinctly |
| Bulk editor cannot insert products or replace extracted text | Support structured templates/product slots for reliable bulk campaigns |
| AI Boost can introduce urgency, proof, badges, or offer changes | Constrain such edits to approved, supported company facts |
| Community publishing sits near saving/downloading | Distinguish private company assets, client delivery, and public sharing |
| API docs enumerate eight model endpoints while the UI has 17 model entries | Verify real API parity before using documentation as the implementation contract |

No claim is made that the absence of a visible control proves the absence of a backend feature.

## 9. Proposed enterprise production flow

**Company onboarding → approved design system → product/asset catalog → campaign brief → concepts/scripts → reviewed storyboard/layout → generation → exact brand composition → checks → approval → exports/Meta → performance feedback.**

### One concrete example

A window company runs a monthly offer. Its workspace already contains approved window/door product images, staff uniforms, vehicle marks, logo variants, fonts, color roles, presenter references, and the exact offer/disclosure text.

The user selects that campaign and requests six static ads and three videos. Astra proposes different hooks and storyboards using the same approved offer. Approved reference assets are attached to the selected image/video model. Static and video renderers place exact logos, typography, captions, and disclosures. Review flags an incorrect product or inconsistent uniform instead of letting it pass silently. Approved exports carry placement-specific layouts and retain links to the underlying assets, rules, model, and brief.

### Foundation entities

Company → BrandSystemVersion → Product/AssetVersion → Campaign → CreativeBrief → Concept/Storyboard → GenerationJob → CreativeVersion → Validation → Approval → Export/Publication → PerformanceSnapshot.

Every creative version should record its company, campaign, model/version, prompt/brief version, reference assets, brand-system version, cost, lineage, and approval state. Company access controls must apply to assets, job inputs/outputs, previews, and performance data.

### Sensible building order

1. Company workspaces, asset/product ingestion, brand rules, versioning, and approved templates.
2. Campaign briefs, Astra-assisted concepts/scripts, and static generation/composition.
3. Seedance 2.5 video, storyboard approval, character/voice continuity, assembly, branded finishing.
4. Editing, bulk variants, resizing, review, durable library, and export.
5. Meta connection, controlled publishing, performance feedback, and bounded automation.
6. Remaining model adapters and useful secondary tools from the observed parity inventory.

The broad CRM, telephony, billing, and community suite is documented as reference scope. Whether to build those modules should follow the enterprise campaign product's needs.

## 10. Remaining validation before implementation commitments

- Verify production API access, exact model IDs, pricing, limits, availability, and media/data terms for selected providers.
- Benchmark brand/product accuracy using representative approved company assets and repeatable briefs.
- Test generation failure/retry, partial batches, cost accounting, output persistence, and provider replacement.
- Specify each company's approval roles, publishing permissions, brand rules, and product catalog.
- Validate Meta publishing, reporting, and tenant isolation in dedicated test environments.
- If CRM parity becomes required, review a populated authorized sub-account. If VIP parity matters, inspect it with access.

## Selected screenshots

### Ad generation

![Zuops ad generation](/Users/trevor/Documents/ChatGPT/Zuops Remake/research/zuops/screenshots/04-generator.png)

### Brand system

![Zuops brand kit](/Users/trevor/Documents/ChatGPT/Zuops Remake/research/zuops/screenshots/23a-brand-kit.png)

### Seedance video workflow

![Seedance 2.5 controls](/Users/trevor/Documents/ChatGPT/Zuops Remake/research/zuops/screenshots/03-seedance-25.png)

### UGC creation

![UGC creation](/Users/trevor/Documents/ChatGPT/Zuops Remake/research/zuops/screenshots/15-ugc-creator.png)

Full screenshots are in [the screenshot index](SCREENSHOTS.md). Raw UI captures are local research evidence and include account-visible content; they are not a public export.
