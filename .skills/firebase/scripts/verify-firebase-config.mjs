#!/usr/bin/env node
/**
 * Firebase Config Verifier (offline)
 * Validates .env keys, .firebaserc aliases, firebase.json targets, and rules
 * file shape without any network access.
 *
 * Usage:
 *   node verify-firebase-config.mjs [--root <dir>] [--json] [--self-test]
 *
 * Exit codes: 0 pass (warnings allowed), 1 failed checks, 2 usage error.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const REQUIRED_ENV_KEYS = [
  'FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const PLACEHOLDER_HINTS = ['placeholder', 'xxx', 'your-', 'changeme', '<', 'example'];

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function parseJsonFile(filePath, label, errors) {
  const raw = readFileIfExists(filePath);
  if (raw === null) {
    errors.push(`${label}: missing file ${path.basename(filePath)}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    errors.push(`${label}: invalid JSON in ${path.basename(filePath)} (${e.message})`);
    return null;
  }
}

function parseDotenv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

export function verifyFirebaseConfig(rootDir) {
  const errors = [];
  const warnings = [];
  const root = path.resolve(rootDir);

  // 1. Environment keys (.env.local preferred, .env fallback)
  const envLocal = readFileIfExists(path.join(root, '.env.local'));
  const envBase = readFileIfExists(path.join(root, '.env'));
  if (envLocal === null && envBase === null) {
    errors.push('env: neither .env.local nor .env exists');
  } else {
    const merged = { ...(envBase ? parseDotenv(envBase) : {}), ...(envLocal ? parseDotenv(envLocal) : {}) };
    for (const key of REQUIRED_ENV_KEYS) {
      const value = merged[key];
      if (!value) {
        errors.push(`env: missing required key ${key}`);
      } else if (PLACEHOLDER_HINTS.some((h) => value.toLowerCase().includes(h))) {
        warnings.push(`env: ${key} still looks like a placeholder`);
      }
    }
  }

  // 2. .firebaserc project aliases
  const rc = parseJsonFile(path.join(root, '.firebaserc'), 'firebaserc', errors);
  if (rc) {
    const projects = rc.projects || {};
    if (Object.keys(projects).length === 0) {
      errors.push('firebaserc: "projects" map is empty (need at least a default project)');
    }
    if (projects.default && typeof projects.default !== 'string') {
      errors.push('firebaserc: "projects.default" must be a project id string');
    }
  }

  // 3. firebase.json shape + referenced files exist
  const config = parseJsonFile(path.join(root, 'firebase.json'), 'firebase.json', warnings);
  if (config) {
    const hostings = Array.isArray(config.hosting) ? config.hosting : config.hosting ? [config.hosting] : [];
    for (const site of hostings) {
      if (site.public && !fs.existsSync(path.join(root, site.public))) {
        warnings.push(`firebase.json: hosting public dir "${site.public}" does not exist`);
      }
      if (!site.site && !site.target) {
        warnings.push('firebase.json: hosting entry has neither "site" nor "target" (multi-site deploys need one)');
      }
    }
    const firestore = config.firestore;
    if (firestore) {
      if (firestore.rules && readFileIfExists(path.join(root, firestore.rules)) === null) {
        errors.push(`firebase.json: firestore.rules file "${firestore.rules}" not found`);
      }
      if (firestore.indexes && readFileIfExists(path.join(root, firestore.indexes)) === null) {
        warnings.push(`firebase.json: firestore.indexes file "${firestore.indexes}" not found`);
      }
    }
    const storage = config.storage;
    if (storage && storage.rules && readFileIfExists(path.join(root, storage.rules)) === null) {
      errors.push(`firebase.json: storage.rules file "${storage.rules}" not found`);
    }
  }

  // 4. Rules sanity (default deny present) for every rules file on disk:
  // the configured paths plus conventional root filenames.
  const candidates = [];
  if (config && config.firestore && config.firestore.rules) candidates.push(config.firestore.rules);
  if (config && config.storage && config.storage.rules) candidates.push(config.storage.rules);
  candidates.push('firestore.rules', 'storage.rules');
  for (const rulesPath of [...new Set(candidates)]) {
    const rules = readFileIfExists(path.join(root, rulesPath));
    if (rules === null) continue;
    if (!rules.includes('rules_version')) {
      warnings.push(`${rulesPath}: missing rules_version declaration`);
    }
    if (!/allow\s+read,\s*write:\s*if\s+false/.test(rules)) {
      warnings.push(`${rulesPath}: no default-deny rule found (allow read, write: if false)`);
    }
  }

  // 5. functions engine floor
  const fnPkg = readFileIfExists(path.join(root, 'functions', 'package.json'));
  if (fnPkg !== null) {
    try {
      const engines = (JSON.parse(fnPkg).engines || {}).node || '';
      const major = parseInt(String(engines).replace(/[^0-9]/g, '').slice(0, 2), 10);
      if (!engines) {
        warnings.push('functions/package.json: missing engines.node floor');
      } else if (Number.isFinite(major) && major < 20) {
        warnings.push(`functions/package.json: engines.node floor "${engines}" is below 20`);
      }
    } catch {
      warnings.push('functions/package.json: invalid JSON');
    }
  }

  return { errors, warnings, passed: errors.length === 0 };
}

function writeFixtureFiles(dir, vars) {
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.env'), vars.env);
  fs.writeFileSync(path.join(dir, '.firebaserc'), vars.rc);
  fs.writeFileSync(path.join(dir, 'firebase.json'), vars.config);
  fs.writeFileSync(path.join(dir, 'firestore.rules'), vars.rules);
}

function runSelfTest() {
  const failures = [];
  const good = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-verify-good-'));
  writeFixtureFiles(good, {
    env: [...REQUIRED_ENV_KEYS.map((k) => `${k}=realvalue123`), 'FIREBASE_SITE_ID=mysite'].join('\n'),
    rc: JSON.stringify({ projects: { default: 'myapp-prod', dev: 'myapp-dev' } }),
    config: JSON.stringify({ hosting: [{ site: 'mysite', public: 'dist' }], firestore: { rules: 'firestore.rules' } }),
    rules: "rules_version = '2';\nservice cloud.firestore {\n match /{document=**} { allow read, write: if false; } }"
  });
  const passResult = verifyFirebaseConfig(good);
  if (!passResult.passed || passResult.errors.length > 0) {
    failures.push(`clean fixture should pass, got errors: ${passResult.errors.join(' | ')}`);
  }

  const bad = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-verify-bad-'));
  writeFixtureFiles(bad, {
    env: 'FIREBASE_PROJECT_ID=<changeme>\n',
    rc: '{not json',
    config: JSON.stringify({ firestore: { rules: 'missing.rules' } }),
    rules: 'service cloud.firestore {}'
  });
  const failResult = verifyFirebaseConfig(bad);
  const joined = [...failResult.errors, ...failResult.warnings].join('\n');
  for (const needle of ['missing required key', 'invalid JSON', 'not found', 'default-deny']) {
    if (!joined.includes(needle)) {
      failures.push(`broken fixture should report "${needle}"`);
    }
  }
  if (failResult.passed) {
    failures.push('broken fixture should not pass');
  }

  fs.rmSync(good, { recursive: true, force: true });
  fs.rmSync(bad, { recursive: true, force: true });

  if (failures.length > 0) {
    for (const f of failures) console.error(`self-test failure: ${f}`);
    process.exit(1);
  }
  console.log('self-test: 2 fixtures, all assertions passed');
}

function printUsageAndExit() {
  console.error('Usage: node verify-firebase-config.mjs [--root <dir>] [--json] [--self-test]');
  process.exit(2);
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/verify-firebase-config.mjs');
if (invokedDirectly) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) {
    runSelfTest();
  } else {
    let root = process.cwd();
    let asJson = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--root' && args[i + 1]) {
        root = args[++i];
      } else if (args[i] === '--json') {
        asJson = true;
      } else {
        printUsageAndExit();
      }
    }
    const result = verifyFirebaseConfig(root);
    if (asJson) {
      console.log(JSON.stringify({ root: path.resolve(root), ...result }, null, 2));
    } else {
      for (const e of result.errors) console.error(`error: ${e}`);
      for (const w of result.warnings) console.log(`warning: ${w}`);
      console.log(result.passed ? 'firebase config: PASS' : 'firebase config: FAIL');
    }
    process.exit(result.passed ? 0 : 1);
  }
}
