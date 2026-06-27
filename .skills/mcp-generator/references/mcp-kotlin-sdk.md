# MCP Kotlin SDK Reference

The `kotlin-sdk` implementation provides an idiomatic Kotlin experience for building MCP tools, complementing the JVM ecosystem.
A sample server can be scaffolded using the `create-kotlin-server` template.

## Key Concepts
- **Coroutines**: Embraces Kotlin coroutines (`suspend` functions) instead of blocking threads or using `CompletableFuture`.
- **DSL Builders**: Often provides a Domain-Specific Language (DSL) to elegantly configure the server, register tools, and map resources.
- **Serialization**: Utilizes `kotlinx.serialization` for strict input validation and parsing of Tool request arguments.

## Best Practices
- Always leverage `kotlinx.serialization` data classes to represent the input schemas of your Tools.
- Validate inputs rigorously and throw mapped exceptions that translate to MCP `ErrorCode`s.
