# Project To-Do & Feature Planning

## Agent Harness Expansion: Zero-Trust Ephemeral Vault for Secrets
**Status**: Planned / Pending Implementation
**Target**: `code-scaffold-harness` skill / agent tooling

**Objective:**
When the agent needs to inject `.env` secrets (e.g., GitHub PAT, Firebase admin keys), it cannot ask the user for them over the Telegram chat UI due to severe security risks (interception, link-preview bots, server-side logging of plaintext keys). We must build a Zero-Trust Ephemeral Vault utilizing a localized HTTP server and a Cloudflare/Ngrok reverse tunnel.

### Architectural Blueprint
1. **The Handshake**: The agent determines missing keys. It generates a cryptographically secure 6-digit OTP (One-Time PIN) and a randomized localhost port.
2. **The Infrastructure**: The agent spawns an Express/FastAPI local server bound strictly to `127.0.0.1:<port>`. It instantly spawns a `cloudflared` (Cloudflare Tunnel) or `ngrok` subprocess to expose that port to a randomized HTTPS URL.
3. **The UX**: The agent sends the HTTPS URL and the 6-digit OTP to the user via Telegram. 
4. **Mobile Optimization**: The user taps the link, which opens a mobile-optimized webpage. They authenticate via the OTP (defeating Telegram link-preview bots) and are presented with a clean HTML form using `<input type="password">` fields specifically for the required `.env` variables.
5. **The Teardown (TTL / Deadman Switch)**: 
   - If a successful POST request is received, the server natively writes the `.env` file to disk and instantly self-destructs the HTTP server and the Tunnel subprocess. 
   - If 5 minutes pass without a successful submission, the processes are ruthlessly killed via a TTL deadman switch. 

### Threat Model & Mitigations
* **Telegram Crawler Bots**: Defeated via the out-of-band 6-digit OTP authentication requirement.
* **Network MITM**: Defeated via mandatory TLS 1.3 encryption forced by the tunnel provider.
* **Persistent Exposure**: Defeated via instantaneous teardown upon first success, or the 5-minute asynchronous TTL.
* **XSS / Injection**: Defeated by strict backend sanitization; no user input is ever rendered back to the screen, only written to the `.env` template.
* **Screen Scraping**: Defeated via `type="password"` input masking.

## Remote Agent Local File/IDE Tunneling Architecture
**Status**: Architecture Scoped
**Target**: `code-scaffold` CLI / MCP Server integration

**Objective:**
Allow an external remote agent (like Hermes/OpenClaw running on Proxmox LXC/VPS) to interact directly with the user's local filesystem and IDE across OS/CPU boundaries (Windows/Mac/Linux on x86/ARM), bypassing the need to spin up a temporary VPS.

### Architecture Options
1. **Application-Layer Relays (WebSockets/SSE)**
   - **Mechanism**: The local CLI dials out to a lightweight public broker via WebSockets. The remote agent pushes payloads to the broker, which pipes it down the active persistent socket.
   - **Advantage**: Bypasses local inbound firewalls completely. No third-party binaries required.
   - **Security**: Ephemeral pairing token generated locally. Agent must present token to broker. Connection dies when CLI exits.

2. **Infrastructure Overlays (FRP / Cloudflared)**
   - **Mechanism**: The CLI bundles `frpc` or `cloudflared` to programmatically spawn a secure reverse tunnel, exposing a local port running an API directly to the external agent over HTTPS.
   - **Advantage**: Zero Trust access policies can be enforced via Cloudflare before the agent connects.

3. **Native CLI-to-CLI TX/RX Mode (Peer-to-Peer Pairing)**
   - **Mechanism**: Both the local user and the remote agent execute the `code-scaffold` CLI. The local machine boots in RX (Receiver/Server) mode and the remote agent boots in TX (Transmitter/Client) mode. 
   - **UX Flow**: The local CLI generates a short, cryptographically secure pairing code (e.g., 6 alphanumeric characters). The user hands this code to the remote agent (much like a TeamViewer or remote desktop support session). The agent enters the code into its TX interface to finalize the handshake and establish the tunnel.
   - **Advantage**: Creates a native, seamless ecosystem experience without requiring third-party tools. The pairing code guarantees explicit human consent and verifies identity before any filesystem access is granted.

### Protocol & Security Boundaries
* **The Standard**: Use the Model Context Protocol (MCP) locally. The CLI spins up a local MCP server and exposes it through the tunnel. MCP natively handles capability discovery for the agent.
* **Strict Sandboxing**: The local MCP server must ruthlessly refuse any path traversal outside the initialized working directory (e.g., blocking `../../etc/passwd` or `~/.aws`).
* **Human-in-the-Loop (HITL)**: All file reads can be continuous and silent. However, any disk write, code commit, or shell script execution MUST trigger an explicit `[Y/N]` prompt in the local CLI.
* **State Reversion**: Buffer agent file modifications locally to allow the user to view a diff and approve the patch before the agent can silently overwrite functional code.


# Project Tasks
* [ ] Update "SCAFFOLD" in the splash screen to Terminal UI (TUI) design, specifically utilizing Braille Patterns (Unicode block U+2800 to U+28FF) for high-density graphics and ASCII Art for the large headers. Replace current ASCII art with "braille animations" 
* [x] Implement graceful auto-updates for the frontend CLI binary (prompt user when new version is available)
* [x] "Open Code-Scaffold in new tab" integration for VS Code/Antigravity (similar to OpenCode or Claude Code) for QoL enhancement.
* [x] Add a specific modal guiding users to take advantage of the agentic workflow/agent harness capabilities. Point users to the `code-scaffold` skill (e.g. "Press [Shift+A] for Agent instructions").
* [ ] Re-implement QR code in Summary Pane linking to project website (code-scaffold.com).
* [x] Integrate `vhs` (Charmbracelet) into the `bump_version.ps1` script to automatically generate high-quality GIF/PNG screenshots for the `project_details/history` docs going forward.
## Completed
* [x] **Profile-Specific Testing Suites**: Dynamically provisions tailored verification harnesses (web-dev, database, systems-auto) with async pre-flight checks and auto-pairing UI toggles (v3.6.0).
* [x] **Braille Animations Skill**: Integrated `unicode-animations` library, created `braille_helper.js` utility, and synced to GitHub (v3.0.0).
* [x] **p5.js Skill**: Added boilerplate and API reference for creative coding (v3.1.0).
* [x] **Manim Skill**: Added Python template and CLI reference for mathematical animations (v3.1.0).

## Pending Deployment
* [x] Splash screen on launch
* [~] ~~"Enter" to toggle between primary and secondary panes (Canceled: Using Tab / Shift+Tab standard)~~
* [x] "Space" to toggle selections
* [x] remove "Left" and "Right" navigation hints in the nav bar. no longer necessary
* [x] Method/hotkey for user to change themes
* [x] Add "Privacy Statement" to web dev agent.md
* [x] add Ratatui skill (https://ratatui.rs/ https://docs.rs/ratatui/ https://ratatui.rs/tutorials/)
* [x] Ctrl+X = "Deploy Selected"
* [x] Potential easier onboarding with a guided flow from artifacts > skills > licensing and so on. Keystrokes to go back, but space+enter to accomplish the entire deployment would be key
* [x] Include appropriate rate limiting when the web dev agent persona is selected. we need to beef up the agent.md specific to this role to ensure the website is safe from common attacks, hash passwords where necessary and so on. best practices should be injected here
