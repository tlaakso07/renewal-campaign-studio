# Renewal by Andersen — reference product experience

September 15, 2026 · Proposed experience for product design

Renewal by Andersen is the user-selected reference for the first complete experience. The user currently works with Renewal and supplied its brand and historical creative sources. Build the working prototype with those assets now; another company will launch first after Ryan supplies its materials. This document does not represent an actual client deployment or an endorsement by Renewal by Andersen. The supplied standards document and extracted brand notes, rather than public screenshots alone, govern the prototype brand implementation.

## Product promise

A company-specific creative studio where a marketing manager enters a monthly promotion, creates the ads they want, and immediately downloads the results. The company system follows them through every tool.

## 1. Our team's setup experience

Create a separate client workspace and configure:

| Setup area | Renewal reference |
|---|---|
| Brand assets | Client-supplied logo files, fonts, colors, usage rules and brand examples |
| Product library | Window and door photography, product references, home exteriors and interiors |
| Company media | Installation footage, employee media, project photos, authorized presenter and voice assets |
| Static system | Product-led, offer-led and problem-led layouts; headline hierarchy; offer and CTA components |
| Video system | Caption treatments, offer graphics, transitions and logo end cards |
| Creative styles | Presenter with product footage, installation story, product showcase and offer commercial |
| Business context | Services, service areas, product facts, tone and supported claims |

The green captions, product-focused photography and logo endings seen in the research inform the reference direction. Exact brand values and source files must come from the company's brand pack rather than being inferred from screenshots.

Before handoff, produce representative static, video and presenter outputs to validate the setup. After handoff, the client creates and downloads independently. Our setup console is separate from the client's daily experience.

## 2. Client home screen

**Company context:** Renewal by Andersen reference workspace.

**Primary prompt:** “What can I help you create today?”

Home is a personal company assistant, closely following the simplicity of the supplied Zuops home screenshot. Center the assistant identity, welcome and a large conversation composer. Include optional campaign context, attachments, two starter prompts and compact Static ad, Video, UGC, Remix and Ad copy shortcuts. Put recent work and asset browsing in their destinations or show them when relevant in a conversation. History provides a quiet way to resume work.

The assistant can answer company questions, find source assets, brainstorm, plan a monthly campaign, write copy and invoke creation/revision tools. Company knowledge, user preferences and conversation history stay separate; chat and studios share the same creative records. See the [assistant specification](COMPANY-ASSISTANT.md).

Below the welcome and toolkit, Home continues into Creative Studio model cards and Latest winning ads, matching the additional Zuops section supplied by the user. The full AI Models catalog and shared Winning Ads library are accessible from navigation. Renewal can browse the same published references as other companies and remix them using its own assets, offer and creative system. Provider logos keep their original identity inside Renewal's themed app; see [shared discovery](SHARED-LIBRARY-AND-MODELS.md).

Use the grouped navigation, clear creation forms and preview/result patterns documented in the Zuops audit. Personalize the entire interface for Renewal: the supplied logo, Franklin Gothic typography, white and black foundation, full-strength Renewal Green action accents, and company product imagery. Use black text on green. Keep creative previews prominent. The app theme and the rules that brand its ads are connected but versioned separately; see the [full build plan](BUILD-PLAN.md).

## 3. Monthly campaign setup

Illustrative campaign name: **September Window & Door Event**.

The client enters or pastes the monthly brief. The app extracts fields for the client to edit:

- Product or service being promoted.
- Offer and exact promotion wording.
- Start and end dates.
- Applicable service area, when needed.
- Financing wording, conditions and required disclosures, when applicable.
- Destination and call to action.
- Audience or desired message, if the client wants to specify them.

Keep the offer blank until supplied by the client in a real workspace. The research contains different regional promotions; none should silently become a universal Renewal offer.

Saving this campaign makes it reusable across all creation tools. Clients can also start inside a tool and attach or enter campaign details there; campaign setup should not become a separate administrative obstacle.

## 4. Three ways to start

| Entry path | Example action | App response |
|---|---|---|
| Create from an idea | “Make a premium window ad showing a bright living room.” | Develop the requested composition using company context and selected assets |
| Remix an ad | Choose a reference with an effective hook or structure | Adapt the concept to this company's offer, assets and visual rules |
| Use a layout or style | Choose a product-led static or presenter video style | Preload a customizable composition or storyboard |

These are starting points inside the same studio. Clients retain creative freedom and can change the direction, layout, scene choices, script or pacing. References with measured performance carry their evidence; other examples are identified as inspiration.

## 5. Static creation screen

**Input panel:** campaign, prompt, chosen layout/reference, aspect ratio, source assets and variation count. Model selection is available where relevant.

**Preview:** large creative canvas with editable text and composed brand elements. Allow direct changes to the headline, photo, offer placement and layout, plus conversational edits such as “Use our other installation photo.”

**Automatic context:** exact brand assets, typography, offer text, company voice and applicable disclosures. Clients should not have to re-upload their logo or describe their brand in every prompt.

**Result actions:** Download, Edit, Create variation and Reuse in video. Copy and captions remain accessible with the output.

## 6. Video and UGC creation screen

**Input panel:** campaign, creative direction, duration, format, presenter if desired, source media and model options.

**Media choices:** company footage, AI-generated scenes/presenters, or a mixture. Preserve these choices per scene so a client can replace one segment without regenerating everything.

**Illustrative story:** presenter introduces the subject → product/home footage → installation or product detail → monthly offer and CTA. The client can change this structure or begin with their own idea.

**Workspace:** preview plus script and scene controls. Support changing a hook, replacing footage, adjusting captions and revising the ending. Apply the company caption treatment, graphics and end card automatically. Exact products use suitable source assets and references.

Generated presenters can deliver company messaging. Authentic customer testimonials use actual authorized customer evidence.

**Result actions:** Download, Edit scene, Create variation and Reuse campaign. No manager or agency approval step.

## 7. Campaign library and downloads

Group outputs by campaign, with versions, formats and creation dates. Show job progress and failed jobs clearly. Completed files are immediately downloadable by the company's workspace users.

The client owns its generated content and handles any internal review or posting. Downloading a file to email a manager is a complete supported workflow. Direct platform publishing is a separate, unresolved integration decision.

## 8. Build priorities proposed for the first release

1. Internal company setup and isolated client workspaces.
2. Persistent company design system, product library and monthly campaign context.
3. Static, video and presenter creation with real/AI media.
4. Curated remix references, layouts and video styles.
5. Focused revisions, saved versions and immediate downloads.
6. Subscription access, clear generation usage and reliable background processing.

Measured winning-ad recommendations can expand when client performance data is connected. Publishing integrations and expanded analytics remain scope decisions. Exact model access and capabilities need verification before implementation commitments.

## 9. Acceptance examples

- A client creates an original static without selecting a template; the company branding still applies.
- The client switches from static to video and keeps the same offer and company context.
- A mixed video retains the selected real product footage alongside generated scenes.
- Changing a headline or one scene preserves unrelated creative elements.
- A completed asset can be downloaded without an approval request.
- One company's assets and campaign context never appear in another company's workspace.

## Supporting material

- [Product concept](CONCEPT.md)
- [Renewal creative research](../research/renewal-by-andersen/REVIEW.md)
- [Zuops product audit](../research/zuops/REVIEW.md)
