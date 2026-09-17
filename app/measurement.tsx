import React, { useEffect, useState } from "react";
import { Header, Notice, Empty, Field, useApp } from "./ui";
import { api, go } from "./api";
import { useResource } from "./discovery";
import { reportFilters, useRouteFilters } from "./navigation";
const fmt = (n: any) =>
  n === null || n === undefined
    ? "Unavailable"
    : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const names: Record<string, string> = {
  spend: "Spend",
  leads: "Reported leads",
  cpl: "Cost per lead",
  impressions: "Impressions",
  clicks: "Outbound clicks",
  outboundCtr: "Outbound CTR (%)",
  outboundCpc: "Outbound CPC",
  cpm: "CPM",
  videoStarts: "Video starts",
  video25: "25% plays",
  video50: "50% plays",
  video75: "75% plays",
  video100: "100% plays",
  videoViews: "Source video views",
};
export function ImportWizard({ onImported }: { onImported: () => void }) {
  const { run } = useApp();
  const [csv, setCsv] = useState(""),
    [name, setName] = useState(""),
    [columns, setColumns] = useState<any>(null),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState<any>(null),
    [message, setMessage] = useState(""),
    [reconciliation, setReconciliation] = useState<any>(null);
  function changed(value: string) {
    setCsv(value);
    setColumns(null);
    setPreview(null);
    setMessage("");
    setReconciliation(null);
  }
  return (
    <section className="panel spaced">
      <h2>Import a source report</h2>
      <p>
        Choose the columns, validate every row, then commit. Reimporting the
        same stable IDs updates the existing facts.
      </p>
      <div className="form-grid compact">
        <Field label="Source name">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setPreview(null);
            }}
            placeholder="For example: September account export"
          />
        </Field>
      </div>
      <Field label="CSV file">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              run(async () => {
                if (file.size > 2_000_000)
                  throw new Error("Choose a CSV smaller than 2 MB");
                changed(await file.text());
              });
          }}
        />
      </Field>
      <Field label="CSV contents">
        <textarea
          className="csv"
          value={csv}
          onChange={(e) => changed(e.target.value)}
        />
      </Field>
      <button
        disabled={!csv}
        onClick={() =>
          run(async () => {
            const data = await api("/imports/columns", {
              csv,
              type: "report",
            });
            setColumns(data);
            setMapping(
              Object.fromEntries(
                data.fields.map((field: string) => [
                  field,
                  data.headers.includes(field) ? field : "",
                ]),
              ),
            );
            setPreview(null);
          })
        }
      >
        Read columns
      </button>
      {columns && (
        <>
          <h3 className="spaced">
            Map your source columns · {columns.rows} rows
          </h3>
          <p>
            Map clicks to outbound clicks. Leave unavailable measures unmapped;
            they will not become zero. Dates use YYYY-MM-DD.
          </p>
          <div className="form-grid">
            {columns.fields.map((field: string) => (
              <Field key={field} label={names[field] || field}>
                <select
                  value={mapping[field] || ""}
                  onChange={(e) => {
                    setMapping({ ...mapping, [field]: e.target.value });
                    setPreview(null);
                  }}
                >
                  <option value="">Not supplied</option>
                  {columns.headers.map((h: string) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <button
            className="primary"
            disabled={!name.trim()}
            onClick={() =>
              run(async () =>
                setPreview(
                  await api("/imports/preview", {
                    csv,
                    type: "report",
                    mapping: Object.fromEntries(
                      Object.entries(mapping).map(([key, value]) => [
                        key,
                        value || "__not_supplied__",
                      ]),
                    ),
                    sourceName: name,
                  }),
                ),
              )
            }
          >
            Preview and validate
          </button>
        </>
      )}
      {preview && (
        <>
          <Notice>
            {preview.body.valid.length} valid rows ·{" "}
            {preview.body.errors.length} errors. Nothing has been committed.
          </Notice>
          {preview.body.errors.slice(0, 30).map((e: any) => (
            <p className="failure" key={e.row}>
              Row {e.row}: {e.message}
            </p>
          ))}
          <div className="table-wrap">
            <table>
              <caption>Validated source-report sample rows</caption>
              <thead>
                <tr>
                  {Object.keys(preview.body.valid[0] || {})
                    .filter((k) => !["sourceChecksum", "identity"].includes(k))
                    .map((k) => (
                      <th key={k}>{names[k] || k}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {preview.body.valid.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.entries(row)
                      .filter(
                        ([k]) => !["sourceChecksum", "identity"].includes(k),
                      )
                      .map(([k, value]) => (
                        <td key={k}>
                          {value === null ? "Unavailable" : String(value)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            disabled={!!preview.body.errors.length}
            onClick={() =>
              run(async () => {
                const r = await api(`/imports/${preview.id}/commit`, {});
                setPreview(null);
                setMessage(
                  `${r.count} rows reconciled to the committed facts.`,
                );
                setReconciliation(r);
                onImported();
              })
            }
          >
            Commit validated import
          </button>
        </>
      )}
      {message && <Notice>{message}</Notice>}
      {reconciliation && (
        <dl className="reconciliation-summary">
          <div>
            <dt>New identities</dt>
            <dd>{reconciliation.reconciliation.inserted}</dd>
          </div>
          <div>
            <dt>Corrected identities</dt>
            <dd>{reconciliation.reconciliation.corrected}</dd>
          </div>
          <div>
            <dt>Unchanged identities</dt>
            <dd>{reconciliation.reconciliation.unchanged}</dd>
          </div>
          <div>
            <dt>Source checksum</dt>
            <dd className="break">{reconciliation.checksum}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
export function SavedViews({
  filters,
  onSelect,
}: {
  filters: Record<string, string>;
  onSelect: (filters: any) => void;
}) {
  const { run } = useApp(),
    views = useResource<any[]>("/records/saved-report"),
    [name, setName] = useState("");
  return (
    <div className="toolbar spaced">
      <Field label="Saved report">
        <select
          defaultValue=""
          onChange={(e) => {
            const view = views.data?.find((v) => v.id === e.target.value);
            if (view) onSelect(view.body.filters);
          }}
        >
          <option value="">Choose a saved view</option>
          {views.data?.map((v) => (
            <option value={v.id} key={v.id}>
              {v.body.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="New view name">
        <input
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <button
        disabled={!name.trim()}
        onClick={() =>
          run(async () => {
            await api("/saved-reports", { name, filters });
            setName("");
            views.reload();
          })
        }
      >
        Save current filters
      </button>
    </div>
  );
}
export function Review({ id }: { id?: string }) {
  const { boot } = useApp(),
    [selected, setSelected] = useState(id || boot.creatives[0]?.id || "");
  const result = useResource<any>(
    selected ? "/creative-review/" + selected : "/records/creative",
  );
  return (
    <>
      <Header
        title="Creative review"
        description="Check readiness before a launch and keep assessment separate from actual results."
      />
      <Field label="Creative">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select a creative</option>
          {boot.creatives.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.body.name}
            </option>
          ))}
        </select>
      </Field>
      {selected && result.data?.checks ? (
        <ReviewChecks data={result.data} />
      ) : (
        <Notice>{result.error || "Choose a saved creative to review."}</Notice>
      )}
    </>
  );
}
function ReviewChecks({ data }: { data: any }) {
  return (
    <>
      <section className="panel spaced">
        <h2>{data.method}</h2>
        <p>{data.assessment}</p>
        {data.checks.map((c: any) => (
          <div className="review-check" key={c.name}>
            <h3>
              {c.pass ? "Present" : "Needs attention"} · {c.name}
            </h3>
            <p>{c.detail}</p>
          </div>
        ))}
      </section>
      <Notice>
        {data.forecast}. No numerical CPL prediction, percentile or performance
        score is available.
      </Notice>
    </>
  );
}
export function Performance() {
  const { run, refresh } = useApp();
  const [filters, setFilters] = useRouteFilters({ ...reportFilters, adId: "" });
  const result = useResource<any>(
      "/performance?" + new URLSearchParams(filters),
    ),
    [tab, setTab] = useState("actual"),
    [change, setChange] = useState(""),
    [metric, setMetric] = useState("CPL");
  const data = result.data,
    ad = data?.ad;
  const periodMetrics = data?.previous?.ad?.metrics;
  return (
    <>
      <Header
        title={ad?.name || "Ad performance"}
        description="Actual source results, creative review and the next test."
      >
        <a
          className="button"
          href={
            "#/insights?" +
            new URLSearchParams(
              Object.entries(filters).filter(
                ([key, value]) => key !== "adId" && !!value,
              ),
            )
          }
        >
          Back to Insights
        </a>
      </Header>
      <div className="toolbar">
        {["start", "end", "currency", "attribution"].map((k) => (
          <Field label={k} key={k}>
            <input
              type={["start", "end"].includes(k) ? "date" : "text"}
              value={filters[k] || ""}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      {!data ? (
        <Notice>{result.error || "Loading source ad…"}</Notice>
      ) : (
        <div className="two-columns">
          <section className="panel">
            {data.output ? (
              data.output.kind === "video" ? (
                <video
                  controls
                  className="reference-image"
                  src={`/api/jobs/${data.output.id}/file?play=1`}
                >
                  {data.output.captions && (
                    <track
                      default
                      kind="captions"
                      src={`/api/jobs/${data.output.id}/captions.vtt`}
                      srcLang="en"
                      label="English"
                    />
                  )}
                </video>
              ) : (
                <img
                  className="reference-image"
                  alt={ad.name}
                  src={`/api/jobs/${data.output.id}/file?play=1`}
                />
              )
            ) : (
              <Empty title="No exact rendered preview">
                <p>
                  Map the source ad to an exact exported creative version in
                  Insights. A name match alone is insufficient.
                </p>
              </Empty>
            )}
            <p>
              Account: {ad.account}
              <br />
              Ad ID: {ad.adId}
              <br />
              Evidence: {data.source}
            </p>
            {ad.mapping && (
              <>
                <p>
                  Creative version {ad.mapping.body.version} ·{" "}
                  {ad.mapping.body.evidence}
                </p>
                <a
                  className="button"
                  href={`#/${ad.format === "static" ? "static" : "video"}/${ad.mapping.body.creativeId}`}
                >
                  Open in studio
                </a>
              </>
            )}
            {data.output && (
              <a className="button" href={`/api/jobs/${data.output.id}/file`}>
                Download exact output
              </a>
            )}
            <details className="spaced">
              <summary>Source rows and provenance</summary>
              {ad.rows.map((r: any) => (
                <p key={r.identity}>
                  {r.date} · {r.sourceName}
                  <br />
                  {r.currency} · {r.timezone} · {r.attribution}
                  <br />
                  <small>Source checksum: {r.sourceChecksum}</small>
                </p>
              ))}
            </details>
          </section>
          <section>
            <div className="toolbar">
              {["actual", "review", "forecast"].map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  className={tab === t ? "primary" : ""}
                  onClick={() => setTab(t)}
                >
                  {t === "actual"
                    ? "Actual results"
                    : t === "review"
                      ? "Creative review"
                      : "Forecast"}
                </button>
              ))}
            </div>
            {tab === "actual" ? (
              <>
                <section className="panel spaced">
                  <h2>Reported delivery</h2>
                  {!ad.metrics ? (
                    <Notice>
                      Select one currency and attribution scope to calculate
                      comparable metrics.
                    </Notice>
                  ) : (
                    <div className="metrics">
                      {[
                        "spend",
                        "leads",
                        "cpl",
                        "outboundCtr",
                        "outboundCpc",
                        "cpm",
                      ].map((k) => (
                        <div key={k}>
                          <small>{names[k]}</small>
                          <strong>{fmt(ad.metrics[k])}</strong>
                          <small>
                            {periodMetrics?.[k] !== null &&
                            periodMetrics?.[k] !== undefined &&
                            periodMetrics[k] !== 0 &&
                            ad.metrics[k] !== null
                              ? `${fmt(((ad.metrics[k] - periodMetrics[k]) / periodMetrics[k]) * 100)}% vs prior period`
                              : "No comparable baseline"}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.previous && (
                    <p>
                      Previous period: {data.previous.start}–{data.previous.end}
                    </p>
                  )}
                </section>
                {ad.format !== "static" && (
                  <section className="panel spaced">
                    <h2>Video attention</h2>
                    {[
                      "videoStarts",
                      "videoViews",
                      "video25",
                      "video50",
                      "video75",
                      "video100",
                    ].map((k) => (
                      <p key={k}>
                        {names[k]}: {fmt(ad.metrics?.[k])}
                      </p>
                    ))}
                    <p>
                      Source counts only. Quartile counts do not establish
                      frame-level drop-off.
                    </p>
                  </section>
                )}
                <Notice>{data.interpretation}</Notice>
              </>
            ) : tab === "review" ? (
              data.review ? (
                <ReviewChecks data={data.review} />
              ) : (
                <Notice>
                  Map this source ad to an exact creative version to review its
                  document.
                </Notice>
              )
            ) : (
              <Notice>
                Not enough data for a reliable forecast. No validated
                forecasting model is connected.
              </Notice>
            )}
            {ad.mapping && (
              <section className="panel spaced">
                <h2>Make the next variation</h2>
                <Field label="Proposed change">
                  <textarea
                    value={change}
                    onChange={(e) => setChange(e.target.value)}
                    placeholder="State the hypothesis and the one element you want to change."
                  />
                </Field>
                <Field label="Target metric">
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                  >
                    {[
                      "CPL",
                      "Cost per qualified lead",
                      "Cost per appointment",
                      "Outbound CTR",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <button
                  className="primary"
                  disabled={!change.trim()}
                  onClick={() =>
                    run(async () => {
                      const c = await api("/next-variation", {
                        mappingId: ad.mapping.id,
                        change,
                        metric,
                        filters,
                      });
                      await refresh();
                      go(`${c.body.kind}/${c.id}`);
                    })
                  }
                >
                  Create private variation brief
                </button>
              </section>
            )}
          </section>
        </div>
      )}
    </>
  );
}
