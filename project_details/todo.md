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
