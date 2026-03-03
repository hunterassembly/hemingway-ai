/**
 * Demo fetch adapter for the hemingway-ai marketing site.
 *
 * Monkey-patches window.fetch so that the hemingway client IIFE
 * (which calls http://localhost:4800) receives pre-generated
 * alternatives instead of hitting a real server.
 *
 * This script MUST be loaded BEFORE the hemingway client bundle.
 */

import alternatives from "./demo-alternatives.json";

/* ---------- constants ---------- */

const HEMINGWAY_URL = "http://localhost:4800";
const PREFERENCES_KEY = "hemingway-demo-preferences";
const EDITS_KEY = "hemingway-demo-edits";

/* ---------- types ---------- */

interface Alternative {
  label: string;
  text: string;
}

type AlternativesMap = Record<string, Alternative[]>;

interface GenerateBody {
  text: string;
  elementType?: string;
  copyJob?: string;
  sectionHtml?: string;
}

interface GenerateMultiElement {
  text: string;
  elementType?: string;
  copyJob?: string;
}

interface GenerateMultiBody {
  elements: GenerateMultiElement[];
  sectionHtml?: string;
}

interface WriteBody {
  oldText: string;
  newText: string;
  context?: string;
}

interface PreferencesBody {
  label: string;
}

interface Preferences {
  picks: Record<string, number>;
  totalPicks: number;
}

/* ---------- keep a reference to the real fetch ---------- */

const realFetch = window.fetch.bind(window);

/* ---------- helpers ---------- */

/** Build a JSON Response with the given body and status. */
function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Delay for `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Look up pre-generated alternatives for the given text.
 *
 * 1. Normalise to lowercase / trimmed.
 * 2. Try an exact match.
 * 3. Fall back to fuzzy substring matching (the map key is contained in the
 *    input, or the input is contained in a map key).
 * 4. Return null when nothing matches.
 */
function findAlternatives(text: string): Alternative[] | null {
  const map = alternatives as AlternativesMap;
  const normalised = text.toLowerCase().trim();

  // Exact match
  if (map[normalised]) {
    return map[normalised];
  }

  // Fuzzy: check if any key is a substring of the input or vice-versa
  for (const key of Object.keys(map)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      return map[key];
    }
  }

  return null;
}

/** Generic fallback alternatives when no pre-generated match exists. */
function fallbackAlternatives(text: string): Alternative[] {
  const trimmed = text.trim();
  return [
    { label: "[Clarity]", text: `${trimmed} (clearer)` },
    { label: "[Specificity]", text: `${trimmed} (more specific)` },
    { label: "[Conversion]", text: `${trimmed} (more action-oriented)` },
  ];
}

/* ---------- sessionStorage helpers ---------- */

function loadPreferences(): Preferences {
  try {
    const raw = sessionStorage.getItem(PREFERENCES_KEY);
    if (raw) return JSON.parse(raw) as Preferences;
  } catch {
    /* ignore */
  }
  return { picks: {}, totalPicks: 0 };
}

function savePreferences(prefs: Preferences): void {
  sessionStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

function appendEdit(edit: { oldText: string; newText: string }): void {
  try {
    const raw = sessionStorage.getItem(EDITS_KEY);
    const edits: { oldText: string; newText: string }[] = raw
      ? (JSON.parse(raw) as { oldText: string; newText: string }[])
      : [];
    edits.push(edit);
    sessionStorage.setItem(EDITS_KEY, JSON.stringify(edits));
  } catch {
    /* ignore */
  }
}

/* ---------- route handlers ---------- */

async function handleGetConfig(): Promise<Response> {
  return mockResponse({
    model: "claude-sonnet-4-6",
    shortcut: "ctrl+shift+h",
    styleGuide: "",
    copyBible: "",
  });
}

async function handlePostConfig(_body: unknown): Promise<Response> {
  // No-op in demo mode -- return the same fixed config
  return handleGetConfig();
}

async function handlePostGenerate(body: GenerateBody): Promise<Response> {
  await delay(600 + Math.random() * 400);

  const found = findAlternatives(body.text);
  const alts = found ?? fallbackAlternatives(body.text);

  return mockResponse({ alternatives: alts });
}

async function handlePostGenerateMulti(
  body: GenerateMultiBody,
): Promise<Response> {
  await delay(800 + Math.random() * 400);

  // For each element, look up alternatives (or use fallback)
  const perElement = body.elements.map((el) => {
    const found = findAlternatives(el.text);
    return found ?? fallbackAlternatives(el.text);
  });

  // Build 3 alternative sets by picking the nth alternative from each element
  const alternativeSets = [0, 1, 2].map((altIndex) => {
    // Grab the label from the first element's nth alternative
    const label = perElement[0]?.[altIndex]?.label ?? `[Option ${altIndex + 1}]`;
    const texts = perElement.map((alts, elementIndex) => ({
      index: elementIndex,
      text: alts[altIndex]?.text ?? alts[0]?.text ?? "",
    }));
    return { label, texts };
  });

  return mockResponse({ alternatives: alternativeSets });
}

async function handlePostWrite(body: WriteBody): Promise<Response> {
  appendEdit({ oldText: body.oldText, newText: body.newText });
  return mockResponse({ success: true, file: "demo", line: 1 });
}

async function handleGetPreferences(): Promise<Response> {
  return mockResponse(loadPreferences());
}

async function handlePostPreferences(body: PreferencesBody): Promise<Response> {
  const prefs = loadPreferences();
  prefs.picks[body.label] = (prefs.picks[body.label] ?? 0) + 1;
  prefs.totalPicks += 1;
  savePreferences(prefs);
  return mockResponse(prefs);
}

/* ---------- fetch interceptor ---------- */

async function interceptedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  // Pass through anything that is not aimed at the hemingway server
  if (!url.startsWith(HEMINGWAY_URL)) {
    return realFetch(input, init);
  }

  const path = url.slice(HEMINGWAY_URL.length);
  const method = (init?.method ?? "GET").toUpperCase();

  // Parse JSON body when present
  let body: unknown = null;
  if (init?.body) {
    try {
      body = JSON.parse(
        typeof init.body === "string" ? init.body : new TextDecoder().decode(init.body as BufferSource),
      );
    } catch {
      /* body is not JSON -- leave as null */
    }
  }

  // Route to the appropriate handler
  if (path === "/config" && method === "GET") {
    return handleGetConfig();
  }
  if (path === "/config" && method === "POST") {
    return handlePostConfig(body);
  }
  if (path === "/generate" && method === "POST") {
    return handlePostGenerate(body as GenerateBody);
  }
  if (path === "/generate-multi" && method === "POST") {
    return handlePostGenerateMulti(body as GenerateMultiBody);
  }
  if (path === "/write" && method === "POST") {
    return handlePostWrite(body as WriteBody);
  }
  if (path === "/preferences" && method === "GET") {
    return handleGetPreferences();
  }
  if (path === "/preferences" && method === "POST") {
    return handlePostPreferences(body as PreferencesBody);
  }

  // Unknown hemingway path
  return mockResponse({ error: "Demo mode" }, 404);
}

/* ---------- install ---------- */

window.fetch = interceptedFetch as typeof window.fetch;
