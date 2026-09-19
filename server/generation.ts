import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { generateImage } from "ai";
import { createHiggsfieldClient } from "@higgsfield/client/v2";
import { z } from "zod";
import { Actor, AppError, check, db, getAsset, json, now } from "./db.ts";
import { MAX_BYTES, safePath, storeAsset } from "./assets.ts";
import { ensureLocalFile } from "./storage.ts";
import sharp from "sharp";
import { checkAdImage, type AdCheck } from "./adCheck.ts";
import { inspectFrame, type FrameVerdict } from "./frameQA.ts";

export const GPT_IMAGE_MODELS = {
  sunburst: "openai/gpt-image-2.5-sunburst",
  flare: "openai/gpt-image-2.5-flare",
} as const;

export const SEEDANCE_MODELS = {
  "text-to-video": "bytedance/seedance-2.5/text-to-video",
  "image-to-video": "bytedance/seedance-2.5/image-to-video",
  "reference-to-video": "bytedance/seedance-2.5/reference-to-video",
  "video-edit": "bytedance/seedance-2.5/video-edit",
  "video-extend": "bytedance/seedance-2.5/video-extend",
} as const;

const common = {
  prompt: z.string().trim().min(1).max(5000),
  confirmBillable: z.literal(true),
};
export const imageGenerationSchema = z.object({
  kind: z.literal("image"),
  model: z.enum(["sunburst", "flare"]),
  sourceAssetIds: z.array(z.string()).max(8).default([]),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).default("1024x1024"),
  // Ad batches: one image per variation, each with its own brief (distinct concept).
  variations: z.number().int().min(1).max(4).default(1),
  prompts: z.array(z.string().trim().min(1).max(8000)).max(4).optional(),
  aspect: z.enum(["1:1", "4:5", "9:16"]).optional(),
  requiredText: z.array(z.string().max(120)).max(10).default([]),
  season: z.string().max(12).optional(),
  // Video keyframes: inspect against the brand references and regenerate with the inspector's fixes until clean.
  frameQA: z
    .object({
      context: z.string().max(6000),
      referenceAssetIds: z.array(z.string()).max(4).default([]),
      maxAttempts: z.number().int().min(1).max(4).default(3),
    })
    .optional(),
  ...common,
});
export const videoGenerationSchema = z.object({
  kind: z.literal("video"),
  model: z.literal("seedance-2-5"),
  operation: z.enum([
    "text-to-video",
    "image-to-video",
    "reference-to-video",
    "video-edit",
    "video-extend",
  ]),
  sourceAssetIds: z.array(z.string()).max(30).default([]),
  duration: z.number().int().min(4).max(30),
  resolution: z.enum(["480p", "720p"]),
  aspectRatio: z.enum(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"]),
  generateAudio: z.boolean().default(true),
  ...common,
});
export const generationSchema = z.discriminatedUnion("kind", [
  imageGenerationSchema,
  videoGenerationSchema,
]);
export type GenerationRequest = z.infer<typeof generationSchema>;

function credentials() {
  const value = process.env.HIGGSFIELD_API_KEY || process.env.HF_CREDENTIALS;
  if (!value) return null;
  const separator = value.indexOf(":");
  if (separator < 1 || separator === value.length - 1) return null;
  return {
    combined: value,
    key: value.slice(0, separator),
    secret: value.slice(separator + 1),
  };
}

export function generationCapabilities(requestOidcToken?: unknown) {
  const gateway = !!(
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    (typeof requestOidcToken === "string" && requestOidcToken)
  );
  const higgsfield = !!credentials();
  return {
    image: {
      integrated: true,
      configured: gateway,
      provider: "Vercel AI Gateway · OpenAI",
      models: Object.values(GPT_IMAGE_MODELS),
      state: gateway ? "configured-not-live-tested" : "authentication-required",
    },
    video: {
      integrated: true,
      configured: higgsfield,
      provider: "Higgsfield API · ByteDance Seed",
      models: Object.values(SEEDANCE_MODELS),
      state: higgsfield
        ? "configured-not-live-tested"
        : "authentication-required",
    },
    billing: {
      requiresConfirmation: true,
      note: "Generation uses provider API billing. Website subscriptions and local render units do not replace provider API balance.",
    },
  };
}

export function catalogWithGenerationState(
  models: any[],
  requestOidcToken?: unknown,
) {
  const capabilities = generationCapabilities(requestOidcToken);
  return models.map((model) => {
    if (model.id === "gpt-image-2-5")
      return {
        ...model,
        connected: capabilities.image.configured,
        connectionState: capabilities.image.state,
      };
    if (model.id === "seedance-2-5")
      return {
        ...model,
        connected: capabilities.video.configured,
        connectionState: capabilities.video.state,
      };
    return {
      ...model,
      connected:
        model.id === "gpt-astra-6" ? capabilities.image.configured : false,
      connectionState: model.enabled
        ? capabilities.image.configured
          ? "configured-not-live-tested"
          : "authentication-required"
        : "unavailable",
    };
  });
}

export function validateGenerationRequest(
  a: Actor,
  value: unknown,
  availability?: { gateway?: boolean; higgsfield?: boolean },
) {
  const request = generationSchema.parse(value);
  const caps = generationCapabilities();
  if (request.kind === "image")
    check(
      availability?.gateway ?? caps.image.configured,
      "OpenAI image generation is integrated but AI Gateway authentication is not available in this environment.",
      422,
    );
  else
    check(
      availability?.higgsfield ?? caps.video.configured,
      "Seedance 2.5 is integrated but HIGGSFIELD_API_KEY is not configured.",
      422,
    );

  const assets = request.sourceAssetIds.map((assetId) => getAsset(a, assetId));
  check(
    assets.every((asset) => asset.status === "preview_ready" && asset.path),
    "Every generation reference must be an imported, ready asset",
  );
  if (request.kind === "image") {
    check(
      // Vector logos are sent as their transparent PNG preview.
      assets.every((asset) => asset.kind === "image" || (asset.kind === "vector" && asset.preview)),
      "GPT Image references must be images",
    );
    return request;
  }
  if (request.operation === "text-to-video")
    check(assets.length === 0, "Text-to-video does not accept source media");
  if (request.operation === "image-to-video")
    check(
      assets.length === 1 && assets[0].kind === "image",
      "Image-to-video requires exactly one image",
    );
  if (request.operation === "reference-to-video")
    check(
      assets.length >= 1 &&
        assets.every((asset) =>
          ["image", "video", "audio"].includes(asset.kind),
        ),
      "Reference-to-video requires one or more image, video, or audio references",
    );
  if (["video-edit", "video-extend"].includes(request.operation))
    check(
      assets.length === 1 && assets[0].kind === "video",
      `${request.operation === "video-edit" ? "Video edit" : "Video extend"} requires exactly one video`,
    );
  return request;
}

type GeneratedMedia = {
  bytes: Buffer;
  extension: ".png" | ".jpg" | ".webp" | ".mp4" | ".mov";
  provider: string;
  apiModelId: string;
  providerRequestId?: string;
  warnings?: string[];
  providerUsage?: Record<string, unknown>;
};
export type GenerationDependencies = {
  image?: (
    a: Actor,
    request: z.infer<typeof imageGenerationSchema>,
  ) => Promise<GeneratedMedia | GeneratedMedia[]>;
  check?: (image: Buffer, required: string[], brandName: string, season?: string) => Promise<AdCheck>;
  inspect?: (frame: Buffer, references: Buffer[], context: string) => Promise<FrameVerdict>;
  video?: (
    a: Actor,
    request: z.infer<typeof videoGenerationSchema>,
    progress: Record<string, unknown>,
    updateProgress: (value: Record<string, unknown>) => void,
    canceled: () => boolean,
  ) => Promise<GeneratedMedia>;
};

function gatewayError(error: unknown) {
  const value = error as {
    statusCode?: number;
    message?: string;
    name?: string;
  };
  if (value.statusCode === 403)
    return "AI Gateway rejected the request. Confirm that paid Gateway credits are available.";
  if (value.statusCode === 401)
    return "AI Gateway authentication was rejected.";
  return `OpenAI image generation failed${value.statusCode ? ` (${value.statusCode})` : ""}.`;
}

// One provider call per variation, in parallel; failed variations are dropped unless all fail.
async function runImage(
  a: Actor,
  request: z.infer<typeof imageGenerationSchema>,
): Promise<GeneratedMedia[]> {
  const prompts = Array.from({ length: request.variations }, (_, i) => request.prompts?.[i] || request.prompt);
  const settled = await Promise.allSettled(prompts.map((prompt) => runOneImage(a, { ...request, prompt })));
  const made = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (!made.length) throw (settled[0] as PromiseRejectedResult).reason;
  return made;
}
async function runOneImage(
  a: Actor,
  request: z.infer<typeof imageGenerationSchema>,
): Promise<GeneratedMedia> {
  const sources: Buffer[] = [];
  for (const assetId of request.sourceAssetIds) {
    const asset = getAsset(a, assetId);
    const source = safePath(a.company, asset.preview || asset.path);
    await ensureLocalFile(source);
    sources.push(readFileSync(source));
  }
  try {
    const result = await generateImage({
      model: GPT_IMAGE_MODELS[request.model],
      prompt: sources.length
        ? { text: request.prompt, images: sources }
        : request.prompt,
      // Ask for the ad's exact shape; cropping a taller canvas cut into logos and dates in live tests.
      ...(request.aspect && request.aspect !== "1:1"
        ? { aspectRatio: request.aspect }
        : { size: request.size }),
      n: 1,
      providerOptions: { openai: { background: "opaque" } },
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(240_000),
    });
    const mediaType = result.image.mediaType.toLowerCase();
    const extension = mediaType.includes("jpeg")
      ? ".jpg"
      : mediaType.includes("webp")
        ? ".webp"
        : ".png";
    // A transparent logo reference can make the model return a see-through background; ads must be opaque.
    const raw = Buffer.from(result.image.uint8Array);
    const opaque = (await sharp(raw).metadata()).hasAlpha;
    return {
      bytes: opaque ? await sharp(raw).flatten({ background: "#FFFFFF" }).png().toBuffer() : raw,
      extension: opaque ? ".png" : extension,
      provider: "openai-via-vercel-ai-gateway",
      apiModelId: GPT_IMAGE_MODELS[request.model],
      warnings: result.warnings.map((warning) =>
        typeof warning === "string" ? warning : JSON.stringify(warning),
      ),
      providerUsage: {
        imagesGenerated: result.images.length,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
        responseModels: result.responses.map((response) => response.modelId),
      },
    };
  } catch (error) {
    throw new AppError(502, gatewayError(error));
  }
}

async function uploadReferences(a: Actor, assetIds: string[]) {
  const auth = credentials();
  check(auth, "Higgsfield credentials are not configured", 500);
  // The SDK's upload client ignores the `upload_headers` Higgsfield now returns (Content-Type plus
  // x-amz-tagging are part of the S3 signature), so every upload failed with 403. Send them as given.
  const upload = {
    async upload(data: Buffer, contentType: string) {
      const link = await fetch("https://api.higgsfield.ai/files/generate-upload-url", {
        method: "POST",
        headers: { Authorization: `Key ${auth.combined}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!link.ok) throw Object.assign(new Error(`Upload link failed (${link.status})`), { statusCode: link.status });
      const { upload_url, public_url, upload_headers } = (await link.json()) as { upload_url: string; public_url: string; upload_headers?: Record<string, string> };
      const put = await fetch(upload_url, { method: "PUT", headers: upload_headers || { "Content-Type": contentType }, body: new Uint8Array(data), signal: AbortSignal.timeout(120_000) });
      if (!put.ok) throw Object.assign(new Error(`Upload failed (${put.status})`), { statusCode: put.status });
      return public_url;
    },
  };
  const rows: Array<{ kind: string; url: string }> = [];
  for (const assetId of assetIds) {
    const asset = getAsset(a, assetId);
    const relative =
      asset.kind === "image" ? asset.preview || asset.path : asset.path;
    const path = safePath(a.company, relative);
    await ensureLocalFile(path);
    const extension = extname(relative).toLowerCase();
    const contentType =
      asset.kind === "image"
        ? extension === ".webp"
          ? "image/webp"
          : extension === ".jpg" || extension === ".jpeg"
            ? "image/jpeg"
            : "image/png"
        : asset.kind === "video"
          ? extension === ".mov"
            ? "video/quicktime"
            : "video/mp4"
          : extension === ".wav"
            ? "audio/wav"
            : "audio/mpeg";
    rows.push({
      kind: asset.kind,
      url: await upload.upload(readFileSync(path), contentType),
    });
  }
  return rows;
}

export function privateNetworkAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice(7);
      if (isIP(mapped) === 4) return privateNetworkAddress(mapped);
      const words = mapped.split(":");
      if (
        words.length === 2 &&
        words.every((word) => /^[0-9a-f]{1,4}$/.test(word))
      ) {
        const high = Number.parseInt(words[0], 16);
        const low = Number.parseInt(words[1], 16);
        return privateNetworkAddress(
          `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`,
        );
      }
      return true;
    }
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff")
    );
  }
  const parts = address.split(".").map(Number);
  return (
    parts[0] === 0 ||
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 198 && [18, 19].includes(parts[1])) ||
    parts[0] >= 224
  );
}

async function readProviderFile(urlValue: string, extension: ".mp4" | ".mov") {
  const url = new URL(urlValue);
  check(
    url.protocol === "https:",
    "Provider returned an invalid output URL",
    502,
  );
  check(
    !["localhost", "localhost.localdomain"].includes(url.hostname) &&
      !url.hostname.endsWith(".local"),
    "Provider returned an unsafe output host",
    502,
  );
  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  check(
    addresses.length > 0 &&
      addresses.every((result) => !privateNetworkAddress(result.address)),
    "Provider returned an unsafe output host",
    502,
  );
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(120_000),
  });
  check(
    response.ok && response.body,
    "Provider output could not be downloaded",
    502,
  );
  const length = Number(response.headers.get("content-length") || 0);
  check(
    length <= MAX_BYTES,
    "Provider output exceeds the 512 MB storage limit",
    502,
  );
  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new AppError(
        502,
        "Provider output exceeds the 512 MB storage limit",
      );
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  check(bytes.length > 0, "Provider returned an empty output", 502);
  return { bytes, extension };
}

function higgsfieldError(error: unknown) {
  const status = Number(
    (error as any)?.response?.status || (error as any)?.statusCode || 0,
  );
  if (status === 402)
    return new AppError(
      402,
      "Higgsfield API balance is insufficient. Website Unlimited access does not include API generation credits.",
    );
  // Keep the provider's own reason: a 403 is often billing or model access, not bad credentials.
  const raw = (error as any)?.response?.data?.detail ?? (error as any)?.response?.data ?? (error as any)?.message ?? "";
  const detail = String(typeof raw === "string" ? raw : JSON.stringify(raw)).replace(/https?:\/\/\S+/g, "<url>").slice(0, 200);
  if ([401, 403].includes(status))
    return new AppError(502, `Higgsfield rejected the request (${status})${detail ? `: ${detail}` : ""}.`);
  if (status === 429)
    return new AppError(
      503,
      "Higgsfield is rate-limiting generation. Retry this job later.",
    );
  return new AppError(
    502,
    `Higgsfield generation failed${status ? ` (${status})` : ""}.`,
  );
}

async function runVideo(
  a: Actor,
  request: z.infer<typeof videoGenerationSchema>,
  previousProgress: Record<string, unknown>,
  updateProgress: (value: Record<string, unknown>) => void,
  canceled: () => boolean,
): Promise<GeneratedMedia> {
  const auth = credentials();
  check(auth, "Higgsfield credentials are not configured", 500);
  let requestId =
    typeof previousProgress.providerRequestId === "string"
      ? previousProgress.providerRequestId
      : "";
  let response: any = null;
  if (!requestId) {
    let references: Awaited<ReturnType<typeof uploadReferences>>;
    try {
      references = await uploadReferences(a, request.sourceAssetIds);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw higgsfieldError(error);
    }
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      resolution: request.resolution,
      generate_audio: request.generateAudio,
    };
    if (
      ["text-to-video", "image-to-video", "reference-to-video"].includes(
        request.operation,
      )
    )
      input.output_format = "mp4";
    if (request.operation !== "video-edit") input.duration = request.duration;
    if (["text-to-video", "reference-to-video"].includes(request.operation))
      input.aspect_ratio = request.aspectRatio;
    if (request.operation === "image-to-video")
      input.image_url = references[0].url;
    if (request.operation === "reference-to-video") {
      input.image_urls = references
        .filter((item) => item.kind === "image")
        .map((item) => item.url);
      input.video_urls = references
        .filter((item) => item.kind === "video")
        .map((item) => item.url);
      input.audio_urls = references
        .filter((item) => item.kind === "audio")
        .map((item) => item.url);
    }
    if (["video-edit", "video-extend"].includes(request.operation))
      input.video_url = references[0].url;
    const client = createHiggsfieldClient({
      credentials: auth.combined,
      maxRetries: 0,
      timeout: 120_000,
    });
    try {
      response = await client.subscribe(SEEDANCE_MODELS[request.operation], {
        input,
        withPolling: false,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw higgsfieldError(error);
    }
    requestId = response.request_id;
    check(requestId, "Higgsfield did not return a request ID", 502);
    updateProgress({
      stage: response.status || "queued",
      provider: "higgsfield",
      providerRequestId: requestId,
      apiModelId: SEEDANCE_MODELS[request.operation],
    });
  }
  const started = Date.now();
  while (
    !response ||
    !["completed", "failed", "nsfw"].includes(response.status)
  ) {
    if (canceled()) {
      await fetch(`https://api.higgsfield.ai/requests/${requestId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Key ${auth.combined}` },
        signal: AbortSignal.timeout(15_000),
      }).catch(() => undefined);
      throw new AppError(409, "Generation canceled");
    }
    check(
      Date.now() - started < 720_000,
      "Higgsfield generation is still running. Retry this job to resume the same provider request.",
      504,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const status = await fetch(
      `https://api.higgsfield.ai/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${auth.combined}` },
        signal: AbortSignal.timeout(30_000),
      },
    );
    check(status.ok, `Higgsfield status check failed (${status.status})`, 502);
    response = await status.json();
    updateProgress({
      stage: response.status,
      provider: "higgsfield",
      providerRequestId: requestId,
      apiModelId: SEEDANCE_MODELS[request.operation],
    });
  }
  check(
    response.status !== "nsfw",
    "Higgsfield rejected the request during safety review",
    422,
  );
  check(response.status === "completed", "Higgsfield generation failed", 502);
  check(
    response.video?.url,
    "Higgsfield completed without a video output",
    502,
  );
  const downloaded = await readProviderFile(response.video.url, ".mp4");
  return {
    ...downloaded,
    provider: "higgsfield",
    apiModelId: SEEDANCE_MODELS[request.operation],
    providerRequestId: requestId,
  };
}

export async function executeGenerationJob(
  a: Actor,
  jobId: string,
  value: unknown,
  updateProgress: (value: Record<string, unknown>) => void,
  canceled: () => boolean,
  dependencies: GenerationDependencies = {},
) {
  const request = generationSchema.parse(value);
  const progressRow = db
    .prepare("SELECT progress FROM jobs WHERE id=?")
    .get(jobId) as any;
  const previousProgress = progressRow?.progress
    ? json(progressRow.progress)
    : {};
  const produced =
    request.kind === "image" && request.frameQA
      ? await inspectedFrame(a, request, dependencies, updateProgress)
      : request.kind === "image"
      ? await (dependencies.image || runImage)(a, request)
      : await (dependencies.video || runVideo)(
          a,
          request,
          previousProgress,
          updateProgress,
          canceled,
        );
  check(!canceled(), "Generation canceled", 409);
  const list = Array.isArray(produced) ? produced : [produced];
  const brandName = (db.prepare("SELECT name FROM companies WHERE id=?").get(a.company) as any)?.name || "the brand";
  const outputs = [];
  for (const [index, made] of list.entries()) {
    const generated =
      request.kind === "image" && request.aspect ? await cropToAspect(made, request.aspect) : made;
    const suffix = index ? `-${index + 1}` : "";
    const name = `${request.kind === "image" ? "GPT-Image-2.5" : "Seedance-2.5"}-${jobId.slice(0, 8)}${suffix}${generated.extension}`;
    const asset = await storeAsset(a, `generated-${jobId}${suffix}`, generated.bytes, name);
    const adCheck =
      request.kind === "image" && request.requiredText.length
        ? await (dependencies.check || checkAdImage)(generated.bytes, request.requiredText, brandName, request.season)
        : null;
    const metadata = {
      ...asset.metadata,
      origin: "generated",
      provider: generated.provider,
      apiModelId: generated.apiModelId,
      providerRequestId: generated.providerRequestId || null,
      generationJobId: jobId,
      generatedAt: now(),
      prompt: request.kind === "image" ? request.prompts?.[index] || request.prompt : request.prompt,
      variation: index + 1,
      sourceAssetIds: request.sourceAssetIds,
      operation:
        request.kind === "video"
          ? request.operation
          : request.sourceAssetIds.length
            ? "edit"
            : "generate",
      providerUsage: generated.providerUsage || null,
      check: adCheck,
      frameQA: (generated as any).frameQA || null,
    };
    db.prepare(
      "UPDATE assets SET collection=?,metadata=? WHERE company=? AND id=?",
    ).run("Generated media", JSON.stringify(metadata), a.company, asset.id);
    const stored = getAsset(a, asset.id);
    outputs.push({ stored, generated, adCheck });
  }
  const [first] = outputs;
  return {
    assetId: first.stored.id,
    assetIds: outputs.map((o) => o.stored.id),
    checks: outputs.map((o) => o.adCheck),
    file: first.stored.path,
    filename: first.stored.name,
    checksum: first.stored.checksum,
    provider: first.generated.provider,
    apiModelId: first.generated.apiModelId,
    providerRequestId: first.generated.providerRequestId || null,
    warnings: outputs.flatMap((o) => o.generated.warnings || []),
  };
}
const qaImage = (bytes: Buffer) => sharp(bytes, { limitInputPixels: false }).rotate().resize(1400, 1400, { fit: "inside" }).jpeg({ quality: 88 }).toBuffer();
// Generate → inspect → regenerate with the inspector's fixes. Returns the first clean frame, else the best attempt.
async function inspectedFrame(
  a: Actor,
  request: z.infer<typeof imageGenerationSchema>,
  dependencies: GenerationDependencies,
  updateProgress: (value: Record<string, unknown>) => void,
): Promise<GeneratedMedia> {
  const qa = request.frameQA!;
  const references: Buffer[] = [];
  for (const id of qa.referenceAssetIds) {
    const asset = getAsset(a, id);
    const path = safePath(a.company, asset.kind === "image" ? asset.path : asset.preview);
    await ensureLocalFile(path);
    references.push(await qaImage(readFileSync(path)));
  }
  const attempts: { media: GeneratedMedia; verdict: FrameVerdict }[] = [];
  let fixes: string[] = [];
  for (let n = 1; n <= qa.maxAttempts; n++) {
    updateProgress({ stage: `frame attempt ${n} of ${qa.maxAttempts}`, attempts: attempts.map((x) => x.verdict.issues.filter((i) => i.severity === "blocker").length) });
    const prompt = fixes.length
      ? `${request.prompt}\n\nCORRECTIONS FROM QUALITY CONTROL — the previous attempt was rejected for these reasons; every one must be right this time:\n${fixes.map((f) => `- ${f}`).join("\n")}`
      : request.prompt;
    const made = await (dependencies.image || runImage)(a, { ...request, prompt, prompts: undefined, variations: 1 });
    const media = Array.isArray(made) ? made[0] : made;
    const verdict = await (dependencies.inspect || inspectFrame)(await qaImage(media.bytes), references, qa.context);
    attempts.push({ media, verdict });
    if (verdict.passed) break;
    // Carry forward every blocker fix seen so far, so a later attempt doesn't reintroduce an earlier fault.
    fixes = [...new Set([...fixes, ...verdict.issues.filter((i) => i.severity === "blocker").map((i) => i.fix)])].slice(0, 12);
  }
  const blockers = (x: (typeof attempts)[number]) => x.verdict.issues.filter((i) => i.severity === "blocker").length;
  const best = attempts.find((x) => x.verdict.passed) || [...attempts].sort((x, y) => blockers(x) - blockers(y))[0];
  return Object.assign(best.media, { frameQA: { passed: best.verdict.passed, attempts: attempts.length, issues: best.verdict.issues } });
}
// Center-crop a portrait generation to the ad's exact aspect (the prompt keeps content in this area).
async function cropToAspect(made: GeneratedMedia, aspect: "1:1" | "4:5" | "9:16"): Promise<GeneratedMedia> {
  const [w, h] = aspect.split(":").map(Number);
  const meta = await sharp(made.bytes).metadata();
  const width = meta.width!,
    height = meta.height!;
  const targetH = Math.min(height, Math.round((width * h) / w)),
    targetW = Math.min(width, Math.round((height * w) / h));
  if (targetW === width && targetH === height) return made;
  // Never cut more than a sliver: if the provider ignored the aspect, keep the whole design instead.
  if (targetW * targetH < width * height * 0.97) return made;
  const bytes = await sharp(made.bytes)
    .extract({ left: Math.floor((width - targetW) / 2), top: Math.floor((height - targetH) / 2), width: targetW, height: targetH })
    .png()
    .toBuffer();
  return { ...made, bytes, extension: ".png" };
}
