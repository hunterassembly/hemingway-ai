# Server Runtime Reference

Primary files:

- `src/server/index.ts`
- `src/server/generate.ts`
- `src/server/write.ts`
- `src/server/config.ts`
- `src/server/preferences.ts`
- `src/server/briefings.ts`

## API Surface

- `POST /generate`
  - Input: `GenerateRequest` with selected text, element type, copy job, section context, user comment, optional rejected alternatives/feedback.
  - Output: `{ alternatives: Array<{ label, text }> }`
- `POST /generate-multi`
  - Input: `MultiGenerateRequest` with 2+ related elements and shared section context.
  - Output: `{ alternatives: Array<{ label, texts: [{ index, text }] }> }`
- `POST /write`
  - Input: `{ oldText, newText, context: { tagName, className, parentTag } }`
  - Output: `{ success, file?, line?, matchCount?, error? }`
- `GET /client.js`
  - Serves browser bundle (`overlay.iife.js`) from dist lookup candidates.
- `GET /health`
  - Output: `{ ok: true }`
- `GET /demo`
  - Returns a built-in test marketing page.
- `GET /config`
  - Returns safe client settings (`model`, `styleGuide`, `copyBible`, `shortcut`).
- `POST /config`
  - Runtime mutable keys: `model`, `styleGuide`, `copyBible`.
- `GET /preferences`
  - Returns stored pick distribution.
- `POST /preferences`
  - Records a picked alternative label.

## Config Resolution

`loadConfig()` merge order (highest to lowest):

1. Explicit overrides (`startServer(overrides)`)
2. Env vars (`ANTHROPIC_API_KEY`, `HEMINGWAY_PORT`)
3. `hemingway.config.mjs`
4. `package.json` `hemingway` key
5. Internal defaults

Defaults include source scan patterns and exclusion folders for writeback.

## Prompt Pipeline

For both single and multi generation:

1. Read optional docs from file paths:
  - `copyBible`
  - `styleGuide`
  - `referenceGuide`
2. Build element briefing:
  - Uses `(copyJob, sectionRole)` in `briefings.ts`
  - Applies section overrides when present
  - Adds page-position modifier (`above fold`, `mid-page`, `close`)
3. Build system prompt with explicit tiering:
  - Instructions and JSON format constraints
  - Element briefing
  - Learned style preferences
  - Style guide
  - Copy bible
  - Reference guide
4. Build user prompt with selected text(s), section context, optional revision feedback.
5. Call Anthropic Messages API (`https://api.anthropic.com/v1/messages`).
6. Parse response robustly:
  - Strips possible markdown fences
  - Extracts JSON object range
  - Validates expected array shape

## Preference Feedback Loop

- Picks are persisted at `.hemingway/preferences.json`.
- `getTopPreferences()` converts counts to top label percentages.
- Server injects these as soft guidance:
  - "This user tends to prefer: ... Lean toward these principles ..."

## Writeback Algorithm (`write.ts`)

Goal: map UI-selected text back to source code using heuristic matching.

1. Expand source files from configured glob-like patterns.
2. Recursively scan files, excluding known directories.
3. For each file:
  - Generate text variants for search (`raw`, entity-encoded, apostrophe variants, curly quotes).
  - Find exact and whitespace-normalized matches.
  - Score each match via nearby HTML clues:
    - Matching tag gets highest score boost
    - Class names add score
    - Parent tag adds score
4. Pick top-scoring match and preserve encoding style (`&apos;`, `&quot;`, etc.) in replacement.
5. Rewrite file as plain text splice and report location.

Important constraints:

- Not AST-aware; can select wrong target if many similar strings exist.
- Multi-write happens as sequential calls from client.
- If no match found, returns explicit "Text not found" error.

## Error Handling

- Invalid JSON requests return `400`.
- Missing required fields return `400`.
- Model/API failures return `500` with concise error message.
- Unmatched writeback returns `404`-style payload through route logic.

## Development Notes

- CORS is permissive for local integration.
- In production `NODE_ENV=production`, server logs a warning but does not block startup.
- `/client.js` requires built client output; missing bundle returns actionable message.
