import {
  Actor,
  db,
  check,
  createRecord,
  getRecord,
  listRecords,
  brand,
  updateRecord,
} from "./db.ts";
import {
  saveCampaign,
  newCreative,
  saveCreative,
  queueJob,
} from "./services.ts";
import { report } from "./insights.ts";
export function assistantTurn(a: Actor, input: any) {
  check(
    typeof input.message === "string" &&
      input.message.trim() &&
      input.message.length <= 5000,
    "Enter a message up to 5,000 characters",
  );
  const conversation = input.conversationId
    ? getRecord(a, input.conversationId, "conversation")
    : createRecord(a, "conversation", {
        title: input.message.slice(0, 70),
        messages: [],
        mode: "local-guide",
      });
  const b = brand(a);
  const assets = db
    .prepare(
      "SELECT id,name,status FROM assets WHERE company=? AND status='preview_ready' LIMIT 12",
    )
    .all(a.company) as any[];
  const campaign = input.campaignId
    ? getRecord(a, input.campaignId, "campaign")
    : null;
  let text = "",
    links: any[] = [],
    sources: any[] = [];
  const q = input.message.toLowerCase();
  // Explicit deterministic development adapter. Retrieved text is never parsed as tool instructions.
  if (
    input.action === "create-campaign" ||
    /^create campaign:\s*\S/i.test(input.message)
  ) {
    const name =
      input.action === "create-campaign"
        ? input.message
        : input.message.split(":").slice(1).join(":").trim();
    const result = saveCampaign(a, { name });
    links.push({ label: "Open campaign", route: `campaigns/${result.id}` });
    text = `Created “${result.body.name}” as an awareness draft. Add an offer and exact terms when you have them.`;
  } else if (
    input.action === "create-static" ||
    input.action === "create-video"
  ) {
    check(campaign, "Select a campaign before creating an ad");
    const result = newCreative(a, {
      campaignId: campaign.id,
      kind: input.action === "create-static" ? "static" : "video",
      assetId: input.assetId,
    });
    links.push({
      label: "Open in studio",
      route: `${result.body.kind}/${result.id}`,
    });
    text = `Created an editable ${result.body.kind} document using campaign offer version ${campaign.body.offerVersion}. Open the studio to select media, revise and render.`;
  } else if (input.action === "edit-headline") {
    const r = getRecord(a, input.creativeId, "creative");
    const result = saveCreative(a, r.id, input.expectedVersion, {
      ...r.body,
      layers: r.body.layers.map((l: any) =>
        l.role === "headline" ? { ...l, text: input.message } : l,
      ),
    });
    links.push({
      label: "Open revised creative",
      route: `static/${result.id}`,
    });
    text = `Saved version ${result.rev}. Only the headline changed.`;
  } else if (/brand|colou?r|font|logo/.test(q)) {
    text = `${b.body.name} uses ${b.body.color} for its primary color, with black text on the accent. Use exact imported logo artwork. Typography: ${b.body.rules?.typography?.primary || "Configured company font"}. ${b.body.fontUsage || ""}`;
    sources = [{ label: b.body.source, route: "brand", version: b.rev }];
  } else if (/asset|photo|footage/.test(q)) {
    text = assets.length
      ? `Found ${assets.length} imported previews in this workspace. Browse My Assets to select originals and review provenance.`
      : "No imported media is ready yet. Open My Assets to import a source or upload an original.";
    links = assets
      .slice(0, 5)
      .map((asset) => ({
        label: asset.name,
        route: `assets?asset=${asset.id}`,
      }));
  } else if (/result|lead|spend|performance/.test(q)) {
    const r = report(a);
    text = r.rows.length
      ? r.groups
          .map(
            (g) =>
              `${g.scope}: spend ${g.spend ?? "unavailable"}; leads ${g.leads ?? "unavailable"}; CPL ${g.cpl?.toFixed(2) ?? "unavailable"}.`,
          )
          .join("\n") +
        " These are client-supplied report observations, not causal findings."
      : "No actual reports have been imported. Insights can validate your source CSV. A reliable forecast is unavailable.";
    sources = [
      {
        label: "Company report import · metric definition v1",
        route: "insights",
      },
    ];
  } else if (campaign) {
    text = `You’re working on “${campaign.body.name}”, offer version ${campaign.body.offerVersion}. ${campaign.body.offer ? `Current offer: ${campaign.body.offer}` : "This campaign has no promotional offer."}\nThree starting directions: show the product in a lived-in room; explain the installation process; or focus on one detail homeowners can see. Select Create static or Build video to make an editable draft.`;
    sources = [
      {
        label: campaign.body.name,
        route: `campaigns/${campaign.id}`,
        version: campaign.rev,
      },
    ];
  } else {
    text =
      "I can look up your brand rules, find imported assets, and create an editable campaign or creative. Select a campaign for context, or type “Create campaign: [name]”. Open-ended AI reasoning is not connected yet; this is the local prototype guide.";
  }
  const messages = [
    ...conversation.body.messages,
    { role: "user", text: input.message },
    { role: "assistant", text, links, sources, mode: "local-guide" },
  ];
  return updateRecord(a, conversation.id, conversation.rev, {
    ...conversation.body,
    messages,
  });
}
