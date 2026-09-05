---
​‌‍name: Stealth Browser & Ghost Graph
description: Powerhouse tri-engine ghost browser skill for AI agents. Combines Ghost Graph LLM extraction pipelines, FastMCP undetectable browser automation, and Ghost Core ultra-lightweight CDP micro-engine.
version: 3
---

# Stealth Browser & Ghost Graph Skill

This skill equips the agent with an all-in-one ghost browser, AI-driven web extraction powerhouse, and ultra-lightweight CDP runtime. It operates in three complementary engine modes:

1. **Engine 1 (Ghost Graph Extraction Pipelines)**: Direct prompt-driven scraping, multi-source search graph synthesis, and Pydantic schema validation using local (Ollama) or cloud (Gemini, Claude, OpenAI, Groq) LLMs.
2. **Engine 2 (FastMCP Stealth Browser Automation)**: Undetectable low-level browser automation (`nodriver`, Chrome DevTools Protocol, Cloudflare bypass, and real-time network interception).
3. **Engine 3 (Ghost Core Ultra-Light CDP Micro-Engine)**: Bespoke native headless engine with a ~30MB memory footprint, sub-100ms startup latency, built-in hardware fingerprint randomization, and drop-in CDP compatibility.

---

## 1. Quick Start & Environment Verification

Before executing browser tasks, run the environment diagnostic tool:

```bash
# Verify Python version, browser binaries, and installed packages
python .skills/stealth-browser/scripts/setup.py

# Install missing dependencies and Playwright Chromium
python .skills/stealth-browser/scripts/setup.py --install
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
python .skills/stealth-browser/scripts/scrape.py \
  --url "https://news.ycombinator.com" \
  --prompt "Extract the top 10 articles with title, score, author, and url" \
  --json

# Enforce a custom model provider (e.g. Gemini, OpenAI, Claude, Ollama)
python .skills/stealth-browser/scripts/scrape.py \
  --url "https://github.com/trending" \
  --prompt "List trending repositories with repo name, description, and stars" \
  --model gemini \
  --json
```

### B. Autonomous Search Graph (Multi-Source Research)
Execute multi-page search and synthesis across search engines without manual scraping:

```bash
# Search across multiple web sources and synthesize key takeaways
python .skills/stealth-browser/scripts/search.py \
  --query "Latest architectural features in React 19" \
  --max-results 4 \
  --json
```

---

## 3. Engine 2: FastMCP Stealth Browser Automation

For complex multi-step interactions, form fills, button clicks, and bypassing heavy anti-bot walls (Cloudflare, Queue-It), use the Stealth Browser FastMCP server.

### Key Capabilities
* **Anti-Detection**: Employs `nodriver` and CDP hooks to strip `navigator.webdriver` flags and simulate human interaction heuristics.
* **Element Interaction**: `spawn_browser()`, `navigate()`, `click_element()`, `type_text()`, `paste_text()`, `file_upload()`.
* **CDP Element Extraction**: `extract_complete_element_cdp()`, `extract_element_styles()`, `extract_element_structure()`.
* **Dynamic Network Hooks**: `create_dynamic_hook()` : Injects custom Python hooks to intercept or rewrite HTTP requests and API responses in real-time.

### Running the MCP Server
```bash
# Minimal mode (20 core tools, optimal context footprint)
python src/server.py --minimal

# Full mode (97 tools across 11 categories)
python src/server.py
```

---

## 4. Engine 3: Ghost Core Ultra-Lightweight CDP Micro-Engine

When running high-concurrency scraping loops or operating in memory-constrained environments, standard Chromium (~250MB+ RAM per instance) causes severe resource contention. The Ghost Core micro-engine runs with a lean ~30MB memory footprint and sub-100ms startup.

### Key Capabilities
* **Minimal Footprint**: Operates with approximately 30MB of RAM and sub-100ms page load speeds.
* **Hardware Profile Randomization**: Injects randomized WebGL GPU vendors, 2D Canvas noise seeds, and AudioContext buffer jitter on every session to evade fingerprint tracking.
* **Drop-In CDP Endpoint**: Exposes a standard Chrome DevTools Protocol WebSocket interface (`ws://127.0.0.1:9222`).

### Running the Ghost Core Controller
```bash
# Start or bind the Ghost Core CDP daemon listener
python .skills/stealth-browser/scripts/ghost_core.py --serve --port 9222

# Inspect daemon health, memory footprint, and active endpoint
python .skills/stealth-browser/scripts/ghost_core.py --status

# Generate a randomized anti-bot hardware profile
python .skills/stealth-browser/scripts/ghost_core.py --randomize-profile

# Rapidly render and dump a target webpage
python .skills/stealth-browser/scripts/ghost_core.py --dump "https://example.com"
```

### Playwright Integration Recipe (Connect over CDP)
```python
import asyncio
from playwright.async_api import async_playwright

async def run_lean_scrape():
    async with async_playwright() as p:
        # Attach Playwright directly to the Ghost Core micro-CDP daemon
        browser = await p.chromium.connect_over_cdp("ws://127.0.0.1:9222")
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.goto("https://news.ycombinator.com")
        title = await page.title()
        print(f"Loaded page '{title}' with ~30MB memory profile!")
        await browser.close()

asyncio.run(run_lean_scrape())
```

---

## 5. Best Practices for AI Agents

1. **Model Selection**: Default to `gemini` (Gemini 1.5 Flash) for fastest zero-cost extraction or `ollama` for fully offline local operations.
2. **Deterministic Schemas**: When structured data is required, pass explicit field names in the prompt or supply a JSON schema file via `--schema <file.json>`.
3. **High-Concurrency Tasks**: Use Engine 3 (Ghost Core) whenever scraping multiple pages in parallel to avoid Chromium memory saturation.
4. **Ghost Evasion**: If a site employs aggressive Cloudflare Turnstile or fingerprinting, use Engine 2 with `nodriver` and randomized hardware profiles.
5. **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
