# SEO GEO AEO Auditor

**Version:** 3
**Target:** `.skills/seo-geo-aeo-auditor`
**Category:** Web Automation & Scraping
**Keywords:** `seo`, `geo`, `aeo`, `schema-org`, `json-ld`, `generative-engine`, `answer-engine`, `mobile-viewport`

## Description
Unified model agnostic Search Engine, Generative Engine, and Answer Engine Optimization auditor to analyze traditional visibility, AI engine discoverability, and snippet answers.

## Capabilities & Use Cases
* **Traditional SEO Auditing**: Performs deep technical sweeps for metadata integrity, semantic HTML structure (H1 to H6, `<nav>`, `<article>`), Core Web Vitals, and standard indexability directives (robots.txt, HTTPS, canonicals).
* **Mobile Viewport & Touch Optimization**: Validates `<meta name="viewport">` scaling attributes, ensures absence of user scaling blockers, and verifies that interactive touch targets meet the 48 by 48 pixel standard.
* **Generative Engine Optimization (GEO)**: Analyzes content for discoverability within AI LLMs (Perplexity, Google AI Overviews) by evaluating E-E-A-T signals, entity clarity via subject-verb-object syntax, factual density, and authoritative outbound citations.
* **Answer Engine Optimization (AEO)**: Optimizes structures for voice search and featured snippets by enforcing direct answer paragraph formatting, question-phrased headers, and rigorous FAQ/HowTo JSON-LD schema implementations.
* **Automated CLI Runner**: Provides a zero-dependency Node.js auditing utility in `scripts/audit.js` that evaluates local HTML artifacts or live URLs and emits machine-readable JSON and formatted terminal reports.
* **Automated Scoring Matrices**: Calculates discrete performance scores out of 100 for each of the three dimensions based on weighted technical rulesets (e.g. semantic mapping, metadata compliance, schema validation).
* **Actionable Reporting Workflows**: Generates structured, prioritized checklists separating immediate technical roadblocks (High Priority) from discoverability enhancements (Medium Priority) and long-term strategy (Low Priority).

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Added automated zero-dependency Node.js CLI auditor (`scripts/audit.js`) with mobile viewport compliance and touch-target validation.
* **v2** : Expanded capability descriptions
* **v1** : Add SEO GEO AEO Auditor and Website Deploy Linux skills
