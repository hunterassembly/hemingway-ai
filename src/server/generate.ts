import { readFile, stat } from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import { resolve } from "node:path";
import type { HemingwayConfig } from "./config.js";
import { getElementBriefing, getPositionModifier } from "./briefings.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateRequest {
  text: string;
  elementType: string;
  copyJob: string;
  sectionHtml: string;
  pagePosition: string;
  sectionRole: string;
  surroundingSections: string[];
  userComment: string;
  previousAlternatives?: Alternative[];
  feedback?: string;
}

export interface Alternative {
  label: string;
  text: string;
}

export interface MultiGenerateRequest {
  elements: { text: string; elementType: string; copyJob: string }[];
  sectionHtml: string;
  pagePosition: string;
  sectionRole: string;
  surroundingSections: string[];
  userComment: string;
  previousAlternatives?: MultiAlternative[];
  feedback?: string;
}

export interface MultiAlternative {
  label: string;
  texts: { index: number; text: string }[];
}

// ---------------------------------------------------------------------------
// File cache with fs.watch invalidation
// ---------------------------------------------------------------------------

interface CachedFile {
  content: string;
  mtimeMs: number;
  watcher: FSWatcher | null;
}

const fileCache = new Map<string, CachedFile>();

/**
 * Read a file from disk, returning cached content when the file hasn't changed.
 * Sets up an `fs.watch` listener to invalidate the cache on modification.
 */
async function readCachedFile(filePath: string): Promise<string> {
  const absPath = resolve(process.cwd(), filePath);

  // Check if we have a valid cache entry
  const cached = fileCache.get(absPath);
  if (cached) {
    try {
      const info = await stat(absPath);
      if (info.mtimeMs === cached.mtimeMs) {
        return cached.content;
      }
    } catch {
      // File may have been deleted — remove cache entry
      cached.watcher?.close();
      fileCache.delete(absPath);
    }
  }

  // Read fresh content
  const content = await readFile(absPath, "utf-8");
  const info = await stat(absPath);

  // Set up watcher for invalidation
  let watcher: FSWatcher | null = null;
  try {
    watcher = watch(absPath, () => {
      const entry = fileCache.get(absPath);
      if (entry) {
        // Invalidate — next read will fetch from disk
        entry.mtimeMs = -1;
      }
    });
    // Don't let the watcher prevent process exit
    watcher.unref();
  } catch {
    // Watching may not be supported — caching still works via mtime
  }

  fileCache.set(absPath, {
    content,
    mtimeMs: info.mtimeMs,
    watcher,
  });

  return content;
}

/**
 * Safely read a file, returning empty string on failure.
 */
async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await readCachedFile(filePath);
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

function buildBriefingBlock(copyJob: string, sectionRole: string, pagePosition: string): string {
  const briefing = getElementBriefing(copyJob || "general", sectionRole || "body");
  const parts: string[] = [];

  parts.push(`Copy job: ${copyJob || "general"}`);
  parts.push(`Section role: ${sectionRole || "unknown"}`);
  parts.push("");
  parts.push(briefing);

  if (pagePosition) {
    const modifier = getPositionModifier(pagePosition);
    if (modifier) {
      parts.push("");
      parts.push(modifier);
    }
  }

  return parts.join("\n");
}

function buildSystemPrompt(opts: {
  copyBible: string;
  styleGuide: string;
  referenceGuide: string;
  briefingBlock: string;
  preferences: string;
}): string {
  const parts: string[] = [];

  // Tier 0: Instructions (identity + output format — always first)
  parts.push(
    "<instructions>",
    "You are Hemingway, an expert conversion copywriter embedded in a developer tool.",
    "Your job is to generate alternative copy for marketing website text.",
    "",
    "The ELEMENT BRIEFING below describes exactly what this piece of copy needs to",
    "accomplish based on its role on the page. Follow that briefing closely — it is",
    "your primary directive for shaping the alternatives.",
    "",
    "Given the selected text, its briefing, and its context, generate exactly 3 alternatives.",
    "Each alternative should apply a different copywriting principle while respecting the briefing.",
    "",
    "Guidelines:",
    "- Keep the same approximate length as the original (unless the user asks otherwise)",
    "- Match the existing tone and voice described in the style guide",
    "- One alternative should apply a principle from the style guide",
    "- One alternative should be optimized for conversion (benefit-led, specific, urgent)",
    "- One alternative should combine both the style guide voice and conversion optimization",
    "- Labels should name the specific principle applied (e.g. \"Specifics over adjectives\", \"Benefit-led\", \"Mirror, then move\")",
    "",
    "You MUST respond with ONLY valid JSON in this exact format — no markdown, no code fences, no explanation:",
    '{"alternatives": [{"label": "...", "text": "..."}, {"label": "...", "text": "..."}, {"label": "...", "text": "..."}]}',
    "</instructions>",
    ""
  );

  // Tier 1: Element briefing (loudest — what this specific element must do)
  if (opts.briefingBlock) {
    parts.push(
      "<element-briefing>",
      opts.briefingBlock,
      "</element-briefing>",
      ""
    );
  }

  // Tier 1.5: Style preferences (learned from user picks — gentle nudge)
  if (opts.preferences) {
    parts.push(
      "<style-preferences>",
      opts.preferences,
      "</style-preferences>",
      ""
    );
  }

  // Tier 2: Style guide (voice and tone rules)
  if (opts.styleGuide) {
    parts.push(
      "<style-guide>",
      opts.styleGuide,
      "</style-guide>",
      ""
    );
  }

  // Tier 3: Copy bible (methodology)
  if (opts.copyBible) {
    parts.push(
      "<copy-bible>",
      opts.copyBible,
      "</copy-bible>",
      ""
    );
  }

  // Tier 3: Reference guide (real-world SaaS & services examples)
  if (opts.referenceGuide) {
    parts.push(
      "<reference-guide>",
      "The following is a synthesis of copywriting patterns from 27 leading SaaS and services companies.",
      "Use it as a reference for what great copy looks like in practice — real headlines, subheads, CTAs,",
      "and the specific techniques that make them work. Draw from these examples and principles when",
      "generating alternatives, but do not copy verbatim. Apply the patterns to the user's context.",
      "",
      opts.referenceGuide,
      "</reference-guide>",
      ""
    );
  }

  return parts.join("\n");
}

function buildUserPrompt(req: GenerateRequest): string {
  const parts: string[] = [];

  parts.push(`Selected text: "${req.text}"`);
  parts.push(`Element type: <${req.elementType}>`);

  if (req.surroundingSections && req.surroundingSections.length > 0) {
    parts.push("");
    parts.push("Surrounding narrative (what comes before/after in the page argument):");
    for (const summary of req.surroundingSections) {
      parts.push(`- ${summary}`);
    }
  }
  if (req.sectionHtml) {
    const truncated =
      req.sectionHtml.length > 3000
        ? req.sectionHtml.substring(0, 3000) + "... [truncated]"
        : req.sectionHtml;
    parts.push("", "Section HTML context:", truncated);
  }
  if (req.userComment) {
    parts.push("", `User note: ${req.userComment}`);
  }

  if (req.previousAlternatives && req.previousAlternatives.length > 0) {
    parts.push("");
    parts.push("<revision-context>");
    parts.push("The following alternatives were already shown and rejected:");
    for (const alt of req.previousAlternatives) {
      parts.push(`- [${alt.label}] "${alt.text}"`);
    }
    parts.push("");
    parts.push(
      req.feedback
        ? `User feedback: ${req.feedback}`
        : "Generate meaningfully different alternatives."
    );
    parts.push("</revision-context>");
  }

  parts.push("", "Generate 3 alternatives as JSON.");

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Anthropic API call
// ---------------------------------------------------------------------------

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  config: HemingwayConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error(
      "No API key configured. Set ANTHROPIC_API_KEY or add apiKey to hemingway.config.mjs"
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Anthropic API error ${response.status}: ${errorBody.substring(0, 500)}`
    );
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  // Extract text from the first text content block
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("No text content in API response");
  }

  return textBlock.text;
}

// ---------------------------------------------------------------------------
// Parse alternatives from response
// ---------------------------------------------------------------------------

function buildMultiSystemPrompt(opts: {
  copyBible: string;
  styleGuide: string;
  referenceGuide: string;
  briefingBlock: string;
  preferences: string;
}): string {
  const parts: string[] = [];

  parts.push(
    "<instructions>",
    "You are Hemingway, an expert conversion copywriter embedded in a developer tool.",
    "Your job is to rewrite MULTIPLE related text elements as a cohesive group.",
    "",
    "The user has selected multiple elements that form a narrative unit (e.g. a heading",
    "and its supporting paragraphs). You must rewrite ALL of them together so they read",
    "as one cohesive story with consistent voice, logical flow, and complementary messaging.",
    "",
    "Generate exactly 3 alternatives. Each alternative must include replacement text for",
    "EVERY element in the selection. The elements are numbered — preserve those numbers in",
    "your response.",
    "",
    "Guidelines:",
    "- Keep each element at approximately the same length as its original",
    "- Maintain narrative flow between elements (the heading sets up what the paragraphs deliver)",
    "- Match the existing tone and voice described in the style guide",
    "- One alternative should apply a principle from the style guide",
    "- One alternative should be optimized for conversion (benefit-led, specific, urgent)",
    "- One alternative should combine both the style guide voice and conversion optimization",
    "- Labels should name the specific principle applied",
    "",
    "You MUST respond with ONLY valid JSON in this exact format — no markdown, no code fences, no explanation:",
    '{"alternatives": [{"label": "...", "texts": [{"index": 1, "text": "..."}, {"index": 2, "text": "..."}]}, ...]}',
    "</instructions>",
    ""
  );

  if (opts.briefingBlock) {
    parts.push("<element-briefing>", opts.briefingBlock, "</element-briefing>", "");
  }
  if (opts.preferences) {
    parts.push("<style-preferences>", opts.preferences, "</style-preferences>", "");
  }
  if (opts.styleGuide) {
    parts.push("<style-guide>", opts.styleGuide, "</style-guide>", "");
  }
  if (opts.copyBible) {
    parts.push("<copy-bible>", opts.copyBible, "</copy-bible>", "");
  }
  if (opts.referenceGuide) {
    parts.push(
      "<reference-guide>",
      "The following is a synthesis of copywriting patterns from 27 leading SaaS and services companies.",
      "Use it as a reference for what great copy looks like in practice — real headlines, subheads, CTAs,",
      "and the specific techniques that make them work. Draw from these examples and principles when",
      "generating alternatives, but do not copy verbatim. Apply the patterns to the user's context.",
      "",
      opts.referenceGuide,
      "</reference-guide>",
      ""
    );
  }

  return parts.join("\n");
}

function buildMultiUserPrompt(req: MultiGenerateRequest): string {
  const parts: string[] = [];

  parts.push("Selected elements (rewrite ALL as a cohesive group):");
  for (let i = 0; i < req.elements.length; i++) {
    const el = req.elements[i];
    parts.push(`  ${i + 1}. [<${el.elementType}> / ${el.copyJob}] "${el.text}"`);
  }

  if (req.surroundingSections && req.surroundingSections.length > 0) {
    parts.push("");
    parts.push("Surrounding narrative (what comes before/after in the page argument):");
    for (const summary of req.surroundingSections) {
      parts.push(`- ${summary}`);
    }
  }
  if (req.sectionHtml) {
    const truncated =
      req.sectionHtml.length > 3000
        ? req.sectionHtml.substring(0, 3000) + "... [truncated]"
        : req.sectionHtml;
    parts.push("", "Section HTML context:", truncated);
  }
  if (req.userComment) {
    parts.push("", `User note: ${req.userComment}`);
  }

  if (req.previousAlternatives && req.previousAlternatives.length > 0) {
    parts.push("");
    parts.push("<revision-context>");
    parts.push("The following alternatives were already shown and rejected:");
    for (const alt of req.previousAlternatives) {
      const textsDesc = alt.texts.map((t) => `${t.index}: "${t.text}"`).join(", ");
      parts.push(`- [${alt.label}] {${textsDesc}}`);
    }
    parts.push("");
    parts.push(
      req.feedback
        ? `User feedback: ${req.feedback}`
        : "Generate meaningfully different alternatives."
    );
    parts.push("</revision-context>");
  }

  parts.push("", `Generate 3 alternatives as JSON. Each must include texts for all ${req.elements.length} elements.`);

  return parts.join("\n");
}

function parseMultiAlternatives(raw: string, elementCount: number): MultiAlternative[] {
  let jsonStr = raw.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const objStart = jsonStr.indexOf("{");
  const objEnd = jsonStr.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    jsonStr = jsonStr.substring(objStart, objEnd + 1);
  }

  const parsed = JSON.parse(jsonStr) as {
    alternatives?: MultiAlternative[];
  };

  if (!Array.isArray(parsed.alternatives)) {
    throw new Error("Response does not contain an alternatives array");
  }

  const valid = parsed.alternatives.filter(
    (a): a is MultiAlternative =>
      typeof a === "object" &&
      a !== null &&
      typeof a.label === "string" &&
      Array.isArray(a.texts) &&
      a.texts.length === elementCount &&
      a.texts.every(
        (t) =>
          typeof t === "object" &&
          t !== null &&
          typeof t.index === "number" &&
          typeof t.text === "string"
      )
  );

  if (valid.length === 0) {
    throw new Error("No valid multi-alternatives in response");
  }

  return valid;
}

function parseAlternatives(raw: string): Alternative[] {
  // Try to extract JSON from the response (handle markdown code fences)
  let jsonStr = raw.trim();

  // Strip markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  // Try to find JSON object in the string
  const objStart = jsonStr.indexOf("{");
  const objEnd = jsonStr.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    jsonStr = jsonStr.substring(objStart, objEnd + 1);
  }

  const parsed = JSON.parse(jsonStr) as {
    alternatives?: Alternative[];
  };

  if (!Array.isArray(parsed.alternatives)) {
    throw new Error("Response does not contain an alternatives array");
  }

  // Validate each alternative has label and text
  const valid = parsed.alternatives.filter(
    (a): a is Alternative =>
      typeof a === "object" &&
      a !== null &&
      typeof a.label === "string" &&
      typeof a.text === "string"
  );

  if (valid.length === 0) {
    throw new Error("No valid alternatives in response");
  }

  return valid;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateAlternatives(
  req: GenerateRequest,
  config: HemingwayConfig,
  preferences?: string
): Promise<Alternative[]> {
  // Read reference documents
  const [copyBible, styleGuide, referenceGuide] = await Promise.all([
    safeReadFile(config.copyBible),
    safeReadFile(config.styleGuide),
    safeReadFile(config.referenceGuide),
  ]);

  // Build briefing block (moved from user prompt to system prompt)
  const briefingBlock = buildBriefingBlock(
    req.copyJob || "general",
    req.sectionRole || "body",
    req.pagePosition || ""
  );

  // Build prompts
  const systemPrompt = buildSystemPrompt({
    copyBible,
    styleGuide,
    referenceGuide,
    briefingBlock,
    preferences: preferences ?? "",
  });
  const userPrompt = buildUserPrompt(req);

  // Call Claude
  const rawResponse = await callClaude(systemPrompt, userPrompt, config);

  // Parse and return alternatives
  return parseAlternatives(rawResponse);
}

export async function generateMultiAlternatives(
  req: MultiGenerateRequest,
  config: HemingwayConfig,
  preferences?: string
): Promise<MultiAlternative[]> {
  const [copyBible, styleGuide, referenceGuide] = await Promise.all([
    safeReadFile(config.copyBible),
    safeReadFile(config.styleGuide),
    safeReadFile(config.referenceGuide),
  ]);

  // Build a combined briefing from all element types
  const briefingParts: string[] = [];
  for (let i = 0; i < req.elements.length; i++) {
    const el = req.elements[i];
    const briefing = getElementBriefing(el.copyJob || "general", req.sectionRole || "body");
    briefingParts.push(`Element ${i + 1} (${el.elementType} / ${el.copyJob}):`);
    briefingParts.push(briefing);
    briefingParts.push("");
  }

  if (req.pagePosition) {
    const modifier = getPositionModifier(req.pagePosition);
    if (modifier) {
      briefingParts.push(modifier);
    }
  }

  const systemPrompt = buildMultiSystemPrompt({
    copyBible,
    styleGuide,
    referenceGuide,
    briefingBlock: briefingParts.join("\n"),
    preferences: preferences ?? "",
  });
  const userPrompt = buildMultiUserPrompt(req);

  const rawResponse = await callClaude(systemPrompt, userPrompt, config);

  return parseMultiAlternatives(rawResponse, req.elements.length);
}
