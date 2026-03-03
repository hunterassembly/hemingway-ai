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

interface NotepadBlock {
  id: number;
  groupId: number;
  groupOriginalText: string;
  segmentIndex: number;
  segmentKind: "full" | "text" | "url";
  element: HTMLElement;
  text: string;
  tagName: string;
  copyJob: string;
  sectionLabel: string;
}

interface HemingwayConfig {
  serverUrl: string;
  shortcut: string;
  notepadShortcut: string;
  accentColor: string;
}

interface HemingwayBootstrapConfig {
  serverUrl?: string;
  shortcut?: string;
  notepadShortcut?: string;
  accentColor?: string;
}

const DEFAULTS: HemingwayConfig = {
  serverUrl: "http://localhost:4800",
  shortcut: "ctrl+shift+h",
  notepadShortcut: "alt+shift+h",
  accentColor: "#3b82f6",
};

const MAX_MULTI_SELECT = 5;
const MAX_UNDO_STEPS = 5;
const DONE_TOAST_AUTO_HIDE_MS = 2000;

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
  private undoHistory: UndoSnapshot[] = [];
  private redoHistory: UndoSnapshot[] = [];
  private notepadBlocks: NotepadBlock[] = [];

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
  private _handleOutsideClick: (e: MouseEvent) => void;

  constructor(config?: Partial<HemingwayConfig>) {
    this.config = { ...DEFAULTS, ...config };
    this.config.serverUrl = normalizeBaseUrl(this.config.serverUrl);

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
    this.indicator.setSettings({ serverUrl: this.config.serverUrl });

    // Wire settings changes to server
    const postSetting = async (key: string, value: string): Promise<void> => {
      const res = await fetch(`${this.config.serverUrl}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        throw new Error(`Config update failed (${res.status})`);
      }
      const data = await res.json();
      this.indicator.setSettings({ ...data, serverUrl: this.config.serverUrl });
    };
    this.indicator.onSettingsChange = (key: string, value: string) => {
      void postSetting(key, value).catch((err) =>
        console.error("[Hemingway] Failed to update config:", err)
      );
    };
    this.indicator.onApiKeySave = async (value: string) => {
      try {
        await postSetting("apiKey", value);
        return true;
      } catch (err) {
        console.error("[Hemingway] Failed to save API key:", err);
        return false;
      }
    };
    this.indicator.onGenerateStyleGuide = async () => {
      try {
        const res = await fetch(`${this.config.serverUrl}/styleguide/generate`, {
          method: "POST",
        });
        if (!res.ok) {
          throw new Error(`Styleguide generation failed (${res.status})`);
        }
        const data = (await res.json()) as { created?: boolean };
        return data.created ? "created" : "exists";
      } catch (err) {
        console.error("[Hemingway] Failed to generate style guide:", err);
        return "failed";
      }
    };
    this.indicator.onUndoAction = () => {
      this.handleUndo();
    };
    this.indicator.onRedoAction = () => {
      this.handleRedo();
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
    this.popup.onNotepadApply = (markdown: string) => {
      this.handleNotepadApply(markdown);
    };
    this.popup.onNotepadCopy = (markdown: string) => {
      this.copyToClipboard(markdown);
    };

    // Keyboard shortcut listener
    this._handleShortcut = this.handleShortcut.bind(this);
    // Capture-phase listener so site scripts don't swallow shortcut events first.
    window.addEventListener("keydown", this._handleShortcut, true);

    // Navigation blocker
    this._blockNavigation = this.blockNavigation.bind(this);

    // Dismiss popup on outside click
    this._handleOutsideClick = this.handleOutsideClick.bind(this);
  }

  // --- Public API ---

  activate(): void {
    if (this.active) return;
    this.active = true;

    this.indicator.show();
    this.syncHistoryControls();
    this.runDiscovery();

    // Block navigation clicks while active
    document.addEventListener("click", this._blockNavigation, true);

    // Dismiss popup on outside click
    document.addEventListener("mousedown", this._handleOutsideClick, true);

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
    document.removeEventListener("mousedown", this._handleOutsideClick, true);
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
    window.removeEventListener("keydown", this._handleShortcut, true);

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
      text: getElementReadableText(el),
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

  private positionNotepad(): { top: number; left: number } {
    const top = window.scrollY + Math.max(16, window.innerHeight * 0.08);
    const left = window.scrollX + 16;
    return { top, left };
  }

  // --- Event handlers ---

  private getEventElement(e: Event): HTMLElement | null {
    const current = e.currentTarget;
    if (current instanceof HTMLElement) return current;
    const target = e.target;
    if (target instanceof HTMLElement) return target;
    return null;
  }

  private handleHover = (e: Event): void => {
    const el = this.getEventElement(e);
    if (!el) return;
    // Skip hover styling on already-selected elements to avoid flicker
    if (this.isSelected(el)) return;
    el.style.outline = `1.5px dashed rgba(0, 122, 255, 0.35)`;
    el.style.outlineOffset = "2px";
    el.style.cursor = "pointer";
  };

  private handleHoverOut = (e: Event): void => {
    const el = this.getEventElement(e);
    if (!el) return;
    // Don't clear styling on selected elements
    if (this.isSelected(el)) return;
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.cursor = "";
  };

  private handleClick = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();

    const el = this.getEventElement(e);
    if (!el) return;
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
      text: getElementReadableText(el),
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

    const el = this.getEventElement(e);
    if (!el) return;
    const item: SelectedItem = {
      element: el,
      text: getElementReadableText(el),
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

    this.pushUndoSnapshot({
      entries: [{ element: el, oldText, newText, writeResult: result }],
    });

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
    if (e.defaultPrevented) return;

    if (this.active && isUndoHotkey(e) && !isEditingTextInput(e)) {
      if (this.hasUndoHistory()) {
        e.preventDefault();
        void this.handleUndo();
      }
      return;
    }

    if (this.active && isRedoHotkey(e) && !isEditingTextInput(e)) {
      if (this.hasRedoHistory()) {
        e.preventDefault();
        void this.handleRedo();
      }
      return;
    }

    if (matchesShortcut(e, this.config.shortcut)) {
      e.preventDefault();
      this.toggle();
    }
  }

  private openNotepad(): void {
    if (!this.active) {
      this.activate();
    }

    this.clearSelection();
    this.popup.hide();

    const blocks = this.collectNotepadBlocks();
    if (blocks.length === 0) {
      return;
    }

    this.notepadBlocks = blocks;
    const markdown = this.buildNotepadMarkdown(blocks);
    this.popup.showNotepad(this.positionNotepad(), markdown);
  }

  private collectNotepadBlocks(): NotepadBlock[] {
    const found = Array.from(this.discovery.discover())
      .filter((el) => !!getElementReadableText(el))
      .sort((a, b) => this.compareDomPosition(a, b));

    const sectionIndexes = new Map<HTMLElement, number>();
    const sectionLabels = new Map<HTMLElement, string>();
    const blocks: NotepadBlock[] = [];
    let nextGroupId = 1;
    let nextSectionIndex = 1;

    for (const el of found) {
      const section = this.findSectionContainer(el);
      if (section && !sectionIndexes.has(section)) {
        sectionIndexes.set(section, nextSectionIndex++);
      }

      const sectionLabel = this.buildSectionLabel(section, sectionIndexes, sectionLabels);
      const fullText = getElementReadableText(el);
      const segments = splitTextIntoUrlSegments(fullText);
      const hasMixedUrlText =
        segments.length > 1 && segments.some((segment) => segment.kind === "url");
      const groupId = nextGroupId++;

      if (hasMixedUrlText) {
        let segmentIndex = 0;
        for (const segment of segments) {
          blocks.push({
            id: blocks.length + 1,
            groupId,
            groupOriginalText: fullText,
            segmentIndex: segmentIndex++,
            segmentKind: segment.kind,
            element: el,
            text: segment.text,
            tagName: el.tagName.toLowerCase(),
            copyJob: segment.kind === "url" ? "url-token" : classifyCopyJob(el),
            sectionLabel,
          });
        }
      } else {
        blocks.push({
          id: blocks.length + 1,
          groupId,
          groupOriginalText: fullText,
          segmentIndex: 0,
          segmentKind: "full",
          element: el,
          text: fullText,
          tagName: el.tagName.toLowerCase(),
          copyJob: classifyCopyJob(el),
          sectionLabel,
        });
      }
    }

    return blocks;
  }

  private buildSectionLabel(
    section: HTMLElement | null,
    sectionIndexes: Map<HTMLElement, number>,
    sectionLabels: Map<HTMLElement, string>
  ): string {
    if (!section) {
      return "Section 1 - page";
    }

    const cached = sectionLabels.get(section);
    if (cached) return cached;

    const index = sectionIndexes.get(section) ?? 1;
    const heading = this.extractSectionHeading(section);
    const role = gatherContext(section).sectionRole;

    const label = heading ? `Section ${index} - ${role} - ${heading}` : `Section ${index} - ${role}`;
    sectionLabels.set(section, label);
    return label;
  }

  private findSectionContainer(el: HTMLElement): HTMLElement | null {
    const section = el.closest("section");
    if (section) return section as HTMLElement;

    const sectionLike = el.closest("[role='region'], [role='main'], main, article, .section");
    if (sectionLike) return sectionLike as HTMLElement;

    let current: HTMLElement | null = el;
    while (current && current.parentElement !== document.body) {
      current = current.parentElement;
    }
    return current;
  }

  private extractSectionHeading(section: HTMLElement): string {
    const heading = section.querySelector("h1, h2, h3, h4, h5, h6");
    if (!heading) return "";

    const text = getElementReadableText(heading as HTMLElement);
    if (!text) return "";

    return text.replace(/\s+/g, " ").slice(0, 80);
  }

  private buildNotepadMarkdown(blocks: NotepadBlock[]): string {
    const path = `${window.location.pathname}${window.location.search}`;
    const lines: string[] = [
      "# Hemingway Notepad",
      "",
      `Page: ${path || "/"}`,
      "",
    ];

    let currentSection = "";
    for (const block of blocks) {
      if (block.sectionLabel !== currentSection) {
        currentSection = block.sectionLabel;
        lines.push(`## ${currentSection}`);
        lines.push("");
      }

      lines.push(
        `<!-- hw:id:${block.id} kind:${block.segmentKind} tag:${block.tagName} copyJob:${block.copyJob} -->`
      );
      lines.push(block.text);
      lines.push("");
    }

    return lines.join("\n").trim() + "\n";
  }

  private parseNotepadMarkdown(markdown: string): Map<number, string> {
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const parsed = new Map<number, string>();
    let currentId: number | null = null;
    let buffer: string[] = [];

    const flush = () => {
      if (currentId === null) return;
      while (buffer.length > 0 && !buffer[buffer.length - 1].trim()) {
        buffer.pop();
      }
      parsed.set(currentId, buffer.join("\n").trim());
    };

    for (const line of lines) {
      const marker = line.match(/^<!--\s*hw:id:(\d+)\b.*-->$/);
      if (marker) {
        flush();
        currentId = Number(marker[1]);
        buffer = [];
        continue;
      }

      if (currentId !== null) {
        buffer.push(line);
      }
    }

    flush();
    return parsed;
  }

  private async handleNotepadApply(markdown: string): Promise<void> {
    if (this.notepadBlocks.length === 0) return;

    const parsed = this.parseNotepadMarkdown(markdown);
    const grouped = new Map<number, NotepadBlock[]>();
    for (const block of this.notepadBlocks) {
      const existing = grouped.get(block.groupId);
      if (existing) {
        existing.push(block);
      } else {
        grouped.set(block.groupId, [block]);
      }
    }

    const entries: UndoEntry[] = [];

    for (const blocks of grouped.values()) {
      const ordered = [...blocks].sort((a, b) => a.segmentIndex - b.segmentIndex);
      if (ordered.length === 0) continue;

      const oldText = ordered[0].groupOriginalText;
      const parts = ordered.map((block) => {
        const parsedText = parsed.get(block.id);
        if (parsedText === undefined) return block.text;
        return parsedText.trim();
      });
      const newText = normalizeNotepadText(parts.join(" "));
      if (!newText || newText === oldText) continue;

      ordered[0].element.innerText = newText;
      const result = await this.postWriteFor(ordered[0].element, newText, oldText);
      entries.push({
        element: ordered[0].element,
        oldText,
        newText,
        writeResult: result,
      });
    }

    if (entries.length === 0) {
      return;
    }

    this.pushUndoSnapshot({ entries });

    const allSuccess = entries.every((entry) => entry.writeResult.success);
    if (allSuccess) {
      this.popup.showDone({ multiCount: entries.length, canUndo: this.hasUndoHistory() });
    } else {
      const changed = entries.map((entry) => entry.newText).join("\n\n");
      await this.copyToClipboard(changed);
      this.popup.showDone({
        clipboard: true,
        multiCount: entries.length,
        canUndo: this.hasUndoHistory(),
      });
    }

    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = window.setTimeout(() => {
      this.popup.hide();
      this.clearSelection();
    }, DONE_TOAST_AUTO_HIDE_MS);
  }

  private compareDomPosition(a: HTMLElement, b: HTMLElement): number {
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
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
        pageBrief: context.pageBrief,
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

    this.pushUndoSnapshot({
      entries: [{ element: selectedItem.element, oldText, newText: alt.text, writeResult: result }],
    });

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

    this.pushUndoSnapshot({
      entries: [{ element: selectedItem.element, oldText, newText: text, writeResult: result }],
    });

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
        pageBrief: context.pageBrief,
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
    this.pushUndoSnapshot({ entries });

    // Record style preference (fire-and-forget)
    fetch(`${this.config.serverUrl}/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: alt.label }),
    }).catch(() => {});

    // Show done with multi count
    const allSuccess = entries.every((e) => e.writeResult.success);
    if (allSuccess) {
      this.popup.showDone({ multiCount: entries.length, canUndo: this.hasUndoHistory() });
    } else {
      // Copy all texts to clipboard as fallback
      const allTexts = alt.texts.map((t) => t.text).join("\n\n");
      await this.copyToClipboard(allTexts);
      this.popup.showDone({
        clipboard: true,
        multiCount: entries.length,
        canUndo: this.hasUndoHistory(),
      });
    }

    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = window.setTimeout(() => {
      this.popup.hide();
      this.clearSelection();
    }, DONE_TOAST_AUTO_HIDE_MS);
  }

  // --- Shared handlers ---

  private pushUndoSnapshot(snapshot: UndoSnapshot): void {
    this.undoHistory.push(snapshot);
    if (this.undoHistory.length > MAX_UNDO_STEPS) {
      this.undoHistory.shift();
    }
    this.redoHistory = [];
    this.syncHistoryControls();
  }

  private hasUndoHistory(): boolean {
    return this.undoHistory.length > 0;
  }

  private hasRedoHistory(): boolean {
    return this.redoHistory.length > 0;
  }

  private syncHistoryControls(): void {
    this.indicator.setHistoryState({
      canUndo: this.hasUndoHistory(),
      canRedo: this.hasRedoHistory(),
    });
  }

  private async showWriteResult(result: WriteResult, newText: string): Promise<void> {
    if (!result.success) {
      await this.copyToClipboard(newText);
      this.popup.showDone({ clipboard: true, canUndo: this.hasUndoHistory() });
    } else {
      this.popup.showDone({ file: result.file, line: result.line, canUndo: this.hasUndoHistory() });
    }
    // Keep the done confirmation brief and non-blocking.
    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = window.setTimeout(() => {
      this.popup.hide();
      this.clearSelection();
    }, DONE_TOAST_AUTO_HIDE_MS);
  }

  private autoHideTimer: number = 0;

  private async handleUndo(): Promise<void> {
    const snapshot = this.undoHistory.pop();
    if (!snapshot) return;

    clearTimeout(this.autoHideTimer);

    const { entries } = snapshot;

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

    this.redoHistory.push(snapshot);

    const remaining = this.undoHistory.length;
    this.popup.showDone({ reverted: true, canUndo: remaining > 0, undoRemaining: remaining });
    this.syncHistoryControls();

    if (remaining === 0) {
      setTimeout(() => {
        this.popup.hide();
        this.clearSelection();
      }, 1500);
    }
  }

  private async handleRedo(): Promise<void> {
    const snapshot = this.redoHistory.pop();
    if (!snapshot) return;

    clearTimeout(this.autoHideTimer);

    for (const entry of snapshot.entries) {
      entry.element.innerText = entry.newText;
      if (entry.writeResult.success) {
        await this.postWriteFor(entry.element, entry.newText, entry.oldText);
      }
    }

    this.undoHistory.push(snapshot);
    if (this.undoHistory.length > MAX_UNDO_STEPS) {
      this.undoHistory.shift();
    }

    this.popup.showDone({
      multiCount: snapshot.entries.length > 1 ? snapshot.entries.length : undefined,
      canUndo: this.hasUndoHistory(),
    });
    this.syncHistoryControls();
  }

  private handleDismiss(): void {
    this.clearSelection();
  }

  private handleOutsideClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Ignore clicks inside Hemingway UI (popup, indicator, badges)
    if (target.closest("[data-hemingway-ui]")) return;

    // Ignore clicks on tracked/selected elements (those have their own handlers)
    if (this.discovery.getTrackedElements().has(target)) return;
    if (this.isInsideTrackedElement(target)) return;

    // Something outside was clicked — dismiss popup and clear selection
    if (this.selection.length > 0 || this.popup.isVisible()) {
      this.popup.hide();
      this.clearSelection();
    }
  }

  private isInsideTrackedElement(target: HTMLElement): boolean {
    const tracked = this.discovery.getTrackedElements();
    let el: HTMLElement | null = target;
    while (el) {
      if (tracked.has(el)) return true;
      el = el.parentElement;
    }
    return false;
  }

  // --- Settings ---

  private async loadSettings(): Promise<void> {
    try {
      const res = await fetch(`${this.config.serverUrl}/config`);
      if (res.ok) {
        const data = await res.json();
        this.indicator.setSettings({ ...data, serverUrl: this.config.serverUrl });
        if (typeof data.shortcut === "string") {
          this.config.shortcut = data.shortcut;
        }
        if (typeof data.notepadShortcut === "string") {
          this.config.notepadShortcut = data.notepadShortcut;
        }
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

function normalizeBaseUrl(value: string): string {
  if (!value) return value;
  if (value.length > 1 && value.endsWith("/")) {
    return value.replace(/\/+$/, "");
  }
  return value;
}

function getElementReadableText(el: HTMLElement): string {
  const visible = normalizeNotepadText(el.innerText || "");
  if (visible) return visible;
  return normalizeNotepadText(el.textContent || "");
}

function normalizeNotepadText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitTextIntoUrlSegments(
  text: string
): Array<{ kind: "text" | "url"; text: string }> {
  const input = text.trim();
  if (!input) return [];

  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const segments: Array<{ kind: "text" | "url"; text: string }> = [];
  let lastIndex = 0;

  for (const match of input.matchAll(urlPattern)) {
    const raw = match[0];
    if (typeof raw !== "string") continue;
    const start = match.index ?? 0;
    if (start > lastIndex) {
      const head = normalizeNotepadText(input.slice(lastIndex, start));
      if (head) {
        segments.push({ kind: "text", text: head });
      }
    }

    const url = normalizeNotepadText(raw);
    if (url) {
      segments.push({ kind: "url", text: url });
    }
    lastIndex = start + raw.length;
  }

  if (lastIndex < input.length) {
    const tail = normalizeNotepadText(input.slice(lastIndex));
    if (tail) {
      segments.push({ kind: "text", text: tail });
    }
  }

  if (segments.length === 0) {
    return [{ kind: "text", text: input }];
  }

  return segments;
}

function isMacPlatform(): boolean {
  return /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
}

function isUndoHotkey(e: KeyboardEvent): boolean {
  if (e.key.toLowerCase() !== "z" || e.shiftKey || e.altKey) return false;
  return isMacPlatform() ? e.metaKey : e.ctrlKey;
}

function isRedoHotkey(e: KeyboardEvent): boolean {
  if (e.altKey) return false;
  const key = e.key.toLowerCase();
  if (isMacPlatform()) {
    return key === "z" && e.metaKey && e.shiftKey;
  }
  if (key === "z" && e.ctrlKey && e.shiftKey) return true;
  return key === "y" && e.ctrlKey && !e.shiftKey;
}

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  if (el.getAttribute("role") === "textbox") return true;
  return false;
}

function getDeepActiveElement(root: Document | ShadowRoot): Element | null {
  let active: Element | null = root.activeElement;
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

function isEditingTextInput(e: KeyboardEvent): boolean {
  const target = e.target instanceof Element ? e.target : null;
  if (isEditableElement(target)) return true;

  const active = getDeepActiveElement(document);
  return isEditableElement(active);
}

// --- Shortcut matching ---

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
  const key = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));

  const isMac = isMacPlatform();

  const needsMeta = modifiers.has("meta") || modifiers.has("cmd") || modifiers.has("command");
  const needsCtrl = modifiers.has("ctrl") || modifiers.has("control");
  const needsShift = modifiers.has("shift");
  const needsAlt = modifiers.has("alt") || modifiers.has("option");

  // On Mac, treat "ctrl" as Cmd (metaKey) since that's the standard convention
  if (needsCtrl && !needsMeta) {
    if (isMac) {
      // Support both Command and Control on Mac for compatibility.
      if (!e.metaKey && !e.ctrlKey) return false;
    } else {
      if (!e.ctrlKey) return false;
    }
  } else {
    if (needsMeta && !e.metaKey) return false;
    if (needsCtrl && !e.ctrlKey) return false;
  }
  if (needsShift && !e.shiftKey) return false;
  if (needsAlt && !e.altKey) return false;

  return e.key.toLowerCase() === key;
}

// --- Auto-init when loaded as IIFE (from /client.js endpoint) ---

if (typeof window !== "undefined") {
  const win = window as unknown as Record<string, unknown>;
  const bootstrap = (win.__HEMINGWAY_CONFIG as HemingwayBootstrapConfig | undefined) ?? {};
  const instance = new HemingwayOverlay(bootstrap);
  win.__hemingway = instance;
}

export type { Alternative, MultiAlternative } from "./popup";
