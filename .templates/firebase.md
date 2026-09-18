---
description: Firebase Project Setup and Hosting Specification
---

# Firebase Project Configuration

Firebase project identification, hosting site mappings, and client/admin SDK credentials are managed strictly through the project's root `.env` file (referencing `.env.example`). Never commit project identifiers, API keys, or service account secrets into this or any version-tracked document.

## Required Environment Variables

All Firebase configuration parameters must be defined inside `.env`:

* `FIREBASE_PROJECT_ID`: Primary Firebase / Google Cloud Project ID (determines `<project-id>.web.app`)
* `FIREBASE_SITE_ID`: Hosting site ID (defaults to `FIREBASE_PROJECT_ID` if unset)
* `NEXT_PUBLIC_FIREBASE_API_KEY`: Client Web SDK API key
* `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Auth domain (`<project-id>.firebaseapp.com`)
* `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Default Cloud Storage bucket
* `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Cloud Messaging sender ID
* `NEXT_PUBLIC_FIREBASE_APP_ID`: Registered Web App ID
* `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Google Analytics measurement ID (optional)

Consult `.env.example` for the complete Firebase configuration template.

## Agent Autonomous Setup & Provisioning Instructions

When an AI agent encounters this file during scaffolding or deployment:

### 1. Active Configuration Check
Inspect `.env` for the presence of `FIREBASE_PROJECT_ID`. If it is already populated with an active, non-placeholder project identifier, proceed directly to build and deployment.

### 2. Autonomous Project Provisioning & Clean Name Protocol
If `FIREBASE_PROJECT_ID` is unset or set to placeholder values, do not force the user to open a browser:
* **Verify Authentication**: Execute `npx -y firebase-tools@latest projects:list` to verify local CLI authentication. If unauthenticated, prompt the user to execute `npx -y firebase-tools@latest login`.
* **Clean Name Proactive Proposal**: Propose a clean, semantic candidate Project ID derived from the project directory name (lowercase alphanumeric characters with hyphens, 6 to 30 characters). Explain to the user that the Project ID directly dictates their public hosting URL (`https://<project-id>.web.app`).
* **User Name Influence**: Prompt the user to either:
  * Accept the proposed clean Project ID.
  * Specify their preferred custom clean Project ID.
  * Select an existing project from their authenticated account.
* **Global Collision Handling**: If the requested clean Project ID is already registered globally on Google Cloud, report the conflict gracefully and request a preferred semantic variation (for example appending `-app` or `-web`) rather than generating unreadable random hex.
* **Automated Provisioning Execution**: Execute the bundled `.skills/firebase/scripts/provision-firebase-project.ps1` (or `.sh`), or leverage native MCP server tools (`firebase_create_project` followed by `firebase_create_app` and `firebase_get_sdk_config`).
* **Environment Synchronization**:
  * Automatically inject the retrieved credentials directly into `.env` (referencing `.env.example`).
  * Write the `.firebaserc` file mapping the `default` project context.
  * Ensure `firebase.json` specifies the correct public build directory (`out` or `dist`).

### 3. Application Build and Deployment Routine
1. Verify `firebase.json` matches project framework conventions (e.g., Next.js static export or Vite SPA).
2. Execute the application build script (`npm run build`).
3. Deploy to production via `npx -y firebase-tools@latest deploy --only hosting`.
4. Validate live URLs and log deployment completion status.
