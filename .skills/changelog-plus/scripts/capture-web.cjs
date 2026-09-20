#!/usr/bin/env node
/**
 * Changelog Plus web application capture.
 * Drives the Playwright skill (bundled module plus shared helpers) through a
 * declarative route manifest, producing the canonical changelog asset contract:
 * demo.gif plus demo_splash.png, demo_main.png, demo_final.png.
 *
 * Usage:
 *   node capture-web.cjs --routes-file templates/routes.example.json --out project_details/changelog/v1.2.3
 *   node capture-web.cjs --routes-file routes.json --out <dir> --base http://localhost:3000 --viewports both
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const lib = require('./capture-lib.cjs');

const PLAYWRIGHT_SKILL = path.join(__dirname, '..', '..', 'playwright');

function loadPlaywright() {
  try {
    return { helpers: require(path.join(PLAYWRIGHT_SKILL, 'lib', 'helpers.js')) };
  } catch (e) {
    throw new Error('Playwright skill helpers not found. Install the Playwright skill (.skills/playwright) with its node_modules first.');
  }
}

function parseArgs(argv) {
  const args = { viewports: 'desktop' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--routes-file') args.routesFile = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--base') args.base = argv[++i];
    else if (a === '--viewports') args.viewports = argv[++i];
    else if (a === '--storage-state') args.storageState = argv[++i];
  }
  if (!args.routesFile) throw new Error('Missing required --routes-file <manifest.json>.');
  if (!args.out) throw new Error('Missing required --out <changelog version dir>.');
  if (!['desktop', 'mobile', 'both'].includes(args.viewports)) {
    throw new Error('--viewports must be desktop, mobile, or both.');
  }
  return args;
}

function ensureWritableTemp() {
  try {
    const probe = fs.mkdtempSync(path.join(os.tmpdir(), 'clpw-'));
    fs.rmSync(probe, { recursive: true, force: true });
  } catch (e) {
    const alt = path.join(process.cwd(), '.tmp-capture-web');
    fs.mkdirSync(alt, { recursive: true });
    process.env.TEMP = alt;
    process.env.TMP = alt;
    process.env.TMPDIR = alt;
    console.log('Default temp is not writable; redirected browser artifacts to ' + alt);
  }
}

function checkFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (r.status !== 0 || r.error) {
    throw new Error('ffmpeg not found on PATH. Install it: web capture converts the run recording to demo.gif with ffmpeg.');
  }
}

async function resolveBase(explicit, helpers) {
  if (explicit) return explicit;
  const servers = await helpers.detectDevServers();
  if (servers.length === 1) {
    console.log('Auto-detected dev server: ' + servers[0]);
    return servers[0];
  }
  if (servers.length > 1) {
    throw new Error('Multiple dev servers detected (' + servers.join(', ') + '). Pass --base to select one.');
  }
  throw new Error('No dev server detected and no --base given. Start the app or pass --base <url>.');
}

function joinUrl(base, routeUrl) {
  if (/^(https?|file|data):/i.test(routeUrl)) return routeUrl;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const r = routeUrl.startsWith('/') ? routeUrl : '/' + routeUrl;
  return b + r;
}

async function runActions(page, actions) {
  for (const act of actions || []) {
    if (act.type === 'click') await page.click(act.selector, { timeout: 15000 });
    else if (act.type === 'fill') await page.fill(act.selector, act.value || '', { timeout: 15000 });
    else if (act.type === 'wait-ms') await page.waitForTimeout(act.ms || 1000);
    else if (act.type === 'wait-url') await page.waitForURL(act.value, { timeout: 20000 });
    else throw new Error('Unknown action type: ' + act.type);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { helpers } = loadPlaywright();
  ensureWritableTemp();
  checkFfmpeg();

  const manifest = JSON.parse(fs.readFileSync(args.routesFile, 'utf8'));
  lib.validateRoutes(manifest);
  const needsBase = manifest.routes.some((r) => !/^(https?|file|data):/i.test(r.url));
  const base = needsBase ? await resolveBase(args.base, helpers) : '';

  fs.mkdirSync(args.out, { recursive: true });
  const videoDir = path.join(args.out, '.video');
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await helpers.launchBrowser('chromium', { headless: true });
  let videoPath = null;
  try {
    const contextOpts = {
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } }
    };
    if (args.storageState) contextOpts.storageState = args.storageState;
    const context = await browser.newContext(contextOpts);
    const page = await context.newPage();
    try {
      for (const route of manifest.routes) {
        const url = joinUrl(base, route.url);
        console.log('Capturing [' + route.slot + '] ' + url);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await helpers.waitForPageReady(page);
        await runActions(page, route.actions);
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(args.out, 'demo_' + route.slot + '.png'), fullPage: true });
      }
      if (args.viewports !== 'desktop') {
        const mainRoute = manifest.routes.find((r) => r.slot === 'main');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(joinUrl(base, mainRoute.url), { waitUntil: 'networkidle', timeout: 30000 });
        await helpers.waitForPageReady(page);
        await page.screenshot({ path: path.join(args.out, 'demo_main_mobile.png'), fullPage: true });
        console.log('Mobile proof captured: demo_main_mobile.png');
      }
    } finally {
      const video = page.video();
      await context.close();
      if (video) videoPath = await video.path();
    }
  } finally {
    await browser.close();
  }

  const gifPath = path.join(args.out, 'demo.gif');
  if (videoPath && fs.existsSync(videoPath)) {
    const conv = spawnSync('ffmpeg', ['-y', '-i', videoPath, '-vf', 'fps=10,scale=1200:-1', gifPath], { stdio: 'inherit' });
    if (conv.status !== 0) throw new Error('ffmpeg video to gif conversion failed.');
  } else {
    console.log('No run recording found; building demo.gif as a still slideshow fallback.');
    const shots = ['demo_splash.png', 'demo_main.png', 'demo_final.png'].map((f) => path.join(args.out, f));
    const conv = spawnSync('ffmpeg', ['-y', '-framerate', '1', '-i', shots[0], '-i', shots[1], '-i', shots[2],
      '-filter_complex', '[0][1][2]concat=n=3:v=1:a=0', gifPath], { stdio: 'inherit' });
    if (conv.status !== 0) throw new Error('ffmpeg slideshow fallback failed.');
  }
  fs.rmSync(videoDir, { recursive: true, force: true });

  const files = fs.readdirSync(args.out);
  lib.assertAssets(files);
  console.log('Web capture complete in ' + args.out);
}

main().catch((e) => { console.error('Web capture failed: ' + e.message); process.exit(1); });
