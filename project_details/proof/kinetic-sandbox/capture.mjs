import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Give the shaders a moment to compile and render
  await page.waitForTimeout(3000);

  const assetsDir = path.resolve('../../../.skills/kinetic-canvas/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const sections = [
    'kinetic-blaze', 'kinetic-frost', 'kinetic-cipher', 'kinetic-liquid-glass',
    'kinetic-fluid', 'thermal-aura', 'crystalline-vapor', 
    'kinetic-mesh', 'orbital-particles', 'quantum-plasma', 
    'volumetric-light', 'vapor-ring', 'cellular-voronoi', 
    'caustic-displacement', 'ribbed-glass-mask', 
    'retro-halftone', 'organic-pulp'
  ];

  for (let i = 0; i < sections.length; i++) {
    const id = sections[i];
    
    // Scroll to the specific section
    await page.evaluate((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView();
      }
    }, id);
    
    // Add mouse movement just in case the shader reacts to it
    await page.mouse.move(640, 400);
    await page.mouse.move(700, 450, { steps: 5 });
    await page.mouse.move(500, 300, { steps: 5 });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(assetsDir, `${id}.png`) });
    console.log(`Captured ${id}.png`);
  }

  await browser.close();
})();
