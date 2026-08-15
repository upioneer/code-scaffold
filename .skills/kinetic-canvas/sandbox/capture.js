const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });
    
    const dir = 'C:/Users/hgran/OneDrive/Documents/code/Projects/Code Scaffold/.skills/kinetic-canvas/sandbox';
    const assetsDir = path.join(dir, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
    
    const files = fs.readdirSync(dir).filter(f => f.startsWith('demo-') && f.endsWith('.html'));
    
    for (const file of files) {
        console.log('Capturing ' + file + '...');
        await page.goto('file:///' + path.join(dir, file).replace(/\\/g, '/'));
        await page.waitForTimeout(1000); // let shader compile and render
        
        // Hide the overlay text
        await page.evaluate(() => {
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.style.display = 'none';
        });
        
        await page.screenshot({ path: path.join(assetsDir, file.replace('.html', '.jpg')), type: 'jpeg', quality: 80 });
    }
    
    await browser.close();
    console.log('Done!');
})();
