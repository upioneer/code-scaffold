const fs = require('fs');
const path = require('path');

const mappings = [
    { component: 'KineticFluid.tsx', demo: 'demo-kineticfluid.html', title: 'Kinetic Fluid', desc: 'Hyper-realistic liquid metal shader with dynamic specular highlights and flow mechanics.' },
    { component: 'CrystallineVapor.tsx', demo: 'demo-crystallinevapor.html', title: 'Crystalline Vapor', desc: 'Volumetric smoke dispersion with sharp gem-like cellular edges.' },
    { component: 'RibbedGlassMask.tsx', demo: 'demo-ribbedglass.html', title: 'Ribbed Glass Mask', desc: 'Vertical optical distortion simulating fluted privacy glass.' },
    { component: 'OrbitalParticles.tsx', demo: 'demo-orbitalparticles.html', title: 'Orbital Particles', desc: 'Gravity-based swarming particle dynamics.' },
    { component: 'QuantumPlasma.tsx', demo: 'demo-quantumplasma.html', title: 'Quantum Plasma', desc: 'Fluid merging metaballs with energy threshold glowing.' },
    { component: 'VolumetricLight.tsx', demo: 'demo-volumetriclight.html', title: 'Volumetric Light', desc: 'Cinematic god-rays and atmospheric density rendering.' },
    { component: 'VaporRing.tsx', demo: 'demo-vaporring.html', title: 'Vapor Ring', desc: 'Toroidal smoke rings moving through space.' },
    { component: 'CellularVoronoi.tsx', demo: 'demo-cellularvoronoi.html', title: 'Cellular Voronoi', desc: 'Microscopic bio-organic cellular division.' },
    { component: 'RetroHalftone.tsx', demo: 'demo-retrohalftone.html', title: 'Retro Halftone', desc: 'Comic-book style halftone dots generated dynamically on a wave matrix.' },
    { component: 'OrganicPulp.tsx', demo: 'demo-organicpulp.html', title: 'Organic Pulp', desc: 'High-fidelity paper texture generation with noise staining.' }
];

const compDir = path.join(__dirname, '../components');
const demoDir = __dirname;

for (const map of mappings) {
    const compPath = path.join(compDir, map.component);
    const demoPath = path.join(demoDir, map.demo);
    
    if (fs.existsSync(compPath)) {
        const compCode = fs.readFileSync(compPath, 'utf8');
        const match = compCode.match(/const fragmentShaderSource = `([\s\S]*?)`;/);
        const fsCode = match ? match[1].trim().replace(/\\/g, '\\\\').replace(/\$/g, '$$$$') : 'precision highp float; void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }';

        const htmlTemplate = `<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Kinetic Canvas: ${map.title}</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
        .overlay { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 3rem; pointer-events: none; }
        .back-btn { pointer-events: auto; align-self: flex-start; color: white; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 100px; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); transition: background 0.2s; }
        .back-btn:hover { background: rgba(0,0,0,0.5); }
        .hero { max-width: 800px; margin: auto; text-align: center; }
        h1 { font-size: 6rem; margin: 0 0 1rem 0; color: white; letter-spacing: -3px; line-height: 1; text-transform: uppercase; text-shadow: 0 4px 20px rgba(0,0,0,0.9); }
        p { font-size: 1.5rem; color: rgba(255,255,255,0.9); margin: 0 auto; max-width: 500px; line-height: 1.4; text-shadow: 0 4px 15px rgba(0,0,0,0.9); }
    </style>
</head>
<body>
    <canvas id='c'></canvas>
    <div class='overlay'>
        <a href='index.html' class='back-btn'>&larr; Back to Hub</a>
        <div class='hero'>
            <h1>${map.title}</h1>
            <p>${map.desc}</p>
        </div>
    </div>
    <script>
        const canvas = document.getElementById('c'); const gl = canvas.getContext('webgl');
        const vs = \`attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }\`;
        const fs = \`${fsCode}\`;
        const comp = (s, t) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(x)); return x; };
        const p = gl.createProgram(); gl.attachShader(p, comp(vs, gl.VERTEX_SHADER)); gl.attachShader(p, comp(fs, gl.FRAGMENT_SHADER)); gl.linkProgram(p); gl.useProgram(p);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(p, 'position'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        const uT = gl.getUniformLocation(p, 'uTime'), uR = gl.getUniformLocation(p, 'uResolution');
        const rz = () => { canvas.width = window.innerWidth*devicePixelRatio; canvas.height = window.innerHeight*devicePixelRatio; gl.viewport(0,0,canvas.width,canvas.height); };
        window.addEventListener('resize', rz); rz();
        const start = Date.now();
        const render = () => { gl.uniform1f(uT, (Date.now()-start)*0.001); gl.uniform2f(uR, canvas.width, canvas.height); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); requestAnimationFrame(render); };
        render();
    </script>
</body>
</html>`;
        
        fs.writeFileSync(demoPath, htmlTemplate);
        console.log('Rebuilt ' + map.demo);
    }
}

