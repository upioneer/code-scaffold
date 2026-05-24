# AGENT.md

## Role


## System Architecture Overview


## MANDATORY EXECUTION SEQUENCE & VERSIONING PROTOCOL (STRICT)
* You MUST update the `project_details\history\[VERSION]` directory on each iteration of the app using standard semantic versioning (Major.Minor.Bugfix, e.g., v1.1.0).
* CRITICAL: Every single time you bump the version in `manifest.json`, you MUST immediately create a new walkthrough document in `project_details\history\v[NEW_VERSION]\readme.md` detailing the updates.
* Ensure that walkthrough documentation includes screenshots where possible, especially to document UI changes.
* Never modify or overwrite existing version documentation once established
* Ensure each significant deployment cycle results in a new immutable artifact folder

## Remote Synchronization (GitHub Commit)
To maintain the "Online Synced" status of the system you must manage the remote deployment:     
* Manifest Integrity: After any change to the .skills or .templates directories you must update the root manifest.json file to reflect the new version and timestamp.
* Git Lifecycle: You must execute a git add and git commit with a clear descriptive message outlining the changes.
* Final Push: You must push the changes to the main branch of the remote repository to ensure the next scaffold.ps1 execution pulls the updated payload.

## Immutable Constraints
* Absolutely no emojis in the UI or generated code.
* Absolutely no semicolons in the PowerShell source code.
* Do not use em dashes or hyphens in documentation artifacts. Use asterisks for all bulleted lists.
* Always provide the full code file during iterations. Never provide isolated snippets.