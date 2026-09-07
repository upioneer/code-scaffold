---
​‌‍name: Firebase
description: Comprehensive Firebase platform orchestration skill covering CLI lifecycle, remote authentication, Cloud Firestore multi-database operations, security rules testing, mobile SDK config downloads, and safe deployment.
version: 4
---

# Firebase Platform & Cloud Firestore Skill

This skill equips AI agents with end-to-end management capabilities across the Firebase ecosystem: CLI lifecycle operations, Cloud Firestore multi-database architectures, security rules validation, mobile config downloads, local emulation, and verified production deployments.

---

## 1. Foundational Firebase CLI Lifecycle & Environment Setup

Before executing database or deployment operations, verify the environment:

`ash
# 1. Verify CLI installation and latest version
npx -y firebase-tools@latest --version

# 2. Check authentication status
npx -y firebase-tools@latest projects:list
`

### Authentication Directives
* **Interactive Environments**: If not authenticated, instruct the user to run 
px -y firebase-tools@latest login.
* **Headless / Containerized Environments**: When operating without a local browser, execute non-interactive authentication:
  `ash
  npx -y firebase-tools@latest login --no-localhost
  `

### Active Project Context Management
Most Firebase CLI commands require an explicit project context:
`ash
# List all accessible Firebase projects
npx -y firebase-tools@latest projects:list

# Switch active project context
npx -y firebase-tools@latest use <project-id>

# Create a new Firebase project if required
npx -y firebase-tools@latest projects:create <project-id> --display-name "<Display Name>"
`

### Mobile App Configuration Provisioning
Automate client credential artifact retrieval for mobile applications:
`ash
# Download Android configuration (google-services.json)
npx -y firebase-tools@latest apps:sdkconfig ANDROID <app-id> -o android/app/google-services.json

# Download Apple / iOS configuration (GoogleService-Info.plist)
npx -y firebase-tools@latest apps:sdkconfig IOS <app-id> -o ios/Runner/GoogleService-Info.plist
`

---

## 2. Cloud Firestore Multi-Database Architecture

Cloud Firestore supports multi-database topologies per project. Before authoring data models or deploying rules, always discover and inspect target database instances.

### A. Database Instance Discovery & Edition Detection
`ash
# List all Cloud Firestore databases in the active project
npx -y firebase-tools@latest firestore:databases:list

# Inspect detailed metadata for a specific database instance
npx -y firebase-tools@latest firestore:databases:get <database-id>
`

### B. Edition Characteristics
* **Standard Edition**: Optimized for general application workloads with standard multi-region or regional replication.
* **Enterprise Edition**: Provides enhanced compliance tiers, custom key management, and specialized backup profiles.
* Always confirm the target database identifier (default: (default)) before running migrations or queries.

### C. Multi-Database Targeting
When interacting with named database instances beyond (default), supply the --database flag:
`ash
# Deploy security rules to a specific named database
npx -y firebase-tools@latest deploy --only firestore:rules --database <database-id>
`

### D. Local Emulator Orchestration
For local development and unit testing, run local Firestore and Auth emulators without polluting remote state:
`ash
# Start local emulators with exported state persistence
npx -y firebase-tools@latest emulators:start --only firestore,auth --import=./.emulator_data --export-on-exit
`

---

## 3. Security Rules & Index Optimization

### A. Declarative Security Rules (irestore.rules)
All client-accessible Firestore collections must be guarded by strict security rules:
`javascript
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
`

Deploy updated rules deterministically:
`ash
npx -y firebase-tools@latest deploy --only firestore:rules
`

### B. Composite Indexes (irestore.indexes.json)
Queries combining multiple equality filters and range operators require composite indexes. Define them in irestore.indexes.json:
`json
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
`

Deploy index definitions:
`ash
npx -y firebase-tools@latest deploy --only firestore:indexes
`

---

## 4. Agent Directives for Integration & Architecture

As an AI coding agent building or expanding this project, adhere to these technical constraints:

* **SDK Initialization**: Initialize Firebase securely. Never commit private service account keys or raw API secrets into client source code. Use .env configuration objects.
* **Modular Web SDK**: For modern web applications, strictly use the Firebase v9/v10 tree-shakeable modular SDK (import { initializeApp } from 'firebase/app'; import { getFirestore } from 'firebase/firestore';).
* **Authentication Protocols**: Default to Email and Password authentication unless the user explicitly requests third-party OAuth providers. Enforce route guards across authenticated views.
* **Data Modeling**: Structure collections to minimize read amplification. Denormalize read-heavy metadata where appropriate to avoid multiple round-trips.

---

## 5. Spark Plan Limit Verification

Verify project architecture and estimated consumption against Firebase Spark Plan boundaries before executing mutating commands:

* **Authentication**: 10k phone verifications per month; unlimited for Email and Social identity providers.
* **Cloud Firestore**: 1 GB stored data and 50k document reads per day.
* **Realtime Database**: 1 GB stored data and 100 simultaneous connections.
* **Cloud Storage**: 5 GB stored data and 1 GB download bandwidth per day.
* **Hosting**: 10 GB storage and 360 MB outbound transfer per day.
* **Cloud Messaging**: Free and unlimited.

If projected workloads exceed Spark boundaries, warn the user and confirm authorization before deploying.

---

## 6. Safe Deployment Routine

1. **Verify irebase.md**: Read irebase.md in the project root to ensure deployment parameters and project IDs are recorded.
2. **Missing Configuration Check**: If irebase.md does not exist or lacks key details, prompt the user for the target project context before deploying.
3. **Execute Deploy**:
   `ash
   # Full project deployment
   npx -y firebase-tools@latest deploy
   
   # Targeted service deployment
   npx -y firebase-tools@latest deploy --only hosting,firestore
   `
4. **Post-Deployment Verification**: Inspect the terminal output and console URLs to confirm successful rollout.
5. **Update Documentation**: Record confirmed configuration details and URLs in irebase.md.

---

## 7. Model Context Protocol (MCP) Server Integration

When operating in an MCP-equipped agent environment, leverage the bundled irebase-mcp-server tools for headless querying:
* irebase_get_project: Inspect project configuration and bindings.
* irebase_list_projects: Query available project scopes.
* irebase_get_security_rules: Audit security rules programmatically.
* irebase_deploy: Trigger targeted service deployments directly through protocol calls.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.