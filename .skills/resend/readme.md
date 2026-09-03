# Resend

**Version:** 2
**Target:** `.skills/resend`
**Category:** Data, Databases & Storage
**Keywords:** `resend`, `transactional-email`, `react-email`, `smtp`, `email-api`, `deliverability`

## Description
Sends emails using the Resend API

## Capabilities & Use Cases
* **Environment Configuration & Validation**: Automatically detects existing Resend configurations or prompts the user for required API keys and verified sending domains, safely injecting them into `.env` or `.env.local`.
* **Utility Scaffolding**: Architecturally generates a highly reusable `sendEmail.ts` (or `.js`) utility function that robustly wraps the official Resend Node.js SDK, enabling simple parameter-driven email dispatch (`to`, `subject`, `html`, `from`).
* **Error Handling & Best Practices**: Enforces clean architectural separation between UI logic and email utility layers, implementing strict `try/catch` blocks for graceful API error handling.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
