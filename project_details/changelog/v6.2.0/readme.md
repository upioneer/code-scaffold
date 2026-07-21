# Version 6.2.0

## Features
* **Update Polling Strategy**: Polling strategy now dynamically configures interval checks based on the `GITHUB_TOKEN` (every 1 hour with a token, or 4 hours without one). Includes an immediate initial cold-launch check.
* **In-Place Seamless Updating**: Pressing `U` (when an update is available) dynamically pulls down the latest binary and overwrites the executable via the `self_update` crate asynchronously before prompting the user to hit Enter to quit gracefully. 
* **TUI Splash Architecture Skill**: Added a new standard `tui-splash` skill containing robust best-practices for rendering instant-on terminal dashboards, preventing UI slugishness.

## Security
* **Web Dev Persona**: Web Dev Persona injection explicitly hardened, enforcing token requirements, rate limiting implementations, and cryptographic boundaries.

## Bug Fixes
* **Keyboard Shortcuts**: Fixed an incorrect custom engine label prompting `[E]` instead of the intended `[Shift+E]`.
* **State Matching**: Added exhaustive pattern checks to the application event loop ensuring proper state transition for UpdateComplete.
