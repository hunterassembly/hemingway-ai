import { readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export interface HemingwayConfig {
  port: number;
  apiKey: string;
  model: string;
  styleGuide: string;
  copyBible: string;
  referenceGuide: string;
  sourcePatterns: string[];
  excludePatterns: string[];
  writeAdapter: "react" | "generic";
  shortcut: string;
  notepadShortcut: string;
  accentColor: string;
}

const DEFAULTS: HemingwayConfig = {
  port: 4800,
  apiKey: "",
  model: "claude-sonnet-4-6",
  styleGuide: "./docs/style-guide.md",
  copyBible: "./docs/copy-bible.md",
  referenceGuide: "./reference/saas-and-services-copy-guide.md",
  sourcePatterns: [
    "components/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "src/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "app/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "pages/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "content/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "site/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
    "packages/**/*.{tsx,jsx,ts,js,mdx,md,html,htm}",
  ],
  excludePatterns: ["node_modules", ".next", "dist", "build"],
  writeAdapter: "react",
  shortcut: "ctrl+shift+h",
  notepadShortcut: "alt+shift+h",
  accentColor: "#3b82f6",
};

const LOCAL_CONFIG_FILENAME = ".hemingway.local.json";

/**
 * Some runtimes (notably certain bundled Next route contexts) can reject
 * dynamic file URL imports for local config modules. For local dev we can
 * safely evaluate simple `export default ...` config modules as a fallback.
 */
function evaluateConfigModuleSource(source: string): Partial<HemingwayConfig> | null {
  if (!/\bexport\s+default\b/.test(source)) return null;
  if (/\bimport\s+/.test(source)) return null;

  const transformed = source.replace(/\bexport\s+default\b/, "return");
  try {
    const evaluator = new Function(transformed);
    const value = evaluator();
    if (value && typeof value === "object") {
      return value as Partial<HemingwayConfig>;
    }
  } catch {
    // ignore fallback parse/eval failures
  }

  return null;
}

/**
 * Try to dynamically import hemingway.config.mjs from the project root.
 */
async function loadConfigFile(projectRoot: string): Promise<Partial<HemingwayConfig> | null> {
  const configPath = join(projectRoot, "hemingway.config.mjs");
  try {
    const fileUrl = pathToFileURL(configPath).href;
    const mod = await import(fileUrl);
    return (mod.default ?? mod) as Partial<HemingwayConfig>;
  } catch {
    try {
      const source = await readFile(configPath, "utf-8");
      const evaluated = evaluateConfigModuleSource(source);
      if (evaluated) return evaluated;
    } catch {
      // Config file doesn't exist or failed to read — that's fine
    }
    return null;
  }
}

/**
 * Read local persisted overrides written by the settings popover.
 */
async function loadLocalConfig(projectRoot: string): Promise<Partial<HemingwayConfig> | null> {
  const localPath = join(projectRoot, LOCAL_CONFIG_FILENAME);
  try {
    const raw = await readFile(localPath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Partial<HemingwayConfig> = {};
    if (typeof parsed.apiKey === "string") {
      next.apiKey = parsed.apiKey;
    }
    return next;
  } catch {
    return null;
  }
}

/**
 * Persist selected local config keys for developer-only runtime conveniences.
 */
export async function persistLocalConfig(
  updates: Partial<Pick<HemingwayConfig, "apiKey">>
): Promise<void> {
  const localPath = join(process.cwd(), LOCAL_CONFIG_FILENAME);
  let current: Record<string, unknown> = {};

  try {
    const raw = await readFile(localPath, "utf-8");
    current = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    current = {};
  }

  if (typeof updates.apiKey === "string") {
    const normalized = updates.apiKey.trim();
    if (normalized.length > 0) {
      current.apiKey = normalized;
    } else {
      delete current.apiKey;
    }
  }

  if (Object.keys(current).length === 0) {
    try {
      await unlink(localPath);
    } catch {
      // ignore missing-file cleanup failures
    }
    return;
  }

  await writeFile(localPath, `${JSON.stringify(current, null, 2)}\n`, "utf-8");
}

/**
 * Try to read the "hemingway" key from the project's package.json.
 */
async function loadPackageJsonConfig(projectRoot: string): Promise<Partial<HemingwayConfig> | null> {
  const pkgPath = join(projectRoot, "package.json");
  try {
    const raw = await readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    if (pkg.hemingway && typeof pkg.hemingway === "object") {
      return pkg.hemingway as Partial<HemingwayConfig>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Load and merge configuration from all sources.
 *
 * Priority (highest to lowest):
 * 1. Explicit overrides passed as argument
 * 2. Environment variables (ANTHROPIC_API_KEY, HEMINGWAY_PORT)
 * 3. Local saved settings (.hemingway.local.json)
 * 4. hemingway.config.mjs
 * 5. package.json "hemingway" key
 * 6. Defaults
 */
export async function loadConfig(
  overrides?: Partial<HemingwayConfig>
): Promise<HemingwayConfig> {
  const projectRoot = process.cwd();

  // Load file-based config (config file takes precedence over package.json)
  const fileConfig = await loadConfigFile(projectRoot);
  const pkgConfig = await loadPackageJsonConfig(projectRoot);
  const localConfig = await loadLocalConfig(projectRoot);

  // Environment variable overrides
  const envOverrides: Partial<HemingwayConfig> = {};
  if (process.env.ANTHROPIC_API_KEY) {
    envOverrides.apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (process.env.HEMINGWAY_PORT) {
    const port = parseInt(process.env.HEMINGWAY_PORT, 10);
    if (!isNaN(port)) {
      envOverrides.port = port;
    }
  }

  // Merge: defaults <- package.json <- config file <- env vars <- explicit overrides
  const merged: HemingwayConfig = {
    ...DEFAULTS,
    ...(pkgConfig ?? {}),
    ...(fileConfig ?? {}),
    ...(localConfig ?? {}),
    ...envOverrides,
    ...(overrides ?? {}),
  };

  // Ensure apiKey falls back to env var if still empty
  if (!merged.apiKey) {
    merged.apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  }

  return merged;
}
