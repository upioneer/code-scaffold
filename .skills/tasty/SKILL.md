---
name: Tasty
description: Code Scaffold's bespoke anti-slop frontend styling engine for premium landing pages and portfolios.
version: 1
---

# Tasty: Code Scaffold's Native Anti-Slop Engine

You are executing frontend layouts under the **Tasty** directive. 
Tasty is Code Scaffold's cognitive enforcer designed to override generic LLM aesthetic biases. It ensures all generated DOMs, React components, and styling architectures feel uniquely crafted, deeply premium, and undeniably human.

**Your Goal:** Ship interfaces that look like they belong on Awwwards or heavily curated design showcases. Avoid the "AI boilerplate" look at all costs.

---

## 1. The Design Trajectory Read

Before outputting a single line of CSS or Tailwind, you must first read the user's intent to establish a clear **Aesthetic Trajectory**. Do not assume a default "clean SaaS" look.

If the user does not specify, infer the trajectory from the project's purpose:
* **Brutalist / Editorial:** High contrast, massive typography, raw grids, stark borders. (Best for creative portfolios, avant-garde brands).
* **Premium Consumer (Glass & Glow):** Dark modes, subtle deep blurs, precise radial gradients (NO purple unless branded), micro-borders, ultra-smooth physics. (Best for AI products, Web3, FinTech).
* **Public-Sector / Accessible:** High utility, strict WCAG contrast, unambiguous focus states, utilitarian spacing. (Best for dashboards, enterprise portals).

---

## 2. The Three Cognitive Dials

You must internally calibrate the following three dials to prevent generic rendering:

### Dial 1: Design Variance (1 to 10)
* **Low (1-3):** Safe, predictable, traditional layouts (e.g. standard Nav -> Hero -> Bento Grid -> Footer).
* **High (8-10):** Unorthodox architectures. Asymmetric grids, overlapping DOM elements, horizontal scroll sections, sticky-stacking index cards, floating toolbars. 
* *Always push this dial above a 6 unless building a strict enterprise dashboard.*

### Dial 2: Visual Density (1 to 10)
* **Low (1-3):** Apple-esque. Massive negative space. Elements breathe heavily. Sparse borders.
* **High (8-10):** Information-rich. Bloomberg terminal aesthetics. Tight margins, microscopic utility fonts, dense tabular grids.

### Dial 3: Motion Intensity (1 to 10)
* **Low (1-3):** Static pages. Only subtle hover state opacities.
* **High (8-10):** Cinematic. Scrollytelling reveals, Framer Motion staggered entrances, heavy layout transitions, parallax. (Requires `prefers-reduced-motion` compliance).

---

## 3. The Anti-Slop Manifesto (STRICT BANS)

You are explicitly forbidden from generating the following "AI Tells":

1. **The "Lila" Rule (No Purple Slop):** Do NOT default to generic purple/blue `#8b5cf6` gradients in backgrounds, buttons, or text unless explicitly defined by the brand's primary color palette.
2. **Fake Precision Numbers:** Do not use `24,591` or `99.9%` in hero sections. Use realistic placeholder copy or explicit `[METRIC_WIDGET_TBD]` brackets.
3. **Pure Black Drop Shadows:** Never use `box-shadow: 0 4px 6px rgba(0,0,0,0.5)`. Shadows must be tinted with the background's lowest luminance hue and stacked using multi-layered CSS for realism.
4. **The "Bento Box" Crutch:** Do not default every feature section to a 3-column CSS Grid of rounded cards. Innovate your layouts. Use bento boxes *only* when displaying genuinely disparate, widget-style data.
5. **Mixed-Font Emphasis:** Do not italicize a single word in a headline with a different serif font unless you are executing a strict "Editorial" aesthetic trajectory.

---

## 4. Component-Level Discipline

* **Typography Architecture:** Restrict your font-family usage. Use max 2 typefaces. One for display/headers, one for body. Implement strict rem-based typography scales (e.g., `1.125rem`, `1.5rem`, `2rem`, `3rem`, `4.5rem`). Cap `line-height` tighter on large headers (1.0 to 1.1) and looser on body text (1.5 to 1.6).
* **Hero Section Constraints:** Cap the `max-width` of hero text. Do not let `h1` or `<p>` tags stretch across the entire viewport. Keep line lengths between 45 and 75 characters (`max-w-2xl` in Tailwind).
* **Intelligent Navbars:** Ensure navbars do not wrap terribly on mid-size screens. Implement mobile hamburger menus or hide tertiary links cleanly.

---

## 5. Code Scaffold Headless Mechanics

As an AI agent operating within the Code Scaffold ecosystem, you must adhere to our automated lifecycle rules:

### A. Headless Visual Auditing
You cannot natively "see" the DOM to verify you avoided the slop. Therefore, whenever you execute significant frontend rendering:
1. You MUST utilize the `playwright` skill to programmatically capture a full-page `.png` screenshot of the dev server.
2. You MUST analyze this screenshot via Vision to mathematically verify layout integrity (checking contrast ratios, overlapping flex-wraps, and font sizing).
3. Do not proceed to commit if the visual integrity fails.

### B. Autonomous Asset Provisioning
Do not leave dead `<img src="" alt="TODO" />` tags. 
You must either generate placeholder assets via a local python image generation script/MCP, or fetch high-quality dynamic Unsplash source URLs based on the aesthetic trajectory. Your UIs must look complete upon first render.

### C. Git-Native Review Branches
When overhauling an existing application's aesthetic, never push directly to `main`. Instantiate a discrete `feat/tasty-redesign` branch, apply the layouts, capture the visual proof, and allow the user to review the isolated design drift.
