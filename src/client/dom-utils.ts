// --- DOM utility functions ---
// Inline implementations of helpers previously imported from the agentation package.

/**
 * Returns a human-readable name and CSS-like path for the element.
 *
 * name: tag name + text preview (e.g. "H1: Deploy AI agents...")
 * path: CSS-like path from body (e.g. "section > div > h1")
 */
export function identifyElement(el: HTMLElement): { name: string; path: string } {
  const tag = el.tagName;
  const textPreview = (el.innerText || "").trim().slice(0, 60);
  const name = textPreview ? `${tag}: ${textPreview}${textPreview.length >= 60 ? "..." : ""}` : tag;
  const path = buildPath(el, false);
  return { name, path };
}

/**
 * Returns text content from surrounding siblings (prev + next sibling text,
 * up to 200 chars each).
 */
export function getNearbyText(el: HTMLElement): string {
  const parts: string[] = [];

  const prev = el.previousElementSibling;
  if (prev) {
    const text = (prev as HTMLElement).innerText?.trim() || "";
    if (text) parts.push(text.slice(0, 200));
  }

  const next = el.nextElementSibling;
  if (next) {
    const text = (next as HTMLElement).innerText?.trim() || "";
    if (text) parts.push(text.slice(0, 200));
  }

  return parts.join(" | ");
}

/**
 * Returns cleaned CSS class names, filtering out utility-like classes under
 * 3 characters.
 */
export function getElementClasses(el: HTMLElement): string {
  const classes = Array.from(el.classList).filter((c) => c.length >= 3);
  return classes.join(" ");
}

/**
 * Returns a human-readable path from body to the element.
 * e.g. "body > section.theme-daylight > div.container > h2"
 */
export function getElementPath(el: HTMLElement): string {
  return buildPath(el, true);
}

// --- Internal helper ---

function buildPath(el: HTMLElement, includeClasses: boolean): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.documentElement) {
    let segment = current.tagName.toLowerCase();
    if (includeClasses) {
      const meaningful = Array.from(current.classList).filter((c) => c.length >= 3);
      if (meaningful.length > 0) {
        segment += "." + meaningful.slice(0, 2).join(".");
      }
    }
    parts.unshift(segment);
    current = current.parentElement;
  }

  return parts.join(" > ");
}
