# Personas Format Schema

Personas are role packs that turn the skill library into named specialists.
Each persona lives in `personas/<slug>/PERSONA.md`: YAML frontmatter for
machine routing plus a markdown body for behavior.

## Frontmatter keys (all required)

* `name`: display name, title case, literal and descriptive.
* `slug`: kebab-case directory name, must match the parent folder.
* `version`: whole number as a string, starts at `1`, increments by 1 per change.
* `description`: one to two sentences stating the role, domain, and audience.
* `auto_skills`: map of skill slug to one line routing reason. Every slug MUST
  exist in `.skills/`. Empty map `{}` only when no skill fits; prefer at least
  one routing anchor.
* `skill_gaps`: list of one line capability needs with no covering skill. These
  feed `SKILL_GAPS.md` for future bundles. Empty list `[]` when fully covered.

## Body sections (in order)

* `## Role`: who the persona is and who it serves, two to four sentences.
* `## Method`: how it works: inputs it asks for, sources it trusts, how it
  verifies claims, and what it refuses to fake.
* `## Workflow`: numbered default engagement flow, five to eight steps.
* `## Guardrails`: hard limits: safety, honesty, privacy, and escalation rules.

## Registry and gap log

* `personas/README.md` holds the registry table: Persona, Description,
  Auto skills, Gaps, Path. One row per persona, alphabetical by name.
* `personas/SKILL_GAPS.md` consolidates every frontmatter gap into a build
  queue grouped by suggested future bundle. Update it whenever gaps change.

## Typography

No em dashes or en dashes anywhere. No hyphens as punctuation; hyphens inside
skill slugs, code, URLs, and flags are fine. Asterisks for lists.
