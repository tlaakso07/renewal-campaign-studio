# Working-product acceptance matrix

September 15, 2026 · All application rows start **Not implemented** at handoff

The image gallery, source catalog and specifications already exist. They do not satisfy application acceptance below. Record actual tests, artifacts and integration blockers against these IDs during implementation.

| ID | Capability | Required evidence to mark working |
|---|---|---|
| A01 | Reproducible app | Fresh setup can install, migrate, seed explicit development data, run the app/worker and execute checks from documented commands |
| A02 | Identity and companies | Owner invites creator; revoked/other-company user is denied direct API, file URL, search, assistant and export access; synthetic second company has distinct theme/assets |
| A03 | Complete intake ledger | All 424 catalog IDs have truthful status; imported originals have checksums/provenance; missing/unsupported files remain visible; interrupted imports resume without duplicate records |
| A04 | Brand setup | Official logo/font/photo are mapped to versioned rules; interface and static/video output use those sources; update preserves historical versions |
| A05 | Campaigns | Create, duplicate, change offer/terms, inspect affected creatives and resume after restart; historic downloads remain linked to prior offer versions |
| A06 | Editable static | Actual source asset becomes a branded image; edit headline/crop/offer without regenerating unrelated layers; undo/restore works; export files have correct dimensions and exact terms |
| A07 | Video assembly | Real/mixed footage, timing, captions, source audio/voice/music controls and end card render to a playable exported file; test one scene failure/replacement and worker restart |
| A08 | Generated video/UGC | Verified configured provider returns actual usable clips/presenter media; chosen references and branding survive assembly; blocked providers cannot fake success |
| A09 | Assistant | Source-grounded answer plus actual campaign/creative tool action; same record opens in studio; memory/access scope, cancellation, stale version and source-instruction injection checks pass |
| A10 | Catalog and providers | Every observed model is accounted for, exact supported entries are verified, unavailable entries cannot submit; home/catalog/studio/job agree on model and capability; official logos sourced |
| A11 | Jobs and usage | Refresh/close/restart retain state; duplicate request/callback causes no duplicate charge/output; partial results and cancel/retry scope remain visible; downloaded files outlive provider URLs |
| A12 | Export | Selected versions/formats open/play; copy and manifest match; ZIP excludes pending outputs visibly; no manager/agency approval required |
| A13 | Shared library/remix | Two companies see the same published reference and permitted evidence; remixes use their own private brand/assets; source originals/unshared metrics are inaccessible |
| A14 | Actual Insights | Import or connected report reconciles to its source; weighted ratios, zero/missing cases, date/currency/attribution filters, saved views and video-only measures work; no fixture shown as live |
| A15 | Meta connection | Real authorized account selection, import, refresh/reconnect/disconnect; wrong-workspace/replayed callback denied; pagination, partial sync, rate limits and delayed conversions handled; external review/access recorded |
| A16 | Creative matching | Manual-upload Meta ad mapped to exact creative version with evidence; wrong candidate rejected; many-ad/variant mappings do not multiply spend; corrections invalidate affected reports |
| A17 | CRM outcomes | Preview/map/import stable lead/job IDs; repeated import is idempotent; unmatched/errors visible; source totals and match coverage reconcile; no invented ad attribution |
| A18 | Next variation | Actual report opens a private brief with parent creative, evidence, proposed change and metric; subsequent generation uses current offer/brand; observational result not claimed causal |
| A19 | Feed | Real persisted post/comment/poll/reaction, draft handling, audience selection and moderation; no private originals exposed through attachments or mentions |
| A20 | Classroom | Eligible real lesson plays with resources/transcript where available; search/filter/resume works; private lessons inaccessible to another company; missing media handled honestly |
| A21 | Platform operations | Staff can configure and activate a company, manage templates/publications/training, inspect failures through audited support access; client cannot access operator controls |
| A22 | Commercial/account states | Configurable usage/entitlements and invitations work; live billing only claimed after real test integration; cancellation/payment failure behavior matches selected policy |
| A23 | Reliable release | Responsive/keyboard checks; secret redaction; storage/parser/import boundaries; backups restored; migrations and rollback exercised; external dependencies listed |

## Prototype versus client launch

**Working Renewal prototype:** demonstrate the complete create/edit/download journey with actual Renewal assets and functioning software, genuine assistant/media providers where configured, working reporting/imports and truthful integration states. Any unavailable live feature remains explicitly blocked; a simulation does not satisfy its live row.

**Connected external-client readiness:** adds that client's authorized assets/accounts, verified access, deployment and agreed commercial/retention settings, then repeats relevant checks against its independent workspace. Renewal prototype completion is not evidence that an external customer's Meta account can already connect.

## Reference quality exercise

Use one complete Renewal brief to create three distinct statics, one commercial and one UGC/presenter-style example, then revise one element in each and export. This is a proposed repeatable evaluation exercise, not a mandatory bundle the customer must buy. Compare to selected supplied historical ads for craft, correct products, exact identity/terms, believable media and creator usability. Record manual fixes, latency and total production cost. Set pass targets with the user rather than inventing an ad-performance guarantee.

## Status rule

Mark **Working** only with reproducible evidence, **Development-only** for a simulator or local placeholder, **Blocked externally** for unavailable provider/account access, and **Not implemented** for missing code. A stub, attractive screenshot or success toast does not pass a row. Feature-specific tests should cover these material risks without repeating superficial implementation details.
