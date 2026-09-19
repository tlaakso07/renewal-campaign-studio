// Static ad layouts replicated from shipped Renewal by Andersen KY Meta ads (July 2026 set).
// Each layout is drawn in 1080×1350 portrait space, then mapped to square/vertical by
// stretching or compressing one elastic zone (usually the photo) — text keeps its size.
import { dimensions, layerSchema, type CreativeDoc, type Layer } from "./types.ts";
import type { FontSet } from "./render.ts";

export const adLayouts = ["band", "diagonal", "arch"] as const;
export type AdLayout = (typeof adLayouts)[number];
export const adLayoutNames: Record<AdLayout, string> = {
  band: "Photo + black offer band",
  diagonal: "Green diagonal + installer",
  arch: "Logo header + photo + offer band",
};
export type AdCopy = {
  headline: string;
  cta: string;
  tiers: { lead: string; value: string }[];
  ends: string;
};
export type AdMedia = {
  photo: string | null;
  cutout: string | null;
  logo: string | null;
  logoReverse: string | null;
  focusY?: number | null;
};

const GREEN = "#6CC14C",
  BLACK = "#000000",
  WHITE = "#FFFFFF",
  ARROW_RED = "#E3262B"; // matches the shipped July ad's pointer arrow
const W = 1080,
  H = 1350;

type Weight = Layer["weight"];
type Style = {
  size: number;
  weight: Weight;
  italic?: boolean;
  color: string;
  align?: Layer["align"];
  lineHeight?: number;
  min?: number;
};

function layer(id: string, type: Layer["type"], x: number, y: number, w: number, h: number, extra: object = {}) {
  return layerSchema.parse({ id, role: id, type, x, y, w, h, ...extra });
}
function text(id: string, value: string, x: number, y: number, w: number, h: number, s: Style) {
  return layer(id, "text", x, y, w, h, {
    text: value,
    fontSize: s.size,
    weight: s.weight,
    italic: !!s.italic,
    color: s.color,
    align: s.align || "left",
    lineHeight: s.lineHeight || 1.15,
    minFontSize: s.min ?? Math.max(12, Math.round(s.size * 0.6)),
  });
}
const measure = (f: FontSet, weight: Weight, italic: boolean, value: string, size: number) =>
  f(weight, italic).getAdvanceWidth(value, size) * (italic ? 1.03 : 1); // italic overhang
// Largest size ≤ max at which every line fits the width, never below the layout's floor.
// Copy that still doesn't fit at the floor is reported by adProblems() instead of shrinking into mush.
function fit(f: FontSet, weight: Weight, italic: boolean, lines: string[], max: number, width: number, floor: number) {
  let size = max;
  while (size - 2 >= floor && lines.some((l) => measure(f, weight, italic, l, size) > width)) size -= 2;
  return size;
}
// Real ads break "SUMMER / WINDOW SALE!": short headlines break before the last two words.
function twoLines(value: string) {
  if (value.includes("\n")) return value;
  const words = value.split(/\s+/);
  if (words.length < 3) return value;
  if (words.length <= 4) return words.slice(0, -2).join(" ") + "\n" + words.slice(-2).join(" ");
  let best = 1;
  for (let i = 1; i < words.length; i++)
    if (
      Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length) <
      Math.max(words.slice(0, best).join(" ").length, words.slice(best).join(" ").length)
    )
      best = i;
  return words.slice(0, best).join(" ") + "\n" + words.slice(best).join(" ");
}
const shortLead = (lead: string) => (lead.match(/^\S+\s+\S+/)?.[0] || lead) + ":"; // "Buy 6 Windows" → "Buy 6:"
const asterisk = (x: number, y: number, size: number) =>
  text("asterisk", "*", x, y, 30, size, { size, weight: "demi", color: WHITE, min: size });

// T1 — photo top, green seam, black band: headline, arrow, logo left, "Buy 6: Get 1 FREE" lines right.
function band(c: AdCopy, m: AdMedia, f: FontSet): Layer[] {
  const out: Layer[] = [
    layer("photo", "photo", 0, 0, W, 872, { assetId: m.photo, cropY: m.focusY ?? 0.55 }),
    layer("seam", "shape", 0, 872, W, 24, { fill: GREEN }),
    layer("band", "shape", 0, 896, W, 454, { fill: BLACK }),
  ];
  const endsSize = 26,
    endsW = measure(f, "demi", true, c.ends, endsSize) + 44;
  if (c.ends)
    out.push(
      layer("ends-badge", "shape", W - 28 - endsW, 790, endsW, 62, { fill: GREEN }),
      text("ends", c.ends, W - 28 - endsW, 790 + 12, endsW, 38, { size: endsSize, weight: "demi", italic: true, color: WHITE, align: "center", min: 18 }),
    );
  const headline = twoLines(c.headline.toUpperCase());
  const hSize = fit(f, "heavy", true, headline.split("\n"), 96, 900, 60);
  out.push(text("headline", headline, 90, 922, 900, Math.round(hSize * 2.1), { size: hSize, weight: "heavy", italic: true, color: WHITE, align: "center", lineHeight: 1.02 }));
  // Pointer arrow beside the second headline line, when there is room.
  const line2 = headline.split("\n").at(-1)!;
  const arrowX = Math.round(540 + measure(f, "heavy", true, line2, hSize) / 2 + 24);
  if (c.headline.trim() && arrowX + 100 <= W - 20)
    out.push(
      layer("arrow", "shape", arrowX, 1020, 100, 120, { fill: ARROW_RED, opacity: 0, stroke: ARROW_RED, strokeWidth: 11, path: "M6 10 C 50 0, 80 30, 72 84" }),
      layer("arrow-head", "shape", arrowX, 1020, 100, 120, { fill: ARROW_RED, path: "M46 76 L 98 72 L 68 118 Z" }),
    );
  out.push(layer("logo", "logo", 56, 1166, 330, 150, { assetId: m.logoReverse || m.logo }));
  const rows = c.tiers.slice(0, 2).map((t) => ({ lead: shortLead(t.lead), value: t.value }));
  const gap = 18,
    left = 512,
    width = W - 36 - left;
  let size = 58;
  while (size > 36 && rows.some((r) => measure(f, "heavy", true, r.lead, size) + gap + measure(f, "heavy", true, r.value, size) + 20 > width)) size -= 2;
  rows.forEach((r, i) => {
    const y = 1166 + i * Math.round(size * 1.5),
      leadW = measure(f, "heavy", true, r.lead, size),
      valueX = Math.round(left + leadW + gap),
      valueW = Math.ceil(measure(f, "heavy", true, r.value, size));
    const s: Style = { size, weight: "heavy", italic: true, color: WHITE, min: size };
    out.push(
      text(`tier-${i + 1}-lead`, r.lead, left, y, Math.ceil(leadW) + 4, Math.round(size * 1.25), s),
      text(`tier-${i + 1}-value`, r.value, valueX, y, valueW + 4, Math.round(size * 1.25), s),
      layer(`tier-${i + 1}-underline`, "shape", valueX, y + Math.round(size * 1.22), valueW, 5, { fill: GREEN }),
    );
    if (i === rows.length - 1) out.push(asterisk(valueX + valueW + 6, y + 2, 26));
  });
  return out;
}

// T2 — black canvas, slanted green header, stacked "Buy 6 Windows / GET 1 FREE", OR disc, installer cutout, pill, logo.
function diagonal(c: AdCopy, m: AdMedia, f: FontSet): Layer[] {
  const out: Layer[] = [
    layer("background", "shape", 0, 0, W, H, { fill: BLACK }),
    layer("header", "shape", 0, 0, W, 240, { fill: GREEN }),
    layer("header-slant", "shape", 0, 0, W, 312, { fill: GREEN, path: "M0 0 H1080 V238 L0 312 Z" }),
    // Installer as in the shipped ad: large, cropped at the hips by the bottom edge, behind all type.
    layer("cutout", "photo", 20, 800, 500, 550, { assetId: m.cutout, fit: "contain", zoom: 1.75, cropX: 0.5, cropY: 0 }),
  ];
  // One line when it fits at full size (like the shipped ad's short headers), otherwise two balanced lines.
  const oneLine = !c.headline.includes("\n") && measure(f, "demi", false, c.headline, 66) <= 960;
  const headline = oneLine ? c.headline : twoLines(c.headline);
  const hSize = fit(f, "demi", false, headline.split("\n"), 66, 960, 44);
  const hTop = oneLine ? 100 : 58;
  out.push(text("headline", headline, 60, hTop, 960, Math.round(hSize * 2.4), { size: hSize, weight: "demi", color: WHITE, align: "center", lineHeight: 1.18 }));
  const tiers = c.tiers.slice(0, 2);
  const values = tiers.map((t) => t.value.toUpperCase());
  const vSize = fit(f, "heavy", true, values, 106, 880, 64);
  let y = tiers.length === 1 ? 430 : 352;
  let lastRight = 540;
  tiers.forEach((t, i) => {
    out.push(text(`tier-${i + 1}-lead`, t.lead, 140, y, 800, 52, { size: 40, weight: "demi", italic: true, color: WHITE, align: "center", min: 26 }));
    out.push(text(`tier-${i + 1}-value`, values[i], 90, y + 50, 900, Math.round(vSize * 1.2), { size: vSize, weight: "heavy", italic: true, color: WHITE, align: "center", min: vSize }));
    lastRight = Math.round(540 + measure(f, "heavy", true, values[i], vSize) / 2);
    y += 50 + Math.round(vSize * 1.2);
    if (i === 0 && tiers.length > 1) {
      out.push(
        layer("or-disc", "shape", 505, y + 8, 70, 70, { fill: GREEN, radius: 35 }),
        text("or", "OR", 505, y + 25, 70, 38, { size: 28, weight: "heavy", italic: true, color: WHITE, align: "center", min: 20 }),
      );
      y += 96;
    }
  });
  if (tiers.length) out.push(asterisk(lastRight + 4, y - Math.round(vSize * 1.1), 30));
  out.push(text("ends", c.ends, lastRight - 360, y + 6, 360, 40, { size: 30, weight: "book", italic: true, color: WHITE, align: "right", min: 20 }));
  const ctaSize = fit(f, "demi", false, [c.cta], 34, 560, 24);
  out.push(
    layer("cta-pill", "shape", 424, 1018, 620, 66, { fill: GREEN, radius: 33 }),
    text("cta", c.cta, 434, 1018 + Math.round((66 - ctaSize * 1.15) / 2), 600, Math.round(ctaSize * 1.2), { size: ctaSize, weight: "demi", color: WHITE, align: "center", min: 20 }),
    layer("logo", "logo", 580, 1140, 400, 170, { assetId: m.logoReverse || m.logo }),
  );
  return out;
}

// T3 — white header with full-color logo, curved green seam with CTA pill, photo, black band with two tier columns.
function arch(c: AdCopy, m: AdMedia, f: FontSet): Layer[] {
  const out: Layer[] = [
    layer("header", "shape", 0, 0, W, 380, { fill: WHITE }),
    layer("logo", "logo", 280, 66, 520, 250, { assetId: m.logo }),
    layer("photo", "photo", 0, 360, W, 567, { assetId: m.photo, cropY: m.focusY ?? 0.5 }),
    layer("curve-mask", "shape", 0, 360, W, 72, { fill: WHITE, path: "M0 0 H1080 V14 Q540 74 0 14 Z" }),
    layer("curve", "shape", 0, 360, W, 72, { fill: GREEN, opacity: 0, stroke: GREEN, strokeWidth: 12, path: "M-10 14 Q540 74 1090 14" }),
  ];
  const ctaSize = fit(f, "demi", false, [c.cta], 40, 640, 26);
  out.push(
    layer("cta-pill", "shape", 184, 376, 712, 76, { fill: GREEN, radius: 38 }),
    text("cta", c.cta, 204, 376 + Math.round((76 - ctaSize * 1.15) / 2), 672, Math.round(ctaSize * 1.2), { size: ctaSize, weight: "demi", color: WHITE, align: "center", min: 22 }),
    layer("band", "shape", 0, 927, W, 423, { fill: BLACK }),
  );
  const single = c.headline.replace(/\s*\n\s*/g, " ");
  const hSize = fit(f, "demi", false, [single], 58, 960, 40);
  out.push(text("headline", single, 60, 984, 960, Math.round(hSize * 1.25), { size: hSize, weight: "demi", color: GREEN, align: "center" }));
  const tiers = c.tiers.slice(0, 2);
  const cols = tiers.length === 1 ? [{ x: 90, w: 900 }] : [{ x: 60, w: 488 }, { x: 594, w: 452 }];
  const values = tiers.map((t) => t.value.toUpperCase());
  const vSize = fit(f, "heavy", true, values, 82, Math.min(...cols.map((col) => col.w)) - 30, 50);
  tiers.forEach((t, i) => {
    const col = cols[i];
    out.push(
      text(`tier-${i + 1}-lead`, t.lead, col.x, 1128, col.w, 46, { size: 34, weight: "demi", italic: true, color: WHITE, align: "center", min: 24 }),
      text(`tier-${i + 1}-value`, values[i], col.x, 1174, col.w, Math.round(vSize * 1.2), { size: vSize, weight: "heavy", italic: true, color: WHITE, align: "center", min: vSize }),
    );
  });
  const last = cols[tiers.length - 1];
  if (last) out.push(asterisk(Math.round(last.x + last.w / 2 + measure(f, "heavy", true, values.at(-1)!, vSize) / 2 + 4), 1176, 28));
  if (tiers.length > 1) out.push(layer("divider", "shape", 568, 1146, 6, 116, { fill: GREEN }));
  out.push(text("ends", c.ends, 640, 1294, 390, 40, { size: 30, weight: "book", italic: true, color: WHITE, align: "right", min: 20 }));
  return out;
}

// Elastic zone per layout (portrait y-range that absorbs the height difference between formats).
const elastic: Record<AdLayout, [number, number]> = {
  band: [0, 872],
  diagonal: [240, 1350],
  arch: [0, 927],
};
// Layouts without a photo to absorb compression shrink the type in this y-range instead (around the centre line).
const shrinkType: Partial<Record<AdLayout, [number, number]>> = { diagonal: [240, 1000] };
const VERTICAL_TOP = 200,
  VERTICAL_BOTTOM = 350; // Meta Stories/Reels UI safe zones

function toFormat(layers: Layer[], layout: AdLayout, format: CreativeDoc["format"]) {
  const height = dimensions[format][1];
  if (height === H) return layers;
  const top = format === "vertical" ? VERTICAL_TOP : 0;
  const d = height - H - top - (format === "vertical" ? VERTICAL_BOTTOM : 0);
  const [e0, e1] = elastic[layout];
  const map = (y: number) => top + (y <= e0 ? y : y >= e1 ? y + d : e0 + ((y - e0) * (e1 - e0 + d)) / (e1 - e0));
  const k = (e1 - e0 + d) / (e1 - e0),
    shrink = shrinkType[layout];
  return layers.map((l) => {
    if (k < 1 && shrink && l.type === "text" && l.y >= shrink[0] && l.y < shrink[1]) {
      const h = Math.round(l.h * k),
        fontSize = Math.max(12, Math.round(l.fontSize * k));
      return {
        ...l,
        x: Math.round(W / 2 + (l.x - W / 2) * k),
        w: Math.round(l.w * k),
        h,
        y: Math.round(map(l.y + l.h / 2) - h / 2),
        fontSize,
        minFontSize: Math.min(l.minFontSize ?? fontSize, fontSize),
      };
    }
    // Type, marks, pills and drawn shapes keep their size and move with their centre; backgrounds/photos stretch.
    const rigid = l.type === "text" || l.type === "logo" || !!l.path || (l.type === "shape" && l.w < W);
    if (rigid) return { ...l, y: Math.round(map(l.y + l.h / 2) - l.h / 2) };
    const y0 = l.y <= 0 ? 0 : map(l.y),
      y1 = l.y + l.h >= H ? height : map(l.y + l.h);
    return { ...l, y: Math.round(y0), h: Math.round(y1 - y0) };
  });
}

export function adLayers(layout: AdLayout, format: CreativeDoc["format"], copy: AdCopy, media: AdMedia, fonts: FontSet): Layer[] {
  const build = { band, diagonal, arch }[layout];
  return toFormat(build(copy, media, fonts), layout, format);
}

export const seasonOf = (date?: string) => season(date ? Number(date.slice(5, 7)) : new Date().getMonth() + 1);
const season = (month: number) => (month >= 9 && month <= 11 ? "Fall" : month === 12 || month <= 2 ? "Winter" : month <= 5 ? "Spring" : "Summer");
// Default headline pool mirrors the shipped ads; campaigns can override with their own list.
export function defaultHeadlines(campaign: { start?: string; end?: string }) {
  const date = campaign.start || campaign.end;
  const s = season(date ? Number(date.slice(5, 7)) : new Date().getMonth() + 1);
  return [`${s} Window Sale!`, `Save This ${s} On Windows!`, "Save On Custom\nWindow & Door Replacement:", `${s} Savings On Windows!`];
}
export function offerEnds(end?: string) {
  const m = end?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `Offer ends: ${Number(m[2])}/${Number(m[3])}/${m[1].slice(2)}` : "";
}

const friendly: Record<string, string> = {
  headline: "Headline",
  cta: "Button label",
  ends: "Offer end date",
  "tier-1-lead": "First offer line",
  "tier-1-value": "First offer amount",
  "tier-2-lead": "Second offer line",
  "tier-2-value": "Second offer amount",
};
// Plain-language problems that stop an ad from matching the standard. Empty = good to go.
export function adProblems(
  layout: AdLayout,
  c: { headline: string; cta: string; tiers: unknown[]; ends: string; photoAssetId: string | null; cutoutAssetId: string | null },
  layers: Layer[],
  fits: (l: Layer) => boolean,
): string[] {
  const out: string[] = [];
  if (!c.headline.trim()) out.push("Add a headline.");
  if (!c.tiers.length) out.push("Add at least one offer, e.g. “Buy 5 Windows” · “Save $1,000”.");
  if (!c.ends) out.push("Add the offer end date.");
  if (layout !== "band" && !c.cta.trim()) out.push("Add a button label.");
  if (layout === "diagonal" ? !c.cutoutAssetId : !c.photoAssetId)
    out.push(layout === "diagonal" ? "Choose an installer photo." : "Choose a photo.");
  for (const l of layers)
    if (l.type === "text" && l.text.trim() && !fits(l))
      out.push(`${friendly[l.id] || "Text"} is too long for this layout — shorten it.`);
  return out;
}
