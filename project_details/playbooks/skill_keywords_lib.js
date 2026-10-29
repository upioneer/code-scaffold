#!/usr/bin/env node
/**
 * SkillForge Keyword Contract: shared constants and parsers.
 *
 * Canonical source of truth : .skills/<slug>/skill-manifest.json  ->  "keywords"
 * Generated mirrors (must be exact copies, same order):
 *   1. .skills/<slug>/readme.md   ->  **Keywords:** `a`, `b`, `c`
 *   2. .skills/<slug>/SKILL.md    ->  YAML frontmatter `keywords:` block list (last frontmatter field)
 * Derived index (first REGISTRY_PREVIEW keywords):
 *   3. .skills/README.md          ->  "Search Keywords" column of the skill's registry row
 *
 * Used by sync_skill_keywords.js (writer) and verify_skills.js (gatekeeper).
 */

const KEYWORD_MIN = 15;
const KEYWORD_MAX = 30;
const REGISTRY_PREVIEW = 5;
const KEYWORD_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ZERO_WIDTH = '\u200B\u200C\u200D';

/** Returns a list of human-readable problems with a keyword array for a given slug. */
function validateKeywords(slug, keywords) {
  const problems = [];
  if (!Array.isArray(keywords)) return ['keywords must be an array of strings'];
  if (keywords.length < KEYWORD_MIN || keywords.length > KEYWORD_MAX) {
    problems.push(`keywords count ${keywords.length} outside the required ${KEYWORD_MIN} to ${KEYWORD_MAX} range`);
  }
  const bad = keywords.filter((k) => typeof k !== 'string' || !KEYWORD_RE.test(k));
  if (bad.length) problems.push(`keywords must be lowercase kebab-case tokens (offenders: ${bad.join(', ')})`);
  const dups = keywords.filter((k, i) => keywords.indexOf(k) !== i);
  if (dups.length) problems.push(`duplicate keywords: ${[...new Set(dups)].join(', ')}`);
  if (keywords[0] !== slug) problems.push(`first keyword must be the skill slug "${slug}" (found "${keywords[0]}")`);
  return problems;
}

/** Normalise: lowercase, trim, dedupe (first wins), slug moved or inserted at index 0. */
function normalizeKeywords(slug, keywords) {
  const seen = new Set();
  const out = [];
  for (const raw of [slug, ...keywords]) {
    const k = String(raw).trim().toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

/* ---------- readme.md badge ---------- */
function parseReadmeKeywords(readme) {
  const m = readme.match(/^\*\*Keywords:\*\*[ \t]*(.*)$/m);
  if (!m) return null;
  return (m[1].match(/`([^`]+)`/g) || []).map((s) => s.slice(1, -1));
}
function renderReadmeKeywords(keywords) {
  return `**Keywords:** ${keywords.map((k) => '`' + k + '`').join(', ')}`;
}
function setReadmeKeywords(readme, keywords) {
  return readme.replace(/^\*\*Keywords:\*\*[ \t]*.*$/m, () => renderReadmeKeywords(keywords));
}

/* ---------- SKILL.md frontmatter ---------- */
function splitFrontmatter(content) {
  const m = content.match(/^---(\r?\n)([\s\S]*?)(\r?\n)---/);
  if (!m) return null;
  return { eol: m[1], body: m[2], closeEol: m[3], end: m[0].length };
}
/** Remove an existing keywords field (block list or inline) from frontmatter body lines. */
function stripFrontmatterKeywords(bodyLines) {
  const out = [];
  let skipping = false;
  for (const line of bodyLines) {
    const bare = line.replace(ZERO_WIDTH, '');
    if (/^keywords:/.test(bare)) { skipping = true; continue; }
    if (skipping) {
      if (/^\s+-(\s|$)/.test(line)) continue;
      skipping = false;
    }
    out.push(line);
  }
  return out;
}
function parseFrontmatterKeywords(content) {
  const fm = splitFrontmatter(content);
  if (!fm) return null;
  const lines = fm.body.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^keywords:/.test(l.replace(ZERO_WIDTH, '')));
  if (idx === -1) return null;
  const inline = lines[idx].replace(ZERO_WIDTH, '').match(/^keywords:\s*\[(.*)\]\s*$/);
  if (inline) return inline[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  const items = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s+-\s+(.+?)\s*$/);
    if (!m) break;
    items.push(m[1].replace(/^["']|["']$/g, ''));
  }
  return items;
}
function setFrontmatterKeywords(content, keywords) {
  const fm = splitFrontmatter(content);
  if (!fm) throw new Error('SKILL.md has no YAML frontmatter');
  const lines = stripFrontmatterKeywords(fm.body.split(/\r?\n/));
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  lines.push('keywords:');
  for (const k of keywords) lines.push(`  - ${k}`);
  const rebuilt = '---' + fm.eol + lines.join(fm.eol) + fm.closeEol + '---';
  return rebuilt + content.slice(fm.end);
}

/* ---------- registry README (.skills/README.md) ---------- */
/** Parse the registry into { slug -> { heading, lineIndex, cells } }. */
function parseRegistry(text) {
  const lines = text.split(/\r?\n/);
  let heading = '';
  const rows = {};
  lines.forEach((line, lineIndex) => {
    const h = line.match(/^### (.+?)\s*$/);
    if (h) heading = h[1];
    const r = line.match(/`\.skills\/([^`]+)`\s*\|\s*$/);
    if (line.startsWith('| **') && r) {
      const cells = line.split(/(?<!\\)\|/).map((c) => c.trim());
      // cells: ['', '**Label**', 'desc', 'kw', 'vN', '`path`', '']
      rows[r[1]] = { heading, lineIndex, cells };
    }
  });
  return { lines, rows };
}
function registryKeywordCell(keywords) {
  return keywords.slice(0, REGISTRY_PREVIEW).map((k) => '`' + k + '`').join(', ');
}
function parseRegistryKeywordCell(cell) {
  return (cell.match(/`([^`]+)`/g) || []).map((s) => s.slice(1, -1));
}

module.exports = {
  KEYWORD_MIN, KEYWORD_MAX, REGISTRY_PREVIEW, KEYWORD_RE, ZERO_WIDTH,
  validateKeywords, normalizeKeywords,
  parseReadmeKeywords, renderReadmeKeywords, setReadmeKeywords,
  splitFrontmatter, parseFrontmatterKeywords, setFrontmatterKeywords,
  parseRegistry, registryKeywordCell, parseRegistryKeywordCell,
};
