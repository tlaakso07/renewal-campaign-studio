import { z } from "zod";
const text = z.string().max(5000);
export const campaignSchema = z.object({
  name: z.string().min(1).max(160),
  goal: text.default("Awareness"),
  product: text.default("Windows and doors"),
  market: text.default(""),
  start: text.default(""),
  end: text.default(""),
  audience: text.default(""),
  offer: text.default(""),
  terms: text.default(""),
  cta: z.string().max(120).default("Explore your options"),
  destination: text.default(""),
  offerVersion: z.number().int().positive().default(1),
  status: z.enum(["Draft", "In progress", "Archived"]).default("Draft"),
  reviewInherited: z.boolean().default(false),
});
export const layerSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "photo", "logo", "shape"]),
  role: z.string(),
  text: text.default(""),
  assetId: z.string().nullable().default(null),
  x: z.number().min(-1080).max(1920),
  y: z.number().min(-1920).max(1920),
  w: z.number().min(1).max(1920),
  h: z.number().min(1).max(1920),
  fontSize: z.number().min(10).max(180).default(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#000000"),
  fill: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#FFFFFF"),
  cropX: z.number().min(0).max(1).default(0.5),
  cropY: z.number().min(0).max(1).default(0.5),
  zoom: z.number().min(1).max(4).default(1),
});
export const sceneSchema = z.object({
  id: z.string(),
  assetId: z.string().nullable(),
  duration: z.number().min(1).max(30),
  trim: z.number().min(0).max(3600).default(0),
  caption: text.default(""),
  narration: text.default(""),
  shotDirection: text.default(""),
  mute: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(1),
  source: z.enum(["company", "generated", "presenter"]).default("company"),
});
export const documentSchema = z.object({
  name: z.string().min(1).max(160),
  kind: z.enum(["static", "video"]),
  campaignId: z.string(),
  brandId: z.string(),
  brandVersion: z.number().int().positive(),
  offerVersion: z.number().int().positive(),
  format: z.enum(["square", "portrait", "vertical"]),
  layout: z.enum(["editorial", "showcase", "split"]).default("editorial"),
  layers: z.array(layerSchema).max(30),
  scenes: z.array(sceneSchema).max(12).default([]),
  musicAssetId: z.string().nullable().default(null),
  musicVolume: z.number().min(0).max(1).default(0.15),
  voiceAssetId: z.string().nullable().default(null),
  parent: z.string().nullable().default(null),
  reference: z.string().nullable().default(null),
  remixBrief: z
    .object({
      sourceType: z.enum(["publication", "asset"]),
      sourceId: z.string(),
      sourceVersion: z.number().int().positive().optional(),
      adapt: z.array(
        z.enum(["hook", "layout", "narrative", "shots", "pacing", "captions"]),
      ),
      direction: text,
      hook: text,
      usage: text,
    })
    .optional(),
  videoBrief: z
    .object({
      style: z.enum(["commercial", "product", "ugc"]).default("commercial"),
      script: text.default(""),
      presenterDirection: text.default(""),
      voiceDirection: text.default(""),
    })
    .optional(),
  testBrief: z
    .object({
      change: text,
      metric: z.string().max(100),
      evidence: z.array(z.record(z.string(), z.unknown())),
      interpretation: text,
    })
    .optional(),
  copy: text.default(""),
});
export type CreativeDoc = z.infer<typeof documentSchema>;
export type Layer = z.infer<typeof layerSchema>;
export const dimensions = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  vertical: [1080, 1920],
} as const;
