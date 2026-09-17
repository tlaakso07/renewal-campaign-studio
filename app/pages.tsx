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
  UserRound,
  CalendarDays,
  Bell,
} from "lucide-react";
import { Header, Notice, Empty, Field, useApp } from "./ui";
import { ThemeControls, SetupControls } from "./setup";
import { api, go, media } from "./api";
import { Discovery, Remix, CampaignExport, useResource } from "./discovery";
import { reportFilters, useRouteFilters } from "./navigation";
import { CommunityAttachment, CommunityThread } from "./community";
import { ModelMark } from "./model-mark";
import { ImportWizard, Performance, Review, SavedViews } from "./measurement";
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
      ) : section === "performance" ? (
        <Performance />
      ) : section === "review" ? (
        <Review id={recordId} />
      ) : section === "feed" ? (
        <Feed key={recordId || "feed"} id={recordId} />
      ) : section === "classroom" ? (
        <Classroom id={recordId} />
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
        description="The complete observed inventory, with verified provider identity and explicit connection state."
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
      <p>
        {rows.length} entries ·{" "}
        {boot.assistant?.mode === "ai-gateway"
          ? `${boot.assistant.model} is connected to the company assistant.`
          : "The company assistant is using its local workspace guide."}
      </p>
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
                ? `${m.providerDisplayName} · ${
                    m.enabled
                      ? boot.assistant?.mode === "ai-gateway"
                        ? "Connected here"
                        : "Integrated · authentication required"
                      : "Not connected"
                  }`
                : "Provider unverified · Reference only"}
            </small>
            <button disabled>
              {m.verificationStatus.includes("retired")
                ? "Retired"
                : m.enabled
                  ? boot.assistant?.mode === "ai-gateway"
                    ? "Assistant active"
                    : "Integrated"
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
    </>
  );
}
function CommunityDirectory() {
  const { boot, run } = useApp(),
    members = useResource<any[]>("/community/members"),
    profile = useResource<any>("/community/profile"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("contributions"),
    [form, setForm] = useState<any>({
      displayName: boot.actor.name,
      handle: boot.actor.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 30),
      headline: "",
      bio: "",
      interests: "",
      listed: false,
      presence: "hidden",
    });
  useEffect(() => {
    if (!profile.data?.body) return;
    setForm({
      ...profile.data.body,
      interests: profile.data.body.interests.join(", "),
    });
  }, [profile.data]);
  const rows = [...(members.data || [])]
    .filter((member) =>
      `${member.body.displayName} ${member.body.handle} ${member.body.companyName} ${member.body.headline} ${member.body.interests.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((left, right) =>
      sort === "new"
        ? right.created.localeCompare(left.created)
        : sort === "name"
          ? left.body.displayName.localeCompare(right.body.displayName)
          : right.body.contributions.score - left.body.contributions.score,
    );
  return (
    <>
      <Header
        title="Community members"
        description="Opt-in profiles from people participating in the shared community."
      >
        <a className="button" href="#/feed">
          Back to Feed
        </a>
        <a className="button" href="#/settings">
          Invite colleagues
        </a>
      </Header>
      <section className="panel community-profile-editor">
        <div className="section-heading">
          <div>
            <h2>Your community profile</h2>
            <p>Only profiles you explicitly list appear across companies.</p>
          </div>
          {profile.data?.body?.listed && <span className="status ready">Listed</span>}
        </div>
        <div className="form-grid compact">
          <Field label="Display name">
            <input
              value={form.displayName}
              maxLength={80}
              onChange={(event) =>
                setForm({ ...form, displayName: event.target.value })
              }
            />
          </Field>
          <Field label="Community handle">
            <input
              value={form.handle}
              maxLength={30}
              pattern="[a-z0-9][a-z0-9_-]{1,29}"
              onChange={(event) =>
                setForm({ ...form, handle: event.target.value.toLowerCase() })
              }
            />
          </Field>
          <Field label="Headline">
            <input
              value={form.headline}
              maxLength={120}
              onChange={(event) =>
                setForm({ ...form, headline: event.target.value })
              }
            />
          </Field>
          <Field label="Presence preference">
            <select
              value={form.presence}
              onChange={(event) =>
                setForm({ ...form, presence: event.target.value })
              }
            >
              <option value="hidden">Do not show presence</option>
              <option value="available">Available</option>
              <option value="away">Away</option>
            </select>
          </Field>
          <Field label="Interests (comma separated)">
            <input
              value={form.interests}
              onChange={(event) =>
                setForm({ ...form, interests: event.target.value })
              }
            />
          </Field>
          <Field label="About you">
            <textarea
              value={form.bio}
              maxLength={1000}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </Field>
        </div>
        <label>
          <input
            type="checkbox"
            checked={form.listed}
            onChange={(event) =>
              setForm({ ...form, listed: event.target.checked })
            }
          />{" "}
          List my profile in the shared member directory
        </label>
        <button
          className="primary"
          disabled={!form.displayName.trim() || !form.handle.trim()}
          onClick={() =>
            run(async () => {
              await api(
                "/community/profile",
                {
                  ...form,
                  expectedVersion: profile.data?.rev,
                  interests: form.interests
                    .split(",")
                    .map((interest: string) => interest.trim())
                    .filter(Boolean),
                },
                "PUT",
              );
              profile.reload();
              members.reload();
            })
          }
        >
          Save profile
        </button>
      </section>
      <div className="toolbar spaced">
        <Field label="Search members">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
        <Field label="Sort members">
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="contributions">Community contributions</option>
            <option value="new">Newest members</option>
            <option value="name">Name</option>
          </select>
        </Field>
      </div>
      {!members.data ? (
        <Notice>{members.error || "Loading community members…"}</Notice>
      ) : !rows.length ? (
        <Empty title="No listed members yet">
          <p>Members appear only after they explicitly publish a profile.</p>
        </Empty>
      ) : (
        <div className="community-member-grid">
          {rows.map((member) => (
            <article className="panel community-member-card" key={member.id}>
              <div className="community-avatar" aria-hidden="true">
                {member.body.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{member.body.displayName}</h2>
                <p>
                  <small>
                    @{member.body.handle} · {member.body.companyName}
                  </small>
                </p>
                {member.body.headline && <p>{member.body.headline}</p>}
                {member.body.bio && <p className="preserve">{member.body.bio}</p>}
                <div className="actions">
                  {member.body.interests.map((interest: string) => (
                    <span className="chip" key={interest}>
                      {interest}
                    </span>
                  ))}
                </div>
                <small>
                  {member.body.contributions.posts} posts ·{" "}
                  {member.body.contributions.comments} comments ·{" "}
                  {member.body.contributions.publishedAds} published ads
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function CommunityEvents() {
  const { boot, run } = useApp(),
    events = useResource<any[]>(
      `/community/events${boot.actor.staff ? "?manage=1" : ""}`,
    ),
    [form, setForm] = useState<any>({
      title: "",
      description: "",
      startsAt: "",
      endsAt: "",
      host: boot.actor.name,
      joinUrl: "",
      audience: "shared",
      state: "draft",
    }),
    current = Date.now(),
    published = (events.data || []).filter(
      (event) => event.body.state === "published",
    ),
    upcoming = published.filter(
      (event) => new Date(event.body.endsAt).getTime() >= current,
    ),
    past = published.filter(
      (event) => new Date(event.body.endsAt).getTime() < current,
    );
  function eventCard(event: any) {
    return (
      <article className="panel community-event-card" key={event.id}>
        <div className="section-heading">
          <div>
            <small>
              {event.company ? "Company event" : "Shared community"} ·{" "}
              {event.body.state}
            </small>
            <h2>{event.body.title}</h2>
          </div>
          <CalendarDays size={22} aria-hidden="true" />
        </div>
        <p>
          <strong>
            {new Date(event.body.startsAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </strong>
          <br />
          <small>
            Ends {new Date(event.body.endsAt).toLocaleString()} · Your timezone
          </small>
        </p>
        <p className="preserve">{event.body.description}</p>
        <p>Hosted by {event.body.host}</p>
        {event.body.joinUrl && new Date(event.body.endsAt).getTime() >= current && (
          <a
            className="button primary"
            href={event.body.joinUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open event link
          </a>
        )}
      </article>
    );
  }
  return (
    <>
      <Header
        title="Community events"
        description="Training and help sessions shown in your local timezone."
      >
        <a className="button" href="#/feed">
          Back to Feed
        </a>
        <a className="button" href="#/classroom">
          View recordings
        </a>
      </Header>
      {boot.actor.staff && (
        <section className="panel community-event-editor">
          <h2>Schedule an event</h2>
          <p>Drafts remain staff-only until explicitly published.</p>
          <div className="form-grid compact">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Host">
              <input
                value={form.host}
                onChange={(event) => setForm({ ...form, host: event.target.value })}
              />
            </Field>
            <Field label="Starts">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm({ ...form, startsAt: event.target.value })
                }
              />
            </Field>
            <Field label="Ends">
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              />
            </Field>
            <Field label="Audience">
              <select
                value={form.audience}
                onChange={(event) =>
                  setForm({ ...form, audience: event.target.value })
                }
              >
                <option value="shared">Shared community</option>
                <option value="company">Current company</option>
              </select>
            </Field>
            <Field label="Publish state">
              <select
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Secure join URL (optional)">
              <input
                type="url"
                value={form.joinUrl}
                onChange={(event) => setForm({ ...form, joinUrl: event.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </Field>
          </div>
          <button
            className="primary"
            disabled={
              !form.title ||
              !form.description ||
              !form.startsAt ||
              !form.endsAt ||
              !form.host
            }
            onClick={() =>
              run(async () => {
                await api("/community/events", {
                  ...form,
                  startsAt: new Date(form.startsAt).toISOString(),
                  endsAt: new Date(form.endsAt).toISOString(),
                });
                setForm({ ...form, title: "", description: "", joinUrl: "" });
                events.reload();
              })
            }
          >
            Save event
          </button>
        </section>
      )}
      {!events.data ? (
        <Notice>{events.error || "Loading events…"}</Notice>
      ) : (
        <>
          <h2>Upcoming events</h2>
          {!upcoming.length ? (
            <Empty title="No events scheduled">
              <p>Nothing has been published to your eligible calendar.</p>
            </Empty>
          ) : (
            <div className="community-event-list">{upcoming.map(eventCard)}</div>
          )}
          {!!past.length && (
            <>
              <h2 className="spaced">Past events</h2>
              <div className="community-event-list">{past.map(eventCard)}</div>
            </>
          )}
        </>
      )}
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
    members = useResource<any[]>("/community/members"),
    events = useResource<any[]>("/community/events"),
    publications = useResource<any[]>("/publications"),
    notifications = useResource<any[]>("/community/notifications"),
    notificationPreferences = useResource<any>(
      "/community/notifications/preferences",
    ),
    [filters, setFilters] = useRouteFilters({ query: "", category: "" }),
    [title, setTitle] = useState(""),
    [text, setText] = useState(""),
    [audience, setAudience] = useState("company"),
    [category, setCategory] = useState("General discussion"),
    [poll, setPoll] = useState(""),
    [publicationId, setPublicationId] = useState(""),
    [thread, setThread] = useState(""),
    [draft, setDraft] = useState<any>(null),
    [editingPost, setEditingPost] = useState<any>(null),
    [reporting, setReporting] = useState(""),
    [reportReason, setReportReason] = useState("spam"),
    [reportDetails, setReportDetails] = useState(""),
    [preferences, setPreferences] = useState({
      follows: true,
      mentions: true,
      events: false,
    });
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
  useEffect(() => {
    if (notificationPreferences.data)
      setPreferences(notificationPreferences.data.body);
  }, [notificationPreferences.data?.id, notificationPreferences.data?.rev]);
  function resetComposer() {
    setTitle("");
    setText("");
    setPoll("");
    setPublicationId("");
    setEditingPost(null);
  }
  const returnQuery = "?" + new URLSearchParams(filters);
  if (id === "members") return <CommunityDirectory />;
  if (id === "events") return <CommunityEvents />;
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
                if (editingPost)
                  await api(
                    `/feed/${editingPost.id}`,
                    {
                      action: "edit",
                      expectedVersion: editingPost.rev,
                      title,
                      text,
                      category,
                      publicationId: publicationId || null,
                    },
                    "PATCH",
                  );
                else {
                  await api("/feed", {
                    title,
                    text,
                    audience,
                    category,
                    options: poll.split("\n").filter(Boolean),
                    publicationId: publicationId || null,
                  });
                  if (draft) await api("/drafts/" + draft.id, {}, "DELETE");
                  setDraft(null);
                }
                resetComposer();
                load();
              });
            }}
          >
            <h2>
              {editingPost ? "Edit your discussion" : "Share something with the community…"}
            </h2>
            <Field label="Audience">
              <select
                value={audience}
                disabled={!!editingPost}
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
            {!editingPost && (
              <details>
                <summary>Add a poll</summary>
                <Field label="Choices (one per line, at least two)">
                  <textarea
                    value={poll}
                    onChange={(e) => setPoll(e.target.value)}
                  />
                </Field>
              </details>
            )}
            {!!publications.data?.length && (
              <Field label="Attach a published ad (optional)">
                <select
                  value={publicationId}
                  onChange={(event) => setPublicationId(event.target.value)}
                >
                  <option value="">No attachment</option>
                  {publications.data.map((publication: any) => (
                    <option key={publication.id} value={publication.id}>
                      {publication.body.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="actions">
              <button className="primary" disabled={!title || !text}>
                {editingPost
                  ? "Save post update"
                  : `Publish to ${
                      audience === "shared" ? "shared community" : "my company"
                    }`}
              </button>
              {editingPost ? (
                <button type="button" onClick={resetComposer}>
                  Cancel edit
                </button>
              ) : (
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
              )}
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
                {p.body.edited ? " · Edited" : ""}
              </small>
              <span className="chip">{p.body.category}</span>
              {p.body.removed ? (
                <Notice>
                  This post was removed. Existing replies are retained but are
                  unavailable until the post is restored.
                </Notice>
              ) : (
                <>
                  <h2 className="spaced">{p.body.title}</h2>
                  <p className="preserve">{p.body.text}</p>
                  <CommunityAttachment attachment={p.attachment} />
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
                </>
              )}
              <div className="actions">
                {!p.body.removed && (
                  <>
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
                    <button onClick={() => setReporting(p.id)}>Report</button>
                  </>
                )}
                {p.canEdit && (
                  <button
                    onClick={() => {
                      setEditingPost(p);
                      setTitle(p.body.title);
                      setText(p.body.text);
                      setAudience(p.company ? "company" : "shared");
                      setCategory(p.body.category);
                      setPublicationId(p.body.publicationId || "");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit post
                  </button>
                )}
                {p.canRemove && (
                  <button
                    onClick={() =>
                      run(async () => {
                        await api(
                          `/feed/${p.id}`,
                          { action: "remove", expectedVersion: p.rev },
                          "PATCH",
                        );
                        load();
                      })
                    }
                  >
                    Remove post
                  </button>
                )}
                {p.canRestore && (
                  <button
                    onClick={() =>
                      run(async () => {
                        await api(
                          `/feed/${p.id}`,
                          { action: "restore", expectedVersion: p.rev },
                          "PATCH",
                        );
                        load();
                      })
                    }
                  >
                    Restore post
                  </button>
                )}
              </div>
              {reporting === p.id && (
                <form
                  className="form-grid compact spaced"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(async () => {
                      await api(`/feed/${p.id}/report`, {
                        reason: reportReason,
                        details: reportDetails,
                      });
                      setReporting("");
                      setReportDetails("");
                    });
                  }}
                >
                  <Field label="Why are you reporting this post?">
                    <select
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                    >
                      <option value="spam">Spam</option>
                      <option value="privacy">Privacy concern</option>
                      <option value="harassment">Harassment</option>
                      <option value="misleading">Misleading content</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Details (optional)">
                    <textarea
                      maxLength={1000}
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                    />
                  </Field>
                  <div className="actions">
                    <button className="primary">Submit report</button>
                    <button type="button" onClick={() => setReporting("")}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </section>
        <aside>
          <div className="panel community-rail">
            <h2>Community</h2>
            <p>
              <UserRound size={16} aria-hidden="true" />{" "}
              {members.data?.filter((member: any) => member.body.listed).length || 0}{" "}
              listed members
            </p>
            <div className="actions">
              <a className="button" href="#/feed/members">
                View members
              </a>
              <a className="button" href="#/settings">
                Invite colleagues
              </a>
            </div>
            <p>
              Choose an audience before posting. Company originals and reports
              are never attached automatically.
            </p>
            <h3>Upcoming events</h3>
            {(events.data || [])
              .filter(
                (event: any) =>
                  event.body.state === "published" &&
                  new Date(event.body.endsAt).getTime() >= Date.now(),
              )
              .slice(0, 3)
              .map((event: any) => (
                <a className="community-rail-item" href="#/feed/events" key={event.id}>
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>
                    {event.body.title}
                    <small>{new Date(event.body.startsAt).toLocaleString()}</small>
                  </span>
                </a>
              ))}
            {!events.data?.some(
              (event: any) =>
                event.body.state === "published" &&
                new Date(event.body.endsAt).getTime() >= Date.now(),
            ) && <p>No events scheduled.</p>}
            <a href="#/feed/events" className="button">
              View all events
            </a>
            <h3>Notifications</h3>
            {(notifications.data || [])
              .filter((notification: any) => !notification.body.read)
              .slice(0, 4)
              .map((notification: any) => (
                <button
                  className="community-rail-item"
                  key={notification.id}
                  onClick={() =>
                    run(async () => {
                      await api(
                        `/community/notifications/${notification.id}/read`,
                        {},
                        "PATCH",
                      );
                      notifications.reload();
                      if (notification.body.eventId) go("feed/events");
                      else setThread(notification.body.postId);
                    })
                  }
                >
                  <Bell size={16} aria-hidden="true" />
                  <span>{notification.body.message}</span>
                </button>
              ))}
            {!notifications.data?.some(
              (notification: any) => !notification.body.read,
            ) && <p>You’re caught up.</p>}
            <details className="community-preferences">
              <summary>Notification preferences</summary>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.follows}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      follows: event.target.checked,
                    })
                  }
                />{" "}
                Replies in followed discussions
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.mentions}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      mentions: event.target.checked,
                    })
                  }
                />{" "}
                Mentions of my public handle
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.events}
                  onChange={(event) =>
                    setPreferences({
                      ...preferences,
                      events: event.target.checked,
                    })
                  }
                />{" "}
                Community event updates
              </label>
              <button
                disabled={!notificationPreferences.data}
                onClick={() =>
                  run(async () => {
                    await api(
                      "/community/notifications/preferences",
                      preferences,
                      "PUT",
                    );
                    notificationPreferences.reload();
                  })
                }
              >
                Save notification preferences
              </button>
            </details>
            <h3>Recent published ads</h3>
            <div className="community-publication-grid">
              {(publications.data || []).slice(0, 4).map((publication: any) => (
                <a
                  href={`#/shared?reference=${publication.id}`}
                  key={publication.id}
                  aria-label={publication.body.title}
                >
                  {publication.body.mediaType === "image" ? (
                    <img
                      src={`/api/publications/${publication.id}/media`}
                      alt=""
                    />
                  ) : (
                    <span>Video</span>
                  )}
                </a>
              ))}
            </div>
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
const classroomCategories = [
  "All",
  "Getting Started",
  "Static Ads",
  "Video & UGC",
  "Remix",
  "Meta & Insights",
  "Brand System",
];
const classroomTargets: Record<string, string> = {
  campaigns: "Start a campaign",
  static: "Try it in Static Studio",
  video: "Open Video & UGC",
  insights: "Connect Meta & explore Insights",
  assets: "Open My Assets",
  brand: "Review your Brand System",
  shared: "Explore Winning Ads",
};
const classroomFilters = { q: "", category: "All", archive: "" };
function Classroom({ id }: { id?: string }) {
  const { boot } = useApp(),
    { data: playback, load: loadPlayback } =
      useLoad<any[]>("/records/playback"),
    lastPosition = useRef(0),
    [mediaFailed, setMediaFailed] = useState(false),
    [managing, setManaging] = useState(false),
    [filters, setFilters] = useRouteFilters(classroomFilters);
  const { data: lessons, load: loadLessons } =
      useLoad<any[]>("/records/lesson"),
    { data: recordings, load: loadRecordings } =
      useLoad<any[]>("/records/recording");
  const allContent = [...(lessons || []), ...(recordings || [])],
    selected = id ? allContent.find((item) => item.id === id) : null,
    query = filters.q.trim().toLowerCase(),
    rows = lessons?.filter(
      (lesson) =>
        [
          lesson.body.title,
          lesson.body.description,
          ...(lesson.body.tags || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query) &&
        (filters.category === "All" ||
          lesson.body.category === filters.category),
    ),
    archiveRows = recordings?.filter(
      (recording) =>
        (!filters.archive || recording.body.archive === filters.archive) &&
        [
          recording.body.title,
          recording.body.description,
          ...(recording.body.tags || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
  const canManage = boot.actor.staff || boot.actor.role === "owner";
  const filterQuery = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  ).toString();
  function openContent(content: any) {
    go(`classroom/${content.id}${filterQuery ? `?${filterQuery}` : ""}`);
  }
  function backToCatalog() {
    go(`classroom${filterQuery ? `?${filterQuery}` : ""}`);
  }
  useEffect(() => setMediaFailed(false), [id]);
  return (
    <>
      <Header
        title="Classroom"
        description="Original guides for the tools in your workspace."
      >
        {canManage && !id && (
          <button onClick={() => setManaging((value) => !value)}>
            {managing ? "Close manager" : "Manage training"}
          </button>
        )}
      </Header>
      {managing && canManage && !id && (
        <ClassroomManager
          onChanged={() => {
            loadLessons();
            loadRecordings();
          }}
        />
      )}
      {id && selected ? (
        <section className="panel lesson">
          <button onClick={backToCatalog}>← Back to Classroom</button>
          <div className="lesson-meta spaced">
            <span className="chip">{selected.body.format || "Lesson"}</span>
            <span>{selected.body.category}</span>
            <span>
              Updated {new Date(selected.updated).toLocaleDateString()}
            </span>
          </div>
          <h2 className="lesson-title">{selected.body.title}</h2>
          {(selected.body.publicationId || selected.body.mediaAssetId) &&
          !mediaFailed ? (
            <video
              controls
              preload="metadata"
              src={`/api/classroom/${selected.kind}/${selected.id}/media`}
              onError={() => setMediaFailed(true)}
              onLoadedMetadata={(e) => {
                const position =
                  playback?.find(
                    (p) =>
                      (p.body.contentId || p.body.lessonId) === selected.id,
                  )?.body.seconds || 0;
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
                    contentId: selected.id,
                    kind: selected.kind,
                    seconds: e.currentTarget.currentTime,
                  })
                    .then(loadPlayback)
                    .catch(() => {});
                }
              }}
            />
          ) : (
            <Notice>
              {mediaFailed
                ? "This recording is unavailable right now. The description and transcript remain available below."
                : "Written guide · No recording is published for this lesson."}
            </Notice>
          )}
          <section className="lesson-about">
            <h3>About this tutorial</h3>
            <p>{selected.body.description}</p>
          </section>
          {selected.body.transcript && (
            <details className="lesson-transcript">
              <summary>Read transcript</summary>
              <p className="preserve">{selected.body.transcript}</p>
            </details>
          )}
          {!!selected.body.resources?.length && (
            <section className="lesson-resources">
              <h3>Resources</h3>
              {selected.body.resources.map((resource: any) => (
                <a
                  className="button"
                  key={resource.assetId}
                  href={`/api/assets/${resource.assetId}/original`}
                >
                  <Download size={16} /> {resource.label}
                </a>
              ))}
            </section>
          )}
          <a href={"#/" + selected.body.target} className="button primary">
            {classroomTargets[selected.body.target] ||
              "Try it in your workspace"}{" "}
            <ArrowRight size={16} />
          </a>
        </section>
      ) : id && lessons && recordings ? (
        <Empty title="Training content is unavailable">
          <button onClick={backToCatalog}>Back to Classroom</button>
        </Empty>
      ) : (
        <>
          <div className="classroom-search">
            <Search size={19} aria-hidden="true" />
            <input
              aria-label="Search lessons"
              placeholder="Search tutorials and guides…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div className="classroom-pills" aria-label="Lesson categories">
            {classroomCategories.map((item) => (
              <button
                key={item}
                aria-pressed={filters.category === item}
                onClick={() =>
                  setFilters({ ...filters, category: item, archive: "" })
                }
              >
                {item}
              </button>
            ))}
          </div>
          {(filters.q || filters.category !== "All" || filters.archive) && (
            <button
              className="link-button classroom-clear"
              onClick={() => setFilters(classroomFilters)}
            >
              Clear filters
            </button>
          )}
          {!filters.archive && (
            <div className="cards classroom-grid">
              {rows?.map((lesson) => (
                <ClassroomCard
                  content={lesson}
                  key={lesson.id}
                  onOpen={() => openContent(lesson)}
                />
              ))}
            </div>
          )}
          {!filters.archive && !rows?.length && (
            <Empty title="No lessons match your search" />
          )}
          {!filters.q && filters.category === "All" && !filters.archive && (
            <section className="spaced classroom-archives">
              <div>
                <small>Live coaching archive</small>
                <h2>Learn from past sessions</h2>
                <p>
                  Published event and help-session recordings appear here. Empty
                  archives stay honest until original training is available.
                </p>
              </div>
              {[
                ["past-events", "Past Events"],
                ["help-sessions", "Help Sessions"],
              ].map(([archive, label]) => {
                const count =
                  recordings?.filter((r) => r.body.archive === archive)
                    .length || 0;
                return (
                  <button
                    className="panel archive-card"
                    key={archive}
                    onClick={() => setFilters({ ...filters, archive })}
                  >
                    <Play size={24} aria-hidden="true" />
                    <span>
                      <strong>{label}</strong>
                      <small>
                        {count
                          ? `${count} published recording${count === 1 ? "" : "s"}`
                          : "No recordings published"}
                      </small>
                    </span>
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </button>
                );
              })}
            </section>
          )}
          {!!filters.archive && (
            <section className="spaced">
              <h2>
                {filters.archive === "past-events"
                  ? "Past Events"
                  : "Help Sessions"}
              </h2>
              <div className="cards classroom-grid">
                {archiveRows?.map((recording) => (
                  <ClassroomCard
                    content={recording}
                    key={recording.id}
                    onOpen={() => openContent(recording)}
                  />
                ))}
              </div>
              {!archiveRows?.length && (
                <Empty title="No recordings have been published here yet" />
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
function ClassroomCard({
  content,
  onOpen,
}: {
  content: any;
  onOpen: () => void;
}) {
  return (
    <article className="panel lesson-card">
      {content.body.thumbnailAssetId ? (
        <img
          className="lesson-thumbnail"
          src={media(content.body.thumbnailAssetId)}
          alt=""
        />
      ) : (
        <div className="lesson-art">
          <BookOpen size={34} strokeWidth={1.3} aria-hidden="true" />
          <span>{content.body.category}</span>
          <ArrowUpRight size={22} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <small>
        {content.company ? "Company training" : "Platform guide"} ·{" "}
        {content.body.format}
      </small>
      <h2>{content.body.title}</h2>
      <p>{content.body.description}</p>
      <button onClick={onOpen}>
        {content.kind === "recording" ? "Watch recording" : "Watch tutorial"}
      </button>
    </article>
  );
}

const blankTraining = {
  kind: "lesson",
  title: "",
  description: "",
  transcript: "",
  category: "Getting Started",
  tags: [],
  audience: "company",
  publicationId: null,
  mediaAssetId: null,
  thumbnailAssetId: null,
  resources: [],
  target: "campaigns",
  archive: null,
  state: "draft",
};
function ClassroomManager({ onChanged }: { onChanged: () => void }) {
  const { boot, run } = useApp(),
    { data: managed, load } = useLoad<any[]>("/classroom/manage"),
    { data: assets } = useLoad<any[]>("/assets"),
    { data: publications } = useLoad<any[]>("/publications"),
    [editing, setEditing] = useState<any>(null),
    [form, setForm] = useState<any>(blankTraining),
    [tags, setTags] = useState(""),
    [resourceAssetId, setResourceAssetId] = useState(""),
    [resourceLabel, setResourceLabel] = useState("");
  function reset() {
    setEditing(null);
    setForm({ ...blankTraining, resources: [], tags: [] });
    setTags("");
    setResourceAssetId("");
    setResourceLabel("");
  }
  function edit(content: any) {
    setEditing(content);
    setForm({ ...content.body, kind: content.kind });
    setTags((content.body.tags || []).join(", "));
  }
  function addResource() {
    if (!resourceAssetId || !resourceLabel.trim()) return;
    setForm({
      ...form,
      resources: [
        ...(form.resources || []).filter(
          (resource: any) => resource.assetId !== resourceAssetId,
        ),
        { assetId: resourceAssetId, label: resourceLabel.trim() },
      ],
    });
    setResourceAssetId("");
    setResourceLabel("");
  }
  async function save() {
    await run(async () => {
      const body = {
        ...form,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        expectedVersion: editing?.rev,
      };
      await api(
        editing ? `/classroom/content/${editing.id}` : "/classroom/content",
        body,
        editing ? "PUT" : "POST",
      );
      reset();
      load();
      onChanged();
    });
  }
  return (
    <section className="panel classroom-manager">
      <div className="section-heading">
        <div>
          <small>Content administration</small>
          <h2>{editing ? "Edit training" : "Create training"}</h2>
        </div>
        {editing && <button onClick={reset}>New item</button>}
      </div>
      <div className="form-grid">
        <Field label="Content type">
          <select
            value={form.kind}
            disabled={!!editing}
            onChange={(e) =>
              setForm({
                ...form,
                kind: e.target.value,
                archive: e.target.value === "recording" ? "past-events" : null,
              })
            }
          >
            <option value="lesson">Lesson</option>
            <option value="recording">Recording</option>
          </select>
        </Field>
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {classroomCategories.slice(1).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>
        {form.kind === "recording" && (
          <Field label="Archive">
            <select
              value={form.archive || "past-events"}
              onChange={(e) => setForm({ ...form, archive: e.target.value })}
            >
              <option value="past-events">Past Events</option>
              <option value="help-sessions">Help Sessions</option>
            </select>
          </Field>
        )}
        <Field label="Audience">
          <select
            value={form.audience}
            disabled={!!editing}
            onChange={(e) =>
              setForm({
                ...form,
                audience: e.target.value,
                mediaAssetId:
                  e.target.value === "platform" ? null : form.mediaAssetId,
                thumbnailAssetId:
                  e.target.value === "platform" ? null : form.thumbnailAssetId,
                resources: e.target.value === "platform" ? [] : form.resources,
              })
            }
          >
            <option value="company">This company</option>
            {boot.actor.staff && (
              <option value="platform">All companies</option>
            )}
          </select>
        </Field>
        <Field label="Publish state">
          <select
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field label="Related workspace tool">
          <select
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
          >
            {Object.entries(classroomTargets).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Published video">
          <select
            value={form.publicationId || ""}
            onChange={(e) =>
              setForm({
                ...form,
                publicationId: e.target.value || null,
                mediaAssetId: e.target.value ? null : form.mediaAssetId,
              })
            }
          >
            <option value="">No recording</option>
            {publications
              ?.filter((item) => item.body.mediaType === "video")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.body.title}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Company recording">
          <select
            disabled={form.audience === "platform"}
            value={form.mediaAssetId || ""}
            onChange={(e) =>
              setForm({
                ...form,
                mediaAssetId: e.target.value || null,
                publicationId: e.target.value ? null : form.publicationId,
              })
            }
          >
            <option value="">No private company video</option>
            {assets
              ?.filter(
                (asset) =>
                  asset.kind === "video" && asset.status === "preview_ready",
              )
              .map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Card thumbnail">
          <select
            disabled={form.audience === "platform"}
            value={form.thumbnailAssetId || ""}
            onChange={(e) =>
              setForm({ ...form, thumbnailAssetId: e.target.value || null })
            }
          >
            <option value="">Generated category card</option>
            {assets
              ?.filter((asset) => asset.kind === "image" && asset.preview)
              .map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Search tags (comma separated)">
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        <Field label="Short description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Transcript or written guide">
          <textarea
            value={form.transcript}
            onChange={(e) => setForm({ ...form, transcript: e.target.value })}
          />
        </Field>
      </div>
      {form.audience === "company" && (
        <div className="resource-editor">
          <h3>Downloadable resources</h3>
          {(form.resources || []).map((resource: any) => (
            <div className="row" key={resource.assetId}>
              <span>{resource.label}</span>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    resources: form.resources.filter(
                      (item: any) => item.assetId !== resource.assetId,
                    ),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <div className="toolbar">
            <select
              aria-label="Resource file"
              value={resourceAssetId}
              onChange={(e) => setResourceAssetId(e.target.value)}
            >
              <option value="">Select a company file</option>
              {assets
                ?.filter((asset) =>
                  [
                    "preview_ready",
                    "original_stored",
                    "unsupported_preview",
                  ].includes(asset.status),
                )
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
            </select>
            <input
              aria-label="Resource label"
              placeholder="Resource label"
              value={resourceLabel}
              onChange={(e) => setResourceLabel(e.target.value)}
            />
            <button onClick={addResource}>Add resource</button>
          </div>
        </div>
      )}
      <button
        className="primary"
        disabled={!form.title || !form.description}
        onClick={save}
      >
        <Save size={16} /> {editing ? "Save new version" : "Create training"}
      </button>
      <div className="managed-training-list">
        <h3>Managed training</h3>
        {managed?.map((content) => (
          <div className="row" key={content.id}>
            <span>
              <strong>{content.body.title}</strong>
              <small>
                {content.kind} · {content.body.state} · revision {content.rev}
              </small>
            </span>
            <button onClick={() => edit(content)}>Edit</button>
          </div>
        ))}
        {!managed?.length && <p>No company training has been created.</p>}
      </div>
    </section>
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
            {data.reports.length ? (
              data.reports.map((r: any) => (
                <div className="panel compact spaced" key={r.id}>
                  <strong>Reported post {r.body.postId}</strong>
                  <p>
                    Reason: {r.body.reason || "other"}
                    {r.body.details ? ` · ${r.body.details}` : ""}
                  </p>
                  <div className="actions">
                    <button
                      onClick={() =>
                        run(async () => {
                          await api(
                            `/community/moderation/${r.id}`,
                            { action: "remove" },
                            "PATCH",
                          );
                          load();
                        })
                      }
                    >
                      Remove post and resolve
                    </button>
                    <button
                      onClick={() =>
                        run(async () => {
                          await api(
                            `/community/moderation/${r.id}`,
                            { action: "dismiss" },
                            "PATCH",
                          );
                          load();
                        })
                      }
                    >
                      Dismiss report
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No open community reports.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
