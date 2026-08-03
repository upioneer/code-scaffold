'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { KineticMesh } from './index';

gsap.registerPlugin(ScrollTrigger);

interface ScrollKineticMeshProps {
  colors?: [string, string, string, string];
}

export function ScrollKineticMesh({
  colors = ['#FF0055', '#4338ca', '#00ff80', '#000000'],
}: ScrollKineticMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shaderProps, setShaderProps] = useState({ distortion: 0.5, swirl: 0.5, speed: 0.1 });

  useEffect(() => {
    if (!containerRef.current) return;

    const proxy = { distortion: 0.5, swirl: 0.5, speed: 0.1 };

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        gsap.to(proxy, {
          distortion: 0.5 + (self.progress * 3.0),
          swirl: 0.5 + (self.progress * 2.0),
          speed: 0.1 + (self.progress * 1.5),
          duration: 0.1,
          onUpdate: () => {
            setShaderProps({
              distortion: proxy.distortion,
              swirl: proxy.swirl,
              speed: proxy.speed,
            });
          }
        });
      }
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[-1] overflow-hidden">
      <KineticMesh
        colors={colors}
        distortion={shaderProps.distortion}
        swirl={shaderProps.swirl}
        speed={shaderProps.speed}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
