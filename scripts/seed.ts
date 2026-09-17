import {
  db,
  migrate,
  tx,
  createRecord,
  readPackage,
  DATA,
} from "../server/db.ts";
import { ensureClassroomCatalog } from "../server/classroom.ts";
if (
  process.env.NODE_ENV === "production" ||
  process.env.APP_ENV !== "development" ||
  process.env.DEV_AUTH !== "true"
)
  throw new Error("Seed requires APP_ENV=development and DEV_AUTH=true");
migrate();
tx(() => {
  for (const [company, name, color] of [
    ["renewal", "Renewal by Andersen", "#6CC14C"],
    ["test-company", "Cedar Home · Test company", "#D5AE74"],
  ]) {
    db.prepare(
      "INSERT OR IGNORE INTO companies(id,name,theme) VALUES(?,?,?)",
    ).run(
      company,
      name,
      JSON.stringify({ version: 1, color, logoAssetId: null }),
    );
    for (const [suffix, role] of [
      ["owner", "owner"],
      ["creator", "creator"],
    ]) {
      const user = `${company}-${suffix}`;
      db.prepare(
        "INSERT OR IGNORE INTO users(id,name,email) VALUES(?,?,?)",
      ).run(
        user,
        `${suffix === "owner" ? "Alex" : "Sam"} · ${company === "renewal" ? "Renewal" : "Test"}`,
        `${user}@local.invalid`,
      );
      db.prepare(
        "INSERT OR IGNORE INTO memberships(company,user,role) VALUES(?,?,?)",
      ).run(company, user, role);
    }
    const a = {
      company,
      user: `${company}-owner`,
      role: "owner",
      staff: false,
      name: "Alex",
    };
    if (
      !db
        .prepare("SELECT id FROM records WHERE kind='brand' AND company=?")
        .get(company)
    )
      createRecord(a, "brand", {
        name,
        version: 1,
        color,
        logoAssetId: null,
        fontAssetId: null,
        fontUsage:
          "Source font rendering permission needs review; interface uses system fallback.",
        rules:
          company === "renewal"
            ? readPackage("library/renewal-by-andersen/brand-rules.json")
            : { colors: { green: color } },
        source:
          company === "renewal"
            ? "Supplied brand guide · revision 2025-02-03"
            : "Synthetic boundary-test company",
        facts: [],
        renderFontApproved: false,
      });
    if (
      !db
        .prepare(
          "SELECT id FROM records WHERE kind='entitlements' AND company=?",
        )
        .get(company)
    )
      createRecord(a, "entitlements", {
        renderUnits: 200,
        concurrency: 2,
        subscription: "prototype",
        billing: "Not connected",
        retention: "Not selected for launch",
      });
  }
  db.prepare(
    "INSERT OR IGNORE INTO users(id,name,email,staff) VALUES(?,?,?,1)",
  ).run("operator", "Local operator", "operator@local.invalid");
  db.prepare(
    "INSERT OR IGNORE INTO memberships(company,user,role) VALUES(?,?,?)",
  ).run("renewal", "operator", "owner");
  const catalog = readPackage("library/renewal-by-andersen/catalog.json");
  for (const a of catalog.assets)
    db.prepare(
      "INSERT OR IGNORE INTO assets(id,company,source_id,name,kind,status,source_url,collection,metadata) VALUES(?,?,?,?,?,?,?,?,?)",
    ).run(
      a.id,
      "renewal",
      a.id,
      a.name,
      a.type,
      "discovered",
      a.sourceUrl,
      a.collection,
      JSON.stringify({
        catalogPath: a.path,
        extension: a.extension,
        usage: "Supplied by client; review source-specific usage",
        historical: a.collection === "meta",
      }),
    );
});
ensureClassroomCatalog({
  company: "renewal",
  user: "operator",
  role: "owner",
  staff: true,
  name: "Local operator",
});
console.log(
  `Explicit development seed complete at ${DATA}. No campaigns, performance metrics or community activity fabricated.`,
);
