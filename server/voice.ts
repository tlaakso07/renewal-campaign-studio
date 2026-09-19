// Voiceover for commercial videos: one TTS take for the whole script (consistent voice), then word
// timestamps from a transcription pass drive both the caption pills and the shot cut points.
import { experimental_generateSpeech as generateSpeech, experimental_transcribe as transcribe } from "ai";
import { gateway } from "@ai-sdk/gateway";

export const VOICES = {
  // ponytail: three curated voices; add more once the client picks a favourite.
  default: { model: "openai/tts-1-hd", voice: "onyx", label: "Warm, confident (male)" },
  bright: { model: "openai/tts-1-hd", voice: "nova", label: "Bright, friendly (female)" },
  calm: { model: "openai/tts-1-hd", voice: "alloy", label: "Calm, neutral" },
} as const;
export type VoiceKey = keyof typeof VOICES;
export type Word = { word: string; start: number; end: number };

export async function speak(script: string, voiceKey: string) {
  const v = VOICES[(voiceKey in VOICES ? voiceKey : "default") as VoiceKey];
  const result = await generateSpeech({ model: gateway.speechModel(v.model), text: script, voice: v.voice, outputFormat: "mp3" });
  return { bytes: Buffer.from(result.audio.uint8Array), model: v.model, voice: v.voice };
}

export async function wordTimes(audio: Buffer): Promise<{ words: Word[]; duration: number | null }> {
  const result = await transcribe({
    model: gateway.transcriptionModel(process.env.VOICE_TIMING_MODEL || "openai/whisper-1"),
    audio,
    providerOptions: { openai: { timestampGranularities: ["word"] } },
  });
  return {
    words: result.segments.map((s) => ({ word: s.text.trim(), start: s.startSecond, end: s.endSecond })).filter((w) => w.word),
    duration: result.durationInSeconds ?? null,
  };
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9$]/g, "");
// Spread the script's words evenly over a duration; used when no usable timestamps exist.
export function evenWords(script: string, duration: number): Word[] {
  const words = script.split(/\s+/).filter(Boolean);
  const total = words.reduce((n, w) => n + w.length + 2, 0);
  let t = 0;
  return words.map((word) => {
    const d = ((word.length + 2) / total) * duration;
    const out = { word, start: t, end: t + d };
    t += d;
    return out;
  });
}
// Time for each script word. Transcripts rarely match word-for-word ($1,000 → "one thousand dollars"),
// so timestamps anchor the overall pace and the script's own words keep their exact spelling.
export function alignWords(script: string, heard: Word[], duration: number): Word[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (heard.length < 3) return evenWords(script, duration);
  const start = heard[0].start,
    end = heard.at(-1)!.end;
  const base = evenWords(script, end - start).map((w) => ({ ...w, start: w.start + start, end: w.end + start }));
  // Snap to exact matches where the transcript agrees, scanning forward only.
  let j = 0;
  for (const w of base) {
    const hit = heard.slice(j, j + 6).findIndex((h) => norm(h.word) === norm(w.word) && norm(w.word).length > 1);
    if (hit >= 0) {
      const h = heard[j + hit];
      w.start = h.start;
      w.end = h.end;
      j += hit + 1;
    }
  }
  // Keep times monotonic after snapping.
  for (let i = 1; i < base.length; i++) {
    if (base[i].start < base[i - 1].start) base[i].start = base[i - 1].end;
    if (base[i].end <= base[i].start) base[i].end = base[i].start + 0.12;
  }
  return base;
}
// Caption pills: 2–3 words at a time, breaking at punctuation, one on screen at a time.
export function captionChunks(words: Word[], maxWords = 3, maxChars = 22) {
  const out: { start: number; end: number; text: string }[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({ start: cur[0].start, end: cur.at(-1)!.end, text: cur.map((w) => w.word).join(" ") });
    cur = [];
  };
  for (const w of words) {
    const text = [...cur, w].map((x) => x.word).join(" ");
    if (cur.length && (cur.length >= maxWords || text.length > maxChars)) flush();
    cur.push(w);
    if (/[.,!?;:]$/.test(w.word)) flush();
  }
  flush();
  // Hold each pill until the next begins so captions never flicker.
  out.forEach((c, i) => (c.end = out[i + 1] ? Math.max(c.end, Math.min(out[i + 1].start, c.end + 0.6)) : c.end + 0.3));
  return out;
}
