# A2UI

**Version:** 2

**Target:** `.skills/a2ui`

**Category:** Frontend & UI Design

**Keywords:** `a2ui`, `declarative-ui`, `json-to-ui`, `agent-ui`, `adaptive-cards`, `dynamic-forms`, `design-system`, `agent-to-user-interface`, `generative-ui`, `ui-protocol`, `json-ui-schema`, `component-catalog`, `streaming-ui`, `server-driven-ui`, `client-renderer`, `react-renderer`, `adaptive-interface`

## Description
Implements the Agent to User Interface (A2UI) protocol to generate declarative, secure, and incrementally updatable JSON UI payloads for client-side rendering.

## Capabilities & Use Cases
* Enables agents to natively construct complex user interfaces and data components using a strict declarative JSON schema (A2UI v0.9+), completely isolating the LLM from executing raw frontend code.
* Provides a highly optimized flat-list data structure that maximizes streaming efficiency, allowing client applications to eagerly render UI components as the agent thinks.
* Enforces a secure "Trust Ladder" architecture by restricting agent UI output to pre-approved frontend catalog components rather than arbitrary script execution.
* Seamlessly bridges orchestrated AI backend logic with framework-agnostic frontend wrappers, accelerating the development of interactive chat interfaces, bespoke data collection forms, and embedded dynamic widgets.

## Usage
Activate this skill when an agent needs to communicate structured, interactive UI intent to a frontend application, or when scaffolding a new A2UI client renderer pipeline.

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial implementation of the A2UI protocol skill framework.
