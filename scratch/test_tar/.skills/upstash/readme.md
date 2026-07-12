# Upstash Redis Management

**Version:** 2
**Target:** `.skills/upstash`

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
* **v2** : Expanded capability descriptions
* **v1** : Introduce Clerk Auth, Upstash Redis, and Vercel Deployment skills and templates v3.7.0
