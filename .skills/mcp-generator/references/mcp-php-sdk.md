# MCP PHP SDK Reference

The `php-sdk` implementation enables PHP applications (like Laravel or Symfony backends) to act as MCP servers or clients.

## Key Concepts
- **Execution Model**: PHP's request-response lifecycle makes SSE (Server-Sent Events) or standard HTTP POST endpoints the most natural fit for remote servers, though CLI scripts can handle stdio.
- **JSON Handling**: Relies heavily on `json_encode` and `json_decode` with associative arrays or strong typing via PHP 8+ classes.
- **Tool Mapping**: Tools are typically registered as closures or invokable classes.

## Best Practices
- For stdio, ensure the PHP script runs in CLI mode without memory limits and properly flushes standard output (`fflush(STDOUT)`).
- Validate inputs using built-in PHP filters or robust validation libraries.
