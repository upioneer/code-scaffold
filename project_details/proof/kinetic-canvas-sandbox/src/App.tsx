import React, { useState } from 'react';
import { 
  KineticMesh, KineticFluid, ThermalAura, CrystallineVapor, 
  CausticDisplacement, RibbedGlassMask, OrbitalParticles, 
  QuantumPlasma, VolumetricLight, VaporRing, CellularVoronoi, 
  RetroHalftone, OrganicPulp
} from './components/index';
import { Blaze as KineticBlaze } from './components/canvasui/Blaze';
import { Frost as KineticFrost } from './components/canvasui/Frost';
import { DecryptReveal as KineticCipherReveal } from './components/canvasui/DecryptReveal';

const SHADERS = [
  { id: 'kinetic-fluid', name: 'Kinetic Fluid', category: 'Logo & Typography', component: (props: any) => <KineticFluid {...props} /> },
  { id: 'thermal-aura', name: 'Thermal Aura', category: 'Logo & Typography', component: (props: any) => <ThermalAura {...props} /> },
  { id: 'crystalline-vapor', name: 'Crystalline Vapor', category: 'Logo & Typography', component: (props: any) => <CrystallineVapor {...props} /> },
  { id: 'kinetic-mesh', name: 'Kinetic Mesh', category: 'Environmental Effects', component: (props: any) => <KineticMesh {...props} /> },
  { id: 'orbital-particles', name: 'Orbital Particles', category: 'Environmental Effects', component: (props: any) => <OrbitalParticles {...props} /> },
  { id: 'quantum-plasma', name: 'Quantum Plasma', category: 'Environmental Effects', component: (props: any) => <QuantumPlasma {...props} /> },
  { id: 'volumetric-light', name: 'Volumetric Light', category: 'Environmental Effects', component: (props: any) => <VolumetricLight {...props} /> },
  { id: 'vapor-ring', name: 'Vapor Ring', category: 'Environmental Effects', component: (props: any) => <VaporRing {...props} /> },
  { id: 'cellular-voronoi', name: 'Cellular Voronoi', category: 'Environmental Effects', component: (props: any) => <CellularVoronoi {...props} /> },
  { id: 'caustic-displacement', name: 'Caustic Displacement', category: 'Image Filters & Caustics', component: (props: any) => <CausticDisplacement {...props} /> },
  { id: 'ribbed-glass-mask', name: 'Ribbed Glass Mask', category: 'Image Filters & Caustics', component: (props: any) => <RibbedGlassMask {...props} /> },
  { id: 'retro-halftone', name: 'Retro Halftone', category: 'Image Filters & Caustics', component: (props: any) => <RetroHalftone {...props} /> },
  { id: 'organic-pulp', name: 'Organic Pulp', category: 'Image Filters & Caustics', component: (props: any) => <OrganicPulp {...props} /> },
  { id: 'kinetic-blaze', name: 'Kinetic Blaze', category: 'DOM Distortion', component: (props: any) => <KineticBlaze {...props}><div className="text-4xl font-black text-white mix-blend-difference">BURN IT DOWN</div></KineticBlaze> },
  { id: 'kinetic-frost', name: 'Kinetic Frost', category: 'DOM Distortion', component: (props: any) => <KineticFrost {...props}><div className="text-4xl font-black text-white mix-blend-difference">ICE COLD</div></KineticFrost> },
  { id: 'kinetic-cipher', name: 'Cipher Reveal', category: 'DOM Distortion', component: (props: any) => <KineticCipherReveal text="CODE SCAFFOLD" {...props} /> },
  { id: 'kinetic-liquid-glass', name: 'Liquid Glass (3D)', category: 'DOM Distortion', isHeavy: true }
];

export default function App() {
  const [activeId, setActiveId] = useState(SHADERS[0].id);

  const activeShader = SHADERS.find(s => s.id === activeId);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto flex flex-col z-10 backdrop-blur-xl shrink-0">
        <h1 className="text-2xl font-black text-cyan-400 mb-2 uppercase tracking-wider">Kinetic Canvas</h1>
        <p className="text-sm text-slate-400 mb-8">
          Ultra-fast, zero-dependency WebGL shaders and interactive HTML canvases wrapped as native React components for Code Scaffold.
        </p>
        
        <div className="flex flex-col gap-6">
          {Array.from(new Set(SHADERS.map(s => s.category))).map(category => (
            <div key={category}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{category}</h2>
              <div className="flex flex-col gap-1">
                {SHADERS.filter(s => s.category === category).map(shader => (
                  <button
                    key={shader.id}
                    onClick={() => setActiveId(shader.id)}
                    className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      activeId === shader.id 
                        ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {shader.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 relative bg-black overflow-hidden flex flex-col items-center justify-center">
        {activeShader?.isHeavy ? (
          <div className="text-center p-8 max-w-xl flex flex-col items-center justify-center h-full gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-cyan-500/30">
              <span className="text-cyan-400 font-bold">3D</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Full 3D Simulation Required</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              This specific capability (<span className="text-cyan-400 font-mono">{activeShader.name}</span>) relies on complex 3D assets that are too heavy for this lightweight web demonstration.
            </p>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full text-left">
              <p className="text-slate-300 font-medium mb-4">To experience the full interactive 3D simulation, download the skill locally via the CLI:</p>
              <code className="bg-black border border-slate-800 text-cyan-400 px-4 py-3 rounded-lg block font-mono text-sm">
                npx @code-scaffold/skills install kinetic-canvas
              </code>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full" key={activeShader?.id}>
            {activeShader?.component({ style: { width: '100%', height: '100%' } })}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <h2 className="text-left text-6xl md:text-8xl font-black uppercase tracking-widest text-white mix-blend-difference drop-shadow-lg select-none opacity-50">
                {activeShader?.name}
              </h2>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
