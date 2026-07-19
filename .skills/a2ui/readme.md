# A2UI

**Version:** 1
**Target:** `.skills/a2ui`

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
* **v1** : Initial implementation of the A2UI protocol skill framework.
