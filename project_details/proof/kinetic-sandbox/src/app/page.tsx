import React from 'react';
import { 
  KineticMesh, KineticFluid, ThermalAura, CrystallineVapor, 
  CausticDisplacement, RibbedGlassMask, OrbitalParticles, 
  QuantumPlasma, VolumetricLight, VaporRing, CellularVoronoi, 
  RetroHalftone, OrganicPulp, KineticBlaze, KineticFrost, KineticCipherReveal, KineticLiquidGlass
} from '@/components/index';

export default function Home() {
  const sections = [
    { id: 'kinetic-blaze', title: 'Kinetic Blaze', Component: <KineticBlaze style={{width:'100%', height:'100%'}}><div/></KineticBlaze> },
    { id: 'kinetic-frost', title: 'Kinetic Frost', Component: <KineticFrost style={{width:'100%', height:'100%'}}><div/></KineticFrost> },
    { id: 'kinetic-cipher', title: 'Cipher Reveal', Component: <KineticCipherReveal style={{width:'100%', height:'100%'}} text="CODE SCAFFOLD"><div/></KineticCipherReveal> },
    { id: 'kinetic-liquid-glass', title: 'Liquid Glass', Component: <KineticLiquidGlass style={{width:'100%', height:'100%'}} /> },
    { id: 'kinetic-fluid', title: 'Kinetic Fluid', Component: <KineticFluid style={{width:'100%', height:'100%'}} /> },
    { id: 'thermal-aura', title: 'Thermal Aura', Component: <ThermalAura style={{width:'100%', height:'100%'}} /> },
    { id: 'crystalline-vapor', title: 'Crystalline Vapor', Component: <CrystallineVapor style={{width:'100%', height:'100%'}} /> },
    { id: 'kinetic-mesh', title: 'Kinetic Mesh', Component: <KineticMesh style={{width:'100%', height:'100%'}} /> },
    { id: 'orbital-particles', title: 'Orbital Particles', Component: <OrbitalParticles style={{width:'100%', height:'100%'}} /> },
    { id: 'quantum-plasma', title: 'Quantum Plasma', Component: <QuantumPlasma style={{width:'100%', height:'100%'}} /> },
    { id: 'volumetric-light', title: 'Volumetric Light', Component: <VolumetricLight style={{width:'100%', height:'100%'}} /> },
    { id: 'vapor-ring', title: 'Vapor Ring', Component: <VaporRing style={{width:'100%', height:'100%'}} /> },
    { id: 'cellular-voronoi', title: 'Cellular Voronoi', Component: <CellularVoronoi style={{width:'100%', height:'100%'}} /> },
    { id: 'caustic-displacement', title: 'Caustic Displacement', Component: <CausticDisplacement style={{width:'100%', height:'100%'}} /> },
    { id: 'ribbed-glass-mask', title: 'Ribbed Glass Mask', Component: <RibbedGlassMask style={{width:'100%', height:'100%'}} /> },
    { id: 'retro-halftone', title: 'Retro Halftone', Component: <RetroHalftone style={{width:'100%', height:'100%'}} /> },
    { id: 'organic-pulp', title: 'Organic Pulp', Component: <OrganicPulp style={{width:'100%', height:'100%'}} /> },
  ];

  return (
    <main className="relative bg-black text-white selection:bg-white selection:text-black font-sans">
      {sections.map(s => (
        <section key={s.id} id={s.id} className="relative flex h-screen w-full flex-col items-center justify-center">
          <div className="absolute inset-0">
            {s.Component}
          </div>
          <h2 className="relative z-10 text-6xl font-black uppercase tracking-widest text-white mix-blend-difference pointer-events-none drop-shadow-lg">
            {s.title}
          </h2>
        </section>
      ))}
    </main>
  );
}
