'use client';

import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { CausticDisplacement } from './index';

export function RepellentCaustics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0.2);
  const lastPos = useRef({ x: 0, y: 0, time: 0 });
  
  // Create a proxy object that GSAP will tween to handle physics and smoothing
  const proxy = useRef({ speed: 0.2 });

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleMouseMove = contextSafe((e: React.MouseEvent) => {
    const now = performance.now();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const dt = now - lastPos.current.time;

    if (dt > 0) {
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
      const targetSpeed = Math.min(0.2 + velocity * 1.5, 3.0);
      
      // Animate the proxy speed up quickly based on velocity
      gsap.to(proxy.current, {
        speed: targetSpeed,
        duration: 0.2,
        ease: "power2.out",
        onUpdate: () => setSpeed(proxy.current.speed),
        onComplete: () => {
          // Spring back to base speed
          gsap.to(proxy.current, {
            speed: 0.2,
            duration: 1.5,
            ease: "elastic.out(1, 0.3)",
            onUpdate: () => setSpeed(proxy.current.speed)
          });
        }
      });
    }

    lastPos.current = { x: e.clientX, y: e.clientY, time: now };
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <CausticDisplacement
        speed={speed}
        style={{ width: '100%', height: '100%', transition: 'none' }}
      />
    </div>
  );
}
