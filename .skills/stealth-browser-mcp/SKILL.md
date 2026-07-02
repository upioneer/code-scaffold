---
name: Stealth Browser MCP
description: Highly robust standalone skill for building, configuring, and operating the Stealth Browser MCP for undetectable browser automation.
---

# Stealth Browser MCP Skill

This skill provides comprehensive instructions for deploying, configuring, and operating the [Stealth Browser MCP](https://github.com/vibheksoni/stealth-browser-mcp). This tool provides undetectable browser automation for MCP-compatible AI agents, bypassing Cloudflare, antibot systems, and social media blocks using `nodriver`, Chrome DevTools Protocol (CDP), and FastMCP.

## 1. Installation & Environment Verification (CRITICAL)

Before attempting to use or configure Stealth Browser MCP, you MUST proactively verify if the required environment exists and prompt the user if dependencies are missing.

### Verification Steps
1. **Check for Python & Virtual Environment:** Ensure `python` (or `python3`) is available.
2. **Check for the Repository:** Verify if the `stealth-browser-mcp` directory exists in the expected location (usually within the project or globally).
3. **Check for Browsers:** The MCP requires Chrome, Chromium, or Microsoft Edge to be installed on the system.

### Installation Instructions
If the user needs to install the MCP, guide them through or execute (with permission) the following steps:
```bash
# 1. Clone the repository
git clone https://github.com/vibheksoni/stealth-browser-mcp.git
cd stealth-browser-mcp

# 2. Create and activate a virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

### Adding to MCP Clients
Provide the user with the correct configuration JSON for their specific MCP client (Claude Desktop, Cursor, etc.). 
Example for Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "stealth-browser-mcp": {
      "command": "/absolute/path/to/venv/bin/python",
      "args": ["/absolute/path/to/src/server.py"]
    }
  }
}
```

## 2. Core Features & Tool Arsenal

The MCP exposes up to 97 tools across 11 sections. It supports **Modular Architecture**: you can run it in full mode (97 tools), minimal mode (20 core tools via `--minimal`), or selectively disable sections (e.g., `--disable-cdp-functions`).

**Key Capabilities to leverage:**
* **Browser Management:** `spawn_browser()`, `navigate()`, `close_instance()`, `list_instances()`, `get_instance_state()`
* **Element Interaction:** `query_elements()`, `click_element()`, `type_text()`, `paste_text()`, `file_upload()`, `execute_script()`
* **Progressive Element Extraction (CDP-Accurate):** `extract_complete_element_cdp()`, `extract_element_styles()`, `extract_element_structure()`, `extract_element_events()`
* **Network Debugging & Interception:** `list_network_requests()`, `get_request_details()`, `modify_headers()`, `spawn_browser(block_resources=[...])`
* **Dynamic AI Hooks:** `create_dynamic_hook()`, `create_simple_dynamic_hook()` - Generates Python functions on the fly to intercept or modify network traffic in real-time.
* **CDP Function Execution:** `execute_cdp_command()`, `call_javascript_function()`, `inject_and_execute_script()`

## 3. Best Practices & Operational Mechanics

When operating the Stealth Browser MCP, always adhere to these best practices:
1. **State Verification:** Always verify browser state (using `get_instance_state()` or taking a screenshot) after navigating or performing critical actions. Do not assume page loads succeed blindly.
2. **Antibot Navigation:** If blocked, ensure you are not missing implicit waits, or try using human-like typing (`type_text()`) instead of fast text injection.
3. **Resource Cleanup:** The MCP automatically reaps idle browsers after 10 minutes (configurable via `BROWSER_IDLE_TIMEOUT` env var). If you need an instance to persist longer, pass `idle_timeout_seconds` when spawning.
4. **Environment Variables:** Use `STEALTH_BROWSER_MCP_AUTH_TOKEN` for HTTP transport security if not using local `stdio`. Use `STEALTH_BROWSER_DEBUG=1` to enable verbose stderr logging if things break.

## 4. Known Issues & Troubleshooting

* **No compatible browser found:** The system will auto-detect Chrome/Edge. If it fails, run `validate_browser_environment_tool()` to diagnose.
* **Tools hang or return malformed JSON:** If debug output pollutes stdout during `stdio` transport, the MCP JSON-RPC protocol gets corrupted. Ensure `STEALTH_BROWSER_DEBUG` is not set unless using HTTP transport, or ensure debug logs route to stderr.
* **Linux/Docker Crashes:** Chromium may crash in containerized environments. Run with sandbox disabled (the server typically auto-detects Docker/root environments to handle this).
* **Too Many Tools Cluttering Context:** If the LLM context is overwhelmed by 97 tools, advise the user to restart the MCP server with the `--minimal` flag.
