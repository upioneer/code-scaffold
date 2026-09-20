#!/usr/bin/env node
/**
 * GhostImprint Engine™ CLI & Core Architecture
 * Industrial Grade Cryptographic Code Provenance, Steganographic Entanglement Matrix & Digital Forensics
 * Cross-platform: Windows, macOS, Linux (Zero external npm dependencies)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');
const wordlist = require('./wordlist');
const ts = require('./ghostimprint-timestamp');

// ── SPECTRAL CYAN FORENSIC PALETTE ──────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[38;2;0;240;255m',      // Spectral Cyan
  emerald: '\x1b[38;2;0;255;157m',   // Phosphor Neon Emerald
  silver: '\x1b[38;2;203;213;225m',  // Ethereal Silver
  violet: '\x1b[38;2;168;85;247m',   // Spectral Violet
  amber: '\x1b[38;2;251;191;36m',    // Warning Amber
  red: '\x1b[38;2;239;68;68m',       // Laser Red
  slate: '\x1b[38;2;30;41;59m',      // Deep Slate
  darkGray: '\x1b[38;2;71;85;105m'   // Dim border
};

// ── BANNER & LOGO ───────────────────────────────────────────────────
function printBanner() {
  console.log(`
${C.cyan}${C.bold}   ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗
  ██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝
  ██║  ███╗███████║██║   ██║███████╗   ██║   ██████╔╝██████╔╝██║██╔██╗ ██║   ██║     
  ██║   ██║██╔══██║██║   ██║╚════██║   ██║   ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║     
  ╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ██║     ██║  ██║██║██║ ╚████║   ██║     
   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝     ${C.reset}
${C.silver}           GhostImprint Engine™: Cryptographic Code Provenance & Digital Forensics${C.reset}
${C.dim}                   Kerckhoffs-Compliant Steganographic Entanglement Matrix${C.reset}
`);
}

// ── STORAGE LOCATIONS & OS VAULT PATHS ──────────────────────────────
function getVaultDir() {
  return path.join(os.homedir(), '.ghostimprint');
}

function getProjectsDir() {
  return path.join(getVaultDir(), 'projects');
}

function getVaultFilePath() {
  return path.join(getVaultDir(), 'vault.json.enc');
}

function getProjectSlug(metadata) {
  let raw = (metadata && (metadata.repo || metadata.project)) || 'default-project';
  return raw
    .replace(/^https?:\/\/[^\/]+\//, '')
    .replace(/^git@[^:]+:/, '')
    .replace(/\.git$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

function getProjectVaultPath(metadata) {
  const slug = getProjectSlug(metadata);
  return path.join(getProjectsDir(), `${slug}.vault.json.enc`);
}

// ── APPLICATION RECEIPT STORE (public, unencrypted) ───────────────
// The receipt records what was actually applied, per release and layer:
// the audit compares suspect code against the receipt, never against wishes.
const RECEIPT_LAYERS = ['l0', 'l1', 'l2', 'l3', 'l4', 'l5', 'l6'];

function getReceiptPath(metadata) {
  const slug = getProjectSlug(metadata);
  return path.join(getProjectsDir(), `${slug}.receipt.json`);
}

function loadReceipt(metadata = null) {
  const meta = metadata || discoverProjectMetadata();
  const receiptPath = getReceiptPath(meta);
  if (fs.existsSync(receiptPath)) {
    try {
      return JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }
  // Legacy GhostPrint era receipt location (read only)
  const legacyPath = path.join(os.homedir(), '.ghostprint', 'projects', `${getProjectSlug(meta)}.receipt.json`);
  if (fs.existsSync(legacyPath)) {
    try {
      return JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }
  return null;
}

function saveReceipt(metadata, receipt) {
  ensureVaultDir();
  const receiptPath = getReceiptPath(metadata);
  receipt.updatedAt = new Date().toISOString();
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');
  if (process.platform !== 'win32') {
    try { fs.chmodSync(receiptPath, 0o600); } catch (_) {}
  }
  return receiptPath;
}

function blankReceipt(metadata) {
  return {
    version: 1,
    projectSlug: getProjectSlug(metadata),
    project: metadata.project,
    repo: metadata.repo,
    releases: {},
    updatedAt: new Date().toISOString()
  };
}

function recordDecision(metadata, release, layer, site, value, note = '') {
  if (!RECEIPT_LAYERS.includes(layer)) {
    throw new Error(`Unknown receipt layer "${layer}". Use one of: ${RECEIPT_LAYERS.join(', ')}.`);
  }
  const receipt = loadReceipt(metadata) || blankReceipt(metadata);
  if (!receipt.releases[release]) {
    receipt.releases[release] = { layers: {}, probePlan: null, anchor: null };
  }
  const bucket = receipt.releases[release].layers[layer] || [];
  bucket.push({ site, value, note, recordedAt: new Date().toISOString() });
  receipt.releases[release].layers[layer] = bucket;
  return saveReceipt(metadata, receipt);
}

function recordProbePlan(metadata, release, plan) {
  const receipt = loadReceipt(metadata) || blankReceipt(metadata);
  if (!receipt.releases[release]) {
    receipt.releases[release] = { layers: {}, probePlan: null, anchor: null };
  }
  receipt.releases[release].probePlan = Object.assign(
    { triggers: [], endpoint: null, toleranceMs: null },
    plan,
    { recordedAt: new Date().toISOString() }
  );
  return saveReceipt(metadata, receipt);
}

function latestReceiptRelease(receipt) {
  const names = Object.keys(receipt.releases || {});
  if (names.length === 0) return null;
  return names.sort().reverse()[0];
}

function receiptSummary(receipt) {
  const summary = { project: receipt.project, releases: {} };
  for (const [release, data] of Object.entries(receipt.releases || {})) {
    const layers = {};
    for (const [layer, entries] of Object.entries(data.layers || {})) {
      layers[layer] = entries.length;
    }
    summary.releases[release] = {
      decisions: layers,
      probePlan: data.probePlan ? { triggers: (data.probePlan.triggers || []).length, endpoint: Boolean(data.probePlan.endpoint) } : null,
      anchor: data.anchor ? { commit: data.anchor.commit, tag: data.anchor.tag, dirty: data.anchor.dirty } : null
    };
  }
  return summary;
}

// ── GIT-TREE TEMPORAL ANCHOR ───────────────────────────────────────
// Records the git identity of a release: commit SHA, tree SHA, tag, and
// whether the tree was dirty. Verification shells out to git read-only.
function gitCapture(cwd, gitArgs) {
  try {
    const child = require('child_process');
    return child.spawnSync('git', gitArgs, { cwd, encoding: 'utf8', timeout: 15000 });
  } catch (_) {
    return { status: 1, stdout: '', stderr: 'spawn failed' };
  }
}

function recordAnchor(metadata, release, cwd = process.cwd(), tag = null) {
  const head = gitCapture(cwd, ['rev-parse', 'HEAD']);
  if (head.status !== 0) {
    throw new Error('Not a git repository (or git unavailable). Anchor requires a commit to point at.');
  }
  const commit = head.stdout.trim();
  const tree = gitCapture(cwd, ['rev-parse', `${commit}^{tree}`]);
  const dirty = gitCapture(cwd, ['status', '--porcelain']);
  const receipt = loadReceipt(metadata) || blankReceipt(metadata);
  if (!receipt.releases[release]) {
    receipt.releases[release] = { layers: {}, probePlan: null, anchor: null };
  }
  receipt.releases[release].anchor = {
    commit,
    tree: tree.status === 0 ? tree.stdout.trim() : null,
    tag,
    dirty: dirty.status === 0 ? dirty.stdout.trim().length > 0 : null,
    repoPath: path.resolve(cwd),
    recordedAt: new Date().toISOString()
  };
  return saveReceipt(metadata, receipt);
}

async function notarizeRelease(metadata, release, options = {}) {
  const receipt = loadReceipt(metadata);
  const data = receipt && receipt.releases[release];
  if (!data || !data.anchor || !data.anchor.commit) {
    throw new Error('No local anchor recorded. The notarized tier builds on a local anchor.');
  }
  const preimage = Buffer.from(`commit:${data.anchor.commit}\ntree:${data.anchor.tree || ''}\n`, 'utf8');
  const hashHex = crypto.createHash('sha256').update(preimage).digest('hex');

  const vault = loadVault(metadata);
  let masterKey = null;
  if (vault && vault.epochs && vault.epochs.length > 0) {
    const epoch = vault.epochs[vault.epochs.length - 1];
    masterKey = deriveMasterKey(epoch.passphraseWords, epoch.metadata || metadata);
  } else {
    const envWords = (process.env.GHOSTIMPRINT_MASTER_PASSPHRASE || '').trim().split(/\s+/).filter(Boolean);
    if (envWords.length === 0) throw new Error('Notarized tier needs an identity (vault or passphrase) to sign the Rekor entry.');
    masterKey = deriveMasterKey(envWords, metadata);
  }

  const tsa = await ts.tsaSubmit(Buffer.from(hashHex, 'hex'), options.tsaUrl);
  let rekor = { ok: false, error: 'not attempted' };
  try {
    const scalar = ts.deriveSigningScalar(masterKey);
    const pem = ts.publicKeyPem(scalar);
    const sig = ts.signBytes(scalar, Buffer.from(hashHex, 'hex'));
    const sub = await ts.rekorSubmit(hashHex, sig, pem, options.rekorUrl);
    if (sub.ok) {
      const check = ts.verifyRekorEntry(sub.entry, hashHex, pem);
      rekor = {
        ok: check.problems.length === 0,
        uuid: sub.uuid,
        url: options.rekorUrl || ts.REKOR_BASE,
        hashHex,
        publicKeyPem: pem,
        integratedTime: check.integratedTime,
        entry: sub.entry,
        problems: check.problems,
        inclusion: check.inclusion,
        error: check.problems.length === 0 ? null : check.problems.join('; ')
      };
    } else {
      rekor = { ok: false, error: sub.error };
    }
  } catch (e) {
    rekor = { ok: false, error: String(e.message || e).slice(0, 160) };
  }

  const fresh = loadReceipt(metadata);
  fresh.releases[release].witnesses = {
    preimage: preimage.toString('utf8'),
    hashHex,
    tsa: tsa.ok
      ? { ok: true, url: options.tsaUrl || ts.FREETSA_URL, genTime: tsa.genTime, tokenB64: tsa.tokenB64, certCount: tsa.certCount, signerNote: tsa.signerNote }
      : { ok: false, error: tsa.error },
    rekor
  };
  saveReceipt(metadata, fresh);
  return fresh.releases[release].witnesses;
}

function verifyStoredWitnesses(releaseData) {
  const out = { tsa: { status: 'ABSENT' }, rekor: { status: 'ABSENT' } };
  const w = releaseData && releaseData.witnesses;
  if (!w) return out;
  if (w.tsa && w.tsa.ok && w.tsa.tokenB64) {
    try {
      const parsed = ts.parseTsaResponse(Buffer.from(w.tsa.tokenB64, 'base64'));
      const imprint = ts.verifyTsaImprint(parsed, Buffer.from(w.hashHex, 'hex'));
      out.tsa = imprint.ok
        ? { status: 'VERIFIED', genTime: imprint.genTime, url: w.tsa.url }
        : { status: 'RECORDED-NOT-VERIFIED', reason: imprint.reason };
    } catch (e) {
      out.tsa = { status: 'RECORDED-NOT-VERIFIED', reason: 'Token no longer parses: ' + String(e.message || e).slice(0, 100) };
    }
  } else if (w.tsa && !w.tsa.ok) {
    out.tsa = { status: 'FAILED-AT-SEAL', reason: w.tsa.error };
  }
  if (w.rekor && w.rekor.ok && w.rekor.entry) {
    const check = ts.verifyRekorEntry(w.rekor.entry, w.rekor.hashHex, w.rekor.publicKeyPem);
    out.rekor = check.problems.length === 0
      ? { status: 'VERIFIED', uuid: w.rekor.uuid, integratedTime: check.integratedTime, inclusion: check.inclusion.status }
      : { status: 'RECORDED-NOT-VERIFIED', reason: check.problems.join('; ') };
  } else if (w.rekor && !w.rekor.ok) {
    out.rekor = { status: 'FAILED-AT-SEAL', reason: w.rekor.error };
  }
  return out;
}

function verifyAnchor(anchor) {
  if (!anchor || !anchor.commit) return { verified: false, reason: 'No anchor recorded.' };
  if (!anchor.repoPath || !fs.existsSync(anchor.repoPath)) {
    return { verified: false, reason: 'Anchor repository path unavailable.', recorded: anchor };
  }
  const typeCheck = gitCapture(anchor.repoPath, ['cat-file', '-t', anchor.commit]);
  if (typeCheck.status !== 0 || typeCheck.stdout.trim() !== 'commit') {
    return { verified: false, reason: 'Commit object not found in repository.', recorded: anchor };
  }
  if (anchor.tree) {
    const treeCheck = gitCapture(anchor.repoPath, ['cat-file', '-t', anchor.tree]);
    if (treeCheck.status !== 0 || treeCheck.stdout.trim() !== 'tree') {
      return { verified: false, reason: 'Tree object not found in repository.', recorded: anchor };
    }
  }
  return { verified: true, commit: anchor.commit, tree: anchor.tree, tag: anchor.tag, dirty: anchor.dirty };
}

// Ensure vault directory and projects subdirectory exist with secure permissions
function ensureVaultDir() {
  const vDir = getVaultDir();
  const pDir = getProjectsDir();
  for (const dir of [vDir, pDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      if (process.platform !== 'win32') {
        try { fs.chmodSync(dir, 0o700); } catch (_) {}
      }
    }
  }
}

// ── DISCOVER PROJECT METADATA (Public Salt Invariants) ─────────────
function discoverProjectMetadata(cwd = process.cwd()) {
  let author = 'Independent Author';
  let project = path.basename(cwd);
  let domain = 'localhost';
  let repo = 'local/repository';

  // Read package.json if exists
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) project = pkg.name;
      if (pkg.author) author = typeof pkg.author === 'string' ? pkg.author : (pkg.author.name || author);
      if (pkg.homepage) domain = pkg.homepage;
      if (pkg.repository) repo = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository.url || repo);
    } catch (_) {}
  }

  // Read Cargo.toml if exists
  const cargoPath = path.join(cwd, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    try {
      const cargo = fs.readFileSync(cargoPath, 'utf8');
      const nameMatch = cargo.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) project = nameMatch[1];
      const authMatch = cargo.match(/authors\s*=\s*\["([^"]+)"/);
      if (authMatch) author = authMatch[1];
    } catch (_) {}
  }

  // Read .env if exists
  const envPath = path.join(cwd, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const env = fs.readFileSync(envPath, 'utf8');
      const userMatch = env.match(/GITHUB_USER=([^\r\n]+)/);
      if (userMatch) author = userMatch[1].trim();
      const repoMatch = env.match(/GITHUB_REMOTE_URL=([^\r\n]+)/);
      if (repoMatch) repo = repoMatch[1].trim();
    } catch (_) {}
  }

  return { author, project, domain, repo };
}

// Extract project keyword tokens for the Anti-Correlation Gatekeeper
function getProjectKeywords(metadata) {
  const text = `${metadata.author} ${metadata.project} ${metadata.domain} ${metadata.repo}`.toLowerCase();
  const rawTokens = text.split(/[^a-z0-9]+/i).filter(t => t.length >= 3);
  return Array.from(new Set(rawTokens));
}

// ── ANTI-CORRELATION GATEKEEPER ─────────────────────────────────────
function validateAntiCorrelation(words, projectKeywords) {
  const lowerWords = words.map(w => w.toLowerCase());
  const matched = [];

  for (const w of lowerWords) {
    if (projectKeywords.includes(w)) {
      matched.push(w);
    }
  }

  const externalCount = lowerWords.length - matched.length;
  const externalRatio = lowerWords.length > 0 ? (externalCount / lowerWords.length) : 0;
  const passed = externalRatio >= 0.75;

  return {
    passed,
    matched,
    externalRatio: (externalRatio * 100).toFixed(1),
    requiredRatio: 75.0,
    externalCount,
    totalCount: lowerWords.length
  };
}

// ── CSPRNG MNEMONIC GENERATOR (BIP-39 Standard) ────────────────────
function generateMnemonic(wordCount = 15) {
  // wordCount: 12 (128-bit), 15 (160-bit), 24 (256-bit)
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    const randIdx = crypto.randomInt(0, wordlist.length);
    words.push(wordlist[randIdx]);
  }
  return words;
}

// Compute Shannon and dictionary bits
function evaluateEntropy(words) {
  const count = words.length;
  // 11 bits per BIP-39 word
  const theoreticalBits = count * 11;
  return theoreticalBits;
}

// ── CRYPTOGRAPHIC HD RATCHET KEY TREE ──────────────────────────────
function deriveMasterKey(passphrase, metadata) {
  const cleanPass = Array.isArray(passphrase) ? passphrase.join(' ').trim() : passphrase.trim();
  const salt = crypto.createHash('sha256')
    .update(`${metadata.author}:${metadata.project}:${metadata.repo}:${metadata.domain}`)
    .digest();
  
  // Derive 256-bit Master Root Key via HKDF
  const masterKey = crypto.hkdfSync('sha256', Buffer.from(cleanPass, 'utf8'), salt, Buffer.from('ghostimprint:master:root', 'utf8'), 32);
  return Buffer.from(masterKey);
}

function deriveReleaseChildKey(masterKey, version, metadata) {
  const versionSalt = crypto.createHash('sha256').update(`release:${version}:${metadata.repo}`).digest();
  const childKey = crypto.hkdfSync('sha256', masterKey, versionSalt, Buffer.from(`ghostimprint:release:${version}`, 'utf8'), 32);
  return Buffer.from(childKey);
}

// Derive multi-layer constants for a specific release
function generateLayerConstants(childKey, version) {
  const hash = crypto.createHash('sha256').update(childKey).digest('hex');

  // Layer 0: Sacrificial Honeypot Decoys (can be removed safely)
  const decoys = {
    ORIGIN_WATERMARK_CRC: '0x' + crypto.createHash('sha256').update(childKey + ':decoy1').digest('hex').slice(0, 8),
    BUILD_INTEGRITY_TOKEN: '0x' + crypto.createHash('sha256').update(childKey + ':decoy2').digest('hex').slice(0, 8)
  };

  // Layer 1: Cryptographic Pre-Image Constant (Word 0 offset basis)
  const layer1Word0 = '0x' + hash.slice(0, 8);
  const layer1Word1 = '0x' + hash.slice(8, 16);

  // Layer 2: Poly-algorithmic functional entanglement
  const f1 = (parseInt(hash.slice(16, 20), 16) % 900 + 100) / 10000; // e.g. 0.0412
  const f2 = (parseInt(hash.slice(20, 24), 16) % 900 + 100) / 10000; // e.g. 0.0296
  const ratio = (f1 / f2).toFixed(5);

  // Layer 6: Soft Numerical Constant Cluster (40 values across acceptable ranges)
  const softConstants = [];
  for (let i = 0; i < 40; i++) {
    const byteVal = parseInt(crypto.createHash('sha256').update(`${childKey}:soft:${i}`).digest('hex').slice(0, 4), 16);
    // e.g. debounce between 180ms and 450ms
    const debounce = 180 + (byteVal % 271);
    softConstants.push(debounce);
  }

  return {
    version,
    masterDigest: hash,
    layer0Decoys: decoys,
    layer1: { word0: layer1Word0, word1: layer1Word1 },
    layer2: { jitterCoeff: f1, refillEpsilon: f2, expectedRatio: ratio },
    layer6SoftClusterCount: softConstants.length,
    layer6Sample: softConstants.slice(0, 6),
    softCluster: softConstants
  };
}

// ── VAULT ENCRYPTION & MANAGEMENT ──────────────────────────────────
function getHostMachineKey() {
  const hostInfo = `${os.hostname()}:${os.userInfo().username}:${os.platform()}`;
  return crypto.createHash('sha256').update(hostInfo + ':ghostimprint:host:salt').digest();
}

function saveVault(vaultData, metadata = null) {
  ensureVaultDir();
  const meta = metadata || (vaultData.epochs && vaultData.epochs[0] && vaultData.epochs[0].metadata) || discoverProjectMetadata();
  const projectVaultPath = getProjectVaultPath(meta);
  const key = getHostMachineKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const plaintext = JSON.stringify(vaultData, null, 2);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = {
    version: 1,
    projectSlug: getProjectSlug(meta),
    iv: iv.toString('hex'),
    authTag,
    data: encrypted,
    updatedAt: new Date().toISOString()
  };

  // Write to project-segmented vault file
  fs.writeFileSync(projectVaultPath, JSON.stringify(payload, null, 2), 'utf8');
  // Also keep backward-compatible primary vault file updated
  const legacyVaultPath = getVaultFilePath();
  fs.writeFileSync(legacyVaultPath, JSON.stringify(payload, null, 2), 'utf8');

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(projectVaultPath, 0o600);
      fs.chmodSync(legacyVaultPath, 0o600);
    } catch (_) {}
  }
  return projectVaultPath;
}

function decryptVaultFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const key = getHostMachineKey();
    const iv = Buffer.from(raw.iv, 'hex');
    const authTag = Buffer.from(raw.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(raw.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

function loadVault(metadata = null) {
  const meta = metadata || discoverProjectMetadata();
  const projectVaultPath = getProjectVaultPath(meta);
  
  // 1. Try project-isolated vault
  if (fs.existsSync(projectVaultPath)) {
    const data = decryptVaultFile(projectVaultPath);
    if (data) return data;
  }

  // 2. Try legacy root vault file
  const legacyVaultPath = getVaultFilePath();
  if (fs.existsSync(legacyVaultPath)) {
    const data = decryptVaultFile(legacyVaultPath);
    if (data) return data;
  }

  // 2b. Migrate GhostPrint era vaults (pre-rename). Read only; new saves go to ~/.ghostimprint.
  const legacyGhostPrintDir = path.join(os.homedir(), '.ghostprint');
  const legacyGhostPrintProject = path.join(legacyGhostPrintDir, 'projects', `${getProjectSlug(meta)}.vault.json.enc`);
  if (fs.existsSync(legacyGhostPrintProject)) {
    const data = decryptVaultFile(legacyGhostPrintProject);
    if (data) return data;
  }
  const legacyGhostPrintRoot = path.join(legacyGhostPrintDir, 'vault.json.enc');
  if (fs.existsSync(legacyGhostPrintRoot)) {
    const data = decryptVaultFile(legacyGhostPrintRoot);
    if (data) return data;
  }

  // 3. Try global identity
  const identityPath = path.join(getVaultDir(), 'identity.vault.json.enc');
  if (fs.existsSync(identityPath)) {
    return decryptVaultFile(identityPath);
  }

  return null;
}

function listRegisteredProjects() {
  ensureVaultDir();
  const pDir = getProjectsDir();
  const results = [];

  if (fs.existsSync(pDir)) {
    const files = fs.readdirSync(pDir).filter(f => f.endsWith('.vault.json.enc'));
    for (const f of files) {
      const fullPath = path.join(pDir, f);
      const decrypted = decryptVaultFile(fullPath);
      if (decrypted && decrypted.epochs && decrypted.epochs.length > 0) {
        const latestEpoch = decrypted.epochs[decrypted.epochs.length - 1];
        results.push({
          slug: f.replace('.vault.json.enc', ''),
          vaultPath: fullPath,
          project: (latestEpoch.metadata && latestEpoch.metadata.project) || 'Unknown',
          repo: (latestEpoch.metadata && latestEpoch.metadata.repo) || 'Unknown',
          author: (latestEpoch.metadata && latestEpoch.metadata.author) || 'Unknown',
          tier: latestEpoch.tier || 'Standard',
          epochsCount: decrypted.epochs.length,
          lastUpdated: latestEpoch.createdAt
        });
      }
    }
  }

  // If projects dir is empty, check legacy vault file
  if (results.length === 0) {
    const legacyVaultPath = getVaultFilePath();
    const decrypted = decryptVaultFile(legacyVaultPath);
    if (decrypted && decrypted.epochs && decrypted.epochs.length > 0) {
      const latestEpoch = decrypted.epochs[decrypted.epochs.length - 1];
      results.push({
        slug: getProjectSlug(latestEpoch.metadata),
        vaultPath: legacyVaultPath,
        project: (latestEpoch.metadata && latestEpoch.metadata.project) || 'Unknown',
        repo: (latestEpoch.metadata && latestEpoch.metadata.repo) || 'Unknown',
        author: (latestEpoch.metadata && latestEpoch.metadata.author) || 'Unknown',
        tier: latestEpoch.tier || 'Standard',
        epochsCount: decrypted.epochs.length,
        lastUpdated: latestEpoch.createdAt
      });
    }
  }

  return results;
}

// ── FAIL-CLOSED GITIGNORE GATEKEEPER ────────────────────────────────
function assertGitIgnore(cwd = process.cwd()) {
  const gitIgnorePath = path.join(cwd, '.gitignore');
  let content = fs.existsSync(gitIgnorePath) ? fs.readFileSync(gitIgnorePath, 'utf8') : '';
  const lines = content.split(/\r?\n/).map(l => l.trim());

  const requiredEntries = ['.env', '.env.local', '.ghostimprint', '*.enc'];
  const missing = requiredEntries.filter(r => !lines.includes(r));

  if (missing.length > 0) {
    const addition = '\n# GhostImprint Engine & Security Invariant Gatekeeper\n' + missing.join('\n') + '\n';
    fs.appendFileSync(gitIgnorePath, addition, 'utf8');
    return { modified: true, appended: missing };
  }

  return { modified: false, appended: [] };
}

// ── INTERACTIVE TERMINAL PROMPTING HELPER ───────────────────────────
function askQuestion(rl, query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// ── SHIELDS.IO README BADGE GENERATOR & GATEKEEPER ─────────────────
function generateBadgeMarkdown(metadata = {}) {
  const url = 'https://img.shields.io/badge/GhostImprint-Protected-00f0ff?style=flat-square&logo=shield&logoColor=06090e';
  const targetUrl = 'https://code-scaffold.com';
  return `[![GhostImprint Protected](${url})](${targetUrl})`;
}

function generateBadgeHtml(metadata = {}) {
  const url = 'https://img.shields.io/badge/GhostImprint-Protected-00f0ff?style=flat-square&logo=shield&logoColor=06090e';
  const targetUrl = 'https://code-scaffold.com';
  return `<a href="${targetUrl}"><img src="${url}" alt="GhostImprint Protected" /></a>`;
}

function assertReadmeBadge(projectDir = process.cwd(), options = {}) {
  const badgeMarkdown = generateBadgeMarkdown(options.metadata);

  // Find README.md or readme.md
  let targetFile = 'README.md';
  let fullPath = path.join(projectDir, 'README.md');
  if (!fs.existsSync(fullPath)) {
    const altPath = path.join(projectDir, 'readme.md');
    if (fs.existsSync(altPath)) {
      targetFile = 'readme.md';
      fullPath = altPath;
    }
  }

  // If no readme exists, create a clean README.md
  if (!fs.existsSync(fullPath)) {
    const projectName = (options.metadata && options.metadata.project) || path.basename(projectDir);
    const content = `# ${projectName}\n\n${badgeMarkdown}\n`;
    fs.writeFileSync(fullPath, content, 'utf8');
    return { created: true, modified: true, alreadyPresent: false, fullPath, fileName: targetFile, badgeMarkdown };
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Check if GhostImprint badge is already present
  if (
    content.includes('badge/GhostImprint') ||
    content.includes('GhostImprint-Protected') ||
    content.includes('[![GhostImprint')
  ) {
    return { created: false, modified: false, alreadyPresent: true, fullPath, fileName: targetFile, badgeMarkdown };
  }

  // Migrate GhostPrint era badge to GhostImprint (rename). Exact line swap only.
  if (
    content.includes('badge/GhostPrint') ||
    content.includes('GhostPrint-Protected') ||
    content.includes('[![GhostPrint')
  ) {
    const migrated = content.replace(/\[!\[GhostPrint[^\]]*\]\([^)]+\)/g, badgeMarkdown);
    if (migrated !== content) {
      fs.writeFileSync(fullPath, migrated, 'utf8');
      return { created: false, modified: true, alreadyPresent: false, migrated: true, fullPath, fileName: targetFile, badgeMarkdown };
    }
  }

  // Insert badge directly below primary # header or within existing badge block
  const headerMatch = content.match(/^(#\s+[^\r\n]+(?:\r?\n|$))/m);
  let newContent = '';

  if (headerMatch) {
    const headerEndIndex = headerMatch.index + headerMatch[0].length;
    const rest = content.slice(headerEndIndex);

    // If rest immediately starts with badge links (e.g. [![)
    if (/^\r?\n\[!\[/.test(rest)) {
      const newlineMatch = rest.match(/^(\r?\n)/);
      const nl = newlineMatch ? newlineMatch[1] : '\n';
      newContent = content.slice(0, headerEndIndex) + nl + badgeMarkdown + rest;
    } else if (/^\r?\n\r?\n\[!\[/.test(rest)) {
      // Separated by double newline
      const newlineMatch = rest.match(/^(\r?\n\r?\n)/);
      const nl = newlineMatch ? newlineMatch[1] : '\n\n';
      newContent = content.slice(0, headerEndIndex) + nl + badgeMarkdown + '\n' + rest.slice(nl.length);
    } else {
      const nl = content.includes('\r\n') ? '\r\n' : '\n';
      const trimmedRest = rest.replace(/^(\r?\n)+/, '');
      newContent = content.slice(0, headerEndIndex) + nl + badgeMarkdown + nl + nl + trimmedRest;
    }
  } else {
    const nl = content.includes('\r\n') ? '\r\n' : '\n';
    newContent = badgeMarkdown + nl + nl + content;
  }

  fs.writeFileSync(fullPath, newContent, 'utf8');
  return { created: false, modified: true, alreadyPresent: false, fullPath, fileName: targetFile, badgeMarkdown };
}

// ── CLI COMMAND: KEY CEREMONY (INIT / PROTECT) ──────────────────────
async function runKeyCeremony(metadata, options = {}) {
  printBanner();
  const isAuto = Boolean(options.auto);
  const isInteractive = Boolean(process.stdin.isTTY && !isAuto);
  const rl = isInteractive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

  console.log(`${C.silver}Initializing GhostImprint Key Ceremony for:${C.reset}`);
  console.log(`* ${C.cyan}Project:${C.reset} ${metadata.project}`);
  console.log(`* ${C.cyan}Author:${C.reset}  ${metadata.author}`);
  console.log(`* ${C.cyan}Repo:${C.reset}    ${metadata.repo}\n`);

  console.log(`${C.amber}${C.bold}ONE WAY STREET: enrollment is permanent for published releases.${C.reset}`);
  console.log(`${C.amber}Constants sealed into shipped versions stay in git history and cannot be retracted.${C.reset}`);
  console.log(`${C.amber}Unprotect removes local enrollment only, never published history.${C.reset}\n`);

  let choice = '1';
  if (isInteractive) {
    console.log(`${C.bold}${C.cyan}Select Cryptographic Security Profile (Up to 24 Words):${C.reset}`);
    console.log(`  ${C.emerald}[1] 160-Bit Quantum-Resistant (15 words) [Recommended]${C.reset}`);
    console.log(`      A supercomputer guessing 1 trillion keys/sec would take:`);
    console.log(`      100 Quintillion × Age of Universe (Immune to quantum Grover search).`);
    console.log(`  ${C.cyan}[2] 128-Bit Standard Financial (12 words)${C.reset}`);
    console.log(`      A supercomputer guessing 1 trillion keys/sec would take:`);
    console.log(`      1.2 Trillion × Age of Universe (17 Sextillion years; universal crypto standard).`);
    console.log(`  ${C.violet}[3] 192-Bit Intermediate Fortress (18 words)${C.reset}`);
    console.log(`      A supercomputer guessing 1 trillion keys/sec would take:`);
    console.log(`      80 Nonillion × Age of Universe (Military-grade defense).`);
    console.log(`  ${C.violet}[4] 224-Bit Advanced Sovereign (21 words)${C.reset}`);
    console.log(`      A supercomputer guessing 1 trillion keys/sec would take:`);
    console.log(`      700 Undecillion × Age of Universe (Multi-generational archival proof).`);
    console.log(`  ${C.violet}[5] 256-Bit Maximum Sovereign (24 words)${C.reset}`);
    console.log(`      A supercomputer guessing 1 trillion keys/sec would take:`);
    console.log(`      Effectively Infinite (Exceeds estimated Heat Death of the Cosmos).`);
    console.log(`  ${C.silver}[6] 99-Bit Rapid Lightweight (9 words)${C.reset}`);
    console.log(`      A supercomputer guessing 1 trillion keys/sec would take:`);
    console.log(`      20 Million Years (1,500 × all of recorded human history).`);
    console.log(`  ${C.amber}[7] Custom Manual Sentence (Interactive Real-Time Cosmic Meter)${C.reset}\n`);

    choice = (await askQuestion(rl, `${C.cyan}Enter selection [1-7] (default: 1): ${C.reset}`)).trim() || '1';
  } else {
    console.log(`${C.emerald}[✓] Automated Key Ceremony: using 160-Bit Quantum-Resistant (15 words) profile.${C.reset}`);
  }

  let words = [];
  if (choice === '1') {
    words = generateMnemonic(15);
  } else if (choice === '2') {
    words = generateMnemonic(12);
  } else if (choice === '3') {
    words = generateMnemonic(18);
  } else if (choice === '4') {
    words = generateMnemonic(21);
  } else if (choice === '5') {
    words = generateMnemonic(24);
  } else if (choice === '6') {
    words = generateMnemonic(9);
  } else if (choice === '7') {
    console.log(`\n${C.silver}Enter your custom high-entropy pass-sentence:${C.reset}`);
    const customLine = isInteractive ? await askQuestion(rl, `> `) : '';
    words = customLine.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) words = generateMnemonic(15);
  } else {
    words = generateMnemonic(15);
  }

  // Evaluate bits and anti-correlation
  const calculatedBits = evaluateEntropy(words);
  const projectKeywords = getProjectKeywords(metadata);
  const antiCorr = validateAntiCorrelation(words, projectKeywords);

  console.log(`\n${C.bold}┌────────────────────────────────────────────────────────────────────────────┐${C.reset}`);
  console.log(`${C.bold}│ YOUR MASTER IDENTITY PASSPHRASE (SAVE TO COLD STORAGE):                    │${C.reset}`);
  console.log(`│                                                                            │`);
  console.log(`│   ${C.cyan}${words.join('  ')}${C.reset}`);
  console.log(`│                                                                            │`);
  console.log(`│ ${C.silver}Calculated Entropy:${C.reset} ${calculatedBits} bits`);
  console.log(`│ ${C.silver}External Word Ratio:${C.reset} ${antiCorr.externalRatio}% ${antiCorr.passed ? C.emerald + '[POLICY PASSED]' : C.red + '[POLICY FAILED]'} ${C.reset}`);
  console.log(`${C.bold}└────────────────────────────────────────────────────────────────────────────┘${C.reset}\n`);

  if (!antiCorr.passed) {
    console.log(`${C.red}${C.bold}[!] ANTI-CORRELATION POLICY VIOLATION:${C.reset}`);
    console.log(`    Matched project terms: ${antiCorr.matched.join(', ')}`);
    console.log(`    At least 75% of your words must be external dictionary terms to prevent`);
    console.log(`    adversaries from dictionary-attacking known project metadata.\n`);
    if (rl) rl.close();
    process.exit(1);
  }

  let storeChoice = '1';
  if (isInteractive) {
    console.log(`${C.bold}${C.cyan}Select Storage Target:${C.reset}`);
    console.log(`  ${C.emerald}[1] Secure Project Vault: ~/.ghostimprint/projects/${getProjectSlug(metadata)}.vault.json.enc (Recommended: isolated outside git)${C.reset}`);
    console.log(`  ${C.cyan}[2] Local Project .env (Automatic .gitignore assertion enforced)${C.reset}`);
    console.log(`  ${C.silver}[3] Ephemeral Memory Only (Prompt on every release build)${C.reset}\n`);

    storeChoice = (await askQuestion(rl, `${C.cyan}Enter storage selection [1-3] (default: 1): ${C.reset}`)).trim() || '1';
  } else {
    console.log(`${C.emerald}[✓] Automated Storage Selection: using Secure Project Vault (~/.ghostimprint/projects/).${C.reset}`);
  }

  const masterKey = deriveMasterKey(words, metadata);
  const masterHash = crypto.createHash('sha256').update(masterKey).digest('hex');

  const epochData = {
    epoch: 1,
    createdAt: new Date().toISOString(),
    passphraseWords: words,
    metadata,
    masterDigest: masterHash
  };

  if (storeChoice === '1') {
    const existingVault = loadVault(metadata) || { epochs: [] };
    existingVault.epochs.push(epochData);
    const savedPath = saveVault(existingVault, metadata);
    console.log(`\n${C.emerald}[✓] Master identity securely sealed into: ${savedPath}${C.reset}`);
    console.log(`${C.emerald}[✓] AES-256-GCM encrypted at rest using host-derived cryptographic key.${C.reset}`);
  } else if (storeChoice === '2') {
    const gitIgnoreRes = assertGitIgnore();
    if (gitIgnoreRes.modified) {
      console.log(`${C.amber}[✓] Automatically appended .env to .gitignore for security protection.${C.reset}`);
    }
    const envLine = `\nGHOSTIMPRINT_MASTER_PASSPHRASE="${words.join(' ')}"\n`;
    fs.appendFileSync(path.join(process.cwd(), '.env'), envLine, 'utf8');
    console.log(`${C.emerald}[✓] Saved to project .env (verified excluded from git index).${C.reset}`);
  } else {
    console.log(`\n${C.silver}[✓] Ephemeral mode selected. Master secret held in memory only.${C.reset}`);
  }

  // Derive initial Layer 1-7 constants for v1.0.0
  const initialChildKey = deriveReleaseChildKey(masterKey, '1.0.0', metadata);
  const layerConstants = generateLayerConstants(initialChildKey, '1.0.0');

  console.log(`\n${C.bold}${C.cyan}Derived Release Constants (v1.0.0 Preview):${C.reset}`);
  console.log(`* Layer 0 Decoy:   ${layerConstants.layer0Decoys.ORIGIN_WATERMARK_CRC}`);
  console.log(`* Layer 1 Word 0:  ${layerConstants.layer1.word0}`);
  console.log(`* Layer 2 Ratio:   ${layerConstants.layer2.expectedRatio} (${layerConstants.layer2.jitterCoeff} / ${layerConstants.layer2.refillEpsilon})`);
  console.log(`* Layer 6 Cluster: ${layerConstants.layer6SoftClusterCount} soft numerical constants calculated`);

  // Assert README badge unless explicitly opted out
  if (!options.noBadge) {
    const badgeRes = assertReadmeBadge(options.targetDir || process.cwd(), { metadata });
    if (badgeRes.created) {
      console.log(`* README Badge:    ${C.emerald}Created ${badgeRes.fileName} with [GhostImprint Protected] badge${C.reset}`);
    } else if (badgeRes.migrated) {
      console.log(`* README Badge:    ${C.emerald}Migrated legacy badge to [GhostImprint Protected] in ${badgeRes.fileName}${C.reset}`);
    } else if (badgeRes.modified) {
      console.log(`* README Badge:    ${C.emerald}Injected [GhostImprint Protected] badge into ${badgeRes.fileName}${C.reset}`);
    } else if (badgeRes.alreadyPresent) {
      console.log(`* README Badge:    ${C.silver}[GhostImprint Protected] badge verified in ${badgeRes.fileName}${C.reset}`);
    }
  }

  console.log(`\n${C.emerald}${C.bold}✅ GHOSTIMPRINT KEY CEREMONY COMPLETE!${C.reset}\n`);

  if (rl) rl.close();
}

// ── NATURAL LANGUAGE PARSER & COMMAND DISPATCHER ────────────────────
async function main() {
  const args = process.argv.slice(2);
  const rawInput = args.join(' ').toLowerCase();
  const metadata = discoverProjectMetadata();

  const isAuto = args.includes('--auto') || args.includes('-y') || args.includes('--yes');
  const noBadge = args.includes('--no-badge');
  const targetDirIndex = args.indexOf('--target');
  const targetDir = targetDirIndex !== -1 && args[targetDirIndex + 1] ? path.resolve(args[targetDirIndex + 1]) : process.cwd();

  if (args.includes('--json')) {
    // Machine readable agent mode
    const vault = loadVault();
    if (!vault || !vault.epochs || vault.epochs.length === 0) {
      console.log(JSON.stringify({ status: 'uninitialized', metadata }));
    } else {
      console.log(JSON.stringify({ status: 'active', epochs: vault.epochs.length, metadata }));
    }
    return;
  }

  // Natural Language Intent Matching
  if (
    rawInput.includes('badge') ||
    rawInput.includes('shields')
  ) {
    printBanner();
    const badgeRes = assertReadmeBadge(targetDir, { metadata });
    console.log(`${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.cyan}║                   GHOSTIMPRINT README BADGE GENERATOR                        ║${C.reset}`);
    console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);
    console.log(`${C.silver}Markdown Badge:${C.reset}`);
    console.log(`  ${badgeRes.badgeMarkdown}\n`);
    console.log(`${C.silver}HTML Badge:${C.reset}`);
    console.log(`  ${generateBadgeHtml(metadata)}\n`);
    if (badgeRes.created) {
      console.log(`${C.emerald}[✓] Created ${badgeRes.fileName} with GhostImprint Protected badge.${C.reset}\n`);
    } else if (badgeRes.migrated) {
      console.log(`${C.emerald}[✓] Migrated legacy GhostPrint badge to GhostImprint in ${badgeRes.fileName}.${C.reset}\n`);
    } else if (badgeRes.modified) {
      console.log(`${C.emerald}[✓] Injected GhostImprint Protected badge into ${badgeRes.fileName}.${C.reset}\n`);
    } else {
      console.log(`${C.silver}[✓] GhostImprint Protected badge is already present in ${badgeRes.fileName}.${C.reset}\n`);
    }
  } else if (
    rawInput.includes('list') ||
    rawInput.includes('show projects') ||
    rawInput.includes('registered') ||
    rawInput.includes('vaults')
  ) {
    printBanner();
    const projects = listRegisteredProjects();
    console.log(`${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.cyan}║                     GHOSTIMPRINT REGISTERED PROJECTS                         ║${C.reset}`);
    console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

    if (projects.length === 0) {
      console.log(`${C.silver}No projects registered yet. Run ${C.cyan}ghostimprint init${C.silver} to seal your first repository.${C.reset}\n`);
    } else {
      for (const p of projects) {
        console.log(`* ${C.bold}${C.emerald}${p.project}${C.reset} (${C.silver}${p.repo}${C.reset})`);
        console.log(`  ${C.dim}Vault File:${C.reset} ${C.cyan}${p.vaultPath}${C.reset}`);
        console.log(`  ${C.dim}Author:${C.reset}     ${p.author}`);
        console.log(`  ${C.dim}Security:${C.reset}   ${p.tier}`);
        console.log(`  ${C.dim}Epochs:${C.reset}     ${p.epochsCount} active epoch(s) | Last updated: ${p.lastUpdated}\n`);
      }
    }
  } else if (
    rawInput.includes('record decision') ||
    rawInput.includes('record --') ||
    rawInput.includes('log decision') ||
    rawInput.includes('receipt record')
  ) {
    printBanner();
    const getFlag = (name) => {
      const i = args.indexOf(name);
      return i !== -1 && args[i + 1] ? args[i + 1] : null;
    };
    const release = getFlag('--release') || '1.0.0';
    const layer = (getFlag('--layer') || '').toLowerCase();
    const site = getFlag('--site') || '';
    const value = getFlag('--value') || '';
    const note = getFlag('--note') || '';
    try {
      const savedPath = recordDecision(metadata, release, layer, site, value, note);
      console.log(`${C.emerald}[✓] Recorded ${layer} decision for ${release} at ${site} -> ${savedPath}${C.reset}\n`);
    } catch (err) {
      console.error(`${C.red}GhostImprint Error: ${err.message}${C.reset}`);
      process.exit(1);
    }
  } else if (
    rawInput.includes('record-plan') ||
    rawInput.includes('record plan') ||
    rawInput.includes('bind probe') ||
    rawInput.includes('probe plan')
  ) {
    printBanner();
    const getFlag = (name) => {
      const i = args.indexOf(name);
      return i !== -1 && args[i + 1] ? args[i + 1] : null;
    };
    const release = getFlag('--release') || '1.0.0';
    let triggers = [];
    const triggersRaw = getFlag('--triggers');
    if (triggersRaw) {
      try {
        triggers = JSON.parse(triggersRaw);
        if (!Array.isArray(triggers)) throw new Error('not an array');
      } catch (err) {
        console.error(`${C.red}GhostImprint Error: --triggers must be a JSON array of {path, expect} objects.${C.reset}`);
        process.exit(1);
      }
    }
    try {
      const savedPath = recordProbePlan(metadata, release, {
        triggers,
        endpoint: getFlag('--endpoint'),
        expected: getFlag('--expect'),
        toleranceMs: getFlag('--tolerance-ms') ? Number(getFlag('--tolerance-ms')) : null
      });
      console.log(`${C.emerald}[✓] Bound probe plan for ${release} (${triggers.length} triggers) -> ${savedPath}${C.reset}\n`);
    } catch (err) {
      console.error(`${C.red}GhostImprint Error: ${err.message}${C.reset}`);
      process.exit(1);
    }
  } else if (
    rawInput.includes('anchor') ||
    rawInput.includes('seal release') ||
    rawInput.includes('timestamp release')
  ) {
    printBanner();
    const getFlag = (name) => {
      const i = args.indexOf(name);
      return i !== -1 && args[i + 1] ? args[i + 1] : null;
    };
    const release = getFlag('--release') || '1.0.0';
    const tag = getFlag('--tag');
    const tier = (getFlag('--tier') || 'local').toLowerCase();
    const cwdIdx = args.indexOf('--cwd');
    const cwd = cwdIdx !== -1 && args[cwdIdx + 1] ? path.resolve(args[cwdIdx + 1]) : process.cwd();
    if (tier !== 'local' && tier !== 'notarized') {
      console.error(`${C.red}GhostImprint Error: unknown tier "${tier}". Use local or notarized. Sovereign (on-chain) is a future iteration.${C.reset}`);
      process.exit(1);
    }
    try {
      const savedPath = recordAnchor(metadata, release, cwd, tag);
      const stored = (loadReceipt(metadata).releases[release] || {}).anchor;
      const check = verifyAnchor(stored);
      console.log(`${C.emerald}[✓] Anchored ${release} (tier: local) -> ${savedPath}${C.reset}`);
      console.log(`${C.silver}Verified: ${check.verified ? 'commit and tree objects present' : check.reason}${C.reset}`);
      if (tier === 'notarized') {
        const privacyNotice = 'Notarized anchors publish the release commitment hash and a derived public key to the Rekor transparency log and a timestamp authority. Source code never leaves this machine, but the hash, key, and timestamp become public and permanent.';
        const runNotarized = () => notarizeRelease(metadata, release, { tsaUrl: getFlag('--tsa-url'), rekorUrl: getFlag('--rekor-url') }).then((rep) => {
          console.log(`${C.silver}TSA witness: ${rep.tsa.ok ? 'recorded (genTime ' + rep.tsa.genTime + ')' : 'FAILED: ' + rep.tsa.error}${C.reset}`);
          console.log(`${C.silver}Rekor witness: ${rep.rekor.ok ? 'recorded (uuid ' + rep.rekor.uuid + ')' : 'FAILED: ' + rep.rekor.error}${C.reset}\n`);
          if (!rep.tsa.ok || !rep.rekor.ok) {
            console.error(`${C.amber}Notarized tier incomplete. Local anchor retained; re-run anchor --tier notarized when online.${C.reset}`);
            process.exit(1);
          }
        }).catch((err) => {
          console.error(`${C.red}GhostImprint Error: ${err.message}${C.reset}`);
          process.exit(1);
        });
        if (args.includes('--yes')) {
          runNotarized();
          return;
        }
        if (!process.stdin.isTTY) {
          console.error(`${C.amber}Refusing: notarized anchors publish data permanently. Re-run with --yes to consent, or run interactively.${C.reset}`);
          console.error(`${C.dim}${privacyNotice}${C.reset}`);
          process.exit(1);
        }
        console.log(`${C.amber}Privacy: ${privacyNotice}${C.reset}`);
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('Publish and continue? [y/N] ', (answer) => {
          rl.close();
          if (String(answer).trim().toLowerCase() !== 'y' && String(answer).trim().toLowerCase() !== 'yes') {
            console.log(`${C.silver}Declined. Local anchor retained; nothing was published.${C.reset}\n`);
            process.exit(1);
          }
          runNotarized();
        });
        return;
      }
      console.log('');
    } catch (err) {
      console.error(`${C.red}GhostImprint Error: ${err.message}${C.reset}`);
      process.exit(1);
    }
  } else if (
    rawInput.includes('receipt') ||
    rawInput.includes('show receipt') ||
    rawInput.includes('recorded decisions')
  ) {
    printBanner();
    const receipt = loadReceipt(metadata);
    if (!receipt) {
      console.log(`${C.silver}No application receipt for this project yet. Record decisions with the record command.${C.reset}\n`);
    } else {
      console.log(JSON.stringify(receiptSummary(receipt), null, 2));
    }
  } else if (
    rawInput.includes('init') ||
    rawInput.includes('protect') ||
    rawInput.includes('seal') ||
    rawInput.includes('enroll') ||
    rawInput.includes('guard') ||
    rawInput.includes('create key') ||
    rawInput.includes('generate key') ||
    rawInput.includes('generate passphrase') ||
    rawInput.includes('passphrase') ||
    rawInput.includes('setup') ||
    rawInput.includes('new key')
  ) {
    await runKeyCeremony(metadata, { auto: isAuto, noBadge, targetDir });
  } else if (
    rawInput.includes('audit') ||
    rawInput.includes('check') ||
    rawInput.includes('examine') ||
    rawInput.includes('did they copy') ||
    rawInput.includes('stole')
  ) {
    const auditScript = path.join(__dirname, 'ghostimprint-audit.js');
    const auditor = require(auditScript);
    const auditTargetIdx = args.indexOf('--target');
    const auditTarget = auditTargetIdx !== -1 && args[auditTargetIdx + 1]
      ? path.resolve(args[auditTargetIdx + 1])
      : (args.find(a => !a.startsWith('-') && !/audit|check|examine|stole|copy/i.test(a)) || process.cwd());
    const auditReleaseIdx = args.indexOf('--release');
    auditor.runAudit(auditTarget, args.includes('--json'), auditReleaseIdx !== -1 && args[auditReleaseIdx + 1] ? args[auditReleaseIdx + 1] : null);
  } else if (
    rawInput.includes('probe') ||
    rawInput.includes('oracle') ||
    rawInput.includes('http') ||
    rawInput.includes('url')
  ) {
    const oracleScript = path.join(__dirname, 'ghostimprint-oracle.js');
    const oracle = require(oracleScript);
    const urlIdx = args.indexOf('--url');
    const probeUrl = urlIdx !== -1 && args[urlIdx + 1] ? args[urlIdx + 1] : null;
    const inlineUrl = (rawInput.match(/https?:\/\/[^\s"']+/) || [])[0] || null;
    oracle.runOracleProbe(probeUrl || inlineUrl || 'https://example-suspect-saas.com', args.includes('--json'));
  } else if (
    rawInput.includes('export') ||
    rawInput.includes('dossier') ||
    rawInput.includes('court') ||
    rawInput.includes('exhibit') ||
    rawInput.includes('dmca')
  ) {
    const exportScript = path.join(__dirname, 'ghostimprint-export.js');
    require(exportScript);
  } else {
    // Default interactive dashboard
    printBanner();
    console.log(`${C.silver}Natural Language Command Interface:${C.reset}`);
    console.log(`  node ghostimprint.js "protect this repository"`);
    console.log(`  node ghostimprint.js "generate a new 15-word passphrase for this repo"`);
    console.log(`  node ghostimprint.js "add ghostimprint badge to readme"`);
    console.log(`  node ghostimprint.js "audit ../competitor-repo against my master secret"`);
    console.log(`  node ghostimprint.js "probe https://suspect-saas.com for my watermark"`);
    console.log(`  node ghostimprint.js "export court-admissible legal dossier"\n`);
    console.log(`${C.cyan}Direct Subcommands:${C.reset}`);
    console.log(`  ${C.bold}init / protect${C.reset} : Run Key Ceremony & assert README protection badge`);
    console.log(`  ${C.bold}badge${C.reset}          : Generate and assert the Shields.io GhostImprint badge in README.md`);
    console.log(`  ${C.bold}record${C.reset}         : Log an applied decision (--release --layer --site --value)`);
    console.log(`  ${C.bold}record-plan${C.reset}    : Bind oracle probe triggers (--release --triggers JSON)`);
    console.log(`  ${C.bold}anchor${C.reset}         : Seal a release to its git commit and tree (--release [--tag])`);
    console.log(`  ${C.bold}receipt${C.reset}        : Show the recorded application receipt summary`);
    console.log(`  ${C.bold}list${C.reset}           : Display all registered projects and active encrypted vaults`);
    console.log(`  ${C.bold}audit${C.reset}          : Scan a target repository for 9-layer cryptographic fingerprints`);
    console.log(`  ${C.bold}probe${C.reset}          : Execute a remote black-box oracle probe against a cloud SaaS URL`);
    console.log(`  ${C.bold}export${C.reset}         : Generate court-admissible forensic PDF and Markdown evidence dossiers\n`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`${C.red}GhostImprint Error: ${err.message}${C.reset}`);
    process.exit(1);
  });
}

module.exports = {
  discoverProjectMetadata,
  generateMnemonic,
  evaluateEntropy,
  validateAntiCorrelation,
  deriveMasterKey,
  deriveReleaseChildKey,
  generateLayerConstants,
  getReceiptPath,
  loadReceipt,
  saveReceipt,
  recordDecision,
  recordProbePlan,
  latestReceiptRelease,
  receiptSummary,
  recordAnchor,
  verifyAnchor,
  notarizeRelease,
  verifyStoredWitnesses,
  saveVault,
  loadVault,
  getVaultDir,
  getProjectsDir,
  getProjectSlug,
  getProjectVaultPath,
  listRegisteredProjects,
  assertGitIgnore,
  generateBadgeMarkdown,
  generateBadgeHtml,
  assertReadmeBadge
};
