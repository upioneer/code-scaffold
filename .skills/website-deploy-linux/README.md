# Website Deploy Linux Skill

This skill implements an Enterprise Linux Deployment Agent designed to compile, configure, and serve static sites and Single Page Applications (SPAs) on Nginx. It supports local deployments as well as secure remote deployments to other servers (such as LXC containers) via SSH and PuTTY.

## Core Capabilities (Version 1.4.0)

The skill automates the entire lifecycle of a frontend deployment:

* **Upfront Architectural Prompting**: To eliminate post-deployment configuration mismatch and avoid retrofitting or data loss, the agent prompts the user upfront with three precise questions:
  * "How is this LXC hosted: is it dedicated to this one site, or does it share with other apps?"
  * "How should the site be accessed? (domain/ip, subdomain, or slug)"
  * "Do you have a domain name to use?"
* **Automatic Credentials File Setup (.env)**: Verifies the existence of a `.env` file in the project's root directory. If missing, it creates the file automatically. If present, it checks for and appends missing lines for `ssh_key=` and `ssh_pw=` variables to assist with secure, non-interactive deployments.
* **Strict Non-Destructive Safeguards**: Enforces strict folder preservation rules. The agent is explicitly prohibited from deleting existing project folders or using destructive command flags (such as the Vite `--overwrite` scaffolding flag). Build operations and framework setups must be executed in isolated working subdirectories or using temporary backup procedures to protect custom source code.
* **PuTTY Command Line Orchestration**: Detailed guides for Windows-based environments using PuTTY command-line tools (`plink.exe` and `pscp.exe`) to execute remote verification, passwordless public key setups, multi-directory file copies, and secure administrative commands using piped sudo passwords.
* **Reference Scripts Integration**: Outlines execution logic and models deployment scripts based on bundled assets:
  * [deploy.ps1](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/assets/deploy.ps1): PowerShell script executing variable loads and PuTTY connection workflows.
  * [setup-lxc.sh](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/assets/setup-lxc.sh): Remote Linux shell script managing Nginx installation, permission assignments, and reload testing.
* **Interactive Pre-Flight Sanity Checks**:
  * **Asset Path Verification**: Validates that all internal assets use relative paths (e.g. `./logo.png`) rather than absolute paths (`/logo.png`) to avoid broken resource paths under subdirectory hosting.
  * **Environment Variable (.env) Injection**: Captures dynamic environment variables formatted for inline bash (e.g. `VITE_API_URL='http://api.internal' VAR2='val'`) to inject them into the production compilation workspace.
  * **Target Specifications**: Streamlines project names, Nginx routing strategy targets, and source path configurations.
* **Dual Host Environments**: Supports deploying to the local system or a remote Linux host via a secure, interactive SSH/SCP pipeline.
* **Dual Routing Strategies**:
  * **Dedicated Virtual Host (Strategy 1)**: Configures a virtual host block (`/etc/nginx/conf.d/${PROJECT_NAME}.conf`) that binds to a custom domain name (FQDN).
  * **Shared Host Subdirectory Path (Strategy 2)**: Configures an alias location block (`/etc/nginx/default.d/${PROJECT_NAME}.conf`) that maps a subdirectory (e.g. `http://IP/${PROJECT_NAME}`) to the application directory. Automatically adjusts the asset base path of Node.js builds using the build base parameter (`npm run build -- --base=/${PROJECT_NAME}/`).
* **Headless Browser Dependencies**: Automatically runs a dry-run check via Playwright and installs missing system-level headless browser libraries on the host if required to ensure validation tests succeed.
* **Pre-Flight Execution Summaries**: Prior to executing any shell command or transferring any files, the agent presents a structured Markdown overview outlining the host, paths, environment variable injections, build configuration, and action items. The agent halts and requires explicit user confirmation to proceed.
* **Dynamic Conflict Resolution**: Actively scans for domain overlaps, preexisting target directories, npm build failures, and permissions blocks. It interactively prompts the user with detailed context whenever a choice or corrective action is required.
* **Zero-Downtime Safe Reloads**: Validates Nginx configuration files using syntax verification prior to reloading the service. Automatically deletes faulty configurations and rolls back state to protect active Nginx services from downtime.
* **Post-Deployment Audits**: Automatically derives the target URL (resolving dynamic local IPs if in subdirectory mode) and executes tests to verify live traffic status.

## Skill Folder Structure

* [meta.json](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/meta.json): Declares package metadata, description, and semantic version.
* [SKILL.md](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/SKILL.md): The detailed instruction manual guiding the AI agent through secure execution.
* [skill-instruction.md](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/skill-instruction.md): The raw Bash implementation script executing the physical deployment procedures.
* [assets/deploy.ps1](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/assets/deploy.ps1): Reference deployment script utilizing PuTTY tools.
* [assets/setup-lxc.sh](file:///C:/Users/hgran/OneDrive/Documents/code/Projects/Agent%20Skills/.skills/website-deploy-linux/assets/setup-lxc.sh): Reference remote configuration setup script.

## Input Parameters

* `PROJECT_NAME`: Alphanumeric name used to isolate directories, configs, and logs.
* `DEPLOY_TYPE`: Selection of routing strategy (`1` for Dedicated Domain or `2` for Shared Subdirectory).
* `SOURCE_PATH`: The location of the code (Git URL or local folder path).
* `SERVER_NAME`: The domain or host name serving the application (required for Strategy 1).
* `HOST_ENVIRONMENT`: Selection between Local and Remote deployment.
* `SSH Credentials`: Secured connection variables (Host, Port, Username, and Password/Key Path) prompted interactively at runtime when remote deployment is selected.
* `Asset Path Confirmation`: Verification that asset references are relative.
* `Environment Variable Injections`: Bash-formatted inline environment strings to pass to production builds.
* `Upfront Prompts Answers`: Direct inputs matching LXC sharing, subdomain access, and domain name availability.
