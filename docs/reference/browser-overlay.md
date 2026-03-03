# Browser Overlay Reference

Primary files:

- `src/client/overlay.ts`
- `src/client/discovery.ts`
- `src/client/context.ts`
- `src/client/popup.ts`
- `src/client/indicator.ts`
- `src/client/dom-utils.ts`

## Overlay Responsibilities

The overlay coordinates five concerns:

1. Discover editable text elements in the live DOM.
2. Capture contextual metadata for selected elements.
3. Render and manage popup interaction states.
4. Call server routes for generation, writeback, config, and preferences.
5. Preserve a bounded undo history after apply operations.

## Activation and Lifecycle

- Instantiated automatically when `overlay.iife.js` loads; exposed as `window.__hemingway`.
- Toggled by configured shortcuts:
  - Overlay mode (`ctrl+shift+h` default client config)
  - Notepad mode (`alt+shift+h` default client config)
- While active, undo/redo hotkeys target Hemingway history:
  - Undo: `cmd/ctrl+z`
  - Redo: `cmd/ctrl+shift+z` (also `ctrl+y` on non-Mac)
- On activate:
  - Shows indicator pill
  - Discovers elements and binds hover/click listeners
  - Starts mutation observation for rediscovery
  - Blocks navigation clicks on anchors/buttons
- On deactivate:
  - Hides popup/indicator
  - Clears selection and badges
  - Unbinds listeners and observer

## Element Discovery Strategy

`ElementDiscovery` uses a `TreeWalker` over target tags:

- Included: `h1-h6`, `p`, `span`, `a`, `button`, `li`, `label`, `td`, `th`
- Excluded: script/style/media/embed tags and any Hemingway UI subtree
- Requires direct text nodes (not just inherited descendant text)

Dedup step removes parent elements when parent text is fully covered by discovered child text.
Discovery also suppresses likely per-letter animation spans (typing effects) so users can select full lines/headings instead of single characters.

## Selection Model

- Single select: click
  - Opens popup for one element
- Multi select: cmd/ctrl+click
  - Adds/removes selection up to `MAX_MULTI_SELECT = 5`
  - Shows numbered badges on selected elements
  - Opens multi popup representation
- Inline edit: double-click
  - Converts target to `contentEditable`
  - Commits on blur or Enter
  - Cancels on Escape

## Context Extraction (`context.ts`)

For selected elements, overlay sends:

- `sectionHtml` (cleaned/truncated)
- `pagePosition` (`Section n of total`)
- `sectionRole` (heuristic: hero/problem/solution/features/social-proof/cta/etc.)
- `surroundingSections` summaries
- `elementType`
- `copyJob` classification (e.g. `primary-headline`, `cta-label`, `section-opener`)
- `pageBrief` narrative object:
  - `pageTitle`
  - `narrativeStage` (`opening`/`middle`/`closing`)
  - `primaryGoal`
  - `corePromise`
  - `primaryAudience` (up to 3 inferred segments)
  - `primaryCta`
  - `keyProofPoints`
  - `sectionFlow` (compact map of section role + heading)

This context is core to prompt quality.

## Popup Phases (`popup.ts`)

- `input`: suggestions + freeform comment
- `loading`: progress state while awaiting API
- `alternatives`: selectable variants with regenerate/apply controls
- `done`: write result, clipboard fallback, optional undo affordance
- `notepad`: page-wide markdown editor with block markers for bulk edits
  - Mixed copy lines that contain URL(s) are tokenized so URL text appears as its own editable block.
  - URL token edits only change rendered text, not anchor `href` attributes.

Modes:

- Single mode alternatives: one replacement text per variant.
- Multi mode alternatives: indexed replacement map for each selected element.

## Indicator/Settings (`indicator.ts`)

- Floating bottom-left pill opens settings sheet.
- Current interactive settings include model selection and API key save.
- Settings shows connection status (`same-app` or `standalone`), project root, and active base URL.
- Styleguide `Generate` action calls `/styleguide/generate` to scaffold a starter style guide file.
- After copy changes, the pill expands into a rounded rectangle with quick `Undo` and `Redo` actions.
- Overlay pushes setting changes to server via `POST /config`.
- API key input posts to `/config` and relies on server `hasApiKey` status for safe UI state.
- Styleguide/copy-bible controls are mostly UI scaffolding in this version.

## Apply and Undo Semantics

Apply flow:

1. Optimistically updates in-page text immediately.
2. Calls `/write` to persist source.
3. Pushes an undo snapshot (old/new text + write result) to a bounded history stack.
4. Records label preference for chosen alternative.

Undo/redo flow:

1. Undo restores DOM text.
2. Undo replays writebacks in reverse order (`newText -> oldText`) to preserve offsets.
3. Redo reapplies the same snapshot (`oldText -> newText`) and restores it to undo history.
4. Indicator quick actions reflect availability (`Undo` visible when undo history exists, `Redo` after at least one undo).

## Failure Behavior

- If writeback fails, overlay copies text to clipboard as fallback and still allows undo of page text.
- Network or parse failures return popup to input state and log errors to console.

## Extension Points

- Add/adjust detected text tags in `discovery.ts`.
- Improve section/copy-job heuristics in `context.ts`.
- Add richer settings controls and corresponding `/config` keys.
- Replace text-only writeback with AST-aware adapters per framework.
