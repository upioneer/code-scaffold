---
​‌‍name: Quiver AI Vector Studio
description: Enterprise vector graphics generation, raster image vectorization, SVG editing, animation, and Model Context Protocol (MCP) agent integrations using Quiver AI Arrow foundation models and REST APIs.
version: 1
---

# Quiver AI Vector Studio

The Quiver AI Vector Studio skill equips Code Scaffold agents with full vector intelligence: generating scalable, clean, semantic SVG graphics from natural language prompts, converting raster images to resolution-independent vector assets, programmatically editing and animating SVGs, and orchestrating vector design tasks through Quiver's hosted Model Context Protocol (MCP) server.

* **Entity Mapping**: Quiver AI Platform (`api.quiver.ai`), Quiver App (`app.quiver.ai`), Arrow Foundation Models (`arrow-2-telos`, `arrow-2`, `arrow-1.1`), Vector Generation Pipeline (`/v1/svgs/generations`), Image Vectorizer (`/v1/svgs/vectorizations`), SVG Editor (`/v1/svgs/edits`), Animation Engine (`/v1/svgs/animations`), OpenResponses API (`/v1/responses`), and Hosted MCP Server (`https://app.quiver.ai/mcp`).
* **Problem Domain**: Eliminating raster asset pixelation and design-to-code friction by synthesizing mathematically clean, editable vector artwork, logos, icons, and UI typography directly into modern web frameworks.

---

## 1. Model Catalog and Architecture

Quiver AI provides specialized foundation models engineered specifically for vector graphics and geometric reasoning:

| Model ID | Focus | Context Window | Max Output | Billing Model | Typical Use Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `arrow-2-telos` | High-complexity SVG generation, fine geometric detail, and rich context | 1,050,000 tokens | 65,536 tokens | Token-priced ($6 in / $30 out per 1M) | Production brand logos, intricate iconography, multi-layer vector illustrations, UI component graphics |
| `arrow-2` | Balanced speed, design instincts, and generation fidelity | 131,072 tokens | 65,536 tokens | Token-priced ($4 in / $20 out per 1M) | Rapid vector iteration, dashboard icons, web illustrations, automated batch asset production |
| `arrow-1.1` | General-purpose generation and raster vectorization | 131,072 tokens | 65,536 tokens | Fixed-credit ($0.20 per generation / $0.15 per vectorization) | Standard icon sets, raster-to-SVG conversion, budget-conscious pipelines |

### Catalog Discovery Contract

Always inspect available models dynamically to confirm account authority and operational support:

```bash
curl -s --fail-with-body https://api.quiver.ai/v1/models \
  -H "Authorization: Bearer $QUIVERAI_API_KEY"
```

Each model object publishes `supported_operations` (such as `generate`, `vectorize`, `edit`, `animate`, `open_responses`) and `billing` configuration. Never assume access based solely on catalog listing: the API key must possess matching capability authority.

---

## 2. Authentication and Environment Configuration

The Quiver AI API uses standard Bearer token authentication.

### Environment Variable Standards

Store API credentials in `.env` or project secret management:

```ini
# Quiver AI Platform API Key (Production or sk_test_ sandbox key)
QUIVERAI_API_KEY=qvr_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional default model override
QUIVERAI_DEFAULT_MODEL=arrow-2
```

### Test Mode and Sandbox Keys

Keys prefixed with `sk_test_` operate against the deterministic sandbox environment:
* No model dispatch occurs and zero usage is billed.
* Outputs return deterministic, valid SVG fixtures suitable for automated unit tests and CI/CD pipelines.
* Status codes and error contracts match production behavior exactly.

---

## 3. Text to SVG Generation (`POST /v1/svgs/generations`)

Generates one or more production-ready SVGs from natural language descriptions and optional image references.

### Request Payload Structure

```json
{
  "model": "arrow-2",
  "prompt": "Minimalist geometric compass rose with clean lines, navy and electric cyan accents",
  "instructions": "Flat vector style, no gradients, clean closed paths, suitable for a dark-mode navigation interface",
  "n": 1,
  "stream": false,
  "reasoning_effort": "high",
  "attributes": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 512,
      "height": 512
    }
  },
  "references": [
    {
      "url": "https://assets.example.com/brand-style-reference.png"
    }
  ]
}
```

### Direct Node.js Fetch Implementation

```javascript
import { writeFile } from 'node:fs/promises';

export async function generateSvg({
  prompt,
  instructions = '',
  model = 'arrow-2',
  viewBox = { minX: 0, minY: 0, width: 512, height: 512 },
  reasoningEffort = 'medium',
  apiKey = process.env.QUIVERAI_API_KEY
}) {
  if (!apiKey) {
    throw new Error('QUIVERAI_API_KEY is not configured in environment');
  }

  const response = await fetch('https://api.quiver.ai/v1/svgs/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      instructions,
      n: 1,
      stream: false,
      reasoning_effort: reasoningEffort,
      attributes: { viewBox }
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Quiver API error [${response.status}]: ${errorBody.message || 'Generation failed'}`);
  }

  const result = await response.json();
  const svgMarkup = result.data?.[0]?.svg;

  if (!svgMarkup) {
    throw new Error('No SVG document returned in API response payload');
  }

  return {
    id: result.id,
    svg: svgMarkup,
    usage: result.usage,
    credits: result.credits
  };
}
```

---

## 4. Image to SVG Vectorization (`POST /v1/svgs/vectorizations`)

Converts raster graphics (PNG, JPEG, WebP, GIF) into clean, scalable vector paths.

### Request Payload Specifications

* Supports network image URLs (HTTP/HTTPS) or base64-encoded image payloads.
* Maximum input dimensions: 4096x4096 pixels (or 16,777,216 total pixels).
* Maximum file payload: 12MB.
* Optional `auto_crop`: automatically tightens bounds to the dominant subject before vectorization.
* Optional `target_size`: square resize target between 128 and 4096 pixels.

```javascript
export async function vectorizeImage({
  imageInput, // { url: string } or { base64: string }
  autoCrop = true,
  targetSize = 1024,
  model = 'arrow-2',
  apiKey = process.env.QUIVERAI_API_KEY
}) {
  const response = await fetch('https://api.quiver.ai/v1/svgs/vectorizations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      image: imageInput,
      auto_crop: autoCrop,
      target_size: targetSize,
      stream: false
    })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Vectorization error [${response.status}]: ${errorBody.message}`);
  }

  const result = await response.json();
  return result.data[0].svg;
}
```

---

## 5. Model Context Protocol (MCP) Server Integration

Quiver AI provides a hosted MCP server enabling AI agents to autonomously manage vector graphics workflows through standardized tool calling.

### Endpoint and Architecture

* **Hosted MCP Endpoint**: `https://app.quiver.ai/mcp`
* **Transport**: Remote Model Context Protocol over Streamable HTTP with OAuth.
* **Fallback for stdio-only clients**: `npx -y mcp-remote https://app.quiver.ai/mcp`

### Configuration Files

#### Code Scaffold and Universal Agent MCP Config (`mcp-config.json`)

```json
{
  "mcpServers": {
    "quiverai": {
      "type": "http",
      "url": "https://app.quiver.ai/mcp"
    }
  }
}
```

#### Stdio Bridge Fallback Configuration

```json
{
  "mcpServers": {
    "quiverai": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://app.quiver.ai/mcp"]
    }
  }
}
```

### Available MCP Tools

* `list_models`: Lists available Arrow models and current operational permissions.
* `list_creations`: Paginates user Gallery creations with filters for `method` (`generate`, `vectorize`, `animate`), `status`, and `limit` (1 to 100).
* `get_creation`: Retrieves creation metadata for a specific creation ID.
* `get_creation_content`: Fetches completed raw SVG content. Set `includePng: true` to receive an accompanying base64 PNG preview for direct in-chat visual inspection.
* `create_generation`: Initiates asynchronous text-to-SVG generation. Returns queued `taskId` and associated `creationIds`.
* `create_vectorization`: Initiates raster image vectorization from public URL or base64 data.
* `get_task`: Inspects asynchronous task lifecycle status (`queued`, `processing`, `completed`, `failed`, `stopped`).

### Critical Agent Workflow Rule: Asynchronous Polling

When an agent invokes `create_generation` or `create_vectorization` via MCP, the API returns a queued task:
1. **Never treat `taskId` as a `creationId`**: The task ID identifies the background job, while creation IDs identify resulting vector assets.
2. **Poll `get_task`**: Check task status periodically until state becomes `completed`.
3. **Fetch final payload**: Iterate through `creations` array and call `get_creation_content` with each `creation.id`.
4. **No premature output**: Never persist or display an in-progress draft snapshot as final output.

---

## 6. OpenResponses and OpenAI SDK Compatibility

Quiver AI models supporting `open_responses` can be called via the official OpenAI SDK by repointing the base URL:

```typescript
import OpenAI from 'openai';
import { writeFile } from 'node:fs/promises';

const client = new OpenAI({
  apiKey: process.env.QUIVERAI_API_KEY,
  baseURL: 'https://api.quiver.ai/v1'
});

async function runVectorAgentLoop() {
  const response = await client.responses.create({
    model: 'arrow-2',
    input: [
      {
        role: 'user',
        content: 'Generate a cybernetic neon shield logo and save it using write_file'
      }
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Persist the generated SVG markup to disk',
          parameters: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              content: { type: 'string' }
            },
            required: ['filename', 'content']
          }
        }
      }
    ]
  });

  // Handle function call execution and replay results
}
```

---

## 7. SVG Post-Processing and Component Compilation

SVGs generated by AI must be cleansed and optimized before embedding into production web codebases.

### Security and Sanitization Rules

* Strip any `<script>` tags, event handlers (`onload`, `onclick`), or embedded `javascript:` URLs.
* Eliminate `<foreignObject>` tags unless explicitly required for hybrid HTML rendering.
* Ensure root `<svg>` tag contains valid `xmlns="http://www.w3.org/2000/svg"`, explicit `viewBox`, and `aria-hidden="true"` or descriptive `<title>` for accessibility.

### Transformation into React Component

```tsx
import React from 'react';

interface VectorIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export const BrandLogo: React.FC<VectorIconProps> = ({
  size = 24,
  className = '',
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill="none"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
    {...props}
  >
    {/* Clean vector path definitions */}
    <path
      d="M256 32L464 128V384L256 480L48 384V128L256 32Z"
      stroke="currentColor"
      strokeWidth="24"
      strokeLinejoin="round"
    />
  </svg>
);
```

---

## 8. Error Handling and Rate Limiting

The API returns standardized JSON error payloads:

```json
{
  "status": 429,
  "code": "rate_limit_exceeded",
  "message": "Token throughput ceiling reached. Please back off.",
  "request_id": "req_01j7abc123def",
  "retry_after": 5
}
```

### Common Error Codes

* `invalid_request`: Malformed JSON, missing required fields, or invalid coordinates.
* `invalid_api_key`: Missing or revoked credentials.
* `unauthorized`: Organization resolution failure or model capability restriction.
* `insufficient_credits`: Depleted prepaid account balance.
* `content_policy_violation`: Prompt or reference violates safety filters.
* `payload_too_large`: Input image exceeds 12MB or pixel limits.
* `rate_limit_exceeded`: Request throughput exhausted; inspect `Retry-After` header.

### Telemetry and Correlation Headers

* `X-Request-ID`: Unique server trace identifier returned on every request. Preserve in system logs.
* `x-trace-id`: Client-supplied identifier echoed back in `X-Trace-ID` for cross-system distributed tracing.

---

## 9. Best Practices Checklist

* **Specify ViewBox**: Always provide explicit `attributes.viewBox` parameters to ensure deterministic scaling across mobile and desktop viewports.
* **Constrain Styling in Prompts**: Instruct models to generate closed paths, define explicit stroke widths, and avoid excessive gradient meshes when high rendering performance is needed.
* **Leverage Test Keys in CI**: Use `sk_test_` keys in automated regression pipelines to test end-to-end vector parsing without incurring billing charges.
* **Handle Stream Completion**: In streaming mode (`stream: true`), listen for `data: [DONE]` before finalizing output, but verify that the final payload was successfully received.
* **Preserve Request IDs**: Log `X-Request-ID` alongside failed operations for prompt customer support triage.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
