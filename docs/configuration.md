# Configuration Reference

Hemingway loads configuration from multiple sources in this order:

1. Explicit runtime overrides
2. Environment variables
3. `hemingway.config.mjs`
4. `package.json` under `hemingway`
5. Internal defaults

## Example Config

```js
/** @type {import("hemingway-ai").HemingwayConfig} */
export default {
  port: 4800,
  apiKey: "",
  model: "claude-sonnet-4-6",
  styleGuide: "./docs/style-guide.md",
  copyBible: "./docs/copy-bible.md",
  referenceGuide: "./reference/saas-and-services-copy-guide.md",
  sourcePatterns: [
    "components/**/*.{tsx,jsx,ts,js}",
    "src/**/*.{tsx,jsx,ts,js}",
    "app/**/*.{tsx,jsx,ts,js}",
    "pages/**/*.{tsx,jsx,ts,js}",
    "packages/**/*.{tsx,jsx,ts,js}",
  ],
  excludePatterns: ["node_modules", ".next", "dist", "build"],
  writeAdapter: "react", // "react" | "generic"
  shortcut: "ctrl+shift+h",
  accentColor: "#3b82f6",
};
```

## Field Reference

- `port`:
  - Type: number
  - Default: `4800`
  - Purpose: local Hemingway server port
- `apiKey`:
  - Type: string
  - Default: `""` (falls back to `ANTHROPIC_API_KEY`)
  - Purpose: Anthropic API key
- `model`:
  - Type: string
  - Default: `claude-sonnet-4-6`
  - Purpose: model used for generation
- `styleGuide`:
  - Type: string (path)
  - Purpose: brand voice and tone guide
- `copyBible`:
  - Type: string (path)
  - Purpose: copywriting methodology document
- `referenceGuide`:
  - Type: string (path)
  - Purpose: optional copy examples corpus
- `sourcePatterns`:
  - Type: string[]
  - Purpose: files scanned for writeback candidates
- `excludePatterns`:
  - Type: string[]
  - Purpose: directories/files excluded from scanning
- `writeAdapter`:
  - Type: `"react" | "generic"`
  - Default: `react`
  - Purpose: adapter scoring/filtering strategy for source writeback
- `shortcut`:
  - Type: string
  - Default: `ctrl+shift+h`
  - Purpose: overlay toggle shortcut
- `accentColor`:
  - Type: string (hex)
  - Purpose: client UI accent color

## Environment Variables

- `ANTHROPIC_API_KEY`:
  - Used when `apiKey` is missing
- `HEMINGWAY_PORT`:
  - Overrides `port`

