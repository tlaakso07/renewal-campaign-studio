# Video agent plan: brief → vision board → video

_Written 2026-09-21. Companion to `product/VIDEO-BRIEF-STANDARD.md`, which defines the brief. This file says how the product produces one for every client and turns it into a finished ad._

## Goal

A subscribed business opens **Video**, says what it wants in a sentence (or nothing at all), and the agent does the agency's job:

1. writes a complete production brief to the standard,
2. shows it as a storyboard with a frame for every scene,
3. after approval, produces the finished video in all three ratios.

The client makes two decisions: approve the board, and approve the spend. Everything else is done for them, and everything stays editable.

## What the client sees

| Step | Screen | Client action | Paid? |
|---|---|---|---|
| 1 | **Start.** This month's offer is already filled in from the campaign. Three format tiles (Testimonial, UGC real-life working, Infomercial) with "Let the agent choose" selected. One optional box: "Anything we should feature?" | Click **Plan my video** | about 2¢ of text generation |
| 2 | **Concepts.** Three one-line concepts, each with a title, a format and how it differs from their past videos. The agent's pick is pre-selected. | Keep the pick, or choose another | no |
| 3 | **Vision board.** The storyboard in the agency's five-column layout: frame, script, camera, editor note, running timecodes, key scenes tinted. The checklist shows green. Any cell can be edited, any frame redone or swapped for a real photo. | **Approve board** | frames, a few cents each, one confirmation |
| 4 | **Produce.** One confirmation showing the computed cost: number of clips, three voice takes, one music bed. Progress is per scene. The client picks one of three voice takes. | **Make my video**, then pick a voice | yes, one confirmation |
| 5 | **Done.** The MP4 in 1x1, 4x5 and 9x16, the captions file, and the brief as a PDF. | Download | no |

The bibles, negative prompt, voice packet and music direction sit behind a "Show full brief" control. A client never has to read them. An agency-minded client can edit every line.

The existing rule stays: nothing is animated until every frame is approved, enforced on the server.

## The pipeline

Each stage is a typed service in `server/`, so the Home assistant and the Video studio call the same code (AGENTS.md requirement).

| # | Stage | Done by | Output |
|---|---|---|---|
| 0 | Brand video kit (one time per client) | client + operator | bibles, region, claims, references, voices, past-brief log |
| 1 | Concepts | LLM, one call | three concepts with Quick Specs and DNA check |
| 2 | Brief | LLM, one structured call | all twelve parts of the chosen concept |
| 3 | Lint | **code** | checks 1–13 of the standard; failures go back to stage 2 for one repair pass, then to the client as plain warnings |
| 4 | Director | LLM (exists) | the long engine prompt for each scene, built from the brief |
| 5 | Board | GPT Image + frame inspector (exist) | a frame per footage scene; exact cards rendered for graphic scenes |
| 6 | Approval gate | client (exists) | every scene approved |
| 7 | Production | Seedance, voice, music, renderer | clips, three voice takes, music bed, cards, three ratios |
| 8 | Final checks | **code** + vision inspector | checks 14–17 on the finished files |

Money, timing, counts and the checklist are computed by code. The LLM writes words and direction only.

Stages 1 and 2 stay as two calls because the client chooses between them. Inside stage 2, one call writes the whole brief: splitting strategist, writer and art director into separate agents would triple the cost and let the parts drift apart, which is the exact fault we found in the agency's brief.

## What changes in the code

### Data model (`server/videoPlan.ts`)
A plan gains a `brief` object and scenes gain the agency's columns.

- `brief`: `specs` (the eleven rows), `dna`, `negatives[]`, `materialsNeeded[]`, `references[]`, `avatar`, `productBible`, `voicePacket`, `music`, `checks[]`.
- Each scene: `kind` (`footage` | `graphic` | `offer-card`), `seconds` (whole), `vo` (empty means music only), `imagePrompt` (the short, readable one), `camera` `{ move, lens, angle }`, `editorNote`, `key`, and for graphics `graphic` `{ template, lines[], motion }`.
- One shot per scene. The schema allows up to eight today but the UI only ever exposed one, and the agency's format is one. The multi-shot timeline code in `buildVideo` goes away.
- `style` grows from `commercial | ugc` to the format presets below.

### Format presets (data, not code)
`library/video-formats.json`: one entry per format with its runtime, scene range, pacing rule, words per second, colour-grade default, arc, format negatives, voice settings, music tempo and the camera moves it may use. Three entries to start, taken from the source brief. A new format is a new entry.

### Brand kit (`videoKit` on the brand record)
Add: region and banned region; brand-name misspellings; approved claims with their fine print; avatars (name, role, description, real photo asset ids); reference videos with take / don't-take notes; a log of past concepts for the DNA check. Today `scripts/renewal-ads-setup.ts` fills the kit by hand. Phase 6 gives clients a screen for it.

### Brief writer (new, `server/videoBrief.ts`)
One structured-output call with the standard's grammar as its system prompt, the format preset, the kit and the offer as input. Followed by the lint and one repair pass. This replaces `writeVideoPlan`'s brief-building.

### Lint (new, `server/videoLint.ts`)
Pure functions, no network. The test fixture is GrowthHub's own Concept 1: the lint must report 105 words against 30 seconds, scene 03 over pace, and the two stale emphasis anchors.

### Director (`server/videoDirector.ts`)
Delete `DEFAULT_LOOK` as a fixed rule. Build the look from the brief: grade, location, avatar bible, product bible and negatives reworded as positives. The blocking-for-AI guidance stays.

### Graphic scenes (`server/render.ts`)
The renderer already draws exact text in the client's fonts (`textSvg`) and turns a PNG into a clip (`stillClip`, `offerBuildClips`). Add eight card templates (headline over footage, price reveal, stamp, calendar date, "offer ends" over footage, dual-price slam, offer title, final offer card) and five motions (hold, zoom punch, stamp, flip, flash). No AI spend.

### Voice and sound (`server/voice.ts`)
Add a provider that accepts a performance prompt and the four settings, inserts the packet's pauses, and returns three variants. Word timing stays as it is. Music is chosen or generated to the BPM range, then mixed with the existing ducking, with level changes at the brief's timing anchors.

### Clips (`server/videoStudio.ts`, `server/generation.ts`)
Send brand references with every clip, not just the start frame. Animate real people from their real photos (the agency's own technique for Al). Generate at the engine's minimum length and trim to the scene's 2–4 seconds. Render all three ratios.

### Known defect to fix on the way
`server/videoStudio.ts:322` hardcodes the offer card headline "Save On Custom Window & Door Replacement". The brief says the offer names windows only. The headline must come from the campaign's offer.

## Phases

Each phase ends with something a client could use, and its own tests. Order is by value per dollar of spend.

| Phase | Delivers | Proof it works | Spend to build |
|---|---|---|---|
| **1. Brief and lint** | data model, format presets, brief writer, lint, kit fields for Renewal | lint catches the three measured faults in the agency's Concept 1; a generated Renewal brief passes all thirteen checks | cents (text only) |
| **2. Storyboard board** | the five-column board with frames, timecodes, key tint, inline editing, live checklist, "show full brief", PDF export; Director reads the brief | side-by-side with `storyboard-concept1-testimonial.png`; editing a line re-runs the lint | under $1 of frames |
| **3. Graphic scenes** | card templates and motions, music-only scenes, windows-only offer fix | the infomercial concept renders end to end with stills standing in for footage; 26.0s exactly | none |
| **4. Voice and music** | performance prompt, settings, pauses, three variants and a picker; music to BPM with anchors | three audibly different takes; pauses land where the packet says | a few dollars |
| **5. Clips and delivery** | full references per clip, real-photo avatars, trim to length, three ratios, final checks | one finished Renewal ad per format, all seventeen checks green | the real cost of three videos |
| **6. One click and self-serve** | the five-step client flow above, the Home assistant's "make me a video", the client brand-kit screen | a second company workspace produces a video without an operator | small |

Phases 1 to 3 need no new accounts and almost no money. They also produce the thing the client is most impressed by: the agency-grade storyboard.

## What we keep

The approval gate, per-scene redo, "use my photo", frame inspector, brand references on frames, word-timed captions, the building offer card, durable jobs with usage reservations and paid-step confirmation. The work so far was the right skeleton. This plan gives it the agency's brain.

## Decisions and dependencies

1. **Voice and music provider.** The agency uses ElevenLabs, and their settings (stability, similarity, style, speaker boost) are ElevenLabs settings. Recommendation: use it for voice, and check whether its music and sound-effects products cover phase 4 so one account does all audio. Needs an API key in `.env` (variable name only in `.env.example`) and a check of current official docs before enabling, per AGENTS.md.
2. **Higgsfield API credits.** In-app animation still fails for lack of API credits. Needed by phase 5, not before.
3. **Renewal's real assets.** Al's four photos and the brand PDF live in the client's Dropbox. Needed for phase 5 quality; phase 1 to 3 work without them.
4. **Warranty wording.** "Backed by a lifetime warranty" must be confirmed against the client's warranty page before it enters the approved claims.
5. **Cost per video** is unknown until phase 5 measures it. The produce screen will show a computed estimate from real job prices, not a guess.
