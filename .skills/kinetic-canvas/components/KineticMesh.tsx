"use client";

import React, { useRef, useEffect } from 'react';

export interface KineticMeshProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
  colorDensity?: number;
}

export const KineticMesh: React.FC<KineticMeshProps> = ({
  speed = 1.0,
  colorDensity = 2.0,
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
      uniform float uColorDensity;
      
      varying vec2 vUv;

      vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
          return a + b*cos( 6.28318*(c*t+d) );
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        vec2 st0 = st;
        vec3 finalColor = vec3(0.0);

        for(float i = 0.0; i < 3.0; i++) {
            st = fract(st * 1.5) - 0.5;
            float d = length(st) * exp(-length(st0));
            
            vec3 col = palette(length(st0) + i*.4 + uTime*.4, 
                               vec3(0.5, 0.5, 0.5),
                               vec3(0.5, 0.5, 0.5),
                               vec3(1.0, 1.0, 1.0),
                               vec3(0.263,0.416,0.557));
            
            d = sin(d*8.0 + uTime)/8.0;
            d = abs(d);
            d = pow(0.01 / d, uColorDensity);
            
            finalColor += col * d;
        }

        gl_FragColor = vec4(finalColor, 1.0);
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
    const uColorDensity = gl.getUniformLocation(program, 'uColorDensity');

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
      gl.uniform1f(uColorDensity, colorDensity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [speed, colorDensity]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
