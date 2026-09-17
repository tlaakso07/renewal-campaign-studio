import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  ArrowRight,
  Download,
  Image as ImageIcon,
  Upload,
  Search,
  Undo2,
  Redo2,
  Save,
  Play,
  Check,
  RefreshCw,
  Megaphone,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { Header, Notice, Empty, Field, useApp } from "./ui";
import { ThemeControls, SetupControls } from "./setup";
import { api, go, media } from "./api";
import { Discovery, Remix, CampaignExport, useResource } from "./discovery";
import { reportFilters, useRouteFilters } from "./navigation";
import { CommunityThread } from "./community";
import { ModelMark } from "./model-mark";
import {
  ImportWizard,
  CRMOutcomes,
  Performance,
  Review,
  SavedViews,
} from "./measurement";
import type { CreativeDoc } from "../server/types";
const dimensions = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  vertical: [1080, 1920],
} as const;
function useLoad<T = any>(url: string) {
  const { run } = useApp(),
    [data, setData] = useState<T | null>(null);
  const load = () => run(async () => setData(await api(url)));
  useEffect(() => {
    setData(null);
    load();
  }, [url]);
  return { data, load, setData };
}
const status = (s: string) => (
  <span className={"status " + s}>{s.replaceAll("_", " ")}</span>
);
export function Pages({ section }: { section: string }) {
  const { path } = useApp();
  const recordId = path.split("/")[1]?.split("?")[0];
  return (
    <div className={`page page-${section}`}>
      {section === "campaigns" ? (
        <Campaigns id={recordId} />
      ) : section === "static" || section === "video" ? (
        <Studio key={recordId || section} kind={section} id={recordId} />
      ) : section === "assets" ? (
        <Assets />
      ) : section === "activity" ? (
        <Activity />
      ) : section === "brand" ? (
        <Brand />
      ) : section === "models" ? (
        <Models />
      ) : section === "templates" || section === "shared" ? (
        <Discovery shared={section === "shared"} />
      ) : section === "remix" ? (
        <Remix />
      ) : section === "export" ? (
        <CampaignExport />
      ) : section === "insights" ? (
        <Insights />
      ) : section === "crm" ? (
        <CRMOutcomes />
      ) : section === "performance" ? (
        <Performance />
      ) : section === "review" ? (
        <Review id={recordId} />
      ) : section === "feed" ? (
        <Feed id={recordId} />
      ) : section === "classroom" ? (
        <Classroom />
      ) : section === "operator" ? (
        <Operator />
      ) : section === "settings" ? (
        <Settings />
      ) : (
        <Empty title="Page not found">
          <a href="#/">Return home</a>
        </Empty>
      )}
    </div>
  );
}
function Campaigns({ id }: { id?: string }) {
  const { boot, run, refresh } = useApp();
  const { data: record, load } = useLoad(
    id && id !== "new" ? "/record/" + id : "/records/campaign",
  );
  const [form, setForm] = useState<any>({
    name: "",
    goal: "Awareness",
    product: "Windows and doors",
    offer: "",
    terms: "",
    cta: "Explore your options",
  });
  useEffect(() => {
    if (record?.body) setForm(record.body);
  }, [record]);
  const editing = !!id;
  async function save() {
    await run(async () => {
      const r = await api(
        id === "new" ? "/campaigns" : "/campaigns/" + id,
        id === "new" ? form : { body: form, expectedVersion: record.rev },
        id === "new" ? "POST" : "PUT",
      );
      await refresh();
      go("campaigns/" + r.id);
      load();
    });
  }
  if (!editing)
    return (
      <>
        <Header
          title="Campaigns"
          description="Your brief, offer, and creative work. Together in one place."
        >
          <a href="#/campaigns/new" className="button primary">
            <Plus size={16} />
            New campaign
          </a>
        </Header>
        {!boot.campaigns.length ? (
          <Empty title="Start with this month’s idea">
            <p>
              Add your brief and current offer, or create an awareness campaign
              without a promotion.
            </p>
            <a href="#/campaigns/new" className="button primary">
              Create campaign
            </a>
          </Empty>
        ) : (
          <div className="cards">
            {boot.campaigns.map((c: any) => (
              <a
                className="panel campaign-card"
                href={"#/campaigns/" + c.id}
                key={c.id}
              >
                <div className="card-topline">
                  <span className="card-symbol">
                    <Megaphone size={23} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  {status(c.body.status)}
                </div>
                <h2>{c.body.name}</h2>
                <p>{c.body.offer || "Awareness · No promotional offer"}</p>
                <small>
                  Offer v{c.body.offerVersion} ·{" "}
                  {
                    boot.creatives.filter(
                      (r: any) => r.body.campaignId === c.id,
                    ).length
                  }{" "}
                  creatives
                </small>
                <ArrowRight size={20} />
              </a>
            ))}
          </div>
        )}
      </>
    );
  return (
    <>
      <Header
        title={id === "new" ? "New campaign" : form.name || "Campaign"}
        description="Enter the current brief. Historical offers are never filled in automatically."
      >
        <a className="button" href="#/campaigns">
          All campaigns
        </a>
        <button className="primary" onClick={save} disabled={!form.name}>
          <Save size={16} />
          Save campaign
        </button>
      </Header>
      <div className="two-columns">
        <section className="panel form-grid campaign-form">
          <div className="form-intro">
            <h2>Campaign brief</h2>
            <p>Set the direction for your next creative.</p>
          </div>
          {[
            "name",
            "goal",
            "product",
            "market",
            "audience",
            "start",
            "end",
            "offer",
            "terms",
            "cta",
            "destination",
          ].map((k) => (
            <Field
              key={k}
              label={
                {
                  cta: "Call to action",
                  terms: "Exact terms / disclosure",
                  start: "Start date",
                  end: "End date",
                  name: "Campaign name",
                }[k] || k[0].toUpperCase() + k.slice(1)
              }
            >
              {["terms", "offer", "audience"].includes(k) ? (
                <textarea
                  value={form[k] || ""}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              ) : (
                <input
                  type={["start", "end"].includes(k) ? "date" : "text"}
                  value={form[k] || ""}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </section>
        <section>
          <div className="panel">
            <h2>Campaign workspace</h2>
            <p>
              Updating the offer creates a new offer version. Existing creatives
              and downloads keep the version used to make them.
            </p>
            {id !== "new" && (
              <>
                <p>
                  Current offer: <strong>v{record?.body?.offerVersion}</strong>
                </p>
                <div className="actions">
                  <a
                    className="button primary"
                    href={"#/static?campaign=" + id}
                  >
                    Create static
                  </a>
                  <a className="button" href={"#/video?campaign=" + id}>
                    Create video
                  </a>
                  <button
                    onClick={() =>
                      run(async () => {
                        const c = await api(`/campaigns/${id}/duplicate`, {});
                        await refresh();
                        go("campaigns/" + c.id);
                      })
                    }
                  >
                    Duplicate campaign
                  </button>
                </div>
              </>
            )}
          </div>
          {form.reviewInherited && (
            <Notice>
              Review the inherited offer, market and terms before using this
              duplicate.
            </Notice>
          )}
          <h2 className="spaced">Creative work</h2>
          {boot.creatives
            .filter((c: any) => c.body.campaignId === id)
            .map((c: any) => (
              <a
                className="panel row"
                key={c.id}
                href={"#/" + c.body.kind + "/" + c.id}
              >
                <span>
                  {c.body.name}
                  <small>
                    Document v{c.rev} · Offer v{c.body.offerVersion}
                    {c.body.offerVersion !== record?.body?.offerVersion
                      ? " · Earlier offer"
                      : ""}
                  </small>
                </span>
                <ArrowRight size={17} />
              </a>
            ))}
        </section>
      </div>
    </>
  );
}
function AssetSelect({
  assets,
  value,
  onChange,
  label = "Source media",
  audio = false,
}: {
  assets: any[];
  value: string | null;
  onChange: (id: string) => void;
  label?: string;
  audio?: boolean;
}) {
  return (
    <Field label={label}>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select imported media</option>
        {assets
          .filter((a) =>
            audio
              ? a.kind === "audio" || a.metadata.hasAudio
              : a.preview && ["image", "video"].includes(a.kind),
          )
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
      </select>
    </Field>
  );
}
function Studio({ kind, id }: { kind: "static" | "video"; id?: string }) {
  const { boot, path, run, refresh } = useApp(),
    { data: assets } = useLoad<any[]>("/assets");
  const [record, setRecord] = useState<any>(null),
    [doc, setDoc] = useState<CreativeDoc | null>(null),
    [campaign, setCampaign] = useState(
      new URLSearchParams(path.split("?")[1]).get("campaign") ||
        boot.campaigns[0]?.id ||
        "",
    ),
    [asset, setAsset] = useState(""),
    [layout, setLayout] = useState(
      new URLSearchParams(path.split("?")[1]).get("layout") || "editorial",
    ),
    [format, setFormat] = useState("portrait"),
    [selected, setSelected] = useState("headline"),
    [undo, setUndo] = useState<CreativeDoc[]>([]),
    [redo, setRedo] = useState<CreativeDoc[]>([]),
    [versions, setVersions] = useState<any[] | null>(null),
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  const dirty = !!doc && JSON.stringify(doc) !== saved;
  const ref = useRef(doc),
    recordRef = useRef(record),
    savedRef = useRef(saved),
    saving = useRef<Promise<any> | null>(null);
  ref.current = doc;
  recordRef.current = record;
  savedRef.current = saved;
  useEffect(() => {
    if (id)
      run(async () => {
        const r = await api("/record/" + id);
        setRecord(r);
        setDoc(r.body);
        setSaved(JSON.stringify(r.body));
      });
  }, [id]);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);
  function change(d: CreativeDoc) {
    if (doc) setUndo((u) => [...u.slice(-49), doc]);
    setRedo([]);
    setDoc(d);
    setPreview(false);
  }
  async function save() {
    if (saving.current) await saving.current;
    const snapshot = ref.current;
    if (!snapshot || !recordRef.current) return null;
    if (JSON.stringify(snapshot) === savedRef.current) return recordRef.current;
    const pending = (async () => {
      const r = await api(
        "/creatives/" + id,
        { body: snapshot, expectedVersion: recordRef.current.rev },
        "PUT",
      );
      recordRef.current = r;
      savedRef.current = JSON.stringify(r.body);
      setRecord(r);
      setSaved(savedRef.current);
      await refresh();
      return r;
    })();
    saving.current = pending;
    try {
      return await pending;
    } finally {
      saving.current = null;
    }
  }
  useEffect(() => {
    if (!dirty || !id) return;
    const timer = setTimeout(() => run(save), 1200);
    return () => clearTimeout(timer);
  }, [doc, record?.rev]);
  async function render() {
    setBusy(true);
    await run(async () => {
      const r = dirty ? await save() : record;
      await api("/jobs", {
        kind: "render",
        payload: { creativeId: id, version: r.rev },
        key: crypto.randomUUID(),
      });
      go("activity");
    });
    setBusy(false);
  }
  if (!id)
    return (
      <>
        <Header
          title={kind === "static" ? "Static Studio" : "Video & UGC"}
          description={
            kind === "static"
              ? "Turn your real company assets into a branded creative."
              : "Build a commercial or walkthrough with imported company media."
          }
        />
        <div className="two-columns">
          <section className="panel form-grid studio-start">
            <div className="section-kicker">Start creating</div>
            <h2>Create something new</h2>
            <Field label="Campaign">
              <select
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
              >
                <option value="">Choose a campaign</option>
                {boot.campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.body.name}
                  </option>
                ))}
              </select>
            </Field>
            <AssetSelect
              assets={assets || []}
              value={asset}
              onChange={setAsset}
            />
            <Field label="Layout">
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
              >
                <option value="editorial">Editorial · image and offer</option>
                <option value="showcase">Product showcase</option>
                <option value="split">Split composition</option>
              </select>
            </Field>
            <Field label="Format">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="square">Square · 1080 × 1080</option>
                <option value="portrait">Portrait · 1080 × 1350</option>
                <option value="vertical">Vertical · 1080 × 1920</option>
              </select>
            </Field>
            <button
              className="primary"
              disabled={!campaign}
              onClick={() =>
                run(async () => {
                  const r = await api("/creatives", {
                    kind,
                    campaignId: campaign,
                    assetId: asset || undefined,
                    layout,
                    format,
                  });
                  await refresh();
                  go(kind + "/" + r.id);
                })
              }
            >
              <Plus size={17} />
              Create editable draft
            </button>
            {!campaign && (
              <a href="#/campaigns/new">Create a campaign first →</a>
            )}
          </section>
          <section>
            <div className="panel studio-brand-intro">
              <h2>Your company. Your creative.</h2>
              <p>
                Original photographs, exact copy and a versioned design system.
                Change one element without rebuilding everything.
              </p>
              <div className="photo-strip">
                {assets
                  ?.filter((a) => a.kind === "image" && a.preview)
                  .slice(0, 3)
                  .map((a) => (
                    <img key={a.id} src={media(a.id)} alt={a.name} />
                  ))}
              </div>
            </div>
            {kind === "video" && (
              <Notice>
                Real-media assembly is available. Generated presenters, voices
                and video models remain unavailable until a provider is verified
                and connected.
              </Notice>
            )}
            <h2 className="spaced">Continue editing</h2>
            {boot.creatives
              .filter((c: any) => c.body.kind === kind)
              .map((c: any) => (
                <a
                  className="panel row"
                  key={c.id}
                  href={"#/" + kind + "/" + c.id}
                >
                  <span>
                    {c.body.name}
                    <small>Document v{c.rev}</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
              ))}
          </section>
        </div>
      </>
    );
  if (!doc) return <div className="loading">Loading creative…</div>;
  const layer = doc.layers.find((l) => l.id === selected),
    [w, h] = dimensions[doc.format];
  const patch = (v: object) =>
    change({
      ...doc,
      layers: doc.layers.map((l) => (l.id === selected ? { ...l, ...v } : l)),
    });
  return (
    <>
      <Header
        title={doc.name}
        description={`Offer v${doc.offerVersion} · Brand v${doc.brandVersion} · Document v${record.rev}`}
      >
        <span role="status" className="save-state">
          {dirty ? "Saving changes…" : "Saved"}
        </span>
        <button
          disabled={!undo.length}
          aria-label="Undo"
          onClick={() => {
            setRedo([...redo, doc]);
            setDoc(undo.at(-1)!);
            setUndo(undo.slice(0, -1));
            setPreview(false);
          }}
        >
          <Undo2 size={17} />
        </button>
        <button
          disabled={!redo.length}
          aria-label="Redo"
          onClick={() => {
            setUndo([...undo, doc]);
            setDoc(redo.at(-1)!);
            setRedo(redo.slice(0, -1));
            setPreview(false);
          }}
        >
          <Redo2 size={17} />
        </button>
        <button disabled={!dirty} onClick={() => run(save)}>
          <Save size={16} />
          Save
        </button>
        <button className="primary" disabled={busy} onClick={render}>
          <Play size={16} />
          {kind === "video" ? "Render MP4" : "Render PNG"}
        </button>
      </Header>
      <>
        {doc.testBrief && (
          <Notice>
            Next test: {doc.testBrief.change} · Target metric:{" "}
            {doc.testBrief.metric}. {doc.testBrief.interpretation}
          </Notice>
        )}
      </>
      <div className="studio">
        <aside className="panel studio-controls">
          <Field label="Creative name">
            <input
              value={doc.name}
              onChange={(e) => change({ ...doc, name: e.target.value })}
            />
          </Field>
          <Field label="Placement">
            <select
              value={doc.format}
              onChange={(e) =>
                run(async () => {
                  if (dirty) await save();
                  const r = await api(`/creatives/${id}/adapt`, {
                    format: e.target.value,
                    expectedVersion: dirty ? record.rev + 1 : record.rev,
                  });
                  setRecord(r);
                  setDoc(r.body);
                  setSaved(JSON.stringify(r.body));
                  setPreview(false);
                })
              }
            >
              {Object.keys(dimensions).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <h3>Layers</h3>
          <div className="layer-list">
            {doc.layers.map((l) => (
              <button
                className={selected === l.id ? "selected" : ""}
                onClick={() => setSelected(l.id)}
                key={l.id}
              >
                {l.role}
                <small>{l.type}</small>
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              run(async () => setVersions(await api(`/record/${id}/versions`)))
            }
          >
            Version history
          </button>
          {versions && (
            <div>
              {versions.map((v) => (
                <button
                  className="list-button"
                  key={v.rev}
                  onClick={() => change(v.body)}
                >
                  Restore v{v.rev}
                  <small>{new Date(v.created).toLocaleDateString()}</small>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() =>
              run(async () => {
                const r = await api(`/creatives/${id}/variation`, {});
                await refresh();
                go(kind + "/" + r.id);
              })
            }
          >
            Create variation
          </button>
          <button
            onClick={() =>
              run(async () => {
                if (dirty) await save();
                const r = await api(`/creatives/${id}/apply-offer`, {
                  expectedVersion: dirty ? record.rev + 1 : record.rev,
                });
                setRecord(r);
                setDoc(r.body);
                setSaved(JSON.stringify(r.body));
              })
            }
          >
            Apply current offer
          </button>
        </aside>
        <section className="canvas-workspace">
          <div className="canvas-meta">
            <span>
              {w} × {h}
            </span>
            <button
              className="text-button"
              disabled={dirty}
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Edit layers" : "Exact saved preview"}
            </button>
          </div>
          {preview ? (
            <img
              className="exact-preview"
              src={`/api/creatives/${id}/preview?v=${record.rev}`}
              alt="Rendered saved creative"
            />
          ) : (
            <div className="canvas" style={{ aspectRatio: `${w}/${h}` }}>
              {doc.layers.map((l) => (
                <button
                  aria-label={`Select ${l.role} layer`}
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                  className={
                    "canvas-layer " + (l.id === selected ? "chosen" : "")
                  }
                  style={{
                    left: `${(l.x / w) * 100}%`,
                    top: `${(l.y / h) * 100}%`,
                    width: `${(l.w / w) * 100}%`,
                    height: `${(l.h / h) * 100}%`,
                    background: l.type === "shape" ? l.fill : "transparent",
                    color: l.color,
                    fontSize: `${(l.fontSize / w) * 100}cqw`,
                    lineHeight: 1.2,
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                    overflow: "hidden",
                  }}
                >
                  {["photo", "logo"].includes(l.type) ? (
                    l.assetId ? (
                      <img
                        src={media(l.assetId)}
                        alt={l.role}
                        style={{
                          objectFit: l.type === "logo" ? "contain" : "cover",
                          objectPosition: `${l.cropX * 100}% ${l.cropY * 100}%`,
                          transform: `scale(${l.zoom})`,
                        }}
                      />
                    ) : (
                      <span className="missing-media">
                        {l.type === "photo"
                          ? "Select a source image"
                          : "Map your official logo"}
                      </span>
                    )
                  ) : l.type === "text" ? (
                    <span className="text-layer">{l.text}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          <p className="caption">
            Editable layout preview. Use Exact saved preview to inspect final
            font wrapping before export.
          </p>
          {kind === "video" && (
            <Notice>
              The canvas is your end card. Scenes below assemble in order,
              followed by a three-second end card.
            </Notice>
          )}
        </section>
        <aside className="panel studio-controls">
          <h2>{layer?.role || "Layer"}</h2>
          {layer && (
            <>
              {layer.type === "text" && (
                <>
                  <Field label="Exact text">
                    <textarea
                      value={layer.text}
                      onChange={(e) => patch({ text: e.target.value })}
                    />
                  </Field>
                  <Field label="Font size">
                    <input
                      type="number"
                      min="10"
                      max="180"
                      value={layer.fontSize}
                      onChange={(e) =>
                        patch({ fontSize: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Text color">
                    <input
                      type="color"
                      value={layer.color}
                      onChange={(e) => patch({ color: e.target.value })}
                    />
                  </Field>
                </>
              )}
              {layer.type === "shape" && (
                <Field label="Fill">
                  <input
                    type="color"
                    value={layer.fill}
                    onChange={(e) => patch({ fill: e.target.value })}
                  />
                </Field>
              )}
              {["photo", "logo"].includes(layer.type) && (
                <>
                  <Field label="Asset">
                    <select
                      value={layer.assetId || ""}
                      onChange={(e) =>
                        patch({ assetId: e.target.value || null })
                      }
                    >
                      <option value="">No asset</option>
                      {assets
                        ?.filter((a) => a.preview)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                  {layer.type === "photo" &&
                    ["cropX", "cropY", "zoom"].map((k) => (
                      <Field key={k} label={k}>
                        <input
                          type="range"
                          min={k === "zoom" ? 1 : 0}
                          max={k === "zoom" ? 4 : 1}
                          step="0.01"
                          value={(layer as any)[k]}
                          onChange={(e) =>
                            patch({ [k]: Number(e.target.value) })
                          }
                        />
                      </Field>
                    ))}
                </>
              )}
              <div className="form-grid compact">
                {["x", "y", "w", "h"].map((k) => (
                  <Field
                    key={k}
                    label={{ x: "Left", y: "Top", w: "Width", h: "Height" }[k]!}
                  >
                    <input
                      type="number"
                      value={(layer as any)[k]}
                      onChange={(e) => patch({ [k]: Number(e.target.value) })}
                    />
                  </Field>
                ))}
              </div>
            </>
          )}
          <Field label="Accompanying copy">
            <textarea
              value={doc.copy}
              onChange={(e) => change({ ...doc, copy: e.target.value })}
            />
          </Field>
        </aside>
      </div>
      {kind === "video" && (
        <section className="panel spaced">
          <div className="section-heading">
            <h2>
              Scenes · {doc.scenes.reduce((n, s) => n + s.duration, 3)} seconds
              total
            </h2>
            <button
              onClick={() =>
                change({
                  ...doc,
                  scenes: [
                    ...doc.scenes,
                    {
                      id: crypto.randomUUID(),
                      assetId: null,
                      duration: 6,
                      trim: 0,
                      caption: "",
                      mute: true,
                      volume: 1,
                      source: "company",
                      narration: "",
                      shotDirection: "",
                    },
                  ],
                })
              }
            >
              Add scene
            </button>
          </div>
          <section className="storyboard-brief">
            <h3>Script & storyboard</h3>
            <div className="form-grid compact">
              <Field label="Video approach">
                <select
                  value={doc.videoBrief?.style || "commercial"}
                  onChange={(e) =>
                    change({
                      ...doc,
                      videoBrief: {
                        script: "",
                        presenterDirection: "",
                        voiceDirection: "",
                        ...doc.videoBrief,
                        style: e.target.value as
                          "commercial" | "product" | "ugc",
                      },
                    })
                  }
                >
                  <option value="commercial">Commercial</option>
                  <option value="product">Product walkthrough</option>
                  <option value="ugc">UGC / presenter direction</option>
                </select>
              </Field>
              <Field label="Voice direction">
                <input
                  value={doc.videoBrief?.voiceDirection || ""}
                  onChange={(e) =>
                    change({
                      ...doc,
                      videoBrief: {
                        style: "commercial",
                        script: "",
                        presenterDirection: "",
                        ...doc.videoBrief,
                        voiceDirection: e.target.value,
                      },
                    })
                  }
                  placeholder="Tone, pace and pronunciation notes"
                />
              </Field>
            </div>
            <Field label="Working script">
              <textarea
                value={doc.videoBrief?.script || ""}
                onChange={(e) =>
                  change({
                    ...doc,
                    videoBrief: {
                      style: "commercial",
                      presenterDirection: "",
                      voiceDirection: "",
                      ...doc.videoBrief,
                      script: e.target.value,
                    },
                  })
                }
                placeholder="Write the spoken script. Put one scene on each line to apply it below."
              />
            </Field>
            <button
              disabled={
                !doc.videoBrief?.script.trim() ||
                doc.videoBrief.script.split("\n").filter((v) => v.trim())
                  .length !== doc.scenes.length
              }
              onClick={() => {
                const lines = doc
                  .videoBrief!.script.split("\n")
                  .filter((v) => v.trim());
                change({
                  ...doc,
                  scenes: doc.scenes.map((s, i) => ({
                    ...s,
                    narration: lines[i],
                    caption: lines[i],
                  })),
                });
              }}
            >
              Apply one script line per scene
            </button>
            <p>
              Applying the script changes narration notes and captions. It
              preserves scene media, timing, audio and IDs. Match the number of
              nonempty lines to the number of scenes.
            </p>
            {doc.videoBrief?.style === "ugc" && (
              <>
                <Field label="Presenter direction">
                  <textarea
                    value={doc.videoBrief.presenterDirection}
                    onChange={(e) =>
                      change({
                        ...doc,
                        videoBrief: {
                          ...doc.videoBrief!,
                          presenterDirection: e.target.value,
                        },
                      })
                    }
                    placeholder="Presenter, delivery, setting and shot direction"
                  />
                </Field>
                <Notice>
                  Use authorized presenter footage and recorded voice from your
                  assets. Generated presenters and synthetic voices need a
                  verified provider connection; these notes do not generate
                  media.
                </Notice>
              </>
            )}
            <div className="timeline" aria-label="Scene timeline">
              {doc.scenes.map((s, i) => (
                <button
                  key={s.id}
                  style={{ flexGrow: s.duration }}
                  onClick={() =>
                    document
                      .getElementById("scene-" + s.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                >
                  Scene {i + 1}
                  <small>{s.duration}s</small>
                </button>
              ))}
              <span>
                End card<small>3s</small>
              </span>
            </div>
          </section>
          <div className="scene-grid">
            {doc.scenes.map((s, i) => {
              const edit = (v: object) =>
                change({
                  ...doc,
                  scenes: doc.scenes.map((x) =>
                    x.id === s.id ? { ...x, ...v } : x,
                  ),
                });
              return (
                <div className="scene" key={s.id} id={"scene-" + s.id}>
                  <h3>Scene {i + 1}</h3>
                  {s.assetId && (
                    <img src={media(s.assetId)} alt={"Scene " + (i + 1)} />
                  )}
                  <AssetSelect
                    assets={assets || []}
                    value={s.assetId}
                    onChange={(assetId) => edit({ assetId })}
                  />
                  <Field label="Shot direction">
                    <textarea
                      value={s.shotDirection || ""}
                      onChange={(e) => edit({ shotDirection: e.target.value })}
                      placeholder="Framing, action and product detail"
                    />
                  </Field>
                  <Field label="Narration notes">
                    <textarea
                      value={s.narration || ""}
                      onChange={(e) => edit({ narration: e.target.value })}
                      placeholder="Recorded voice script for this scene"
                    />
                  </Field>
                  <Field label="Caption">
                    <textarea
                      value={s.caption}
                      onChange={(e) => edit({ caption: e.target.value })}
                    />
                  </Field>
                  <div className="form-grid compact">
                    <Field label="Duration (seconds)">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={s.duration}
                        onChange={(e) =>
                          edit({ duration: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label="Trim start (seconds)">
                      <input
                        type="number"
                        min="0"
                        value={s.trim}
                        onChange={(e) => edit({ trim: Number(e.target.value) })}
                      />
                    </Field>
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={s.mute}
                      onChange={(e) => edit({ mute: e.target.checked })}
                    />{" "}
                    Mute source audio
                  </label>
                  <Field label="Source volume">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step=".05"
                      value={s.volume}
                      onChange={(e) => edit({ volume: Number(e.target.value) })}
                    />
                  </Field>
                  <div className="actions">
                    <button
                      disabled={i === 0}
                      onClick={() => {
                        const scenes = [...doc.scenes];
                        [scenes[i - 1], scenes[i]] = [scenes[i], scenes[i - 1]];
                        change({ ...doc, scenes });
                      }}
                    >
                      Move earlier
                    </button>
                    <button
                      onClick={() =>
                        change({
                          ...doc,
                          scenes: doc.scenes.filter((x) => x.id !== s.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="form-grid compact spaced">
            <AssetSelect
              assets={assets || []}
              audio
              value={doc.musicAssetId}
              label="Music"
              onChange={(musicAssetId) =>
                change({ ...doc, musicAssetId: musicAssetId || null })
              }
            />
            <AssetSelect
              assets={assets || []}
              audio
              value={doc.voiceAssetId}
              label="Recorded voiceover"
              onChange={(voiceAssetId) =>
                change({ ...doc, voiceAssetId: voiceAssetId || null })
              }
            />
            <Field label="Music volume">
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={doc.musicVolume}
                onChange={(e) =>
                  change({ ...doc, musicVolume: Number(e.target.value) })
                }
              />
            </Field>
          </div>
        </section>
      )}
    </>
  );
}
function Assets() {
  const { run } = useApp(),
    { data: assets, load } = useLoad<any[]>("/assets"),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState("all"),
    [detail, setDetail] = useState<any>(null);
  async function upload(file: File, catalogId?: string) {
    await run(async () => {
      const r = await fetch("/api/assets/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Studio-Request": "1",
          "X-File-Name": encodeURIComponent(file.name),
          ...(catalogId ? { "X-Catalog-ID": catalogId } : {}),
        },
        body: file,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await load();
      setDetail(data);
    });
  }
  const rows = assets?.filter(
    (a) =>
      (a.name + " " + a.collection).toLowerCase().includes(q.toLowerCase()) &&
      (filter === "all" || (filter === "ready" ? a.preview : !a.checksum)),
  );
  return (
    <>
      <Header
        title="My Assets"
        description="Original media, source provenance, and the complete intake ledger."
      >
        <label className="button primary">
          <Upload size={16} />
          Upload original
          <input
            hidden
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) upload(e.target.files[0]);
            }}
          />
        </label>
      </Header>
      <div className="toolbar">
        <input
          aria-label="Search assets"
          placeholder="Search filenames or collections…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="Asset status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All sources ({assets?.length || 0})</option>
          <option value="ready">Preview ready</option>
          <option value="missing">Awaiting originals</option>
        </select>
      </div>
      <Notice>
        {assets?.filter((a) => a.checksum).length || 0} originals stored.
        Catalog links remain separate from imported media. Unsupported files
        retain their original.
      </Notice>
      {detail && (
        <section className="panel spaced">
          <div className="section-heading">
            <h2>{detail.name}</h2>
            <button onClick={() => setDetail(null)}>Close details</button>
          </div>
          {status(detail.status)}
          <p>{detail.error || detail.metadata?.previewError}</p>
          <dl>
            <dt>Source</dt>
            <dd>
              {detail.source_url ? (
                <a href={detail.source_url} target="_blank" rel="noreferrer">
                  Open supplied Drive source ↗
                </a>
              ) : (
                "Direct upload"
              )}
            </dd>
            <dt>Checksum (SHA-256)</dt>
            <dd className="break">{detail.checksum || "Not imported"}</dd>
            <dt>Size</dt>
            <dd>
              {detail.bytes
                ? `${(detail.bytes / 1048576).toFixed(2)} MB`
                : "Unknown"}
            </dd>
            <dt>Usage</dt>
            <dd>{detail.metadata?.usage || "Review source-specific usage"}</dd>
          </dl>
          <div className="actions">
            {detail.checksum && (
              <a className="button" href={`/api/assets/${detail.id}/original`}>
                Download original
              </a>
            )}
            {detail.source_id && !detail.checksum && (
              <button
                onClick={() =>
                  run(async () => {
                    await api("/jobs", {
                      kind: "intake",
                      payload: { assetId: detail.id },
                      key: crypto.randomUUID(),
                    });
                    go("activity");
                  })
                }
              >
                Import from Drive
              </button>
            )}
            <label className="button">
              Supply original
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) upload(e.target.files[0], detail.id);
                }}
              />
            </label>
          </div>
        </section>
      )}
      <div className="asset-grid">
        {rows?.slice(0, 100).map((a) => (
          <button
            className="asset-card"
            key={a.id}
            onClick={() => setDetail(a)}
          >
            {a.preview ? (
              <img loading="lazy" src={media(a.id)} alt="" />
            ) : (
              <div className="asset-placeholder">
                <ImageIcon size={25} />
                <span>{a.kind}</span>
              </div>
            )}
            <div>
              <strong>{a.name}</strong>
              <small>{a.collection || "Company upload"}</small>
              {status(a.status)}
            </div>
          </button>
        ))}
      </div>
      {(rows?.length || 0) > 100 && (
        <Notice>
          Showing 100 of {rows?.length}. Search to narrow the catalog.
        </Notice>
      )}
    </>
  );
}
function Activity() {
  const { run, boot } = useApp(),
    { data: jobs, load } = useLoad<any[]>("/jobs"),
    [selected, setSelected] = useState<string[]>([]),
    [playing, setPlaying] = useState<any>(null);
  useEffect(() => {
    const timer = setInterval(load, 2500);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <Header
        title="Activity & downloads"
        description="Persistent jobs, ready files, and focused retries."
      >
        {selected.length > 0 && (
          <a
            className="button primary"
            href={"/api/export?jobs=" + selected.join(",")}
          >
            <Download size={16} />
            Download selected ZIP
          </a>
        )}
      </Header>
      {playing && (
        <div className="panel">
          <button onClick={() => setPlaying(null)}>Close preview</button>
          {playing.output.file.endsWith(".mp4") ? (
            <video controls src={`/api/jobs/${playing.id}/file?play=1`} />
          ) : (
            <img
              className="output-preview"
              src={`/api/jobs/${playing.id}/file?play=1`}
              alt="Rendered creative"
            />
          )}
        </div>
      )}
      {!jobs?.length ? (
        <Empty title="Your creative work will appear here">
          <p>Render a saved static or video to create a durable download.</p>
        </Empty>
      ) : (
        jobs.map((j) => (
          <article className="panel job" key={j.id}>
            <div className="row">
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(j.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, j.id]
                        : selected.filter((x) => x !== j.id),
                    )
                  }
                />{" "}
                <strong>
                  {j.kind === "render" ? "Creative render" : "Source import"}
                </strong>
              </label>
              {status(j.status)}
            </div>
            <small>
              {new Date(j.created).toLocaleString()} · Attempt {j.attempt} ·{" "}
              {j.payload.version ? "Creative v" + j.payload.version : ""}
            </small>
            {j.error && <p className="failure">{j.error}</p>}
            {j.progress.scenes?.map((s: any, i: number) => (
              <p key={s.id}>
                Scene {i + 1}: {s.status}
                {s.error ? " — " + s.error : ""}
              </p>
            ))}
            {j.output?.warnings?.map((w: string) => (
              <Notice key={w}>{w}</Notice>
            ))}
            <div className="actions">
              {j.status === "ready" && j.output?.file && (
                <>
                  <button onClick={() => setPlaying(j)}>Preview</button>
                  <a className="button primary" href={`/api/jobs/${j.id}/file`}>
                    Download {j.output.file.endsWith(".mp4") ? "MP4" : "PNG"}
                  </a>
                  <a className="button" href={"/api/export?jobs=" + j.id}>
                    Image / video + copy + manifest
                  </a>
                </>
              )}
              {["queued", "running"].includes(j.status) && (
                <button
                  onClick={() =>
                    run(async () => {
                      await api(`/jobs/${j.id}/cancel`, {});
                      load();
                    })
                  }
                >
                  Cancel
                </button>
              )}
              {["failed", "partial", "canceled"].includes(j.status) && (
                <button
                  onClick={() =>
                    run(async () => {
                      await api(`/jobs/${j.id}/retry`, {});
                      load();
                    })
                  }
                >
                  Retry this version
                </button>
              )}
              {j.payload.creativeId && (
                <a
                  className="button"
                  href={
                    "#/" +
                    (boot.creatives.find(
                      (c: any) => c.id === j.payload.creativeId,
                    )?.body.kind || "static") +
                    "/" +
                    j.payload.creativeId
                  }
                >
                  Open document
                </a>
              )}
            </div>
          </article>
        ))
      )}
    </>
  );
}
function Brand() {
  const { boot, run, refresh } = useApp(),
    { data: assets } = useLoad<any[]>("/assets"),
    [form, setForm] = useState(boot.brand.body);
  return (
    <>
      <Header
        title="Brand System"
        description={`Creative system v${boot.brand.rev} · ${boot.brand.body.source}`}
      />
      <div className="two-columns">
        <section className="panel">
          <h2>Your company identity</h2>
          {form.logoAssetId && (
            <img
              className="brand-logo"
              src={media(form.logoAssetId)}
              alt={boot.company.name}
            />
          )}
          <div className="swatches">
            {Object.entries(form.rules.colors || {})
              .filter(([, v]) => typeof v === "string")
              .map(([k, v]) => (
                <div key={k}>
                  <span style={{ background: v as string }} />
                  <small>
                    {k}
                    <br />
                    {v as string}
                  </small>
                </div>
              ))}
          </div>
          <p>
            Use black text on Renewal Green. Preserve the exact logo artwork and
            registration mark.
          </p>
          <h3>Typography</h3>
          <p>
            {form.rules.typography?.primary || "Company typography"}
            <br />
            {form.fontUsage}
          </p>
          <Notice>
            Interface uses Arial / system sans-serif until webfont permission is
            recorded. Historical ads are references; the current campaign
            supplies offers.
          </Notice>
        </section>
        <section className="panel form-grid">
          <h2>Versioned source mapping</h2>
          <Field label="Official logo artwork">
            <select
              value={form.logoAssetId || ""}
              onChange={(e) =>
                setForm({ ...form, logoAssetId: e.target.value || null })
              }
            >
              <option value="">Not mapped</option>
              {assets
                ?.filter((a) => a.preview)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Source font original">
            <select
              value={form.fontAssetId || ""}
              onChange={(e) =>
                setForm({ ...form, fontAssetId: e.target.value || null })
              }
            >
              <option value="">Not mapped</option>
              {assets
                ?.filter((a) => a.kind === "font" && a.checksum)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Font usage evidence">
            <textarea
              value={form.fontUsage}
              onChange={(e) => setForm({ ...form, fontUsage: e.target.value })}
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={form.renderFontApproved}
              onChange={(e) =>
                setForm({ ...form, renderFontApproved: e.target.checked })
              }
            />{" "}
            Permission confirmed for raster output
          </label>
          <button
            className="primary"
            disabled={boot.actor.role !== "owner"}
            onClick={() =>
              run(async () => {
                await api(
                  "/brand",
                  { ...form, expectedVersion: boot.brand.rev },
                  "PUT",
                );
                await refresh();
              })
            }
          >
            Save new brand version
          </button>
          <p>Previous creatives keep their original brand version.</p>
        </section>
      </div>
      <ThemeControls />
    </>
  );
}
function Models() {
  const { boot } = useApp(),
    [{ q, filter }, setModelFilters] = useRouteFilters({
      q: "",
      filter: "all",
    });
  const rows = boot.models.filter(
    (m: any) =>
      `${m.observedLabel || ""} ${m.providerDisplayName || ""}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (filter === "all" ||
        m.observedTask === filter ||
        (filter === "assistant" &&
          !["image", "video"].includes(m.observedTask))),
  );
  return (
    <>
      <Header
        title="AI Models"
        description="The complete observed inventory. Provider identity and access must be verified before generation is enabled."
      />
      <div className="toolbar">
        <input
          aria-label="Search models"
          placeholder="Search models…"
          value={q}
          onChange={(e) => setModelFilters({ q: e.target.value, filter })}
        />
        <select
          aria-label="Model type"
          value={filter}
          onChange={(e) => setModelFilters({ q, filter: e.target.value })}
        >
          <option value="all">All models</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="assistant">Assistant</option>
        </select>
      </div>
      <p>{rows.length} entries · Generation is not connected yet.</p>
      <div className="cards model-catalog">
        {rows.map((m: any) => (
          <div className="panel" key={m.id}>
            <div className="card-topline">
              <ModelMark model={m} />
              <span className="chip">{m.observedTask}</span>
            </div>
            <h2 className="spaced">{m.observedLabel}</h2>
            <p>
              {m.description ||
                "Provider identity and capabilities have not been verified."}
            </p>
            <small>
              {m.providerDisplayName
                ? `${m.providerDisplayName} · Not connected`
                : "Provider unverified · Reference only"}
            </small>
            <button disabled>
              {m.verificationStatus.includes("retired")
                ? "Retired"
                : "Unavailable"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
function Insights() {
  const { run, boot, refresh } = useApp(),
    [filters, setFilters] = useRouteFilters(reportFilters),
    {
      data: report,
      reload: load,
      error: reportError,
    } = useResource("/insights?" + new URLSearchParams(filters)),
    [type, setType] = useState("report"),
    [csv, setCsv] = useState(""),
    [sourceName, setSourceName] = useState(""),
    [mapping, setMapping] = useState("{}"),
    [preview, setPreview] = useState<any>(null),
    [ad, setAd] = useState<any>(null),
    [creative, setCreative] = useState(""),
    [version, setVersion] = useState(1),
    [evidence, setEvidence] = useState(""),
    [change, setChange] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  useEffect(() => setAd(null), [JSON.stringify(filters)]);
  const fmt = (n: any) =>
    n === null || n === undefined
      ? "Unavailable"
      : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <>
      <Header
        title="Creative Insights"
        description="Traceable source reports, deterministic metrics, and your next creative test."
      >
        <a href="#/settings" className="button">
          Meta · Not connected
        </a>
      </Header>
      <div className="toolbar">
        {["start", "end", "currency", "account", "attribution"].map((k) => (
          <Field key={k} label={k}>
            <input
              type={["start", "end"].includes(k) ? "date" : "text"}
              value={filters[k] || ""}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <SavedViews filters={filters} onSelect={setFilters} />
      <div className="toolbar spaced">
        <a className="button" href="#/crm">
          CRM outcomes
        </a>
        <a className="button" href="#/review">
          Creative review
        </a>
      </div>
      <Notice>
        Actual results come only from imported reports. No reliable forecast or
        cross-company benchmark is available.
      </Notice>
      {!report ? (
        <Notice>{reportError || "Loading report…"}</Notice>
      ) : !report.rows.length ? (
        <Empty title="Bring your results into the picture">
          <p>
            Import an authorized report below. No sample metrics are shown as
            actual performance.
          </p>
        </Empty>
      ) : (
        <>
          {report.groups.map((g: any) => (
            <section className="panel spaced" key={g.scope}>
              <h3>{g.scope}</h3>
              <div className="metrics">
                {[
                  ["Spend", g.spend],
                  ["Leads", g.leads],
                  ["CPL", g.cpl],
                  ["CPM", g.cpm],
                  ["Outbound CTR %", g.outboundCtr],
                ].map(([k, v]) => (
                  <div key={k}>
                    <small>{k}</small>
                    <strong>{fmt(v)}</strong>
                  </div>
                ))}
              </div>
              <small>
                Source: client-supplied reports · Missing or zero denominators
                produce unavailable rates.
              </small>
            </section>
          ))}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Spend</th>
                  <th>Leads</th>
                  <th>CPL</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {report.ads.map((a: any) => (
                  <tr key={a.key}>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => {
                          setAd(a);
                          setCreative(a.mapping?.body.creativeId || "");
                          setVersion(a.mapping?.body.version || 1);
                          setEvidence(a.mapping?.body.evidence || "");
                          setChange("");
                          setConfirmed(false);
                        }}
                      >
                        {a.name}
                      </button>
                      <a
                        className="button"
                        href={
                          "#/performance?" +
                          new URLSearchParams({
                            ...filters,
                            account: a.account,
                            adId: a.adId,
                          })
                        }
                      >
                        Performance detail
                      </a>
                    </td>
                    <td>{fmt(a.metrics?.spend)}</td>
                    <td>{fmt(a.metrics?.leads)}</td>
                    <td>{fmt(a.metrics?.cpl)}</td>
                    <td>
                      {a.mapping ? "Mapped to exact version" : "Unmatched"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {ad && (
        <section className="panel spaced">
          <div className="section-heading">
            <h2>{ad.name}</h2>
            <button onClick={() => setAd(null)}>Close</button>
          </div>
          <p>
            Account {ad.account} · Ad {ad.adId}
          </p>
          <div className="form-grid compact">
            <Field label="Exact creative">
              <select
                value={creative}
                onChange={(e) => {
                  setCreative(e.target.value);
                  setVersion(
                    boot.creatives.find((c: any) => c.id === e.target.value)
                      ?.rev || 1,
                  );
                }}
              >
                <option value="">Select</option>
                {boot.creatives.map((c: any) => (
                  <option value={c.id} key={c.id}>
                    {c.body.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Exact version">
              <input
                type="number"
                min="1"
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Match evidence">
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe how this source ad matches the exact exported creative."
            />
          </Field>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />{" "}
            I checked the exact source creative, not just its name.
          </label>
          <button
            disabled={!creative || !confirmed || !evidence}
            onClick={() =>
              run(async () => {
                const m = await api("/mappings", {
                  creativeId: creative,
                  version,
                  account: ad.account,
                  adId: ad.adId,
                  evidence,
                  confirmed,
                });
                setAd({ ...ad, mapping: m });
                load();
              })
            }
          >
            Save reviewed match
          </button>
          {ad.mapping && (
            <>
              <Field label="Proposed next test">
                <textarea
                  value={change}
                  onChange={(e) => setChange(e.target.value)}
                />
              </Field>
              <button
                disabled={!change}
                onClick={() =>
                  run(async () => {
                    const c = await api("/next-variation", {
                      mappingId: ad.mapping.id,
                      change,
                      metric: "CPL",
                      filters,
                    });
                    await refresh();
                    go(c.body.kind + "/" + c.id);
                  })
                }
              >
                Create private variation brief
              </button>
            </>
          )}
        </section>
      )}
      <ImportWizard onImported={load} />
      <section className="panel spaced">
        <h2>CRM match coverage</h2>
        <p>
          {report?.crm.matched || 0} matched of {report?.crm.total || 0} source
          rows · {report?.crm.unmatched || 0} unmatched. Source attribution is
          never guessed.
        </p>
      </section>
    </>
  );
}
function Feed({ id }: { id?: string }) {
  const { run } = useApp(),
    {
      data: posts,
      reload: load,
      error: feedError,
    } = useResource<any[]>("/feed"),
    [filters, setFilters] = useRouteFilters({ query: "", category: "" }),
    [title, setTitle] = useState(""),
    [text, setText] = useState(""),
    [audience, setAudience] = useState("company"),
    [category, setCategory] = useState("General discussion"),
    [poll, setPoll] = useState(""),
    [thread, setThread] = useState(""),
    [draft, setDraft] = useState<any>(null);
  useEffect(() => {
    run(async () => {
      const ds = await api("/records/draft");
      const d = ds.find((x: any) => x.body.type === "feed");
      if (d) {
        setDraft(d);
        setTitle(d.body.title || "");
        setText(d.body.text || "");
      }
    });
  }, []);
  const returnQuery = "?" + new URLSearchParams(filters);
  if (id)
    return (
      <CommunityThread
        key={id}
        id={id}
        fullPage
        onClose={() => go("feed" + returnQuery)}
        onChanged={load}
      />
    );
  const rows = posts?.filter(
    (p) =>
      (!filters.category || p.body.category === filters.category) &&
      `${p.body.title} ${p.body.text}`
        .toLowerCase()
        .includes(filters.query.toLowerCase()),
  );
  return (
    <>
      <Header
        title="Feed"
        description="Share ideas, ask for feedback, and learn together."
      />
      <div className="feed-columns">
        <section>
          <form
            className="panel form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api("/feed", {
                  title,
                  text,
                  audience,
                  category,
                  options: poll.split("\n").filter(Boolean),
                });
                setTitle("");
                setText("");
                setPoll("");
                if (draft) await api("/drafts/" + draft.id, {}, "DELETE");
                setDraft(null);
                load();
              });
            }}
          >
            <h2>Share something with the community…</h2>
            <Field label="Audience">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="company">My company only</option>
                <option value="shared">Shared community · all companies</option>
              </select>
            </Field>
            <Field label="Title">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Post">
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "General discussion",
                  "Intros",
                  "Feedback",
                  "Requests",
                  "Templates",
                  "Wins",
                  "News",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <details>
              <summary>Add a poll</summary>
              <Field label="Choices (one per line, at least two)">
                <textarea
                  value={poll}
                  onChange={(e) => setPoll(e.target.value)}
                />
              </Field>
            </details>
            <div className="actions">
              <button className="primary" disabled={!title || !text}>
                Publish to{" "}
                {audience === "shared" ? "shared community" : "my company"}
              </button>
              <button
                type="button"
                onClick={() =>
                  run(async () =>
                    setDraft(
                      await api("/drafts", {
                        id: draft?.id,
                        expectedVersion: draft?.rev,
                        body: { type: "feed", title, text },
                      }),
                    ),
                  )
                }
              >
                Save draft
              </button>
            </div>
            {draft && <small>Draft saved privately.</small>}
          </form>
          <div className="toolbar spaced">
            <Field label="Search discussions">
              <input
                type="search"
                value={filters.query}
                onChange={(e) =>
                  setFilters({ ...filters, query: e.target.value })
                }
              />
            </Field>
            <Field label="Filter category">
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <option value="">All categories</option>
                {[
                  "General discussion",
                  "Intros",
                  "Feedback",
                  "Requests",
                  "Templates",
                  "Wins",
                  "News",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          {!posts && <Notice>{feedError || "Loading discussions…"}</Notice>}
          {posts && !rows?.length && (
            <Empty title="Start the conversation">
              <p>
                {posts.length
                  ? "No discussions match these filters."
                  : "No member activity has been seeded."}
              </p>
            </Empty>
          )}
          {rows?.map((p) => (
            <article className="panel spaced" key={p.id}>
              <small>
                {p.body.author} · {p.company ? "Company" : "Shared community"} ·{" "}
                {new Date(p.created).toLocaleDateString()}
              </small>
              <span className="chip">{p.body.category}</span>
              <h2 className="spaced">{p.body.title}</h2>
              <p className="preserve">{p.body.text}</p>
              {p.body.options?.map((o: string, i: number) => (
                <button
                  key={i}
                  onClick={() =>
                    run(async () => {
                      await api(`/feed/${p.id}/vote`, { choice: i });
                      load();
                    })
                  }
                >
                  {o} · {p.votes?.[i] || 0}
                </button>
              ))}
              <div className="actions">
                <button
                  onClick={() =>
                    run(async () => {
                      await api(`/feed/${p.id}/react`, {});
                      load();
                    })
                  }
                >
                  Like · {p.reactions}
                </button>
                <button data-thread-id={p.id} onClick={() => setThread(p.id)}>
                  Comments · {p.comments}
                </button>
                <button
                  onClick={() =>
                    run(async () => {
                      await api(`/feed/${p.id}/report`, {});
                      load();
                    })
                  }
                >
                  Report
                </button>
              </div>
            </article>
          ))}
        </section>
        <aside>
          <div className="panel">
            <h2>Shared thoughtfully</h2>
            <p>
              Choose an audience before posting. Company originals and reports
              are never attached automatically.
            </p>
            <h3>Upcoming events</h3>
            <p>No events scheduled.</p>
            <a href="#/classroom" className="button">
              Visit Classroom
            </a>
          </div>
        </aside>
      </div>
      {thread && (
        <CommunityThread
          key={thread}
          id={thread}
          onClose={() => setThread("")}
          onChanged={load}
          returnQuery={returnQuery}
        />
      )}
    </>
  );
}
function Classroom() {
  const { data: playback } = useLoad<any[]>("/records/playback"),
    lastPosition = useRef(0);
  const { data: lessons } = useLoad<any[]>("/records/lesson"),
    [q, setQ] = useState(""),
    [category, setCategory] = useState("All"),
    [lesson, setLesson] = useState<any>(null);
  const rows = lessons?.filter(
    (l) =>
      (l.body.title + " " + l.body.description)
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (category === "All" || l.body.category === category),
  );
  return (
    <>
      <Header
        title="Classroom"
        description="Original guides for the tools in your workspace."
      />
      {lesson ? (
        <section className="panel lesson">
          <button onClick={() => setLesson(null)}>← Back to Classroom</button>
          <span className="chip">{lesson.body.format || "Lesson"}</span>
          <h2 className="spaced lesson-title">{lesson.body.title}</h2>
          {lesson.body.mediaAssetId || lesson.body.publicationId ? (
            <video
              controls
              src={
                lesson.body.publicationId
                  ? `/api/lessons/${lesson.id}/media`
                  : `/api/assets/${lesson.body.mediaAssetId}/play`
              }
              onLoadedMetadata={(e) => {
                const position =
                  playback?.find((p) => p.body.lessonId === lesson.id)?.body
                    .seconds || 0;
                e.currentTarget.currentTime = Math.min(
                  position,
                  e.currentTarget.duration,
                );
                lastPosition.current = position;
              }}
              onTimeUpdate={(e) => {
                if (
                  Math.abs(
                    e.currentTarget.currentTime - lastPosition.current,
                  ) >= 5
                ) {
                  lastPosition.current = e.currentTarget.currentTime;
                  api("/playback", {
                    lessonId: lesson.id,
                    seconds: e.currentTarget.currentTime,
                  }).catch(() => {});
                }
              }}
            />
          ) : (
            <Notice>
              Written guide · No recording available for this lesson.
            </Notice>
          )}
          <p className="preserve">{lesson.body.transcript}</p>
          <a href={"#/" + lesson.body.target} className="button primary">
            Try it in your workspace <ArrowRight size={16} />
          </a>
        </section>
      ) : (
        <>
          <div className="toolbar">
            <input
              aria-label="Search lessons"
              placeholder="Search tutorials and guides…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              aria-label="Lesson category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "All",
                ...new Set(lessons?.map((l) => l.body.category) || []),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="cards">
            {rows?.map((l) => (
              <article className="panel lesson-card" key={l.id}>
                <div className="lesson-art">
                  <BookOpen size={34} strokeWidth={1.3} aria-hidden="true" />
                  <span>{l.body.category}</span>
                  <ArrowUpRight
                    size={22}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                <small>
                  {l.company ? "Company training" : "Platform guide"} ·{" "}
                  {l.body.format}
                </small>
                <h2>{l.body.title}</h2>
                <p>{l.body.description}</p>
                <button onClick={() => setLesson(l)}>Open guide</button>
              </article>
            ))}
          </div>
          {!rows?.length && <Empty title="No lessons match your search" />}
          <section className="panel spaced">
            <h2>Past Events & Help Sessions</h2>
            <p>
              No recordings have been published. These archives will contain
              original training when available.
            </p>
          </section>
        </>
      )}
    </>
  );
}
function Settings() {
  const { boot, run } = useApp(),
    { data, load } = useLoad("/settings"),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("creator"),
    [invite, setInvite] = useState(""),
    [limit, setLimit] = useState(200),
    [memory, setMemory] = useState(""),
    { data: memories, load: loadMemory } = useLoad<any[]>("/records/memory");
  if (!data) return <div className="loading">Loading settings…</div>;
  return (
    <>
      <Header
        title="Settings"
        description="Team access, configured usage, and integration status."
      />
      <div className="two-columns">
        <section>
          <div className="panel">
            <h2>Team</h2>
            {data.members.map((m: any) => (
              <div className="row member" key={m.id}>
                <span>
                  {m.name}
                  <small>
                    {m.email} · {m.role}
                    {m.revoked ? " · Revoked" : ""}
                  </small>
                </span>
                {!m.revoked && boot.actor.role === "owner" && (
                  <button
                    onClick={() =>
                      run(async () => {
                        await api(`/members/${m.id}/revoke`, {});
                        load();
                      })
                    }
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
            {boot.actor.role === "owner" && (
              <div className="form-grid spaced">
                <Field label="Invite email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Role">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="creator">Creator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </Field>
                <button
                  disabled={!email}
                  onClick={() =>
                    run(async () => {
                      const r = await api("/invites", { email, role });
                      setInvite(location.origin + r.url);
                    })
                  }
                >
                  Create invite link
                </button>
                {invite && (
                  <Notice>
                    Share this expiring link yourself. Email delivery is not
                    connected.
                    <br />
                    <a className="break" href={invite}>
                      {invite}
                    </a>
                  </Notice>
                )}
              </div>
            )}
          </div>
          <div className="panel spaced">
            <h2>Prototype usage</h2>
            <p>
              {data.usage.reduce((n: number, u: any) => n + u.actual, 0)} render
              units used ·{" "}
              {data.usage.reduce((n: number, u: any) => n + u.reserved, 0)}{" "}
              reserved · {data.entitlements.body.renderUnits} configured
            </p>
            <p>
              Local render units are not provider charges. Live billing and
              subscription policies have not been selected.
            </p>
            {boot.actor.role === "owner" && (
              <>
                <Field label="Render allowance">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  />
                </Field>
                <button
                  onClick={() =>
                    run(async () => {
                      await api("/entitlements", { renderUnits: limit }, "PUT");
                      load();
                    })
                  }
                >
                  Update allowance
                </button>
              </>
            )}
          </div>
        </section>
        <section>
          <div className="panel">
            <h2>Integrations</h2>
            {Object.entries(data.integrations).map(([name, v]: any) => (
              <div className="integration" key={name}>
                <strong>{name[0].toUpperCase() + name.slice(1)}</strong>
                {status(v.state)}
                <p>{v.reason}</p>
              </div>
            ))}
          </div>
          <div className="panel spaced">
            <h2>Personal memory</h2>
            <p>Private to your identity in this workspace.</p>
            {memories?.map((m) => (
              <div className="row" key={m.id}>
                <p>{m.body.text}</p>
                <button
                  onClick={() =>
                    run(async () => {
                      await api("/memory/" + m.id, {}, "DELETE");
                      loadMemory();
                    })
                  }
                >
                  Forget
                </button>
              </div>
            ))}
            <Field label="Preference">
              <input
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
              />
            </Field>
            <button
              disabled={!memory}
              onClick={() =>
                run(async () => {
                  await api("/memory", { text: memory });
                  setMemory("");
                  loadMemory();
                })
              }
            >
              Remember preference
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
function Operator() {
  const { boot, run } = useApp(),
    { data, load } = useLoad("/operator"),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [jobId, setJobId] = useState(""),
    { data: jobs } = useLoad<any[]>("/jobs");
  if (!boot.actor.staff)
    return <Empty title="Platform staff access required" />;
  return (
    <>
      <Header
        title="Company setup"
        description="Internal configuration, content publication and operational health."
      />
      <SetupControls onSaved={load} />
      {data && (
        <>
          <div className="cards">
            {data.companies.map((c: any) => (
              <article className="panel" key={c.id}>
                <h2>{c.name}</h2>
                {status(c.active ? "active" : "inactive")}
                <small>{c.id}</small>
              </article>
            ))}
          </div>
          <section className="panel spaced">
            <h2>Publish a finished reference</h2>
            <p>
              Only the selected rendered media and the description below become
              shared. Source files, layers, reports and campaign details remain
              private.
            </p>
            <div className="form-grid">
              <Field label="Finished output">
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                >
                  <option value="">Select output</option>
                  {jobs
                    ?.filter((j) => j.status === "ready" && j.output?.file)
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.output.filename}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Public title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field label="Public description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <button
                disabled={!jobId || !title}
                onClick={() =>
                  run(async () => {
                    await api("/publications", {
                      jobId,
                      title,
                      description,
                      confirmed: true,
                    });
                    go("shared");
                  })
                }
              >
                Publish selected derivative to all companies
              </button>
            </div>
          </section>
          <section className="panel spaced">
            <h2>Recent failures</h2>
            {data.failures.length ? (
              data.failures.map((j: any) => (
                <p key={j.id}>
                  {j.kind} · {j.error}
                </p>
              ))
            ) : (
              <p>No recorded job failures.</p>
            )}
            <h2>Moderation</h2>
            {data.reports.map((r: any) => (
              <div className="row" key={r.id}>
                <span>Reported post {r.body.postId}</span>
                <button
                  onClick={() =>
                    run(async () => {
                      await api(`/feed/${r.body.postId}`, {}, "DELETE");
                      load();
                    })
                  }
                >
                  Remove reported post
                </button>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
