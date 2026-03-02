# API Reference

Hemingway runs a local HTTP server and exposes these routes.

When using Next.js one-process mode with `createNextRouteHandlers`, mount them under `/api/hemingway/*` and use the same route paths below (for example `/api/hemingway/generate`).

## `POST /generate`

Generate alternatives for one selected element.

### Request

```json
{
  "text": "Know what's working. Know what to fix.",
  "elementType": "h1",
  "copyJob": "primary-headline",
  "sectionHtml": "<h1>...</h1><p>...</p>",
  "pagePosition": "Section 1 of 6",
  "sectionRole": "hero",
  "surroundingSections": ["Previous section summary", "Next section summary"],
  "pageBrief": {
    "pageTitle": "Beacon",
    "narrativeStage": "opening",
    "primaryGoal": "Drive conversion to trial, demo, or purchase",
    "corePromise": "Know what's working. Know what to fix.",
    "primaryAudience": ["Product teams", "Developers"],
    "primaryCta": "Start for free",
    "keyProofPoints": ["200+", "SOC 2"],
    "sectionFlow": ["1. hero: ...", "2. features: ..."]
  },
  "userComment": "Shorter and punchier"
}
```

### Response

```json
{
  "alternatives": [
    { "label": "[Clarity] Plainspoken claim", "text": "..." },
    { "label": "[Specificity] Evidence-backed claim", "text": "..." },
    { "label": "[Conversion] Benefit-led close", "text": "..." }
  ]
}
```

## `POST /generate-multi`

Generate coordinated alternatives for multiple selected elements.

### Request

```json
{
  "elements": [
    { "text": "Heading", "elementType": "h2", "copyJob": "section-header" },
    { "text": "Body paragraph", "elementType": "p", "copyJob": "body-copy" }
  ],
  "sectionHtml": "<h2>...</h2><p>...</p>",
  "pagePosition": "Section 3 of 7",
  "sectionRole": "features",
  "surroundingSections": ["...", "..."],
  "pageBrief": {
    "pageTitle": "Beacon",
    "narrativeStage": "middle",
    "primaryGoal": "Educate and persuade with product clarity",
    "corePromise": "Ship confidently with better insight",
    "primaryAudience": ["Product teams"],
    "primaryCta": "Start for free",
    "keyProofPoints": ["95% reduction"],
    "sectionFlow": ["1. hero: ...", "2. problem: ..."]
  },
  "userComment": "More direct"
}
```

### Response

```json
{
  "alternatives": [
    {
      "label": "[Clarity] Narrative bridge",
      "texts": [
        { "index": 1, "text": "..." },
        { "index": 2, "text": "..." }
      ]
    }
  ]
}
```

## `POST /write`

Attempt source writeback for changed copy.

### Request

```json
{
  "oldText": "Original text",
  "newText": "Updated text",
  "context": {
    "tagName": "h1",
    "className": "hero-title",
    "parentTag": "section"
  }
}
```

### Response (success)

```json
{
  "success": true,
  "file": "src/components/Hero.tsx",
  "line": 14,
  "matchCount": 2
}
```

### Response (failure)

```json
{
  "success": false,
  "error": "Text not found in source files: \"...\""
}
```

## `GET /client.js`

Serves browser overlay script.

## `GET /demo`

Serves built-in demo page.

## `GET /health`

Health check:

```json
{ "ok": true }
```

## `GET /config`

Returns safe client-facing config subset.

## `POST /config`

Updates runtime config keys allowed by server (`model`, `styleGuide`, `copyBible`).

## `GET /preferences`

Returns preference counts used for style nudging.

## `POST /preferences`

Records selected alternative label:

```json
{ "label": "[Clarity] Plainspoken claim" }
```
