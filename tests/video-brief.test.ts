// The in-app brief writer against the agency standard (product/VIDEO-BRIEF-STANDARD.md): one agency-quality
// stub passes every check; each check and each code-owned field has a targeted case. No database, no network.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "video-brief-test-"));
process.env.APP_ENV = "development";
process.env.AI_GATEWAY_API_KEY = "";
import type { Draft } from "../server/videoBrief.ts";
const { writeBrief, toPlanFromDraft, fitLines, briefPrompt } = await import("../server/videoBrief.ts");
const { FORMATS, lintBrief, spokenAmounts } = await import("../server/videoLint.ts");

const KIT = {
  vehicle: [], uniform: [], product: [], notes: "",
  region: "Kentucky", bannedRegion: "Oregon", misspellings: ["Anderson"],
  claims: [{ text: "Fibrex frames won't rot, crack, or rust" }, { text: "One crew, start to finish — no subcontractors" }],
  avatars: [], references: [], pastConcepts: [{ title: "Creative #10", format: "staged brand video", register: "pride", device: "direct-address ambassador" }],
};
const BRAND = { name: "Renewal by Andersen", color: "#6CC14C", videoKit: KIT };
const FALL = { tiers: [{ lead: "Buy 5 Windows", value: "Save $1,000!" }, { lead: "Buy 10 Windows", value: "Save $3,000!*" }], ends: "2026-10-31", cta: "Call today", terms: "*Min of 5 windows to receive first discount. Offer expires 10/31/26" };
const INPUT = { format: "testimonial", content: FALL, campaign: "Fall Savings — Batch 1", aspect: "4:5" as const };
const T = FORMATS.testimonial;

const scene = (seconds: number, vo: string, imagePrompt: string, move: string, lens: string, size: any, editorNote: string, kind: any = "footage", graphicLines: string[] = []): Draft["scenes"][number] =>
  ({ seconds, vo, imagePrompt, move, lens, angle: "eye-level", size, editorNote, kind, graphicLines, graphicMotion: "hold" });
const WARDROBE = "cozy oatmeal cardigan over a grey tee";
// Agency-quality: the standard's Concept 1 rewritten to fit its own pace, with the offer spoken and the claim in scope.
const agency = (): Draft => ({
  title: "The Draft We Didn't Know We Were Paying For", device: "transformation-arc testimonial", hero: "Window replacement — Fibrex frames", location: "Kentucky suburban home",
  dna: "Creative #10 was a direct-address ambassador piece; this is a first-person homeowner testimonial with a transformation arc.",
  materialsNeeded: ["No customer photos on file → the installer in S5 is generic; send crew photos to match"],
  avatar: { name: "Diane", role: "Homeowner", ageRange: "63-68", locale: "Kentucky suburban homeowner", wardrobe: WARDROBE, energy: ["plainspoken", "unhurried", "quietly relieved"], searchRef: "warm retired homeowner testimonial, soft-spoken trustworthy neighbor" },
  scenes: [
    scene(4, "Every October, this window let the cold right in.", `Older woman in a ${WARDROBE} standing at a frosted window, warm interior lamp light, photoreal, medium shot.`, "slow push in", "50mm", "medium", "Hook. Hold long enough to read her breath on the glass."),
    scene(3, "We'd crank the heat and still bundle up.", "Same woman adjusting a thermostat dial, warm lamp-lit living room, photoreal, close-up.", "static", "85mm macro", "close-up", "Quick beat. Vary from S1's push with a static close-up."),
    scene(3, "Then the bill came. That's when I called.", "Same woman at a kitchen table reading a paper bill, soft window light, photoreal, medium shot.", "slow pan", "35mm", "medium", "Turning point. Let her expression carry it, no VO rush."),
    scene(4, "Renewal by Andersen sent one crew, start to finish.", "Renewal by Andersen branded van with one crew unloading windows, suburban Kentucky driveway, daylight, photoreal, wide shot.", "wide static", "24mm", "wide", "Breathing beat. Static wide after S3's pan."),
    scene(4, "They matched every frame to our house just right.", "Installer fitting a white window frame into a Kentucky home exterior, autumn trees, daylight, photoreal, medium shot.", "slow orbit", "35mm", "medium", "Key proof-point scene. Show the frame flush against the trim."),
    scene(4, "That first cold morning, I touched the glass. Nothing.", "Same woman pressing her palm flat on new window glass indoors, soft daylight, photoreal, macro.", "static macro hold", "100mm macro", "macro", "Key emotional beat. Hold the full 4 seconds, do not cut mid-line."),
    scene(4, "Fibrex won't rot, crack, or rust in a Kentucky winter.", "Close-up of a white window frame corner with a clean seal, natural light, photoreal, macro.", "slow push in", "100mm macro", "macro", "Supports the Fibrex claim. Push after S6's static hold."),
    scene(4, "Right now it's Fall Savings. Save up to three thousand dollars.", "", "static graphic hold", "overlay", "graphic", "Offer card.", "offer-card"),
  ],
  voice: {
    archetype: "Diane speaks in first person as herself — not a professional narrator, not a salesperson. Female, 60s, warm Kentucky accent. Reference archetype: the neighbor who tells it straight over coffee.",
    style: "Primary emotion: relief. Secondary: quiet pride. Pace: unhurried, about 2.5 words per second. Never sound: scripted, salesy, rushed. Let a natural breath land before S3 and after S6.",
    emphasize: ["cold", "one crew", "Nothing", "Fall Savings"], neverEmphasize: ["filler words (so, just, well)", "the word Fibrex over-enunciated"],
    pauses: [{ scene: 6, seconds: 0.5, where: 'after "Nothing."' }, { scene: 8, seconds: 1, where: "before the offer line" }],
    prompt: "A warm, unhurried woman in her mid-sixties speaking candidly to a friend, a small smile audible on 'just right' and quiet satisfaction on 'Nothing.'",
    variants: ["Variant A: warmer and slightly slower throughout", "Variant B: more matter-of-fact, less emotive", "Variant C: a small natural laugh before S7"],
  },
  music: { style: "Soft acoustic guitar, warm and understated — never a hard cinematic swell", anchors: [{ scene: 1, note: "Enter low, under S1" }, { scene: 6, note: "Slight swell at the payoff" }, { scene: 8, note: "Fade under the end card" }], never: ["Upbeat pop", "Dramatic strings", "Anything that competes with the VO"] },
});
const plan = (d: Draft, brand: any = BRAND, input: any = INPUT) => toPlanFromDraft(d, brand, T, "testimonial", input);
const failed = (p: any, brand: any = BRAND) => Object.fromEntries(lintBrief(p, T, brand).filter((c) => !c.ok).map((c) => [c.id, c.detail]));
const withScene = (d: Draft, i: number, patch: Partial<Draft["scenes"][number]>): Draft => ({ ...d, scenes: d.scenes.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

test("an agency-quality draft passes all 16 checks in one call; code owns the CTA note, location, voice guards, music anchors, materials and product bible", async () => {
  let calls = 0;
  const { plan: p, checks } = await writeBrief(BRAND, INPUT, { brief: async (system, prompt) => { calls++;
    assert.match(system, /AI-HARD ACTIONS/); assert.match(system, /NEVER write the avatar's name in a scene cell/); assert.match(system, /Save up to three thousand dollars/);
    assert.match(prompt, /WORD BUDGET: at most 67 words/); assert.match(prompt, /REQUIRED SHOTS: exterior window install; frame close-up; offer end card/); assert.match(prompt, /names windows only/);
    return agency(); } });
  assert.equal(calls, 1);
  assert.equal(checks.length, 16);
  assert.deepEqual(checks.filter((c) => !c.ok), [], JSON.stringify(checks.filter((c) => !c.ok)));
  const b = p.brief!, last = p.segments.at(-1)!;
  assert.equal(last.editorNote, 'CTA scene. Disclaimer in six-point font, hold 4s minimum. Confirm "Renewal by Andersen" spelling.');
  assert.equal(last.key, true);
  assert.deepEqual(last.camera, { move: "static", lens: "overlay", angle: "none", size: "graphic" });
  assert.equal(last.shots[0].visual, "");
  assert.equal(b.specs.location, "Kentucky home (never Oregon)");
  assert.equal(b.voice.neverEmphasize[0], '"Renewal by Andersen" read like an ad tag');
  // The agency's own pattern: enter under S1, swell mid-arc, lift on the offer reveal and fade under the end card.
  assert.deepEqual(b.music.anchors.map((a) => a.scene), [1, 6, 8, 8]);
  assert.deepEqual(b.music.anchors.at(-2), { scene: 8, note: "Lift under the offer reveal" });
  assert.deepEqual(b.music.never, ["Upbeat pop", "Dramatic strings", "Anything that competes with the VO"]);
  assert.deepEqual(b.materialsNeeded, [
    "No real customer footage or quotes on file → this draft uses an AI-generated avatar (Diane); request a real customer quote or photos of a real ambassador",
    "No reference videos on file → direction pulls from general Testimonial tradition",
    "No customer photos on file → the installer in S5 is generic; send crew photos to match",
  ]);
  assert.deepEqual(b.references, []);
  const bible = b.productBible.join("\n");
  assert.match(bible, /End-card disclaimer exact: "\*Min of 5 windows.*10\/31\/26" — six-point font, every video/);
  assert.match(bible, /Brand colour #6CC14C flat and muted, black text on it, sourced from the brand files/);
  assert.match(bible, /Offer copy names windows only/);
  assert.match(bible, /Required shots: exterior window install, frame close-up, offer end card/);
  assert.doesNotMatch(bible, /Product colour/, "no colour in the kit notes, no colour line");
  assert.equal(b.avatar.wardrobe, WARDROBE);
  assert.equal(p.presenter, `Homeowner; 63-68; Kentucky suburban homeowner; ${WARDROBE}; plainspoken; unhurried; quietly relieved`);
  assert.equal(p.segments.reduce((n, s) => n + s.seconds, 0), 30);
});

test("product colour comes from the kit's PRODUCT note; the windows-only line is absent for a roofing offer", () => {
  const notes = "VEHICLE: a white box truck with a green panel. PRODUCT: Renewal by Andersen replacement windows — crisp white (or black) Fibrex composite frames with colonial grilles; new glass carries factory stickers.";
  const bible = plan(agency(), { ...BRAND, videoKit: { ...KIT, notes } }).brief!.productBible.join("\n");
  assert.match(bible, /Product colour per brand standards: Renewal by Andersen replacement windows — crisp white \(or black\) Fibrex composite frames with colonial grilles$/m);
  const roof = { tiers: [{ lead: "Replace your roof", value: "Save $2,000!" }], ends: "2026-10-31", cta: "Call", terms: "Offer expires 10/31/26" };
  const d = withScene(agency(), 7, { vo: "Right now it's Fall Savings. Save two thousand dollars." });
  const r = plan(d, BRAND, { ...INPUT, content: roof });
  assert.doesNotMatch(r.brief!.productBible.join("\n"), /windows only/);
  assert.doesNotMatch(briefPrompt(BRAND, T, { ...INPUT, content: roof }), /windows only/);
  assert.equal(failed(r)[14], undefined, "two thousand is the roofing offer's amount");
});

test("check 14: the offer must be spoken in the last two scenes", () => {
  const silent = withScene(agency(), 7, { vo: "Book your free design consult before October thirty-first." });
  assert.equal(failed(plan(silent))[14], 'the last two scenes never speak an offer amount (say "three thousand")');
  assert.equal(failed(plan(agency()))[14], undefined);
  const early = withScene(withScene(agency(), 7, { vo: "Book your free design consult before October thirty-first." }), 6, { vo: "Fall Savings: save up to three thousand dollars." });
  assert.equal(failed(plan(early))[14], undefined, "spoken in the second-to-last scene counts");
  assert.equal(failed(plan(early))[16], undefined, "October thirty-first is the offer end date");
});

test("check 13: wardrobe required, the name never in a scene cell, age never repeated; infomercial skips it", () => {
  const named = withScene(agency(), 1, { imagePrompt: "Diane adjusting a thermostat dial, warm lamp-lit living room, photoreal, close-up." });
  assert.equal(failed(plan(named))[13], 'scene 02: names "Diane" (write "Same woman"/"Same man")');
  const bare = agency(); bare.avatar.wardrobe = "";
  assert.equal(failed(plan(bare))[13], "Avatar Bible has no wardrobe");
  const aged = withScene(agency(), 1, { imagePrompt: "Same woman in her 60s adjusting a thermostat dial, warm lamp-lit living room, photoreal, close-up." });
  assert.match(failed(plan(aged))[13], /scene 02: re-describes the avatar's age/);
  const al = agency(); al.avatar.name = "Al";
  assert.equal(failed(plan(withScene(al, 1, { imagePrompt: "Also visible: a thermostat dial in a warm lamp-lit living room, photoreal, close-up." })))[13], undefined, "word boundary: Also is not Al");
  const none = agency(); none.avatar = { ...none.avatar, name: "No on-screen avatar", wardrobe: "" };
  assert.equal(failed(plan(none))[13], undefined);
  assert.equal(plan(none).presenter, "");
});

test("check 11: an approved claim cannot be extended; the DNA's past-concept numbers are not claims; false-pass fields are scanned", () => {
  const ever = withScene(agency(), 6, { vo: "Fibrex won't rot, crack, or rust, ever." });
  assert.equal(failed(plan(ever))[11], '"ever" extends a claim beyond the approved wording');
  const onTime = withScene(agency(), 3, { vo: "Renewal by Andersen showed up right on time." });
  assert.equal(failed(plan(onTime))[11], '"on time" extends a claim beyond the approved wording');
  assert.equal(failed(plan(agency()))[11], undefined, "the approved wording passes");
  const dna = agency(); dna.dna = "Creative #1, #6 and #9 were animated song pieces; this is a live-action testimonial.";
  assert.equal(failed(plan(dna))[11], undefined, "#1 in the DNA is a past concept, not a claim");
  // "One day I just said enough" is narration; a same-day service promise is a claim.
  assert.equal(failed(plan(withScene(agency(), 2, { vo: "One day I just said, enough." })))[11], undefined);
  assert.match(failed(plan(withScene(agency(), 2, { vo: "They finished it in a one-day install." })))[11], /"day" is used/);
  const pct = withScene(agency(), 6, { vo: "Cut our energy bills forty percent." });
  assert.match(failed(plan(pct))[11], /"percent" is used but no approved claim covers it/);
  assert.match(failed(plan(pct))[11], /"energy" is used/);
  const years = withScene(agency(), 6, { vo: "Fibrex frames last forty years, easy." });
  assert.match(failed(plan(years))[11], /"year" is used/);
});

test("checks 6, 7, 8, 9, 16: misspellings and the banned region anywhere in the brief; dollar figures and dates in VO and cards; spelled hundreds and years", () => {
  const title = agency(); title.title = "Renewal by Anderson saved us";
  assert.equal(failed(plan(title))[6], '"Anderson" appears');
  const note = agency(); note.music.anchors[1].note = "Swell like the Oregon forest piece";
  assert.equal(failed(plan(note))[9], '"Oregon" appears');
  const loc = agency(); loc.location = "Oregon forest";
  assert.equal(failed(plan(loc, { ...BRAND, videoKit: { ...KIT, region: "" } }))[9], '"Oregon" appears', "the model's location row is scanned when code cannot compose it");
  assert.equal(failed(plan(agency()))[9], undefined, "the composed \"(never Oregon)\" clause is not a violation");
  const dollars = withScene(agency(), 2, { vo: "Save $5,000 today." });
  assert.equal(failed(plan(dollars))[7], "scene 03: $5,000 is not in the offer ($1,000, $3,000)");
  const card = withScene(agency(), 2, { kind: "graphic", graphicLines: ["Ends 11/30/26"], vo: "Music only" });
  assert.equal(failed(plan(card))[16], '"11/30/26" is not the offer end date (10/31)');
  const oct = withScene(agency(), 2, { vo: "Oct. 31st is the last day to call." });
  assert.equal(failed(plan(oct))[16], undefined);
  const wrongMonth = withScene(agency(), 2, { vo: "September thirtieth was the day." });
  assert.equal(failed(plan(wrongMonth))[16], '"September thirtieth" is not the offer end date (10/31)');
  assert.deepEqual(spokenAmounts("Save fifteen hundred, or twenty-five hundred. Save a thousand. Since two thousand twenty-six.").map((a) => a.value), [1500, 2500, 1000]);
  const year = withScene(agency(), 2, { vo: "Then the bill came in two thousand twenty-six." });
  assert.equal(failed(plan(year))[8], undefined, "a spelled year is not an offer figure");
  const fifteen = withScene(agency(), 7, { vo: "Right now it's Fall Savings. Save fifteen hundred dollars." });
  assert.equal(failed(plan(fifteen, BRAND, { ...INPUT, content: { ...FALL, tiers: [{ lead: "Buy 5 Windows", value: "Save $1,500!" }] } }))[8], undefined);
  assert.equal(failed(plan(fifteen))[8], '"fifteen hundred" is not an offer figure');
});

test("check 15: every required shot appears in some scene", () => {
  const ladder = withScene(agency(), 4, { imagePrompt: "Installer on a ladder measuring a window opening, Kentucky home, daylight, photoreal, medium shot." });
  assert.equal(failed(plan(ladder))[15], 'no scene shows "exterior window install"');
});

test("cards get a static overlay camera and keep their description; two in a row stall a cinematic format but not a fast-cut one", () => {
  const d = agency();
  d.scenes.splice(6, 1, scene(2, "Buy five windows, save a thousand.", "Fall Savings card on a warm autumn-leaf field, Renewal green panel, logo top-left.", "slow pan", "35mm", "wide", "Price reveal 1 of 2. Numbers match the offer.", "graphic", ["5 WINDOWS = $1,000 SAVED"]), scene(2, "Music only", "Price card, black field, tiers stacked in white.", "static graphic hold", "overlay", "graphic", "Punch beat. No VO here.", "graphic", ["$1,000", "$3,000"]));
  const p = plan(d);
  assert.equal(p.segments[6].kind, "graphic");
  assert.deepEqual(p.segments[6].camera, { move: "static", lens: "overlay", angle: "none", size: "graphic" });
  assert.equal(p.segments[6].shots[0].visual, "Fall Savings card on a warm autumn-leaf field, Renewal green panel, logo top-left.", "a card still describes its own picture");
  assert.deepEqual(p.segments[6].graphic, { lines: ["5 WINDOWS = $1,000 SAVED"], motion: "hold" });
  assert.equal(p.segments[6].key, true);
  // Cinematic formats hold one card; stacking them is the stall check 5 exists to catch.
  assert.match(failed(p)[5], /scenes 07 and 08: two cards back to back/);
  // The same pair in a fast-cut format is the agency's stacked price reveal.
  const fast = { ...FORMATS.infomercial, runtime: p.segments.reduce((n, s) => n + s.seconds, 0) };
  assert.equal(Object.fromEntries(lintBrief(p, fast, BRAND).filter((c) => !c.ok).map((c) => [c.id, c.detail]))[5], undefined);
});

test("deterministic fit: an over-budget line takes a second from the longest non-key footage scene; runtime stays exact; key scenes never lose time", async () => {
  const over = withScene(agency(), 2, { vo: "Then the bill came in the mail. That's when I called." }); // 11 words in 3s (max 9)
  const p = plan(over);
  assert.match(failed(p)[3], /scene 03: 11 words in 3s/);
  const fitted = fitLines(p, T);
  assert.deepEqual(fitted.segments.map((s) => s.seconds), [3, 3, 4, 4, 4, 4, 4, 4], "S1 (longest non-key footage) gave the second to S3");
  assert.equal(failed(fitted)[3], undefined);
  assert.equal(fitted.segments.reduce((n, s) => n + s.seconds, 0), 30);
  assert.deepEqual(fitted.segments.filter((s) => s.key).map((s) => s.seconds), [4, 4, 4, 4], "S5, S6, S7 (supports the claim) and the CTA");
  // Every candidate donor is key or would stop fitting its own line: nothing moves and the check names the scene.
  const stuck = withScene(withScene(withScene(over, 0, { vo: "Every October, this old window let the cold right in, badly." }), 3, { vo: "Renewal by Andersen sent one crew, start to finish, no fuss." }), 6, { vo: "Fibrex won't rot, crack, or rust in a long Kentucky winter." });
  const s = fitLines(plan(stuck), T);
  assert.deepEqual(s.segments.map((x) => x.seconds), [4, 3, 3, 4, 4, 4, 4, 4]);
  assert.match(failed(s)[3], /scene 03: 11 words in 3s/);
  // Through the writer: code fits the draft before linting it, so a misfit the fit can solve never buys a repair call.
  let calls = 0;
  const w = await writeBrief(BRAND, INPUT, { brief: async () => { calls++; return over; } });
  assert.equal(calls, 1);
  assert.deepEqual(w.checks.filter((c) => !c.ok), []);
  assert.deepEqual(w.plan.segments.map((s) => s.seconds), [3, 3, 4, 4, 4, 4, 4, 4]);
});

test("the writer never throws a ZodError on a paid draft: counts are normalised, an unusable draft is a 502, a failed repair keeps the first plan, empty terms are refused", async () => {
  const d = agency();
  d.scenes.splice(1, 1, scene(2, "We'd crank the heat and bundle up.", "Same woman adjusting a thermostat dial, warm lamp-lit living room, photoreal, close-up.", "static", "85mm macro", "close-up", "Quick beat. Static after S1's push."), scene(1, "Music only", "Same woman's breath fogging the cold glass, warm lamp light, photoreal, macro.", "static macro hold", "100mm macro", "macro", "Punch beat. One silent second on the glass."));
  d.voice.variants = ["Variant A: warmer"];
  d.voice.pauses = [{ scene: 0, seconds: 0.1, where: "nowhere" }, { scene: 6, seconds: 5, where: 'after "Nothing."' }];
  d.music.anchors = [{ scene: 0, note: "before the start" }, { scene: 12, note: "off the end" }];
  d.avatar.energy = ["a", "b", "c", "d", "e"];
  d.materialsNeeded = Array.from({ length: 14 }, (_, i) => `Item ${i}`);
  const long = { ...FALL, terms: "*".repeat(160) };
  const { plan: p, checks } = await writeBrief(BRAND, { ...INPUT, content: long }, { brief: async () => d });
  assert.equal(p.segments.length, 9);
  assert.equal(p.segments[2].seconds, 1);
  assert.deepEqual(p.brief!.voice.variants, ["Variant A: warmer", "Variant B: as written", "Variant C: as written"]);
  assert.deepEqual(p.brief!.voice.pauses, [{ scene: 6, seconds: 2, where: 'after "Nothing."' }]);
  // Anchors read in playing order, the fade last in its scene; an anchor past the end is kept so check 10 can report it.
  assert.deepEqual(p.brief!.music.anchors.map((a) => [a.scene, a.note]), [[1, "Enter low, under S1"], [9, "Lift under the offer reveal"], [9, "Fade under the end card"], [12, "off the end"]]);
  assert.equal(p.brief!.avatar.energy.length, 3);
  assert.equal(p.brief!.materialsNeeded.length, 10);
  assert.match(checks.find((c) => c.id === 10)!.detail, /scene 12 does not exist/);
  assert.equal(p.segments.at(-1)!.graphic!.lines.at(-1), long.terms, "a 160-char disclaimer is carried on the card, not thrown on");
  await assert.rejects(writeBrief(BRAND, INPUT, { brief: async () => ({ nonsense: true }) as any }), (e: any) => e.status === 502 && /unusable brief/.test(e.message));
  let calls = 0;
  const over = withScene(agency(), 2, { vo: "Then the bill came in the mail, and that's the day I finally called them." });
  const kept = await writeBrief(BRAND, INPUT, { brief: async () => { if (++calls === 2) throw new Error("provider down"); return over; } });
  assert.equal(calls, 2);
  assert.match(kept.checks.find((c) => c.id === 3)!.detail, /scene 03: 15 words/);
  await assert.rejects(writeBrief(BRAND, { ...INPUT, content: { ...FALL, terms: " " } }, { brief: async () => agency() }), (e: any) => e.status === 422 && /disclaimer/.test(e.message));
});

test("infomercial: no avatar, price cards back to back, fast-cut pacing, two spoken tiers", async () => {
  const I = FORMATS.infomercial;
  const g = (vo: string, lines: string[], note: string) => scene(2, vo, "", "static graphic hold", "overlay", "graphic", note, "graphic", lines);
  const f = (vo: string, prompt: string, move: string, lens: string, size: any, note: string) => scene(2, vo, prompt, move, lens, size, note);
  const d: Draft = {
    ...agency(), title: "Fall Savings, While It Lasts", device: "open-loop infomercial", hero: "Window & door replacement — Fall Savings offer",
    avatar: { name: "No on-screen avatar", role: "VO announcer only — voice, not a face, carries this brief", ageRange: "", locale: "Kentucky home exteriors, b-roll only", wardrobe: "", energy: ["urgent", "clear", "confident"], searchRef: "direct-response announcer" },
    scenes: [
      f("How much could you save?", "Kentucky home exterior at dusk, high-contrast light, photoreal, wide shot.", "quick push in", "24mm", "wide", "Open-loop hook. No host on camera."),
      f("Music only", "Old drafty window wiping into a bright new white window, daylight, photoreal, close-up.", "whip pan", "35mm", "close-up", "Pure visual beat. Music hit lands on the wipe."),
      f("Windows just dropped in price.", "Renewal by Andersen branded van pulling into a Kentucky driveway, daylight, photoreal, wide shot.", "static wide", "24mm", "wide", "The news. Static after the whip."),
      g("Buy five windows, save a thousand.", ["5 WINDOWS = $1,000 SAVED"], "Price reveal 1 of 2. Numbers match the offer."),
      g("Buy ten, save three thousand.", ["10 WINDOWS = $3,000 SAVED"], "Price reveal 2 of 2. Asterisk visible."),
      f("Never any subcontractors.", "One branded crew working on a window install, Kentucky exterior, daylight, photoreal, medium shot.", "quick pan", "35mm", "medium", "Crew claim. Pan after two cards."),
      f("One crew installs it all.", "Installer lifting a window frame into place, Kentucky exterior, daylight, photoreal, wide shot.", "quick push in", "50mm", "wide", "Crew proof. Wider than S6."),
      f("Fibrex won't rot, crack, or rust.", "Macro of a white window frame corner, clean seal, natural light, photoreal, macro.", "static macro hold", "100mm macro", "macro", "Material claim. Static after the push."),
      f("This deal will not last.", "Kentucky home exterior with bare autumn trees, dusk, photoreal, wide shot.", "quick push in", "24mm", "wide", "Urgency beat. Push after the macro."),
      g("Fall Savings ends October thirty-first.", ["OFFER ENDS 10/31"], "Exact expiration date. Matches the disclaimer."),
      scene(2, "Music only", "", "static graphic hold", "overlay", "graphic", "Punch beat. No VO here.", "graphic", ["$1,000", "$3,000"]),
      scene(4, "Call Renewal by Andersen. Save up to three thousand.", "", "static graphic hold", "overlay", "graphic", "", "offer-card"),
    ],
    voice: { ...agency().voice, emphasize: ["a thousand", "three thousand", "Fall Savings", "will not last"], pauses: [{ scene: 4, seconds: 0.5, where: "between the two tiers" }] },
    music: { style: "Driving synth-and-brass — never a quiet bed", anchors: [{ scene: 4, note: "Hit on the price reveal" }, { scene: 11, note: "Hit on the slam" }], never: ["A quiet or ambient bed", "Slow tempo"] },
  };
  const p = toPlanFromDraft(d, BRAND, I, "infomercial", { ...INPUT, format: "infomercial" });
  const f2 = Object.fromEntries(lintBrief(p, I, BRAND).filter((c) => !c.ok).map((c) => [c.id, c.detail]));
  assert.deepEqual(f2, {}, JSON.stringify(f2));
  assert.equal(p.segments.reduce((n, s) => n + s.seconds, 0), 26);
  assert.equal(p.brief!.materialsNeeded.find((m) => /AI-generated avatar/.test(m)), undefined, "no avatar line when nobody is on screen");
  assert.deepEqual(p.brief!.music.anchors.map((a) => a.scene), [1, 4, 11, 12]);
  assert.equal(p.presenter, "");
  assert.equal(p.segments.at(-1)!.editorNote, 'CTA scene. Disclaimer in six-point font, hold 4s minimum. Confirm "Renewal by Andersen" spelling.');
});
