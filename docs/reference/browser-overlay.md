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
5. Preserve an undo snapshot after apply operations.

## Activation and Lifecycle

- Instantiated automatically when `overlay.iife.js` loads; exposed as `window.__hemingway`.
- Toggled by configured shortcut (`ctrl+shift+h` default client config).
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

This context is core to prompt quality.

## Popup Phases (`popup.ts`)

- `input`: suggestions + freeform comment
- `loading`: progress state while awaiting API
- `alternatives`: selectable variants with regenerate/apply controls
- `done`: write result, clipboard fallback, optional undo affordance

Modes:

- Single mode alternatives: one replacement text per variant.
- Multi mode alternatives: indexed replacement map for each selected element.

## Indicator/Settings (`indicator.ts`)

- Floating bottom-left pill opens settings sheet.
- Current interactive settings include model selection.
- Overlay pushes setting changes to server via `POST /config`.
- Styleguide/copy-bible controls are mostly UI scaffolding in this version.

## Apply and Undo Semantics

Apply flow:

1. Optimistically updates in-page text immediately.
2. Calls `/write` to persist source.
3. Records undo snapshot with old/new text and write result.
4. Records label preference for chosen alternative.

Undo flow:

1. Restores DOM text.
2. Replays writebacks in reverse order (`newText -> oldText`) to preserve offsets.
3. Clears snapshot and shows reverted done state.

## Failure Behavior

- If writeback fails, overlay copies text to clipboard as fallback and still allows undo of page text.
- Network or parse failures return popup to input state and log errors to console.

## Extension Points

- Add/adjust detected text tags in `discovery.ts`.
- Improve section/copy-job heuristics in `context.ts`.
- Add richer settings controls and corresponding `/config` keys.
- Replace text-only writeback with AST-aware adapters per framework.
