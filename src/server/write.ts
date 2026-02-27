import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const PROJECT_ROOT = process.cwd();

interface Match {
  file: string;
  index: number;
  line: number;
  originalSpan: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Glob matching
// ---------------------------------------------------------------------------

/**
 * Basic glob matcher supporting `**` (recursive) and `*` (single-level).
 * Compiles a glob pattern into a RegExp that tests against a relative path.
 */
function globToRegExp(pattern: string): RegExp {
  // Escape regex special chars except * and /
  let re = "";
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "*" && pattern[i + 1] === "*") {
      // ** — match any number of path segments (including zero)
      re += ".*";
      i += 2;
      // Skip trailing slash after **
      if (pattern[i] === "/") i++;
    } else if (ch === "*") {
      // * — match anything except /
      re += "[^/]*";
      i++;
    } else if (".+^${}()|[]\\".includes(ch)) {
      re += "\\" + ch;
      i++;
    } else {
      re += ch;
      i++;
    }
  }
  return new RegExp("^" + re + "$");
}

/**
 * Check if any segment of the relative path matches an exclude pattern.
 */
function isExcluded(relativePath: string, excludePatterns: string[]): boolean {
  const segments = relativePath.split("/");
  for (const pattern of excludePatterns) {
    for (const segment of segments) {
      if (segment === pattern) return true;
    }
  }
  return false;
}

/**
 * Recursively collect all files under `dir`, returning paths relative
 * to the project root.
 */
async function collectFiles(
  dir: string,
  excludePatterns: string[]
): Promise<string[]> {
  const files: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (excludePatterns.includes(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, excludePatterns)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Get source files matching the given glob patterns, excluding directories
 * that match exclude patterns.
 */
async function getSourceFiles(
  patterns: string[],
  excludePatterns: string[]
): Promise<string[]> {
  const matchedFiles = new Set<string>();

  // Build regexes from patterns
  const regexes = patterns.map(globToRegExp);

  // Determine base directories to scan from patterns
  const baseDirs = new Set<string>();
  for (const pattern of patterns) {
    // Extract the leading static portion of the pattern
    const firstWild = pattern.search(/[*?[{]/);
    if (firstWild === -1) {
      // No wildcard — treat as literal file
      baseDirs.add(pattern);
    } else {
      const base = pattern.substring(0, firstWild).replace(/\/+$/, "") || ".";
      baseDirs.add(base);
    }
  }

  for (const base of baseDirs) {
    const absBase = join(PROJECT_ROOT, base);
    const allFiles = await collectFiles(absBase, excludePatterns);

    for (const absFile of allFiles) {
      const rel = relative(PROJECT_ROOT, absFile);
      if (isExcluded(rel, excludePatterns)) continue;

      for (const regex of regexes) {
        if (regex.test(rel)) {
          matchedFiles.add(absFile);
          break;
        }
      }
    }
  }

  return Array.from(matchedFiles);
}

// ---------------------------------------------------------------------------
// Text matching (ported identically from app/api/edit-text/route.ts)
// ---------------------------------------------------------------------------

/**
 * Normalize whitespace: collapse all runs of whitespace to single space.
 */
function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Generate HTML entity variants of the given text.
 */
function entityVariants(text: string): string[] {
  const variants = [text];

  // Variant with common HTML entities
  const entityEncoded = text
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (entityEncoded !== text) variants.push(entityEncoded);

  // Variant with just apostrophe entities (most common case)
  const apostropheOnly = text.replace(/'/g, "&apos;");
  if (apostropheOnly !== text && apostropheOnly !== entityEncoded) {
    variants.push(apostropheOnly);
  }

  // Variant with curly quotes
  const curlyApos = text.replace(/'/g, "\u2019");
  if (curlyApos !== text) variants.push(curlyApos);

  return variants;
}

/**
 * Find all occurrences of `searchText` in `source`, handling whitespace
 * normalization as a fallback.
 */
function findMatches(
  source: string,
  searchText: string
): { index: number; length: number }[] {
  const matches: { index: number; length: number }[] = [];

  // Try direct search first
  let idx = source.indexOf(searchText);
  while (idx !== -1) {
    matches.push({ index: idx, length: searchText.length });
    idx = source.indexOf(searchText, idx + 1);
  }

  if (matches.length > 0) return matches;

  // Whitespace-normalized search: find spans in source that match when normalized
  const normalizedSearch = normalizeWs(searchText);
  if (!normalizedSearch) return matches;

  // Slide through the source looking for normalized matches
  const sourceLen = source.length;
  let i = 0;
  while (i < sourceLen) {
    // Skip to first non-whitespace that could start a match
    const firstChar = normalizedSearch[0];
    const pos = source.indexOf(firstChar, i);
    if (pos === -1) break;

    // Try to match from this position by expanding the window
    let srcIdx = pos;
    let searchIdx = 0;
    const start = pos;

    while (srcIdx < sourceLen && searchIdx < normalizedSearch.length) {
      const srcChar = source[srcIdx];
      const searchChar = normalizedSearch[searchIdx];

      if (srcChar === searchChar) {
        srcIdx++;
        searchIdx++;
      } else if (/\s/.test(srcChar) && /\s/.test(searchChar)) {
        // Both are whitespace — consume all whitespace on both sides
        while (srcIdx < sourceLen && /\s/.test(source[srcIdx])) srcIdx++;
        while (
          searchIdx < normalizedSearch.length &&
          /\s/.test(normalizedSearch[searchIdx])
        )
          searchIdx++;
      } else if (/\s/.test(srcChar)) {
        // Source has extra whitespace
        srcIdx++;
      } else {
        break;
      }
    }

    if (searchIdx === normalizedSearch.length) {
      matches.push({ index: start, length: srcIdx - start });
    }

    i = pos + 1;
  }

  return matches;
}

/**
 * Get the 1-based line number for a character index in the source string.
 */
function getLineNumber(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === "\n") line++;
  }
  return line;
}

/**
 * Score a match based on surrounding HTML context clues.
 */
function scoreMatch(
  source: string,
  matchIndex: number,
  context: { tagName: string; className: string; parentTag: string }
): number {
  let score = 0;
  // Look for the tag name near the match
  const surrounding = source.substring(
    Math.max(0, matchIndex - 200),
    matchIndex + 200
  );

  const tagPattern = new RegExp(`<${context.tagName}[\\s>]`, "i");
  if (tagPattern.test(surrounding)) score += 10;

  if (context.className) {
    const classNames = context.className.split(/\s+/).slice(0, 3);
    for (const cls of classNames) {
      if (cls && surrounding.includes(cls)) score += 5;
    }
  }

  if (context.parentTag) {
    const parentPattern = new RegExp(`<${context.parentTag}[\\s>]`, "i");
    if (parentPattern.test(surrounding)) score += 3;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function writeText(params: {
  oldText: string;
  newText: string;
  context: { tagName: string; className: string; parentTag: string };
  sourcePatterns: string[];
  excludePatterns: string[];
}): Promise<{
  success: boolean;
  file?: string;
  line?: number;
  matchCount?: number;
  error?: string;
}> {
  const { oldText, newText, context, sourcePatterns, excludePatterns } = params;

  if (!oldText || !newText || oldText === newText) {
    return {
      success: false,
      error: "oldText and newText are required and must differ",
    };
  }

  // Scan source files
  let sourceFiles: string[];
  try {
    sourceFiles = await getSourceFiles(sourcePatterns, excludePatterns);
  } catch (err) {
    return {
      success: false,
      error: `Failed to scan source files: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const allMatches: Match[] = [];

  for (const file of sourceFiles) {
    // Skip editor-related files
    if (file.includes("/editor/")) continue;

    let source: string;
    try {
      source = await readFile(file, "utf-8");
    } catch {
      continue;
    }

    // Try each text variant (raw, entity-encoded, etc.)
    const variants = entityVariants(oldText);
    for (const variant of variants) {
      const matches = findMatches(source, variant);
      for (const m of matches) {
        allMatches.push({
          file,
          index: m.index,
          line: getLineNumber(source, m.index),
          originalSpan: source.substring(m.index, m.index + m.length),
          score: scoreMatch(source, m.index, context),
        });
      }
    }
  }

  if (allMatches.length === 0) {
    return {
      success: false,
      error: `Text not found in source files: "${oldText.substring(0, 80)}..."`,
    };
  }

  // Sort by score descending, take best match
  allMatches.sort((a, b) => b.score - a.score);
  const best = allMatches[0];

  if (allMatches.length > 1) {
    console.log(
      `[Hemingway] ${allMatches.length} matches found, using best (score: ${best.score}) in ${relative(PROJECT_ROOT, best.file)}:${best.line}`
    );
  }

  // Determine replacement text — preserve entity encoding from the original
  let replacement = newText;

  if (best.originalSpan.includes("&apos;")) {
    replacement = replacement.replace(/'/g, "&apos;");
  }
  if (best.originalSpan.includes("&quot;")) {
    replacement = replacement.replace(/"/g, "&quot;");
  }
  if (best.originalSpan.includes("&amp;")) {
    replacement = replacement.replace(/&/g, "&amp;");
  }
  if (best.originalSpan.includes("&lt;")) {
    replacement = replacement.replace(/</g, "&lt;");
  }
  if (best.originalSpan.includes("&gt;")) {
    replacement = replacement.replace(/>/g, "&gt;");
  }
  if (best.originalSpan.includes("\u2019")) {
    replacement = replacement.replace(/'/g, "\u2019");
  }

  // Perform replacement
  const source = await readFile(best.file, "utf-8");
  const before = source.substring(0, best.index);
  const after = source.substring(best.index + best.originalSpan.length);
  const modified = before + replacement + after;

  await writeFile(best.file, modified, "utf-8");

  const relativePath = relative(PROJECT_ROOT, best.file);
  return {
    success: true,
    file: relativePath,
    line: best.line,
    matchCount: allMatches.length,
  };
}
