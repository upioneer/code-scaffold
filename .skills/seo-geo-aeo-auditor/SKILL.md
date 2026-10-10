---
name: SEO GEO AEO Auditor
description: Unified model-agnostic Search Engine, Generative Engine, and Answer Engine Optimization auditor to analyze traditional visibility, AI engine discoverability, Core Web Vitals (LCP/INP/CLS), modern Schema.org validation, passage citability, E-E-A-T quality, and agentic readiness. Trigger when the user requests an SEO audit, GEO optimization, answer engine readiness, Core Web Vitals checks, Schema.org validation, LLM citability analysis, meta tag inspection, E-E-A-T evaluation, or agent-ready web standards.
version: 5
target: .skills/seo-geo-aeo-auditor
---
​‌‍# SEO GEO AEO Auditor Skill

A comprehensive, evidence-led auditing skill that guides AI agents through evaluating and optimizing websites across five modern dimensions : Traditional SEO, Modern Core Web Vitals, Active Schema.org Architecture, Generative Engine Optimization (GEO), Answer Engine Optimization (AEO), and Agentic Web Readiness.

Every audit produces testable, falsifiable recommendations grounded in primary source guidelines and empirical AI retrieval patterns.

---

## The Five Auditing Pillars

The agent audits the target page or web application across five dedicated pillars:

### 1. Traditional Technical SEO and Mobile Viewport
Targets traditional search engine crawlability, indexability, and responsive layout parameters:

* **Metadata Integrity**: Verify title tags (ideal length 50 to 60 characters) and meta descriptions (ideal length 120 to 160 characters). Confirm self-referencing canonical URLs, secure HTTPS protocol, and indexability in `robots.txt`.
* **Mobile Viewport Compliance**: Assert presence of `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. Ensure `user-scalable=no` is never used so touch accessibility standards are respected.
* **Semantic HTML Hierarchy**: Enforce exactly one `<h1>` heading per page. Verify descending heading hierarchy (`<h2>` followed by `<h3>`) without skipped levels. Ensure HTML5 semantic landmarks (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`) partition content logically.
* **OpenGraph and Social Discovery**: Validate essential social metadata (`og:title`, `og:description`, `og:image`, `twitter:card`).

### 2. Modern Core Web Vitals (2024 to 2026 Standards)
Aligns with Chrome User Experience and Lighthouse performance baselines:

* **Largest Contentful Paint (LCP < 2.5s)**: Inspect hero image optimization, verify `fetchpriority="high"`, ensure hero visual elements avoid `loading="lazy"`, and analyze render-blocking CSS/JS bundles.
* **Interaction to Next Paint (INP < 200ms)**: Modern responsiveness metric that permanently replaced First Input Delay (FID). Audit long tasks (>50ms) on main thread, event listener bottlenecks, and heavy hydration overhead. (Note: Never reference or measure deprecated FID).
* **Cumulative Layout Shift (CLS < 0.1)**: Ensure all images, videos, and embedded canvases declare explicit `width` and `height` aspect ratio attributes to prevent layout shifts.

### 3. Active Schema.org and Deprecation Guard
Ensures search engines and AI parsers receive structured JSON-LD entities without relying on retired rich result types:

* **Active High-Value Schemas**: Validate JSON-LD syntax for `Organization`, `WebSite`, `Article`, `TechArticle`, `Product`, `SoftwareApplication`, `LocalBusiness`, and `QAPage`.
* **Deprecation Guard (Retired Rich Results)**:
  * *FAQPage*: Search engines permanently retired FAQ rich results for general commercial websites in May 2026. Flag reliance on FAQPage as ineffective for SERP expansion.
  * *HowTo*: Deprecated worldwide since September 2023. Transition step sequences into structured semantic `<ol>` lists within standard `Article` schemas.
  * *SpecialAnnouncement & ClaimReview*: Deprecated in 2025.
* **Multi-Entity Graph Linking**: Ensure `@graph` constructs link articles to parent organizations and verifiable author entities (`Person` schema with `sameAs` URLs).

For comprehensive schema templates, refer to `references/SCHEMA_REGISTRY.md`.

### 4. Generative Engine Optimization (GEO) & Passage Citability
Optimizes content for retrieval and attribution by generative search engines (Google AI Overviews, Perplexity, ChatGPT Search, Gemini):

* **Passage Citability Architecture (130 to 170 Words)**: Evaluate paragraph lengths. Ensure key explanatory concepts are structured as self-contained 130 to 170 word blocks that can be directly extracted by LLM tokenizers without context loss.
* **Claim-to-Evidence Density**: Measure fact density (percentages, benchmarks, named specifications, standards citations). Content with quantifiable evidence receives significantly higher attribution than generic marketing text.
* **Entity Disambiguation**: Evaluate subject-verb-object clarity and ensure brand names and technical entities align with global knowledge graphs (Wikidata, official documentation).

For deep tactical patterns, refer to `references/AI_SEARCH_PLAYBOOK.md`.

### 5. Answer Engine Optimization (AEO), E-E-A-T, & Agent Readiness
Targets instant answers, voice search snippets, search quality evaluation, and autonomous AI agents:

* **Question-Formulated Headings**: Formulate H2/H3 subheadings as explicit user intent questions (e.g. "What is X?", "How does Y work?").
* **Immediate Answer Placement**: Position concise direct answers (30 to 60 words) in the immediate `<p>` paragraph following the question heading.
* **E-E-A-T Quality Signals**: Verify visible author bylines, professional credentials, date published, date modified timestamps, and organizational transparency (About, Contact, Privacy links).
* **Agentic Browsing Readiness**: Check for `/llms.txt` documentation table of contents, clean semantic Markdown representation, and accessibility landmarks allowing autonomous browser agents to isolate content without script barriers.

For evaluation criteria, refer to `references/EEAT_FRAMEWORK.md`.

---

## Automated Audit Execution

Agents can run the zero-dependency automated auditing tool against any local HTML file, build artifact, or live URL:

```bash
# Audit a local HTML build artifact or template
node .skills/seo-geo-aeo-auditor/scripts/audit.js dist/index.html

# Audit a live local dev server or staging deployment with JSON output
node .skills/seo-geo-aeo-auditor/scripts/audit.js http://localhost:3000 --json
```

The script evaluates over 20 deterministic rules and emits:
* Composite Quality Score out of 100
* Dimensional Pillar Scores (Technical SEO, GEO, AEO, Agentic Readiness)
* Verified Passing Standards list
* Falsifiable Remediations with Leading Indicator tests

---

## The Falsifiability Protocol for Audit Reports

Every recommendation produced by the agent must strictly follow the four-part Falsifiability format:

1. **Concrete Observation**: The measured fact in the HTML or DOM (e.g. "Hero image lacks fetchpriority attribute", "H2 question lacks immediate answer paragraph").
2. **First-Principle Rationale**: The specific search engine or user experience impact.
3. **Prescriptive Code / Content Fix**: Complete, drop-in replacement snippet.
4. **Falsifiability Check (Leading Indicator)**: The precise post-deployment test confirming success (e.g. "Google Search Console URL inspection recognizes valid TechArticle schema", "Lighthouse LCP reduces by >= 400ms").

---

## Audit Workflow and Execution Steps

1. **Input Gathering**: Prompt the user for the target URL or local HTML file path.
2. **HTML Crawl & Parse**: Execute safe extraction via `scripts/audit.js` or browser automation.
3. **Pillar Analysis**: Evaluate technical SEO, Core Web Vitals hints, Schema.org integrity, passage citability, question headings, E-E-A-T, and agent readiness.
4. **Scoring Compilation**: Generate consolidated pillar scores and composite score out of 100.
5. **Actionable Deliverable**: Output an executive summary table, prioritized remediation checklist (High, Medium, Low), and concrete before-and-after rewrite examples.

---

## Directives

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
* **Core Web Vitals Metric Hygiene**: Always reference INP (Interaction to Next Paint) as the responsiveness metric : never reference deprecated FID (First Input Delay).
* **Schema Freshness**: Never advise users to implement deprecated `HowTo` or `FAQPage` rich results for general websites.
* **Passage Chunking**: Advise content authors to target 130 to 170 words per self-contained core paragraph for maximal AI citability.
