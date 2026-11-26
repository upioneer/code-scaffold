# AgentWire Zero-AI Deterministic Telegram Architecture & Polyglot Guide

Not every application needs an LLM, an AI API key, or unpredictable token spend. When an engineer selects **Zero-AI Deterministic** (or **Hybrid**), the exact same Domain Capability Core powers a sub-100ms, 100 percent predictable, zero-token-cost Telegram surface using native Bot API primitives.

---

## 1. Operating Mode Matrix

| Dimension | Zero-AI Deterministic | Hybrid (Recommended) | Full Agentic (LLM) |
| :--- | :--- | :--- | :--- |
| **LLM API Key Required** | None (`$0` token spend) | Optional (degrades cleanly when unset) | Required |
| **Invocation Mechanism** | Slash `/commands`, FSM wizards, inline buttons, `@bot` queries, webhooks | Deterministic UI for core ops + NLP/streaming when prompted | Natural-language intent, voice notes, ACP/MCP autonomous turns |
| **Latency & Determinism** | Sub-100ms, 100 percent repeatable | Instant menus + streamed AI fallback | Model-bound inference latency |
| **Upgrade Path** | Register capabilities once; turn on Agentic/MCP later with zero core rewrite | Already dual-mode | Same core |

---

## 2. Ten Mature Non-Agentic Telegram Patterns

### 1. Typed Command Router & Scoped BotFather Menus (`setMyCommands`)
* Auto-generate `/help` and register BotFather autocomplete menus directly from `CapabilityRegistry.listCapabilities()`.
* Use **scoped menus**: expose safe commands (`/status`, `/help`, `/orders`) via `BotCommandScopeDefault`, and unlock admin/ops commands (`/migrate`, `/refund`, `/deploy`) only for allowlisted operators via `BotCommandScopeChat`.
* Parse positional arguments and flags directly against the capability's typed schema (`/status prod --window=15m`) with instant usage errors on invalid types.

### 2. FSM Multi-Step Form Wizards (Zero-AI Parameter Collection)
* Convert any multi-field `inputSchema` (Zod, Pydantic, Schemars, Go struct) into a deterministic step-by-step Finite State Machine (FSM) wizard.
* Step 1 prompts for field 1 (rendering `enum` options as clickable inline buttons so users never mistype).
* Include persistent `[Back]` and `[Cancel]` buttons on every step, validate each answer immediately against the field schema, and render a final summary card with `[Confirm & Run]` before mutating state.

### 3. Paginated Inline Keyboards & In-Place Dashboards
* Replace multi-message spam with **single-message in-place dashboards** updated via `editMessageText` and `editMessageReplyMarkup`.
* Encode view state compactly inside `callback_data` (always <= 64 bytes UTF-8!), e.g. `aw:list:jobs:p2` or `aw:tog:dark_mode:1`.
* Build sortable lists, `< Prev | Page 2/7 | Next >` pagination bars, instant feature-flag toggles (`[Feature X: ON]`), and drill-down detail views purely through state callbacks.

### 4. Inline Queries (`@BotName <query>`)
* Let authenticated users query app records from *inside any chat* without adding the bot to the group or giving it message read permissions.
* Handle `inline_query` updates by running fast DB/search queries (`auto-allow` capabilities) and calling `answerInlineQuery` with `InlineQueryResultArticle` cards (order summaries, build statuses, shareable links, KB snippets).

### 5. Deep Linking (`t.me/Bot?start=<token>`) & Account / 2FA Binding
* Bind a web app user ID cleanly to a Telegram `user_id` with zero passwords in chat:
  1. Web app generates a single-use cryptographic nonce (128-bit hex, 5m TTL) stored in DB/Redis.
  2. UI renders a one-click link: `https://t.me/YourAppBot?start=link_<nonce>`.
  3. Telegram delivers `/start link_<nonce>` to your webhook; server verifies nonce, binds `telegramUserId <-> appUserId`, and activates instant passwordless 2FA login alerts and personal notifications.

### 6. Proactive Alerts, Cron Digests & Actionable Ops Buttons
* Push webhook events (failed payments, CI build failures, disk warnings) and scheduled cron summaries (daily revenue, nightly backup checks) straight to allowlisted ops chats.
* Attach deterministic one-tap remediation buttons (`[Retry Job #402]`, `[Acknowledge Alert]`, `[Silence 1h]`, `[Rollback Release]`).
* **Flood-Safe Outbound Queue**: Wrap proactive sends in a rate-limited queue honoring Telegram `429 Too Many Requests` `parameters.retry_after` headers and per-chat burst limits (~1 msg/sec/chat, 30 msgs/sec global).

### 7. Files, Media & Document Pipelines
* **Inbound Uploads**: Accept CSV imports, PDFs, JSON configs, or diagnostic photos from allowlisted users via `getFile` -> download URL -> enforce strict MIME allowlist and `maxFileSizeBytes` before routing into `core/` handlers.
* **Outbound Exports**: Stream generated CSV reports, PDF invoices, log archives, or rendered PNG charts back cleanly with `sendDocument`, `sendPhoto`, and `sendMediaGroup` albums.

### 8. Native Payments & Telegram Stars (`XTR`)
* Sell digital goods, subscriptions, API credits, or physical orders completely natively inside chat with zero AI:
  1. Call `sendInvoice` (use currency `"XTR"` with `provider_token: ""` for Telegram Stars digital goods, or configure your payment provider token for fiat).
  2. Respond synchronously within **10 seconds** to `pre_checkout_query` (`answerPreCheckoutQuery(id, true)` after checking inventory/eligibility).
  3. Fulfill deterministically on `successful_payment` (store `telegram_payment_charge_id` for idempotency and `/refund` via `refundStarPayment`).

### 9. Telegram Mini Apps (TMAs) as Pure App Frontends
* Ship full interactive web UIs (tables, calendars, billing dashboards, charts, multi-field CRUD forms) inside Telegram with zero LLM API keys.
* Authenticate every TMA request server-side via HMAC-SHA256 `initData` signature check (`WebAppData` + `BOT_TOKEN`) plus `auth_date` freshness window.

### 10. Non-AI Human Gatekeeper & Support Topic Routing
* Use Telegram purely as a **deterministic human approval and routing control plane**:
  * **CI/CD & Admin 2FA Gates**: GitHub Actions / deploy scripts or web admin payouts call an internal HTTP endpoint that pushes a signed Telegram inline approval card (`[Approve] [Deny]`) and blocks until resolved or TTL expires.
  * **Forum Topic Routing**: Route app events deterministically into named supergroup topics (`#deploys`, `#billing`, `#audit-log`, `#ticket-402`) cleanly without an agent.

---

## 3. Polyglot Zero-AI Starter Skeletons (Zero LLM Dependencies)

### TypeScript (`grammY` + Session FSM + Pagination + Inline Query)
```typescript
import { Bot, InlineKeyboard, session } from "grammy";

type WizardState = { step?: "await_invoice" | "await_amount"; invoiceId?: string };
const bot = new Bot<any>(process.env.TELEGRAM_BOT_TOKEN!);
bot.use(session({ initial: (): WizardState => ({}) }));

// 1. Scoped menu registration (zero AI)
await bot.api.setMyCommands([
  { command: "status", description: "Check live service health" },
  { command: "refund", description: "Launch step-by-step refund wizard" },
  { command: "orders", description: "Browse recent orders (paginated)" },
]);

// 2. Deep-link account / 2FA binding: t.me/Bot?start=link_<nonce>
bot.command("start", async (ctx) => {
  const payload = ctx.match?.trim();
  if (payload?.startsWith("link_")) {
    const ok = await accountLinker.verifyNonce(payload.slice(5), ctx.from!.id);
    return ctx.reply(ok ? "Account linked! Instant 2FA alerts enabled." : "Link expired.");
  }
  await ctx.reply("Welcome. Use /orders or /refund to begin.");
});

// 3. Deterministic Multi-Step FSM Wizard
bot.command("refund", async (ctx) => {
  ctx.session.step = "await_invoice";
  await ctx.reply("Step 1/2 : Enter the invoice ID (e.g. in_981):");
});

bot.on("message:text", async (ctx, next) => {
  if (ctx.session.step === "await_invoice") {
    ctx.session.invoiceId = ctx.message.text.trim();
    ctx.session.step = "await_amount";
    return ctx.reply(`Step 2/2 : Enter refund cents for ${ctx.session.invoiceId}:`);
  }
  if (ctx.session.step === "await_amount") {
    const cents = Number(ctx.message.text.trim());
    if (!Number.isInteger(cents) || cents <= 0) return ctx.reply("Enter a valid positive integer.");
    const inv = ctx.session.invoiceId!;
    ctx.session = {};
    const kb = new InlineKeyboard()
      .text("Confirm Refund", `aw:ref:${inv}:${cents}`)
      .text("Cancel", "aw:cancel");
    return ctx.reply(`Review Refund\nInvoice: ${inv}\nAmount: ${cents} cents`, { reply_markup: kb });
  }
  await next();
});

// 4. Paginated Inline Keyboard Dashboard
bot.command("orders", async (ctx) => renderOrdersPage(ctx, 1, false));
bot.callbackQuery(/^aw:ord:p(\d+)$/, async (ctx) => {
  await renderOrdersPage(ctx, Number(ctx.match[1]), true);
  await ctx.answerCallbackQuery();
});

async function renderOrdersPage(ctx: any, page: number, edit: boolean) {
  const { items, totalPages } = await appService.listOrders(page, 5);
  const text = `Orders (Page ${page}/${totalPages})\n` + items.map((o: any) => `* ${o.id} : $${o.total}`).join("\n");
  const kb = new InlineKeyboard();
  if (page > 1) kb.text("< Prev", `aw:ord:p${page - 1}`);
  if (page < totalPages) kb.text("Next >", `aw:ord:p${page + 1}`);
  return edit ? ctx.editMessageText(text, { reply_markup: kb }) : ctx.reply(text, { reply_markup: kb });
}

// 5. Instant @BotName Inline Query Search
bot.on("inline_query", async (ctx) => {
  const hits = await appService.searchCatalog(ctx.inlineQuery.query.trim());
  await ctx.answerInlineQuery(
    hits.slice(0, 10).map((h: any) => ({
      type: "article",
      id: h.id,
      title: h.title,
      description: h.summary,
      input_message_content: { message_text: `${h.title}\n${h.url}` },
    })),
    { cache_time: 10, is_personal: true }
  );
});
```

### Python (`aiogram` v3 `StatesGroup` FSM + `CallbackData` Factory)
```python
from aiogram import Router, F, types
from aiogram.filters import Command, CommandStart, CommandObject
from aiogram.filters.callback_data import CallbackData
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder

router = Router()

class RefundWizard(StatesGroup):
    invoice_id = State()
    amount_cents = State()

class PageCb(CallbackData, prefix="pg"):
    view: str
    page: int

@router.message(CommandStart(deep_link=True))
async def on_deep_link(message: types.Message, command: CommandObject):
    token = command.args or ""
    if token.startswith("link_") and await verify_link_nonce(token[5:], message.from_user.id):
        await message.answer("Account bound for passwordless 2FA & ops alerts.")

@router.message(Command("refund"))
async def start_refund(message: types.Message, state: FSMContext):
    await state.set_state(RefundWizard.invoice_id)
    await message.answer("Step 1/2 : Enter invoice ID:")

@router.message(RefundWizard.invoice_id)
async def step_invoice(message: types.Message, state: FSMContext):
    await state.update_data(invoice_id=message.text.strip())
    await state.set_state(RefundWizard.amount_cents)
    await message.answer("Step 2/2 : Enter refund amount in cents:")

@router.callback_query(PageCb.filter())
async def paginate(query: types.CallbackQuery, callback_data: PageCb):
    text, markup = await render_page(callback_data.view, callback_data.page)
    await query.message.edit_text(text, reply_markup=markup)
    await query.answer()
```

### Rust (`teloxide` `BotCommands` + `Dialogue` FSM)
* Derive `#[derive(BotCommands, Clone)]` for typed commands (`/status`, `/refund`, `/orders`) and `#[derive(Clone, Default)] enum State { #[default] Idle, AwaitInvoice, AwaitAmount { invoice_id: String } }` inside `teloxide::dispatching::dialogue::InMemStorage`.
* Route commands, dialogue states, `CallbackQuery`, `InlineQuery`, and `PreCheckoutQuery` deterministically through `dptree::entry()` with zero AI dependencies.

### Go (`telego` Router + Flood-Safe Broadcaster)
* Register command handlers and `CallbackQuery` prefix routers on `th.NewBotHandler(...)` and wrap scheduled/webhook alerts in a worker channel that inspects `apierrors.Error.Parameters.RetryAfter` to sleep cleanly before retry.
