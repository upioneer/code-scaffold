'use client';

import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { KineticMesh } from './index';

interface AudioKineticMeshProps {
  colors?: [string, string, string, string];
  sensitivity?: number;
}

export function AudioKineticMesh({
  colors = ['#5100ff', '#00ff80', '#ffcc00', '#ea00ff'],
  sensitivity = 2.0,
}: AudioKineticMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [audioData, setAudioData] = useState({ distortion: 0.5, speed: 0.1 });
  const [isActive, setIsActive] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const reqIdRef = useRef<number>(0);

  // GSAP Proxy to handle the physics/smoothing without hammering React state
  const proxy = useRef({ distortion: 0.5, speed: 0.1 });

  const { contextSafe } = useGSAP({ scope: containerRef });

  const tick = contextSafe(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const avg = sum / dataArray.length;
    const normalized = avg / 255;
    
    const targetDistortion = 0.5 + (normalized * sensitivity * 2.0);
    const targetSpeed = 0.1 + (normalized * sensitivity * 1.5);

    // Spring interpolation to targets
    gsap.to(proxy.current, {
      distortion: targetDistortion,
      speed: targetSpeed,
      duration: 0.1, // Quick reaction for audio
      ease: "power2.out",
      onUpdate: () => {
        setAudioData({
          distortion: proxy.current.distortion,
          speed: proxy.current.speed
        });
      }
    });

    reqIdRef.current = requestAnimationFrame(tick);
  });

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setIsActive(true);
      tick();
      
      // Animate entry of the mesh properties when activated
      gsap.from(proxy.current, {
        distortion: 0,
        speed: 0,
        duration: 1.5,
        ease: "elastic.out(1, 0.4)"
      });
      
    } catch (err) {
      console.error("Audio initialization failed", err);
    }
  };

  useGSAP(() => {
    return () => {
      cancelAnimationFrame(reqIdRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden group">
      <KineticMesh
        colors={colors}
        distortion={audioData.distortion}
        swirl={audioData.distortion * 0.8}
        speed={audioData.speed}
        style={{ width: '100%', height: '100%' }}
      />
      {!isActive && (
        <button
          onClick={startAudio}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
        >
          Enable Audio Reactivity
        </button>
      )}
    </div>
  );
}
