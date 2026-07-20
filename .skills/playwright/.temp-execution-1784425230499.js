const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  
  let hasErrors = false;

  page.on('pageerror', exception => {
    console.error(`Uncaught exception: "${exception}"`);
    hasErrors = true;
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Console error: "${msg.text()}"`);
      hasErrors = true;
    }
  });

  try {
    console.log('Navigating to http://localhost:5174/');
    await page.goto('http://localhost:5174/');
    
    // Wait for the tldraw canvas to load and the button to be visible
    console.log('Waiting for button...');
    await page.waitForSelector('button', { timeout: 10000 });
    
    // Hover and click to trigger selection indicators
    console.log('Hovering over chart...');
    await page.mouse.move(300, 250);
    await page.mouse.click(300, 250);
    await page.waitForTimeout(500);

    console.log('Hovering over iframe...');
    await page.mouse.move(850, 300);
    await page.mouse.click(850, 300);
    await page.waitForTimeout(500);
    
    console.log('Clicking the gravity button...');
    await page.click('button');

    // Wait a few seconds to see if physics causes crashes
    console.log('Waiting 3 seconds for physics to simulate...');
    await page.waitForTimeout(3000);
    
    if (hasErrors) {
      console.error('❌ Test failed due to page errors.');
    } else {
      console.log('✅ Test passed successfully without errors!');
    }
  } catch (err) {
    console.error('❌ Automation error:', err);
  } finally {
    await browser.close();
  }
})();
