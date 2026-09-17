import React, { useEffect, useState } from "react";
import { Header, Notice, Empty, Field, useApp } from "./ui";
import { api, go, media } from "./api";

export function useResource<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api(url)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [url, revision]);
  return { data, error, reload: () => setRevision((r) => r + 1) };
}
function Loading({ error }: { error: string }) {
  return <Notice>{error || "Loading…"}</Notice>;
}
export function ReferenceMedia({ reference }: { reference: any }) {
  return reference.body.mediaType === "video" ? (
    <video
      className="reference-image"
      controls
      preload="metadata"
      src={`/api/publications/${reference.id}/media`}
    />
  ) : (
    <img
      className="reference-image"
      src={`/api/publications/${reference.id}/media`}
      alt={reference.body.title}
    />
  );
}
export function Discovery({ shared }: { shared: boolean }) {
  const { run, path } = useApp();
  const refs = useResource<any[]>("/publications"),
    saved = useResource<any[]>("/bookmarks");
  const [query, setQuery] = useState(""),
    [tab, setTab] = useState("curated"),
    [format, setFormat] = useState(""),
    [industry, setIndustry] = useState(""),
    [collection, setCollection] = useState(""),
    [selected, setSelected] = useState(""),
    [collectionName, setCollectionName] = useState("");
  useEffect(() => {
    const reference = new URLSearchParams(path.split("?")[1]).get("reference");
    if (reference) setSelected(reference);
  }, [path]);
  const bookmarks = saved.data || [],
    all = refs.data || [];
  const rows = all.filter(
    (p) =>
      (!query ||
        `${p.body.title} ${p.body.description} ${p.body.industry} ${p.body.style}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!format || p.body.mediaType === format) &&
      (!industry || p.body.industry === industry) &&
      (tab === "saved"
        ? bookmarks.some(
            (b) =>
              b.body.publicationId === p.id &&
              (!collection || b.body.collection === collection),
          )
        : p.body.evidenceType === tab),
  );
  const detail = all.find((p) => p.id === selected);
  const bookmark = (id: string) =>
    bookmarks.find((b) => b.body.publicationId === id);
  async function save(
    p: any,
    active: boolean,
    group = bookmark(p.id)?.body.collection || "",
  ) {
    await run(async () => {
      await api("/bookmarks", {
        publicationId: p.id,
        saved: active,
        collection: group,
      });
      saved.reload();
    });
  }
  return (
    <>
      <Header
        title={shared ? "Winning Ads" : "Templates"}
        description={
          shared
            ? "Study the creative. Check the evidence. Make it your own."
            : "Original compositions, ready for your company’s campaign."
        }
      >
        <a className="button" href="#/remix">
          Start a remix
        </a>
      </Header>
      {!shared && (
        <div className="cards">
          {["Editorial", "Product showcase", "Split composition"].map(
            (name, i) => (
              <article className="panel template-card" key={name}>
                <div className={`layout-sample sample-${i}`}>
                  <i />
                  <b />
                  <em />
                </div>
                <h2>{name}</h2>
                <p>
                  Editable text, product photo, official logo, current offer and
                  terms.
                </p>
                <a
                  className="button"
                  href={`#/static?layout=${["editorial", "showcase", "split"][i]}`}
                >
                  Use layout
                </a>
              </article>
            ),
          )}
        </div>
      )}
      <div className="toolbar spaced" aria-label="Evidence categories">
        {[
          ["curated", "Curated inspiration"],
          ["verified", "Verified results"],
          ["saved", "Saved"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={tab === value}
            className={tab === value ? "primary" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="form-grid panel discovery-filters">
        <Field label="Search references">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hook, service or creative description"
          />
        </Field>
        <Field label="Media">
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="">All media</option>
            <option value="image">Static</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field label="Industry">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">All industries</option>
            {[...new Set(all.map((p) => p.body.industry))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        {tab === "saved" && (
          <Field label="Collection">
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              <option value="">All saved</option>
              {[
                ...new Set(
                  bookmarks.map((b) => b.body.collection).filter(Boolean),
                ),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
      {!refs.data || !saved.data ? (
        <Loading error={refs.error || saved.error} />
      ) : (
        <>
          <p>
            {rows.length} {rows.length === 1 ? "reference" : "references"}
          </p>
          {!rows.length ? (
            <Empty
              title={
                tab === "verified"
                  ? "No verified results published"
                  : "No references found"
              }
            >
              <p>
                {tab === "verified"
                  ? "Shared creative is inspiration until attributable performance evidence is explicitly published and checked."
                  : "Try another filter, or explicitly publish a completed output from Company setup. Saved references are private to you."}
              </p>
            </Empty>
          ) : (
            <div className="cards">
              {rows.map((p) => (
                <article className="panel" key={p.id}>
                  <ReferenceMedia reference={p} />
                  <span className="chip">{p.body.evidence}</span>
                  <h2>{p.body.title}</h2>
                  <p>{p.body.description}</p>
                  <small>
                    {p.body.industry} ·{" "}
                    {p.body.structure?.format || "Format not recorded"}
                  </small>
                  <div className="toolbar spaced">
                    <button
                      onClick={() => {
                        setSelected(p.id);
                        setCollectionName(
                          bookmark(p.id)?.body.collection || "",
                        );
                      }}
                    >
                      View details & evidence
                    </button>
                    <button
                      aria-pressed={!!bookmark(p.id)}
                      onClick={() => save(p, !bookmark(p.id))}
                    >
                      {bookmark(p.id) ? "Saved" : "Save"}
                    </button>
                    <a
                      className="button primary"
                      href={`#/remix?reference=${p.id}`}
                    >
                      Remix
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {detail && (
        <section className="panel spaced" aria-label="Reference details">
          <Header
            title={detail.body.title}
            description="Reference and permitted evidence"
          >
            <button onClick={() => setSelected("")}>Close details</button>
          </Header>
          <ReferenceMedia reference={detail} />
          <p>{detail.body.description}</p>
          <dl className="detail-list">
            <dt>Evidence</dt>
            <dd>{detail.body.evidence} · No measured-performance claim</dd>
            <dt>Published</dt>
            <dd>{new Date(detail.body.capturedAt).toLocaleDateString()}</dd>
            <dt>Usage</dt>
            <dd>{detail.body.usage}</dd>
            <dt>Platform</dt>
            <dd>{detail.body.platform}</dd>
          </dl>
          {detail.body.sourceUrl && (
            <a
              className="button"
              target="_blank"
              rel="noreferrer"
              href={detail.body.sourceUrl}
            >
              Open source
            </a>
          )}
          <Field label="Save to collection">
            <input
              maxLength={80}
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="For example: October hooks"
            />
          </Field>
          <div className="toolbar">
            <button onClick={() => save(detail, true, collectionName)}>
              Save reference
            </button>
            <a
              className="button primary"
              href={`#/remix?reference=${detail.id}`}
            >
              Remix for my brand
            </a>
          </div>
        </section>
      )}
    </>
  );
}

export function Remix() {
  const { boot, path, run, refresh } = useApp();
  const refs = useResource<any[]>("/publications"),
    assets = useResource<any[]>("/assets");
  const [sourceType, setSourceType] = useState("publication"),
    [sourceId, setSourceId] = useState(
      new URLSearchParams(path.split("?")[1]).get("reference") || "",
    ),
    [campaignId, setCampaignId] = useState(boot.campaigns[0]?.id || ""),
    [assetId, setAssetId] = useState(""),
    [kind, setKind] = useState("static"),
    [format, setFormat] = useState("portrait"),
    [layout, setLayout] = useState("editorial"),
    [adapt, setAdapt] = useState<string[]>(["layout"]),
    [direction, setDirection] = useState(""),
    [hook, setHook] = useState(""),
    [captions, setCaptions] = useState(""),
    [durations, setDurations] = useState("6, 6"),
    [busy, setBusy] = useState(false);
  const imported = (assets.data || []).filter(
    (a) =>
      a.status === "preview_ready" &&
      (a.kind === "image" || a.kind === "video"),
  );
  const reference = refs.data?.find((p) => p.id === sourceId),
    campaign = boot.campaigns.find((c: any) => c.id === campaignId);
  function chooseReference(id: string) {
    setSourceId(id);
    const p = refs.data?.find((r) => r.id === id);
    if (p) {
      setKind(p.body.mediaType === "video" ? "video" : "static");
      if (p.body.structure) {
        setFormat(p.body.structure.format);
        setLayout(p.body.structure.layout);
        if (p.body.structure.scenes?.length)
          setDurations(
            p.body.structure.scenes.map((s: any) => s.duration).join(", "),
          );
      }
    }
  }
  useEffect(() => {
    if (sourceType === "publication" && sourceId) chooseReference(sourceId);
  }, [refs.data]);
  async function create() {
    setBusy(true);
    try {
      await run(async () => {
        const c = await api("/remixes", {
          sourceType,
          sourceId,
          campaignId,
          assetId,
          kind,
          format,
          layout,
          adapt,
          direction,
          hook,
          captions: captions ? captions.split("\n") : [],
          durations:
            kind === "video"
              ? durations.split(",").map((v) => Number(v.trim()))
              : [],
        });
        await refresh();
        go(`${c.body.kind}/${c.id}`);
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header
        title="Remix for my brand"
        description="Choose the structure you want to adapt, then use your own campaign and media."
      />
      <div className="two-columns">
        <section className="panel">
          <h2>1. Choose a reference</h2>
          <Field label="Reference source">
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(e.target.value);
                setSourceId("");
              }}
            >
              <option value="publication">Shared reference</option>
              <option value="asset">My uploaded reference</option>
            </select>
          </Field>
          <Field label="Reference">
            <select
              value={sourceId}
              onChange={(e) =>
                sourceType === "publication"
                  ? chooseReference(e.target.value)
                  : setSourceId(e.target.value)
              }
            >
              <option value="">Select a reference</option>
              {(sourceType === "publication" ? refs.data || [] : imported).map(
                (p) => (
                  <option key={p.id} value={p.id}>
                    {p.body?.title || p.name}
                  </option>
                ),
              )}
            </select>
          </Field>
          {sourceType === "publication" && reference && (
            <ReferenceMedia reference={reference} />
          )}
          {sourceType === "asset" && (
            <p>
              Upload an image or video in <a href="#/assets">My Assets</a>, then
              describe its structure here. Automatic visual analysis is not
              connected.
            </p>
          )}
          <h2>2. Adapt intentionally</h2>
          <Field label="Creative type">
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                if (e.target.value === "static") setAdapt(["layout"]);
              }}
            >
              <option value="static">Static</option>
              <option value="video">Video</option>
            </select>
          </Field>
          <fieldset>
            <legend>What should this remix adapt?</legend>
            {[
              "hook",
              "layout",
              ...(kind === "video"
                ? ["narrative", "shots", "pacing", "captions"]
                : []),
            ].map((k) => (
              <label className="check-option" key={k}>
                <input
                  type="checkbox"
                  checked={adapt.includes(k)}
                  onChange={(e) =>
                    setAdapt(
                      e.target.checked
                        ? [...adapt, k]
                        : adapt.filter((v) => v !== k),
                    )
                  }
                />
                {k}
              </label>
            ))}
          </fieldset>
          <Field label="Direction for this adaptation">
            <textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              placeholder="What works in this reference, and how should our version differ?"
            />
          </Field>
          {adapt.includes("hook") && (
            <Field label="Your company’s hook">
              <input
                maxLength={1000}
                value={hook}
                onChange={(e) => setHook(e.target.value)}
              />
            </Field>
          )}
        </section>
        <section className="panel">
          <h2>3. Use your campaign</h2>
          <Field label="Destination campaign">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">Select a campaign</option>
              {boot.campaigns.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.body.name}
                </option>
              ))}
            </select>
          </Field>
          {!boot.campaigns.length && (
            <a className="button" href="#/campaigns/new">
              Create campaign first
            </a>
          )}
          {campaign && (
            <Notice>
              Current offer: {campaign.body.offer || "Awareness — no promotion"}
              <br />
              Terms: {campaign.body.terms || "No terms entered"}
            </Notice>
          )}
          <Field label="Your destination media">
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">Choose imported company media</option>
              {imported
                .filter((a) => kind === "video" || a.kind === "image")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Format">
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              {["square", "portrait", "vertical"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Layout when source geometry is unavailable">
            <select value={layout} onChange={(e) => setLayout(e.target.value)}>
              {["editorial", "showcase", "split"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          {kind === "video" && (
            <>
              <Field label="Scene durations, in seconds">
                <input
                  value={durations}
                  onChange={(e) => setDurations(e.target.value)}
                  placeholder="6, 6, 3"
                />
              </Field>
              <Field label="Your scene captions, one per line">
                <textarea
                  value={captions}
                  onChange={(e) => setCaptions(e.target.value)}
                />
              </Field>
              <p>
                Scenes start with your selected media. Replace each shot and
                refine the narrative in Video Studio.
              </p>
            </>
          )}
          <p>
            Your remix stays private. The source advertiser’s files, people,
            product claims and historical offer are not copied.
          </p>
          <button
            className="primary"
            disabled={
              busy ||
              !sourceId ||
              !campaignId ||
              !assetId ||
              !direction.trim() ||
              !adapt.length
            }
            onClick={create}
          >
            {busy ? "Creating…" : "Create editable remix"}
          </button>
          {(refs.error || assets.error) && (
            <Notice>{refs.error || assets.error}</Notice>
          )}
        </section>
      </div>
    </>
  );
}

export function CampaignExport() {
  const { boot, path } = useApp();
  const [campaign, setCampaign] = useState(
      new URLSearchParams(path.split("?")[1]).get("campaign") ||
        boot.campaigns[0]?.id ||
        "",
    ),
    [selected, setSelected] = useState<string[]>([]);
  const result = useResource<any>(
    campaign ? `/campaigns/${campaign}/exports` : "/records/campaign",
  );
  const jobs = result.data?.jobs || [],
    included = jobs.filter(
      (j: any) => selected.includes(j.id) && j.downloadable,
    ),
    excluded = jobs.filter(
      (j: any) => selected.includes(j.id) && !j.downloadable,
    );
  useEffect(() => setSelected([]), [campaign]);
  return (
    <>
      <Header
        title="Campaign export"
        description="Choose the exact rendered versions to download, with their copy, captions and manifest."
      >
        <button onClick={result.reload}>Refresh outputs</button>
      </Header>
      <Field label="Campaign">
        <select value={campaign} onChange={(e) => setCampaign(e.target.value)}>
          <option value="">Select a campaign</option>
          {boot.campaigns.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.body.name}
            </option>
          ))}
        </select>
      </Field>
      {!campaign ? (
        <Empty title="Choose a campaign" />
      ) : !result.data ? (
        <Loading error={result.error} />
      ) : (
        <>
          <div className="toolbar spaced">
            <button
              disabled={!jobs.length}
              onClick={() =>
                setSelected(
                  jobs
                    .filter((j: any) => j.downloadable)
                    .slice(0, 30)
                    .map((j: any) => j.id),
                )
              }
            >
              Select ready outputs
            </button>
            <button onClick={() => setSelected([])}>Clear selection</button>
          </div>
          {!jobs.length ? (
            <Empty title="No renders in this campaign">
              <p>Open a creative and render it first.</p>
            </Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <caption>
                  Rendered campaign outputs available for export
                </caption>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Creative</th>
                    <th>Version / offer</th>
                    <th>Format</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j: any) => (
                    <tr key={j.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${j.name} version ${j.version}`}
                          checked={selected.includes(j.id)}
                          disabled={
                            !selected.includes(j.id) && selected.length >= 30
                          }
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, j.id]
                                : selected.filter((v) => v !== j.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <a href={`#/${j.kind}/${j.creativeId}`}>{j.name}</a>
                        <small>{new Date(j.created).toLocaleString()}</small>
                      </td>
                      <td>
                        v{j.version} / offer v{j.offerVersion}
                      </td>
                      <td>
                        {j.format} · {j.kind === "video" ? "MP4" : "PNG"}
                      </td>
                      <td>{j.downloadable ? "Ready" : j.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Notice>
            {included.length} ready outputs included. {excluded.length} selected
            outputs excluded because they are pending, failed, canceled or
            missing. The ZIP includes an export summary.
          </Notice>
          {included.length > 0 && (
            <a
              className="button primary"
              href={`/api/export?jobs=${selected.join(",")}`}
            >
              Download selected ZIP
            </a>
          )}
          {result.data.unrendered?.length > 0 && (
            <section className="panel spaced">
              <h2>Latest versions still need a render</h2>
              {result.data.unrendered.map((c: any) => (
                <p key={c.id}>
                  <a className="button" href={`#/${c.kind}/${c.id}`}>
                    {c.name} · v{c.version} → Open studio
                  </a>
                </p>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
