# Copy Intelligence Reference

Primary files:

- `src/server/briefings.ts`
- `src/server/generate.ts`
- `reference/saas-and-services-copy-guide.md`
- `src/server/preferences.ts`

## Prompt Design Philosophy

Generation is not raw "rewrite this text"; it is directive-driven.

The server builds structured prompts with strict priority:

1. Hard instructions and JSON output contract
2. Element-specific briefing
3. Learned user style preferences
4. Style guide document
5. Copy bible document
6. External reference guide examples

This ordering makes local element intent the dominant signal.

## Briefing System (`briefings.ts`)

`getElementBriefing(copyJob, sectionRole)` drives tactical copy behavior.

- Base directives are keyed by copy jobs like:
  - `primary-headline`
  - `section-header`
  - `subheadline`
  - `section-opener`
  - `body-copy`
  - `cta-label`
  - `testimonial`
  - `feature-point`
  - `caption`
  - `stat`
- Section-specific overrides exist for roles such as:
  - `hero`
  - `problem`
  - `solution`
  - `features`
  - `social-proof`
  - `cta`

Position modifiers further tune tone for above-the-fold, mid-page, or close sections.

## Single vs Multi Generation

- Single mode:
  - Generates 3 alternatives for one element.
  - Includes optional revision context when user regenerates.
- Multi mode:
  - Generates 3 cohesive "sets" across all selected elements.
  - Requires each alternative to provide indexed text for every selected element.
  - Emphasizes narrative consistency across heading/body combinations.

## Reference Corpus Usage

`reference/saas-and-services-copy-guide.md` is injected as a pattern library:

- Meant as inspiration and structural pattern matching.
- Prompt explicitly forbids verbatim copying.
- Enables grounded phrasing styles from recognizable SaaS/services patterns.

## Preference Learning

- Every chosen alternative label can be recorded as a pick.
- Top picks are surfaced as percentages and injected in `<style-preferences>`.
- This acts as a soft bias, not a hard override.

## Output Contract Invariants

Server expects JSON with exact shape and enforces validation:

- Single: `{ alternatives: [{ label, text }] }`
- Multi: `{ alternatives: [{ label, texts: [{ index, text }] }] }`

Parsing is defensive against markdown fences and extra wrapper text, but invalid structures still fail.

## Practical Prompt Debugging

If outputs degrade:

1. Verify section role and copy job classification from client context.
2. Confirm style guide/copy bible paths are valid and readable.
3. Check whether preference labels are overfitting style direction.
4. Validate model setting and API key.
