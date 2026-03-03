# Marketing Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Astro marketing site + docs in `site/` that demos hemingway-ai using the real client overlay with a fetch interceptor. Includes homepage with interactive demo, plus /install, /features, /changelog, and /faq pages.

**Architecture:** Astro static site loads the real hemingway IIFE client bundle (`dist/client/overlay.iife.js`). A fetch interceptor installed before the client loads intercepts all requests to `localhost:4800` and returns pre-generated alternatives from a JSON map. Session edits persist in sessionStorage. Docs pages use a shared DocsLayout with consistent nav.

**Tech Stack:** Astro 5, TypeScript, Vercel adapter, hemingway-ai client IIFE bundle

---

### Task 1: Scaffold Astro project

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/src/pages/index.astro` (placeholder)
- Create: `site/src/layouts/Layout.astro`
- Create: `site/src/styles/global.css`

**Step 1: Initialize Astro project**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai
mkdir -p site
cd site
npm create astro@latest -- --template minimal --no-install --no-git .
```

**Step 2: Install dependencies**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site
npm install
npm install @astrojs/vercel
```

**Step 3: Configure Astro for Vercel**

Update `site/astro.config.mjs`:

```javascript
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "static",
  adapter: vercel(),
});
```

**Step 4: Create base layout**

Create `site/src/layouts/Layout.astro` — base HTML shell with meta tags, global styles, and slot for content.

**Step 5: Create global styles**

Create `site/src/styles/global.css` with CSS custom properties:
- `--bg: #faf9f7` (cream)
- `--text: #1a1a1a`
- `--text-muted: #6b7280`
- `--accent: #3b82f6`
- `--border: #e5e7eb`
- `--max-width: 1080px`
- System font stack + monospace for code
- Reset (box-sizing, margin/padding)

**Step 6: Create placeholder index page**

**Step 7: Verify dev server starts**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site && npm run dev
```

Expected: Astro dev server on `localhost:4321`.

**Step 8: Commit**

```bash
git add site/
git commit -m "feat(site): scaffold Astro marketing site with Vercel adapter"
```

---

### Task 2: Build Nav and Footer (shared across all pages)

**Files:**
- Create: `site/src/components/Nav.astro`
- Create: `site/src/components/Footer.astro`
- Modify: `site/src/layouts/Layout.astro`

**Nav design** — modeled after agentation.dev's flat structure:

```
[hemingway]   Overview   Install   Features   Changelog   FAQ   [GitHub icon]
```

- Fixed on scroll with blur backdrop
- Current page highlighted (pass `currentPath` prop from Layout)
- GitHub links to repo
- Responsive: on mobile, links collapse to a menu or wrap

**Footer design:**
- GitHub link, npm link, "PolyForm Shield License", "Made by Hunter Assembly"
- Consistent across all pages

**Step 1: Build Nav.astro**

Nav accepts a `currentPath` prop. Links: `/` (Overview), `/install`, `/features`, `/changelog`, `/faq`, plus GitHub icon. Current page link gets `aria-current="page"` and active styling.

**Step 2: Build Footer.astro**

Minimal footer with links and attribution.

**Step 3: Wire Nav and Footer into Layout.astro**

Layout includes Nav at top and Footer at bottom, wrapping the `<slot />`.

**Step 4: Verify nav renders and highlights current page**

**Step 5: Commit**

```bash
git add site/src/components/Nav.astro site/src/components/Footer.astro site/src/layouts/Layout.astro
git commit -m "feat(site): add shared Nav and Footer components"
```

---

### Task 3: Build homepage sections — Hero, HowItWorks, Features, QuickStart

**Files:**
- Create: `site/src/components/Hero.astro`
- Create: `site/src/components/HowItWorks.astro`
- Create: `site/src/components/Features.astro`
- Create: `site/src/components/QuickStart.astro`
- Modify: `site/src/pages/index.astro`

**Step 1: Build Hero.astro**

- Large headline: "Better copy, one click at a time"
- Subhead: 1-2 line description
- `npm install hemingway-ai` with copy button
- "Try it on this page" demo toggle button (wired up in Task 6)

**Step 2: Build HowItWorks.astro**

3-step horizontal layout:
1. **Select text** — Click any heading, paragraph, or button
2. **See alternatives** — Get three Claude-powered rewrites
3. **Apply instantly** — One click writes to your source files

Each step: number, heading, one-line description. Clean typography, no illustrations.

**Step 3: Build Features.astro**

Grid of 6 feature cards:
- **Local-first** — Runs on localhost. Your copy never leaves your machine.
- **Framework-agnostic** — One script tag works with React, Vue, Astro, or plain HTML.
- **Writes to source** — Changes go back to your actual source files, not just the DOM.
- **Learns your style** — Tracks which alternatives you pick and adapts future suggestions.
- **Claude-powered** — Uses Anthropic's Claude for copy that actually sounds good.
- **Zero dependencies** — No runtime deps. Just Node.js and your browser.

3-column grid on desktop → 2 on tablet → 1 on mobile.

**Step 4: Build QuickStart.astro**

Compact code block with the 4-step setup. Links to `/install` for the full guide.

```bash
npm install hemingway-ai
npx hemingway-ai
# Add to your site: <script src="http://localhost:4800/client.js"></script>
# Press Cmd+Shift+H to toggle on/off
```

**Step 5: Wire all components into index.astro**

Order: Hero → HowItWorks → Features → QuickStart (Nav and Footer come from Layout).

**Step 6: Verify in browser**

Expected: Full homepage scrolls through all sections. Cream background, good typography, consistent spacing.

**Step 7: Commit**

```bash
git add site/src/components/ site/src/pages/index.astro
git commit -m "feat(site): build homepage with Hero, HowItWorks, Features, QuickStart"
```

---

### Task 4: Build docs pages — Install, Features, Changelog, FAQ

**Files:**
- Create: `site/src/layouts/DocsLayout.astro`
- Create: `site/src/pages/install.astro`
- Create: `site/src/pages/features.astro`
- Create: `site/src/pages/changelog.astro`
- Create: `site/src/pages/faq.astro`

**Step 1: Build DocsLayout.astro**

Extends Layout. Adds:
- A page title/heading at the top
- Prose styling for long-form content (max-width ~720px, good line-height, spacing for headings/paragraphs/lists/code blocks)
- Consistent with the marketing page's visual design

```astro
---
import Layout from "./Layout.astro";
interface Props {
  title: string;
  heading: string;
}
const { title, heading } = Astro.props;
---
<Layout title={title}>
  <article class="docs">
    <h1>{heading}</h1>
    <slot />
  </article>
</Layout>
```

**Step 2: Build install.astro**

Content sourced from README, expanded. Sections:

- **Install** — `npm install hemingway-ai` (with yarn/pnpm/bun variants)
- **Initialize** — `npx hemingway-ai init` creates config file
- **Configuration** — table of config options: `port`, `model`, `styleGuide`, `copyBible`, `sourcePatterns`, `excludePatterns`, `shortcut`, `accentColor`
- **Start the server** — `npx hemingway-ai`
- **Add to your site** — Script tag: `<script src="http://localhost:4800/client.js"></script>`
- **React component** — `import { Hemingway } from 'hemingway-ai/react'` with props table
- **Environment variables** — `ANTHROPIC_API_KEY`, `HEMINGWAY_PORT`

All code blocks should have copy buttons.

**Step 3: Build features.astro**

Deep dive on how hemingway works. Sections:

- **Text discovery** — TreeWalker finds H1-6, P, SPAN, A, BUTTON, LI, LABEL, TD, TH
- **Copy job classification** — primary-headline, cta-label, section-opener, body-copy, feature-point, eyebrow, testimonial
- **Section role detection** — hero, problem, solution, features, social-proof, cta
- **Page brief** — how hemingway builds full-page context for better suggestions
- **Multi-select** — Cmd/Ctrl+Click to select 2-5 elements for cohesive rewrites
- **Inline editing** — Double-click to edit directly, commits on Enter/blur
- **Write-back** — heuristic source file matching with encoding-aware variants
- **Style learning** — preference tracking from picks, top 3 labels influence future generations
- **Style guide & copy bible** — configuring brand voice files

**Step 4: Build changelog.astro**

Reverse-chronological. Follows Keep a Changelog format. For now, just the initial release:

```
## v0.1.0 — 2026

### Added
- CLI server with AI-powered copy generation
- Browser overlay with text discovery and selection
- React component wrapper
- Source file write-back
- Multi-element selection (2-5 elements)
- Inline editing with double-click
- Style preference learning
- Copy job and section role classification
- Page brief generation for full-page context
- Style guide and copy bible support
- Built-in demo page
```

**Step 5: Build faq.astro**

Q&A pairs organized by category using `<details>` / `<summary>` for expand/collapse:

**General:**
- What is hemingway? → AI copy editing overlay for marketing sites
- Who is it for? → Developers and marketing teams iterating on copy
- Is it free? → Licensed under PolyForm Shield. You need your own Anthropic API key.

**Setup:**
- What frameworks does it work with? → Any — React, Vue, Astro, plain HTML, etc.
- What AI models does it support? → Claude models via Anthropic API (default: claude-sonnet-4-6)
- Do I need an API key? → Yes, an Anthropic API key. Set as `ANTHROPIC_API_KEY` env var.

**Usage:**
- How does write-back work? → Heuristic text matching in your source files with encoding-aware variants
- What if it picks the wrong file? → Configure `sourcePatterns` to narrow the search scope
- Can I use it in production? → No, it's a dev tool. Server warns if NODE_ENV=production.
- Does it support inline editing? → Yes, double-click any text element to edit directly.

**Privacy & Security:**
- Does my copy leave my machine? → Only to Anthropic's API for generation. No other external calls.
- Is it safe to use with client code? → Yes, runs on localhost with no external data storage.

**Step 6: Add prose/docs styles to global.css**

Add styles for the docs layout: heading spacing, paragraph line-height, list styling, code block styling, `<details>/<summary>` styling for FAQ, table styling for config options.

**Step 7: Verify all pages render and nav links work**

Visit `/install`, `/features`, `/changelog`, `/faq`. Check nav highlights correct page. Check content reads well.

**Step 8: Commit**

```bash
git add site/src/layouts/DocsLayout.astro site/src/pages/ site/src/styles/global.css
git commit -m "feat(site): add Install, Features, Changelog, and FAQ docs pages"
```

---

### Task 5: Build the demo adapter (fetch interceptor)

**Files:**
- Create: `site/src/scripts/demo-adapter.ts`
- Create: `site/src/scripts/demo-alternatives.json`

**Context:** The hemingway client IIFE bundle (`dist/client/overlay.iife.js`) auto-initializes when loaded and makes fetch calls to `http://localhost:4800`. We intercept these before the client loads.

**Step 1: Create the pre-generated alternatives JSON**

Create `site/src/scripts/demo-alternatives.json` — a map keyed by normalized (lowercase, trimmed) element text. Each entry has 3 alternatives matching `{ label, text }`.

Cover every text element on the homepage: hero headline, hero subhead, hero CTA, each how-it-works step title + description, each feature card title + description, quick start heading.

Use hemingway's copy style labels: `[Clarity]`, `[Punch]`, `[Conversational]`, `[Authority]`, etc.

**Step 2: Create the fetch interceptor**

Create `site/src/scripts/demo-adapter.ts` — monkey-patches `window.fetch`:

- Intercepts all requests to `http://localhost:4800/*`
- Routes: `/generate`, `/generate-multi`, `/write`, `/config` (GET/POST), `/preferences` (GET/POST)
- `/generate`: lookup text in JSON map, simulate 600-1000ms delay, return alternatives
- `/write`: save `{ oldText, newText }` to sessionStorage, return `{ success: true }`
- `/preferences`: accumulate in sessionStorage
- `/config`: return static config
- Fallback for unmatched text: return generic alternatives
- All other URLs pass through to real fetch

**Step 3: Verify adapter compiles**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site && npx astro check
```

**Step 4: Commit**

```bash
git add site/src/scripts/
git commit -m "feat(site): add demo fetch adapter and pre-generated alternatives"
```

---

### Task 6: Wire up the demo toggle

**Files:**
- Create: `site/src/scripts/demo-toggle.ts`
- Modify: `site/src/layouts/Layout.astro`
- Modify: `site/src/components/Hero.astro`
- Modify: `site/package.json`

**Context:** The IIFE bundle auto-initializes when loaded (`window.__hemingway`). The overlay activates on the configured keyboard shortcut. We need to:
1. Install the fetch interceptor on page load (only on homepage)
2. On "Try it" button click, load the IIFE bundle
3. Programmatically trigger overlay activation

**Step 1: Add prebuild/predev scripts to copy IIFE bundle**

In `site/package.json`:
```json
"prebuild": "cp ../dist/client/overlay.iife.js public/hemingway-client.js",
"predev": "cp ../dist/client/overlay.iife.js public/hemingway-client.js"
```

**Step 2: Create demo-toggle.ts**

- On first click: set button to "Loading...", inject `<script src="/hemingway-client.js">`, on load set button to "Hemingway is active" + green bg, trigger activation via simulated keyboard shortcut
- On subsequent clicks: toggle overlay via simulated shortcut
- On page load: if sessionStorage has edits, restore them by walking the DOM + auto-load the client

**Step 3: Update Layout.astro**

Load demo adapter + demo toggle scripts only on the homepage (check `Astro.url.pathname === "/"`). Docs pages should not load the demo scripts.

**Step 4: Add active button styling to Hero.astro**

```css
.hero-demo-btn.active { background: #16a34a; }
```

**Step 5: Verify end-to-end demo loop**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai && npm run build
cd site && npm run dev
```

1. Open `localhost:4321`
2. Click "Try it on this page"
3. Overlay activates
4. Click any heading/paragraph → alternatives popup appears
5. Apply an alternative → DOM text updates
6. Refresh → edits persist
7. Visit `/install` → demo is NOT active on docs pages

**Step 6: Commit**

```bash
git add site/
git commit -m "feat(site): wire up live demo with hemingway client and fetch interceptor"
```

---

### Task 7: Populate complete alternatives JSON

**Files:**
- Modify: `site/src/scripts/demo-alternatives.json`

**Step 1: Write alternatives for every text element**

Go through every text element rendered on the homepage and add 3 high-quality alternatives. Keys must be the exact lowercase text content as it appears in the DOM.

Elements to cover:
- Hero headline
- Hero subhead
- Hero CTA button text ("Try it on this page")
- Each HowItWorks step title (3) and description (3)
- Each Features card title (6) and description (6)
- QuickStart section heading
- Any other visible text elements

**Step 2: Verify all elements return real alternatives (not fallback)**

Activate demo, click through every text element. None should return the generic fallback.

**Step 3: Commit**

```bash
git add site/src/scripts/demo-alternatives.json
git commit -m "feat(site): complete pre-generated alternatives for all homepage elements"
```

---

### Task 8: Visual polish and responsive design

**Files:**
- Modify: `site/src/styles/global.css`
- Modify: component `.astro` files as needed

**Step 1: Responsive breakpoints**

- Hero headline scales via `clamp()` (already planned)
- Feature grid: 3 cols → 2 → 1
- HowItWorks: horizontal → vertical on mobile
- Nav: links wrap or show hamburger on mobile
- Code blocks: horizontal scroll on mobile
- Docs prose: full-width padding on mobile

**Step 2: Subtle scroll animations**

CSS `@keyframes fadeInUp` + `IntersectionObserver` for sections. 0.3s opacity+transform. Keep minimal.

**Step 3: Code block styling**

Consistent styling for all code blocks across homepage and docs: dark bg (#1a1a1a), light text, rounded corners, padding, horizontal scroll, optional copy button.

**Step 4: Verify at 375px, 768px, 1280px**

**Step 5: Commit**

```bash
git add site/
git commit -m "feat(site): responsive design and scroll animations"
```

---

### Task 9: Vercel deployment configuration

**Files:**
- Create: `site/vercel.json`
- Modify: root `.gitignore`

**Step 1: Create Vercel config**

```json
{
  "buildCommand": "cd .. && npm run build && cd site && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install && cd .. && npm install"
}
```

**Step 2: Update .gitignore**

Add `site/dist/`, `site/.astro/`, `site/public/hemingway-client.js` (generated file).

**Step 3: Test production build locally**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai && npm run build
cd site && npm run build && npx astro preview
```

Expected: Production build works, demo functions, all pages render.

**Step 4: Commit**

```bash
git add site/vercel.json .gitignore
git commit -m "feat(site): add Vercel deployment configuration"
```
