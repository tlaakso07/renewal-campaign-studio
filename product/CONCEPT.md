# Company Campaign Studio

Working concept · September 15, 2026 · Discovery draft

## Product promise

Your company's creative department, configured for your business and ready whenever you need a campaign.

The company provides its existing brand and business assets. Our team builds and validates its design system, product library, creative playbooks, and campaign defaults. Once the workspace is handed over, the company enters its monthly campaign or offer, then chooses what to create through familiar Zuops-style static, video, UGC, remix, and editing tools. Every tool automatically uses the approved company design system and campaign context. Clients may create one asset or a coordinated campaign; a fixed output bundle is not required.

“Senior marketing level” means relevant strategy, distinct creative ideas, clear offers, convincing visual execution, accurate company/product representation, and usable campaign deliverables. It needs an agreed review rubric and representative examples; it is not a model setting or a guaranteed campaign result.

## Confirmed direction

- Community Feed and Classroom are confirmed core sections, following the signed-in Zuops review. Preserve its feed/composer/thread and searchable tutorial/player/archive structure in each company theme. Shared community and platform lessons coexist with private company training; see [Community and Classroom](COMMUNITY-AND-CLASSROOM.md).

- Every company can connect its authorized Meta ad accounts through a company-scoped authorization and account-selection flow. Automatic performance sync and visible freshness are core requirements; see [Meta connections](META-CONNECTION.md).

- Creative Insights is core scope: actual ad results, home-service outcomes and evidence-linked recommendations that lead into branded remixes. See [Creative Insights](CREATIVE-INSIGHTS.md). Measured results, benchmarks and forecasts have separate labels and data requirements.

- Initial audience: home service companies; the user reports 11 interested company VPs.
- Customer structure: these are different companies. Each home-service client receives its own tailored enterprise workspace, subscription, company design system, users, assets, and campaign library.
- Managed onboarding: our team does the setup before handing the workspace to the client.
- Familiarity matters: the client likes Zuops's visual design, tool structure, and behavior.
- Home is a company-aware personal assistant with a simple Zuops-style welcome, centered conversation composer, starter prompts and compact tool shortcuts. It can answer, plan, find assets and operate creation tools for the user; see the [assistant specification](COMPANY-ASSISTANT.md).
- Primary deliverables: commercially branded campaign ads, including static and video.
- Company assets and a full company-specific design system are central.
- Each company's app interface is personalized too: its identity, logo, colors, typography, imagery and workspace theme accompany its creative design system.
- After handoff, the company decides who creates content; likely marketing managers and VPs.
- The client enters the monthly campaign/deal and chooses its desired ad type and creative direction.
- Support both real company assets and AI-generated scenes and presenters, including mixed productions.
- Renewal by Andersen is confirmed as the reference company for the first complete product experience; see the linked research and reference experience below.
- Updated implementation instruction: build a working prototype with the supplied Renewal assets now. A different company launches first after Ryan supplies its materials. Do not wait for that future brand pack or treat Renewal as a confirmed launch customer.
- Creative freedom is confirmed: clients can create original concepts within company brand rules, remix reference ads, or start from supplied layouts and video styles. Templates are optional starting points.
- Business model: clients pay a monthly subscription to use their configured workspace independently after handoff.
- Content ownership requirement: content the client creates belongs to the client; our service does not claim ownership of their output.
- Completed outputs are immediately downloadable. No agency or in-app approval is required; clients decide what to use and can handle internal approval externally, such as emailing downloaded files to a manager.
- Preferred model direction: Astra for reasoning/planning and Seedance 2.5 for video, with alternative model choices based on the Zuops inventory.
- All companies can browse a shared Winning Ads library and remix references into their own private company system. Home includes model cards with provider identities and a shared ad feed beneath the assistant. The full Zuops model inventory is tracked with exact API and logo verification required before production enablement; see [shared discovery](SHARED-LIBRARY-AND-MODELS.md).

## Open decisions

Exact output counts/durations, direct publishing integrations, launch scope/date, subscription pricing, and generation allowances remain unconfirmed. A separate enterprise workspace per client company, client ownership of output, immediate downloads without approval, monthly subscription access, mixed real/AI production, and broad creative freedom within brand rules are confirmed. Any regional variations within an individual company can be configured during its onboarding.

This concept describes a proposed experience. It is not a finalized requirements document, technical stack selection, launch schedule, pricing promise, or commitment to every integration at launch.

## 1. Two connected experiences

### A. Internal setup studio

Used by our team to configure each client.

1. Collect logos, font files, guidelines, product/service photography, footage, uniforms, vehicles, spokesperson material, offers, and examples of approved ads.
2. Organize assets by purpose: exact product reference, reusable cutout, location, employee, background, inspiration, or finished creative.
3. Record business facts: services, markets, audience, positioning, objections, differentiators, approved evidence, offer terms, and disclosures.
4. Build the visual system: color roles, typography, spacing, composition, logo rules, image treatment, captions, transitions, and end cards.
5. Create approved creative families: offer-led, problem–solution, service explanation, seasonal, product demonstration, authentic project proof, and others appropriate to that company.
6. Define video behavior: camera style, pacing, presenters, voice, music, branded graphics, and product constraints.
7. Produce a sample campaign and review it with the client.
8. Approve a specific version of the system and activate the workspace.

Handoff means the setup has demonstrated acceptable output. A completed upload checklist alone is insufficient.

### B. Client campaign studio

Used by the company's authorized team to create and manage campaigns.

The home screen is the company's personal assistant and asks, **“What can I help you create today?”** The user can ask about the company, brainstorm, find assets, plan a campaign or request production directly. Campaign context is optional until needed. When creating a campaign, the user provides only information that changes, such as service, offer, audience, location, dates and desired outputs.

The user chooses a tool and creative direction, selects real media, AI-generated media, or a mix, and generates the requested asset. The studio carries the monthly offer and approved company system into every tool. It can suggest concepts and assets while preserving the client’s control over what to make. Results remain grouped under the campaign, with useful revision controls.

## 2. Familiar navigation with campaign organization

| Area | Purpose |
|---|---|
| Home / Assistant | Ask questions, brainstorm, find assets, plan campaigns, create through conversation and resume chats |
| Campaigns | Keep concepts, copy, images, videos, versions, and status together |
| Create | Familiar Generate, Copy/Remix, Edit, Video, UGC, and Carousel tools |
| Library | Approved assets and creatives, organized by company, service, product, campaign, and market |
| Winning Ads | Platform-wide published references, measured results and curated inspiration; remix into the client's private brand |
| AI Models | Full evaluated model catalog with official provider/model identities and current capabilities |
| Brand | View the approved system; authorized users can request or make changes |
| Creative Insights | Core actual-result reporting, comparisons and branded variation recommendations from connected or imported performance data |
| Settings | Company access, subscription, model preferences, budgets, integrations |

Use the Zuops patterns clients recognize: a grouped sidebar, clear tool names, approachable forms, upload/reference controls, preview panels, and nearby result actions. Campaigns provide the organizing structure across those tools.

The workspace itself is company-branded: logo, typography, colors, welcome imagery, controls and workspace identity are configured for each client. A versioned interface theme works alongside the versioned creative design system. Shared navigation and interaction patterns keep the platform consistent while every company receives its own recognizable experience. See the [full build plan](BUILD-PLAN.md) and [UI studies](ui-concepts/README.md).

## 3. Proposed campaign journey

### Brief

Illustrative input: “Create our October window-replacement campaign for homeowners in our approved Portland service area. Use the approved fall offer. I need static ads and short vertical videos.”

Resolve stored facts automatically. Ask focused follow-up questions only when a required campaign choice or approved fact is missing. Do not invent prices, financing terms, deadlines, service areas, testimonials, ratings, or guarantees.

### Choose what to make

After saving the campaign, choose Static Ad, Commercial Video, UGC/Presenter, Carousel, Remix, or Edit. Show the active company and campaign in every tool. Format, duration, creative angle, references, and model alternatives remain available where relevant. Reuse the same campaign for later assets without re-entering the offer or uploading the logo again.

Scope clarification: Carousel is an expansion of the static document model. The core prototype includes static, commercial video, UGC, remix and editing; it must not show a working Carousel action before that expansion is implemented.

### Creative direction

Provide three connected starting paths:

1. **Create from an idea:** describe the desired ad, add references, and choose media and format. Clients can change the story, hook, composition, pacing, and visual direction within their company rules.
2. **Remix an ad:** select a reference from the inspiration library or the company's own successful ads. Adapt its hook, narrative structure, or layout to the client's assets, offer, and identity. Replace the source advertiser's marks, claims, and customer evidence; reference access does not make its footage reusable.
3. **Start with a layout or video style:** choose a curated static composition, storyboard, presenter treatment, caption style, or motion treatment, then customize it freely within company rules.

All paths share the same campaign context, asset library, generation tools, editor, and brand checks. Users can move between paths without restarting or rebuilding their brief. Brand rules govern exact assets, typography, colors, product accuracy, and approved business facts; they should preserve room for original creative direction. Changes to the underlying company system follow the company's assigned permissions.

The inspiration library should distinguish **verified performers** from **curated references** and **unmeasured templates**. For a verified performer, show the metric, date range, market, objective, and source of evidence. Active status, public engagement, and long runtime alone do not establish a winning ad. Previous performance informs a remix but does not guarantee its results. Begin with curated references and approved layouts; add verified examples when authorized performance data is available.

Propose distinct angles with their audience, core message, chosen assets, and reason for inclusion. Examples might emphasize comfort, the cost of delaying replacement, and the current offer. Do not represent superficial color swaps as different campaign concepts.

Clients can preview and revise concepts or storyboards before rendering if useful. This is a creative control for the person making the ad, not a separate approval workflow.

### Production

Produce the selected asset type and its requested variations from the same brief and offer version. Support coordinated batches as an optional workflow. Exact output counts, durations, placements, and turnaround remain discovery questions.

Provide model alternatives as an advanced option. A user requesting an ad campaign should not have to understand model names, reference syntax, or provider-specific settings to get started.

### Revision

Support commands such as:

- “Use our real installation photo.”
- “Make the offer easier to read.”
- “Change only the opening scene.”
- “Use the other approved presenter.”
- “Make variants for these three branches.”

Changes should affect the intended elements while preserving the configured company rules. Changing an offer should identify affected outputs and let the client update matching text and disclosures. Preserve earlier versions; flag outdated offer details without adding an approval gate.

### Delivery

Return named, placement-ready files with matching headlines, primary text, CTA, and campaign organization. Every completed output has an immediate Download action. The client decides whether to use it, revise it, publish it themselves, or send it externally for internal approval. No agency sign-off, approval status, or review queue blocks access to a completed file. Use production states such as generating, ready, or failed, with saved versions and download history. Direct Meta publishing remains a scope decision to confirm.

The monthly subscription provides access to the configured creative workspace. The client's generated content belongs to them. Our team configures and supports the service; it does not approve individual campaigns or control the client's downloads and posting decisions after handoff.

## 4. What the company design system actually contains

### Visual rules

Actual logos and font files, weights, type scales, color roles, logo spacing, grid/layout rules, photography direction, text hierarchy, offer modules, CTA styles, disclosure formatting, and placement-specific safe areas.

### Business and marketing rules

Services/products, geographic restrictions, audience assumptions, positioning, supported claims, current offers, mandatory terms, tone examples, prohibited language, and approved evidence.

### Media rules

Which products must be represented exactly, when real photos are required, which people/voices may be used, how uniforms/vehicles appear, acceptable generated scenes, and which assets cannot be altered.

### Creative playbooks

Approved families of compositions and stories, with guidance on when to use them. A company can have a recognizable visual identity and still create many distinct concepts.

## 5. Engineering the output quality

Use separate planning, generation, composition, and validation stages.

1. **Plan:** Astra interprets the brief, retrieves approved context, proposes concepts, writes scripts, and assigns assets to scenes/layouts.
2. **Generate:** Image models and Seedance 2.5 produce selected visual material. Alternative adapters receive the same business intent and applicable references.
3. **Compose:** A controlled renderer places exact logos, typography, offer text, captions, disclosures, and end cards. Preserve editable design elements wherever possible.
4. **Validate:** Check brand rules, text accuracy, product fidelity, missing terms, legibility, placement, continuity, and technical output.
5. **Deliver:** Make the completed output immediately available to preview, revise, and download. Surface quality findings to the creator as assistance; they do not create an agency or manager approval requirement.

Reference prompting alone cannot guarantee that a generated window, roof, vehicle mark, face, or uniform is exact. Where accuracy is critical, use approved source media or controlled product imagery. Offer clear correction paths when generation drifts.

Validate automated checks against human judgments. AI review can assist quality control, but should not be presented as infallible brand certification or proof of future ad performance.

## 6. Foundation architecture

Prefer one configurable application with isolated company workspaces and versioned company systems. Reuse the platform; customize the client's assets, rules, templates, playbooks, and permissions.

Each client experiences a dedicated enterprise workspace for its own company. Keep company users, private assets, brand context, campaigns, generation jobs, results, integrations, and usage accounting isolated. Our internal setup and support console manages these separate customer workspaces. The client-facing experience opens directly into that client's company context.

This is a recommendation to share the platform code while isolating client data and configuration. The user has confirmed a tailored enterprise product per company; separate physical deployments or custom code forks per client have not been requested.

Core structure:

**Client company → Enterprise subscription/workspace → Configured brand version → Assets/products → Campaign brief → Concepts/storyboards → Jobs → Creative versions → Downloads → Performance (when connected).**

Markets or branches are optional company configuration when needed, rather than a required step in the creation workflow.

Quality findings attach to creative versions as feedback, without an approval gate before download.

Important engineering properties:

- Enforce company access at every asset, job, creative, preview, and integration boundary.
- Record which brand version, offer, assets, prompt, model, and settings produced each output.
- Support background jobs, partial failures, safe retries, cancellation, and clear cost accounting.
- Avoid charging twice or creating duplicate outputs when a request is retried.
- Keep completed client media in durable storage independent of provider download links.
- Provide immediate downloads to authorized workspace users. If publishing integrations are added, separate permission to publish or change ad spend from access to generated files.
- Centralize model capabilities, limits, availability, and pricing instead of duplicating them across forms.
- Make a model retirement a provider change, not a campaign-data migration.

The previous audit includes the observed Zuops model inventory and the confirmed Sora retirement constraint. Production access and exact provider capabilities still need implementation-stage verification.

## 7. Home-service requirements to resolve early

- Confirmed: separate enterprise customers, each with its own configured company system and workspace.
- Configure regional offers, phone numbers, service areas, and landing pages within an individual company only when needed.
- Actual equipment/product/installation accuracy.
- Use of real projects and authentic before/after evidence.
- Seasonal offers, dates, conditions, financing copy, and expiration handling.
- Real staff versus generated presenters; authorized voice assets.
- Confirmed: support both client media and generated scenes/presenters. Resolve required source assets and per-product accuracy rules during setup.
- Confirmed: the client determines its own content creators after our team completes setup; likely marketing managers and VPs.

## 8. Pilot strategy

Use the interested companies to define and test a shared standard of acceptable output. Start by collecting one representative brief, brand pack, and examples of excellent existing ads from each pilot company. Choose a small representative subset for deeper initial implementation based on differences in assets, services, and branch structure.

Evaluate:

- Setup effort per company.
- Time from a complete brief to a client-selected, usable campaign.
- First-pass acceptance and correction rate.
- Correct product/logo/font/offer/disclosure use.
- Genuine variety of concepts.
- Cost per client-selected deliverable, including retries.
- Ability to revise one element without damaging others.
- Ability of the intended client user to complete the workflow independently.

Targets should be agreed with the VPs. Eleven interested stakeholders establish a strong discovery group; paid adoption, repeat usage, and willingness to pay still need validation.

## Discovery questions — round one

1. **Answered:** The company chooses its own content creators after handoff, likely marketing managers/VPs.
2. **Partly answered:** Client enters the monthly deal/campaign and chooses what to create through Zuops-style tools. Counts, durations, placements, and turnaround remain open.
3. **Answered:** Broad creative freedom within company rules, alongside ads to remix, supplied layouts, and video styles. Clients can start from scratch or use these optional accelerators.

## Next decisions after round one

- Three to five example ads that define the desired quality and what makes them good.
- **Answered:** Both real company assets and generated scenes/presenters. Define exact-product restrictions per client.
- **Answered:** Immediate downloads, no in-app approval workflow, and client ownership of generated content. Clients manage any internal review externally. Direct publishing integration remains open.
- **Answered:** The interested VPs represent different companies, each receiving a tailored enterprise workspace. Select the first pilot company and collect its assets and campaign brief.
- Paid pilot launch date and the minimum useful package.
- Monthly subscription confirmed; determine pricing, included generation allowances, expected campaign volume, and operating budget.

## Reference experience

The user selected Renewal by Andersen as the reference. See [Renewal reference experience](RENEWAL-REFERENCE-EXPERIENCE.md) for the internal setup, client screens, monthly campaign inputs, static/video creation, immediate downloads and proposed build priorities. This is a product design example, not an actual Renewal customer deployment.

### Supplied assets and campaign library

The user supplied Renewal brand assets and a separate RBA KY Meta Content collection. The [source-linked library](../library/renewal-by-andersen/README.md) catalogs 424 files across 34 inspected folders: 358 brand/source assets and 66 historical Meta-content files. It includes static ads, videos, explicitly UGC-labeled variants, copy and scripts. Original media remains in Drive; binary import into app storage is still pending.

Use the [extracted brand foundations](../library/renewal-by-andersen/BRAND-SYSTEM-NOTES.md) from the supplied 145-page standards document (revision February 3, 2025) as the design source, rather than estimating colors and fonts from public ads. Past creative styling and dated offers remain references, separate from the configured brand rules. The searchable catalog and JSON manifest are intake artifacts, not a production app library.

## Renewal by Andersen research — September 15 update

See [creative review](../research/renewal-by-andersen/REVIEW.md). Public active ads demonstrate product-led statics, problem-led graphics, presenter footage, installation sequences, and branded end cards. These are creative references, not verified individual performance winners.

### Separate four inputs

1. **Company system:** approved assets, logo/font/color rules, caption and motion styles, layouts, voice, claims, and product references.
2. **Monthly campaign:** offer, products/services, geography, dates, financing wording, exclusions, minimum purchase, CTA, destination, and approved disclosures.
3. **Creative request:** format, duration, angle, desired style, selected assets, and requested variations.
4. **Production choices:** real footage, generated footage/presenter, or mixed scenes; model choices where relevant.

The same brand can run materially different regional offers. Store an offer version with every output; do not let a regional deal become a global brand default. An edited offer should flag older generated assets for the client's attention while keeping them downloadable.

### Brand controls across media

Static compositions use exact logos, font files, approved colors, product media, offer hierarchy, and readable terms. Video controls include script tone, scene references, captions, lower thirds, offer cards, transitions, and end cards. UGC-style work can remain visually natural while following the company’s voice and caption treatment. Generated presenters must not be presented as actual customers or employees unless that identity is real and approved.

### Example client session

A marketing manager creates a September window-and-door campaign, enters their approved regional deal and dates, then selects Static Ad and an offer-first direction. The app loads the company system and campaign automatically. They choose approved window photography, generate variants, and revise the layout. Later they switch to Video for the same campaign, choose a presenter plus real installation footage, and receive a matching script and branded edit. Neither workflow requires rebuilding the brand kit or retyping the promotion.
