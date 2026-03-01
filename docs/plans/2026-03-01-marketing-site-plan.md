# Marketing Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page Astro marketing site in `site/` that demos hemingway-ai using the real client overlay with a fetch interceptor serving pre-generated alternatives.

**Architecture:** Astro static site loads the real hemingway IIFE client bundle (`dist/client/overlay.iife.js`). A fetch interceptor installed before the client loads intercepts all requests to `localhost:4800` and returns pre-generated alternatives from a JSON map. Session edits persist in sessionStorage.

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

Create `site/src/layouts/Layout.astro`:

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI-powered copy alternatives for your marketing site. Click any text, see better options, apply with one click." />
    <title>{title}</title>
    <link rel="stylesheet" href="/styles/global.css" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Step 5: Create global styles**

Create `site/src/styles/global.css`:

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #faf9f7;
  --text: #1a1a1a;
  --text-muted: #6b7280;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --code-bg: #f3f4f6;
  --border: #e5e7eb;
  --max-width: 1080px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: "SF Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
}

html {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

code {
  font-family: var(--font-mono);
}
```

**Step 6: Create placeholder index page**

Create `site/src/pages/index.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
---
<Layout title="hemingway-ai — AI-powered copy for your marketing site">
  <main>
    <h1>hemingway-ai</h1>
    <p>Coming soon.</p>
  </main>
</Layout>
```

**Step 7: Verify dev server starts**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site
npm run dev
```

Expected: Astro dev server starts on `localhost:4321`, page renders placeholder.

**Step 8: Commit**

```bash
git add site/
git commit -m "feat(site): scaffold Astro marketing site with Vercel adapter"
```

---

### Task 2: Build page sections — Nav and Hero

**Files:**
- Create: `site/src/components/Nav.astro`
- Create: `site/src/components/Hero.astro`
- Modify: `site/src/pages/index.astro`

**Step 1: Build Nav component**

Create `site/src/components/Nav.astro`:

```astro
<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">hemingway</a>
    <div class="nav-links">
      <a href="https://github.com/hunterassembly/hemingway-ai" target="_blank" rel="noopener">GitHub</a>
      <a href="https://www.npmjs.com/package/hemingway-ai" target="_blank" rel="noopener">npm</a>
    </div>
  </div>
</nav>

<style>
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(250, 249, 247, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-logo {
    font-weight: 600;
    font-size: 1.125rem;
    letter-spacing: -0.01em;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .nav-links a:hover {
    color: var(--text);
  }
</style>
```

**Step 2: Build Hero component**

Create `site/src/components/Hero.astro`:

```astro
<section class="hero">
  <h1 class="hero-headline">Better copy, one click at a time</h1>
  <p class="hero-sub">
    AI-powered copy alternatives for your marketing site.
    Select any text, see better options, apply instantly.
  </p>
  <div class="hero-actions">
    <div class="hero-install">
      <code>npm install hemingway-ai</code>
      <button class="copy-btn" aria-label="Copy install command">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 5.5V3.5a1.5 1.5 0 00-1.5-1.5H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5h2" />
        </svg>
      </button>
    </div>
    <button class="hero-demo-btn" id="demo-toggle">
      Try it on this page
    </button>
  </div>
</section>

<style>
  .hero {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 10rem 1.5rem 6rem;
    text-align: center;
  }

  .hero-headline {
    font-size: clamp(2.5rem, 6vw, 3.75rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    max-width: 720px;
    margin: 0 auto;
  }

  .hero-sub {
    margin-top: 1.25rem;
    font-size: 1.125rem;
    color: var(--text-muted);
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }

  .hero-actions {
    margin-top: 2.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .hero-install {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.625rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }

  .copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }

  .copy-btn:hover {
    color: var(--text);
    background: var(--border);
  }

  .hero-demo-btn {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .hero-demo-btn:hover {
    background: var(--accent-hover);
  }
</style>

<script>
  const copyBtn = document.querySelector(".copy-btn");
  copyBtn?.addEventListener("click", () => {
    navigator.clipboard.writeText("npm install hemingway-ai");
  });
</script>
```

**Step 3: Wire into index page**

Update `site/src/pages/index.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
import Nav from "../components/Nav.astro";
import Hero from "../components/Hero.astro";
---
<Layout title="hemingway-ai — AI-powered copy for your marketing site">
  <Nav />
  <main>
    <Hero />
  </main>
</Layout>
```

**Step 4: Verify in browser**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site
npm run dev
```

Expected: Clean hero section with headline, subhead, install command, and demo button on cream background.

**Step 5: Commit**

```bash
git add site/src/components/Nav.astro site/src/components/Hero.astro site/src/pages/index.astro
git commit -m "feat(site): add Nav and Hero sections"
```

---

### Task 3: Build page sections — HowItWorks, Features, Install, Footer

**Files:**
- Create: `site/src/components/HowItWorks.astro`
- Create: `site/src/components/Features.astro`
- Create: `site/src/components/Install.astro`
- Create: `site/src/components/Footer.astro`
- Modify: `site/src/pages/index.astro`

**Step 1: Build HowItWorks component**

Create `site/src/components/HowItWorks.astro`:

3-step horizontal layout: "Select text" → "See alternatives" → "Apply with one click". Each step has a number, heading, and one-line description. Simple, no illustrations — just clean typography.

**Step 2: Build Features component**

Create `site/src/components/Features.astro`:

Grid of 4-6 feature cards. Each has a short title and 1-2 sentence description:
- **Local-first** — Runs on localhost. Your copy never leaves your machine.
- **Framework-agnostic** — One script tag works with React, Vue, Astro, or plain HTML.
- **Writes to source** — Changes go back to your actual source files, not just the DOM.
- **Learns your style** — Tracks which alternatives you pick and adapts future suggestions.
- **Claude-powered** — Uses Anthropic's Claude for copy that actually sounds good.
- **Zero dependencies** — No runtime deps. Just Node.js and your browser.

**Step 3: Build Install component**

Create `site/src/components/Install.astro`:

Code block showing the quick start:

```bash
# Install
npm install hemingway-ai

# Start the server
npx hemingway-ai

# Add to your site
<script src="http://localhost:4800/client.js"></script>

# Press Cmd+Shift+C to activate
```

**Step 4: Build Footer component**

Create `site/src/components/Footer.astro`:

Minimal footer: GitHub link, npm link, "MIT License", "Made by Hunter Assembly".

**Step 5: Wire all components into index page**

Update `site/src/pages/index.astro` to include all sections in order: Nav, Hero, HowItWorks, Features, Install, Footer.

**Step 6: Verify in browser**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site
npm run dev
```

Expected: Full single-page marketing site scrolls through all sections. Clean cream background, good typography hierarchy, consistent spacing.

**Step 7: Commit**

```bash
git add site/src/components/ site/src/pages/index.astro
git commit -m "feat(site): add HowItWorks, Features, Install, and Footer sections"
```

---

### Task 4: Build the demo adapter (fetch interceptor)

**Files:**
- Create: `site/src/scripts/demo-adapter.ts`
- Create: `site/src/scripts/demo-alternatives.json`

**Context:** The hemingway client IIFE bundle (`dist/client/overlay.iife.js`) auto-initializes when loaded and makes fetch calls to `http://localhost:4800`. We need to intercept these before the client loads.

**Step 1: Create the pre-generated alternatives JSON**

Create `site/src/scripts/demo-alternatives.json`:

A map keyed by normalized element text. Each entry has an array of alternative objects matching the `{ label, text }` shape the client expects. Cover every text element on the marketing page — headings, subheads, body text, CTAs, feature titles, feature descriptions, etc.

Example structure:

```json
{
  "better copy, one click at a time": [
    { "label": "[Clarity] Direct Benefit", "text": "Rewrite your marketing copy in seconds" },
    { "label": "[Punch] Short & Sharp", "text": "Your copy, but better" },
    { "label": "[Authority] Expert Voice", "text": "AI copywriting that writes back to your codebase" }
  ],
  "ai-powered copy alternatives for your marketing site. select any text, see better options, apply instantly.": [
    { "label": "[Clarity] Benefit-Led", "text": "Click any headline, paragraph, or button on your site. Get three Claude-powered rewrites. Apply your favorite with one click — it writes directly to your source files." },
    { "label": "[Punch] Compressed", "text": "Select text. See alternatives. Ship better copy. Hemingway writes changes straight to your codebase." },
    { "label": "[Conversational] Friendly", "text": "Stop rewriting copy in spreadsheets. Just click the text on your live site, pick the version you like, and hemingway handles the rest." }
  ]
}
```

Include entries for ALL text elements on the page — every heading, paragraph, feature card title, feature card description, CTA button, install step, and footer text.

**Step 2: Create the fetch interceptor**

Create `site/src/scripts/demo-adapter.ts`:

```typescript
import alternatives from "./demo-alternatives.json";

const HEMINGWAY_URL = "http://localhost:4800";
const PREFERENCES_KEY = "hemingway-demo-preferences";

const realFetch = window.fetch.bind(window);

function getPreferences(): { picks: Record<string, number>; totalPicks: number } {
  try {
    const stored = sessionStorage.getItem(PREFERENCES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { picks: {}, totalPicks: 0 };
}

function savePreferences(prefs: { picks: Record<string, number>; totalPicks: number }) {
  sessionStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

function findAlternatives(text: string): Array<{ label: string; text: string }> | null {
  const normalized = text.trim().toLowerCase();
  const alts = (alternatives as Record<string, Array<{ label: string; text: string }>>)[normalized];
  if (alts) return alts;

  // Fuzzy: check if any key is a substring or vice versa
  for (const [key, value] of Object.entries(alternatives as Record<string, Array<{ label: string; text: string }>>)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return null;
}

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (!url.startsWith(HEMINGWAY_URL)) {
    return realFetch(input, init);
  }

  const path = url.replace(HEMINGWAY_URL, "");
  const method = init?.method?.toUpperCase() || "GET";

  // GET /config
  if (path === "/config" && method === "GET") {
    return mockResponse({
      model: "claude-sonnet-4-6",
      shortcut: "meta+shift+c",
      styleGuide: "",
      copyBible: "",
    });
  }

  // POST /config
  if (path === "/config" && method === "POST") {
    return mockResponse({
      model: "claude-sonnet-4-6",
      shortcut: "meta+shift+c",
      styleGuide: "",
      copyBible: "",
    });
  }

  // POST /generate
  if (path === "/generate" && method === "POST") {
    const body = JSON.parse(init?.body as string);
    const alts = findAlternatives(body.text);
    if (alts) {
      // Simulate a brief delay to feel realistic
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
      return mockResponse({ alternatives: alts });
    }
    // Fallback: return generic alternatives
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    return mockResponse({
      alternatives: [
        { label: "[Clarity] Rewrite", text: body.text + " — rewritten" },
        { label: "[Punch] Shorter", text: body.text.split(" ").slice(0, 5).join(" ") },
        { label: "[Conversational] Friendly", text: body.text },
      ],
    });
  }

  // POST /generate-multi
  if (path === "/generate-multi" && method === "POST") {
    const body = JSON.parse(init?.body as string);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    const altSets = body.elements.map((el: { text: string }, i: number) => {
      const alts = findAlternatives(el.text);
      return { index: i, text: alts ? alts[0].text : el.text };
    });
    return mockResponse({
      alternatives: [
        { label: "[Clarity] Cohesive Rewrite", texts: altSets },
        {
          label: "[Punch] Tighter",
          texts: body.elements.map((el: { text: string }, i: number) => {
            const alts = findAlternatives(el.text);
            return { index: i, text: alts && alts[1] ? alts[1].text : el.text };
          }),
        },
        {
          label: "[Conversational] Warmer",
          texts: body.elements.map((el: { text: string }, i: number) => {
            const alts = findAlternatives(el.text);
            return { index: i, text: alts && alts[2] ? alts[2].text : el.text };
          }),
        },
      ],
    });
  }

  // POST /write
  if (path === "/write" && method === "POST") {
    return mockResponse({ success: true, file: "demo", line: 1 });
  }

  // GET /preferences
  if (path === "/preferences" && method === "GET") {
    return mockResponse(getPreferences());
  }

  // POST /preferences
  if (path === "/preferences" && method === "POST") {
    const body = JSON.parse(init?.body as string);
    const prefs = getPreferences();
    prefs.picks[body.label] = (prefs.picks[body.label] || 0) + 1;
    prefs.totalPicks += 1;
    savePreferences(prefs);
    return mockResponse(prefs);
  }

  // Fallback
  return mockResponse({ error: "Demo mode — endpoint not mocked" }, 404);
};
```

**Step 3: Verify adapter compiles**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai/site
npx astro check
```

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add site/src/scripts/
git commit -m "feat(site): add demo fetch adapter and pre-generated alternatives"
```

---

### Task 5: Wire up the demo toggle

**Files:**
- Modify: `site/src/layouts/Layout.astro`
- Modify: `site/src/components/Hero.astro`
- Create: `site/src/scripts/demo-toggle.ts`

**Context:** The hemingway IIFE bundle (`dist/client/overlay.iife.js`) auto-initializes when loaded, creating `window.__hemingway`. The overlay activates when the user presses the configured shortcut. We need to:
1. Load the demo adapter FIRST (installs fetch interceptor)
2. Load the IIFE bundle (auto-initializes, calls `GET /config` which the adapter intercepts)
3. On "Try it" button click, programmatically trigger the overlay activation

**Step 1: Copy the IIFE bundle to public/**

Add a build script that copies the client bundle. In `site/package.json`, add:

```json
"scripts": {
  "prebuild": "cp ../dist/client/overlay.iife.js public/hemingway-client.js",
  "predev": "cp ../dist/client/overlay.iife.js public/hemingway-client.js"
}
```

**Step 2: Create demo toggle script**

Create `site/src/scripts/demo-toggle.ts`:

```typescript
let loaded = false;

export function initDemoToggle() {
  const btn = document.getElementById("demo-toggle");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (loaded) {
      // Toggle overlay off/on by simulating shortcut
      const event = new KeyboardEvent("keydown", {
        key: "c",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
      return;
    }

    // First click: load the client bundle
    btn.textContent = "Loading...";

    const script = document.createElement("script");
    script.src = "/hemingway-client.js";
    script.onload = () => {
      loaded = true;
      btn.textContent = "Hemingway is active";
      btn.classList.add("active");

      // Trigger activation after a brief delay for init
      setTimeout(() => {
        const event = new KeyboardEvent("keydown", {
          key: "c",
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      }, 200);
    };
    document.body.appendChild(script);
  });
}
```

**Step 3: Update Layout to load adapter first, then toggle**

Update `site/src/layouts/Layout.astro` to include the demo adapter script in the `<head>` and the toggle init in the body:

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI-powered copy alternatives for your marketing site. Click any text, see better options, apply with one click." />
    <title>{title}</title>
  </head>
  <body>
    <slot />
    <script>
      import "../scripts/demo-adapter";
      import { initDemoToggle } from "../scripts/demo-toggle";
      initDemoToggle();
    </script>
  </body>
</html>
```

**Step 4: Update Hero demo button styling for active state**

Add to Hero.astro styles:

```css
.hero-demo-btn.active {
  background: #16a34a;
}
```

**Step 5: Verify end-to-end in browser**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai
npm run build  # Build the hemingway client first
cd site
npm run dev
```

1. Open `localhost:4321`
2. Click "Try it on this page"
3. Hemingway overlay should activate
4. Click any heading or paragraph
5. Pre-generated alternatives should appear in the popup
6. Applying an alternative should update the DOM text

Expected: Full demo loop works with no server running.

**Step 6: Commit**

```bash
git add site/
git commit -m "feat(site): wire up live demo with hemingway client and fetch interceptor"
```

---

### Task 6: Populate complete alternatives JSON

**Files:**
- Modify: `site/src/scripts/demo-alternatives.json`

**Step 1: Write alternatives for every text element on the page**

Go through every text element rendered by the marketing page components and add 3 high-quality alternatives for each. This includes:

- Hero headline
- Hero subhead
- Hero CTA button text
- Each "How it works" step title and description
- Each feature card title and description
- Install section heading
- Footer text

Use the hemingway copy style labels: `[Clarity]`, `[Punch]`, `[Conversational]`, `[Authority]`, etc.

Keys must be the exact lowercase text content of each element as it appears in the DOM.

**Step 2: Verify alternatives load for all elements**

Activate the demo, click through every clickable text element on the page. Each should return 3 alternatives (not the generic fallback).

**Step 3: Commit**

```bash
git add site/src/scripts/demo-alternatives.json
git commit -m "feat(site): complete pre-generated alternatives for all page elements"
```

---

### Task 7: Visual polish and responsive design

**Files:**
- Modify: `site/src/styles/global.css`
- Modify: All component `.astro` files as needed

**Step 1: Add responsive breakpoints**

Ensure all sections work well at mobile (375px), tablet (768px), and desktop (1080px+). Key adjustments:
- Hero headline scales down (`clamp()` already in place)
- Feature grid goes from 3 columns → 2 → 1
- Nav collapses gracefully
- Code blocks scroll horizontally on mobile

**Step 2: Add subtle scroll animations**

Use CSS `@keyframes` and `IntersectionObserver` for fade-in-up on sections as they scroll into view. Keep it minimal — 0.3s opacity+transform transitions.

**Step 3: Verify in browser at multiple widths**

Check 375px, 768px, 1280px viewports.

**Step 4: Commit**

```bash
git add site/
git commit -m "feat(site): responsive design and scroll animations"
```

---

### Task 8: Vercel deployment configuration

**Files:**
- Create: `site/vercel.json`
- Modify: root `.gitignore` (if needed)

**Step 1: Create Vercel config**

Create `site/vercel.json`:

```json
{
  "buildCommand": "cd .. && npm run build && cd site && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install && cd .. && npm install"
}
```

This ensures the hemingway client is built before the site build copies it to `public/`.

**Step 2: Add site build artifacts to .gitignore**

Ensure `site/dist/` and `site/.astro/` are in `.gitignore`.

**Step 3: Test production build locally**

```bash
cd /Users/hunter/Documents/GitHub/hemingway-ai
npm run build
cd site
npm run build
npx astro preview
```

Expected: Production build serves correctly, demo works as expected.

**Step 4: Commit**

```bash
git add site/vercel.json .gitignore
git commit -m "feat(site): add Vercel deployment configuration"
```

---

### Task 9: Session persistence for edits

**Files:**
- Create: `site/src/scripts/session-restore.ts`
- Modify: `site/src/scripts/demo-adapter.ts`

**Step 1: Add session storage for text edits**

When the demo adapter intercepts a `/write` call, store the `{ oldText, newText }` pair in sessionStorage. On page load (if the demo was previously active), restore all stored edits by walking the DOM and replacing text.

```typescript
const EDITS_KEY = "hemingway-demo-edits";

function saveEdit(oldText: string, newText: string) {
  const edits = JSON.parse(sessionStorage.getItem(EDITS_KEY) || "[]");
  // Remove any existing edit for the same oldText
  const filtered = edits.filter((e: { oldText: string }) => e.oldText !== oldText);
  filtered.push({ oldText, newText });
  sessionStorage.setItem(EDITS_KEY, JSON.stringify(filtered));
}

function restoreEdits() {
  const edits = JSON.parse(sessionStorage.getItem(EDITS_KEY) || "[]");
  if (edits.length === 0) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    for (const edit of edits) {
      if (node.textContent?.trim() === edit.oldText.trim()) {
        node.textContent = edit.newText;
      }
    }
  }
}
```

**Step 2: Call restoreEdits on page load**

In the demo toggle init, check if there are stored edits and restore them. Also auto-load the hemingway client if edits exist (so the demo stays active across refreshes).

**Step 3: Verify session persistence**

1. Activate demo, apply an alternative
2. Refresh page
3. Applied text should persist
4. Close tab, reopen → edits should be gone

**Step 4: Commit**

```bash
git add site/src/scripts/
git commit -m "feat(site): persist demo edits in sessionStorage across refreshes"
```
