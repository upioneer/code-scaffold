#!/usr/bin/env node
/**
 * GhostImprint Forensic Infringement Auditor
 * Measures only what it can observe. Layers without a real measurement
 * report UNMEASURED, never MATCH. Exits non-zero when no identity exists.
 */

const fs = require('fs');
const path = require('path');
const core = require('./ghostimprint');
const lexicon = require('./ghostimprint-lexicon');

const LITERAL_RE = /('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)/g;

function normalizeLiteral(s) {
  let t = String(s);
  if (t.length >= 2) {
    const q = t[0];
    if ((q === "'" || q === '"' || q === '`') && t[t.length - 1] === q) t = t.slice(1, -1);
  }
  const ws = new RegExp('[' + String.fromCharCode(32, 9, 10, 13) + ']+', 'g');
  return t.replace(ws, ' ').trim().toLowerCase();
}

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[38;2;0;240;255m',
  emerald: '\x1b[38;2;0;255;157m',
  silver: '\x1b[38;2;203;213;225m',
  violet: '\x1b[38;2;168;85;247m',
  amber: '\x1b[38;2;251;191;36m',
  red: '\x1b[38;2;239;68;68m',
  darkGray: '\x1b[38;2;71;85;105m',
  slate: '\x1b[38;2;30;41;59m'
};

function failClosed(message) {
  console.error(`${C.red}${C.bold}[FAIL-CLOSED]${C.reset} ${message}`);
  process.exit(2);
}

function loadIdentity() {
  const metadata = core.discoverProjectMetadata();
  const vault = core.loadVault(metadata);
  if (vault && vault.epochs && vault.epochs.length > 0) {
    const epoch = vault.epochs[vault.epochs.length - 1];
    return {
      metadata,
      masterKey: core.deriveMasterKey(epoch.passphraseWords, epoch.metadata || metadata),
      identitySource: 'vault'
    };
  }
  const envWords = (process.env.GHOSTIMPRINT_MASTER_PASSPHRASE || '').trim().split(/\s+/).filter(Boolean);
  if (envWords.length > 0) {
    return {
      metadata,
      masterKey: core.deriveMasterKey(envWords, metadata),
      identitySource: 'env'
    };
  }
  failClosed('No GhostImprint vault or passphrase for this project. Auditing against a guessed key would produce meaningless results, so this run stops here. Run ghostimprint init first.');
}

function scanFiles(dir, exts = ['.js', '.ts', '.jsx', '.tsx', '.rs', '.py', '.go']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'target' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanFiles(fullPath, exts));
    } else {
      const ext = path.extname(entry.name);
      if (exts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const STEG_RE = /[\uFE00-\uFE0F\u034F\u200B\u200C\u200D\uFEFF]/g;

function classifyConstruct(snippet) {
  const classes = [];
  if (/if\s*\([^)]*\)\s*\{?\s*(return|throw|continue|break)/.test(snippet)) classes.push('guard-clause');
  if ((snippet.match(/if\s*\(/g) || []).length >= 2) classes.push('nested-if');
  if (/\?[^?\n]*:/.test(snippet)) classes.push('ternary');
  if (/for\s*\(\s*(let|var|const)?[^;]*;/.test(snippet)) classes.push('for-classic');
  if (/for\s*\([^)]*\bof\b/.test(snippet)) classes.push('for-of');
  if (/\.forEach\s*\(/.test(snippet)) classes.push('foreach');
  if (/(const|let|var)\s*\{[^}]*\}\s*=/.test(snippet)) classes.push('destructuring');
  if (/else\s+if/.test(snippet)) classes.push('else-if');
  if (/switch\s*\(/.test(snippet)) classes.push('switch');
  if (/\?\./.test(snippet)) classes.push('optional-chain');
  if (/\?\?/.test(snippet)) classes.push('nullish-coalescing');
  return classes;
}

function runAudit(targetDir, isJson = false, release = null) {
  const { metadata, masterKey, identitySource } = loadIdentity();

  // Application receipt selects the release under audit (defaults to v1.0.0)
  const receipt = core.loadReceipt(metadata);
  const receiptRelease = release || (receipt && core.latestReceiptRelease(receipt)) || '1.0.0';
  const recorded = receipt && receipt.releases[receiptRelease] ? receipt.releases[receiptRelease] : null;

  // Derive child key for the release under audit
  const childKey = core.deriveReleaseChildKey(masterKey, receiptRelease, metadata);
  const layerConstants = core.generateLayerConstants(childKey, receiptRelease);

  const files = scanFiles(targetDir);
  const fileContents = [];
  for (const f of files) {
    try {
      fileContents.push({ path: f, content: fs.readFileSync(f, 'utf8') });
    } catch (_) {}
  }

  // Layer 0: Honeypot Decoys (MEASURED, weak signal: presence supports, absence means nothing)
  let decoysFound = 0;
  for (const fc of fileContents) {
    if (fc.content.includes(layerConstants.layer0Decoys.ORIGIN_WATERMARK_CRC)) decoysFound++;
  }

  // Layer 1: Crypto Constants (MEASURED)
  let layer1Matches = 0;
  const matchedLocations = [];
  for (const fc of fileContents) {
    if (fc.content.includes(layerConstants.layer1.word0)) {
      layer1Matches++;
      matchedLocations.push({ file: path.relative(targetDir, fc.path), constant: layerConstants.layer1.word0, layer: 1 });
    }
  }

  // Layer 2: Ratio Entanglement coefficients (MEASURED)
  let layer2RatioMatch = false;
  for (const fc of fileContents) {
    if (fc.content.includes(layerConstants.layer2.jitterCoeff.toString()) || fc.content.includes(layerConstants.layer2.refillEpsilon.toString())) {
      layer2RatioMatch = true;
      matchedLocations.push({ file: path.relative(targetDir, fc.path), ratio: layerConstants.layer2.expectedRatio, layer: 2 });
    }
  }

  // Layer 3: Unicode steganography channels (MEASURED)
  let stegFiles = 0;
  let stegHits = 0;
  for (const fc of fileContents) {
    const hits = fc.content.match(STEG_RE);
    if (hits && hits.length > 0) {
      stegFiles++;
      stegHits += hits.length;
    }
  }

  // Layer 6: Soft constant cluster (MEASURED as literal-hit fraction; no invented p-value)
  const cluster = layerConstants.softCluster || [];
  let softMatched = 0;
  for (const v of cluster) {
    const token = String(v);
    if (fileContents.some(fc => fc.content.includes(token))) softMatched++;
  }

  // Layer 4: Stylometry against receipt-recorded variants (MEASURED only with a receipt)
  const l4entries = (recorded && recorded.layers && recorded.layers.l4) || [];
  let l4 = { status: 'UNMEASURED', reason: `No recorded stylometry decisions for release ${receiptRelease}. Log variants with the record command.` };
  if (l4entries.length > 0) {
    const literals = new Set();
    for (const fc of fileContents) {
      const found = fc.content.match(LITERAL_RE);
      if (found) for (const lit of found) literals.add(normalizeLiteral(lit));
    }
    let l4matched = 0;
    const l4detail = [];
    for (const e of l4entries) {
      const hit = literals.has(normalizeLiteral(String(e.value)));
      if (hit) {
        l4matched++;
        l4detail.push({ condition: e.note || '', variant: e.value, found: true });
      } else {
        l4detail.push({ condition: e.note || '', variant: e.value, found: false });
      }
    }
    l4 = { status: 'MEASURED', matched: l4matched, tested: l4entries.length, entries: l4detail };
  }

  // Layer 5: Construct-choice agreement at recorded sites (MEASURED only with a receipt)
  const l5entries = (recorded && recorded.layers && recorded.layers.l5) || [];
  let l5 = { status: 'UNMEASURED', reason: `No recorded construct decisions for release ${receiptRelease}. Log sites with the record command.` };
  if (l5entries.length > 0) {
    let agreed = 0;
    const l5detail = [];
    for (const e of l5entries) {
      const at = String(e.site || '').lastIndexOf(':');
      const rel = at === -1 ? String(e.site || '') : String(e.site || '').slice(0, at);
      const lineNo = at === -1 ? 1 : parseInt(String(e.site || '').slice(at + 1), 10) || 1;
      const abs = path.resolve(targetDir, rel);
      let detected = [];
      try {
        const lines = fs.readFileSync(abs, 'utf8').split('\n');
        const window = lines.slice(Math.max(0, lineNo - 16), lineNo + 15).join('\n');
        detected = classifyConstruct(window);
      } catch (_) {}
      const ok = detected.includes(String(e.value));
      if (ok) agreed++;
      l5detail.push({ site: e.site, expected: e.value, detected, agreed: ok });
    }
    l5 = { status: 'MEASURED', agreed, tested: l5entries.length, entries: l5detail };
  }

  // Layer 8: Sealed git anchor plus timestamp witnesses (MEASURED when recorded)
  let l8 = { status: 'UNMEASURED', reason: `No sealed anchor for release ${receiptRelease}. Use the anchor command.` };
  if (recorded && recorded.anchor && recorded.anchor.commit) {
    const check = core.verifyAnchor(recorded.anchor);
    const witnesses = core.verifyStoredWitnesses(recorded);
    const parts = [`git:${check.verified ? 'verified' : 'FAILED'}`];
    if (witnesses.tsa.status !== 'ABSENT') parts.push(`tsa:${witnesses.tsa.status}`);
    if (witnesses.rekor.status !== 'ABSENT') parts.push(`rekor:${witnesses.rekor.status}`);
    l8 = check.verified
      ? { status: 'MEASURED', verified: true, commit: check.commit, tree: check.tree, tag: check.tag, dirty: check.dirty, witnesses, detail: parts.join(' ') }
      : { status: 'MEASURED', verified: false, reason: check.reason, commit: recorded.anchor.commit, witnesses, detail: parts.join(' ') };
  }

  const strongHits = (layer1Matches > 0 ? 1 : 0) + (layer2RatioMatch ? 1 : 0);
  const supportingHits = (decoysFound > 0 ? 1 : 0) + (stegFiles > 0 ? 1 : 0)
    + (cluster.length > 0 && softMatched / cluster.length >= 0.25 ? 1 : 0)
    + (l4.status === 'MEASURED' && l4.tested > 0 && l4.matched / l4.tested >= 0.5 ? 1 : 0)
    + (l5.status === 'MEASURED' && l5.tested > 0 && l5.agreed / l5.tested >= 0.5 ? 1 : 0)
    + (l8.status === 'MEASURED' && l8.verified ? 1 : 0);
  let verdict = 'INCONCLUSIVE';
  if (strongHits >= 2) verdict = 'STRONG SUPPORT';
  else if (strongHits === 1 && supportingHits >= 1) verdict = 'MODERATE SUPPORT';

  const result = {
    target: path.resolve(targetDir),
    identitySource,
    release: receiptRelease,
    receiptPresent: Boolean(recorded),
    totalFilesScanned: files.length,
    layers: {
      layer0HoneypotDecoys: { status: 'MEASURED', filesWithDecoys: decoysFound },
      layer1CryptoWords: { status: 'MEASURED', matchedFiles: layer1Matches },
      layer2RatioCoefficients: { status: 'MEASURED', matched: layer2RatioMatch, expectedRatio: layerConstants.layer2.expectedRatio },
      layer3UnicodeChannels: { status: 'MEASURED', filesWithMarkers: stegFiles, totalMarkers: stegHits },
      layer4Stylometry: l4,
      layer5ConstructAgreement: l5,
      layer6SoftCluster: { status: 'MEASURED', matched: softMatched, tested: cluster.length },
      layer7RemoteOracle: { status: 'UNMEASURED', reason: 'Source audit cannot observe remote runtimes. Use ghostimprint-oracle.' },
      layer8TemporalAnchor: l8
    },
    matchedLocations,
    verdict,
    honestyNote: 'Verdict derives from MEASURED layers only. UNMEASURED layers are excluded, never counted as matches. Population error rates are pending corpus baselining.'
  };

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Render Spectral Cyan TUI
  console.log(`\n${C.bold}╔════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║                    GHOSTIMPRINT FORENSIC AUDIT ENGINE                      ║${C.reset}`);
  console.log(`${C.bold}║                  Scanning target: ${targetDir.padEnd(41)}║${C.reset}`);
  console.log(`${C.bold}╚════════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

  console.log(`${C.silver}Auditing against active identity: ${metadata.author} <${metadata.repo}> (source: ${identitySource})${C.reset}`);
  console.log(`Scanning ${files.length} source files...\n`);

  console.log(`[Layer 0] Honeypot Decoys ............ ${decoysFound > 0 ? C.amber + '[FOUND] ' + decoysFound + ' files' : C.silver + '[ABSENT] means nothing'} ${C.reset}`);
  console.log(`[Layer 1] Crypto Hash Words .......... ${layer1Matches > 0 ? C.emerald + '[FOUND] ' + layer1Matches + ' files' : C.silver + '[NONE]'} ${C.reset}`);
  console.log(`[Layer 2] Ratio Coefficients ......... ${layer2RatioMatch ? C.emerald + '[MATCH] ratio ' + layerConstants.layer2.expectedRatio : C.silver + '[NONE]'} ${C.reset}`);
  console.log(`[Layer 3] Unicode Channels ........... ${stegFiles > 0 ? C.emerald + '[FOUND] ' + stegHits + ' markers in ' + stegFiles + ' files' : C.silver + '[NONE]'} ${C.reset}`);
  console.log(`[Layer 4] Stylometric Lexicon ........ ${l4.status === 'MEASURED' ? C.emerald + '[MEASURED] ' + l4.matched + '/' + l4.tested + ' variants' : C.dim + '[UNMEASURED] no recorded decisions'}${C.reset}`);
  console.log(`[Layer 5] Construct Agreement ........ ${l5.status === 'MEASURED' ? C.emerald + '[MEASURED] ' + l5.agreed + '/' + l5.tested + ' sites' : C.dim + '[UNMEASURED] no recorded decisions'}${C.reset}`);
  console.log(`[Layer 6] Soft Constant Cluster ..... ${C.cyan}[MEASURED] ${softMatched}/${cluster.length} literals${C.reset}`);
  console.log(`[Layer 7] Remote Oracle .............. ${C.dim}[UNMEASURED] use ghostimprint-oracle${C.reset}`);
  console.log(`[Layer 8] Temporal Anchor ............ ${l8.status === 'MEASURED' ? (l8.verified ? C.emerald + '[VERIFIED] ' + String(l8.commit).slice(0, 12) : C.amber + '[RECORDED, NOT VERIFIED]') : C.dim + '[UNMEASURED] no sealed anchor'}${C.reset}\n`);

  console.log(`${C.darkGray}──────────────────────────────────────────────────────────────────────────────${C.reset}`);
  console.log(`${C.bold}${C.cyan}                        FORENSIC VERDICT (MEASURED ONLY)                        ${C.reset}`);
  console.log(`${C.darkGray}──────────────────────────────────────────────────────────────────────────────${C.reset}\n`);

  console.log(`Verdict: ${verdict === 'INCONCLUSIVE' ? C.amber + verdict : C.emerald + verdict}${C.reset}`);
  console.log(`${C.silver}Unmeasured layers excluded. Error rates pending corpus baselining.${C.reset}\n`);
}

const args = process.argv.slice(2);
let target = process.cwd();
const targetIdx = args.indexOf('--target');
if (targetIdx !== -1 && args[targetIdx + 1]) {
  target = args[targetIdx + 1];
} else if (args.length > 0 && !args[0].startsWith('-')) {
  target = args[0];
}

const isJson = args.includes('--json');
const releaseIdx = args.indexOf('--release');
const release = releaseIdx !== -1 && args[releaseIdx + 1] ? args[releaseIdx + 1] : null;
if (require.main === module) {
  runAudit(target, isJson, release);
}

module.exports = { runAudit, classifyConstruct, normalizeLiteral, literalPattern: LITERAL_RE.source };
