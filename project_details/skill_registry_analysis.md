# Skill Registry Analysis

## Executive Summary
This document analyzes the payload structures and routing mechanics of 6 different AI Agent Skill platforms to determine the feasibility of programmatically ingesting their skills into a CLI tool.

## Platform Analysis

### 1. mcpservers.org
* **Routing Strategy**: Given an input link like `https://mcpservers.org/agent-skills/<author>/<skill-name>`, the URL directly serves the markdown payload.
* **Payload Structure**: Returns pure **Markdown (`text/markdown`)** with YAML frontmatter containing metadata (`title`, `description`, `image`), followed by the skill content and CLI installation snippets.
* **Parsing Logic**: 
  1. Issue an HTTP GET to the exact user-provided URL.
  2. Parse the YAML frontmatter (`--- ... ---`) to extract the skill metadata.
  3. Ingest the remaining raw markdown as the active skill payload.
* **Integration Difficulty**: **Very Easy**. The server naturally returns structured Markdown natively.

### 2. microsoft.github.io/skills
* **Routing Strategy**: Given an input link like `https://microsoft.github.io/skills/<filename>.txt`, the URL acts as a static file server.
* **Payload Structure**: Returns raw **text/plain** following the `llms.txt` standard specification.
* **Parsing Logic**: 
  1. Issue an HTTP GET to the direct `.txt` URL.
  2. Ingest the text body entirely; no frontmatter or HTML stripping is needed.
* **Integration Difficulty**: **Very Easy**. It behaves like raw GitHub user content.

### 3. agentskill.sh
* **Routing Strategy**: URLs follow `/skillsets/<skill-name>`.
* **Payload Structure**: Returns rendered **HTML (`text/html`)**. Passing Accept headers does not yield JSON or Markdown.
* **Parsing Logic**: 
  1. Issue an HTTP GET to the `https://agentskill.sh/skillsets/<skill-name>` URL.
  2. Parse the HTML DOM. Look for specific markdown-containing wrappers (e.g., `<pre>`, `<code>`, or Markdown container `div`s).
  3. Alternatively, extract the Next.js hydration payload (`<script id="__NEXT_DATA__" type="application/json">`) to read the raw skill instructions directly from the JSON state.
* **Integration Difficulty**: **Medium Difficulty**. Requires DOM parsing or hydration state extraction.

### 4. skills.sh
* **Routing Strategy**: Grouped by topic or agent, e.g., `/topic/<topic-name>` or `/agent`.
* **Payload Structure**: Returns rendered **HTML (`text/html`)**.
* **Parsing Logic**: 
  1. Hit the user-provided URL.
  2. Because the raw payload is not exposed, the CLI must parse the HTML DOM for the skill's content blocks.
  3. A robust implementation would involve reverse-engineering the site's internal API requests to fetch JSON rather than scraping the UI.
* **Integration Difficulty**: **Medium Difficulty**. Similar to `agentskill.sh`, it requires HTML scraping or undocumented internal API usage.

### 5. skillsmp.com
* **Routing Strategy**: Deep creator paths like `/creators/<author>/<category>/<skill-name>`.
* **Payload Structure**: Returns rendered HTML wrapping marketplace listings.
* **Parsing Logic**:
  1. First, check if the provided URL matches `/creators/([^/]+)/([^/]+)/([^/]+)`.
  2. Instead of scraping the HTML, the CLI should preferably hit `https://skillsmp.com/api/` or `/docs/api` endpoints (if documented) using the extracted creator and skill IDs.
  3. If no public API exists for extraction, the CLI must scrape the HTML structure of the creator's page for the markdown content.
* **Integration Difficulty**: **Medium to Hard**. It is a full marketplace; direct programmatic extraction requires reverse-engineering their API or complex scraping.

### 6. agentskills.io
* **Routing Strategy**: Documentation-style paths like `/skill-creation/quickstart`.
* **Payload Structure**: Rendered HTML pages built via Mintlify.
* **Parsing Logic**: N/A. This platform functions as a documentation site and specification hub for the "Agent Skills" open standard, rather than a searchable registry or marketplace of executable skills.
* **Integration Difficulty**: **Not Applicable**. It shouldn't be a target for direct skill ingestion.
