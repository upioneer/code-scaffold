---
​‌‍name: quarto_publishing
description: Complete skill for architecting, writing, and compiling scientific documents, websites, dashboards, and books using Quarto. Includes guidelines for generating interactive Observable JS blocks and automated CI/CD deployment pipelines.
---

# Quarto Scientific Publishing Skill

This skill equips you with the knowledge and curated templates necessary to build high-fidelity data narratives, websites, and dashboards using [Quarto](https://quarto.org). 

## 1. System Requirements & CLI Usage

Quarto relies on the `quarto` CLI. When executing this skill, first verify if Quarto is installed:
```bash
quarto --version
```
If not installed, instruct the user to install it from `https://quarto.org/docs/get-started/` or use standard package managers (e.g. `winget install JanDeDobbeleer.OhMyPosh` wait, `winget install quarto.quarto`, `brew install --cask quarto`).

### Common Commands
* `quarto render document.qmd` : Compiles a single file.
* `quarto preview document.qmd` : Starts a live-reloading local server.
* `quarto create project <type> <name>` : Scaffolds a new project (`type` can be `default`, `website`, `blog`, `book`, `confluence`).
* `quarto publish gh-pages` : Automates deployment to GitHub pages (requires git tree).

## 2. Anatomy of a `.qmd` File

Quarto Markdown (`.qmd`) uses YAML frontmatter to define the document's properties, format, and behavior, followed by standard markdown interspersed with executable code blocks.

```markdown
---
title: "Global Temperature Analysis"
author: "AI Analyst"
format:
  html:
    theme: cosmo
    toc: true
    code-fold: true
execute:
  echo: false
  warning: false
---

## Introduction
Here is an analysis of the temperature dataset...

```python
import pandas as pd
import matplotlib.pyplot as plt

# The code will be executed and the plot will be embedded directly in the output!
plt.plot([1, 2, 3], [10, 20, 25])
plt.show()
```
```

## 3. High-Value Capabilities (Curated AI Workflows)

As an AI, you can leverage Quarto to provide massive value to the user:

### A. Instant Interactive Dashboards
Quarto can generate highly polished Dashboards using purely markdown and Observable JS (or Python/R). 
To create a dashboard, set `format: dashboard` in the YAML frontmatter.

```markdown
---
title: "Live Metrics Dashboard"
format: dashboard
logo: logo.png
nav-buttons:
  - icon: github
    href: https://github.com/
---

# Row {height=30%}
## Column
```markdown
**Total Revenue**
# $45,000
```
## Column
```markdown
**Active Users**
# 1,250
```

# Row {height=70%}
...
```

### B. Observable JS (OJS)
When writing client-side interactive documents, prefer using `{ojs}` code blocks. Observable JS is reactive by default and requires zero backend server configuration.

```markdown
```{ojs}
// Reactive slider
viewof num = Inputs.range([1, 10], {step: 1, value: 5, label: "Multiplier"})

// Reactive calculation
num * 10
```
```

### C. Automated GitHub Pages CI/CD
To deploy a Quarto website or book, you can utilize the curated GitHub Actions template bundled in this skill at `templates/quarto-publish.yml`.
When a user asks to deploy their Quarto project:
1. Ensure the root directory has a `_quarto.yml` file.
2. Copy `.skills/quarto/templates/quarto-publish.yml` into the user's `.github/workflows/` directory.
3. Commit and push. GitHub Actions will automatically render and publish the Quarto site to the `gh-pages` branch.

## 4. Execution Rules
* **Never** assume Python or R dependencies are installed. Always write out a `requirements.txt` or execute `pip install` when generating computational `.qmd` files that rely on external libraries.
* **Always** use `{ojs}` blocks for lightweight interactive visualizations unless the user specifically requests a Python/R server-backed Shiny application.
* **Keep it Beautiful**: Quarto supports Bootstrap 5 themes. Always inject a premium theme (e.g., `theme: flatly`, `lumen`, `zephyr`, `lux`, or `slate` for dark mode) in the frontmatter rather than leaving it default.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
