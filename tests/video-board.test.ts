// Vision board gates and edits (product/VIDEO-BRIEF-STANDARD.md §6): a failed checklist line blocks every paid step,
// cards are never generated, a swapped frame loses its approval, and edits rebuild the Director's prompts.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "renewal-board-test-"));
process.env.APP_ENV = "development";
// Tests must never reach paid providers: blank keys win over .env (dotenv does not override).
process.env.AI_GATEWAY_API_KEY = "";
process.env.VERCEL_OIDC_TOKEN = "";
process.env.DEV_AUTH = "true";
const { db, brand, updateRecord } = await import("../server/db.ts");
const { storeAsset } = await import("../server/assets.ts");
await import("../scripts/seed.ts");
const { createPlan, getPlan, savePlan, useBrandStill, approveScenes, generateBoard, queueStill, queueClip } = await import("../server/videoStudio.ts");
const { parseCamera, cameraText } = await import("../app/storyboard.tsx");

const a = { company: "renewal", user: "renewal-owner", role: "owner", staff: false, name: "Test owner" };
const b = { company: "test-company", user: "test-company-owner", role: "owner", staff: false, name: "Second owner" };
const RENEWAL_KIT = {
  vehicle: [], uniform: [], product: [], notes: "",
  region: "Kentucky", bannedRegion: "Oregon", misspellings: ["Anderson"],
  claims: [{ text: "Fibrex frames won't rot, crack, or rust" }, { text: "One crew, start to finish — no subcontractors" }],
  avatars: [], references: [], pastConcepts: [],
};
const FALL = { tiers: [{ lead: "Buy 5 Windows", value: "Save $1,000!" }, { lead: "Buy 10 Windows", value: "Save $3,000!*" }], ends: "2026-10-31", cta: "Call today", terms: "*Min of 5 windows to receive first discount. Offer expires 10/31/26" };
const scene = (seconds: number, vo: string, imagePrompt: string, move: string, lens: string, size: any, editorNote: string, kind: any = "footage") =>
  ({ seconds, vo, imagePrompt, move, lens, angle: "eye-level", size, editorNote, kind, graphicLines: [], graphicMotion: "hold" as const });
// The clean Renewal brief from tests/core.test.ts; `s3` swaps in a scene 3 that fails the fit check.
const packet = (s3?: string) => ({
  title: "The Draft We Didn't Know We Were Paying For", device: "transformation-arc testimonial", hero: "Window replacement — Fibrex frames", location: "Kentucky suburban home (never Oregon)",
  dna: "A first-person homeowner testimonial.", materialsNeeded: ["No real customer quote on file — Diane is an AI avatar"],
  avatar: { name: "Diane", role: "Homeowner", ageRange: "60s", locale: "suburban Kentucky", wardrobe: "cream cable-knit cardigan", energy: ["warm", "relieved", "plainspoken"], searchRef: "relieved homeowner at window, 60s", bullets: ["Owns a 1970s ranch"] },
  scenes: [
    scene(4, "Every October, this window let the cold right in.", "Older woman in a cream cable-knit cardigan at a frosted window, warm interior lamp light, photoreal, medium shot.", "slow push in", "50mm", "medium", "Hook. Hold long enough to read her breath on the glass."),
    scene(3, "We'd crank the heat and still bundle up.", "Same woman adjusting a thermostat dial, warm lamp-lit living room, photoreal, close-up.", "static", "85mm macro", "close-up", "Quick beat. Vary from S1's push with a static close-up."),
    scene(3, s3 || "Then the bill came. That's when I called.", "Same woman at a kitchen table reading a paper bill, soft window light, photoreal, medium shot.", "slow pan", "35mm", "medium", "Turning point. Let her expression carry it."),
    scene(4, "Renewal by Andersen sent one crew, start to finish.", "Renewal by Andersen branded van with one crew unloading windows, suburban Kentucky driveway, daylight, photoreal, wide shot.", "wide static", "24mm", "wide", "Breathing beat. Static wide after the pan."),
    scene(4, "They matched every frame like it belonged there.", "Installer fitting a white window frame into a Kentucky home exterior, autumn trees, daylight, photoreal, medium shot.", "slow orbit", "35mm", "medium", "Key proof-point scene. Show the frame flush against the trim."),
    scene(4, "That first cold morning, I touched the glass. Nothing.", "Same woman pressing her palm flat on new window glass indoors, soft daylight, photoreal, macro.", "static macro hold", "100mm macro", "macro", "Key emotional beat. Hold the full 4 seconds, do not cut mid-line."),
    scene(4, "Fibrex won't rot, crack, or rust in a Kentucky winter.", "Close-up of a white window frame corner with a clean seal, natural light, photoreal, macro.", "slow push in", "100mm macro", "macro", "Supports the Fibrex claim. Push after S6's static hold."),
    scene(4, "Right now it's Fall Savings. Save up to three thousand dollars.", "Fall Savings offer card over an autumn leaves background, brand colours, clean graphic.", "static graphic hold", "overlay", "graphic", "CTA scene. Hold the full 4 seconds.", "offer-card"),
  ],
  voice: { archetype: "The neighbor who tells it straight over coffee", style: "Relief, then quiet pride", emphasize: ["cold", "one crew", "Nothing", "Fall Savings"], neverEmphasize: ["the brand name read like a tag"], pauses: [{ scene: 6, seconds: 0.5, where: 'after "Nothing."' }], prompt: "A warm, unhurried woman in her mid-sixties.", variants: ["Warmer and slower", "More matter-of-fact", "A small laugh before S7"] },
  music: { style: "Soft acoustic guitar, warm and understated", anchors: [{ scene: 1, note: "enter low" }, { scene: 8, note: "fade under the end card" }], never: ["Upbeat pop", "Dramatic strings"] },
});
const direct = async (_system: string, _prompt: string) => ({
  bible: "Diane, 60s, cream cable-knit cardigan; 1970s ranch; overcast October daylight.\n\nSecond paragraph the board does not show.",
  segments: ["s1", "s2", "s3", "s4", "s5", "s6", "s7"].map((id) => ({ id, keyframePrompt: `Keyframe for ${id}: Diane in the cream cardigan.`, motionPrompt: `Motion for ${id}.` })),
});
// The writer's draft schema is being extended to carry the structured Avatar Bible; until it passes wardrobe through,
// a plan without one is completed the way the client would, on the board (savePlan accepts the brief).
const withWardrobe = (id: string) => {
  const p = getPlan(a, id);
  if (!p.body.brief.avatar.wardrobe) savePlan(a, id, p.rev, { ...p.body, brief: { ...p.body.brief, avatar: { ...p.body.brief.avatar, wardrobe: "cream cable-knit cardigan" } } });
  return getPlan(a, id);
};
const jobs = () => (db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE company=? AND kind='generation'").get(a.company) as any).n as number;
const png = (color: string) => sharp({ create: { width: 800, height: 1000, channels: 3, background: color } }).png().toBuffer();

const br = brand(a);
updateRecord(a, br.id, br.rev, { ...br.body, videoKit: RENEWAL_KIT });
const photo1 = await storeAsset(a, "board-photo-1", await png("#8B9A75"), "photo1.png");
const photo2 = await storeAsset(a, "board-photo-2", await png("#75828B"), "photo2.png");

test("Gate: a failing checklist blocks the board and every single frame; nothing is queued", async () => {
  const failing = await createPlan(a, { write: "brief", format: "testimonial", content: FALL, campaign: "Fall Savings — Batch 1", aspect: "4:5" }, { brief: async () => packet("Then our bill would come and it kept getting higher, and that is what finally made me call.") });
  const plan = withWardrobe(failing.id);
  assert.match(plan.checks.find((c: any) => c.id === 3).detail, /scene 03: 18 words in \ds/);
  assert.deepEqual(plan.checks.filter((c: any) => !c.ok).map((c: any) => c.id), [3]);
  const before = jobs();
  await assert.rejects(generateBoard(a, plan.id, { confirmBillable: true }, { gateway: true }, { direct }), /Fix the 1 checklist item first/);
  assert.throws(() => queueStill(a, plan.id, { segmentId: "s1", key: "gated-still", confirmBillable: true }, { gateway: true }), /Fix .* checklist/);
  assert.equal(jobs(), before, "no paid frame was queued");
  assert.ok(getPlan(a, plan.id).body.segments.every((s: any) => !s.stillJobId && !s.keyframePrompt), "the Director did not run either");
});

test("Board: a passing brief builds every footage frame; cards are never generated; a failed frame is re-queued", async () => {
  let plan = withWardrobe((await createPlan(a, { write: "brief", format: "testimonial", content: FALL, campaign: "Fall Savings — Batch 1", aspect: "4:5" }, { brief: async () => packet() })).id);
  assert.deepEqual(plan.checks.filter((c: any) => !c.ok), []);
  const before = jobs();
  plan = await generateBoard(a, plan.id, { confirmBillable: true }, { gateway: true }, { direct });
  assert.equal(jobs(), before + 7, "one frame per footage scene, none for the offer card");
  assert.match(plan.body.bible, /cream cable-knit cardigan/);
  assert.ok(plan.body.segments.slice(0, 7).every((s: any) => s.stillJobId && s.stillJob.status === "queued" && s.keyframePrompt));
  assert.equal(plan.body.segments[7].stillJobId, null);
  // M2: the offer card is rendered exactly; POST /still on it is refused even though every check passes.
  assert.throws(() => queueStill(a, plan.id, { segmentId: "s8", key: "card-still", confirmBillable: true }, { gateway: true }), /Cards are rendered exactly, never generated/);
  // M6: a failed job counts as a missing frame, so the board button re-queues it instead of doing nothing.
  const failedJob = plan.body.segments[1].stillJobId;
  db.prepare("UPDATE jobs SET status='failed', error='provider down' WHERE id=?").run(failedJob);
  assert.equal(getPlan(a, plan.id).body.segments[1].stillJob.status, "failed");
  plan = await generateBoard(a, plan.id, { confirmBillable: true }, { gateway: true }, { direct: async () => assert.fail("prompts exist; the Director must not run again") as never });
  assert.equal(jobs(), before + 8, "exactly one new frame job");
  assert.notEqual(plan.body.segments[1].stillJobId, failedJob);
  assert.equal(plan.body.segments[1].stillJob.status, "queued");
  assert.equal(plan.body.segments[0].stillJobId, getPlan(a, plan.id).body.segments[0].stillJobId, "live jobs are left alone");
  // M3: a camera-only edit changes what the Director reads, so the scene's prompts are rebuilt next time.
  const edited = { ...plan.body, segments: plan.body.segments.map((s: any, i: number) => (i === 0 ? { ...s, camera: { ...s.camera, move: "static" } } : s)) };
  savePlan(a, plan.id, plan.rev, edited);
  plan = getPlan(a, plan.id);
  assert.equal(plan.body.segments[0].keyframePrompt, "");
  assert.equal(plan.body.segments[0].motionPrompt, "");
  assert.match(plan.body.segments[1].keyframePrompt, /Keyframe for s2/, "untouched scenes keep their prompts");
  // The server owns the key tint: an editor note edit sets it without any client rule.
  savePlan(a, plan.id, plan.rev, { ...plan.body, segments: plan.body.segments.map((s: any, i: number) => (i === 1 ? { ...s, editorNote: "Urgency beat. Cut faster than S1." } : s)) });
  assert.equal(getPlan(a, plan.id).body.segments[1].key, true);
});

test("Approval follows the picture: a brand-photo swap (and its undo) needs a new sign-off before any clip", async () => {
  let plan = getPlan(a, (await createPlan(a, { style: "commercial", content: { tiers: FALL.tiers, ends: FALL.ends, cta: FALL.cta }, targetSeconds: 20, scenes: 2 })).id);
  useBrandStill(a, plan.id, "s1", photo1.id);
  approveScenes(a, plan.id, { segmentId: "s1" });
  assert.equal(getPlan(a, plan.id).body.segments[0].approved, true);
  useBrandStill(a, plan.id, "s1", photo2.id);
  plan = getPlan(a, plan.id);
  assert.equal(plan.body.segments[0].approved, false, "H3: the un-reviewed photo is not approved");
  assert.equal(plan.body.segments[0].stillAssetId, photo2.id);
  assert.throws(() => queueClip(a, plan.id, { segmentId: "s1", key: "clip-after-swap", confirmBillable: true }, { gateway: true }), /Approve this scene on the vision board/);
  // Undo goes through the same route and needs the same sign-off.
  approveScenes(a, plan.id, { segmentId: "s1" });
  useBrandStill(a, plan.id, "s1", photo1.id);
  assert.equal(getPlan(a, plan.id).body.segments[0].approved, false);
});

test("Saves are versioned: the same rev twice rejects the second and keeps the first", async () => {
  const plan = getPlan(a, (await createPlan(a, { style: "commercial", content: { tiers: FALL.tiers, ends: FALL.ends, cta: FALL.cta }, targetSeconds: 20, scenes: 2 })).id);
  const write = (visual: string) => ({ ...plan.body, segments: plan.body.segments.map((s: any, i: number) => (i === 0 ? { ...s, shots: [{ ...s.shots[0], visual }] } : s)) });
  savePlan(a, plan.id, plan.rev, write("First edit lands."));
  assert.throws(() => savePlan(a, plan.id, plan.rev, write("Second edit with a stale rev.")), /This record changed/);
  assert.equal(getPlan(a, plan.id).body.segments[0].shots[0].visual, "First edit lands.");
});

test("Cross-tenant: another company's actor cannot save or swap frames on this plan", async () => {
  const plan = getPlan(a, (await createPlan(a, { style: "commercial", content: { tiers: FALL.tiers, ends: FALL.ends, cta: FALL.cta }, targetSeconds: 20, scenes: 2 })).id);
  assert.throws(() => savePlan(b, plan.id, plan.rev, plan.body), (e: any) => e.status === 404);
  assert.throws(() => useBrandStill(b, plan.id, "s1", photo1.id), (e: any) => e.status === 404);
  assert.throws(() => queueStill(b, plan.id, { segmentId: "s1", key: "other-tenant", confirmBillable: true }, { gateway: true }), (e: any) => e.status === 404);
  assert.equal(getPlan(a, plan.id).body.segments[0].stillAssetId, null);
});

test("Camera cell round-trips two-word lenses", () => {
  const prev = { move: "slow push in", lens: "50mm", angle: "eye-level", size: "close-up" };
  const c = parseCamera("static | 85mm macro eye-level", prev);
  assert.deepEqual(c, { move: "static", lens: "85mm macro", angle: "eye-level", size: "close-up" });
  assert.equal(cameraText(c), "static | 85mm macro eye-level");
  assert.deepEqual(parseCamera("static graphic hold | overlay", prev), { move: "static graphic hold", lens: "overlay", angle: "eye-level", size: "close-up" });
  assert.deepEqual(parseCamera("slow pan | 35mm low angle", prev).angle, "low angle");
  assert.equal(parseCamera("wide static", prev).lens, "50mm", "a move-only edit keeps the previous lens");
});
