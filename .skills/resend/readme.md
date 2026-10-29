# Resend

**Version:** 3

**Target:** `.skills/resend`

**Category:** Data, Databases & Storage

**Keywords:** `resend`, `transactional-email`, `react-email`, `smtp`, `email-api`, `deliverability`, `email-sending`, `email-templates`, `domain-verification`, `email-webhooks`, `batch-email`, `resend-api`, `email-audiences`, `bounce-handling`, `nodejs-email`

## Description
Sends emails using the Resend API

## Capabilities & Use Cases
* **Environment Configuration & Validation**: Automatically detects existing Resend configurations or prompts the user for required API keys and verified sending domains, safely injecting them into `.env` or `.env.local`.
* **Utility Scaffolding**: Architecturally generates a highly reusable `sendEmail.ts` (or `.js`) utility function that robustly wraps the official Resend Node.js SDK, enabling simple parameter-driven email dispatch (`to`, `subject`, `html`, `from`).
* **Error Handling & Best Practices**: Enforces clean architectural separation between UI logic and email utility layers, implementing strict `try/catch` blocks for graceful API error handling.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
