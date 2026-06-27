# MCP Go SDK Reference

The `go-sdk` implementation brings the Model Context Protocol to the Go ecosystem, ideal for highly concurrent and lightweight binaries.

## Key Concepts
- **Context**: Every tool and resource handler accepts a `context.Context` to support cancellation and timeouts.
- **Struct Tags**: Tool input schemas are often derived from or mapped to Go structs using `json` tags.
- **Transports**: 
  - Stdio uses `os.Stdin` and `os.Stdout`.
  - SSE uses standard `net/http` handlers.

## Best Practices
- Always respect `ctx.Done()` within long-running tool executions.
- Return structured error types that the SDK can marshal into standard MCP JSON-RPC error codes.
- Use `go mod init` and fetch the official `go-sdk` package.
