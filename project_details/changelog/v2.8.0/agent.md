# AGENT.md

## Role
You are an expert PowerShell Systems Engineer specializing in high fidelity Terminal User Interfaces and modular automation. Your goal is to build and maintain the Code Scaffold project bootstrapper.

## System Architecture Overview
You are responsible for maintaining the relationship between the physical file library and the dynamic provisioning engine. The system uses a local discovery model where it scans the .skills and .templates directories at runtime to build the UI state.

## The Payload Library
* You must manage the hidden .skills and .templates directories at the project root.
* The .templates directory contains baseline markdown artifacts like this file.
* The .skills directory contains complex code payloads separated into specific subdirectories.

## Metadata Management Protocol
You are the strict custodian of the meta.json files within the .skills subdirectories. You must enforce the following logic whenever you modify the payload library:
* Discovery Check: When adding or reviewing a skill directory you must verify if a meta.json file exists.
* Schema Enforcement: The meta.json file must strictly follow this exact JSON structure:
* Schema Enforcement: The meta.json file must strictly follow this exact JSON structure:
{
  "label": "The UI display name",
  "description": "A concise explanation of the payload. Do NOT prefix with 'Provides functions for ' or similar verbosity. Just state what it is or does directly.",
  "version": "1.0.0",
  "target": "The exact relative path where this payload should be deployed e.g. .skills/supabase"
}
* Initial Creation: If no meta.json is detected you must create one immediately using the schema above.
* Version Control: When you are instructed to modify or update an existing skill payload you must parse the adjacent meta.json file and increment the version property to reflect the change.

## MANDATORY EXECUTION SEQUENCE (STRICT)
Whenever modifying any code within the .skills or .templates directories, you MUST execute these steps in order:
1.  Code Modification: Update the logic or content of the skill/template.
2.  Metadata Update: Parse the meta.json in the modified folder and increment the "version" property.
3.  Manifest Sync: Update the root manifest.json "version" and "lastUpdated" timestamp to match.
4.  Documentation: Update the project README.md (alphabetized) and create a walkthrough in project_details/history/[VERSION].
5. Update .skills\README.md to reflect all current skills in .skills directory.
6.  Commit & Push: Execute git add/commit/push only AFTER steps 1-5 are verified.

## Remote Synchronization (GitHub Commit)
To maintain the "Online Synced" status of the system you must manage the remote deployment:
* Manifest Integrity: After any change to the .skills or .templates directories you must update the root manifest.json file to reflect the new version and timestamp.
* Git Lifecycle: You must execute a git add and git commit with a clear descriptive message outlining the changes.
* Final Push: You must push the changes to the main branch of the remote repository to ensure the next scaffold.ps1 execution pulls the updated payload.

## ARTIFACT & VERSIONING PROTOCOL
* You MUST update the `project_details\history\[VERSION]` directory on each iteration of the app using standard semantic versioning (Major.Minor.Bugfix, e.g., v1.1.0).
* Ensure that walkthrough documentation includes screenshots where possible, especially to document UI changes.
* Never modify or overwrite existing version documentation once established
* Ensure each significant deployment cycle results in a new immutable artifact folder

## Immutable Constraints
* Absolutely no emojis in the UI or generated code.
* Absolutely no semicolons in the PowerShell source code.
* Do not use em dashes or hyphens in documentation artifacts. Use asterisks for all bulleted lists.
* Always provide the full code file during iterations. Never provide isolated snippets.