'use client';

import React, { useState } from 'react';
import { KineticFluid } from './index';

interface TextKineticFluidProps {
  text: string;
  className?: string;
}

export function TextKineticFluid({
  text,
  className = '',
}: TextKineticFluidProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative inline-block font-black uppercase tracking-tighter ${className}`}
      style={{
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      <div className="absolute inset-0 z-[-1]" style={{ WebkitMaskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='900' font-size='100px'>${text}</text></svg>")`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }}>
        <KineticFluid
          speed={0.5 + (mousePos.x * 2.0)}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <span className="relative z-10 mix-blend-overlay">{text}</span>
    </div>
  );
}
