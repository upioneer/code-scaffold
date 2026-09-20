#!/usr/bin/env node
/**
 * GhostImprint Remote Black-Box Oracle Probe
 * Measures one real channel (HTTP response timing) against the derived
 * baseline. Channels without a measurement report UNMEASURED, never MATCH.
 */

const https = require('https');
const http = require('http');
const core = require('./ghostimprint');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[38;2;0;240;255m',
  emerald: '\x1b[38;2;0;255;157m',
  silver: '\x1b[38;2;203;213;225m',
  amber: '\x1b[38;2;251;191;36m',
  red: '\x1b[38;2;239;68;68m',
  darkGray: '\x1b[38;2;71;85;105m'
};

const SAMPLES = 20;
const REQUEST_TIMEOUT_MS = 15000;

function evaluateTiming(samples, expectedMs, requests, failures) {
  if (!samples || samples.length === 0) {
    return { status: 'UNMEASURED', reason: 'No successful responses.', failed: failures || 0 };
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length;
  const std = Math.sqrt(variance);
  const tolerance = Math.max(expectedMs * 0.3, 75);
  const within = Math.abs(mean - expectedMs) <= tolerance;
  return {
    status: 'MEASURED',
    requests,
    succeeded: samples.length,
    failed: failures,
    observedMeanMs: Number(mean.toFixed(1)),
    observedStdMs: Number(std.toFixed(1)),
    observedMinMs: Math.min(...samples),
    observedMaxMs: Math.max(...samples),
    expectedBaselineMs: expectedMs,
    toleranceMs: Number(tolerance.toFixed(1)),
    verdict: within ? 'TIMING CONSISTENT' : 'NOT OBSERVED'
  };
}

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
  failClosed('No GhostImprint vault or passphrase for this project. Probing without an identity baseline would produce meaningless results, so this run stops here. Run ghostimprint init first.');
}

function singleRequest(targetUrl) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      resolve({ ok: false, error: 'invalid-url' });
      return;
    }
    const lib = parsed.protocol === 'http:' ? http : https;
    const started = Date.now();
    const req = lib.get(parsed, (res) => {
      res.resume();
      res.on('end', () => resolve({ ok: true, ms: Date.now() - started, status: res.statusCode }));
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.code || 'request-error' }));
  });
}

function fetchBody(targetUrl) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      resolve({ ok: false, error: 'invalid-url' });
      return;
    }
    const lib = parsed.protocol === 'http:' ? http : https;
    const req = lib.get(parsed, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; if (body.length > 200000) req.destroy(); });
      res.on('end', () => resolve({ ok: true, status: res.statusCode, body }));
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.code || 'request-error' }));
  });
}

async function runOracleProbe(targetUrl, isJson = false, release = null) {
  const { metadata, masterKey, identitySource } = loadIdentity();
  const receipt = core.loadReceipt(metadata);
  const receiptRelease = release || (receipt && core.latestReceiptRelease(receipt)) || '1.0.0';
  const childKey = core.deriveReleaseChildKey(masterKey, receiptRelease, metadata);
  const layerConstants = core.generateLayerConstants(childKey, receiptRelease);
  const expectedMs = layerConstants.softCluster[0];

  const samples = [];
  let failures = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const r = await singleRequest(targetUrl);
    if (r.ok) samples.push(r.ms);
    else failures++;
  }

  let timing = evaluateTiming(samples, expectedMs, SAMPLES, failures);

  const recorded = receipt && receipt.releases[receiptRelease] ? receipt.releases[receiptRelease] : null;
  const plan = recorded && recorded.probePlan ? recorded.probePlan : null;

  // Bound error-oracle triggers (MEASURED only with a probe plan)
  let errorOracle = { status: 'UNMEASURED', reason: 'No probe plan bound. Record triggers with the record command.' };
  if (plan && plan.triggers && plan.triggers.length > 0) {
    const triggerResults = [];
    for (const t of plan.triggers) {
      const base = targetUrl.replace(/\/+$/, '');
      const hit = await fetchBody(base + (t.path || '/'));
      const matched = hit.ok && typeof t.expect === 'string' && hit.body.includes(t.expect);
      triggerResults.push({ path: t.path || '/', status: hit.ok ? hit.status : null, expected: t.expect || null, matched: Boolean(matched), error: hit.ok ? null : hit.error });
    }
    const matchedCount = triggerResults.filter(r => r.matched).length;
    errorOracle = { status: 'MEASURED', matched: matchedCount, tested: triggerResults.length, triggers: triggerResults };
  }

  // Bound numerical endpoint (MEASURED only when configured with an expectation)
  let numericalOracle = { status: 'UNMEASURED', reason: 'No render endpoint configured. Bind one in the probe plan.' };
  if (plan && plan.endpoint && typeof plan.expected === 'string') {
    const hit = await fetchBody(plan.endpoint);
    const matched = hit.ok && hit.body.includes(plan.expected);
    numericalOracle = hit.ok
      ? { status: 'MEASURED', endpoint: plan.endpoint, matched: Boolean(matched) }
      : { status: 'MEASURED', endpoint: plan.endpoint, matched: false, error: hit.error };
  }

  const errorSupport = errorOracle.status === 'MEASURED' && errorOracle.tested > 0 && errorOracle.matched / errorOracle.tested >= 0.5;
  const numericalSupport = numericalOracle.status === 'MEASURED' && numericalOracle.matched === true;

  const result = {
    targetUrl,
    timestamp: new Date().toISOString(),
    identitySource,
    release: receiptRelease,
    channels: {
      timingOracle: timing.status === 'MEASURED'
        ? { status: 'MEASURED', observedMeanMs: timing.observedMeanMs, observedStdMs: timing.observedStdMs, expectedBaselineMs: timing.expectedBaselineMs, toleranceMs: timing.toleranceMs, succeeded: timing.succeeded, failed: timing.failed, verdict: timing.verdict }
        : { status: 'UNMEASURED', reason: timing.reason, failed: failures },
      stylometricErrorOracle: errorOracle,
      numericalOutputOracle: numericalOracle
    },
    verdict: timing.status !== 'MEASURED' ? 'INCONCLUSIVE'
      : (timing.verdict === 'TIMING CONSISTENT' && (errorSupport || numericalSupport)) ? 'SUPPORTING EVIDENCE'
      : timing.verdict,
    honestyNote: 'Each channel reports only what it measured. Timing alone is not proof of infringement. UNMEASURED channels are excluded.'
  };

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`\n${C.bold}${C.cyan}[*] GhostImprint Remote Oracle Probe: ${targetUrl}${C.reset}`);
  console.log(`${C.silver}Identity source: ${identitySource}. Expected baseline: ${expectedMs}ms.${C.reset}\n`);

  if (timing.status === 'MEASURED') {
    console.log(`Timing Oracle (MEASURED, ${timing.succeeded}/${SAMPLES} responses):`);
    console.log(`  Observed: mean ${timing.observedMeanMs}ms, std ${timing.observedStdMs}ms, range ${timing.observedMinMs}-${timing.observedMaxMs}ms`);
    console.log(`  Expected: ${timing.expectedBaselineMs}ms (+/- ${timing.toleranceMs}ms)`);
    console.log(`  Verdict:  ${timing.verdict === 'TIMING CONSISTENT' ? C.emerald + timing.verdict : C.amber + timing.verdict}${C.reset}\n`);
  } else {
    console.log(`Timing Oracle: ${C.amber}[UNMEASURED] ${timing.reason}${C.reset}\n`);
  }
  if (errorOracle.status === 'MEASURED') {
    console.log(`Error Oracle (MEASURED):     ${errorOracle.matched}/${errorOracle.tested} triggers matched`);
  } else {
    console.log(`Error Oracle:     ${C.dim}[UNMEASURED] ${errorOracle.reason}${C.reset}`);
  }
  if (numericalOracle.status === 'MEASURED') {
    console.log(`Numerical Oracle (MEASURED): ${numericalOracle.matched ? C.emerald + 'expectation present' : C.amber + 'expectation absent'}${C.reset}`);
  } else {
    console.log(`Numerical Oracle: ${C.dim}[UNMEASURED] ${numericalOracle.reason}${C.reset}`);
  }
  console.log(`\nOverall: ${result.verdict === 'INCONCLUSIVE' || result.verdict === 'NOT OBSERVED' ? C.amber + result.verdict : C.cyan + result.verdict}${C.reset}`);
  console.log(`${C.dim}Each channel reports only what it measured.${C.reset}\n`);
}

const args = process.argv.slice(2);
let url = 'https://example-suspect-saas.com';
const urlIdx = args.indexOf('--url');
if (urlIdx !== -1 && args[urlIdx + 1]) {
  url = args[urlIdx + 1];
} else if (args.length > 0 && !args[0].startsWith('-')) {
  url = args[0];
}

const isJson = args.includes('--json');
const releaseIdx = args.indexOf('--release');
const release = releaseIdx !== -1 && args[releaseIdx + 1] ? args[releaseIdx + 1] : null;
if (require.main === module) {
  runOracleProbe(url, isJson, release);
}

module.exports = { evaluateTiming, runOracleProbe };
