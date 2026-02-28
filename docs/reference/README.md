# Hemingway Reference Docs

This folder is the agent-facing reference for `hemingway-ai`.

Use this map first:

- Start at `architecture.md` for end-to-end flow.
- Use `server-runtime.md` for API routes, prompt construction, config precedence, and source writeback behavior.
- Use `browser-overlay.md` for selection UX, multi-select flows, inline editing, and popup/indicator behavior.
- Use `copy-intelligence.md` for briefing logic and reference material used in generation.
- Use `operations-and-packaging.md` for CLI behavior, build outputs, exports, and local debugging.

## What This Project Is

Hemingway is a dev-time copy editing tool for marketing sites:

- Browser overlay discovers text elements and lets users request AI alternatives.
- A local Node server calls Anthropic and returns structured alternatives.
- Accepted copy can be written back into source files using text and context matching heuristics.
- User picks are saved as lightweight style preferences and injected into future prompts.

## Fast Orientation For Agents

1. Runtime starts from `bin/hemingway.mjs`, which launches `dist/server/index.js`.
2. `/client.js` serves the browser overlay bundle (`overlay.iife.js`) to any local site.
3. The overlay collects element/page context and calls `/generate` or `/generate-multi`.
4. Chosen copy is applied in-page immediately, then persisted via `/write`.
5. Preference labels are recorded via `/preferences` and influence later generations.

## Key Constraints

- Intended for development usage; production use is explicitly warned in server startup logs.
- Writeback is heuristic-based (best-match scoring), not AST-aware.
- Overlay only discovers and binds a curated set of text-bearing tags.
- Multi-element generation expects at least 2 selected elements and max client-side selection of 5.

## Known Product Sharp Edges

- Shortcut defaults are inconsistent across code/docs:
  - Server config default: `ctrl+shift+h`
  - README example: `meta+shift+c`
  - CLI `init` template: `meta+shift+c`
- `referenceGuide` default points to `./packages/hemingway/reference/...`, but this repo currently uses `./reference/...`.

If you change either, update `src/server/config.ts`, `README.md`, and `bin/hemingway.mjs` template together.
