import { parse } from "csv-parse/sync";
import { z } from "zod";
import { Actor, db, getRecord, check, json } from "./db.ts";
import { report, ratio } from "./insights.ts";
import { job } from "./services.ts";
export const importFields = {
  report: [
    "account",
    "adId",
    "date",
    "currency",
    "timezone",
    "attribution",
    "spend",
    "impressions",
    "clicks",
    "leads",
    "videoViews",
    "videoStarts",
    "video25",
    "video50",
    "video75",
    "video100",
    "name",
    "format",
  ],
  crm: [
    "source",
    "leadId",
    "jobId",
    "adId",
    "account",
    "date",
    "qualified",
    "appointment",
    "sold",
    "revenue",
    "currency",
    "revenueBasis",
    "status",
  ],
};
export function inspectCsv(input: unknown) {
  const { csv, type } = z
    .object({
      csv: z.string().min(1).max(2_000_000),
      type: z.enum(["report", "crm"]),
    })
    .parse(input);
  let rows: string[][];
  try {
    rows = parse(csv, { bom: true, trim: true, skip_empty_lines: true });
  } catch {
    check(false, "CSV could not be parsed. Check headers and quoting.");
  }
  check(
    rows!.length > 1 && rows!.length <= 10001,
    "Provide 1–10,000 data rows",
  );
  const headers = rows![0];
  check(
    headers.every(Boolean) && new Set(headers).size === headers.length,
    "Column names must be nonempty and unique",
  );
  return {
    headers,
    fields: importFields[type],
    sample: rows!.slice(1, 4),
    rows: rows!.length - 1,
  };
}

// CRM rows are snapshots, not additive conversion events. Count source IDs once.
export function crmOutcomes(rows: any[], facts: any[]) {
  const leads = new Map<string, any[]>(),
    jobs = new Map<string, any[]>();
  for (const row of rows) {
    const lead = JSON.stringify([row.source, row.leadId]);
    leads.set(lead, [...(leads.get(lead) || []), row]);
    if (row.jobId) {
      const key = JSON.stringify([row.source, row.jobId]);
      jobs.set(key, [...(jobs.get(key) || []), row]);
    }
  }
  const knownAds = new Set(
    facts.map((f) => JSON.stringify([f.account, f.adId])),
  );
  let matched = 0,
    qualified = 0,
    appointments = 0,
    conflicting = 0;
  const unmatched: any[] = [];
  for (const rs of leads.values()) {
    if (rs.some((r) => r.qualified === "true")) qualified++;
    if (rs.some((r) => r.appointment === "true")) appointments++;
    const ads = new Set(
      rs
        .filter((r) => r.adId && r.account)
        .map((r) => JSON.stringify([r.account, r.adId])),
    );
    if (ads.size === 1 && knownAds.has([...ads][0])) matched++;
    else
      unmatched.push({
        source: rs[0].source,
        leadId: rs[0].leadId,
        reason:
          ads.size > 1 ? "Conflicting ad attribution" : "No matching source ad",
      });
  }
  let soldJobs = 0,
    canceledJobs = 0;
  const revenue: Record<
    string,
    {
      currency: string;
      basis: string;
      total: number;
      knownJobs: number;
      missingJobs: number;
    }
  > = {};
  for (const rs of jobs.values()) {
    const variants = new Set(
      rs.map((r) =>
        JSON.stringify([
          r.status,
          r.sold,
          r.revenue,
          r.currency,
          r.revenueBasis,
        ]),
      ),
    );
    if (variants.size > 1) {
      conflicting++;
      continue;
    }
    const r = rs[0];
    if (r.status === "canceled") {
      canceledJobs++;
      continue;
    }
    if (r.sold !== "true") continue;
    soldJobs++;
    const key = `${r.currency} · ${r.revenueBasis}`;
    const group = (revenue[key] ??= {
      currency: r.currency,
      basis: r.revenueBasis,
      total: 0,
      knownJobs: 0,
      missingJobs: 0,
    });
    if (r.revenue === null || r.revenue === undefined) group.missingJobs++;
    else {
      group.total += r.revenue;
      group.knownJobs++;
    }
  }
  return {
    rows: rows.length,
    leads: leads.size,
    qualified,
    appointments,
    soldJobs,
    canceledJobs,
    conflictingJobs: conflicting,
    matched,
    unmatched,
    coverage: ratio(matched, leads.size, 100),
    appointmentRate: ratio(appointments, leads.size, 100),
    revenue: Object.values(revenue),
    dateBasis: [...new Set(rows.map((r) => r.dateBasis || "unspecified"))],
    asOf:
      rows.reduce((v, r) => (r.importedAt > v ? r.importedAt : v), "") || null,
  };
}
export function creativeReview(a: Actor, creativeId: string, version?: number) {
  const record = getRecord(a, creativeId, "creative");
  const stored = db
    .prepare("SELECT body FROM versions WHERE record=? AND rev=?")
    .get(record.id, version || record.rev) as any;
  check(stored, "Creative version not found", 404);
  const doc = json(stored.body),
    campaign = getRecord(a, doc.campaignId, "campaign");
  const checks = [
    {
      name: "Headline",
      pass: doc.layers.some((l: any) => l.role === "headline" && l.text.trim()),
      detail:
        "A readable hook still needs human review in the rendered output.",
    },
    {
      name: "Company logo",
      pass: doc.layers.some((l: any) => l.type === "logo" && l.assetId),
      detail: "Check contrast and clear space in the final output.",
    },
    {
      name: "Current campaign terms",
      pass:
        doc.offerVersion === campaign.body.offerVersion &&
        doc.layers.some(
          (l: any) => l.role === "terms" && l.text === campaign.body.terms,
        ),
      detail:
        "Historical versions remain downloadable; apply the current offer before a new launch.",
    },
    {
      name: "Call to action",
      pass: doc.layers.some((l: any) => l.role === "cta" && l.text.trim()),
      detail: "Confirm the destination and the action match your campaign.",
    },
    {
      name: "Source media",
      pass:
        doc.kind === "video"
          ? doc.scenes.length > 0 && doc.scenes.every((s: any) => s.assetId)
          : doc.layers.some((l: any) => l.type === "photo" && l.assetId),
      detail: "Inspect product accuracy and source usage rights.",
    },
  ];
  if (doc.kind === "video")
    checks.push({
      name: "Scene captions",
      pass: doc.scenes.every((s: any) => s.caption.trim()),
      detail:
        "Play the render to check caption timing and audio intelligibility.",
    });
  return {
    creativeId,
    version: version || record.rev,
    checks,
    method: "Deterministic document checks · rubric v1",
    forecast: "Not enough data for a reliable forecast",
    assessment:
      "These checks describe document readiness, not predicted ad performance.",
  };
}
export function performance(a: Actor, filters: Record<string, string>) {
  check(filters.account && filters.adId, "Choose an account and source ad");
  const current = report(a, filters);
  const ad = current.ads.find(
    (ad: any) => ad.account === filters.account && ad.adId === filters.adId,
  );
  check(ad, "Source ad not found in this period", 404);
  let previous: any = null;
  if (filters.start && filters.end) {
    const start = Date.parse(filters.start),
      end = Date.parse(filters.end),
      span = end - start + 86400000;
    check(
      Number.isFinite(span) && span > 0 && span <= 3660 * 86400000,
      "Choose a valid date range",
    );
    const before = {
      ...filters,
      start: new Date(start - span).toISOString().slice(0, 10),
      end: new Date(start - 86400000).toISOString().slice(0, 10),
    };
    const earlier =
      report(a, before).ads.find((r: any) => r.adId === filters.adId) || null;
    const scope = (rows: any[]) =>
      [
        ...new Set(
          rows.map((r) =>
            JSON.stringify([r.currency, r.timezone, r.attribution]),
          ),
        ),
      ]
        .sort()
        .join(";");
    previous = {
      start: before.start,
      end: before.end,
      ad: earlier && scope(earlier.rows) === scope(ad.rows) ? earlier : null,
    };
  }
  let output: any = null,
    review: any = null;
  if (ad.mapping) {
    review = creativeReview(
      a,
      ad.mapping.body.creativeId,
      ad.mapping.body.version,
    );
    for (const row of db
      .prepare(
        "SELECT id,payload FROM jobs WHERE company=? AND status='ready' AND kind='render' ORDER BY created DESC",
      )
      .all(a.company) as any[]) {
      const payload = json(row.payload);
      if (
        payload.creativeId === ad.mapping.body.creativeId &&
        payload.version === ad.mapping.body.version
      ) {
        const j = job(a, row.id);
        output = {
          id: j.id,
          kind: j.output.file.endsWith(".mp4") ? "video" : "image",
        };
        break;
      }
    }
  }
  const crm = current.crm.rows.filter(
    (r: any) => r.account === filters.account && r.adId === filters.adId,
  );
  return {
    ad,
    previous,
    output,
    review,
    crm: crmOutcomes(crm, current.rows),
    source: current.source,
    interpretation:
      "Observed results are not evidence that creative alone caused an outcome.",
  };
}
export function registerMeasurement(app: any, route: any) {
  app.post(
    "/api/imports/columns",
    route((req: any, res: any) => res.json(inspectCsv(req.body))),
  );
  app.get(
    "/api/performance",
    route((req: any, res: any) => res.json(performance(req.actor, req.query))),
  );
  app.get(
    "/api/creative-review/:id",
    route((req: any, res: any) =>
      res.json(
        creativeReview(
          req.actor,
          req.params.id,
          req.query.version
            ? z.coerce.number().int().positive().parse(req.query.version)
            : undefined,
        ),
      ),
    ),
  );
  app.get(
    "/api/crm-outcomes",
    route((req: any, res: any) => {
      const data = report(req.actor, req.query);
      res.json(crmOutcomes(data.crm.rows, data.rows));
    }),
  );
}
