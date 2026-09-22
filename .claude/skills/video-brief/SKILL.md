---
name: video-brief
description: Write or audit a video ad production brief in the agency-grade format this product uses (GrowthHub standard). Use when asked to plan, script, storyboard or brief a video ad for any client, to check a brief someone else wrote, or when changing the in-app video brief writer, lint or storyboard.
---

# Video brief

The format is defined once, in `product/VIDEO-BRIEF-STANDARD.md`. Read it in full before writing or judging a brief. Do not work from memory of it, and do not restate its rules here. The gold examples are in `research/growthub-production-brief/` (brief text plus three storyboard pages; look at the storyboard for the format you are writing).

## Writing a brief

1. **Collect the inputs.** Client and campaign; the offer and disclaimer, exact; format (testimonial, UGC real-life working, infomercial) and runtime; the client's region and the region to ban; approved claims; real people and photo assets on file; past concepts for the DNA check. For Renewal, the brand record's `videoKit` and `scripts/renewal-ads-setup.ts` hold most of this. Anything missing goes into "Client materials needed". Never invent a claim, a testimonial or an asset.
2. **Write the scene table first.** Fix the durations so they add up to the runtime, then write each line to fit its scene at the concept's pace. Then the image prompt, camera and editor note for each row, using the column grammar in section 3 of the standard.
3. **Write the other eleven parts** in the standard's order. The voice packet's emphasis words and pause anchors, and the music anchors, must quote the final script and scene numbers.
4. **Run the checker** and fix every failure by rewriting, not by changing the claimed numbers:
   ```
   python3 .claude/skills/video-brief/check_brief.py <brief.md> --pace 2.5 --runtime 30
   ```
5. Save the brief as markdown next to the campaign it belongs to, or where the user asks.

## Auditing a brief

Run the checker, then read the brief against sections 2, 3 and 6 of the standard. Report faults by scene number, most serious first: timing and fit, exact offer and disclaimer text, spelling of the brand name, claims not on file, region, repeated camera moves, stale voice or music anchors.

## Rules that are easy to break

- Exact on-screen text (prices, offer, disclaimer, logo) is rendered by the app, never drawn by an image model. Image prompts for footage scenes ask for no text.
- The person is described once, in the Avatar Bible. Later scenes say "Same woman" or use the name.
- One camera move per scene. Neighbouring scenes never share both move and shot size.
- Counts and timings are computed, never typed by hand.

## Scoring a brief the app wrote (the 5/5 loop)

Use this to judge a plan JSON from the app (`GET /api/video/plans/:id`, or a file saved from it) against the agency's Concept 1–3 as a demanding creative director would. The rubric is fixed so runs are comparable.

1. **Inputs:** the plan JSON; the matching agency concept in `research/growthub-production-brief/fall-savings-batch1-brief.txt` (testimonial → Concept 1, UGC → Concept 2, infomercial → Concept 3) and its storyboard PNG; `product/VIDEO-BRIEF-STANDARD.md` §2, §3, §6.
2. **Coverage matrix first:** every part in §2 (2.1–2.12) and every column in §3 → Yes / Partial / No, with the plan field that carries it. Partial and No are findings.
3. **Score every scene, four cells, 1–5 each**, one-line reason per cell:
   - *Visual prompt* — 5 = renderable by an image model without guessing: type + wardrobe on first appearance then "Same woman/man", one action, place, light, size; region named outdoors; no AI-hard actions; carries the arc beat. 3 = renderable but generic or missing one of light/place/size. 1 = a footage prompt on a card, or an identity the model must invent.
   - *VO* — 5 = fits the seconds at the format's pace, sensory and specific, advances the arc, claims exactly in scope, and (last two scenes) speaks the campaign name and the top tier amount as words. 3 = fits but flat. 1 = over budget, or an unapproved claim, or the offer never spoken.
   - *Camera* — 5 = move from the format list, lens + angle + size present, differs from the previous scene in move and size, and the move serves the line. 3 = differs in only one of move/size. 1 = repeat, or a move on a graphic.
   - *Editor note* — 5 = the beat's job word first, then one instruction that names how it differs from the previous scene, and (key scenes) the hold/tint intent. 3 = job word only. 1 = a writing note instead of an instruction.
4. **Whole-brief cells, 1–5 each:** Quick Specs accuracy (hero, device, location); Avatar Bible completeness (age, locale, wardrobe, 3 energies, search ref); Voice packet (parts 1–5 in the agency's shape, brand name under *never emphasize*); Music (enter, swell, lift, fade anchors; never-list incl. "competes with the VO"); Materials (gap → consequence shape, no duplicates); Offer card (exact tiers, disclaimer, six-point/hold note); Checklist (all checks pass; none vacuous).
5. **Report:** per-scene table, whole-brief table, the column averages, the three biggest gaps to the agency, and a fix list that names the file for each (`server/videoBrief.ts` prompt, `server/videoLint.ts` check, `server/videoDirector.ts`, or the brand kit). A brief is done when every cell is 5 and no coverage row is Partial or No.

Run it after every writer or lint change: write the same input again (Fall Savings testimonial, 4:5), score, fix the named file, repeat. Frames are not needed to score; do not spend on them for a scoring run.
