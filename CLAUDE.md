@AGENTS.md

# Claude Code notes

- Start the app: `npm run dev` (server + worker on http://127.0.0.1:8787, explicit local development identity).
- Tests: `npm test` (node:test, `tests/*.test.ts`). Typecheck: `npx tsc --noEmit -p .`. Build: `npm run build`.
- Video brief work: use the `video-brief` skill (write, audit, score). The standard is `product/VIDEO-BRIEF-STANDARD.md`; the gold examples are in `research/growthub-production-brief/`.
- `main` on GitHub tracks `static-ai-generator`; pushing does not deploy (manual `vercel deploy --prod`, see `docs/RYAN-STATIC-RELEASE-PLAN.md`).
