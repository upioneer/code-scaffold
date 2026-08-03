'use client';

import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
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

  useGSAP(() => {
    if (!containerRef.current) return;

    // We animate a proxy object to allow custom easings instead of tying it purely to the raw progress.
    const proxy = { distortion: 0.5, swirl: 0.5, speed: 0.1 };

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        // Use custom easing and quick duration for smooth transition respecting inertia
        gsap.to(proxy, {
          distortion: 0.5 + (self.progress * 3.0),
          swirl: 0.5 + (self.progress * 2.0),
          speed: 0.1 + (self.progress * 1.5),
          duration: 0.3,
          ease: "power3.out",
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

    // Optional: Animate in when component mounts using spring-like easing
    gsap.from(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: "power4.out"
    });
  }, { scope: containerRef });

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
