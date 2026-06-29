# Website Deploy Linux

**Version:** 5
**Target:** `.skills/website-deploy-linux`

## Description
Enterprise Linux Deployment Agent for deploying static sites and SPAs to Nginx locally or remotely via PuTTY CLI (plink/pscp) or SSH, featuring upfront architectural prompting, automatic .env setups, reference scripts, and non destructive folder structures

## Capabilities & Use Cases
* Upfront Architectural Prompting
* LXC Hosting Architecture Check
* Access Method Selection
* Domain Availability Check
* Host Environments
* Secure SSH Credential File Setup (.env)
* Reference Scripts
* Non Destructive Subdirectory Safeguards (Data Protection)
* PuTTY Command Line Orchestration (Windows Hosts)
* PuTTY Availability Check and Auto Installation
* Verify Remote Connection
* Passwordless SSH Key Installation
* Folder Copy Operations (pscp.exe)
* Sudo Elevated Command Execution
* Interactive Pre Flight Sanity Checks
* Asset Path Verification
* Environment Variables (.env) Injection
* Target Specifications
* Headless Browser System Dependencies
* Interactive Pre Flight Execution Summary
* Dynamic Runtime Conflict Resolution
* Routing Strategies
* Strategy 1: Dedicated Virtual Host (FQDN / Custom Domain)
* Strategy 2: Shared Host Subdirectory Path (IP or Hostname Path)
* Step by Step Execution Workflow
* Upfront Architectural Prompting
* Credentials File Verification
* Sanity Checks and Parameters
* Environment Pre Flight Validation
* Source Fetching and Workspace Preparation
* Present Pre Flight Summary
* Safe Subdirectory Compilation
* Remote or Local Asset Transfer (PuTTY Orchestration)
* Permissions and Security Contexts
* Nginx Configuration, Validation, and Reload
* Post Deployment Testing

## Usage
This skill is built for the Code Scaffold engine. Please refer to the `SKILL.md` file inside this directory for the deep integration guidelines and agentic methodologies.

## Changelog
* **v5** : Restore remote changes lost in bad merge (env parsing + success message)
* **v4** : Improve environment variable handling and success message
* **v3** : Enhance setup lxc.sh for dynamic site deployment
* **v2** : Refactor deploy.ps1 for improved automation and safety
* **v1** : Add SEO GEO AEO Auditor and Website Deploy Linux skills
