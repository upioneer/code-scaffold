# Stealth Browser

**Version:** 3
**Target:** `.skills/stealth-browser`
**Category:** Web Automation & Scraping
**Keywords:** `stealth-browser`, `ghost-graph`, `ghost-core`, `lightweight-cdp`, `nodriver`, `cloudflare-bypass`, `antibot`, `fastmcp`, `smart-scraper`, `hardware-randomization`, `canvas-noise`, `micro-browser`

## Description
A powerhouse tri-engine ghost browser skill for AI agents. Unifies Ghost Graph LLM extraction pipelines, FastMCP undetectable browser automation with Cloudflare bypass, and the ultra-lightweight Ghost Core native CDP micro-engine.

## Capabilities & Use Cases
* **Tri-Engine Ghost Architecture**: Seamlessly unifies Ghost Graph high-level LLM extraction pipelines, low-level FastMCP stealth automation, and the ultra-lean Ghost Core native CDP micro-engine under a single cohesive toolset.
* **Ghost Core Ultra-Lightweight Micro-Engine**: Native headless browser engine operating with a minimal ~30MB memory footprint (compared to 250MB+ in standard Chromium), delivering sub-100ms startup times and high-concurrency agent scraping loops.
* **Hardware Profile and Fingerprint Randomization**: Built-in anti-detection engine dynamically randomizes WebGL GPU vendors and renderers, injects deterministic 2D Canvas noise, adds AudioContext buffer jitter, and completely eliminates `navigator.webdriver` flags.
* **Universal Drop-In CDP Daemon**: Exposes a standard Chrome DevTools Protocol WebSocket endpoint (`ws://127.0.0.1:9222`), acting as an instant drop-in replacement for headless Chrome in Playwright and Puppeteer automation scripts.
* **Smart Scraper Graph Pipeline**: Enables prompt-driven, single-pass extraction of clean structured JSON or Markdown from static and complex dynamic JavaScript single-page applications.
* **Autonomous Search Graph Synthesis**: Automatically orchestrates multi-source web search queries, crawls top search engine results, and synthesizes key takeaways without manual scraping.
* **Multi-Model Provider Support**: Integrates out of the box with Google Gemini, OpenAI (GPT-4o), Anthropic Claude 3.5 Sonnet, Groq, and local offline Ollama instances.
* **Advanced Antibot Bypass Engine**: Defeats Cloudflare, Queue-It, and complex fingerprinting systems using nodriver, Chrome DevTools Protocol, and realistic human-interaction heuristics.
* **Massive 97-Tool FastMCP Arsenal**: Offers a complete suite of 97 tools spanning 11 specialized categories, providing full control over navigation, DOM interaction, tab management, and CDP execution.
* **Modular Architecture Selection**: Supports a full-featured default mode, a streamlined minimal mode (20 core tools) via the `--minimal` flag, and selective disabling of sections to optimize context window usage.
* **Pixel-Accurate Element Cloning**: Uses deep CDP hooks to progressively extract complete DOM elements including their associated CSS rules, computed styles, JavaScript event listeners, and media assets.
* **Real-Time Dynamic AI Hooks**: Enables agents to write, validate, and inject raw Python hook functions on the fly to intercept, block, or rewrite network traffic and API responses dynamically.
* **Automated Diagnostic Harness**: Includes a dedicated setup and diagnostic utility (`scripts/setup.py`) to verify Python 3.10+ environments, Playwright Chromium binaries, Ghost Core daemon status, and provider credentials.

## Usage
AI agents should invoke this skill when a user requests advanced ghost browser automation, web scraping on protected sites, prompt-driven structured data extraction, ultra-lightweight headless browsing, or search synthesis. Agents can run standalone graph scripts (`scripts/scrape.py`, `scripts/search.py`), launch the Ghost Core micro-engine daemon (`scripts/ghost_core.py`), or attach the FastMCP server to their preferred client.

## Changelog
* **v3** : Introduced Ghost Core ultra-lightweight native CDP micro-engine featuring ~30MB memory footprint, hardware fingerprint randomization (GPU/Canvas/Audio), and drop-in CDP compatibility for high-concurrency agent scraping loops.
* **v2** : Unified Ghost Graph LLM extraction pipelines (SmartScraper, SearchGraph) with the FastMCP stealth browser engine, adding multi-model support (Gemini, Claude, OpenAI, Ollama, Groq) and standalone CLI runners.
* **v1** : Initial release of the Stealth Browser MCP skill featuring antibot bypass, 97-tool architecture, and CDP element extraction.
