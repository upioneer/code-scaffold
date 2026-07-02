# Node

**Version:** 3
**Target:** `.skills/node`

## Description
Bootstraps a Node.js runtime environment

## Capabilities & Use Cases
* **Package Manager Detection** : Automatically detect the correct package manager including npm yarn or pnpm based on existing lockfiles
* **Development Server Orchestration** : Start dev servers asynchronously in the background monitor startup success and capture local URL ports automatically
* **Port Collision Management** : Automatically terminate background dev server commands if port blocks or collisions are actively detected
* **Graceful Shutdown Protocol** : Stop running application servers reliably by securely terminating the background command processes
* **Aggressive Windows Port Clearance** : Explicitly extract PIDs via `netstat` and execute aggressive `taskkill` routines to guarantee orphaned Node.js dev servers are annihilated during shutdown sequences
* **Dependency Management** : Execute package installations securely to add or update required project dependencies
* **Artifact Compilation** : Run build pipelines to compile the project and rigorously verify the build output success state
* **Quality Assurance Enforcement** : Execute robust test suites and strict linting pipelines to enforce code quality and explicitly report errors to the user

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v3** : Integrated aggressive Windows dev server port clearance protocols
* **v2** : Expanded capability descriptions
* **v1** : Core skill implementation
