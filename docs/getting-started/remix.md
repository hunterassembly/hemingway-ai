# Remix Setup

Use this guide for Remix applications.

## Install And Start Hemingway

```sh
npm install hemingway-ai
npx hemingway-ai init
npx hemingway-ai
```

Run Remix in another terminal:

```sh
npm run dev
```

## Add Hemingway To `app/root.tsx`

```tsx
import { Hemingway } from "hemingway-ai/react";

export default function App() {
  return (
    <html lang="en">
      <head />
      <body>
        <Outlet />
        {process.env.NODE_ENV !== "production" ? <Hemingway /> : null}
        <Scripts />
      </body>
    </html>
  );
}
```

## Recommended Config

```js
/** @type {import("hemingway-ai").HemingwayConfig} */
export default {
  sourcePatterns: ["app/**/*.{tsx,jsx,ts,js}", "components/**/*.{tsx,jsx,ts,js}"],
  excludePatterns: ["node_modules", "build", "public/build", "dist"],
  writeAdapter: "react",
};
```

## Validate

1. Open your Remix dev site.
2. Press `Cmd/Ctrl + Shift + H`.
3. Generate and apply an alternative on visible copy.

