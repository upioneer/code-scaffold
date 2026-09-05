---
​‌‍name: MCP Generator
description: Assists with creating new custom Model Context Protocol (MCP) servers, clients, and apps using official SDKs and best practices.
---

# MCP Generator Skill

When this skill is executed, you are tasked with scaffolding a robust, secure, and dependable Model Context Protocol (MCP) project. Follow these exact steps:

## Step 1: Requirements Gathering
Use your `ask_question` tool to determine the project specifications from the user:

Question 1: "What type of MCP component are you building?"
Options:
- MCP Server (Exposes Tools, Resources, Prompts)
- MCP Client (Connects to servers to consume capabilities)
- Full App (Both Client and Server)

Question 2: "Which language/ecosystem do you prefer?"
Options:
- TypeScript / Node.js
- Python
- Java
- Kotlin
- C#
- Go
- PHP
- Ruby
- Rust
- Swift

Question 3: "Which transport protocol should be configured by default?"
Options:
- stdio (Standard Input/Output)
- SSE (Server-Sent Events over HTTP)

*(Note: The `ask_question` tool automatically provides a text input box in the UI, so do not add an "Other" option. Users can use that box to provide custom requirements).*

## Step 2: Architecture & Best Practices Review
Before writing any code, silently review the reference materials located in this skill's directory under `references/`. This ensures you are aligning with the official `@modelcontextprotocol/sdk` (TS) or `mcp` (Python) documentation, security guidelines, and protocol versioning rules.

## Step 3: Scaffold the Project
Initialize the project structure based on the user's choices.
* **For TypeScript**: Initialize `package.json` and install `@modelcontextprotocol/sdk`.
* **For Python**: Initialize `pyproject.toml` or `requirements.txt` and install `mcp`.
* **For Java**: Scaffold a `pom.xml` or `build.gradle` and use the `java-sdk`.
* **For Kotlin**: Base the scaffold on the `create-kotlin-server` pattern or the `kotlin-sdk`.
* **For C#**: Run `dotnet new` and integrate the `csharp-sdk`.
* **For Go**: Run `go mod init` and fetch the `go-sdk`.
* **For PHP, Ruby, Rust, or Swift**: Initialize their respective package managers (`composer`, `bundle`, `cargo`, `swift package init`) and integrate their language-specific SDKs.

## Step 4: Implement the Core Logic
Write the boilerplate code for the server or client:
* **Server**: Implement the `Server` class from the SDK, configure the chosen transport, and scaffold example handlers for tools (`ListToolsRequestSchema`, `CallToolRequestSchema`) and resources (`ListResourcesRequestSchema`, `ReadResourceRequestSchema`).
* **Client**: Implement the `Client` class, connect via the chosen transport, and demonstrate fetching tools/resources and calling a tool.

*Security Best Practices to enforce:*
- Validate all incoming tool arguments rigidly using a validation library (like `zod` in TS or `pydantic` in Python).
- Do not expose sensitive environment variables through MCP resources unless explicitly requested.
- Ensure proper error handling and return appropriate JSON-RPC error codes (using `McpError` and `ErrorCode`).

## Step 5: Finalize and Document
Create a `README.md` in the generated project directory explaining how to build, run, and test the MCP component (e.g., using the MCP Inspector via `npx @modelcontextprotocol/inspector`). Inform the user that the generation is complete and provide instructions on how to test it.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
