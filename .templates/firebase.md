---
description: Firebase Project Setup Template
---

# Firebase Project Configuration

## Project Details
* **Project ID:** [YOUR_PROJECT_ID]
* **Hosting Site ID:** (Defaults to Project ID if there is only one site)
* **Default Hosting URL:** https://[YOUR_PROJECT_ID].web.app
* **Secondary Hosting URL:** https://[YOUR_PROJECT_ID].firebaseapp.com
* **Region:** us-central1

## Agent Autonomous Setup & Provisioning Instructions
When an AI agent encounters this file during scaffolding or deployment:

### 1. Active Configuration Check
Inspect the `Project ID` field above. If it is already populated with an active, non-placeholder project identifier, proceed directly to build and deployment.

### 2. Autonomous Project Provisioning & Clean Name Protocol
If `Project ID` is set to `[YOUR_PROJECT_ID]` or unconfigured, do not force the user to open a browser:
* **Verify Authentication**: Execute `npx -y firebase-tools@latest projects:list` to verify local CLI authentication. If unauthenticated, prompt the user to execute `npx -y firebase-tools@latest login`.
* **Clean Name Proactive Proposal**: Propose a clean, semantic candidate Project ID derived from the project directory name (lowercase alphanumeric characters with hyphens, 6 to 30 characters). Explain to the user that the Project ID directly dictates their public hosting URL (`https://<project-id>.web.app`).
* **User Name Influence**: Prompt the user to either:
  * Accept the proposed clean Project ID.
  * Specify their preferred custom clean Project ID.
  * Select an existing project from their authenticated account.
* **Global Collision Handling**: If the requested clean Project ID is already registered globally on Google Cloud, report the conflict gracefully and request a preferred semantic variation (for example appending `-app` or `-web`) rather than generating unreadable random hex.
* **Automated Provisioning Execution**: Execute the bundled `.skills/firebase/scripts/provision-firebase-project.ps1` (or `.sh`), or leverage native MCP server tools (`firebase_create_project` followed by `firebase_create_app` and `firebase_get_sdk_config`).
* **Environment & Config Synchronization**:
  * Automatically inject the retrieved credentials into `.env.local` or `.env`.
  * Write the `.firebaserc` file mapping the `default` project context.
  * Update this `firebase.md` file with the confirmed Project ID and live hosting URLs.
  * Ensure `firebase.json` specifies the correct public build directory (`out` or `dist`).

### 3. Application Build and Deployment Routine
1. Verify `firebase.json` matches project framework conventions (e.g., Next.js static export or Vite SPA).
2. Execute the application build script (`npm run build`).
3. Deploy to production via `npx -y firebase-tools@latest deploy --only hosting`.
4. Validate live URLs and log deployment completion status.

