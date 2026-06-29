# Firecrawl Scraper

**Version:** 2
**Target:** `.skills/firecrawl`

## Description
Crawl and scrape websites to clean markdown or structured data with Firecrawl API & CLI

## Capabilities & Use Cases
* Scrapes, crawls, and extracts web pages into LLM-ready clean markdown or structured JSON schemas via the Firecrawl API and CLI.
* Identifies, manages, and validates `FIRECRAWL_API_KEY` configurations within local `.env` boundaries.
* Facilitates seamless onboarding for both hosted Firecrawl services and self-hosted Docker container environments.
* Scaffolds localized Firecrawl client utilities using `@mendable/firecrawl-js` or native HTTP wrappers.
* Implements discrete functions for URL scraping, deep sub-URL crawling, and LLM-coerced structured schema extractions.
* Bootstraps local CLI tooling via `npx firecrawl <command>` for rapid data acquisition.
* Enforces elegant error handling, gracefully managing HTTP 429 rate limits, and implementing strict application logging.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Add Firecrawl skill and implement smart Playwright QoL / screenshot integration (v3.4.0)
