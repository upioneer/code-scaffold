# MCP TypeScript SDK Reference

The `@modelcontextprotocol/sdk` package provides the necessary classes to build MCP clients and servers in Node.js or TypeScript.

## Server Example (stdio)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "example-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello",
        description: "Returns a greeting",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" }
          },
          required: ["name"]
        }
      }
    ]
  };
});

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "hello") {
    const name = String(request.params.arguments?.name);
    return {
      content: [{ type: "text", text: `Hello, ${name}!` }]
    };
  }
  throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP Server running on stdio");
}
run().catch(console.error);
```

## Security Best Practices
- Always catch errors and return `McpError` rather than crashing the process.
- Validate `request.params.arguments` carefully before using them. Consider using `zod`.
