"use client";

import React, { useRef, useEffect } from 'react';

export interface AbyssalWireframeProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
  neonColor?: string;
}

export const AbyssalWireframe: React.FC<AbyssalWireframeProps> = ({
  speed = 1.0,
  neonColor = '#00ffcc',
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255].map(x => x / 255.0);
    };

    const cNeon = hexToRgb(neonColor);

    const vertexShaderSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uNeonColor;
      
      varying vec2 vUv;

      float sdBox( in vec2 p, in vec2 b ) {
        vec2 d = abs(p)-b;
        return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        // Simple morphing wireframe logic
        st = st * 2.0 - 1.0;
        st.x += sin(uTime * 0.5) * 0.5;
        st.y += cos(uTime * 0.3) * 0.5;

        float d = sdBox(st, vec2(0.5 + 0.2 * sin(uTime)));
        
        // Wireframe glow
        float glow = 0.02 / abs(d);
        glow += 0.01 / abs(d + 0.2 * sin(uTime*2.0));

        vec3 color = uNeonColor * glow;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compileShader(vertexShaderSource, gl.VERTEX_SHADER));
    gl.attachShader(program, compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uNeonColor = gl.getUniformLocation(program, 'uNeonColor');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      gl.uniform1f(uTime, (Date.now() - startTime) * 0.001 * speed);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform3f(uNeonColor, cNeon[0], cNeon[1], cNeon[2]);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [speed, neonColor]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
