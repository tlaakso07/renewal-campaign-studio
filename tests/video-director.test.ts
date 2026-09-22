import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "director-test-"));
process.env.APP_ENV = "development";
process.env.AI_GATEWAY_API_KEY = "";
process.env.VERCEL_OIDC_TOKEN = "";

const { directorBrief, directPlan, sceneKeyframePrompt, avatarLine, lightPhrase, SYSTEM } = await import("../server/videoDirector.ts");
const { videoPlanSchema } = await import("../server/videoPlan.ts");
const { AppError } = await import("../server/db.ts");
const { z } = await import("zod");

const BRAND = { name: "Renewal by Andersen", videoKit: { notes: "White box truck with a flat Renewal-green side panel." } };
const FALL = { tiers: [{ lead: "Buy 5 Windows", value: "Save $1,000!" }], ends: "2026-10-31", cta: "Call today" };
const seg = (id: string, visual: string, extra: Record<string, unknown> = {}) => ({
  id, seconds: 4, line: "spoken line", setting: "a Kentucky kitchen", shots: [{ phrase: "spoken line", visual }],
  camera: { move: "slow push in", lens: "50mm", angle: "eye-level", size: "medium" }, editorNote: "Hook.", ...extra,
});
const brief = (avatar: Record<string, unknown> = {}) => ({
  title: "The Draft", device: "transformation-arc testimonial",
  specs: { campaign: "Fall Savings", hero: "Fibrex windows", formatLine: "AI-generated testimonial, direct to camera", platform: "Meta", location: "Kentucky suburban home (never Oregon)", grade: "Warm, natural daylight, trustworthy homeowner tone", pacing: "Slow", tone: "Relief" },
  dna: "first-person testimonial", negatives: ["Extra or malformed fingers", "Oregon-style dense evergreen forest"], materialsNeeded: [], references: [],
  avatar: { name: "Diane", role: "Homeowner", ageRange: "63-68", locale: "Kentucky suburban homeowner", wardrobe: "cream cable-knit cardigan over a grey tee", energy: ["plainspoken", "unhurried", "quietly relieved"], searchRef: "", bullets: [], ...avatar },
  productBible: ['Brand name always "Renewal by Andersen"', "Fibrex frame colour: neutral white"],
  voice: { archetype: "neighbour", style: "relief", emphasize: [], neverEmphasize: [], pauses: [], prompt: "warm", settings: { stability: 45, similarity: 80, style: 20, speakerBoost: true }, variants: ["a", "b", "c"] },
  music: { style: "acoustic", bpm: [70, 80], anchors: [], never: [] },
});
const briefPlan = (avatar?: Record<string, unknown>) =>
  videoPlanSchema.parse({
    style: "commercial", format: "testimonial", brief: brief(avatar), targetSeconds: 30, content: FALL, script: "s",
    segments: [
      seg("s1", "Diane at a frosted window in a cream cable-knit cardigan, warm interior lamp light, photoreal, medium shot."),
      seg("s4", "White box truck parks on a suburban Kentucky street, golden fall light, photoreal, wide."),
      seg("s8", "Offer card", { kind: "offer-card", camera: null, graphic: { lines: ["Buy 5 Windows, Save $1,000!"] } }),
    ],
  });
const plainPlan = () =>
  videoPlanSchema.parse({ style: "commercial", targetSeconds: 30, content: FALL, script: "s", segments: [seg("s1", "A homeowner at a window, overcast daylight.")] });

test("brief plan: light from grade and scene, format line, avatar verbatim, no house look", () => {
  const text = directorBrief(briefPlan(), BRAND);
  assert.doesNotMatch(text, /overcast/i, "the unconditional overcast season line is gone");
  assert.doesNotMatch(text, /orange glow|golden hour|REAL-FOOTAGE LOOK/i);
  assert.match(text, /Season: Fall — set dressing only/);
  assert.match(text, /grade "Warm, natural daylight, trustworthy homeowner tone"/);
  assert.match(text, /Scene s1 — .* — light: warm interior lamp light — editor note/);
  assert.match(text, /Scene s4 — .* — light: golden fall light/);
  assert.match(text, /FORMAT: 4:5 — AI-generated testimonial, direct to camera\. Platform: Meta/);
  assert.doesNotMatch(text, /silent b-roll/);
  assert.match(text, /AVATAR BIBLE .*: Diane — Homeowner\. Age 63-68\. Kentucky suburban homeowner\. Wardrobe: cream cable-knit cardigan over a grey tee \(identical in every scene\)\. Energy: plainspoken, unhurried, quietly relieved\./);
  assert.doesNotMatch(text, /Not given:/);
  assert.match(text, /do not invent or change age or wardrobe/);
  assert.match(text, /PRODUCT BIBLE: Brand name always "Renewal by Andersen" \| Fibrex frame colour: neutral white\./);
  assert.match(text, /NEVER \(state the positive form only; do not append "no …" exclusion lists\): Extra or malformed fingers \| Oregon-style/);
  assert.match(text, /CORRECT BRANDING .*White box truck with a flat Renewal-green side panel/);
  assert.doesNotMatch(text, /Scene s8/, "cards are not footage");
  assert.match(text, /ids exactly: s1, s4\./);
});

test("brief plan: empty avatar fields are named so the model fills them once; a scene without a light note falls back to the grade", () => {
  const text = directorBrief(briefPlan({ ageRange: "", wardrobe: "", bullets: ["Warm cardigan, casual at-home wardrobe"] }), BRAND);
  assert.match(text, /Diane — Homeowner\. Kentucky suburban homeowner\. Energy: plainspoken, unhurried, quietly relieved\. Warm cardigan, casual at-home wardrobe\. Not given: age, wardrobe — decide each once in the continuity bible's first line/);
  const plan = briefPlan();
  plan.segments[1].shots[0].visual = "White box truck parks on a suburban Kentucky street, photoreal, wide.";
  assert.match(directorBrief(plan, BRAND), /Scene s4 — .* — light: Warm, natural daylight, trustworthy homeowner tone/);
  assert.equal(lightPhrase("Woman at a kitchen table, soft window light, photoreal medium shot."), "soft window light");
  assert.equal(avatarLine(brief().avatar as any).missing.length, 0);
});

test("non-brief plan: the house look and the old season/format lines are unchanged", () => {
  const text = directorBrief(plainPlan(), BRAND);
  assert.match(text, /Season: Fall \(show it through overcast light, bare or turning trees, sweaters — not through orange glow\)/);
  assert.match(text, /FORMAT: 4:5 vertical-friendly social video, voiceover commercial, silent b-roll/);
  assert.match(text, /REAL-FOOTAGE LOOK/);
  assert.doesNotMatch(text, /AVATAR BIBLE|PRODUCT BIBLE|— light:/);
  assert.match(SYSTEM, /never at camera/);
  assert.match(SYSTEM, /End with the explicit exclusions\./);
  assert.doesNotMatch(SYSTEM, /AVATAR IDENTITY/);
});

test("directPlan: brief system prompt, structured error on a skipped scene, one retry on shape only", async () => {
  const plan = briefPlan();
  const ok = { bible: "Diane — 65, soft build, grey bob, cream cable-knit cardigan over a grey tee", segments: [{ id: "s1", keyframePrompt: "k", motionPrompt: "m" }, { id: "s4", keyframePrompt: "k", motionPrompt: "m" }] };
  // System prompt for a brief plan allows the lens and asks for positive-only rules and a bible that opens with the look.
  let system = "";
  const full = await directPlan(plan, BRAND, { direct: async (s) => ((system = s), ok) });
  assert.equal(full.segments.length, 2);
  assert.match(system, /at the lens only when the scene's visual says direct to camera/);
  assert.match(system, /must NOT invent or alter them/);
  assert.match(system, /MUST begin with the avatar's look in one line/);
  assert.doesNotMatch(system, /never at camera|End with the explicit exclusions/);
  // A skipped scene is a client-readable 502, not a plain Error.
  await assert.rejects(
    directPlan(plan, BRAND, { direct: async () => ({ ...ok, segments: ok.segments.slice(0, 1) }) }),
    (e: any) => e instanceof AppError && e.status === 502 && /skipped scene s4/.test(e.message),
  );
  // Shape failure once → retried once and succeeds.
  let calls = 0;
  const flaky = await directPlan(plan, BRAND, { direct: async () => (++calls === 1 ? ({ bible: 1 } as any) : ok) });
  assert.equal(calls, 2);
  assert.equal(flaky.bible, ok.bible);
  calls = 0;
  await assert.rejects(
    directPlan(plan, BRAND, { direct: async () => { calls++; throw new z.ZodError([]); } }),
    (e: unknown) => e instanceof z.ZodError,
  );
  assert.equal(calls, 2, "a second shape failure is not retried again");
  // A provider-style error is not retried.
  calls = 0;
  await assert.rejects(directPlan(plan, BRAND, { direct: async () => { calls++; throw new Error("429 rate limited"); } }), /429/);
  assert.equal(calls, 1);
});

test("sceneKeyframePrompt: a single-scene Redo carries the bibles; non-brief plans use framePrompt", () => {
  const plan = briefPlan();
  plan.bible = "Diane — 65, soft build, grey bob, cream cable-knit cardigan over a grey tee.\nHOME: ranch house.";
  const p = sceneKeyframePrompt(plan, plan.segments[1], BRAND);
  assert.match(p, /scene s4 of a Renewal by Andersen AI-generated testimonial, direct to camera/);
  assert.match(p, /Light: golden fall light\./);
  assert.match(p, /Camera: slow push in \| 50mm eye-level, medium\./);
  assert.match(p, /AVATAR BIBLE .*Wardrobe: cream cable-knit cardigan over a grey tee/);
  assert.match(p, /CONTINUITY BIBLE: Diane — 65/);
  assert.match(p, /PRODUCT BIBLE: Brand name always/);
  assert.match(p, /CORRECT BRANDING: .*White box truck/);
  assert.match(p, /Do not show: Extra or malformed fingers/);
  assert.equal(sceneKeyframePrompt(plan, { ...plan.segments[1], keyframePrompt: "director wrote this" }, BRAND), "director wrote this");
  const plain = plainPlan();
  assert.match(sceneKeyframePrompt(plain, plain.segments[0], BRAND), /^Photorealistic 4:5 film still for a Renewal by Andersen video ad/);
  assert.doesNotMatch(sceneKeyframePrompt(plain, plain.segments[0], BRAND), /AVATAR BIBLE/);
});
