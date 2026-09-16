# The company's personal assistant

September 15, 2026 · Confirmed Home direction · Proposed behavior and implementation

## Product decision

Home becomes a full company-aware assistant with the simplicity of the supplied Zuops reference: a centered welcome, one conversation composer, a few starter prompts and compact tool shortcuts. It is the primary way to use the product. Dedicated studios remain available directly and for precise editing.

The assistant helps the client think, find information, plan work, create content and revise it. It can answer a question without forcing a campaign or generate a campaign without making the user manually move through every tool. Each company has its own branded assistant; each user can have personal preferences and conversation history within that company's access boundaries.

## 1. Home anatomy

- Existing company-branded sidebar and compact top bar.
- Small **Renewal assistant** identity above the centered welcome.
- Heading: **What can I help you create today?**
- Subtitle: **Ask a question, plan a campaign, or bring an idea to life.**
- Large composer: **Ask anything about your brand, campaigns, or next idea…**
- Composer controls: attachments, model choice, connected brand and optional campaign context, send.
- Two starter prompts: **Plan this month's campaign** and **Explore a creative idea**.
- Compact toolkit: Static ad, Video, UGC, Remix and Ad copy.
- Quiet access to history and resuming a previous conversation.

Keep the initial welcome area quiet. Below the assistant and toolkit, add **Creative Studio** model cards with provider logos and **Latest winning ads** from the shared cross-company library. Browse all models and View library open their full destinations. These discovery sections are reached by scrolling; active conversations remain focused and can retrieve relevant examples inline. No agency-wide company selector is needed for a client's private workspace. See [shared discovery](SHARED-LIBRARY-AND-MODELS.md).

The assistant identity follows the company theme. Astra is the preferred reasoning direction; model availability remains an implementation verification item. The client does not have to select a model to begin.

## 2. What the assistant can do

| Capability | Example request | Expected behavior |
|---|---|---|
| Company knowledge | “What language do we use for our installation process?” | Answer from the company's documents and show the source; identify missing or dated facts |
| Asset discovery | “Find vertical clips of our installers.” | Return actual matching company files with thumbnails and source links |
| Strategy and brainstorming | “What angles could work for homeowners worried about winter?” | Propose distinct audience/message ideas grounded in the company's services; distinguish ideas from measured results |
| Campaign planning | “Here is October's offer. Build a campaign around it.” | Extract an editable brief, identify missing terms and propose appropriate creative options |
| Writing | “Give me three hooks, a script and Meta ad copy.” | Produce editable copy using the company's voice and campaign facts |
| Production | “Make three statics and a presenter video using our footage.” | Invoke the appropriate generation and composition tools, show job progress, return actual outputs |
| Revision | “Use the second photo. Keep the headline.” | Target the selected element, preserve other layers and save a new version |
| Repurposing | “Turn this static into a short vertical video.” | Reuse the brief, offer and selected assets in a proposed scene structure |
| Shared inspiration | “Find a strong HVAC hook we can adapt for our window campaign.” | Search published shared references, explain the available evidence, and remix the selected structure with the client's own assets and offer |
| Organization | “Save these under our September campaign.” | Attach accessible assets and outputs to the named campaign, with a clear result |
| Work assistance | “Summarize this campaign for my VP.” | Prepare a summary, content calendar draft, checklist or copy document the client can use |
| Learning from results | “Which ads produced the best appointment costs, and what should we make next?” | Query Creative Insights, cite period/source/creative IDs, identify missing outcomes, propose a test and open a branded variation |

This is a useful work assistant beyond image generation. Email sending, calendars, CRM changes, live publishing and spend management require separately implemented integrations and client authorization. Drafting a message or calendar is part of the core writing experience; delivering or scheduling it is a distinct capability.

### Community and learning

The assistant can find eligible Classroom lessons, cite available transcripts and help the client apply a lesson in a studio. It may draft a Feed post for the user, but does not publish company assets, conversations or performance snapshots without an explicit sharing request. Community opinions remain attributed, and company-specific training stays within its access scope. See [Community and Classroom](COMMUNITY-AND-CLASSROOM.md).

## 3. Context and memory

Keep four kinds of context explicit:

1. **Company knowledge:** versioned brand rules, assets, products/services, facts, claims/evidence, terms and source documents shared according to company permissions.
2. **Campaign context:** the selected campaign's offer version, dates, market, audience, brief, creatives and results. An old promotion never becomes a permanent brand fact.
3. **Personal preferences:** the user's preferred answer length, common formats and working style. Preferences can be viewed, changed and forgotten. Personal drafts are not automatically shared company knowledge.
4. **Conversation context:** messages, attachments, selected creative/version, job references and current task. A new conversation can begin without inheriting an unrelated campaign.

Show the active campaign near the composer and make it removable. Store asset and document references with answers so the user can open the source. Retrieved files are data, not instructions that can change company permissions or agent behavior.

A conversational suggestion does not silently rewrite the canonical company design system. An explicit brand-setting edit follows existing role permissions, receives a new version and can be undone. Ordinary creative revisions remain immediate.

## 4. From chat to real action

The assistant and dedicated studios operate on the **same campaign and creative documents**. There is no separate “chat-generated” library that loses the editor's state.

1. Understand the request and retrieve relevant company/campaign context.
2. Answer directly for information or ideation requests.
3. For creation, assemble a structured brief and use sensible existing defaults.
4. Ask a focused follow-up only when a missing fact materially affects the output. Never invent an offer, finance term, testimonial or product fact.
5. Show the proposed generation count and usage estimate before a new paid batch. A clear creation request authorizes its described scope; do not add repeated approval steps. Material cost/scope changes need the user's choice.
6. Invoke bounded tools and show honest queued/generating/composing/ready/failed states.
7. Return actual media previews, editable copy and **Download**, **Open in studio**, **Make a variation** actions.
8. Carry the conversation and selected version into the editor and back again.

“Plan a campaign” produces a plan; it does not automatically spend credits rendering every idea. “Create three ads” can run the specified production without asking the same question again. Completed files always remain immediately downloadable; none of this introduces agency or manager sign-off.

### Example session

**Client:** “Give me three fresh angles for our September window campaign.”

**Assistant:** Retrieves the current campaign and relevant company assets. Suggests three distinct directions with short hooks and useful asset references. Presents a concise explanation, then contextual actions such as **Create static**, **Build video**, and **Edit brief**.

**Client:** “Make the second idea as a 4:5 static and use our living-room photo.”

**Assistant:** Resolves the exact accessible photo, carries over the current offer and brand version, invokes Static Studio's production pipeline, and returns the resulting preview and download.

**Client:** “Now make the same concept into a presenter video.”

**Assistant:** Reuses the approved facts and creative direction, prepares scenes with the requested real/AI media, and uses the video pipeline. The user can open the storyboard or revise it conversationally.

## 5. Conversation interface

After the first message, the welcome collapses into a focused conversation. Keep the composer anchored at the bottom. Use readable assistant responses, compact cards for concepts/assets, real previews for outputs and expandable job details. No simulated activity, invented completion status or permanent wall of controls.

Threads have useful titles, history search and resume. Campaign-linked work follows campaign permissions; private drafts remain private by default. Moving a draft into shared campaign work is an explicit action. Successful jobs persist if the user closes the conversation. Cancellation stops remaining work where supported; partial results remain accessible.

The initial visual set includes the welcome state and a planning conversation state. They are illustrative designs, not a live agent implementation.

## 6. Engineering addition

Add conversation, message, attachment/reference, personal preference, task run, tool invocation and artifact-link records to the architecture. Scope them by company and by user/campaign access as appropriate. A persisted task run connects chat intent to the existing generation queue, usage ledger and creative versions.

Provide typed tools for company search, asset search, campaign read/write, copy drafting, static production, video production, targeted revision, version retrieval and export. Enforce permissions server-side for every tool. Include version checks to avoid editing an outdated creative after the user changed it in the studio.

Tool calls have bounded retries, explicit budgets, cancellation and replay-safe job IDs. A model-generated statement is not evidence that a tool succeeded; only actual tool results create a completed output card. Keep long-running production in durable workers, independent of the live chat connection.

## 7. Pilot scope and acceptance

Actual performance analysis is core through [Creative Insights](CREATIVE-INSIGHTS.md). A deterministic metric service computes results; the assistant interprets them and proposes tests. Company-scoped Meta account connections and read-only sync supply the connected pilot; report imports remain a fallback. See [Meta connections](META-CONNECTION.md). No invented metrics, unsupported causal claims or automatic ad-budget changes.

The assistant is part of the core pilot. Start with company Q&A, asset discovery, ideation, campaign setup and copy. Connect static production as soon as its pipeline works, then video/UGC, remix and targeted revisions. Validate the assistant and direct-tool paths together.

Acceptance examples:

- User starts chatting without choosing a campaign or learning model names.
- Brand questions show the relevant source; unavailable facts are identified.
- Old offer dates do not leak into a new campaign.
- Asset recommendations resolve to actual accessible files.
- A completed output can move from conversation to studio and back without losing its version.
- “Change only the hook” preserves the remaining video structure.
- Refreshing or closing a conversation does not lose production jobs.
- Private preferences, drafts and company assets stay within their access boundaries.
- Usage is traceable and retries do not double-charge.
- Completed assets download immediately.

## Related documents

- [Full build plan](BUILD-PLAN.md)
- [Product concept](CONCEPT.md)
- [UI gallery notes](ui-concepts/README.md)
- [Assistant visual prompts](ui-concepts/ASSISTANT-PROMPTS.md)
