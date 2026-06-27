# MCP Python SDK Reference

The official Python package is `mcp`. You can build a server using `mcp.server.Server` or via the newer high-level `FastMCP` pattern.

## Server Example (stdio)

```python
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, CallToolRequest, CallToolResult

server = Server("example-server")

@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="hello",
            description="Returns a greeting",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"}
                },
                "required": ["name"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict | None) -> list[TextContent]:
    if name == "hello":
        if not arguments or "name" not in arguments:
            raise ValueError("Missing 'name' argument")
        
        greeting = f"Hello, {arguments['name']}!"
        return [TextContent(type="text", text=greeting)]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

## Security Best Practices
- Validate incoming dictionary arguments robustly.
- Use `pydantic` if you have complex objects.
- Ensure that you don't expose environment variables or sensitive files implicitly.
