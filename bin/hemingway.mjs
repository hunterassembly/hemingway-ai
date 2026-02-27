#!/usr/bin/env node

import { parseArgs } from "node:util";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: "string", short: "p" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
  strict: false,
});

// --- Help ---

if (values.help) {
  console.log(`
  \x1b[1m\x1b[34m✎ Hemingway\x1b[0m — AI-powered copy alternatives

  \x1b[1mUsage:\x1b[0m
    npx hemingway-ai             Start the companion server
    npx hemingway-ai init        Scaffold config file
    npx hemingway-ai --help      Show this help

  \x1b[1mOptions:\x1b[0m
    -p, --port <number>        Server port (default: 4800)
    -h, --help                 Show help

  \x1b[1mSetup:\x1b[0m
    1. Run \x1b[36mnpx hemingway-ai init\x1b[0m to create a config file
    2. Set \x1b[36mANTHROPIC_API_KEY\x1b[0m in your environment
    3. Run \x1b[36mnpx hemingway-ai\x1b[0m in one terminal
    4. Run your dev server in another terminal
    5. Press \x1b[36mCmd+Shift+C\x1b[0m on your site to activate
`);
  process.exit(0);
}

// --- Init command ---

if (positionals[0] === "init") {
  const configPath = join(process.cwd(), "hemingway.config.mjs");

  // Check if config already exists
  try {
    await readFile(configPath, "utf-8");
    console.log("  \x1b[33mhemingway.config.mjs already exists.\x1b[0m");
    process.exit(0);
  } catch {
    // File doesn't exist, proceed
  }

  const template = `/** @type {import('hemingway-ai').HemingwayConfig} */
const config = {
  port: 4800,
  model: 'claude-sonnet-4-6',
  styleGuide: './docs/style-guide.md',
  copyBible: './docs/copy-bible.md',
  sourcePatterns: ['components/**/*.tsx', 'src/**/*.tsx', 'app/**/*.tsx'],
  excludePatterns: ['node_modules', '.next', 'dist', 'build'],
  shortcut: 'meta+shift+c',
  accentColor: '#3b82f6',
};

export default config;
`;

  await writeFile(configPath, template, "utf-8");

  console.log(`
  \x1b[1m\x1b[34mHemingway initialized!\x1b[0m

  Created \x1b[36mhemingway.config.mjs\x1b[0m

  \x1b[1mNext steps:\x1b[0m
    1. Set \x1b[36mANTHROPIC_API_KEY\x1b[0m in your environment
    2. Edit the config to match your project structure
    3. Run \x1b[36mnpx hemingway-ai\x1b[0m to start the server
    4. Add the script tag or React component to your app:

       \x1b[2m<!-- Script tag -->\x1b[0m
       \x1b[36m<script src="http://localhost:4800/client.js"><\/script>\x1b[0m

       \x1b[2m// Or React component\x1b[0m
       \x1b[36mimport { Hemingway } from 'hemingway-ai/react'\x1b[0m
       \x1b[36m<Hemingway />\x1b[0m
`);
  process.exit(0);
}

// --- Start server ---

const overrides = {};
if (values.port) {
  const port = parseInt(values.port, 10);
  if (isNaN(port)) {
    console.error("  \x1b[31mInvalid port number.\x1b[0m");
    process.exit(1);
  }
  overrides.port = port;
}

// Dynamic import to load the server module
const { startServer } = await import("../dist/server/index.js");
await startServer(overrides);
