// Frame inspector: a strict vision pass on every AI keyframe before anyone sees it (or pays to animate it).
// Clients should never have to spot a six-fingered hand or a redrawn logo themselves.
import { generateText, Output } from "ai";
import { z } from "zod";

// Tried in order: a provider refusing one model ("no access at this time") must not switch quality control off.
export const QA_MODELS = (process.env.FRAME_QA_MODEL || "anthropic/claude-opus-5,anthropic/claude-sonnet-5,google/gemini-3-pro-preview,openai/gpt-5.5").split(",");
const verdictSchema = z.object({
  issues: z.array(
    z.object({
      severity: z.enum(["blocker", "minor"]),
      area: z.string(), // where in the frame
      problem: z.string(), // what is wrong, concretely
      fix: z.string(), // an instruction for the next generation attempt
    }),
  ),
});
export type FrameVerdict = { passed: boolean; issues: z.infer<typeof verdictSchema>["issues"] };

const SYSTEM = `You are the final quality inspector at a commercial production house. A frame only ships if a skeptical creative director, zooming in, would find nothing wrong. You are paid to find faults, not to be agreeable. Inspect methodically, region by region, and report every defect. Do not report stylistic preferences — only things that are physically wrong, off-brand, or that reveal the image as AI-generated.`;

const CHECKLIST = `Inspect the FIRST image (the generated frame). Any further images are REAL reference photos of the client's vehicle, uniform and product: compare against them.

1. HANDS AND GRIP — for every visible hand: five fingers, natural joints. For every held object: is the hand gripping a real part of the object in a way a person actually would? Flag any invented handle, stub, extension, floating or fused grip, or an object that could not be carried the way it is shown.
2. OBJECT GEOMETRY — windows, doors, tools, vehicles: consistent perspective, complete rectangular frames, no extra or missing parts, no pieces protruding that the real product does not have (compare with the product reference).
3. BODIES AND FACES — limb count, proportions, feet on the ground, plausible posture and balance for the action, no warped faces or ears, eyes not looking at the camera.
4. BRANDING FIDELITY — compare every logo with the references: wording spelled exactly, artwork matching (figure pose and orientation, window icon, triangle), correct colours, not tilted, mirrored, redrawn or simplified. Vehicle livery layout must match the reference. Uniform must follow the uniform rule given below. No invented logos or lettering anywhere else.
5. TEXT — any gibberish or misspelled text anywhere (stickers, signs, plates) is a blocker unless too small to read.
6. PHYSICAL WORLD — architecture makes sense, shadows and reflections agree with the light, nothing merges into anything else.
7. AI TELLS — plastic skin, glow or bloom, over-saturated colour, repeating textures, smeared detail.

Severity: "blocker" = a viewer or the client would notice, or the brand is misrepresented. "minor" = only visible on close inspection. For each issue write a precise "fix" sentence that could be appended to the image prompt to prevent it next time. If the frame is genuinely clean, return an empty list.`;

export type QADependencies = { inspect?: (frame: Buffer, references: Buffer[], context: string) => Promise<FrameVerdict> };

export async function inspectFrame(frame: Buffer, references: Buffer[], context: string): Promise<FrameVerdict> {
  let result: Awaited<ReturnType<typeof ask>> | null = null,
    lastError: unknown;
  for (const model of QA_MODELS) {
    try {
      result = await ask(model, frame, references, context);
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!result) throw lastError;
  const issues = result.output.issues;
  return { passed: !issues.some((i) => i.severity === "blocker"), issues };
}
function ask(model: string, frame: Buffer, references: Buffer[], context: string) {
  return generateText({
    model,
    maxRetries: 1,
    system: SYSTEM,
    output: Output.object({ schema: verdictSchema }),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
    maxOutputTokens: 3000,
    timeout: { totalMs: 120_000 },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: frame },
          ...references.map((image) => ({ type: "image" as const, image })),
          { type: "text", text: `${CHECKLIST}\n\nCONTEXT AND BRAND RULES FOR THIS FRAME:\n${context}` },
        ],
      },
    ],
  });
}
