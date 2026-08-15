"use client";

import React, { useRef, useEffect } from 'react';

export interface KineticCrystallineProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
  facets?: number;
}

export const KineticCrystalline: React.FC<KineticCrystallineProps> = ({
  speed = 1.0,
  facets = 5.0,
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
      uniform float uFacets;
      
      varying vec2 vUv;

      vec2 hash2( vec2 p ) {
        p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
        return -1.0 + 2.0*fract(sin(p)*43758.5453123);
      }

      float voronoi( in vec2 x ) {
        vec2 n = floor(x);
        vec2 f = fract(x);
        float F1 = 8.0;
        float F2 = 8.0;
        for( int j=-1; j<=1; j++ )
        for( int i=-1; i<=1; i++ ) {
            vec2 g = vec2(float(i),float(j));
            vec2 o = hash2( n + g );
            o = 0.5 + 0.5*sin( uTime*0.5 + 6.2831*o );
            vec2 r = g + o - f;
            float d = dot(r,r);
            if( d < F1 ) {
                F2 = F1;
                F1 = d;
            } else if( d < F2 ) {
                F2 = d;
            }
        }
        return sqrt(F2) - sqrt(F1);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        float v = voronoi(st * uFacets);
        
        // Chromatic aberration simulation on the edges
        float r = voronoi(st * uFacets + vec2(0.02));
        float g = voronoi(st * uFacets + vec2(0.0));
        float b = voronoi(st * uFacets - vec2(0.02));

        // Create sharp glassy bevels
        vec3 color = vec3(
            smoothstep(0.0, 0.1, r),
            smoothstep(0.0, 0.1, g),
            smoothstep(0.0, 0.1, b)
        );
        
        // Add deep glass refraction background
        color = mix(vec3(0.0, 0.05, 0.1), color, 0.8);
        
        // Brighten the very sharpest peaks
        color += vec3(1.0) * smoothstep(0.0, 0.02, v);

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
    const uFacets = gl.getUniformLocation(program, 'uFacets');

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
      gl.uniform1f(uFacets, facets);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, [speed, facets]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} {...props} />;
};
