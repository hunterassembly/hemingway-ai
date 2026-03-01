# Server Runtime Reference

Primary files:

- `src/server/index.ts`
- `src/server/generate.ts`
- `src/server/write.ts`
- `src/server/write-adapters.ts`
- `src/server/config.ts`
- `src/server/preferences.ts`
- `src/server/briefings.ts`

## API Surface

- `POST /generate`
  - Input: `GenerateRequest` with selected text, element type, copy job, section context, `pageBrief` narrative context, user comment, optional rejected alternatives/feedback.
  - Output: `{ alternatives: Array<{ label, text }> }`
- `POST /generate-multi`
  - Input: `MultiGenerateRequest` with 2+ related elements, shared section context, and `pageBrief`.
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
The writeback path also supports `writeAdapter` (`react` default, `generic` fallback).

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
  - Page story brief (title, stage, goal, promise, audience, proof, section flow)
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
7. Normalize alternatives into strategy lanes:
  - `[Clarity]`
  - `[Specificity]`
  - `[Conversion]`

## Preference Feedback Loop

- Picks are persisted at `.hemingway/preferences.json`.
- `getTopPreferences()` converts counts to top label percentages.
- Server injects these as soft guidance:
  - "This user tends to prefer: ... Lean toward these principles ..."

## Writeback Algorithm (`write.ts`)

Goal: map UI-selected text back to source code using heuristic matching.

1. Expand source files from configured glob-like patterns.
2. Recursively scan files, excluding known directories.
3. Resolve configured write adapter (`react` or `generic`) and skip files the adapter does not support.
4. For each candidate file:
  - Generate text variants for search (`raw`, entity-encoded, apostrophe variants, curly quotes).
  - Find exact and whitespace-normalized matches.
  - Score each match via base HTML clues plus adapter-specific scoring.
    - Matching tag gets highest score boost
    - Class names add score
    - Parent tag adds score
5. Pick top-scoring match and normalize replacement text (entity/curlies preservation) via adapter.
6. Rewrite file as plain text splice and report location.

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
