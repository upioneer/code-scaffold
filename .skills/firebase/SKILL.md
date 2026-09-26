---
​‌‍name: Firebase
description: Autonomous Firebase project provisioning, clean project naming, CLI lifecycle management, Cloud Firestore multi-database operations, and client SDK integration.
version: 6
---

# Firebase Platform & Cloud Firestore Skill

This skill equips AI agents with end-to-end management capabilities across the Firebase ecosystem: autonomous project provisioning with clean web hosting domains, CLI lifecycle operations, Cloud Firestore multi-database architectures, security rules validation, mobile config downloads, local emulation, and verified production deployments.

---

## 1. Autonomous Clean-Name Project Provisioning & Conflict Resolution

AI agents should enable zero-friction, automated project provisioning directly on behalf of the user, eliminating manual browser-based console operations while ensuring professional, memorable public web addresses.

### A. Cognitive Agent Protocol

When requested to initialize or deploy a new Firebase project, the agent must adhere to the following sequence:

1. **Active Context Pre-Check**: Inspect `.env` (prepopulated with `FIREBASE_` placeholder keys when this skill is selected at scaffold time), `.firebaserc`, and `.env.local` to determine if a project ID is already assigned. If configured, confirm with the user before overwriting.
2. **Clean Project ID Derivation**:
   * Derive a clean, human-readable candidate name directly from the workspace folder name (e.g. `my-saas-platform` or `cool-app`).
   * Adhere strictly to Google Cloud ID standards: 6 to 30 characters, lowercase alphanumeric characters and hyphens only (pattern: `^[a-z][a-z0-9-]{4,28}[a-z0-9]$`).
   * Avoid ugly random hex strings, timestamps, or confusing hashes.
3. **Hosting Domain Mapping & User Choice**:
   * Clearly explain that the Google Cloud Project ID directly governs the public production web address:
     * Primary Domain: `https://<project-id>.web.app`
     * Secondary Domain: `https://<project-id>.firebaseapp.com`
   * Proactively present the candidate name and its hosting URL preview to the user:
     * Option 1: Accept the clean candidate ID.
     * Option 2: Provide a custom clean name of their choice.
4. **Graceful Conflict & Collision Handling**:
   * **Account-Level Detection**: Check if the project already exists in the user's active Google account (`projects:list`). If found, offer to bind and configure the existing project rather than failing.
   * **Global Google Cloud Collision Handling**: If creation fails with a global name collision (HTTP 409 or `already exists` on Google Cloud):
     * NEVER crash, dump raw stack traces, or silently append random hex hashes.
     * Explain clearly that the proposed ID is already registered globally on Google Cloud.
     * Proactively propose clean semantic alternatives:
       * `<candidate>-app` (Preview: `https://<candidate>-app.web.app`)
       * `<candidate>-web` (Preview: `https://<candidate>-web.web.app`)
       * `<candidate>-hub` (Preview: `https://<candidate>-hub.web.app`)
       * `<candidate>-dev` (Preview: `https://<candidate>-dev.web.app`)
     * Prompt the user to select one of the clean alternatives or enter their own custom variation.

### B. Automated Provisioning Tooling

This skill bundles dedicated cross-platform provisioning scripts:
* Windows PowerShell: `.skills/firebase/scripts/provision-firebase-project.ps1`
* POSIX Bash: `.skills/firebase/scripts/provision-firebase-project.sh`

```bash
# Execute automated provisioning via PowerShell
pwsh .skills/firebase/scripts/provision-firebase-project.ps1 -ProjectId "my-clean-app" -DisplayName "My Clean App"

# Execute automated provisioning via Bash
bash .skills/firebase/scripts/provision-firebase-project.sh -p "my-clean-app" -n "My Clean App"
```

The script executes the following end-to-end pipeline:
1. Validates CLI authentication status.
2. Checks for existing project in user account or provisions a new Google Cloud project.
3. Proactively intercepts global collisions and returns structured error JSON with semantic alternatives.
4. Queries or creates the default Web App registration (`apps:create WEB`).
5. Fetches client SDK credentials (`apps:sdkconfig WEB`).
6. Injects credentials into `.env.local` (or `.env`) without overwriting existing environment parameters.
7. Generates `.firebaserc` pointing to the new project.
8. Records active project parameters and live hosting URLs in project documentation.
9. Creates a production-ready `firebase.json` with single-page application rewrites if not already present.

---

## 2. Foundational Firebase CLI Lifecycle & Environment Setup

Before executing database or deployment operations, verify the environment:

### Required Environment Variables

All Firebase configuration lives in the project root `.env` (never in version tracked docs). The scaffolder prepopulates these keys when this skill is selected; the agent self-heals real values with the user:

* `FIREBASE_PROJECT_ID`: primary project ID (determines `<project-id>.web.app`)
* `FIREBASE_SITE_ID`: hosting site ID (defaults to `FIREBASE_PROJECT_ID` if unset)
* `NEXT_PUBLIC_FIREBASE_API_KEY`: client Web SDK API key
* `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: auth domain (`<project-id>.firebaseapp.com`)
* `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: client side project ID mirror
* `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: default Cloud Storage bucket
* `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Cloud Messaging sender ID
* `NEXT_PUBLIC_FIREBASE_APP_ID`: registered Web App ID
* `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: analytics measurement ID (optional)

```bash
# 1. Verify CLI installation and latest version
npx -y firebase-tools@latest --version

# 2. Check authentication status
npx -y firebase-tools@latest projects:list
```

### Authentication Directives
* **Interactive Environments**: If not authenticated, instruct the user to run `npx -y firebase-tools@latest login`.
* **Headless / Containerized Environments**: When operating without a local browser, execute non-interactive authentication:
  ```bash
  npx -y firebase-tools@latest login --no-localhost
  ```

### Active Project Context Management
Most Firebase CLI commands require an explicit project context:
```bash
# List all accessible Firebase projects
npx -y firebase-tools@latest projects:list

# Switch active project context
npx -y firebase-tools@latest use <project-id>

# Create a new Firebase project manually if required
npx -y firebase-tools@latest projects:create <project-id> --display-name "<Display Name>"
```

### Mobile App Configuration Provisioning
Automate client credential artifact retrieval for mobile applications:
```bash
# Download Android configuration (google-services.json)
npx -y firebase-tools@latest apps:sdkconfig ANDROID <app-id> -o android/app/google-services.json

# Download Apple / iOS configuration (GoogleService-Info.plist)
npx -y firebase-tools@latest apps:sdkconfig IOS <app-id> -o ios/Runner/GoogleService-Info.plist
```

---

## 3. Cloud Firestore Multi-Database Architecture

Cloud Firestore supports multi-database topologies per project. Before authoring data models or deploying rules, always discover and inspect target database instances.

### A. Database Instance Discovery & Edition Detection
```bash
# List all Cloud Firestore databases in the active project
npx -y firebase-tools@latest firestore:databases:list

# Inspect detailed metadata for a specific database instance
npx -y firebase-tools@latest firestore:databases:get <database-id>
```

### B. Edition Characteristics
* **Standard Edition**: Optimized for general application workloads with standard multi-region or regional replication.
* **Enterprise Edition**: Provides enhanced compliance tiers, custom key management, and specialized backup profiles.
* Always confirm the target database identifier (default: `(default)`) before running migrations or queries.

### C. Multi-Database Targeting
When interacting with named database instances beyond `(default)`, supply the `--database` flag:
```bash
# Deploy security rules to a specific named database
npx -y firebase-tools@latest deploy --only firestore:rules --database <database-id>
```

### D. Local Emulator Orchestration
For local development and unit testing, run local Firestore and Auth emulators without polluting remote state:
```bash
# Start local emulators with exported state persistence
npx -y firebase-tools@latest emulators:start --only firestore,auth --import=./.emulator_data --export-on-exit
```

---

## 4. Security Rules & Index Optimization

### A. Declarative Security Rules (firestore.rules)
All client-accessible Firestore collections must be guarded by strict security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny rule
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User profile rule requiring verified authentication
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy updated rules deterministically:
```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

### B. Composite Indexes (firestore.indexes.json)
Queries combining multiple equality filters and range operators require composite indexes. Define them in `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy index definitions:
```bash
npx -y firebase-tools@latest deploy --only firestore:indexes
```

---

## 5. Agent Directives for Integration & Architecture

As an AI coding agent building or expanding this project, adhere to these technical constraints:

* **SDK Initialization**: Initialize Firebase securely. Never commit private service account keys or raw API secrets into client source code. Use `.env.local` configuration objects.
* **Modular Web SDK**: For modern web applications, strictly use the Firebase tree-shakeable modular SDK (`import { initializeApp } from 'firebase/app'; import { getFirestore } from 'firebase/firestore';`).
* **Authentication Protocols**: Default to Email and Password authentication unless the user explicitly requests third-party OAuth providers. Enforce route guards across authenticated views.
* **Data Modeling**: Structure collections to minimize read amplification. Denormalize read-heavy metadata where appropriate to avoid multiple round-trips.

---

## 6. Spark Plan Limit Verification

Verify project architecture and estimated consumption against Firebase Spark Plan boundaries before executing mutating commands:

* **Authentication**: 10k phone verifications per month; unlimited for Email and Social identity providers.
* **Cloud Firestore**: 1 GB stored data and 50k document reads per day.
* **Realtime Database**: 1 GB stored data and 100 simultaneous connections.
* **Cloud Storage**: 5 GB stored data and 1 GB download bandwidth per day.
* **Hosting**: 10 GB storage and 360 MB outbound transfer per day.
* **Cloud Messaging**: Free and unlimited.

If projected workloads exceed Spark boundaries, warn the user and confirm authorization before deploying.

---

## 7. Safe Deployment Routine

1. **Verify environment**: Read `.env` in the project root to ensure the `FIREBASE_` deployment parameters and project IDs are populated beyond placeholders.
2. **Missing Configuration Check**: If keys are absent or still placeholders, prompt the user or run the provisioning script before deploying.
3. **Execute Deploy**:
   ```bash
   # Full project deployment
   npx -y firebase-tools@latest deploy
   
   # Targeted service deployment
   npx -y firebase-tools@latest deploy --only hosting,firestore
   ```
4. **Post-Deployment Verification**: Inspect the terminal output and console URLs to confirm successful rollout.
5. **Update Documentation**: Record confirmed configuration details and URLs in project documentation.

---

## 8. Model Context Protocol (MCP) Server Integration

When operating in an MCP-equipped agent environment, leverage the bundled `firebase-mcp-server` tools for headless querying and management:
* `firebase_get_project`: Inspect project configuration and bindings.
* `firebase_list_projects`: Query available project scopes.
* `firebase_create_project`: Provision new Google Cloud projects directly via protocol.
* `firebase_create_app`: Register web, android, or ios client apps.
* `firebase_get_sdk_config`: Retrieve live client SDK credentials.
* `firebase_get_security_rules`: Audit security rules programmatically.
* `firebase_deploy`: Trigger targeted service deployments directly through protocol calls.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.