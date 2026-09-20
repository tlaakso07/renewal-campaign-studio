# Session handoff — 2026-09-19

Branch: `static-ai-generator`, pushed to GitHub. It is NOT merged to `main` and NOT deployed to the hosted Vercel review. All 32 tests pass (`npm run check`).

## Product direction (confirmed by Trevor)

- The product is "Zuops for enterprise home-service companies", sold by subscription. Each client uploads its brand assets.
- AI engines generate branded Meta ads. Statics use GPT Image 2.5 through Vercel AI Gateway. Video uses Seedance on Higgsfield.
- Reference standards:
  - Renewal's real statics.
  - Renewal's two video ads: `~/Downloads/VO1_1.mp4` and `video 1_1_1.mp4`.
  - The Harley Exteriors ad: `~/Downloads/1x1.June2.1.Video.GH...mp4`.
- The user is in control:
  1. They write each scene and its word-for-word script.
  2. They approve a vision board.
  3. Only then is money spent on video.
- Crew, trucks, products and logos must be correctly branded. Real assets and logos are already in the app. The AI must not invent branding.

## Done

- **Statics: client-approved.**
  - Static Studio has Create and Remix, which make 4 AI ads per click, plus Brand templates.
  - Locked defaults, the font rule, the clothing rule and the auto-check are documented in `docs/things-to-know/static-ad-generator.md`.
- **Video studio** (`#/video`, `app/videoStudio.tsx`, `server/videoStudio.ts`):
  - Scene and script editor.
  - Vision board, with Approve, Redo and "use my photo" for each frame.
  - A server-enforced lock on generation until every scene is approved.
  - Voiceover with word timing.
  - Caption styles: green pills (Renewal) or a top headline (Harley).
  - A building offer card with the real logo and fine print, followed by a logo end card.
  - MP4 assembly.
- **Director** (`server/videoDirector.ts`) writes exact shot prompts.
- **Brand video kit** is stored on the brand record (`videoKit`).
- **Frame inspector** with a fix-and-regenerate loop (`server/frameQA.ts`).
- **Real-logo stamping** module (`server/brandStamp.ts`). It is built and tested on one frame. It is NOT wired into the keyframe step.
- Notes are in `docs/things-to-know/` (static generator, video design system).

## Next, in agreed order

1. Tidy the offer card: larger type, centred vertically. Warn when a scene line is too long for a two-line headline.
2. Send brand references (crew, truck, product, logo) to Seedance with every clip. Today only the start frame is sent. Seedance accepts up to 50 `@Image` references and integer-second timestamps.
3. Build a self-serve brand kit screen for clients. Today `scripts/renewal-ads-setup.ts` does this by hand.
4. Add music and sound effects, and product and proof cards.
5. Wire logo stamping into keyframes. Test whether stamped logos survive animation.

## Blockers and caveats

- **Higgsfield:**
  - The app's Higgsfield **API** account has no credits, so in-app Animate fails with "Not enough credits".
  - Two test clips were run through Trevor's Higgsfield web account at 56 credits each. About 250 credits are left.
- **Spending:**
  - Vercel AI Gateway balance is about $19.
  - Every paid step asks for confirmation. Tests blank the provider keys.
- **Known rough edges:**
  - The inspector raises false alarms.
  - The Director occasionally fails to parse its own output (one retry has been added).
  - The legal disclaimer for Renewal's October offer is still pending.
- **Running the app:** the local app runs from the Claude session. Restart it with:
  `PORT=8787 DATA_DIR=.runtime SERVE_BUILD=true APP_ENV=development DEV_AUTH=true npm run dev`
- **Not committed:** `.obsidian/`, `00-Brain/`, `deliverables/` and the review-guide files (left untracked on purpose).
