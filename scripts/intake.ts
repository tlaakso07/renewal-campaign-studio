import { migrate, db, brand, updateRecord } from "../server/db.ts";
import { importDrive } from "../server/assets.ts";
migrate();
const a = {
  company: "renewal",
  user: "operator",
  role: "owner",
  staff: true,
  name: "Operator",
};
const representative = [
  "1CfC6DCbekJWGEfKJ4MnFzddOwySR59sa",
  "1fYU8wNSm6S3SAzXzRN82H9cls5rhZNrP",
  "19OmyeijVrGW7vUT7G__8WVORG3OtaODY",
  "11URlFfKlPhj8vlL9bp9oOK-1Hv61aD6u",
  "1jLpgd1t3kpROi60gaz1ichBmCEfA48o0",
  "1V2zFO-VJfjajge_grGeR6EYF6oCDgW6z",
  "1rZ2rQGJcau3oOxCCaCdTHeCDU05BIbJX",
];
const ids = process.argv.includes("--all")
  ? (
      db.prepare("SELECT id FROM assets WHERE company='renewal'").all() as any[]
    ).map((a) => a.id)
  : process.argv.slice(2).length
    ? process.argv.slice(2)
    : representative;
for (const id of ids) {
  try {
    const asset = await importDrive(a, id);
    console.log(asset.status, asset.name);
  } catch (e) {
    console.log("Needs attention:", id, (e as Error).message);
  }
}

const b = brand(a);
const logo = db
  .prepare(
    "SELECT id FROM assets WHERE company='renewal' AND id=? AND preview IS NOT NULL",
  )
  .get("1CfC6DCbekJWGEfKJ4MnFzddOwySR59sa") as any;
const font = db
  .prepare(
    "SELECT id FROM assets WHERE company='renewal' AND id=? AND checksum IS NOT NULL",
  )
  .get("1fYU8wNSm6S3SAzXzRN82H9cls5rhZNrP") as any;
if (logo && !b.body.logoAssetId)
  updateRecord(a, b.id, b.rev, {
    ...b.body,
    logoAssetId: logo.id,
    fontAssetId: font?.id || null,
  });
