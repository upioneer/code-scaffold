'use client';

import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { KineticFluid } from './index';

interface TextKineticFluidProps {
  text: string;
  className?: string;
}

export function TextKineticFluid({
  text,
  className = '',
}: TextKineticFluidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0.5);
  
  // Use a proxy object for GSAP to tween smoothly
  const proxy = useRef({ mouseX: 0 });

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleMouseMove = contextSafe((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    
    // Smoothly animate the proxy value towards the target mouse position
    gsap.to(proxy.current, {
      mouseX: x,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        // Only update the actual speed state based on the interpolated proxy
        setSpeed(0.5 + (proxy.current.mouseX * 2.0));
      }
    });
  });

  const handleMouseLeave = contextSafe(() => {
    // Spring back to default speed when mouse leaves
    gsap.to(proxy.current, {
      mouseX: 0,
      duration: 1.2,
      ease: "elastic.out(1, 0.4)",
      onUpdate: () => {
        setSpeed(0.5 + (proxy.current.mouseX * 2.0));
      }
    });
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block font-black uppercase tracking-tighter ${className}`}
      style={{
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      <div className="absolute inset-0 z-[-1]" style={{ WebkitMaskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='900' font-size='100px'>${text}</text></svg>")`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }}>
        <KineticFluid
          speed={speed}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <span className="relative z-10 mix-blend-overlay">{text}</span>
    </div>
  );
}
