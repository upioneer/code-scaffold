"use client";

import React, { useRef, useEffect } from 'react';

export interface VaporRingProps extends React.HTMLAttributes<HTMLCanvasElement> {
  speed?: number;
}

export const VaporRing: React.FC<VaporRingProps> = ({
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
      
      // Dave Hoskins Hash
      float hash(vec3 p) {
          p = fract(p * vec3(0.1031, 0.1030, 0.0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.x + p.y) * p.z);
      }
      
      // 3D Value Noise
      float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                         mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                         mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      
      // Fractional Brownian Motion
      float fbm(vec3 p) {
          float f = 0.0; float amp = 0.5;
          for(int i=0; i<4; i++) {
              f += amp * noise(p); p *= 2.0; amp *= 0.5;
          }
          return f;
      }

      float sdTorus(vec3 p, vec2 t) {
          vec2 q = vec2(length(p.xz) - t.x, p.y);
          return length(q) - t.y;
      }
      
      mat2 rot(float a) {
          float s = sin(a), c = cos(a);
          return mat2(c, -s, s, c);
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
        
        vec3 ro = vec3(0.0, 1.0, -2.5); // Camera origin
        vec3 rd = normalize(vec3(uv.x, uv.y - 0.2, 1.0)); // Camera direction
        
        float t = 0.0;
        float density = 0.0;
        vec3 color = vec3(0.0);
        
        vec3 lightDir = normalize(vec3(0.8, 1.0, -0.5));
        
        // Raymarch
        for(int i=0; i<45; i++) {
            vec3 p = ro + rd * t;
            p.yz = rot(-0.4) * p.yz; // Tilt the ring
            
            float d = sdTorus(p, vec2(1.0, 0.4)); // Torus bounds
            
            if(d < 0.2) {
                // Rolling internal smoke
                vec3 noiseDomain = p * 1.5;
                
                // Spin the ring around the Y axis
                float angle = atan(p.z, p.x);
                noiseDomain.y += uTime * 0.5;
                noiseDomain.x += cos(angle) * uTime * 0.2;
                noiseDomain.z += sin(angle) * uTime * 0.2;
                
                float n = fbm(noiseDomain);
                
                // Shape the smoke inside the torus bounds
                float smokeDensity = smoothstep(0.2, -0.2, d + n * 0.6 - 0.3);
                
                if(smokeDensity > 0.0) {
                    float alpha = smokeDensity * 0.15;
                    
                    // Directional scattering (Self-shadowing approximation)
                    float l = fbm(noiseDomain + lightDir * 0.3);
                    vec3 col = mix(vec3(0.3, 0.4, 0.5), vec3(0.95, 0.98, 1.0), smoothstep(0.2, 0.8, l));
                    
                    color += col * alpha * (1.0 - density);
                    density += alpha * (1.0 - density);
                    
                    if(density > 0.95) break;
                }
            }
            
            t += max(0.05, d * 0.5);
            if(t > 5.0) break;
        }
        
        vec3 bg = mix(vec3(0.01, 0.02, 0.04), vec3(0.0), length(uv));
        color = mix(bg, color, density);

        // Subtle cinematic vignette
        color *= 1.0 - smoothstep(0.5, 1.5, length(uv));

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
