---
name: Tasty
description: Code Scaffold's bespoke anti-slop frontend styling engine and command vocabulary for premium design iteration.
version: 2
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

## 2. The Tasty Command Vocabulary

Emulate the precision of advanced design harnesses by recognizing and applying these direct commands during the iteration process:

* `/tasty init` : Scaffolds the environment. Generates a `PRODUCT.md` and `DESIGN.md` in the workspace to lock in the brand, voice, component rules, and anti-references for all future prompts.
* `/tasty polish` : The final pass. Aligns the codebase strictly with the design system, removing stray styles and finalizing the UI.
* `/tasty critique` : UX design review mode. Analyze hierarchy, clarity, and emotional resonance. Do not write code—just critique.
* `/tasty audit` : Run technical quality checks (accessibility, performance, responsiveness, and contrast ratios).
* `/tasty distill` : Strip the UI to its absolute essence. Remove unnecessary visual noise and redundant nested containers.
* `/tasty bolder` : Amplify boring designs. Increase contrast, typography size, or layout asymmetry to make it punchier.
* `/tasty quieter` : Tone down overly bold designs. Introduce more negative space and subtle typography.
* `/tasty animate` : Add purposeful, high-performance motion (e.g., Framer Motion staggered entrances, scroll reveals).
* `/tasty clarify` : Improve unclear or "AI-sounding" UX copy.

---

## 3. The Three Cognitive Dials

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
* **High (8-10):** Cinematic. Scrollytelling reveals, staggered entrances, heavy layout transitions, parallax. (Requires `prefers-reduced-motion` compliance).

---

## 4. The Anti-Slop Manifesto (STRICT BANS)

You are explicitly forbidden from generating the following "AI Tells":

1. **The Font Ban:** Do not use overused fonts like Arial, Inter, or basic system defaults unless explicitly requested. Push for highly curated, geometric, or editorial typefaces.
2. **The "Lila" Rule (No Purple Slop):** Do NOT default to generic purple/blue `#8b5cf6` gradients in backgrounds, buttons, or text unless explicitly defined by the brand.
3. **No Gray on Color:** Never place gray text on a colored background. It destroys contrast and looks fundamentally generated.
4. **No Pure Black or Pure Gray:** Never use pure `#000000` or neutral grays (e.g., `#888888`). Always tint grays and shadows with the background's lowest luminance hue to achieve physical realism.
5. **No Bounce Easing:** Do not use bouncy or elastic easing functions. They feel cheap and dated. Use crisp, purposeful easing curves (e.g., `cubic-bezier(0.16, 1, 0.3, 1)`).
6. **The "Bento Box" Crutch:** Do not default every feature section to a 3-column CSS Grid of rounded cards, and NEVER nest cards inside of cards. Innovate your layouts.
7. **Fake Precision Numbers:** Do not use `24,591` or `99.9%` in hero sections. Use realistic placeholder copy or explicit `[METRIC_WIDGET]` brackets.
8. **Mixed-Font Emphasis:** Do not italicize a single word in a headline with a different serif font unless you are executing a strict "Editorial" aesthetic trajectory.

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
