"use client";

import React, { useRef, useEffect } from 'react';

export interface KineticCausticsProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
  scale?: number;
}

export const KineticCaustics: React.FC<KineticCausticsProps> = ({
  speed = 1.0,
  scale = 3.0,
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
      uniform float uScale;
      
      varying vec2 vUv;

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;
        st *= uScale;

        float time = uTime * 0.5;
        vec2 p = st;
        for(int i = 1; i < 6; i++) {
            vec2 newp = p;
            newp.x += 0.6/float(i)*sin(float(i)*p.y + time + 0.3);
            newp.y += 0.6/float(i)*cos(float(i)*p.x + time + 0.3);
            p = newp;
        }
        
        vec3 col = vec3(0.5 * sin(3.0 * p.x) + 0.5,
                        0.5 * sin(3.0 * p.y) + 0.5,
                        sin(p.x + p.y));
        
        // Map to underwater caustic colors
        vec3 water = vec3(0.0, 0.5, 0.8);
        col = mix(water, vec3(1.0), col.x * col.y * 0.5);
        
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
    const uScale = gl.getUniformLocation(program, 'uScale');

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
      gl.uniform1f(uScale, scale);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [speed, scale]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
