# Braille Animations

**Version:** 3
**Target:** `.skills/braille-animations`

## Description
Create and manage unicode braille animations and spinners for CLIs and web apps.

## Capabilities & Use Cases
* Creates smooth, high-density unicode braille animations and spinners for CLIs and web apps without relying on external assets.
* Leverages 2x4 grid structures of braille characters (U+2800 to U+28FF) for pseudo-pixel art.
* Implements robust Node.js animation loops using `unicode-animations`.
* Provides local custom braille grid conversions and custom spinner mapping utilities via helper scripts.
* Supports rendering specialized loading indicators and sub-character precision progress bars for terminal environments.
* Offers browser-compatible monospaced ASCII-style braille art implementations.
* Includes extensive reference data for built-in spinner patterns and frame sets.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Deployed custom interactive React/Vite sandbox demonstrating live unicode animations
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
