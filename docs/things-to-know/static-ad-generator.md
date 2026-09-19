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

## Tips for owners

- Leave the headline blank and the AI writes a different hook per ad.
- Custom instructions steer the scene, e.g. "two-story brick home, make the $3,000 huge".
- Use **One more** to replace a flawed ad without redoing the batch.
- 1:1 and 4:5 are verified live. 9:16 has not been live-tested yet.

## Onboarding another client to the same level

1. Import their logo (a transparent PNG or AI file), brand fonts and photos.
2. Record their colours and typography rules on the brand.
3. Add 10–20 of their best real ads as `styleReferences`.
4. Map their font files (`fonts`) so the type specimen can render.

See `scripts/renewal-ads-setup.ts` for the Renewal example.
