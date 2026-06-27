# MCP Java SDK Reference

The `java-sdk` implementation provides robust tools for building MCP servers and clients on the JVM.

## Key Concepts
- **Server Initialization**: Typically uses a builder pattern (e.g., `McpServer.builder()`) to instantiate the server with predefined tools and resources.
- **Transports**: Standard support for `StdioServerTransport` (for local integrations) and `SseServerTransport` (for remote, HTTP-based integrations).
- **Concurrency**: Heavily relies on `CompletableFuture` or reactive streams for handling JSON-RPC calls asynchronously.
- **Tools**: Tools are registered by passing metadata (name, description, JSON Schema for inputs) along with an execution callback or by using annotations if the framework provides them.

## Best Practices
- Use Maven or Gradle to manage the SDK dependency.
- Always catch execution exceptions and return standard MCP JSON-RPC error codes (e.g., `ErrorCode.InternalError`).
