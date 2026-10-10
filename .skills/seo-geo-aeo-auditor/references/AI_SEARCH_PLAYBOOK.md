# Code Scaffold AI Search and Generative Optimization Playbook

This document defines the operational architecture for Generative Engine Optimization (GEO), Answer Engine Optimization (AEO), and Agentic Readiness across AI search engines, multi-modal assistants, and LLM synthesizers.

---

## 1. The Mechanics of AI Citability

Generative AI search engines (such as Google AI Overviews, Perplexity, ChatGPT Search, and Gemini) do not read websites like traditional indexers. They tokenize text blocks, resolve named entities against knowledge bases, and extract self-contained informational passages to synthesize direct answers.

### High-Citability Passage Architecture

To maximize the probability that an LLM extracts and attributes your content:

* **Passage Length Target (130 to 170 Words):**
  * Research across modern AI synthesizers reveals that self-contained text blocks between 130 and 170 words possess the highest extractability coefficient.
  * Avoid 400-word undivided walls of prose, which dilute factual density.
  * Avoid 20-word fragmented bullet points without grammatical context.
* **Direct Claim to Evidence Pattern:**
  * Start each section with an explicit, authoritative factual statement.
  * Immediately follow with quantifiable evidence : metrics, benchmark results, percentages, or named standards.
  * Conclude with the practical operational implication.
* **Attribution Density:**
  * High-scoring passages feature at least one specific citation, standard reference (e.g. ISO, W3C, RFC), or primary-source benchmark every 150 words.
  * AI synthesizers prioritize passages with verifiable attribution over generic marketing claims.

---

## 2. Heading Hierarchies and Question Formulation

* **Intent Questions in Subheadings:**
  * Structure major H2 and H3 headings as explicit natural language questions (e.g. "How does the SIMP algorithm optimize structural stiffness?", "What are the latency thresholds for Core Web Vitals?").
* **Immediate Paragraph Answers:**
  * Place the definitive answer in the immediate `<p>` paragraph following the heading.
  * Never insert a promotional banner, generic introductory fluff, or an unrelated image between the question heading and its answer paragraph.

---

## 3. Agent Readiness and Agentic Browsing

Autonomous AI agents and browser copilots increasingly browse web applications to gather data and execute actions on behalf of users.

### The Agentic Web Standards Matrix

* **The `llms.txt` Specification:**
  * Host a plain text `/llms.txt` file at the root of your domain.
  * Provide a concise Markdown table of contents detailing available endpoints, technical docs, and API documentation for LLMs.
* **Semantic Markdown Negotiation:**
  * Provide clean, clean semantic markup that can be parsed as Markdown without heavy client-side JavaScript execution hurdles.
* **Robots Directives for AI Agents:**
  * Verify that `robots.txt` does not inadvertently block search indexers or legitimate AI user agents while safeguarding private backend endpoints.
* **Clean DOM Hierarchy:**
  * Use standard HTML5 `<article>`, `<main>`, `<header>`, and `<section>` landmarks to allow agent accessibility trees to isolate primary content from navigation boilerplate.

---

## 4. Evidence-Led Recommendations and Falsifiability

Every optimization proposed by the agent must adhere to the **Falsifiability Protocol**:

1. **Concrete Observation:** Cite the exact DOM element, missing header, or telemetry measurement.
2. **First-Principle Rationale:** Explain why the issue harms crawlability, user experience, or AI citability.
3. **Prescriptive Action:** Provide drop-in HTML, schema, or server configuration fixes.
4. **Falsifiability Check (Leading Indicator):** Define the exact post-deployment test that verifies resolution (e.g. "Inspect URL via search console returns valid schema", "Lighthouse Interaction to Next Paint drops below 150ms").
