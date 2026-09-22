// Video ad planning to the client's reference standard (Renewal VO1_1.mp4): a voiceover commercial with
// ~1–2s shots cut on phrases, or a UGC presenter speaking to camera. Script first; nothing paid happens here
// beyond one small text-model call, and every line is editable before stills or clips are made.
import { generateText, Output } from "ai";
import { z } from "zod";
import type { AdContent } from "./types.ts";
import { offerEnds, seasonOf } from "./adLayouts.ts";

export const VIDEO_LENGTHS = [15, 20, 30] as const;
const END_CARD_SECONDS = 3;
const WORDS_PER_SECOND = 2.4;

export const shotSchema = z.object({
  phrase: z.string().max(600), // exact words spoken over this shot → caption pills
  visual: z.string().max(1200), // what we see, in the owner's own words
  camera: z.enum(["static", "slow push-in", "slow pull-back", "handheld", "pan"]).default("static"),
  source: z.enum(["ai", "brand-footage", "brand-photo"]).default("ai"),
});
export const segmentSchema = z.object({
  id: z.string(),
  seconds: z.number().min(1).max(12), // a punch beat may be 1s (brief formats)
  line: z.string().max(600), // everything spoken in this segment
  approved: z.boolean().default(false), // the owner signed off this scene's board frame; required before any video spend
  setting: z.string().max(240).default(""), // one place/look so the keyframe still covers the segment
  shots: z.array(shotSchema).min(1).max(8),
  stillAssetId: z.string().nullable().default(null),
  generatedStillAssetId: z.string().nullable().default(null), // last paid frame, kept so a brand-photo swap can be undone without re-spending
  clipAssetId: z.string().nullable().default(null),
  // The Director's exact prompts for this scene (server/videoDirector.ts); editable by the owner.
  keyframePrompt: z.string().max(12000).default(""),
  motionPrompt: z.string().max(12000).default(""),
  // Production-brief columns (product/VIDEO-BRIEF-STANDARD.md §3). `line` is the VO cell; shots[0].visual is the image prompt.
  kind: z.enum(["footage", "graphic", "offer-card"]).default("footage"),
  camera: z.object({ move: z.string().max(80), lens: z.string().max(40), angle: z.string().max(60), size: z.enum(["wide", "medium", "close-up", "macro", "graphic"]) }).nullable().default(null),
  editorNote: z.string().max(300).default(""),
  key: z.boolean().default(false),
  graphic: z.object({ lines: z.array(z.string().max(600)).max(6), motion: z.enum(["hold", "zoom punch", "stamp", "flip", "slam"]).default("hold") }).nullable().default(null),
});
// The eleven brief parts that are not the scene table (§2). The Editor Checklist is computed (server/videoLint.ts).
export const briefSchema = z.object({
  title: z.string().max(160),
  device: z.string().max(160), // structural device, e.g. "transformation-arc testimonial"
  specs: z.object({ campaign: z.string().max(200), hero: z.string().max(160), formatLine: z.string().max(200), platform: z.string().max(80), location: z.string().max(200), grade: z.string().max(160), pacing: z.string().max(160), tone: z.string().max(160) }),
  dna: z.string().max(1200),
  negatives: z.array(z.string().max(200)).max(20),
  materialsNeeded: z.array(z.string().max(300)).max(10),
  references: z.array(z.object({ title: z.string().max(160), url: z.string().max(400), take: z.string().max(300), avoid: z.string().max(300) })).max(6),
  // The Avatar Bible the agency writes (§2.7): identity the image model needs, fixed once, then "Same woman" in every scene.
  avatar: z.object({
    name: z.string().max(60),
    role: z.string().max(120),
    ageRange: z.string().max(40).default(""), // "late 50s to 60s"
    locale: z.string().max(80).default(""), // "suburban Kentucky"
    wardrobe: z.string().max(200).default(""), // "cream cable-knit cardigan over a grey tee" — copied verbatim into scene 1's prompt
    energy: z.array(z.string().max(60)).max(3).default([]), // three qualities
    searchRef: z.string().max(160).default(""), // "search: 'relieved homeowner at window, 60s, natural light'"
    bullets: z.array(z.string().max(300)).max(8).default([]), // anything else; older plans keep their free bullets here
  }),
  productBible: z.array(z.string().max(300)).max(24),
  voice: z.object({
    archetype: z.string().max(600),
    style: z.string().max(600),
    emphasize: z.array(z.string().max(60)).max(8),
    neverEmphasize: z.array(z.string().max(120)).max(6),
    pauses: z.array(z.object({ scene: z.number().int().min(1), seconds: z.number().min(0.25).max(2), where: z.string().max(120) })).max(6),
    prompt: z.string().max(800),
    settings: z.object({ stability: z.number(), similarity: z.number(), style: z.number(), speakerBoost: z.boolean() }),
    variants: z.array(z.string().max(200)).length(3),
  }),
  music: z.object({ style: z.string().max(300), bpm: z.tuple([z.number(), z.number()]), anchors: z.array(z.object({ scene: z.number().int().min(1), note: z.string().max(160) })).max(8), never: z.array(z.string().max(120)).max(5) }),
});
export type Brief = z.infer<typeof briefSchema>;
export const videoPlanSchema = z.object({
  name: z.string().max(160).default("Video ad"),
  style: z.enum(["commercial", "ugc"]),
  format: z.string().max(40).default(""), // key into library/video-formats.json when the plan came from a brief
  brief: briefSchema.nullable().default(null),
  aspect: z.enum(["1:1", "4:5", "9:16"]).default("4:5"),
  targetSeconds: z.number().int().min(10).max(45),
  content: z.custom<Pick<AdContent, "tiers" | "ends" | "cta">>(),
  instructions: z.string().max(2000).default(""),
  presenter: z.string().max(400).default(""),
  bible: z.string().max(12000).default(""), // continuity notes shared by every scene
  voice: z.string().max(40).default("default"),
  script: z.string().max(4000),
  segments: z.array(segmentSchema).min(1).max(14), // the infomercial preset runs to 14 scenes
  voiceAssetId: z.string().nullable().default(null),
  words: z.array(z.object({ word: z.string(), start: z.number(), end: z.number() })).default([]),
  creativeId: z.string().nullable().default(null),
});
export type VideoPlan = z.infer<typeof videoPlanSchema>;

// Every field required: optional/default fields break strict structured output on some providers.
const draftSchema = z.object({
  presenter: z.string(),
  segments: z.array(
    z.object({
      setting: z.string(),
      shots: z.array(z.object({ phrase: z.string(), visual: z.string(), camera: z.string() })),
    }),
  ),
});

export const PLAN_MODEL = process.env.VIDEO_PLAN_MODEL || "anthropic/claude-sonnet-5";

export function segmentCount(targetSeconds: number) {
  return Math.max(1, Math.ceil((targetSeconds - END_CARD_SECONDS) / 9));
}
export const wordBudget = (seconds: number) => Math.floor(seconds * WORDS_PER_SECOND);

export function planBrief(input: { style: "commercial" | "ugc"; brand: any; content: Pick<AdContent, "tiers" | "ends" | "cta">; targetSeconds: number; instructions?: string }) {
  const spoken = input.targetSeconds - END_CARD_SECONDS;
  const n = segmentCount(input.targetSeconds);
  const offer = input.content.tiers.map((t) => `${t.lead}, ${t.value}`).join("; or ");
  return [
    `Write a ${input.targetSeconds}-second Meta video ad for ${input.brand.name} (full-service window and door replacement). The last ${END_CARD_SECONDS}s are a silent logo card, so the spoken part is ${spoken}s: at most ${wordBudget(spoken)} words in total.`,
    input.style === "commercial"
      ? "STYLE: voiceover commercial. No on-camera speaker. Fast b-roll: each shot lasts 1–2 seconds and changes exactly when the next phrase starts. Shots are real-looking home details, hands, rooms, people at home, installers at work."
      + ' Set "presenter" to an empty string.'
      : "STYLE: UGC. One real-feeling homeowner talks straight to camera in their own home, first person, casual and specific. One shot per segment (the presenter talking); describe them once in `presenter` (age, look, plain solid-colour clothing with no logos, the room).",
    "ARC: hook question about a pain the viewer feels → the problem → the cause (old, drafty windows) → the solution (Renewal by Andersen) → the benefit at home → the offer → call to action.",
    `OFFER — say it exactly, in natural spoken form: ${offer || "no discount; invite a free consultation"}. ${input.content.ends ? `It ${offerEnds(input.content.ends).replace("Offer ends:", "ends")}.` : ""} End on the call to action: "${input.content.cta || "Book your free design consultation"}".`,
    `Season: ${seasonOf(input.content.ends)}. Tie the pain to this season.`,
    `Voice: simple, confident, trusted, helpful; seventh-grade words; no jargon, no pushiness. No invented statistics, awards, prices, guarantees or testimonials-as-fact. Only name a product feature if it appears here: ${JSON.stringify(input.brand.facts || [])}.`,
    `STRUCTURE: exactly ${n} segment(s) of 8–10 seconds. Each segment happens in ONE setting (so one keyframe image can start it) and has ${input.style === "commercial" ? "4–7 shots" : "1 shot"}. Each shot has: "phrase" = the 2–5 words spoken over it, WITH its punctuation — every sentence ends in . ? or ! (all phrases joined in order ARE the script, nothing else is spoken), "visual" = what we see (no on-screen text, no logos, people in plain solid-colour clothing), "camera" = one of static | slow push-in | slow pull-back | handheld | pan.`,
    input.instructions?.trim() ? `OWNER INSTRUCTIONS — highest priority: ${input.instructions.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const CAMERAS = ["static", "slow push-in", "slow pull-back", "handheld", "pan"];
// Normalize a model draft into a plan: seconds come from word counts so the script always fits.
export function toPlan(draft: z.infer<typeof draftSchema>, base: Omit<VideoPlan, "script" | "segments" | "presenter" | "bible" | "voiceAssetId" | "words" | "creativeId" | "voice" | "name" | "format" | "brief">): VideoPlan {
  // A phrase followed by one starting with a capital (other than "I") ends a sentence;
  // restore the period the model dropped so the voiceover pauses naturally.
  const all = draft.segments.flatMap((x) => x.shots);
  const punctuate = (phrase: string, next?: string) =>
    next && /^[A-Z]/.test(next) && !/^I('m|'ve|'d)?\b/.test(next) && !/[.,!?;:—-]$/.test(phrase) ? `${phrase}.` : phrase;
  const last = all.at(-1);
  const segments = draft.segments.map((s, i) => {
    const shots = s.shots.map((shot) => ({
      phrase: punctuate(shot.phrase.trim(), all[all.indexOf(shot) + 1]?.phrase.trim()) + (shot === last && !/[.!?]$/.test(shot.phrase.trim()) ? "." : ""),
      visual: shot.visual.trim(),
      camera: (CAMERAS.includes(shot.camera) ? shot.camera : "static") as any,
      source: "ai" as const,
    }));
    const line = shots.map((x) => x.phrase).join(" ");
    const seconds = Math.min(10, Math.max(4, Math.round((line.split(/\s+/).length / WORDS_PER_SECOND) * 2) / 2));
    return { id: `s${i + 1}`, seconds, line, setting: s.setting, shots, stillAssetId: null, clipAssetId: null };
  });
  return videoPlanSchema.parse({
    ...base,
    presenter: draft.presenter || "",
    script: segments.map((s) => s.line).join(" "),
    segments,
  });
}

export type PlanDependencies = { draft?: (brief: string) => Promise<z.infer<typeof draftSchema>> };
export async function writeVideoPlan(
  brand: any,
  input: { style: "commercial" | "ugc"; content: Pick<AdContent, "tiers" | "ends" | "cta">; targetSeconds: number; aspect: "1:1" | "4:5" | "9:16"; instructions?: string },
  deps: PlanDependencies = {},
) {
  const brief = planBrief({ ...input, brand });
  const ask =
    deps.draft ||
    (async (prompt: string) =>
      (
        await generateText({
          model: PLAN_MODEL,
          output: Output.object({ schema: draftSchema }),
          prompt,
          // Extended thinking spent the whole budget (~12k tokens, ~12¢) and truncated the JSON; a script doesn't need it.
          providerOptions: { anthropic: { thinking: { type: "disabled" } } },
          maxOutputTokens: 3000,
          timeout: { totalMs: 120_000 },
        })
      ).output);
  let draft = await ask(brief);
  // Models overrun word budgets; one tightening pass keeps the voiceover inside the chosen length.
  const budget = wordBudget(input.targetSeconds - END_CARD_SECONDS);
  const count = (d: typeof draft) => d.segments.flatMap((x) => x.shots).map((x) => x.phrase).join(" ").split(/\s+/).filter(Boolean).length;
  if (count(draft) > budget * 1.1)
    draft = await ask(
      `${brief}\n\nYour previous draft was ${count(draft)} words; the limit is ${budget} words in total. Rewrite it at ${budget} words or fewer: fewer, shorter phrases; keep the hook, the offer wording and the call to action; drop the end date from the voiceover if needed (it is shown on screen). Previous draft: ${JSON.stringify(draft)}`,
    );
  return toPlan(draftSchema.parse(draft), {
    style: input.style,
    aspect: input.aspect,
    targetSeconds: input.targetSeconds,
    content: input.content,
    instructions: input.instructions || "",
  });
}

// Keyframe still for a segment: a photographic frame only — the static ad engine with text and logo switched off.
export function framePrompt(plan: VideoPlan, segment: VideoPlan["segments"][number], brand: any) {
  if (segment.keyframePrompt) return segment.keyframePrompt;
  return [
    `Photorealistic ${plan.aspect} film still for a ${brand.name} video ad. This is the opening frame of a scene: ${segment.setting || segment.shots[0].visual}.`,
    `First shot: ${segment.shots[0].visual}.`,
    plan.style === "ugc" && plan.presenter ? `The person: ${plan.presenter}. They look at the camera, mid-conversation, natural expression, phone-camera realism.` : "",
    `Season: ${seasonOf(plan.content.ends)}. Natural light, lived-in, real home — not staged or glossy.`,
    "ABSOLUTELY NO text, captions, logos, watermarks, signage or UI anywhere in the image. People wear plain solid-colour clothing (black, green, white or grey) with no logos or lettering.",
    plan.instructions ? `Owner instructions: ${plan.instructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Motion prompt for one segment clip (image-to-video from the approved still).
export function motionPrompt(plan: VideoPlan, segment: VideoPlan["segments"][number]) {
  if (segment.motionPrompt) return segment.motionPrompt;
  const rules = "No captions, subtitles, on-screen text, logos or watermarks. Realistic motion, natural light, no morphing, stable faces and hands.";
  if (plan.style === "ugc")
    return `${plan.presenter} talks directly to the camera, handheld phone-video feel, natural gestures. The person says exactly: "${segment.line}". ${rules}`;
  const per = (segment.seconds / segment.shots.length).toFixed(1);
  return [
    `A ${segment.seconds}-second commercial b-roll sequence of ${segment.shots.length} shots with a HARD CUT roughly every ${per} seconds. Same home and people throughout: ${segment.setting}.`,
    ...segment.shots.map((s, i) => `Shot ${i + 1} (${s.camera}): ${s.visual}.`),
    `Silent footage. ${rules}`,
  ].join("\n");
}

// Scene length from its words (2.4 words/second), with room to breathe; silent scenes default to 3s.
export const secondsFor = (line: string) => {
  const words = line.split(/\s+/).filter(Boolean).length;
  return words ? Math.min(12, Math.max(2, Math.round((words / WORDS_PER_SECOND + 0.4) * 2) / 2)) : 3;
};
