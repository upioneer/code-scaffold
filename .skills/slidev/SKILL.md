---
name: Slidev
description: Comprehensive skill for building, configuring, and exporting Slidev markdown presentations.
---

# Slidev Skill Instructions

This skill encapsulates the knowledge required to confidently build, configure, and debug presentations using Slidev (Presentation slides for developers).

## 1. Core Syntax & Architecture

Slidev uses an extended Markdown syntax (`slides.md`) compiled through Vite and Vue 3.

### Basic Syntax
* Use three dashes (`---`) padded with newlines to separate slides.
* The very first YAML block is the **headmatter** (configures the entire deck). Subsequent YAML blocks are **frontmatter** for individual slides.

### Example Slide Deck
```md
---
theme: default
title: My Presentation
---

# Slide 1 Title
Welcome to Slidev.

---
layout: center
---

# Slide 2 Title
Centered content.
```

## 2. UI & Animations

### Animations (Clicks)
* Use the `<v-click>` component or `v-click` directive to animate elements on click.
* `v-after` makes an element appear at the same time as the previous `v-click`.
* `v-click.hide` hides an element after clicking.
* `v-clicks` (plural) applies the click animation to all its child elements automatically.

### Components
* Slidev supports standard Vue components. Any `.vue` file in `components/` is globally available.
* Useful built in components include `<Tweet>`, `<Youtube>`, and `<RenderWhen>`.

## 3. Directory Structure

Slidev has convention based routing and structure:
* `slides.md` : Main entry point.
* `components/` : Custom Vue components.
* `layouts/` : Custom layouts (`.vue` files).
* `public/` : Static assets.
* `snippets/` : Code snippets for import.
* `style.css` : Global styles (injected automatically).

## 4. Configuration Options

### Vite and Vue
* To configure Vite, create a `vite.config.ts` in the root.
* To configure Vue plugins, create `setup/main.ts` or `setup/shiki.ts`.

### UnoCSS
* Slidev uses UnoCSS for styling by default. Configure it via `uno.config.ts`.
* Classes can be applied directly to markdown elements or Vue components.

## 5. Exporting & Hosting

### Exporting (PDF or PNG or PPTX)
* Requires Playwright : `npm i -D playwright-chromium`
* Command to export PDF : `npx slidev export`
* Command to export PNGs : `npx slidev export --format png`
* Command to export PPTX : `npx slidev export --format pptx`
* *Known Issue* : Exporting complex Vue animations to PDF might capture intermediate states. Use `--timeout` or delay modifiers if needed.

### Hosting (SPA)
* Command to build : `npx slidev build`
* This outputs a static Single Page Application in the `dist/` folder.
* Deploy the `dist/` directory to Vercel, Netlify, or GitHub Pages.
* For GitHub Pages, add `base: /<repo_name>/` to the headmatter or pass `--base /<repo_name>/` to the build command.

## 6. Best Practices & Workflows

### AI Integration
* Slidev supports AI features for querying presentations.
* Ensure code snippets are properly fenced and use `shiki` or `monaco` runners for interactive coding slides.

### Workflows for Agents
* **When initializing a Slidev project** : Use `npm create slidev@latest`.
* **When adding custom CSS** : Prefer creating `style.css` in the root over writing inline CSS blocks.
* **When debugging broken layouts** : Ensure the frontmatter YAML is strictly valid (no unescaped colons in titles) and `layout` names match the files in `layouts/` or the theme.
* **When dealing with themes** : Themes are installed via npm (`slidev-theme-NAME`) and declared in the headmatter (`theme: NAME`).

## 7. Known Issues & Limitations
* Strict indentation : YAML frontmatter is highly sensitive to indentation.
* Markdown formatting inside HTML components : Ensure you leave blank lines between HTML tags and Markdown content if you want the Markdown to render correctly inside the tag.
* Browser Support : Since it relies on modern CSS and ES modules, ensure the target runtime supports them.
