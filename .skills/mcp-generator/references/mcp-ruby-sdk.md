# MCP Ruby SDK Reference

The `ruby-sdk` implementation provides Rubyists with tools to build MCP servers, fitting well within Rails or Sinatra ecosystems.

## Key Concepts
- **Blocks & Procs**: Tool execution and resource reading are often registered using Ruby blocks.
- **Transports**: Supports both standard I/O streams for local execution and HTTP wrappers for SSE.
- **Hashes**: JSON Schema definitions are written as standard Ruby hashes.

## Best Practices
- Ensure that stdio streams are explicitly flushed (`$stdout.flush`) to prevent JSON-RPC messages from getting buffered.
- Handle exceptions gracefully to prevent the entire MCP server process from crashing.
