# MCP C# SDK Reference

The `csharp-sdk` implementation provides a .NET native way to build MCP servers and clients.

## Key Concepts
- **Async/Await**: Heavy usage of standard `async Task` and `Task<T>` for handling JSON-RPC requests.
- **System.Text.Json**: Uses standard .NET JSON serialization for request schemas and payloads.
- **Server Builder**: Configured using dependency injection (DI) patterns typical in modern .NET (e.g., `IServiceCollection`).
- **Transports**: Includes standard Console (stdio) streaming and HTTP/SSE capabilities.

## Best Practices
- Register tools as scoped or singleton services if they require external state.
- Validate incoming JSON payloads using .NET data annotations or fluent validation before executing the tool logic.
