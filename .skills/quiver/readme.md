# Quiver AI Vector Studio

**Version:** 2
**Target:** `.skills/quiver`
**Category:** Animation & Graphics
**Keywords:** `quiver`, `quiver-ai`, `vector-graphics`, `svg-generation`, `image-vectorization`, `arrow-2`, `arrow-2-telos`, `mcp-server`, `text-to-svg`, `vector-design`

## Description

The Quiver AI Vector Studio skill empowers Code Scaffold agents to synthesize, vectorize, edit, and animate production-ready SVG assets using Quiver AI's Arrow foundation models, native REST endpoints, and hosted Model Context Protocol (MCP) server. It bridges the gap between natural language prompts, raster bitmap sources, and clean, mathematically exact vector code ready for direct embedding into web applications.

## Capabilities & Use Cases

* **Text to SVG Generation**: Generates mathematically precise, scalable, and semantic SVG markup directly from natural language prompts using Arrow 2 Telos, Arrow 2.0, and Arrow 1.1 models via `POST /v1/svgs/generations`.
* **Raster Image Vectorization**: Converts bitmap graphics (PNG, JPEG, WebP, GIF) into resolution-independent SVG paths with intelligent edge tracing, automated cropping to dominant subjects, and configurable target resolution from 128 to 4096 pixels via `POST /v1/svgs/vectorizations`.
* **Multi-Modal Style References**: Accepts public image URLs and base64 payloads to guide aesthetic direction, palette harmony, line weight, and structural layout during vector creation.
* **Model Context Protocol (MCP) Remote Server**: Direct native integration with Quiver's hosted Streamable HTTP MCP server at `https://app.quiver.ai/mcp`, equipping autonomous agents with tools for model discovery, gallery search, vector generation, image vectorization, and artifact inspection.
* **Asynchronous Task Lifecycle Polling**: Robust task handling architecture that tracks asynchronous task states (`queued`, `processing`, `completed`, `failed`, `stopped`) before resolving output creation IDs and fetching final vector code.
* **Dual Preview Extraction**: Supports simultaneous retrieval of raw SVG markup and high-fidelity PNG previews (`includePng: true`) for instant visual feedback within chat interfaces and terminal dashboards.
* **OpenResponses API & Tool Loop Support**: Compatible with the OpenResponses specification backed by Arrow 2, enabling continuous agent conversation loops, function calling (such as automated file writes), and Server-Sent Event (SSE) streaming.
* **OpenAI SDK Drop-In Compatibility**: Supports invoking vector generation pipelines using the standard OpenAI client by configuring the base URL to `https://api.quiver.ai/v1`.
* **Deterministic Test Mode & Mocking**: Full integration with `sk_test_` sandbox keys, allowing developers and CI/CD pipelines to run test suites with zero model dispatch costs and deterministic output validation.
* **SVG Sanitization and Component Compilation**: Cleanses raw AI-generated SVG markup by stripping untrusted scripts and attributes, ensuring valid viewBox scaling, and compiling SVGs into typed React and Vue components.
* **Rate Limit and Telemetry Handling**: Proactively inspects `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`, and `X-Request-ID` headers for automated backoff and telemetry correlation.

## Usage

This skill is designed for the Code Scaffold engine. AI agents and developers should reference `SKILL.md` inside this directory for full endpoint schemas, Node.js and TypeScript client code, MCP server configurations, and vector asset pipeline recipes.

* **v2** : Standardized hasSandbox to false to mount the clean Architectural Contract card on code-scaffold.com.
* **v1** : Initial release with Arrow foundation model catalog (Arrow 2 Telos, Arrow 2.0, Arrow 1.1), Text-to-SVG generation, Image-to-SVG vectorization, hosted MCP server integration, OpenAI SDK compatibility, SVG sanitization, and interactive terminal sandbox.
