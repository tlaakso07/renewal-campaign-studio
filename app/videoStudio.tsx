// Video & UGC studio: script → stills → clips → voice → build. Each paid step is confirmed and per-scene,
// so a bad scene is fixed alone. Footage carries no text; captions and the end card are exact.
import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Clapperboard, Film, ImageIcon, Lock, Mic, Play, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Header, Notice, Field, useApp } from "./ui";
import { api, go, media } from "./api";
import { BUTTONS, ContentForm, SizePicker, clean, recall, remember } from "./adStudio";
import { BriefStart, Checklist, FullBrief, PrintBrief, Storyboard } from "./storyboard";
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
  if (id && window.location.hash.split("/")[3] === "print") return <PrintBrief id={id} />;
  return id ? <PlanEditor key={id} id={id} /> : <PlanStart />;
}

function PlanStart() {
  const { run } = useApp();
  const [plans, setPlans] = useState<any[]>([]);
  const [style, setStyle] = useState<"commercial" | "ugc">("commercial");
  const [scenes, setScenes] = useState(6);
  const [formatSize, setFormat] = useState<Format>("portrait");
  const [busy, setBusy] = useState("");
  const [content, setContent] = useState<AdContent>(() => ({
    headline: "", cta: BUTTONS[0], tiers: [], ends: "", terms: "", legalApproved: false, photoAssetId: null, cutoutAssetId: null, photoFocusY: null, ...recall(),
  }));
  useEffect(() => {
    api("/video/plans").then(setPlans, () => {});
  }, []);
  const offer = clean(content);
  const startBrief = (format: string, terms: string, campaign: string) =>
    run(async () => {
      setBusy("brief");
      try {
        remember({ ...offer, terms, photoAssetId: null, cutoutAssetId: null });
        const p = await api("/video/plans", { write: "brief", format, campaign, content: { tiers: offer.tiers, ends: offer.ends, cta: offer.cta, terms }, aspect: ASPECT[formatSize] });
        go("video/" + p.id);
      } finally {
        setBusy("");
      }
    });
  const start = (write: "own" | "ai") =>
    run(async () => {
      setBusy(write);
      try {
        remember({ ...offer, photoAssetId: null, cutoutAssetId: null });
        const p = await api("/video/plans", { style, write, scenes, content: { tiers: offer.tiers, ends: offer.ends, cta: offer.cta }, targetSeconds: Math.min(45, Math.max(10, scenes * 3 + 3)), aspect: ASPECT[formatSize] });
        go("video/" + p.id);
      } finally {
        setBusy("");
      }
    });
  return (
    <>
      <Header title="Video & UGC" description="Write your scenes and script, approve the vision board, then generate. Nothing is spent on video until you approve every frame.">
        <a className="button" href="#/video-manual">
          Assemble my own footage
        </a>
      </Header>
      <div className="ad-studio">
        <section className="panel ad-studio-form">
          <h2>Style</h2>
          <div className="segmented wrap">
            <button type="button" className={style === "commercial" ? "selected" : ""} onClick={() => setStyle("commercial")}>
              <Film size={14} /> Commercial · voiceover
            </button>
            <button type="button" className={style === "ugc" ? "selected" : ""} onClick={() => setStyle("ugc")}>
              <Clapperboard size={14} /> UGC · talking to camera
            </button>
          </div>
          <h2>This month's offer</h2>
          <p className="caption">Shown on the closing offer card, exactly as typed.</p>
          <ContentForm layout="arch" content={content} onChange={setContent} showLegal={false} />
        </section>
        <section className="ad-studio-preview">
          <BriefStart content={offer} aspect={ASPECT[formatSize]} onStart={startBrief} busy={busy} />
          <div className="panel">
            <h3>Or write it yourself</h3>
            <Field label={`Scenes · about ${scenes * 3 + 3} seconds`}>
              <input type="range" min={3} max={10} value={scenes} onChange={(e) => setScenes(Number(e.target.value))} />
            </Field>
            <Field label="Size">
              <SizePicker value={formatSize} onChange={setFormat} />
            </Field>
            <button className="primary" disabled={!!busy} onClick={() => start("own")}>
              <Plus size={17} /> {busy === "own" ? "Opening…" : "Write my scenes"}
            </button>
            <button disabled={!!busy || !offer.tiers.length} onClick={() => start("ai")}>
              <Sparkles size={16} /> {busy === "ai" ? "Drafting…" : "Draft a script for me to edit"}
            </button>
            <p className="caption">Writing is free. A drafted script costs about a cent.</p>
          </div>
          {!!plans.length && (
            <div className="panel">
              <h3>Continue a video</h3>
              {plans.map((p) => (
                <a className="panel row" key={p.id} href={"#/video/" + p.id}>
                  <span>
                    {p.body.name}
                    <small>{p.body.script ? p.body.script.slice(0, 70) + "…" : "No script yet"}</small>
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
  const [captionStyle, setCaptionStyle] = useState<"headline" | "pill">("headline");
  const [offerBuild, setOfferBuild] = useState(true);
  const [busy, setBusy] = useState("");
  const timer = useRef<number | null>(null);
  // The latest plan the client has seen: every save rebases on it, and a late poll can never roll it back.
  const latest = useRef<any>(null);
  const show = (p: any) => {
    if (!p || (latest.current && latest.current.id === p.id && p.rev < latest.current.rev)) return;
    latest.current = p;
    setPlan(p);
  };
  const load = () => api("/video/plans/" + id).then(show);
  useEffect(() => {
    run(load);
    timer.current = window.setInterval(() => {
      const p = latest.current;
      if (p?.body.segments.some((s: any) => [s.stillJob, s.clipJob].some((j: any) => j && ["queued", "running"].includes(j.status)))) load();
    }, 4000);
    return () => clearInterval(timer.current!);
  }, [id]);
  // Edits are body transforms queued behind the save in flight, then applied to the returned plan and sent with its rev.
  // Nothing the client typed is lost and no stale rev is sent on purpose; a 409 reloads and replays the queue once.
  const queue = useRef<((body: any) => any)[]>([]);
  const saving = useRef(false);
  const flush = async (retried = false): Promise<void> => {
    if (saving.current || !queue.current.length) return;
    saving.current = true;
    setBusy("save");
    const fns = queue.current.splice(0);
    const base = latest.current;
    const strip = (s: any) => {
      const { stillJob, clipJob, stillQA, ...rest } = s;
      return rest;
    };
    const next = fns.reduce((b, fn) => fn(b), base.body);
    let conflict = false;
    try {
      show(await api("/video/plans/" + id, { body: { ...next, segments: next.segments.map(strip) }, expectedVersion: base.rev }, "PUT"));
    } catch (e) {
      await load().catch(() => {});
      conflict = !retried && /record changed/i.test((e as Error).message);
      if (conflict) queue.current.unshift(...fns);
      else throw e;
    } finally {
      saving.current = false;
      setBusy("");
    }
    if (queue.current.length) await flush(conflict);
  };
  const edit = (fn: (body: any) => any) => {
    queue.current.push(fn);
    run(flush);
  };
  if (!plan) return <div className="loading">Loading video…</div>;
  const body = plan.body;
  const ugc = body.style === "ugc";
  const segments: any[] = body.segments;
  const pool: string[] = boot.brand?.body.adPhotos?.scenes || [];
  const act = (label: string, fn: () => Promise<any>) =>
    run(async () => {
      setBusy(label);
      try {
        show(await fn());
      } catch (e) {
        // Partial progress (frames queued before the failure) must show, so the poll can pick it up.
        await load().catch(() => {});
        throw e;
      } finally {
        setBusy("");
      }
    });
  const editSegments = (fn: (segments: any[]) => any[]) => edit((b) => ({ ...b, segments: fn(b.segments) }));
  const editSegment = (sid: string, fn: (s: any) => any) => editSegments((all) => all.map((x) => (x.id === sid ? fn(x) : x)));
  const setShot = (sid: string, patch: object) => editSegment(sid, (x) => ({ ...x, shots: [{ ...x.shots[0], ...patch }, ...x.shots.slice(1)] }));
  const move = (i: number, d: number) =>
    editSegments((all) => {
      const next = [...all];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const addScene = () => editSegments((all) => [...all, { id: "s" + Date.now().toString(36), seconds: 3, line: "", setting: "", shots: [{ phrase: "", visual: "", camera: "static", source: "ai" }], stillAssetId: null, clipAssetId: null, stillJobId: null, clipJobId: null, approved: false, keyframePrompt: "", motionPrompt: "" }]);
  const paid = (text: React.ReactNode, fn: () => Promise<any>, label: string) => setConfirm({ text, go: () => (setConfirm(null), act(label, fn)) });
  const written = segments.every((s) => s.shots.some((x: any) => x.visual.trim()));
  const missingFrames = segments.filter((s) => !s.stillAssetId && !(s.stillJob && ["queued", "running"].includes(s.stillJob.status))).length;
  const framing = segments.some((s) => s.stillJob && ["queued", "running"].includes(s.stillJob.status));
  const allFramed = segments.every((s) => s.stillAssetId);
  const approved = segments.every((s) => s.approved);
  const brief = !!body.brief;
  // A brief already ends on its offer card; a hand-written plan gets the 3s logo card at build time.
  const total = segments.reduce((n, s) => n + s.seconds, 0) + (brief ? 0 : 3);
  const ready = approved && segments.every((s) => s.clipAssetId || s.stillAssetId) && (ugc || body.voiceAssetId);
  const failing = (plan.checks || []).filter((c: any) => !c.ok).length;
  const footage = segments.filter((s) => s.kind === "footage");
  const missingFootageFrames = footage.filter((s) => !s.stillAssetId && !(s.stillJob && ["queued", "running"].includes(s.stillJob.status))).length;
  const allFootageFramed = footage.every((s) => s.stillAssetId);
  const boardPanel = (
    <section className="panel">
      <h2>Storyboard</h2>
      <p className="caption">The brief, scene by scene. Edit any cell; the checklist re-runs on every change. Frames are built from your brand references and checked automatically. Cards are rendered exactly, never drawn by AI.</p>
      <Checklist checks={plan.checks} />
      <div className="actions">
        <button type="button" className="primary" disabled={!missingFootageFrames || !!busy || !!failing} onClick={() => paid(<>Build the vision board: <strong>{missingFootageFrames} frame{missingFootageFrames === 1 ? "" : "s"}</strong>, each a paid GPT Image request (re-tried up to 3 times if the automatic check rejects it), plus one prompt-writing request.</>, () => api(`/video/plans/${id}/board`, { confirmBillable: true }), "board")}>
          <Sparkles size={16} /> {failing ? `Fix ${failing} check${failing === 1 ? "" : "s"} first` : busy === "board" ? "Writing shot prompts…" : framing ? "Building frames…" : allFootageFramed ? "Board complete" : `Build vision board (${missingFootageFrames})`}
        </button>
        <button type="button" disabled={!allFootageFramed || approved || !!busy} onClick={() => act("approve", () => api(`/video/plans/${id}/approve`, {}))}><Check size={16} /> Approve all</button>
        <a className="button" href={`#/video/${id}/print`}>Print brief</a>
      </div>
      <Storyboard plan={plan} busy={busy} blocked={failing} pool={pool} onEdit={editSegment}
        onApprove={(s) => act("approve", () => api(`/video/plans/${id}/approve`, { segmentId: s.id, approved: !s.approved }))}
        onRedo={(s) => paid(<>Redo the frame for this scene: <strong>1 paid GPT Image request</strong> (up to 3 attempts).</>, () => api(`/video/plans/${id}/still`, { segmentId: s.id, key: crypto.randomUUID(), confirmBillable: true }), "still")}
        onPhoto={(s, assetId) => act("still", () => api(`/video/plans/${id}/brand-still`, { segmentId: s.id, assetId }))} />
      <details className="full-brief-toggle"><summary>Show full brief</summary><FullBrief plan={plan} /></details>
    </section>
  );
  if (brief)
    return (
      <>
        <Header title={body.name} description={`${ugc ? "UGC" : "Commercial"} · ${segments.length} scenes · ${total}s · ${body.aspect}`}>
          <a className="button" href="#/video">All videos</a>
        </Header>
        {confirm && <Confirm text={confirm.text} onYes={confirm.go} onNo={() => setConfirm(null)} />}
        <div className="video-steps">
          {boardPanel}
          <section className="panel locked">
            <h2><Lock size={16} /> Production</h2>
            <p className="caption">Production (voice, animation, build) is the next phase for brief-written videos. Approve the board now; nothing else is spent until then.</p>
          </section>
        </div>
      </>
    );
  return (
    <>
      <Header title={body.name} description={`${ugc ? "UGC" : "Commercial"} · ${segments.length} scenes · about ${Math.round(total)}s · ${body.aspect}`}>
        <a className="button" href="#/video">
          All videos
        </a>
      </Header>
      {confirm && <Confirm text={confirm.text} onYes={confirm.go} onNo={() => setConfirm(null)} />}
      <div className="video-steps">
        <section className="panel">
          <h2>1 · Scenes & script</h2>
          <p className="caption">Write each scene: what we see, and the exact words said over it. Your words are used word for word — as the voiceover and the on-screen captions.</p>
          {ugc && (
            <Field label="Presenter (who is talking, where)">
              <input defaultValue={body.presenter} onBlur={(e) => e.target.value !== body.presenter && edit((b) => ({ ...b, presenter: e.target.value }))} />
            </Field>
          )}
          <ol className="scene-list">
            {segments.map((s, i) => (
              <li className="scene-row" key={s.id}>
                <div className="scene-number">
                  <strong>{i + 1}</strong>
                  <small>{s.seconds}s</small>
                  <button type="button" aria-label={`Move scene ${i + 1} up`} disabled={!i || !!busy} onClick={() => move(i, -1)}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" aria-label={`Move scene ${i + 1} down`} disabled={i === segments.length - 1 || !!busy} onClick={() => move(i, 1)}>
                    <ArrowDown size={14} />
                  </button>
                </div>
                <Field label="What we see">
                  <textarea rows={3} key={s.id + s.shots[0].visual} defaultValue={s.shots[0].visual} placeholder="e.g. Our crew carries a new white window up the front steps of a brick home on a grey fall morning" onBlur={(e) => e.target.value !== s.shots[0].visual && setShot(s.id, { visual: e.target.value })} />
                </Field>
                <Field label="What is said — word for word">
                  <textarea rows={3} key={s.id + s.shots[0].phrase} defaultValue={s.shots[0].phrase} placeholder="e.g. Drafty windows? We can fix that this week." onBlur={(e) => e.target.value !== s.shots[0].phrase && setShot(s.id, { phrase: e.target.value })} />
                </Field>
                <button type="button" aria-label={`Delete scene ${i + 1}`} disabled={segments.length < 2 || !!busy} onClick={() => editSegments((all) => all.filter((x) => x.id !== s.id))}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ol>
          <div className="actions">
            <button type="button" disabled={segments.length >= 12 || !!busy} onClick={addScene}>
              <Plus size={15} /> Add scene
            </button>
            <span className="caption">
              {body.script ? body.script.split(/\s+/).filter(Boolean).length : 0} words · about {Math.round(total)} seconds with the closing card
            </span>
          </div>
        </section>

        <section className="panel">
          <h2>2 · Vision board</h2>
          <p className="caption">One frame per scene, built with your brand references and checked automatically. Approve every frame before any video is made — a frame costs cents, a video clip costs dollars.</p>
          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={!written || !missingFrames || !!busy}
              onClick={() => paid(<>Build the vision board: <strong>{missingFrames} frame{missingFrames === 1 ? "" : "s"}</strong>, each a paid GPT Image request (re-tried up to 3 times if the automatic check rejects it), plus one small prompt-writing request.</>, () => api(`/video/plans/${id}/board`, { confirmBillable: true }), "board")}
            >
              <Sparkles size={16} /> {busy === "board" ? "Writing shot prompts…" : framing ? "Building frames…" : allFramed ? "Board complete" : `Build vision board (${missingFrames})`}
            </button>
            <button type="button" disabled={!allFramed || approved || !!busy} onClick={() => act("approve", () => api(`/video/plans/${id}/approve`, {}))}>
              <Check size={16} /> Approve all
            </button>
            {!written && <span className="caption">Describe what we see in every scene first.</span>}
          </div>
          <div className="board">
            {segments.map((s, i) => (
              <figure className={"board-frame" + (s.approved ? " approved" : "")} key={s.id}>
                {s.stillAssetId ? <img src={media(s.stillAssetId)} alt={`Scene ${i + 1} frame`} /> : <div className="scene-empty">{s.stillJob && ["queued", "running"].includes(s.stillJob.status) ? "Building…" : <ImageIcon size={22} />}</div>}
                <figcaption>
                  <strong>
                    {i + 1}. {s.line || <em>No words</em>}
                  </strong>
                  <small>{s.shots[0].visual}</small>
                  {s.stillJob?.status === "failed" && <span className="error-text">{s.stillJob.error}</span>}
                  {s.stillQA && !s.stillQA.passed && s.stillQA.issues?.[0] && (
                    <span className="ad-flag" title={s.stillQA.issues.map((x: any) => x.problem).join("\n")}>
                      Check: {s.stillQA.issues[0].problem.slice(0, 110)}
                    </span>
                  )}
                  <div className="ai-actions">
                    <button type="button" className={s.approved ? "" : "primary"} disabled={!s.stillAssetId || !!busy} onClick={() => act("approve", () => api(`/video/plans/${id}/approve`, { segmentId: s.id, approved: !s.approved }))}>
                      <Check size={14} /> {s.approved ? "Approved" : "Approve"}
                    </button>
                    <button type="button" disabled={!!busy || !s.shots[0].visual.trim()} onClick={() => paid(<>Redo the frame for scene {i + 1}: <strong>1 paid GPT Image request</strong> (up to 3 attempts).</>, () => api(`/video/plans/${id}/still`, { segmentId: s.id, key: crypto.randomUUID(), confirmBillable: true }), "still")}>
                      <RefreshCw size={14} /> Redo
                    </button>
                    <select aria-label={`Use a brand photo for scene ${i + 1}`} value="" onChange={(e) => e.target.value && act("still", () => api(`/video/plans/${id}/brand-still`, { segmentId: s.id, assetId: e.target.value }))}>
                      <option value="">Use my photo…</option>
                      {pool.map((p, n) => (
                        <option key={p} value={p}>
                          Brand photo {n + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={"panel" + (approved ? "" : " locked")}>
          <h2>
            {!approved && <Lock size={16} />} 3 · Generate video
          </h2>
          <p className="caption">{approved ? `Each approved frame becomes its own ${ugc ? "talking" : ""} clip. Redo one without touching the others.` : "Locked until every scene on the vision board is approved."}</p>
          {approved && (
            <div className="scene-grid">
              {segments.filter((s) => s.kind === "footage").map((s, i) => (
                <div className="scene-card" key={s.id}>
                  {s.clipAssetId ? <video src={`/api/assets/${s.clipAssetId}/play`} controls muted={!ugc} playsInline /> : <div className="scene-empty">{s.clipJob ? `Clip ${s.clipJob.status}…` : <Film size={22} />}</div>}
                  {s.clipJob?.status === "failed" && <p className="error-text">{s.clipJob.error}</p>}
                  <div className="ai-actions">
                    <button type="button" disabled={!!busy} onClick={() => paid(<>Animate scene {i + 1}: <strong>1 paid Seedance 2.5 video</strong> ({Math.max(4, Math.ceil(s.seconds))}s, 720p).</>, () => api(`/video/plans/${id}/clip`, { segmentId: s.id, key: crypto.randomUUID(), confirmBillable: true }), "clip")}>
                      {s.clipAssetId ? <RefreshCw size={14} /> : <Play size={14} />} {s.clipAssetId ? "Redo clip" : `Animate scene ${i + 1}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!ugc && (
          <section className={"panel" + (approved ? "" : " locked")}>
            <h2>4 · Voiceover</h2>
            <p className="caption">Your script, read word for word in one take. Its timing drives the captions and cuts.</p>
            <div className="actions">
              <select aria-label="Voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
                {VOICES.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="button" disabled={!!busy || !body.script} onClick={() => paid(<>Record the voiceover: <strong>1 paid text-to-speech request</strong> plus a timing pass (a few cents).</>, () => api(`/video/plans/${id}/voice`, { voice, confirmBillable: true }), "voice")}>
                <Mic size={15} /> {busy === "voice" ? "Recording…" : body.voiceAssetId ? "Re-record" : "Record voiceover"}
              </button>
            </div>
            {body.voiceAssetId && <audio controls src={`/api/assets/${body.voiceAssetId}/play`} />}
          </section>
        )}

        <section className={"panel" + (ready ? "" : " locked")}>
          <h2>{ugc ? 4 : 5} · Build the ad</h2>
          <p className="caption">Stitches your scenes, adds your words as captions, the offer and your logo, then opens the editor to render the MP4.</p>
          <Field label="On-screen text">
            <div className="segmented wrap">
              <button type="button" className={captionStyle === "headline" ? "selected" : ""} onClick={() => setCaptionStyle("headline")}>
                Scene headline · bold white, top
              </button>
              <button type="button" className={captionStyle === "pill" ? "selected" : ""} onClick={() => setCaptionStyle("pill")}>
                Caption pills · brand colour, synced to voice
              </button>
            </div>
          </Field>
          <label className="check-row">
            <input type="checkbox" checked={offerBuild} onChange={(e) => setOfferBuild(e.target.checked)} />
            Close with the offer card (builds line by line under your logo, with fine print)
          </label>
          <button
            className="primary"
            disabled={!ready || !!busy}
            onClick={() =>
              run(async () => {
                const c = await api(`/video/plans/${id}/build`, { endCard: "logo", captionStyle, offerBuild });
                await refresh();
                go("video-manual/" + c.id);
              })
            }
          >
            <Check size={16} /> Build video
          </button>
        </section>
      </div>
    </>
  );
}
