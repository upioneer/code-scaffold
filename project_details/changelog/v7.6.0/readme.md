# Code Scaffold v7.6.0

**Release Date**: July 19, 2026

## Overview
This minor release introduces the **Quarto Scientific Publishing** skill and officially integrates the **SkillForge Synergy Protocol** into the Code Scaffold ecosystem. Together, these additions empower agents to orchestrate complex computational narratives and maintain the ecosystem's topological integrity.

## Changelog

### Agent Skills
* **Quarto Scientific Publishing (v1)**: Added a highly curated Quarto skill located at `.skills/quarto`.
  * Empowers agents to orchestrate Python, R, Julia, and Observable JS (`{ojs}`) within a single markdown document.
  * Embeds instructions for generating beautiful interactive dashboards and data pipelines without backend server requirements.
  * Bundled with a zero-configuration `.github/workflows/quarto-publish.yml` template to automate GitHub Pages deployments.

### Core Ecosystem
* **The SkillForge Synergy Protocol**: Officially documented and implemented the SkillForge Protocol as the autonomous R&D and maintenance loop for the `.skills` directory.
  * **Blueprint**: Authored `project_details/skillforge/PROTOCOL.md` to instruct agents on conducting market pulse audits, cross-skill topology mapping, and strict net-new skill incubation.
  * **Visual Topology**: Enforced rules requiring agents to leverage `mermaid-cli` to compile vector graphics (`.svg`) illustrating the dependency mappings of all skills, ensuring Code Scaffold's architectural evolution is permanently visualized.
  * **Root Documentation**: Appended SkillForge mechanics to the core `README.md` and created a dedicated human-facing dashboard at `project_details/skillforge/readme.md`.
