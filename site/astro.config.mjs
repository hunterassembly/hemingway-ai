import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

const siteUrl = process.env.SITE_URL ?? "https://hellohemingway.com";

export default defineConfig({
  site: siteUrl,
  output: "static",
  adapter: vercel(),
});
