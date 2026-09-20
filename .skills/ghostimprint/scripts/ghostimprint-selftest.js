#!/usr/bin/env node
/**
 * GhostImprint durable selftest (zero dependencies).
 * Exercises fail-closed identity, planted-fixture audit verdicts,
 * Layer 4/5/8 receipt paths, anchor verify, and oracle verdict logic.
 * Run: node .skills/ghostimprint/scripts/ghostimprint-selftest.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const child = require('child_process');

const SKILL = __dirname;
const failures = [];
function check(name, cond, extra = '') {
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' :: ' + extra : ''));
  if (!cond) failures.push(name);
}
function run(cmd, args, env, cwd) {
  return child.spawnSync(cmd, args, { encoding: 'utf8', env: Object.assign({}, process.env, env), cwd: cwd || process.cwd() });
}

let work = null;
try {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'ghostimprint-selftest-'));
} catch (_) {
  work = fs.mkdtempSync(path.join(process.cwd(), 'ghostimprint-selftest-'));
}
const home = path.join(work, 'home');
fs.mkdirSync(home, { recursive: true });
const hermetic = { GHOSTIMPRINT_MASTER_PASSPHRASE: '', USERPROFILE: home, HOME: home };
const PHRASE = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar';
const authed = Object.assign({}, hermetic, { GHOSTIMPRINT_MASTER_PASSPHRASE: PHRASE });

// 1. Fail closed with no identity
const closed = run(process.execPath, [path.join(SKILL, 'ghostimprint-audit.js'), '--target', work, '--json'], hermetic);
check('audit fail-closed exit 2', closed.status === 2, 'exit=' + closed.status);
check('audit fail-closed message', /FAIL-CLOSED/.test(closed.stderr || closed.stdout || ''));

// 2. Planted fixture with the authenticated identity
const core = require(path.join(SKILL, 'ghostimprint.js'));
const metadata = core.discoverProjectMetadata(process.cwd());
const master = core.deriveMasterKey(PHRASE.split(' '), metadata);
const L = core.generateLayerConstants(core.deriveReleaseChildKey(master, '1.0.0', metadata), '1.0.0');
const fixDir = path.join(work, 'fixture');
fs.mkdirSync(fixDir, { recursive: true });
const vs16 = String.fromCharCode(0xFE0F);
fs.writeFileSync(path.join(fixDir, 'planted.js'),
  `const HASH_OFFSET = ${L.layer1.word0};\nconst jitter = ${L.layer2.jitterCoeff};\nconst boil = ${L.layer2.refillEpsilon};\nconst debounceMs = ${L.softCluster[0]};\nconst msg = 'Upstream host declined connection';\nconst mark = 'edge${vs16}case';\nif (debounceMs) { return boil; }\n`, 'utf8');
const audit1 = run(process.execPath, [path.join(SKILL, 'ghostimprint-audit.js'), '--target', fixDir, '--json'], authed);
let r1 = null;
try { r1 = JSON.parse(audit1.stdout); } catch (e) { check('audit json parses', false, String(e).slice(0, 120)); }
if (r1) {
  check('audit verdict STRONG SUPPORT', r1.verdict === 'STRONG SUPPORT', r1.verdict);
  check('L1 measured hit', r1.layers.layer1CryptoWords.matchedFiles === 1);
  check('L3 measured hit', r1.layers.layer3UnicodeChannels.totalMarkers === 1);
  check('L4 unmeasured without receipt', r1.layers.layer4Stylometry.status === 'UNMEASURED');
  check('L5 unmeasured without receipt', r1.layers.layer5ConstructAgreement.status === 'UNMEASURED');
  check('L8 unmeasured without anchor', r1.layers.layer8TemporalAnchor.status === 'UNMEASURED');
}

// 3. Record L4 + L5 decisions hermetically, re-audit
const rec1 = run(process.execPath, [path.join(SKILL, 'ghostimprint.js'), 'record', '--release', '1.0.0', '--layer', 'l4', '--site', 'planted.js:6', '--value', 'Upstream host declined connection', '--note', 'conn-refused'], authed, process.cwd());
check('record l4 decision', rec1.status === 0, (rec1.stderr || '').slice(0, 120));
const rec2 = run(process.execPath, [path.join(SKILL, 'ghostimprint.js'), 'record', '--release', '1.0.0', '--layer', 'l5', '--site', 'planted.js:7', '--value', 'guard-clause'], authed, process.cwd());
check('record l5 decision', rec2.status === 0, (rec2.stderr || '').slice(0, 120));
const audit2 = run(process.execPath, [path.join(SKILL, 'ghostimprint-audit.js'), '--target', fixDir, '--json'], authed);
let r2 = null;
try { r2 = JSON.parse(audit2.stdout); } catch (e) { check('receipt audit json parses', false); }
if (r2) {
  check('L4 measured 1/1', r2.layers.layer4Stylometry.status === 'MEASURED' && r2.layers.layer4Stylometry.matched === 1, JSON.stringify(r2.layers.layer4Stylometry).slice(0, 100));
  check('L5 measured agree', r2.layers.layer5ConstructAgreement.status === 'MEASURED' && r2.layers.layer5ConstructAgreement.agreed === 1, JSON.stringify(r2.layers.layer5ConstructAgreement.entries || []).slice(0, 160));
}

// 4. Anchor in a scratch git repo, verify through audit
const repo = path.join(work, 'repo');
fs.mkdirSync(repo, { recursive: true });
const gitEnv = Object.assign({}, authed, { GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' });
run('git', ['init'], gitEnv, repo);
fs.writeFileSync(path.join(repo, 'a.txt'), 'x\n', 'utf8');
run('git', ['add', '.'], gitEnv, repo);
const commitOut = run('git', ['commit', '-m', 'seed'], gitEnv, repo);
if (commitOut.status === 0) {
  const anc = run(process.execPath, [path.join(SKILL, 'ghostimprint.js'), 'anchor', '--release', '1.0.0', '--cwd', repo], authed, process.cwd());
  check('anchor records', anc.status === 0, (anc.stderr || '').slice(0, 120));
  const audit3 = run(process.execPath, [path.join(SKILL, 'ghostimprint-audit.js'), '--target', fixDir, '--json'], authed);
  let r3 = null;
  try { r3 = JSON.parse(audit3.stdout); } catch (e) { check('anchor audit json parses', false); }
  if (r3) check('L8 verified', r3.layers.layer8TemporalAnchor.status === 'MEASURED' && r3.layers.layer8TemporalAnchor.verified === true, JSON.stringify(r3.layers.layer8TemporalAnchor).slice(0, 120));
  const notary = run(process.execPath, [path.join(SKILL, 'ghostimprint.js'), 'anchor', '--release', '1.0.0', '--tier', 'notarized', '--cwd', repo], authed, process.cwd());
  check('notarized refuses without consent', notary.status === 1 && /Refusing/.test(notary.stderr || notary.stdout || ''), 'exit=' + notary.status);
} else {
  check('anchor records', true, 'SKIP git unavailable');
}

// 5. Oracle verdict logic on the real module
const oracle = require(path.join(SKILL, 'ghostimprint-oracle.js'));
const near = Array.from({ length: 20 }, (_, i) => 410 + (i % 5));
const far = Array.from({ length: 20 }, (_, i) => 900 + (i % 5));
const t1 = oracle.evaluateTiming(near, 417, 20, 0);
const t2 = oracle.evaluateTiming(far, 417, 20, 0);
const t3 = oracle.evaluateTiming([], 417, 20, 20);
check('oracle near-baseline consistent', t1.verdict === 'TIMING CONSISTENT');
check('oracle far-baseline not observed', t2.verdict === 'NOT OBSERVED');
check('oracle empty unmeasured', t3.status === 'UNMEASURED');

// 6. Timestamp module: codec, TSA round-trip, EC keys, Merkle math, Rekor entry
const tst = require(path.join(SKILL, 'ghostimprint-timestamp.js'));
for (const oid of ['2.16.840.1.101.3.4.2.1', '1.2.840.113549.1.7.2', '1.2.840.10045.3.1.7']) {
  check('OID round-trip ' + oid, tst.oidToString(tst.encOid(oid).slice(2)) === oid);
}
const crypto = require('crypto');
const anchorHash = crypto.createHash('sha256').update('selftest-preimage', 'utf8').digest();
const reqDer = tst.buildTsaRequest(anchorHash, Buffer.from([1, 2, 3, 4]));
const reqBack = tst.parseTsaRequest(reqDer);
check('TSA request round-trip', reqBack.hashAlgorithm === '2.16.840.1.101.3.4.2.1' && Buffer.from(reqBack.hashedMessage).equals(anchorHash));
const tlv = (tag, body) => Buffer.concat([Buffer.from([tag]), body.length < 128 ? Buffer.from([body.length]) : Buffer.from([0x81, body.length]), body]);
const seq = (...p) => tlv(0x30, Buffer.concat(p));
const gint = (n) => tlv(0x02, Buffer.from([n]));
const goct = (b) => tlv(0x04, Buffer.from(b));
const tstrPolicy = tlv(0x06, Buffer.from([0x2a, 0x03]));
const imprint = seq(seq(tlv(0x06, Buffer.from([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01])), Buffer.from([0x05, 0x00])), goct(anchorHash));
const tstInfo = seq(gint(1), tstrPolicy, imprint, gint(7), tlv(0x18, Buffer.from('20260920000000Z', 'ascii')));
const signedData = seq(gint(1), seq(), seq(tlv(0x06, Buffer.from([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x09, 0x10, 0x01, 0x04])), tlv(0xa0, tstInfo)));
const respDer = seq(seq(gint(0)), seq(tlv(0x06, Buffer.from([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x02])), tlv(0xa0, signedData)));
const parsed = tst.parseTsaResponse(respDer);
check('TSA response parses', parsed.statusOk === true && parsed.token !== null);
const imprintCheck = tst.verifyTsaImprint(parsed, anchorHash);
check('TSA imprint verifies', imprintCheck.ok === true && imprintCheck.genTime === '20260920000000Z');
const wrongHash = Buffer.from(anchorHash); wrongHash[0] ^= 0xff;
check('TSA imprint mismatch caught', tst.verifyTsaImprint(parsed, wrongHash).ok === false);
let derStrict = false;
try { tst.parseTsaRequest(Buffer.from([0x30, 0x03, 0x02, 0x01, 0x01])); } catch (_) { derStrict = true; }
check('DER parser rejects truncated input', derStrict);

const scalar = tst.deriveSigningScalar(Buffer.from(PHRASE, 'utf8'));
const n = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');
const scalarN = BigInt('0x' + Buffer.from(scalar).toString('hex'));
check('signing scalar in P-256 range', scalarN > 0n && scalarN < n);
const pem = tst.publicKeyPem(scalar);
check('SPKI PEM shape', pem.startsWith('-----BEGIN PUBLIC KEY-----'));
const sig = tst.signBytes(scalar, anchorHash);
check('ECDSA round-trip verifies', tst.verifySignature(pem, anchorHash, sig));
const tampered = Buffer.from(anchorHash); tampered[0] ^= 0xff;
check('ECDSA tamper fails', tst.verifySignature(pem, tampered, sig) === false);

function sha(b) { return crypto.createHash('sha256').update(b).digest(); }
const leaves = ['a', 'b', 'c', 'd'].map(s => sha(Buffer.concat([Buffer.from([0]), Buffer.from(s)])));
const l01 = sha(Buffer.concat([Buffer.from([1]), leaves[0], leaves[1]]));
const l23 = sha(Buffer.concat([Buffer.from([1]), leaves[2], leaves[3]]));
const root = sha(Buffer.concat([Buffer.from([1]), l01, l23]));
const proofC = [leaves[3].toString('hex'), l01.toString('hex')];
check('Merkle inclusion verifies (RFC6962 math)',
  tst.verifyMerkleInclusion(leaves[2], 2, proofC, 4, root.toString('hex')).ok === true);
check('Merkle tamper fails',
  tst.verifyMerkleInclusion(leaves[2], 2, [leaves[0].toString('hex'), l01.toString('hex')], 4, root.toString('hex')).ok === false);

const entryHash = crypto.createHash('sha256').update('entry-preimage', 'utf8').digest('hex');
const entrySig = tst.signBytes(scalar, Buffer.from(entryHash, 'hex'));
const synthEntry = {
  body: { spec: { data: { hash: { algorithm: 'sha256', value: entryHash } }, signature: { content: Buffer.from(entrySig).toString('base64') } } },
  integratedTime: 1789852462,
  verification: { inclusionProof: { logIndex: 1, treeSize: 2, rootHash: '00', hashes: ['11'] } }
};
const entryCheck = tst.verifyRekorEntry(synthEntry, entryHash, pem);
check('Rekor entry verifies offline', entryCheck.problems.length === 0 && entryCheck.integratedTime === 1789852462, entryCheck.problems.join(';'));
const badEntry = JSON.parse(JSON.stringify(synthEntry));
badEntry.body.spec.data.hash.value = 'ff' + entryHash.slice(2);
check('Rekor entry hash mismatch caught', tst.verifyRekorEntry(badEntry, entryHash, pem).problems.length > 0);

fs.rmSync(work, { recursive: true, force: true });
if (failures.length > 0) {
  console.error(`\nSELFTEST FAILURES: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nSELFTEST ALL PASS');
