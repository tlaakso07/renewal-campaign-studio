// The Director: an expert prompt-writing pass between the script and any paid generation.
// Generic prompts ("realistic, natural light") produce the glossy, golden-hour "AI look". This step writes
// each scene as an exact cinematography spec — camera, lens, light, blocking, timing, imperfections —
// in the documentary-commercial style of the client's real ads.
// When the plan came from a production brief (plan.brief), the brief is the source of truth
// (product/VIDEO-BRIEF-STANDARD.md §5): its grade, each scene's own light note, the Avatar Bible verbatim,
// the Product Bible and the format line replace the house look.
import { generateText, NoObjectGeneratedError, NoOutputGeneratedError, Output } from "ai";
import { z } from "zod";
import { framePrompt, type Brief, type VideoPlan } from "./videoPlan.ts";
import { seasonOf } from "./adLayouts.ts";
import { FORMATS } from "./videoLint.ts";
import { AppError } from "./db.ts";

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

// The system prompt differs in three places when a brief exists: the eyes may address the lens when the scene says so,
// rules are stated in positive form only, and the bible's identity fields are copied, never invented.
function systemFor(brief: boolean) {
  return `You are the director of photography and editor on a direct-response TV commercial — an award-winning documentary-commercial DP who also understands paid social: the first second must stop the scroll, every shot must serve the line being spoken, and nothing may look staged or synthetic.
You are writing prompts for two AI models: a still-image model (the opening keyframe of each scene) and an image-to-video model (Seedance 2.5) that animates from that keyframe. These models default to a glossy, over-lit, over-saturated "AI look" with model-perfect people. Your prompts exist to defeat that default through precision. Vague adjectives ("cinematic", "beautiful", "realistic", "high quality", "stunning") are banned — they cause the AI look. Every sentence must be a concrete, physically specific instruction a camera crew could execute.

For each scene write:
1. keyframePrompt — a single photographic frame, written like a shot report: shot size and angle; lens focal length, aperture and focus point; camera height; exact subject description from the bible (age, build, hair, skin, wardrobe); the exact mid-action pose (what each hand is doing, where the eyes look — ${brief ? "at the lens only when the scene's visual says direct to camera, otherwise off-camera" : "never at camera"}); the room with 3–5 specific lived-in details; the light source, direction, quality and colour temperature; exposure and colour notes; frame imperfections (grain, slight softness, a foreground obstruction). ${brief ? "State every rule in its positive form only; do not append \"no …\" exclusion lists." : "End with the explicit exclusions."}
2. motionPrompt — a timecoded shot list for the video model. Format each shot as "[0.0–2.0s] SHOT 1 — <size>, <lens>, <camera move>: <one physical action with a beginning and end>. <light>." with the words "HARD CUT" between shots. Shot 1 continues exactly from the keyframe. Each later shot names its new framing fully (the model cannot see it), keeps the same people/home/light from the bible, and contains ONE simple action that is easy to render correctly (avoid complex hand-object interactions, tools touching surfaces in close-up, handshakes in close-up, pouring, writing, or anything with many fingers in focus — prefer wider framings, backs of hands, or implied action). ${brief ? "End with the look rules restated briefly, in positive form only." : "End with the look rules and exclusions restated briefly."}

BLOCKING FOR AI (critical — an inspector rejects frames with these faults): when people carry or hold something, specify the grip literally: which hand holds which real edge of the object, thumbs in front and fingers wrapped behind, elbows bent, body leaning into the load; both of each person's hands must be visible. Describe held products as one complete object with clean closed corners and nothing protruding. Keep logos legible but modest in frame (vehicle side-on to camera at 6–10 metres so its livery sits flat and undistorted; cap and chest marks small). Prefer framings that hide difficult detail honestly: a carried window seen from its back face, a person seen from behind, gloved hands, medium-wide rather than close on hands.
${
  brief
    ? `
AVATAR IDENTITY: the AVATAR BIBLE is the client's approved identity. Copy its age, locale and wardrobe verbatim into every keyframe and motion prompt where the person appears — you must NOT invent or alter them when the bible provides them. Only the fields the bible leaves empty are yours to decide: decide each once, in the continuity bible, and reuse the exact words in every scene. The continuity bible MUST begin with the avatar's look in one line: "NAME — age, build, hair, skin, wardrobe" (the app shows this line to the client).
`
    : ""
}
Rules: match shot count and order to the script exactly; keep each shot's visual tied to the phrase spoken over it; keep durations as given; the same people, wardrobe, home, weather and time of day across every scene (copy the relevant bible lines into every prompt verbatim — the models have no memory); plausible geography between shots. Write in plain declarative English. No markdown.`;
}
export const SYSTEM = systemFor(false);

export type DirectorDependencies = { direct?: (system: string, prompt: string) => Promise<Direction> };

// The light clause(s) of a brief image prompt, e.g. "golden fall light" from "…street, golden fall light, photoreal, wide."
const LIGHT_WORDS = /\b(light|lit|lamp|sun|sunlight|overcast|dusk|dawn|glow|shade|daylight|backlit)\b/i;
export const lightPhrase = (visual: string) =>
  visual
    .split(/[,;.]/)
    .map((s) => s.trim())
    .filter((s) => LIGHT_WORDS.test(s))
    .join(", ");

// The Avatar Bible as one line from its structured fields; older plans keep free bullets, which follow.
export function avatarLine(a: Brief["avatar"]) {
  const parts = [
    `${a.name} — ${a.role}.`,
    a.ageRange && `Age ${a.ageRange}.`,
    a.locale && `${a.locale}.`,
    a.wardrobe && `Wardrobe: ${a.wardrobe} (identical in every scene).`,
    a.energy.length && `Energy: ${a.energy.join(", ")}.`,
    ...a.bullets.map((b) => (/[.!?]$/.test(b) ? b : `${b}.`)),
  ].filter(Boolean);
  const missing = [!a.ageRange && "age", !a.wardrobe && "wardrobe"].filter(Boolean);
  return { line: parts.join(" "), missing: missing as string[] };
}

// Required shots: the brief's own list if the writer carries one, else the format preset's, else none.
const requiredShots = (plan: VideoPlan): string[] => (plan.brief as any)?.requiredShots ?? (FORMATS[plan.format] as any)?.requiredShots ?? [];

function briefBlock(plan: VideoPlan, b: Brief) {
  const avatar = avatarLine(b.avatar);
  const shots = requiredShots(plan);
  return [
    `LOOK FOR THIS CONCEPT (the brief is the source of truth; there is no house look): grade "${b.specs.grade}". Location: ${b.specs.location}. Tone: ${b.specs.tone}. Pacing: ${b.specs.pacing}.`,
    `LIGHT: each scene below carries its own light note taken from the brief; write that light exactly, read against the grade. Where a scene has no light note, light it to the grade.`,
    `AVATAR BIBLE (copy this line verbatim into every prompt where they appear; do not invent or change age or wardrobe when given here): ${avatar.line}${avatar.missing.length ? ` Not given: ${avatar.missing.join(", ")} — decide each once in the continuity bible's first line and reuse the exact words in every scene.` : ""}`,
    `PRODUCT BIBLE: ${b.productBible.join(" | ")}.`,
    shots.length ? `REQUIRED SHOTS (each plainly visible in at least one scene): ${shots.join(" | ")}.` : "",
    `NEVER (state the positive form only; do not append "no …" exclusion lists): ${b.negatives.join(" | ")}.`,
    "Footage scenes carry no on-screen text; the app renders every card, price and disclaimer exactly.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function directorBrief(plan: VideoPlan, brand: any) {
  const b = plan.brief;
  const season = seasonOf(plan.content.ends);
  return [
    b
      ? `BRAND: ${brand.name} — full-service replacement windows and doors, installed by their own crews in homeowners' houses. Season: ${season} — set dressing only (turning leaves, sweaters, a jacket on a hook); the light comes from the grade and each scene's light note, never from the season.`
      : `BRAND: ${brand.name} — full-service replacement windows and doors, installed by their own crews in homeowners' houses. Season: ${season} (show it through overcast light, bare or turning trees, sweaters — not through orange glow).`,
    b
      ? `FORMAT: ${plan.aspect} — ${b.specs.formatLine}. Platform: ${b.specs.platform}. Voice and captions are added later; the person may address the lens when a scene's visual says so.`
      : `FORMAT: ${plan.aspect} vertical-friendly social video, ${plan.style === "ugc" ? "UGC: a real homeowner filming themself on a phone, talking to camera" : "voiceover commercial, silent b-roll (voice and captions are added later)"}.`,
    // A production brief carries its own look (product/VIDEO-BRIEF-STANDARD.md §5); the house look is only for plans without one.
    b ? briefBlock(plan, b) : brand.videoLook || DEFAULT_LOOK,
    brand.videoKit?.notes
      ? `CORRECT BRANDING (mandatory — this is what makes the ad the client's): real reference photos of the company vehicle, crew uniform and product are attached to every generation. Whenever crew, the vehicle or the product appear, describe them EXACTLY as follows and state that they must match the attached reference photos, with logos rendered crisply and unaltered: ${brand.videoKit.notes} Show the brand naturally and often: the truck in the driveway, uniformed installers, the new windows themselves. Plan at least one shot where the truck or a uniformed installer is clearly visible with the logo legible (medium framing, logo facing camera, not at an extreme angle).`
      : "",
    plan.style === "ugc" ? `PRESENTER: ${plan.presenter}. Phone-camera look: 26mm equivalent, arm's length, slight wide-angle, natural window light on the face, small handheld sway; the person speaks the scene's line to the lens.` : "",
    plan.instructions ? `OWNER INSTRUCTIONS (highest priority): ${plan.instructions}` : "",
    "SCRIPT AND SHOT PLAN:",
    ...plan.segments.filter((s) => s.kind === "footage").map((s) => {
      const per = s.seconds / s.shots.length;
      const cam = s.camera ? ` — camera: ${s.camera.move} | ${s.camera.lens} ${s.camera.angle}, ${s.camera.size}` : "";
      const light = b ? ` — light: ${lightPhrase(s.shots[0].visual) || b.specs.grade}` : "";
      const note = s.editorNote ? ` — editor note: ${s.editorNote}` : "";
      return `Scene ${s.id} — ${s.seconds}s — setting idea: ${s.setting}${cam}${light}${note}\n${s.shots.map((x, i) => `  shot ${i + 1} [${(i * per).toFixed(1)}–${((i + 1) * per).toFixed(1)}s] spoken: "${x.phrase}" — idea: ${x.visual} (${s.camera ? s.camera.move : x.camera})`).join("\n")}`;
    }),
    `Return the continuity bible first, then one entry per scene with ids exactly: ${plan.segments.filter((s) => s.kind === "footage").map((s) => s.id).join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// A code-built keyframe prompt for ONE scene, for a Redo after the client edits a visual (the Director's prompt was
// cleared). Carries the continuity bible, the Avatar and Product Bibles and the branding notes, unlike the generic
// framePrompt. Deterministic: no model call, no spend. Non-brief plans fall through to framePrompt unchanged.
export function sceneKeyframePrompt(plan: VideoPlan, segment: VideoPlan["segments"][number], brand: any) {
  if (segment.keyframePrompt) return segment.keyframePrompt;
  const b = plan.brief;
  if (!b) return framePrompt(plan, segment, brand);
  const visual = segment.shots[0].visual;
  const cam = segment.camera ? `Camera: ${segment.camera.move} | ${segment.camera.lens} ${segment.camera.angle}, ${segment.camera.size}.` : "";
  return [
    `Photorealistic ${plan.aspect} film still — the opening frame of scene ${segment.id} of a ${brand.name} ${b.specs.formatLine}.`,
    `SHOT: ${visual} ${cam} Light: ${lightPhrase(visual) || b.specs.grade}. Location: ${b.specs.location}. Grade: ${b.specs.grade}. Season: ${seasonOf(plan.content.ends)} as set dressing only.${segment.editorNote ? ` Editor note: ${segment.editorNote}` : ""}`,
    `AVATAR BIBLE (verbatim; age and wardrobe are fixed): ${avatarLine(b.avatar).line}`,
    plan.bible ? `CONTINUITY BIBLE: ${plan.bible}` : "",
    `PRODUCT BIBLE: ${b.productBible.join(" | ")}.`,
    brand.videoKit?.notes ? `CORRECT BRANDING: whenever crew, the vehicle or the product appear they must match the attached reference photos, logos crisp and unaltered: ${brand.videoKit.notes}` : "",
    `Do not show: ${b.negatives.join(" | ")}.`,
    "No on-screen text, captions, logos other than the company's real branding, watermarks or UI anywhere in the image.",
    plan.instructions ? `Owner instructions: ${plan.instructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// A parse/shape failure (truncated or malformed reply) is worth one retry; a provider error is not — it would double unmetered spend.
const isShapeFailure = (e: unknown) => e instanceof z.ZodError || NoObjectGeneratedError.isInstance(e) || NoOutputGeneratedError.isInstance(e);

export async function directPlan(plan: VideoPlan, brand: any, deps: DirectorDependencies = {}): Promise<Direction> {
  const prompt = directorBrief(plan, brand);
  const system = systemFor(!!plan.brief);
  // Exact prompts are long (≈1.5–2k tokens per scene); a truncated reply fails to parse, so allow room.
  const attempt = async () =>
    directionSchema.parse(
      deps.direct
        ? await deps.direct(system, prompt)
        : (
            await generateText({
              model: DIRECTOR_MODEL,
              system,
              prompt,
              output: Output.object({ schema: directionSchema }),
              providerOptions: { anthropic: { thinking: { type: "disabled" } } },
              maxOutputTokens: 20000,
              timeout: { totalMs: 300_000 },
            })
          ).output,
    );
  let parsed: Direction;
  try {
    parsed = await attempt();
  } catch (e) {
    if (!isShapeFailure(e)) throw e;
    parsed = await attempt();
  }
  const missing = plan.segments.filter((s) => s.kind === "footage" && !parsed.segments.some((d) => d.id === s.id)).map((s) => s.id);
  if (missing.length) throw new AppError(502, `The director skipped scene ${missing.join(", ")}. Build the vision board again; nothing was charged for frames.`);
  return parsed;
}
