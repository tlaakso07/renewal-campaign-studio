# Private Vercel review for Ryan

Delivered September 16, 2026. The working prototype is hosted at
https://renewal-campaign-studio-tlaakso11-3399s-projects.vercel.app.
The plain URL requires Vercel access. Ryan's 30-day share link and app password
are in ignored `.runtime/Ryan-review-email.txt` and `.runtime/Ryan-review-access.md`.
Do not commit, log, publish, or put these credentials in product documentation.

## September 17 workspace design release

Published commit `35e1a79` in deployment
`dpl_AUKMRHxe9p8f3WermRrZEt14zUZe` to the same protected production alias.
The approved Renewal design now extends across the workspace; details and
browser evidence are in [WORKSPACE-DESIGN.md](WORKSPACE-DESIGN.md).

Build and all 20 tests pass. Fresh hosted verification confirmed existing share
link/password access, unauthenticated API denial, the restricted creator role,
and disabled local authentication. Every built JS/CSS file, including the lazy
workspace page bundle, matches its local checksum. All four provider logos match
provenance checksums. The stored campaign and six creatives remain present.
No database initialization, data migration or provider activation occurred.
The known secondary Vercel TS2688 warnings repeated; the primary TypeScript/Vite
build passed and the deployment is READY.

## September 17 Home and sidebar release

Published code commit `7936a41` to the existing production alias in deployment
`dpl_BjyFC1bR6Y7v2QQCDuLkhX3TqsNS`. Includes the Renewal-green glass sidebar,
redesigned Home, six featured model cards with official local logo assets,
reporting filter corrections and discussion-thread improvements. Existing cloud
state was retained; no initialization or database migration was performed.

Production build and all **20 tests passed** (HTTP tests run with local network
access). Fresh HTTP verification confirmed Ryan's original share link reaches
the password gate, the original password opens the app, and unauthenticated API
access remains denied. Deployed JS/CSS hashes match the local release build; all
four provider artwork files match recorded checksums. Bootstrap retains one
campaign and six creatives, the restricted review creator identity, six featured
models and zero enabled generation models. Local authentication remains 404.
The new deployment's runtime error scan returned zero error rows after verification.
Desktop/mobile UI checks were performed locally; release verification on the
hosted alias used HTTP. Vercel's secondary transpilation repeated its known
TS2688 type-path warnings; the main TypeScript/Vite build and hosted checks passed.

## Delivered

- Protected Vercel project `renewal-campaign-studio`, Node 24, one Node function
  containing the Express API and the built React app. Deployment protection remains
  `all`; the share link grants access to this review, not Vercel team administration.
- A separate password gate protects HTML, scripts, APIs and downloads. Signed
  cookies are Secure, HttpOnly and SameSite=Strict with an eight-hour lifetime.
  Hosted mode has one explicit creator identity with no operator/owner access.
  Development account picking and invited local account endpoints are disabled.
- The existing project-specific **private** Blob store retains the database
  snapshot and checksum-addressed media. `/tmp` is only a reconstructible working
  copy. Mutations are acknowledged after a conditional durable write. A competing
  write receives 409 rather than overwriting newer state. Reads bypass the Blob
  cache and request identity encoding to retain strong ETags.
- The isolated review copy starts with one Renewal campaign, six editable
  documents, seven imported originals and six prior renders (33 file references
  including previews and output companions). Test-company data, local accounts,
  sessions, private conversations, reports and audit history are not transferred.
  SQLite compaction removes deleted account/session pages. The original local
  workspace remains independent.
- Static and source-footage video rendering run with Sharp, bundled FFmpeg/ffprobe,
  and licensed Lato fallback text. The original Renewal font is still not approved
  as a hosted rendering/web font. Official source logo artwork is preserved.
- Persistent render claims and results use conditional writes. `waitUntil` runs a
  job after a queue request or jobs polling; stale claims can recover after 15
  minutes. A function is limited to 800 seconds. Outputs are stored privately
  before a ready result is published. Two fresh verification outputs bring the
  hosted review to eight ready renders; the original local copy still has six.

## Evidence

- `npm run check`: TypeScript/Vite build and **19 tests passed**, including local
  HTTP authorization, production guard, review password/session boundaries,
  cold snapshot restoration, checksum rejection and concurrent-write conflicts.
- Real Blob transport: a large JSON read retains the strong object ETag; a
  conditional update succeeds and a stale writer is rejected without data loss.
- Deployed access: plain URL redirects to Vercel authentication; fresh share-link
  entry reaches only the password screen; the app API rejects access without its
  password cookie. Hosted local-login route returns 404; operator route returns 403.
- Hosted campaign edit was read back from an independently downloaded cloud
  database snapshot. Stale revision was rejected; the original campaign name was
  restored. No changes were made to the original local campaign.
- All six initial PNG/MP4 downloads matched stored checksums. ZIP passed integrity
  validation with six included outputs and no exclusions. Existing videos verified
  as 1080 square H.264/AAC, approximately 15 and 30 seconds.
- A new static render and a new 15-second real-footage MP4 completed on Vercel and
  downloaded with matching checksums. Duplicate submission reused the same job ID.
- Live deployment: `dpl_53xBeX66bKRzPKmhXNVcUrVQcdpJ`, hosting code commit `7c961dd`.
  Vercel's secondary function transpilation emitted TS2688 type-path warnings;
  the main TypeScript build passed and the deployed API/render paths were verified.

## Operation and recovery

### September 16 browser login correction

The initial HTTP login verification supplied an explicit Origin header and missed
the native browser form behavior: `Referrer-Policy: no-referrer` suppresses the
Origin on form POSTs, so the password gate rejected correct passwords with
`Origin denied`. The gate now serves `same-origin`, preserving the browser's
same-origin form identity while omitting referrers to other sites. The exact
Origin check, password gate, private sessions and Vercel protection remain in
place. Regression coverage checks the page policy and rejects missing, null and
foreign origins even if a request claims `Sec-Fetch-Site: same-origin`.

The earlier share-link/password HTTP evidence was not evidence of browser login.
After deploying the correction, the real Chrome password form successfully
redirected to the loaded Home screen as `Ryan · Private review`, with the expected
campaign and navigation. The original share link and password were retained.
Fresh-session HTTP checks also passed: bootstrap 200, one campaign, six creatives,
eight ready renders, local login 404 and operator access 403. Build and all 19
tests passed (HTTP tests require local network binding outside the sandbox).
Correction deployment: `dpl_9kgcL7HZWXs2fsc1fMRBNT9qwzg5`, code commit `c0d6908`.
Deploy with explicit `--scope tlaakso11-3399s-projects`; the unscoped deploy was
rejected even though the CLI was signed in to the correct account.

Use Vercel CLI 59.19.0 or newer. The machine's global CLI is 56.1.0; upgrade it with
`npm i -g vercel@latest`. This release used 59.19.0 without replacing global tools.
The project is linked in ignored `.vercel/project.json`. Deploy with
`vercel deploy --prod`; preserve deployment protection. The release commit uses
the existing signed-in Vercel account's verified email, avoiding the previous
commit-author/team mismatch. Never falsify another person's author identity.

Environment names are in `.env.hosted-review.example`. Keep actual values in
Vercel and ignored, owner-readable local files. Never copy the development `.env`
to Vercel. `scripts/prepare-review.ts <source> <new-destination> --upload` creates
and uploads an isolated review, refusing an existing destination or cloud state.
It needs private Blob credentials in its process environment. It is initialization,
not a synchronization command. Later local edits do not appear online automatically.

Preserve a private copy of `review/state-v1.json` plus all referenced immutable
objects before any future state migration. Code redeploys retain the same cloud
state. Restore into a new state key, verify the database and file checksums, then
change `REVIEW_STATE_KEY` and redeploy. Local snapshot restoration is tested;
a scheduled off-site cloud backup/restore drill remains outstanding.

Revoke Ryan's share link using Vercel's deployment sharing controls. Rotate
`REVIEW_PASSWORD_HASH` and `REVIEW_COOKIE_SECRET`, then redeploy, to revoke the
app password and existing app sessions. The private share link expires after 30
days (October 16, 2026); never publish it in GitHub or a public document.

## Remaining / next

This is an editable private prototype for review, not a customer launch. A shared
review creator is not individual production identity. Whole-database snapshots,
per-instance login throttling, function time limits and demand-triggered job
processing are appropriate only for this small review. A busy function serializes
requests while rendering. Long unattended queues, distributed throttling, durable
scene-cache recovery, extensive hosted concurrency/load tests, hosted parser tools,
per-user recovery, billing and operational backups remain release work.

AI reasoning/generation, generated presenters/voices, Meta and billing are still
unconnected. Reporting is empty until real reports are imported. Not all source
files are imported. New UI flows still need the broader browser/accessibility
walkthrough recorded in the acceptance matrix; API verification is not a full
visual walkthrough. Next: collect Ryan's feedback on this review, then continue
the complete product work in `BUILD-EXECUTION.md` and the acceptance matrix.
