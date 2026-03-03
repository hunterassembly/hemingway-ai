# Hemingway

AI-powered copy editing overlay for marketing sites. Hemingway discovers text elements on your page and generates alternative copy using Claude, with one-click replacement.

## Quick Start

### 1. Install

```sh
npm install hemingway-ai
```

### 2. Create a config

```sh
npx hemingway-ai init
```

This creates `hemingway.config.mjs` in your project root.

### 3. Set your API key

```sh
export ANTHROPIC_API_KEY=sk-ant-...
```

Or paste it in Hemingway settings (bottom-left pill) and click Save.
It will be stored locally in `.hemingway.local.json` (gitignored).

### 4. Start the server

```sh
npx hemingway-ai
```

For Next.js, you can skip this extra process by using the same-app route adapter.

Note: Hemingway reads `process.env` directly and does not auto-load `.env` files on its own.

Quick mode selection:

- Next.js App Router: use one-process mode (`hemingway-ai/next` + `<Hemingway endpoint="/api/hemingway" />`)
- Everything else: use standalone mode (`npx hemingway-ai` + script tag or `<Hemingway />`)

### 5. Add the client to your site

**Script tag** (any framework):

```html
<script src="http://localhost:4800/client.js"></script>
```

**React component**:

```jsx
import { Hemingway } from 'hemingway-ai/react'

// Add inside your app (dev mode only)
<Hemingway />
```

By default, the React wrapper tries same-app mode at `/api/hemingway` first, then falls back to `http://localhost:4800`.

**React component (Next.js same-process mode):**

```jsx
import { Hemingway } from "hemingway-ai/react";

// Use Next route handlers under /api/hemingway/*
<Hemingway endpoint="/api/hemingway" />
```

### 6. Activate

Press **Cmd/Ctrl+Shift+H** for overlay mode and **Alt+Shift+H** for notepad mode (or your configured shortcuts).

## Config

```js
/** @type {import('hemingway-ai').HemingwayConfig} */
const config = {
  port: 4800,
  model: 'claude-sonnet-4-6',
  styleGuide: './docs/style-guide.md',
  copyBible: './docs/copy-bible.md',
  referenceGuide: './reference/saas-and-services-copy-guide.md',
  sourcePatterns: [
    'components/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}',
    'src/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}',
    'app/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}',
    'pages/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}',
    'content/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}',
    'site/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}',
  ],
  excludePatterns: ['node_modules', '.next', 'dist', 'build'],
  writeAdapter: 'react', // 'react' | 'generic'
  shortcut: 'ctrl+shift+h',
  notepadShortcut: 'alt+shift+h',
  accentColor: '#3b82f6',
};

export default config;
```

Next.js one-process note:

- Prefer a plain `export default { ... }` `hemingway.config.mjs` object.
- If you need imported/computed config values, mirror them in `package.json` under `hemingway`.

## Features

- **Click any text** to get AI-generated copy alternatives
- **Double-click** for inline editing with source file writes
- **Page notepad mode** — edit all discovered copy at once in markdown
- **Style guide aware** — feed it your brand voice docs
- **Framework agnostic** — works with any dev server via script tag or React component
- **Source mapping** — writes changes back to your source files

## Documentation

- [Docs Home](./docs/README.md)
- [Quickstart](./docs/getting-started/quickstart.md)
- [Integration Modes](./docs/getting-started/integration-modes.md)
- [Framework Setup Guides](./docs/getting-started)
- [Configuration Reference](./docs/configuration.md)
- [API Reference](./docs/api-reference.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Changelog](./CHANGELOG.md)

## Agent Reference Docs

Detailed, agent-oriented system docs live in:

- `docs/reference/README.md`
- `docs/reference/architecture.md`
- `docs/reference/server-runtime.md`
- `docs/reference/browser-overlay.md`
- `docs/reference/copy-intelligence.md`
- `docs/reference/operations-and-packaging.md`

## Contributing

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

## License

MIT
