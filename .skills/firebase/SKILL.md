---
​‌‍name: Firebase
description: Autonomous Firebase project provisioning, clean project naming, CLI lifecycle management, Cloud Firestore multi-database operations, Cloud Functions triggers, Storage security rules, Realtime Database patterns, preview channels, rules testing, backups, Blaze cost guardrails, and client SDK integration.
version: 8
keywords:
  - firebase
  - firestore
  - baas
  - authentication
  - realtime-database
  - cloud-functions
  - hosting
  - firebase-cli
  - firestore-rules
  - firestore-databases
  - mobile-sdk-config
  - automated-provisioning
  - sdk-config
  - firebase-auth
  - cloud-storage
  - emulator-suite
  - app-check
  - fcm-messaging
  - functions-triggers
  - storage-rules
  - preview-channels
  - rules-testing
  - firestore-backups
  - blaze-budgets
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

---

## 9. Cloud Functions Lifecycle & Triggers

Default to second generation functions (Cloud Run backed: concurrency, configurable min and max instances, longer timeouts). First generation is legacy only.

### 9.1 Trigger Catalog
* **HTTPS (`onRequest`)**: Public webhooks and API endpoints. Always validate auth tokens manually; prefer callables for app clients.
* **Callable (`onCall`)**: App invoked with decoded auth context and App Check tokens. Throws typed `HttpsError` codes the client SDK surfaces.
* **Cloud Firestore**: `onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`, `onDocumentWritten` with document path patterns and named database targeting.
* **Authentication Blocking**: `beforeUserCreated` and `beforeUserSignedIn` for custom claims, deny lists, and profile enrichment before sessions issue.
* **Cloud Storage**: `onObjectFinalized`, `onObjectArchived`, `onObjectDeleted`, `onObjectMetadataUpdated` for media pipelines and virus scan fanout.
* **Pub/Sub**: `onMessagePublished` for decoupled work queues; enable ordering only when strict sequence is required.
* **Scheduled (`onSchedule`)**: Cron plus timezone for nightly rollups, TTL sweeps, and report jobs.
* **Realtime Database**: Value and child event triggers for presence and fanout reacting to low latency writes.

### 9.2 Project Wiring
```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "nodejs22",
      "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run lint"]
    }
  ]
}
```
* Store non secret config in `functions/.env`; store secrets with parameterized config (`defineSecret`, `defineString`) and grant access explicitly:
```bash
npx -y firebase-tools@latest functions:secrets:set STRIPE_KEY
```

### 9.3 Deploy, Observe & Scale
```bash
# Deploy all functions, or one function only
npx -y firebase-tools@latest deploy --only functions
npx -y firebase-tools@latest deploy --only functions:api

# Tail logs for one function
npx -y firebase-tools@latest functions:log --only api

# Delete a retired function (confirm prompt)
npx -y firebase-tools@latest functions:delete api

# Emulate functions with Firestore and Auth
npx -y firebase-tools@latest emulators:start --only functions,firestore,auth
```
* Keep `minInstances` at 0 unless cold starts are measured pain; always set `maxInstances` caps so runaway triggers cannot burn budget (see Section 13).

---

## 10. Storage Rules, Realtime Database, App Check & Messaging

### A. Cloud Storage Security Rules & CORS
Guard every bucket with `storage.rules` (default deny, user scoped paths, type and size guards):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
    match /users/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```
```bash
npx -y firebase-tools@latest deploy --only storage
```
Browser uploads to custom domains need bucket CORS. Keep `cors.json` in the repo and apply it:
```json
[{ "origin": ["https://example.com"], "method": ["GET", "PUT", "POST", "DELETE", "HEAD"], "maxAgeSeconds": 3600 }]
```
```bash
gcloud storage buckets update gs://<bucket-name> --cors-file=cors.json
```

### B. Realtime Database Patterns
Reach for Realtime Database for presence, live leaderboards, and fanout sync; keep relational queries in Firestore.
```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid",
        ".validate": "newData.hasChildren(['online', 'lastSeen'])"
      }
    },
    "scores": { ".indexOn": ["points", "updatedAt"] }
  }
}
```
```bash
# Point query, write, push, and backup to file
npx -y firebase-tools@latest database:get /presence --project <project-id>
npx -y firebase-tools@latest database:set /scores/u1 '{"points": 42}' --project <project-id>
npx -y firebase-tools@latest database:get / --project <project-id> -o ./rtdb-backup.json
```

### C. App Check Enforcement
* Enforce App Check per service (Firestore, Storage, Functions, Realtime Database) only after clients ship attestation (Play Integrity, DeviceCheck, App Attest, reCAPTCHA v3 for web).
* Use debug providers plus registered debug tokens for emulators and developer devices; never ship debug tokens in release builds.
* Watch the App Check metrics dashboard for unverified traffic share before flipping enforcement on.

### D. Cloud Messaging (FCM) Operations
Send from trusted server code with the Admin SDK. Validate payloads with `dryRun` before fanout:
```javascript
import { getMessaging } from 'firebase-admin/messaging';
await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, data }, true);
await getMessaging().subscribeToTopic(tokens, 'match-reminders');
```
* Prefer topics and conditions over raw token lists for audiences; prune unregistered tokens on `messaging/registration-token-not-registered`.
* Keep `data` payloads small and JSON string valued; use `notification` only when a system tray display is wanted.

---

## 11. Multi-Environment Projects, Targets & Preview Channels

### 11.1 Project Aliases (.firebaserc)
```json
{
  "projects": { "default": "myapp-prod", "dev": "myapp-dev", "staging": "myapp-staging" }
}
```
```bash
npx -y firebase-tools@latest use dev
npx -y firebase-tools@latest use prod
```
* Mirror environments in dotenv files (`.env.development`, `.env.staging`, `.env.production`); the verifier script (Section 12 tooling) checks alias coverage.

### 11.2 Hosting Multi-Site Targets
```bash
# Bind a site id to a deploy target once
npx -y firebase-tools@latest target:apply hosting docs myapp-docs
npx -y firebase-tools@latest target:apply hosting app myapp-prod

# List bindings
npx -y firebase-tools@latest target
```
```json
{ "hosting": [{ "target": "app", "public": "dist", "ignore": ["firebase.json"] }] }
```
```bash
npx -y firebase-tools@latest deploy --only hosting:app
```

### 11.3 Preview Channels & Release Flow
```bash
# Deploy an expiring preview channel for a pull request
npx -y firebase-tools@latest hosting:channel:deploy pr-123 --expires 7d

# List, open, and retire channels
npx -y firebase-tools@latest hosting:channel:list
npx -y firebase-tools@latest hosting:channel:delete pr-123

# Promote a tested preview to live without rebuilding
npx -y firebase-tools@latest hosting:clone myapp-prod:pr-123 myapp-prod:live
```
* `live` is production. Every production deploy is either a direct `hosting` deploy or a channel clone after preview QA.

---

## 12. Rules Unit Testing, CI Gates & Backups

### 12.1 Rules Unit Tests (Offline, Emulator Backed)
```javascript
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-test', firestore: { rules: './firestore.rules' } });
const alice = env.authenticatedContext('alice');
await assertSucceeds(setDoc(doc(alice.firestore(), 'users/alice'), { name: 'Alice' }));
await assertFails(setDoc(doc(alice.firestore(), 'users/bob'), { name: 'Mallory' }));
await env.cleanup();
```
* Seed fixtures with `withSecurityRulesDisabled`; cover positive, negative, and malformed cases per guarded collection; the same library covers `storage.rules`.

### 12.2 CI Gate Snippet
```yaml
- run: npm install
- run: npx -y firebase-tools@latest emulators:exec --only firestore,auth,storage "npm run test:rules"
```
* Rules changes must pass the emulator suite before any deploy step runs.

### 12.3 Point-in-Time Recovery, Exports & Deletes
```bash
# Enable point-in-time recovery on a database (one time, per database)
gcloud firestore databases update --project=<project-id> --database='(default)' --point-in-time-recovery-enablement=ENABLE

# Scheduled full export to Cloud Storage (run from Cloud Scheduler)
gcloud firestore export gs://<bucket>/backups --project=<project-id>

# Destructive recursive delete (always confirm with the user first)
npx -y firebase-tools@latest firestore:delete --project <project-id> --recursive --all-collections
```

---

## 13. Blaze Budgets & Cost Guardrails

### 13.1 Billing Budgets & Alerts
```bash
# Budget with 50/90/100 percent alert thresholds and Pub/Sub fanout
gcloud billing budgets create --billing-account=<account-id> \
  --display-name="firebase-monthly" --budget-amount=50USD \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 \
  --all-updates-rule-pubsub-topic=projects/<project-id>/topics/billing-alerts
```
* Wire the alert topic to a function that pages on 100 percent and auto caps optional workloads (scheduled jobs, min instances).

### 13.2 Usage Telemetry
* Review the Firebase console Usage tab per product weekly during active development.
* Track Cloud Monitoring metrics: Firestore document reads/writes/deletes, function invocations and active instances, hosting egress bytes, Storage egress.
* Use `functions:log` plus region and memory attribution to find the expensive function before changing code.

### 13.3 Cost Levers Checklist
* Functions: `minInstances` 0 by default, `maxInstances` caps everywhere, smallest sufficient memory tier.
* Firestore: TTL policies on ephemeral collections, indexed query discipline, remove unused composite indexes.
* Storage: lifecycle rules (age based delete, noncurrent version cleanup), multipart/CORS hygiene.
* Hosting: long `Cache-Control` on hashed assets, prune old releases and expired preview channels.
* Realtime Database: `.indexOn` every ordered query, cap simultaneous connections, avoid chatty listeners.
* Any projected spend above Spark boundaries needs explicit user authorization before deploy (see Section 6).