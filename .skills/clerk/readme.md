# Clerk Authentication Perimeter

**Version:** 2
**Target:** `.skills/clerk`

## Description
Authentication perimeter and identity management using Clerk.

## Capabilities & Use Cases
* Implements robust authentication perimeters and identity management layers using Clerk.
* Enforces edge-compatible security boundaries across Next.js App Router layouts and API routes.
* Strategically intercepts private application paths via global middleware wrappers.
* Validates Server Actions and Route Handlers by extracting server-side tokens safely.
* Secures the client environment by systematically avoiding raw credential or private key exposure.
* Confirms correct integrations of ClerkProvider across root layouts.
* Verifies publishable and secret keys are correctly injected via environment variables.
* Gracefully halts unauthenticated access attempts at boundary entry points to prevent data leaks.

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v2** : Expanded capability descriptions
* **v1** : Introduce Clerk Auth, Upstash Redis, and Vercel Deployment skills and templates v3.7.0
