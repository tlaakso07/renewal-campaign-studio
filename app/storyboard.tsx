// The production brief as the client sees it (product/VIDEO-BRIEF-STANDARD.md): the agency's five-column storyboard
// with a frame per scene, the Editor Checklist as live ticks, the full brief behind one control, and a print page.
import React, { useEffect, useState } from "react";
import { Check, ImageIcon, RefreshCw, X } from "lucide-react";
import { Field } from "./ui";
import { api, media } from "./api";

const tc = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const timecodes = (segments: { seconds: number }[]) => {
  let t = 0;
  return segments.map((s) => { const start = t; t += s.seconds; return `${tc(start)} - ${tc(t)}`; });
};
// The camera cell is edited as one line, "Slow push in | 50mm eye-level", the way the agency writes it.
export const cameraText = (c: any) => (c ? `${c.move} | ${c.lens} ${c.angle}`.trim() : "");
export const parseCamera = (text: string, prev: any) => {
  const [move = "", rest = ""] = text.split("|").map((x) => x.trim());
  const [lens = prev?.lens || "", ...angle] = rest.split(/\s+/).filter(Boolean);
  return { move: move || prev?.move || "static", lens, angle: angle.join(" ") || prev?.angle || "", size: prev?.size || "medium" };
};

export function Checklist({ checks }: { checks: any[] }) {
  if (!checks?.length) return null;
  const failed = checks.filter((c) => !c.ok);
  return (
    <details className="checklist" open={!!failed.length}>
      <summary>
        Editor checklist · {failed.length ? <span className="error-text">{failed.length} to fix</span> : <span className="ok-text">all {checks.length} pass</span>}
      </summary>
      <ul>
        {checks.map((c) => (
          <li key={c.id} className={c.ok ? "ok" : "fail"}>
            {c.ok ? <Check size={13} /> : <X size={13} />} {c.name}
            {!c.ok && <small>{c.detail}</small>}
          </li>
        ))}
      </ul>
    </details>
  );
}

type Row = { s: any; i: number };
export function Storyboard({ plan, busy, onSave, onApprove, onRedo, onPhoto, pool }: { plan: any; busy: string; onSave: (segments: any[]) => void; onApprove: (s: any) => void; onRedo: (s: any) => void; onPhoto: (s: any, assetId: string) => void; pool: string[] }) {
  const segments: any[] = plan.body.segments;
  const times = timecodes(segments);
  const patch = (id: string, fn: (s: any) => any) => onSave(segments.map((x) => (x.id === id ? fn(x) : x)));
  const cell = (s: any, key: string, value: string, apply: (v: string) => any, rows = 3) => (
    <textarea rows={rows} key={s.id + key + value} defaultValue={value} onBlur={(e) => e.target.value !== value && patch(s.id, (x) => ({ ...x, ...apply(e.target.value) }))} />
  );
  return (
    <div className="storyboard">
      <div className="storyboard-head">
        <span>Scene / Time</span><span>Visual / Action</span><span>VO / Script</span><span>Camera / Motion</span><span>Editor notes</span>
      </div>
      {segments.map((s, i) => (
        <div className={"storyboard-row" + (s.key ? " key" : "") + (s.approved ? " approved" : "")} key={s.id}>
          <div className="sb-scene">
            <strong>{String(i + 1).padStart(2, "0")}</strong>
            <small>{times[i]}</small>
            <small>{s.seconds}s</small>
            {s.kind !== "footage" && <em>{s.kind === "offer-card" ? "offer card" : "graphic"}</em>}
          </div>
          <div className="sb-visual">
            {s.kind === "footage" ? (
              <figure className={"board-frame" + (s.approved ? " approved" : "")}>
                {s.stillAssetId ? <img src={media(s.stillAssetId)} alt={`Scene ${i + 1} frame`} /> : <div className="scene-empty">{s.stillJob && ["queued", "running"].includes(s.stillJob.status) ? "Building…" : <ImageIcon size={20} />}</div>}
                {s.stillJob?.status === "failed" && <span className="error-text">{s.stillJob.error}</span>}
                {s.stillQA && !s.stillQA.passed && s.stillQA.issues?.[0] && <span className="ad-flag">Check: {s.stillQA.issues[0].problem.slice(0, 90)}</span>}
                <div className="ai-actions">
                  <button type="button" className={s.approved ? "" : "primary"} disabled={!s.stillAssetId || !!busy} onClick={() => onApprove(s)}><Check size={13} /> {s.approved ? "Approved" : "Approve"}</button>
                  <button type="button" disabled={!!busy} onClick={() => onRedo(s)}><RefreshCw size={13} /> Redo</button>
                  <select aria-label={`Use a brand photo for scene ${i + 1}`} value="" onChange={(e) => e.target.value && onPhoto(s, e.target.value)}>
                    <option value="">My photo…</option>
                    {pool.map((p, n) => <option key={p} value={p}>Brand photo {n + 1}</option>)}
                  </select>
                </div>
              </figure>
            ) : (
              <div className="sb-card">
                {(s.graphic?.lines || []).map((l: string, n: number) => <span key={n} className={n === s.graphic.lines.length - 1 && s.kind === "offer-card" ? "fine" : ""}>{l}</span>)}
                <small>Rendered exactly in your fonts · {s.graphic?.motion || "hold"}</small>
                <button type="button" className={s.approved ? "" : "primary"} disabled={!!busy} onClick={() => onApprove(s)}><Check size={13} /> {s.approved ? "Approved" : "Approve"}</button>
              </div>
            )}
            {cell(s, "visual", s.shots[0].visual, (v) => ({ shots: [{ ...s.shots[0], visual: v }] }), 2)}
          </div>
          <div className="sb-vo">{cell(s, "vo", s.shots[0].phrase, (v) => ({ shots: [{ ...s.shots[0], phrase: v }] }))}<small>{s.line ? `${s.line.split(/\s+/).filter(Boolean).length} words` : "Music only"}</small></div>
          <div className="sb-camera">{cell(s, "camera", cameraText(s.camera), (v) => ({ camera: parseCamera(v, s.camera) }), 2)}</div>
          <div className="sb-note">{cell(s, "note", s.editorNote, (v) => ({ editorNote: v, key: /^(key|cta|price reveal|emotional peak|offer reveal)/i.test(v) }))}</div>
        </div>
      ))}
    </div>
  );
}

export function FullBrief({ plan }: { plan: any }) {
  const b = plan.body.brief;
  const words = plan.body.script.split(/\s+/).filter(Boolean).length;
  const runtime = plan.body.segments.reduce((n: number, s: any) => n + s.seconds, 0);
  const rows: [string, string][] = [
    ["Campaign", b.specs.campaign], ["Concept", `${b.title} — ${b.device}`], ["Hero product", b.specs.hero], ["Format", b.specs.formatLine], ["Platform", b.specs.platform],
    ["Runtime", `${runtime} seconds`], ["Total VO", `${words} words / approx. ${Math.round(words / 2.5)}s spoken`], ["Locations", b.specs.location], ["Color grade", b.specs.grade], ["Pacing", b.specs.pacing], ["Brand tone", b.specs.tone],
  ];
  const List = ({ items }: { items: string[] }) => <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
  return (
    <div className="full-brief">
      <h3>Quick Specs</h3>
      <table><tbody>{rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
      <h3>Concept DNA check</h3><p>{b.dna}</p>
      <h3>Global Negative Prompt</h3><List items={b.negatives} />
      {!!b.materialsNeeded.length && <><h3>Client materials needed</h3><List items={b.materialsNeeded} /></>}
      <h3>Reference Videos</h3>
      {b.references.length ? <table><thead><tr><th>Video</th><th>Link</th><th>What to take</th><th>What not to take</th></tr></thead><tbody>{b.references.map((r: any, i: number) => <tr key={i}><td>{r.title}</td><td>{r.url}</td><td>{r.take}</td><td>{r.avoid}</td></tr>)}</tbody></table> : <p>None on file.</p>}
      <h3>Avatar Bible</h3><p><strong>{b.avatar.name}</strong> — {b.avatar.role}</p><List items={b.avatar.bullets} />
      <h3>Product Bible</h3><List items={b.productBible} />
      <h3>Voice Direction Packet</h3>
      <p><strong>1. Voice Role + Archetype.</strong> {b.voice.archetype}</p>
      <p><strong>2. Emotional State + Speaking Style.</strong> {b.voice.style}</p>
      <p><strong>3. Emphasis + Pauses.</strong> Emphasize: {b.voice.emphasize.join("; ")}. Never emphasize: {b.voice.neverEmphasize.join("; ")}. {b.voice.pauses.map((p: any) => `${p.seconds}s in S${p.scene} ${p.where}`).join(". ")}.</p>
      <p><strong>4. Voice prompt + settings.</strong> {b.voice.prompt}</p>
      <table><thead><tr><th>Stability</th><th>Similarity</th><th>Style</th><th>Speaker Boost</th></tr></thead><tbody><tr><td>{b.voice.settings.stability}</td><td>{b.voice.settings.similarity}</td><td>{b.voice.settings.style}</td><td>{b.voice.settings.speakerBoost ? "On" : "Off"}</td></tr></tbody></table>
      <p><strong>5. Performance Variants.</strong></p><List items={b.voice.variants.map((v: string, i: number) => `Variant ${"ABC"[i]}: ${v}`)} />
      <p>QC: sounds human, natural breathing, no rushed lines, no over-emphasized product names. If any check fails, regenerate; do not patch.</p>
      <h3>Music Direction</h3>
      <p>{b.music.style}. Tempo: {b.music.bpm[0]}–{b.music.bpm[1]} BPM.</p>
      <List items={b.music.anchors.map((m: any) => `S${m.scene}: ${m.note}`)} />
      <p>Never:</p><List items={b.music.never} />
    </div>
  );
}

// #/video/:id/print — the brief in the agency's storyboard layout; the browser's Print makes the PDF.
export function PrintBrief({ id }: { id: string }) {
  const [plan, setPlan] = useState<any>(null);
  useEffect(() => { api("/video/plans/" + id).then(setPlan); }, [id]);
  if (!plan) return <div className="loading">Loading brief…</div>;
  const b = plan.body.brief, segments: any[] = plan.body.segments, times = timecodes(segments);
  const runtime = segments.reduce((n: number, s: any) => n + s.seconds, 0);
  return (
    <div className="print-brief">
      <header>
        <div><h1>{plan.body.brief.specs.campaign.split(" — ")[0]}</h1><h2>{b.title}</h2><small>{b.specs.formatLine} | {b.specs.campaign}</small></div>
        <div className="right"><strong>{runtime}s runtime | {segments.length} scenes</strong><br /><strong>1x1 / 4x5 / 9x16</strong><br /><small>PRODUCTION STORYBOARD</small></div>
      </header>
      <table className="print-table">
        <thead><tr><th>Scene / Time</th><th>Visual / Action</th><th>VO / Script</th><th>Camera / Motion</th><th>Editor notes</th></tr></thead>
        <tbody>
          {segments.map((s, i) => (
            <tr key={s.id} className={s.key ? "key" : ""}>
              <td className="scene"><strong>{String(i + 1).padStart(2, "0")}</strong><br /><small>{times[i]}</small><br /><small>{s.seconds}s</small></td>
              <td className="visual">
                {s.kind === "footage" ? (s.stillAssetId ? <img src={media(s.stillAssetId)} alt="" /> : <div className="frame-empty">frame pending</div>) : <div className="card">{(s.graphic?.lines || []).map((l: string, n: number) => <span key={n}>{l}</span>)}</div>}
                <small>{s.shots[0].visual}</small>
              </td>
              <td>{s.line ? `“${s.line}”` : "Music only"}</td>
              <td>{cameraText(s.camera)}</td>
              <td>{s.editorNote}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="print-sections"><FullBrief plan={plan} /></div>
      <div className="no-print actions"><button className="primary" onClick={() => window.print()}>Print / Save as PDF</button><a className="button" href={"#/video/" + id}>Back to the studio</a></div>
    </div>
  );
}

export function BriefStart({ content, aspect, onStart, busy }: { content: any; aspect: string; onStart: (format: string, terms: string, campaign: string) => void; busy: string }) {
  const [formats, setFormats] = useState<Record<string, any>>({});
  const [format, setFormat] = useState("testimonial");
  const [terms, setTerms] = useState(content.terms || "");
  const [campaign, setCampaign] = useState("");
  useEffect(() => { api("/video/formats").then(setFormats, () => {}); }, []);
  return (
    <div className="panel brief-start">
      <h2>Plan my video</h2>
      <p className="caption">The agent writes a full production brief — scenes, script, camera, voice and music direction — and checks it before you see the storyboard. Nothing else is spent until you approve the board.</p>
      <div className="format-tiles">
        {Object.entries(formats).map(([k, f]) => (
          <button type="button" key={k} className={format === k ? "selected" : ""} onClick={() => setFormat(k)}>
            <strong>{f.label}</strong><small>{f.runtime}s · {f.scenes[0]}–{f.scenes[1]} scenes</small><small>{f.tone}</small>
          </button>
        ))}
      </div>
      <Field label="Campaign name"><input value={campaign} placeholder="e.g. Fall Savings — Batch 1" onChange={(e) => setCampaign(e.target.value)} /></Field>
      <Field label="Disclaimer, exactly as it must appear"><textarea rows={2} value={terms} placeholder="*Min of 5 windows to receive first discount. Offer expires 10/31/26" onChange={(e) => setTerms(e.target.value)} /></Field>
      <button className="primary" disabled={!!busy || !content.tiers.length || !terms.trim()} onClick={() => onStart(format, terms.trim(), campaign.trim() || "This month's offer")}>
        {busy === "brief" ? "Writing the brief…" : "Plan my video"}
      </button>
      <p className="caption">About 2¢ of text generation. Size: {aspect}.</p>
    </div>
  );
}
