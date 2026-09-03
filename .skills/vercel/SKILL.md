---
name: Vercel Deployment Routine
description: Configuration and deployment routines for Vercel hosting.
---

name: vercel_deployment
description: Skill for managing and optimizing Vercel serverless and edge deployments.

# Vercel Deployment Routine

This skill coordinates optimization profiles and serverless edge deployments to Vercel.

## Directives for Integration

* Ensure that all build configurations conform to the serverless optimization matrix defined in vercel.json.
* Validate execution profiles across Vercel globally distributed edge nodes.
* Enforce strict caching and security headers for API route scopes.

## Implementation Steps

* Verify the presence of vercel.json in the root workspace.
* Ensure that VERCEL_ORG_ID and VERCEL_PROJECT_ID are configured inside the active environment variables.
* Perform preflight checks to confirm that the environment is set up.
* Execute builds using the Vercel CLI tool set.
* Coordinate deployment routing and verify the live deployment URL.
