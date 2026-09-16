import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { DATA, db, replaceDatabase, hash, AppError } from "./db.ts";
import { setPrivateFileLoader } from "./storage.ts";

export type FileRef = { key: string; checksum: string; bytes: number };
export type ReviewSnapshot = { schema: 1; database: string; files: Record<string, FileRef>; updated: string };
export interface SnapshotTransport {
  read(key: string): Promise<{ bytes: Buffer; etag: string } | null>;
  write(key: string, bytes: Buffer, etag?: string): Promise<string>;
}
export const blobTransport: SnapshotTransport = {
  async read(key) {
    // Compression changes the strong object ETag to a weak HTTP validator.
    // Conditional writes need the exact strong ETag from the same read.
    const result = await get(key, { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return { bytes: Buffer.from(await new Response(result.stream).arrayBuffer()), etag: result.blob.etag };
  },
  async write(key, bytes, etag) {
    try {
      const result = await put(key, bytes, { access: "private", addRandomSuffix: false, allowOverwrite: !!etag, ...(etag ? { ifMatch: etag } : {}), cacheControlMaxAge: 60, multipart: bytes.length > 8 * 1024 * 1024 });
      return result.etag;
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) throw new AppError(409, "The workspace changed while saving. Reload and try again.");
      throw e;
    }
  },
};
export function storedFiles(): string[] {
  const paths = new Set<string>();
  for (const row of db.prepare("SELECT company,path,preview FROM assets").all() as any[]) {
    for (const path of [row.path, row.preview]) if (path) paths.add(`objects/${row.company}/${path}`);
  }
  for (const row of db.prepare("SELECT company,output FROM jobs WHERE output IS NOT NULL").all() as any[]) {
    const out = JSON.parse(row.output);
    for (const key of ["file", "copyFile", "manifestFile", "captionsFile"]) if (out[key]) paths.add(`objects/${row.company}/${out[key]}`);
  }
  for (const row of db.prepare("SELECT body FROM records WHERE kind='publication'").all() as any[]) {
    const body = JSON.parse(row.body);
    if (body.publicFile) paths.add(`published/${body.publicFile}`);
  }
  return [...paths];
}
export class ReviewStore {
  state: ReviewSnapshot = { schema: 1, database: "", files: {}, updated: "" };
  etag: string | undefined;
  private cached = new Map<string, { key: string; modified: number; bytes: number }>();
  constructor(public transport = blobTransport, public key = process.env.REVIEW_STATE_KEY || "review/state-v1.json") {
    setPrivateFileLoader(path => this.ensure(path));
  }
  async load() {
    const source = await this.transport.read(this.key);
    if (!source) throw new AppError(503, "The private workspace has not been initialized.");
    const state = JSON.parse(source.bytes.toString()) as ReviewSnapshot;
    if (state.schema !== 1 || !state.database || !state.files) throw new Error("Invalid private workspace snapshot");
    this.state = state; this.etag = source.etag;
    replaceDatabase(Buffer.from(state.database, "base64"));
  }
  private local(path: string) {
    const full = resolve(DATA, path);
    const name = relative(DATA, full);
    if (!/^(objects\/[a-zA-Z0-9_-]+|published)\/[^/]+$/.test(name)) throw new AppError(403, "Invalid private file path");
    return { full, name };
  }
  async ensure(path: string) {
    const { full, name } = this.local(path);
    const ref = this.state.files[name];
    if (!ref) { if (existsSync(full)) return; throw new AppError(404, "Private file unavailable"); }
    const cached = this.cached.get(name);
    if (cached?.key === ref.key && existsSync(full)) return;
    const source = await this.transport.read(ref.key);
    if (!source || hash(source.bytes) !== ref.checksum) throw new AppError(503, "Private file could not be verified. Try again.");
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, source.bytes, { mode: 0o600 });
    const info = statSync(full);
    this.cached.set(name, { key: ref.key, modified: info.mtimeMs, bytes: info.size });
  }
  async captureFiles() {
    for (const path of storedFiles()) {
      const { full, name } = this.local(path);
      if (!existsSync(full)) {
        if (!this.state.files[name]) throw new Error("Referenced private file is missing");
        continue;
      }
      const info = statSync(full), cached = this.cached.get(name);
      if (cached?.modified === info.mtimeMs && cached.bytes === info.size && this.state.files[name]?.key === cached.key) continue;
      const bytes = readFileSync(full), checksum = hash(bytes);
      const key = `review/objects/${checksum}`;
      if (this.state.files[name]?.checksum !== checksum) {
        // Content-addressed files are immutable. A duplicate upload is harmless.
        const existing = await this.transport.read(key);
        if (!existing) await this.transport.write(key, bytes);
      }
      this.state.files[name] = { key, checksum, bytes: bytes.length };
      this.cached.set(name, { key, modified: info.mtimeMs, bytes: info.size });
    }
  }
  async commit() {
    await this.captureFiles();
    db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    this.state.database = readFileSync(resolve(DATA, "studio.sqlite")).toString("base64");
    this.state.updated = new Date().toISOString();
    this.etag = await this.transport.write(this.key, Buffer.from(JSON.stringify(this.state)), this.etag);
  }
}

export function serialQueue() {
  let pending: Promise<unknown> = Promise.resolve();
  return function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const next = pending.then(task, task);
    pending = next.catch(() => {});
    return next;
  };
}
