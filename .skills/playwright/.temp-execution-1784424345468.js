const { chromium } = require('playwright');
const path = require('path');

const TARGET_URL = 'http://localhost:5174';

(async () => {
  const browser = await chromium.launch({ headless: true }); // headless because we only need the screenshot
  const page = await browser.newPage();

  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // wait for tldraw to render fully

  const dest = path.resolve('C:\\Users\\hgran\\OneDrive\\Documents\\code\\Projects\\Code Scaffold\\project_details\\history\\v7.5.0\\demo_splash.png');
  await page.screenshot({ path: dest, fullPage: true });
  console.log('📸 Screenshot saved to ' + dest);

  await browser.close();
})();
