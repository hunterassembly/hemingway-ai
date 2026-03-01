# Next.js Setup

Use this guide for Next.js App Router or Pages Router projects.

## Install And Start

```sh
npm install hemingway-ai
npx hemingway-ai init
npx hemingway-ai
```

## App Router (`app/`)

Add Hemingway in your root layout in development:

```tsx
import { Hemingway } from "hemingway-ai/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV !== "production" ? <Hemingway /> : null}
      </body>
    </html>
  );
}
```

## Pages Router (`pages/`)

Add Hemingway in `_app.tsx`:

```tsx
import type { AppProps } from "next/app";
import { Hemingway } from "hemingway-ai/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      {process.env.NODE_ENV !== "production" ? <Hemingway /> : null}
    </>
  );
}
```

## Recommended Config

```js
/** @type {import("hemingway-ai").HemingwayConfig} */
export default {
  sourcePatterns: ["app/**/*.{tsx,jsx,ts,js}", "pages/**/*.{tsx,jsx,ts,js}", "components/**/*.{tsx,jsx,ts,js}"],
  excludePatterns: ["node_modules", ".next", "dist", "build"],
  writeAdapter: "react",
};
```

## Validate

1. Open your local Next.js site.
2. Press `Cmd/Ctrl + Shift + H`.
3. Click a heading or paragraph and generate alternatives.

