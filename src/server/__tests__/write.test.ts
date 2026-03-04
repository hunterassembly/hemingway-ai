import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";

// Shared mock state — vi.hoisted ensures availability in the mock factory
const { state } = vi.hoisted(() => ({
  state: {
    readCounts: new Map<string, number>(),
    readOverrides: new Map<string, (callNum: number) => string | null>(),
    writes: new Map<string, string>(),
  },
}));

vi.mock("node:fs/promises", async () => {
  const actual =
    await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    stat: async (...args: any[]) => {
      return (actual as any).stat(...args);
    },
    readFile: async (...args: any[]) => {
      const p = String(args[0]);
      const n = (state.readCounts.get(p) ?? 0) + 1;
      state.readCounts.set(p, n);

      const fn = state.readOverrides.get(p);
      if (fn) {
        const r = fn(n);
        if (r !== null) return r;
      }
      return (actual as any).readFile(...args);
    },
    writeFile: async (...args: any[]) => {
      state.writes.set(String(args[0]), String(args[1]));
      return (actual as any).writeFile(...args);
    },
  };
});

import { writeText } from "../write.js";

// Use the actual (unmocked) fs for test setup / teardown / assertions
const actualFs =
  await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

const FIXTURES = join(process.cwd(), ".test-fixtures");
const HERO_DIR = join(FIXTURES, "src", "components");
const HERO_FILE = join(HERO_DIR, "Hero.tsx");

const HERO_TSX = `export function Hero() {
  return (
    <section className="hero">
      <h1>Welcome to Our Site</h1>
      <a href="/work" className="cta-button">See Work</a>
    </section>
  );
}`;

const CTX = { tagName: "a", className: "cta-button", parentTag: "section" };
const PATTERNS = [".test-fixtures/src/**/*.tsx"];
const EXCLUDE = ["node_modules"];

describe("writeText", () => {
  beforeEach(async () => {
    state.readCounts.clear();
    state.readOverrides.clear();
    state.writes.clear();
    await actualFs.mkdir(HERO_DIR, { recursive: true });
    await actualFs.writeFile(HERO_FILE, HERO_TSX, "utf-8");
  });

  afterEach(async () => {
    await actualFs.rm(FIXTURES, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Happy path — file stays stable between scan and replace
  // -----------------------------------------------------------------------
  it("replaces text in the correct file", async () => {
    const result = await writeText({
      oldText: "See Work",
      newText: "Browse Work",
      context: CTX,
      sourcePatterns: PATTERNS,
      excludePatterns: EXCLUDE,
    });

    expect(result.success).toBe(true);
    expect(result.file).toContain("Hero.tsx");

    const content = await actualFs.readFile(HERO_FILE, "utf-8");
    expect(content).toContain("Browse Work");
    expect(content).not.toContain("See Work");
    // Rest of file preserved
    expect(content).toContain("<h1>Welcome to Our Site</h1>");
    expect(content).toContain("export function Hero()");
  });

  // -----------------------------------------------------------------------
  // Sequential double write — the exact bug scenario (change text, then revert)
  // -----------------------------------------------------------------------
  it("handles double write (See Work → Browse Work → See Work) without corruption", async () => {
    const r1 = await writeText({
      oldText: "See Work",
      newText: "Browse Work",
      context: CTX,
      sourcePatterns: PATTERNS,
      excludePatterns: EXCLUDE,
    });
    expect(r1.success).toBe(true);

    state.readCounts.clear();

    const r2 = await writeText({
      oldText: "Browse Work",
      newText: "See Work",
      context: CTX,
      sourcePatterns: PATTERNS,
      excludePatterns: EXCLUDE,
    });
    expect(r2.success).toBe(true);

    const content = await actualFs.readFile(HERO_FILE, "utf-8");
    expect(content).toBe(HERO_TSX);
  });

  // -----------------------------------------------------------------------
  // TOCTOU: file content shifts between scan and re-read
  // (e.g. dev server hot-reload prepends a comment)
  // -----------------------------------------------------------------------
  it("recovers when file content shifts between scan and replace", async () => {
    const shifted = "/* hot-reload */\n" + HERO_TSX;

    // 1st readFile (scan) → real file on disk
    // 2nd readFile (re-read) → shifted content
    state.readOverrides.set(HERO_FILE, (n) => (n >= 2 ? shifted : null));

    const result = await writeText({
      oldText: "See Work",
      newText: "Browse Work",
      context: CTX,
      sourcePatterns: PATTERNS,
      excludePatterns: EXCLUDE,
    });

    expect(result.success).toBe(true);

    const written = state.writes.get(HERO_FILE)!;
    expect(written).toBeDefined();
    expect(written).toContain("Browse Work");
    expect(written).not.toContain("See Work");
    // Shifted content preserved
    expect(written).toContain("/* hot-reload */");
    expect(written).toContain("<h1>Welcome to Our Site</h1>");
    expect(written).toContain("export function Hero()");
  });

  // -----------------------------------------------------------------------
  // TOCTOU: text removed between scan and re-read
  // (e.g. another write landed first and changed the text)
  // -----------------------------------------------------------------------
  it("returns error when text is removed between scan and replace", async () => {
    const noMatch = HERO_TSX.replace("See Work", "View Projects");

    state.readOverrides.set(HERO_FILE, (n) => (n >= 2 ? noMatch : null));

    const result = await writeText({
      oldText: "See Work",
      newText: "Browse Work",
      context: CTX,
      sourcePatterns: PATTERNS,
      excludePatterns: EXCLUDE,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/File changed/);
    // No write should have occurred
    expect(state.writes.has(HERO_FILE)).toBe(false);
  });
});
