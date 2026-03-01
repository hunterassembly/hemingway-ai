# Marketing Site Design

## Summary

Single-page marketing site for hemingway-ai that doubles as a live product demo. Built with Astro, deployed to Vercel. Visitors can toggle hemingway on and edit the marketing page's own copy, with pre-generated alternatives served via a fetch interceptor.

## Decisions

- **Framework:** Astro (static HTML output = ideal demo surface for hemingway's DOM discovery)
- **Demo approach:** Load the real hemingway client bundle, intercept fetch calls with a mock adapter that returns pre-generated alternatives from a JSON map
- **Session persistence:** sessionStorage for user edits (survives refresh, resets on tab close)
- **Hosting:** Vercel, custom domain (hemingway-ai.dev or similar)
- **Location:** `site/` directory in the existing repo

## Architecture

```
site/
├── astro.config.mjs
├── package.json
├── src/
│   ├── layouts/Layout.astro
│   ├── pages/index.astro
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── HowItWorks.astro
│   │   ├── Features.astro
│   │   ├── Install.astro
│   │   └── Footer.astro
│   ├── scripts/
│   │   ├── demo-adapter.ts       # Fetch interceptor
│   │   └── demo-alternatives.json # Pre-generated alternatives
│   └── styles/
│       └── global.css
├── public/
└── vercel.json
```

### Demo Adapter

The real hemingway client bundle is loaded via script tag. Before it initializes, `demo-adapter.ts` monkey-patches `window.fetch` to intercept calls to the hemingway server:

- `POST /generate` — looks up element text in JSON map, returns pre-generated alternatives
- `POST /generate-multi` — same, for multi-select
- `POST /write` — returns `{ success: true }` (no-op, DOM already updated by client)
- `GET /config` — returns static config
- `POST /preferences` — stores in sessionStorage, returns accumulated picks
- All other URLs pass through to real fetch

### Endpoints to intercept

| Endpoint | Method | Mock behavior |
|----------|--------|---------------|
| `/generate` | POST | Lookup by element text in JSON map, return `{ alternatives: [...] }` |
| `/generate-multi` | POST | Lookup by element texts, return `{ alternatives: [...] }` with indexed texts |
| `/write` | POST | No-op, return `{ success: true }` |
| `/config` | GET | Return `{ model: "claude-sonnet-4-6", shortcut: "meta+shift+c" }` |
| `/config` | POST | No-op, return same static config |
| `/preferences` | POST | Accumulate in sessionStorage, return `{ picks, totalPicks }` |
| `/preferences` | GET | Read from sessionStorage |

## Visual Design

- **Background:** Warm off-white/cream (#faf9f7)
- **Text:** Near-black (#1a1a1a) headings, medium gray body
- **Accent:** Blue (#3b82f6) — hemingway's default accentColor
- **Typography:** System font stack, monospace for code
- **Animations:** Minimal — fade-ins on scroll, smooth demo toggle. Let hemingway's own overlay be the star.

Inspired by shiori.sh (clean minimalism) and agentation.dev (interactive demo as centerpiece, cream background).

## Page Sections

1. **Nav** — Logo left, GitHub + npm links right. Fixed on scroll.
2. **Hero** — Large headline, 1-line subhead, `npm install hemingway-ai` copy button, "Try it now" toggle
3. **How it works** — 3 steps: Select text, See alternatives, Apply with one click
4. **Features** — 4-6 cards: Local-first, Framework-agnostic, Source-aware, Learns your style, Claude-powered, Zero deps
5. **Install / Quick Start** — Code block with 4-step setup
6. **Footer** — GitHub, npm, MIT license, "Made by Hunter Assembly"

## Demo UX

- Floating "Try Hemingway" pill/button activates the overlay on the marketing page
- Once active, visitors can click any text element to see pre-generated alternatives
- A subtle tooltip explains what's happening on first activation
- Changes persist in sessionStorage across page refreshes
- Closing the tab resets everything
