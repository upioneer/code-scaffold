/**
 * GhostImprint timestamp witness module (zero dependencies).
 * Tier 2 (notarized) witnesses: RFC 3161 timestamp authority tokens and
 * Sigstore Rekor transparency-log entries. Everything that can be verified
 * offline is verified locally. Anything needing live interop is labeled,
 * never faked. Tier 3 (OpenTimestamps, on-chain) is a future iteration.
 */
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const OID_SHA256 = '2.16.840.1.101.3.4.2.1';
const OID_SIGNED_DATA = '1.2.840.113549.1.7.2';
const OID_TST_INFO = '1.2.840.113549.1.9.16.1.4';
const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1';
const OID_PRIME256V1 = '1.2.840.10045.3.1.7';
const P256_N = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');

// ── Minimal strict DER codec ─────────────────────────────────────────
function encLen(n) {
  if (n < 0x80) return Buffer.from([n]);
  const bytes = [];
  let v = n;
  while (v > 0) { bytes.unshift(v & 0xff); v >>= 8; }
  return Buffer.concat([Buffer.from([0x80 | bytes.length]), Buffer.from(bytes)]);
}

function tlv(tag, body) {
  return Buffer.concat([Buffer.from([tag]), encLen(body.length), body]);
}

function encIntBytes(raw) {
  let b = Buffer.from(raw);
  let i = 0;
  while (i < b.length - 1 && b[i] === 0x00 && !(b[i + 1] & 0x80)) i++;
  b = b.slice(i);
  if (b[0] & 0x80) b = Buffer.concat([Buffer.from([0x00]), b]);
  return tlv(0x02, b);
}

function encOid(dotted) {
  const parts = dotted.split('.').map(Number);
  const out = [parts[0] * 40 + parts[1]];
  for (const p of parts.slice(2)) {
    if (p < 0x80) { out.push(p); continue; }
    const stack = [];
    let v = p;
    while (v > 0) { stack.unshift(v & 0x7f); v >>= 7; }
    for (let i = 0; i < stack.length - 1; i++) stack[i] |= 0x80;
    out.push(...stack);
  }
  return tlv(0x06, Buffer.from(out));
}

function encOctet(buf) { return tlv(0x04, Buffer.from(buf)); }
function encNull() { return Buffer.from([0x05, 0x00]); }
function encBoolTrue() { return Buffer.from([0x01, 0x01, 0xff]); }
function encSeq(...parts) { return tlv(0x30, Buffer.concat(parts)); }
function encSet(...parts) { return tlv(0x31, Buffer.concat(parts)); }
function encExplicit(n, body) { return tlv(0xa0 | n, body); }

function readTlv(buf, offset) {
  if (offset + 2 > buf.length) throw new Error('DER truncated at offset ' + offset);
  const tag = buf[offset];
  let lenByte = buf[offset + 1];
  let pos = offset + 2;
  let len;
  if (lenByte & 0x80) {
    const count = lenByte & 0x7f;
    if (count === 0 || count > 4) throw new Error('DER indefinite or oversized length');
    len = 0;
    for (let i = 0; i < count; i++) len = (len << 8) | buf[pos++];
  } else {
    len = lenByte;
  }
  if (pos + len > buf.length) throw new Error('DER length overruns buffer');
  const total = (pos - offset) + len;
  return { tag, header: pos - offset, body: buf.slice(pos, pos + len), total, raw: buf.slice(offset, offset + total) };
}

function readSeq(buf, offset) {
  const t = readTlv(buf, offset || 0);
  if (t.tag !== 0x30) throw new Error('DER expected SEQUENCE');
  return t;
}

function children(body) {
  const out = [];
  let pos = 0;
  while (pos < body.length) {
    const t = readTlv(body, pos);
    out.push(t);
    pos += t.total;
  }
  if (pos !== body.length) throw new Error('DER trailing bytes in constructed value');
  return out;
}

function oidToString(body) {
  const bytes = Array.from(body);
  const parts = [Math.floor(bytes[0] / 40), bytes[0] % 40];
  let v = 0;
  for (let i = 1; i < bytes.length; i++) {
    v = (v << 7) | (bytes[i] & 0x7f);
    if (!(bytes[i] & 0x80)) { parts.push(v); v = 0; }
  }
  return parts.join('.');
}

// ── RFC 3161 TimeStampReq ────────────────────────────────────────────
function buildTsaRequest(hashedMessage, nonceBytes) {
  const imprint = encSeq(
    encSeq(encOid(OID_SHA256), encNull()),
    encOctet(hashedMessage)
  );
  const nonce = nonceBytes || crypto.randomBytes(8);
  return encSeq(encIntBytes(Buffer.from([1])), imprint, encIntBytes(nonce), encBoolTrue());
}

function parseTsaRequest(buf) {
  const top = children(readSeq(buf, 0).body);
  if (top.length < 2) throw new Error('TimeStampReq too short');
  if (top[1].tag !== 0x30) throw new Error('TimeStampReq imprint is not a SEQUENCE');
  const imprintParts = children(top[1].body);
  if (imprintParts[0].tag !== 0x30) throw new Error('TimeStampReq algorithm is not a SEQUENCE');
  const algoParts = children(imprintParts[0].body);
  const algo = oidToString(algoParts[0].body);
  const hashedMessage = imprintParts[1].tag === 0x04 ? imprintParts[1].body : null;
  if (!hashedMessage) throw new Error('TimeStampReq imprint is not an OCTET STRING');
  return { hashAlgorithm: algo, hashedMessage };
}

// ── RFC 3161 TimeStampResp (strict parse, honest verify) ─────────────
function parseTsaResponse(buf) {
  const top = children(readSeq(buf, 0).body);
  if (top[0].tag !== 0x30) throw new Error('TimeStampResp status is not a SEQUENCE');
  const statusParts = children(top[0].body);
  let status = null;
  if (statusParts[0].tag === 0x02) {
    status = statusParts[0].body[statusParts[0].body.length - 1];
  }
  if (status === null) throw new Error('TimeStampResp has no status');
  const out = { status, statusOk: status === 0 || status === 1, token: null };
  if (!out.statusOk || top.length < 2) return out;
  if (top[1].tag !== 0x30) throw new Error('Token is not a ContentInfo SEQUENCE');
  const contentInfo = children(top[1].body);
  const contentType = oidToString(contentInfo[0].body);
  if (contentType !== OID_SIGNED_DATA) throw new Error('Token is not SignedData');
  if (contentInfo[1].tag !== 0xa0) throw new Error('SignedData missing [0] wrapper');
  const signedDataNode = children(contentInfo[1].body)[0];
  if (!signedDataNode || signedDataNode.tag !== 0x30) throw new Error('SignedData wrapper is empty');
  const signedData = children(signedDataNode.body);
  const body = signedData[0].tag === 0x02 ? signedData.slice(1) : signedData;
  if (body[1].tag !== 0x30) throw new Error('Encapsulated content is not a SEQUENCE');
  const encap = children(body[1].body);
  if (oidToString(encap[0].body) !== OID_TST_INFO) throw new Error('Encapsulated content is not TSTInfo');
  if (encap[1].tag !== 0xa0) throw new Error('TSTInfo missing [0] wrapper');
  const tstInfoNode = children(encap[1].body)[0];
  if (!tstInfoNode || tstInfoNode.tag !== 0x30) throw new Error('TSTInfo wrapper is empty');
  const tst = children(tstInfoNode.body);
  if (!tst[2] || tst[2].tag !== 0x30) throw new Error('TSTInfo imprint is not a SEQUENCE');
  const tstImprint = children(tst[2].body);
  const tstHash = tstImprint[1].tag === 0x04 ? tstImprint[1].body : null;
  if (!tstHash) throw new Error('TSTInfo imprint is not an OCTET STRING');
  let genTime = null;
  for (const part of tst) {
    if (part.tag === 0x18 || part.tag === 0x17) genTime = part.body.toString('ascii');
  }
  const certsDer = [];
  for (const part of body) {
    if (part.tag === 0xa0) {
      for (const c of children(part.body)) {
        if (c.tag === 0x30) certsDer.push(c.raw);
      }
    }
  }
  out.token = { imprintHash: tstHash, genTime, certCount: certsDer.length, certsDer };
  return out;
}

function verifyTsaImprint(parsed, expectedHash) {
  if (!parsed.token) return { ok: false, reason: 'No token present.' };
  const match = Buffer.from(parsed.token.imprintHash).equals(Buffer.from(expectedHash));
  return match
    ? { ok: true, genTime: parsed.token.genTime }
    : { ok: false, reason: 'Token imprint does not match the anchored hash.' };
}

const FREETSA_URL = 'https://freetsa.org/tsr';

async function tsaSubmit(hashBytes, tsaUrl, timeoutMs) {
  const req = buildTsaRequest(Buffer.from(hashBytes));
  const res = await httpsBinary('POST', tsaUrl || FREETSA_URL, req, 'application/timestamp-query', timeoutMs);
  if (!res.ok) return { ok: false, error: res.error || ('http-' + res.status) };
  let parsed;
  try {
    parsed = parseTsaResponse(res.body);
  } catch (e) {
    return { ok: false, error: 'unparseable-response: ' + String(e.message || e).slice(0, 120) };
  }
  if (!parsed.statusOk) return { ok: false, error: 'TSA refused (status ' + parsed.status + ')' };
  const imprint = verifyTsaImprint(parsed, hashBytes);
  if (!imprint.ok) return { ok: false, error: imprint.reason };
  return {
    ok: true,
    genTime: imprint.genTime,
    tokenB64: res.body.toString('base64'),
    certCount: parsed.token.certCount,
    signerNote: 'Token imprint and status verified. CMS signer-chain validation needs a live interop pass and stays on the roadmap.'
  };
}

// ── P-256 identity keys derived from the master secret ───────────────
function deriveSigningScalar(masterKey) {
  let counter = 0;
  for (;;) {
    const h = crypto.createHmac('sha256', masterKey)
      .update('ghostimprint:rekor:v1:' + counter, 'utf8')
      .digest();
    const scalar = BigInt('0x' + h.toString('hex'));
    if (scalar > 0n && scalar < P256_N) return h;
    counter++;
    if (counter > 1000) throw new Error('Key derivation failed to land in range.');
  }
}

function spkiDerFromUncompressedPoint(point) {
  const prefix = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex');
  return Buffer.concat([prefix, point]);
}

function pkcs8DerFromScalar(scalar) {
  const algId = encSeq(encOid(OID_EC_PUBLIC_KEY), encOid(OID_PRIME256V1));
  const sec1 = encSeq(encIntBytes(Buffer.from([1])), encOctet(scalar));
  return encSeq(encIntBytes(Buffer.from([0])), algId, encOctet(sec1));
}

function privateKeyObject(scalar) {
  return crypto.createPrivateKey({ key: pkcs8DerFromScalar(scalar), format: 'der', type: 'pkcs8' });
}

function publicKeyPem(scalar) {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(scalar);
  const point = ecdh.getPublicKey();
  const spki = spkiDerFromUncompressedPoint(point);
  const b64 = spki.toString('base64');
  const lines = b64.match(/.{1,64}/g) || [];
  return '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----\n';
}

function signBytes(scalar, data) {
  return crypto.sign('sha256', Buffer.from(data), privateKeyObject(scalar));
}

function verifySignature(pem, data, signature) {
  try {
    return crypto.verify('sha256', Buffer.from(data), pem, Buffer.from(signature));
  } catch (_) {
    return false;
  }
}

// ── Minimal HTTPS helpers (GET + POST JSON) ──────────────────────────
function httpsJson(method, urlStr, payload, timeoutMs) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (e) {
      resolve({ ok: false, error: 'invalid-url' });
      return;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      resolve({ ok: false, error: 'unsupported-protocol' });
      return;
    }
    const lib = parsed.protocol === 'https:' ? https : http;
    const body = payload ? Buffer.from(JSON.stringify(payload), 'utf8') : null;
    const req = lib.request(parsed, { method, timeout: timeoutMs || 30000,
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': body.length } : {} },
      (res) => {
        let text = '';
        res.on('data', (c) => { text += c; if (text.length > 2000000) req.destroy(); });
        res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text }));
      });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.on('error', (err) => resolve({ ok: false, error: err.code || 'request-error' }));
    if (body) req.write(body);
    req.end();
  });
}

function httpsBinary(method, urlStr, payload, contentType, timeoutMs) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(urlStr);
    } catch (e) {
      resolve({ ok: false, error: 'invalid-url' });
      return;
    }
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(parsed, { method, timeout: timeoutMs || 30000,
      headers: { 'Content-Type': contentType, 'Content-Length': payload.length } },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: Buffer.concat(chunks) }));
      });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.on('error', (err) => resolve({ ok: false, error: err.code || 'request-error' }));
    req.write(payload);
    req.end();
  });
}

// ── Rekor v1 hashedRekord witness ────────────────────────────────────
const REKOR_BASE = 'https://rekor.sigstore.dev';

async function rekorSubmit(hashHex, signatureDer, publicKeyPem, baseUrl) {
  const payload = {
    apiVersion: '0.0.1',
    kind: 'hashedRekord',
    spec: {
      data: { hash: { algorithm: 'sha256', value: hashHex } },
      signature: {
        content: Buffer.from(signatureDer).toString('base64'),
        publicKey: { content: Buffer.from(publicKeyPem, 'utf8').toString('base64') }
      }
    }
  };
  const res = await httpsJson('POST', (baseUrl || REKOR_BASE) + '/api/v1/log/entries', payload);
  if (!res.ok) return { ok: false, error: res.error || ('http-' + res.status) };
  let entry;
  try {
    entry = JSON.parse(res.text);
  } catch (_) {
    return { ok: false, error: 'unparseable-response' };
  }
  const uuid = Object.keys(entry)[0];
  return { ok: true, uuid, entry: entry[uuid] };
}

async function rekorFetch(uuid, baseUrl) {
  const res = await httpsJson('GET', (baseUrl || REKOR_BASE) + '/api/v1/log/entries/' + uuid);
  if (!res.ok) return { ok: false, error: res.error || ('http-' + res.status) };
  let body;
  try {
    body = JSON.parse(res.text);
  } catch (_) {
    return { ok: false, error: 'unparseable-response' };
  }
  return { ok: true, entry: body[uuid] || body };
}

function rfc6962Leaf(dataBytes) {
  return crypto.createHash('sha256').update(Buffer.concat([Buffer.from([0x00]), Buffer.from(dataBytes)])).digest();
}

function rfc6962Node(left, right) {
  return crypto.createHash('sha256').update(Buffer.concat([Buffer.from([0x01]), Buffer.from(left), Buffer.from(right)])).digest();
}

function verifyMerkleInclusion(leafHash, index, proofHashesHex, treeSize, expectedRootHex) {
  try {
    let hash = Buffer.from(leafHash);
    let idx = index;
    let size = treeSize;
    for (const h of proofHashesHex) {
      const sibling = Buffer.from(h, 'hex');
      if (idx % 2 === 1 || idx === size - 1) {
        hash = rfc6962Node(sibling, hash);
      } else {
        hash = rfc6962Node(hash, sibling);
      }
      idx = Math.floor(idx / 2);
      size = Math.ceil(size / 2);
    }
    return { ok: hash.equals(Buffer.from(expectedRootHex, 'hex')) };
  } catch (e) {
    return { ok: false, error: String(e.message || e).slice(0, 120) };
  }
}

function verifyRekorEntry(entry, expectedHashHex, publicKeyPem) {
  const problems = [];
  const body = entry.body || {};
  const spec = body.spec || {};
  const dataHash = spec.data && spec.data.hash ? spec.data.hash.value : null;
  if (!dataHash || String(dataHash).toLowerCase() !== String(expectedHashHex).toLowerCase()) {
    problems.push('entry data hash does not match the anchored hash');
  }
  const sigB64 = spec.signature ? spec.signature.content : null;
  let sigOk = false;
  if (sigB64 && publicKeyPem) {
    try {
      sigOk = verifySignature(publicKeyPem, Buffer.from(expectedHashHex, 'hex'), Buffer.from(sigB64, 'base64'));
    } catch (_) {
      sigOk = false;
    }
    if (!sigOk) problems.push('entry signature does not verify against the recorded public key');
  } else {
    problems.push('entry carries no verifiable signature');
  }
  const integratedTime = entry.integratedTime !== undefined ? Number(entry.integratedTime)
    : (entry.verification && entry.verification.integratedTime !== undefined ? Number(entry.verification.integratedTime) : NaN);
  if (!Number.isFinite(integratedTime)) problems.push('entry carries no server timestamp');
  let inclusion = { status: 'UNVERIFIED', reason: 'No inclusion proof present.' };
  const proof = entry.verification ? entry.verification.inclusionProof : null;
  if (proof && Array.isArray(proof.hashes) && proof.rootHash) {
    inclusion = {
      status: 'PRESENT-BUT-ROOT-UNCONFIRMED',
      reason: 'Proof chain math is implemented, but the leaf canonicalization has not been interop-tested against a live log. Verify the root out of band until then.',
      logIndex: proof.logIndex,
      treeSize: proof.treeSize,
      rootHash: proof.rootHash
    };
  }
  return {
    hashMatch: problems.length === 0 || !problems.some(p => p.includes('data hash')),
    signatureValid: sigOk,
    integratedTime: Number.isFinite(integratedTime) ? integratedTime : null,
    inclusion,
    problems
  };
}

module.exports = {
  OID_SHA256,
  encOid,
  oidToString,
  readTlv,
  children,
  buildTsaRequest,
  parseTsaRequest,
  parseTsaResponse,
  verifyTsaImprint,
  FREETSA_URL,
  tsaSubmit,
  deriveSigningScalar,
  publicKeyPem,
  signBytes,
  verifySignature,
  httpsJson,
  httpsBinary,
  REKOR_BASE,
  rekorSubmit,
  rekorFetch,
  rfc6962Leaf,
  rfc6962Node,
  verifyMerkleInclusion,
  verifyRekorEntry
};
