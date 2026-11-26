# AgentWire Multi-Surface Engine

**Version:** 1

**Target:** `.skills/agentwire`

**Category:** AI, MCP & Developer Tools

**Keywords:** `agentwire`, `multi-surface-agent`, `mcp-server`, `acp-protocol`, `agent-client-protocol`, `telegram-bot`, `zero-ai-bot`, `fsm-wizards`, `inline-keyboards`, `telegram-payments`, `streamable-http`, `model-context-protocol`, `pocket-approvals`, `send-message-draft`, `telegram-mini-apps`, `oauth-2-1`, `elicitation`, `capability-core`, `surface-adapter`, `json-rpc`, `human-in-the-loop`, `session-permissions`, `agent-control-plane`, `mcp-in-acp`, `forum-topics`, `voice-to-action`, `app-retrofitting`, `polyglot-sdk`, `agent-bridge`, `live-streaming`

## Description
Extensible multi-surface wiring engine that projects any new or existing application onto Model Context Protocol (MCP), Agent Client Protocol (ACP), and Telegram (both Zero-AI deterministic bots and AI-powered streaming agents) from a single typed capability core, pairing adaptive codebase opportunity grilling with unified human-in-the-loop gatekeeping.

## Capabilities & Use Cases
* **Single Domain Capability Core** : Author each capability schema, risk tier, and execution contract once (`zod`, `pydantic`, `schemars`, or Go structs) and project it cleanly across MCP, ACP, and Telegram with zero schema drift.
* **Zero-AI Deterministic Telegram Mode** : Ship full production Telegram bots with zero LLM API keys, zero token spend, and sub-100ms latency using typed `/commands`, role-scoped BotFather menus (`setMyCommands`), schema-driven FSM multi-step form wizards, paginated inline dashboards (`editMessageText`), `@bot` inline search queries, `t.me/Bot?start=` account/2FA linking, flood-safe cron/webhook alert digests, document/media pipelines (`getFile`/`sendDocument`), native Telegram Stars & fiat payments (`sendInvoice`), and pure-frontend Mini Apps.
* **Hybrid & Incremental AI Upgrade Path** : Guarantee every core command, wizard, alert, and approval keeps running deterministically even when no LLM key is configured, while layering natural-language routing and live streaming on top whenever an AI provider is enabled.
* **Extensible Surface Adapter Contract** : Decouples domain business logic behind a five-method `SurfaceAdapter` lifecycle interface so MCP, ACP, and Telegram ship immediately while future channels (A2A, Slack, Discord, Voice, Webhooks) plug in cleanly without core rewrites.
* **Adaptive Scrutiny Dial & Codebase Scanner** : Prompts engineers upfront to choose their audit depth (Surgical Fast-Track, Adaptive Repo Scan & Grill, or Deep Adversarial Architect) plus Operating Mode (`Zero-AI` / `Hybrid` / `Agentic`), inspects routes, schemas, cron jobs, webhooks, and CLIs, and pitches three to five concrete unasked-for workflows grounded in real repository files.
* **Modern MCP Surface (2026-07-28 Spec)** : Implements stateless Streamable HTTP with header-based method routing (`Mcp-Method`, `Mcp-Name`) alongside local `stdio`, Form-Mode and URL-Mode Elicitation, server-initiated Sampling, Async Tasks, and strict OAuth 2.1 protection (RFC 9728 metadata, PKCE S256, RFC 8707 audience binding, and CIMD).
* **Native ACP Surface (JSON-RPC 2.0)** : Supports `initialize`, `session/new`, `session/prompt`, streaming `session/update` notifications, `session/request_permission`, and dual Agent/Client roles discoverable in Zed, JetBrains, Neovim, and Antigravity.
* **Self-Mounting MCP-in-ACP** : Automatically registers the application's own MCP endpoint inside ACP `session/new` (`mcpServers[]`) so connected editors immediately inherit structured domain tools with zero manual config.
* **Agentic Telegram & Pocket Gatekeeper** : Streams live AI tokens via native `sendMessageDraft` without edit rate-limit lockouts, multiplexes Forum Topics 1:1 to live sessions, supports `@username` Guest Mode and Bot-to-Bot handoffs, and bridges ACP/MCP/CI `pocket-approve` mutations to HMAC-signed inline Telegram buttons with fail-closed TTL expiration.
* **Full Polyglot & Retrofit Blueprints** : Includes production starter architectures (both AI and Zero-AI) for new Surface-First apps and non-invasive Strangler Sidecar retrofits across TypeScript, Python, Rust, and Go.
* **Interactive Protocol & Wiring Studio Sandbox** : Browser-native control-plane simulator demonstrating capability projection, Zero-AI vs. Hybrid vs. Agentic Telegram modes, Pocket Gatekeeper JSON-RPC + FSM wizard walkthroughs, Scrutiny Dial pitching, and security smoke tests.

## Usage
Invoke this skill when adding MCP, ACP, and Telegram support (deterministic Zero-AI or AI-powered) to a new or existing application. Start with the Phase 0 Adaptive Scrutiny Dial in `SKILL.md` to choose scan depth and Operating Mode, review tailored capability pitches against the target repo, and generate polyglot adapters from `references/`.

## Changelog
* **v1** : Initial release of AgentWire Multi-Surface Engine establishing the single Domain Capability Core, Zero-AI Deterministic Telegram architecture (FSM wizards, paginated inline keyboards, inline queries, deep-link 2FA, files, Stars payments, alerts, and pure-frontend Mini Apps), extensible Surface Adapter Contract, Adaptive Scrutiny Dial and codebase opportunity scanner, 2026 MCP / ACP / Telegram specifications, Pocket Gatekeeper cross-surface approvals, polyglot blueprints, and Interactive Protocol & Wiring Studio sandbox
