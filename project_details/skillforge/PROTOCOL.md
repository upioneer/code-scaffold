# The SkillForge & Synergy Protocol

**Role:** Autonomous R&D and Ecosystem Maintenance
**Execution Scope:** `code-scaffold/.skills`

The SkillForge Protocol is an advanced administrative routine designed to guarantee that Code Scaffold's agentic skill library never stagnates. It can be triggered ad-hoc or scheduled via recurring crons.

## Core Directives

When an AI agent is instructed to "Run the SkillForge Protocol", it must adhere to the following operational phases:

### Phase 1: Market Pulse & Trend Auditing
1. Identify the target skill(s).
2. Execute live web searches against official OEM documentation, GitHub releases, and trending community discussions.
3. Identify deprecations, paradigm shifts, or new capabilities (e.g., shifts to modern bundlers, new API endpoints, security patches).
4. Refactor the existing `SKILL.md` instructions and bundled templates to adhere strictly to the modern standard.

### Phase 2: Cross-Skill Synergy & Visual Topology
1. Recursively analyze the `meta.json` and `SKILL.md` payloads of disparate skills within the `.skills/` directory.
2. Identify topological overlap (e.g., `Playwright` + `GitHub Actions`, or `Supabase` + `A2UI`).
3. Generate bespoke, cross-skill integration templates to bridge these domains.
4. **Visual Mapping (Mandatory Retention):** Utilize available visualization skills to programmatically output dependency graphs. If using Mermaid, you MUST compile the raw `.mmd` code into a vector graphic using the CLI (`npx -y @mermaid-js/mermaid-cli -i <input.mmd> -o <output.svg>`).
   * **Retention Policy:** You MUST store all generated visual assets (like the raw `.mmd` and the compiled `.svg`) exclusively in `project_details/skillforge/diagrams/`. 
   * **Versioning:** Maintain a strict incremental naming convention (e.g., `topology_v1.svg`). Do not overwrite historical diagrams; preserve them to maintain an immutable history of Code Scaffold's architectural evolution.
   * **Root Propagation:** After saving the versioned `.svg` in the `diagrams/` folder, you MUST immediately copy/overwrite that file into `project_details/skillforge/topology.svg` to act as the live, latest pointer. You must also proactively ensure the human-facing `project_details/skillforge/readme.md` file correctly embeds this SVG (`![Skill Topology](topology.svg)`).

### Phase 3: Net-New Incubation Pipeline
When generating a *new* skill, agents MUST strictly follow this pipeline without skipping steps:
1. **Deep Ingestion:** Read all available OEM documentation.
2. **AI Value-Add:** Do not just write a wrapper. Brainstorm and embed workflows optimized specifically for headless AI operations (e.g., bypassing Cloudflare, silent testing loops, pre-configured GitHub Actions).
3. **Scaffolding Compliance:**
   - Provision a strictly validated `meta.json`.
   - Provision an ad-hoc distribution `skill-manifest.json`.
   - Generate a `readme.md` strictly following the unified Code Scaffold typographic rules (NO en/em dashes, NO hyphens as punctuation).
4. **Sandbox & Demo Generation:**
   - You MUST generate a live interactive sandbox or "demo" page for the skill in `project_details/proof/<skill-name>-sandbox`.
   - The sandbox must comply strictly with the constraints defined in `project_details/sandbox-architecure.md` (e.g., single-file bundle via Vite, relative paths, dark mode presentation, heavy asset fallbacks).
   - Once the sandbox is built and verified, deploy it to `.skills/<skill-name>/sandbox/index.html` using the provided playbook script `project_details/playbooks/build_sandbox.ps1 <skill-name>`.
5. **Payload Crafting:** Write a deep, technically advanced `SKILL.md` that serves as the cognitive blueprint for future agents.

## Execution Templates

**Ad-Hoc Prompt:**
> "Run the SkillForge Protocol to build a new skill for [Domain]. Research the latest OEM docs, enforce the Code Scaffold architecture, and ensure you cross-reference existing skills to build synergistic templates and visual dependency diagrams using tldraw/mermaid."

**Scheduled Pulse Check (via `/schedule`):**
> `/schedule cron="0 0 * * 0" prompt="Run the SkillForge Pulse Check. Review the top 5 skills in the .skills directory against the live web to see if any underlying frameworks have released major updates. Update their SKILL.md and templates to match current market trends, and output a Mermaid diagram summarizing the updates."`
