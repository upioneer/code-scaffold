---
name: playwright_automation
description: Complete browser automation with Playwright. Auto-detects dev servers, authors declarative YAML workflows for deterministic testing. Test pages, fill forms, take screenshots, validate UX. Use when user wants to test websites, automate browser interactions, or perform browser-based testing.
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:
- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

General-purpose browser automation skill. I will orchestrate browser automation tasks using rigid, declarative YAML workflows rather than executing opaque javascript scripts, guaranteeing deterministic execution.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:

   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(servers => console.log(JSON.stringify(servers)))"
   ```

   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Author YAML Workflows** - NEVER write raw JS test scripts to `/tmp`. Always author declarative YAML workflow definitions in the `workflows/` directory.

3. **Use visible browser by default** - Always set `headless: false` in the YAML config unless user specifically requests headless mode.

4. **Parameterize URLs** - Always make URLs configurable via CEL expressions (e.g. `${env.TARGET_URL}`).

## How It Works
1. You describe what you want to test/automate
2. I auto-detect running dev servers (or ask for URL if testing external site)
3. I author a custom declarative Playwright YAML workflow in the `workflows/` directory.
4. I execute it via the native manifest engine: `code-scaffold run workflows/test-*.yaml`
5. Results are parsed by the engine safely without evaluating arbitrary Javascript.

## Execution Pattern
**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**Step 2: Author declarative YAML workflow**

```yaml
# workflows/test-page.yaml
name: Basic Page Load Test
trigger: manual
jobs:
  test_load:
    steps:
      - name: Launch Browser
        model: browser/playwright
        method: launch
        args:
          headless: false
      - name: Navigate
        model: browser/playwright
        method: goto
        args:
          url: ${env.TARGET_URL}
      - name: Capture Screenshot
        model: browser/playwright
        method: screenshot
        args:
          path: /tmp/screenshot.png
          fullPage: true
```

**Step 3: Execute via the Scaffold Engine**

```bash
cd $SKILL_DIR && code-scaffold run workflows/test-page.yaml
```

### Test Login Flow (Declarative)
```yaml
# workflows/test-login.yaml
name: Authentication Flow
trigger: manual
jobs:
  login:
    steps:
      - name: Launch Browser
        model: browser/playwright
        method: launch
        args:
          headless: false
      - name: Navigate to Login
        model: browser/playwright
        method: goto
        args:
          url: ${env.TARGET_URL}/login
      - name: Fill Email
        model: browser/playwright
        method: fill
        args:
          selector: 'input[name="email"]'
          value: ${vault.test_email}
      - name: Fill Password
        model: browser/playwright
        method: fill
        args:
          selector: 'input[name="password"]'
          value: ${vault.test_password}
      - name: Submit
        model: browser/playwright
        method: click
        args:
          selector: 'button[type="submit"]'
      - name: Verify Redirect
        model: browser/playwright
        method: waitForURL
        args:
          url: '**/dashboard'
```

### Check for Broken Links (Declarative)
```yaml
# workflows/test-links.yaml
name: Broken Link Auditor
trigger: manual
jobs:
  audit_links:
    steps:
      - name: Launch Browser
        model: browser/playwright
        method: launch
        args:
          headless: false
      - name: Navigate
        model: browser/playwright
        method: goto
        args:
          url: ${env.TARGET_URL}
      - name: Extract and Verify Links
        model: browser/playwright
        method: audit_links
        args:
          selector: 'a[href^="http"]'
          fail_on_404: true
```

## Tips
- **CRITICAL: Detect servers FIRST** - Always run server detection before writing workflows for localhost testing
- **Declarative Only** - You must use YAML workflows modeled on the SkillForge Swamp Protocol. Do not write JS.
- **Zero-Trust Secrets** - Never hardcode passwords. Always use CEL expression injection like `${vault.test_password}`.
- **DEFAULT: Visible browser** - Always set `headless: false` in your YAML unless user explicitly asks for headless mode
