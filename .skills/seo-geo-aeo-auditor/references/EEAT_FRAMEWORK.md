# Code Scaffold E-E-A-T Quality and Search Authority Framework

This document outlines the objective evaluation methodology for Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T) based on modern search quality rater standards.

---

## 1. The Four Pillars of E-E-A-T

### Pillar 1: Trustworthiness (The Core Foundation)
Trustworthiness is the most heavily weighted of the four pillars. A site cannot achieve high authority without demonstrating transparent, verifiable trust signals:
* **Security & Protocol:** Secure HTTPS protocol across all endpoints, strict Content Security Policies, and valid SSL/TLS certificates.
* **Organizational Transparency:** Clear corporate contact details, physical address, customer support channels, and legal policies (Terms of Service, Privacy Policy).
* **Editorial Accountability:** Explicit editorial review standards, author bios with verifiable credentials, date published stamps, and documented change history for revised articles.

### Pillar 2: Experience (First-Hand Practical Knowledge)
Experience verifies that the creator possesses real-world engagement with the subject matter:
* **Original Research & Data:** Inclusion of proprietary benchmark results, unique case studies, and original experiment data.
* **Authentic Media:** First-party technical diagrams, product screenshots, or setup captures rather than generic stock imagery.
* **Authentic Technical Feedback:** Realistic discussions of edge cases, trade-offs, and failure points rather than uncritical promotional endorsements.

### Pillar 3: Expertise (Demonstrated Subject Mastery)
Expertise evaluates formal domain knowledge and depth:
* **Author Credentials:** Explicit author bylines detailing professional background, engineering degrees, industry certifications, and years of domain practice.
* **Topical Comprehensiveness:** Exhaustive coverage answering primary user intent queries without leaving critical technical gaps.
* **Structured Author Entities:** Person schema in JSON-LD linking author names to external verifiable profiles (e.g. GitHub, LinkedIn, ORCID, Wikidata).

### Pillar 4: Authoritativeness (Reputational Standing)
Authoritativeness measures how the broader industry and search ecosystem perceive the brand or creator:
* **Citations & Backlinks:** Editorial citations from reputable industry portals, academic publications, and official open-source ecosystems.
* **Entity Disambiguation:** Clear inclusion within Google Knowledge Graph, Wikidata, and domain-specific knowledge indexes.
* **Brand Mentions:** Unlinked brand mentions and discussions across authoritative developer communities and forums.

---

## 2. The Who, How, and Why Evaluation Heuristic

Before grading individual technical parameters, apply the core editorial heuristic:

* **Who created this content?**
  * Is authorship clearly declared on the page?
  * Can the reader verify that the author has the qualifications to write on this topic?
* **How was this content created?**
  * Was the piece synthesized through hands-on testing and architectural experimentation?
  * If automated tools or AI assistance were leveraged, is their usage transparently disclosed alongside rigorous human editorial verification?
* **Why was this content created?**
  * Does the content exist primarily to solve a real human problem, answer a technical question, and provide genuine utility?
  * Content created solely to manipulate search rankings without delivering new value fails the Helpful Content standard.
