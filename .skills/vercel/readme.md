# Vercel Deployment Routine

**Version:** 2
**Target:** `.skills/vercel`
**Category:** DevOps & Infrastructure
**Keywords:** `vercel`, `edge-deployments`, `nextjs-hosting`, `serverless-functions`, `domain-management`

## Description
Configuration and deployment routines for Vercel hosting.

## Capabilities & Use Cases
* **Optimization Matrix Integration:** Validates build configurations conform to the `vercel.json` serverless execution matrices
* **Edge Deployment Orchestration:** Coordinates builds and deployments globally across Vercel edge nodes via the CLI tool set
* **Security & Scope Enforcement:** Enforces strict caching boundaries and injects robust security headers for protected API scopes
* **Preflight Diagnostics:** Validates Vercel specific configuration presence (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `vercel.json`) prior to runtime execution
* **Dynamic Routing:** Manages execution routing rules and proactively asserts live deployment URL success statuses

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Introduce Clerk Auth, Upstash Redis, and Vercel Deployment skills and templates v3.7.0
