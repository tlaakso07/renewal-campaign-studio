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
