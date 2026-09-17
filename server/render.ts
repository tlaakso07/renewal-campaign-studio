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
import { CreativeDoc, dimensions, Layer } from "./types.ts";
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
async function fontFor(a: Actor, doc: CreativeDoc) {
  const b = brandVersion(a, doc);
  let path = process.env.RENDER_FALLBACK_FONT || "/System/Library/Fonts/Supplemental/Arial.ttf";
  if (b.fontAssetId && b.renderFontApproved)
    path = safePath(a.company, getAsset(a, b.fontAssetId).path);
  if (b.fontAssetId && b.renderFontApproved) await ensureLocalFile(path);
  if (!existsSync(path))
    path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  check(
    existsSync(path),
    "No rendering font available. Install DejaVu Sans or map a permitted company font.",
    422,
  );
  const buffer = readFileSync(path);
  return opentype.parse(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer,
  );
}
export function textSvg(font: opentype.Font, l: Layer) {
  const size = l.fontSize;
  const lineHeight = size * 1.2;
  let lines: string[] = [];
  for (const paragraph of l.text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (font.getAdvanceWidth(next, size) > l.w && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
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
  return lines
    .map(
      (line, i) =>
        `<path fill="${l.color}" d="${font.getPath(line, l.x, l.y + size + i * lineHeight, size).toPathData(2)}"/>`,
    )
    .join("");
}
export async function renderStatic(
  a: Actor,
  doc: CreativeDoc,
  options: { transparent?: boolean; layers?: Layer[] } = {},
) {
  const [width, height] = dimensions[doc.format],
    font = await fontFor(a, doc);
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
  for (const l of options.layers || doc.layers) {
    if (l.type === "text" || l.type === "shape") {
      const content =
        l.type === "shape"
          ? `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" fill="${l.fill}"/>`
          : textSvg(font, l);
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
        image = await sharp(source)
          .resize(w, h, { fit: "contain", background: "#FFFFFF" })
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
  const buffer = await canvas.composite(composites).png().toBuffer();
  return { buffer, warnings };
}
const captionLayer = (text: string, h: number): Layer => ({
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
        if (scene.caption) {
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
      if (scene.caption)
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
  const endDoc = {
    ...doc,
    layers: doc.layers.filter((l) => l.type !== "photo"),
  };
  writeFileSync(end, (await renderStatic(a, endDoc)).buffer);
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
    const args = ["-y", "-v", "error", "-i", assembled];
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
