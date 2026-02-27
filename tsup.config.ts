import { defineConfig } from "tsup";

const isWatch = process.argv.includes("--watch");

export default defineConfig([
  // Server bundle (Node.js)
  {
    entry: ["src/server/index.ts"],
    outDir: "dist/server",
    format: ["esm"],
    dts: true,
    clean: true,
    platform: "node",
    target: "node20",
    onSuccess: isWatch ? "node dist/server/index.js" : undefined,
  },
  // Client bundle (browser)
  {
    entry: ["src/client/overlay.ts"],
    outDir: "dist/client",
    format: ["esm", "iife"],
    dts: true,
    platform: "browser",
    target: "es2022",
    globalName: "__hemingway",
    // IIFE bundle served as /client.js
    outExtension({ format }) {
      if (format === "iife") return { js: ".iife.js" };
      return { js: ".js" };
    },
  },
  // React wrapper
  {
    entry: ["src/react.tsx"],
    outDir: "dist",
    format: ["esm"],
    dts: true,
    external: ["react"],
    platform: "browser",
  },
]);
