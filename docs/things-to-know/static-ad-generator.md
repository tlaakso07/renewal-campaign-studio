# Static ad generator — things to know

_Last updated 2026-09-18. Client (Renewal) approved this quality level on 2026-09-18._

## What it is

Static Studio has three tabs:

- **Create.** Enter the offer, pick a size, click **Generate 4 ads**. The AI designs four complete ads, each from a different concept.
- **Remix.** Pick any ad (your library, the client's past ads, or an upload). The AI reimagines it into four new ads. It keeps only the brand and the offer.
- **Brand templates.** The three exact layouts rebuilt from Renewal's July ads, using the real font files. Use this when an ad must be pixel-exact.

## What makes the quality consistent

Every generation automatically sends the same package to the AI. Nobody has to remember it.

1. The real logo file.
2. A type specimen rendered from the client's real ITC Franklin Gothic Std files. Heavy is for titles and offer amounts. Book or Demi Condensed is for sub-text. No other fonts are allowed (client rule, 2026-09-18).
3. A rotating set of three of the client's real past ads, from 21 stored as the brand's `styleReferences`. They're references for quality and feel, not templates.
4. The brief: brand colours, the exact offer text, the season, the button text and the end date.
5. Hard rules:
   - No testimonials, star ratings or reviews.
   - No readable text inside the photo.
   - No invented statistics, prices, URLs or phone numbers.
   - One logo only.
   - Opaque background.
6. Four different concepts per batch, so a batch is four ideas, not four copies.

These live in `server/adPrompt.ts` (brief, concepts, rules), `server/services.ts` `adBatchPayload` (references) and the brand record (logo, fonts, style references). Changing them changes the quality.

## What is not guaranteed

The AI draws the text itself, so some ads will have flaws. Issues seen so far:

- A typo in a headline ("SAVNGS"). The auto-check caught it.
- A small arrow added to the button text. Harmless, but it was flagged.
- A season word copied from the source ad ("Summer" in an October ad). Fixed in the brief.
- An invented testimonial. That concept is now removed and banned.
- A see-through bottom band. Fixed; ads are now forced opaque.
- Two ads in one batch sharing the same headline.

Every ad needs a human look before it goes live.

## The auto-check

After each ad, a vision model (`google/gemini-2.5-flash` via the Gateway; override with `AD_CHECK_MODEL`) reads the image. It checks for:

- the exact offer strings
- the logo
- misspellings
- wrong season words
- non-brand fonts
- testimonials
- cut-off text
- duplicate logos

Cards show **Offer text verified** or the problem. It flags ads but doesn't block them or regenerate them. Regenerating is a paid choice the owner makes.

It can miss things. It passed the see-through ad.

## Cost and setup

- Images come from GPT Image 2.5 (Sunburst is best, Flare is faster) through Vercel AI Gateway. The local key is `AI_GATEWAY_API_KEY` in `.env`. Hosted Vercel uses OIDC, so no key is needed there.
- Gateway balance checks on 2026-09-18 put a 4-ad batch at roughly $0.32 to $0.50. The top of that range may include other Gateway usage. Every batch asks for confirmation before it spends.
- Tests blank the provider keys so the test suite can never spend money.
- Higgsfield's API key only reaches Soul, Popcorn and Seedance. It can't do designed static ads, so it's used for video and UGC only.

## Custom instructions (verified live 2026-09-18)

Owner instructions sit at the top of the brief and override the creative concept. They can never remove required content: every offer tier, the end date and the button must still appear.

Three live batches used the same instruction ("red brick colonial at sunset with pumpkins, make $3,000 the largest text"):

- The scene was right in 12 of 12 ads.
- The instruction "make X the largest text" went through three versions:
  - Version 1: only 2 of 4 ads followed it, because the AI's own headline competed.
  - Version 2: all 4 followed it, but the AI dropped the other offer tier. The auto-check caught all 4.
  - Version 3 (current): 4 of 4 correct, with both tiers present.
- Known leftover: when instructions are this specific, all four ads in a batch tend to share the same AI-written headline. Type a headline or vary the instructions for more variety.

## Clothing rule (client, 2026-09-18 — statics only)

- People in static ads wear plain, solid brand-colour clothing: black, green, white or grey.
- No logos, emblems, patches or lettering go on shirts or caps, because the AI warps them.
- Verified live: 4 of 4 installer ads came back with plain clothing.
- In that batch the auto-check wrongly flagged two of the four clean ads, likely reacting to green trim on a cap brim or collar. Its wording was loosened afterwards, but it has not been re-run on installer ads. Expect the occasional false alarm, and look at the image before regenerating.
- Video and UGC are not covered by this rule.

## Tips for owners

- Leave the headline blank and the AI writes a different hook per ad.
- Custom instructions steer the scene, e.g. "two-story brick home, make the $3,000 huge".
- Use **One more** to replace a flawed ad without redoing the batch.
- All three sizes are verified live (2026-09-18).
  - 1:1 comes back at 1024×1024, 4:5 at 1122×1402 and 9:16 at 941×1672. All are exact shapes with no cropping.
  - Meta accepts these sizes. Run an upscale if a placement needs 1080-wide masters.
- 9:16 watch-out:
  - In the first live test the AI placed the headline near the top and the logo and date near the bottom.
  - Instagram and Facebook Stories/Reels cover those zones (top 14%, bottom 20%) with their own buttons.
  - The brief now tells it to keep those strips empty.
  - Eyeball 9:16 ads for this before posting to Stories or Reels. Feed placements are fine either way.

## Locked defaults

These defaults are client-approved:

- The model is GPT Image 2.5 **Sunburst**.
- 4 ads per click, 4:5 by default.
- The Franklin Gothic specimen and real-ad style references are always sent.
- The brief includes the typography, season, no-testimonial and no-invented-claims rules.

The test "AI ads: the client-approved quality defaults stay locked in" (`tests/core.test.ts`) fails if any of these change. Update this note and get sign-off before changing them.

## Onboarding another client to the same level

1. Import their logo (a transparent PNG or AI file), brand fonts and photos.
2. Record their colours and typography rules on the brand.
3. Add 10–20 of their best real ads as `styleReferences`.
4. Map their font files (`fonts`) so the type specimen can render.

See `scripts/renewal-ads-setup.ts` for the Renewal example.
