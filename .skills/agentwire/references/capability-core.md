# AgentWire Capability Core & Surface Adapter Contract

Every AgentWire integration starts from a **single canonical Domain Capability Core**. Instead of duplicating validation, authorization, and execution code across MCP tools, ACP session turns, and Telegram bot handlers, each domain action is declared once and adapted onto every active surface.

---

## 1. Core Architectural Primitives

### Canonical Capability Definition (TypeScript Reference)

```typescript
import { z } from "zod";

export type RiskTier = "auto-allow" | "pocket-approve" | "deny";

export interface CapabilityContext {
  requestId: string;
  correlationId: string;
  surface: "mcp" | "acp" | "telegram" | string;
  actorId: string;
  scopes: string[];
  signal: AbortSignal;
  emitProgress: (event: ProgressEvent) => Promise<void>;
}

export interface ProgressEvent {
  correlationId: string;
  stage: "thinking" | "plan" | "chunk" | "diff" | "complete" | "error";
  text?: string;
  progress?: number; // 0..1
  artifact?: { name: string; mimeType: string; content: string };
}

export interface CapabilityDefinition<TInput extends z.ZodTypeAny, TOutput> {
  id: string;                 // lowercase snake_case or kebab-case identifier
  title: string;
  description: string;
  tags: string[];
  riskTier: RiskTier;
  idempotent: boolean;
  supportsStreaming: boolean;
  estimatedDurationMs: number;
  requiredScopes: string[];
  inputSchema: TInput;
  execute: (input: z.infer<TInput>, ctx: CapabilityContext) => Promise<TOutput>;
}
```

### How One Definition Compiles to Every Surface

| Core Field | MCP Projection | ACP Projection | Telegram Projection |
| :--- | :--- | :--- | :--- |
| `id` + `description` | Tool `name` & `description` | Exposed inside `mcpServers[]` toolset | `/command` alias + Mini App action button |
| `inputSchema` | JSON Schema `inputSchema`; Form-Mode Elicitation | Parsed parameters rendered in permission modal | Guided wizard prompts or TMA form inputs |
| `riskTier: "pocket-approve"` | Triggers URL/confirm elicitation or ApprovalBroker | Halts turn and emits `session/request_permission` | Sends signed inline card (`[Approve Once] [Approve Session] [Deny]`) |
| `supportsStreaming` + `estimatedDurationMs > 3000` | Async Task (`tasks/get`) + progress notifications | Streams `session/update` notifications | Streams live tokens via `sendMessageDraft` |

---

## 2. Unified Permission Policy Engine & Approval Broker

An autonomous turn on any surface passes through a central `ApprovalBroker` before touching state:

```typescript
export type ApprovalDecision =
  | { outcome: "allow-once"; decidedBy: string; surface: string }
  | { outcome: "allow-session"; decidedBy: string; surface: string; ttlMs: number }
  | { outcome: "deny"; decidedBy: string; surface: string; steeringNote?: string };

export interface ApprovalRequest {
  requestId: string;
  sessionId?: string;
  capabilityId: string;
  summary: string;
  diffOrPayload: string;
  actorId: string;
  ttlMs: number;
  hmacSignature: string;
}

export class ApprovalBroker {
  private pending = new Map<string, {
    resolve: (d: ApprovalDecision) => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
    request: ApprovalRequest;
  }>();

  private sessionAllowlist = new Map<string, number>(); // key: sessionId:capabilityId -> expiresAt

  isSessionApproved(sessionId: string | undefined, capabilityId: string): boolean {
    if (!sessionId) return false;
    const exp = this.sessionAllowlist.get(`${sessionId}:${capabilityId}`);
    return exp !== undefined && Date.now() < exp;
  }

  requestApproval(req: ApprovalRequest): Promise<ApprovalDecision> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(req.requestId);
        // Fail closed on TTL expiry
        resolve({ outcome: "deny", decidedBy: "system:ttl-expired", surface: "broker" });
      }, req.ttlMs);

      this.pending.set(req.requestId, { resolve, reject, timer, request: req });
    });
  }

  resolveApproval(requestId: string, decision: ApprovalDecision): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this.pending.delete(requestId);

    if (decision.outcome === "allow-session" && entry.request.sessionId) {
      this.sessionAllowlist.set(
        `${entry.request.sessionId}:${entry.request.capabilityId}`,
        Date.now() + decision.ttlMs
      );
    }
    entry.resolve(decision);
    return true;
  }
}
```

### Signed Callback & Non-Replay Invariants
* Every external approval button (Telegram inline keyboard, Slack Block Kit action, webhook callback) MUST embed a compact HMAC-SHA256 digest computed over `${requestId}:${outcome}:${actorId}:${expiresAtUnix}`.
* Verify signatures using constant-time comparison (`crypto.timingSafeEqual`).
* First responder wins: once resolved in either the IDE (`session/request_permission`) or Telegram (`callback_query`), `pending.delete(requestId)` ensures duplicate clicks cannot re-trigger execution, and the UI updates the sibling surface ("Approved via Telegram by @engineer").

---

## 3. Shared Streaming Event Bus

Capabilities emit transport-agnostic `ProgressEvent` frames. Each surface subscribes and renders them natively:
* **MCP Adapter**: Buffers final text for synchronous calls, or updates Async Task progress tokens and notifications for long-running jobs.
* **ACP Adapter**: Translates `"thinking"`, `"plan"`, `"chunk"`, and `"diff"` events directly into `session/update` JSON-RPC notifications.
* **Telegram Adapter**: Throttles `"chunk"` deltas into `sendMessageDraft` updates (e.g., every 250ms to 400ms) so users see smooth streaming output on mobile without triggering 429 rate limits, committing the final clean Markdown message on `"complete"`.

---

## 4. Extensible Surface Adapter Contract (Adding a 4th+ Surface)

Because capabilities and approvals depend only on the core interfaces, AgentWire is never locked to three surfaces. Any new channel implements `SurfaceAdapter`:

```typescript
export interface SurfaceAdapter {
  readonly surfaceId: string; // e.g. "mcp", "acp", "telegram", "a2a", "slack", "voice"
  initialize(core: CapabilityRegistry, bus: EventBus, broker: ApprovalBroker): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  deliverProgress(targetId: string, event: ProgressEvent): Promise<void>;
  presentApproval?(request: ApprovalRequest): Promise<void>;
}
```

### Example: Dropping In an A2A or Slack Adapter Later
1. Create `surfaces/slack/` or `surfaces/a2a/` implementing `SurfaceAdapter`.
2. In `initialize`, iterate `core.listCapabilities()` to register Slack slash commands / Block Kit actions or A2A Agent Card skill entries at `/.well-known/agent-card.json`.
3. Subscribe to `broker` events if the new surface can render interactive approvals (`presentApproval`).
4. Register the new adapter in `bootstrap.ts` (or `main.py` / `main.rs` / `main.go`). Zero existing domain handlers or MCP/ACP/Telegram code changes.
