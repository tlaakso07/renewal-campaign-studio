// Real-logo stamping: AI frames are generated with BLANK surfaces (plain vehicle side, plain shirts and caps);
// a vision model locates those surfaces and the company's actual logo files are composited on.
// The AI never draws a logo, so logos are always exact.
import { generateText, Output } from "ai";
import sharp, { type OverlayOptions, type Blend } from "sharp";
import { z } from "zod";

export const LOCATE_MODELS = (process.env.STAMP_LOCATE_MODEL || "google/gemini-3.7-flash,anthropic/claude-opus-5").split(",");
// Boxes are [ymin, xmin, ymax, xmax] on a 0–1000 grid (the format vision models localise most reliably).
const box = z.array(z.number()).length(4);
const placementSchema = z.object({
  vehiclePanels: z.array(z.object({ box, sharpness: z.enum(["sharp", "soft", "blurred"]) })),
  chests: z.array(z.object({ box, tiltDegrees: z.number() })),
  caps: z.array(z.object({ box, tiltDegrees: z.number() })),
});
export type Placements = z.infer<typeof placementSchema>;

const LOCATE = `This frame was generated with deliberately blank brand surfaces. Locate where real logos go. Boxes are [ymin, xmin, ymax, xmax] on a 0–1000 grid of the image.
- vehiclePanels: for each company vehicle, the largest UNOBSTRUCTED flat rectangle of its blank cargo-box side where a logo can sit without being covered by people, objects or branches and without touching the panel's edges (leave a margin). Report how sharp the vehicle is (sharp / soft / blurred background).
- chests: for each crew member whose shirt front is visible, a small box on the WEARER'S LEFT chest (the viewer's right side of the torso), where a polo chest logo is embroidered: about one fifth of the torso width, level with the armpit line, clear of arms, collar and carried objects. Skip anyone whose left chest is hidden. tiltDegrees = clockwise rotation of the torso's shoulder line from horizontal.
- caps: for each crew member whose cap front panel is visible, a small box centred on the cap's front panel above the brim. tiltDegrees = clockwise tilt of the head.
Return empty lists for anything not present.`;

export type StampDependencies = { locate?: (frame: Buffer) => Promise<Placements> };
export async function locateSurfaces(frame: Buffer): Promise<Placements> {
  let lastError: unknown;
  for (const model of LOCATE_MODELS) {
    try {
      const r = await generateText({
        model,
        maxRetries: 1,
        output: Output.object({ schema: placementSchema }),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 2000,
        timeout: { totalMs: 90_000 },
        messages: [{ role: "user", content: [{ type: "image", image: frame }, { type: "text", text: LOCATE }] }],
      });
      return r.output;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export type StampLogos = { vehicle: Buffer; chest: Buffer; cap: Buffer }; // real logo files (transparent PNG)
async function fitted(logo: Buffer, w: number, h: number, tilt: number, blur: number, opacity: number) {
  let img = sharp(await sharp(logo).trim().toBuffer()).resize(Math.max(8, Math.round(w)), Math.max(8, Math.round(h)), { fit: "inside" });
  if (Math.abs(tilt) > 1) img = sharp(await img.png().toBuffer()).rotate(tilt, { background: "#00000000" });
  if (blur > 0.3) img = sharp(await img.png().toBuffer()).blur(blur);
  // Slight transparency lets fabric/paint texture and scene light show through.
  return sharp(await img.png().toBuffer()).ensureAlpha().composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: "dest-in" }]).png().toBuffer();
}
export async function stampLogos(frame: Buffer, logos: StampLogos, deps: StampDependencies = {}) {
  const meta = await sharp(frame).metadata();
  const W = meta.width!,
    H = meta.height!;
  const found = await (deps.locate || locateSurfaces)(await sharp(frame).resize(1400, 1400, { fit: "inside" }).jpeg({ quality: 90 }).toBuffer());
  const px = ([y0, x0, y1, x1]: number[]) => ({ x: (x0 / 1000) * W, y: (y0 / 1000) * H, w: ((x1 - x0) / 1000) * W, h: ((y1 - y0) / 1000) * H });
  const layers: OverlayOptions[] = [];
  const place = async (logo: Buffer, b: number[], tilt: number, blur: number, opacity: number, blend: Blend, inset = 1) => {
    const r = px(b);
    const img = await fitted(logo, r.w * inset, r.h * inset, tilt, blur, opacity);
    const m = await sharp(img).metadata();
    const left = Math.round(r.x + (r.w - m.width!) / 2),
      top = Math.round(r.y + (r.h - m.height!) / 2);
    if (left < 0 || top < 0 || left + m.width! > W || top + m.height! > H) return;
    layers.push({ input: img, left, top, blend });
  };
  // Vehicle: dark full-colour logo on light paint → multiply keeps the panel's real shading; match background focus.
  for (const v of found.vehiclePanels) await place(logos.vehicle, v.box, 0, v.sharpness === "blurred" ? 2.2 : v.sharpness === "soft" ? 1.1 : 0.4, 0.95, "multiply", 0.82);
  // Apparel: light reverse logo on dark fabric → screen keeps folds and shadows.
  for (const c of found.chests) await place(logos.chest, c.box, c.tiltDegrees, 0.4, 0.9, "screen");
  for (const c of found.caps) await place(logos.cap, c.box, c.tiltDegrees, 0.4, 0.9, "screen", 0.9);
  return { buffer: await sharp(frame).composite(layers).png().toBuffer(), placements: found, stamped: layers.length };
}
