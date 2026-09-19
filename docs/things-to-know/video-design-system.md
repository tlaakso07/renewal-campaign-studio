# Video design system and creator funnel (working draft)

_Started 2026-09-18. Sources: Renewal's two reference ads, our first live test, ByteDance's official Seedance 2.5 prompt guide and current Meta creative guidance._

## What the client's references teach

**Reference A — `VO1_1.mp4`.** Live action, 34s, 4:5.
- It's a voiceover commercial built from real footage, with about 26 shots of 1–1.5 seconds each.
- Captions are white text in green pills, 2–3 words at a time, synced to the voice.
- The arc runs hook question, problem, cause, Renewal, product proof (a Fibrex graphic), benefit, CTA, then an animated logo card.
- It looks real because it is real: flat daylight, ordinary homes, candid people.

**Reference B — `video 1_1_1.mp4`.** Renewal's own AI-made ad, 30s, 1:1. This one is the more important lesson.
- It does not try to pass as live footage. It builds a stylized brand world: a black-and-green "holo-lab" where a hand designs a window on a glowing screen, a Fibrex capsule is forged, and a window survives a debris storm.
- A glitch transition follows as the VR headset comes off. It lands on one calm, real-looking payoff shot of a woman on a porch beside her new window.
- A product title card ("ACCLAIM replacement windows") follows, then the offer card, then a social-proof card with fine print.
- Shots run 2–5 seconds, slower than Reference A, with about 11 cuts. The visuals are big and simple, with no hands doing delicate work and no faces acting.
- Claims appear as designed text inside the world ("Exclusive Fibrex material, 2× stronger than vinyl"; "More than 1 million homeowners…").
- The offer and proof cards are exact typography over a brand-green blurred background, never AI-drawn.

**Our first test (15s fall commercial).** It failed because it imitated documentary realism, which is the hardest thing for AI video and where every flaw shows:
- golden-hour glow
- model-perfect people
- staged rooms
- an impossible hallway
- a generic TTS voice

## Principles

1. **Concept first.** Pick ideas where AI's look is an asset, not a tell.
   - Good fits: stylized brand worlds, product "torture tests", macro material shots, transformations, scale and time tricks, before-and-after morphs.
   - Save realism for one or two short, simple payoff shots. Prefer real brand footage or photos for those.
2. **Text is never AI-drawn.** Offer, claims, product names, logo and fine print are exact overlays and cards in our Franklin Gothic system.
3. **Build it shot by shot.** Go from script to storyboard to approved keyframes to short clips to the edit. One bad shot is redone alone.
4. **Precise prompts only.** Each shot is a miniature shooting plan: subject identity, place, timed action beats, one camera move, a light source, an ending state and a continuity block. Banned words are "cinematic", "beautiful", "realistic", "stunning" and "high quality".
5. **Avoid what AI does badly.**
   - Close-up hands using tools, and handshakes.
   - Faces talking without reference identity.
   - Many people in one shot.
   - Readable signage.
   - Architecturally complex interiors.
6. **Design for sound-off, and deliver sound anyway.** Captions and cards carry the message, and the audio should still have music, designed sound effects and a voice.
7. **Meta direct-response rules.**
   - 15–30 seconds.
   - Hook and product in the first 2–3 seconds.
   - One message.
   - The offer on screen long enough to read.
   - The end card held for at least 2.5 seconds.
   - Export each ratio natively.

## Seedance 2.5 facts that change our funnel (official guide)

- **Reference assets:** one request accepts up to 50 reference assets (images, video, audio), addressed as `@Image 1` … in the prompt. We can pin the product window, the logo-free wardrobe, the brand-world style frames and a character sheet. We currently send only one start image.
- **Timestamps:** the model understands integer-second timestamps ("0s–3s: …"). We sent decimals, so timecodes need rounding to whole seconds.
- **Frame control:** first-and-last-frame control and multi-panel storyboard references are supported. Approved keyframes for every shot can steer the clip, not just the first shot.
- **Aspect ratio:** any ratio between 0.4 and 2.5 works by controlling the input asset, so 4:5 can be native.
- **Wording:** it prefers positive descriptions. Negatives are reliable only for "no subtitles" and "no BGM". Our long "NEVER…" lists are weak and should be rewritten as what to show.
- **Prompt structure:** the recommended structure is a one-sentence summary (subject + place + event + style + camera), then a timeline, then consistency notes.
- **Audio:** it can generate sound effects and ambience in sync, such as wind, debris impacts and a window closing with a solid thunk. We generated silent footage and lost all of that.

## The creator funnel (proposed)

0. **Brand video kit** (one-time, per client):
   - the look bible(s) — see "Look bibles" below
   - product reference sheets (real window photos on neutral backgrounds)
   - character sheets for recurring people
   - approved claims with their fine print
   - music beds
   - a voice choice
   - card templates (offer, product title, social proof, logo)
1. **Brief:** offer, audience pain, the one message, length and placements.
2. **Concept** (new step): the Director proposes 3 concepts from a library and scores each on how well it suits AI. The owner picks one.
   - Concept types: brand-world demo, torture test, transformation, macro material, problem-to-relief with real footage, and UGC.
3. **Script + board:** voiceover, shot list with integer-second timing, which shots are AI, which are real, and which are cards.
4. **Keyframes:** a still per shot (not per scene), using the kit's references. Each costs cents. The owner approves them.
5. **Clips:** Seedance with `@Image` references, first and last frames, native ratio and sound effects on. One paid job per shot group.
6. **Cards + captions:** exact offer, product and proof cards, caption pills, and fine print.
7. **Sound:** music bed, voiceover and sound effects, mixed with ducking.
8. **Automated QA** before anyone watches it: a vision pass on sampled frames checks for AI tells (hands, faces, text, warping), brand rules and caption legibility. Flagged shots are regenerated.
9. **Export:** 4:5, 1:1 and 9:16 rendered natively, with captions and the script.

## Look bibles

The kit holds two look bibles:

- **"Brand world":** stylized, black and green, as in Reference B.
- **"Real home":** documentary style, as in Reference A, used sparingly.

The "real home" bible already exists in `server/videoDirector.ts` (`DEFAULT_LOOK`). The "brand world" bible has not been built.

## What exists today vs. missing

| Piece | State |
|---|---|
| Script writer (arc, word budget) | built, tested live |
| Director pass (exact prompts, continuity bible) | built, first output reviewed; "real home" look only |
| Keyframes via GPT Image | built, per scene, not per shot |
| Seedance clips | work via Higgsfield web credits; app's Higgsfield API has no credits |
| Voice + word timing, caption pills, logo end card | built, tested live |
| Offer, product and proof cards in video | offer card exists from the static layouts; product and proof cards missing |
| Concept step, brand-world look, reference sheets, `@Image` references, first and last frames, native 4:5, sound effects and music, automated QA | **missing** |
