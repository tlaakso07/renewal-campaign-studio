# Session tool audit — 2026-09-15

Checked startup warnings in the local Codex log database, effective `codex mcp list --json`, plugin manifests, executable paths, installed skill directories, and actual read-only MCP calls. No credential values were needed or included.

## Three startup failures

| MCP | Evidence | Resolution |
|---|---|---|
| Adobe for creativity | Startup rejected spaces in server name; required `^[a-zA-Z0-9_:@/.-]+$` | Renamed cached plugin MCP key to `adobe-creativity`, preserved endpoint and `.mcp.json.before-name-fix-20260915` backup. Effective CLI configuration now recognizes it. Unauthenticated endpoint probe returns HTTP 403; tools are not yet callable in this turn. Reconnect/authorize Adobe and refresh session. Plugin updates may overwrite the local compatibility patch. |
| meta-ads | Initialization returned Auth required from mcp.facebook.com | Configuration endpoint exists. Account OAuth is required; not fixable by a timeout or an invented token. `codex mcp login meta-ads` initiates the supported user authorization flow. The app still needs its own read-only Meta integration. |
| vercel | Initialization returned invalid_token / No authorization provided | Plugin endpoint exists. `codex mcp login vercel` initiates user OAuth. Local development does not require deployment access. |

Chrome DevTools also emitted a plugin-cache refresh warning: upstream plugin manifest name `chrome-devtools` differs from marketplace name `chrome-devtools-mcp`. Installed cached manifest already uses the expected name and its MCP successfully responds. Do not replace a working cache with the mismatched upstream refresh. This upstream packaging discrepancy remains; no credential repair is relevant.

Other warnings: skill icon paths outside plugin assets are ignored; an unrelated ngs-analysis default prompt exceeds 128 characters. These affect metadata, not the application build. Codex CLI PATH-alias creation is denied inside the sandbox; installed executables are still callable by their existing paths.

## Actual call evidence

| Capability | Probe | Result |
|---|---|---|
| Chrome DevTools | list_pages | Responded; browser page available |
| Playwright | browser_tabs list | Responded; browser page available |
| Node REPL | evaluate 2+2 | Returned 4 |
| GitHub | get_me | Authenticated response |
| Firecrawl | scrape example.com | HTTP 200 content returned |
| Figma | whoami | Authenticated; Starter / View seat, feature limits still apply |
| Canva | list_brand_kits | Successful response; empty brand-kit list |
| Higgsfield | models_search Seedance | Successful model catalog response; no generation performed |
| Runway | whoami | Authenticated; image models available, no video models on connected Free workspace |
| Web, shell, file inspection | used during build/audit | Working |

Tool registry contained 372 exposed tool definitions: 29 Chrome DevTools, 230 app connector tools, 27 Firecrawl, 44 GitHub, 3 Node REPL, 26 Playwright, 13 built-ins. Exposure is not proof each operation is permitted. Only the probes above were exercised. No paid media generation or external publishing was tested. App connector tools include additional document and media capabilities; untested actions are not claimed working. Enabled plugin configuration alone does not establish a callable Google Drive, Slack, Gmail, or deployment tool.

## CLI and skills

Located: codex, claude, node, npm/npx, Python, uv/uvx, git, gh, ffmpeg/ffprobe, pdftoppm, Supabase, Vercel, gcloud, curl and rg. Docker and Ghostscript are absent; neither blocks the selected local stack. Node 22.22.3, npm 10.9.8 and Python 3.14.6 ran. Dependency installation and native SQLite migration/seed ran. Account access for each CLI is separate and has not been inferred from executable presence.

Discovered 604 SKILL.md files under ~/.agents/skills, 50 under ~/.codex/skills and 214 in the plugin cache (raw file counts, may contain duplicates). The injected skill list is not exhaustive. Read OpenAI Docs, Chrome DevTools troubleshooting, installed frontend-design, and webapp-testing as relevant. Further skills should be loaded from their installed source when a specific task calls for them, not by dumping all skill content into context.

Official MCP configuration reference: https://learn.chatgpt.com/docs/extend/mcp?surface=cli . Session MCP authorization does not provide a permanent backend API credential for Renewal.
