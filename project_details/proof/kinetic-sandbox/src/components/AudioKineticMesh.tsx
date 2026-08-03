'use client';

import React, { useEffect, useRef, useState } from 'react';
import { KineticMesh } from './index';

interface AudioKineticMeshProps {
  colors?: [string, string, string, string];
  sensitivity?: number;
}

export function AudioKineticMesh({
  colors = ['#5100ff', '#00ff80', '#ffcc00', '#ea00ff'],
  sensitivity = 2.0,
}: AudioKineticMeshProps) {
  const [audioData, setAudioData] = useState({ distortion: 0.5, speed: 0.1 });
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const reqIdRef = useRef<number>(0);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        const normalized = avg / 255;
        
        setAudioData({
          distortion: 0.5 + (normalized * sensitivity * 2.0),
          speed: 0.1 + (normalized * sensitivity * 1.5),
        });

        reqIdRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch (err) {
      console.error("Audio initialization failed", err);
    }
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(reqIdRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden group">
      <KineticMesh
        colors={colors}
        distortion={audioData.distortion}
        swirl={audioData.distortion * 0.8}
        speed={audioData.speed}
        style={{ width: '100%', height: '100%' }}
      />
      {!audioContextRef.current && (
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
