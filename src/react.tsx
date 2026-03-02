import { useEffect, useRef } from "react";

interface HemingwayProps {
  port?: number;
  endpoint?: string;
  shortcut?: string;
  accentColor?: string;
}

interface HemingwayBootstrapConfig {
  serverUrl?: string;
  shortcut?: string;
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
  accentColor,
}: HemingwayProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Skip in production and SSR
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;

    // Don't double-inject
    if (scriptRef.current) return;

    const baseUrl = normalizeBaseUrl(endpoint ?? `http://localhost:${port}`);
    const clientSrc = `${baseUrl}/client.js`;

    const win = window as unknown as Record<string, unknown>;
    const existing = (win.__HEMINGWAY_CONFIG as HemingwayBootstrapConfig | undefined) ?? {};
    win.__HEMINGWAY_CONFIG = {
      ...existing,
      serverUrl: baseUrl,
      ...(shortcut ? { shortcut } : {}),
      ...(accentColor ? { accentColor } : {}),
    } satisfies HemingwayBootstrapConfig;

    const script = document.createElement("script");
    script.src = clientSrc;
    script.async = true;
    script.onerror = () => {
      console.warn(
        `[Hemingway] Failed to load client from ${clientSrc}. Is the Hemingway endpoint running?`
      );
    };
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Clean up the overlay instance
      const win = window as unknown as Record<string, unknown>;
      const cb = win.__hemingway as { destroy?: () => void } | undefined;
      if (cb?.destroy) {
        cb.destroy();
        win.__hemingway = undefined;
      }

      // Remove the script tag
      if (scriptRef.current?.parentElement) {
        scriptRef.current.parentElement.removeChild(scriptRef.current);
      }
      scriptRef.current = null;
    };
  }, [port, endpoint, shortcut, accentColor]);

  return null;
}
