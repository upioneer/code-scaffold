# Firebase

**Version:** 8

**Target:** `.skills/firebase`

**Category:** Data, Databases & Storage

**Keywords:** `firebase`, `firestore`, `baas`, `authentication`, `realtime-database`, `cloud-functions`, `hosting`, `firebase-cli`, `firestore-rules`, `firestore-databases`, `mobile-sdk-config`, `automated-provisioning`, `sdk-config`, `firebase-auth`, `cloud-storage`, `emulator-suite`, `app-check`, `fcm-messaging`, `functions-triggers`, `storage-rules`, `preview-channels`, `rules-testing`, `firestore-backups`, `blaze-budgets`

## Description
Autonomous Firebase project provisioning, clean project naming, CLI lifecycle management, Cloud Firestore multi-database operations, Cloud Functions triggers, Storage security rules, Realtime Database patterns, preview channels, rules testing, backups, Blaze cost guardrails, and client SDK integration.

## Capabilities & Use Cases
* Autonomous zero touch Firebase project provisioning pipeline creating remote Google Cloud projects and registering web apps on user demand.
* Intelligent clean project ID generation translating directly into production hosting URLs (https://[project-id].web.app) with no ugly random hashes.
* Proactive conflict resolution detecting global name collisions and suggesting clean semantic alternatives with live hosting previews.
* Dynamic client SDK credential extraction and automatic synchronization into local environment files (.env.local or .env) without clobbering existing keys.
* Orchestrates complete Firebase CLI setup and version verification using deterministic tooling invocations.
* Supports headless and remote authentication via non-interactive login flags for containerized and headless environments.
* Manages multi-database Cloud Firestore architectures including instance discovery, database creation, and edition detection (Standard vs Enterprise).
* Validates and deploys declarative Firestore security rules and composite index specifications.
* Configures local Firebase emulators for offline testing of Firestore, Authentication, and Cloud Functions.
* Automates mobile and web app configuration artifact retrieval for Android and iOS clients.
* Provides deep architectural integration and secure SDK initialization protocols for client and server environments.
* Enforces email and password authentication defaults and guarantees route protection for authenticated application views.
* Strategically selects database paradigms, allocating Cloud Firestore for complex relational queries and Realtime Database for low-latency synchronization.
* Intelligently optimizes data modeling by denormalizing structures to mitigate NoSQL read limits.
* Executes proactive limit verification checks against Firebase Spark Plan boundaries before allowing mutating deployments.
* Intercepts deployment commands to validate CLI existence, login statuses, and enforces strict environment credential availability.
* Integrates directly with native Model Context Protocol (MCP) server endpoints for headless project querying and deployment operations.
* Covers the full Cloud Functions trigger catalog (HTTPS, callable, Firestore, Auth blocking, Storage, Pub/Sub, scheduled, Realtime Database) with Gen2 scaling, secrets, deploy, and log workflows.
* Authors and deploys Cloud Storage security rules with user scoped paths and type/size guards, plus versioned bucket CORS configuration.
* Implements Realtime Database presence, leaderboard, and fanout patterns with validated rules, indexed queries, point operations, and file backups.
* Rolls out App Check enforcement per service with debug providers for emulators and metrics gated production cutover.
* Runs Cloud Messaging fanout from trusted server code with topics, dry run validation, and unregistered token pruning.
* Manages multi-environment project aliases, Hosting multi-site targets, expiring preview channels, and clone-to-live promotion.
* Tests Firestore and Storage rules offline with emulator backed unit tests and a CI gate snippet that blocks deploys on failure.
* Enables point-in-time recovery, scheduled exports, and guarded recursive deletes for backup and disaster recovery.
* Enforces Blaze budgets with threshold alerts, usage telemetry review, and a cost levers checklist across Functions, Firestore, Storage, Hosting, and Realtime Database.
* Ships an offline config verifier that validates env keys, project aliases, firebase.json targets, and rules shape with zero network access.

## Usage
Activate Firebase when you need to provision projects, manage Firestore databases, author security rules, run emulators, ship functions, or deploy hosting. Start every engagement with the offline verifier, then follow the `SKILL.md` lifecycle sections.

```bash
# Validate env keys, aliases, targets, and rules shape (offline)
node .skills/firebase/scripts/verify-firebase-config.mjs --root ./my-app

# Provision a clean named project end to end
pwsh .skills/firebase/scripts/provision-firebase-project.ps1 -ProjectId "my-clean-app" -DisplayName "My Clean App"

# Emulate locally, deploy a preview, promote to live
npx -y firebase-tools@latest emulators:start --only firestore,auth,storage
npx -y firebase-tools@latest hosting:channel:deploy pr-123 --expires 7d
npx -y firebase-tools@latest hosting:clone myapp:pr-123 myapp:live
```

## Changelog
* **v8** : Added Cloud Functions trigger catalog and lifecycle, Storage rules with CORS, Realtime Database patterns, App Check and Cloud Messaging operations, multi-environment aliases with preview channels, emulator backed rules testing with CI gate, point-in-time recovery and exports, Blaze budgets with cost guardrails, and an offline config verifier script
* **v7** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v6** : Skill owns Firebase configuration outright with required environment variable table, .env first checks replacing the retired firebase.md artifact, and scaffold time key seeding
* **v5** : Added autonomous project provisioning pipeline, clean URL naming protocol, and conflict resolution
* **v4** : Added foundational Firebase CLI lifecycle workflows, multi-database Firestore edition management, and mobile SDK config provisioning
* **v3** : Expanded capability descriptions
* **v2** : Register repository skills and enforce firebase cli validation
* **v1** : Update firebase and github skill configurations
