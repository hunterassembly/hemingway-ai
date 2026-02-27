import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, type HemingwayConfig } from "./config.js";
import {
  generateAlternatives,
  generateMultiAlternatives,
  type GenerateRequest,
  type MultiGenerateRequest,
} from "./generate.js";
import { writeText } from "./write.js";
import { loadPreferences, recordPick, getTopPreferences } from "./preferences.js";
import { getDemoHtml } from "./demo.js";

// ---------------------------------------------------------------------------
// Re-exports for consumer convenience
// ---------------------------------------------------------------------------

export { loadConfig, type HemingwayConfig } from "./config.js";
export {
  generateAlternatives,
  generateMultiAlternatives,
  type GenerateRequest,
  type MultiGenerateRequest,
  type Alternative,
  type MultiAlternative,
} from "./generate.js";
export { writeText } from "./write.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read the full request body as a string.
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

/**
 * Send a JSON response.
 */
function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Set CORS headers for localhost development.
 */
function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * Parse JSON body with error handling.
 */
function parseJsonBody<T>(raw: string): { data?: T; error?: string } {
  try {
    return { data: JSON.parse(raw) as T };
  } catch {
    return { error: "Invalid JSON body" };
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleGenerate(
  req: IncomingMessage,
  res: ServerResponse,
  config: HemingwayConfig
): Promise<void> {
  const raw = await readBody(req);
  const { data, error } = parseJsonBody<GenerateRequest>(raw);

  if (error || !data) {
    sendJson(res, 400, { error: error ?? "Invalid request body" });
    return;
  }

  if (!data.text) {
    sendJson(res, 400, { error: "Missing required field: text" });
    return;
  }

  try {
    // Load style preferences for prompt injection
    const prefs = await loadPreferences();
    const topPrefs = getTopPreferences(prefs, 3);
    const prefsBlock = topPrefs.length > 0
      ? `This user tends to prefer: ${topPrefs.join(", ")}. Lean toward these principles when they fit the context, but still offer variety.`
      : "";

    const alternatives = await generateAlternatives(data, config, prefsBlock);
    sendJson(res, 200, { alternatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Hemingway] Generate error:", message);
    sendJson(res, 500, { error: message });
  }
}

async function handleGenerateMulti(
  req: IncomingMessage,
  res: ServerResponse,
  config: HemingwayConfig
): Promise<void> {
  const raw = await readBody(req);
  const { data, error } = parseJsonBody<MultiGenerateRequest>(raw);

  if (error || !data) {
    sendJson(res, 400, { error: error ?? "Invalid request body" });
    return;
  }

  if (!data.elements || !Array.isArray(data.elements) || data.elements.length < 2) {
    sendJson(res, 400, { error: "elements must be an array with at least 2 items" });
    return;
  }

  try {
    const prefs = await loadPreferences();
    const topPrefs = getTopPreferences(prefs, 3);
    const prefsBlock = topPrefs.length > 0
      ? `This user tends to prefer: ${topPrefs.join(", ")}. Lean toward these principles when they fit the context, but still offer variety.`
      : "";

    const alternatives = await generateMultiAlternatives(data, config, prefsBlock);
    sendJson(res, 200, { alternatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Hemingway] Multi-generate error:", message);
    sendJson(res, 500, { error: message });
  }
}

async function handleWrite(
  req: IncomingMessage,
  res: ServerResponse,
  config: HemingwayConfig
): Promise<void> {
  const raw = await readBody(req);
  const { data, error } = parseJsonBody<{
    oldText: string;
    newText: string;
    context: { tagName: string; className: string; parentTag: string };
  }>(raw);

  if (error || !data) {
    sendJson(res, 400, { error: error ?? "Invalid request body" });
    return;
  }

  if (!data.oldText || !data.newText) {
    sendJson(res, 400, { error: "Missing required fields: oldText, newText" });
    return;
  }

  try {
    const result = await writeText({
      oldText: data.oldText,
      newText: data.newText,
      context: data.context ?? { tagName: "", className: "", parentTag: "" },
      sourcePatterns: config.sourcePatterns,
      excludePatterns: config.excludePatterns,
    });

    const statusCode = result.success ? 200 : result.error?.includes("not found") ? 404 : 500;
    sendJson(res, statusCode, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Hemingway] Write error:", message);
    sendJson(res, 500, { success: false, error: message });
  }
}

async function handleClientJs(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Try multiple possible locations for the IIFE bundle
  const candidates = [
    // When running from dist/ (production)
    join(__dirname, "..", "client", "overlay.iife.js"),
    // When running from src/ via ts-node/tsx (development)
    join(__dirname, "..", "..", "dist", "client", "overlay.iife.js"),
  ];

  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, "utf-8");
      res.writeHead(200, {
        "Content-Type": "application/javascript",
        "Content-Length": Buffer.byteLength(content),
        "Cache-Control": "no-cache",
      });
      res.end(content);
      return;
    } catch {
      // Try next candidate
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Client bundle not found. Run `npm run build` in the hemingway package first.");
}

function handleHealth(_req: IncomingMessage, res: ServerResponse): void {
  sendJson(res, 200, { ok: true });
}

function handleDemo(
  _req: IncomingMessage,
  res: ServerResponse,
  config: HemingwayConfig
): void {
  const html = getDemoHtml(config.port);
  res.writeHead(200, {
    "Content-Type": "text/html",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

async function handleGetPreferences(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const prefs = await loadPreferences();
  sendJson(res, 200, prefs);
}

async function handlePostPreferences(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const raw = await readBody(req);
  const { data, error } = parseJsonBody<{ label: string }>(raw);

  if (error || !data?.label) {
    sendJson(res, 400, { error: error ?? "Missing required field: label" });
    return;
  }

  const prefs = await recordPick(data.label);
  sendJson(res, 200, prefs);
}

/** Fields safe to expose to the client (no apiKey, port, etc). */
function getClientConfig(config: HemingwayConfig) {
  return {
    model: config.model,
    styleGuide: config.styleGuide,
    copyBible: config.copyBible,
    shortcut: config.shortcut,
  };
}

function handleGetConfig(
  _req: IncomingMessage,
  res: ServerResponse,
  config: HemingwayConfig
): void {
  sendJson(res, 200, getClientConfig(config));
}

/** Keys the client is allowed to update at runtime. */
const UPDATABLE_KEYS = new Set<string>(["model", "styleGuide", "copyBible"]);

async function handlePostConfig(
  req: IncomingMessage,
  res: ServerResponse,
  config: HemingwayConfig
): Promise<void> {
  const raw = await readBody(req);
  const { data, error } = parseJsonBody<Record<string, unknown>>(raw);

  if (error || !data) {
    sendJson(res, 400, { error: error ?? "Invalid request body" });
    return;
  }

  const changedKeys: string[] = [];
  const mutable = config as unknown as Record<string, unknown>;

  for (const key of Object.keys(data)) {
    if (!UPDATABLE_KEYS.has(key)) continue;
    const value = data[key];
    if (typeof value !== "string") continue;
    if (mutable[key] !== value) {
      mutable[key] = value;
      changedKeys.push(key);
    }
  }

  if (changedKeys.length > 0) {
    console.log(`[Hemingway] Config updated: ${changedKeys.join(", ")}`);
  }

  sendJson(res, 200, getClientConfig(config));
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export async function startServer(
  configOverrides?: Partial<HemingwayConfig>
): Promise<void> {
  const config = await loadConfig(configOverrides);

  // Production guard — warn but don't block
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[Hemingway] WARNING: Running in production mode. " +
        "Hemingway is intended for development use only."
    );
  }

  const server = createServer(async (req, res) => {
    setCorsHeaders(res);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://localhost:${config.port}`);
    const pathname = url.pathname;

    try {
      if (req.method === "POST" && pathname === "/generate") {
        await handleGenerate(req, res, config);
      } else if (req.method === "POST" && pathname === "/generate-multi") {
        await handleGenerateMulti(req, res, config);
      } else if (req.method === "POST" && pathname === "/write") {
        await handleWrite(req, res, config);
      } else if (req.method === "GET" && pathname === "/client.js") {
        await handleClientJs(req, res);
      } else if (req.method === "GET" && pathname === "/health") {
        handleHealth(req, res);
      } else if (req.method === "GET" && pathname === "/demo") {
        handleDemo(req, res, config);
      } else if (req.method === "GET" && pathname === "/config") {
        handleGetConfig(req, res, config);
      } else if (req.method === "POST" && pathname === "/config") {
        await handlePostConfig(req, res, config);
      } else if (req.method === "GET" && pathname === "/preferences") {
        await handleGetPreferences(req, res);
      } else if (req.method === "POST" && pathname === "/preferences") {
        await handlePostPreferences(req, res);
      } else {
        sendJson(res, 404, { error: "Not found" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Hemingway] Unhandled error:", message);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "Internal server error" });
      }
    }
  });

  server.listen(config.port, () => {
    console.log("");
    console.log("  \x1b[1m\x1b[34m✎ Hemingway\x1b[0m");
    console.log(`  Server running at \x1b[36mhttp://localhost:${config.port}\x1b[0m`);
    console.log(`  Demo page:        \x1b[36mhttp://localhost:${config.port}/demo\x1b[0m`);
    console.log("");
    console.log(`  Routes:`);
    console.log(`    POST /generate       — Generate copy alternatives`);
    console.log(`    POST /generate-multi — Generate multi-element alternatives`);
    console.log(`    POST /write          — Write chosen text to source`);
    console.log(`    GET  /client.js   — Browser overlay script`);
    console.log(`    GET  /demo        — Demo page with overlay`);
    console.log(`    GET  /health      — Health check`);
    console.log(`    GET  /config      — Read current config`);
    console.log(`    POST /config      — Update config (model, styleGuide, copyBible)`);
    console.log(`    GET  /preferences — Read style preferences`);
    console.log(`    POST /preferences — Record a style pick`);
    console.log("");
    console.log(`  Model: ${config.model}`);
    console.log(`  API key: ${config.apiKey ? "✓ configured" : "✗ missing"}`);
    console.log(`  Style guide: ${config.styleGuide}`);
    console.log(`  Copy bible: ${config.copyBible}`);
    console.log(`  Source patterns: ${config.sourcePatterns.join(", ")}`);
    console.log("");

    if (!config.apiKey) {
      console.warn(
        "  \x1b[33m⚠ No API key found. Set ANTHROPIC_API_KEY or add apiKey to config.\x1b[0m"
      );
      console.log("");
    }
  });
}

// ---------------------------------------------------------------------------
// Auto-start when executed as main module
// ---------------------------------------------------------------------------

// Detect if this file is the entry point
const isMainModule = (() => {
  try {
    // In ESM, check if the script URL matches import.meta.url
    const scriptArg = process.argv[1];
    if (!scriptArg) return false;

    // Handle both file paths and file URLs
    const scriptUrl = scriptArg.startsWith("file://")
      ? scriptArg
      : new URL(`file://${scriptArg}`).href;

    return import.meta.url === scriptUrl || import.meta.url.endsWith(scriptArg);
  } catch {
    return false;
  }
})();

if (isMainModule) {
  startServer().catch((err) => {
    console.error("[Hemingway] Failed to start:", err);
    process.exit(1);
  });
}
