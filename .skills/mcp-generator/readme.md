# MCP Generator

**Version:** 3
**Target:** `.skills/mcp-generator`

## Description
Assists with creating new custom Model Context Protocol (MCP) servers, clients, and apps using official SDKs and best practices.

## Capabilities & Use Cases
* **Architecture Generation** : Scaffold comprehensive robust secure and dependable Model Context Protocol servers clients and apps
* **Language Agnostic Scaffolding** : Fully support generation logic for TypeScript Python Java Kotlin C# Go PHP Ruby Rust and Swift using official SDKs
* **Protocol Transports** : Configure stdio or SSE Server Sent Events over HTTP transport layers automatically
* **Interactive Requirement Gathering** : Utilize interactive questions to determine component types preferred ecosystem and protocols interactively
* **Core Logic Implementation** : Generate boilerplate for Server and Client classes handling ListTools CallTool ListResources and ReadResource requests natively
* **Security Enforcement** : Validate all incoming tool arguments rigidly using libraries like zod or pydantic natively
* **Error Handling Framework** : Ensure proper error handling returning precise JSON RPC error codes via McpError abstractions
* **Developer Documentation Automation** : Automatically construct comprehensive README files explaining how to build run and test components using the official MCP Inspector

## Usage
This skill automates the scaffolding and development of Model Context Protocol (MCP) tools. When invoked, it will prompt the user to determine the scope of their project (Server vs Client, TypeScript vs Python) and then generate the appropriate boilerplate code. It implements MCP's standardized abstractions for Prompts, Resources, and Tools over stdio or SSE transports.

## Changelog
* **v3** : Expanded capability descriptions
* **v2** : Expanded ecosystem support to include comprehensive documentation and generation logic for Java, Kotlin, C#, Go, PHP, Ruby, Rust, and Swift SDKs.
* **v1** : Initial creation of the MCP Generator skill.
