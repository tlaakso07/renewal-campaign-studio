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
  // Ad copy pools the static templates rotate through; editable per campaign.
  headlines: z.array(z.string().min(1).max(80)).max(12).default([]),
  ctaLabels: z
    .array(z.string().min(1).max(48))
    .max(6)
    .default(["Book your FREE Design Consultation", "Schedule Today!"]),
  tiers: z
    .array(
      z.object({
        lead: z.string().min(1).max(40),
        value: z.string().min(1).max(20),
      }),
    )
    .max(3)
    .default([]),
  legalApproved: z.boolean().default(false),
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
  opacity: z.number().min(0).max(1).default(1),
  radius: z.number().min(0).max(180).default(0),
  weight: z.enum(["book", "medium", "demi", "heavy"]).default("book"),
  italic: z.boolean().default(false),
  align: z.enum(["left", "center", "right"]).default("left"),
  lineHeight: z.number().min(0.8).max(2).default(1.2),
  minFontSize: z.number().min(10).max(180).nullable().default(null),
  stroke: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .default(null),
  strokeWidth: z.number().min(0).max(40).default(0),
  gradient: z.enum(["none", "fade-down", "fade-up"]).default("none"),
  // SVG path data relative to the layer origin (diagonal bands, curves, arrows).
  path: z
    .string()
    .max(4000)
    .regex(/^[MmLlHhVvCcSsQqTtAaZz0-9 .,eE-]*$/)
    .nullable()
    .default(null),
  fit: z.enum(["cover", "contain"]).default("cover"),
  cropX: z.number().min(0).max(1).default(0.5),
  cropY: z.number().min(0).max(1).default(0.5),
  zoom: z.number().min(1).max(4).default(1),
});
export const sceneSchema = z.object({
  id: z.string(),
  assetId: z.string().nullable(),
  duration: z.number().min(0.5).max(30),
  trim: z.number().min(0).max(3600).default(0),
  caption: text.default(""),
  narration: text.default(""),
  shotDirection: text.default(""),
  mute: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(1),
  source: z.enum(["company", "generated", "presenter"]).default("company"),
});
// What a static ad is made of. The layout is always regenerated from this, never hand-placed.
export const adContentSchema = z.object({
  headline: z.string().max(80).default(""),
  cta: z.string().max(48).default(""),
  tiers: z
    .array(
      z.object({
        lead: z.string().trim().min(1).max(40),
        value: z.string().trim().min(1).max(20),
      }),
    )
    .max(2)
    .default([]),
  ends: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/)
    .default(""),
  terms: text.default(""),
  legalApproved: z.boolean().default(false),
  photoAssetId: z.string().nullable().default(null),
  cutoutAssetId: z.string().nullable().default(null),
  photoFocusY: z.number().min(0).max(1).nullable().default(null),
});
export type AdContent = z.infer<typeof adContentSchema>;
export const documentSchema = z.object({
  name: z.string().min(1).max(160),
  kind: z.enum(["static", "video"]),
  campaignId: z.string(),
  brandId: z.string(),
  brandVersion: z.number().int().positive(),
  offerVersion: z.number().int().positive(),
  format: z.enum(["square", "portrait", "vertical"]),
  layout: z
    .enum(["band", "diagonal", "arch", "ai", "editorial", "showcase", "split"])
    .default("band"),
  layers: z.array(layerSchema).max(30),
  scenes: z.array(sceneSchema).max(40).default([]), // fast-cut commercials run ~1–2s per shot
  musicAssetId: z.string().nullable().default(null),
  musicVolume: z.number().min(0).max(1).default(0.15),
  voiceAssetId: z.string().nullable().default(null),
  voiceVolume: z.number().min(0).max(1).default(1),
  voiceStart: z.number().min(0).max(3600).default(0),
  musicDucking: z.boolean().default(true),
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
  // Fine print for the ad (campaign terms + required retailer line); goes in post text, manifest and copy file.
  terms: text.default(""),
  // Voice-synced caption chunks (seconds from video start). When present they replace per-scene captions.
  captionTrack: z
    .array(z.object({ start: z.number().min(0), end: z.number().min(0), text: z.string().min(1).max(60) }))
    .max(200)
    .default([]),
  // "pill": 2–3 words at a time on a brand-colour pill (Renewal style). "headline": the scene's whole line, bold white at the top (Harley style).
  captionStyle: z.enum(["box", "pill", "headline"]).default("box"),
  // Closing offer card that builds line by line under the real logo, with fine print, before the end card.
  offerBuild: z.boolean().default(false),
  endCard: z.enum(["offer", "logo"]).default("offer"),
  // Static template ads: the ad's own offer/photo content (older documents derive it from their campaign).
  content: adContentSchema.optional(),
  // Which campaign headline/CTA the layout used, so format changes regenerate the same ad.
  adVariant: z
    .object({
      headline: z.number().int().min(0).default(0),
      cta: z.number().int().min(0).default(0),
    })
    .default({ headline: 0, cta: 0 }),
});
export const brandFontKeys = [
  "book",
  "bookItalic",
  "medium",
  "mediumItalic",
  "demi",
  "demiItalic",
  "heavy",
  "heavyItalic",
  "demiCondensed",
] as const;
export const brandAdSchema = z.object({
  fonts: z.partialRecord(z.enum(brandFontKeys), z.string()).optional(),
  logoReverseAssetId: z.string().nullable().optional(),
  // Real photos that keep AI video correctly branded: the company vehicle, crew uniform and products.
  videoKit: z
    .object({
      vehicle: z.array(z.string()).max(4).default([]),
      uniform: z.array(z.string()).max(4).default([]),
      product: z.array(z.string()).max(6).default([]),
      notes: z.string().max(2000).default(""), // how to describe them in prompts
    })
    .optional(),
  // The company's real ads, used as style references for AI-designed ads.
  styleReferences: z.array(z.string()).max(40).optional(),
  adPhotos: z
    .object({
      scenes: z.array(z.string()).max(60),
      cutouts: z.array(z.string()).max(40),
    })
    .optional(),
});
export type CreativeDoc = z.infer<typeof documentSchema>;
export type Layer = z.infer<typeof layerSchema>;
export const dimensions = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  vertical: [1080, 1920],
} as const;
