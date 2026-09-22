// The agent's production brief (product/VIDEO-BRIEF-STANDARD.md): one structured call writes the concept, then
// code computes every number, builds the exact offer card, lints it, and gives the model one repair pass.
import { generateText, Output } from "ai";
import { z } from "zod";
import type { AdContent } from "./types.ts";
import { offerEnds, seasonOf } from "./adLayouts.ts";
import { PLAN_MODEL, videoPlanSchema, type Brief, type VideoPlan } from "./videoPlan.ts";
import { FORMATS, lintBrief, type Check, type Format } from "./videoLint.ts";

// Every field required: optional fields break strict structured output on some providers. Settings and the offer card are not the model's.
const draftSchema = z.object({
  title: z.string(),
  device: z.string(),
  hero: z.string(),
  location: z.string(),
  dna: z.string(),
  materialsNeeded: z.array(z.string()),
  avatar: z.object({ name: z.string(), role: z.string(), bullets: z.array(z.string()) }),
  scenes: z.array(
    z.object({
      seconds: z.number(),
      vo: z.string(), // exact words, or "Music only"
      imagePrompt: z.string(),
      move: z.string(),
      lens: z.string(),
      angle: z.string(),
      size: z.enum(["wide", "medium", "close-up", "macro", "graphic"]),
      editorNote: z.string(),
      kind: z.enum(["footage", "graphic", "offer-card"]),
      graphicLines: z.array(z.string()), // for graphic scenes: the exact words on screen
      graphicMotion: z.enum(["hold", "zoom punch", "stamp", "flip", "slam"]),
    }),
  ),
  voice: z.object({ archetype: z.string(), style: z.string(), emphasize: z.array(z.string()), neverEmphasize: z.array(z.string()), pauses: z.array(z.object({ scene: z.number(), seconds: z.number(), where: z.string() })), prompt: z.string(), variants: z.array(z.string()) }),
  music: z.object({ style: z.string(), anchors: z.array(z.object({ scene: z.number(), note: z.string() })), never: z.array(z.string()) }),
});
type Draft = z.infer<typeof draftSchema>;

export type BriefInput = { format: string; content: Pick<AdContent, "tiers" | "ends" | "cta" | "terms">; campaign: string; aspect: "1:1" | "4:5" | "9:16"; instructions?: string };
export type BriefDependencies = { brief?: (system: string, prompt: string) => Promise<Draft> };

const SYSTEM = `You are the strategist, writer and art director at a direct-response video agency. You write production briefs that an editor can build from without asking a question. Precision is the product: every scene is fully specified, nothing is implied.
Column grammar, never broken:
- vo: the exact spoken words in quotation-free plain text with punctuation, first person for testimonial/UGC, announcer for infomercial; spoken numbers as words ("three thousand"); or exactly "Music only".
- imagePrompt: ONE sentence, 12–25 words: <who> <doing what>, <where>, <light>, photoreal, <shot size>. Name the region wherever the outdoors is visible. After the first appearance, refer to the person as "Same woman"/"Same man" or by name; never repeat their age or description. Footage prompts contain no on-screen text, logos or lettering. Graphic scenes describe the graphic and put the exact words in graphicLines.
- move: one camera move from the format's list. lens: 24mm | 35mm | 50mm | 85mm macro | 100mm macro (graphics: "overlay"). angle: eye-level | low angle | overhead | handheld | none. size: wide | medium | close-up | macro | graphic.
- editorNote: two short sentences: the scene's job (Hook. Quick beat. Turning point. Breathing beat. Key proof-point scene. Key emotional beat. Emotional peak. Offer reveal. Price reveal 1 of 2. Urgency beat. Punch beat. CTA scene.) then one instruction that says how this scene differs from the one before. No two neighbouring scenes share both move and size.
- seconds: whole numbers; footage and cards 2–4s (fast-cut formats 2s), a punch beat may be 1s, the final card 3–4s; they add up to the runtime EXACTLY.
- Every vo line must fit: words ≤ seconds × pace. Count. Rewrite until it fits.
- The LAST scene is kind "offer-card" (the app renders its exact text; leave its graphicLines empty). Price-reveal graphics use only the offer's exact figures.
- Only claim what the approved claims list allows. Anything else you wanted (a warranty, a statistic, a testimonial quote) goes in materialsNeeded instead.
- voice.emphasize words must appear in the vo lines; pauses and music anchors refer to scene numbers that exist. Exactly three performance variants (A, B, C).
- dna: name the client's past concepts and state how this differs in format, emotional register and structural device.`;

export function briefPrompt(brand: any, format: Format, input: BriefInput) {
  const kit = brand.videoKit || {};
  const offer = input.content.tiers.map((t) => `${t.lead}, ${t.value}`).join(" / ");
  return [
    `CLIENT: ${brand.name}. CAMPAIGN: ${input.campaign}. Season: ${seasonOf(input.content.ends)}.`,
    `OFFER, exact: ${offer || "no discount; invite a free consultation"}. ${input.content.ends ? offerEnds(input.content.ends) + "." : ""} Disclaimer, exact: "${input.content.terms || ""}". CTA: "${input.content.cta}". The offer names windows only; never imply doors are discounted.`,
    `FORMAT: ${format.label} — ${format.formatLine}. Runtime ${format.runtime}s, ${format.scenes[0]}–${format.scenes[1]} scenes, pace ${format.pace} words/second, longest scene ${format.maxScene}s. Platform: Meta — 1x1, 4x5, 9x16. Colour grade: ${format.grade}. Pacing: ${format.pacing}. Tone: ${format.tone}.`,
    `ARC (one scene per beat, in order): ${format.arc.join(" → ")}.`,
    `CAMERA MOVES allowed: ${format.moves.join(" | ")}.`,
    `REGION: ${kit.region || "the client's home region (unknown — list it in materialsNeeded)"}. Never show: ${kit.bannedRegion || "another region's landscape"}. Brand name spelled exactly "${brand.name}"${kit.misspellings?.length ? `, never ${kit.misspellings.map((m: string) => `"${m}"`).join(" or ")}` : ""}.`,
    `APPROVED CLAIMS (the only claims allowed): ${(kit.claims || []).map((c: any) => `"${c.text}"`).join("; ") || "none on file"}.`,
    `REAL PEOPLE ON FILE: ${(kit.avatars || []).map((p: any) => `${p.name} — ${p.role}: ${p.description} (${p.assetIds.length} photos)`).join("; ") || "none — invent one avatar for testimonial/UGC and say so in materialsNeeded; infomercial has no on-screen avatar (avatar.name = \"No on-screen avatar\")"}.`,
    `BRAND LOOK: ${kit.notes || "no brand kit notes"}.`,
    `PAST CONCEPTS for the DNA check: ${(kit.pastConcepts || []).map((p: any) => `${p.title} (${p.format}; ${p.register}; ${p.device})`).join("; ") || "none on record"}.`,
    input.instructions?.trim() ? `OWNER INSTRUCTIONS (highest priority): ${input.instructions.trim()}` : "",
  ].filter(Boolean).join("\n");
}

// Merge a draft into a plan: computed numbers, exact offer card, preset settings.
export function toPlanFromDraft(draft: Draft, brand: any, format: Format, key: string, input: BriefInput): VideoPlan {
  const kit = brand.videoKit || {};
  const segments = draft.scenes.map((sc, i) => {
    const silent = /^music only\.?$/i.test(sc.vo.trim());
    const line = silent ? "" : sc.vo.trim();
    const offerCard = sc.kind === "offer-card" || i === draft.scenes.length - 1;
    return {
      id: `s${i + 1}`,
      seconds: Math.max(1, Math.round(sc.seconds)),
      line,
      approved: false,
      setting: "",
      shots: [{ phrase: line, visual: sc.imagePrompt.trim(), camera: "static" as const, source: "ai" as const }],
      stillAssetId: null,
      clipAssetId: null,
      keyframePrompt: "",
      motionPrompt: "",
      kind: offerCard ? ("offer-card" as const) : sc.kind,
      camera: { move: sc.move, lens: sc.lens, angle: sc.angle, size: offerCard ? ("graphic" as const) : sc.size },
      editorNote: sc.editorNote.trim(),
      key: /^(key|cta|price reveal|emotional peak|offer reveal)/i.test(sc.editorNote.trim()),
      // Exact text is never the model's: the offer card is built from the campaign, character for character.
      graphic: offerCard
        ? { lines: [...input.content.tiers.map((t) => `${t.lead}, ${t.value}`), ...(input.content.terms ? [input.content.terms] : [])], motion: "hold" as const }
        : sc.kind === "graphic" ? { lines: sc.graphicLines.map((l) => l.trim()).filter(Boolean), motion: sc.graphicMotion } : null,
    };
  });
  const brief: Brief = {
    title: draft.title,
    device: draft.device,
    specs: { campaign: input.campaign, hero: draft.hero, formatLine: format.formatLine, platform: "Meta — 1x1, 4x5, 9x16", location: draft.location, grade: format.grade, pacing: format.pacing, tone: format.tone },
    dna: draft.dna,
    negatives: [
      "Extra or malformed fingers, warped hands, duplicate limbs",
      "Distorted or asymmetrical facial features, uncanny-valley skin texture",
      "Garbled on-screen text, watermark artifacts, logo ghosting",
      "Oversaturated or off-brand colour; the brand colour must match the approved brand files",
      ...(kit.misspellings || []).map((m: string) => `Misspelling "${m}" — correct spelling is ${brand.name}`),
      ...(kit.bannedRegion ? [`${kit.bannedRegion} landscape — this is ${kit.region || "the client's region"}`] : []),
      ...format.negatives,
    ],
    materialsNeeded: [
      ...draft.materialsNeeded,
      ...(kit.references?.length ? [] : ["No reference videos on file — add links with what to take and what not to take"]),
    ],
    references: (kit.references || []).map((r: any) => ({ title: r.title, url: r.url || "", take: r.take, avoid: r.avoid })),
    avatar: draft.avatar,
    productBible: [
      `Brand name always "${brand.name}"${kit.misspellings?.length ? ` — never ${kit.misspellings.map((m: string) => `"${m}"`).join(", ")}` : ""}`,
      ...input.content.tiers.map((t) => `Offer text exact: "${t.lead}, ${t.value}"`),
      ...(input.content.terms ? [`End-card disclaimer exact: "${input.content.terms}"`] : []),
      "Offer copy names windows only — do not visually imply the discount applies to doors",
      ...(kit.claims || []).map((c: any) => `Approved claim: "${c.text}"${c.finePrint ? ` (${c.finePrint})` : ""}`),
    ],
    voice: { ...draft.voice, variants: draft.voice.variants.slice(0, 3), settings: { stability: format.voice.stability, similarity: format.voice.similarity, style: format.voice.style, speakerBoost: format.voice.speakerBoost } },
    music: { style: draft.music.style, bpm: format.music.bpm, anchors: draft.music.anchors, never: draft.music.never },
  };
  return videoPlanSchema.parse({
    name: draft.title,
    style: key === "ugc" ? "ugc" : "commercial",
    format: key,
    brief,
    aspect: input.aspect,
    targetSeconds: format.runtime,
    content: { tiers: input.content.tiers, ends: input.content.ends, cta: input.content.cta, terms: input.content.terms },
    instructions: input.instructions || "",
    presenter: draft.avatar.name === "No on-screen avatar" ? "" : draft.avatar.bullets.join("; "),
    script: segments.map((s) => s.line).filter(Boolean).join(" "),
    segments,
  });
}

export async function writeBrief(brand: any, input: BriefInput, deps: BriefDependencies = {}): Promise<{ plan: VideoPlan; checks: Check[] }> {
  const format = FORMATS[input.format];
  if (!format) throw new Error(`Unknown video format ${input.format}`);
  const prompt = briefPrompt(brand, format, input);
  const ask =
    deps.brief ||
    (async (system: string, user: string) =>
      (await generateText({ model: PLAN_MODEL, system, prompt: user, output: Output.object({ schema: draftSchema }), providerOptions: { anthropic: { thinking: { type: "disabled" } } }, maxOutputTokens: 8000, timeout: { totalMs: 180_000 } })).output);
  let plan = toPlanFromDraft(draftSchema.parse(await ask(SYSTEM, prompt)), brand, format, input.format, input);
  let checks = lintBrief(plan, format, brand);
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    // One repair pass with the exact failures; after that the client sees the remaining warnings on the board.
    const repair = `${prompt}\n\nYour previous brief failed these checks. Fix each one by rewriting the scene, not by changing the numbers you claim:\n${failed.map((c) => `- ${c.name}: ${c.detail}`).join("\n")}\nPrevious brief: ${JSON.stringify(plan.brief && { ...plan.brief, scenes: plan.segments.map((s) => ({ seconds: s.seconds, vo: s.line || "Music only", imagePrompt: s.shots[0].visual, camera: s.camera, editorNote: s.editorNote, kind: s.kind, graphicLines: s.graphic?.lines || [] })) })}`;
    plan = toPlanFromDraft(draftSchema.parse(await ask(SYSTEM, repair)), brand, format, input.format, input);
    checks = lintBrief(plan, format, brand);
  }
  return { plan, checks };
}
