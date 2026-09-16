# Renewal creative studio — UI concepts

September 15, 2026 · Visual direction for review

## The direction

A light, photography-rich creative workspace that feels owned by Renewal by Andersen. White panels, black typography and restrained Renewal Green controls frame the creative work. The same application architecture can load a different company's identity, colors, fonts, imagery and creative system.

**Updated Home direction:** the company's personal assistant is the main entry point. The user supplied a Zuops home screenshot and requested closer simplicity: a centered welcome and composer, starter prompts and compact tool shortcuts. Company knowledge, planning and production tools are connected through conversation. See the [assistant specification](../COMPANY-ASSISTANT.md).

| Concept | What it demonstrates |
|---|---|
| [Assistant Home](01-assistant-home.png) | A quiet centered welcome, conversation composer, optional campaign context and compact toolkit |
| [Static Studio](02-static-studio.png) | Campaign context, assets and formats beside an editable ad, layers, copy, variants and immediate download |
| [Video & UGC](03-video-ugc.png) | Script, presenter, mixed media, per-scene editing, timeline and branded captions/end cards |
| [Brand System](04-brand-system.png) | Company interface appearance alongside the visual rules that shape every creative |
| [Assistant conversation](05-assistant-conversation.png) | A planning conversation with three creative directions, asset references and next actions |
| [Home discovery](06-home-discovery.png) | Model cards with provider identities and a shared winning-ad feed beneath the assistant |
| [Winning Ads](07-winning-ads.png) | A cross-company shared library, result evidence and Remix for my brand into a private campaign |
| [All Models](08-all-models.png) | Dedicated searchable catalog with Image/Video filters, grid/list toggle and all 17 observed media-model entries |
| [Community Feed](09-community-feed.png) | Zuops-style composer, categories, threads and member/events/published-ad rail in the company theme |
| [Classroom](10-classroom.png) | Searchable tutorial grid and coaching/help archives with original home-service lesson examples |
| [Creative Insights](11-creative-insights.png) | Performance summary, CPL, lead quality, appointments, revenue and Motion-style creative metric cards |
| [Ad performance & CPL](12-ad-performance.png) | Individual ad results, video attention, lead-to-job funnel and the next creative test |
| [CPL forecast](13-cpl-forecast.png) | Illustrative estimated CPL range, separate creative rubric and insufficient-data handling |
| [Meta connection](14-meta-connection.png) | Company-specific account selection and an example sync-health panel |

| [Campaigns & monthly brief](15-campaigns.png) | A monthly campaign gathers its brief, offer version, assets and deliverables. Duplicate the previous month, update terms, then create or revise ads without rebuilding the brand. |
| [My Assets & saved creations](16-assets.png) | Original source assets and saved outputs have separate views, searchable tags, versions and private company access. The import panel shows progress and actionable file errors. |
| [Export a complete campaign](17-export.png) | Select finished creative versions and placement formats, include matching ad copy, and download immediately. A manifest preserves the connection between exported files and their source creative. |
| [Team, usage & subscription](18-team-usage.png) | Team roles, usage and subscription controls are organized together. Included allowances and pricing remain undecided; this concept illustrates controls without setting commercial terms. |
| [Internal company setup](19-company-setup.png) | Your team imports assets, configures the theme and creative system, validates sample outputs, and activates a versioned client workspace. This is an internal operator view. |
| [Generation progress & recovery](20-generation-activity.png) | A persistent activity center tracks queued and completed work, partial failures, cancellation and retry scope. Completed downloads remain available while other outputs are processing. |
| [Match exported creative to Meta ads](21-match-meta-ads.png) | Review candidate matches between uploaded Meta ads and exact local creative versions. Names and visual similarity suggest candidates; a confirmed link supplies the reporting connection. |
| [Map CRM outcomes & choose the next test](22-crm-outcomes.png) | A source-agnostic report import maps lead and job identifiers, reviews match coverage, and connects qualified leads, appointments and revenue to ad results. Missing matches remain visible. |

Open [the concept gallery](index.html) to review all twenty-two selected images together. Read the [full product and build plan](../BUILD-PLAN.md) for workflows, architecture, milestones and pilot acceptance criteria.

**Shared discovery addition:** every company can browse the same published ad references inside its own themed workspace. Model cards and Latest winning ads sit below the assistant. The dedicated AI Models catalog covers the complete observed inventory; Winning Ads offers evidence details and a private destination remix. See [shared discovery specification](../SHARED-LIBRARY-AND-MODELS.md) and [model inventory](../model-inventory.json).

## What the images mean

These are generated design studies, not screenshots of working software. Sample imagery, people, copy and ad compositions are illustrative. They are not imported Renewal deliverables or performance-verified ads. The supplied September campaign informs the context; the images do not authorize a new offer.

Production uses actual approved logo artwork and source fonts. The wordmark lettering in these concepts is a placeholder, not a newly approved logo. Raster-generated colors, type and canvas proportions are not exact implementation specifications. Use the brand source and the build plan to implement them correctly.

The interface contains no agency approval flow. Every completed creative can be downloaded by authorized client users. Brand checks assist the creator and do not create a manager sign-off queue.

The shared-library mockup uses illustrative advertiser identities and explicitly marked demo metrics. These are not newly verified winning ads. Provider marks in generated model cards are visual approximations from the reference; production requires official source assets and verified model/provider mappings. Native provider colors are retained inside each company's themed app.

Preferred provider names shown are design intent. Production identifiers, availability, price and supported features require verification before enabling them.

## Generation record

Generated with the built-in image-generation tool. The initial Home image established the visual direction; Static Studio refined typography; Video & UGC and Brand System use Static Studio as a visual reference. The final Home edit corrects serif ad-preview typography and removes an unverified generation-time promise.

Initial prompts are saved in [PROMPTS.md](PROMPTS.md). The updated assistant images use the user's supplied Zuops screenshot and the preceding Renewal concepts; their full prompts are in [ASSISTANT-PROMPTS.md](ASSISTANT-PROMPTS.md).

Home discovery and Winning Ads were generated with the built-in image tool using the latest user-supplied Zuops reference and the Renewal assistant shell. Their prompts are saved in [DISCOVERY-PROMPTS.md](DISCOVERY-PROMPTS.md). The latest two images add Discover navigation; preceding screenshots will receive matching navigation in the interactive prototype.

All Models uses the user's full catalog screenshot and the Renewal discovery shell. Its prompt is in [ALL-MODELS-PROMPT.md](ALL-MODELS-PROMPT.md). It illustrates the complete observed media inventory; exact provider marks and API availability are not established by generated card artwork.

`01-assistant-home.png` is the current selected Home. `01-home.png` and `01-home-initial.png` preserve the earlier dashboard direction. `05-assistant-conversation.png` shows the assistant after a request. The Brand System image's miniature Home preview still illustrates the earlier direction; its production preview should use the selected assistant Home. Original tool outputs are retained in the generation directory and project copies are stored here.

## Implementation follow-through

- Replace identity placeholders with the supplied official artwork.
- Map supplied font files to permitted roles and confirm web/creative font usage.
- Enforce exact source color values and accessible control states.
- Implement real placement dimensions and safe areas rather than measuring raster mockups.
- Populate sample cards with imported source media and genuine job/version state.
- Validate the same screens with a second company's theme before scaling to all clients.

## Community addition

Feed and Classroom were reviewed directly in signed-in Zuops. [Review and evidence](../../research/zuops/community-review/REVIEW.md). The two new concepts use captured layouts and our existing company shell. Sample contributors, posts, lesson titles and training thumbnails are illustrative. No community backend or real lesson catalog has been deployed.

See [Community and Classroom](../COMMUNITY-AND-CLASSROOM.md) for the parity map, private/shared access model and acceptance criteria. Full prompts are in [COMMUNITY-PROMPTS.md](COMMUNITY-PROMPTS.md). Built-in image generation was used; approved production logos/fonts remain required.

## Analytics visuals

Screens 11–14 fill the earlier visual gap: Creative Insights, individual ad performance/CPL, forecast/creative review, and Meta account connection. The same [fictional dataset](analytics-demo-data.json) drives the performance examples; totals and ratios were checked before generation. The forecast range and review score are illustrative interface content, not validated model results. Meta status panels do not represent an actual connection.

[Full prompts](ANALYTICS-PROMPTS.md) are saved. Built-in image generation used the user-supplied Motion/Zuops analytics references and our current Renewal shell. Images are raster design studies; exact metrics and color/type fidelity must come from deterministic rendering in implementation.

The report comparison control illustrates a supported feature; no prior-period fixture is provided, so the final report intentionally omits percentage-change badges. A static ad must not display a video duration or attention metrics.

## Complete workflow addition

The [workflow sample fixture](workflow-demo-data.json) explains creative IDs, export counts, Meta links and the CRM preview. Each screen illustrates a separate stage, not a simultaneous live state. The [analytics fixture](analytics-demo-data.json) supplies the linked example outcomes. Earlier generation drafts are preserved with `-initial` filenames where refinements were made.

Screens 15–22 cover Campaigns, Assets, Export, Team/Usage/Subscription, internal Company Setup, Activity, Meta ad matching and CRM outcomes. Read [the connected flow specification](../WORKFLOWS-AND-RESULTS.md). The gallery includes a linked journey across these concepts. These are design walkthroughs, not working uploads, authentication, billing or reporting. Pricing and model/provider validation remain open. Built-in image generation was used; [full prompts](WORKFLOW-PROMPTS.md) are saved.
