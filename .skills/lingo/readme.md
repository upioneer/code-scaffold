# Lingo

**Version:** 4
**Target:** `.skills/lingo`
**Category:** Publishing & Documentation
**Keywords:** `lingo`, `localization`, `i18n`, `translation`, `multilingual`, `po-editor`, `l10n`

## Description
Deterministic shorthand glossary that maps user lingo, acronyms, and abbreviations to their full meanings for faster, unambiguous communication.

## Capabilities & Use Cases
* Provides an extensive, categorized glossary spanning 250+ shorthand terms across nine domains: Conversational, Technical, Platforms & Services, Infrastructure & Enterprise, Architecture & Design Patterns, Security, Data/AI/Analytics, Code Review & Workflow, and Project Specific.
* Silently decodes user abbreviations in real time without echoing expansions back, preserving natural conversational flow.
* Applies multi-layered context-aware ambiguity resolution rules that differentiate between technical, conversational, platform, and project contexts to select the correct expansion.
* Supports composable decoding, allowing users to chain multiple abbreviations in a single message (e.g., "check the pr deps rn on gh") with each term resolved independently.
* Features **Bidirectional Mode**: The agent prompts the user to apply shorthand to its own outputs, aggressively reducing token usage and speeding up delivery.
* Honors session-level user-defined abbreviations, enabling users to teach the agent new shorthand on the fly.
* Reduces user token count and typing effort by 30-60% for power users who leverage shorthand heavily.
* Covers platform-specific abbreviations for major cloud providers and services (AWS, GCP, Azure, Cloudflare, Firebase, GitHub, Supabase, DigitalOcean, and more).
* Maps enterprise and infrastructure jargon including SLA/SLO/SLI, RTO/RPO, MTTR/MTTF/MTBF, and AWS service acronyms (EC2, S3, ECS, EKS, RDS, SQS, SNS).
* Decodes architecture and design pattern abbreviations (CQRS, DDD, TDD, BDD, SOLID, DRY, KISS, YAGNI, BFF, CRUD, REST, gRPC, GraphQL).
* Covers security terminology (OWASP, CORS, CSRF, XSS, RBAC, ABAC, JWT, OAuth, SSO, MFA, SOC2, GDPR, PII).
* Includes AI/ML domain shorthand (LLM, RAG, RLHF, NLP, fine tuning, GPU, TPU).
* Covers domain-specific Code Scaffold project terminology (`cs`, `sc`, `tui`) for seamless internal communication.
* Handles case-insensitive matching so users never need to worry about capitalization.
* Explicitly scoped with non-goals: does not auto-correct typos, does not translate between natural languages, and does not guess at unlisted abbreviations.

## Usage
This skill is passively loaded into the agent's context. Once active, the agent automatically decodes any recognized shorthand in user messages without requiring explicit invocation. Users simply type naturally using their preferred abbreviations.

## Changelog
* **v4** : Introduced Bidirectional Mode. The agent now actively prompts the user to apply the glossary to its own outputs, aggressively reducing token generation and speeding up delivery.
* **v3** : Gen-Z slang expansion (added no cap, rizz, yolo, full send, crash out, bussin, sus, mid, drip, tea, slaps, salty, ghost).
* **v2** : Massive expansion from 120 to 250+ terms. Added user-requested terms (`gh`, `fb`, `enviro`, `dc`, `coe`) and five new glossary categories: Platforms & Services, Infrastructure & Enterprise, Architecture & Design Patterns, Security, and Data/AI/Analytics. Enhanced ambiguity resolution with platform context rules.
* **v1** : Initial release with 120+ glossary terms across four categories (Conversational, Technical, Code Review, Project Specific), context-aware ambiguity resolution, session-level user extensibility, and strict non-goal boundaries.
