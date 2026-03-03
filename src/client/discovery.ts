// --- Element discovery ---
// Finds text-bearing elements on the page using a TreeWalker, then deduplicates
// parents whose text is fully covered by their discovered children.

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "SVG",
  "CANVAS",
  "VIDEO",
  "IFRAME",
  "NOSCRIPT",
]);

const TARGET_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "A",
  "BUTTON",
  "LI",
  "LABEL",
  "TD",
  "TH",
]);

function hasDirectTextNode(el: Element): boolean {
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return true;
    }
  }
  return false;
}

function hasTextContent(el: Element): boolean {
  return !!(el.textContent?.trim() || "");
}

function normalizedText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getComparableText(el: HTMLElement): string {
  const visible = normalizedText(el.innerText || "");
  if (visible) return visible;
  return normalizedText(el.textContent || "");
}

function getMeaningfulTextChildren(el: HTMLElement): HTMLElement[] {
  const children = Array.from(el.children) as HTMLElement[];
  const meaningful: HTMLElement[] = [];

  for (const child of children) {
    if (isHemingwayUI(child)) continue;
    const text = normalizedText(child.textContent || "");
    if (text.length < 3) continue;
    meaningful.push(child);
  }

  return meaningful;
}

/**
 * Some elements render as composite wrappers (for example an anchor containing
 * separate title + description spans). Their visible text is assembled from
 * multiple source literals, so writeback for the wrapper is unreliable.
 */
function isCompositeContainer(el: HTMLElement): boolean {
  if (hasDirectTextNode(el)) return false;

  const children = getMeaningfulTextChildren(el);
  if (children.length >= 2) return true;

  // One level deeper: e.g. <a><span><span>Title</span><span>Desc</span></span></a>
  if (children.length === 1) {
    const nested = getMeaningfulTextChildren(children[0]);
    if (nested.length >= 2 && !hasDirectTextNode(children[0])) {
      return true;
    }
  }

  return false;
}

/**
 * Mixed rich-text containers (plain text + inline links) are often rendered
 * from fragmented JSX expressions that are not a single contiguous source
 * string. Selecting these parent containers leads to writeback misses.
 * We skip them and rely on leaf nodes (like anchors) instead.
 */
function hasMixedLinkAndNonLinkText(el: HTMLElement): boolean {
  if (el.tagName === "A") return false;
  if (!el.querySelector("a")) return false;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent?.trim() || "";
    if (!text) continue;

    const parentEl = node.parentElement;
    if (!parentEl) continue;
    if (!parentEl.closest("a")) {
      return true;
    }
  }

  return false;
}

/**
 * Detect span nodes that are likely single-character fragments from typing
 * animations (TypeIt / per-letter wrappers). These should not be selectable;
 * users expect to edit the full line.
 */
function isFragmentedLetterSpan(el: HTMLElement): boolean {
  if (el.tagName !== "SPAN") return false;

  const text = (el.textContent || "").trim();
  if (!text || text.length > 2) return false;

  const parent = el.parentElement;
  if (!parent) return false;

  const parentText = (parent.textContent || "").trim();
  if (parentText.length < 8) return false;

  const siblingSpans = parent.querySelectorAll(":scope > span").length;
  if (siblingSpans >= 4) return true;

  const classBlob = `${el.className} ${parent.className}`.toLowerCase();
  if (classBlob.includes("typeit") || classBlob.includes("typing")) return true;

  return false;
}

function isHemingwayUI(el: Element): boolean {
  if (el.hasAttribute("data-hemingway-ui")) return true;
  if (el.closest("[data-hemingway-ui]")) return true;
  return false;
}

interface BindHandlers {
  onHover: (e: Event) => void;
  onHoverOut: (e: Event) => void;
  onClick: (e: Event) => void;
  onDblClick?: (e: Event) => void;
}

export class ElementDiscovery {
  private elements: Set<HTMLElement> = new Set();
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private onDiscovery: ((elements: Set<HTMLElement>) => void) | null = null;
  private boundHandlers: BindHandlers | null = null;

  /**
   * Uses a TreeWalker to find text elements, then deduplicates parents whose
   * text is fully covered by their found children.
   */
  discover(): Set<HTMLElement> {
    const found = new Set<HTMLElement>();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          const el = node as Element;
          if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          if (isHemingwayUI(el)) return NodeFilter.FILTER_REJECT;
          if (el.hasAttribute("data-typeit-id")) return NodeFilter.FILTER_REJECT;
          if (TARGET_TAGS.has(el.tagName)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement;
      // Keep spans only when they represent meaningful units; skip per-letter
      // animation fragments so the parent line can be selected.
      if (isFragmentedLetterSpan(el)) continue;
      if (hasMixedLinkAndNonLinkText(el)) continue;
      if (isCompositeContainer(el)) continue;

      if (hasTextContent(el)) {
        found.add(el);
      }
    }

    // Dedup: remove parents whose innerText equals the concatenated innerText
    // of their found children.
    const toRemove = new Set<HTMLElement>();
    for (const el of found) {
      for (const other of found) {
        if (el !== other && el.contains(other)) {
          const parentText = getComparableText(el);
          let childTexts = "";
          for (const child of found) {
            if (child !== el && el.contains(child)) {
              childTexts += getComparableText(child) + " ";
            }
          }
          if (childTexts.trim() === parentText) {
            toRemove.add(el);
          }
          break;
        }
      }
    }
    for (const el of toRemove) {
      found.delete(el);
    }

    return found;
  }

  /**
   * Binds hover/click handlers to a set of elements and tracks them internally.
   */
  bind(elements: Set<HTMLElement>, handlers: BindHandlers): void {
    this.boundHandlers = handlers;
    for (const el of elements) {
      el.addEventListener("mouseenter", handlers.onHover);
      el.addEventListener("mouseleave", handlers.onHoverOut);
      el.addEventListener("click", handlers.onClick);
      if (handlers.onDblClick) {
        el.addEventListener("dblclick", handlers.onDblClick);
      }
      this.elements.add(el);
    }
  }

  /**
   * Unbinds all tracked handlers and clears hover styles.
   */
  unbind(): void {
    if (!this.boundHandlers) return;
    const handlers = this.boundHandlers;
    for (const el of this.elements) {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.cursor = "";
      el.removeEventListener("mouseenter", handlers.onHover);
      el.removeEventListener("mouseleave", handlers.onHoverOut);
      el.removeEventListener("click", handlers.onClick);
      if (handlers.onDblClick) {
        el.removeEventListener("dblclick", handlers.onDblClick);
      }
    }
    this.elements = new Set();
    this.boundHandlers = null;
  }

  /**
   * Starts a MutationObserver that calls the callback (debounced 200ms) when
   * the DOM changes.
   */
  observe(callback: () => void): void {
    this.stopObserver();

    this.observer = new MutationObserver(() => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        callback();
      }, 200);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Returns the current set of tracked elements (for incremental rebinding).
   */
  getTrackedElements(): Set<HTMLElement> {
    return this.elements;
  }

  /**
   * Removes elements that are no longer in the DOM.
   */
  pruneDetached(): void {
    const stillInDom = new Set<HTMLElement>();
    for (const el of this.elements) {
      if (document.body.contains(el)) {
        stillInDom.add(el);
      }
    }
    this.elements = stillInDom;
  }

  private stopObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Full cleanup: stop observer, unbind handlers, clear all state.
   */
  destroy(): void {
    this.stopObserver();
    this.unbind();
  }
}
