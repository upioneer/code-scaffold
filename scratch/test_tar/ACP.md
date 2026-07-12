# Agent Client Protocol (ACP)

Code Scaffold is officially compatible with the [Agent Client Protocol (ACP)](https://agentclientprotocol.com/).

The Agent Client Protocol provides a standardized interface for AI agents to interact with applications. By embracing ACP, Code Scaffold functions interchangeably as both an **Agent** (orchestrating workflows) and a **Client** (exposing tools to other agents), ensuring it fits seamlessly into the rapidly evolving autonomous ecosystem.

## Engagement Models

### 1. Code Scaffold as an Agent
As an agent, Code Scaffold can interface with external ACP-compliant clients. This allows the CLI to dynamically discover and utilize downstream tools—for example, discovering a headless browser client to test a newly scaffolded Playwright project, or interfacing with a local database client to automatically run migrations after bootstrapping a Supabase payload.

### 2. Code Scaffold as a Client
As a client, Code Scaffold exposes its rich set of scaffolding primitives to other overarching AI systems (e.g., Devin, Openclaw, or custom harnesses). These parent agents can query Code Scaffold to execute granular tasks, such as:
* "Scaffold a new Next.js route with Firebase authentication."
* "Inject the Rust agent persona into the `.agents` directory."
* "Wire up the Terraform skill."

## Registry Submission

Code Scaffold is designed to be formally submitted to the [ACP Registry](https://github.com/agentclientprotocol/registry), allowing any compatible agentic framework to easily discover and install our scaffolding toolchain.

For more information on the protocol standards, visit the [official repository](https://github.com/agentclientprotocol/agent-client-protocol).
