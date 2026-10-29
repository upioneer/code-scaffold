#!/usr/bin/env node
/**
 * SkillForge Keyword Contract Synchronizer
 *
 * Treats `skill-manifest.json` -> `keywords` as the single source of truth and regenerates every
 * mirror so the companion website, the CLI search index, and agent routers all read identical data:
 *
 *   * skill-manifest.json  keywords normalised (lowercase, deduped, slug first)
 *   * readme.md            **Keywords:** badge  (and **Category:** badge) mirrored from the manifest
 *   * SKILL.md             YAML frontmatter `keywords:` block list (last frontmatter field)
 *   * .skills/README.md    registry row "Search Keywords" (first 5) and Version columns
 *   * manifest.json        root distribution manifest gains an entry for any skill missing from it
 *
 * Usage:
 *   node project_details/playbooks/sync_skill_keywords.js          # rewrite mirrors in place
 *   node project_details/playbooks/sync_skill_keywords.js --check  # report drift, exit 1 if any
 *
 * Authoring workflow: edit ONLY the manifest keywords, then run this script, then verify_skills.js.
 */

const fs = require('fs');
const path = require('path');
const lib = require('./skill_keywords_lib');

const ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(ROOT, '.skills');
const REGISTRY = path.join(SKILLS_DIR, 'README.md');
const ROOT_MANIFEST = path.join(ROOT, 'manifest.json');
const CHECK = process.argv.includes('--check');

const eolOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n');
const drift = [];
let writes = 0;

function commit(file, before, after, why) {
  if (before === after) return;
  drift.push(`${path.relative(ROOT, file)}: ${why}`);
  if (!CHECK) { fs.writeFileSync(file, after, 'utf8'); writes++; }
}

const slugs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .sort();

const registryRaw = fs.readFileSync(REGISTRY, 'utf8');
const registryEol = eolOf(registryRaw);
const registry = lib.parseRegistry(registryRaw);
const registryLines = registry.lines.slice();

const metas = {};

for (const slug of slugs) {
  const dir = path.join(SKILLS_DIR, slug);
  const manifestPath = path.join(dir, 'skill-manifest.json');
  const readmePath = path.join(dir, 'readme.md');
  const skillPath = path.join(dir, 'SKILL.md');
  const metaPath = path.join(dir, 'meta.json');

  // 1. Manifest keywords (source of truth) normalisation
  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  const normalized = lib.normalizeKeywords(slug, manifest.keywords || []);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  metas[slug] = meta;
  if (JSON.stringify(normalized) !== JSON.stringify(manifest.keywords)) {
    manifest.keywords = normalized;
    commit(manifestPath, manifestRaw, JSON.stringify(manifest, null, 2).replace(/\n/g, eolOf(manifestRaw)) + eolOf(manifestRaw), 'manifest keywords normalised');
  }
  const keywords = normalized;

  // 2. readme.md badges
  const readmeRaw = fs.readFileSync(readmePath, 'utf8');
  let readme = lib.setReadmeKeywords(readmeRaw, keywords);
  readme = readme.replace(/^\*\*Category:\*\*[ \t]*.*$/m, () => `**Category:** ${manifest.category}`);
  commit(readmePath, readmeRaw, readme, 'readme Keywords/Category badge mirrored from manifest');

  // 3. SKILL.md frontmatter
  const skillRaw = fs.readFileSync(skillPath, 'utf8');
  commit(skillPath, skillRaw, lib.setFrontmatterKeywords(skillRaw, keywords), 'SKILL.md frontmatter keywords mirrored from manifest');

  // 4. Registry row
  const row = registry.rows[slug];
  if (row) {
    const cells = row.cells.slice();
    cells[3] = lib.registryKeywordCell(keywords);
    cells[4] = `v${manifest.version}`;
    registryLines[row.lineIndex] = `| ${cells.slice(1, 6).join(' | ')} |`;
  } else {
    drift.push(`.skills/README.md: no registry row for "${slug}" (add it under "### ${manifest.category}")`);
  }
}

commit(REGISTRY, registryRaw, registryLines.join(registryEol), 'registry Search Keywords / Version columns derived from manifests');

// 5. Root distribution manifest.json: ensure every skill is listed
const rootRaw = fs.readFileSync(ROOT_MANIFEST, 'utf8');
const rootEol = eolOf(rootRaw);
const rootJson = JSON.parse(rootRaw);
const listed = new Set(rootJson.skills.map((s) => s.id));
let rootText = rootRaw;
for (const slug of slugs.filter((s) => !listed.has(s))) {
  const label = metas[slug].label;
  const block = [
    '        {',
    `            "id": ${JSON.stringify(slug)},`,
    `            "label": ${JSON.stringify(label)},`,
    `            "source": ".skills/${slug}",`,
    `            "target": ".skills/${slug}",`,
    '            "method": "copy"',
    '        }',
  ].join(rootEol);
  const neighbour = rootJson.skills.map((s) => s.id).find((id) => id > slug && listed.has(id));
  if (neighbour) {
    const at = rootText.indexOf(`"id": ${JSON.stringify(neighbour)}`);
    const open = rootText.lastIndexOf('        {', at);
    rootText = rootText.slice(0, open) + block + ',' + rootEol + rootText.slice(open);
  } else {
    const close = rootText.lastIndexOf('        }');
    rootText = rootText.slice(0, close + 9) + ',' + rootEol + block + rootText.slice(close + 9);
  }
  listed.add(slug);
  rootJson.skills.push({ id: slug });
}
commit(ROOT_MANIFEST, rootRaw, rootText, 'root manifest.json gained missing skill entries');

if (CHECK) {
  if (drift.length) {
    console.error(`Keyword contract drift detected (${drift.length}):`);
    drift.forEach((d) => console.error('  - ' + d));
    console.error('\nRun: node project_details/playbooks/sync_skill_keywords.js');
    process.exit(1);
  }
  console.log(`Keyword contract in sync across ${slugs.length} skills.`);
} else {
  console.log(`Synchronized ${slugs.length} skills; ${writes} file(s) rewritten.`);
  drift.filter((d) => d.includes('no registry row')).forEach((d) => console.error('WARNING ' + d));
}
