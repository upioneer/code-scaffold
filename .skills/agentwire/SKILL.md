---
​‌‍name: AgentWire Multi-Surface Engine
description: Trigger when the user wants to add MCP (Model Context Protocol), ACP (Agent Client Protocol), and Telegram support (both AI-powered agentic workflows and zero-AI deterministic bots, commands, FSM wizards, inline keyboards, payments, alerts, and Mini Apps) to a new or existing application, wire an app as an agentic or chat control plane, retrofit existing APIs/CLIs, implement Streamable HTTP MCP with OAuth 2.1/Elicitation/Tasks, add ACP IDE session/permission flows, stream live responses with sendMessageDraft, or audit a codebase for integration opportunities.
version: 1
keywords:
  - agentwire
  - multi-surface-agent
  - mcp-server
  - acp-protocol
  - agent-client-protocol
  - telegram-bot
  - zero-ai-bot
  - fsm-wizards
  - inline-keyboards
  - telegram-payments
  - streamable-http
  - model-context-protocol
  - pocket-approvals
  - send-message-draft
  - telegram-mini-apps
  - oauth-2-1
  - elicitation
  - capability-core
  - surface-adapter
  - json-rpc
  - human-in-the-loop
  - session-permissions
  - agent-control-plane
  - mcp-in-acp
  - forum-topics
  - voice-to-action
  - app-retrofitting
  - polyglot-sdk
  - agent-bridge
  - live-streaming
---

# AgentWire Multi-Surface Engine

AgentWire projects a single **Domain Capability Core** onto multiple agentic and deterministic interaction surfaces simultaneously: **MCP** (tools, resources, prompts, tasks), **ACP** (live IDE/editor sessions, streaming plans, tool permission gates), and **Telegram** (supporting both **AI-powered streaming agents** and **100 percent Zero-AI deterministic bots** with zero LLM API keys or token spend), plus any future channel implementing the **Surface Adapter Contract**.

Rather than bolting incompatible wrappers onto an application, AgentWire defines every capability once (typed input/output schema, risk tier, idempotency key, execution contract) and compiles it into wire-compliant adapters with shared policy enforcement and zero schema drift. Teams without an LLM key or budget can ship full production Telegram commands, FSM wizards, paginated dashboards, alerts, 2FA deep links, payments, and Mini Apps immediately, and later turn on MCP/ACP/LLM mode with zero core rewrite.

---

## Overview & Extensible Multi-Surface Topology

```
+─────────────────────────────────────────────────────────────────────────────+
|                  AgentWire Multi-Surface Control Plane                      |
|                                                                             |
|  [Surface 1: MCP]           [Surface 2: ACP]        [Surface 3: Telegram]   |
|  * Streamable HTTP / stdio  * JSON-RPC 2.0 stdio    * Zero-AI Deterministic |
|  * OAuth 2.1 + RFC 9728     * session/new + prompt    (FSM, Menus, Alerts,  |
|  * Elicitation + Sampling   * request_permission       Inline, Stars, TMA)  |
|  * Async Tasks              * Self-Mount mcpServers * Agentic (DraftStream, |
|                                                        Topics, Pocket Gate) |
|         │                          │                         │              |
|         └──────────────────────────┼─────────────────────────┘              |
|                                    ▼                                        |
|  +───────────────────────────────────────────────────────────────────────+  |
|  |         Surface Adapter Contract (Extensible: A2A, Slack, Voice)      |  |
|  +─────────────────────────────────┬─────────────────────────────────────+  |
|                                    ▼                                        |
|  +───────────────────────────────────────────────────────────────────────+  |
|  |                        Domain Capability Core                         |  |
|  |  * Canonical Schema Registry   * Unified Permission Policy Engine     |  |
|  |  * Approval Broker (TTL/Sign)  * Shared Event Bus                     |  |
|  |  * Idempotency & Audit Ledger  * Existing App Service / Strangler API |  |
|  +───────────────────────────────────────────────────────────────────────+  |
+─────────────────────────────────────────────────────────────────────────────+
```

* **Zero Schema Drift**: Capabilities are authored once (`zod`, `pydantic`, `schemars`, or Go structs) and projected identically to MCP tool schemas, ACP permission prompts, and both Zero-AI Telegram `/commands` + FSM wizards and AI chat flows.
* **Zero-AI First-Class Parity**: Never assume an engineer has or wants an LLM API key or token bill. Deterministic Telegram bots deliver massive operational leverage (FSM wizards, paginated inline dashboards, `@bot` search, `start=` 2FA account linking, cron digests with action buttons, document import/export, Telegram Stars payments, and Mini Apps) at `$0` inference cost and sub-100ms latency.
* **True Extensibility**: Shipping MCP, ACP, and Telegram out of the box never locks your app to three surfaces. Any new channel (A2A, Slack, Discord, voice gateway, webhook dispatcher) drops in by implementing the minimal `SurfaceAdapter` interface without touching domain handlers.
* **Cross-Surface Multiplexing**: An approval gate raised during an ACP IDE turn, a long-running MCP task, or a CI/CD deploy webhook routes cleanly to signed Telegram inline buttons and resolves from your pocket.

---

## Phase 0: Adaptive Scrutiny Dial (Mandatory First Prompt)

Before scanning files or writing code, ALWAYS ask the engineer how deeply they want AgentWire to scan and grill their codebase using `ask_question`:

* **Question**: `"How deep should AgentWire scan and grill your project before scaffolding?"`
* **Options**:
  * `Tier 2 : Adaptive Repo Scan & Grill (Recommended)` : Inspect routes, models, jobs, and CLI commands, pitch 3 to 5 tailored unasked-for workflows (covering both zero-AI deterministic and agentic opportunities), then grill on auth, blast radius, and priorities.
  * `Tier 1 : Surgical Fast-Track` : Skip deep discovery, take explicit surface/operating-mode/stack selections, and scaffold cleanly right away.
  * `Tier 3 : Deep Adversarial Architect` : Full topology audit plus multi-round grilling across failure modes, rate limits, concurrency, replay safety, and creative cross-surface orchestrations.

Follow the engineer's chosen scrutiny tier strictly:
* If **Tier 1** is selected, skip Phase 1 and run a streamlined Operating Mode + Stack check in Phase 2.
* If **Tier 2** is selected, run Phase 1 (scan and pitch 3 to 5 concrete workflows) followed by focused grilling in Phase 2.
* If **Tier 3** is selected, run Phase 1 exhaustively (map every surface, data boundary, and side effect) and conduct a thorough multi-round Phase 2 architectural grill until every edge case has an explicit owner.

---

## Phase 1: Codebase Opportunity Scanner (Tiers 2 & 3)

Inspect the target repository silently before proposing architecture. Map concrete codebase signals directly to high-leverage multi-surface capabilities across both **Agentic** and **Zero-AI Deterministic** paths:

| Codebase Signal Found | MCP Opportunity | ACP Opportunity | Telegram (Zero-AI Deterministic) | Telegram (Agentic / Hybrid) |
| :--- | :--- | :--- | :--- | :--- |
| **REST / GraphQL Routes** | Semantic tools + read resources | Mounted via `mcpServers[]` | Typed `/cmds`, scoped menus, `@bot` inline search | NL query routing + Mini App views |
| **Multi-Field Forms / POSTs** | Form-Mode Elicitation tools | Parameter preview modal | Schema-driven FSM multi-step wizards with `[Back]`/`[Cancel]` | Conversational extraction + confirmation card |
| **DB Schema / Lists** | Query tool + schema resource | `request_permission` on DDL | Paginated inline dashboards (`editMessageText`) + CSV export | NL analytics + draft streaming |
| **Background Jobs / Cron** | Async MCP Tasks (`tasks/get`) | `session/update` telemetry | Proactive digest alerts + `[Retry]` / `[Silence 1h]` buttons | Topic-per-job `sendMessageDraft` feed |
| **Auth / Webhooks / Payouts** | URL-Mode Elicitation + RBAC | `pocket-approve` permission gate | `t.me/Bot?start=link_` 2FA account linking + `[Approve]/[Deny]` | Cross-surface ACP Pocket Gatekeeper |
| **Billing / E-Commerce** | Refund/invoice MCP tools | Scoped workspace billing audit | Native Telegram `sendInvoice` (`XTR` Stars or provider) | Conversational order triage |
| **Files / Exports / Dashboards** | MCP structured artifacts | Diff & artifact IDE links | `getFile` CSV/PDF import + `sendDocument` + pure-frontend TMA | Voice-to-Action + TMA Mission Control |

**Mandatory Pitch Rule (Tiers 2 & 3)**: After scanning, present **3 to 5 specific, unasked-for use cases** grounded in real file paths and symbols from the engineer's repository (explicitly noting which ones work at `$0` AI cost in Zero-AI mode vs. requiring an LLM). Invite the engineer to promote, modify, or reject each pitch before locking the capability manifest.

---

## Phase 2: Interactive Engineer Grill Protocol

Use `ask_question` cleanly (one logical batch per decision axis, without adding a synthetic "Other" option) to resolve architectural choices:

1. **Operating Mode (AI vs. Deterministic Parity)**:
   * *Zero-AI Deterministic* : Zero LLM API keys, zero token cost, sub-100ms latency. Full Telegram bot (commands, FSM wizards, paginated inline dashboards, `@bot` inline queries, deep-link 2FA binding, alerts, file import/export, Stars/Payments, pure Mini Apps) plus typed deterministic MCP/ACP capability endpoints.
   * *Hybrid (Recommended for growing apps)* : Deterministic commands, FSM menus, and alerts work out of the box with no API key, plus optional LLM streaming and natural-language routing when `LLM_API_KEY` is present.
   * *Full Agentic* : LLM-driven natural-language reasoning, `sendMessageDraft` token streaming, Voice-to-Action, and autonomous MCP/ACP tool loops.
2. **Integration Mode**:
   * *New App (Surface-First Core)* : Build `core/` capability registry, policy engine, and event bus first; mount `surfaces/mcp`, `surfaces/acp`, and `surfaces/telegram` directly.
   * *Existing App (Non-Invasive Strangler Sidecar)* : Leave existing REST/GraphQL/UI untouched; wrap existing service layer behind a thin Capability Adapter sidecar.
3. **Target Surfaces & Protocol Roles**:
   * **MCP**: Server only (tools/resources/prompts), Client only (consume downstream MCPs), or Dual (expose tools + consume upstream tools).
   * **ACP**: ACP Agent (discoverable inside Zed, JetBrains, Neovim, Antigravity), ACP Client (spawn specialist sub-agents), or Dual + Self-Mount.
   * **Telegram**: Zero-AI Ops & Wizard Bot, Paginated Dashboard / Inline Search, Stars Payments, Pure Mini App (TMA), Topic-per-Session Streamer, or Pocket Gatekeeper approval relay.
4. **Language / SDK Ecosystem**:
   * TypeScript / Node / Edge (`@modelcontextprotocol/sdk`, `@agentclientprotocol/sdk`, `grammY`, `zod`)
   * Python (`mcp`, `agent-client-protocol`, `aiogram` v3, `pydantic`)
   * Rust (`rmcp`, `agent-client-protocol` + `agent-client-protocol-rmcp`, `teloxide`, `schemars`)
   * Go (`mcp` Go SDK, `acp-go-sdk`, `telego`)
5. **Runtime Opportunity Prompting**: Whenever the engineer adds new routes, DB tables, jobs, or webhooks later, instruct generated agents/docs to re-run the Opportunity Scanner and grill the engineer on projecting them into both Zero-AI Telegram triggers and agentic surfaces.

---

## Phase 3: Extensible Capability Core & Surface Adapter Contract

Every capability registers a canonical descriptor inside `core/`:
* **Identity & Intent**: `id`, `title`, `description`, `tags`.
* **Typed Input & Output Schemas**: Authoritative JSON Schema source (`zod`, `pydantic`, `schemars`, Go structs) : compiled automatically into both MCP JSON Schema AND Zero-AI Telegram FSM wizard steps!
* **Risk Tier**:
  * `auto-allow` : Pure reads, status checks, non-destructive lookups. Execute immediately across all authorized surfaces.
  * `pocket-approve` : State mutations, billing, deploys, external writes, destructive deletes. Intercepted by `ApprovalBroker` and routed to IDE permission modal and/or signed Telegram `[Approve]/[Deny]` inline cards with strict TTL expiry.
  * `deny` : Blocked from remote invocation.
* **Execution Hints**: `idempotent` flag, `supportsStreaming` boolean, `estimatedDurationMs` (routes automatically to sync reply vs. MCP Async Task + draft stream).

**Surface Adapter Contract**: Every surface implements `registerCapabilities(caps)`, `start()`, `stop()`, `onProgress(event)`, and `requestApproval(request)`. Adding a 4th surface (e.g., A2A, Slack, Discord, Voice) requires implementing only those 5 lifecycle hooks. See `references/capability-core.md` for complete TypeScript and polyglot contracts.

---

## Phase 4: Surface Architecture Deep-Dives

### Surface A: MCP (2026-07-28 Specification Standard)
* **Stateless Streamable HTTP + `stdio`**: Bind local `stdio` for CLI/IDE desktop workflows and stateless Streamable HTTP for cloud/edge deployments. Propagate `Mcp-Method` and `Mcp-Name` HTTP headers so API gateways and load balancers route and authorize requests without full JSON-RPC deserialization; support Multi Round-Trip Requests (MRTR) without sticky sessions.
* **Elicitation (Structured Input & Safe Auth)**:
  * Use **Form Mode** (JSON Schema validated) for non-sensitive missing parameters mid-tool call.
  * NEVER collect passwords, API keys, or payment secrets via Form Mode. Always use **URL Mode** so the host opens a verifiable external browser flow with explicit origin visibility.
* **Sampling & Async Tasks**: Use Sampling when a server-side capability needs host LLM synthesis, and emit Async Tasks (`tasks/get`, progress tokens, cancellation support) for any operation exceeding 3 seconds so HTTP requests never time out.
* **Enterprise OAuth 2.1 Perimeter (Remote HTTP)**: Expose RFC 9728 Protected Resource Metadata (`/.well-known/oauth-protected-resource`) with `authorization_servers`, enforce PKCE (`S256`), bind tokens via RFC 8707 `resource` indicators, verify `aud` strictly on every request, prefer Client ID Metadata Documents (CIMD) over unauthenticated Dynamic Client Registration, and NEVER pass raw user tokens blindly through to downstream APIs.

### Surface B: ACP (JSON-RPC 2.0 Live Sessions)
* **Session Lifecycle**: Handle `initialize` (version negotiation + capability advertisement) -> optional `authenticate` -> `session/new` / `session/load` -> `session/prompt` -> streaming `session/update` notifications (thoughts, plans, diffs, tool calls) -> `session/cancel`.
* **Self-Mounting MCP-in-ACP**: Inside `session/new`, auto-inject the application's own MCP server entry into `params.mcpServers[]` so any ACP host connecting to the app immediately inherits its structured MCP tools with zero manual user wiring.
* **Human-in-the-Loop Permissions (`session/request_permission`)**: Pause before any `pocket-approve` capability executes and issue `session/request_permission` back to the client (binding `toolCall` for v1 clients and rich `title`, `description`, and structured subject metadata for v2 clients). Route timeouts or headless runs through the Telegram Pocket Gatekeeper when configured.
* **Dual Roles & ACP Registry**: Support hosting as an ACP Agent (publishable to the ACP Registry for Zed, JetBrains, Neovim, and Antigravity discovery) and/or acting as an ACP Client to delegate subtasks to external specialist coding agents.

### Surface C: Telegram (Deterministic Zero-AI + Agentic Bot API 9.3 to 9.5+)

#### 1. Deterministic Zero-AI Primitives (No LLM Key Required)
Full architectural breakdown and polyglot FSM/router skeletons live in `references/telegram-deterministic.md`:
* **Typed Command Router & Scoped Menus (`setMyCommands`)**: Auto-register role-scoped command menus (`BotCommandScopeDefault` vs. admin `BotCommandScopeChat`), flag/argument parsing, and auto-generated `/help` from the Capability Registry.
* **FSM Multi-Step Form Wizards**: Compile multi-field `inputSchema` definitions into stateful step-by-step chat prompts with enum inline buttons, `[Back]` / `[Cancel]` controls, immediate per-field validation, and a confirmation card before execution.
* **Paginated Inline Keyboards & In-Place Dashboards**: Compact `callback_data` tokens (`<= 64` bytes, e.g. `aw:list:orders:p2`) driving `editMessageText` / `editMessageReplyMarkup` for browsing tables, toggling flags, and drilling into items without message spam.
* **Inline Queries (`@BotName <query>`)**: Instant DB/catalog search from *any* chat without adding the bot to a group (`answerInlineQuery` returning `InlineQueryResultArticle` cards).
* **Deep Linking (`t.me/Bot?start=<token>`) & Account / 2FA Binding**: Single-use nonce links (`start=link_<nonce>`, 5m TTL) binding web users to Telegram IDs for passwordless 2FA approval prompts and user-scoped alerts.
* **Proactive Alerts, Cron Digests & Actionable Ops Buttons**: Push webhooks and scheduled reports with deterministic remediation buttons (`[Retry]`, `[Acknowledge]`, `[Silence 1h]`) inside a `retry_after` flood-safe outbound queue.
* **Media, Document Import/Export & Native Payments**: Inbound `getFile` with strict MIME/size guards, outbound `sendDocument`/`sendPhoto` reports, and zero-AI `sendInvoice` (`XTR` Telegram Stars or provider tokens) + 10s `pre_checkout_query` + `successful_payment` fulfillment.
* **Pure-Frontend Telegram Mini Apps (TMAs)**: Mount existing web dashboards/forms inside Telegram with server-side HMAC-SHA256 `initData` validation (`WebAppData` + `BOT_TOKEN`) and zero AI requirement.

#### 2. Agentic & Hybrid Primitives (When LLM Mode Enabled)
* **Fluid Token Streaming (`sendMessageDraft`)**: Stream partial tokens smoothly via native draft messages (`sendMessageDraft` / `sendMessageTextDraftAction`) instead of calling `editMessageText` in tight loops, preventing 429 rate-limit lockouts and notification spam.
* **Forum Topic-per-Session Multiplexing**: Create one Telegram Forum Topic per active ACP `session/new`, async MCP Task, or deterministic ops stream inside an allowlisted supergroup; messages posted in an active agent thread inject directly as follow-up `session/prompt` or live steering guidance.
* **Guest Mode & Bot-to-Bot Handoffs**: Support `@username` Guest Mode mentions (receiving only tagged thread context without reading historical chat logs) and opt-in Bot-to-Bot delegation when multiple specialized bots collaborate.

#### 3. Hardened Telegram Security Perimeter (All Modes)
* Enforce `allowed_user_ids` and `allowed_chat_ids` allowlists in middleware before any parser runs (or explicit authenticated public/linked-user policy when intentionally user-facing).
* Validate `X-Telegram-Bot-Api-Secret-Token` on webhook endpoints with constant-time comparison.
* HMAC-sign inline `callback_data` tokens bound to `requestId`, actor scope, and expiry timestamp; delete/invalidate markup on resolution to block replay.

---

## Phase 5: Highlight Creative Patterns Cookbook

Full wire traces, state machines, and scanner scripts live in `references/creative-playbooks-and-grill.md` and `references/telegram-deterministic.md`:
1. **Pocket Gatekeeper (ACP/MCP -> Telegram Live Approval Bridge)**: Pause live IDE or MCP mutations on `pocket-approve`, push exact parameter diff + impact preview to Telegram with `[Approve Once]`, `[Approve Session]`, `[Deny + Steer]`, and resolve cleanly.
2. **Zero-AI CI/CD & Web-App 2FA Gatekeeper**: Identical signed inline approval flow triggered by deploy pipelines or high-risk web admin actions : 100 percent deterministic, zero LLM calls.
3. **Schema-Driven FSM Wizard + Paginated Browser**: Auto-generate multi-step Telegram forms and `< Prev | Page X/Y | Next >` inline tables straight from existing backend Zod/Pydantic/JSON schemas.
4. **Topic-per-Session Multiplexer**: Bidirectional bridge mapping `sessionId <-> message_thread_id` (plus deterministic `#deploys` / `#billing` routing).
5. **Self-Mounting MCP-in-ACP**: Zero-config `session/new` loop wiring the app's own MCP toolset directly inside its ACP session initialization.
6. **Voice-to-Action & TMA Mission Control**: Spoken ops commands (Agentic) alongside shared pure-frontend Mini App dashboards (Zero-AI or Hybrid).

---

## Phase 6: Polyglot Package & Retrofit Matrix

Detailed starter layouts for both **New Apps** and **Existing App Strangler Sidecars** across all 4 Tier-1 ecosystems live in `references/polyglot-blueprints.md` and `references/telegram-deterministic.md`:

| Stack | MCP SDK | ACP SDK | Telegram SDK | Validation |
| :--- | :--- | :--- | :--- | :--- |
| **TypeScript / Node / Edge** | `@modelcontextprotocol/sdk` | `@agentclientprotocol/sdk` | `grammY` | `zod` |
| **Python 3.10+** | `mcp` | `agent-client-protocol` | `aiogram` v3 | `pydantic` |
| **Rust 1.85+** | `rmcp` | `agent-client-protocol` + `agent-client-protocol-rmcp` | `teloxide` | `schemars` + `serde` |
| **Go 1.25+** | MCP `go-sdk` | `acp-go-sdk` | `telego` | Struct tags + JSON Schema |

---

## Phase 7: Verification Harness & Smoke Tests

Verify every enabled surface (and verify Zero-AI / Hybrid apps function completely with `LLM_API_KEY` unset):
1. **MCP Surface**: Inspect and invoke tools/resources with `npx @modelcontextprotocol/inspector`; verify `/.well-known/oauth-protected-resource` returns 200 and unauthenticated HTTP requests return `401` with bearer challenge (when remote auth is active).
2. **ACP Surface**: Pipe `initialize` and `session/new` over stdio JSON-RPC; assert `protocolVersion` handshake succeeds, self-mounted `mcpServers[]` registers cleanly, and `pocket-approve` tools emit `session/request_permission`.
3. **Telegram Zero-AI & Agentic Surface**: With `LLM_API_KEY` unset, verify `/start` (plus `start=link_` deep link), scoped `/help`, one complete FSM wizard round-trip, paginated `editMessageText` navigation, `@bot` inline query results, unauthorized user ID drop, `403` on bad webhook secret, and fail-closed replay rejection on signed approval callbacks. When Agentic/Hybrid streaming is active, verify `sendMessageDraft` bursts stay flood-safe without 429 errors.
4. **Environment Hygiene**: Store `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USER_IDS`, `MCP_OAUTH_ISSUER`, `ACP_AUTH_TOKEN`, and optional `LLM_API_KEY` strictly in `.env` with complete templates in `.env.example`.

## Directives

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
* **Adaptive Discovery First**: Always run the Phase 0 Scrutiny Dial before designing capabilities; ask explicitly about Zero-AI Deterministic vs. Hybrid vs. Agentic mode rather than assuming AI budget or API keys.
* **Fail-Closed Gatekeeping**: Sensitive mutations on `pocket-approve` must reject on timeout, signature mismatch, or unauthorized user ID without exception.
* **URL-Mode Only for Secrets**: Never elicit credentials, tokens, or payment fields over MCP Form Mode or unencrypted chat messages.
