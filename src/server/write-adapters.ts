import { extname } from "node:path";

interface WriteContext {
  tagName: string;
  className: string;
  parentTag: string;
}

interface MatchScoringInput {
  filePath: string;
  source: string;
  matchIndex: number;
  context: WriteContext;
}

interface ReplacementInput {
  filePath: string;
  originalSpan: string;
  replacement: string;
}

export interface WriteAdapter {
  id: string;
  supportsFile: (filePath: string) => boolean;
  scoreMatch?: (input: MatchScoringInput) => number;
  normalizeReplacement?: (input: ReplacementInput) => string;
}

const REACT_EXTENSIONS = new Set([".tsx", ".jsx", ".ts", ".js", ".mdx", ".html", ".htm"]);

function getSurrounding(source: string, matchIndex: number): string {
  return source.substring(Math.max(0, matchIndex - 220), matchIndex + 220);
}

function normalizeWithEntities(originalSpan: string, replacement: string): string {
  let normalized = replacement;

  if (originalSpan.includes("&apos;")) {
    normalized = normalized.replace(/'/g, "&apos;");
  }
  if (originalSpan.includes("&quot;")) {
    normalized = normalized.replace(/"/g, "&quot;");
  }
  if (originalSpan.includes("&amp;")) {
    normalized = normalized.replace(/&/g, "&amp;");
  }
  if (originalSpan.includes("&lt;")) {
    normalized = normalized.replace(/</g, "&lt;");
  }
  if (originalSpan.includes("&gt;")) {
    normalized = normalized.replace(/>/g, "&gt;");
  }
  if (originalSpan.includes("\u2019")) {
    normalized = normalized.replace(/'/g, "\u2019");
  }

  return normalized;
}

const genericAdapter: WriteAdapter = {
  id: "generic",
  supportsFile: () => true,
  normalizeReplacement: ({ originalSpan, replacement }) =>
    normalizeWithEntities(originalSpan, replacement),
};

const reactAdapter: WriteAdapter = {
  id: "react",
  supportsFile: (filePath) => REACT_EXTENSIONS.has(extname(filePath).toLowerCase()),
  scoreMatch: ({ filePath, source, matchIndex, context }) => {
    let score = 0;
    const surrounding = getSurrounding(source, matchIndex);

    if (/className=/.test(surrounding)) score += 4;
    if (context.className) {
      const classNames = context.className.split(/\s+/).slice(0, 3);
      for (const cls of classNames) {
        if (cls && surrounding.includes(cls)) score += 3;
      }
    }

    const jsxTagPattern = new RegExp(`<${context.tagName}[\\s/>]`, "i");
    if (jsxTagPattern.test(surrounding)) score += 3;

    if (filePath.includes("/components/")) score += 2;
    if (filePath.includes("/src/")) score += 1;

    return score;
  },
  normalizeReplacement: ({ originalSpan, replacement }) =>
    normalizeWithEntities(originalSpan, replacement),
};

const ADAPTERS: Record<string, WriteAdapter> = {
  generic: genericAdapter,
  react: reactAdapter,
};

export function getWriteAdapter(adapterId?: string): WriteAdapter {
  if (!adapterId) return reactAdapter;
  return ADAPTERS[adapterId] ?? reactAdapter;
}
