'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CausticDisplacement } from './index';

export function RepellentCaustics() {
  const [speed, setSpeed] = useState(0.2);
  const lastPos = useRef({ x: 0, y: 0, time: 0 });
  const reqId = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const now = performance.now();
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const dt = now - lastPos.current.time;

    if (dt > 0) {
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
      const targetSpeed = Math.min(0.2 + velocity * 1.5, 3.0);
      setSpeed(targetSpeed);
    }

    lastPos.current = { x: e.clientX, y: e.clientY, time: now };
  };

  useEffect(() => {
    const tick = () => {
      setSpeed((prev) => prev + (0.2 - prev) * 0.05);
      reqId.current = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(reqId.current);
  }, []);

  return (
    <div 
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
