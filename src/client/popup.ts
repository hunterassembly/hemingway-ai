// --- Popup UI (Figma-matched frosted glass design) ---
// Renders the Hemingway popup inside a Shadow DOM root for complete style
// isolation. Vanilla DOM — no React.

export type PopupPhase = "input" | "loading" | "alternatives" | "done";

export interface Alternative {
  label: string;
  text: string;
}

export interface MultiAlternative {
  label: string;
  texts: { index: number; text: string }[];
}

export interface DoneResult {
  clipboard?: boolean;
  file?: string;
  line?: number;
  canUndo?: boolean;
  reverted?: boolean;
  multiCount?: number;
}

// --- Inline SVG icons ---

const SVG_MARK = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 17.8679V22.6897C7.53103 21.3379 3.68506 25.6345 2.51035 28H0L28 0V12.0967L18.3337 21.8153L14 17.8679Z" fill="#2563EB" style="fill:#2563EB;fill:color(display-p3 0.1451 0.3882 0.9216);fill-opacity:1;"/></svg>`;
const SVG_MARK_WHITE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="white"/></svg>`;
const SVG_ARROW = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 8H12.5M9 4.5L12.5 8L9 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_CARET = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_BACK = `<svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M20 8L12 16L20 24" stroke="#262626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_CHECK_WHITE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_REFRESH = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.25 2.62501V5.25001C12.25 5.36605 12.2039 5.47733 12.1219 5.55937C12.0398 5.64142 11.9285 5.68751 11.8125 5.68751H9.1875C9.10092 5.68758 9.01627 5.66196 8.94426 5.61389C8.87225 5.56582 8.81612 5.49747 8.78298 5.41748C8.74984 5.3375 8.74117 5.24948 8.75808 5.16457C8.77499 5.07965 8.81671 5.00167 8.87797 4.94048L9.8793 3.93751C9.07378 3.16573 8.00236 2.73321 6.8868 2.72947H6.86219C5.71908 2.72723 4.62106 3.17516 3.8057 3.97634C3.72215 4.05434 3.61139 4.09654 3.49713 4.09392C3.38286 4.0913 3.27415 4.04406 3.19426 3.96232C3.11438 3.88057 3.06965 3.77081 3.06966 3.65651C3.06966 3.54221 3.1144 3.43245 3.1943 3.35072C4.16958 2.39783 5.47733 1.86176 6.84084 1.85594C8.20434 1.85013 9.51662 2.37501 10.5 3.31954L11.5041 2.31548C11.5653 2.2546 11.6432 2.21321 11.7279 2.19651C11.8126 2.17982 11.9004 2.18857 11.9802 2.22167C12.0599 2.25477 12.1281 2.31073 12.1761 2.3825C12.2242 2.45428 12.2499 2.53866 12.25 2.62501ZM10.1943 10.0237C9.38391 10.8152 8.29811 11.2615 7.16534 11.2688C6.03257 11.276 4.94114 10.8436 4.1207 10.0625L5.12203 9.06119C5.18385 9.00009 5.22608 8.92196 5.24331 8.83677C5.26055 8.75157 5.25202 8.66318 5.21881 8.58285C5.1856 8.50253 5.12922 8.43391 5.05685 8.38577C4.98449 8.33762 4.89942 8.31212 4.8125 8.31251H2.1875C2.07147 8.31251 1.96019 8.35861 1.87814 8.44065C1.79609 8.5227 1.75 8.63398 1.75 8.75001V11.375C1.74993 11.4616 1.77555 11.5462 1.82362 11.6183C1.87169 11.6903 1.94004 11.7464 2.02003 11.7795C2.10001 11.8127 2.18803 11.8213 2.27295 11.8044C2.35786 11.7875 2.43584 11.7458 2.49703 11.6845L3.5 10.6805C4.46917 11.6158 5.76247 12.1402 7.10938 12.1439H7.13836C8.50997 12.1475 9.82774 11.6105 10.8063 10.6493C10.8861 10.5676 10.9309 10.4578 10.9309 10.3435C10.9309 10.2292 10.8862 10.1195 10.8063 10.0377C10.7264 9.95597 10.6177 9.90873 10.5034 9.90611C10.3892 9.90349 10.2784 9.94569 10.1948 10.0237H10.1943Z" fill="#737373" style="fill:#737373;fill:color(display-p3 0.4510 0.4510 0.4510);fill-opacity:1;"/></svg>`;

// --- Suggestion presets ---

const SUGGESTIONS = [
  "Shorter & Punchier",
  "Simplify",
  "More urgent",
  "More confident",
  "Warmer",
  "More professional",
];

// --- Styles ---

const STYLES = /* css */ `
  @keyframes hwFadeIn {
    from { opacity: 0; transform: scale(0.98) translateY(4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes hwProgress {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }
  @keyframes hwCheckIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* --- Container: frosted glass --- */
  .hw-popup {
    position: absolute;
    z-index: 2147483647;
    width: 380px;
    max-width: calc(100vw - 32px);
    background: rgb(247, 248, 252);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 0 2px 0 rgba(255, 255, 255, 0.20) inset, 0 0 20px 0 rgba(255, 255, 255, 0.20) inset, 0 0 0 1px rgba(0, 0, 0, 0.05);
    box-shadow: 0 0 2px 0 color(display-p3 1 1 1 / 0.20) inset, 0 0 20px 0 color(display-p3 1 1 1 / 0.20) inset, 0 0 0 1px color(display-p3 0 0 0 / 0.05);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    color: #262626;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0.01px;
    overflow: hidden;
    display: none;
    padding: 10px;
    animation: hwFadeIn 0.2s ease-out;
  }
  .hw-popup.visible { display: flex; flex-direction: column; gap: 9px; }

  /* Inner glow is handled via inset box-shadow on .hw-popup */

  /* --- Header row --- */
  .hw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
  }
  .hw-logo { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; }
  .hw-logo svg { display: block; }
  .hw-model {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    padding: 6px 8px;
    color: #262626;
    font-size: 12px;
    cursor: default;
  }
  .hw-model-name { flex: 1; }
  .hw-model-caret { display: flex; align-items: center; color: #a3a3a3; }

  /* --- Content row (wraps current text + input phase) --- */
  .hw-content { display: flex; flex-direction: column; gap: 16px; padding: 10px; }

  /* --- Current text box --- */
  .hw-text-box {
    background: rgba(0,0,0,0.05);
    border-radius: 8px;
    padding: 10px;
    font-size: 12px;
    line-height: 16px;
    color: #262626;
    max-height: 80px;
    overflow: auto;
  }

  /* --- Multi-select items --- */
  .hw-multi-items { display: flex; flex-direction: column; gap: 6px; }
  .hw-multi-item {
    background: rgba(0,0,0,0.05);
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .hw-multi-badge {
    flex-shrink: 0;
    width: 18px; height: 18px;
    background: #2563EB;
    color: white;
    border-radius: 50%;
    font-size: 10px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px;
  }
  .hw-multi-item-body { flex: 1; min-width: 0; }
  .hw-multi-item-type {
    font-size: 10px; font-weight: 600;
    color: #a3a3a3;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 1px;
  }
  .hw-multi-item-text {
    font-size: 12px; line-height: 16px; color: #262626;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* --- Suggestions --- */
  .hw-suggestions-label {
    font-size: 12px; font-weight: 500; color: #262626;
  }
  .hw-suggestions {
    display: flex; flex-wrap: wrap; gap: 6px;
  }
  .hw-suggestion-pill {
    display: flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    padding: 6px 10px 6px 6px;
    border: none;
    font-family: inherit; font-size: 12px; font-weight: 500;
    color: #262626; cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }
  .hw-suggestion-pill:hover {
    background: rgba(255,255,255,1);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06);
  }
  .hw-suggestion-arrow {
    display: flex; align-items: center; color: #a3a3a3;
  }

  /* --- Textarea (glass) --- */
  .hw-textarea-wrap {
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 12px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    padding: 4px;
    transition: box-shadow 0.15s;
  }
  .hw-textarea-wrap:focus-within {
    box-shadow: 0 0 0 1px rgba(37,99,235,0.3), 0 1px 1px rgba(0,0,0,0.05);
  }
  .hw-textarea {
    width: 100%;
    min-height: 52px;
    padding: 6px;
    background: transparent;
    border: none;
    color: #262626;
    font-family: inherit; font-size: 12px; font-weight: 500;
    line-height: 16px;
    resize: none;
    outline: none;
  }
  .hw-textarea::placeholder { color: #a3a3a3; }

  /* --- Footer (settings + generate) --- */
  .hw-footer {
    display: flex; align-items: center; justify-content: space-between;
  }
  .hw-settings-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    background: rgba(0,0,0,0.05);
    border: none; border-radius: 8px;
    cursor: pointer;
    color: #737373;
    transition: background 0.15s;
    padding: 0;
  }
  .hw-settings-btn:hover { background: rgba(0,0,0,0.08); }
  .hw-settings-btn svg { width: 16px; height: 16px; }
  .hw-generate-btn {
    display: flex; align-items: center; gap: 6px;
    background: #2563EB;
    border: none; border-radius: 8px;
    padding: 8px 12px;
    color: white;
    font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }
  .hw-generate-btn:hover { background: #1d4ed8; }
  .hw-generate-icon { display: flex; align-items: center; }

  /* --- Loading phase --- */
  .hw-loading-phase { padding: 10px; }
  .hw-progress-track {
    width: 100%; height: 3px;
    background: rgba(0,0,0,0.05);
    border-radius: 1.5px; overflow: hidden;
    margin-bottom: 12px;
  }
  .hw-progress-bar {
    width: 40%; height: 100%;
    background: #2563EB;
    border-radius: 1.5px;
    animation: hwProgress 1.4s ease-in-out infinite;
  }
  .hw-loading-text { font-size: 12px; color: #a3a3a3; }

  /* --- Alternatives phase (Review) --- */
  .hw-alts-phase { display: flex; flex-direction: column; gap: 9px; }

  .hw-review-header {
    display: flex; align-items: center; gap: 6px; padding: 10px;
  }
  .hw-review-back {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px;
    background: none; border: none; cursor: pointer; padding: 0;
    border-radius: 8px; transition: background 0.15s;
  }
  .hw-review-back:hover { background: rgba(0,0,0,0.05); }
  .hw-review-title {
    flex: 1; font-size: 14px; font-weight: 600; color: #262626;
    letter-spacing: -0.09px; line-height: 16px;
  }

  .hw-alts-content { display: flex; flex-direction: column; gap: 16px; padding: 10px; }
  .hw-alts-stats {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; font-weight: 500; letter-spacing: 0.01px; line-height: 14px;
  }
  .hw-alts-stats-count { color: #262626; }
  .hw-alts-stats-tokens { color: #a3a3a3; }

  .hw-alts-list { display: flex; flex-direction: column; gap: 8px; }

  .hw-alt-card {
    display: flex; align-items: center; overflow: hidden;
    padding: 4px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border-radius: 12px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .hw-alt-card:hover {
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06);
  }
  .hw-alt-card.selected {
    box-shadow: 0 0 0 3px rgba(0,0,255,0.2), 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
  }
  .hw-alt-card-text {
    flex: 1; padding: 10px 16px 10px 10px;
    font-size: 12px; font-weight: 500; line-height: 16px;
    color: #262626; letter-spacing: 0.01px;
  }
  .hw-alt-radio {
    flex-shrink: 0; width: 18px; height: 18px;
    border-radius: 999px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    margin-right: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .hw-alt-radio.checked {
    background: #2563EB;
  }

  .hw-alts-footer {
    display: flex; align-items: center; justify-content: space-between; padding: 0 10px 10px;
  }
  .hw-regen-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 0;
    background: none; border: none; border-radius: 8px;
    font-family: inherit; font-size: 12px; font-weight: 500;
    color: #737373; letter-spacing: 0.01px;
    cursor: pointer; transition: color 0.15s;
  }
  .hw-regen-btn:hover { color: #262626; }
  .hw-apply-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 12px;
    background: #2563EB; color: white;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 12px; font-weight: 500;
    letter-spacing: 0.01px; line-height: 16px;
    cursor: pointer; transition: background 0.15s, opacity 0.15s;
    overflow: hidden;
  }
  .hw-apply-btn:hover { background: #1d4ed8; }
  .hw-apply-btn:disabled { opacity: 0.5; cursor: default; }
  .hw-apply-btn:disabled:hover { background: #2563EB; }

  .hw-alt-card-label { display: none; }

  /* Multi-alternative card texts */
  .hw-alt-multi-texts { display: flex; flex-direction: column; gap: 8px; }
  .hw-alt-multi-entry { display: flex; gap: 8px; align-items: flex-start; }
  .hw-alt-multi-badge {
    flex-shrink: 0; width: 16px; height: 16px;
    background: #2563EB; color: white; border-radius: 50%;
    font-size: 9px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px;
  }
  .hw-alt-multi-body { flex: 1; min-width: 0; }
  .hw-alt-multi-type {
    font-size: 9px; font-weight: 600; color: #a3a3a3;
    text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 1px;
  }
  .hw-alt-multi-text { font-size: 12px; line-height: 18px; color: #262626; }

  /* --- Retry / custom / ghost buttons --- */
  .hw-retry-section { margin-top: 0; }
  .hw-custom-section { margin-top: 8px; }
  .hw-custom-label { font-size: 11px; color: #a3a3a3; font-weight: 500; margin-bottom: 6px; }
  .hw-custom-row { display: flex; gap: 6px; align-items: center; }
  .hw-custom-input {
    flex: 1; height: 32px; padding: 0 10px;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(60px);
    -webkit-backdrop-filter: blur(60px);
    border: none; border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.05);
    color: #262626; font-family: inherit; font-size: 12px; font-weight: 500;
    outline: none;
  }
  .hw-custom-input:focus {
    box-shadow: 0 0 0 1px rgba(37,99,235,0.3), 0 1px 1px rgba(0,0,0,0.05);
  }
  .hw-custom-input::placeholder { color: #a3a3a3; }

  .hw-btn-primary {
    padding: 8px 12px;
    background: #2563EB; color: white;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
  }
  .hw-btn-primary:hover { background: #1d4ed8; }

  .hw-btn-use {
    padding: 6px 12px;
    background: #2563EB; color: white;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer;
    opacity: 0; pointer-events: none;
    transition: opacity 0.15s, background 0.15s;
  }
  .hw-btn-use.visible { opacity: 1; pointer-events: auto; }
  .hw-btn-use:hover { background: #1d4ed8; }

  .hw-ghost-btn {
    width: 100%; padding: 6px 10px;
    background: none; color: #a3a3a3;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
  }
  .hw-ghost-btn:hover { color: #262626; background: rgba(0,0,0,0.04); }

  /* --- Done phase --- */
  .hw-done-phase {
    padding: 28px 10px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    animation: hwCheckIn 0.25s ease-out;
  }
  .hw-done-icon {
    width: 36px; height: 36px;
    background: rgba(0,0,0,0.05);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .hw-done-icon svg { width: 18px; height: 18px; }
  .hw-done-text { font-size: 12px; color: #a3a3a3; font-weight: 500; }
  .hw-done-subtitle { font-size: 11px; color: #a3a3a3; text-align: center; max-width: 260px; }
  .hw-undo-btn { margin-top: 4px; width: auto; padding: 6px 16px; }
`;

// --- Gear icon (separate for readability) ---
const SVG_GEAR = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.8125 7.11815C11.8147 7.0394 11.8147 6.96065 11.8125 6.8819L12.6285 5.86252C12.6712 5.809 12.7009 5.74618 12.7149 5.67912C12.729 5.61206 12.7271 5.54263 12.7094 5.47643C12.5754 4.97372 12.3753 4.49099 12.1144 4.04088C12.0802 3.982 12.0327 3.9319 11.9758 3.89459C11.9188 3.85728 11.8539 3.83378 11.7863 3.82596L10.4891 3.68159C10.4351 3.62471 10.3804 3.57003 10.325 3.51753L10.1719 2.21706C10.164 2.14936 10.1404 2.08444 10.103 2.02747C10.0656 1.9705 10.0154 1.92306 9.95643 1.88893C9.50636 1.62821 9.02361 1.42849 8.52088 1.29502C8.45469 1.27734 8.38526 1.27545 8.3182 1.28951C8.25114 1.30357 8.18831 1.33318 8.13479 1.37596L7.11815 2.18752C7.0394 2.18752 6.96065 2.18752 6.8819 2.18752L5.86252 1.37323C5.809 1.33045 5.74618 1.30083 5.67912 1.28677C5.61206 1.27271 5.54263 1.2746 5.47643 1.29229C4.97372 1.42629 4.49099 1.62637 4.04088 1.88729C3.982 1.92148 3.9319 1.96895 3.89459 2.02592C3.85728 2.08288 3.83378 2.14777 3.82596 2.21542L3.68159 3.51479C3.62471 3.56911 3.57003 3.6238 3.51753 3.67885L2.21706 3.82815C2.14936 3.83603 2.08444 3.85961 2.02747 3.89702C1.9705 3.93443 1.92306 3.98463 1.88893 4.04362C1.62826 4.49379 1.42837 4.9765 1.29448 5.47917C1.27687 5.54541 1.27507 5.61486 1.28922 5.68192C1.30337 5.74898 1.33309 5.81179 1.37596 5.86526L2.18752 6.8819C2.18752 6.96065 2.18752 7.0394 2.18752 7.11815L1.37323 8.13753C1.33045 8.19105 1.30083 8.25387 1.28677 8.32093C1.27271 8.38799 1.2746 8.45742 1.29229 8.52362C1.42629 9.02633 1.62637 9.50906 1.88729 9.95917C1.92148 10.0181 1.96895 10.0681 2.02592 10.1055C2.08288 10.1428 2.14777 10.1663 2.21542 10.1741L3.5126 10.3185C3.56693 10.3753 3.62161 10.43 3.67667 10.4825L3.82815 11.783C3.83603 11.8507 3.85961 11.9156 3.89702 11.9726C3.93443 12.0295 3.98463 12.077 4.04362 12.1111C4.49379 12.3718 4.9765 12.5717 5.47917 12.7056C5.54541 12.7232 5.61486 12.725 5.68192 12.7108C5.74898 12.6967 5.81179 12.667 5.86526 12.6241L6.8819 11.8125C6.96065 11.8147 7.0394 11.8147 7.11815 11.8125L8.13753 12.6285C8.19105 12.6712 8.25387 12.7009 8.32093 12.7149C8.38799 12.729 8.45742 12.7271 8.52362 12.7094C9.02641 12.5756 9.50917 12.3755 9.95917 12.1144C10.0181 12.0802 10.0681 12.0327 10.1055 11.9758C10.1428 11.9188 10.1663 11.8539 10.1741 11.7863L10.3185 10.4891C10.3753 10.4351 10.43 10.3804 10.4825 10.325L11.783 10.1719C11.8507 10.164 11.9156 10.1404 11.9726 10.103C12.0295 10.0656 12.077 10.0154 12.1111 9.95643C12.3718 9.50626 12.5717 9.02355 12.7056 8.52088C12.7232 8.45464 12.725 8.38519 12.7108 8.31813C12.6967 8.25107 12.667 8.18826 12.6241 8.13479L11.8125 7.11815ZM7.00003 9.18753C6.56738 9.18753 6.14445 9.05923 5.78472 8.81887C5.42498 8.5785 5.14461 8.23686 4.97904 7.83715C4.81347 7.43743 4.77015 6.9976 4.85456 6.57327C4.93896 6.14893 5.1473 5.75916 5.45323 5.45323C5.75916 5.1473 6.14893 4.93896 6.57327 4.85456C6.9976 4.77015 7.43743 4.81347 7.83715 4.97904C8.23686 5.14461 8.5785 5.42498 8.81887 5.78472C9.05923 6.14445 9.18753 6.56738 9.18753 7.00003C9.18753 7.58019 8.95706 8.13659 8.54682 8.54682C8.13659 8.95706 7.58019 9.18753 7.00003 9.18753Z" fill="currentColor"/></svg>`;

export class HemingwayPopup {
  private shadow: ShadowRoot;
  private container: HTMLElement;
  private phase: PopupPhase = "input";

  // Single mode state
  private alternatives: Alternative[] = [];
  private selectedAltIndex: number = -1;
  private currentText: string = "";

  // Multi mode state
  private multiMode: boolean = false;
  private multiItems: { text: string; index: number; elementType: string }[] = [];
  private multiAlternatives: MultiAlternative[] = [];

  // Shared state
  private comment: string = "";
  private customText: string = "";
  private doneResult: DoneResult = {};
  private currentModel: string = "";

  // Callbacks set by the overlay controller
  onGenerate: ((comment: string) => void) | null = null;
  onChoose: ((alt: Alternative, index: number) => void) | null = null;
  onChooseMulti: ((alt: MultiAlternative, index: number) => void) | null = null;
  onCustomText: ((text: string) => void) | null = null;
  onRegenerate: ((feedback: string) => void) | null = null;
  onUndo: (() => void) | null = null;
  onDismiss: (() => void) | null = null;

  constructor(host: HTMLElement) {
    this.shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    this.container = document.createElement("div");
    this.container.className = "hw-popup";
    this.container.addEventListener("click", (e) => e.stopPropagation());
    this.shadow.appendChild(this.container);

    this._handleKeyDown = this._handleKeyDown.bind(this);
    window.addEventListener("keydown", this._handleKeyDown);
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.container.classList.contains("visible")) {
      this.hide();
      this.onDismiss?.();
    }
  }

  // --- Public API ---

  show(position: { top: number; left: number }, currentText: string): void {
    this.multiMode = false;
    this.currentText = currentText;
    this.comment = "";
    this.customText = "";
    this.alternatives = [];
    this.multiItems = [];
    this.multiAlternatives = [];
    this.phase = "input";

    this.container.style.top = `${position.top}px`;
    this.container.style.left = `${position.left}px`;
    this.container.classList.add("visible");
    this.render();
  }

  showMulti(
    position: { top: number; left: number },
    items: { text: string; index: number; elementType: string }[]
  ): void {
    this.multiMode = true;
    this.multiItems = items;
    this.currentText = "";
    this.comment = "";
    this.customText = "";
    this.alternatives = [];
    this.multiAlternatives = [];
    this.phase = "input";

    this.container.style.top = `${position.top}px`;
    this.container.style.left = `${position.left}px`;
    this.container.classList.add("visible");
    this.render();
  }

  hide(): void {
    this.container.classList.remove("visible");
  }

  setPhase(phase: PopupPhase): void {
    this.phase = phase;
    this.render();
  }

  setAlternatives(alts: Alternative[]): void {
    this.alternatives = alts;
    this.selectedAltIndex = 0;
    this.multiMode = false;
    this.phase = "alternatives";
    this.render();
  }

  setMultiAlternatives(alts: MultiAlternative[]): void {
    this.multiAlternatives = alts;
    this.multiMode = true;
    this.phase = "alternatives";
    this.render();
  }

  showDone(result: DoneResult): void {
    this.doneResult = result;
    this.phase = "done";
    this.render();
  }

  setModel(model: string): void {
    this.currentModel = model;
    // Re-render if visible to update header
    if (this.container.classList.contains("visible")) {
      this.render();
    }
  }

  getComment(): string {
    return this.comment;
  }

  destroy(): void {
    window.removeEventListener("keydown", this._handleKeyDown);
  }

  // --- Rendering ---

  private render(): void {
    this.container.innerHTML = "";

    // Header (logo + model)
    this.container.appendChild(this.renderHeader());

    // Content area
    const content = document.createElement("div");
    content.className = "hw-content";

    // Current text display
    if (this.phase !== "done") {
      if (this.multiMode && this.multiItems.length > 0) {
        content.appendChild(this.renderMultiCurrentTexts());
      } else if (this.currentText) {
        content.appendChild(this.renderCurrentText());
      }
    }

    // Phase body
    switch (this.phase) {
      case "input":
        this.appendInputPhase(content);
        break;
      case "loading":
        content.appendChild(this.renderLoadingPhase());
        break;
      case "alternatives":
        // Alternatives take over the entire popup — no header or current text
        this.container.innerHTML = "";
        if (this.multiMode) {
          this.container.appendChild(this.renderMultiAlternativesPhase());
        } else {
          this.container.appendChild(this.renderAlternativesPhase());
        }
        return;
      case "done":
        this.container.appendChild(this.renderDonePhase());
        return; // done phase replaces content
    }

    this.container.appendChild(content);
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "hw-header";

    const logo = document.createElement("div");
    logo.className = "hw-logo";
    logo.innerHTML = SVG_MARK;
    header.appendChild(logo);

    if (this.currentModel) {
      const model = document.createElement("div");
      model.className = "hw-model";

      const name = document.createElement("span");
      name.className = "hw-model-name";
      name.textContent = formatModelName(this.currentModel);
      model.appendChild(name);

      const caret = document.createElement("span");
      caret.className = "hw-model-caret";
      caret.innerHTML = SVG_CARET;
      model.appendChild(caret);

      header.appendChild(model);
    }

    return header;
  }

  private renderCurrentText(): HTMLElement {
    const box = document.createElement("div");
    box.className = "hw-text-box";
    box.textContent = this.currentText;
    return box;
  }

  private renderMultiCurrentTexts(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "hw-multi-items";

    for (const item of this.multiItems) {
      const row = document.createElement("div");
      row.className = "hw-multi-item";

      const badge = document.createElement("div");
      badge.className = "hw-multi-badge";
      badge.textContent = String(item.index);
      row.appendChild(badge);

      const body = document.createElement("div");
      body.className = "hw-multi-item-body";

      const typeLabel = document.createElement("div");
      typeLabel.className = "hw-multi-item-type";
      typeLabel.textContent = friendlyElementType(item.elementType);
      body.appendChild(typeLabel);

      const text = document.createElement("div");
      text.className = "hw-multi-item-text";
      text.textContent = item.text;
      body.appendChild(text);

      row.appendChild(body);
      wrapper.appendChild(row);
    }

    return wrapper;
  }

  // Input phase is appended in parts to the content container
  private appendInputPhase(content: HTMLElement): void {
    // Suggestions
    const sugLabel = document.createElement("div");
    sugLabel.className = "hw-suggestions-label";
    sugLabel.textContent = "Suggestions";
    content.appendChild(sugLabel);

    const suggestions = document.createElement("div");
    suggestions.className = "hw-suggestions";

    for (const text of SUGGESTIONS) {
      const pill = document.createElement("button");
      pill.className = "hw-suggestion-pill";

      const arrow = document.createElement("span");
      arrow.className = "hw-suggestion-arrow";
      arrow.innerHTML = SVG_ARROW;
      pill.appendChild(arrow);

      const label = document.createTextNode(text);
      pill.appendChild(label);

      pill.addEventListener("click", () => {
        this.comment = text;
        this.onGenerate?.(this.comment);
      });

      suggestions.appendChild(pill);
    }
    content.appendChild(suggestions);

    // Textarea
    const wrap = document.createElement("div");
    wrap.className = "hw-textarea-wrap";

    const textarea = document.createElement("textarea");
    textarea.className = "hw-textarea";
    textarea.placeholder = "Add directions, or just hit Generate to roll the dice...";
    textarea.value = this.comment;
    textarea.addEventListener("input", () => {
      this.comment = textarea.value;
    });
    // Enter to generate (unless shift held for newline)
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.onGenerate?.(this.comment);
      }
    });
    wrap.appendChild(textarea);
    content.appendChild(wrap);

    // Footer: generate button (settings gear removed for simplicity)
    const footer = document.createElement("div");
    footer.className = "hw-footer";

    // Settings gear
    const settingsBtn = document.createElement("button");
    settingsBtn.className = "hw-settings-btn";
    settingsBtn.innerHTML = SVG_GEAR;
    settingsBtn.title = "Settings";
    footer.appendChild(settingsBtn);

    // Generate button
    const genBtn = document.createElement("button");
    genBtn.className = "hw-generate-btn";

    const genLabel = document.createTextNode("Generate");
    genBtn.appendChild(genLabel);

    const genIcon = document.createElement("span");
    genIcon.className = "hw-generate-icon";
    genIcon.innerHTML = SVG_MARK_WHITE;
    genBtn.appendChild(genIcon);

    genBtn.addEventListener("click", () => {
      this.onGenerate?.(this.comment);
    });
    footer.appendChild(genBtn);

    content.appendChild(footer);
  }

  private renderLoadingPhase(): HTMLElement {
    const phase = document.createElement("div");
    phase.className = "hw-loading-phase";

    const track = document.createElement("div");
    track.className = "hw-progress-track";
    const bar = document.createElement("div");
    bar.className = "hw-progress-bar";
    track.appendChild(bar);
    phase.appendChild(track);

    const text = document.createElement("div");
    text.className = "hw-loading-text";
    text.textContent = this.multiMode
      ? `Generating for ${this.multiItems.length} elements\u2026`
      : "Generating alternatives\u2026";
    phase.appendChild(text);

    return phase;
  }

  private renderAlternativesPhase(): HTMLElement {
    const phase = document.createElement("div");
    phase.className = "hw-alts-phase";

    // --- Header: back + "Review" ---
    const header = document.createElement("div");
    header.className = "hw-review-header";

    const backBtn = document.createElement("button");
    backBtn.className = "hw-review-back";
    backBtn.innerHTML = SVG_BACK;
    backBtn.addEventListener("click", () => {
      this.selectedAltIndex = -1;
      this.setPhase("input");
    });
    header.appendChild(backBtn);

    const title = document.createElement("div");
    title.className = "hw-review-title";
    title.textContent = "Review";
    header.appendChild(title);

    phase.appendChild(header);

    // --- Content: stats + list ---
    const content = document.createElement("div");
    content.className = "hw-alts-content";

    const stats = document.createElement("div");
    stats.className = "hw-alts-stats";
    const countEl = document.createElement("span");
    countEl.className = "hw-alts-stats-count";
    countEl.textContent = `${this.alternatives.length} variants`;
    stats.appendChild(countEl);
    content.appendChild(stats);

    const list = document.createElement("div");
    list.className = "hw-alts-list";

    // Pre-select first alternative
    if (this.selectedAltIndex < 0) this.selectedAltIndex = 0;

    const applyBtnRef = { current: null as HTMLButtonElement | null };

    this.alternatives.forEach((alt, i) => {
      const card = document.createElement("div");
      card.className = "hw-alt-card";
      if (i === this.selectedAltIndex) card.classList.add("selected");

      const cardText = document.createElement("div");
      cardText.className = "hw-alt-card-text";
      cardText.textContent = alt.text;
      card.appendChild(cardText);

      const radio = document.createElement("div");
      radio.className = "hw-alt-radio";
      if (i === this.selectedAltIndex) {
        radio.classList.add("checked");
        radio.innerHTML = SVG_CHECK_WHITE;
      }
      card.appendChild(radio);

      card.addEventListener("click", () => {
        this.selectedAltIndex = i;
        // Update all cards
        list.querySelectorAll(".hw-alt-card").forEach((c, ci) => {
          c.classList.toggle("selected", ci === i);
          const r = c.querySelector(".hw-alt-radio") as HTMLElement;
          if (r) {
            r.classList.toggle("checked", ci === i);
            r.innerHTML = ci === i ? SVG_CHECK_WHITE : "";
          }
        });
        if (applyBtnRef.current) applyBtnRef.current.disabled = false;
      });

      list.appendChild(card);
    });
    content.appendChild(list);
    phase.appendChild(content);

    // --- Footer: Regenerate + Apply ---
    const footer = document.createElement("div");
    footer.className = "hw-alts-footer";

    const regenBtn = document.createElement("button");
    regenBtn.className = "hw-regen-btn";
    regenBtn.innerHTML = SVG_REFRESH;
    const regenLabel = document.createTextNode("Regenerate");
    regenBtn.appendChild(regenLabel);
    regenBtn.addEventListener("click", () => {
      this.onRegenerate?.("");
    });
    footer.appendChild(regenBtn);

    const applyBtn = document.createElement("button");
    applyBtn.className = "hw-apply-btn";
    applyBtnRef.current = applyBtn;
    const applyLabel = document.createTextNode("Apply");
    applyBtn.appendChild(applyLabel);
    const applyCheck = document.createElement("span");
    applyCheck.innerHTML = SVG_CHECK_WHITE;
    applyCheck.style.display = "flex";
    applyCheck.style.alignItems = "center";
    applyBtn.appendChild(applyCheck);
    applyBtn.addEventListener("click", () => {
      if (this.selectedAltIndex >= 0 && this.selectedAltIndex < this.alternatives.length) {
        this.onChoose?.(this.alternatives[this.selectedAltIndex], this.selectedAltIndex);
      }
    });
    footer.appendChild(applyBtn);

    phase.appendChild(footer);

    return phase;
  }

  private renderMultiAlternativesPhase(): HTMLElement {
    const phase = document.createElement("div");
    phase.className = "hw-alts-phase";

    const label = document.createElement("div");
    label.className = "hw-alts-label";
    label.textContent = "Pick an alternative";
    phase.appendChild(label);

    this.multiAlternatives.forEach((alt, i) => {
      const card = document.createElement("div");
      card.className = "hw-alt-card";
      card.addEventListener("click", () => this.onChooseMulti?.(alt, i));

      const cardLabel = document.createElement("div");
      cardLabel.className = "hw-alt-card-label";
      cardLabel.textContent = alt.label;
      card.appendChild(cardLabel);

      const textsContainer = document.createElement("div");
      textsContainer.className = "hw-alt-multi-texts";

      for (const entry of alt.texts) {
        const row = document.createElement("div");
        row.className = "hw-alt-multi-entry";

        const badge = document.createElement("div");
        badge.className = "hw-alt-multi-badge";
        badge.textContent = String(entry.index);
        row.appendChild(badge);

        const body = document.createElement("div");
        body.className = "hw-alt-multi-body";

        const matchingItem = this.multiItems.find((m) => m.index === entry.index);
        if (matchingItem) {
          const typeLabel = document.createElement("div");
          typeLabel.className = "hw-alt-multi-type";
          typeLabel.textContent = friendlyElementType(matchingItem.elementType);
          body.appendChild(typeLabel);
        }

        const text = document.createElement("div");
        text.className = "hw-alt-multi-text";
        text.textContent = entry.text;
        body.appendChild(text);

        row.appendChild(body);
        textsContainer.appendChild(row);
      }

      card.appendChild(textsContainer);
      phase.appendChild(card);
    });

    phase.appendChild(this.renderRetrySection());
    phase.appendChild(this.renderCancelButton());

    return phase;
  }

  // --- Shared sub-components ---

  private renderRetrySection(): HTMLElement {
    const retrySection = document.createElement("div");
    retrySection.className = "hw-retry-section";

    const retryBtn = document.createElement("button");
    retryBtn.className = "hw-ghost-btn";
    retryBtn.textContent = "Try again";
    retryBtn.addEventListener("click", () => {
      retrySection.innerHTML = "";
      const feedbackRow = document.createElement("div");
      feedbackRow.className = "hw-custom-row";

      const feedbackInput = document.createElement("input");
      feedbackInput.className = "hw-custom-input";
      feedbackInput.type = "text";
      feedbackInput.placeholder = "What to change (optional)";
      feedbackInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.onRegenerate?.(feedbackInput.value.trim());
      });
      feedbackRow.appendChild(feedbackInput);

      const regenBtn = document.createElement("button");
      regenBtn.className = "hw-btn-primary";
      regenBtn.textContent = "Regenerate";
      regenBtn.addEventListener("click", () => {
        this.onRegenerate?.(feedbackInput.value.trim());
      });
      feedbackRow.appendChild(regenBtn);

      retrySection.appendChild(feedbackRow);
      feedbackInput.focus();
    });
    retrySection.appendChild(retryBtn);

    return retrySection;
  }

  private renderCustomSection(): HTMLElement {
    const customSection = document.createElement("div");
    customSection.className = "hw-custom-section";

    const customLabel = document.createElement("div");
    customLabel.className = "hw-custom-label";
    customLabel.textContent = "Or write your own";
    customSection.appendChild(customLabel);

    const customRow = document.createElement("div");
    customRow.className = "hw-custom-row";

    const customInput = document.createElement("input");
    customInput.className = "hw-custom-input";
    customInput.type = "text";
    customInput.placeholder = "Type replacement text\u2026";
    customInput.value = this.customText;
    customInput.addEventListener("input", () => {
      this.customText = customInput.value;
      const useBtn = customRow.querySelector(".hw-btn-use") as HTMLElement | null;
      if (useBtn) useBtn.classList.toggle("visible", !!this.customText.trim());
    });
    customRow.appendChild(customInput);

    const useBtn = document.createElement("button");
    useBtn.className = "hw-btn-use";
    useBtn.textContent = "Use";
    useBtn.addEventListener("click", () => {
      if (this.customText.trim()) this.onCustomText?.(this.customText.trim());
    });
    customRow.appendChild(useBtn);

    customSection.appendChild(customRow);
    return customSection;
  }

  private renderCancelButton(): HTMLElement {
    const cancel = document.createElement("button");
    cancel.className = "hw-ghost-btn";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => {
      this.hide();
      this.onDismiss?.();
    });
    return cancel;
  }

  private renderDonePhase(): HTMLElement {
    const phase = document.createElement("div");
    phase.className = "hw-done-phase";

    const icon = document.createElement("div");
    icon.className = "hw-done-icon";
    const text = document.createElement("div");
    text.className = "hw-done-text";
    const subtitle = document.createElement("div");
    subtitle.className = "hw-done-subtitle";

    if (this.doneResult.reverted) {
      icon.innerHTML = `<svg viewBox="0 0 18 18" fill="none"><path d="M4 8L2 6L4 4" stroke="#a3a3a3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 6H11C13.76 6 16 8.24 16 11C16 13.76 13.76 16 11 16H6" stroke="#a3a3a3" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      text.textContent = "Reverted";
    } else if (this.doneResult.clipboard) {
      icon.innerHTML = `<svg viewBox="0 0 18 18" fill="none"><rect x="6" y="2" width="9" height="11" rx="1.5" stroke="#2563EB" stroke-width="1.5"/><path d="M3 6.5V14.5C3 15.33 3.67 16 4.5 16H10.5" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      text.textContent = "Copied to clipboard";
      subtitle.textContent =
        this.doneResult.multiCount && this.doneResult.multiCount > 1
          ? `Couldn\u2019t write all ${this.doneResult.multiCount} elements to source \u2014 paste manually`
          : "Couldn\u2019t find text in source files \u2014 paste it manually";
    } else if (this.doneResult.multiCount && this.doneResult.multiCount > 1) {
      icon.innerHTML = `<svg viewBox="0 0 18 18" fill="none"><path d="M4 9.5L7.5 13L14 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      text.textContent = `Applied to ${this.doneResult.multiCount} elements`;
    } else {
      icon.innerHTML = `<svg viewBox="0 0 18 18" fill="none"><path d="M4 9.5L7.5 13L14 5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      text.textContent = "Applied";
      if (this.doneResult.file) {
        subtitle.textContent = `Written to ${this.doneResult.file}${this.doneResult.line ? `:${this.doneResult.line}` : ""}`;
      }
    }

    phase.appendChild(icon);
    phase.appendChild(text);
    if (subtitle.textContent) phase.appendChild(subtitle);

    if (this.doneResult.canUndo && !this.doneResult.reverted) {
      const undoBtn = document.createElement("button");
      undoBtn.className = "hw-ghost-btn hw-undo-btn";
      undoBtn.textContent = "Undo";
      undoBtn.addEventListener("click", () => this.onUndo?.());
      phase.appendChild(undoBtn);
    }

    return phase;
  }
}

// --- Helpers ---

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  p: "body",
  li: "list item",
  blockquote: "quote",
  button: "cta",
  a: "link",
  figcaption: "caption",
  span: "text",
};

function friendlyElementType(tag: string): string {
  return ELEMENT_TYPE_LABELS[tag.toLowerCase()] ?? tag.toLowerCase();
}

function formatModelName(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("sonnet")) return "Sonnet 4.5";
  if (m.includes("haiku")) return "Haiku 4.5";
  if (m.includes("opus")) return "Opus 4";
  // Truncate long model IDs
  return model.length > 16 ? model.substring(0, 13) + "\u2026" : model;
}
