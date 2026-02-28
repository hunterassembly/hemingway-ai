# AGENTS.md

This file is the operating guide for coding agents working in `hemingway-ai`.

## Project Purpose

Hemingway is a local development copy-editing companion for marketing sites:

- Browser overlay discovers page text and requests AI alternatives.
- Local Node server generates alternatives via Anthropic.
- Accepted copy can be written back to source files.

## Start Here

Read these docs first:

1. `docs/reference/README.md`
2. `docs/reference/architecture.md`
3. `docs/reference/server-runtime.md`
4. `docs/reference/browser-overlay.md`

Use `docs/reference/.mapping.yaml` to jump from a folder to the right reference doc.

## Core Runtime Map

- CLI entrypoint: `bin/hemingway.mjs`
- Server runtime: `src/server/*`
- Browser overlay runtime: `src/client/*`
- React wrapper: `src/react.tsx`
- Copy reference corpus: `reference/saas-and-services-copy-guide.md`

## Common Commands

- Build: `npm run build`
- Dev/watch: `npm run dev`
- Start CLI: `npx hemingway-ai`
- Init config: `npx hemingway-ai init`

## Safe Change Workflow

1. Identify target layer (server/client/packaging) before editing.
2. Prefer minimal, localized changes.
3. Keep API contracts stable unless intentionally versioning behavior.
4. Update docs in `docs/reference/` when behavior changes.
5. If changing defaults, keep these in sync:
   - `src/server/config.ts`
   - `bin/hemingway.mjs` init template
   - `README.md`

## Code Guidelines For This Repo

- Preserve TypeScript ESM style used across the repo.
- Avoid introducing new dependencies unless clearly justified.
- Keep overlay interactions non-destructive and reversible where possible.
- Maintain clear error messages for failed generate/write operations.

## Known Sharp Edges

- Shortcut defaults are currently inconsistent across files/docs.
- `referenceGuide` default path in server config may not match every installation layout.
- Writeback is heuristic (text/context matching), not AST-aware.

Do not "silently fix" these by changing one file only; update all relevant docs/config surfaces together.

## When You Add Features

Include:

- Updated reference docs in `docs/reference/*`
- Any new route contract details
- Any new config keys and where they can be changed (server + client UI)

## Out of Scope For Agents

- Running Hemingway in production as a primary editing system.
- Large refactors that merge server and client layers without explicit request.
