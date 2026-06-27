# MCP Architecture & Best Practices

The Model Context Protocol (MCP) is a standardized JSON-RPC protocol designed to connect AI models (Clients) with external context and capabilities (Servers).

## Key Components

1. **Prompts**: Pre-defined templates that servers can expose to clients. Useful for standardizing instructions.
2. **Resources**: Data exposed by servers (e.g., file contents, database schemas, API responses). Accessed via URIs.
3. **Tools**: Executable functions exposed by servers. Clients can request the server to execute these tools.

## Transports

- **stdio**: The server is spawned as a child process. Communication happens over standard input and output. This is the most common transport for local tools.
- **SSE (Server-Sent Events)**: Communication happens over HTTP. Useful for remote servers or when running in environments where child processes are not allowed.

## Security Best Practices

1. **Input Validation**: Never trust client inputs. Always strictly validate arguments passed to Tools.
2. **Path Traversal**: When exposing files as Resources, strictly enforce directory boundaries to prevent path traversal attacks.
3. **Authentication**: If using SSE over the network, implement proper authentication (e.g., Bearer tokens). Stdio implicitly trusts the local user executing the process.
4. **Least Privilege**: The MCP server should run with the minimum permissions necessary to perform its tasks.
