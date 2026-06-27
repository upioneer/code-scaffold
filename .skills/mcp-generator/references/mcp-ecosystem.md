# MCP Ecosystem & Architecture Reference

The Model Context Protocol (MCP) ecosystem is vast and expanding rapidly across many languages and architectures.

## Core Project Structure
If building or analyzing standard MCP repositories or references, note these structural norms:
- **`modelcontextprotocol`**: The root user documentation and protocol specification. Always adhere to the specs defined here.
- **`typescript-sdk` / `python-sdk` / `java-sdk` / `kotlin-sdk` / `csharp-sdk` / `go-sdk` / `php-sdk` / `ruby-sdk` / `rust-sdk` / `swift-sdk`**: The official or community-supported implementations for their respective languages.
- **`create-kotlin-server`**: A dedicated sample server repository designed specifically for bootstrapping Kotlin MCP servers.
- **`servers`**: The main repository or directory containing a list of maintained, official, and community-verified MCP servers (e.g., filesystem, postgres, github, etc.).
- **`ext-auth`**: A repository dedicated to authorization extensions, detailing how to secure SSE or remote transports via OAuth, Bearer tokens, or API keys natively within MCP payloads.

## Security & Auth (`ext-auth`)
When building remote servers (SSE), ensure you consult the `ext-auth` specifications for injecting authorization headers or parsing tokens securely before executing any Tool or Resource endpoints. Stdio environments typically bypass this by assuming the local user context.
