import { useEffect, useRef } from "react";

interface HemingwayProps {
  port?: number;
}

/**
 * Thin React wrapper for the Hemingway browser overlay.
 *
 * Injects `<script src="http://localhost:{port}/client.js">` on mount
 * and cleans up on unmount. Renders nothing.
 */
export function Hemingway({ port = 4800 }: HemingwayProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Skip in production and SSR
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;

    // Don't double-inject
    if (scriptRef.current) return;

    const script = document.createElement("script");
    script.src = `http://localhost:${port}/client.js`;
    script.async = true;
    script.onerror = () => {
      console.warn(
        `[Hemingway] Failed to load client from http://localhost:${port}/client.js. Is the server running?`
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
  }, [port]);

  return null;
}
