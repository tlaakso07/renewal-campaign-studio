// The Editor Checklist, owned by code (product/VIDEO-BRIEF-STANDARD.md §6, checks 1–16: before the vision board).
// Pure: no database, no network. Every failure names the scene so the writer can repair it and the client can see it.
import { readFileSync } from "node:fs";
import type { VideoPlan } from "./videoPlan.ts";

export type Format = {
  label: string; formatLine: string; runtime: number; scenes: [number, number]; pace: number; maxScene: number;
  grade: string; pacing: string; tone: string; arc: string[]; negatives: string[]; requiredShots: string[];
  voice: { stability: number; similarity: number; style: number; speakerBoost: boolean; pace: number };
  music: { bpm: [number, number] }; moves: string[];
};
export const FORMATS: Record<string, Format> = JSON.parse(readFileSync(new URL("../library/video-formats.json", import.meta.url), "utf8"));

export type Check = { id: number; name: string; ok: boolean; detail: string };
type Scene = VideoPlan["segments"][number];
type Kit = { region?: string; bannedRegion?: string; misspellings?: string[]; claims?: { text: string }[]; avatars?: { name: string }[] };

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
// Key scenes are tinted on the board (§3.5). The agency tints proof points, emotional beats, price/offer reveals, urgency, the claim support and the CTA.
export const isKeyNote = (note: string) => /^(key|cta|price reveal|price slam|emotional (peak|payoff)|offer reveal|urgency|exact expiration|end date|supports the|material claim)/i.test(note.trim());
export const fits = (words: number, seconds: number, pace: number) => words <= Math.ceil(seconds * pace * 1.1);
const num = (n: number) => String(n).padStart(2, "0");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Spoken numbers: "a thousand", "three thousand", "fifteen hundred", "twenty-five hundred". A number word after
// "thousand" is a spoken year ("two thousand twenty-six") and is not an amount.
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const NUM = `(?:a|${[...ONES.slice(1), ...TENS.slice(2)].join("|")})`;
const AMOUNT = new RegExp(`\\b(${NUM}(?:[- ]${NUM})?) (thousand|hundred)\\b(?![- ](?:and[- ])?${NUM}\\b)`, "gi");
const wordNum = (w: string) => w.toLowerCase().split(/[\s-]+/).reduce((n, p) => n + (p === "a" ? 1 : ONES.includes(p) ? ONES.indexOf(p) : TENS.includes(p) ? TENS.indexOf(p) * 10 : NaN), 0);
export const spokenAmounts = (text: string) => [...text.matchAll(AMOUNT)].map((m) => ({ phrase: m[0], value: wordNum(m[1]) * (m[2].toLowerCase() === "thousand" ? 1000 : 100) }));
const numWords = (n: number): string => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
// How an offer amount is spoken: $3,000 → "three thousand"; $1,500 → "fifteen hundred".
export const amountWords = (n: number) => (n % 1000 === 0 && n / 1000 < 100 ? `${numWords(n / 1000)} thousand` : n % 100 === 0 && n / 100 < 100 ? `${numWords(n / 100)} hundred` : `$${n.toLocaleString("en-US")}`);
const dollars = (text: string) => (text.match(/\$[\d,]+/g) || []).map((d) => Number(d.replace(/[$,]/g, "")));

// Dates: "10/31/26", "October 31", "Oct. 31st", "October thirty-first" — every one must be the offer's end date.
const MONTH = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2}(?:st|nd|rd|th)?|[a-z]+(?:-[a-z]+)?)\b/gi;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20, thirtieth: 30 };
const dayOf = (w: string) => (/^\d/.test(w) ? parseInt(w, 10) : w.toLowerCase().split("-").reduce((n, p, i, a) => n + (i === a.length - 1 ? ORD[p] ?? NaN : TENS.indexOf(p) > 1 ? TENS.indexOf(p) * 10 : NaN), 0));
function datesIn(text: string) {
  const out: { phrase: string; month: number; day: number }[] = [];
  for (const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?\b/g)) out.push({ phrase: m[0], month: Number(m[1]), day: Number(m[2]) });
  for (const m of text.matchAll(MONTH)) {
    const day = dayOf(m[2]);
    if (day >= 1 && day <= 31) out.push({ phrase: m[0], month: MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1, day });
  }
  return out;
}

// ponytail: keyword heuristics for "outdoors" and "claim"; a vision pass could replace them if they misfire.
const OUTDOOR = /driveway|exterior|yard|street|porch|outside|lawn|curb|trees|neighbou?rhood/i;
// Claim words are scanned wherever the viewer sees or hears them (script, image prompts, cards). The bracketed
// label is what an approved claim must contain to cover the use.
const CLAIM_WORDS = ["warranty", "guarantee", "lifetime", "million", "award", "#1", "rated", "certified", "stronger", "won't rot", "wont rot", "rot, crack", "percent", "energy"];
const CLAIM_PATTERNS: [string, RegExp][] = [
  ...CLAIM_WORDS.map((w) => [w, new RegExp(`(^|\\W)${esc(w)}(\\W|$)`, "i")] as [string, RegExp]),
  ["efficien", /\befficien/i],
  ["%", /\d\s?%/],
];
// Script-only: counted years/days and absolutes that extend an approved claim ("won't rust, ever").
// ponytail: "always" also catches "like it always belonged"; narrow it if the writer keeps tripping on non-claims.
const SCRIPT_CLAIMS: [string, RegExp][] = [["year", new RegExp(`\\b(\\d+|${NUM}(?:[- ]${NUM})?) years?\\b`, "i")], ["day", /\b(same|one|next|\d+)[- ]day\b/i], ["since", /\bsince \d{4}\b/i]];
// "always" is left out: the agency's own line is "like it always belonged"; "always on time" is caught by "on time".
const EXTENSIONS = /\b(ever|forever|guaranteed|never fails?|on time|number one|best in)\b/gi;

export function lintBrief(plan: Pick<VideoPlan, "segments" | "brief" | "content">, format: Format, brand: { name: string; videoKit?: Kit }): Check[] {
  const s = plan.segments, b = plan.brief, kit = brand.videoKit || {};
  const out: Check[] = [];
  const add = (id: number, name: string, problems: string[]) => out.push({ id, name, ok: !problems.length, detail: problems.join("; ") });
  const script = s.map((x) => x.line).join(" ");
  const visuals = s.map((x) => x.shots.map((y) => y.visual).join(" "));
  const cards = s.flatMap((x) => x.graphic?.lines || []);
  // What the viewer sees or hears; claims are only claims here.
  const shown = [script, ...visuals, ...cards].join("\n");
  // Authored text: the negatives, product bible and editor notes legitimately name the misspelling and the banned region,
  // as does the Locations row's "(never …)" clause.
  const allText = [shown, ...(b ? [b.title, b.device, b.specs.hero, b.specs.location.replace(/\(never [^)]*\)/i, ""), b.dna, b.avatar.role, b.avatar.wardrobe, ...b.avatar.bullets, b.voice.prompt, b.voice.archetype, b.voice.style, ...b.voice.variants, ...b.voice.neverEmphasize, ...b.voice.pauses.map((p) => p.where), b.music.style, ...b.music.anchors.map((m) => m.note)] : [])].join("\n");
  const word = (w: string) => new RegExp(`(^|\\W)${esc(w)}(\\W|$)`, "i");

  const total = s.reduce((n, x) => n + x.seconds, 0);
  add(1, "Durations add up to the runtime", total === format.runtime ? [] : [`scenes total ${total}s, runtime is ${format.runtime}s`]);
  add(2, "Every second is covered", s.flatMap((x, i) => [
    ...(Number.isInteger(x.seconds) && x.seconds >= 1 ? [] : [`scene ${num(i + 1)}: ${x.seconds}s is not whole seconds`]),
    ...(x.shots[0]?.visual.trim() || x.graphic?.lines.length ? [] : [`scene ${num(i + 1)}: nothing on screen`]),
  ]));
  add(3, "Every line fits its scene", s.flatMap((x, i) => (fits(wordCount(x.line), x.seconds, format.pace) ? [] : [`scene ${num(i + 1)}: ${wordCount(x.line)} words in ${x.seconds}s (max ${Math.ceil(x.seconds * format.pace * 1.1)} at ${format.pace}/s)`])));
  add(4, "Pacing rule holds", s.flatMap((x, i) => (i < s.length - 1 && x.seconds > format.maxScene ? [`scene ${num(i + 1)}: ${x.seconds}s, format allows ${format.maxScene}s`] : [])));
  // Graphics vary by their own motion (the agency runs two price cards back to back), so only footage pairs are compared.
  add(5, "Neighbouring scenes differ in move or size", s.flatMap((x, i) => {
    const p = s[i - 1];
    const both = p?.camera && x.camera && (p.kind === "footage" || x.kind === "footage");
    return both && p.camera!.move === x.camera!.move && p.camera!.size === x.camera!.size ? [`scenes ${num(i)} and ${num(i + 1)}: both ${x.camera!.move}, ${x.camera!.size}`] : [];
  }));
  add(6, "Brand name spelled correctly", (kit.misspellings || []).flatMap((m) => (word(m).test(allText) ? [`"${m}" appears`] : [])));
  const offerAmounts = new Set(plan.content.tiers.flatMap((t) => dollars(`${t.lead} ${t.value}`)));
  const offerList = [...offerAmounts].map((n) => `$${n.toLocaleString("en-US")}`).join(", ") || "none";
  add(7, "Offer figures match the campaign", [
    ...s.flatMap((x, i) => [...(x.graphic?.lines || []), x.line].flatMap((l) => dollars(l).flatMap((d) => (offerAmounts.has(d) ? [] : [`scene ${num(i + 1)}: $${d.toLocaleString("en-US")} is not in the offer (${offerList})`])))),
  ]);
  add(8, "Spoken numbers match the offer", spokenAmounts(script).flatMap((a) => (offerAmounts.has(a.value) ? [] : [`"${a.phrase}" is not an offer figure`])));
  add(9, "Region named outdoors, banned region absent", [
    ...s.flatMap((x, i) => (x.kind === "footage" && OUTDOOR.test(x.shots[0]?.visual || "") && kit.region && !word(kit.region).test(x.shots[0].visual) ? [`scene ${num(i + 1)}: outdoors without "${kit.region}"`] : [])),
    ...(kit.bannedRegion && word(kit.bannedRegion).test(allText) ? [`"${kit.bannedRegion}" appears`] : []),
  ]);
  add(10, "Voice and music anchors exist", b ? [
    ...b.voice.emphasize.flatMap((w) => (script.toLowerCase().includes(w.toLowerCase()) ? [] : [`emphasis "${w}" is not in the script`])),
    ...[...b.voice.pauses.map((p) => p.scene), ...b.music.anchors.map((m) => m.scene)].flatMap((n) => (n >= 1 && n <= s.length ? [] : [`scene ${num(n)} does not exist`])),
  ] : []);
  const claims = (kit.claims || []).map((c) => c.text.toLowerCase());
  const covered = (label: string) => claims.some((c) => c.includes(label.toLowerCase()));
  add(11, "Every claim is approved", [
    ...CLAIM_PATTERNS.flatMap(([w, re]) => (re.test(shown) && !covered(w) ? [`"${w}" is used but no approved claim covers it`] : [])),
    ...SCRIPT_CLAIMS.flatMap(([w, re]) => (re.test(script) && !covered(w) ? [`"${w}" is used but no approved claim covers it`] : [])),
    ...[...new Set([...script.matchAll(EXTENSIONS)].map((m) => m[1].toLowerCase()))].flatMap((w) => (covered(w) ? [] : [`"${w}" extends a claim beyond the approved wording`])),
  ]);
  const last = s.at(-1);
  const terms = (plan.content as any).terms as string | undefined;
  add(12, "Closes on the offer card with the disclaimer held", [
    ...(last?.kind === "offer-card" ? [] : ["last scene is not the offer card"]),
    ...(last && last.seconds >= 2 ? [] : ["offer card shorter than 2s"]),
    ...(terms && last?.graphic && !last.graphic.lines.some((l) => l.includes(terms)) ? ["disclaimer missing from the offer card"] : []),
  ]);
  // §2.7/§3.3: identity lives in the bible (wardrobe is what the image model needs); scenes say "Same woman", never the name or the age.
  const avatar = b?.avatar.name && b.avatar.name !== "No on-screen avatar" ? b.avatar.name : "";
  add(13, "Avatar consistent", avatar ? [
    ...(b!.avatar.wardrobe.trim() ? [] : ["Avatar Bible has no wardrobe"]),
    // An invented avatar stays nameless in the table; a real person on file (the agency names Al in every UGC cell) may be named.
    ...((kit.avatars || []).some((p) => p.name.toLowerCase() === avatar.toLowerCase()) ? [] : s.flatMap((x, i) => (word(avatar).test(x.shots[0]?.visual || "") ? [`scene ${num(i + 1)}: names "${avatar}" (write "Same woman"/"Same man")`] : []))),
    ...s.flatMap((x, i) => (x.kind === "footage" && /\b\d\d[-–]\d\d\b|year-old|\baged\b|in (his|her) \d\ds/i.test(x.shots[0]?.visual || "") ? [`scene ${num(i + 1)}: re-describes the avatar's age (bible only)`] : [])),
  ] : []);
  // Every agency concept speaks the offer in its closing beats ("Save up to three thousand dollars").
  const closing = s.slice(-2).map((x) => x.line).join(" ");
  const top = Math.max(0, ...offerAmounts);
  add(14, "Offer is spoken", offerAmounts.size && !spokenAmounts(closing).some((a) => offerAmounts.has(a.value)) ? [`the last two scenes never speak an offer amount (say "${amountWords(top)}")`] : []);
  // Required shots (Product Bible): each one's keywords appear together in one scene's image prompt, card or note.
  const sceneText = s.map((x, i) => `${visuals[i]} ${(x.graphic?.lines || []).join(" ")} ${x.editorNote} ${x.kind === "offer-card" ? "offer end card" : x.kind === "graphic" ? "graphic card" : ""}`.toLowerCase());
  add(15, "Required shots present", (format.requiredShots || []).flatMap((shot) => {
    const keys = shot.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
    return sceneText.some((t) => keys.every((k) => new RegExp(`\\b${k}`).test(t))) ? [] : [`no scene shows "${shot}"`];
  }));
  const ends = plan.content.ends?.match(/^\d{4}-(\d{2})-(\d{2})/);
  add(16, "Dates match the offer end", ends ? datesIn([script, ...visuals, ...cards].join("\n")).flatMap((d) => (d.month === Number(ends[1]) && d.day === Number(ends[2]) ? [] : [`"${d.phrase}" is not the offer end date (${Number(ends[1])}/${Number(ends[2])})`])) : []);
  return out;
}

export const runtimeOf = (s: Scene[]) => s.reduce((n, x) => n + x.seconds, 0);
export const spokenOf = (s: Scene[], pace: number) => { const w = wordCount(s.map((x) => x.line).join(" ")); return { words: w, seconds: Math.round(w / pace) }; };
