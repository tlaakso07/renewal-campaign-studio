# Video Production Brief Standard

_Adopted 2026-09-21. This is the required format for every video the product makes, for every client._

**Source.** GrowthHub's production brief for Renewal by Andersen, Fall Savings, Batch 1 (three concepts: testimonial, UGC real-life working, infomercial). GrowthHub is the agency producing Renewal's professional ads, and this brief is what their editors build from. The original text and the three storyboard pages are kept in `research/growthub-production-brief/`.

**Rule.** No frame, clip, voice or music is generated until a complete brief in this format exists and passes the checks in section 6. The in-app agent writes the brief. The client reads and approves it as a storyboard. The build plan is in `product/VIDEO-AGENT-PLAN.md`.

**Authority.** This supersedes the "creator funnel" and the single house look in `docs/things-to-know/video-design-system.md` wherever they disagree. The Seedance facts in that file still apply.

---

## 1. What a brief is

One brief covers one campaign and holds one or more **concepts**. Each concept is a complete, standalone video: it never depends on another concept. A concept has twelve parts, always in this order:

| # | Part | Who fills it |
|---|---|---|
| 1 | Title block | agent |
| 2 | Quick Specs | agent, from the format preset and brand kit |
| 3 | Concept DNA check | agent, from the client's past briefs |
| 4 | Global Negative Prompt | brand kit + format preset |
| 5 | Client materials needed | agent (deterministic: what the kit lacks) |
| 6 | Reference Videos | brand kit |
| 7 | Avatar Bible | brand kit, or agent when no real person is on file |
| 8 | Product Bible | brand kit + this month's offer + the format's required shots |
| 9 | Scene-by-Scene Breakdown | agent |
| 10 | Voice Direction Packet | agent |
| 11 | Music Direction | agent |
| 12 | Editor Checklist | code (section 6) |

The campaign header above the concepts carries: Client, Campaign, Offer (exact text), Disclaimer (exact text and its type size), the list of concepts, and the formats requested.

---

## 2. The twelve parts, exactly

### 2.1 Title block

Three lines, this shape:

```
Concept 1 — The Draft We Didn't Know We Were Paying For
AI Testimonial | Fall Savings | Batch 1 of 2
30s runtime | 8 scenes | 1x1 / 4x5 / 9x16 | Testimonial
```

- The title is a phrase a viewer could say, never a description ("No Subs, No Shortcuts", not "Installer UGC video").
- Line 3 is computed from the scene table. It is never typed.

### 2.2 Quick Specs

Eleven rows, always all eleven:

| Row | Format | Example |
|---|---|---|
| Campaign | name — batch (deadline) | Fall Savings — Batch 1 of 2 (Sept 21 client deadline) |
| Concept | title — structural device | …Paying For — transformation-arc testimonial |
| Hero product | product — key material or feature | Window & door replacement — Fibrex frames |
| Format | how it is made and who is on screen | AI-generated testimonial, direct to camera |
| Platform | platform — ratios | Meta — 1x1, 4x5, 9x16 |
| Runtime | whole seconds | 30 seconds |
| Total VO | words / approx. seconds spoken | computed, never typed |
| Locations | the client's real region, plus a "never" | Kentucky suburban home (never Oregon/Harley-style forest) |
| Color grade | one line | Warm, natural daylight, trustworthy homeowner tone |
| Pacing | style — minimum scene rate | Cinematic — minimum 1 scene per 4 seconds |
| Brand tone | three qualities | Warm, plainspoken, never salesy |

Location, colour grade, pacing and tone belong to the **concept**. The three Renewal concepts use three different grades (warm daylight; desaturated phone look; bold saturated). There is no single house look.

### 2.3 Concept DNA check

One short paragraph. It names the client's most recent briefs and states how this concept differs in **format**, **emotional register** and **structural device**. A concept that matches a recent brief on all three is rejected and rewritten.

### 2.4 Global Negative Prompt

Five to seven bullets, applied to **every** generation in the concept.

- **Base set** (every concept): malformed hands and limbs; distorted faces and uncanny skin; garbled text, watermarks and logo ghosting; wrong brand colour; the brand's known misspelling; the wrong region's landscape.
- **Format set** (one or two bullets that protect the tone):
  - Testimonial: staged stock-photo smiling, fast cuts, upbeat pop score.
  - UGC: polished or stabilized camera work, studio lighting, scripted-sounding delivery.
  - Infomercial: low-energy pacing, muted grade, quiet music, small or illegible price text.

Engine note: Seedance follows positive wording better than negatives. The brief keeps this list in the agency's words for people to read. The Director (section 5) rewrites each bullet as what to show when it builds engine prompts.

### 2.5 Client materials needed

A plain list of what is missing and what that forces. Example: "No real client testimonial footage or quotes on file → this draft uses an AI-generated homeowner avatar. Recommend requesting a real customer quote." Code generates it from the brand kit — no real people, no reference videos ("→ direction pulls from general <format> tradition"), no approved claims, no region — then appends the writer's own items, deduplicated.

### 2.6 Reference Videos

A four-column table: **Video | Link | What to take | What not to take**. Both "take" columns are required. A reference with no link is listed in part 2.5 as missing, not left as "(reference link not yet added)". When there are none, say so in one sentence and name the general tradition the direction pulls from.

### 2.7 Avatar Bible

A heading of `Name — Role`, then bullets:

- age range and locale ("Age 63-68, Kentucky suburban homeowner")
- wardrobe
- energy, in three qualities
- a search reference line (for casting a voice or a reference image)
- **real photo assets on file, by filename,** when the person is real (Al, the A-Team service tech, has four)

When nobody is on screen, the heading is "No on-screen avatar" and the bullets say who carries the piece instead (the announcer's voice, b-roll, which asset library to reuse for continuity).

### 2.8 Product Bible

Bullets, exact and checkable:

- brand name spelling, with the wrong spelling named ("always 'Renewal by Andersen' — never 'Anderson'")
- product colour per brand standards
- brand colour, described and sourced (flat, muted green from the approved brand PDF)
- **offer text, exact**, in quotation marks
- **disclaimer, exact**, in quotation marks, with its type size
- scope limits of the offer ("names windows only — door imagery may appear as service scope, but do not visually imply the discount applies to doors")
- required shots (three or four), from the format preset's `requiredShots` (`library/video-formats.json`)

The product colour line comes from the brand kit's PRODUCT note, the brand colour from the company's brand colour, the "windows only" scope line only when the offer's tiers name windows, and the disclaimer line always ends "— six-point font, every video".

### 2.9 Scene-by-Scene Breakdown

The core of the brief. Five columns, one row per scene. Grammar for each column is in section 3.

| Scene / Dur | VO / Script | Image Prompt | Video + Camera | Editor Note |
|---|---|---|---|---|
| 01 / 4s | "Starting every October, this window lets the cold right in." | Older woman in a cozy cardigan standing at a frosted window, warm interior lamp light, photoreal, medium shot. | Slow push in on window frost \| 50mm eye-level push. | Hook. Hold long enough to read her breath on the glass. |
| 02 / 3s | "We'd crank the heat and still have to bundle up." | Same woman adjusting a thermostat dial, warm lamp-lit living room, photoreal close-up. | Static close-up on hand and dial \| 85mm macro static. | Quick beat. Vary from S1's push with a static macro. |
| 04 / 4s | "Renewal by Andersen sent one crew, start to finish, and no subcontractors." | Renewal by Andersen branded van with one crew unloading windows, suburban Kentucky driveway, daylight, photoreal wide shot. | Wide static establishing shot \| 24mm wide, low angle. | Use real A-Team asset photos if available; Kentucky driveway, never Oregon forest. |
| 08 / 4s | "Right now it's Fall Savings. Save up to three thousand dollars." | Fall Savings offer card over an autumn leaves background, Renewal by Andersen brand colors, clean graphic. | Static hold on offer card \| graphic overlay, no camera movement. | CTA scene. Disclaimer in six-point font, hold 2 seconds minimum. Confirm "Andersen" spelling. |

Graphic and silent scenes, from the infomercial concept:

| Scene / Dur | VO / Script | Image Prompt | Video + Camera | Editor Note |
|---|---|---|---|---|
| 02 / 2s | Music only | Old drafty window close-up wipe transitioning into a bright new Fibrex window, daylight, photoreal. | Fast wipe transition \| 35mm whip pan. | Pure visual beat, no VO. Music hit lands on the wipe. |
| 04 / 2s | "Buy five windows, save a thousand." | Big bold graphic: "5 WINDOWS = $1,000 SAVED", brand colors, autumn leaves background. | Static graphic hold, quick zoom punch \| overlay. | Price reveal 1 of 2. Numbers must match the offer exactly. |
| 12 / 1s | Music only | Both price numbers, "$1,000" and "$3,000," slam onto screen together in brand colors with a quick flash. | Fast graphic slam with flash transition \| overlay. | One-second punch beat before the final CTA. No VO here. |

These rows are the agency's, word for word, to show the format. Some of their lines run over pace (section 4); a brief we write must not.

The storyboard shown to the client is this same table with a frame in the image column and running timecodes (`0:00 - 0:04`) under each scene number. **Key scenes** (proof points, emotional beats, price reveals, the CTA) are tinted so the eye finds them. The layout is in `research/growthub-production-brief/storyboard-*.png`.

### 2.10 Voice Direction Packet

Five numbered sections, then a QC line.

1. **Voice Role + Archetype.** Who is speaking, as whom, and who they are not. Ends with a reference archetype: "the neighbor who tells it straight over coffee"; "the contractor your neighbor recommends".
2. **Emotional State + Speaking Style.** Primary emotion, secondary emotion, pace in words per second, a "never sound…" list, and where a natural breath lands.
3. **Emphasis + Pauses.** Two columns, **Emphasize** and **Never emphasize**, then pause rules with scene numbers: short 0.5s, medium 1s. Every quoted word must exist in the final script.
4. **Voice prompt + settings.** One paragraph describing the performance, then four settings: Stability, Similarity, Style (0–100) and Speaker Boost (on/off). The agency's values: testimonial 45 / 80 / 25 / On; UGC 40 / 78 / 35 / On; infomercial 35 / 75 / 50 / On.
5. **Performance Variants.** Exactly three, A, B and C, each one sentence. All three are generated and the client picks one.

**QC line:** sounds human, natural breathing, no rushed lines, no over-emphasized product names, feels like a private moment, not a broadcast. **If any check fails, regenerate. Do not patch.**

### 2.11 Music Direction

- one sentence of style, with what it must never become ("warm and understated — never a hard cinematic swell")
- tempo as a BPM range (70–80 testimonial; 90–100 UGC; 120–130 infomercial)
- **timing anchors**, tied to scene numbers: where it enters, where it swells or hits, where it settles, how it ends
- a **Never** list of three

### 2.12 Editor Checklist

Sixteen lines before the board, four after the render. Section 6 defines them and makes code responsible for each one.

---

## 3. Column grammar

Precision here is what makes the output look professional. Each column has one shape, and the agent does not leave it.

### 3.1 Scene / Dur
- Two-digit scene number and whole seconds: `05 / 4s`.
- Footage and card scenes run **2, 3 or 4 seconds**. A punch beat may run 1 second. The final CTA card runs 3–4 seconds.
- Durations add up to the runtime **exactly**.
- The pacing rule from Quick Specs holds: cinematic formats never exceed 4 seconds a scene; fast-cut formats never exceed 2 seconds, except the final card.

### 3.2 VO / Script
- The exact words, in quotation marks, with punctuation. Or the words `Music only`.
- First person for testimonial and UGC. Announcer voice for infomercial.
- Spoken numbers are written as words ("save a thousand", "October thirty-first").
- The line must fit its scene (section 4).

### 3.3 Image Prompt
One sentence, 12–25 words, in this order:

`<who, with identity> <doing what>, <where>, <light>, photoreal, <shot size>.`

- The avatar's first footage appearance describes them by type and wardrobe, with the Avatar Bible's wardrobe phrase verbatim ("Older woman in a cozy cardigan …"). Every later appearance starts **"Same woman"** / **"Same man"**. The name never appears in a scene cell (the agency's table never names Diane); the age is never repeated.
- The region appears by name wherever the outdoors is visible ("suburban Kentucky driveway").
- Light is one plain phrase: "warm interior lamp light", "soft window light", "daylight".
- Shot size ends the sentence: wide shot, medium shot, close-up, macro.
- Graphic scenes describe the graphic and quote its text exactly: `Big bold graphic: "5 WINDOWS = $1,000 SAVED", brand colors, autumn leaves background.`

### 3.4 Video + Camera
Two halves divided by a pipe:

`<the move and what it lands on> | <lens>mm <height or angle> <move>.`

- **Lenses:** 24mm (wide, establishing, handheld walk), 35mm (pan, orbit, handheld), 50mm (eye-level, push), 85mm macro, 100mm macro.
- **Moves, cinematic:** slow push in, static, slow pan, wide static, slow orbit, static macro hold, slow pull back.
- **Moves, handheld:** handheld walk toward camera, handheld close-up with slight natural shake, handheld overhead, handheld pull back.
- **Moves, fast-cut:** quick push, quick pan, whip pan, fast wipe transition.
- **Graphics:** `Static graphic hold | overlay, no camera movement`, plus one motion from: quick zoom punch, stamp/slam, flip transition, slam with flash.
- One move per scene.

### 3.5 Editor Note
Two short sentences: **the scene's job**, then **one instruction**.

- Jobs: Hook. Quick beat. Turning point. Breathing beat. Key proof-point scene. Key emotional beat. Emotional peak. Offer reveal. Price reveal 1 of 2. Urgency beat. Punch beat. CTA scene.
- Instructions protect variety and holds: "Vary from S1's push with a static macro." "New angle from S4. Do not repeat the macro push." "Hold the full 4 seconds, do not cut mid-line." "Static after two handheld shots."
- **No two neighbouring scenes share the same move and the same shot size.** The note says how each scene differs from the one before.
- A note that starts with "Key", "CTA", "Price reveal", "Price slam", "Emotional peak", "Emotional payoff", "Offer reveal", "Urgency", "Exact expiration", "End date", "Supports the …" or "Material claim" marks the scene as a key scene (`isKeyNote` in `server/videoLint.ts`; the agency tints S5–S8 of Concept 1 and the warranty, urgency, end-date, slam and CTA rows of Concept 3).
- The final CTA note is composed by code: `CTA scene. Disclaimer in six-point font, hold Ns minimum. Confirm "<brand>" spelling.`

### 3.6 Arc by format
| Format | Scenes | Arc |
|---|---|---|
| Testimonial (30s, cinematic) | 8 | pain in the home → coping → turning point → the company arrives → proof of fit → emotional payoff → material claim → offer card |
| UGC real-life working (30s, vlog) | 9 | us-versus-the-old-way hook → I do it myself → my truck, my materials → material claim → craft → personal check → "that's the job" → offer reveal → both tiers |
| Infomercial (26s, fast-cut) | 13 | open-loop question → before/after wipe → the news → price 1 → price 2 → crew claim → crew proof → material claim → warranty → urgency → end date → price slam → CTA card |

Every format closes on the exact offer, and the offer is **spoken**: in the last two scenes the VO says the campaign name and the top tier amount as words ("Right now it's Fall Savings. Save up to three thousand dollars."; "Buy five, save a thousand. Buy ten, save three thousand dollars."). The last scene always carries the disclaimer.

---

## 4. Where we go beyond the agency

The format is the agency's. These rules fix what their hand-made process gets wrong. We measured the source brief:

| Concept | Words stated | Words actually in the table | Time needed at the stated pace | Runtime |
|---|---|---|---|---|
| 1 Testimonial | 79 | 105 | 42.0s | 30s |
| 2 UGC | 74 | 86 | 34.4s | 30s |
| 3 Infomercial | 61 | 61 | 23.5s | 26s |

Concept 1's scene 03 asks for 18 words in 3 seconds. Its voice packet also quotes lines ("Then I saw the bill", "Nothing.") that are no longer in the script. The script was revised and nothing was recomputed.

1. **Every number is computed.** Word counts, spoken seconds, runtime, timecodes and the scene count come from the scene table. Nobody types them.
2. **Every line fits its scene.** Words ≤ scene seconds × the concept's pace, with 10% tolerance, rounded up to a whole word. The agent rewrites a line that does not fit; what it still cannot fit after its repair pass, code fits deterministically: the scene gains a second taken from the longest non-key footage scene that stays at 2s or more and still fits its own line, so the runtime never moves and key scenes never lose time. If no scene can give a second, the check fails and names the scene. The whole script also has a budget of runtime × pace × 0.9 words. If the client types a line that does not fit, the app says so and offers to trim the line or lengthen the scene.
3. **The packets cannot go stale.** Emphasis words, pause anchors and music anchors are checked against the current script and scene numbers after every edit.
4. **Exact text is never drawn by AI.** The agency's image prompts ask a model for price graphics. We render every graphic, overlay, offer card and disclaimer from exact text in the client's fonts. AI only makes pictures without words.
5. **Claims come from the brand kit.** "Backed by a lifetime warranty" is only written if that claim is in the client's approved facts. Otherwise the agent leaves it out and lists it under "Client materials needed".
6. **Real assets first.** If the kit holds a real photo that satisfies a scene (the van, Al, a finished install), the scene uses it and animates from it, instead of inventing one.
7. **Checklist by code.** The Editor Checklist is run by the app before the board is shown and again on the finished MP4 (section 6).

---

## 5. Two levels of prompt

The brief's Image Prompt and Video + Camera cells are short on purpose: a client can read and edit them. The engines need more. The Director pass (`server/videoDirector.ts`) expands each row into the full engine prompt by adding, from the brief itself:

- the Avatar Bible, word for word, wherever the person appears
- the Product Bible's colours and spellings
- location and colour grade from Quick Specs
- the Global Negative Prompt, reworded as positive instructions
- the lens, height and move from the camera cell as a shooting specification
- the editor note's hold or variety instruction

The client edits the short cell. The long prompt is rebuilt from it. The Director no longer carries a fixed look of its own.

---

## 6. The checklist, owned by code

Each line is a deterministic check. A failed line blocks the next paid step and names the scene.

**Before the vision board**
1. Scene durations sum to the runtime exactly.
2. Every second is covered: no gaps, and no "implied b-roll".
3. Every spoken line fits its scene at the concept's pace.
4. Pacing rule holds for the format.
5. No two neighbouring scenes share both move and shot size.
6. The brand name is spelled correctly in every text field, and the known misspelling appears nowhere.
7. Offer text and disclaimer match the campaign's offer, character for character, everywhere they appear.
8. Spoken offer numbers match the offer ("three thousand" ↔ $3,000).
9. The region appears in every outdoor image prompt, and the banned region in none.
10. Every emphasis word and pause anchor exists in the current script.
11. Every claim is in the client's approved facts.
12. The last scene is the offer card, with the disclaimer held at least 2 seconds.
13. The Avatar Bible has a wardrobe; no scene names the avatar or repeats their age.
14. The offer is spoken: the last two scenes' VO contains a tier amount as words.
15. Every required shot for the format appears in some scene's image prompt or card.
16. Every date in the script or on a card is the offer's end date.

**After the render**
17. MP4 duration equals the runtime (measured with ffprobe), for all three ratios: 1x1, 4x5, 9x16.
18. The disclaimer is on screen for its full hold, at or above the minimum legible size for the frame.
19. All three voice variants exist, and one is chosen.
20. Sampled frames pass the vision inspector (hands, faces, garbled text, brand colour, landscape).

"Six-point font" is the agency's print convention. In video we store it as the brief's words and render it at the smallest size that stays legible at 1080 pixels wide.
