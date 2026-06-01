# SEO GEO AEO Auditor Skill

This skill implements a model-agnostic Search Engine, Generative Engine, and Answer Engine Optimization auditor. It enables AI agents to evaluate websites for traditional search performance (SEO), AI generative engine visibility (GEO), and direct response/voice-assisted search compatibility (AEO).

## Why This Skill Matters

Modern search visibility has expanded beyond traditional ranking pages. Users now extract answers directly from LLM search engines and interactive snippets. This skill addresses all three modern visibility dimensions in a single unified auditing pipeline:

* **Search Engine Optimization (SEO)**: Traditional rank optimization targeting Google, Bing, and other standard search crawlers.
* **Generative Engine Optimization (GEO)**: AI-discoverability audits designed to optimize content for Perplexity, ChatGPT Search, Gemini, and Google AI Overviews by reinforcing authority networks (E-E-A-T), semantic clarity, factual density, and primary citations.
* **Answer Engine Optimization (AEO)**: Voice-search and featured snippet optimizations utilizing FAQ schema blocks, conversational question patterns, and direct paragraph answer formats.

## Skill Folder Structure

* [meta.json](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/seo-geo-aeo-auditor/meta.json): Declares package metadata, description, and semantic version.
* [SKILL.md](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/seo-geo-aeo-auditor/SKILL.md): The detailed instruction manual guiding the AI agent through executing the triple-pillar audits.

## Inputs and Parameters

When executing an audit, the agent requires the following inputs:

* `TARGET_URL`: The destination URL to be scanned and audited.
* `AUDIT_DEPTH`: The level of the audit:
  * `Quick`: High-level scans returning top issues, score cards, and basic HTML formatting audits.
  * `Full`: In-depth analysis scanning all metadata, performance indexes, full schema trees, entity clarity networks, E-E-A-T signals, and direct answer formatting, accompanied by concrete rewrite recommendations.
