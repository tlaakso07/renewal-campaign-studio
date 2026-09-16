# Private hosted prototype — deployment proposal

September 16, 2026. The user explicitly selected a full working hosted app. A static frontend preview does not satisfy this deliverable.

## Verified source and Vercel setup

- Source: private `tlaakso07/renewal-campaign-studio`, branch `main`, initial checkpoint `fef2d70`.
- Vercel team: `tlaakso11-3399s-projects`.
- Project: `renewal-campaign-studio`, ID `prj_c8wsJlGQkPZhPoJsk3YM6ZfQIwCR`.
- Verified API setting: `ssoProtection.deploymentType = all`; Node 24.x; automatic custom-domain assignment disabled. Public source is not enabled (API value `null`).
- No app deployment exists yet. URL-level anonymous denial therefore cannot yet be tested.

## Recommended first hosted topology

Keep the Vercel web frontend and gateway protected by Vercel Authentication. Run the existing Node API, persistent SQLite database, private media and single FFmpeg worker together on a dedicated persistent cloud host. This preserves the tested local transaction/worker behavior without pretending local disk is durable inside a Vercel Function. It is a private prototype topology, not a multi-host production architecture.

Available authenticated Google Cloud account has project `project-3088d647-88fc-4c46-a82`. Compute Engine is not enabled. Cloud Billing API is not enabled, so billing readiness has not been established. No services were enabled and no VM or billable backend resource was created during this checkpoint.

Proposed dedicated resource: `renewal-studio-backend`, region `us-west1`, initially `e2-small` (2 GiB RAM, shared vCPU), persistent 50 GiB disk, one worker, restricted HTTPS origin, and private backups. Confirm render memory/latency before scaling. The machine price shown in Google's current pricing table is approximately $0.016752855/hour, about $12.23 for 730 hours; disk, IPv4, backups and network add charges. Budget roughly **$20–30/month for a light prototype**, not a price guarantee or spending cap. Higher media traffic or a larger render machine costs more. Resource creation/billing authorization is still required.

Source: [Google general-purpose VM pricing](https://cloud.google.com/products/compute/pricing/general-purpose). Pricing depends on region and selected resources.

## Implementation required before deploying the app

1. Confirm permission for the dedicated backend charges and actual project billing availability; provision a separate resource, never reuse another app's database.
2. Add a tested hosted mode with genuine accounts, secure cookies, explicit allowed origins and login throttling. Keep development identity endpoints unavailable in hosted mode. Seed only a one-time initial owner setup; never carry local session cookies into hosting.
3. Containerize API/worker with Node 24, FFmpeg/ffprobe, Poppler and permitted fallback fonts. Run on durable private disk; configure restart, graceful shutdown, worker recovery, health checks and backups.
4. Protect backend origin access independently of the Vercel UI using authenticated server-to-server requests and verified TLS. Protect private media routes and never expose the storage directory as a static public root.
5. Configure the Vercel gateway without browser-visible credentials. Keep large media functional: authenticated streamed/range downloads and a bounded chunk/direct upload protocol, rather than forwarding 100 MB uploads into a Function with a 4.5 MB request limit.
6. Transfer a consistent copy of current campaign/media data privately, verifying checksums and stripping local sessions/development access. The Git repository contains no runtime backup.
7. Deploy the complete app only after backend health/persistence/auth are verified. Check anonymous denial on every Vercel deployment URL, direct-origin denial, company isolation, sign-in, actual create/edit/render/download, persistence after restart and restored backups.
8. Update handoff.md with the final source revision, protected app URL, exact verification evidence and remaining integration blockers.

Vercel references: [runtime filesystem limits](https://vercel.com/docs/functions/runtimes), [payload limits and streaming guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions), [Vercel Authentication configuration](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

## Do not do

Do not weaken production guards to ship the development account picker. Do not store the working database in ephemeral function scratch space. Do not call a login page with a missing backend a working deployment. Do not deploy public first and add privacy later. Do not upload `.runtime`, secrets, private backups or account tokens into Git. Do not silently enable a new paid hosting plan or use another project's live resources.
