# A2A Agent Bridge

**Version:** 2

**Target:** `.skills/a2a`

**Category:** AI, MCP & Developer Tools

**Keywords:** `a2a`, `agent2agent`, `agent-to-agent`, `agent-card`, `agent-discovery`, `multi-agent`, `agent-interop`, `agent-collaboration`, `task-lifecycle`, `opaque-agents`, `agent-handoff`, `task-delegation`, `long-running-tasks`, `json-rpc`, `http-json-rest`, `grpc-protobuf`, `server-sent-events`, `push-notifications`, `python-sdk`, `typescript-sdk`, `go-sdk`, `java-sdk`, `dotnet-sdk`, `rust-sdk`, `a2a-cli`, `conformance-tck`, `scaffold-a2a-server`, `scaffold-a2a-client`, `stream-task`, `mcp-synergy`

## Description
Scaffolds Agent2Agent protocol servers, clients, and multi agent meshes so opaque agents built on diverse frameworks can discover each other and collaborate. Covers agent cards, task lifecycle, streaming, and push notifications across Python, TypeScript, Go, Java, dotNET, and Rust SDKs.

## Capabilities & Use Cases
* **Server Scaffolding** : Generates A2A remote agents with executor pipelines, task lifecycle events, artifact emission, and SQL backed task persistence for production workloads
* **Client Scaffolding** : Builds card driven clients that resolve Agent Cards, negotiate transports, send multi part messages, and track tasks through polling, streaming, or push callbacks
* **Agent Card Authoring** : Authors discovery contracts served at `/.well-known/agent-card.json` with identity, endpoint, skills, auth schemes, and supported interface declarations
* **Tri Transport Binding** : Configures JSON-RPC 2.0, HTTP+JSON REST, and gRPC Protobuf bindings with per transport capability matrices and negotiation logic
* **Streaming Architecture** : Implements Server Sent Events streams with resubscription plus webhook push notifications for very long running or disconnected client scenarios
* **Six Language Matrix** : Covers Python `a2a-sdk`, TypeScript `@a2a-js/sdk`, Go `a2a-go/v2`, Java Maven modules, dotNET NuGet packages, and Rust workspace crates with idiomatic install and bootstrap flows
* **Headless Validation Loop** : Drives silent verification via the official `a2a` CLI probes, the web based protocol inspector, and the Technology Compatibility Kit conformance suite with CI ready report bundles
* **Cross SDK Interop Proof** : Validates wire compatibility by pairing servers and clients from different SDK languages across every declared transport
* **Migration Guidance** : Routes v0.3 peers through SDK compatibility layers toward specification v1.0 with migration evidence captured as conformance reports
* **MCP Synergy Design** : Composes horizontal agent to agent reach with vertical MCP tool depth so each peer is both reachable and capable
* **Security Enforcement** : Applies auth on advertised endpoints, strict message part validation, webhook signature checks, opaque boundary protection, and precise protocol error codes

## Usage
Invoke this skill when building or integrating Agent2Agent protocol systems. The agent gathers requirements through interactive questions covering component type, SDK language, wire transport, and interaction pattern, then scaffolds the server or client, authors the Agent Card, implements task logic, and runs the headless CLI plus inspector plus conformance validation loop until green.

## Changelog
* **v2** : Applied the SkillForge Keyword Contract: discovery keywords standardized to the 15 to 30 term lexicon with the skill slug first, mirrored identically across the manifest, readme badge, SKILL frontmatter, and registry index
* **v1** : Initial creation of the A2A Agent Bridge skill with six language SDK coverage, tri transport binding, and headless conformance validation.
