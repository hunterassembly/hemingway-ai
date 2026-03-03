# Operations and Packaging Reference

Primary files:

- `bin/hemingway.mjs`
- `tsup.config.ts`
- `package.json`
- `src/react.tsx`
- `src/next.ts`

## CLI Behavior (`bin/hemingway.mjs`)

Supported commands:

- `npx hemingway-ai`
  - Starts server from `dist/server/index.js`
- `npx hemingway-ai init`
  - Writes `hemingway.config.mjs` template in current project
- `npx hemingway-ai --help`
  - Prints setup and usage instructions
- `npx hemingway-ai --port <n>`
  - Runtime override for server port

`init` is non-destructive: if config file exists, it exits with warning.

## Build Outputs (`tsup.config.ts`)

Four bundles are produced:

1. Server bundle
  - Entry: `src/server/index.ts`
  - Output: `dist/server/index.js`
  - Format/platform: ESM, Node 20 target
2. Client bundle
  - Entry: `src/client/overlay.ts`
  - Output: `dist/client/overlay.js` and `dist/client/overlay.iife.js`
  - IIFE is what `/client.js` serves
3. React wrapper
  - Entry: `src/react.tsx`
  - Output: `dist/react.js`
  - `react` marked external
4. Next.js adapter
  - Entry: `src/next.ts`
  - Output: `dist/next.js`
  - Exposes route handlers for same-process mode (`/api/hemingway/*`)

## Package Exports

From `package.json`:

- `hemingway-ai` -> `dist/server/index.js`
- `hemingway-ai/react` -> `dist/react.js`
- `hemingway-ai/client` -> `dist/client/overlay.js`
- `hemingway-ai/next` -> `dist/next.js`

CLI binary:

- `hemingway-ai` -> `bin/hemingway.mjs`

## Development Workflow

- `npm run build`
  - Full tsup build
- `npm run dev`
  - Watch mode; server bundle `onSuccess` auto-runs `node dist/server/index.js`

Typical local setup:

1. Run Hemingway server.
2. Run target app dev server.
3. Inject script or React component.
4. Use shortcut to activate.
5. Use notepad shortcut for page-wide markdown editing.

Recommended config for cross-React projects:

- Broader `sourcePatterns` covering `components/`, `src/`, `app/`, `pages/`, `content/`, `site/`, and `packages/`
- `writeAdapter: "react"` for JSX/TSX-focused scoring and filtering
- Optional `writeAdapter: "generic"` for non-React fallback behavior

## Integration Modes

- Next.js one-process mode:
  - Mount `createNextRouteHandlers()` under `app/api/hemingway/[...path]/route.ts`
  - Use `<Hemingway endpoint="/api/hemingway" />`
- Framework-agnostic script tag:
  - `<script src="http://localhost:4800/client.js"></script>`
- React standalone:
  - `<Hemingway port={4800} />`
  - Component is no-op in SSR/production and cleans up on unmount.

## Operational Troubleshooting

- `/client.js` 404
  - Build output missing; run `npm run build`.
- Generate route errors with API messages
  - Missing/invalid `ANTHROPIC_API_KEY` or model/API issue.
- Write route returns "Text not found"
  - Source patterns too narrow, text changed post-selection, ambiguous source content, or non-contiguous source strings.
- Shortcut not matching user expectation
  - Check configured shortcuts (`shortcut`, `notepadShortcut`) and platform modifier semantics in `overlay.ts`.

## Consistency Checklist For Maintainers

When changing defaults, update all three:

1. `src/server/config.ts` defaults
2. `bin/hemingway.mjs` init template
3. Root `README.md` examples

This prevents drift in user-facing setup behavior.
