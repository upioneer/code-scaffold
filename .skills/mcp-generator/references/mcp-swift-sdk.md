# MCP Swift SDK Reference

The `swift-sdk` implementation targets macOS and iOS ecosystems, allowing native Apple platforms to expose or consume MCP capabilities.

## Key Concepts
- **Codable**: Uses Swift's native `Codable` protocol for rigid parsing of Tool arguments and Resource URIs.
- **Async/Await**: Built using Swift Concurrency (`async` / `await` and `Task` groups).
- **Transports**: Standard `FileHandle.standardInput` and `standardOutput` for stdio, with URLSession or native networking for SSE.

## Best Practices
- When running over stdio in a macOS CLI app, ensure that `print()` statements do not corrupt the JSON-RPC stream (redirect standard logs to `FileHandle.standardError`).
- Strongly type your Tool response objects to ensure compliance with the MCP TextContent/ImageContent specs.
