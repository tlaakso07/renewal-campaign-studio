// Creative-director briefs for AI-designed ads (Zuops-style Create and Remix).
// The model designs the whole ad; the company's design system and real ads steer it.
import type { AdContent } from "./types.ts";
import { offerEnds, seasonOf } from "./adLayouts.ts";

export type AdAspect = "1:1" | "4:5" | "9:16";
export type AdMode = "create" | "remix";

// Distinct creative directions; each variation in a batch gets a different one so a batch is 4 real ideas.
export const AD_CONCEPTS = [
  "Offer-first: the savings are the hero in huge bold type over a clean, strong photo",
  "Before/after: an old, worn window beside the new replacement window, with the offer bridging the two",
  "Lifestyle: a warm, lived-in room or home exterior bathed in light, offer set in a bold band or badge",
  "People: a friendly uniformed installer or a happy homeowner, with the offer beside them",
  "Seasonal: the current season sets the scene (leaves, weather, holidays), with the offer tied to the season",
  "Urgency: the deadline is the hook (countdown feel, 'ends soon' treatment) with the offer prominent",
  "Product close-up: a crisp detail of a new window (frame, glass, hardware) with the offer in bold type",
] as const;

export const AD_ANGLES = ["Savings", "Comfort & energy", "Curb appeal", "Quality & craftsmanship", "Trust & local", "Urgency"] as const;
export const AD_TONES = ["Bold & punchy", "Warm & friendly", "Premium & calm", "Direct & urgent"] as const;

// Every string that must appear exactly on the ad; the auto-check verifies these.
export function requiredAdText(c: Pick<AdContent, "tiers" | "ends" | "cta">): string[] {
  return [
    ...c.tiers.flatMap((t) => [t.lead, t.value]),
    ...(c.ends ? [offerEnds(c.ends)] : []),
    ...(c.cta.trim() ? [c.cta.trim()] : []),
  ].filter(Boolean);
}

const aspectRules: Record<AdAspect, string> = {
  "1:1": "square 1:1 Meta feed ad",
  "4:5": "portrait 4:5 Meta feed ad. Keep the logo and all text at least 5% in from every edge",
  "9:16": "vertical 9:16 Stories/Reels ad. IMPORTANT: Instagram/Facebook cover the top 14% and bottom 20% of the screen with their own buttons — fill those two strips with photo/background ONLY, and place the logo, headline, offer, button and date entirely in the middle 66%",
};

export function buildAdPrompt(input: {
  mode: AdMode;
  brand: any;
  content: Pick<AdContent, "headline" | "tiers" | "ends" | "cta">;
  concept: string;
  aspect: AdAspect;
  angle?: string;
  tone?: string;
  instructions?: string;
  hasSource: boolean;
  styleReferenceCount: number;
  hasTypeSpecimen?: boolean;
}) {
  const b = input.brand;
  const colors = Object.entries(b.rules?.colors || { green: b.color })
    .filter(([k]) => !/orange|rich/i.test(k))
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
  const offer = input.content.tiers.map((t) => `"${t.lead}" → "${t.value}"`).join(" and ");
  const lines = [
    `Design a finished, professional ${aspectRules[input.aspect]} for ${b.name}.`,
    input.mode === "remix"
      ? "REMIX: the FIRST reference image is an existing ad. Reimagine it into a brand-new ad with a new concept, new composition, new scene and a new headline angle. Keep only the brand and the offer. Do NOT reproduce the source layout, photo or wording."
      : "CREATE: invent an original ad concept and layout.",
    input.instructions?.trim()
      ? `OWNER INSTRUCTIONS — highest priority, follow every point literally: ${input.instructions.trim()}\nIf the owner describes a scene, that scene is the hero of the photo. If the owner says which text must be largest, every other piece of text — including any headline you write — must be visibly smaller than it. Owner instructions never remove required content: EVERY offer line, the end date and the button must still all appear.`
      : "",
    `Creative direction${input.instructions?.trim() ? " (apply only where it does not conflict with the owner instructions)" : ""}: ${input.concept}.`,
    input.angle ? `Marketing angle: ${input.angle}.` : "",
    input.tone ? `Tone: ${input.tone}.` : "",
    input.styleReferenceCount
      ? `The ${input.styleReferenceCount} brand reference ads show ${b.name}'s real, approved style: match their quality, colour use, bold heavy italic headline type and polish — but make a NEW design, do not copy any one of them.`
      : "",
    `Brand colours: ${colors}. White or black text on solid areas for contrast.`,
    `TYPOGRAPHY — strict: every word on the ad is set in ${b.rules?.typography?.primary || "ITC Franklin Gothic Std"} and NO other typeface${input.hasTypeSpecimen ? " (the white type-specimen reference image shows the exact font and weights — match its letterforms)" : ""}. Titles, headlines and offer amounts: Heavy (bold/black), upright or italic. Sub-text (offer lead lines, dates, button label, small copy): Book (regular) or Demi Condensed. No serif, script, handwritten, rounded or decorative fonts anywhere.`,
    `Season: ${seasonOf(input.content.ends)}. Do not mention or depict any other season${input.mode === "remix" ? ", even if the source ad does" : ""}.`,
    `Use the supplied ${b.name} logo image exactly as given — unaltered, uncropped, legible, once.`,
    `Offer — MANDATORY, show ALL ${input.content.tiers.length} offer tier(s), none may be omitted (render these words EXACTLY, spelled and punctuated as written): ${offer || "no discount offer"}.`,
    input.content.headline.trim() ? `Headline idea: "${input.content.headline.replace(/\s*\n\s*/g, " ")}".` : "Write a short, punchy headline that sells the offer.",
    input.content.ends ? `Include "${offerEnds(input.content.ends)}" exactly.` : "",
    input.content.cta.trim() ? `Call-to-action button text, exactly: "${input.content.cta.trim()}".` : "",
    "The only words on the ad are: one headline, at most one short supporting line, the offer, the end date and the button. Do not add extra banners, badges or urgency slogans (e.g. 'Ends soon!', 'Limited time').",
    // Client rule (2026-09-18, statics only): plain brand-colour clothing, so AI never draws a warped logo on a shirt or cap.
    "Any people wear PLAIN, solid-colour clothing in brand colours (black, green, white or grey) — no logos, emblems, patches, badges, embroidery or lettering on shirts, caps, jackets or gloves. No logos or lettering on vehicles, tools or products either. The supplied logo appears exactly once, as a graphic element of the ad, never inside the photo.",
    "No readable text inside the photo itself (no wall signs, posters, book titles). No testimonials, customer quotes, star ratings or reviews.",
    "Photorealistic, well-lit homes and windows. No invented statistics, awards, phone numbers, URLs or prices other than the offer above. No watermarks, no mock UI, no extra logos.",
  ];
  return lines.filter(Boolean).join("\n");
}

// Pick N different concepts; a chosen concept is used for the first, the rest rotate for variety.
export function pickConcepts(n: number, preferred?: string, seed = Date.now()) {
  const pool = AD_CONCEPTS.filter((c) => c !== preferred);
  const start = seed % pool.length;
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return [...(preferred ? [preferred] : []), ...rotated].slice(0, n);
}
