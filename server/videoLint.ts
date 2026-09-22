// The Editor Checklist, owned by code (product/VIDEO-BRIEF-STANDARD.md §6, checks 1–13: before the vision board).
// Pure: no database, no network. Every failure names the scene so the writer can repair it and the client can see it.
import { readFileSync } from "node:fs";
import type { VideoPlan } from "./videoPlan.ts";

export type Format = {
  label: string; formatLine: string; runtime: number; scenes: [number, number]; pace: number; maxScene: number;
  grade: string; pacing: string; tone: string; arc: string[]; negatives: string[];
  voice: { stability: number; similarity: number; style: number; speakerBoost: boolean; pace: number };
  music: { bpm: [number, number] }; moves: string[];
};
export const FORMATS: Record<string, Format> = JSON.parse(readFileSync(new URL("../library/video-formats.json", import.meta.url), "utf8"));

export type Check = { id: number; name: string; ok: boolean; detail: string };
type Scene = VideoPlan["segments"][number];
type Kit = { region?: string; bannedRegion?: string; misspellings?: string[]; claims?: { text: string }[]; avatars?: { name: string }[] };

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
export const fits = (words: number, seconds: number, pace: number) => words <= Math.ceil(seconds * pace * 1.1);
const num = (n: number) => String(n).padStart(2, "0");
const NUMBER_WORDS: Record<number, string[]> = { 1: ["a", "one"], 2: ["two"], 3: ["three"], 4: ["four"], 5: ["five"], 6: ["six"], 7: ["seven"], 8: ["eight"], 9: ["nine"], 10: ["ten"] };
// ponytail: keyword heuristics for "outdoors" and "claim"; a vision pass could replace them if they misfire.
const OUTDOOR = /driveway|exterior|yard|street|porch|outside|lawn|curb|trees|neighbou?rhood/i;
const CLAIM_WORDS = ["warranty", "guarantee", "lifetime", "million", "award", "#1", "rated", "certified", "stronger", "won't rot", "wont rot", "rot, crack"];

export function lintBrief(plan: Pick<VideoPlan, "segments" | "brief" | "content">, format: Format, brand: { name: string; videoKit?: Kit }): Check[] {
  const s = plan.segments, b = plan.brief, kit = brand.videoKit || {};
  const out: Check[] = [];
  const add = (id: number, name: string, problems: string[]) => out.push({ id, name, ok: !problems.length, detail: problems.join("; ") });
  const script = s.map((x) => x.line).join(" ");
  // Authored text only: the negatives, product bible and editor notes legitimately name the misspelling and the banned region.
  const allText = [script, ...s.map((x) => x.shots.map((y) => y.visual).join(" ")), ...s.flatMap((x) => x.graphic?.lines || []), ...(b ? [b.dna, ...b.avatar.bullets, b.voice.prompt, b.voice.archetype, b.voice.style, b.music.style] : [])].join("\n");
  const has = (word: string) => new RegExp(`(^|\\W)${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\W|$)`, "i").test(allText);

  const total = s.reduce((n, x) => n + x.seconds, 0);
  add(1, "Durations add up to the runtime", total === format.runtime ? [] : [`scenes total ${total}s, runtime is ${format.runtime}s`]);
  add(2, "Every second is covered", s.flatMap((x, i) => [
    ...(Number.isInteger(x.seconds) && x.seconds >= 1 ? [] : [`scene ${num(i + 1)}: ${x.seconds}s is not whole seconds`]),
    ...(x.shots[0]?.visual.trim() || x.graphic?.lines.length ? [] : [`scene ${num(i + 1)}: nothing on screen`]),
  ]));
  add(3, "Every line fits its scene", s.flatMap((x, i) => (fits(wordCount(x.line), x.seconds, format.pace) ? [] : [`scene ${num(i + 1)}: ${wordCount(x.line)} words in ${x.seconds}s (max ${Math.ceil(x.seconds * format.pace * 1.1)} at ${format.pace}/s)`])));
  add(4, "Pacing rule holds", s.flatMap((x, i) => (i < s.length - 1 && x.seconds > format.maxScene ? [`scene ${num(i + 1)}: ${x.seconds}s, format allows ${format.maxScene}s`] : [])));
  add(5, "Neighbouring scenes differ in move or size", s.flatMap((x, i) => {
    const p = s[i - 1];
    return p?.camera && x.camera && p.camera.move === x.camera.move && p.camera.size === x.camera.size ? [`scenes ${num(i)} and ${num(i + 1)}: both ${x.camera.move}, ${x.camera.size}`] : [];
  }));
  add(6, "Brand name spelled correctly", (kit.misspellings || []).flatMap((m) => (new RegExp(`\\b${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(allText) ? [`"${m}" appears`] : [])));
  const offerAmounts = plan.content.tiers.flatMap((t) => `${t.lead} ${t.value}`.match(/\$[\d,]+/g) || []);
  add(7, "Offer figures match the campaign", s.flatMap((x, i) => (x.graphic?.lines || []).flatMap((l) => (l.match(/\$[\d,]+/g) || []).flatMap((d) => (offerAmounts.includes(d) ? [] : [`scene ${num(i + 1)}: ${d} is not in the offer (${offerAmounts.join(", ") || "none"})`])))));
  const allowed = new Set(offerAmounts.flatMap((d) => { const n = Number(d.replace(/[$,]/g, "")); return n % 1000 === 0 && n / 1000 <= 10 ? NUMBER_WORDS[n / 1000] : []; }));
  add(8, "Spoken numbers match the offer", [...script.matchAll(/\b(\w+)[- ]thousand\b/gi)].flatMap((m) => (allowed.has(m[1].toLowerCase()) ? [] : [`"${m[0]}" is not an offer figure`])));
  add(9, "Region named outdoors, banned region absent", [
    ...s.flatMap((x, i) => (x.kind === "footage" && OUTDOOR.test(x.shots[0]?.visual || "") && kit.region && !x.shots[0].visual.includes(kit.region) ? [`scene ${num(i + 1)}: outdoors without "${kit.region}"`] : [])),
    ...(kit.bannedRegion && new RegExp(`\\b${kit.bannedRegion}\\b`, "i").test(allText) ? [`"${kit.bannedRegion}" appears`] : []),
  ]);
  add(10, "Voice and music anchors exist", b ? [
    ...b.voice.emphasize.flatMap((w) => (script.toLowerCase().includes(w.toLowerCase()) ? [] : [`emphasis "${w}" is not in the script`])),
    ...[...b.voice.pauses.map((p) => p.scene), ...b.music.anchors.map((m) => m.scene)].flatMap((n) => (n >= 1 && n <= s.length ? [] : [`scene ${num(n)} does not exist`])),
  ] : []);
  const claims = (kit.claims || []).map((c) => c.text.toLowerCase());
  add(11, "Every claim is approved", CLAIM_WORDS.flatMap((w) => (has(w) && !claims.some((c) => c.includes(w)) ? [`"${w}" is used but no approved claim covers it`] : [])));
  const last = s.at(-1);
  const terms = (plan.content as any).terms as string | undefined;
  add(12, "Closes on the offer card with the disclaimer held", [
    ...(last?.kind === "offer-card" ? [] : ["last scene is not the offer card"]),
    ...(last && last.seconds >= 2 ? [] : ["offer card shorter than 2s"]),
    ...(terms && last?.graphic && !last.graphic.lines.some((l) => l.includes(terms)) ? ["disclaimer missing from the offer card"] : []),
  ]);
  const avatar = b?.avatar.name && b.avatar.name !== "No on-screen avatar" ? b.avatar.name : "";
  add(13, "Avatar described once", avatar ? [
    ...(s.some((x) => x.shots[0]?.visual.includes(avatar)) ? [] : [`"${avatar}" is never named in a scene`]),
    ...s.flatMap((x, i) => (x.kind === "footage" && /\b\d\d[-–]\d\d\b|year-old|\baged\b|in (his|her) \d\ds/i.test(x.shots[0]?.visual || "") ? [`scene ${num(i + 1)}: re-describes the avatar's age (bible only)`] : [])),
  ] : []);
  return out;
}

export const runtimeOf = (s: Scene[]) => s.reduce((n, x) => n + x.seconds, 0);
export const spokenOf = (s: Scene[], pace: number) => { const w = wordCount(s.map((x) => x.line).join(" ")); return { words: w, seconds: Math.round(w / pace) }; };
