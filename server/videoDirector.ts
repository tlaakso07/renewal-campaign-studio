// The Director: an expert prompt-writing pass between the script and any paid generation.
// Generic prompts ("realistic, natural light") produce the glossy, golden-hour "AI look". This step writes
// each scene as an exact cinematography spec — camera, lens, light, blocking, timing, imperfections —
// in the documentary-commercial style of the client's real ads.
import { generateText, Output } from "ai";
import { z } from "zod";
import type { VideoPlan } from "./videoPlan.ts";
import { seasonOf } from "./adLayouts.ts";

export const DIRECTOR_MODEL = process.env.VIDEO_DIRECTOR_MODEL || "anthropic/claude-opus-5";

// House look, measured from Renewal's own reference commercial (VO1_1.mp4). Brands can override via brand.videoLook.
export const DEFAULT_LOOK = `REAL-FOOTAGE LOOK (non-negotiable): this must read as documentary b-roll shot by a small commercial crew in a real lived-in home, never as a render.
LIGHT: soft, flat, available daylight from real windows; overcast or open shade; neutral-to-slightly-cool white balance (~5200–5600K). Interiors a touch underexposed with real shadow falloff. NO golden hour, NO orange glow, NO sun flares, NO bloom or haze, NO rim light, NO HDR, NO teal-and-orange grade.
COLOUR: muted, low-saturation, natural contrast, true whites; foliage and fabrics slightly desaturated.
CAMERA: full-frame cinema camera (Sony FX3 class), 24fps, 180° shutter with natural motion blur. Lenses 35mm or 50mm for people at f/2.8, 85–100mm macro for details at f/4. Handheld with subtle human micro-jitter, or a slow slider move. One simple move per shot. Fine sensor grain, mild lens softness at edges.
FRAMING: off-centre, rule of thirds, partial foreground obstruction (door frame, plant, shoulder) welcome; never symmetrical, never a catalogue hero angle.
PEOPLE: ordinary believable homeowners and tradespeople aged 35–60, average builds, unretouched skin with pores and lines, flyaway hair, natural asymmetry. Homeowners wear everyday slightly-wrinkled clothes in plain solid colours. Candid and mid-action, NEVER looking at the camera, never posing, no model smiles.
PLACES: real Midwestern US homes with ordinary clutter and wear — mail on the counter, a dog bed, cables, scuffed trim, mismatched furniture. Architecturally plausible rooms; normal window counts and sizes.
ACTION: one small physical action per shot that starts and finishes inside the shot; hands do simple, physically correct things.
NEVER: on-screen text, captions, watermarks, signage, readable screens, or any logo other than the company's real branding on its vehicle and crew uniform; extra fingers; morphing; impossible architecture; glamour lighting; perfectly staged decor; stock-photo smiles.`;

const directionSchema = z.object({
  bible: z.string(), // continuity: the home, each person, wardrobe, time of day, weather — reused in every prompt
  segments: z.array(
    z.object({
      id: z.string(),
      keyframePrompt: z.string(), // still-image prompt for the FIRST frame of the segment
      motionPrompt: z.string(), // image-to-video prompt: timecoded shot list with hard cuts
    }),
  ),
});
export type Direction = z.infer<typeof directionSchema>;

const SYSTEM = `You are the director of photography and editor on a direct-response TV commercial — an award-winning documentary-commercial DP who also understands paid social: the first second must stop the scroll, every shot must serve the line being spoken, and nothing may look staged or synthetic.
You are writing prompts for two AI models: a still-image model (the opening keyframe of each scene) and an image-to-video model (Seedance 2.5) that animates from that keyframe. These models default to a glossy, over-lit, over-saturated "AI look" with model-perfect people. Your prompts exist to defeat that default through precision. Vague adjectives ("cinematic", "beautiful", "realistic", "high quality", "stunning") are banned — they cause the AI look. Every sentence must be a concrete, physically specific instruction a camera crew could execute.

For each scene write:
1. keyframePrompt — a single photographic frame, written like a shot report: shot size and angle; lens focal length, aperture and focus point; camera height; exact subject description from the bible (age, build, hair, skin, wardrobe); the exact mid-action pose (what each hand is doing, where the eyes look — never at camera); the room with 3–5 specific lived-in details; the light source, direction, quality and colour temperature; exposure and colour notes; frame imperfections (grain, slight softness, a foreground obstruction). End with the explicit exclusions.
2. motionPrompt — a timecoded shot list for the video model. Format each shot as "[0.0–2.0s] SHOT 1 — <size>, <lens>, <camera move>: <one physical action with a beginning and end>. <light>." with the words "HARD CUT" between shots. Shot 1 continues exactly from the keyframe. Each later shot names its new framing fully (the model cannot see it), keeps the same people/home/light from the bible, and contains ONE simple action that is easy to render correctly (avoid complex hand-object interactions, tools touching surfaces in close-up, handshakes in close-up, pouring, writing, or anything with many fingers in focus — prefer wider framings, backs of hands, or implied action). End with the look rules and exclusions restated briefly.

BLOCKING FOR AI (critical — an inspector rejects frames with these faults): when people carry or hold something, specify the grip literally: which hand holds which real edge of the object, thumbs in front and fingers wrapped behind, elbows bent, body leaning into the load; both of each person's hands must be visible. Describe held products as one complete object with clean closed corners and nothing protruding. Keep logos legible but modest in frame (vehicle side-on to camera at 6–10 metres so its livery sits flat and undistorted; cap and chest marks small). Prefer framings that hide difficult detail honestly: a carried window seen from its back face, a person seen from behind, gloved hands, medium-wide rather than close on hands.

Rules: match shot count and order to the script exactly; keep each shot's visual tied to the phrase spoken over it; keep durations as given; the same people, wardrobe, home, weather and time of day across every scene (copy the relevant bible lines into every prompt verbatim — the models have no memory); plausible geography between shots. Write in plain declarative English. No markdown.`;

export type DirectorDependencies = { direct?: (system: string, prompt: string) => Promise<Direction> };

export function directorBrief(plan: VideoPlan, brand: any) {
  return [
    `BRAND: ${brand.name} — full-service replacement windows and doors, installed by their own crews in homeowners' houses. Season: ${seasonOf(plan.content.ends)} (show it through overcast light, bare or turning trees, sweaters — not through orange glow).`,
    `FORMAT: ${plan.aspect} vertical-friendly social video, ${plan.style === "ugc" ? "UGC: a real homeowner filming themself on a phone, talking to camera" : "voiceover commercial, silent b-roll (voice and captions are added later)"}.`,
    brand.videoLook || DEFAULT_LOOK,
    brand.videoKit?.notes
      ? `CORRECT BRANDING (mandatory — this is what makes the ad the client's): real reference photos of the company vehicle, crew uniform and product are attached to every generation. Whenever crew, the vehicle or the product appear, describe them EXACTLY as follows and state that they must match the attached reference photos, with logos rendered crisply and unaltered: ${brand.videoKit.notes} Show the brand naturally and often: the truck in the driveway, uniformed installers, the new windows themselves. Plan at least one shot where the truck or a uniformed installer is clearly visible with the logo legible (medium framing, logo facing camera, not at an extreme angle).`
      : "",
    plan.style === "ugc" ? `PRESENTER: ${plan.presenter}. Phone-camera look: 26mm equivalent, arm's length, slight wide-angle, natural window light on the face, small handheld sway; the person speaks the scene's line to the lens.` : "",
    plan.instructions ? `OWNER INSTRUCTIONS (highest priority): ${plan.instructions}` : "",
    "SCRIPT AND SHOT PLAN:",
    ...plan.segments.map((s) => {
      const per = s.seconds / s.shots.length;
      return `Scene ${s.id} — ${s.seconds}s — setting idea: ${s.setting}\n${s.shots.map((x, i) => `  shot ${i + 1} [${(i * per).toFixed(1)}–${((i + 1) * per).toFixed(1)}s] spoken: "${x.phrase}" — idea: ${x.visual} (${x.camera})`).join("\n")}`;
    }),
    `Return the continuity bible first, then one entry per scene with ids exactly: ${plan.segments.map((s) => s.id).join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function directPlan(plan: VideoPlan, brand: any, deps: DirectorDependencies = {}): Promise<Direction> {
  const prompt = directorBrief(plan, brand);
  // Exact prompts are long (≈1.5–2k tokens per scene); a truncated reply fails to parse, so allow room and retry once.
  const ask = async () =>
    (
      await generateText({
        model: DIRECTOR_MODEL,
        system: SYSTEM,
        prompt,
        output: Output.object({ schema: directionSchema }),
        providerOptions: { anthropic: { thinking: { type: "disabled" } } },
        maxOutputTokens: 20000,
        timeout: { totalMs: 300_000 },
      })
    ).output;
  const direction = deps.direct ? await deps.direct(SYSTEM, prompt) : await ask().catch(() => ask());
  const parsed = directionSchema.parse(direction);
  for (const s of plan.segments) if (!parsed.segments.some((d) => d.id === s.id)) throw new Error(`The director skipped scene ${s.id}`);
  return parsed;
}
