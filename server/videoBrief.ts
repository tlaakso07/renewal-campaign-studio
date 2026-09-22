// The agent's production brief (product/VIDEO-BRIEF-STANDARD.md): one structured call writes the concept, then
// code computes every number, builds the exact offer card, lints it, gives the model one repair pass, and fits
// what the model could not.
import { generateText, Output } from "ai";
import { z } from "zod";
import type { AdContent } from "./types.ts";
import { offerEnds, seasonOf } from "./adLayouts.ts";
import { AppError, check } from "./db.ts";
import { PLAN_MODEL, videoPlanSchema, type Brief, type VideoPlan } from "./videoPlan.ts";
import { FORMATS, fits, isKeyNote, lintBrief, wordCount, type Check, type Format } from "./videoLint.ts";

// Every field required: optional fields break strict structured output on some providers. String caps match
// videoPlan.ts so the model sees them; counts and numbers are normalised in toPlanFromDraft, never thrown on.
// Settings, the offer card, the location row and the CTA note are not the model's.
const draftSchema = z.object({
  title: z.string().max(160),
  device: z.string().max(160),
  hero: z.string().max(160),
  location: z.string().max(200),
  dna: z.string().max(1200),
  materialsNeeded: z.array(z.string().max(300)),
  avatar: z.object({ name: z.string().max(60), role: z.string().max(120), ageRange: z.string().max(40), locale: z.string().max(80), wardrobe: z.string().max(200), energy: z.array(z.string().max(60)), searchRef: z.string().max(160) }),
  scenes: z.array(
    z.object({
      seconds: z.number(),
      vo: z.string().max(600), // exact words, or "Music only"
      imagePrompt: z.string().max(1200),
      move: z.string().max(80),
      lens: z.string().max(40),
      angle: z.string().max(60),
      size: z.enum(["wide", "medium", "close-up", "macro", "graphic"]),
      editorNote: z.string().max(300),
      kind: z.enum(["footage", "graphic", "offer-card"]),
      graphicLines: z.array(z.string().max(600)), // for graphic scenes: the exact words on screen
      graphicMotion: z.enum(["hold", "zoom punch", "stamp", "flip", "slam"]),
    }),
  ),
  voice: z.object({ archetype: z.string().max(600), style: z.string().max(600), emphasize: z.array(z.string().max(60)), neverEmphasize: z.array(z.string().max(120)), pauses: z.array(z.object({ scene: z.number(), seconds: z.number(), where: z.string().max(120) })), prompt: z.string().max(800), variants: z.array(z.string().max(200)) }),
  music: z.object({ style: z.string().max(300), anchors: z.array(z.object({ scene: z.number(), note: z.string().max(160) })), never: z.array(z.string().max(120)) }),
});
export type Draft = z.infer<typeof draftSchema>;

export type BriefInput = { format: string; content: Pick<AdContent, "tiers" | "ends" | "cta" | "terms">; campaign: string; aspect: "1:1" | "4:5" | "9:16"; instructions?: string };
export type BriefDependencies = { brief?: (system: string, prompt: string) => Promise<Draft> };

export const NO_AVATAR = "No on-screen avatar";
export const briefWordBudget = (format: Format) => Math.floor(format.runtime * format.pace * 0.9);

const SYSTEM = `You are the strategist, writer and art director at a direct-response video agency. You write production briefs that an editor can build from without asking a question. Precision is the product: every scene is fully specified, nothing is implied.
Column grammar, never broken:
- vo: the exact spoken words in quotation-free plain text with punctuation, first person for testimonial/UGC, announcer for infomercial; spoken numbers as words ("three thousand", "October thirty-first"); or exactly "Music only".
- imagePrompt: ONE sentence, 12–25 words: <who> <doing what>, <where>, <light>, photoreal, <shot size>. Name the region wherever the outdoors is visible. Footage prompts contain no on-screen text, logos or lettering. For graphic and offer-card scenes leave imagePrompt empty and put the exact on-screen words in graphicLines (the app renders every graphic from exact text; leave the final offer-card's graphicLines empty).
- AVATAR BIBLE: fill every field — name, role, ageRange ("63-68"), locale ("Kentucky suburban homeowner"), wardrobe as one concrete phrase ("cozy oatmeal cardigan over a grey tee"), exactly three energy qualities, and searchRef for casting a voice or reference image. The avatar's FIRST footage appearance describes them by type and wardrobe with the wardrobe phrase copied verbatim ("Older woman in a cozy oatmeal cardigan over a grey tee standing at a frosted window …"). Every later appearance starts "Same woman" or "Same man". NEVER write the avatar's name in a scene cell and never repeat their age or description: identity lives in the bible only. Infomercial: no on-screen avatar — avatar.name is exactly "${NO_AVATAR}" and the other avatar fields say who carries the piece (the announcer's voice, b-roll, which asset library keeps continuity).
- AI-HARD ACTIONS, never choose them: tools touching surfaces in close-up, tape, pouring, writing, typing, many fingers in focus, hands working small objects. Prefer wider framings, backs of hands, implied action (the roll of tape on the sill, not the taping), faces, postures and finished results.
- move: one camera move from the format's list. lens: 24mm | 35mm | 50mm | 85mm macro | 100mm macro. angle: eye-level | low angle | overhead | handheld. size: wide | medium | close-up | macro. Graphic and offer-card scenes: the app sets their camera to a static overlay; choose their motion in graphicMotion.
- editorNote: two short sentences: the scene's job (Hook. Quick beat. Turning point. Breathing beat. Key proof-point scene. Key emotional beat. Emotional peak. Emotional payoff. Offer reveal. Price reveal 1 of 2. Urgency beat. Punch beat. Material claim.) then one instruction that names how this scene differs from the one before ("Vary from S1's push with a static macro."). No two neighbouring footage scenes share both move and size. The final CTA scene's note is written by the app.
- seconds: whole numbers; footage and cards 2–4s (fast-cut formats 2s), a punch beat may be 1s, the final card 3–4s; they add up to the runtime EXACTLY.
- WORD BUDGET: every vo line must fit: words ≤ seconds × pace. The whole script must not exceed the total word budget in the prompt. Count every line. Rewrite until it fits.
- OFFER, SPOKEN: in the offer-reveal or CTA beats the VO says the campaign name and the top tier amount as words, in this shape: "Right now it's Fall Savings. Save up to three thousand dollars." Price-reveal graphics use only the offer's exact figures. The LAST scene is kind "offer-card".
- CLAIMS: only claim what the approved claims list allows, in exactly its scope — never extend a claim with "ever", "forever", "always", "guaranteed", "on time", "number one" or "best in". Anything else you wanted (a warranty, a statistic, a testimonial quote) goes in materialsNeeded instead.
- REQUIRED SHOTS: the prompt lists the shots this format must contain; each one is a scene's image prompt or card.
- hero: the product and its key material or feature ("Window & door replacement — Fibrex frames"), derived from the offer and the brand — never the avatar. device: the structural device in three to five words ("transformation-arc testimonial", "us-versus-them tradesman UGC", "open-loop infomercial"). location: the region and setting ("Kentucky suburban home").
- dna: name the client's past concepts and state how this differs in format, emotional register and structural device.
- materialsNeeded: only what the client must supply, each as "what is missing → what that forces".
- voice.archetype: who is speaking and as whom, who they are NOT (not a professional narrator, not a salesperson), gender, age and accent, ending with "Reference archetype: …" ("the neighbor who tells it straight over coffee").
- voice.style: "Primary emotion: …. Secondary: …. Pace: … about N words per second. Never sound: … (a list). Let a natural breath land before S3 and after S6." — name real scene numbers.
- voice.emphasize: words that appear in the vo lines, never the brand name. neverEmphasize: what must not be leaned on (the brand name read like an ad tag, filler words, the product name over-enunciated). pauses: scene number, 0.5s or 1s, and where. voice.prompt: one paragraph describing the performance with at least two cues anchored to quoted script words ("a small smile audible on 'it always belonged'"). Exactly three performance variants (A, B, C), one sentence each.
- music.style: one sentence with what it must never become. anchors: scene numbers that exist — where it enters (S1), where it swells or hits, where it settles, and a fade under the end card. never: three things.`;
export const BRIEF_SYSTEM = SYSTEM;

const windowsOnly = (content: BriefInput["content"]) => content.tiers.some((t) => /window/i.test(t.lead)) && !content.tiers.some((t) => /door/i.test(t.lead));

export function briefPrompt(brand: any, format: Format, input: BriefInput) {
  const kit = brand.videoKit || {};
  const offer = input.content.tiers.map((t) => `${t.lead}, ${t.value}`).join(" / ");
  return [
    `CLIENT: ${brand.name}. CAMPAIGN: ${input.campaign}. Season: ${seasonOf(input.content.ends)}.`,
    `OFFER, exact: ${offer || "no discount; invite a free consultation"}. ${input.content.ends ? offerEnds(input.content.ends) + "." : ""} Disclaimer, exact: "${input.content.terms || ""}". CTA: "${input.content.cta}".${windowsOnly(input.content) ? " The offer names windows only; never imply doors are discounted." : ""}`,
    `FORMAT: ${format.label} — ${format.formatLine}. Runtime ${format.runtime}s, ${format.scenes[0]}–${format.scenes[1]} scenes, pace ${format.pace} words/second, longest scene ${format.maxScene}s. WORD BUDGET: at most ${briefWordBudget(format)} words in total across all vo lines. Platform: Meta — 1x1, 4x5, 9x16. Colour grade: ${format.grade}. Pacing: ${format.pacing}. Tone: ${format.tone}.`,
    `ARC (one scene per beat, in order): ${format.arc.join(" → ")}.`,
    `REQUIRED SHOTS: ${format.requiredShots.join("; ")}.`,
    `CAMERA MOVES allowed: ${format.moves.join(" | ")}.`,
    `REGION: ${kit.region || "the client's home region (unknown — list it in materialsNeeded)"}. Never show: ${kit.bannedRegion || "another region's landscape"}. Brand name spelled exactly "${brand.name}"${kit.misspellings?.length ? `, never ${kit.misspellings.map((m: string) => `"${m}"`).join(" or ")}` : ""}.`,
    `APPROVED CLAIMS (the only claims allowed): ${(kit.claims || []).map((c: any) => `"${c.text}"`).join("; ") || "none on file"}.`,
    `REAL PEOPLE ON FILE: ${(kit.avatars || []).map((p: any) => `${p.name} — ${p.role}: ${p.description} (${p.assetIds.length} photos)`).join("; ") || `none — invent one avatar for testimonial/UGC; infomercial has no on-screen avatar (avatar.name = "${NO_AVATAR}")`}.`,
    `BRAND LOOK: ${kit.notes || "no brand kit notes"}.`,
    `PAST CONCEPTS for the DNA check: ${(kit.pastConcepts || []).map((p: any) => `${p.title} (${p.format}; ${p.register}; ${p.device})`).join("; ") || "none on record"}.`,
    input.instructions?.trim() ? `OWNER INSTRUCTIONS (highest priority): ${input.instructions.trim()}` : "",
  ].filter(Boolean).join("\n");
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
// Case-insensitive, keyed on the "what is missing" half so the model's rewording of a kit gap does not repeat it.
const dedupe = (items: string[]) => { const seen = new Set<string>(); return items.map((s) => s.trim()).filter((s) => { const k = s.split(/→|—|:/)[0].trim().toLowerCase(); return s && !seen.has(k) && seen.add(k); }); };
const mentions = (text: string, name: string) => text.toLowerCase().includes(name.toLowerCase());

// What the kit lacks and what that forces (§2.5), in the agency's "X not on file → consequence" shape.
export function kitGaps(kit: any, format: Format, avatarName: string) {
  return [
    ...(!kit.avatars?.length && avatarName !== NO_AVATAR ? [`No real customer footage or quotes on file → this draft uses an AI-generated avatar (${avatarName}); request a real customer quote or photos of a real ambassador`] : []),
    ...(kit.references?.length ? [] : [`No reference videos on file → direction pulls from general ${format.label} tradition`]),
    ...(kit.claims?.length ? [] : ["No approved claims on file → the script makes no product claims; send the claims the client can substantiate"]),
    ...(kit.region ? [] : ["No home region on file → image prompts cannot name the landscape; add the region to show and the region never to show"]),
  ];
}

// Product colour per brand standards, read from the kit's PRODUCT note when it names a colour.
const productColour = (notes: string) => {
  const product = notes.match(/PRODUCT:\s*([^]*?)(?=\b[A-Z]{3,}:|$)/)?.[1] || notes;
  return product.match(/[^.;]*\b(white|black|sandstone|terratone|bronze|gr[ae]y|cream|beige|tan|green)\b[^.;]*/i)?.[0].trim() || "";
};

// Merge a draft into a plan: computed numbers, exact offer card, preset settings. Never throws on model counts.
export function toPlanFromDraft(draft: Draft, brand: any, format: Format, key: string, input: BriefInput): VideoPlan {
  const kit = brand.videoKit || {};
  const n = draft.scenes.length;
  const segments = draft.scenes.map((sc, i) => {
    const silent = /^music only\.?$/i.test(sc.vo.trim());
    const line = silent ? "" : sc.vo.trim();
    const offerCard = sc.kind === "offer-card" || i === n - 1;
    const card = offerCard || sc.kind === "graphic";
    const seconds = clamp(Math.round(sc.seconds), 1, 12);
    // The CTA note is the agency's, composed here so the hold, the type size and the spelling check are never left out.
    const editorNote = offerCard ? `CTA scene. Disclaimer in six-point font, hold ${seconds}s minimum. Confirm "${brand.name}" spelling.` : sc.editorNote.trim();
    return {
      id: `s${i + 1}`,
      seconds,
      line,
      approved: false,
      setting: "",
      // Cards carry no footage prompt: the picture is the graphic, and its motion lives in graphic.motion.
      shots: [{ phrase: line, visual: card ? "" : sc.imagePrompt.trim(), camera: "static" as const, source: "ai" as const }],
      stillAssetId: null,
      clipAssetId: null,
      keyframePrompt: "",
      motionPrompt: "",
      kind: offerCard ? ("offer-card" as const) : sc.kind,
      camera: card ? { move: "static", lens: "overlay", angle: "none", size: "graphic" as const } : { move: sc.move, lens: sc.lens, angle: sc.angle, size: sc.size === "graphic" ? ("medium" as const) : sc.size },
      editorNote,
      key: isKeyNote(editorNote),
      // Exact text is never the model's: the offer card is built from the campaign, character for character.
      graphic: offerCard
        ? { lines: [...input.content.tiers.map((t) => `${t.lead}, ${t.value}`), ...(input.content.terms ? [input.content.terms] : [])], motion: "hold" as const }
        : sc.kind === "graphic" ? { lines: sc.graphicLines.map((l) => l.trim().slice(0, 600)).filter(Boolean).slice(0, 6), motion: sc.graphicMotion } : null,
    };
  });
  const avatarName = draft.avatar.name.trim() || NO_AVATAR;
  const brandTag = `"${brand.name}" read like an ad tag`;
  const anchors = draft.music.anchors.filter((a) => a.scene >= 1).map((a) => ({ scene: Math.round(a.scene), note: a.note.trim() })).slice(0, 6);
  const colour = productColour(kit.notes || "");
  const brief: Brief = {
    title: draft.title.trim(),
    device: draft.device.trim(),
    specs: {
      campaign: input.campaign,
      hero: draft.hero.trim(),
      formatLine: format.formatLine,
      platform: "Meta — 1x1, 4x5, 9x16",
      location: kit.region ? `${kit.region} home${kit.bannedRegion ? ` (never ${kit.bannedRegion})` : ""}` : draft.location.trim(),
      grade: format.grade,
      pacing: format.pacing,
      tone: format.tone,
    },
    dna: draft.dna.trim(),
    negatives: [
      "Extra or malformed fingers, warped hands, duplicate limbs",
      "Distorted or asymmetrical facial features, uncanny-valley skin texture",
      "Garbled on-screen text, watermark artifacts, logo ghosting",
      "Oversaturated or off-brand colour; the brand colour must match the approved brand files",
      ...(kit.misspellings || []).map((m: string) => `Misspelling "${m}" — correct spelling is ${brand.name}`),
      ...(kit.bannedRegion ? [`${kit.bannedRegion} landscape — this is ${kit.region || "the client's region"}`] : []),
      ...format.negatives,
    ].slice(0, 20),
    materialsNeeded: dedupe([...kitGaps(kit, format, avatarName), ...draft.materialsNeeded]).slice(0, 10),
    references: (kit.references || []).map((r: any) => ({ title: r.title, url: r.url || "", take: r.take, avoid: r.avoid })),
    avatar: { name: avatarName, role: draft.avatar.role.trim(), ageRange: draft.avatar.ageRange.trim(), locale: draft.avatar.locale.trim(), wardrobe: draft.avatar.wardrobe.trim(), energy: draft.avatar.energy.map((e) => e.trim()).filter(Boolean).slice(0, 3), searchRef: draft.avatar.searchRef.trim(), bullets: [] },
    productBible: [
      `Brand name always "${brand.name}"${kit.misspellings?.length ? ` — never ${kit.misspellings.map((m: string) => `"${m}"`).join(", ")}` : ""}`,
      ...(colour ? [`Product colour per brand standards: ${colour}`.slice(0, 300)] : []),
      `Brand colour ${brand.color || "#6CC14C"} flat and muted, black text on it, sourced from the brand files`,
      ...input.content.tiers.map((t) => `Offer text exact: "${t.lead}, ${t.value}"`),
      ...(input.content.terms ? [`End-card disclaimer exact: "${input.content.terms}" — six-point font, every video`.slice(0, 300)] : []),
      ...(windowsOnly(input.content) ? ["Offer copy names windows only — door imagery may appear as service scope, but do not visually imply the discount applies to doors"] : []),
      `Required shots: ${format.requiredShots.join(", ")}`,
      ...(kit.claims || []).map((c: any) => `Approved claim: "${c.text}"${c.finePrint ? ` (${c.finePrint})` : ""}`),
    ].slice(0, 12),
    voice: {
      archetype: draft.voice.archetype.trim(),
      style: draft.voice.style.trim(),
      // The brand name is read plainly, never leaned on (the agency lists it under "Never emphasize").
      emphasize: draft.voice.emphasize.map((w) => w.trim()).filter((w) => w && !mentions(w, brand.name)).slice(0, 8),
      neverEmphasize: [brandTag, ...draft.voice.neverEmphasize.map((w) => w.trim()).filter((w) => w && !mentions(w, brand.name))].slice(0, 6),
      pauses: draft.voice.pauses.filter((p) => p.scene >= 1).map((p) => ({ scene: Math.round(p.scene), seconds: clamp(p.seconds, 0.25, 2), where: p.where.trim() })).slice(0, 6),
      prompt: draft.voice.prompt.trim(),
      settings: { stability: format.voice.stability, similarity: format.voice.similarity, style: format.voice.style, speakerBoost: format.voice.speakerBoost },
      variants: [0, 1, 2].map((i) => draft.voice.variants[i]?.trim() || `Variant ${"ABC"[i]}: as written`),
    },
    music: {
      style: draft.music.style.trim(),
      bpm: format.music.bpm,
      // The bed always enters under S1 and fades under the end card; the model's own anchors sit between.
      anchors: [
        ...(anchors.some((a) => a.scene === 1 && /enter/i.test(a.note)) ? [] : [{ scene: 1, note: "Enter low, under S1" }]),
        ...anchors,
        ...(anchors.some((a) => a.scene === n && /fade/i.test(a.note)) ? [] : [{ scene: n, note: "Fade under the end card" }]),
      ].slice(0, 8),
      never: [...draft.music.never.map((w) => w.trim()).filter(Boolean).slice(0, 4), ...(draft.music.never.some((w) => /competes with the vo/i.test(w)) ? [] : ["Anything that competes with the VO"])].slice(0, 5),
    },
  };
  return videoPlanSchema.parse({
    name: brief.title,
    style: key === "ugc" ? "ugc" : "commercial",
    format: key,
    brief,
    aspect: input.aspect,
    targetSeconds: format.runtime,
    content: { tiers: input.content.tiers, ends: input.content.ends, cta: input.content.cta, terms: input.content.terms },
    instructions: input.instructions || "",
    presenter: avatarName === NO_AVATAR ? "" : [brief.avatar.role, brief.avatar.ageRange, brief.avatar.locale, brief.avatar.wardrobe, ...brief.avatar.energy].filter(Boolean).join("; ").slice(0, 400),
    script: segments.map((s) => s.line).filter(Boolean).join(" "),
    segments,
  });
}

// Deterministic fit (§4.2): a line still over budget after the repair pass gets a second from the longest non-key
// footage scene that stays ≥ 2s and still fits its own line. Runtime stays exact; key scenes never lose time.
export function fitLines(plan: VideoPlan, format: Format): VideoPlan {
  const segs = plan.segments.map((s) => ({ ...s }));
  const over = (s: (typeof segs)[number]) => !fits(wordCount(s.line), s.seconds, format.pace);
  for (let i = 0; i < segs.length; i++) {
    const last = i === segs.length - 1;
    while (over(segs[i]) && (last || segs[i].seconds < format.maxScene)) {
      const donor = segs
        .map((s, j) => ({ s, j }))
        .filter(({ s, j }) => j !== i && s.kind === "footage" && !s.key && s.seconds > 2 && fits(wordCount(s.line), s.seconds - 1, format.pace))
        .sort((a, b) => b.s.seconds - a.s.seconds)[0];
      if (!donor) break;
      donor.s.seconds--;
      segs[i].seconds++;
    }
  }
  return { ...plan, segments: segs };
}

export async function writeBrief(brand: any, input: BriefInput, deps: BriefDependencies = {}): Promise<{ plan: VideoPlan; checks: Check[] }> {
  const format = FORMATS[input.format];
  if (!format) throw new Error(`Unknown video format ${input.format}`);
  check(input.content.terms?.trim(), "Add the offer's disclaimer (fine print) before writing a brief; the last scene always carries it", 422);
  const prompt = briefPrompt(brand, format, input);
  const ask =
    deps.brief ||
    (async (system: string, user: string) =>
      (await generateText({ model: PLAN_MODEL, system, prompt: user, output: Output.object({ schema: draftSchema }), providerOptions: { anthropic: { thinking: { type: "disabled" } } }, maxOutputTokens: 8000, timeout: { totalMs: 180_000 } })).output);
  // A paid draft that still cannot be shaped into a plan is the writer's failure, not a bad request.
  const shape = (raw: unknown) => {
    try {
      return toPlanFromDraft(draftSchema.parse(raw), brand, format, input.format, input);
    } catch (e) {
      console.error("[videoBrief] unusable draft", e instanceof z.ZodError ? e.issues : e);
      throw new AppError(502, "The brief writer returned an unusable brief; try again");
    }
  };
  let plan = shape(await ask(SYSTEM, prompt));
  let checks = lintBrief(plan, format, brand);
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    // One repair pass with the exact failures; if it fails outright, the first plan and its warnings stand.
    const repair = `${prompt}\n\nYour previous brief failed these checks. Fix each one by rewriting the scene, not by changing the numbers you claim:\n${failed.map((c) => `- ${c.name}: ${c.detail}`).join("\n")}\nPrevious brief: ${JSON.stringify(plan.brief && { ...plan.brief, scenes: plan.segments.map((s) => ({ seconds: s.seconds, vo: s.line || "Music only", imagePrompt: s.shots[0].visual, camera: s.camera, editorNote: s.editorNote, kind: s.kind, graphicLines: s.graphic?.lines || [] })) })}`;
    try {
      plan = shape(await ask(SYSTEM, repair));
    } catch (e) {
      console.error("[videoBrief] repair pass failed; keeping the first draft", e);
    }
  }
  plan = fitLines(plan, format);
  checks = lintBrief(plan, format, brand);
  return { plan, checks };
}
