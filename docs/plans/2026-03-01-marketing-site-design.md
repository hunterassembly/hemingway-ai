# Marketing Site Design

## Summary

Marketing site + docs for hemingway-ai that doubles as a live product demo. Built with Astro, deployed to Vercel. The homepage lets visitors toggle hemingway on and edit the marketing page's own copy, with pre-generated alternatives served via a fetch interceptor. Docs pages cover installation, features, changelog, and FAQ.

## Decisions

- **Framework:** Astro (static HTML output = ideal demo surface for hemingway's DOM discovery)
- **Demo approach:** Load the real hemingway client bundle, intercept fetch calls with a mock adapter that returns pre-generated alternatives from a JSON map
- **Session persistence:** sessionStorage for user edits (survives refresh, resets on tab close)
- **Hosting:** Vercel, custom domain (hemingway-ai.dev or similar)
- **Location:** `site/` directory in the existing repo
- **Scope:** Full docs site modeled after agentation.dev — homepage + 4 doc pages

## Architecture

```
site/
├── astro.config.mjs
├── package.json
├── src/
│   ├── layouts/
│   │   ├── Layout.astro          # Base HTML shell (all pages)
│   │   └── DocsLayout.astro      # Docs pages with sidebar/nav
│   ├── pages/
│   │   ├── index.astro           # Marketing homepage with demo
│   │   ├── install.astro         # Installation & quick start guide
│   │   ├── features.astro        # Deep dive on how hemingway works
│   │   ├── changelog.astro       # Version history
│   │   └── faq.astro             # Frequently asked questions
│   ├── components/
│   │   ├── Nav.astro             # Top nav (all pages)
│   │   ├── Hero.astro            # Homepage hero
│   │   ├── HowItWorks.astro      # Homepage 3-step section
│   │   ├── Features.astro        # Homepage feature cards
│   │   ├── QuickStart.astro      # Homepage install snippet
│   │   └── Footer.astro          # Footer (all pages)
│   ├── scripts/
│   │   ├── demo-adapter.ts       # Fetch interceptor
│   │   └── demo-alternatives.json # Pre-generated alternatives
│   └── styles/
│       └── global.css
├── public/
└── vercel.json
```

## Navigation

Modeled after agentation.dev's flat nav structure:

```
[hemingway logo]   Overview   Install   Features   Changelog   FAQ   [GitHub]
```

- **Overview** links to `/` (homepage)
- All other links go to their respective pages
- GitHub icon links to the repo
- No dropdowns needed — only 5 pages total
- Nav is consistent across all pages
- Current page is highlighted in the nav

## Pages

### Homepage (`/`)

The marketing page + live demo surface.

**Sections:**
1. **Hero** — Large headline, 1-line subhead, `npm install hemingway-ai` copy button, "Try it on this page" demo toggle
2. **How it works** — 3 steps: Select text → See alternatives → Apply with one click
3. **Features** — 4-6 cards: Local-first, Framework-agnostic, Source-aware, Learns your style, Claude-powered, Zero deps
4. **Quick Start** — Compact code block with 4-step setup, linking to `/install` for full guide
5. **Footer** — GitHub, npm, PolyForm Shield license, "Made by Hunter Assembly"

**Demo behavior:** The "Try it on this page" button loads the real hemingway client IIFE bundle. The fetch interceptor (installed on page load) intercepts all calls and returns pre-generated alternatives. Only active on the homepage.

### Install (`/install`)

Full getting-started guide. Content sourced from the README but expanded.

**Sections:**
- npm install command (with yarn/pnpm/bun variants)
- `npx hemingway-ai init` — config file creation
- Configuration options (model, styleGuide, copyBible, sourcePatterns, shortcut, accentColor)
- Starting the server
- Adding to your site — script tag approach
- React component approach (with props reference)
- Environment variables (ANTHROPIC_API_KEY, HEMINGWAY_PORT)

### Features (`/features`)

Deep dive on what hemingway does and how it works.

**Sections:**
- Text discovery — how hemingway finds editable elements (H1-6, P, SPAN, A, BUTTON, etc.)
- Copy job classification — how it understands element context (headline, CTA, body copy, etc.)
- Section role detection — hero, problem, solution, features, social proof, CTA
- Page brief generation — how it builds context for better alternatives
- Multi-select mode — selecting 2-5 elements for cohesive rewrites
- Inline editing — double-click to edit directly
- Write-back — how changes get written to source files
- Style learning — how preference tracking improves suggestions over time
- Style guide & copy bible — how to configure brand voice

### Changelog (`/changelog`)

Reverse-chronological version history. Follows Keep a Changelog format.

**Format per version:**
```
## v0.1.0 — March 1, 2026

### Added
- Initial release with CLI server, browser overlay, and React component
- AI-powered copy generation with Claude
- Source file write-back
- Multi-element selection
- Inline editing
- Style preference learning
```

For v1 of the site, this will just have the initial release. New versions get added as they ship.

### FAQ (`/faq`)

Common questions organized by category.

**Categories:**
- **General** — What is hemingway? Who is it for? Is it free?
- **Setup** — Does it work with my framework? What models are supported? Do I need an API key?
- **Usage** — How does write-back work? What if it picks the wrong file? Can I use it in production?
- **Privacy & Security** — Does my copy leave my machine? Is it safe to use with client code?

## Demo Adapter

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

Inspired by shiori.sh (clean minimalism) and agentation.dev (interactive demo as centerpiece, cream background, flat docs nav).

## Demo UX

- "Try Hemingway" button in the hero activates the overlay on the marketing page
- Once active, visitors can click any text element to see pre-generated alternatives
- A subtle tooltip explains what's happening on first activation
- Changes persist in sessionStorage across page refreshes
- Closing the tab resets everything
- Demo only runs on the homepage, not on docs pages
