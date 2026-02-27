// --- Settings pill + settings panel ---
// Fixed bottom-left floating pill that expands into a full settings panel.
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

const SVG_LOGO = `<svg width="360" height="86" viewBox="0 0 360 86" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M172.039 48.0713C176.491 48.0713 179.441 49.9869 181.098 52.9375L181.667 48.3818H185.343V73.4883C185.343 81.0974 181.305 85.4453 172.246 85.4453C165.517 85.4453 160.806 82.2879 160.133 76.4902H164.481C165.206 79.8032 168.157 81.667 172.557 81.667C178.095 81.667 181.098 79.0786 181.098 73.333V70.2266C179.338 73.2289 176.491 75.0927 172.039 75.0928C164.74 75.0928 159.356 70.175 159.356 61.582C159.356 53.5067 164.74 48.0713 172.039 48.0713ZM267.542 69.4502L275.825 48.3818H280.328L267.749 79.2334C266.093 83.4262 265.11 85.1346 261.383 85.1348H255.533V81.2529H259.984C262.417 81.2529 262.832 80.6312 263.815 78.1465L265.109 74.9375L254.55 48.3818H259.053L267.542 69.4502ZM360 32.5293L334.007 58.6631L322.353 48.0479V61.0146C304.957 57.38 294.615 68.9329 291.456 75.2939H284.706L360 0V32.5293ZM44.8477 48.0713C52.3018 48.0713 57.1679 52.7822 57.375 60.5986C57.375 61.0128 57.3232 61.8926 57.2715 62.5137H36.7725V62.7725C36.9278 67.7936 40.0854 71.3134 45.1064 71.3135C48.8333 71.3135 51.7322 69.3469 52.6123 65.9307H56.9092C55.8738 71.2105 51.5251 75.0928 45.417 75.0928C37.4971 75.0927 32.3203 69.6572 32.3203 61.582C32.3203 53.5586 37.3936 48.0714 44.8477 48.0713ZM238.397 48.0713C245.127 48.0714 249.009 51.436 249.009 57.5957V69.1396C249.009 70.5371 249.527 70.8993 250.717 70.8994H252.063V74.7822H249.733C246.214 74.7821 245.023 73.2805 244.972 70.6924C243.315 73.0736 240.674 75.0928 236.119 75.0928C230.322 75.0926 226.388 72.1937 226.388 67.3799C226.388 62.0999 230.064 59.1494 237 59.1494H244.765V57.3369C244.764 53.9207 242.331 51.8507 238.19 51.8506C234.463 51.8506 231.979 53.6101 231.461 56.3018H227.216C227.837 51.1254 232.03 48.0713 238.397 48.0713ZM4.50391 54.2832H20.9131V38.5469H25.417V74.7822H20.9131V58.4248H4.50391V74.7822H0.000976562V38.5469H4.50391V54.2832ZM89.0986 48.0713C94.3267 48.0713 97.6912 51.7466 97.6914 57.751V74.7822H93.4463V57.9062C93.4461 54.3866 91.7902 52.0577 88.5293 52.0576C85.0611 52.0576 83.042 54.6978 83.042 58.166V74.7822H78.7969V57.9062C78.7967 54.6453 77.4514 52.0577 73.7246 52.0576C70.3081 52.0576 68.3926 54.7495 68.3926 58.5283V74.7822H64.1475V48.3818H67.7197L68.082 51.1777C69.4279 49.2624 71.7057 48.0713 74.708 48.0713C77.8656 48.0713 80.3504 49.6765 81.541 52.1094C83.094 49.6764 85.6304 48.0713 89.0986 48.0713ZM116.007 70.8994H124.031V74.7822H103.791V70.8994H111.763V52.2646H103.791V48.3818H116.007V70.8994ZM142.495 48.0713C148.189 48.0713 152.849 51.1776 152.849 59.5635V74.7822H148.604V59.8223C148.604 54.6976 146.119 51.9541 141.771 51.9541C137.112 51.9542 134.109 55.4222 134.109 61.0645V74.7822H129.865V48.3818H133.54L134.109 51.9541C135.662 49.9353 138.302 48.0714 142.495 48.0713ZM199.517 69.8643L204.951 51.8506H208.782L214.062 69.8643L218.669 48.3818H222.707L216.806 74.7822H211.732L206.815 58.166L201.69 74.7822H196.617L190.82 48.3818H195.064L199.517 69.8643ZM236.586 62.7207C232.807 62.7207 230.685 64.1187 230.685 67.1211C230.685 69.7092 232.911 71.4688 236.431 71.4688C241.71 71.4686 244.765 68.4145 244.765 64.0146V62.7207H236.586ZM172.453 51.8506C167.225 51.8506 163.705 55.8361 163.705 61.582C163.705 67.3279 167.225 71.3135 172.453 71.3135C177.63 71.3134 181.149 67.3279 181.149 61.6855C181.149 55.8879 177.63 51.8506 172.453 51.8506ZM44.8994 51.7988C41.0171 51.7989 37.4454 54.5942 37.0312 58.8906H52.8193C52.4052 54.3353 49.2994 51.7988 44.8994 51.7988ZM113.937 37.3047C115.748 37.3047 117.146 38.702 117.146 40.5137C117.146 42.429 115.748 43.7754 113.937 43.7754C112.125 43.7753 110.676 42.4289 110.676 40.5137C110.676 38.702 112.125 37.3048 113.937 37.3047Z" fill="#2563EB" style="fill:#2563EB;fill:color(display-p3 0.1451 0.3882 0.9216);fill-opacity:1;"/></svg>`;


const SVG_PLUS = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2.625V11.375M2.625 7H11.375" stroke="#a3a3a3" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_TOKENS = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="4.5" stroke="#3B82F6" stroke-width="1.5"/><circle cx="10" cy="8" r="4.5" stroke="#3B82F6" stroke-width="1.5"/></svg>`;

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
    z-index: 2147483646;
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: #2563EB;
    border-radius: 50%;
    border: none;
    box-shadow: 0 2px 12px rgba(37,99,235,0.3);
    user-select: none;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .hw-pill:hover {
    box-shadow: 0 4px 16px rgba(37,99,235,0.4);
    transform: scale(1.05);
  }

  .hw-pill.visible {
    display: flex;
  }

  /* --- Settings panel --- */
  .hw-sheet-anchor {
    position: fixed;
    bottom: 68px;
    left: 20px;
    z-index: 2147483647;
    display: none;
  }

  .hw-sheet-anchor.visible {
    display: block;
  }

  .hw-sheet {
    width: 340px;
    background: rgb(247, 248, 252);
    border-radius: 20px;
    box-shadow: 0 0 2px 0 rgba(255, 255, 255, 0.20) inset, 0 0 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 1px rgba(0, 0, 0, 0.05);
    padding: 10px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    color: #262626;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.01px;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: 9px;
    animation: hwSheetIn 0.2s ease-out;
  }

  /* --- Logo section --- */
  .hw-settings-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 20px 10px;
  }
  .hw-settings-logo svg {
    width: 100%;
    max-width: 280px;
    height: auto;
  }

  /* --- Settings rows --- */
  .hw-settings-rows {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 10px;
  }

  .hw-settings-row {
    display: flex;
    align-items: center;
  }

  .hw-settings-label {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: #262626;
    letter-spacing: 0.01px;
  }

  /* --- Select / dropdown --- */
  .hw-select {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.8);
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    padding: 6px 8px;
    cursor: pointer;
    transition: box-shadow 0.15s;
    position: relative;
  }
  .hw-select:hover {
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  }
  .hw-select-value {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: #262626;
    letter-spacing: 0.01px;
    line-height: 16px;
  }
  .hw-select-caret {
    display: flex;
    align-items: center;
    color: #a3a3a3;
    flex-shrink: 0;
  }

  /* Dropdown menu */
  .hw-dropdown-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.12);
    padding: 4px;
    display: none;
    z-index: 10;
    animation: hwSheetIn 0.12s ease-out;
  }
  .hw-dropdown-menu.visible { display: block; }
  .hw-dropdown-option {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    color: #262626;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.1s;
  }
  .hw-dropdown-option:hover { background: rgba(0,0,0,0.04); }
  .hw-dropdown-option.selected { color: #2563EB; }
  .hw-dropdown-check {
    width: 12px;
    flex-shrink: 0;
    font-size: 11px;
    color: #2563EB;
  }

  /* --- Styleguide row --- */
  .hw-settings-row-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .hw-styleguide-input {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
  }
  .hw-styleguide-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
  }
  .hw-styleguide-icon {
    display: flex;
    align-items: center;
    padding: 2px;
    flex-shrink: 0;
  }
  .hw-styleguide-text {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: #a3a3a3;
    letter-spacing: 0.01px;
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hw-styleguide-text.has-value {
    color: #262626;
  }
  .hw-styleguide-generate {
    flex-shrink: 0;
    padding: 4px 8px;
    background: rgba(96,165,250,0.1);
    border: none;
    border-radius: 6px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #262626;
    letter-spacing: 0.01px;
    line-height: 14px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .hw-styleguide-generate:hover {
    background: rgba(96,165,250,0.2);
  }

  /* --- Shortcut row --- */
  .hw-settings-label-col {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .hw-settings-sublabel {
    font-size: 11px;
    font-weight: 500;
    color: #a3a3a3;
    letter-spacing: 0.05px;
    line-height: 14px;
  }
  .hw-shortcut-keys {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    padding: 6px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #262626;
  }
  .hw-key {
    display: flex;
    align-items: center;
    padding: 1px;
  }

  /* --- Bottom bar --- */
  .hw-settings-bottom {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0;
  }
  .hw-tokens-left {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 6px 6px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    flex-shrink: 0;
  }
  .hw-tokens-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .hw-tokens-string {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 14px;
    letter-spacing: 0.01px;
    white-space: nowrap;
  }
  .hw-tokens-count {
    color: #171717;
  }
  .hw-tokens-label {
    color: #a3a3a3;
  }
  .hw-upgrade-btn {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    background: #2563eb;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    line-height: 14px;
    letter-spacing: 0.01px;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .hw-upgrade-btn:hover {
    background: #1d4ed8;
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
    shortcut: "ctrl+shift+h",
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

    // --- Settings panel (anchored above the pill) ---
    this.sheetAnchor = document.createElement("div");
    this.sheetAnchor.className = "hw-sheet-anchor";

    this.sheet = document.createElement("div");
    this.sheet.className = "hw-sheet";
    this.sheet.addEventListener("click", (e) => e.stopPropagation());
    this.sheetAnchor.appendChild(this.sheet);

    this.shadow.appendChild(this.sheetAnchor);

    // --- Floating pill (blue circle with pen icon) ---
    this.pill = document.createElement("div");
    this.pill.className = "hw-pill";
    this.pill.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12.7628V16.2069C5.37931 15.2414 2.63218 18.3103 1.7931 20H0L20 0V8.64049L13.0955 15.5824L10 12.7628Z" fill="white" style="fill:white;fill-opacity:1;"/></svg>`;
    this.pill.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSettings();
    });

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

    // 1. Logo section
    const logo = document.createElement("div");
    logo.className = "hw-settings-logo";
    logo.innerHTML = SVG_LOGO;
    this.sheet.appendChild(logo);

    // 2. Settings rows
    const rows = document.createElement("div");
    rows.className = "hw-settings-rows";

    rows.appendChild(this.buildModelRow());
    rows.appendChild(this.buildStyleguideRow());
    rows.appendChild(this.buildShortcutRow());

    this.sheet.appendChild(rows);

    // 3. Bottom bar
    this.sheet.appendChild(this.buildBottomBar());
  }

  private buildModelRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "hw-settings-row";

    const label = document.createElement("span");
    label.className = "hw-settings-label";
    label.textContent = "Default Model";
    row.appendChild(label);

    const select = document.createElement("div");
    select.className = "hw-select";

    const currentLabel = MODELS.find((m) => m.value === this.settings.model)?.label ?? "Sonnet 4.6";
    const valueEl = document.createElement("span");
    valueEl.className = "hw-select-value";
    valueEl.textContent = currentLabel;
    select.appendChild(valueEl);

    const caret = document.createElement("span");
    caret.className = "hw-select-caret";
    caret.innerHTML = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    select.appendChild(caret);

    // Dropdown menu
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
        valueEl.textContent = m.label;

        menu.querySelectorAll(".hw-dropdown-option").forEach((opt) => {
          opt.classList.remove("selected");
          (opt.querySelector(".hw-dropdown-check") as HTMLElement).textContent = "";
        });
        option.classList.add("selected");
        check.textContent = "\u2713";

        menu.classList.remove("visible");
      });

      menu.appendChild(option);
    }

    select.appendChild(menu);

    select.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains("visible");
      menu.classList.toggle("visible", !isOpen);
    });

    row.appendChild(select);
    return row;
  }

  private buildStyleguideRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "hw-settings-row-col";

    const label = document.createElement("span");
    label.className = "hw-settings-label";
    label.textContent = "Styleguide";
    row.appendChild(label);

    const input = document.createElement("div");
    input.className = "hw-styleguide-input";

    const left = document.createElement("div");
    left.className = "hw-styleguide-left";

    const icon = document.createElement("span");
    icon.className = "hw-styleguide-icon";
    icon.innerHTML = SVG_PLUS;
    left.appendChild(icon);

    const text = document.createElement("span");
    text.className = `hw-styleguide-text${this.settings.styleGuide ? " has-value" : ""}`;
    text.textContent = this.settings.styleGuide || "Add your styleguide.md";
    left.appendChild(text);

    input.appendChild(left);

    const genBtn = document.createElement("button");
    genBtn.className = "hw-styleguide-generate";
    genBtn.textContent = "Generate";
    input.appendChild(genBtn);

    row.appendChild(input);
    return row;
  }

  private buildShortcutRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "hw-settings-row";

    const labelCol = document.createElement("div");
    labelCol.className = "hw-settings-label-col";

    const label = document.createElement("span");
    label.className = "hw-settings-label";
    label.textContent = "Shortcut";
    labelCol.appendChild(label);

    const sublabel = document.createElement("span");
    sublabel.className = "hw-settings-sublabel";
    sublabel.textContent = "Click to record new";
    labelCol.appendChild(sublabel);

    row.appendChild(labelCol);

    const keys = document.createElement("div");
    keys.className = "hw-shortcut-keys";

    // Parse shortcut and display keys
    const parts = this.settings.shortcut.split("+");
    for (const part of parts) {
      const key = document.createElement("span");
      key.className = "hw-key";
      const p = part.trim().toLowerCase();
      if (p === "ctrl" || p === "meta" || p === "cmd") {
        key.textContent = "\u2318";
      } else if (p === "shift") {
        key.textContent = "Shift";
      } else {
        key.textContent = part.trim().toUpperCase();
      }
      keys.appendChild(key);

      // Add space between keys
      if (part !== parts[parts.length - 1]) {
        const spacer = document.createTextNode(" ");
        keys.appendChild(spacer);
      }
    }

    row.appendChild(keys);
    return row;
  }

  private buildBottomBar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "hw-settings-bottom";

    // Tokens left
    const tokens = document.createElement("div");
    tokens.className = "hw-tokens-left";

    const icon = document.createElement("span");
    icon.className = "hw-tokens-icon";
    icon.innerHTML = SVG_TOKENS;
    tokens.appendChild(icon);

    const str = document.createElement("div");
    str.className = "hw-tokens-string";
    const count = document.createElement("span");
    count.className = "hw-tokens-count";
    count.textContent = "2M";
    str.appendChild(count);
    const label = document.createElement("span");
    label.className = "hw-tokens-label";
    label.textContent = "tokens left";
    str.appendChild(label);
    tokens.appendChild(str);

    bar.appendChild(tokens);

    // Upgrade button
    const upgrade = document.createElement("button");
    upgrade.className = "hw-upgrade-btn";
    upgrade.textContent = "Upgrade";
    bar.appendChild(upgrade);

    return bar;
  }
}
