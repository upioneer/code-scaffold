import fs from "node:fs";
import path from "node:path";

const SLUGS = [
  "text-morph", "status-button", "number-roll", "pricing-toggle", "waitlist-field",
  "code-input", "steps-form", "date-range-picker", "morphing-nav", "feature-tabs",
  "scroll-story", "stats-band", "announcement-pill", "testimonials", "faq-accordion",
  "logo-marquee", "expanding-gallery", "card-deck", "workflow-canvas", "image-compare",
  "magnifying-dock", "hold-to-confirm", "precision-dial", "swipe-actions", "radial-menu",
  "drop-zone", "wheel-picker", "morphing-chart", "range-ruler", "ratio-balancer",
  "split-pane", "command-palette", "toast-stack", "live-activity", "live-cursors",
  "live-map", "theme-toggle", "pricing-calculator", "comparison-table", "onboarding-checklist",
  "sortable-list", "changelog-timeline", "changelog-trace", "changelog-scrubber", "cookie-banner",
  "newsletter-footer", "prompt-composer", "agent-composer", "mention-menu", "attachment-chip",
  "mode-switcher", "model-picker", "voice-input", "voice-note", "thinking-indicator",
  "thinking-trace", "tool-call", "clarifying-question", "approval-card", "plan",
  "web-research", "command-output", "task-progress", "task-log", "streaming-answer",
  "code-block", "citation", "response-versions", "selection-actions", "inline-rewrite",
  "diff-review", "action-receipt", "chat-notice", "usage-meter", "usage-limits",
  "chat-scroll", "message-edit", "chat-history", "earnings-chart", "steps-chart",
  "revenue-chart", "area-chart", "combo-chart", "stage-bars", "activity-rings",
  "agent-playback"
];

const CATEGORIES = {
  "interactive-controls": [
    "text-morph", "status-button", "number-roll", "code-input", "hold-to-confirm",
    "precision-dial", "swipe-actions", "radial-menu", "drop-zone", "wheel-picker",
    "range-ruler", "ratio-balancer", "theme-toggle", "mode-switcher"
  ],
  "navigation-and-layout": [
    "pricing-toggle", "morphing-nav", "feature-tabs", "magnifying-dock",
    "split-pane", "command-palette", "toast-stack", "mention-menu"
  ],
  "conversion-surfaces": [
    "waitlist-field", "announcement-pill", "testimonials", "faq-accordion",
    "logo-marquee", "expanding-gallery", "card-deck", "workflow-canvas",
    "image-compare", "pricing-calculator", "comparison-table",
    "onboarding-checklist", "cookie-banner", "newsletter-footer"
  ],
  "forms-and-storytelling": [
    "steps-form", "date-range-picker", "scroll-story", "stats-band", "sortable-list"
  ],
  "realtime-telemetry": [
    "live-activity", "live-cursors", "live-map", "changelog-timeline",
    "changelog-trace", "changelog-scrubber"
  ],
  "agentic-interfaces": [
    "prompt-composer", "agent-composer", "attachment-chip", "model-picker",
    "voice-input", "voice-note", "thinking-indicator", "thinking-trace",
    "tool-call", "clarifying-question", "approval-card", "plan",
    "web-research", "command-output", "task-progress", "task-log",
    "streaming-answer", "code-block", "citation", "response-versions",
    "selection-actions", "inline-rewrite", "diff-review", "action-receipt",
    "chat-notice", "usage-meter", "usage-limits", "chat-scroll",
    "message-edit", "chat-history", "agent-playback"
  ],
  "kinetic-charts": [
    "morphing-chart", "earnings-chart", "steps-chart", "revenue-chart",
    "area-chart", "combo-chart", "stage-bars", "activity-rings"
  ]
};

function getCategoryForSlug(slug) {
  for (const [cat, list] of Object.entries(CATEGORIES)) {
    if (list.includes(slug)) return cat;
  }
  return "interactive-controls";
}

function sanitizeContent(content, slug, title) {
  let cleaned = content;
  // Strip top banner / comments referencing upstream brand
  cleaned = cleaned.replace(/\/\/\s*Hairline\s*UI[^\n]*\n/gi, "");
  cleaned = cleaned.replace(/\/\/\s*Copyright[^\n]*Hairline[^\n]*\n/gi, "");
  cleaned = cleaned.replace(/https:\/\/hairlineui\.com[^\s"'\`)]*/gi, "#");
  cleaned = cleaned.replace(/hairlineui\.com/gi, "code-scaffold.local");
  cleaned = cleaned.replace(/hairline-theme/gi, "cs-theme");
  cleaned = cleaned.replace(/Hairline\s*UI/gi, "Code Scaffold Tactile Kinetics");
  cleaned = cleaned.replace(/Hairline/gi, "Tactile");

  // Add standardized Code Scaffold proprietary banner
  const banner = `// Code Scaffold · UI Primitives · Tactile Kinetic Matrix\n// Component: ${title} (${slug})\n// Pure React and Web Animations API · Zero External Styling Dependencies\n\n`;
  cleaned = banner + cleaned.trimStart();
  return cleaned;
}

async function run() {
  console.log("Scavenging all 86 Tactile Kinetic components...");
  const registryDir = path.resolve(".skills/ui-primitives/registry");
  const componentsDir = path.join(registryDir, "components");

  fs.mkdirSync(componentsDir, { recursive: true });

  const manifest = {
    registryVersion: "1.0.0",
    totalComponents: SLUGS.length,
    description: "Code Scaffold Tactile Kinetic Component Matrix: 86 high-fidelity React micro-interaction primitives and agentic UI surfaces.",
    categories: Object.keys(CATEGORIES),
    components: []
  };

  for (let i = 0; i < SLUGS.length; i++) {
    const slug = SLUGS[i];
    process.stdout.write(`[${i + 1}/${SLUGS.length}] Fetching ${slug}... `);

    const res = await fetch(`https://hairlineui.com/r/${slug}.json`);
    if (!res.ok) {
      console.log(`FAILED (${res.status})`);
      continue;
    }

    const data = await res.json();
    const title = data.title || slug;
    const desc = data.description || "";
    const category = getCategoryForSlug(slug);

    const componentRecord = {
      slug,
      title,
      description: desc,
      category,
      dependencies: data.dependencies || [],
      files: []
    };

    if (data.files && Array.isArray(data.files)) {
      for (const file of data.files) {
        const rawFileName = path.basename(file.path);
        const sanitizedFileName = rawFileName.replace(/hairline/gi, "tactile");
        const sanitizedPath = path.join(componentsDir, sanitizedFileName);
        const sanitizedCode = sanitizeContent(file.content, slug, title);

        fs.writeFileSync(sanitizedPath, sanitizedCode, "utf8");
        componentRecord.files.push({
          fileName: sanitizedFileName,
          relativePath: `registry/components/${sanitizedFileName}`
        });
      }
    }

    manifest.components.push(componentRecord);
    console.log(`OK (${componentRecord.files.length} file(s))`);
  }

  const manifestPath = path.join(registryDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nSuccessfully wrote manifest to ${manifestPath}`);
  console.log(`Total components registered: ${manifest.components.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
