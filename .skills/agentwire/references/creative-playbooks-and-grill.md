# AgentWire Opportunity Scanner, Grill Script & Creative Playbooks

This playbook governs how an AgentWire-equipped agent inspects a repository, grills the engineer at the selected scrutiny depth and AI operating mode, and builds standout cross-surface workflows.

---

## 1. Adaptive Scrutiny Dial & Operating Mode Behavior

### Operating Mode Calibration (Ask Right After Scrutiny Dial)
* **Zero-AI Deterministic Mode (No LLM API Key / $0 Token Cost)**: Focus every pitch and generated adapter on deterministic commands (`/cmd`), scoped BotFather menus, schema-driven FSM multi-step wizards, paginated inline dashboards, `@bot` inline search, `start=` account/2FA linking, cron/webhook alerts with remediation buttons, file import/export pipelines, Stars/Payments, pure Mini Apps, plus typed MCP/ACP endpoints.
* **Hybrid Mode**: Ensure every core feature is 100 percent usable deterministically when `LLM_API_KEY` is unset, while layering optional AI natural-language routing and `sendMessageDraft` streaming on top.
* **Full Agentic Mode**: Emphasize conversational tool orchestration, `sendMessageDraft` live token feeds, Voice-to-Action, and ACP/MCP Pocket Gatekeeper bridges.

### Tier 1 : Surgical Fast-Track
* Do not run an exhaustive codebase scan.
* Ask concise questions via `ask_question`: Operating Mode (Zero-AI / Hybrid / Agentic), stack/SDK, surfaces (`MCP`, `ACP`, `Telegram`), and transport (`stdio` vs. Streamable HTTP / polling vs. webhook).
* Scaffold the requested adapters, register starter capabilities, and run the smoke tests.

### Tier 2 : Adaptive Repo Scan & Grill (Recommended)
1. **Silent Repo Scan**: Inspect directory layout, route definitions (`routes/`, `app/api/`, `controllers/`), ORM/SQL schemas, queue/cron definitions, CLI parsers, auth middleware, and webhooks.
2. **Tailored Opportunity Pitch**: Present **3 to 5 concrete, unasked-for workflows** naming real files/endpoints discovered in the repo : explicitly tagging `$0 Zero-AI` workflows vs. `Agentic/LLM` workflows. Example pitch formats:
   * *"Zero-AI Opportunity : I found `src/jobs/nightly-sync.ts` and `src/routes/exports.ts`. Let's wire a proactive Telegram digest at 08:00 with `[Retry Sync]` and `[Download CSV]` inline buttons, plus a paginated `/jobs` dashboard at zero AI cost."*
   * *"Cross-Surface Opportunity : I found `src/billing/refund.ts` and `prisma/schema.prisma`. Expose read-only invoice lookup via MCP + `@bot` inline search, and gate `issue_refund` as `pocket-approve` using either a Zero-AI `/refund` FSM wizard or ACP/Telegram inline approvals."*
3. **Targeted Grill (2 to 4 crisp decisions)**: Confirm which pitches to include, lock Operating Mode (`Zero-AI` / `Hybrid` / `Agentic`), set `auto-allow` vs. `pocket-approve` boundaries, verify user ID allowlists / OAuth 2.1 audience binding, and pick pagination/FSM vs. streaming thresholds.

### Tier 3 : Deep Adversarial Architect
Run everything in Tier 2, plus challenge every boundary in a structured architectural grill:
* **Concurrency & Idempotency**: What happens if an IDE user, a Telegram FSM confirm click, and an inline approval button race on the same mutation? Enforce `idempotencyKey` and atomic broker resolution.
* **Zero-LLM Fallback Guarantees**: If an AI provider goes down or budget hits zero in Hybrid mode, do `/commands`, FSM wizards, 2FA approvals, and alerts continue running uninterrupted?
* **Failure & Timeout Semantics**: Does every `pocket-approve` and 2FA confirmation path fail closed when the engineer is asleep or offline? Set explicit TTLs and fallback behavior.
* **Quota & Flood Control**: How are Telegram `retry_after` 429 limits protected under cron alert storms or rapid `sendMessageDraft` flushes? Enforce outbound rate queues and 250ms to 400ms draft debouncing.
* **Prompt Injection & Untrusted Inputs**: If external data (emails, web scrapes, user file uploads) enters the app, how do untrusted fields avoid invoking destructive capabilities? Enforce strict MIME/schema validation plus human confirmation boundaries.

---

## 2. Highlight Cross-Surface Playbooks

### Playbook 1: Pocket Gatekeeper (ACP / MCP -> Telegram Live Approval Bridge)
Wire-level execution trace when an autonomous coding agent attempts a sensitive database migration:
1. ACP Client sends `session/prompt` ("Migrate user preferences table and drop legacy column").
2. Agent attempts `run_db_migration` (registered with `riskTier: "pocket-approve"`).
3. `ApprovalBroker` intercepts execution, pauses the ACP turn, and emits `session/request_permission` to the IDE **while concurrently** dispatching a signed Telegram message to `TELEGRAM_ALLOWED_USER_IDS`:
   ```text
   [POCKET GATEKEEPER] Approval Required (TTL: 04:58)
   Surface Origin : ACP Session #sess_91a (Workspace: billing-api)
   Capability     : run_db_migration
   SQL Diff       : ALTER TABLE users DROP COLUMN legacy_role;
   [ Approve Once ]   [ Approve Session (15m) ]
   [ Deny + Abort ]
   ```
4. Engineer taps `[Approve Once]` from their phone. Telegram surface validates HMAC + user allowlist, calls `broker.resolveApproval(...)`, edits the Telegram message to remove buttons, notifies the IDE pane via `session/update` ("Permission granted via Telegram"), and runs the migration.

### Playbook 2: Topic-per-Session Multiplexer
* On `session/new`, call Telegram `createForumTopic` (`name: "ACP #sess_91a : billing-api"`).
* Persist `sessionId <-> message_thread_id` in SQLite/Postgres/Redis.
* Stream all `session/update` thoughts, plans, and diffs into that dedicated thread using `sendMessageDraft`.
* Any reply sent by an allowlisted engineer inside that Telegram Forum Topic invokes `session/prompt` (or injects live steering guidance into the running turn) immediately.

### Playbook 3: Self-Mounting MCP-in-ACP
When an app exports both MCP and ACP surfaces, do not make users configure JSON files manually:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "session/new",
  "params": {
    "cwd": "/workspace/app",
    "mcpServers": [
      {
        "name": "app-core-mcp",
        "transport": "streamable-http",
        "url": "http://127.0.0.1:8080/mcp"
      }
    ]
  }
}
```
Any ACP-compatible IDE automatically receives the app's native tools, resources, and prompts on session creation.

### Playbook 4: Voice-to-Action Pocket Ops
1. Engineer sends a voice note in Telegram while away from their desk.
2. Bot handler downloads OGG/Opus audio, transcribes it, and runs structured intent extraction constrained strictly to registered `CapabilityDefinition` IDs.
3. Read-only intents (`auto-allow`) execute and stream back via `sendMessageDraft`.
4. Mutation intents (`pocket-approve`) NEVER auto-execute from voice alone: the bot renders a verification summary with signed inline buttons for one-tap confirmation.

### Playbook 5: Telegram Mini App (TMA) Mission Control
For complex diffs, tables, log tails, or multi-step approvals that exceed Markdown formatting:
1. Send an inline `web_app` button opening `TELEGRAM_MINI_APP_URL?req=<requestId>`.
2. On TMA load, validate `window.Telegram.WebApp.initData` server-side:
   * Extract `hash`, sort remaining key-value pairs alphabetically joined with `\n` (`data_check_string`).
   * Compute `secret_key = HMAC_SHA256("WebAppData", BOT_TOKEN)`.
   * Verify `HMAC_SHA256(secret_key, data_check_string) === hash` and verify `auth_date` is within 300 seconds.
3. Render live app state, diffs, and logs inside Telegram using the app's own React/Vue/HTML components.

### Playbook 6: Zero-AI CI/CD & Web-App 2FA Gatekeeper
Purely deterministic human-in-the-loop protection requiring zero LLM calls:
1. Web app links a user via `https://t.me/YourAppBot?start=link_<nonce>` (stored with 5m TTL).
2. When a GitHub Action deploy or sensitive admin action (API key rotation, bulk export, payout) runs, it calls `broker.requestApproval(...)`.
3. Telegram delivers an instant message with action metadata and HMAC-signed `[Approve Once] [Deny]` buttons; `ApprovalBroker` blocks until clicked or TTL expires (fail-closed).

### Playbook 7: Schema-Driven FSM Wizard + Paginated Resource Browser
Zero-AI alternative to chat prompts for structured operations and list inspection:
1. Any `CapabilityDefinition` with >= 2 fields exposes `/cmd` as a stateful step-by-step wizard (rendering `enum` schemas as one-tap inline buttons plus `[Back]` / `[Cancel]`).
2. Read-only collection tools (`/orders`, `/jobs`, `/users`) expose single-message paginated views (`< Prev | Page 2/8 | Next >`) using `editMessageText` and optional `sendDocument` CSV export.

---

## 3. Future Surface Discovery Loop

Whenever an engineer later adds new features to the app (new payment provider, new deployment script, new webhook), instruct the coding agent via project docs (`AGENTS.md` / `README.md`) to:
1. Check `core/registry` to see which new domain actions lack a capability descriptor.
2. Pitch high-leverage MCP/ACP/Telegram automations for those new modules.
3. Grill the engineer specifically on `riskTier` (`auto-allow` vs. `pocket-approve`) before exposing them.
