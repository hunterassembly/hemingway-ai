# Vite React Setup

Use this guide for React apps created with Vite.

Vite currently uses standalone Hemingway mode (two local processes).
If you need setup comparison, see [Integration Modes](./integration-modes.md).

## Install And Start Hemingway

```sh
npm install hemingway-ai
npx hemingway-ai init
npx hemingway-ai
```

Run Vite in a separate terminal:

```sh
npm run dev
```

## Add Hemingway In `main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Hemingway } from "hemingway-ai/react";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    {import.meta.env.DEV ? <Hemingway /> : null}
  </React.StrictMode>
);
```

## Recommended Config

```js
/** @type {import("hemingway-ai").HemingwayConfig} */
export default {
  sourcePatterns: ["src/**/*.{tsx,jsx,ts,js}", "components/**/*.{tsx,jsx,ts,js}"],
  excludePatterns: ["node_modules", "dist", "build"],
  writeAdapter: "react",
};
```

## Validate

1. Open your Vite dev URL.
2. Press `Cmd/Ctrl + Shift + H`.
3. Select copy and apply an alternative.
