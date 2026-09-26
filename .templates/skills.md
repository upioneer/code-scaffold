# SPECIALIZED AI SKILLS

## SKILL: [Skill Name]
* Purpose: [What the skill achieves]
* Logic: [Step-by-step logic for the AI to follow]

## SKILL: Firebase Deployment Routine
* Purpose: Ensure Firebase deployment is properly configured and documented before pushing, and updated afterwards.
* Logic:
  1. Check if the `FIREBASE_` keys are populated in `.env` (seeded automatically when the Firebase skill is selected; see the Firebase skill for the full key list).
  2. If not, prompt the user for the lacking details.
  3. Execute the push to Firebase using the verified info.
  4. Test to ensure the deployment was successful.
  5. Record tested and validated configuration notes in project documentation.

## SKILL: GitHub Push Routine
* Purpose: Ensure GitHub push is properly configured and handles mismatches (e.g., rebasing, merging) between local directory and remote.
* Logic:
  1. Check if the `GITHUB_` keys are populated in `.env` (seeded automatically when the GitHub skill is selected; see the GitHub skill for the full workflow).
  2. If not, prompt the user for the lacking details.
  3. Fetch the latest remote changes and check the status of the local working directory against the remote branch.
  4. If there's a mismatch (diverged, local behind, conflicts), prompt the user in plain English with specific options (Merge, Rebase, Overwrite Web, Overwrite Local).
  5. Execute the Git command based on the user's explicit instructions.
  6. Push to GitHub after explicit authorization and record new configuration details in project documentation if applicable.

## SKILL: Supabase Management Routine
* Purpose: Keep database schemas properly synchronized via migrations and maintain strictly typed front-ends
* Logic:
  1. Check `supabase.md` for project configuration (e.g., project ID, database URL)
  2. When prompted to migrate: run `npx supabase db push` and verify success
  3. When prompted to sync types: run `npx supabase gen types typescript --project-id "[ID]" > types/supabase.ts`
  4. Verify the type generation was successful and update any relevant documentation

## SKILL: Resend Email Services
* Purpose: Standardize initialization of Email API services and transactional email wrappers
* Logic:
  1. Check for valid Resend API keys or `resend.md` configuration in the environment
  2. Inject key into local `.env` file safely if instructed
  3. Scaffold a reusable `sendEmail` utility function wrapping the Resend SDK
  4. Use template parameters (To, From, Subject, HTML body) to verify email functionality

## SKILL: Telegram Notifications
* Purpose: Dispatch critical system alerts or CI/CD deployment statuses to a Telegram chat
* Logic:
  1. Verify the presence of `TELEGRAM_BOT_TOKEN` and `DEFAULT_CHAT_ID`
  2. Format a concise markdown string detailing the deployment success or error state
  3. Execute an HTTP POST request to the Telegram Bot API to deliver the alert
  4. Log the notification timestamp locally if requested

## SKILL: Node Development
* Purpose: Manage Node.js development environments, including starting/stopping dev servers, building, testing, and linting.
* Logic:
  1. Determine the package manager in use (npm, yarn, pnpm) via lockfiles.
  2. For starting the server, run `npm run dev` in the background and monitor for successful start.
  3. For stopping the server, terminate the associated background process.
  4. Build (`npm run build`), test (`npm test`), or lint (`npm run lint`) when requested and report output.

## SKILL: Playwright Browser Automation
* Purpose: Complete browser automation with Playwright for testing, UX validation, and automated interactions.
* Logic:
  1. Detect running dev servers to eliminate hardcoded URLs.
  2. Write custom Playwright automation scripts to `/tmp` for automatic cleanup.
  3. Execute scripts via the `run.js` executor which handles module resolution and Playwright setup.
  4. Perform actions like page navigation, form submission, screenshots, and responsive design checks.

## SKILL: Vercel Deployment Routine
* Purpose: Coordinate serverless infrastructure and deployment pipelines on Vercel.
* Logic:
  1. Follow the deployment configuration reference inside the Vercel skill (the skill owns the `vercel.json` shape; it is no longer a standalone selectable artifact).
  2. Verify that `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are configured in `.env` (seeded automatically when the Vercel skill is selected).
  3. Validate that build configurations conform to the serverless optimization matrix.
  4. Coordinate Vercel CLI deployment steps for staging and production boundaries.

## SKILL: Clerk Authentication Perimeter
* Purpose: Enforce edge compatible identity boundaries across layouts and API routes using Clerk.
* Logic:
  1. Verify Clerk key parameters in the environment variables.
  2. Ensure the root layout file wraps content inside `ClerkProvider`.
  3. Implement global middleware using clerkMiddleware to wrap private application paths.
  4. Secure Server Actions and Route Handlers utilizing auth to block unauthenticated access.

## SKILL: Upstash Redis Management
* Purpose: Implement connectionless state operations and sliding window rate limiting.
* Logic:
  1. Verify connectionless Redis parameters in environment configurations.
  2. Instantiate the Redis client using Redis fromEnv.
  3. Construct an API rate limiting wrapper using a sliding window algorithm.
  4. Track pending analytical promises using waitUntil on Vercel Edge compute instances.


