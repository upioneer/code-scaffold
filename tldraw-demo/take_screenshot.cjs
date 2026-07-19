const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // wait for tldraw to render
    const dest = path.resolve(__dirname, '..', 'project_details', 'history', 'v7.5.0', 'tldraw_demo.png');
    await page.screenshot({ path: dest, fullPage: true });
    await browser.close();
    console.log('Screenshot saved to', dest);
  } catch (err) {
    console.error('Screenshot failed:', err);
  }
})();
