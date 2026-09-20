const fs = require('fs');
const path = require('path');

const CANONICAL_SLOTS = ['splash', 'main', 'final'];
const CANONICAL_FILES = ['demo.gif', 'demo_splash.png', 'demo_main.png', 'demo_final.png'];

function defaultRoot(cwd) {
  return path.join(cwd, 'project_details', 'changelog');
}

function resolveChangelogRoot(cwd, opts = {}) {
  if (opts.explicit) return opts.explicit;
  if (process.env.CHANGELOG_DIR) return process.env.CHANGELOG_DIR;
  const persisted = path.join(defaultRoot(cwd), '.changelog-dir');
  if (fs.existsSync(persisted)) {
    const saved = fs.readFileSync(persisted, 'utf8').split(/\r?\n/)[0].trim();
    if (saved) return saved;
  }
  return defaultRoot(cwd);
}

function validateRoutes(manifest) {
  if (!manifest || !Array.isArray(manifest.routes) || manifest.routes.length === 0) {
    throw new Error('Route manifest must define a non-empty "routes" array.');
  }
  const slots = manifest.routes.map((r) => r.slot);
  for (const slot of CANONICAL_SLOTS) {
    if (!slots.includes(slot)) {
      throw new Error(`Route manifest missing canonical slot "${slot}". Required: ${CANONICAL_SLOTS.join(', ')}.`);
    }
  }
  for (const r of manifest.routes) {
    if (!r.url) throw new Error(`Route slot "${r.slot}" has no url.`);
    if (r.actions && !Array.isArray(r.actions)) {
      throw new Error(`Route slot "${r.slot}" actions must be an array.`);
    }
  }
  return true;
}

function assertAssets(files) {
  const missing = CANONICAL_FILES.filter((f) => !files.includes(f));
  if (missing.length > 0) {
    throw new Error('Capture produced no media for: ' + missing.join(', ') + '. Resolve the pipeline before releasing.');
  }
  return true;
}

module.exports = { CANONICAL_SLOTS, CANONICAL_FILES, defaultRoot, resolveChangelogRoot, validateRoutes, assertAssets };
