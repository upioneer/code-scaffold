# Upstash Redis Management

**Version:** 4

**Target:** `.skills/upstash`

**Category:** Data, Databases & Storage

**Keywords:** `upstash`, `serverless-redis`, `rate-limiting`, `edge-caching`, `qstash`, `vector-db`, `redis`, `upstash-redis`, `rate-limiter`, `serverless-cache`, `upstash-vector`, `message-queue`, `edge-runtime`, `session-storage`, `ratelimit-sdk`

## Description
Serverless Redis management and rate limiting using Upstash.

## Capabilities & Use Cases
* Initializes serverless, connectionless Redis clients utilizing standard environment variables
* Enforces strict sliding window algorithms to control traffic flow and rate limits at the edge
* Avoids TCP connection exhaustion by utilizing connectionless REST endpoints
* Constructs API rate limiting wrapper utilities to execute programmatic access policies (e.g., against IPs or user identifiers)
* Orchestrates asynchronous tracking of analytical promises using `waitUntil` to prevent response blocking on Vercel Edge compute instances

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v4** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v3** : Standardized ASCII art logo to uniform 6-line ANSI Shadow format.
* **v2** : Expanded capability descriptions
* **v1** : Introduce Clerk Auth, Upstash Redis, and Vercel Deployment skills and templates v3.7.0
