# Integration Modes

Hemingway supports two practical integration modes today.

## 1) One-Process Mode (Next.js App Router)

Use this when your app is Next.js and you want the simplest local workflow.

- Run only `npm run dev`.
- Mount Hemingway route handlers under `/api/hemingway/*`.
- Mount `<Hemingway endpoint="/api/hemingway" />`.

Why this is easiest:

- One dev process to manage.
- Same-origin requests (fewer CORS/network surprises).
- Overlay and app lifecycle stay in one runtime.

See full setup: [Next.js Setup](./nextjs.md)

## 2) Standalone Companion Server (Any Framework)

Use this for Vite, Remix, non-React stacks, and any setup not using the Next adapter.

- Run `npx hemingway-ai` in one terminal.
- Run your app dev server in another terminal.
- Inject `http://localhost:4800/client.js` (script tag) or mount `<Hemingway port={4800} />`.

Why this mode exists:

- Works across frameworks without custom server adapters.
- Keeps Hemingway runtime independent from framework internals.

See setup guides:

- [Vite React](./vite-react.md)
- [Remix](./remix.md)
- [Script Tag](./script-tag.md)

## Choosing Quickly

- If you are on Next.js App Router, choose one-process mode.
- For everything else, use standalone mode.
