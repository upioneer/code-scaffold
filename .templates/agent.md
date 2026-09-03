# Custom Agent Rules

## Role
[Define the agent's primary role and responsibilities here]

## System Architecture Overview
[Define the core architectural patterns here]

## Mandatory Execution Protocols
* **Strict Semantic Versioning:** The versioning schema must strictly adhere to Semantic Versioning (`major.minor.patch`) with the following logic:
  - Major architectural or UI/UX changes receive +1.0.0 bumps. ALWAYS confirm with the user before bumping a major version.
  - Feature additions or improvements (bundled or single) receive +0.1.0 bumps.
  - Bugfixes/patches receive +0.0.1 bumps.
  - ALWAYS use the root `./bump_version.ps1 <version>` script to execute the bump.
* **Versioned Walkthroughs:** Every single time you bump the version, you MUST immediately create a new walkthrough document in `project_details/changelog/v[NEW_VERSION]/readme.md` detailing the updates. Include screenshots where possible. Never modify or overwrite existing version documentation once established.
* **GitHub Actions Validation:** After executing a `git push` to the remote repository, you MUST proactively validate that the resulting GitHub Action pipeline completes successfully before considering the task finished. Wait for the action to complete and verify its success state. Additionally, you MUST proactively review the pipeline's annotations and logs for any warnings, deprecation notices, or runtime errors (such as Node.js version conflicts), provide context to the user regarding these warnings, and explicitly advise them on whether corrective action is necessary.
* **GitHub Releases & Tagging:** When bumping the project version and pushing to GitHub to cut a new release, you MUST explicitly create and push a git tag matching the version string (e.g., `git tag vX.Y.Z` followed by `git push origin vX.Y.Z`).
* **Order of Operations (History Docs):** ALWAYS generate or update the versioned history documentation (in `project_details/changelog/[VERSION]`) *before* executing `git add` and `git commit`. All changes, including documentation, must be bundled into a single deployment commit rather than creating separate documentation-only commits afterward.
* **Project Details Directory (`project_details/`)**: This directory holds all meta-documentation, assets, and procedures.
  * `project_details/changelog/`: Maintains immutable version history documentation (`v[VERSION]/readme.md`) and deployment assets (e.g., UI screenshots).
  * `project_details/playbooks/`: Houses all runnable procedures, deployment scripts, GitHub automation scripts, and reusable operational workflows. You must always use this directory to store and retrieve scripts leveraged for tasks like committing, version bumping, and CI/CD validation.
  * `project_details/proof/`: Serves as the evidence locker for agent task completion. Use this directory to store test results, validation logs, execution traces, or any artifact that demonstrates the correctness of your work before committing.
* **Automated Screenshots (VHS):** If the workspace utilizes `vhs` for automated screenshot/GIF generation (e.g., during version bumps), you MUST verify that `vhs` successfully generated the assets before embedding them in documentation. **CRITICAL (Headless Agent Constraints)**: When attempting to generate VHS assets natively on Windows in a headless agent environment, `vhs` will hang indefinitely due to missing pseudo-TTYs (`conpty`). Instead, you MUST execute `vhs` via Windows Subsystem for Linux (WSL). If this is the first time doing so, you MUST explicitly prompt the user for permission to execute the one-time WSL static dependency setup sequence for `vhs`, `ffmpeg`, and `ttyd` (bypassing broken apt repositories). If the capture is skipped or fails, you MUST NOT include broken markdown image links.
* **PowerShell Syntax (Logical Operators in Cmdlets):** When writing PowerShell scripts, ALWAYS wrap cmdlets in parentheses before chaining logical operators (e.g., `-and`, `-or`). Otherwise, PowerShell will incorrectly parse the operator as a positional argument to the cmdlet and crash.
  - **INCORRECT:** `if (Get-Command wsl -ErrorAction SilentlyContinue -and (wsl bash -c "command -v vhs")) { ... }` (Crash: `Get-Command` attempts to parse `-and` as an argument).
  - **CORRECT:** `if ((Get-Command wsl -ErrorAction SilentlyContinue) -and (wsl bash -c "command -v vhs")) { ... }`
* **Mandatory Mobile-First Responsive Design Protocol:**
  * **Mobile Baseline Viewport**: All web interfaces, layouts, and components must be styled and tested for mobile viewports (320px to 390px) first before progressively enhancing for tablet (768px) and desktop (1024px+) viewports.
  * **Viewport and Touch Compliance**: All HTML documents must declare `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. All interactive elements (buttons, links, form inputs) must maintain a minimum touch target size of 48 by 48 pixels with appropriate touch spacing.
  * **Fluid Layouts and Typography**: Use relative CSS units (rem, clamp, percentage, flex, grid) for typography and structural layouts. Never use fixed pixel widths on container elements that induce horizontal scroll overflow.
  * **Responsive Media**: All images and visual media must include responsive properties (`srcset`, `sizes`, `loading="lazy"`) and must scale fluidly with `max-width: 100%`.
* **Mandatory SEO, GEO & AEO Discovery Protocol:**
  * **Dynamic Metadata Lifecycle**: Every public route, page, or view must automatically include descriptive title tags (50 to 60 characters), meta descriptions (120 to 160 characters), canonical URLs, and OpenGraph / Twitter Card social preview tags.
  * **Structured Data (JSON-LD)**: Pages must provide valid schema.org JSON-LD structured data (e.g. `WebSite`, `Organization`, `Article`, `Product`, `BreadcrumbList`, `FAQPage`) to enable rich snippets and entity indexing.
  * **Sitemaps and Robots Directives**: Automatically create and update `/sitemap.xml` and `/robots.txt` upon introducing, changing, or removing routes.
  * **Generative Engine and Answer Optimization (GEO/AEO)**: Content must adhere to strict semantic HTML heading hierarchies (single `<h1>` per page, logical `<h2>` to `<h6>`), question-phrased subheadings with immediate direct answer paragraph summaries, high factual density, and clear entity definitions to optimize for AI synthesis engines (Perplexity, ChatGPT, Gemini) and featured voice snippets.

## Immutable Constraints
* **CRITICAL - EXPLICIT CONSENT FOR PUSHING:** NEVER execute a `git push` (or any command that modifies a remote repository) without the user's explicit, direct permission for that specific push action. You must ALWAYS pause execution, summarize what is about to be pushed, and ask the user for authorization. Do not assume consent based on previous instructions or context.
* **CRITICAL - EXPLICIT CONSENT FOR VERSION BUMPING:** Before executing the `./bump_version.ps1` script or incrementing package versions, you MUST proactively prompt the user with a drafted changelog summary (bullet points) outlining exactly what changes are being bundled into the release. 
  - **MANDATORY REASONING**: Your prompt MUST explicitly state your reasoning for the chosen version number increment (Major, Minor, or Patch) based on the semantic rules.
  - You must wait for the user's explicit approval on the changelog and the version reasoning before proceeding with the bump.
* Absolutely no emojis in the UI or generated code.
* Do not use em dashes or hyphens in documentation artifacts. Use asterisks for all bulleted lists.
* Always provide the full code file during iterations. Never provide isolated snippets.
