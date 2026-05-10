---
name: node_dev
description: Specialized skill for managing Node.js development environments, including starting/stopping dev servers, building, testing, and linting.
---

# Node Development Skill

When the user asks to start, stop, or manage a Node application, follow these instructions exactly:

1. **Detect Package Manager**
   Check for package-lock.json, yarn.lock, or pnpm-lock.yaml to determine the correct package manager (
pm, yarn, or pnpm).

2. **Starting the Dev Server**
   To start the app (e.g., 
pm run dev or 
pm start):
   - Run the command in the background.
   - Wait to ensure the server starts successfully and note the local URL/port.
   - If the port is blocked, terminate the background command running the dev server.

3. **Stopping the Dev Server**
   To stop the app:
   - Terminate the background command running the dev server.

4. **Other Dev Commands**
   - **Install**: Run 
pm install to add dependencies.
   - **Build**: Run 
pm run build to compile the project and verify success.
   - **Test & Lint**: Run 
pm run test or 
pm run lint to enforce quality. Report any errors to the user.

