// --- Settings pill + dropdown sheet ---
// Fixed bottom-left floating pill that expands upward into a settings sheet.
// Rendered inside Shadow DOM for style isolation. Vanilla DOM — no React.

export interface HemingwaySettings {
  model: string;
  styleGuide: string;
  copyBible: string;
  shortcut: string;
}

const MODELS = [
  { value: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Haiku 4.5" },
  { value: "claude-opus-4-6", label: "Opus 4.6" },
];

const FONT_STACK = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`;

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%2386868b' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const FOLDER_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.5C2 2.67 2.67 2 3.5 2H6.29a1 1 0 0 1 .7.29L8.42 3.7a1 1 0 0 0 .7.3H12.5c.83 0 1.5.67 1.5 1.5V12.5c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5V3.5Z" stroke="%2386868b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CLEAR_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L8 8M8 2L2 8" stroke="%23aeaeb2" stroke-width="1.2" stroke-linecap="round"/></svg>`;

const STYLES = /* css */ `
  @keyframes hwPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes hwSheetIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .hw-pill {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 2147483647;
    display: none;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fff;
    color: #1d1d1f;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    font-family: ${FONT_STACK};
    box-shadow: 0 0 0 0.5px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.08);
    user-select: none;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: box-shadow 0.15s ease;
  }

  .hw-pill:hover {
    box-shadow: 0 0 0 0.5px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12);
  }

  .hw-pill.visible {
    display: flex;
  }

  .hw-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #007aff;
    animation: hwPulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* --- Settings sheet --- */
  .hw-sheet-anchor {
    position: fixed;
    bottom: 68px;
    left: 20px;
    z-index: 2147483646;
    display: none;
  }

  .hw-sheet-anchor.visible {
    display: block;
  }

  .hw-sheet {
    width: 300px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 0 0 0.5px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.10);
    padding: 20px;
    font-family: ${FONT_STACK};
    color: #1d1d1f;
    animation: hwSheetIn 0.2s ease-out;
  }

  .hw-sheet-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 16px;
    letter-spacing: -0.01em;
  }

  .hw-sheet-rows {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .hw-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .hw-row-label {
    font-size: 11px;
    font-weight: 500;
    color: #86868b;
    flex-shrink: 0;
    letter-spacing: 0.01em;
  }

  /* --- Custom dropdown --- */
  .hw-dropdown {
    position: relative;
  }

  .hw-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f5f5f7;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 5px 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: ${FONT_STACK};
    color: #1d1d1f;
    cursor: pointer;
    outline: none;
    transition: background 0.15s;
    user-select: none;
  }

  .hw-dropdown-trigger:hover {
    background: #efeff1;
  }

  .hw-dropdown-trigger.open {
    background: #fff;
    box-shadow: 0 0 0 2px rgba(0,122,255,0.15);
  }

  .hw-dropdown-chevron {
    width: 8px;
    height: 5px;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .hw-dropdown-trigger.open .hw-dropdown-chevron {
    transform: rotate(180deg);
  }

  .hw-dropdown-menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 4px);
    min-width: 100%;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 0 0 0.5px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.12);
    padding: 4px;
    display: none;
    animation: hwSheetIn 0.12s ease-out;
  }

  .hw-dropdown-menu.visible {
    display: block;
  }

  .hw-dropdown-option {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
    font-family: ${FONT_STACK};
    color: #1d1d1f;
    border-radius: 5px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.1s;
  }

  .hw-dropdown-option:hover {
    background: #f5f5f7;
  }

  .hw-dropdown-option.selected {
    color: #007aff;
  }

  .hw-dropdown-check {
    width: 12px;
    flex-shrink: 0;
    font-size: 11px;
    color: #007aff;
  }

  /* --- File selector --- */
  .hw-file-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hw-file-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hw-file-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f5f5f7;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: text;
    transition: background 0.15s;
  }

  .hw-file-selector:hover {
    background: #efeff1;
  }

  .hw-file-selector.editing {
    background: #fff;
    box-shadow: 0 0 0 2px rgba(0,122,255,0.15);
  }

  .hw-file-icon {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hw-file-name {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    font-weight: 500;
    font-family: ${FONT_STACK};
    color: #1d1d1f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hw-file-name.empty {
    color: #aeaeb2;
    font-weight: 400;
  }

  .hw-file-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    font-size: 12px;
    font-weight: 500;
    font-family: ${FONT_STACK};
    color: #1d1d1f;
    outline: none;
    padding: 0;
  }

  .hw-file-input::placeholder {
    color: #aeaeb2;
    font-weight: 400;
  }

  .hw-file-clear {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s;
  }

  .hw-file-clear:hover {
    background: rgba(0,0,0,0.06);
  }

  /* --- Shortcut display --- */
  .hw-shortcut-display {
    font-size: 12px;
    font-weight: 500;
    color: #86868b;
    letter-spacing: 0.02em;
  }

  /* --- Click-outside overlay --- */
  .hw-sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483645;
    display: none;
  }

  .hw-sheet-backdrop.visible {
    display: block;
  }
`;

export class HemingwayIndicator {
  private shadow: ShadowRoot;
  private pill: HTMLElement;
  private sheetAnchor: HTMLElement;
  private sheet: HTMLElement;
  private backdrop: HTMLElement;
  private visible: boolean = false;
  private sheetOpen: boolean = false;

  private settings: HemingwaySettings = {
    model: "claude-sonnet-4-6",
    styleGuide: "",
    copyBible: "",
    shortcut: "⌘⇧C",
  };

  /** Called with (key, value) when a setting changes in the UI */
  onSettingsChange: ((key: keyof HemingwaySettings, value: string) => void) | null = null;

  constructor(host: HTMLElement) {
    this.shadow = host.attachShadow({ mode: "open" });

    // Inject styles
    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    // --- Click-outside backdrop ---
    this.backdrop = document.createElement("div");
    this.backdrop.className = "hw-sheet-backdrop";
    this.backdrop.addEventListener("click", () => this.closeSheet());
    this.shadow.appendChild(this.backdrop);

    // --- Settings sheet (anchored above the pill) ---
    this.sheetAnchor = document.createElement("div");
    this.sheetAnchor.className = "hw-sheet-anchor";

    this.sheet = document.createElement("div");
    this.sheet.className = "hw-sheet";
    this.sheet.addEventListener("click", (e) => e.stopPropagation());
    this.sheetAnchor.appendChild(this.sheet);

    this.shadow.appendChild(this.sheetAnchor);

    // --- Floating pill ---
    this.pill = document.createElement("div");
    this.pill.className = "hw-pill";
    this.pill.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSettings();
    });

    const dot = document.createElement("span");
    dot.className = "hw-pulse-dot";
    this.pill.appendChild(dot);

    const label = document.createTextNode("Hemingway");
    this.pill.appendChild(label);

    this.shadow.appendChild(this.pill);

    // Build initial sheet content
    this.buildSheet();
  }

  // --- Public API ---

  show(): void {
    this.visible = true;
    this.pill.classList.add("visible");
  }

  hide(): void {
    this.visible = false;
    this.pill.classList.remove("visible");
    this.closeSheet();
  }

  destroy(): void {
    this.closeSheet();
  }

  toggleSettings(): void {
    if (this.sheetOpen) {
      this.closeSheet();
    } else {
      this.openSheet();
    }
  }

  setSettings(settings: Partial<HemingwaySettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.buildSheet();
  }

  getSettings(): HemingwaySettings {
    return { ...this.settings };
  }

  // --- Sheet open / close ---

  private openSheet(): void {
    this.sheetOpen = true;
    this.buildSheet();
    this.sheetAnchor.classList.add("visible");
    this.backdrop.classList.add("visible");
  }

  private closeSheet(): void {
    this.sheetOpen = false;
    this.sheetAnchor.classList.remove("visible");
    this.backdrop.classList.remove("visible");
  }

  // --- Sheet DOM construction ---

  private buildSheet(): void {
    this.sheet.innerHTML = "";

    // Title
    const title = document.createElement("div");
    title.className = "hw-sheet-title";
    title.textContent = "Settings";
    this.sheet.appendChild(title);

    // Rows container
    const rows = document.createElement("div");
    rows.className = "hw-sheet-rows";

    // 1. Model row
    rows.appendChild(this.buildModelRow());

    // 2. Style guide file selector
    rows.appendChild(
      this.buildFileRow("Style guide", "styleGuide", this.settings.styleGuide, "docs/style-guide.md")
    );

    // 3. Copy bible file selector
    rows.appendChild(
      this.buildFileRow("Copy bible", "copyBible", this.settings.copyBible, "docs/copy-bible.md")
    );

    // 4. Shortcut row
    rows.appendChild(this.buildShortcutRow());

    this.sheet.appendChild(rows);
  }

  private buildModelRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "hw-row";

    const label = document.createElement("span");
    label.className = "hw-row-label";
    label.textContent = "Model";
    row.appendChild(label);

    const dropdown = document.createElement("div");
    dropdown.className = "hw-dropdown";

    // Trigger button
    const trigger = document.createElement("div");
    trigger.className = "hw-dropdown-trigger";

    const currentLabel = MODELS.find((m) => m.value === this.settings.model)?.label ?? "Sonnet 4.6";
    const triggerText = document.createElement("span");
    triggerText.textContent = currentLabel;
    trigger.appendChild(triggerText);

    const chevron = document.createElement("span");
    chevron.className = "hw-dropdown-chevron";
    chevron.innerHTML = `<svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L4 4L7 1" stroke="#86868b" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    trigger.appendChild(chevron);

    dropdown.appendChild(trigger);

    // Menu
    const menu = document.createElement("div");
    menu.className = "hw-dropdown-menu";

    for (const m of MODELS) {
      const option = document.createElement("div");
      option.className = `hw-dropdown-option${m.value === this.settings.model ? " selected" : ""}`;

      const check = document.createElement("span");
      check.className = "hw-dropdown-check";
      check.textContent = m.value === this.settings.model ? "\u2713" : "";
      option.appendChild(check);

      const optLabel = document.createElement("span");
      optLabel.textContent = m.label;
      option.appendChild(optLabel);

      option.addEventListener("click", (e) => {
        e.stopPropagation();
        this.settings.model = m.value;
        this.onSettingsChange?.("model", m.value);
        triggerText.textContent = m.label;

        // Update selected state
        menu.querySelectorAll(".hw-dropdown-option").forEach((opt) => {
          opt.classList.remove("selected");
          (opt.querySelector(".hw-dropdown-check") as HTMLElement).textContent = "";
        });
        option.classList.add("selected");
        check.textContent = "\u2713";

        // Close menu
        menu.classList.remove("visible");
        trigger.classList.remove("open");
      });

      menu.appendChild(option);
    }

    dropdown.appendChild(menu);

    // Toggle menu on trigger click
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains("visible");
      if (isOpen) {
        menu.classList.remove("visible");
        trigger.classList.remove("open");
      } else {
        menu.classList.add("visible");
        trigger.classList.add("open");
      }
    });

    row.appendChild(dropdown);

    return row;
  }

  private buildFileRow(
    labelText: string,
    key: "styleGuide" | "copyBible",
    value: string,
    placeholder: string
  ): HTMLElement {
    const row = document.createElement("div");
    row.className = "hw-file-row";

    // Header with label
    const header = document.createElement("div");
    header.className = "hw-file-header";

    const label = document.createElement("span");
    label.className = "hw-row-label";
    label.textContent = labelText;
    header.appendChild(label);

    row.appendChild(header);

    // File selector pill
    const selector = document.createElement("div");
    selector.className = "hw-file-selector";

    // Folder icon
    const icon = document.createElement("span");
    icon.className = "hw-file-icon";
    icon.innerHTML = FOLDER_SVG;
    selector.appendChild(icon);

    // Display the filename (not the full path) when set
    const displayName = value ? this.getFileName(value) : "";

    // Static display (shown when not editing)
    const nameSpan = document.createElement("span");
    nameSpan.className = `hw-file-name${!value ? " empty" : ""}`;
    nameSpan.textContent = value ? displayName : placeholder;
    nameSpan.title = value || "";
    selector.appendChild(nameSpan);

    // Input (hidden until clicked)
    const input = document.createElement("input");
    input.type = "text";
    input.className = "hw-file-input";
    input.value = value;
    input.placeholder = placeholder;
    input.style.display = "none";

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = this.settings[key];
        input.blur();
      }
    });

    input.addEventListener("blur", () => {
      const newValue = input.value.trim();
      this.settings[key] = newValue;
      this.onSettingsChange?.(key, newValue);

      // Switch back to display mode
      input.style.display = "none";
      nameSpan.style.display = "";
      nameSpan.className = `hw-file-name${!newValue ? " empty" : ""}`;
      nameSpan.textContent = newValue ? this.getFileName(newValue) : placeholder;
      nameSpan.title = newValue || "";
      selector.classList.remove("editing");

      // Show/hide clear button
      if (clearBtn) {
        clearBtn.style.display = newValue ? "" : "none";
      }
    });

    selector.appendChild(input);

    // Clear button (only shown when value is set)
    const clearBtn = document.createElement("button");
    clearBtn.className = "hw-file-clear";
    clearBtn.innerHTML = CLEAR_SVG;
    clearBtn.title = "Clear";
    clearBtn.style.display = value ? "" : "none";
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.settings[key] = "";
      this.onSettingsChange?.(key, "");
      nameSpan.className = "hw-file-name empty";
      nameSpan.textContent = placeholder;
      nameSpan.title = "";
      nameSpan.style.display = "";
      input.style.display = "none";
      input.value = "";
      selector.classList.remove("editing");
      clearBtn.style.display = "none";
    });
    selector.appendChild(clearBtn);

    // Click to edit
    selector.addEventListener("click", (e) => {
      if (e.target === clearBtn || clearBtn.contains(e.target as Node)) return;
      nameSpan.style.display = "none";
      input.style.display = "";
      input.value = this.settings[key];
      selector.classList.add("editing");
      input.focus();
      input.select();
    });

    row.appendChild(selector);

    return row;
  }

  private getFileName(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
  }

  private buildShortcutRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "hw-row";

    const label = document.createElement("span");
    label.className = "hw-row-label";
    label.textContent = "Shortcut";
    row.appendChild(label);

    const display = document.createElement("span");
    display.className = "hw-shortcut-display";
    display.textContent = this.settings.shortcut;
    row.appendChild(display);

    return row;
  }
}
