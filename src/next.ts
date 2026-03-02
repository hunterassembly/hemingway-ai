import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, type HemingwayConfig } from "./server/config.js";
import {
  generateAlternatives,
  generateMultiAlternatives,
  type GenerateRequest,
  type MultiGenerateRequest,
} from "./server/generate.js";
import { writeText } from "./server/write.js";
import { loadPreferences, recordPick, getTopPreferences } from "./server/preferences.js";
import { getDemoHtml } from "./server/demo.js";

type MaybePromise<T> = T | Promise<T>;

interface NextRouteParams {
  path?: string[];
}

interface NextRouteContext {
  params?: MaybePromise<NextRouteParams>;
}

export interface NextHemingwayOptions {
  configOverrides?: Partial<HemingwayConfig>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function textResponse(
  status: number,
  content: string,
  contentType: string,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(content, {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType,
      ...extraHeaders,
    },
  });
}

async function readJsonBody<T>(req: Request): Promise<{ data?: T; error?: string }> {
  try {
    return { data: (await req.json()) as T };
  } catch {
    return { error: "Invalid JSON body" };
  }
}

function getClientConfig(config: HemingwayConfig) {
  return {
    model: config.model,
    styleGuide: config.styleGuide,
    copyBible: config.copyBible,
    shortcut: config.shortcut,
  };
}

async function getPath(context?: NextRouteContext): Promise<string> {
  if (!context?.params) return "";
  const resolved = await Promise.resolve(context.params);
  const segments = Array.isArray(resolved?.path) ? resolved.path : [];
  return segments.join("/");
}

async function serveClientScript(): Promise<Response> {
  const candidates = [
    // Package mode: dist/next.js -> dist/client/overlay.iife.js
    join(__dirname, "client", "overlay.iife.js"),
    // Repo mode fallback
    join(__dirname, "..", "dist", "client", "overlay.iife.js"),
  ];

  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, "utf-8");
      return textResponse(200, content, "application/javascript", {
        "Cache-Control": "no-cache",
      });
    } catch {
      // Try next path
    }
  }

  return textResponse(
    404,
    "Client bundle not found. Run `npm run build` in the hemingway package first.",
    "text/plain"
  );
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function createNextRouteHandlers(options: NextHemingwayOptions = {}) {
  let configPromise: Promise<HemingwayConfig> | null = null;

  const getConfig = async (): Promise<HemingwayConfig> => {
    if (!configPromise) {
      configPromise = loadConfig(options.configOverrides);
    }
    return configPromise;
  };

  const OPTIONS = async (): Promise<Response> => {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  };

  const GET = async (_req: Request, context?: NextRouteContext): Promise<Response> => {
    const path = normalizePath(await getPath(context));
    const config = await getConfig();

    if (path === "health") {
      return jsonResponse(200, { ok: true });
    }

    if (path === "client.js") {
      return serveClientScript();
    }

    if (path === "demo") {
      const html = getDemoHtml(config.port);
      return textResponse(200, html, "text/html");
    }

    if (path === "config") {
      return jsonResponse(200, getClientConfig(config));
    }

    if (path === "preferences") {
      const prefs = await loadPreferences();
      return jsonResponse(200, prefs);
    }

    if (path === "") {
      return jsonResponse(200, {
        ok: true,
        routes: [
          "GET /api/hemingway/health",
          "GET /api/hemingway/client.js",
          "GET /api/hemingway/config",
          "POST /api/hemingway/generate",
          "POST /api/hemingway/generate-multi",
          "POST /api/hemingway/write",
          "GET /api/hemingway/preferences",
          "POST /api/hemingway/preferences",
        ],
      });
    }

    return jsonResponse(404, { error: "Not found" });
  };

  const POST = async (req: Request, context?: NextRouteContext): Promise<Response> => {
    const path = normalizePath(await getPath(context));
    const config = await getConfig();

    if (path === "generate") {
      const { data, error } = await readJsonBody<GenerateRequest>(req);
      if (error || !data) {
        return jsonResponse(400, { error: error ?? "Invalid request body" });
      }
      if (!data.text) {
        return jsonResponse(400, { error: "Missing required field: text" });
      }

      try {
        const prefs = await loadPreferences();
        const topPrefs = getTopPreferences(prefs, 3);
        const prefsBlock =
          topPrefs.length > 0
            ? `This user tends to prefer: ${topPrefs.join(", ")}. Lean toward these principles when they fit the context, but still offer variety.`
            : "";
        const alternatives = await generateAlternatives(data, config, prefsBlock);
        return jsonResponse(200, { alternatives });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse(500, { error: message });
      }
    }

    if (path === "generate-multi") {
      const { data, error } = await readJsonBody<MultiGenerateRequest>(req);
      if (error || !data) {
        return jsonResponse(400, { error: error ?? "Invalid request body" });
      }
      if (!data.elements || !Array.isArray(data.elements) || data.elements.length < 2) {
        return jsonResponse(400, { error: "elements must be an array with at least 2 items" });
      }

      try {
        const prefs = await loadPreferences();
        const topPrefs = getTopPreferences(prefs, 3);
        const prefsBlock =
          topPrefs.length > 0
            ? `This user tends to prefer: ${topPrefs.join(", ")}. Lean toward these principles when they fit the context, but still offer variety.`
            : "";
        const alternatives = await generateMultiAlternatives(data, config, prefsBlock);
        return jsonResponse(200, { alternatives });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse(500, { error: message });
      }
    }

    if (path === "write") {
      const { data, error } = await readJsonBody<{
        oldText: string;
        newText: string;
        context: { tagName: string; className: string; parentTag: string };
      }>(req);
      if (error || !data) {
        return jsonResponse(400, { error: error ?? "Invalid request body" });
      }
      if (!data.oldText || !data.newText) {
        return jsonResponse(400, { error: "Missing required fields: oldText, newText" });
      }

      try {
        const result = await writeText({
          oldText: data.oldText,
          newText: data.newText,
          context: data.context ?? { tagName: "", className: "", parentTag: "" },
          sourcePatterns: config.sourcePatterns,
          excludePatterns: config.excludePatterns,
          writeAdapter: config.writeAdapter,
        });
        const statusCode = result.success
          ? 200
          : result.error?.toLowerCase().includes("not found")
            ? 404
            : 500;
        return jsonResponse(statusCode, result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse(500, { success: false, error: message });
      }
    }

    if (path === "config") {
      const { data, error } = await readJsonBody<Record<string, unknown>>(req);
      if (error || !data) {
        return jsonResponse(400, { error: error ?? "Invalid request body" });
      }

      const updatableKeys = new Set<string>(["model", "styleGuide", "copyBible"]);
      const mutable = config as unknown as Record<string, unknown>;
      for (const key of Object.keys(data)) {
        if (!updatableKeys.has(key)) continue;
        const value = data[key];
        if (typeof value !== "string") continue;
        mutable[key] = value;
      }
      return jsonResponse(200, getClientConfig(config));
    }

    if (path === "preferences") {
      const { data, error } = await readJsonBody<{ label: string }>(req);
      if (error || !data?.label) {
        return jsonResponse(400, { error: error ?? "Missing required field: label" });
      }
      const prefs = await recordPick(data.label);
      return jsonResponse(200, prefs);
    }

    return jsonResponse(404, { error: "Not found" });
  };

  return { GET, POST, OPTIONS };
}
