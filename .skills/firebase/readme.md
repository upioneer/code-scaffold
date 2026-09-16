# Firebase

**Version:** 5
**Target:** `.skills/firebase`
**Category:** Data, Databases & Storage
**Keywords:** `firebase`, `firestore`, `baas`, `authentication`, `realtime-database`, `cloud-functions`, `hosting`, `firebase-cli`, `firestore-rules`, `firestore-databases`, `mobile-sdk-config`, `automated-provisioning`, `sdk-config`

## Description
Autonomous Firebase project provisioning, clean project naming, CLI lifecycle management, Cloud Firestore multi-database operations, and client SDK integration.

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

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v5** : Added autonomous project provisioning pipeline, clean URL naming protocol, and conflict resolution
* **v4** : Added foundational Firebase CLI lifecycle workflows, multi-database Firestore edition management, and mobile SDK config provisioning
* **v3** : Expanded capability descriptions
* **v2** : Register repository skills and enforce firebase cli validation
* **v1** : Update firebase and github skill configurations
