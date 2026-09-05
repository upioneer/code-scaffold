#!/usr/bin/env node
/**
 * SkillForge SEO & Discovery Optimizer Playbook
 * Audits and applies SEO, GEO, and search discovery metadata across all skills in .skills/
 * Synchronizes skill-manifest.json, readme.md, and /.skills/README.md
 * 
 * Usage:
 *   node project_details/playbooks/optimize_skill_seo.js
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.resolve(__dirname, '../../.skills');
const ROOT_SKILLS_README = path.join(SKILLS_DIR, 'README.md');

// Domain Categories and Keyword mapping definitions
const SKILL_METADATA = {
  "a2ui": {
    category: "Frontend & UI Design",
    keywords: ["a2ui", "declarative-ui", "json-to-ui", "agent-ui", "adaptive-cards", "dynamic-forms", "design-system"]
  },
  "ansible": {
    category: "DevOps & Infrastructure",
    keywords: ["ansible", "configuration-management", "playbooks", "server-provisioning", "devops", "automation", "yaml"]
  },
  "braille-animations": {
    category: "Animation & Graphics",
    keywords: ["braille-art", "terminal-animations", "ascii-art", "cli-spinners", "text-fx", "tui"]
  },
  "cad-tools": {
    category: "Animation & Graphics",
    keywords: ["cad", "3d-modeling", "step-files", "stl", "parametric-design", "manufacturing", "engineering"]
  },
  "clerk": {
    category: "Data, Databases & Storage",
    keywords: ["clerk", "authentication", "user-management", "jwt", "oauth", "nextjs-auth", "security"]
  },
  "code-scaffold": {
    category: "AI, MCP & Developer Tools",
    keywords: ["code-scaffold", "scaffolding-engine", "project-generator", "templates", "agentic-workflow", "tui"]
  },
  "codebase-memory-mcp": {
    category: "AI, MCP & Developer Tools",
    keywords: ["codebase-memory", "mcp-server", "vector-embeddings", "ast-index", "semantic-search", "rag"]
  },
  "cybersecurity-toolkit": {
    category: "DevOps & Infrastructure",
    keywords: ["cybersecurity", "security-audit", "vulnerability-scan", "owasp", "penetration-testing", "hardening"]
  },
  "excalidraw": {
    category: "Publishing & Documentation",
    keywords: ["excalidraw", "virtual-whiteboard", "hand-drawn-diagrams", "architecture-diagram", "canvas", "visuals"]
  },
  "firebase": {
    category: "Data, Databases & Storage",
    keywords: ["firebase", "firestore", "baas", "authentication", "realtime-database", "cloud-functions", "hosting"]
  },
  "firecrawl": {
    category: "Web Automation & Scraping",
    keywords: ["firecrawl", "web-crawler", "llm-scraping", "clean-markdown", "structured-json", "data-extraction"]
  },
  "github": {
    category: "DevOps & Infrastructure",
    keywords: ["github", "git", "github-actions", "cicd", "pull-requests", "releases", "repo-management"]
  },
  "hyperframes": {
    category: "Frontend & UI Design",
    keywords: ["hyperframes", "micro-frontends", "iframe-orchestration", "cross-window-messaging", "web-components"]
  },
  "kinetic-canvas": {
    category: "Animation & Graphics",
    keywords: ["kinetic-canvas", "canvas-api", "physics-simulation", "interactive-visuals", "particles", "webgl"]
  },
  "lingo": {
    category: "Publishing & Documentation",
    keywords: ["lingo", "localization", "i18n", "translation", "multilingual", "po-editor", "l10n"]
  },
  "manim": {
    category: "Animation & Graphics",
    keywords: ["manim", "math-animation", "python-video", "3b1b", "technical-animations", "scientific-viz"]
  },
  "markmap": {
    category: "Publishing & Documentation",
    keywords: ["markmap", "mindmaps", "markdown-to-mindmap", "interactive-tree", "d3-visualization", "hierarchy"]
  },
  "marp": {
    category: "Publishing & Documentation",
    keywords: ["marp", "markdown-presentations", "slide-deck", "pdf-export", "slide-generator", "presenter"]
  },
  "mcp-generator": {
    category: "AI, MCP & Developer Tools",
    keywords: ["mcp-generator", "model-context-protocol", "fastmcp", "custom-tools", "json-rpc", "agent-integrations"]
  },
  "mermaid": {
    category: "Publishing & Documentation",
    keywords: ["mermaid", "mermaid-cli", "diagrams-as-code", "flowcharts", "sequence-diagrams", "er-diagrams"]
  },
  "node": {
    category: "AI, MCP & Developer Tools",
    keywords: ["node", "nodejs", "npm", "pnpm", "backend-javascript", "runtime", "package-management"]
  },
  "officecli": {
    category: "Publishing & Documentation",
    keywords: ["officecli", "docx", "pptx", "xlsx", "office-documents", "document-automation", "pdf-generation"]
  },
  "open-design": {
    category: "Frontend & UI Design",
    keywords: ["open-design", "design-system", "figma-tokens", "tailwind-tokens", "component-library", "ui-ux"]
  },
  "opencli": {
    category: "Web Automation & Scraping",
    keywords: ["opencli", "cli-to-web", "site-adapters", "terminal-browser", "structured-extraction", "cli-tools"]
  },
  "p5js": {
    category: "Animation & Graphics",
    keywords: ["p5js", "creative-coding", "canvas2d", "generative-art", "interactive-sketches", "webgl"]
  },
  "playcanvas-editor": {
    category: "Animation & Graphics",
    keywords: ["playcanvas-editor", "3d-engine", "webgl", "webgpu", "scene-editor", "gltf", "spatial-dev"]
  },
  "playcanvas-engine": {
    category: "Animation & Graphics",
    keywords: ["playcanvas-engine", "3d-rendering", "shader-graph", "physics-ammo", "webgl2", "webgpu-games"]
  },
  "playcanvas-supersplat": {
    category: "Animation & Graphics",
    keywords: ["gaussian-splats", "3d-splatting", "point-cloud", "photogrammetry", "radiance-fields", "ply-optimizer"]
  },
  "playwright": {
    category: "Web Automation & Scraping",
    keywords: ["playwright", "browser-automation", "e2e-testing", "mobile-viewports", "layout-overflow", "visual-qa"]
  },
  "privacy-policy": {
    category: "Publishing & Documentation",
    keywords: ["privacy-policy", "gdpr", "ccpa", "legal-compliance", "cookie-policy", "terms-of-service"]
  },
  "proxmox": {
    category: "DevOps & Infrastructure",
    keywords: ["proxmox", "proxmox-ve", "lxc-containers", "qemu-vms", "homelab", "hypervisor", "virtualization"]
  },
  "quarto": {
    category: "Publishing & Documentation",
    keywords: ["quarto", "scientific-publishing", "computational-notebooks", "r-python-julia", "dashboards", "academic-docs"]
  },
  "ratatui": {
    category: "Frontend & UI Design",
    keywords: ["ratatui", "rust-tui", "terminal-ui", "crossterm", "cli-dashboard", "console-app"]
  },
  "react-modernization": {
    category: "Frontend & UI Design",
    keywords: ["react-19", "react-server-components", "server-actions", "modernization", "nextjs", "state-management"]
  },
  "resend": {
    category: "Data, Databases & Storage",
    keywords: ["resend", "transactional-email", "react-email", "smtp", "email-api", "deliverability"]
  },
  "revealjs": {
    category: "Publishing & Documentation",
    keywords: ["revealjs", "html-presentations", "3d-transitions", "web-slides", "markdown-slides", "interactive-talks"]
  },
  "rust": {
    category: "AI, MCP & Developer Tools",
    keywords: ["rust", "cargo", "cargo-clippy", "cargo-fmt", "rust-workspaces", "systems-programming", "wasm"]
  },
  "scrollytelling": {
    category: "Frontend & UI Design",
    keywords: ["scrollytelling", "scroll-magic", "gsap-scrolltrigger", "interactive-storytelling", "3d-product-view"]
  },
  "seo-geo-aeo-auditor": {
    category: "Web Automation & Scraping",
    keywords: ["seo", "geo", "aeo", "schema-org", "json-ld", "generative-engine", "answer-engine", "mobile-viewport"]
  },
  "slidev": {
    category: "Publishing & Documentation",
    keywords: ["slidev", "developer-slides", "vue-slides", "markdown-presentations", "unocss", "live-code-demos"]
  },
  "stealth-browser": {
    category: "Web Automation & Scraping",
    keywords: ["stealth-browser", "ghost-graph", "nodriver", "cloudflare-bypass", "antibot", "fastmcp", "smart-scraper"]
  },
  "supabase": {
    category: "Data, Databases & Storage",
    keywords: ["supabase", "postgresql", "row-level-security", "database-auth", "edge-functions", "realtime-db"]
  },
  "tasty": {
    category: "Frontend & UI Design",
    keywords: ["tasty", "anti-slop", "design-tokens", "landing-page", "typography", "micro-animations", "curated-ui"]
  },
  "telegram": {
    category: "Data, Databases & Storage",
    keywords: ["telegram", "telegram-bot-api", "messaging-bot", "webhooks", "bot-automation"]
  },
  "terraform": {
    category: "DevOps & Infrastructure",
    keywords: ["terraform", "opentofu", "infrastructure-as-code", "hcl", "aws-azure-gcp", "state-management"]
  },
  "tldraw": {
    category: "Publishing & Documentation",
    keywords: ["tldraw", "infinite-canvas", "spatial-computing", "whiteboard", "canvas-sdk", "live-collaboration"]
  },
  "trackio": {
    category: "Data, Databases & Storage",
    keywords: ["trackio", "ml-experiment-tracking", "hyperparameters", "metrics-logging", "huggingface-spaces"]
  },
  "tui-tools": {
    category: "Frontend & UI Design",
    keywords: ["tui-tools", "vhs-tapes", "terminal-gif", "ratatui-helpers", "figlet-ascii", "cli-branding"]
  },
  "upstash": {
    category: "Data, Databases & Storage",
    keywords: ["upstash", "serverless-redis", "rate-limiting", "edge-caching", "qstash", "vector-db"]
  },
  "vercel": {
    category: "DevOps & Infrastructure",
    keywords: ["vercel", "edge-deployments", "nextjs-hosting", "serverless-functions", "domain-management"]
  },
  "website-deploy-linux": {
    category: "DevOps & Infrastructure",
    keywords: ["website-deploy-linux", "nginx-deploy", "putty-plink-pscp", "ssh-deployment", "static-hosting", "spa-deploy"]
  }
};

function optimizeAllSkills() {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort();

  console.log(`Found ${skillDirs.length} skills in .skills/`);

  const registryEntries = [];

  for (const skillName of skillDirs) {
    const dirPath = path.join(SKILLS_DIR, skillName);
    const metaPath = path.join(dirPath, 'meta.json');
    const manifestPath = path.join(dirPath, 'skill-manifest.json');
    const readmePath = path.join(dirPath, 'readme.md');
    const skillMdPath = path.join(dirPath, 'SKILL.md');

    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : { label: skillName, version: "1" };
    const defaultMeta = SKILL_METADATA[skillName] || {
      category: "AI, MCP & Developer Tools",
      keywords: [skillName, "tooling", "automation"]
    };

    // 1. Optimize skill-manifest.json
    let manifest = {};
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (e) {
        manifest = {};
      }
    }
    manifest.name = manifest.name || `code_scaffold_${skillName.replace(/-/g, '_')}_skill`;
    manifest.version = String(meta.version || manifest.version || "1");
    manifest.description = meta.description || manifest.description || `${meta.label || skillName} skill for Code Scaffold.`;
    manifest.category = defaultMeta.category;
    manifest.keywords = defaultMeta.keywords;
    manifest.entryPoint = manifest.entryPoint || "./SKILL.md";
    manifest.engines = manifest.engines || { node: ">=18.0.0" };
    manifest.requiredPermissions = manifest.requiredPermissions || ["fs:read", "fs:write", "net:connect"];

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

    // 2. Optimize SKILL.md YAML Frontmatter for Agent Discovery & Trigger Matching
    if (fs.existsSync(skillMdPath)) {
      let skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
      const label = meta.label || skillName;
      const desc = meta.description || manifest.description || `${label} skill for Code Scaffold.`;
      
      const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
      const match = skillMdContent.match(frontmatterRegex);

      if (match) {
        // Frontmatter exists, ensure name and rich description are present
        let fContent = match[1];
        if (!/name:\s*.+/i.test(fContent)) {
          fContent = `name: ${label}\n` + fContent;
        }
        if (!/description:\s*.+/i.test(fContent)) {
          fContent += `\ndescription: ${desc}`;
        }
        skillMdContent = skillMdContent.replace(frontmatterRegex, `---\n${fContent.trim()}\n---\n`);
      } else {
        // No frontmatter, prepend standard YAML frontmatter
        const frontmatter = `---\nname: ${label}\ndescription: ${desc}\n---\n\n`;
        skillMdContent = frontmatter + skillMdContent;
      }
      fs.writeFileSync(skillMdPath, skillMdContent, 'utf8');
    }

    // 3. Optimize readme.md
    if (fs.existsSync(readmePath)) {
      let readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // Enforce category & keywords in header block
      const label = meta.label || skillName;
      const ver = meta.version || "1";
      const cat = defaultMeta.category;
      const kwString = defaultMeta.keywords.map(k => `\`${k}\``).join(', ');

      const headerBlockRegex = /^# [^\n]+\n\n\*\*Version:\*\*[^\n]+\n\*\*Target:\*\*[^\n]+(?:\n\*\*Category:\*\*[^\n]+)?(?:\n\*\*Keywords:\*\*[^\n]+)?/m;
      const newHeaderBlock = `# ${label}\n\n**Version:** ${ver}\n**Target:** \`.skills/${skillName}\`\n**Category:** ${cat}\n**Keywords:** ${kwString}`;

      if (headerBlockRegex.test(readmeContent)) {
        readmeContent = readmeContent.replace(headerBlockRegex, newHeaderBlock);
      } else {
        // Fallback replacement if structure slightly varied
        readmeContent = readmeContent.replace(/^# [^\n]+/, `# ${label}\n\n**Version:** ${ver}\n**Target:** \`.skills/${skillName}\`\n**Category:** ${cat}\n**Keywords:** ${kwString}`);
      }

      // Typography sanitizer (NO en-dashes/em-dashes, hyphens only in code/links)
      readmeContent = readmeContent
        .replace(/—/g, ': ')
        .replace(/–/g, ': ');

      fs.writeFileSync(readmePath, readmeContent, 'utf8');
    }

    registryEntries.push({
      name: meta.label || skillName,
      folder: skillName,
      category: defaultMeta.category,
      keywords: defaultMeta.keywords,
      version: `v${meta.version || "1"}`,
      description: meta.description || manifest.description || ""
    });
  }

  // 3. Generate Global /.skills/README.md Registry
  console.log('Generating updated /.skills/README.md index...');
  let globalReadme = `# Code Scaffold Skills Library\n\n`;
  globalReadme += `Welcome to the official **Code Scaffold Skills Library**. This curated registry provides specialized agentic capabilities, developer automation toolkits, and infrastructure blueprints.\n\n`;
  globalReadme += `## Index by Functional Category\n\n`;

  // Group by category
  const categories = [...new Set(registryEntries.map(e => e.category))].sort();

  for (const cat of categories) {
    globalReadme += `### ${cat}\n\n`;
    globalReadme += `| Skill | Description | Search Keywords | Version | Path |\n`;
    globalReadme += `| :--- | :--- | :--- | :--- | :--- |\n`;

    const items = registryEntries.filter(e => e.category === cat);
    for (const item of items) {
      const kwPreview = item.keywords.slice(0, 3).map(k => `\`${k}\``).join(', ');
      // Clean description of any em dashes
      const cleanDesc = item.description.replace(/—/g, ': ').replace(/–/g, ': ').replace(/\|/g, '/');
      globalReadme += `| **${item.name}** | ${cleanDesc} | ${kwPreview} | ${item.version} | \`.skills/${item.folder}\` |\n`;
    }
    globalReadme += `\n`;
  }

  globalReadme += `## Discovery & Ad-Hoc CLI Installation\n\n`;
  globalReadme += `Every skill in this registry includes a standardized \`skill-manifest.json\` distribution payload. You can discover, inspect, and install any individual skill ad-hoc into your workspace:\n\n`;
  globalReadme += `\`\`\`bash\n`;
  globalReadme += `# Search skills by keyword or domain\n`;
  globalReadme += `code-scaffold skills search <keyword>\n\n`;
  globalReadme += `# Install a skill into your current repository\n`;
  globalReadme += `code-scaffold skills install <skill-name>\n`;
  globalReadme += `\`\`\`\n`;

  fs.writeFileSync(ROOT_SKILLS_README, globalReadme, 'utf8');
  console.log(`[OK] Optimized all ${skillDirs.length} skills for SEO, GEO & AEO discovery.`);
}

if (require.main === module) {
  optimizeAllSkills();
}

module.exports = { optimizeAllSkills };
