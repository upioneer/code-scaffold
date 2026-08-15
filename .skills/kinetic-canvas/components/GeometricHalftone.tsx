"use client";

import React, { useRef, useEffect } from 'react';

export interface GeometricHalftoneProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
  density?: number;
}

export const GeometricHalftone: React.FC<GeometricHalftoneProps> = ({
  speed = 1.0,
  density = 50.0,
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
      uniform float uDensity;
      
      varying vec2 vUv;

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        // Create expanding concentric circles
        float d = length(st - vec2(0.5));
        float circles = sin(d * uDensity - uTime * 5.0);
        
        // Halftone dots based on the circles
        vec2 grid = fract(st * uDensity);
        float distToCenter = length(grid - vec2(0.5));
        
        float radius = 0.5 * (0.5 + 0.5 * circles);
        float dot = step(distToCenter, radius);

        // Mix some colors
        vec3 col1 = vec3(0.05, 0.05, 0.05); // Dark
        vec3 col2 = vec3(0.9, 0.9, 0.9); // Light

        gl_FragColor = vec4(mix(col1, col2, dot), 1.0);
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
    const uDensity = gl.getUniformLocation(program, 'uDensity');

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
      gl.uniform1f(uDensity, density);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [speed, density]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
