---
​‌‍name: A2A Agent Bridge
description: Trigger when the user requests agent to agent communication, A2A servers, A2A clients, agent cards, multi agent collaboration, task delegation between opaque agents, or interop across agent frameworks. Activate when scaffolding, debugging, migrating, or validating Agent2Agent protocol integrations in Python, TypeScript, Go, Java, dotNET, or Rust.
keywords:
  - a2a
  - agent2agent
  - agent-to-agent
  - agent-card
  - agent-discovery
  - multi-agent
  - agent-interop
  - agent-collaboration
  - task-lifecycle
  - opaque-agents
  - agent-handoff
  - task-delegation
  - long-running-tasks
  - json-rpc
  - http-json-rest
  - grpc-protobuf
  - server-sent-events
  - push-notifications
  - python-sdk
  - typescript-sdk
  - go-sdk
  - java-sdk
  - dotnet-sdk
  - rust-sdk
  - a2a-cli
  - conformance-tck
  - scaffold-a2a-server
  - scaffold-a2a-client
  - stream-task
  - mcp-synergy
---

# A2A Agent Bridge Skill

When this skill is executed, you are tasked with scaffolding, integrating, or validating an Agent2Agent (A2A) protocol system. A2A is an open protocol that lets opaque agentic applications built on diverse frameworks discover each other, negotiate interaction modalities, and collaborate on long running tasks without exposing internal state, memory, or tools. Follow these exact steps:

## Step 1: Requirements Gathering

Use your `ask_question` tool to determine the project specifications from the user:

Question 1: "What type of A2A component are you building?"
Options:
* A2A Server (Remote Agent exposing skills over the protocol)
* A2A Client (discovers agents and drives tasks)
* Full Mesh (both client and server plus delegation flows)

Question 2: "Which language and SDK ecosystem do you prefer?"
Options:
* Python (`a2a-sdk` from PyPI)
* TypeScript / Node.js (`@a2a-js/sdk` from npm)
* Go (`a2a-go/v2` module)
* Java 17+ (Maven `org.a2aproject.sdk` modules)
* C# / dotNET 8+ (NuGet `A2A` packages)
* Rust (crates `a2a`, `a2a-client`, `a2a-server`)

Question 3: "Which wire transport should be configured by default?"
Options:
* JSON-RPC 2.0 over HTTP (widest interop)
* HTTP+JSON / REST (simple web native binding)
* gRPC with Protobuf (typed high performance binding)

Question 4: "Which interaction pattern fits the workload?"
Options:
* Request/Response with polling (short tasks)
* Streaming with Server Sent Events (real time incremental updates)
* Push Notifications to a webhook (very long running or disconnected clients)

*(Note: The `ask_question` tool automatically provides a text input box in the UI, so do not add an "Other" option. Users can use that box to provide custom requirements).*

## Step 2: Core Concepts Review

Before writing any code, internalize these protocol building blocks. Every scaffold decision must map to them:

* **Actors**: `User` (human or service initiating a goal), `A2A Client` (acts on behalf of the user), `A2A Server` (remote agent exposing an HTTP endpoint). The remote agent is opaque: a black box whose internals stay hidden.
* **Agent Card**: JSON metadata document describing identity, endpoint URL, capabilities, skills, authentication requirements, and supported transports. Clients fetch it first to decide fit and shape requests.
* **Task**: Stateful unit of work with a unique ID and defined lifecycle. Enables tracking of long running operations and multi turn collaboration.
* **Message**: Single turn of communication with a role (`user` or `agent`) and unique `messageId`. Carries instructions, context, questions, or answers.
* **Part**: Fundamental content container inside Messages and Artifacts. Holds text content, a file reference (URL or inline bytes), or structured data. This makes A2A modality independent.
* **Artifact**: Tangible output produced during a task (document, image, structured data). Delivers concrete retrievable results.
* **Agent Response Shape**: Every agent turn resolves to either a direct `Message` (stateless reply) or a `Task` (stateful tracked work with history and artifacts).

## Step 3: Scaffold the Project

Initialize the project structure and install the chosen SDK:

* **For Python** (3.10+): `pip install a2a-sdk` for core, `pip install "a2a-sdk[all]"` for every extra, or surgical extras such as `a2a-sdk[http-server]`, `a2a-sdk[fastapi]`, `a2a-sdk[grpc]`, `a2a-sdk[telemetry]`, `a2a-sdk[encryption]`.
* **For TypeScript**: `npm install @a2a-js/sdk`, plus `npm install express` for the Express server integration, `npm install @grpc/grpc-js @bufbuild/protobuf` for gRPC, and `npm install kysely <driver>` for persistent PostgreSQL, MySQL, SQLite, or Cloudflare D1 stores.
* **For Go** (1.25+): `go get github.com/a2aproject/a2a-go/v2`, then use the `a2asrv` server package and the `a2aclient` client package.
* **For Java** (17+): add the Maven reference modules under group `org.a2aproject.sdk` (JSON-RPC, gRPC, REST reference servers), build with `mvn clean install`, and pick a runtime integration (Quarkus reference or Jakarta EE Web Profile).
* **For dotNET** (8+): `dotnet add package A2A` for core, `dotnet add package A2A.AspNetCore` for hosting, and `A2A.Grpc` plus `A2A.Grpc.AspNetCore` for the gRPC binding.
* **For Rust** (1.85+): add `a2a` core types, `a2a-client` async client, `a2a-server` axum based server, and optionally `a2a-grpc` (tonic) or `a2a-slimrpc` bindings. Build with `cargo build` and verify with `cargo test`.

Target specification v1.0 in all new scaffolds. When interoperating with older peers, enable the SDK opt in v0.3 compatibility layer and plan migration using that SDK migration guide.

## Step 4: Author the Agent Card

The Agent Card is the discovery contract. Serve it at `/.well-known/agent-card.json` on the agent base URL and include:

* Identity fields: agent name, human readable description, and provider metadata.
* Service endpoint: canonical base URL clients connect to.
* Skills array: each skill with a name, description, input and output modality tags (text, file, data), and example prompts where useful.
* Authentication requirements: declared schemes so clients authenticate before first contact.
* Supported interfaces: every transport the server binds (`JSONRPC`, `HTTP+JSON`, `GRPC`) so tooling can negotiate correctly.

Discovery flow for every client scaffold: resolve the Agent Card from the base URL first, validate endpoint plus auth plus transports, then create a transport aware client from the card. Never hardcode endpoint paths that the card already advertises.

## Step 5: Implement the Core Logic

Write the agent behavior behind the SDK handler pipeline:

* **Server executor**: implement the SDK executor or handler abstraction (`AgentExecutor`, `IAgentHandler` with `ExecuteAsync` and `CancelAsync`, or equivalent). Keep framework internals behind the opaque boundary: the handler receives a resolved context (incoming message, task ID, context ID) and emits events.
* **Task lifecycle events**: emit Submit, StartWork, AddArtifact, Complete, Fail, Cancel, and RequireInput transitions through the SDK task updater or event queue. Persist tasks via a `TaskStore`: in memory stores for development, SQL backed stores (PostgreSQL, MySQL, SQLite) for production.
* **Stateless replies**: for simple turns that need no tracking, use the message responder path that returns a direct `Message` instead of opening a `Task`.
* **Client flow**: build a `Message` with role `user` plus one or more `Part` payloads (text, file, data), send it through the card derived client, then branch on the response shape: render a direct message, or track the returned task through status polling, streaming, or push callbacks.
* **Artifacts**: attach named artifacts with typed parts as tasks complete so results stay structured and retrievable across follow ups.

## Step 6: Streaming and Push Notifications

Configure async patterns for responsiveness without busy polling:

* **Server Sent Events streaming**: open a stream over the HTTP connection for real time incremental results and status updates. Support resubscription so dropped clients resume cleanly.
* **Push Notifications**: let clients register a webhook URL plus credential; the server calls it on significant task updates. Prefer this for very long running tasks and disconnected clients.
* **Polling fallback**: keep status polling as the universal baseline so minimal clients still converge on completion.

## Step 7: Security Enforcement

Enforce these controls in every scaffold:

* Authenticate every endpoint the Agent Card advertises, and validate webhook registrations plus delivery signatures on push callbacks.
* Validate all incoming message parts rigidly (types, sizes, allowed modalities) before they reach agent logic.
* Never expose internal state, memory, tool credentials, or environment secrets through messages, artifacts, or error payloads.
* Return precise protocol error codes on failure; log internals server side only.
* For credential gated tasks, design an authorization checkpoint (RequireInput style pause) rather than widening standing permissions.

## Step 8: Headless Validation Loop

Validate without human driven clicking. Run this loop silently until green:

* **Official CLI probe**: install the Go based `a2a` CLI, then run `a2a card get <base-url>` to verify discovery, `a2a send -a <base-url> "probe prompt"` for a round trip, and `a2a send -a <base-url> --stream "probe prompt"` for streaming. Use its protocol native JSON outputs and predictable exit codes inside scripts and pipelines. Use `a2a` server mode with `--exec` to expose a local script as a throwaway agent during tests.
* **Inspector session**: launch the web based protocol inspector against the local agent to view the Agent Card, run specification compliance checks, chat live, and read raw JSON-RPC traffic in the debug console.
* **Conformance suite**: run the Technology Compatibility Kit with `./run_tck.py --sut-host <base-url>`, filter with `--transport grpc,jsonrpc,http_json` and `--level must`, then archive the `reports/` bundle (`compatibility.json`, `compatibility.html`, `junitreport.xml`) as the CI gate artifact. Treat MUST failures as blocking, SHOULD as advisory, MAY as skipped unless declared.
* **Cross SDK interop**: prove wire compatibility by driving the new server with a client from a different SDK language (for example a Python server plus a TypeScript client) across every declared transport, mirroring the nightly interop plus conformance matrix the ecosystem runs.

## Step 9: Cross Skill Synergy

Compose with sibling skills for full agentic systems:

* **MCP Generator (vertical depth)**: A2A is horizontal reach between agents; MCP is vertical depth into tools and resources. Scaffold each A2A remote agent with internal MCP servers, clients, or tools via the MCP Generator skill so every peer is both reachable (A2A) and capable (MCP).
* **A2UI (user rendering)**: when agent outputs must render as interactive user interfaces, pair this skill with the A2UI renderer skill for declarative UI generation.
* **Playwright Plus (end to end proof)**: for agents with web surfaces, record a declarative browser run that exercises discovery plus task completion.

## Step 10: Migration Notes

* New work targets specification v1.0 across JSON-RPC, HTTP+JSON, and gRPC bindings.
* When a peer still speaks v0.3, enable that SDK documented compatibility package or layer, pin the interop scope (transports plus features), and schedule migration using the SDK migration guide under its `docs/` folder.
* After migration, rerun the full Step 8 validation loop and keep the TCK report as migration evidence.

## Step 11: Finalize and Document

Create a `README.md` in the generated project directory explaining how to build, run, and test the A2A component: install commands, server start command, Agent Card URL, declared transports, how to send the first message with the CLI, and where the TCK conformance report lives. Inform the user that generation is complete and provide instructions on how to test it.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
