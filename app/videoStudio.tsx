// Video & UGC studio: script → stills → clips → voice → build. Each paid step is confirmed and per-scene,
// so a bad scene is fixed alone. Footage carries no text; captions and the end card are exact.
import React, { useEffect, useRef, useState } from "react";
import { Check, Clapperboard, Film, ImageIcon, Mic, Play, RefreshCw, Sparkles } from "lucide-react";
import { Header, Notice, Field, useApp } from "./ui";
import { api, go, media } from "./api";
import { BUTTONS, ContentForm, SizePicker, clean, recall, remember } from "./adStudio";
import type { AdContent, CreativeDoc } from "../server/types";

type Format = CreativeDoc["format"];
const ASPECT: Record<Format, "1:1" | "4:5" | "9:16"> = { square: "1:1", portrait: "4:5", vertical: "9:16" };
const VOICES = [
  ["default", "Warm, confident (male)"],
  ["bright", "Bright, friendly (female)"],
  ["calm", "Calm, neutral"],
];

function Confirm({ text, onYes, onNo }: { text: React.ReactNode; onYes: () => void; onNo: () => void }) {
  return (
    <div className="confirm-paid" role="alertdialog" aria-label="Confirm paid generation">
      <p>{text}</p>
      <div className="actions">
        <button type="button" onClick={onNo}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={onYes}>
          Generate (paid)
        </button>
      </div>
    </div>
  );
}

export function VideoStudio({ id }: { id?: string }) {
  return id ? <PlanEditor key={id} id={id} /> : <PlanStart />;
}

function PlanStart() {
  const { run } = useApp();
  const [plans, setPlans] = useState<any[]>([]);
  const [style, setStyle] = useState<"commercial" | "ugc">("commercial");
  const [seconds, setSeconds] = useState(15);
  const [format, setFormat] = useState<Format>("portrait");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState<AdContent>(() => ({
    headline: "", cta: BUTTONS[0], tiers: [], ends: "", terms: "", legalApproved: false, photoAssetId: null, cutoutAssetId: null, photoFocusY: null, ...recall(),
  }));
  useEffect(() => {
    api("/video/plans").then(setPlans, () => {});
  }, []);
  const offer = clean(content);
  return (
    <>
      <Header title="Video & UGC" description="Write the script first, lock each scene's look, then animate scene by scene. Captions and the end card are always exact.">
        <a className="button" href="#/video-manual">
          Assemble my own footage
        </a>
      </Header>
      <div className="ad-studio">
        <section className="panel ad-studio-form">
          <h2>Style</h2>
          <div className="segmented wrap">
            <button type="button" className={style === "commercial" ? "selected" : ""} onClick={() => setStyle("commercial")}>
              <Film size={14} /> Voiceover commercial
            </button>
            <button type="button" className={style === "ugc" ? "selected" : ""} onClick={() => setStyle("ugc")}>
              <Clapperboard size={14} /> UGC · talking to camera
            </button>
          </div>
          <h2>Offer</h2>
          <ContentForm layout="arch" content={content} onChange={setContent} showLegal={false} />
          <Field label="Custom instructions (optional)">
            <textarea rows={3} maxLength={2000} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Open on a cold, drafty living room; end on a happy family" />
          </Field>
        </section>
        <section className="ad-studio-preview">
          <div className="panel">
            <Field label="Length">
              <div className="segmented">
                {[15, 20, 30].map((n) => (
                  <button key={n} type="button" className={seconds === n ? "selected" : ""} onClick={() => setSeconds(n)}>
                    {n}s
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Size">
              <SizePicker value={format} onChange={setFormat} />
            </Field>
            <button
              className="primary"
              disabled={busy || !offer.tiers.length}
              onClick={() =>
                run(async () => {
                  setBusy(true);
                  try {
                    remember({ ...offer, photoAssetId: null, cutoutAssetId: null });
                    const p = await api("/video/plans", { style, content: { tiers: offer.tiers, ends: offer.ends, cta: offer.cta }, targetSeconds: seconds, aspect: ASPECT[format], instructions });
                    go("video/" + p.id);
                  } finally {
                    setBusy(false);
                  }
                })
              }
            >
              <Sparkles size={17} /> {busy ? "Writing script…" : "Write script"}
            </button>
            {!offer.tiers.length && <p className="caption">Add at least one offer.</p>}
            <p className="caption">Writing the script costs a fraction of a cent. Nothing else is generated until you approve it.</p>
          </div>
          {!!plans.length && (
            <div className="panel">
              <h3>Continue a video</h3>
              {plans.map((p) => (
                <a className="panel row" key={p.id} href={"#/video/" + p.id}>
                  <span>
                    {p.body.name}
                    <small>{p.body.script.slice(0, 70)}…</small>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function PlanEditor({ id }: { id: string }) {
  const { boot, run, refresh } = useApp();
  const [plan, setPlan] = useState<any>(null);
  const [confirm, setConfirm] = useState<{ text: React.ReactNode; go: () => void } | null>(null);
  const [voice, setVoice] = useState("default");
  const [busy, setBusy] = useState("");
  const timer = useRef<number | null>(null);
  const load = () => api("/video/plans/" + id).then(setPlan);
  useEffect(() => {
    run(load);
    // Poll while any scene job is running.
    timer.current = window.setInterval(() => {
      setPlan((p: any) => {
        if (p?.body.segments.some((s: any) => [s.stillJob, s.clipJob].some((j: any) => j && ["queued", "running"].includes(j.status)))) load();
        return p;
      });
    }, 4000);
    return () => clearInterval(timer.current!);
  }, [id]);
  if (!plan) return <div className="loading">Loading video…</div>;
  const body = plan.body;
  const ugc = body.style === "ugc";
  const pool: string[] = boot.brand?.body.adPhotos?.scenes || [];
  const act = (label: string, fn: () => Promise<any>) =>
    run(async () => {
      setBusy(label);
      try {
        setPlan(await fn());
      } finally {
        setBusy("");
      }
    });
  const saveSegments = (segments: any[]) => act("save", () => api("/video/plans/" + id, { body: { ...body, segments }, expectedVersion: plan.rev }, "PUT"));
  const paid = (text: React.ReactNode, fn: () => Promise<any>, label: string) => setConfirm({ text, go: () => (setConfirm(null), act(label, fn)) });
  const ready = body.segments.every((s: any) => s.clipAssetId || s.stillAssetId) && (ugc || body.voiceAssetId);
  return (
    <>
      <Header title={body.name} description={`${ugc ? "UGC" : "Voiceover commercial"} · ${body.targetSeconds}s · ${body.aspect}`}>
        <a className="button" href="#/video">
          All videos
        </a>
      </Header>
      {confirm && <Confirm text={confirm.text} onYes={confirm.go} onNo={() => setConfirm(null)} />}
      <div className="video-steps">
        <section className="panel">
          <h2>1 · Script</h2>
          <p className="caption">Edit any phrase or shot. Each phrase becomes a caption and a cut. Changing a scene's shots clears its clip.</p>
          {ugc && body.presenter && <Notice>Presenter: {body.presenter}</Notice>}
          {body.segments.map((s: any, si: number) => (
            <fieldset className="tier-editor" key={s.id}>
              <legend>
                Scene {si + 1} · {s.seconds}s · {s.setting}
              </legend>
              {s.shots.map((shot: any, i: number) => (
                <div className="shot-row" key={i}>
                  <input
                    aria-label={`Scene ${si + 1} shot ${i + 1} phrase`}
                    defaultValue={shot.phrase}
                    onBlur={(e) => e.target.value !== shot.phrase && saveSegments(body.segments.map((x: any) => (x.id === s.id ? { ...x, shots: x.shots.map((y: any, j: number) => (j === i ? { ...y, phrase: e.target.value } : y)) } : x)))}
                  />
                  <input
                    aria-label={`Scene ${si + 1} shot ${i + 1} visual`}
                    defaultValue={shot.visual}
                    onBlur={(e) => e.target.value !== shot.visual && saveSegments(body.segments.map((x: any) => (x.id === s.id ? { ...x, shots: x.shots.map((y: any, j: number) => (j === i ? { ...y, visual: e.target.value } : y)) } : x)))}
                  />
                </div>
              ))}
            </fieldset>
          ))}
        </section>

        <section className="panel">
          <h2>2 · Scene stills</h2>
          <p className="caption">Lock each scene's look for about 8¢ before spending on video. Or use one of your real photos.</p>
          <div className="scene-grid">
            {body.segments.map((s: any, si: number) => (
              <div className="scene-card" key={s.id}>
                {s.stillAssetId ? <img src={media(s.stillAssetId)} alt={`Scene ${si + 1} still`} /> : <div className="scene-empty">{s.stillJob ? `Still ${s.stillJob.status}…` : <ImageIcon size={22} />}</div>}
                {s.stillJob?.status === "failed" && <p className="error-text">{s.stillJob.error}</p>}
                <div className="ai-actions">
                  <button type="button" disabled={!!busy} onClick={() => paid(<>Generate the still for scene {si + 1}: <strong>1 paid GPT Image request</strong>.</>, () => api(`/video/plans/${id}/still`, { segmentId: s.id, key: crypto.randomUUID(), confirmBillable: true }), "still")}>
                    {s.stillAssetId ? <RefreshCw size={14} /> : <Sparkles size={14} />} {s.stillAssetId ? "Redo" : "Generate"}
                  </button>
                  <select aria-label={`Use a brand photo for scene ${si + 1}`} value="" onChange={(e) => e.target.value && act("still", () => api(`/video/plans/${id}/brand-still`, { segmentId: s.id, assetId: e.target.value }))}>
                    <option value="">Use brand photo…</option>
                    {pool.map((p, i) => (
                      <option key={p} value={p}>
                        Brand photo {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>3 · Animate scenes</h2>
          <p className="caption">Each scene is its own {ugc ? "talking" : "silent b-roll"} clip from its still. Redo one without touching the others.</p>
          <div className="scene-grid">
            {body.segments.map((s: any, si: number) => (
              <div className="scene-card" key={s.id}>
                {s.clipAssetId ? <video src={`/api/assets/${s.clipAssetId}/play`} controls muted={!ugc} playsInline /> : <div className="scene-empty">{s.clipJob ? `Clip ${s.clipJob.status}…` : <Film size={22} />}</div>}
                {s.clipJob?.status === "failed" && <p className="error-text">{s.clipJob.error}</p>}
                <div className="ai-actions">
                  <button type="button" disabled={!!busy || !s.stillAssetId} onClick={() => paid(<>Animate scene {si + 1}: <strong>1 paid Seedance 2.5 video</strong> ({Math.ceil(s.seconds)}s, 720p). Video costs much more than a still.</>, () => api(`/video/plans/${id}/clip`, { segmentId: s.id, key: crypto.randomUUID(), confirmBillable: true }), "clip")}>
                    {s.clipAssetId ? <RefreshCw size={14} /> : <Play size={14} />} {s.clipAssetId ? "Redo clip" : "Animate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {!ugc && (
          <section className="panel">
            <h2>4 · Voiceover</h2>
            <p className="caption">One take for the whole script, so the voice never changes between scenes. Its timing drives the captions and cuts.</p>
            <div className="actions">
              <select aria-label="Voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
                {VOICES.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="button" disabled={!!busy} onClick={() => paid(<>Record the voiceover: <strong>1 paid text-to-speech request</strong> plus a timing pass (a few cents).</>, () => api(`/video/plans/${id}/voice`, { voice, confirmBillable: true }), "voice")}>
                <Mic size={15} /> {busy === "voice" ? "Recording…" : body.voiceAssetId ? "Re-record" : "Record voiceover"}
              </button>
            </div>
            {body.voiceAssetId && <audio controls src={`/api/assets/${body.voiceAssetId}/play`} />}
          </section>
        )}

        <section className="panel">
          <h2>{ugc ? 4 : 5} · Build video</h2>
          <p className="caption">Stitches the scenes, adds green caption pills synced to the voice, and ends on your logo. Opens in the editor to render the MP4.</p>
          <button
            className="primary"
            disabled={!ready || !!busy}
            onClick={() =>
              run(async () => {
                const c = await api(`/video/plans/${id}/build`, { endCard: "logo" });
                await refresh();
                go("video-manual/" + c.id);
              })
            }
          >
            <Check size={16} /> Build video
          </button>
          {!ready && <p className="caption">Every scene needs a still or clip{ugc ? "" : ", and the voiceover must be recorded"}.</p>}
        </section>
      </div>
    </>
  );
}
