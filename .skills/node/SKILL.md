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
   
   ### Windows Dev Server Shutdown Protocol
   **Behavior constraint for managing local dev servers (e.g., Vite, Next.js, Express):**
   When running a local development server on Windows via a background task, cancelling or killing the parent task is insufficient, as it leaves orphaned Node.js child processes bound to the port.

   Anytime you are instructed to shut down the server, test UI changes, or push to production, you MUST explicitly release the port using the following Windows commands:
   1. Find the Process ID (PID) bound to the port (e.g., port 5173):
      `netstat -ano | findstr :5173`
   2. Force kill the specific PID returned:
      `taskkill /PID <pid> /F`

   Never assume the server is dead just because the terminal task was closed. Always verify the port is clear.

   If the other agent is building a CLI itself and you want it to automate this under the hood using Node.js, you can give the agent this snippet instead:
   **Task:** Implement a robust port-killer utility in the CLI for Windows environments.
   When shutting down dev servers spawned by our CLI, standard `child_process.kill()` leaves orphaned processes. Implement a cross-platform termination hook. For Windows environments (`process.platform === 'win32'`), execute `netstat -ano | findstr :<PORT>` to extract the PID, and aggressively terminate it using `execSync('taskkill /PID <PID> /F')` before allowing the CLI to exit.

4. **Other Dev Commands**
   - **Install**: Run 
pm install to add dependencies.
   - **Build**: Run 
pm run build to compile the project and verify success.
   - **Test & Lint**: Run 
pm run test or 
pm run lint to enforce quality. Report any errors to the user.

