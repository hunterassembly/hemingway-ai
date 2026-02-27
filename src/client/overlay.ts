// --- Main overlay controller ---
// Wires together discovery, popup, indicator, keyboard shortcuts, and server
// communication. This is the main entry point for the browser-side client.

import { ElementDiscovery } from "./discovery";
import { HemingwayPopup } from "./popup";
import type { Alternative, MultiAlternative } from "./popup";
import { HemingwayIndicator } from "./indicator";
import { gatherContext, classifyCopyJob } from "./context";

// --- Types ---

interface WriteResult {
  success: boolean;
  file?: string;
  line?: number;
  error?: string;
}

interface SelectedItem {
  element: HTMLElement;
  text: string;
  elementType: string;
  copyJob: string;
}

interface UndoEntry {
  element: HTMLElement;
  oldText: string;
  newText: string;
  writeResult: WriteResult;
}

interface UndoSnapshot {
  entries: UndoEntry[];
}

interface HemingwayConfig {
  serverUrl: string;
  shortcut: string;
  accentColor: string;
}

const DEFAULTS: HemingwayConfig = {
  serverUrl: "http://localhost:4800",
  shortcut: "ctrl+shift+h",
  accentColor: "#3b82f6",
};

const MAX_MULTI_SELECT = 5;

export class HemingwayOverlay {
  private active: boolean = false;
  private config: HemingwayConfig;
  private discovery: ElementDiscovery;
  private popup: HemingwayPopup;
  private indicator: HemingwayIndicator;

  // Selection state
  private selection: SelectedItem[] = [];
  private multiMode: boolean = false;
  private previousAlternatives: Alternative[] = [];
  private previousMultiAlternatives: MultiAlternative[] = [];
  private lastChange: UndoSnapshot | null = null;

  // Selection badge elements (page element → badge node)
  private selectionBadges: Map<HTMLElement, HTMLElement> = new Map();
  private _scrollHandler: (() => void) | null = null;

  // Shadow DOM hosts
  private shadowHost: HTMLElement;
  private popupHost: HTMLElement;
  private indicatorHost: HTMLElement;

  // Click/dblclick debounce
  private clickTimer: number = 0;

  // Inline edit listeners (stored for cleanup)
  private _inlineBlur: (() => void) | null = null;
  private _inlineKeydown: ((e: KeyboardEvent) => void) | null = null;

  // Bound handlers stored for removal
  private _handleShortcut: (e: KeyboardEvent) => void;
  private _blockNavigation: (e: Event) => void;

  constructor(config?: Partial<HemingwayConfig>) {
    this.config = { ...DEFAULTS, ...config };

    // Create a top-level container for Hemingway UI
    this.shadowHost = document.createElement("div");
    this.shadowHost.setAttribute("data-hemingway-ui", "true");
    this.shadowHost.style.position = "absolute";
    this.shadowHost.style.top = "0";
    this.shadowHost.style.left = "0";
    this.shadowHost.style.zIndex = "2147483647";
    this.shadowHost.style.pointerEvents = "none";
    document.body.appendChild(this.shadowHost);

    // Popup host (needs pointer events for interaction)
    this.popupHost = document.createElement("div");
    this.popupHost.setAttribute("data-hemingway-ui", "true");
    this.popupHost.style.pointerEvents = "auto";
    this.shadowHost.appendChild(this.popupHost);

    // Indicator host (needs pointer events for settings pill interaction)
    this.indicatorHost = document.createElement("div");
    this.indicatorHost.setAttribute("data-hemingway-ui", "true");
    this.indicatorHost.style.pointerEvents = "auto";
    this.shadowHost.appendChild(this.indicatorHost);

    // Instantiate sub-components
    this.discovery = new ElementDiscovery();
    this.popup = new HemingwayPopup(this.popupHost);
    this.indicator = new HemingwayIndicator(this.indicatorHost);

    // Wire settings changes to server
    this.indicator.onSettingsChange = (key: string, value: string) => {
      fetch(`${this.config.serverUrl}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      }).catch((err) => console.error("[Hemingway] Failed to update config:", err));
    };

    // Load initial settings from server
    this.loadSettings();

    // Wire popup callbacks (route based on multi mode)
    this.popup.onGenerate = (comment: string) => {
      if (this.multiMode && this.selection.length > 1) {
        this.handleMultiGenerate(comment);
      } else {
        this.handleGenerate(comment);
      }
    };
    this.popup.onChoose = (alt: Alternative, index: number) => this.handleChoose(alt, index);
    this.popup.onChooseMulti = (alt: MultiAlternative, index: number) =>
      this.handleMultiChoose(alt, index);
    this.popup.onCustomText = (text: string) => this.handleCustomText(text);
    this.popup.onRegenerate = (feedback: string) => {
      if (this.multiMode && this.selection.length > 1) {
        this.handleMultiRegenerate(feedback);
      } else {
        this.handleRegenerate(feedback);
      }
    };
    this.popup.onUndo = () => this.handleUndo();
    this.popup.onDismiss = () => this.handleDismiss();

    // Keyboard shortcut listener
    this._handleShortcut = this.handleShortcut.bind(this);
    window.addEventListener("keydown", this._handleShortcut);

    // Navigation blocker
    this._blockNavigation = this.blockNavigation.bind(this);
  }

  // --- Public API ---

  activate(): void {
    if (this.active) return;
    this.active = true;

    this.indicator.show();
    this.runDiscovery();

    // Block navigation clicks while active
    document.addEventListener("click", this._blockNavigation, true);

    // Watch for DOM changes and re-discover
    this.discovery.observe(() => this.runDiscovery());
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;

    clearTimeout(this.clickTimer);
    this.indicator.hide();
    this.popup.hide();
    this.clearSelection();

    this.discovery.unbind();
    this.discovery.destroy();
    // Re-create discovery for next activation
    this.discovery = new ElementDiscovery();

    document.removeEventListener("click", this._blockNavigation, true);
  }

  toggle(): void {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  destroy(): void {
    this.deactivate();
    this.popup.destroy();
    this.indicator.destroy();
    window.removeEventListener("keydown", this._handleShortcut);

    if (this.shadowHost.parentElement) {
      this.shadowHost.parentElement.removeChild(this.shadowHost);
    }
  }

  // --- Discovery ---

  private runDiscovery(): void {
    // Prune elements no longer in the DOM
    this.discovery.pruneDetached();

    const found = this.discovery.discover();
    const tracked = this.discovery.getTrackedElements();

    // Find newly discovered elements
    const newElements = new Set<HTMLElement>();
    for (const el of found) {
      if (!tracked.has(el)) {
        newElements.add(el);
      }
    }

    if (newElements.size > 0) {
      this.discovery.bind(newElements, {
        onHover: this.handleHover,
        onHoverOut: this.handleHoverOut,
        onClick: this.handleClick,
        onDblClick: this.handleDblClick,
      });
    }
  }

  // --- Selection helpers ---

  private isSelected(el: HTMLElement): boolean {
    return this.selection.some((item) => item.element === el);
  }

  private addToSelection(el: HTMLElement): void {
    if (this.isSelected(el) || this.selection.length >= MAX_MULTI_SELECT) return;

    const item: SelectedItem = {
      element: el,
      text: el.innerText?.trim() || "",
      elementType: el.tagName.toLowerCase(),
      copyJob: classifyCopyJob(el),
    };
    this.selection.push(item);
    this.sortSelectionByDom();
    this.applySelectionStyle(el);
    this.refreshBadges();
  }

  private removeFromSelection(el: HTMLElement): void {
    const idx = this.selection.findIndex((item) => item.element === el);
    if (idx === -1) return;

    this.selection.splice(idx, 1);
    this.removeSelectionStyle(el);
    this.refreshBadges();
  }

  /** Keep selection sorted in DOM (document) order. */
  private sortSelectionByDom(): void {
    this.selection.sort((a, b) => {
      const pos = a.element.compareDocumentPosition(b.element);
      // DOCUMENT_POSITION_FOLLOWING means b comes after a → a should be first
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  }

  private clearSelection(): void {
    for (const item of this.selection) {
      this.removeSelectionStyle(item.element);
    }
    this.selection = [];
    this.multiMode = false;
    this.previousMultiAlternatives = [];
    this.clearBadges();
    this.stopBadgeTracking();
  }

  private applySelectionStyle(el: HTMLElement): void {
    el.style.outline = "2px solid #3b82f6";
    el.style.outlineOffset = "2px";
  }

  private removeSelectionStyle(el: HTMLElement): void {
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.cursor = "";
  }

  // --- Badge management ---

  private refreshBadges(): void {
    this.clearBadges();

    if (this.selection.length <= 1) return;

    this.selection.forEach((item, i) => {
      const badge = this.createBadge(item.element, i + 1);
      this.selectionBadges.set(item.element, badge);
    });

    this.startBadgeTracking();
  }

  private createBadge(el: HTMLElement, number: number): HTMLElement {
    const badge = document.createElement("div");
    badge.setAttribute("data-hemingway-ui", "true");
    badge.style.cssText = [
      "position: absolute",
      "width: 20px",
      "height: 20px",
      "background: #3b82f6",
      "color: white",
      "border-radius: 50%",
      "font-size: 11px",
      "font-weight: 600",
      "display: flex",
      "align-items: center",
      "justify-content: center",
      "font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      "pointer-events: none",
      "z-index: 1",
      "box-shadow: 0 1px 3px rgba(0,0,0,0.2)",
    ].join(";");
    badge.textContent = String(number);

    const rect = el.getBoundingClientRect();
    badge.style.top = `${rect.top + window.scrollY - 10}px`;
    badge.style.left = `${rect.left + window.scrollX - 10}px`;

    this.shadowHost.appendChild(badge);
    return badge;
  }

  private clearBadges(): void {
    for (const badge of this.selectionBadges.values()) {
      badge.remove();
    }
    this.selectionBadges.clear();
  }

  private updateBadgePositions(): void {
    for (const [el, badge] of this.selectionBadges) {
      const rect = el.getBoundingClientRect();
      badge.style.top = `${rect.top + window.scrollY - 10}px`;
      badge.style.left = `${rect.left + window.scrollX - 10}px`;
    }
  }

  private startBadgeTracking(): void {
    if (this._scrollHandler) return;
    this._scrollHandler = () => this.updateBadgePositions();
    window.addEventListener("scroll", this._scrollHandler, { passive: true });
    window.addEventListener("resize", this._scrollHandler, { passive: true });
  }

  private stopBadgeTracking(): void {
    if (!this._scrollHandler) return;
    window.removeEventListener("scroll", this._scrollHandler);
    window.removeEventListener("resize", this._scrollHandler);
    this._scrollHandler = null;
  }

  // --- Popup positioning ---

  private positionPopupNear(el: HTMLElement): { top: number; left: number } {
    const rect = el.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    const popupEstimatedHeight = 300;
    if (rect.bottom + popupEstimatedHeight > window.innerHeight) {
      top = rect.top + window.scrollY - popupEstimatedHeight - 8;
      if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 8;
      }
    }
    const left = Math.max(16, rect.left + window.scrollX);
    return { top, left };
  }

  // --- Event handlers ---

  private handleHover = (e: Event): void => {
    const el = e.target as HTMLElement;
    // Skip hover styling on already-selected elements to avoid flicker
    if (this.isSelected(el)) return;
    el.style.outline = `1.5px dashed rgba(0, 122, 255, 0.35)`;
    el.style.outlineOffset = "2px";
    el.style.cursor = "pointer";
  };

  private handleHoverOut = (e: Event): void => {
    const el = e.target as HTMLElement;
    // Don't clear styling on selected elements
    if (this.isSelected(el)) return;
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.cursor = "";
  };

  private handleClick = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target as HTMLElement;
    const mouseEvent = e as MouseEvent;
    const isMultiClick = mouseEvent.metaKey || mouseEvent.ctrlKey;

    // Delay so dblclick can cancel
    clearTimeout(this.clickTimer);
    this.clickTimer = window.setTimeout(() => {
      if (isMultiClick) {
        this.handleMultiClick(el);
      } else {
        this.handleSingleClick(el);
      }
    }, 200);
  };

  private handleSingleClick(el: HTMLElement): void {
    // Clear any existing multi-selection
    this.clearSelection();
    this.multiMode = false;

    const item: SelectedItem = {
      element: el,
      text: el.innerText?.trim() || "",
      elementType: el.tagName.toLowerCase(),
      copyJob: classifyCopyJob(el),
    };
    this.selection = [item];
    this.previousAlternatives = [];

    const pos = this.positionPopupNear(el);
    this.popup.show(pos, item.text);
  }

  private handleMultiClick(el: HTMLElement): void {
    this.multiMode = true;

    // Hide popup during selection building (will re-show below)
    this.popup.hide();

    if (this.isSelected(el)) {
      this.removeFromSelection(el);
    } else if (this.selection.length < MAX_MULTI_SELECT) {
      this.addToSelection(el);
    }

    if (this.selection.length === 0) {
      this.multiMode = false;
      return;
    }

    this.previousMultiAlternatives = [];

    // Position popup near the last-clicked element
    const pos = this.positionPopupNear(el);
    const items = this.selection.map((item, i) => ({
      text: item.text,
      index: i + 1,
      elementType: item.elementType,
    }));
    this.popup.showMulti(pos, items);
  }

  private handleDblClick = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();

    // Cancel the pending single-click popup
    clearTimeout(this.clickTimer);

    // Clear multi-selection
    this.clearSelection();
    this.multiMode = false;

    // Hide popup if it's visible
    this.popup.hide();

    const el = e.target as HTMLElement;
    const item: SelectedItem = {
      element: el,
      text: el.innerText?.trim() || "",
      elementType: el.tagName.toLowerCase(),
      copyJob: classifyCopyJob(el),
    };
    this.selection = [item];

    // Enter contenteditable mode
    el.contentEditable = "true";
    el.style.outline = "2px solid #3b82f6";
    el.style.outlineOffset = "2px";
    el.style.cursor = "text";
    el.focus();

    // Select all text
    const sel = window.getSelection();
    if (sel) {
      sel.selectAllChildren(el);
    }

    // Commit on blur
    this._inlineBlur = () => this.commitInlineEdit(el);
    el.addEventListener("blur", this._inlineBlur);

    // Commit on Enter, cancel on Escape.
    // stopPropagation on ALL keys so global handlers don't intercept
    // keystrokes while editing.
    this._inlineKeydown = (ke: KeyboardEvent) => {
      ke.stopPropagation();
      if (ke.key === "Enter" && !ke.shiftKey) {
        ke.preventDefault();
        el.blur();
      } else if (ke.key === "Escape") {
        ke.preventDefault();
        this.cancelInlineEdit(el);
      }
    };
    el.addEventListener("keydown", this._inlineKeydown);
  };

  private cleanupInlineEdit(el: HTMLElement): void {
    el.contentEditable = "false";
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.cursor = "";

    if (this._inlineBlur) {
      el.removeEventListener("blur", this._inlineBlur);
      this._inlineBlur = null;
    }
    if (this._inlineKeydown) {
      el.removeEventListener("keydown", this._inlineKeydown);
      this._inlineKeydown = null;
    }

    window.getSelection()?.removeAllRanges();
  }

  private async commitInlineEdit(el: HTMLElement): Promise<void> {
    const newText = el.innerText?.trim() || "";
    const oldText = this.selection[0]?.text || "";
    this.cleanupInlineEdit(el);

    // No-op if unchanged
    if (newText === oldText) return;

    // Write to source files
    const result = await this.postWriteFor(el, newText, oldText);

    // Store undo snapshot
    this.lastChange = {
      entries: [{ element: el, oldText, newText, writeResult: result }],
    };

    // Position popup near element for done toast
    const rect = el.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    const popupEstimatedHeight = 100;
    if (rect.bottom + popupEstimatedHeight > window.innerHeight) {
      top = rect.top + window.scrollY - popupEstimatedHeight - 8;
    }
    const left = Math.max(16, rect.left + window.scrollX);

    // show() positions + makes visible, showWriteResult switches to done phase
    this.popup.show({ top, left }, oldText);
    await this.showWriteResult(result, newText);
  }

  private cancelInlineEdit(el: HTMLElement): void {
    el.innerText = this.selection[0]?.text || "";
    this.cleanupInlineEdit(el);
  }

  private handleShortcut(e: KeyboardEvent): void {
    if (matchesShortcut(e, this.config.shortcut)) {
      e.preventDefault();
      this.toggle();
    }
  }

  private blockNavigation = (e: Event): void => {
    const target = e.target as HTMLElement;

    // Allow clicks within Hemingway UI
    if (target.closest("[data-hemingway-ui]")) return;

    const interactive = target.closest("a, button");
    if (interactive) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // --- Single-select server communication ---

  private async handleGenerate(
    comment: string,
    opts?: { previousAlternatives?: Alternative[]; feedback?: string }
  ): Promise<void> {
    if (this.selection.length === 0) return;

    const selectedItem = this.selection[0];
    this.popup.setPhase("loading");

    const context = gatherContext(selectedItem.element);

    try {
      const body: Record<string, unknown> = {
        text: selectedItem.text,
        elementType: context.elementType,
        copyJob: context.copyJob,
        sectionHtml: context.sectionHtml,
        pagePosition: context.pagePosition,
        sectionRole: context.sectionRole,
        surroundingSections: context.surroundingSections,
        userComment: comment,
      };

      if (opts?.previousAlternatives) {
        body.previousAlternatives = opts.previousAlternatives;
      }
      if (opts?.feedback !== undefined) {
        body.feedback = opts.feedback;
      }

      const res = await fetch(`${this.config.serverUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("[Hemingway] Generate failed:", res.status, await res.text());
        this.popup.setPhase("input");
        return;
      }

      const data = await res.json();
      if (data.alternatives && Array.isArray(data.alternatives)) {
        this.previousAlternatives = data.alternatives;
        this.popup.setAlternatives(data.alternatives);
      } else {
        console.error("[Hemingway] Unexpected response shape:", data);
        this.popup.setPhase("input");
      }
    } catch (err) {
      console.error("[Hemingway] Generate request failed:", err);
      this.popup.setPhase("input");
    }
  }

  private handleRegenerate(feedback: string): void {
    this.handleGenerate(this.popup.getComment(), {
      previousAlternatives: this.previousAlternatives,
      feedback,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async handleChoose(alt: Alternative, _index: number): Promise<void> {
    if (this.selection.length === 0) return;

    const selectedItem = this.selection[0];
    const oldText = selectedItem.text;

    // Apply immediately to the DOM
    selectedItem.element.innerText = alt.text;

    // Write to source files
    const result = await this.postWriteFor(selectedItem.element, alt.text, oldText);

    // Store undo snapshot
    this.lastChange = {
      entries: [{ element: selectedItem.element, oldText, newText: alt.text, writeResult: result }],
    };

    // Record style preference (fire-and-forget)
    fetch(`${this.config.serverUrl}/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: alt.label }),
    }).catch(() => {});

    await this.showWriteResult(result, alt.text);
  }

  private async handleCustomText(text: string): Promise<void> {
    if (this.selection.length === 0) return;

    const selectedItem = this.selection[0];
    const oldText = selectedItem.text;

    // Apply immediately to the DOM
    selectedItem.element.innerText = text;

    // Write to source files
    const result = await this.postWriteFor(selectedItem.element, text, oldText);

    // Store undo snapshot
    this.lastChange = {
      entries: [{ element: selectedItem.element, oldText, newText: text, writeResult: result }],
    };

    await this.showWriteResult(result, text);
  }

  // --- Multi-select server communication ---

  private async handleMultiGenerate(
    comment: string,
    opts?: { previousAlternatives?: MultiAlternative[]; feedback?: string }
  ): Promise<void> {
    if (this.selection.length < 2) return;

    this.popup.setPhase("loading");

    // Gather context from the first element (for section-level info)
    const context = gatherContext(this.selection[0].element);

    try {
      const body: Record<string, unknown> = {
        elements: this.selection.map((item) => ({
          text: item.text,
          elementType: item.elementType,
          copyJob: item.copyJob,
        })),
        sectionHtml: context.sectionHtml,
        pagePosition: context.pagePosition,
        sectionRole: context.sectionRole,
        surroundingSections: context.surroundingSections,
        userComment: comment,
      };

      if (opts?.previousAlternatives) {
        body.previousAlternatives = opts.previousAlternatives;
      }
      if (opts?.feedback !== undefined) {
        body.feedback = opts.feedback;
      }

      const res = await fetch(`${this.config.serverUrl}/generate-multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("[Hemingway] Multi-generate failed:", res.status, await res.text());
        this.popup.setPhase("input");
        return;
      }

      const data = await res.json();
      if (data.alternatives && Array.isArray(data.alternatives)) {
        this.previousMultiAlternatives = data.alternatives;
        this.popup.setMultiAlternatives(data.alternatives);
      } else {
        console.error("[Hemingway] Unexpected multi response shape:", data);
        this.popup.setPhase("input");
      }
    } catch (err) {
      console.error("[Hemingway] Multi-generate request failed:", err);
      this.popup.setPhase("input");
    }
  }

  private handleMultiRegenerate(feedback: string): void {
    this.handleMultiGenerate(this.popup.getComment(), {
      previousAlternatives: this.previousMultiAlternatives,
      feedback,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async handleMultiChoose(alt: MultiAlternative, _index: number): Promise<void> {
    if (this.selection.length < 2) return;

    const entries: UndoEntry[] = [];

    // Apply to DOM immediately
    for (const replacement of alt.texts) {
      const idx = replacement.index - 1; // 1-based → 0-based
      if (idx >= 0 && idx < this.selection.length) {
        this.selection[idx].element.innerText = replacement.text;
      }
    }

    // Write sequentially (elements may share the same source file)
    for (const replacement of alt.texts) {
      const idx = replacement.index - 1;
      if (idx < 0 || idx >= this.selection.length) continue;

      const item = this.selection[idx];
      const result = await this.postWriteFor(item.element, replacement.text, item.text);

      entries.push({
        element: item.element,
        oldText: item.text,
        newText: replacement.text,
        writeResult: result,
      });
    }

    // Store undo snapshot
    this.lastChange = { entries };

    // Record style preference (fire-and-forget)
    fetch(`${this.config.serverUrl}/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: alt.label }),
    }).catch(() => {});

    // Show done with multi count
    const allSuccess = entries.every((e) => e.writeResult.success);
    if (allSuccess) {
      this.popup.showDone({ multiCount: entries.length, canUndo: true });
    } else {
      // Copy all texts to clipboard as fallback
      const allTexts = alt.texts.map((t) => t.text).join("\n\n");
      await this.copyToClipboard(allTexts);
      this.popup.showDone({ clipboard: true, multiCount: entries.length, canUndo: true });
    }

    this.autoHideTimer = window.setTimeout(() => {
      this.popup.hide();
      this.clearSelection();
    }, 4000);
  }

  // --- Shared handlers ---

  private async showWriteResult(result: WriteResult, newText: string): Promise<void> {
    if (!result.success) {
      await this.copyToClipboard(newText);
      this.popup.showDone({ clipboard: true, canUndo: true });
    } else {
      this.popup.showDone({ file: result.file, line: result.line, canUndo: true });
    }
    // Don't auto-hide — the done phase has an undo button, so let the user interact.
    // It will be dismissed when undo completes or the user clicks away / presses Escape.
    this.autoHideTimer = window.setTimeout(() => {
      this.popup.hide();
      this.clearSelection();
    }, 4000);
  }

  private autoHideTimer: number = 0;

  private async handleUndo(): Promise<void> {
    if (!this.lastChange) return;

    clearTimeout(this.autoHideTimer);

    const { entries } = this.lastChange;

    // Revert in reverse order (last written → first) to keep file offsets correct
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];

      // Revert DOM
      entry.element.innerText = entry.oldText;

      // Revert source file (swap old/new)
      if (entry.writeResult.success) {
        await this.postWriteFor(entry.element, entry.oldText, entry.newText);
      }
    }

    this.lastChange = null;
    this.popup.showDone({ reverted: true });

    setTimeout(() => {
      this.popup.hide();
      this.clearSelection();
    }, 1500);
  }

  private handleDismiss(): void {
    this.clearSelection();
  }

  // --- Settings ---

  private async loadSettings(): Promise<void> {
    try {
      const res = await fetch(`${this.config.serverUrl}/config`);
      if (res.ok) {
        const data = await res.json();
        this.indicator.setSettings(data);
        if (data.model) {
          this.popup.setModel(data.model);
        }
      }
    } catch {
      // Server may not be running yet
    }
  }

  // --- Server write ---

  private async postWriteFor(
    el: HTMLElement,
    newText: string,
    oldText: string
  ): Promise<WriteResult> {
    try {
      const res = await fetch(`${this.config.serverUrl}/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldText,
          newText,
          context: {
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            parentTag: el.parentElement?.tagName.toLowerCase() || "",
          },
        }),
      });

      const data = await res.json();
      return data as WriteResult;
    } catch (err) {
      console.error("[Hemingway] Write request failed:", err);
      return { success: false, error: String(err) };
    }
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    }
  }
}

// --- Shortcut matching ---

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
  const key = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));

  const needsMeta = modifiers.has("meta") || modifiers.has("cmd") || modifiers.has("command");
  const needsCtrl = modifiers.has("ctrl") || modifiers.has("control");
  const needsShift = modifiers.has("shift");
  const needsAlt = modifiers.has("alt") || modifiers.has("option");

  if (needsMeta && !e.metaKey) return false;
  if (needsCtrl && !e.ctrlKey) return false;
  if (needsShift && !e.shiftKey) return false;
  if (needsAlt && !e.altKey) return false;

  return e.key.toLowerCase() === key;
}

// --- Auto-init when loaded as IIFE (from /client.js endpoint) ---

if (typeof window !== "undefined") {
  const instance = new HemingwayOverlay();
  (window as unknown as Record<string, unknown>).__hemingway = instance;
}

export type { Alternative, MultiAlternative } from "./popup";
