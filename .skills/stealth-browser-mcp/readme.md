# Stealth Browser MCP

**Version:** 1
**Target:** `.skills/stealth-browser-mcp`

## Description
A highly robust standalone skill for building, configuring, and operating the Stealth Browser MCP. It provides undetectable browser automation for AI agents, capable of bypassing Cloudflare and antibot systems using nodriver, Chrome DevTools Protocol, and FastMCP.

## Capabilities & Use Cases
* **Advanced Antibot Bypass Engine**: Defeats Cloudflare, Queue-It, and complex fingerprinting systems that block standard headless browsers, allowing seamless access to heavily protected banking, government, and e-commerce portals.
* **Massive 97-Tool Arsenal**: Offers a sprawling suite of 97 tools spanning 11 specialized categories, giving the AI agent complete control over navigation, DOM interaction, tab management, and CDP execution.
* **Modular Architecture Selection**: Supports a full-featured default mode, a streamlined minimal mode (20 core tools) via the `--minimal` flag, and selective disabling of sections (e.g., `--disable-cdp-functions`) to optimize context window usage.
* **Pixel-Accurate Element Cloning**: Uses deep CDP hooks to progressively extract complete DOM elements including their associated CSS rules, computed styles, JavaScript event listeners, and media assets for flawless UI recreation.
* **Deep Network Interception & Debugging**: Grants the agent full visibility into all incoming and outgoing network traffic, allowing inspection of request headers, response payloads, and API data streams.
* **Real-Time Dynamic AI Hooks**: Enables the agent to write, validate, and inject raw Python hook functions on the fly to intercept, block, or rewrite network traffic and API responses dynamically.
* **Human-Like Interaction Mechanics**: Features instantaneous text pasting via CDP and realistic simulated typing with variable keystroke delays and newline support to avoid bot detection heuristics.
* **Cross-Platform Compatibility**: Supports native execution on Windows, macOS, and Linux, and includes smart auto-detection for Docker containers and root environments to disable the Chromium sandbox gracefully.
* **Intelligent Resource Management**: Implements an automatic background reaper that cleans up idle browser instances (default 10 minutes) and sweeps stale temporary user profiles upon server startup to prevent memory leaks.
* **Seamless MCP Client Integration**: Runs perfectly across Claude Desktop, Cursor, and any standard MCP client without requiring intermediate brokers, supporting both `stdio` and bearer token authenticated `http` transports.

## Usage
AI agents should invoke this skill when a user requests advanced browser automation, web scraping on protected sites, or UI element cloning. Agents must proactively verify Python and repository existence, instruct the user to install dependencies, and supply the correct JSON configuration to attach the MCP server to their preferred client. Once attached, agents can leverage the MCP's tools to perform undetectable web operations, ensuring they use `get_instance_state()` to verify outcomes.

## Changelog
* **v1** : Initial release of the Stealth Browser MCP skill featuring antibot bypass, 97-tool architecture, and CDP element extraction.
