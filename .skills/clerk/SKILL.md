name: clerk_authentication
description: Skill for implementing and managing Clerk Auth boundaries and Next.js App Router security layers.

# Clerk Authentication Perimeter

This skill enforces edge compatible identity boundaries across layout structures and API routes using Clerk.

## Directives for Integration

* Ensure that all private paths are intercepted by the global middleware wrapper.
* Avoid exposing raw credentials or private keys within the client environment.
* Validate that Server Actions and Route Handlers leverage server side authentication checks.

## Implementation Steps

* Verify that Clerk publishable and secret keys are present in the env file.
* Confirm that ClerkProvider wraps the root layout file.
* Implement a global middleware interceptor using clerkMiddleware to wrap private application boundaries.
* Secure Server Actions and Route Handlers utilizing auth to extract server side tokens.
* Gracefully halt unauthenticated access attempts at the boundary entry points.
