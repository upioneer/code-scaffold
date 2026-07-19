const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
const skillDir = 'C:\\Users\\hgran\\OneDrive\\Documents\\code\\Projects\\Code Scaffold\\.skills\\playwright';
const testScript = path.join(__dirname, 'test-tldraw.js');

console.log('Watching App.tsx for changes...');

let isRunning = false;
let pendingRun = false;

function runTest() {
  if (isRunning) {
    pendingRun = true;
    return;
  }
  
  isRunning = true;
  console.log('\n--- Running Playwright Test ---');
  try {
    const output = execSync(`node run.js "${testScript}"`, { cwd: skillDir, encoding: 'utf-8', stdio: 'pipe' });
    console.log(output);
    console.log('✅ TEST PASSED');
  } catch (err) {
    console.error('❌ TEST FAILED');
    console.error(err.stdout ? err.stdout : err.message);
  } finally {
    isRunning = false;
    if (pendingRun) {
      pendingRun = false;
      setTimeout(runTest, 1000);
    }
  }
}

// Run initially
runTest();

// Watch for changes
let debounce;
fs.watch(appTsxPath, (eventType) => {
  if (eventType === 'change') {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log('\nFile changed. Triggering test...');
      runTest();
    }, 500);
  }
});
