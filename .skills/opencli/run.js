/**
 * OpenCLI Universal Executor
 * Handles dependency checks and command execution for the OpenCLI skill.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setup() {
  console.log('Checking OpenCLI dependencies...');
  try {
    execSync('npx --version', { stdio: 'ignore' });
  } catch (e) {
    throw new Error('npx is required to run OpenCLI.');
  }
}

async function execute(args = []) {
  await setup();

  const command = 'npx';
  const fullArgs = ['-y', '@jackwener/opencli', ...args];

  console.log(`Executing: opencli ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(command, fullArgs, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`OpenCLI exited with code ${code}`));
      }
    });
  });
}

// Handle direct execution via CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // If no args and stdin is provided, read from stdin
  if (args.length === 0 && !process.stdin.isTTY) {
    let input = '';
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      const stdinArgs = input.trim().split(/\s+/).filter(Boolean);
      execute(stdinArgs).catch(err => {
        console.error(err.message);
        process.exit(1);
      });
    });
  } else {
    execute(args).catch(err => {
      console.error(err.message);
      process.exit(1);
    });
  }
}

module.exports = { execute };
