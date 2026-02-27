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
      if (hasDirectTextNode(el)) {
        found.add(el);
      }
    }

    // Dedup: remove parents whose innerText equals the concatenated innerText
    // of their found children.
    const toRemove = new Set<HTMLElement>();
    for (const el of found) {
      for (const other of found) {
        if (el !== other && el.contains(other)) {
          const parentText = el.innerText?.trim() || "";
          let childTexts = "";
          for (const child of found) {
            if (child !== el && el.contains(child)) {
              childTexts += (child.innerText?.trim() || "") + " ";
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
      el.addEventListener("click", handlers.onClick, true);
      if (handlers.onDblClick) {
        el.addEventListener("dblclick", handlers.onDblClick, true);
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
      el.removeEventListener("click", handlers.onClick, true);
      if (handlers.onDblClick) {
        el.removeEventListener("dblclick", handlers.onDblClick, true);
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
