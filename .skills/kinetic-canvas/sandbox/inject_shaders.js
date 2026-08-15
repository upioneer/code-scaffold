const fs = require('fs');
const path = require('path');

const mappings = [
    { component: 'KineticFluid.tsx', demo: 'demo-kineticfluid.html' },
    { component: 'CrystallineVapor.tsx', demo: 'demo-crystallinevapor.html' },
    { component: 'RibbedGlassMask.tsx', demo: 'demo-ribbedglass.html' },
    { component: 'OrbitalParticles.tsx', demo: 'demo-orbitalparticles.html' },
    { component: 'QuantumPlasma.tsx', demo: 'demo-quantumplasma.html' },
    { component: 'VolumetricLight.tsx', demo: 'demo-volumetriclight.html' },
    { component: 'VaporRing.tsx', demo: 'demo-vaporring.html' },
    { component: 'CellularVoronoi.tsx', demo: 'demo-cellularvoronoi.html' },
    { component: 'RetroHalftone.tsx', demo: 'demo-retrohalftone.html' },
    { component: 'OrganicPulp.tsx', demo: 'demo-organicpulp.html' }
];

const compDir = path.join(__dirname, '../components');
const demoDir = __dirname;

for (const map of mappings) {
    const compPath = path.join(compDir, map.component);
    const demoPath = path.join(demoDir, map.demo);
    
    if (fs.existsSync(compPath) && fs.existsSync(demoPath)) {
        const compCode = fs.readFileSync(compPath, 'utf8');
        
        // Extract fragmentShaderSource block
        const match = compCode.match(/const fragmentShaderSource = `([\s\S]*?)`;/);
        if (match) {
            let fsCode = match[1].trim();
            // Optional: Escape backticks or dollar signs if needed, but in our case it's mostly plain GLSL
            fsCode = fsCode.replace(/\\/g, '\\\\').replace(/\$/g, '$$$$');
            
            let demoHtml = fs.readFileSync(demoPath, 'utf8');
            // Find the const fs = `...`; line in the HTML and replace it
            demoHtml = demoHtml.replace(/const fs = `[\s\S]*?`;/, 'const fs = `\\n' + fsCode + '\\n`;');
            
            fs.writeFileSync(demoPath, demoHtml);
            console.log('Injected real shader into ' + map.demo);
        } else {
            console.log('Could not find fragment shader in ' + map.component);
        }
    }
}
