# Changelog

All notable changes to this project are documented in this file.

## [0.1.3] - 2026-03-03

### Fixed

- Next.js one-process route mode now reliably loads project `hemingway.config.mjs` in bundled runtimes where dynamic module import may fail.
- Writeback now honors configured `sourcePatterns` consistently in same-app mode (including non-default folders such as `lib/**`).
- Discovery skips composite wrapper nodes whose visible text is assembled from multiple child literals, reducing false-selectable elements that lead to clipboard fallback.
- Overlay text capture now falls back to normalized `textContent` when `innerText` is empty during typing/animated render phases.
- Main overlay shortcut now consistently toggles on/off and no longer opens notepad on the second keypress.

### Changed

- Updated package metadata and docs to reflect the PolyForm Shield 1.0.0 license.
- Updated site install/FAQ copy to match current shortcut behavior and config defaults.

## [0.1.1] - Unreleased

### Added

- Notepad mode accessible from the settings panel via an `Open Notepad` action.
- Right-docked notepad layout with richer markdown preview plus raw edit toggle.
- Multi-step undo history for apply actions (single, multi, inline edit, and notepad apply).

### Changed

- Applied `npm pkg fix` cleanup for publish metadata normalization.
- Aligned default `referenceGuide` path to `./reference/saas-and-services-copy-guide.md`.
- Added explicit `referenceGuide` examples to README and `npx hemingway-ai init` config template.
- Overlay default shortcut remains `ctrl+shift+h`; notepad default shortcut remains `alt+shift+h`.

## [0.1.0] - 2026-03-02

### Added

- First public npm release of `hemingway-ai`.
- Local server + browser overlay workflow for AI-assisted marketing copy edits.
- Source writeback support with adapter-based matching (`react`, `generic`).
- Story-aware prompting context and strategy-lane alternatives (`Clarity`, `Specificity`, `Conversion`).
