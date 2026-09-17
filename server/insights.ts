import { parse } from "csv-parse/sync";
import { z } from "zod";
import {
  Actor,
  db,
  check,
  creator,
  tx,
  hash,
  createRecord,
  getRecord,
  json,
  listRecords,
  updateRecord,
} from "./db.ts";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Invalid calendar date",
  );
const nonnegative = z.coerce.number().finite().min(0);
const factSchema = z.object({
  account: z.string().min(1),
  adId: z.string().min(1),
  date,
  currency: z.string().regex(/^[A-Z]{3}$/),
  timezone: z.string().min(1),
  attribution: z.string().min(1),
  spend: nonnegative,
  impressions: nonnegative.int().nullable(),
  clicks: nonnegative.int().nullable(),
  leads: nonnegative.int().nullable(),
  videoViews: nonnegative.int().nullable(),
  videoStarts: nonnegative.int().nullable(),
  video25: nonnegative.int().nullable(),
  video50: nonnegative.int().nullable(),
  video75: nonnegative.int().nullable(),
  video100: nonnegative.int().nullable(),
  name: z.string().default(""),
  format: z.enum(["static", "video", "ugc"]).default("static"),
});
export function previewImport(
  a: Actor,
  input: {
    csv: string;
    type: "report";
    mapping: Record<string, string>;
    sourceName: string;
  },
) {
  creator(a);
  input = z
    .object({
      csv: z.string(),
      type: z.literal("report"),
      mapping: z.record(z.string(), z.string()),
      sourceName: z.string().trim().min(1).max(200),
    })
    .parse(input);
  check(input.csv.length < 2_000_000, "CSV exceeds 2 MB");
  check(input.sourceName?.trim(), "Enter a source report name");
  let rows: any[];
  try {
    rows = parse(input.csv, {
      columns: (headers: string[]) => {
        check(
          headers.every(Boolean) && new Set(headers).size === headers.length,
          "Column names must be nonempty and unique",
        );
        return headers;
      },
      skip_empty_lines: true,
      bom: true,
      trim: true,
    });
  } catch {
    check(false, "CSV could not be parsed. Check headers and quoting.");
    return;
  }
  check(rows.length > 0 && rows.length <= 10000, "Provide 1–10,000 data rows");
  const valid: any[] = [],
    errors: any[] = [];
  const identities = new Set();
  for (const [i, row] of rows.entries()) {
    const mapped: any = {};
    const keys = Object.keys(factSchema.shape);
    for (const key of keys) {
      const raw = row[input.mapping?.[key] || key];
      mapped[key] =
        raw === "" || raw === undefined
          ? [
              "impressions",
              "clicks",
              "leads",
              "videoViews",
              "videoStarts",
              "video25",
              "video50",
              "video75",
              "video100",
            ].includes(key)
            ? null
            : undefined
          : raw;
    }
    const parsed = factSchema.safeParse(mapped);
    if (!parsed.success) {
      errors.push({
        row: i + 2,
        message: parsed.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("; "),
      });
      continue;
    }
    const data = parsed.data as any;
    if (
      ["account", "adId", "attribution"].some((key) =>
        String(data[key] || "").includes("|"),
      )
    ) {
      errors.push({
        row: i + 2,
        message: "Identity fields cannot contain the reserved | separator",
      });
      continue;
    }
    try {
      new Intl.DateTimeFormat("en", { timeZone: data.timezone });
    } catch {
      errors.push({ row: i + 2, message: "Unknown reporting timezone" });
      continue;
    }
    if (
      data.format === "static" &&
      [
        "videoViews",
        "videoStarts",
        "video25",
        "video50",
        "video75",
        "video100",
      ].some((k) => data[k] !== null)
    ) {
      errors.push({
        row: i + 2,
        message: "Static ads cannot have video views",
      });
      continue;
    }
    const identity = [
      data.account,
      data.adId,
      data.date,
      data.currency,
      data.timezone,
      data.attribution,
    ].join("|");
    if (identities.has(identity)) {
      errors.push({
        row: i + 2,
        message: "Duplicate stable identity in this file",
      });
      continue;
    }
    identities.add(identity);
    valid.push({
      ...data,
      identity,
      sourceName: input.sourceName,
      evidence: "Client-supplied report",
      sourceChecksum: hash(input.csv),
      importedAt: new Date().toISOString(),
    });
  }
  const preview = createRecord(a, "import", {
    type: input.type,
    sourceName: input.sourceName,
    headers: Object.keys(rows[0]),
    rowCount: rows.length,
    valid,
    errors,
    state: "preview",
    checksum: hash(input.csv),
  });
  return preview;
}
export function commitImport(a: Actor, rid: string) {
  creator(a);
  const r = getRecord(a, rid, "import");
  check(
    r.body.errors.length === 0,
    "Resolve all invalid rows before importing",
  );
  check(
    r.body.state === "preview" || r.body.state === "committed",
    "Invalid import state",
  );
  return tx(() => {
    check(r.body.type === "report", "Unknown import type");
    for (const row of r.body.valid)
      db.prepare(
        "INSERT INTO facts VALUES(?,?,?) ON CONFLICT(company,identity) DO UPDATE SET body=excluded.body",
      ).run(a.company, row.identity, JSON.stringify(row));
    db.prepare("UPDATE records SET body=? WHERE id=?").run(
      JSON.stringify({ ...r.body, state: "committed" }),
      rid,
    );
    return { count: r.body.valid.length, state: "committed" };
  });
}
export function ratio(n: number | null, d: number | null, multiplier = 1) {
  return n === null || d === null || d === 0 ? null : (n / d) * multiplier;
}
export function aggregate(rows: any[]) {
  const sum = (key: string) =>
    rows.length && rows.every((r) => r[key] !== null && r[key] !== undefined)
      ? rows.reduce((n, r) => n + r[key], 0)
      : null;
  const spend = sum("spend"),
    leads = sum("leads"),
    impressions = sum("impressions"),
    clicks = sum("clicks");
  return {
    spend,
    leads,
    impressions,
    clicks,
    cpl: ratio(spend, leads),
    cpm: ratio(spend, impressions, 1000),
    outboundCtr: ratio(clicks, impressions, 100),
    outboundCpc: ratio(spend, clicks),
    videoStarts: rows.every((r) => r.format !== "static")
      ? sum("videoStarts")
      : null,
    video25: rows.every((r) => r.format !== "static") ? sum("video25") : null,
    video50: rows.every((r) => r.format !== "static") ? sum("video50") : null,
    video75: rows.every((r) => r.format !== "static") ? sum("video75") : null,
    video100: rows.every((r) => r.format !== "static") ? sum("video100") : null,
    videoViews: rows.every((r) => r.format !== "static")
      ? sum("videoViews")
      : null,
  };
}
export function report(a: Actor, filters: Record<string, string> = {}) {
  const facts = (
    db.prepare("SELECT body FROM facts WHERE company=?").all(a.company) as any[]
  ).map((r) => json(r.body));
  const rows = facts.filter(
    (r) =>
      (!filters.start || r.date >= filters.start) &&
      (!filters.end || r.date <= filters.end) &&
      (!filters.currency || r.currency === filters.currency) &&
      (!filters.attribution || r.attribution === filters.attribution) &&
      (!filters.account || r.account === filters.account) &&
      (!filters.adId || r.adId === filters.adId) &&
      (!filters.format || r.format === filters.format),
  );
  const groups: Record<string, any[]> = {};
  for (const row of rows) {
    const key = [row.currency, row.timezone, row.attribution].join(" · ");
    (groups[key] ??= []).push(row);
  }
  const mappings = listRecords(a, "mapping");
  return {
    rows,
    groups: Object.entries(groups).map(([scope, rs]) => ({
      scope,
      ...aggregate(rs),
    })),
    ads: [...new Set(rows.map((r) => `${r.account}|${r.adId}`))].map((key) => {
      const rs = rows.filter((r) => `${r.account}|${r.adId}` === key);
      const scopes = new Set(
        rs.map((r) => `${r.currency}|${r.attribution}|${r.timezone}`),
      );
      return {
        key,
        name: rs[0].name || rs[0].adId,
        adId: rs[0].adId,
        account: rs[0].account,
        format: rs[0].format,
        metrics: scopes.size === 1 ? aggregate(rs) : null,
        mapping:
          mappings.find(
            (m) =>
              m.body.account === rs[0].account && m.body.adId === rs[0].adId,
          ) || null,
        rows: rs,
      };
    }),
    source: "Client-supplied reports",
    connection: "Not connected",
    metricVersion: 1,
  };
}
export function saveMapping(a: Actor, input: any) {
  creator(a);
  const creative = getRecord(a, input.creativeId, "creative");
  check(
    db
      .prepare("SELECT rev FROM versions WHERE record=? AND rev=?")
      .get(creative.id, input.version),
    "Exact creative version unavailable",
  );
  check(input.evidence?.trim(), "Record the evidence for this match");
  const facts = report(a).rows;
  check(
    facts.some(
      (f: any) => f.adId === input.adId && f.account === input.account,
    ),
    "Source ad not found",
  );
  check(input.confirmed === true, "Confirm the exact creative match");
  const old = listRecords(a, "mapping").find(
    (m) => m.body.adId === input.adId && m.body.account === input.account,
  );
  const body = {
    account: input.account,
    adId: input.adId,
    creativeId: creative.id,
    version: input.version,
    evidence: input.evidence,
    effectiveFrom: input.effectiveFrom || new Date().toISOString().slice(0, 10),
  };
  return old
    ? updateRecord(a, old.id, old.rev, body)
    : createRecord(a, "mapping", body);
}
