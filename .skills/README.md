# Agent Skills Library

This directory contains complex code payloads (skills) that the Code Scaffold engine can provision into target projects. Each skill is encapsulated in its own directory and must contain a `meta.json` file defining its properties.

## Available Skills


| Label | Description | Version | Target Path |
| :--- | :--- | :--- | :--- |
| **A2UI** | Agent-to-User Interface (A2UI) protocol implementation and client renderer scaffolding. | v1 | `.skills/a2ui` |
| **Ansible** | Infrastructure automation, configuration management, and application deployment orchestration using Ansible. | v2 | `.skills/ansible` |
| **Braille Animations** | Create and manage unicode braille animations and spinners for CLIs and web apps. | v2 | `.skills/braille-animations` |
| **Clerk Authentication Perimeter** | Authentication perimeter and identity management using Clerk. | v2 | `.skills/clerk` |
| **Code Scaffold Harness** | Agent harness instructions for interacting with the Code Scaffold CLI headlessly. | v2 | `.skills/code-scaffold` |
| **CyberSecurity Toolkit** | Comprehensive cybersecurity arsenal integrating MITRE/NIST framework methodologies and NVIDIA SkillSpector vulnerability scanning. | v5 | `.skills/cybersecurity-toolkit` |
| **Excalidraw** | Renders and embeds Excalidraw whiteboards | v2 | `.skills/excalidraw` |
| **Firebase** | Firebase authentication and database connectivity | v3 | `.skills/firebase` |
| **Firecrawl Scraper** | Crawl and scrape websites to clean markdown or structured data with Firecrawl API & CLI | v2 | `.skills/firecrawl` |
| **GitHub** | GitHub push workflow with .env based identity configuration; merges github.md into the skill | v5 | `.skills/github` |
| **Hyperframes** | Video rendering framework for AI agents to create videos using HTML, CSS, and JS. | v2 | `.skills/hyperframes` |
| **MCP Generator** | Assists with creating new custom Model Context Protocol (MCP) servers, clients, and apps using official SDKs and best practices. | v3 | `.skills/mcp-generator` |
| **Manim Math Animations** | Mathematical animations using the Manim library. | v2 | `.skills/manim` |
| **Markmap** | Interactive hierarchical mindmaps derived directly from standard markdown syntax. | v1 | `.skills/markmap` |
| **Marp** | Generates Marp presentation slides from Markdown | v2 | `.skills/marp` |
| **Mermaid** | Mermaid diagram creation and rendering | v2 | `.skills/mermaid` |
| **Node** | Bootstraps a Node.js runtime environment | v4 | `.skills/node` |
| **Open Design Prototypes** | Create production grade UI design prototypes using the open source Open Design system | v2 | `.skills/open-design` |
| **OpenCLI** | Bridge websites and the CLI for structured data extraction and browser automation | v2 | `.skills/opencli` |
| **p5.js Creative Coding** | Creative coding and visual animations using the p5.js library. | v2 | `.skills/p5js` |
| **PlayCanvas Editor** | Visual development environment for real time 3D collaboration. | v2 | `.skills/playcanvas-editor` |
| **PlayCanvas Engine** | Modular 3D/2D game engine for the web supporting WebGL and WebGPU. | v2 | `.skills/playcanvas-engine` |
| **PlayCanvas SuperSplat** | High performance tool for editing and optimizing 3D Gaussian Splats. | v2 | `.skills/playcanvas-supersplat` |
| **Playwright** | Browser automation and end to end testing with Playwright | v2 | `.skills/playwright` |
| **Privacy Policy Generator** | Generates a customizable privacy policy tailored to the project (website/app) with optional Google Analytics integration. | v5 | `.skills/privacy-policy` |
| **Proxmox** | Proxmox VE LXC toolbox for building reusable templates, baseline app deployments, and SSH hardening. | v2 | `.skills/proxmox` |
| **Quarto Scientific Publishing** | Scientific and technical publishing system for dynamically generating books, websites, dashboards, and presentations. | v1 | `.skills/quarto` |
| **Ratatui TUI Framework** | Build Terminal User Interfaces (TUI) using Ratatui in Rust. | v4 | `.skills/ratatui` |
| **Resend** | Sends emails using the Resend API | v2 | `.skills/resend` |
| **Reveal.js** | Comprehensive toolkit and knowledge base for scaffolding, configuring, and exporting Reveal.js presentations. | v2 | `.skills/revealjs` |
| **Rust** | Orchestrates Rust workspace topologies, optimized compilation profiles, and local automation scripts. | v1 | `.skills/rust` |
| **Scrollytelling** | Design architecture, workflows, and code implementations for scroll triggered 3D model manipulation and interactive 'production explosion' views. | v2 | `.skills/scrollytelling` |
| **SEO GEO AEO Auditor** | Unified model agnostic Search Engine, Generative Engine, and Answer Engine Optimization auditor to analyze traditional visibility, AI engine discoverability, and snippet answers. | v2 | `.skills/seo-geo-aeo-auditor` |
| **Slidev** | Comprehensive skill for building, configuring, and exporting Slidev markdown presentations. | v2 | `.skills/slidev` |
| **Stealth Browser MCP** | Undetectable browser automation for AI agents, bypassing Cloudflare and antibots via nodriver and CDP. | v1 | `.skills/stealth-browser-mcp` |
| **Supabase** | Supabase database and authentication integration | v2 | `.skills/supabase` |
| **Telegram** | Telegram Bot API interactions | v2 | `.skills/telegram` |
| **Terraform** | Infrastructure as Code (IaC) provisioning and state management using Terraform or OpenTofu. | v2 | `.skills/terraform` |
| **tldraw** | Transforms tldraw into an advanced spatial computing engine. Orchestrates cinematic scrollytelling, live-mutating dashboards, AI cursors, and Matter.js physics integrations. | v1 | `.skills/tldraw` |
| **Trackio ML Tracking** | Integration with Trackio for ML experiment tracking, dashboard deployments, and Hugging Face Spaces sync. | v2 | `.skills/trackio` |
| **TUI Tools** | Architectural playbook and tooling (including VHS integration) for building robust, instant-on, and visually stunning modern terminal splash screens and integrations. | v4 | `.skills/tui-tools` |
| **Upstash Redis Management** | Serverless Redis management and rate limiting using Upstash. | v2 | `.skills/upstash` |
| **Vercel Deployment Routine** | Configuration and deployment routines for Vercel hosting. | v2 | `.skills/vercel` |
| **Website Deploy Linux** | Enterprise Linux Deployment Agent for deploying static sites and SPAs to Nginx locally or remotely via PuTTY CLI (plink/pscp) or SSH, featuring upfront architectural prompting, automatic .env setups, reference scripts, and non destructive folder structures | v6 | `.skills/website-deploy-linux` |

## Modifying Skills

When adding or modifying skills, please refer to the `MANDATORY EXECUTION SEQUENCE (STRICT)` in the root `agent.md`. You must update the respective `meta.json` version, sync the project manifest, and update this README file to reflect the current state.
