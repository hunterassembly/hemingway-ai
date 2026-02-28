# System Architecture

## Purpose

`hemingway-ai` is a local dev companion that lets users rewrite live page copy and optionally persist edits to source files.

Primary design choice: keep integration friction near zero by using a script-injected browser overlay and a simple local HTTP server.

## Major Components

- `src/server/*`
  - Config loading, route handling, prompt construction, Anthropic call, source writeback, preference persistence.
- `src/client/*`
  - DOM discovery, interaction model (single/multi select + inline edit), popup and settings UI, API calls to server.
- `src/react.tsx`
  - Thin React wrapper that injects/removes `http://localhost:{port}/client.js`.
- `bin/hemingway.mjs`
  - CLI entrypoint (`init`, `--help`, and server start).

## Runtime Lifecycle

1. User runs `npx hemingway-ai`.
2. CLI loads `dist/server/index.js` and calls `startServer()`.
3. Server exposes API routes and `/client.js`.
4. User injects client via script tag or `<Hemingway />`.
5. Overlay toggles with keyboard shortcut, discovers editable text nodes, and opens popup on selection.
6. Overlay sends context-rich generation requests to server.
7. User applies an option (or custom text); overlay updates DOM and calls `/write`.
8. Server finds best source match and rewrites file contents.

## Request/Response Topology

- Generation:
  - Client `POST /generate` or `POST /generate-multi`
  - Server loads style docs + user preferences + contextual briefing
  - Server calls Anthropic Messages API
  - Server parses strict JSON alternatives and returns them
- Persistence:
  - Client `POST /write` with `oldText`, `newText`, and tag/class/parent context
  - Server scans configured source patterns, scores candidates, writes best match
- Preference loop:
  - Client `POST /preferences` with chosen label
  - Server stores counts in `.hemingway/preferences.json`
  - Top labels are included in future prompt system blocks

## Module Boundaries

- Server owns:
  - Configuration precedence
  - Prompt assembly and model calls
  - File-system mutation
  - Preferences and API contracts
- Client owns:
  - DOM element discovery and contextual extraction
  - Interaction model and user-visible states
  - Undo behavior and optimistic UI updates

## Safety and Guardrails

- CORS is open (`*`) for local development convenience.
- Missing API key fails generate requests with explicit errors.
- Writeback validates required fields and returns 404-style failures when text cannot be found.
- Overlay blocks navigation clicks while active to avoid accidental page navigation during editing.

## Build and Distribution Model

- Built with `tsup` into:
  - `dist/server/index.js` (Node ESM)
  - `dist/client/overlay.iife.js` + ESM output
  - `dist/react.js`
- `package.json` exports:
  - `hemingway-ai` (server module exports)
  - `hemingway-ai/react` (React injector component)
  - `hemingway-ai/client` (client overlay module)
