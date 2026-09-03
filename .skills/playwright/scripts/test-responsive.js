#!/usr/bin/env node
/**
 * Automated Responsive Viewport & Mobile Checker
 * Tests target URL across standard Mobile (iPhone, Pixel), Tablet, and Desktop viewports.
 * 
 * Usage:
 *   node test-responsive.js <url> [--screenshot-dir <dir>]
 */

const path = require('path');
const { chromium } = require('playwright');
const { testResponsiveViewports, STANDARD_VIEWPORTS } = require('../lib/helpers');

async function main() {
  const args = process.argv.slice(2);
  let rawTarget = args.find(a => !a.startsWith('--')) || 'http://localhost:3000';
  const screenshotIdx = args.indexOf('--screenshot-dir');
  const screenshotDir = screenshotIdx !== -1 ? args[screenshotIdx + 1] : null;

  let url = rawTarget;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
    const absPath = path.resolve(process.cwd(), rawTarget);
    url = `file://${absPath.replace(/\\/g, '/')}`;
  }

  console.log(`🔍 Testing Responsive Viewports for: ${url}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const results = await testResponsiveViewports(page, url, { screenshotDir });

    console.log('\n================ RESPONSIVE VIEWPORT RESULTS ================');
    let allPassed = true;

    for (const res of results) {
      const status = res.passed ? '✅ PASS' : '❌ FAIL (Horizontal Overflow Detected)';
      console.log(`[${res.viewport} - ${res.width}x${res.height}]: ${status}`);
      if (res.screenshotPath) {
        console.log(`   Screenshot: ${res.screenshotPath}`);
      }
      if (!res.passed) {
        allPassed = false;
      }
    }
    console.log('==============================================================\n');

    if (!allPassed) {
      console.error('❌ Mobile Viewport Verification Failed: Layout overflow detected on one or more screen sizes.');
      process.exit(1);
    } else {
      console.log('✅ All viewports passed! Site is fully mobile-first responsive.');
    }
  } catch (err) {
    console.error(`Responsive Test Failed: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main();
}
