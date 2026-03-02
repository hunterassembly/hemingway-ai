# Quickstart

Get Hemingway running on a local site in about 5 minutes.

## 1. Install

```sh
npm install hemingway-ai
```

## 2. Create Config

```sh
npx hemingway-ai init
```

This creates `hemingway.config.mjs` in your project root.

## 3. Set API Key

```sh
export ANTHROPIC_API_KEY=sk-ant-...
```

## 4. Start Hemingway Server

```sh
npx hemingway-ai
```

Server should start on `http://localhost:4800` by default.

If you are in Next.js and using route handlers from `hemingway-ai/next`, you can skip this step and run only `npm run dev`.

## 5. Add Hemingway To Your App

Use one of these:

- Script tag:
```html
<script src="http://localhost:4800/client.js"></script>
```
- React component:
```tsx
import { Hemingway } from "hemingway-ai/react";

export function AppShell() {
  return (
    <>
      <YourApp />
      <Hemingway />
    </>
  );
}
```

## 6. Activate Overlay

Press `Cmd/Ctrl + Shift + H` on your dev site.

## 7. Verify It Works

1. Hover over text to see selectable outlines.
2. Click text and generate alternatives.
3. Apply one and confirm source file writeback.

If something fails, see [Troubleshooting](../troubleshooting.md).
