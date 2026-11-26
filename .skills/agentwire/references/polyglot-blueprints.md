# AgentWire Polyglot Package & Retrofit Blueprints

Concrete package recommendations, project layouts, and idiomatic starter skeletons across **TypeScript**, **Python**, **Rust**, and **Go** for both **New Apps (Surface-First Core)** and **Existing Apps (Strangler Sidecar)**.

---

## 1. Two Structural Integration Strategies

### Pattern A: New App (Surface-First Core)
```text
my-app/
├── src/
│   ├── core/
│   │   ├── registry.ts        # CapabilityDefinition[] (single source of truth)
│   │   ├── policy.ts          # RiskTier + ApprovalBroker + RBAC scopes
│   │   └── event-bus.ts       # ProgressEvent multiplexer
│   ├── surfaces/
│   │   ├── mcp/               # Streamable HTTP + stdio + OAuth 2.1 metadata
│   │   ├── acp/               # JSON-RPC 2.0 Agent + self-mounted mcpServers[]
│   │   └── telegram/          # Draft streamer + Forum Topics + Inline Approvals + TMA
│   └── main.ts                # Single entrypoint wiring core + selected surfaces
├── .env.example
└── package.json
```

### Pattern B: Existing App (Non-Invasive Strangler Sidecar)
Leave existing controllers, ORMs, auth, and frontend bundles untouched. Mount an `agentwire/` sidecar directory (or standalone sidecar service talking to internal service functions or localhost gRPC/HTTP) that imports existing business services and projects them onto MCP, ACP, and Telegram:
```text
existing-app/
├── src/                       # Untouched production routes, models, workers
└── agentwire/                 # Isolated AgentWire bridge
    ├── capabilities/          # Thin typed wrappers calling ../../src/services/*
    ├── broker.ts              # Pocket Gatekeeper + TTL + audit ledger
    └── surfaces/              # mcp.ts | acp.ts | telegram.ts
```

---

## 2. TypeScript / Node.js / Edge Blueprint

### Packages
* **MCP**: `@modelcontextprotocol/sdk`, `zod`
* **ACP**: `@agentclientprotocol/sdk`
* **Telegram**: `grammy` (optional plugins: `@grammyjs/ratelimiter`, `@grammyjs/runner`)
* **HTTP / Edge**: `hono` or `express`

### Skeleton (`surfaces/mcp.ts` + `surfaces/acp.ts` + `surfaces/telegram.ts`)
```typescript
import crypto from "node:crypto";
import { Bot, InlineKeyboard } from "grammy";
import { z } from "zod";
// Streamable HTTP MCP transport & ACP SDK agent bindings map capabilities directly:

export function signCallback(requestId: string, outcome: string, exp: number, secret: string): string {
  const sig = crypto.createHmac("sha256", secret).update(`${requestId}:${outcome}:${exp}`).digest("hex").slice(0, 16);
  return `aw:${requestId}:${outcome}:${exp}:${sig}`;
}

export function verifyCallback(data: string, secret: string): { requestId: string; outcome: string } | null {
  const parts = data.split(":");
  if (parts.length !== 5 || parts[0] !== "aw") return null;
  const [, requestId, outcome, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  const expected = crypto.createHmac("sha256", secret).update(`${requestId}:${outcome}:${exp}`).digest("hex").slice(0, 16);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return { requestId, outcome };
}

export function createTelegramSurface(botToken: string, allowedUserIds: Set<number>, hmacSecret: string, broker: any) {
  const bot = new Bot(botToken);

  // Fail-closed perimeter middleware: drop unauthorized actors before parsing
  bot.use(async (ctx, next) => {
    if (!ctx.from || !allowedUserIds.has(ctx.from.id)) return;
    await next();
  });

  bot.on("callback_query:data", async (ctx) => {
    const verified = verifyCallback(ctx.callbackQuery.data, hmacSecret);
    if (!verified) {
      await ctx.answerCallbackQuery({ text: "Approval expired or invalid signature.", show_alert: true });
      return;
    }
    const resolved = broker.resolveApproval(verified.requestId, {
      outcome: verified.outcome,
      decidedBy: `telegram:${ctx.from.id}`,
      surface: "telegram",
      ttlMs: 15 * 60 * 1000,
    });
    await ctx.answerCallbackQuery({ text: resolved ? `Recorded: ${verified.outcome}` : "Already resolved." });
    if (resolved) {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    }
  });

  return { bot };
}
```

### Streaming Draft Helper (Bot API 9.3+ `sendMessageDraft`)
```typescript
export async function streamDraftReply(bot: Bot, chatId: number, threadId: number | undefined, stream: AsyncIterable<string>) {
  let buffer = "";
  let lastFlush = 0;
  const draftId = Math.floor(Math.random() * 1_000_000) + 1;

  for await (const delta of stream) {
    buffer += delta;
    const now = Date.now();
    if (now - lastFlush >= 300) {
      await bot.api.raw.sendMessageDraft({
        chat_id: chatId,
        draft_id: draftId,
        text: buffer.slice(0, 4000),
        ...(threadId ? { message_thread_id: threadId } : {}),
      });
      lastFlush = now;
    }
  }
  await bot.api.sendMessage(chatId, buffer.slice(0, 4096), threadId ? { message_thread_id: threadId } : undefined);
}
```

---

## 3. Python 3.10+ Blueprint

### Packages
* **MCP**: `mcp` (with FastAPI/Starlette for Streamable HTTP + OAuth resource metadata)
* **ACP**: `agent-client-protocol`
* **Telegram**: `aiogram>=3.20`
* **Validation**: `pydantic>=2.7`

### Idiomatic Adapter Skeleton (`agentwire/telegram_surface.py` + `acp_surface.py`)
```python
import asyncio, hashlib, hmac, time
from aiogram import BaseMiddleware, Bot, Dispatcher, F, types
from aiogram.utils.keyboard import InlineKeyboardBuilder

class AllowlistMiddleware(BaseMiddleware):
    def __init__(self, allowed_ids: set[int]):
        self.allowed_ids = allowed_ids

    async def __call__(self, handler, event, data):
        user = getattr(event, "from_user", None)
        if not user or user.id not in self.allowed_ids:
            return None
        return await handler(event, data)

async def send_pocket_approval(bot: Bot, chat_id: int, req_id: str, summary: str, secret: bytes, ttl_sec: int = 300):
    exp = int(time.time()) + ttl_sec
    kb = InlineKeyboardBuilder()
    for label, outcome in [("Approve Once", "allow-once"), ("Approve Session", "allow-session"), ("Deny", "deny")]:
        sig = hmac.new(secret, f"{req_id}:{outcome}:{exp}".encode(), hashlib.sha256).hexdigest()[:16]
        kb.button(text=label, callback_data=f"aw:{req_id}:{outcome}:{exp}:{sig}")
    kb.adjust(2, 1)
    await bot.send_message(chat_id, summary, reply_markup=kb.as_markup())
```

---

## 4. Rust 1.85+ Blueprint

### Crates (`Cargo.toml`)
```toml
[dependencies]
rmcp = { version = "0.2", features = ["server", "transport-streamable-http-server", "transport-io"] }
agent-client-protocol = "0.4"
agent-client-protocol-rmcp = "0.4"
teloxide = { version = "0.14", features = ["macros"] }
schemars = "0.8"
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
hmac = "0.12"
sha2 = "0.10"
```

### Architectural Pattern
* Define one `#[derive(Deserialize, JsonSchema)]` struct per capability.
* Bind MCP tools via `rmcp` and mount them inside the ACP Agent `session/new` (`McpServer` builder pattern matching Code Scaffold's native `acp_server.rs` architecture).
* Dispatch `teloxide::dptree` handlers in a background Tokio task sharing an `Arc<ApprovalBroker>` backed by `tokio::sync::oneshot::Sender<ApprovalDecision>`.

---

## 5. Go 1.25+ Blueprint

### Modules
* **MCP**: Official Go MCP SDK (`github.com/modelcontextprotocol/go-sdk`)
* **ACP**: Go ACP SDK (`github.com/coder/acp-go-sdk` or `github.com/Tangerg/acp`)
* **Telegram**: `github.com/mymmrac/telego`

### Architectural Pattern
* Define typed input structs with `jsonschema` tags for single-source schema reflection.
* Run ACP over `stdio` via `acp.NewCommandTransport` or server loop, inject the app's MCP Streamable HTTP endpoint into `NewSessionRequest.McpServers`, and block `RequestPermission` callbacks on a `select { case d := <-ch: ... case <-time.After(ttl): ... }` synchronized across Telegram callbacks.

---

## 6. Required `.env.example` Baseline

```dotenv
# AgentWire Core
AGENTWIRE_SURFACES=mcp,acp,telegram
AGENTWIRE_APPROVAL_TTL_SECONDS=300
AGENTWIRE_CALLBACK_HMAC_SECRET=replace_with_32_byte_hex_secret

# Surface 1: MCP (HTTP / OAuth 2.1)
MCP_TRANSPORT=streamable-http
MCP_PORT=8080
MCP_RESOURCE_URI=https://api.example.com/mcp
MCP_OAUTH_AUTHORIZATION_SERVER=https://auth.example.com

# Surface 2: ACP (Agent Client Protocol)
ACP_TRANSPORT=stdio
ACP_AUTO_MOUNT_MCP=true

# Surface 3: Telegram Bot & Mini App
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ALLOWED_USER_IDS=123456789
TELEGRAM_ALLOWED_CHAT_IDS=-1001234567890
TELEGRAM_MINI_APP_URL=https://app.example.com/tma
```
