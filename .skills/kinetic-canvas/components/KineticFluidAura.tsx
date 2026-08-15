"use client";

import React, { useRef, useEffect } from 'react';

export interface KineticFluidAuraProps extends React.HTMLAttributes<HTMLCanvasElement> {
  colors?: [string, string, string];
  viscosity?: number;
  speed?: number;
}

export const KineticFluidAura: React.FC<KineticFluidAuraProps> = ({
  colors = ['#FF0055', '#4599FF', '#9360F7'],
  viscosity = 0.8,
  speed = 1.0,
  className,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255].map(x => x / 255.0);
    };

    const c1 = hexToRgb(colors[0]);
    const c2 = hexToRgb(colors[1]);
    const c3 = hexToRgb(colors[2]);

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
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uViscosity;
      
      varying vec2 vUv;

      // 2D Random
      float random (in vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      // 2D Noise
      float noise (in vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        vec2 q = vec2(0.);
        q.x = noise(st + uTime * 0.1);
        q.y = noise(st + vec2(1.0));

        vec2 r = vec2(0.);
        r.x = noise(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
        r.y = noise(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

        float f = noise(st + r * (2.0 - uViscosity));

        vec3 color = mix(uColor1, uColor2, clamp((f*f)*4.0, 0.0, 1.0));
        color = mix(color, uColor3, clamp(length(q), 0.0, 1.0));
        color = mix(color, vec3(1.0), clamp(length(r.x), 0.0, 1.0) * 0.5);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = (gl as WebGLRenderingContext).createShader(type)!;
      (gl as WebGLRenderingContext).shaderSource(shader, source);
      (gl as WebGLRenderingContext).compileShader(shader);
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
    const uViscosity = gl.getUniformLocation(program, 'uViscosity');
    const uColor1 = gl.getUniformLocation(program, 'uColor1');
    const uColor2 = gl.getUniformLocation(program, 'uColor2');
    const uColor3 = gl.getUniformLocation(program, 'uColor3');

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
      const time = (Date.now() - startTime) * 0.001 * speed;
      
      gl.uniform1f(uTime, time);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uViscosity, viscosity);
      gl.uniform3f(uColor1, c1[0], c1[1], c1[2]);
      gl.uniform3f(uColor2, c2[0], c2[1], c2[2]);
      gl.uniform3f(uColor3, c3[0], c3[1], c3[2]);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [colors, viscosity, speed]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
