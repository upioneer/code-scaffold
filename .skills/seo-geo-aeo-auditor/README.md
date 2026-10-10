# SEO GEO AEO Auditor

**Version:** 5

**Target:** `.skills/seo-geo-aeo-auditor`

**Category:** Web Automation & Scraping

**Keywords:** `seo`, `geo`, `aeo`, `schema-org`, `json-ld`, `generative-engine`, `answer-engine`, `mobile-viewport`, `core-web-vitals`, `inp`, `lcp`, `cls`, `passage-citability`, `eeat`, `llms-txt`, `agentic-browsing`

## Description
Unified model agnostic Search Engine, Generative Engine, and Answer Engine Optimization auditor to analyze traditional visibility, modern Core Web Vitals (LCP/INP/CLS), active Schema.org validation, passage citability, E-E-A-T search authority, and agentic web readiness.

## Capabilities & Use Cases
* **Traditional SEO Auditing**: Performs deep technical sweeps for metadata integrity, semantic HTML structure (H1 to H6, `<nav>`, `<article>`), indexability directives (robots.txt, HTTPS, canonicals), and OpenGraph metadata.
* **Modern Core Web Vitals**: Audits performance baselines under modern standards including Interaction to Next Paint (INP < 200ms replacing deprecated FID), Largest Contentful Paint (LCP < 2.5s with hero preloading), and Cumulative Layout Shift (CLS < 0.1 with explicit dimensional attributes).
* **Active Schema.org Architecture & Deprecation Guard**: Validates modern multi-entity JSON-LD graphs (`Organization`, `TechArticle`, `SoftwareApplication`, `LocalBusiness`) while strictly guarding against deprecated rich result types such as retired `FAQPage` and `HowTo` schemas.
* **Mobile Viewport & Touch Optimization**: Validates `<meta name="viewport">` scaling attributes, ensures absence of user scaling blockers (`user-scalable=no`), and verifies that interactive touch targets meet the 48 by 48 pixel standard.
* **Generative Engine Optimization (GEO) & Passage Citability**: Evaluates text blocks against the empirical 130 to 170 word sweet spot for AI tokenizers, measures claim to evidence density with quantifiable benchmarks, and ensures entity disambiguation against global knowledge graphs.
* **Answer Engine Optimization (AEO)**: Optimizes structures for instant voice search and AI direct answers by enforcing question-formulated headings (H2/H3) paired with immediate 30 to 60 word answer paragraphs.
* **E-E-A-T Quality & Agentic Web Readiness**: Audits Experience, Expertise, Authoritativeness, and Trustworthiness signals via the Who, How, and Why heuristic, while verifying `/llms.txt` table of contents and accessibility landmarks for autonomous browser agents.
* **Automated CLI Runner (`scripts/audit.js`)**: Provides a zero-dependency Node.js auditing utility evaluating local HTML artifacts or live URLs, emitting composite scores, pillar breakdowns out of 100, verified passes, and falsifiable remediations with leading indicator tests.
* **The Falsifiability Protocol**: Generates structured, prioritized checklists separating immediate technical roadblocks (High Priority) from discoverability enhancements (Medium Priority) and long-term authority (Low Priority), each backed by a leading indicator test.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v5** : Upgraded to SkillForge v5 with modern Core Web Vitals (INP/LCP/CLS), active Schema.org deprecation guard, passage citability scoring (130 to 170 words), E-E-A-T quality framework, and agentic web readiness.
* **v4** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v3** : Added automated zero-dependency Node.js CLI auditor (`scripts/audit.js`) with mobile viewport compliance and touch-target validation.
* **v2** : Expanded capability descriptions
* **v1** : Add SEO GEO AEO Auditor and Website Deploy Linux skills
