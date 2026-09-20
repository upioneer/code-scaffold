#!/usr/bin/env node
/**
 * Playwright workflows maintained selftest.
 * Exercises the declarative dispatcher contract without launching a browser:
 * variable substitution, workflow planning, method allowlist, record blocks.
 */

const assert = require('assert');
const runner = require('../workflows/run.cjs');

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('ok: ' + name);
}

check('substitute resolves ${base}', () => {
  assert.strictEqual(runner.substitute('go ${base}/x', { base: 'http://localhost:3000' }), 'go http://localhost:3000/x');
});

check('substitute resolves ${env.VAR}', () => {
  process.env.PW_SELFTEST_URL = 'https://example.com';
  assert.strictEqual(runner.substitute('${env.PW_SELFTEST_URL}/login', {}), 'https://example.com/login');
  delete process.env.PW_SELFTEST_URL;
});

check('substitute throws on missing ${base}', () => {
  assert.throws(() => runner.substitute('${base}/x', {}), /--base/);
});

check('substitute throws on missing env var', () => {
  assert.throws(() => runner.substitute('${env.PW_SELFTEST_DEFINITELY_UNSET}/x', {}), /not set/);
});

const goodWorkflow = {
  name: 'Smoke',
  jobs: {
    load: {
      record: { dir: './rec', gif: './demo.gif' },
      steps: [
        { name: 'Launch', model: 'browser/playwright', method: 'launch', args: { headless: true } },
        { name: 'Go', model: 'browser/playwright', method: 'goto', args: { url: 'http://localhost:3000' } },
        { name: 'Shot', model: 'browser/playwright', method: 'screenshot', args: { path: './shot.png', fullPage: true } }
      ]
    }
  }
};

check('valid workflow plans with record block', () => {
  const planned = runner.planWorkflow(goodWorkflow);
  assert.strictEqual(planned.jobs.length, 1);
  assert.deepStrictEqual(planned.jobs[0].record, { dir: './rec', gif: './demo.gif' });
  assert.strictEqual(planned.jobs[0].steps.length, 3);
});

check('unknown method is rejected', () => {
  const bad = JSON.parse(JSON.stringify(goodWorkflow));
  bad.jobs.load.steps.push({ model: 'browser/playwright', method: 'recordVideo', args: {} });
  assert.throws(() => runner.planWorkflow(bad), /unsupported method/);
});

check('non-playwright model is rejected', () => {
  const bad = JSON.parse(JSON.stringify(goodWorkflow));
  bad.jobs.load.steps[0].model = 'browser/other';
  assert.throws(() => runner.planWorkflow(bad), /unsupported model/);
});

check('record block without dir is rejected', () => {
  const bad = JSON.parse(JSON.stringify(goodWorkflow));
  bad.jobs.load.record = { gif: './demo.gif' };
  assert.throws(() => runner.planWorkflow(bad), /needs a "dir"/);
});

check('job without steps is rejected', () => {
  assert.throws(() => runner.planWorkflow({ jobs: { empty: {} } }), /steps/);
});

check('workflow without jobs is rejected', () => {
  assert.throws(() => runner.planWorkflow({ name: 'x' }), /jobs/);
});

console.log('selftest: ' + passed + ' checks passed');
