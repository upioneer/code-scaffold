---
name: firebase_deployment
description: Specialized skill for safely pushing to Firebase, verifying firebase.md configuration, and updating it upon success.
---

# Firebase Deployment Skill & Workflow

When the user asks to push or deploy to Firebase, follow these instructions exactly to ensure a safe, documented deployment:

1. **Verify firebase.md**
   Read the `firebase.md` file in the project's root workspace to ensure it contains all necessary Firebase configuration and deployment information (e.g., project ID, active site, region).

2. **Prompt the User if Missing Info**
   If `firebase.md` does not exist or lacks necessary deployment details (configuration is missing or incomplete), immediately halt and ask the user directly for the missing Firebase configuration information. Do not proceed to deployment until this information is provided.

3. **Perform the Push/Deploy**
   Once the necessary information is confirmed, run the appropriate Firebase deployment commands (e.g., `firebase deploy`).

4. **Verify the Deployment**
   Test the deployed environment or check the output of the terminal command/Firebase console URL to ensure a successful push.

5. **Update Documentation (`firebase.md`)**
   After a successful deployment, automatically update `firebase.md` (or create it if it doesn't exist) with any new or confirmed project configuration details, URLs, or parameters so it is available for future automated deployments.

6. **Generate Versioned Walkthrough**
* You MUST update the `\apps\walkthrough\[VERSION]` directory on each iteration of the app using standard semantic versioning (Major.Minor.Bugfix, e.g., v1.1.0).
* Ensure that walkthrough documentation includes screenshots where possible, especially to document UI changes.
* Never modify or overwrite existing version documentation once established
* Ensure each significant deployment cycle results in a new immutable artifact folder
* Always ensure that the listed skills within the project's `readme.md` are alphabetized when generating or updating the documentation