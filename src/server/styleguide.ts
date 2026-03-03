import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export interface GenerateStyleGuideResult {
  success: boolean;
  file: string;
  created: boolean;
  error?: string;
}

const STYLE_GUIDE_TEMPLATE = `# Style Guide

## Brand Voice
- Primary tone:
- Secondary tone:
- Avoid:

## Audience
- Primary audience:
- Their context:
- Their objections:

## Messaging Rules
- Preferred claims:
- Proof requirements:
- CTA style:

## Writing Preferences
- Headline style:
- Body copy style:
- Sentence length:
- Formatting conventions:

## Terminology
- Must-use phrases:
- Avoided phrases:
- Product naming:
`;

export async function generateStyleGuideFile(styleGuidePath: string): Promise<GenerateStyleGuideResult> {
  const target = resolve(process.cwd(), styleGuidePath || "./docs/style-guide.md");
  const dir = dirname(target);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(target, STYLE_GUIDE_TEMPLATE, { encoding: "utf-8", flag: "wx" });
    return { success: true, file: target, created: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "EEXIST") {
      return { success: true, file: target, created: false };
    }
    return { success: false, file: target, created: false, error: message };
  }
}
