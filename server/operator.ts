import { z } from "zod";
import {
  db,
  id,
  check,
  createRecord,
  listRecords,
  updateRecord,
  audit,
  tx,
  owner,
  Actor,
} from "./db.ts";
const accent = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .refine((value) => {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return (
      (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] + 0.05) / 0.05 >= 4.5
    );
  }, "Accent needs at least 4.5:1 contrast with black text");
export function configureCompany(a: Actor, input: unknown) {
  check(a.staff, "Platform staff required", 403);
  const body = z
    .object({ name: z.string().trim().min(2).max(120), color: accent })
    .parse(input);
  return tx(() => {
    const cid = "company-" + id();
    const theme = { version: 1, color: body.color, logoAssetId: null };
    db.prepare(
      "INSERT INTO companies(id,name,theme,active) VALUES(?,?,?,1)",
    ).run(cid, body.name, JSON.stringify(theme));
    db.prepare("INSERT INTO memberships(company,user,role) VALUES(?,?,?)").run(
      cid,
      a.user,
      "owner",
    );
    const actor = { ...a, company: cid, role: "owner" };
    createRecord(actor, "theme", theme);
    createRecord(actor, "brand", {
      name: body.name,
      color: body.color,
      logoAssetId: null,
      fontAssetId: null,
      renderFontApproved: false,
      fontUsage: "System fallback until source permissions are recorded.",
      rules: { colors: { primary: body.color } },
      source: "Company setup",
      facts: [],
    });
    createRecord(actor, "entitlements", {
      renderUnits: 200,
      concurrency: 1,
      subscription: "prototype",
      billing: "Not connected",
      retention: "Not selected for launch",
    });
    audit(a, "company.create", cid);
    return { id: cid, name: body.name };
  });
}
export function registerOperator(app: any, route: any) {
  app.post(
    "/api/operator/companies",
    route((req: any, res: any) =>
      res.json(configureCompany(req.actor, req.body)),
    ),
  );
  app.put(
    "/api/theme",
    route((req: any, res: any) => {
      owner(req.actor);
      const input = z
        .object({ color: accent, expectedVersion: z.number().int().positive() })
        .parse(req.body);
      const existing = listRecords(req.actor, "theme")[0];
      const current = JSON.parse(
        (
          db
            .prepare("SELECT theme FROM companies WHERE id=?")
            .get(req.actor.company) as any
        ).theme,
      );
      check(
        current.version === input.expectedVersion,
        "Theme changed. Reload before saving.",
        409,
      );
      const theme = {
        ...current,
        color: input.color,
        version: current.version + 1,
      };
      if (existing) updateRecord(req.actor, existing.id, existing.rev, theme);
      else createRecord(req.actor, "theme", theme);
      db.prepare("UPDATE companies SET theme=? WHERE id=?").run(
        JSON.stringify(theme),
        req.actor.company,
      );
      audit(req.actor, "theme.update", req.actor.company);
      res.json(theme);
    }),
  );
}
