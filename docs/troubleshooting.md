# Troubleshooting

This guide covers common setup and runtime issues.

## Overlay Does Not Appear

Symptoms:

- Shortcut does nothing
- No hover outlines on text

Checks:

1. Confirm Hemingway server is running:
```sh
curl http://localhost:4800/health
```
   - If you are using Next one-process mode, check:
```sh
curl http://localhost:3000/api/hemingway/health
```
2. Confirm client script loads:
```sh
curl -I http://localhost:4800/client.js
```
   - If you are using Next one-process mode, check:
```sh
curl -I http://localhost:3000/api/hemingway/client.js
```
3. Verify shortcut config in `hemingway.config.mjs`.
4. Ensure overlay is injected only in dev environment.

## Endpoint/Port Mismatch

Symptoms:

- App runs, but shortcut does nothing.
- Browser console shows failed `client.js` or API requests.

Checks:

1. If using Next one-process mode, mount:
```tsx
<Hemingway endpoint="/api/hemingway" />
```
2. If using standalone mode, mount:
```tsx
<Hemingway port={4800} />
```
or use:
```html
<script src="http://localhost:4800/client.js"></script>
```
3. Do not mix endpoint mode and standalone port assumptions in the same app shell.

## `/client.js` Returns 404

Cause:

- Build artifacts are missing.

Fix:

```sh
npm run build
```

For Next one-process mode, verify route handler path exists at `app/api/hemingway/[...path]/route.ts` and test:

```sh
curl -I http://localhost:3000/api/hemingway/client.js
```

## Generate Fails With API Error

Symptoms:

- Popup returns to input state
- Server logs Anthropic errors

Fix:

1. Set `ANTHROPIC_API_KEY`.
2. Verify model name in config.
3. Check network/firewall access to `api.anthropic.com`.

## Writeback Says "Text Not Found"

Cause:

- Source scan misses files or best match scoring is ambiguous.

Fix:

1. Use brace globs for concise coverage, for example:
```js
sourcePatterns: ["app/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}", "content/**/*.{md,mdx}"];
```
2. Check `excludePatterns` are not over-filtering.
3. Use `writeAdapter: "react"` for JSX/TSX projects.
4. Use `writeAdapter: "generic"` for non-React templates.
5. Try on unique text first; repeated phrases are harder to map.
6. Hemingway now performs a fallback scan across common app/content folders when primary patterns miss. If you still see misses, your copy may be rendered from fragmented expressions rather than a contiguous source string.
7. In Next one-process mode, ensure `hemingway.config.mjs` is a plain `export default { ... }` object so custom `sourcePatterns` load reliably.
8. For mixed/composite UI rows (for example title + subtitle rendered in one clickable card), edit the individual leaf text nodes instead of the parent wrapper.

## Wrong File Edited

Cause:

- Multiple candidate matches had similar scores.

Fix:

1. Tighten `sourcePatterns`.
2. Increase textual uniqueness around editable content.
3. Prefer editing from elements with distinguishing classes/containers.

## Shortcut Conflicts With App Hotkeys

Fix:

Set a different shortcut in `hemingway.config.mjs`:

```js
export default {
  shortcut: "ctrl+alt+h",
};
```

## Port Already In Use

Fix:

```sh
HEMINGWAY_PORT=4810 npx hemingway-ai
```

Or set in config:

```js
export default {
  port: 4810,
};
```
