#!/usr/bin/env node
/**
 * Playwright declarative workflow runner.
 * Executes rigid YAML workflows against a strict method allowlist: no step can
 * run anything except a declared browser action with declared arguments.
 * Arbitrary JavaScript is never evaluated.
 *
 * Job-level recording: a job may declare `record: {dir, gif}` to capture the
 * full run on video and optionally convert it to a gif with ffmpeg.
 *
 * Usage:
 *   node workflows/run.cjs --workflow workflows/test-page.yaml
 *   node workflows/run.cjs --workflow capture.yaml --base http://localhost:3000
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');
const helpers = require('../lib/helpers.js');

const PLAYWRIGHT_MODEL = 'browser/playwright';
const METHODS = ['launch', 'goto', 'fill', 'click', 'screenshot', 'waitForURL', 'wait-ms', 'audit_links'];

function substitute(node, vars) {
  if (typeof node === 'string') {
    return node.replace(/\$\{(env\.[A-Za-z_][A-Za-z0-9_]*|base)\}/g, (m, key) => {
      if (key === 'base') {
        if (!vars.base) throw new Error('Workflow uses ${base} but no --base given and no single dev server detected.');
        return vars.base;
      }
      const name = key.slice(4);
      if (process.env[name] === undefined) throw new Error('Workflow needs environment variable ' + name + ' but it is not set.');
      return process.env[name];
    });
  }
  if (Array.isArray(node)) return node.map((v) => substitute(v, vars));
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = substitute(node[k], vars);
    return out;
  }
  return node;
}

function planWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object') throw new Error('Workflow must be a YAML mapping.');
  if (!workflow.jobs || typeof workflow.jobs !== 'object') throw new Error('Workflow must declare a "jobs" mapping.');
  const jobs = [];
  for (const jobName of Object.keys(workflow.jobs)) {
    const job = workflow.jobs[jobName] || {};
    if (!Array.isArray(job.steps)) throw new Error('Job "' + jobName + '" must declare a "steps" array.');
    const steps = job.steps.map((step, idx) => {
      if (!step || typeof step !== 'object') throw new Error('Job "' + jobName + '" step ' + idx + ' must be a mapping.');
      if (step.model !== PLAYWRIGHT_MODEL) {
        throw new Error('Job "' + jobName + '" step ' + idx + ': unsupported model "' + step.model + '". Only "browser/playwright" is allowed.');
      }
      if (!METHODS.includes(step.method)) {
        throw new Error('Job "' + jobName + '" step ' + idx + ': unsupported method "' + step.method + '". Allowed: ' + METHODS.join(', ') + '.');
      }
      return { name: step.name || step.method, model: step.model, method: step.method, args: step.args || {} };
    });
    let record = null;
    if (job.record) {
      if (!job.record.dir) throw new Error('Job "' + jobName + '" record block needs a "dir".');
      record = { dir: job.record.dir, gif: job.record.gif || null };
    }
    jobs.push({ name: jobName, record, steps });
  }
  return { name: workflow.name || 'workflow', jobs };
}

function ensureWritableTemp() {
  try {
    const probe = fs.mkdtempSync(path.join(os.tmpdir(), 'pwf-'));
    fs.rmSync(probe, { recursive: true, force: true });
  } catch (e) {
    const alt = path.join(process.cwd(), '.tmp-workflows');
    fs.mkdirSync(alt, { recursive: true });
    process.env.TEMP = alt;
    process.env.TMP = alt;
    process.env.TMPDIR = alt;
  }
}

async function checkLink(url, timeoutMs) {
  const lib = url.startsWith('https:') ? require('https') : require('http');
  return new Promise((resolve) => {
    const req = lib.request(url, { method: 'HEAD', timeout: timeoutMs }, (res) => {
      resolve({ url, status: res.statusCode, dead: res.statusCode >= 400 });
    });
    req.on('error', (e) => resolve({ url, status: 0, dead: true, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, dead: true, error: 'timeout' }); });
    req.end();
  });
}

async function runAuditLinks(page, args) {
  const selector = args.selector || 'a[href]';
  const hrefs = await page.$$eval(selector, (els) => els.map((el) => el.href).filter((h) => /^https?:\/\//i.test(h)));
  const unique = [...new Set(hrefs)];
  console.log('Auditing ' + unique.length + ' links...');
  const results = [];
  for (const url of unique) {
    results.push(await checkLink(url, 8000));
  }
  const dead = results.filter((r) => r.dead);
  for (const r of dead) console.log('  dead: ' + r.url + ' (' + (r.status || r.error) + ')');
  console.log('Link audit: ' + (results.length - dead.length) + ' alive, ' + dead.length + ' dead.');
  if (args.fail_on_404 && dead.length > 0) {
    throw new Error('Link audit failed with ' + dead.length + ' dead links.');
  }
  return results;
}

async function runStep(page, step) {
  const a = step.args;
  console.log('  step: ' + (step.name || step.method));
  switch (step.method) {
    case 'launch':
      return null;
    case 'goto':
      if (!a.url) throw new Error('goto needs args.url.');
      await page.goto(a.url, { waitUntil: 'networkidle', timeout: a.timeout || 30000 });
      await helpers.waitForPageReady(page);
      return null;
    case 'fill':
      if (!a.selector || a.value === undefined) throw new Error('fill needs args.selector and args.value.');
      await page.fill(a.selector, String(a.value), { timeout: a.timeout || 15000 });
      return null;
    case 'click':
      if (!a.selector) throw new Error('click needs args.selector.');
      await page.click(a.selector, { timeout: a.timeout || 15000 });
      return null;
    case 'screenshot':
      if (!a.path) throw new Error('screenshot needs args.path.');
      await page.screenshot({ path: a.path, fullPage: a.fullPage !== false });
      return { screenshot: a.path };
    case 'waitForURL':
      if (!a.url) throw new Error('waitForURL needs args.url.');
      await page.waitForURL(a.url, { timeout: a.timeout || 20000 });
      return null;
    case 'wait-ms':
      await page.waitForTimeout(a.ms || 1000);
      return null;
    case 'audit_links':
      return { audit: await runAuditLinks(page, a) };
    default:
      throw new Error('Unsupported method "' + step.method + '".');
  }
}

function convertGif(videoPath, gifPath) {
  const conv = spawnSync('ffmpeg', ['-y', '-i', videoPath, '-vf', 'fps=10,scale=1200:-1', gifPath], { stdio: 'inherit' });
  if (conv.status !== 0 || conv.error) throw new Error('ffmpeg video to gif conversion failed.');
}

async function runJob(job) {
  console.log('job: ' + job.name);
  const launchStep = job.steps.find((s) => s.method === 'launch');
  const launchArgs = (launchStep && launchStep.args) || {};
  const browser = await helpers.launchBrowser(launchArgs.browserType || 'chromium', {
    headless: launchArgs.headless !== undefined ? launchArgs.headless : true
  });
  const videoDir = job.record ? path.resolve(job.record.dir) : null;
  if (videoDir) fs.mkdirSync(videoDir, { recursive: true });
  try {
    const contextOpts = { viewport: { width: 1280, height: 800 } };
    if (videoDir) contextOpts.recordVideo = { dir: videoDir, size: { width: 1280, height: 800 } };
    const context = await browser.newContext(contextOpts);
    const page = await context.newPage();
    let videoPath = null;
    try {
      for (const step of job.steps) {
        await runStep(page, step);
      }
    } finally {
      const video = page.video();
      await context.close();
      if (video) videoPath = await video.path();
    }
    if (job.record && job.record.gif) {
      if (!videoPath || !fs.existsSync(videoPath)) {
        throw new Error('Job "' + job.name + '" declared record.gif but no recording was produced.');
      }
      convertGif(videoPath, path.resolve(job.record.gif));
      console.log('Recording saved: ' + path.resolve(job.record.gif));
    } else if (videoPath) {
      console.log('Recording saved: ' + videoPath);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let workflowFile = null;
  let base = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--workflow') workflowFile = argv[++i];
    else if (argv[i] === '--base') base = argv[++i];
  }
  if (!workflowFile) throw new Error('Missing required --workflow <file.yaml>.');
  ensureWritableTemp();

  const raw = yaml.load(fs.readFileSync(workflowFile, 'utf8'));
  if (!base) {
    const servers = await helpers.detectDevServers();
    if (servers.length === 1) {
      base = servers[0];
      console.log('Auto-detected dev server: ' + base);
    }
  }
  const planned = planWorkflow(substitute(raw, { base }));
  console.log('workflow: ' + planned.name + ' (' + planned.jobs.length + ' jobs)');
  for (const job of planned.jobs) {
    await runJob(job);
  }
  console.log('Workflow complete.');
}

if (require.main === module) {
  main().catch((e) => { console.error('Workflow failed: ' + e.message); process.exit(1); });
}

module.exports = { METHODS, PLAYWRIGHT_MODEL, substitute, planWorkflow };
