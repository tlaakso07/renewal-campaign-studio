import { check } from "./db.ts";

const cuePattern =
  /^(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2})[.,](\d{3})(?:\s+.*)?$/;

function seconds(parts: string[]) {
  return (
    Number(parts[0]) * 3600 +
    Number(parts[1]) * 60 +
    Number(parts[2]) +
    Number(parts[3]) / 1000
  );
}

export function srtToWebVtt(input: string) {
  const normalized = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
    .trim();
  return `WEBVTT\n\n${normalized}\n`;
}

export function validateWebVtt(input: unknown, duration?: number) {
  const text = String(input || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  check(text.length <= 100_000, "Caption file is too large");
  check(/^WEBVTT(?:\s|$)/.test(text), "Timed captions must start with WEBVTT");
  const cues = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("-->"));
  check(cues.length > 0, "Timed captions need at least one cue");
  let lastStart = -1;
  for (const cue of cues) {
    const match = cue.match(cuePattern);
    check(match, "Use WebVTT cue times like 00:00:00.000 --> 00:00:03.000");
    const start = seconds(match.slice(1, 5));
    const end = seconds(match.slice(5, 9));
    check(
      start >= lastStart && end > start,
      "Caption cue times must be ordered",
    );
    if (Number.isFinite(duration))
      check(
        end <= Number(duration) + 0.25,
        "Caption cues exceed the video duration",
      );
    lastStart = start;
  }
  return `${text}\n`;
}
