# Verification — September 16, 2026

## Latest additions

- `npm run build`: TypeScript and Vite pass after discovery, measurement and storyboard additions.
- `npm test`: **16 passed, 0 failed**, with temporary isolated databases and a local HTTP test server.
- Added checks: shared composition metadata excludes source asset/campaign IDs; personal bookmarks remain invisible to colleagues and other companies; private remixes use destination media/terms; failed remix validation rolls back creation; campaign exports preserve exact offer versions and exclude canceled jobs; report column discovery rejects duplicate headers; unavailable video/leads measures remain unavailable; CRM repeated job IDs cannot multiply revenue and conflicting values are excluded; report/review endpoints enforce company scope; script/shot edits preserve unrelated layers/scenes.
- New UI routes compile; full browser interaction testing of these additions remains outstanding. No new live provider, Meta, billing or forecast evidence was obtained.
- A first new test exposed an incorrect media-type property in remix validation; it was corrected to the stored asset `kind`. The sandbox prevented the HTTP test server from being reached; the permitted loopback test run passed. A test-only TypeScript nullability assertion was corrected before the final successful build.

The earlier evidence below remains historical and does not imply browser coverage of the new screens.

---

## Earlier verification — September 15, 2026

Final stabilization pass completed approximately 23:29 PDT.

## Current automated checks

- `npm run build`: TypeScript check and Vite production bundle pass.
- `npm test`: **13 tests passed, 0 failed**. Tests run against temporary databases, not the user's Renewal data.
- Tests exercise 424-source seeding, malformed/traversal/immutable uploads, company boundaries, immutable offer/edit versions, render output dimensions and exact terms, idempotency/usage, local assistant scope/instruction boundaries, weighted CSV results and duplicate imports, mapping corrections, community/publication privacy, revoked workers, persistence after reopening, partial-scene recovery, HTTP auth/invite replay/revocation, production-mode denial and operator/theme/draft-lesson boundaries.
- Backup/restore test invokes the actual CLI scripts, restores into a new directory, checks SQLite integrity and document revision, compares original/output media byte-for-byte, and verifies refusal to overwrite an existing destination.

The initial final-test run found an outdated private-lesson fixture without an explicit published state. The fixture now supplies that state; additional checks assert that draft lessons remain inaccessible. Production permission checks were not weakened.

## Saved Renewal data checked read-only

- All **7 imported original SHA-256 checksums** match their files.
- All **6 completed render checksums** match their files.
- SQLite `integrity_check`: **ok**.
- MP4 inspection: **15.021333 s** and **30.021333 s**, both **1080×1080 H.264 video + AAC audio**. The sample scenes mute source audio; an AAC stream is not evidence of recorded narration.
- App health endpoint responds in explicit development mode; worker heartbeat is present and current.

## Browser evidence from this implementation session

Campaign creation → source-photo selection → editable static → render → actual PNG preview/download was exercised. PNG preview reported 1080×1350. An edited headline autosaved and survived page reload. The 30-second MP4 played with no media error. An actual ZIP download passed archive integrity and contained matching media/copy/manifests plus captions.

Assets, Brand, Models, Insights, Feed, Classroom, Settings, Shared and Templates routes loaded in the browser. At 390 px viewport width, Home had no horizontal overflow. These checks do not constitute a full accessibility audit or testing every control on every screen. Browser captures/downloads are private ignored artifacts, not production UI implementations.

## Limits

There is no genuine AI-provider, presenter, Meta or billing integration evidence. No actual client performance report was supplied. No generated-presenter example or playable instructional recording has been demonstrated. Full original-file intake and hosted release readiness remain open. The full A01–A23 acceptance matrix is not passed.
