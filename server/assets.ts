import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  renameSync,
} from "node:fs";
import { resolve, extname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import { db, DATA, Actor, getAsset, check, hash, id } from "./db.ts";
const exec = promisify(execFile);
export const MAX_BYTES = 512 * 1024 * 1024;
export function objectDir(company: string) {
  check(/^[a-zA-Z0-9_-]+$/.test(company), "Invalid storage scope");
  const dir = resolve(DATA, "objects", company);
  mkdirSync(dir, { recursive: true });
  return dir;
}
export function safePath(company: string, path: string) {
  const dir = objectDir(company);
  const p = resolve(dir, path);
  check(p.startsWith(dir + "/"), "Invalid object path", 403);
  return p;
}
export async function probe(path: string) {
  const { stdout } = await exec(
    process.env.FFPROBE_PATH || "ffprobe",
    [
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-show_format",
      "-show_streams",
      "-of",
      "json",
      path,
    ],
    { timeout: 15000, maxBuffer: 2 * 1024 * 1024 },
  );
  return JSON.parse(stdout);
}
export async function storeAsset(
  a: Actor,
  aid: string,
  bytes: Buffer,
  filename: string,
  sourceUrl: string | null = null,
) {
  check(
    bytes.length > 0 && bytes.length <= MAX_BYTES,
    "File must be between 1 byte and 512 MB",
  );
  check(
    filename === filename.split(/[\\/]/).pop() && !filename.includes("\0"),
    "Invalid filename",
  );
  const ext = extname(filename).toLowerCase();
  const head = bytes.subarray(0, 512).toString("utf8");
  check(
    !/^\s*(<!doctype|<html|<svg|<script)/i.test(head),
    "Active documents are not accepted",
  );
  const allowed = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".tif",
    ".tiff",
    ".mp4",
    ".mov",
    ".mp3",
    ".wav",
    ".otf",
    ".ttf",
    ".ai",
    ".psd",
    ".eps",
    ".pdf",
  ];
  check(allowed.includes(ext), "Unsupported upload type");
  check(
    !(
      head.startsWith("MZ") ||
      bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
    ),
    "Executable content is not accepted",
  );
  const checksum = hash(bytes);
  const prior = db
    .prepare("SELECT checksum FROM assets WHERE company=? AND id=?")
    .get(a.company, aid) as any;
  check(
    !prior?.checksum || prior.checksum === checksum,
    "Stored originals are immutable. Upload a new asset to preserve historical versions.",
    409,
  );
  const p = `${checksum}${ext}`,
    path = safePath(a.company, p);
  const temporary = path + ".part";
  writeFileSync(temporary, bytes, { mode: 0o600 });
  renameSync(temporary, path);
  const existing = db
    .prepare("SELECT * FROM assets WHERE company=? AND id=?")
    .get(a.company, aid) as any;
  let metadata = {
    ...(existing ? JSON.parse(existing.metadata) : {}),
    importedAt: new Date().toISOString(),
    originalExtension: ext,
  };
  let kind = [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"].includes(ext)
      ? "image"
      : [".mp4", ".mov"].includes(ext)
        ? "video"
        : [".wav", ".mp3"].includes(ext)
          ? "audio"
          : [".otf", ".ttf"].includes(ext)
            ? "font"
            : existing?.kind || "document",
    preview: string | null = null,
    status = "original_stored";
  try {
    if ([".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"].includes(ext)) {
      const meta = await sharp(path, {
        limitInputPixels: 100_000_000,
      }).metadata();
      check(meta.width && meta.height, "Invalid image");
      metadata = {
        ...metadata,
        width: meta.width,
        height: meta.height,
        orientation: meta.orientation,
        colorProfile: meta.space,
      };
      preview = `${checksum}-preview.png`;
      await sharp(path)
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .png()
        .toFile(safePath(a.company, preview));
      kind = "image";
      status = "preview_ready";
    } else if ([".mov", ".mp4", ".mp3", ".wav"].includes(ext)) {
      const meta = await probe(path);
      const video = meta.streams.find((s: any) => s.codec_type === "video");
      kind = video ? "video" : "audio";
      metadata = {
        ...metadata,
        duration: Number(meta.format.duration),
        width: video?.width,
        height: video?.height,
        hasAudio: meta.streams.some((s: any) => s.codec_type === "audio"),
        frameRate: video?.avg_frame_rate,
      };
      if (video) {
        preview = `${checksum}-preview.png`;
        await exec(
          process.env.FFMPEG_PATH || "ffmpeg",
          [
            "-y",
            "-v",
            "error",
            "-i",
            path,
            "-frames:v",
            "1",
            "-vf",
            "scale=640:-1",
            safePath(a.company, preview),
          ],
          { timeout: 30000 },
        );
      }
      status = "preview_ready";
    } else if ([".otf", ".ttf"].includes(ext)) {
      check(
        bytes.subarray(0, 4).toString() === "OTTO" ||
          bytes.readUInt32BE(0) === 65536,
        "Invalid font",
      );
      kind = "font";
      status = "original_stored";
    } else if ((ext === ".ai" || ext === ".pdf") && head.startsWith("%PDF")) {
      preview = `${checksum}-preview.png`;
      await exec(
        "pdftoppm",
        [
          "-f",
          "1",
          "-singlefile",
          "-scale-to",
          "1800",
          "-png",
          path,
          safePath(a.company, `${checksum}-preview`),
        ],
        { timeout: 30000, maxBuffer: 1024 * 1024 },
      );
      status = "preview_ready";
    } else {
      check(
        (ext === ".psd" && head.startsWith("8BPS")) ||
          (ext === ".eps" && head.startsWith("%!PS")) ||
          (ext === ".ai" && head.startsWith("%!PS")),
        "File signature does not match type",
      );
      status = "unsupported_preview";
    }
  } catch (e) {
    if (
      ["image", "video", "audio", "font"].includes(kind) ||
      (e as Error).message === "File signature does not match type"
    ) {
      throw e;
    }
    status = "unsupported_preview";
    metadata.previewError =
      "Original stored; preview parser unavailable or unsupported";
  }
  db.prepare(
    `INSERT INTO assets(id,company,name,kind,status,source_url,checksum,path,preview,bytes,metadata) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(company,id) DO UPDATE SET status=excluded.status,kind=excluded.kind,checksum=excluded.checksum,path=excluded.path,preview=excluded.preview,bytes=excluded.bytes,metadata=excluded.metadata,error=NULL`,
  ).run(
    aid,
    a.company,
    filename,
    kind,
    status,
    sourceUrl,
    checksum,
    p,
    preview,
    bytes.length,
    JSON.stringify(metadata),
  );
  return getAsset(a, aid);
}
export async function importDrive(a: Actor, aid: string) {
  const asset = getAsset(a, aid);
  check(
    asset.source_id && /^[\w-]+$/.test(asset.source_id),
    "No catalog source",
  );
  if (
    asset.checksum &&
    asset.path &&
    existsSync(safePath(a.company, asset.path))
  )
    return asset;
  db.prepare(
    "UPDATE assets SET status=?,error=NULL WHERE company=? AND id=?",
  ).run("importing", a.company, aid);
  try {
    const token = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
    const url = token
      ? `https://www.googleapis.com/drive/v3/files/${asset.source_id}?alt=media`
      : `https://drive.usercontent.google.com/download?id=${asset.source_id}&export=download`;
    let response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      redirect: "error",
      signal: AbortSignal.timeout(90000),
    });
    check(
      response.ok,
      `Drive access failed (${response.status}). Use authorized upload or configure Drive access.`,
      422,
    );
    if (!token && response.headers.get("content-type")?.includes("text/html")) {
      const html = await response.text();
      check(html.length < 100000, "Unexpected Drive response", 422);
      const uuid = html.match(/name="uuid" value="([a-f0-9-]+)"/)?.[1];
      check(
        uuid &&
          html.includes('id="download-form"') &&
          html.includes("https://drive.usercontent.google.com/download"),
        "Drive authorization required. Upload the original or configure server-side Drive access.",
        422,
      );
      const confirmed = new URL(
        "https://drive.usercontent.google.com/download",
      );
      confirmed.search = new URLSearchParams({
        id: asset.source_id,
        export: "download",
        confirm: "t",
        uuid,
      }).toString();
      response = await fetch(confirmed, {
        redirect: "error",
        signal: AbortSignal.timeout(90000),
      });
      check(response.ok, "Confirmed Drive download failed", 422);
    }
    check(
      !response.headers.get("content-type")?.includes("text/html"),
      "Drive authorization required. Upload the original or configure server-side Drive access.",
      422,
    );
    check(
      Number(response.headers.get("content-length") || 0) <= MAX_BYTES,
      "Original exceeds local 512 MB transfer limit; use an operator-approved larger intake pipeline",
      422,
    );
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("Original exceeds 512 MB local transfer limit");
      }
      chunks.push(value);
    }
    return await storeAsset(
      a,
      aid,
      Buffer.concat(chunks),
      asset.name,
      asset.source_url,
    );
  } catch (e) {
    const error = (e as Error).message;
    db.prepare(
      "UPDATE assets SET status=?,error=? WHERE company=? AND id=?",
    ).run(
      error.includes("access") || error.includes("authorization")
        ? "source_inaccessible"
        : "failed",
      error,
      a.company,
      aid,
    );
    throw e;
  }
}
