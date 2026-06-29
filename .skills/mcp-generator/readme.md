# MCP Generator

**Version:** 2
**Target:** `.skills/mcp-generator`

## Description
Assists with creating new custom Model Context Protocol (MCP) servers, clients, and apps using official SDKs and best practices.

## Capabilities & Use Cases
* Scaffolds MCP Servers in TypeScript or Python.
* Scaffolds MCP Clients for integrating with existing servers.
* Configures standard transport layers (stdio / SSE).
* Implements robust error handling and security best practices out of the box.

## Usage
This skill automates the scaffolding and development of Model Context Protocol (MCP) tools. When invoked, it will prompt the user to determine the scope of their project (Server vs Client, TypeScript vs Python) and then generate the appropriate boilerplate code. It implements MCP's standardized abstractions for Prompts, Resources, and Tools over stdio or SSE transports.

## Changelog
* **v2** : Expanded ecosystem support to include comprehensive documentation and generation logic for Java, Kotlin, C#, Go, PHP, Ruby, Rust, and Swift SDKs.
* **v1** : Initial creation of the MCP Generator skill.
