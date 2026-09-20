#!/usr/bin/env node
/**
 * Changelog Plus maintained selftest.
 * Exercises the pure capture contract logic without launching a browser:
 * directory resolution order, route manifest validation, asset gate.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./capture-lib.cjs');

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('ok: ' + name);
}

function makeTempRoot() {
  try {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'clp-selftest-'));
  } catch (e) {
    const alt = path.join(process.cwd(), '.tmp-selftest');
    fs.mkdirSync(alt, { recursive: true });
    return fs.mkdtempSync(path.join(alt, 'clp-selftest-'));
  }
}
const tmpRoot = makeTempRoot();
const defRoot = lib.defaultRoot(tmpRoot);
fs.mkdirSync(defRoot, { recursive: true });

check('default root resolves under project_details/changelog', () => {
  assert.strictEqual(lib.defaultRoot('/proj'), path.join('/proj', 'project_details', 'changelog'));
});

check('explicit root wins over everything', () => {
  process.env.CHANGELOG_DIR = '/from-env';
  fs.writeFileSync(path.join(defRoot, '.changelog-dir'), '/from-file\n');
  assert.strictEqual(lib.resolveChangelogRoot(tmpRoot, { explicit: '/from-param' }), '/from-param');
});

check('env beats persisted file', () => {
  assert.strictEqual(lib.resolveChangelogRoot(tmpRoot, {}), '/from-env');
});

check('persisted file beats default', () => {
  delete process.env.CHANGELOG_DIR;
  assert.strictEqual(lib.resolveChangelogRoot(tmpRoot, {}), '/from-file');
});

check('default when nothing configured', () => {
  fs.rmSync(path.join(defRoot, '.changelog-dir'));
  assert.strictEqual(lib.resolveChangelogRoot(tmpRoot, {}), defRoot);
});

const goodManifest = {
  routes: [
    { slot: 'splash', url: '/' },
    { slot: 'main', url: '/app' },
    { slot: 'final', url: '/done' }
  ]
};

check('valid route manifest passes', () => {
  assert.strictEqual(lib.validateRoutes(goodManifest), true);
});

check('manifest missing final slot throws', () => {
  assert.throws(() => lib.validateRoutes({ routes: goodManifest.routes.slice(0, 2) }), /final/);
});

check('manifest with no routes throws', () => {
  assert.throws(() => lib.validateRoutes({}), /routes/);
});

check('full asset set passes the gate', () => {
  assert.strictEqual(lib.assertAssets(['demo.gif', 'demo_splash.png', 'demo_main.png', 'demo_final.png', 'readme.md']), true);
});

check('missing demo.gif fails the gate', () => {
  assert.throws(() => lib.assertAssets(['demo_splash.png', 'demo_main.png', 'demo_final.png']), /demo\.gif/);
});

fs.rmSync(tmpRoot, { recursive: true, force: true });
fs.rmSync(path.join(process.cwd(), '.tmp-selftest'), { recursive: true, force: true });
console.log('selftest: ' + passed + ' checks passed');
