import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StylePreferences {
  picks: Record<string, number>;
  totalPicks: number;
}

// ---------------------------------------------------------------------------
// File path
// ---------------------------------------------------------------------------

const PREFS_DIR = join(process.cwd(), ".hemingway");
const PREFS_FILE = join(PREFS_DIR, "preferences.json");

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

export async function loadPreferences(): Promise<StylePreferences> {
  try {
    const raw = await readFile(PREFS_FILE, "utf-8");
    const data = JSON.parse(raw) as StylePreferences;
    return {
      picks: data.picks ?? {},
      totalPicks: data.totalPicks ?? 0,
    };
  } catch {
    return { picks: {}, totalPicks: 0 };
  }
}

export async function recordPick(label: string): Promise<StylePreferences> {
  const prefs = await loadPreferences();

  prefs.picks[label] = (prefs.picks[label] ?? 0) + 1;
  prefs.totalPicks += 1;

  await mkdir(PREFS_DIR, { recursive: true });
  await writeFile(PREFS_FILE, JSON.stringify(prefs, null, 2), "utf-8");

  return prefs;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export function getTopPreferences(prefs: StylePreferences, n: number): string[] {
  if (prefs.totalPicks === 0) return [];

  return Object.entries(prefs.picks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([label, count]) => {
      const pct = Math.round((count / prefs.totalPicks) * 100);
      return `${label} (${pct}%)`;
    });
}
