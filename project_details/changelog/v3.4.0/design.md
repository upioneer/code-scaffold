# DESIGN.md

## Project Architecture
The system operates using a local discovery model with an online synchronization engine. At runtime the script scans the local file system to dynamically generate the manifest. It utilizes an online check to synchronize new templates and skills from a remote GitHub repository before caching the updated manifest for robust offline execution.

## Discovery and Manifest Strategy
* The primary data source is the local directory structure scanning for available artifacts and skills.
* The engine compiles the local state into a runtime manifest.
* The system reads a local meta.json file within each skill folder to override the physical directory name with a formatted display label for the UI.
* The system reaches out to the remote raw user content GitHub endpoint to verify versions and pull missing modules.
* A local cache file is updated after a successful online sync to ensure offline availability.

## Visual Identity
* Foreground Color: #484d46
* Background Color: Deep Charcoal
* Floating Command Palette: Dual tone background with a solid accent border.
* Header: Displays the active version and sync status.

## Constraints
* Dynamic rendering is driven by file system discovery.
* No emojis allowed.
* No semicolons in the underlying logic.
* No unsupported punctuation in documentation.

# PLAN.md

## Phase 1 Data Acquisition and Discovery
1. Scan the local templates and skills directories to build the initial state arrays.
2. For each skill directory discovered check for a meta.json file.
3. If meta.json exists parse the label property to use as the display name in the UI.
4. Define the remote GitHub URL for the master manifest.
5. Try to execute the web request to fetch the remote JSON payload.
6. Compare the remote payload against the local state and download any missing directory structures or files.
7. Parse the metadata to extract Version and Timestamp.

## Phase 2 Interface Rendering
1. Clear the terminal and render the ASCII block text SCAFFOLD splash screen.
2. Print the connection status, version and timestamp directly below the splash screen.
3. Iterate through Apps, Artifacts and Skills dynamically to build the final state arrays.
4. Render the floating command palette TUI using a loop against the state arrays ensuring all items are displayed with dual tone shading.

## Phase 3 Provisioning Logic
1. Await Enter key execution.
2. Filter the dynamic state arrays for items marked true.
3. Execute the defined methods for each selected item.
4. Remove the script file from the root directory to self destruct.