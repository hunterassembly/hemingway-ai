import { useEffect, useRef } from "react";

interface HemingwayProps {
  port?: number;
  endpoint?: string;
  shortcut?: string;
  notepadShortcut?: string;
  accentColor?: string;
}

interface HemingwayBootstrapConfig {
  serverUrl?: string;
  shortcut?: string;
  notepadShortcut?: string;
  accentColor?: string;
}

function normalizeBaseUrl(value: string): string {
  if (!value) return value;
  if (value.length > 1 && value.endsWith("/")) {
    return value.replace(/\/+$/, "");
  }
  return value;
}

/**
 * Thin React wrapper for the Hemingway browser overlay.
 *
 * Injects a client script on mount and cleans up on unmount.
 *
 * Modes:
 * - Standalone: defaults to `http://localhost:{port}`
 * - Connected: pass `endpoint` (e.g. `/api/hemingway`) for same-app routing
 */
export function Hemingway({
  port = 4800,
  endpoint,
  shortcut,
  notepadShortcut,
  accentColor,
}: HemingwayProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Skip in production and SSR
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;

    // Don't double-inject
    if (scriptRef.current) return;

    const baseUrlCandidates = endpoint
      ? [normalizeBaseUrl(endpoint)]
      : ["/api/hemingway", `http://localhost:${port}`];

    const win = window as unknown as Record<string, unknown>;
    const existing = (win.__HEMINGWAY_CONFIG as HemingwayBootstrapConfig | undefined) ?? {};

    let cancelled = false;
    let activeScript: HTMLScriptElement | null = null;

    const applyBootstrapConfig = (baseUrl: string) => {
      win.__HEMINGWAY_CONFIG = {
        ...existing,
        serverUrl: baseUrl,
        ...(shortcut ? { shortcut } : {}),
        ...(notepadShortcut ? { notepadShortcut } : {}),
        ...(accentColor ? { accentColor } : {}),
      } satisfies HemingwayBootstrapConfig;
    };

    const tryInject = (index: number) => {
      if (cancelled) return;
      if (index >= baseUrlCandidates.length) {
        const attempted = baseUrlCandidates.map((base) => `${base}/client.js`).join(", ");
        console.warn(
          `[Hemingway] Failed to load client script. Tried: ${attempted}. Is Hemingway running?`
        );
        return;
      }

      const baseUrl = baseUrlCandidates[index];
      const clientSrc = `${baseUrl}/client.js`;
      applyBootstrapConfig(baseUrl);

      const script = document.createElement("script");
      script.src = clientSrc;
      script.async = true;
      script.onerror = () => {
        if (script.parentElement) {
          script.parentElement.removeChild(script);
        }
        if (!cancelled) {
          tryInject(index + 1);
        }
      };
      script.onload = () => {
        if (cancelled) {
          if (script.parentElement) {
            script.parentElement.removeChild(script);
          }
          return;
        }
        scriptRef.current = script;
      };

      document.body.appendChild(script);
      activeScript = script;
    };

    tryInject(0);

    return () => {
      cancelled = true;

      // Clean up the overlay instance
      const win = window as unknown as Record<string, unknown>;
      const cb = win.__hemingway as { destroy?: () => void } | undefined;
      if (cb?.destroy) {
        cb.destroy();
        win.__hemingway = undefined;
      }

      // Remove the script tag
      const scriptToRemove = scriptRef.current ?? activeScript;
      if (scriptToRemove?.parentElement) {
        scriptToRemove.parentElement.removeChild(scriptToRemove);
      }
      scriptRef.current = null;
    };
  }, [port, endpoint, shortcut, notepadShortcut, accentColor]);

  return null;
}
