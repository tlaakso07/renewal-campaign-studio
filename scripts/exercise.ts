// Repeatable, explicitly labeled local creative exercise. No metrics, testimonials or offers are invented.
import { db, listRecords, brand } from "../server/db.ts";
import {
  newCreative,
  saveCreative,
  queueJob,
  saveCampaign,
} from "../server/services.ts";
if (process.env.APP_ENV !== "development" || process.env.DEV_AUTH !== "true")
  throw new Error("Local exercise only");
const a = {
  company: "renewal",
  user: "renewal-owner",
  role: "owner",
  staff: false,
  name: "Local exercise",
};
let campaign = listRecords(a, "campaign").find(
  (c) => c.body.name === "Renewal prototype · A brighter view",
);
if (!campaign)
  campaign = saveCampaign(a, {
    name: "Renewal prototype · A brighter view",
    terms: "Prototype awareness creative. No promotional offer.",
  });
const photos = [
  "19OmyeijVrGW7vUT7G__8WVORG3OtaODY",
  "11URlFfKlPhj8vlL9bp9oOK-1Hv61aD6u",
  "1jLpgd1t3kpROi60gaz1ichBmCEfA48o0",
];
for (const [i, layout] of ["editorial", "showcase", "split"].entries()) {
  const name = "Prototype exercise · " + layout;
  let c = listRecords(a, "creative").find((c) => c.body.name === name);
  if (!c) {
    c = newCreative(a, {
      campaignId: campaign.id,
      kind: "static",
      assetId: photos[i],
      layout,
      format: "portrait",
    });
    c = saveCreative(a, c.id, c.rev, {
      ...c.body,
      name,
      layers: c.body.layers.map((l: any) =>
        l.role === "headline"
          ? {
              ...l,
              text: [
                "A brighter view starts here.",
                "Make room for more light.",
                "A fresh perspective.",
              ][i],
            }
          : l,
      ),
    });
  }
  const j = queueJob(
    a,
    "render",
    { creativeId: c.id, version: c.rev },
    "exercise-" + c.id + "-" + c.rev,
  );
  console.log(name, j.id);
}
for (const duration of [15, 30]) {
  const name = `Prototype exercise · ${duration}s real-footage walkthrough`;
  let c = listRecords(a, "creative").find((c) => c.body.name === name);
  if (!c) {
    c = newCreative(a, {
      campaignId: campaign.id,
      kind: "video",
      assetId: photos[0],
      format: "square",
    });
    const scenes = [
      {
        id: "door-wide",
        assetId: "1V2zFO-VJfjajge_grGeR6EYF6oCDgW6z",
        duration: 6,
        trim: 0,
        caption: "A welcoming first impression.",
        mute: true,
        volume: 1,
        source: "company",
      },
      {
        id: "door-detail",
        assetId: "1rZ2rQGJcau3oOxCCaCdTHeCDU05BIbJX",
        duration: 6,
        trim: 0,
        caption: "Take a closer look.",
        mute: true,
        volume: 1,
        source: "company",
      },
    ];
    if (duration === 30)
      scenes.push(
        {
          id: "living-room",
          assetId: photos[0],
          duration: 8,
          trim: 0,
          caption: "Make room for more light.",
          mute: true,
          volume: 1,
          source: "company",
        },
        {
          id: "kitchen",
          assetId: photos[1],
          duration: 7,
          trim: 0,
          caption: "Explore your options.",
          mute: true,
          volume: 1,
          source: "company",
        },
      );
    c = saveCreative(a, c.id, c.rev, { ...c.body, name, scenes });
  }
  const j = queueJob(
    a,
    "render",
    { creativeId: c.id, version: c.rev },
    "exercise-" + c.id + "-" + c.rev,
  );
  console.log(name, j.id);
}
