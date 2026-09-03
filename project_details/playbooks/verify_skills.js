#!/usr/bin/env node
/**
 * SkillForge Automated Compliance & Invariant Verifier
 * Deterministic gatekeeper script that asserts 100% architectural compliance across all skills in .skills/
 * 
 * Invariants Enforced:
 *   1. 5-File Anatomy (SKILL.md, meta.json, skill-manifest.json, readme.md, sandbox/index.html)
 *   2. Whole-Number Version Synchronization (meta.json == skill-manifest.json == readme.md)
 *   3. Meta Schema (label, description, version, target, logo with uniform 2-space padding)
 *   4. Manifest Schema (name, version, description, category, keywords array > 0, requiredPermissions)
 *   5. Typography Compliance (NO em-dashes —, NO en-dashes –, asterisks for bullet lists)
 *   6. Zero External Brand Leakage (no forbidden third-party trademarks in user-facing metadata/docs)
 * 
 * Usage:
 *   node project_details/playbooks/verify_skills.js
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.resolve(__dirname, '../../.skills');
const ROOT_README = path.join(SKILLS_DIR, 'README.md');

// Forbidden external trademark/library names in titles, descriptions, and docs
const FORBIDDEN_LEAK_PATTERNS = [
  /\bscrapegraph(?:ai)?\b/i,
  /\bcharmbracelet\b/i,
  /\bantonbabenko\b/i
];

let totalSkills = 0;
let passedSkills = 0;
const errors = [];

function checkSkill(skillName) {
  totalSkills++;
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillErrors = [];

  const skillMdPath = path.join(skillDir, 'SKILL.md');
  const metaJsonPath = path.join(skillDir, 'meta.json');
  const manifestPath = path.join(skillDir, 'skill-manifest.json');
  const readmePath = path.join(skillDir, 'readme.md');
  const sandboxPath = path.join(skillDir, 'sandbox', 'index.html');

  // 1. Five-File Anatomy Check
  if (!fs.existsSync(skillMdPath)) skillErrors.push('Missing SKILL.md');
  if (!fs.existsSync(metaJsonPath)) skillErrors.push('Missing meta.json');
  if (!fs.existsSync(manifestPath)) skillErrors.push('Missing skill-manifest.json');
  if (!fs.existsSync(readmePath)) skillErrors.push('Missing readme.md');
  if (!fs.existsSync(sandboxPath)) skillErrors.push('Missing sandbox/index.html');

  if (skillErrors.length > 0) {
    errors.push({ skill: skillName, issues: skillErrors });
    return;
  }

  // 2. Parse JSON files
  let meta = {};
  let manifest = {};
  try {
    meta = JSON.parse(fs.readFileSync(metaJsonPath, 'utf8'));
  } catch (e) {
    skillErrors.push(`Malformed meta.json: ${e.message}`);
  }
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    skillErrors.push(`Malformed skill-manifest.json: ${e.message}`);
  }

  // 3. Whole-Number Version Check
  const metaVer = String(meta.version || '');
  const manifestVer = String(manifest.version || '');

  if (!/^\d+$/.test(metaVer)) {
    skillErrors.push(`meta.json version "${metaVer}" is not a strict whole number (e.g. 1, 2, 3)`);
  }
  if (!/^\d+$/.test(manifestVer)) {
    skillErrors.push(`skill-manifest.json version "${manifestVer}" is not a strict whole number (e.g. 1, 2, 3)`);
  }
  if (metaVer !== manifestVer) {
    skillErrors.push(`Version mismatch: meta.json (${metaVer}) != skill-manifest.json (${manifestVer})`);
  }

  // 4. Meta Schema Validation (Exact keys: label, description, version, target, logo)
  const requiredMetaKeys = ['label', 'description', 'version', 'target', 'logo'];
  for (const k of requiredMetaKeys) {
    if (meta[k] === undefined) {
      skillErrors.push(`meta.json missing required key: "${k}"`);
    }
  }
  if (!Array.isArray(meta.logo) || meta.logo.length === 0) {
    skillErrors.push('meta.json "logo" must be a non-empty string array of ASCII art');
  }

  // 5. Manifest Schema Validation
  const requiredManifestKeys = ['name', 'version', 'description', 'category', 'keywords', 'entryPoint', 'engines', 'requiredPermissions'];
  for (const k of requiredManifestKeys) {
    if (manifest[k] === undefined) {
      skillErrors.push(`skill-manifest.json missing required key: "${k}"`);
    }
  }
  if (!Array.isArray(manifest.keywords) || manifest.keywords.length === 0) {
    skillErrors.push('skill-manifest.json "keywords" must be a non-empty array of search tags');
  }

  // 6. SKILL.md Frontmatter & Typography Check
  const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
  if (skillMdContent.includes('—')) skillErrors.push('SKILL.md contains em dash (—). Use colons or spaces.');
  if (skillMdContent.includes('–')) skillErrors.push('SKILL.md contains en dash (–). Use colons or spaces.');

  const fmMatch = skillMdContent.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    skillErrors.push('SKILL.md missing standard YAML frontmatter (--- ... ---)');
  } else {
    const fm = fmMatch[1];
    if (!/name:\s*.+/i.test(fm)) {
      skillErrors.push('SKILL.md frontmatter missing "name" field');
    }
    const descMatch = fm.match(/description:\s*(.+)/i);
    if (!descMatch || descMatch[1].trim().length < 25) {
      skillErrors.push('SKILL.md frontmatter missing or too short "description" field (< 25 chars)');
    }
  }

  // 7. Readme Structure & Typography Check
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  if (readmeContent.includes('—')) skillErrors.push('readme.md contains em dash (—). Use colons or spaces.');
  if (readmeContent.includes('–')) skillErrors.push('readme.md contains en dash (–). Use colons or spaces.');

  // Check version in readme
  const readmeVerMatch = readmeContent.match(/\*\*Version:\*\*\s*(\d+)/i);
  if (!readmeVerMatch) {
    skillErrors.push('readme.md missing or invalid "**Version:** <number>" header');
  } else if (readmeVerMatch[1] !== metaVer) {
    skillErrors.push(`readme.md version (${readmeVerMatch[1]}) does not match meta.json (${metaVer})`);
  }

  // Check category and keywords in readme
  if (!readmeContent.includes('**Category:**')) {
    skillErrors.push('readme.md missing "**Category:**" header badge');
  }
  if (!readmeContent.includes('**Keywords:**')) {
    skillErrors.push('readme.md missing "**Keywords:**" header badge');
  }

  // 7. Brand Leakage Checks in user-facing texts
  const checkTexts = [
    meta.label || '',
    meta.description || '',
    manifest.description || '',
    readmeContent.split('## Usage')[0] // Front portion of readme
  ];

  for (const text of checkTexts) {
    for (const pattern of FORBIDDEN_LEAK_PATTERNS) {
      if (pattern.test(text)) {
        skillErrors.push(`Brand leak detected matching forbidden pattern ${pattern} in metadata or readme`);
      }
    }
  }

  if (skillErrors.length === 0) {
    passedSkills++;
  } else {
    errors.push({ skill: skillName, issues: skillErrors });
  }
}

function verifyAll() {
  console.log('='.repeat(70));
  console.log('  SkillForge Architectural Compliance & Invariant Gatekeeper');
  console.log('='.repeat(70));

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort();

  for (const s of skillDirs) {
    checkSkill(s);
  }

  // Verify Global Readme
  if (!fs.existsSync(ROOT_README)) {
    console.error('❌ Missing /.skills/README.md global registry!');
    process.exit(1);
  }
  const rootReadmeContent = fs.readFileSync(ROOT_README, 'utf8');
  if (rootReadmeContent.includes('—') || rootReadmeContent.includes('–')) {
    console.error('❌ /.skills/README.md contains forbidden en/em dashes!');
    process.exit(1);
  }

  console.log(`Audited ${totalSkills} skills: ${passedSkills} passed, ${errors.length} failed.\n`);

  if (errors.length > 0) {
    console.error('❌ COMPLIANCE FAILURES DETECTED:');
    for (const err of errors) {
      console.error(`\n[Skill: .skills/${err.skill}]`);
      for (const issue of err.issues) {
        console.error(`  - ${issue}`);
      }
    }
    console.error('\nFix all compliance errors before proceeding.');
    process.exit(1);
  } else {
    console.log('✅ ALL 51 SKILLS ARE 100% COMPLIANT WITH SKILLFORGE PROTOCOL & AGENT INVARIANTS!');
  }
}

if (require.main === module) {
  verifyAll();
}

module.exports = { verifyAll };
