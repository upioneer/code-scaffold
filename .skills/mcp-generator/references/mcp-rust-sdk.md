# MCP Rust SDK Reference

The `rust-sdk` implementation provides a safe, highly performant way to build MCP servers and clients.

## Key Concepts
- **Serde**: Relies exclusively on `serde` and `serde_json` for strictly typing inputs, outputs, and JSON Schema generations.
- **Async/Await**: Built heavily around `tokio` for async I/O over stdio or HTTP (via `axum` or similar).
- **Traits**: Servers implement specific traits (e.g., `McpServer`) defining functions like `list_tools`, `call_tool`, `list_resources`.

## Best Practices
- Use `cargo` to manage dependencies (`serde`, `tokio`, etc.).
- Leverage the type system to guarantee input validation before the tool logic is ever executed.
- Ensure standard output is only used for protocol messages when running over stdio (use `eprintln!` or a logging framework like `tracing` to stderr for logs).
