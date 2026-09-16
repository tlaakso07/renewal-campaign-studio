# Private Vercel review for Ryan

Delivered September 16, 2026. The working prototype is hosted at
https://renewal-campaign-studio-tlaakso11-3399s-projects.vercel.app.
The plain URL requires Vercel access. Ryan's 30-day share link and app password
are in ignored `.runtime/Ryan-review-email.txt` and `.runtime/Ryan-review-access.md`.
Do not commit, log, publish, or put these credentials in product documentation.

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
