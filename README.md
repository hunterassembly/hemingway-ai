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

### 4. Start the server

```sh
npx hemingway-ai
```

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

### 6. Activate

Press **Cmd+Shift+C** (or your configured shortcut) on your dev site.

## Config

```js
/** @type {import('hemingway-ai').HemingwayConfig} */
const config = {
  port: 4800,
  model: 'claude-sonnet-4-6',
  styleGuide: './docs/style-guide.md',
  copyBible: './docs/copy-bible.md',
  sourcePatterns: ['components/**/*.tsx', 'src/**/*.tsx', 'app/**/*.tsx'],
  excludePatterns: ['node_modules', '.next', 'dist', 'build'],
  shortcut: 'meta+shift+c',
  accentColor: '#3b82f6',
};

export default config;
```

## Features

- **Click any text** to get AI-generated copy alternatives
- **Double-click** for inline editing with source file writes
- **Style guide aware** — feed it your brand voice docs
- **Framework agnostic** — works with any dev server via script tag or React component
- **Source mapping** — writes changes back to your source files

## License

MIT
