import { readFile } from "node:fs/promises";
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
  shortcut: string;
  accentColor: string;
}

const DEFAULTS: HemingwayConfig = {
  port: 4800,
  apiKey: "",
  model: "claude-sonnet-4-6",
  styleGuide: "./docs/style-guide.md",
  copyBible: "./docs/copy-bible.md",
  referenceGuide: "./packages/hemingway/reference/saas-and-services-copy-guide.md",
  sourcePatterns: ["components/**/*.tsx", "src/**/*.tsx", "src/**/*.ts", "app/**/*.tsx"],
  excludePatterns: ["node_modules", ".next", "dist", "build"],
  shortcut: "ctrl+shift+h",
  accentColor: "#3b82f6",
};

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
    // Config file doesn't exist or failed to load — that's fine
    return null;
  }
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
 * 3. hemingway.config.mjs
 * 4. package.json "hemingway" key
 * 5. Defaults
 */
export async function loadConfig(
  overrides?: Partial<HemingwayConfig>
): Promise<HemingwayConfig> {
  const projectRoot = process.cwd();

  // Load file-based config (config file takes precedence over package.json)
  const fileConfig = await loadConfigFile(projectRoot);
  const pkgConfig = await loadPackageJsonConfig(projectRoot);

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
    ...envOverrides,
    ...(overrides ?? {}),
  };

  // Ensure apiKey falls back to env var if still empty
  if (!merged.apiKey) {
    merged.apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  }

  return merged;
}
