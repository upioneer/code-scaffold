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

5. **NPM Trusted Publishing (OIDC) in GitHub Actions**
   When configuring or troubleshooting GitHub Actions to publish packages to NPM using OIDC Trusted Publishing (passwordless `npm publish --provenance`), STRICTLY enforce these invariants:
   - **`registry-url` is Mandatory**: You MUST set `registry-url: 'https://registry.npmjs.org'` in the `actions/setup-node` step. Without this, the NPM CLI will fail to initialize the OIDC handshake and will throw a highly misleading `ENEEDAUTH` error.
   - **Do NOT set `NODE_AUTH_TOKEN`**: Remove any references to `NODE_AUTH_TOKEN` in the publish step's environment variables. OIDC handles the auth implicitly based on the `registry-url` configuration.
   - **Enforce Latest NPM CLI**: Node 20 ships with older `npm` v10.x versions that have known bugs negotiating OIDC tokens. You MUST explicitly force the runner to use the latest NPM version (e.g., `- run: npm install -g npm@latest`) or bump the runner to Node 24 before publishing.
   - **Error Codes Decoder**: 
     - `ENEEDAUTH` = The OIDC handshake failed to trigger. Usually means `registry-url` is missing from `setup-node` or the `npm` CLI version is too old.
     - `403 Forbidden` = The OIDC handshake succeeded, but the registry rejected the payload (often because the package version already exists in the registry, or the account is blocked by 2FA).

6. **Safe CI Pipeline Testing Strategies (NPM Publish)**
   If a CI pipeline is repeatedly failing at the `npm publish` step, DO NOT recursively bump the project's actual version and push release tags to test fixes. Instead, follow this non-destructive isolation strategy:
   1. Add a `workflow_dispatch` trigger to the workflow file so it can be tested manually.
   2. Temporarily bump the target `package.json` version to a disposable prerelease tag (e.g., `1.0.9-test.1`).
   3. Isolate the commit and push strictly the workflow and package.json directly to `main` (bypassing tags).
   4. Manually trigger the workflow from the GitHub Actions dashboard.
   5. If the manual run fails with the specific error: `npm error You must specify a tag using --tag when publishing a prerelease version`, this is an ABSOLUTE PROOF OF SUCCESS. It means the OIDC authentication perfectly bypassed all blocks and only failed because NPM correctly protects the `latest` tag from alpha/test strings.
