// Static Studio: owners build ads to the Renewal standard straight from content.
// The layout is always regenerated on the server (server/adLayouts.ts); nothing is hand-placed.
import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  RefreshCw,
  Repeat2,
  Save,
  Upload,
  History,
  Play,
  Plus,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { Header, Notice, Field, useApp } from "./ui";
import { api, go, media } from "./api";
import type { AdContent, CreativeDoc } from "../server/types";
import { adLayoutNames, defaultHeadlines, type AdLayout } from "../server/adLayouts";
import { AD_ANGLES, AD_CONCEPTS, AD_TONES } from "../server/adPrompt";

type Format = CreativeDoc["format"];
type Draft = { layout: AdLayout; format: Format; content: AdContent };
const LAYOUTS = Object.entries(adLayoutNames) as [AdLayout, string][];
const SIZES: [Format, string][] = [
  ["square", "1:1"],
  ["portrait", "4:5"],
  ["vertical", "9:16"],
];
const BUTTONS = ["Book your FREE Design Consultation", "Schedule Today!"];
const PROMPTS: Record<AdLayout, string> = {
  band: "Photoreal exterior of a two-story Kentucky home with new white double-hung replacement windows, fall trees, clear blue sky, golden hour, wide shot, no people, no text or logos",
  arch: "Photoreal bright bedroom with large new replacement windows and window seat, natural daylight, fall trees outside, interior design magazine style, no people, no text or logos",
  diagonal: "",
};
const LAST_KEY = "renewal.static.lastContent";

// Drop half-filled offer rows before sending; the server rejects empty tiers.
const clean = (c: AdContent): AdContent => ({
  ...c,
  tiers: c.tiers.filter((t) => t.lead.trim() && t.value.trim()),
});
function remember(content: AdContent) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(content));
  } catch {}
}
function recall(): Partial<AdContent> | null {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) || "null");
  } catch {
    return null;
  }
}
function fromCampaign(c: any): Partial<AdContent> {
  return {
    headline: c.headlines?.[0] || "",
    cta: c.ctaLabels?.[0] || BUTTONS[0],
    tiers: (c.tiers || []).slice(0, 2),
    ends: /^\d{4}-\d{2}-\d{2}$/.test(c.end || "") ? c.end : "",
    terms: c.terms || "",
    legalApproved: c.legalApproved === true,
  };
}

// Live PNG of an unsaved ad plus its plain-language problems.
function useDraftImage(draft: Draft, delay: number) {
  const [state, setState] = useState<{ url: string; problems: string[]; error: string }>({
    url: "",
    problems: [],
    error: "",
  });
  const key = JSON.stringify(draft);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const body = { layout: draft.layout, format: draft.format, content: clean(draft.content) };
      try {
        const check = await api("/ads/preview?check=1", body);
        const response = await fetch("/api/ads/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Studio-Request": "1" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error((await response.json()).error || "Preview failed");
        const url = URL.createObjectURL(await response.blob());
        if (!alive) return URL.revokeObjectURL(url);
        setState((old) => {
          if (old.url) URL.revokeObjectURL(old.url);
          return { url, problems: check.problems, error: "" };
        });
      } catch (e) {
        if (alive) setState((old) => ({ ...old, error: (e as Error).message }));
      }
    }, delay);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key]);
  return state;
}

function Problems({ problems, error }: { problems: string[]; error?: string }) {
  if (!problems.length && !error)
    return (
      <p className="ad-ready">
        <Check size={16} aria-hidden="true" /> Ready — matches the Renewal ad standard.
      </p>
    );
  return (
    <ul className="ad-problems" role="status">
      {[...(error && !problems.length ? [error] : []), ...problems].map((p) => (
        <li key={p}>
          <AlertTriangle size={15} aria-hidden="true" /> {p}
        </li>
      ))}
    </ul>
  );
}

function ContentForm({
  layout,
  content,
  onChange,
  showLegal = true,
}: {
  layout: AdLayout;
  content: AdContent;
  onChange: (c: AdContent) => void;
  showLegal?: boolean;
}) {
  const set = (patch: Partial<AdContent>) => onChange({ ...content, ...patch });
  const tiers = content.tiers.length ? content.tiers : [{ lead: "", value: "" }];
  const setTier = (i: number, patch: object) =>
    set({ tiers: tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  return (
    <div className="ad-form">
      <Field label="Headline">
        <textarea
          rows={2}
          maxLength={80}
          value={content.headline}
          onChange={(e) => set({ headline: e.target.value })}
        />
      </Field>
      <div className="chip-row" aria-label="Headline ideas">
        {defaultHeadlines({ end: content.ends }).map((h) => (
          <button type="button" className="chip" key={h} onClick={() => set({ headline: h })}>
            {h.replace("\n", " ")}
          </button>
        ))}
      </div>
      <fieldset className="tier-editor">
        <legend>Offer</legend>
        {tiers.map((t, i) => (
          <div className="tier-row" key={i}>
            <input
              aria-label={`Offer ${i + 1} lead`}
              placeholder={i ? "Buy 10 Windows" : "Buy 5 Windows"}
              maxLength={40}
              value={t.lead}
              onChange={(e) => setTier(i, { lead: e.target.value })}
            />
            <input
              aria-label={`Offer ${i + 1} amount`}
              placeholder={i ? "Save $3,000" : "Save $1,000"}
              maxLength={20}
              value={t.value}
              onChange={(e) => setTier(i, { value: e.target.value })}
            />
            {i > 0 && (
              <button
                type="button"
                aria-label="Remove second offer"
                onClick={() => set({ tiers: tiers.slice(0, 1) })}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
        {tiers.length < 2 && (
          <button
            type="button"
            className="text-button"
            onClick={() => set({ tiers: [...tiers, { lead: "", value: "" }] })}
          >
            <Plus size={14} /> Add a second offer
          </button>
        )}
      </fieldset>
      <Field label="Offer ends">
        <input type="date" value={content.ends} onChange={(e) => set({ ends: e.target.value })} />
      </Field>
      {layout !== "band" && (
        <>
          <Field label="Button">
            <input maxLength={48} value={content.cta} onChange={(e) => set({ cta: e.target.value })} />
          </Field>
          <div className="chip-row" aria-label="Button ideas">
            {BUTTONS.map((b) => (
              <button type="button" className="chip" key={b} onClick={() => set({ cta: b })}>
                {b}
              </button>
            ))}
          </div>
        </>
      )}
      {showLegal && (
        <>
          <Field label="Fine print (goes in the post text, not on the ad)">
            <textarea rows={2} value={content.terms} onChange={(e) => set({ terms: e.target.value })} />
          </Field>
          <label className="check-row">
            <input
              type="checkbox"
              checked={content.legalApproved}
              onChange={(e) => set({ legalApproved: e.target.checked })}
            />
            Legal disclaimer approved
          </label>
        </>
      )}
    </div>
  );
}

function PhotoPicker({
  layout,
  content,
  onChange,
}: {
  layout: AdLayout;
  content: AdContent;
  onChange: (patch: Partial<AdContent>) => void;
}) {
  const { boot } = useApp();
  const pool = boot.brand?.body.adPhotos || { scenes: [], cutouts: [] };
  const [tab, setTab] = useState<"brand" | "all" | "ai">("brand");
  const [assets, setAssets] = useState<any[]>([]);
  useEffect(() => {
    api("/assets").then(setAssets, () => {});
  }, []);
  const installer = layout === "diagonal";
  const field = installer ? "cutoutAssetId" : "photoAssetId";
  const ids: string[] = installer
    ? pool.cutouts
    : tab === "brand"
      ? pool.scenes
      : assets
          .filter((a) => a.kind === "image" && a.preview && a.metadata?.historical !== true)
          .map((a) => a.id);
  const generated = assets.filter((a) => a.metadata?.origin === "generated" && a.kind === "image");
  return (
    <div className="photo-picker">
      <div className="picker-head">
        <h3>{installer ? "Installer" : "Photo"}</h3>
        {!installer && (
          <div className="segmented" role="tablist">
            {(
              [
                ["brand", "Brand photos"],
                ["all", "All images"],
                ["ai", "Generate with AI"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={tab === k ? "selected" : ""}
                onClick={() => setTab(k)}
              >
                {k === "ai" && <Sparkles size={14} />} {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {tab === "ai" && !installer ? (
        <AiPhoto
          layout={layout}
          generated={generated}
          selected={content.photoAssetId}
          onPick={(id) => {
            onChange({ photoAssetId: id });
            api("/assets").then(setAssets, () => {});
          }}
        />
      ) : (
        <div className="photo-grid">
          {ids.map((id) => (
            <button
              type="button"
              key={id}
              aria-pressed={content[field] === id}
              className={"photo-choice" + (content[field] === id ? " chosen" : "") + (installer ? " cutout" : "")}
              onClick={() => onChange({ [field]: id } as Partial<AdContent>)}
            >
              <img src={media(id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {!installer && content.photoAssetId && (
        <Field label="Photo position">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={content.photoFocusY ?? 0.5}
            onChange={(e) => onChange({ photoFocusY: Number(e.target.value) })}
          />
        </Field>
      )}
    </div>
  );
}

// One-shot AI photo: GPT Image makes the scene; the layout adds the exact logo and offer.
function AiPhoto({
  layout,
  generated,
  selected,
  onPick,
}: {
  layout: AdLayout;
  generated: any[];
  selected: string | null;
  onPick: (assetId: string) => void;
}) {
  const { boot } = useApp();
  const image = boot.generation?.image;
  const [prompt, setPrompt] = useState(PROMPTS[layout]);
  const [model, setModel] = useState<"sunburst" | "flare">("sunburst");
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const polling = useRef<number | null>(null);
  useEffect(() => () => void (polling.current && clearInterval(polling.current)), []);
  async function generate() {
    setConfirming(false);
    setError("");
    try {
      const j = await api("/jobs", {
        kind: "generation",
        key: crypto.randomUUID(),
        payload: { kind: "image", model, prompt, size: "1536x1024", sourceAssetIds: [], confirmBillable: true },
      });
      setStatus("Generating photo…");
      polling.current = window.setInterval(async () => {
        const job = (await api("/jobs")).find((x: any) => x.id === j.id);
        if (!job || ["queued", "running"].includes(job.status)) return;
        clearInterval(polling.current!);
        setStatus("");
        if (job.status === "ready" && job.output?.assetId) onPick(job.output.assetId);
        else setError(job.error || `Generation ${job.status}`);
      }, 2500);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="ai-photo">
      {!image?.configured && (
        <Notice>GPT Image isn't connected for this workspace yet{image?.state ? ` (${image.state})` : ""}.</Notice>
      )}
      <Field label="Describe the photo">
        <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </Field>
      <Field label="Model">
        <select value={model} onChange={(e) => setModel(e.target.value as any)}>
          <option value="sunburst">GPT Image 2.5 Sunburst · best quality</option>
          <option value="flare">GPT Image 2.5 Flare · faster</option>
        </select>
      </Field>
      {confirming ? (
        <div className="confirm-paid" role="alertdialog" aria-label="Confirm paid generation">
          <p>
            This sends <strong>1 paid request</strong> to GPT Image 2.5 {model === "sunburst" ? "Sunburst" : "Flare"} through
            Vercel AI Gateway. Your prompt is shared with OpenAI.
          </p>
          <div className="actions">
            <button type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" className="primary" onClick={generate}>
              Generate (paid)
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="primary"
          disabled={!prompt.trim() || !!status || !image?.configured}
          onClick={() => setConfirming(true)}
        >
          <Sparkles size={16} /> {status || "Generate photo…"}
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
      {!!generated.length && (
        <div className="photo-grid">
          {generated.map((a) => (
            <button
              type="button"
              key={a.id}
              aria-pressed={selected === a.id}
              className={"photo-choice" + (selected === a.id ? " chosen" : "")}
              onClick={() => onPick(a.id)}
            >
              <img src={media(a.id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SizePicker({ value, onChange }: { value: Format; onChange: (f: Format) => void }) {
  return (
    <div className="segmented" aria-label="Size">
      {SIZES.map(([f, label]) => (
        <button key={f} type="button" className={value === f ? "selected" : ""} onClick={() => onChange(f)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function LayoutCard({ draft, layout, selected, onPick }: { draft: Draft; layout: AdLayout; selected: boolean; onPick: () => void }) {
  const { url } = useDraftImage({ ...draft, layout, format: "portrait" }, 1200);
  return (
    <button type="button" className={"layout-card" + (selected ? " chosen" : "")} aria-pressed={selected} onClick={onPick}>
      {url ? <img src={url} alt="" /> : <span className="layout-card-empty" />}
      <span>{adLayoutNames[layout]}</span>
    </button>
  );
}

export function AdCreate({ embedded = false }: { embedded?: boolean }) {
  const { boot, run, refresh, path } = useApp();
  const pool = boot.brand?.body.adPhotos || { scenes: [], cutouts: [] };
  const campaigns = boot.campaigns.filter((c: any) => c.body.name !== "Studio ads");
  const [campaignId, setCampaignId] = useState(new URLSearchParams(path.split("?")[1]).get("campaign") || "");
  const [draft, setDraft] = useState<Draft>(() => {
    const chosen = boot.campaigns.find((c: any) => c.id === campaignId);
    return {
      layout: "band",
      format: "portrait",
      content: {
        headline: "",
        cta: BUTTONS[0],
        tiers: [],
        ends: "",
        terms: "",
        legalApproved: false,
        photoFocusY: null,
        ...(chosen ? fromCampaign(chosen.body) : recall()),
        photoAssetId: pool.scenes[0] || null,
        cutoutAssetId: pool.cutouts[0] || null,
      } as AdContent,
    };
  });
  const main = useDraftImage(draft, 500);
  const setContent = (content: AdContent) => setDraft({ ...draft, content });
  return (
    <>
      {!embedded && (
        <Header title="Static Studio" description="Make a Renewal ad from your offer and photo. The layout matches your real ads every time." />
      )}
      <div className="ad-studio">
        <section className="panel ad-studio-form">
          <h2>Layout</h2>
          <div className="layout-cards">
            {LAYOUTS.map(([layout]) => (
              <LayoutCard key={layout} draft={draft} layout={layout} selected={draft.layout === layout} onPick={() => setDraft({ ...draft, layout })} />
            ))}
          </div>
          <h2>Offer</h2>
          <ContentForm layout={draft.layout} content={draft.content} onChange={setContent} />
          <PhotoPicker layout={draft.layout} content={draft.content} onChange={(p) => setContent({ ...draft.content, ...p })} />
          <Field label="Campaign folder (optional)">
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">Studio ads</option>
              {campaigns.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.body.name}
                </option>
              ))}
            </select>
          </Field>
          {campaignId && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                const c = boot.campaigns.find((x: any) => x.id === campaignId);
                if (c) setContent({ ...draft.content, ...fromCampaign(c.body) });
              }}
            >
              Use this campaign's offer
            </button>
          )}
        </section>
        <section className="ad-studio-preview">
          <div className="panel">
            <div className="preview-head">
              <SizePicker value={draft.format} onChange={(format) => setDraft({ ...draft, format })} />
            </div>
            {main.url ? <img className="ad-preview" src={main.url} alt="Live preview of your ad" /> : <div className="ad-preview empty">Building preview…</div>}
            <Problems problems={main.problems} error={main.error} />
            <button
              className="primary"
              disabled={!!main.problems.length || !main.url}
              onClick={() =>
                run(async () => {
                  const content = clean(draft.content);
                  const r = await api("/creatives", {
                    kind: "static",
                    layout: draft.layout,
                    format: draft.format,
                    campaignId: campaignId || undefined,
                    content,
                  });
                  remember({ ...content, photoAssetId: null, cutoutAssetId: null });
                  await refresh();
                  go("static/" + r.id);
                })
              }
            >
              <Plus size={17} /> Create ad
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

type Snapshot = { content: AdContent; layout: AdLayout; format: Format };

export function AdEditor({ id }: { id: string }) {
  const { boot, run, refresh } = useApp();
  const [record, setRecord] = useState<any>(null);
  const [local, setLocal] = useState<Snapshot | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<Snapshot[]>([]);
  const [redo, setRedo] = useState<Snapshot[]>([]);
  const [versions, setVersions] = useState<any[] | null>(null);
  const recordRef = useRef<any>(null);
  const queue = useRef<Promise<any>>(Promise.resolve());
  recordRef.current = record;
  const snapshot = (r: any): Snapshot => ({ content: r.body.content, layout: r.body.layout, format: r.body.format });
  function accept(r: any) {
    recordRef.current = r;
    setRecord(r);
    if (r.problems) setProblems(r.problems);
  }
  // Composes run one at a time so each uses the latest saved version.
  function compose(next: Partial<Snapshot>) {
    queue.current = queue.current.then(() =>
      run(async () => {
        setBusy(true);
        try {
          accept(
            await api(`/creatives/${id}/compose`, {
              expectedVersion: recordRef.current.rev,
              ...(next.content ? { content: clean(next.content) } : {}),
              ...(next.layout ? { layout: next.layout } : {}),
              ...(next.format ? { format: next.format } : {}),
            }),
          );
        } finally {
          setBusy(false);
        }
      }),
    );
    return queue.current;
  }
  useEffect(() => {
    run(async () => {
      const r = await api("/record/" + id);
      accept(r);
      if (r.body.layout === "ai") return;
      // Ads made before content was stored get it derived and saved once.
      if (!r.body.content) await compose({});
      else setProblems((await api(`/creatives/${id}/problems`)).problems);
    });
  }, [id]);
  // Debounce typing, then regenerate.
  useEffect(() => {
    if (!local) return;
    const sent = local;
    // Clear only if nothing newer was typed while this compose ran.
    const timer = setTimeout(() => compose(sent).then(() => setLocal((cur) => (cur === sent ? null : cur))), 700);
    return () => clearTimeout(timer);
  }, [JSON.stringify(local)]);
  if (!record) return <div className="loading">Loading ad…</div>;
  if (record.body.layout === "ai") return <AiAdView record={record} onRecord={accept} />;
  if (!record.body.content) return <div className="loading">Loading ad…</div>;
  const current = local || snapshot(record);
  const edit = (patch: Partial<Snapshot>) => {
    setUndo((u) => [...u.slice(-49), current]);
    setRedo([]);
    setLocal({ ...current, ...patch });
  };
  const campaign = boot.campaigns.find((c: any) => c.id === record.body.campaignId);
  const content = current.content;
  return (
    <>
      <Header title={record.body.name} description={`Document v${record.rev} · ${adLayoutNames[current.layout]}`}>
        <span role="status" aria-live="polite" className="save-state">
          {local || busy ? "Updating…" : "Saved"}
        </span>
        <button
          aria-label="Undo"
          disabled={!undo.length}
          onClick={() => {
            setRedo([...redo, current]);
            setLocal(undo.at(-1)!);
            setUndo(undo.slice(0, -1));
          }}
        >
          <Undo2 size={17} />
        </button>
        <button
          aria-label="Redo"
          disabled={!redo.length}
          onClick={() => {
            setUndo([...undo, current]);
            setLocal(redo.at(-1)!);
            setRedo(redo.slice(0, -1));
          }}
        >
          <Redo2 size={17} />
        </button>
        <button
          className="primary"
          disabled={!!problems.length || !!local || busy}
          onClick={() =>
            run(async () => {
              await queue.current;
              await api("/jobs", {
                kind: "render",
                payload: { creativeId: id, version: recordRef.current.rev },
                key: crypto.randomUUID(),
              });
              go("activity");
            })
          }
        >
          <Play size={16} /> Render PNG
        </button>
      </Header>
      {!content.legalApproved && <Notice>Internal draft — the legal disclaimer isn't approved yet.</Notice>}
      <div className="ad-studio">
        <section className="panel ad-studio-form">
          <Field label="Ad name">
            <input
              defaultValue={record.body.name}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== record.body.name &&
                run(async () =>
                  accept(
                    await api(`/creatives/${id}`, { body: { ...recordRef.current.body, name: e.target.value.trim() }, expectedVersion: recordRef.current.rev }, "PUT"),
                  ),
                )
              }
            />
          </Field>
          <h2>Layout</h2>
          <div className="segmented wrap">
            {LAYOUTS.map(([layout, name]) => (
              <button key={layout} type="button" className={current.layout === layout ? "selected" : ""} onClick={() => edit({ layout })}>
                {name}
              </button>
            ))}
          </div>
          <h2>Offer</h2>
          <ContentForm layout={current.layout} content={content} onChange={(c) => edit({ content: c })} />
          <PhotoPicker layout={current.layout} content={content} onChange={(p) => edit({ content: { ...content, ...p } })} />
          <div className="actions">
            <button onClick={() => run(async () => setVersions(await api(`/record/${id}/versions`)))}>
              <History size={16} /> Version history
            </button>
            <button
              onClick={() =>
                run(async () => {
                  const r = await api(`/creatives/${id}/variation`, {});
                  await refresh();
                  go("static/" + r.id);
                })
              }
            >
              Create variation
            </button>
            {campaign && campaign.body.name !== "Studio ads" && (
              <button onClick={() => run(async () => accept(await api(`/creatives/${id}/apply-offer`, { expectedVersion: recordRef.current.rev })))}>
                Copy offer from campaign
              </button>
            )}
          </div>
          {versions && (
            <div>
              {versions.map((v) => (
                <button
                  className="list-button"
                  key={v.rev}
                  onClick={() =>
                    run(async () =>
                      accept(await api(`/creatives/${id}`, { body: v.body, expectedVersion: recordRef.current.rev }, "PUT")),
                    )
                  }
                >
                  Restore v{v.rev}
                  <small>{new Date(v.created).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="ad-studio-preview">
          <div className="panel">
            <div className="preview-head">
              <SizePicker value={current.format} onChange={(format) => edit({ format })} />
            </div>
            <img
              className={"ad-preview" + (local || busy ? " updating" : "")}
              src={`/api/creatives/${id}/preview?v=${record.rev}`}
              alt="Exact final ad"
            />
            <Problems problems={problems} />
          </div>
        </section>
      </div>
    </>
  );
}

// ---------- Zuops-style AI generation: Create and Remix ----------

type Tab = "create" | "remix" | "templates";
const ASPECT: Record<Format, "1:1" | "4:5" | "9:16"> = { square: "1:1", portrait: "4:5", vertical: "9:16" };
type Source = { creativeId?: string; assetId?: string; label: string; src: string };

export function StaticStudio() {
  const { path } = useApp();
  const params = new URLSearchParams(path.split("?")[1]);
  const { boot } = useApp();
  const [tab, setTab] = useState<Tab>((["remix", "templates"].includes(params.get("mode") || "") ? params.get("mode") : "create") as Tab);
  // Deep links: #/static?mode=remix&creative=<id> or &asset=<id>
  const [remixFrom, setRemixFrom] = useState<Source | null>(() => {
    const creative = boot.creatives.find((c: any) => c.id === params.get("creative"));
    if (creative) return { creativeId: creative.id, label: creative.body.name, src: `/api/creatives/${creative.id}/preview?v=${creative.rev}` };
    const asset = params.get("asset");
    return asset ? { assetId: asset, label: "Selected ad", src: media(asset) } : null;
  });
  return (
    <>
      <Header
        title="Static Studio"
        description="Create brand-new ads with AI, or remix any ad into something fresh — in your brand, with your offer."
      />
      <div className="segmented studio-tabs" role="tablist">
        {(
          [
            ["create", "Create"],
            ["remix", "Remix"],
            ["templates", "Brand templates"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "selected" : ""} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "templates" ? (
        <AdCreate embedded />
      ) : (
        <AdGenerator
          key={tab + (remixFrom?.assetId || remixFrom?.creativeId || "")}
          mode={tab}
          initialSource={tab === "remix" ? remixFrom : null}
          onRemix={(source) => {
            setRemixFrom(source);
            setTab("remix");
          }}
        />
      )}
    </>
  );
}

function AdGenerator({
  mode,
  initialSource,
  onRemix,
}: {
  mode: "create" | "remix";
  initialSource: Source | null;
  onRemix: (s: Source) => void;
}) {
  const { boot, run, refresh } = useApp();
  const image = boot.generation?.image;
  const pool = boot.brand?.body.adPhotos || { scenes: [], cutouts: [] };
  const [content, setContent] = useState<AdContent>(() => ({
    headline: "",
    cta: BUTTONS[0],
    tiers: [],
    ends: "",
    terms: "",
    legalApproved: false,
    photoAssetId: null,
    cutoutAssetId: null,
    photoFocusY: null,
    ...recall(),
  }));
  const [format, setFormat] = useState<Format>("portrait");
  const [source, setSource] = useState<Source | null>(initialSource);
  const [refs, setRefs] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [concept, setConcept] = useState("");
  const [angle, setAngle] = useState("");
  const [tone, setTone] = useState("");
  const [model, setModel] = useState<"sunburst" | "flare">("sunburst");
  const [more, setMore] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<any[]>([]);
  const polling = useRef<number | null>(null);
  const loadRecent = () =>
    api("/assets").then(
      (all: any[]) =>
        setRecent(
          all
            .filter((a) => a.metadata?.origin === "generated" && a.kind === "image")
            .sort((x, y) => String(y.metadata.generatedAt).localeCompare(String(x.metadata.generatedAt)))
            .slice(0, 12),
        ),
      () => {},
    );
  useEffect(() => {
    loadRecent();
    return () => void (polling.current && clearInterval(polling.current));
  }, []);
  const offer = clean(content);
  const blocked = !offer.tiers.length
    ? "Add at least one offer."
    : mode === "remix" && !source
      ? "Choose an ad to remix."
      : !image?.configured
        ? "AI image generation isn't connected yet."
        : "";
  async function generate(variations: number) {
    setConfirming(null);
    setError("");
    await run(async () => {
      remember({ ...offer, photoAssetId: null, cutoutAssetId: null });
      const j = await api("/ads/generate", {
        key: crypto.randomUUID(),
        mode,
        content: { headline: offer.headline, tiers: offer.tiers, ends: offer.ends, cta: offer.cta },
        aspect: ASPECT[format],
        ...(source?.creativeId ? { sourceCreativeId: source.creativeId } : {}),
        ...(source?.assetId ? { sourceAssetId: source.assetId } : {}),
        referenceAssetIds: refs,
        instructions,
        ...(concept ? { concept } : {}),
        ...(angle ? { angle } : {}),
        ...(tone ? { tone } : {}),
        model,
        variations,
        confirmBillable: true,
      });
      setJob({ ...j, status: j.status, variations });
      polling.current = window.setInterval(async () => {
        const found = (await api("/jobs")).find((x: any) => x.id === j.id);
        if (!found || ["queued", "running"].includes(found.status)) return;
        clearInterval(polling.current!);
        setJob(found);
        if (found.status !== "ready") setError(found.error || `Generation ${found.status}`);
        loadRecent();
      }, 3000);
    });
  }
  const results: any[] =
    job?.status === "ready"
      ? (job.output?.assetIds || []).map((id: string) => recent.find((r) => r.id === id) || { id, metadata: {} })
      : [];
  const running = job && ["queued", "running"].includes(job.status);
  return (
    <div className="ad-studio">
      <section className="panel ad-studio-form">
        {!image?.configured && (
          <Notice>
            AI image generation isn't connected yet ({image?.state || "not configured"}). Add Vercel AI Gateway credits and an
            AI_GATEWAY_API_KEY to turn it on.
          </Notice>
        )}
        {mode === "remix" && <SourcePicker value={source} onChange={setSource} />}
        <h2>Offer</h2>
        <ContentForm layout="arch" content={content} onChange={setContent} showLegal={false} />
        <Field label="Custom instructions (optional)">
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="e.g. Fall colors, show a two-story brick home, make the $3,000 huge"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </Field>
        <div className="picker-head">
          <h3>Reference photos (optional)</h3>
          <small>{refs.length}/3</small>
        </div>
        <div className="photo-grid">
          {pool.scenes.map((id: string) => (
            <button
              type="button"
              key={id}
              aria-pressed={refs.includes(id)}
              className={"photo-choice" + (refs.includes(id) ? " chosen" : "")}
              onClick={() => setRefs(refs.includes(id) ? refs.filter((r) => r !== id) : refs.length < 3 ? [...refs, id] : refs)}
            >
              <img src={media(id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <button type="button" className="text-button" onClick={() => setMore(!more)}>
          {more ? "Fewer options" : "More options"}
        </button>
        {more && (
          <div className="form-grid compact">
            <Field label="Concept">
              <select value={concept} onChange={(e) => setConcept(e.target.value)}>
                <option value="">Let AI decide (4 different)</option>
                {AD_CONCEPTS.map((c) => (
                  <option key={c} value={c}>
                    {c.split(":")[0]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Angle">
              <select value={angle} onChange={(e) => setAngle(e.target.value)}>
                <option value="">Let AI decide</option>
                {AD_ANGLES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Tone">
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="">Let AI decide</option>
                {AD_TONES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <select value={model} onChange={(e) => setModel(e.target.value as any)}>
                <option value="sunburst">GPT Image 2.5 Sunburst · best</option>
                <option value="flare">GPT Image 2.5 Flare · faster</option>
              </select>
            </Field>
          </div>
        )}
      </section>
      <section className="ad-studio-preview">
        <div className="panel">
          <div className="preview-head">
            <SizePicker value={format} onChange={setFormat} />
          </div>
          {confirming ? (
            <div className="confirm-paid" role="alertdialog" aria-label="Confirm paid generation">
              <p>
                This makes <strong>{confirming} paid GPT Image {confirming === 1 ? "request" : "requests"}</strong> through Vercel AI
                Gateway, plus a quick automatic check of each ad's offer text.
              </p>
              <div className="actions">
                <button type="button" onClick={() => setConfirming(null)}>
                  Cancel
                </button>
                <button type="button" className="primary" onClick={() => generate(confirming)}>
                  Generate (paid)
                </button>
              </div>
            </div>
          ) : (
            <button className="primary" disabled={!!blocked || !!running} onClick={() => setConfirming(4)}>
              {mode === "remix" ? <Repeat2 size={17} /> : <Sparkles size={17} />}{" "}
              {running ? "Designing 4 ads…" : mode === "remix" ? "Remix into 4 new ads" : "Generate 4 ads"}
            </button>
          )}
          {blocked && <p className="caption">{blocked}</p>}
          {error && <p className="error-text">{error}</p>}
          {running && <div className="ai-results">{Array.from({ length: job.variations || 4 }, (_, i) => <div key={i} className="ai-card pending" />)}</div>}
          {!!results.length && (
            <AiResults
              items={results}
              onRemix={onRemix}
              onRegenerate={() => setConfirming(1)}
              onSaved={async (id) => {
                await refresh();
                go("static/" + id);
              }}
            />
          )}
        </div>
        {!!recent.length && (
          <div className="panel">
            <h3>Recent AI ads</h3>
            <AiResults items={recent} onRemix={onRemix} onSaved={async (id) => {
              await refresh();
              go("static/" + id);
            }} />
          </div>
        )}
      </section>
    </div>
  );
}

function AiResults({
  items,
  onRemix,
  onRegenerate,
  onSaved,
}: {
  items: any[];
  onRemix: (s: Source) => void;
  onRegenerate?: () => void;
  onSaved: (creativeId: string) => void;
}) {
  const { run } = useApp();
  return (
    <div className="ai-results">
      {items.map((a) => {
        const check = a.metadata?.check;
        return (
          <figure className="ai-card" key={a.id}>
            <img src={media(a.id)} alt="AI-designed ad" loading="lazy" />
            <figcaption>
              {check?.passed === true && (
                <span className="ad-ready">
                  <Check size={14} /> Offer text verified
                </span>
              )}
              {check?.passed === false && (
                <span className="ad-flag" title={check.issues.join("\n")}>
                  <AlertTriangle size={14} /> {check.issues[0]}
                </span>
              )}
              {check?.passed === null && <span className="caption">{check.issues[0]}</span>}
              <div className="ai-actions">
                <button type="button" onClick={() => run(async () => onSaved((await api("/ads/save", { assetId: a.id })).id))}>
                  <Save size={14} /> Save to Ads
                </button>
                <a className="button" href={`/api/assets/${a.id}/original`}>
                  <Download size={14} /> Download
                </a>
                <button type="button" onClick={() => onRemix({ assetId: a.id, label: "AI ad", src: media(a.id) })}>
                  <Repeat2 size={14} /> Remix
                </button>
                {onRegenerate && (
                  <button type="button" onClick={onRegenerate}>
                    <RefreshCw size={14} /> One more
                  </button>
                )}
              </div>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function SourcePicker({ value, onChange }: { value: Source | null; onChange: (s: Source) => void }) {
  const { boot, run } = useApp();
  const [tab, setTab] = useState<"ads" | "past" | "upload">("ads");
  const [assets, setAssets] = useState<any[]>([]);
  useEffect(() => {
    api("/assets").then(setAssets, () => {});
  }, []);
  const ads = boot.creatives.filter((c: any) => c.body.kind === "static");
  const past = assets.filter((a) => a.kind === "image" && a.preview && a.metadata?.historical === true);
  return (
    <div className="photo-picker">
      <div className="picker-head">
        <h2>Ad to remix</h2>
        <div className="segmented" role="tablist">
          {(
            [
              ["ads", "Your ads"],
              ["past", "Past ads"],
              ["upload", "Upload"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "selected" : ""} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {value && (
        <div className="remix-source">
          <img src={value.src} alt="" />
          <span>Remixing: {value.label}</span>
        </div>
      )}
      {tab === "upload" ? (
        <label className="button upload-button">
          <Upload size={15} /> Upload an ad image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              run(async () => {
                const r = await fetch("/api/assets/upload", {
                  method: "POST",
                  headers: { "Content-Type": "application/octet-stream", "X-Studio-Request": "1", "X-File-Name": encodeURIComponent(file.name) },
                  body: file,
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data.error);
                onChange({ assetId: data.id, label: file.name, src: media(data.id) });
              });
            }}
          />
        </label>
      ) : (
        <div className="photo-grid">
          {tab === "ads"
            ? ads.map((c: any) => {
                const src = `/api/creatives/${c.id}/preview?v=${c.rev}`;
                return (
                  <button
                    type="button"
                    key={c.id}
                    title={c.body.name}
                    className={"photo-choice" + (value?.creativeId === c.id ? " chosen" : "")}
                    onClick={() => onChange({ creativeId: c.id, label: c.body.name, src })}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                );
              })
            : past.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  title={a.metadata?.catalogPath || a.name}
                  className={"photo-choice" + (value?.assetId === a.id ? " chosen" : "")}
                  onClick={() => onChange({ assetId: a.id, label: (a.metadata?.catalogPath || a.name).replace("Past Meta Content/", ""), src: media(a.id) })}
                >
                  <img src={media(a.id)} alt="" loading="lazy" />
                </button>
              ))}
        </div>
      )}
    </div>
  );
}

// Saved AI ad: the image itself, with render/download and remix.
function AiAdView({ record, onRecord }: { record: any; onRecord: (r: any) => void }) {
  const { run } = useApp();
  const photo = record.body.layers.find((l: any) => l.id === "photo")?.assetId;
  return (
    <>
      <Header title={record.body.name} description={`AI-designed ad · Document v${record.rev}`}>
        <a className="button" href={`#/static?mode=remix&creative=${record.id}`}>
          <Repeat2 size={16} /> Remix this ad
        </a>
        <button
          className="primary"
          onClick={() =>
            run(async () => {
              await api("/jobs", { kind: "render", payload: { creativeId: record.id, version: record.rev }, key: crypto.randomUUID() });
              go("activity");
            })
          }
        >
          <Play size={16} /> Render PNG
        </button>
      </Header>
      <div className="ad-studio">
        <section className="panel ad-studio-form">
          <Field label="Ad name">
            <input
              defaultValue={record.body.name}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== record.body.name &&
                run(async () =>
                  onRecord(await api(`/creatives/${record.id}`, { body: { ...record.body, name: e.target.value.trim() }, expectedVersion: record.rev }, "PUT")),
                )
              }
            />
          </Field>
          {photo && (
            <a className="button" href={`/api/assets/${photo}/original`}>
              <Download size={16} /> Download original
            </a>
          )}
        </section>
        <section className="ad-studio-preview">
          <div className="panel">
            <img className="ad-preview" src={`/api/creatives/${record.id}/preview?v=${record.rev}`} alt="AI-designed ad" />
          </div>
        </section>
      </div>
    </>
  );
}
