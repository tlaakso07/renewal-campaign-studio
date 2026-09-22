// One-time Renewal setup for the static ad generator: approved Franklin Gothic weights,
// reverse logo, curated ad photo pools, and structured October offer copy.
// Idempotent: re-running with nothing to change writes no new versions.
import { getRecord, updateRecord, brand, listRecords, type Actor } from "../server/db.ts";
import { brandAdSchema } from "../server/types.ts";
import { saveCampaign } from "../server/services.ts";

const a: Actor = { user: "renewal-owner", company: "renewal", role: "owner", staff: false, name: "Alex · Renewal" };

const ad = brandAdSchema.parse({
  // ITC Franklin Gothic Std, supplied by Renewal; rendering approved by Trevor 2026-09-17.
  fonts: {
    book: "1OkZjKvno7xoIzlxkqtIkkndh1ALjlcem",
    bookItalic: "1lm6DNYb8JNCHl8F7CL0pDdAcdK1GvVVQ",
    medium: "1LAHHjCkwyEXpg7FriuTZNl8SN3V31BVa",
    mediumItalic: "1LAU_Hre554dul_0-UqNg5QdLTY8_4zvi",
    demi: "1fYU8wNSm6S3SAzXzRN82H9cls5rhZNrP",
    demiItalic: "1ZEfqk18SsnAoS_uJT-I9URVCEpwH3E5F",
    heavy: "16FKuZX1ifUO1XyrpqPCluTM8N9ahmYkU",
    heavyItalic: "1fZdUAcdBoYDKjlyBFNj7zBQphYCji6J2",
    demiCondensed: "1OsZmyPxqa1Hr-TpaV5jH5OWHAmGAFq1W",
  },
  logoReverseAssetId: "124YWofDHp08l6rHWdnTTHWmkxKJLUAfQ", // horizontal logo_white RGB (tagline lockup)
  videoKit: {
    vehicle: ["14rhjqvydl32V8pyehu5_o2Wh9_P9pkkK", "1q1q5lQbjx64oNpXpNyC1uyJMX64HgTOx"],
    uniform: ["1gjgT9OKq8lmRFzFcH43juvDqMKfv-6iL", "1-Fxr2FzEkGOwYt9CI4zv7M8mVbHABjNh"],
    product: ["1T8UF0lF0pm9_mpy-bFfLSVom7RO7WZ1s", "1bf8c9ajfQCSZN04zMw2ADKN36qpZ4MJ-"],
    notes:
      "VEHICLE: a white box truck; on its side a large Renewal-green (#6CC14C) panel with the Renewal by Andersen installer-carrying-a-window logo and the words RENEWAL by ANDERSEN beneath, plus a thin line drawing of two installers. CREW UNIFORM: black short-sleeve polo with exactly ONE chest mark — the small Renewal by Andersen wordmark with its green triangle on the wearer's LEFT chest (viewer's right). The wearer's right chest (viewer's left) is plain black fabric: do NOT draw the Master Installer emblem or any second logo there, even though the reference photos show one (client rule, 2026-09-18); black baseball cap with the small logo on the front; tan/khaki canvas work trousers; brown leather tool belt; tan work boots. PRODUCT: Renewal by Andersen replacement windows — crisp white (or black) Fibrex composite frames with clean square profiles, narrow sightlines and colonial grilles on double-hung units; new glass still carries small round green/orange factory stickers.",
    // Production-brief facts from the agency's Fall Savings brief (research/growthub-production-brief/).
    region: "Kentucky",
    bannedRegion: "Oregon",
    misspellings: ["Anderson"],
    claims: [
      { text: "Fibrex frames won't rot, crack, or rust" },
      { text: "One crew, start to finish — no subcontractors" },
      { text: "Exclusive Fibrex material, 2× stronger than vinyl" },
    ],
    // Al (A-Team service tech) is a real brand ambassador; his four photos live in the client's Dropbox and are not imported yet.
    avatars: [],
    references: [],
    pastConcepts: [
      { title: "Creative #1", format: "animated, original song", register: "playful", device: "musical brand piece" },
      { title: "Creative #6", format: "animated, original song", register: "playful", device: "musical brand piece" },
      { title: "Creative #9", format: "animated, original song", register: "playful", device: "musical brand piece" },
      { title: "Creative #10 — The Face Behind Signature Service (July)", format: "staged brand video", register: "pride", device: "direct-address brand ambassador (Al)" },
    ],
  },
  // Real shipped Renewal ads (one size per design): July 4:5, August 4:5, September statics.
  styleReferences: [
    "1z140QPbF9nBilxoKyfWYANz7mGog59FG", "1debEb00Gn_ICZxuN3y0IPEtVKntZkro2", "1w-dQ9P0Q5PT0s7OMdd-e2iHUVSfAGfM3",
    "1ZkmNRc7ahkjaXh7xrEttQObE2CN9lV_D", "1nUcSN7yMzePtJkV3B6TuWcMClenHS1mq",
    "1jesAJdQbHP7jFqm_Z5Nc9XP4jUko4J0C", "1Fjq82wtvJSbjqF2ChPWbDK6s-aqHJxTD", "1tk2ccUkQycld_2WYK3cfpdaTO0YdUgcU",
    "1_HNLckJoHzf_ckqOIl0l-Gm09XS7Lrk3", "126-SmaefB0evg-1j_2i4w9IiLjP3boYc", "1BcN8WvKJkGbb18rG859w857kDg1MxoA5",
    "1LP4BEmykVHT8AQVRN1GqEmHu4hpwBX1g", "1rx3qylUlpkxjAYvAqYRWl9Ri_ZDXLGm0", "1gaNKlj6ndaaoQ-ca3hMEXUBuh05Jn_cs",
    "1nJSGK0ZtYk90up9rD79PASXt6schbkvd",
    "1Gm3Faee9OmwlA_5RB6IYbnGpsrnJWEaV", "1Yt3r53B6nmdfL2ephAzr3yDaOLYOSUYR", "12OLbMqXJPtJnU_pWmkMR9NrCyyn98LxP",
    "1P6z_m2eADZOdKuz0Q0BVqMQl9hxiyHbv", "10njKbFbEEjk8tvVfNZB-UyXAuccOmjSD", "1lMa67QLbRbp0MA1hQhqeO8jc34x42Zae",
  ],
  adPhotos: {
    // Window-forward interiors/exteriors; excludes screenshots, textures, baked-copy and dated-claim images.
    scenes: "1UcH0taRuP5svHq3d_mHxRQX0MELPlRs2,17m__cFmkIxFLsHrcbn4XFUKw4qSZ61PF,17g8KevAKotINR8hUKem3mk5l05oujcAD,1ZxrgbaqnS18cE0Z_vKJ2btkH-2bMLKxg,11URlFfKlPhj8vlL9bp9oOK-1Hv61aD6u,19OmyeijVrGW7vUT7G__8WVORG3OtaODY,1Uy1U65R8w1iUScBKbDrKaGd7yjG5S0Sf,1jLpgd1t3kpROi60gaz1ichBmCEfA48o0,15-6Pk6X7H4_NOtezwWTPrpu_UKyhBlKC,1REn8xB6xza7m68_XEiEGJzasXf5Y01Pw,1bf8c9ajfQCSZN04zMw2ADKN36qpZ4MJ-,1loqOWTn_YtsatDVx0qHC2Mji-SuZXi_t,1FUxBxLHT54DbAgOsGX9PzXJ3cTnpkoRV,1iXOv3KRUm9xX78UaaDFQx12U-uA7lrvB,1R5aLQd1WONusKwKdxh4QG500pX9PUa9R,1fuaSKQ7Xl0NHWTxVTOAn4eWA3aRWiS-Y,1mJ-trABraex49Rb6XYPox52P5MXTFmnt,1_n5H_swpX87aOUshDXbWKKtOKcHqxmym".split(","),
    // Transparent cutouts that read on black (dark-frame window holders excluded).
    cutouts: "1DQ3CRD2yIVl68Kq_xBBSzoekDL9lq4OM,1gjgT9OKq8lmRFzFcH43juvDqMKfv-6iL,1T8UF0lF0pm9_mpy-bFfLSVom7RO7WZ1s,1MsGQle2O7xh6G6KB61HaEUHQA8xZVswz,1-Fxr2FzEkGOwYt9CI4zv7M8mVbHABjNh,1EXSd8BCy8NcHuhEeDMfKTQcTdtV4IK1w,1Y1bC8IT6Gj3WJlf_se9QiC3qN4tdkw7W,1fdcHG7yaxsO2FfNo3wPyyBRCx-nlr9y-,1e3-ORQl17-hLT1bTNdor4KXGEfZS-_nR,1ffxuhIBtmEU9Wx-N-756pVE6ursuO4WY,1DEVF-_kNNIJmsAO4mEKbGu-QpHsK8FvW".split(","),
  },
});
const b = brand(a);
const nextBrand = {
  ...b.body,
  ...ad,
  renderFontApproved: true,
  fontUsage: "ITC Franklin Gothic Std (client-supplied) approved for ad rendering, 2026-09-17.",
  requiredFinePrint: "We are an independently owned and operated Renewal by Andersen retailer.",
};
if (JSON.stringify(nextBrand) !== JSON.stringify(b.body)) {
  const r = updateRecord(a, b.id, b.rev, nextBrand);
  console.log(`Brand → version ${r.rev}`);
} else console.log("Brand unchanged");

const october = listRecords(a, "campaign").find((c: any) => c.body.name === "October 2026 Fall Savings");
if (!october) throw new Error("October 2026 Fall Savings campaign not found");
const c = getRecord(a, october.id, "campaign");
const nextCampaign = {
  ...c.body,
  terms: "Buy 5 windows: $1,000 off. Buy 10 windows: $3,000 off. Offer valid before 10/31/2026.",
  tiers: [
    { lead: "Buy 5 Windows", value: "Save $1,000" },
    { lead: "Buy 10 Windows", value: "Save $3,000" },
  ],
  headlines: ["Fall Window Sale!", "Save This Fall On Windows!", "Save On Custom\nWindow & Door Replacement:", "Fall Savings On Windows!"],
  ctaLabels: ["Book your FREE Design Consultation", "Schedule Today!"],
  legalApproved: false,
};
if (JSON.stringify(nextCampaign) !== JSON.stringify(c.body)) {
  const r = saveCampaign(a, nextCampaign, c.id, c.rev);
  console.log(`October campaign → rev ${r.rev}, offer version ${r.body.offerVersion}`);
} else console.log("October campaign unchanged");
