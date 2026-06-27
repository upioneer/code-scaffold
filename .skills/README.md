# Agent Skills Library

This directory contains complex code payloads (skills) that the Code Scaffold engine can provision into target projects. Each skill is encapsulated in its own directory and must contain a `meta.json` file defining its properties.

## Available Skills


| Label | Description | Version | Target Path |
| :--- | :--- | :--- | :--- |
| **Ansible** | Infrastructure automation, configuration management, and application deployment orchestration using Ansible. | v1 | `.skills/ansible` |
| **Braille Animations** | Create and manage unicode braille animations and spinners for CLIs and web apps. | v1 | `.skills/braille-animations` |
| **Clerk Authentication Perimeter** | Authentication perimeter and identity management using Clerk. | v1 | `.skills/clerk` |
| **CyberSecurity Toolkit** | Comprehensive cybersecurity arsenal integrating MITRE/NIST framework methodologies and NVIDIA SkillSpector vulnerability scanning. | v2 | `.skills/cybersecurity-toolkit` |
| **Excalidraw** | Renders and embeds Excalidraw whiteboards | v1 | `.skills/excalidraw` |
| **Firebase** | Firebase authentication and database connectivity | v2 | `.skills/firebase` |
| **Firecrawl Scraper** | Crawl and scrape websites to clean markdown or structured data with Firecrawl API & CLI | v1 | `.skills/firecrawl` |
| **GitHub** | GitHub push workflow with .env based identity configuration; merges github.md into the skill | v4 | `.skills/github` |
| **Hyperframes** | Video rendering framework for AI agents to create videos using HTML, CSS, and JS. | v1 | `.skills/hyperframes` |
| **Manim Math Animations** | Mathematical animations using the Manim library. | v1 | `.skills/manim` |
| **Marp** | Generates Marp presentation slides from Markdown | v1 | `.skills/marp` |
| **MCP Generator** | Assists with creating new custom Model Context Protocol (MCP) servers, clients, and apps using official SDKs and best practices. | v2 | `.skills/mcp-generator` |
| **Mermaid** | Mermaid diagram creation and rendering | v1 | `.skills/mermaid` |
| **Node** | Bootstraps a Node.js runtime environment | v1 | `.skills/node` |
| **Open Design Prototypes** | Create production grade UI design prototypes using the open source Open Design system | v1 | `.skills/open-design` |
| **OpenCLI** | Bridge websites and the CLI for structured data extraction and browser automation | v1 | `.skills/opencli` |
| **p5.js Creative Coding** | Creative coding and visual animations using the p5.js library. | v1 | `.skills/p5js` |
| **PlayCanvas Editor** | Visual development environment for real time 3D collaboration. | v1 | `.skills/playcanvas-editor` |
| **PlayCanvas Engine** | Modular 3D/2D game engine for the web supporting WebGL and WebGPU. | v1 | `.skills/playcanvas-engine` |
| **PlayCanvas SuperSplat** | High performance tool for editing and optimizing 3D Gaussian Splats. | v1 | `.skills/playcanvas-supersplat` |
| **Playwright** | Browser automation and end to end testing with Playwright | v1 | `.skills/playwright` |
| **Privacy Policy Generator** | Generates a customizable privacy policy tailored to the project (website/app) with optional Google Analytics integration. | v4 | `.skills/privacy-policy` |
| **Proxmox** | Proxmox VE LXC toolbox for building reusable templates, baseline app deployments, and SSH hardening. | v1 | `.skills/proxmox` |
| **Ratatui TUI Framework** | Build Terminal User Interfaces (TUI) using Ratatui in Rust. | v3 | `.skills/ratatui` |
| **Resend** | Sends emails using the Resend API | v1 | `.skills/resend` |
| **Scrollytelling** | Design architecture, workflows, and code implementations for scroll triggered 3D model manipulation and interactive 'production explosion' views. | v1 | `.skills/scrollytelling` |
| **SEO GEO AEO Auditor** | Unified model agnostic Search Engine, Generative Engine, and Answer Engine Optimization auditor to analyze traditional visibility, AI engine discoverability, and snippet answers. | v1 | `.skills/seo-geo-aeo-auditor` |
| **Supabase** | Supabase database and authentication integration | v1 | `.skills/supabase` |
| **Telegram** | Telegram Bot API interactions | v1 | `.skills/telegram` |
| **Terraform** | Infrastructure as Code (IaC) provisioning and state management using Terraform or OpenTofu. | v1 | `.skills/terraform` |
| **Trackio ML Tracking** | Integration with Trackio for ML experiment tracking, dashboard deployments, and Hugging Face Spaces sync. | v1 | `.skills/trackio` |
| **Upstash Redis Management** | Serverless Redis management and rate limiting using Upstash. | v1 | `.skills/upstash` |
| **Vercel Deployment Routine** | Configuration and deployment routines for Vercel hosting. | v1 | `.skills/vercel` |
| **Website Deploy Linux** | Enterprise Linux Deployment Agent for deploying static sites and SPAs to Nginx locally or remotely via PuTTY CLI (plink/pscp) or SSH, featuring upfront architectural prompting, automatic .env setups, reference scripts, and non destructive folder structures | v5 | `.skills/website-deploy-linux` |

## Modifying Skills

When adding or modifying skills, please refer to the `MANDATORY EXECUTION SEQUENCE (STRICT)` in the root `agent.md`. You must update the respective `meta.json` version, sync the project manifest, and update this README file to reflect the current state.
