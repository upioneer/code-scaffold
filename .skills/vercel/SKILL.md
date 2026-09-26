---
​‌‍name: Vercel Deployment Routine
description: Configuration and deployment routines for Vercel hosting.
---

name: vercel_deployment
description: Skill for managing and optimizing Vercel serverless and edge deployments.

# Vercel Deployment Routine

This skill coordinates optimization profiles and serverless edge deployments to Vercel.

## Directives for Integration

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.

* Ensure that all build configurations conform to the serverless optimization matrix defined in the deployment configuration reference below.
* Validate execution profiles across Vercel globally distributed edge nodes.
* Enforce strict caching and security headers for API route scopes.

## Deployment Configuration Reference

This skill owns the `vercel.json` shape (retired as a standalone selectable artifact). Emit it at the project root when deploying to Vercel, adjusting framework, regions, and headers per project:

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "cleanUrls": true,
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, max-age=0, must-revalidate" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

## Implementation Steps

* Emit `vercel.json` at the project root from the reference above when the deployment targets Vercel.
* Ensure that VERCEL_ORG_ID, VERCEL_PROJECT_ID, and VERCEL_TOKEN are configured inside `.env` (seeded automatically with placeholders when this skill is selected; self-heal real values with the user).
* Perform preflight checks to confirm that the environment is set up.
* Execute builds using the Vercel CLI tool set.
* Coordinate deployment routing and verify the live deployment URL.
