# Renewal workspace design

September 17, 2026. Published as `35e1a79` to the existing private review. Extends the user-approved Home and sidebar treatment across
Campaigns, Static Studio, Video & UGC, Templates, Remix, AI Models, Winning Ads,
Creative Insights/performance, CRM outcomes, Creative review, My Assets, Brand
System, Activity & downloads, Campaign export, Feed, Classroom and Settings.
The shared primitives also style the restricted operator/setup surface.

## Visual decisions

- Renewal Green `#6CC14C` supplies selection borders, restrained glow and primary
  actions; labels on green stay black. White translucent panels, subtle neutral
  borders and soft shadows follow the approved reference.
- Shared page headers pair thin outline icons with a small category label.
  Forms, toolbars, notices, empty states, cards, tables and dialogs use the same
  spacing, rounded corners and control treatment.
- Campaign cards and briefs, studio launch forms, layer controls, storyboard
  timeline, template diagrams, model cards and lesson cards have tailored layouts.
- Actual Renewal artwork and imported source photographs remain intact. Verified
  provider artwork is reused in the model catalog; unverified identities keep
  neutral capability icons. Missing sources and unavailable integrations stay
  explicit. No generated substitute assets or fabricated results were added.
- Existing intentional Arial fallback and its narrow Impeccable exception remain;
  Franklin Gothic webfont permission is unresolved. No new suppressions added.
- Canvas document geometry, output styles, exact text, version history, service
  behavior and stored user data are unchanged. UI selection outlines use green.

## Verification

- TypeScript/Vite build and all 20 existing tests passed.
- Chrome: all 17 sidebar workspace destinations reviewed at 1728px and checked at
  390px. No page-wide horizontal overflow; export tables scroll within their own
  container. Representative screenshots inspected for campaigns, studios,
  templates, models, insights, review, assets, Classroom and Settings.
- Existing campaign detail, static editor and video editor checked. Mobile editors
  put the preview first, with controls underneath. Version history opens; scene
  timeline selection, asset detail and Classroom guide navigation work without
  changing the original local campaign/creative data.
- Additional 900px checks cover editor, assets and Classroom. Source previews
  finish loading and retain their full image. Temporary viewport override reset.
- Restricted operator content and populated report/thread detail screens inherit
  the shared components but were not separately browser-retested in this pass.
  Broader workflow/acceptance work remains in the implementation status.

Run locally with `npm run dev` at `http://127.0.0.1:8787`; reuse an existing server
and worker rather than starting duplicates. Hosted release evidence is maintained
in [VERCEL-REVIEW.md](VERCEL-REVIEW.md).

## Accent cleanup

Commit `6694fd1` removes the two decorative left borders from the studio kicker
and Classroom category labels after design-hook review. Both findings were fixed;
none suppressed or left unresolved. The approved green selection glow remains.
TypeScript/Vite build, whitespace checks and Chrome screenshots of both views pass.
