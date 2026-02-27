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

  return {
    sectionHtml,
    pagePosition,
    sectionRole,
    surroundingSections,
    elementType: el.tagName.toLowerCase(),
    copyJob,
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
