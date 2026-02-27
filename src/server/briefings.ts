// --- Targeted briefings for copy generation ---
// Maps (copyJob, sectionRole) to specific directives that tell Claude
// exactly what this element needs to accomplish.

// ---------------------------------------------------------------------------
// Element job directives
// ---------------------------------------------------------------------------

// Primary directives by copy job (applied when no section-specific override exists)
const JOB_DIRECTIVES: Record<string, string> = {
  "primary-headline":
    "This is the primary headline. It must communicate the core value proposition in a single pass \u2014 specific enough to intrigue, clear enough to understand instantly. Not a tagline, not a feature list. The right reader should think 'this is for me' and the wrong reader should think 'this isn't for me.' Both outcomes are correct.",

  "section-header":
    "This is a section header. It should advance an argument, not just label the section. 'How It Works' is a label. 'Your first AI agent, live in a day' is an argument. If this header could appear on any company's site, it needs to be rewritten. The reader should react \u2014 agree, disagree, or want to know more.",

  eyebrow:
    "This is eyebrow text \u2014 a short credibility marker above a heading. Its only job is to add a fact that makes the adjacent headline more believable. 'Trusted by 200+ enterprise teams' changes how the headline lands. Generic labels like 'Introducing' or 'Welcome to' add noise without signal. Keep it under 50 characters.",

  subheadline:
    "This is a subheadline that supports the heading above it. It should expand on the headline with specificity \u2014 add the detail, the proof point, or the 'how' that the headline deliberately left out. One to two sentences max. Don't repeat the headline in different words.",

  "section-opener":
    "This is the opening line of the section. It should make the reader want the second line. Lead with the thing most likely to create tension, recognition, or curiosity. Don't open with context-setting \u2014 that's for the middle. Open with the sharpest point.",

  "body-copy":
    "This is body copy within a section. One thought per paragraph, building toward the section's point. Each paragraph should add something the previous one couldn't have said. Avoid paragraph padding \u2014 restating what was just said in different words. If it could be cut without the reader noticing, it should be cut.",

  "cta-label":
    "This is a CTA button label. Strong verb + what the buyer gets. 'Submit' is a cost. 'Get your deployment plan' is a reward. Describe what happens on the other side of the click, not the act of clicking. Use first-person framing where it fits ('Start my trial' over 'Start your trial').",

  testimonial:
    "This is a testimonial or quote. It should sound like a real person said it \u2014 not polished marketing copy. Lead with the specific result or transformation, not generic praise. Numbers beat adjectives. 'Reduced deployment time by 60%' outperforms 'dramatically faster deployment.'",

  "feature-point":
    "This is a feature or benefit point. Make the abstract concrete. Answer the implicit question: 'What does that mean for me, on a Tuesday afternoon?' Pair every abstraction with a specific, believable use case. Lead with the benefit, use the feature to prove you can deliver it.",

  caption:
    "This is a caption or supporting label. Keep it factual and brief. Captions should add context that isn't obvious from the visual \u2014 a specific detail, a name, a result. Don't editorialize.",

  stat:
    "This is a stat or metric. The number is the star \u2014 make sure the framing maximizes its impact. Pair the number with what it means for the reader. '60% faster' is good. '60% faster \u2014 your team ships before lunch instead of after dinner' is better.",

  general:
    "Generate alternatives that match the element's apparent role in the page. Consider its tag type, surrounding content, and section context to determine what this copy needs to accomplish.",
};

// Section-specific overrides for certain (copyJob, sectionRole) combinations
const SECTION_OVERRIDES: Record<string, Record<string, string>> = {
  hero: {
    "primary-headline":
      "This is the hero headline \u2014 the first thing visitors read. It must communicate the core value proposition in under 5 seconds. Not a tagline, not a question, not a feature list \u2014 a claim specific enough to intrigue and clear enough to understand in a single pass. The right reader should think 'this is for me.'",
    subheadline:
      "This is the hero subheadline. It expands on the headline with specificity \u2014 the detail or proof point the headline deliberately omitted. One to two sentences max. This is where you can add the 'how' or the 'who it's for' that the headline left open.",
    "cta-label":
      "This is the primary CTA in the hero \u2014 the single most important action on the page. The label should feel smaller than the value being offered. Frame it as a preview or a start, not a commitment. 'See it in action' over 'Request a demo.'",
  },
  problem: {
    "section-header":
      "This header should name the reader's pain accurately enough that they feel seen. Specificity is the signal \u2014 generic pain statements ('it's hard to scale') create distance; precise pain statements create trust.",
    "section-opener":
      "Open with the pain the reader is already feeling. Name it precisely. The goal is recognition, not empathy performance. Get the problem right and the reader leans in.",
  },
  solution: {
    "section-header":
      "This header should describe the outcome, not the process. The reader doesn't want to understand how your solution works yet \u2014 they want to believe it will work for them. Lead with the world-after-state.",
    "section-opener":
      "Describe the outcome first. Paint the picture of what changes for the reader. Save the mechanism for later. This opening should make the solution feel inevitable given the problem described above.",
  },
  features: {
    "section-header":
      "This header should lead with the feature that resolves the biggest objection, not the most technically impressive one. Make it about what the reader gets, not what the product does.",
    "feature-point":
      "Each feature should answer: 'What does that mean for me, on a Tuesday afternoon?' Lead with the benefit, use the feature name to prove you can deliver it. Don't list capabilities \u2014 translate them into recognizable scenarios.",
  },
  "social-proof": {
    "section-header":
      "This header should let the proof do the talking. Don't claim you're trusted \u2014 show it. A header like '200+ teams ship faster with us' carries more weight than 'Trusted by industry leaders.'",
    testimonial:
      "This is a testimonial in the social proof section. Lead with the specific result. Attribute to a real, named source. Numbers beat adjectives. The reader should be able to verify or at least believe this is a real person's experience.",
  },
  cta: {
    "section-header":
      "This is the closing section header. Restate the core promise in its most compelling form. This is the last chance to convince \u2014 make the next action feel inevitable, not pressured.",
    "cta-label":
      "This is the final CTA \u2014 the close. Strong verb + specific reward. Every CTA carries an implicit fear ('What if I'm wrong?'). The surrounding copy should address that fear; the button label should name what they get.",
    "body-copy":
      "This is closing copy near the final CTA. Recap the value. Address the last hesitation. Include a risk reversal ('No commitment', '5 minutes to set up', 'Cancel anytime') within a sentence of the button.",
  },
};

// ---------------------------------------------------------------------------
// Position modifiers
// ---------------------------------------------------------------------------

/**
 * Returns a tone-adjusting note based on where the section sits on the page.
 */
export function getPositionModifier(pagePosition: string): string {
  const match = pagePosition.match(/Section (\d+) of (\d+)/i);
  if (!match) return "";

  const index = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);

  if (index === 1) {
    return "Position: Above the fold. Clarity over cleverness. Every word is doing orientation work. No assumed context.";
  }
  if (index >= total - 1) {
    return "Position: Final section. Close. Restate the core promise. Make the next action feel inevitable, not pressured.";
  }
  return "Position: Mid-page. Build the case. More nuance is allowed here \u2014 you've earned the reader's attention.";
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Returns a focused briefing for a specific element, based on its copy job
 * and the section role it lives in.
 */
export function getElementBriefing(copyJob: string, sectionRole: string): string {
  // Check for a section-specific override first
  const sectionOverrides = SECTION_OVERRIDES[sectionRole];
  if (sectionOverrides?.[copyJob]) {
    return sectionOverrides[copyJob];
  }

  // Fall back to the general job directive
  return JOB_DIRECTIVES[copyJob] || JOB_DIRECTIVES["general"];
}
