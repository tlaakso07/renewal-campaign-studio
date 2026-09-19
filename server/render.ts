import { ensureLocalFile } from "./storage.ts";
import sharp, { type OverlayOptions } from "sharp";
import opentype from "opentype.js";
import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  Actor,
  db,
  getRecord,
  getAsset,
  check,
  json,
  hash,
  now,
  AppError,
} from "./db.ts";
import { safePath, probe } from "./assets.ts";
import { CreativeDoc, dimensions, Layer, layerSchema } from "./types.ts";
const exec = promisify(execFile);
const esc = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function brandVersion(a: Actor, doc: CreativeDoc) {
  getRecord(a, doc.brandId, "brand");
  return json(
    (
      db
        .prepare("SELECT body FROM versions WHERE record=? AND rev=?")
        .get(doc.brandId, doc.brandVersion) as any
    ).body,
  );
}
const SYSTEM_FONTS = "/System/Library/Fonts/Supplemental/";
const FONT_KEYS = {
  book: "Arial.ttf",
  bookItalic: "Arial Italic.ttf",
  medium: "Arial.ttf",
  mediumItalic: "Arial Italic.ttf",
  demi: "Arial Bold.ttf",
  demiItalic: "Arial Bold Italic.ttf",
  heavy: "Arial Black.ttf",
  heavyItalic: "Arial Bold Italic.ttf",
  demiCondensed: "Arial Narrow Bold.ttf",
} as const;
type FontKey = keyof typeof FONT_KEYS;
export type FontSet = (weight: Layer["weight"], italic: boolean) => opentype.Font;
const parsedFonts = new Map<string, opentype.Font>();
function parseFont(path: string) {
  if (!parsedFonts.has(path)) {
    const buffer = readFileSync(path);
    parsedFonts.set(
      path,
      opentype.parse(
        buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
      ),
    );
  }
  return parsedFonts.get(path)!;
}
const brandFontAsset = (b: any, key: FontKey) =>
  b.renderFontApproved
    ? b.fonts?.[key] || (key === "book" && !b.fonts ? b.fontAssetId : null)
    : null;
// Hosted storage: pull approved brand font files to local disk before sync measuring/rendering.
export async function ensureBrandFonts(a: Actor, b: any) {
  for (const key of Object.keys(FONT_KEYS) as FontKey[]) {
    const assetId = brandFontAsset(b, key);
    if (assetId) await ensureLocalFile(safePath(a.company, getAsset(a, assetId).path));
  }
}
// Approved brand fonts per weight/italic; otherwise the configured or system fallback for that weight.
export function brandFonts(a: Actor, b: any): FontSet {
  const fonts = {} as Record<FontKey, opentype.Font>;
  for (const key of Object.keys(FONT_KEYS) as FontKey[]) {
    const assetId = brandFontAsset(b, key);
    const path = [
      assetId ? safePath(a.company, getAsset(a, assetId).path) : undefined,
      process.env.RENDER_FALLBACK_FONT,
      SYSTEM_FONTS + FONT_KEYS[key],
      SYSTEM_FONTS + "Arial.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ].find((c) => c && existsSync(c));
    check(
      path,
      "No rendering font available. Install DejaVu Sans or map a permitted company font.",
      422,
    );
    fonts[key] = parseFont(path!);
  }
  return (weight, italic) => fonts[(italic ? weight + "Italic" : weight) as FontKey];
}
// Type specimen of the brand's real font files, sent to the image model as its typography reference.
export async function fontSpecimen(a: Actor, b: any) {
  await ensureBrandFonts(a, b);
  const rows: [FontKey, string, string, number][] = [
    ["heavy", "HEAVY — titles, headlines, offer amounts", "FALL WINDOW SALE! Save $1,000", 84],
    ["heavyItalic", "HEAVY ITALIC — titles, headlines, offer amounts", "FALL WINDOW SALE! Save $3,000", 84],
    ["demi", "DEMI — titles and buttons", "Book your FREE Design Consultation", 64],
    ["book", "BOOK (regular) — sub-text", "Buy 5 Windows · Offer ends: 10/31/26", 56],
    ["demiCondensed", "DEMI CONDENSED — sub-text", "Buy 10 Windows · Offer ends: 10/31/26", 56],
  ];
  const label = brandFonts(a, b)("book", false);
  let y = 120,
    svg = "";
  const title = "ITC FRANKLIN GOTHIC STD — the ONLY typeface allowed on this brand's ads";
  svg += `<path d="${pathData(label.getPath(title, 60, 70, 34))}"/>`;
  for (const [key, name, sample, size] of rows) {
    const assetId = brandFontAsset(b, key);
    const font = assetId ? parseFont(safePath(a.company, getAsset(a, assetId).path)) : label;
    svg += `<path fill="#54585A" d="${pathData(label.getPath(name, 60, y, 26))}"/>`;
    svg += `<path d="${pathData(font.getPath(sample, 60, y + size + 6, size))}"/>`;
    svg += `<path d="${pathData(font.getPath("ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 $,.!*", 60, y + size + 56, 30))}"/>`;
    y += size + 120;
  }
  return sharp(Buffer.from(`<svg width="1600" height="${y}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/>${svg}</svg>`))
    .png()
    .toBuffer();
}
async function fontsFor(a: Actor, doc: CreativeDoc) {
  const b = brandVersion(a, doc);
  await ensureBrandFonts(a, b);
  return brandFonts(a, b);
}
// opentype.js 2.0's Path.toPathData() emits NaN for some CFF curves (valid commands in, "NaN" out),
// which makes the SVG parser drop the rest of the line. Serialize the commands directly.
export function pathData(path: opentype.Path) {
  const n = (v: number) => Math.round(v * 100) / 100;
  return path.commands
    .map((c: any) =>
      c.type === "Z"
        ? "Z"
        : c.type === "C"
          ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
          : c.type === "Q"
            ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
            : `${c.type}${n(c.x)} ${n(c.y)}`,
    )
    .join("");
}
function wrap(font: opentype.Font, text: string, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (font.getAdvanceWidth(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}
const fits = (font: opentype.Font, lines: string[], size: number, l: Layer) =>
  lines.length * size * l.lineHeight <= l.h + size * 0.2 &&
  lines.every((line) => font.getAdvanceWidth(line, size) <= l.w);
export function textSvg(fonts: FontSet, l: Layer) {
  const font = fonts(l.weight, l.italic);
  let size = l.fontSize;
  let lines = wrap(font, l.text, size, l.w);
  // Shrink-to-fit down to minFontSize; below that the layer is a real overflow.
  while (l.minFontSize && size - 2 >= l.minFontSize && !fits(font, lines, size, l)) {
    size -= 2;
    lines = wrap(font, l.text, size, l.w);
  }
  const lineHeight = size * l.lineHeight;
  check(
    lines.length * lineHeight <= l.h + size * 0.2,
    `${l.role}: text overflows its layer. Increase the text box or reduce the font size.`,
    422,
  );
  for (const line of lines) {
    check(
      font.getAdvanceWidth(line, size) <= l.w,
      `${l.role}: an unbroken word is too wide`,
      422,
    );
    for (const char of line)
      check(
        char === " " || font.charToGlyphIndex(char) !== 0,
        `${l.role}: font does not contain “${char}”`,
        422,
      );
  }
  const svg = lines
      .map((line, i) => {
        const slack = l.w - font.getAdvanceWidth(line, size);
        const x =
          l.align === "center"
            ? l.x + slack / 2
            : l.align === "right"
              ? l.x + slack
              : l.x;
        return `<path fill="${l.color}" d="${pathData(font.getPath(line, x, l.y + size + i * lineHeight, size))}"/>`;
      })
      .join("");
  // A non-finite coordinate makes the SVG parser silently drop the rest of the line.
  check(!svg.includes("NaN"), `${l.role}: text outline could not be drawn`, 422);
  return { size, svg };
}
export function shapeSvg(l: Layer) {
  const stroke =
    l.stroke && l.strokeWidth
      ? ` stroke="${l.stroke}" stroke-width="${l.strokeWidth}"`
      : "";
  // Strokes are drawn inside the layer bounds so they never leave the canvas.
  if (l.path)
    return `<path transform="translate(${l.x} ${l.y})" d="${l.path}" fill="${l.fill}" fill-opacity="${l.opacity}"${stroke} stroke-linecap="round" stroke-linejoin="round"/>`;
  const inset = stroke ? l.strokeWidth / 2 : 0;
  const rect = (fill: string) =>
    `<rect x="${l.x + inset}" y="${l.y + inset}" width="${l.w - inset * 2}" height="${l.h - inset * 2}" rx="${l.radius}" fill="${fill}"${stroke}/>`;
  if (l.gradient === "none")
    return rect(l.fill).replace("/>", ` fill-opacity="${l.opacity}"/>`);
  // fade-down: solid at the top edge, clear at the bottom (top scrim); fade-up is the reverse.
  const [top, bottom] =
    l.gradient === "fade-down" ? [l.opacity, 0] : [0, l.opacity];
  const gid = `g-${l.id.replace(/[^a-zA-Z0-9-]/g, "")}`;
  return `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l.fill}" stop-opacity="${top}"/><stop offset="0.55" stop-color="${l.fill}" stop-opacity="${(top + bottom) / 2 + (l.gradient === "fade-down" ? 0.25 : -0.25) * l.opacity}"/><stop offset="1" stop-color="${l.fill}" stop-opacity="${bottom}"/></linearGradient></defs>${rect(`url(#${gid})`)}`;
}
export async function renderStatic(
  a: Actor,
  doc: CreativeDoc,
  options: { transparent?: boolean; layers?: Layer[] } = {},
) {
  const [width, height] = dimensions[doc.format],
    fonts = await fontsFor(a, doc);
  let canvas = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: options.transparent ? "#00000000" : "#FFFFFF",
    },
  });
  const composites: OverlayOptions[] = [];
  const warnings: string[] = [];
  const b = brandVersion(a, doc);
  if (!b.renderFontApproved)
    warnings.push(
      "System fallback font; source font permission is not yet recorded.",
    );
  const fitted: Record<string, number> = {};
  // Stored documents predate newer layer fields; fill schema defaults before drawing.
  for (const l of (options.layers || doc.layers).map((l) => layerSchema.parse(l))) {
    if (l.type === "text" || l.type === "shape") {
      let content = l.type === "shape" ? shapeSvg(l) : "";
      if (l.type === "text") {
        if (!l.text.trim()) continue;
        const text = textSvg(fonts, l);
        content = text.svg;
        if (text.size !== l.fontSize) fitted[l.id] = text.size;
      }
      composites.push({
        input: Buffer.from(
          `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`,
        ),
        top: 0,
        left: 0,
      });
    } else if (l.assetId) {
      const asset = getAsset(a, l.assetId);
      check(
        asset.preview || asset.kind === "image",
        `${l.role}: source preview unavailable`,
        422,
      );
      const source = safePath(
        a.company,
        asset.kind === "image" ? asset.path : asset.preview,
      );
      await ensureLocalFile(source);
      const w = Math.round(l.w),
        h = Math.round(l.h);
      check(
        l.x >= 0 && l.y >= 0 && l.x + w <= width && l.y + h <= height,
        `${l.role}: media extends outside the canvas`,
        422,
      );
      let image: Buffer;
      if (l.type === "logo") {
        // Trim transparent artboard padding so the mark fills its box.
        const trimmed = await sharp(source).trim().toBuffer();
        image = await sharp(trimmed)
          .resize(w, h, { fit: "contain", background: "#00000000" })
          .png()
          .toBuffer();
      } else if (l.fit === "contain") {
        // Cutouts: trim transparent margins, fit the subject in the box, then zoom.
        // cropX/cropY anchor it (0 = left/top, 1 = right/bottom); anything past the box is cropped.
        const trimmed = await sharp(await sharp(source).rotate().toBuffer()).trim().toBuffer();
        const meta = await sharp(trimmed).metadata();
        const scale = Math.min(w / meta.width!, h / meta.height!) * l.zoom;
        const fw = Math.round(meta.width! * scale),
          fh = Math.round(meta.height! * scale);
        const left = Math.round((w - fw) * l.cropX),
          top = Math.round((h - fh) * l.cropY);
        const visible = {
          left: Math.max(0, -left),
          top: Math.max(0, -top),
          width: Math.min(fw, w - left) - Math.max(0, -left),
          height: Math.min(fh, h - top) - Math.max(0, -top),
        };
        const subject = await sharp(trimmed)
          .resize(fw, fh, { fit: "fill" })
          .extract(visible)
          .png()
          .toBuffer();
        image = await sharp({
          create: { width: w, height: h, channels: 4, background: "#00000000" },
        })
          .composite([{ input: subject, left: Math.max(0, left), top: Math.max(0, top) }])
          .png()
          .toBuffer();
      } else {
        const oriented = await sharp(source).rotate().toBuffer();
        const meta = await sharp(oriented).metadata();
        const scale = Math.max(w / meta.width!, h / meta.height!) * l.zoom;
        const sw = Math.ceil(meta.width! * scale),
          sh = Math.ceil(meta.height! * scale);
        image = await sharp(oriented)
          .resize(sw, sh, { fit: "fill" })
          .extract({
            left: Math.round((sw - w) * l.cropX),
            top: Math.round((sh - h) * l.cropY),
            width: w,
            height: h,
          })
          .png()
          .toBuffer();
        if (meta.width! < w)
          warnings.push(`${asset.name}: source resolution below output size`);
      }
      composites.push({
        input: image,
        left: Math.round(l.x),
        top: Math.round(l.y),
      });
    } else if (l.type === "photo") {
      warnings.push("No source photograph selected.");
    } else warnings.push("Official logo is not mapped.");
  }
  if (!options.layers) {
    const approved = doc.content
      ? doc.content.legalApproved
      : getRecord(a, doc.campaignId, "campaign").body.legalApproved === true;
    if (!approved) warnings.push("Legal disclaimer not approved; internal draft only.");
  }
  const buffer = await canvas.composite(composites).png().toBuffer();
  return { buffer, warnings, fitted };
}
// Voice-synced caption pills: white brand type on a rounded brand-colour pill, lower third, one at a time.
async function burnCaptionTrack(a: Actor, doc: CreativeDoc, jid: string, input: string, w: number, h: number, elapsed: number) {
  const b = brandVersion(a, doc);
  await ensureBrandFonts(a, b);
  const fonts = brandFonts(a, b);
  const size = Math.round(w * 0.052),
    padX = Math.round(size * 0.55),
    pillH = Math.round(size * 1.7),
    // Lower third, above Meta's bottom UI zone on vertical video.
    y = Math.round(h * (doc.format === "vertical" ? 0.7 : 0.74));
  const pill = doc.captionStyle === "pill";
  const track = doc.captionTrack.filter((c) => c.start < elapsed && c.end > c.start);
  const args = ["-y", "-v", "error", "-i", input];
  const chains: string[] = [];
  let last = "[0:v]";
  for (const [i, c] of track.entries()) {
    const textW = Math.min(w - 120, Math.ceil(fonts("demi", false).getAdvanceWidth(c.text, size)));
    const pw = textW + padX * 2,
      px = Math.round((w - pw) / 2);
    const layers = [
      layerSchema.parse({ id: "pill", role: "pill", type: "shape", x: px, y, w: pw, h: pillH, fill: pill ? b.color || "#6CC14C" : "#000000", radius: pill ? Math.round(pillH * 0.28) : 0, opacity: pill ? 1 : 0.8 }),
      layerSchema.parse({ id: "caption", role: "caption", type: "text", text: c.text, x: px + padX, y: y + Math.round((pillH - size * 1.2) / 2), w: textW + 4, h: Math.round(size * 1.3), fontSize: size, minFontSize: Math.round(size * 0.6), weight: "demi", color: "#FFFFFF", align: "center" }),
    ];
    const file = safePath(a.company, `${jid}-pill-${i}.png`);
    writeFileSync(file, (await renderStatic(a, doc, { transparent: true, layers })).buffer);
    args.push("-i", file);
    const out = `[v${i}]`;
    chains.push(`${last}[${i + 1}:v]overlay=0:0:enable='between(t,${c.start.toFixed(3)},${Math.min(c.end, elapsed).toFixed(3)})'${out}`);
    last = out;
  }
  if (!track.length) return input;
  const output = safePath(a.company, `${jid}-captioned.mp4`);
  args.push("-filter_complex", chains.join(";"), "-map", last, "-map", "0:a", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", output);
  await exec(process.env.FFMPEG_PATH || "ffmpeg", args, { timeout: 300000, maxBuffer: 4 * 1024 * 1024 });
  return output;
}
const captionLayer = (text: string, h: number): Layer =>
  layerSchema.parse({
  id: "caption",
  type: "text",
  role: "caption",
  text,
  assetId: null,
  x: 76,
  y: h - 340,
  w: 928,
  h: 160,
  fontSize: 42,
  color: "#FFFFFF",
  fill: "#000000",
  cropX: 0.5,
  cropY: 0.5,
  zoom: 1,
});
export async function renderVideo(
  a: Actor,
  doc: CreativeDoc,
  jid: string,
  onProgress: (p: any) => void,
  canceled: () => boolean,
) {
  check(doc.scenes.length > 0, "Add at least one scene");
  const [w, h] = dimensions[doc.format];
  const clips: string[] = [];
  const states: any[] = [];
  let elapsed = 0;
  const captions: string[] = [];
  const stamp = (seconds: number) => {
    const ms = Math.round(seconds * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  };
  for (const [index, scene] of doc.scenes.entries()) {
    if (canceled()) throw new AppError(409, "Canceled");
    try {
      check(
        scene.assetId,
        `Scene ${index + 1}: select company footage or an image`,
        422,
      );
      const asset = getAsset(a, scene.assetId);
      check(
        asset.path && ["video", "image"].includes(asset.kind),
        `Scene ${index + 1}: playable original unavailable`,
        422,
      );
      if (asset.kind === "video")
        check(
          scene.trim + scene.duration <= Number(asset.metadata.duration) + 0.05,
          `Scene ${index + 1}: trim exceeds original duration`,
          422,
        );
      const key = hash(
        JSON.stringify({
          scene,
          checksum: asset.checksum,
          format: doc.format,
          brand: doc.brandId,
          version: doc.brandVersion,
          logo: doc.layers.find((l) => l.role === "logo"),
          rendererVersion: 2,
        }),
      );
      const out = safePath(a.company, `${key}-scene.mp4`);
      const cached = existsSync(out);
      if (!existsSync(out)) {
        const overlay = safePath(a.company, `${key}-overlay.png`);
        const logo = doc.layers.find((l) => l.role === "logo");
        const layers: Layer[] = [];
        if (logo?.assetId)
          layers.push({ ...logo, x: 54, y: 54, w: 270, h: 88 });
        if (scene.caption && !doc.captionTrack?.length) {
          layers.push({
            ...captionLayer("", h),
            type: "shape",
            x: 48,
            y: h - 360,
            w: 984,
            h: 206,
            fill: "#000000",
          });
          layers.push(captionLayer(scene.caption, h));
        }
        const rendered = await renderStatic(a, doc, {
          transparent: true,
          layers,
        });
        writeFileSync(overlay, rendered.buffer);
        const source = safePath(a.company, asset.path);
        await ensureLocalFile(source);
        const args = ["-y", "-v", "error"];
        if (asset.kind === "image") args.push("-loop", "1");
        else args.push("-ss", String(scene.trim));
        args.push(
          "-i",
          source,
          "-loop",
          "1",
          "-i",
          overlay,
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=48000:cl=stereo",
        );
        const audio = asset.metadata.hasAudio && !scene.mute ? "0:a" : "2:a";
        args.push(
          "-filter_complex",
          `[0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=30[base];[base][1:v]overlay=0:0,format=yuv420p[v];[${audio}]volume=${scene.mute ? 0 : scene.volume},aresample=48000[a]`,
          "-map",
          "[v]",
          "-map",
          "[a]",
          "-t",
          String(scene.duration),
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "22",
          "-c:a",
          "aac",
          "-ac",
          "2",
          "-ar",
          "48000",
          "-movflags",
          "+faststart",
          out + ".partial.mp4",
        );
        await exec(process.env.FFMPEG_PATH || "ffmpeg", args, {
          timeout: 180000,
          maxBuffer: 2 * 1024 * 1024,
        });
        await probe(out + ".partial.mp4");
        renameSync(out + ".partial.mp4", out);
      }
      clips.push(out);
      states.push({ id: scene.id, status: "ready", cached });
      onProgress({ scenes: states });
      if (scene.caption && !doc.captionTrack?.length)
        captions.push(
          `${index + 1}\n${stamp(elapsed)} --> ${stamp(elapsed + scene.duration)}\n${scene.caption}\n`,
        );
      elapsed += scene.duration;
    } catch (e) {
      states.push({
        id: scene.id,
        status: "failed",
        error: (e as Error).message,
      });
      onProgress({ scenes: states });
      throw e;
    }
  }
  if (canceled()) throw new AppError(409, "Canceled");
  // End card is composed from the same immutable branded document.
  const end = safePath(a.company, `${jid}-end.png`);
  const logoCard = doc.endCard === "logo";
  const b = brandVersion(a, doc);
  // "logo": the brand mark alone on light grey (as in the client's reference ads); "offer": the branded canvas.
  const endDoc = logoCard
    ? {
        ...doc,
        layers: [
          layerSchema.parse({ id: "bg", role: "bg", type: "shape", x: 0, y: 0, w, h, fill: "#F0F0F0" }),
          layerSchema.parse({ id: "logo", role: "logo", type: "logo", x: Math.round(w * 0.2), y: Math.round(h * 0.3), w: Math.round(w * 0.6), h: Math.round(h * 0.4), assetId: b.logoAssetId }),
        ],
      }
    : { ...doc, layers: doc.layers.filter((l) => l.type !== "photo") };
  writeFileSync(end, (await renderStatic(a, endDoc, { layers: endDoc.layers })).buffer);
  const endClip = safePath(a.company, `${jid}-end.mp4`);
  await exec(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-loop",
      "1",
      "-i",
      end,
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=48000:cl=stereo",
      "-t",
      "3",
      "-r",
      "30",
      // Logo card eases in: slight zoom-out plus fade, like the reference ad's animated logo.
      ...(logoCard
        ? ["-vf", `zoompan=z='1.10-0.10*min(on/40,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=30,fade=t=in:st=0:d=0.4`]
        : []),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-ac",
      "2",
      endClip,
    ],
    { timeout: 120000 },
  );
  clips.push(endClip);
  const concat = safePath(a.company, `${jid}-concat.txt`);
  writeFileSync(
    concat,
    clips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"),
  );
  const assembled = safePath(a.company, `${jid}-assembled.mp4`);
  await exec(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concat,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      assembled,
    ],
    { timeout: 120000 },
  );
  let final = assembled;
  if (doc.captionTrack?.length) {
    final = await burnCaptionTrack(a, doc, jid, assembled, w, h, elapsed);
    doc.captionTrack.forEach((c, i) =>
      captions.push(`${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`),
    );
  }
  const videoWithCaptions = final;
  const music = doc.musicAssetId ? getAsset(a, doc.musicAssetId) : null,
    voice = doc.voiceAssetId ? getAsset(a, doc.voiceAssetId) : null,
    audioAssets = [music, voice].filter(Boolean) as any[];
  if (audioAssets.length) {
    for (const asset of audioAssets) {
      check(
        asset.kind === "audio" || asset.metadata.hasAudio,
        "Selected audio source contains no audio",
      );
      check(asset.path, "Selected audio source is unavailable", 404);
    }
    final = safePath(a.company, `${jid}-mixed.mp4`);
    const args = ["-y", "-v", "error", "-i", videoWithCaptions];
    for (const asset of audioAssets) {
      await ensureLocalFile(safePath(a.company, asset.path));
      args.push("-i", safePath(a.company, asset.path));
    }
    const musicIndex = music ? 1 : null,
      voiceIndex = voice ? (music ? 2 : 1) : null,
      chains: string[] = [],
      mixInputs = ["[0:a]"];
    if (musicIndex)
      chains.push(
        `[${musicIndex}:a]volume=${doc.musicVolume ?? 0.15},apad[music]`,
      );
    if (voiceIndex)
      chains.push(
        `[${voiceIndex}:a]volume=${doc.voiceVolume ?? 1},adelay=${Math.round(
          (doc.voiceStart ?? 0) * 1000,
        )}:all=1,apad[voice]`,
      );
    if (musicIndex && voiceIndex && (doc.musicDucking ?? true)) {
      chains.push("[voice]asplit=2[voicekey][voiceout]");
      chains.push(
        "[music][voicekey]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=500[ducked]",
      );
      mixInputs.push("[ducked]", "[voiceout]");
    } else {
      if (musicIndex) mixInputs.push("[music]");
      if (voiceIndex) mixInputs.push("[voice]");
    }
    chains.push(
      `${mixInputs.join("")}amix=inputs=${mixInputs.length}:duration=first:normalize=0[a]`,
    );
    args.push(
      "-filter_complex",
      chains.join(";"),
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-t",
      String(elapsed + 3),
      "-movflags",
      "+faststart",
      final,
    );
    await exec(process.env.FFMPEG_PATH || "ffmpeg", args, { timeout: 120000 });
  }
  const meta = await probe(final);
  check(
    Math.abs(Number(meta.format.duration) - (elapsed + 3)) < 0.25,
    "Output duration validation failed",
    500,
  );
  check(
    meta.streams.some((s: any) => s.codec_type === "audio"),
    "Output audio missing",
    500,
  );
  return {
    buffer: readFileSync(final),
    captions: captions.join("\n"),
    duration: Number(meta.format.duration),
    warnings: brandVersion(a, doc).renderFontApproved
      ? []
      : ["System fallback font; source font permission not recorded."],
  };
}
