"use client";

import React, { useRef, useEffect } from 'react';

export interface OrganicPulpProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
}

export const OrganicPulp: React.FC<OrganicPulpProps> = ({
  speed = 1.0,
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
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fragmentShaderSource = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      
      float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
      float noise(vec2 st) {
          vec2 i = floor(st); vec2 f = fract(st);
          vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(random(i), random(i+vec2(1.,0.)), u.x), mix(random(i+vec2(0.,1.)), random(i+vec2(1.,1.)), u.x), u.y);
      }
      float fbm(vec2 st) {
          float value = 0.0; float amplitude = .5;
          for (int i = 0; i < 5; i++) {
              value += amplitude * noise(st);
              st *= 2.0; amplitude *= .5;
          }
          return value;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;
        
        // High frequency noise for paper pulp
        float grain = random(st * 100.0 + uTime * 0.01) * 0.1;
        
        // Low frequency fbm for organic stains/texture
        float stain = fbm(st * 3.0);
        
        vec3 paperColor = vec3(0.95, 0.93, 0.88); // Off-white cream
        vec3 darkStain = vec3(0.85, 0.8, 0.7);
        
        vec3 col = mix(paperColor, darkStain, stain * 0.5);
        col -= grain; // add grain

        gl_FragColor = vec4(col, 1.0);
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

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      gl.uniform1f(uTime, (Date.now() - startTime) * 0.001 * speed);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
