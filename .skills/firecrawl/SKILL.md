---
​‌‍name: firecrawl
description: Specialized skill for crawling and scraping websites to convert them to LLM-ready clean markdown or structured data using Firecrawl API and CLI.
---

# Firecrawl Web Scraping & Crawling Skill

When the user asks to crawl, scrape, extract, or parse web pages into markdown or structured JSON using Firecrawl, follow these instructions exactly:

1. **Verify Firecrawl Credentials**
   * Check for a `FIRECRAWL_API_KEY` in the local `.env` or `.env.local` files.
   * If missing and the user wants to use the hosted Firecrawl service, prompt the user for their Firecrawl API key or instruct them on how to get one from firecrawl.dev.
   * If the user wants to run it locally or self-hosted, help them configure the self-hosted Docker container environment.

2. **Scaffold Firecrawl Client Utility**
   * Create a clean utility file (e.g. `src/utils/scrape.ts` or `src/utils/scrape.js`).
   * Bootstrap the client using the official `@mendable/firecrawl-js` library (or equivalent HTTP request wrappers if Node.js is not used).
   * Implement functions for:
     * `scrapeUrl(url, formats)`: Converts a single page to markdown or HTML.
     * `crawlUrl(url, limit, allowBackwardCrawling)`: Initiates a deep crawl of sub-urls.
     * `extractStructuredData(url, schema)`: Scrapes a page and coerces it into a structured schema using LLM extraction.

3. **CLI Integration**
   * If the user wants to use the Firecrawl CLI, bootstrap local commands using:
     `npx firecrawl <command>` (e.g. `npx firecrawl scrape https://example.com`).

4. **Robust Error Handling**
   * Enforce elegant error handling, handling rate limits (HTTP 429) gracefully, and logging clear details.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
