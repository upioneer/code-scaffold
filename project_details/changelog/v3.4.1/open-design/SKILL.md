---
name: open_design
description: Specialized skill for initializing and configuring Open Design, an open-source alternative to Claude Design, to generate interactive brand-grade UI design artifacts.
---

# Open Design Skill

When the user asks to integrate or set up Open Design for generating production-grade UI prototypes, web layouts, slides, or brand assets, follow these instructions exactly:

1. **Verify Open Design Dependencies**
   * Ensure that standard coding CLI tools (like Claude Code, Cursor, or Codex) are accessible on the local system to serve as the design engine.
   * If a hosted deployment is preferred, guide the user through setting up the Vercel hosting parameters and environment variables.

2. **Scaffold Open Design Configuration**
   * Create an initial Open Design settings directory (e.g. `.opendesign/` or `.open-design/` in the target project).
   * Specify preferred styling guidelines, target frameworks (such as HTML, Tailwind CSS, or React), and layout structures inside the configuration payload.

3. **Incorporate Brand-Grade Design Systems**
   * Select a visual theme based on premium brand systems (such as Notion, Linear, Stripe, or Vercel).
   * Provide the AI agent with specific brand parameters, font systems (like Google Fonts Inter or Outfit), clean dual-tone color palettes, and glassmorphism settings.

4. **Automate Design Export Workflows**
   * Bootstrap scripts or commands to run the local Open Design server:
     `npx open-design dev` (or equivalent CLI command).
   * Document export targets:
     * HTML interactive prototype.
     * PDF presentation layout.
     * Slide deck exports (PPTX).
