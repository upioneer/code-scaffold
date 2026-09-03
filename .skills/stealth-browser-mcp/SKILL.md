---
name: Stealth Browser MCP & Ghost Graph
description: Powerhouse dual-engine ghost browser skill for AI agents. Combines Ghost Graph LLM extraction pipelines with FastMCP undetectable browser automation and Cloudflare bypass.
---

# Stealth Browser & Ghost Graph Skill

This skill equips the agent with an all-in-one ghost browser and AI-driven web extraction powerhouse. It operates in two complementary modes:

1. **Engine 1 (Ghost Graph Extraction Pipelines)**: Direct prompt-driven scraping, multi-source search graph synthesis, and Pydantic schema validation using local (Ollama) or cloud (Gemini, Claude, OpenAI, Groq) LLMs.
2. **Engine 2 (FastMCP Stealth Browser Automation)**: Undetectable low-level browser automation (`nodriver`, Chrome DevTools Protocol, Cloudflare bypass, and network interception).

---

## 1. Quick Start & Environment Verification

Before executing browser tasks, run the environment diagnostic tool:

```bash
# Verify Python version, browser binaries, and installed packages
python .skills/stealth-browser-mcp/scripts/setup.py

# Install missing dependencies and Playwright Chromium
python .skills/stealth-browser-mcp/scripts/setup.py --install
```

### Supported Environment Variables
* `GEMINI_API_KEY` or `GOOGLE_API_KEY`: Google Gemini provider.
* `OPENAI_API_KEY`: OpenAI GPT-4o / GPT-4o-mini provider.
* `ANTHROPIC_API_KEY`: Anthropic Claude 3.5 Sonnet provider.
* `GROQ_API_KEY`: Groq ultra-fast Llama 3 70B provider.
* `OLLAMA_URL`: Local Ollama instance (default: `http://localhost:11434`).

---

## 2. Engine 1: Ghost Graph Extraction Pipelines

### A. Smart Scraper Graph (Prompt to Structured JSON)
Extract clean, structured JSON or Markdown from any static or dynamic JavaScript webpage:

```bash
# Extract structured data with natural language prompt
python .skills/stealth-browser-mcp/scripts/scrape.py \
  --url "https://news.ycombinator.com" \
  --prompt "Extract the top 10 articles with title, score, author, and url" \
  --json

# Enforce a custom model provider (e.g. Gemini, OpenAI, Claude, Ollama)
python .skills/stealth-browser-mcp/scripts/scrape.py \
  --url "https://github.com/trending" \
  --prompt "List trending repositories with repo name, description, and stars" \
  --model gemini \
  --json
```

### B. Autonomous Search Graph (Multi-Source Research)
Execute multi-page search and synthesis across search engines without manual scraping:

```bash
# Search across multiple web sources and synthesize key takeaways
python .skills/stealth-browser-mcp/scripts/search.py \
  --query "Latest architectural features in React 19" \
  --max-results 4 \
  --json
```

### C. Programmatic Python Ghost Graph Recipe

```python
from scrapegraphai.graphs import SmartScraperGraph

graph_config = {
    "llm": {
        "api_key": "YOUR_API_KEY",
        "model": "google_genai/gemini-1.5-flash",
    },
    "headless": True
}

smart_scraper = SmartScraperGraph(
    prompt="Extract pricing tiers with name, monthly price, and feature list",
    source="https://example.com/pricing",
    config=graph_config
)

result = smart_scraper.run()
print(result)
```

---

## 3. Engine 2: FastMCP Stealth Browser Automation

For complex multi-step interactions, form fills, button clicks, and bypassing heavy anti-bot walls (Cloudflare, Queue-It), use the Stealth Browser FastMCP server.

### Key Capabilities
* **Anti-Detection**: Employs `nodriver` and CDP hooks to strip `navigator.webdriver` flags and simulate human interaction heuristics.
* **Element Interaction**: `spawn_browser()`, `navigate()`, `click_element()`, `type_text()`, `paste_text()`, `file_upload()`.
* **CDP Element Extraction**: `extract_complete_element_cdp()`, `extract_element_styles()`, `extract_element_structure()`.
* **Dynamic Network Hooks**: `create_dynamic_hook()` - Injects custom Python hooks to intercept or rewrite HTTP requests and API responses in real-time.

### Running the MCP Server
```bash
# Minimal mode (20 core tools, optimal context footprint)
python src/server.py --minimal

# Full mode (97 tools across 11 categories)
python src/server.py
```

### Adding to MCP Clients (`claude_desktop_config.json` or `mcp.json`)
```json
{
  "mcpServers": {
    "stealth-browser-mcp": {
      "command": "python",
      "args": [".skills/stealth-browser-mcp/src/server.py"]
    }
  }
}
```

---

## 4. Best Practices for AI Agents

1. **Model Selection**: Default to `gemini` (Gemini 1.5 Flash) for fastest zero-cost extraction or `ollama` for fully offline local operations.
2. **Deterministic Schemas**: When structured data is required, pass explicit field names in the prompt or supply a JSON schema file via `--schema <file.json>`.
3. **Ghost Evasion**: If a site blocks standard requests, toggle Engine 2 with `nodriver` and human-like typing delays (`type_text`).
