# Next.js Setup

Use this guide for Next.js App Router or Pages Router projects.
For mode comparison, see [Integration Modes](./integration-modes.md).

## Install

```sh
npm install hemingway-ai
npx hemingway-ai init
```

## Option A: One-Process Mode (Recommended)

Run only your Next app dev server:

```sh
npm run dev
```

Create a catch-all route handler:

`app/api/hemingway/[...path]/route.ts`

```ts
import { createNextRouteHandlers } from "hemingway-ai/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createNextRouteHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
export const OPTIONS = handlers.OPTIONS;
```

Config note:

- Keep `hemingway.config.mjs` as a plain `export default { ... }` object for best compatibility in bundled Next route execution.
- If you need dynamic/imported config values, mirror them in `package.json` under `hemingway`.

Mount Hemingway in your app layout and point it at the same-origin endpoint:

```tsx
import { Hemingway } from "hemingway-ai/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV !== "production" ? <Hemingway endpoint="/api/hemingway" /> : null}
      </body>
    </html>
  );
}
```

This mode removes the separate `npx hemingway-ai` process.

## Option B: Standalone Mode (Works Everywhere)

If you prefer the old approach, run the companion server separately:

```sh
npx hemingway-ai
```

Then mount:

```tsx
import { Hemingway } from "hemingway-ai/react";

<Hemingway port={4800} />
```

## Recommended Config

```js
/** @type {import("hemingway-ai").HemingwayConfig} */
export default {
  sourcePatterns: [
    "app/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "pages/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "components/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "content/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "site/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
  ],
  excludePatterns: ["node_modules", ".next", "dist", "build"],
  writeAdapter: "react",
};
```

## Validate

1. Open your local Next.js site.
2. Press `Cmd/Ctrl + Shift + H`.
3. Click a heading or paragraph and generate alternatives.
