/**
 * WebGL Chromatic Light-Field Material
 * Code Scaffold Specification Schema: https://code-scaffold.com/spec/v1
 * 
 * Renders an organic, undulating chromatic wave light-field on a canvas element.
 * Features exponential light ribbons, interference ridges, radial center glows,
 * edge glints, and fine procedural analog grain. Includes 60fps pacing, low-power
 * optimization, IntersectionObserver pausing, and reduced-motion fallback.
 */

class LightFieldMaterial {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.options = Object.assign({
      primaryColor: [0.44, 0.25, 0.82], // Studio Violet
      edgeColor: [0.16, 0.38, 0.49],
      speed: 0.075,
      powerPreference: 'low-power'
    }, options);

    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.vertexShader = null;
    this.fragmentShader = null;
    this.uResolution = null;
    this.uTime = null;
    this.uColor = null;
    this.animationFrameId = null;
    this.startTime = performance.now();
    this.isVisible = true;

    this.init();
  }

  init() {
    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.canvas.dataset.state = 'reduced-motion';
      return;
    }

    try {
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        powerPreference: this.options.powerPreference
      });
    } catch (e) {
      this.gl = null;
    }

    if (!this.gl) {
      this.canvas.dataset.state = 'fallback';
      return;
    }

    const gl = this.gl;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Shader compile failed: ' + info);
      }
      return shader;
    };

    const vertexSource = `
      attribute vec2 p;
      void main() {
        gl_Position = vec4(p, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec3 primaryColor;
      uniform vec3 edgeColor;

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 p = vec2(uv.x, 1.0 - uv.y);
        float t = time;

        // Undulating wave crests
        float crest = 0.075 + 0.055 * sin(p.x * 5.5 + t) + 0.045 * cos(p.x * 9.0 - t * 0.6);
        float d = abs(p.y - crest);

        // Exponential light ribbons
        float ribbon = exp(-d * 27.0) * 0.22 + exp(-d * 110.0) * 0.18;
        float ridges = 0.5 + 0.5 * sin(d * 200.0 - p.x * 8.0 + t);
        float top = exp(-p.y * 7.0);

        // Soft center radial glow
        float glow = exp(-length((p - vec2(0.63 + 0.1 * sin(t), -0.03)) * vec2(1.7, 2.4)) * 3.0);
        float edge = exp(-p.x * 11.0) * exp(-abs(p.y - 0.72) * 4.0);

        // Chromatic composite
        vec3 color = primaryColor * (ribbon * (0.6 + 0.4 * ridges) + glow * 0.28);
        color += edgeColor * edge * 0.18;
        color += vec3(0.60, 0.45, 0.83) * pow(max(0.0, 1.0 - d * 90.0), 3.0) * 0.06;

        // Procedural analog grain
        float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - 0.5) * 0.015;

        gl_FragColor = vec4(color, (top * 0.72 + edge * 0.2) * 0.95);
      }
    `;

    try {
      this.vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
      this.fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);

      this.program = gl.createProgram();
      gl.attachShader(this.program, this.vertexShader);
      gl.attachShader(this.program, this.fragmentShader);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw new Error('Program link failed: ' + gl.getProgramInfoLog(this.program));
      }

      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      this.uResolution = gl.getUniformLocation(this.program, 'resolution');
      this.uTime = gl.getUniformLocation(this.program, 'time');
      this.uColor = gl.getUniformLocation(this.program, 'primaryColor');
      this.uEdgeColor = gl.getUniformLocation(this.program, 'edgeColor');

      this.setupObserver();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.render();
    } catch (e) {
      console.warn('[LightFieldMaterial] Initialization failed:', e);
      this.canvas.dataset.state = 'fallback';
      this.dispose();
    }
  }

  setColor(primaryRgb, edgeRgb = null) {
    this.options.primaryColor = primaryRgb;
    if (edgeRgb) this.options.edgeColor = edgeRgb;
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && !this.animationFrameId) {
        this.render();
      }
    }, { threshold: 0.05 });
    this.observer.observe(this.canvas);
  }

  resize() {
    if (!this.gl) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width || 300;
      this.canvas.height = height || 150;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render() {
    if (!this.gl || !this.isVisible) {
      this.animationFrameId = null;
      return;
    }

    const gl = this.gl;
    const elapsed = (performance.now() - this.startTime) * 0.001 * this.options.speed;

    gl.useProgram(this.program);
    gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, elapsed);
    gl.uniform3fv(this.uColor, this.options.primaryColor);
    gl.uniform3fv(this.uEdgeColor, this.options.edgeColor);

    const posAttr = gl.getAttribLocation(this.program, 'p');
    gl.enableVertexAttribArray(posAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.animationFrameId = requestAnimationFrame(() => this.render());
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.buffer) this.gl.deleteBuffer(this.buffer);
      if (this.vertexShader) this.gl.deleteShader(this.vertexShader);
      if (this.fragmentShader) this.gl.deleteShader(this.fragmentShader);
      this.gl = null;
    }
  }
}

// Global browser / module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LightFieldMaterial };
} else {
  window.LightFieldMaterial = LightFieldMaterial;
}
