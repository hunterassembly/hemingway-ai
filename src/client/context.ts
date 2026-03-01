// --- Page context gathering ---
// Collects structural information about the element's position on the page so
// the server can generate better copy alternatives.

export interface PageContext {
  sectionHtml: string;
  pagePosition: string; // e.g. "Section 3 of 8"
  sectionRole: string; // e.g. "hero", "problem", "solution", "social-proof", "cta", "features"
  surroundingSections: string[]; // text summaries of prev/next sections
  elementType: string; // e.g. "h2", "p", "button"
  copyJob: string; // e.g. "primary-headline", "cta-label", "body-copy"
  pageBrief: PageStoryBrief;
}

export interface PageStoryBrief {
  pageTitle: string;
  narrativeStage: "opening" | "middle" | "closing";
  primaryGoal: string;
  corePromise: string;
  primaryAudience: string[];
  primaryCta: string;
  keyProofPoints: string[];
  sectionFlow: string[];
}

// Keywords used to detect section roles from class names, data attributes, or
// text content.
const ROLE_KEYWORDS: Record<string, string[]> = {
  hero: ["hero", "banner", "splash", "intro", "above-fold"],
  problem: ["problem", "pain", "challenge", "struggle"],
  solution: ["solution", "how-it-works", "approach", "method"],
  features: ["feature", "benefit", "capability", "capabilities"],
  "social-proof": ["testimonial", "review", "case-study", "logo", "trust", "social-proof", "client"],
  cta: ["cta", "call-to-action", "signup", "get-started", "pricing", "contact"],
  faq: ["faq", "question", "accordion"],
  footer: ["footer", "bottom"],
};

// --- Copy job classification ---

export function classifyCopyJob(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const text = el.innerText?.trim() || "";

  // Buttons and button-like links
  if (tag === "button" || (tag === "a" && hasButtonClasses(el))) {
    return "cta-label";
  }

  // Blockquotes and testimonial containers
  if (tag === "blockquote" || el.closest("blockquote")) {
    return "testimonial";
  }
  if (el.closest("[class*='testimonial'], [class*='quote'], [class*='review']")) {
    return "testimonial";
  }

  // Figure captions
  if (tag === "figcaption" || (el.parentElement?.tagName.toLowerCase() === "figure" && tag !== "img")) {
    return "caption";
  }

  // Stats — text with prominent numbers
  if (/\d+[%+xX]|\d{2,}/.test(text) && text.length < 30) {
    return "stat";
  }

  // H1 — primary headline
  if (tag === "h1") {
    return "primary-headline";
  }

  // H2/H3 — section headers
  if (tag === "h2" || (tag === "h3" && isFirstHeadingInSection(el))) {
    return "section-header";
  }

  // Eyebrow — short text immediately before a heading
  if (text.length < 50 && isBeforeHeading(el)) {
    return "eyebrow";
  }

  // Subheadline — short text immediately after a heading
  if (text.length < 120 && isAfterHeading(el)) {
    return "subheadline";
  }

  // List items
  if (tag === "li") {
    return "feature-point";
  }

  // Paragraphs — opener vs. body
  if (tag === "p") {
    if (isFirstParagraphInSection(el)) {
      return "section-opener";
    }
    return "body-copy";
  }

  return "general";
}

function hasButtonClasses(el: HTMLElement): boolean {
  const classes = el.className.toLowerCase();
  return (
    classes.includes("btn") ||
    classes.includes("button") ||
    classes.includes("cta") ||
    el.getAttribute("role") === "button"
  );
}

function isFirstHeadingInSection(el: HTMLElement): boolean {
  const section = el.closest("section") || el.parentElement;
  if (!section) return false;
  const firstHeading = section.querySelector("h1, h2, h3");
  return firstHeading === el;
}

function isBeforeHeading(el: HTMLElement): boolean {
  const next = el.nextElementSibling;
  if (!next) return false;
  return /^h[1-3]$/i.test(next.tagName);
}

function isAfterHeading(el: HTMLElement): boolean {
  const prev = el.previousElementSibling;
  if (!prev) return false;
  return /^h[1-3]$/i.test(prev.tagName);
}

function isFirstParagraphInSection(el: HTMLElement): boolean {
  const section = el.closest("section") || el.parentElement;
  if (!section) return false;
  const firstP = section.querySelector("p");
  return firstP === el;
}

/**
 * Gathers structural context about an element's position on the page.
 */
export function gatherContext(el: HTMLElement): PageContext {
  // Find parent <section> or closest section-like container
  const section = findParentSection(el);

  // Count all top-level sections on the page
  const allSections = getAllSections();
  const sectionIndex = section ? allSections.indexOf(section) : -1;
  const pagePosition =
    sectionIndex >= 0
      ? `Section ${sectionIndex + 1} of ${allSections.length}`
      : `1 of ${allSections.length || 1}`;

  // Detect section role
  const sectionRole = section ? detectRole(section, sectionIndex, allSections.length) : "unknown";

  // Get surrounding section summaries
  const surroundingSections: string[] = [];
  if (sectionIndex > 0) {
    surroundingSections.push(summarizeSection(allSections[sectionIndex - 1]));
  }
  if (sectionIndex >= 0 && sectionIndex < allSections.length - 1) {
    surroundingSections.push(summarizeSection(allSections[sectionIndex + 1]));
  }

  // Strip scripts/styles from section HTML
  const sectionHtml = section ? getCleanHtml(section) : el.outerHTML;

  // Classify the element's copy job
  const copyJob = classifyCopyJob(el);
  const pageBrief = buildPageStoryBrief(allSections, sectionIndex);

  return {
    sectionHtml,
    pagePosition,
    sectionRole,
    surroundingSections,
    elementType: el.tagName.toLowerCase(),
    copyJob,
    pageBrief,
  };
}

// --- Internal helpers ---

function findParentSection(el: HTMLElement): HTMLElement | null {
  // Try <section> first
  const section = el.closest("section");
  if (section) return section as HTMLElement;

  // Try common section-like containers
  const sectionLike = el.closest("[role='region'], [role='main'], main, article, .section");
  if (sectionLike) return sectionLike as HTMLElement;

  // Fall back to direct children of body that contain the element
  let current: HTMLElement | null = el;
  while (current && current.parentElement !== document.body) {
    current = current.parentElement;
  }
  return current;
}

function getAllSections(): HTMLElement[] {
  // Prefer <section> elements
  const sections = Array.from(document.querySelectorAll("section")) as HTMLElement[];
  if (sections.length > 0) return sections;

  // Fall back to direct children of body/main that look like sections
  const main = document.querySelector("main") || document.body;
  return Array.from(main.children).filter(
    (child) => child instanceof HTMLElement && child.tagName !== "SCRIPT" && child.tagName !== "STYLE"
  ) as HTMLElement[];
}

function detectRole(section: HTMLElement, index: number, total: number): string {
  // Check data attributes
  const dataRole =
    section.getAttribute("data-section") ||
    section.getAttribute("data-role") ||
    section.getAttribute("aria-label") ||
    "";

  // Check class names and id
  const classesAndId = `${section.className} ${section.id}`.toLowerCase();

  // Check attributes for keyword matches
  const textToSearch = `${dataRole} ${classesAndId}`.toLowerCase();

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword)) return role;
    }
  }

  // Content-based heuristics
  const html = section.innerHTML.toLowerCase();

  if (section.querySelector("form") || html.includes("subscribe") || html.includes("get started")) {
    return "cta";
  }
  if (
    html.includes("testimonial") ||
    html.includes("quote") ||
    section.querySelectorAll("blockquote").length > 0
  ) {
    return "social-proof";
  }

  // Position-based fallbacks
  if (index === 0) return "hero";
  if (index === total - 1) return "cta";

  return "body";
}

function summarizeSection(section: HTMLElement): string {
  const text = section.innerText?.trim() || "";
  return text.slice(0, 200);
}

function getCleanHtml(section: HTMLElement): string {
  const clone = section.cloneNode(true) as HTMLElement;
  // Remove scripts and styles from the clone
  const toRemove = clone.querySelectorAll("script, style, svg");
  for (const el of toRemove) {
    el.remove();
  }
  return clone.innerHTML.slice(0, 5000); // Cap at 5000 chars to stay reasonable
}

function buildPageStoryBrief(
  allSections: HTMLElement[],
  currentSectionIndex: number
): PageStoryBrief {
  const pageText = document.body?.innerText?.trim() || "";
  const title = document.title?.trim() || "";
  const firstHeading =
    (document.querySelector("h1") as HTMLElement | null)?.innerText?.trim() || "";
  const corePromise = compactText(firstHeading || title || pageText, 140);
  const sectionCount = allSections.length || 1;
  const safeIndex = currentSectionIndex >= 0 ? currentSectionIndex : 0;

  return {
    pageTitle: compactText(title || firstHeading || "Untitled page", 80),
    narrativeStage: getNarrativeStage(safeIndex, sectionCount),
    primaryGoal: inferPrimaryGoal(pageText),
    corePromise,
    primaryAudience: inferAudience(pageText),
    primaryCta: findPrimaryCta(allSections),
    keyProofPoints: extractProofPoints(pageText),
    sectionFlow: summarizeSectionFlow(allSections),
  };
}

function getNarrativeStage(
  index: number,
  total: number
): "opening" | "middle" | "closing" {
  if (index <= 0) return "opening";
  if (index >= total - 2) return "closing";
  return "middle";
}

function inferPrimaryGoal(pageText: string): string {
  const lower = pageText.toLowerCase();

  if (
    /get started|start for free|book demo|request demo|contact sales|buy now|pricing/.test(
      lower
    )
  ) {
    return "Drive conversion to trial, demo, or purchase";
  }

  if (/how it works|features|compare|integrations|documentation|learn more/.test(lower)) {
    return "Educate and persuade with product clarity";
  }

  return "Communicate the value proposition and build trust";
}

function inferAudience(pageText: string): string[] {
  const lower = pageText.toLowerCase();
  const matches: string[] = [];

  const audienceMap: Array<{ label: string; pattern: RegExp }> = [
    { label: "Developers", pattern: /developer|engineering|api|sdk|ship|deploy|code/ },
    { label: "Product teams", pattern: /product team|pm|roadmap|backlog|sprint|feature/ },
    { label: "Marketing teams", pattern: /marketing|campaign|conversion|lead|pipeline/ },
    { label: "Sales teams", pattern: /sales|revenue|pipeline|prospect|close deals/ },
    { label: "Enterprise buyers", pattern: /enterprise|security|compliance|governance|soc 2/ },
    { label: "Startups", pattern: /startup|founder|launch|early-stage/ },
  ];

  for (const audience of audienceMap) {
    if (audience.pattern.test(lower)) {
      matches.push(audience.label);
    }
    if (matches.length >= 3) break;
  }

  if (matches.length === 0) {
    matches.push("General B2B buyers");
  }

  return matches;
}

function findPrimaryCta(allSections: HTMLElement[]): string {
  const scope = allSections.length > 0 ? allSections[0] : document.body;
  const ctas = Array.from(scope.querySelectorAll("a, button")) as HTMLElement[];

  for (const cta of ctas) {
    const text = compactText(cta.innerText || cta.getAttribute("aria-label") || "", 50);
    if (!text) continue;
    if (/get started|start|book|try|request|contact|demo|free|signup|sign up/i.test(text)) {
      return text;
    }
  }

  for (const cta of ctas) {
    const text = compactText(cta.innerText || cta.getAttribute("aria-label") || "", 50);
    if (text) return text;
  }

  return "None detected";
}

function extractProofPoints(pageText: string): string[] {
  const normalized = pageText.replace(/\s+/g, " ").trim();
  const points: string[] = [];

  const numericMatches =
    normalized.match(
      /\b\d+(?:\.\d+)?(?:%|x|X|k|K|m|M|b|B)?(?:\s?(?:customers|users|teams|faster|reduction|increase|hours|days|weeks))?\b/g
    ) ?? [];
  for (const value of numericMatches) {
    if (points.length >= 3) break;
    const cleaned = compactText(value, 60);
    if (cleaned && !points.includes(cleaned)) {
      points.push(cleaned);
    }
  }

  const trustSignals = [
    "Trusted by",
    "Case study",
    "Testimonials",
    "SOC 2",
    "GDPR",
    "CCPA",
  ];
  for (const signal of trustSignals) {
    if (points.length >= 4) break;
    if (new RegExp(signal, "i").test(normalized) && !points.includes(signal)) {
      points.push(signal);
    }
  }

  if (points.length === 0) {
    points.push("No explicit proof points detected");
  }

  return points;
}

function summarizeSectionFlow(allSections: HTMLElement[]): string[] {
  const summaries: string[] = [];
  const total = allSections.length;

  for (let i = 0; i < allSections.length; i++) {
    if (summaries.length >= 6) break;
    const section = allSections[i];
    const role = detectRole(section, i, total);
    const heading =
      compactText((section.querySelector("h1, h2, h3") as HTMLElement | null)?.innerText || "", 80) ||
      compactText(section.innerText || "", 80);
    summaries.push(`${i + 1}. ${role}: ${heading}`);
  }

  return summaries;
}

function compactText(value: string, maxLen: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1)}…`;
}
