// Auto-check for AI-designed ads: a vision model reads the image and confirms the exact offer
// text and the logo. Flags only; regenerating is the owner's (paid) choice.
import { generateText, Output } from "ai";
import { z } from "zod";

export type AdCheck = { passed: boolean | null; issues: string[] };

// ponytail: model id is configurable; pick the cheapest vision model in the Gateway catalog.
const CHECK_MODEL = process.env.AD_CHECK_MODEL || "google/gemini-2.5-flash";
const verdict = z.object({
  items: z.array(z.object({ text: z.string(), exact: z.boolean(), seen: z.string().optional() })),
  logoOk: z.boolean(),
  logoNote: z.string().optional(),
  // Anything else that would stop a brand manager approving the ad.
  otherIssues: z.array(z.string()).default([]),
});

export async function checkAdImage(image: Buffer, required: string[], brandName: string, season?: string): Promise<AdCheck> {
  if (!required.length) return { passed: true, issues: [] };
  try {
    const result = await generateText({
      model: CHECK_MODEL,
      // Structured output; generous budget because flash models spend tokens thinking first.
      output: Output.object({ schema: verdict }),
      maxOutputTokens: 4000,
      timeout: { totalMs: 60_000 },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image },
            {
              type: "text",
              text: `You are proofreading a finished ${brandName} ad before it runs. For each REQUIRED string below, report whether it appears on the ad exactly (same words, numbers, $ signs, commas and dates; ignore letter case and line breaks). If not exact, put what the ad actually says in "seen". Also report whether the ${brandName} logo is present, legible and not distorted.
REQUIRED: ${JSON.stringify(required)}
Return one item per REQUIRED string.
Then list in otherIssues (short phrases, empty if none) ONLY these problems: text set in a non-sans-serif or decorative font (the brand allows only Franklin Gothic, a plain grotesque sans-serif); ${season ? `words naming a season other than ${season}; ` : ""}testimonials, quotes, star ratings or reviews; misspelled words; text or logo cut off by the image edge; more than one logo; a clearly visible logo, emblem, patch or lettering on a person's clothing or cap (plain colour trim, stripes, collars and cap brims are fine — only report an actual mark or words).`,
            },
          ],
        },
      ],
    });
    const parsed = result.output;
    const issues = [
      ...parsed.items.filter((i) => !i.exact).map((i) => `“${i.text}” ${i.seen ? `reads “${i.seen}”` : "is missing"}`),
      ...(parsed.logoOk ? [] : [`Logo problem${parsed.logoNote ? `: ${parsed.logoNote}` : ""}`]),
      ...parsed.otherIssues,
    ];
    return { passed: issues.length === 0, issues };
  } catch (e) {
    // A failed check never blocks the ad; it just can't vouch for it.
    return { passed: null, issues: [`Automatic check unavailable (${(e as Error).message.slice(0, 120)})`] };
  }
}
