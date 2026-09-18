/**
 * WebGPU Halftone Cursor Shader Trail Reference
 * Code Scaffold :: UI Primitives & Micro-Interactions v4
 * -------------------------------------------------------
 * Progressive enhancement: WebGPU halftone trail -> WebGL
 * pointer glow -> CSS radial follower -> no-JS static grid.
 * Requires: shaders (npm install shaders)
 */

// ─── Capability Gate ───────────────────────────────────────────────────────

export async function initCursorShader(hostSelector = ".cs-shader-host") {
  const host = document.querySelector(hostSelector);
  if (!host) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasWebGPU      = typeof navigator !== "undefined" && "gpu" in navigator;
  const hasWebGL       = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { return false; }
  })();

  if (prefersReduced) {
    // Tier 4: static decorative dot grid only (already rendered as CSS background)
    return;
  }

  if (hasWebGPU) {
    await mountWebGPUTrail(host);
  } else if (hasWebGL) {
    mountWebGLGlow(host);
  } else {
    mountCSSFollower(host);
  }
}

// ─── Tier 1: WebGPU Halftone Trail ────────────────────────────────────────

async function mountWebGPUTrail(host) {
  // Dynamic import keeps the heavy shader module out of the initial bundle
  const { ShaderTrail } = await import("shaders/react").catch(() => null)
    || await import("shaders").catch(() => null)
    || { ShaderTrail: null };

  if (!ShaderTrail) {
    mountWebGLGlow(host);
    return;
  }

  // Node graph order: ChromaFlow -> DotGrid -> ChromaticRipple -> FilmGrain -> Composite -> Output
  const canvas = document.createElement("canvas");
  canvas.className = "cs-shader-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);

  const trail = new ShaderTrail(canvas, {
    nodes: ["ChromaFlow", "DotGrid", "ChromaticRipple", "FilmGrain", "Composite"],
    color: [1, 1, 1],      // white halftone
    dotSize: 3,
    trailLength: 28,
    grainIntensity: 0.04,
  });

  trail.mount();

  // Pause when host is off-screen
  const io = new IntersectionObserver(([e]) => {
    e.isIntersecting ? trail.resume() : trail.pause();
  });
  io.observe(host);

  return () => { trail.destroy(); io.disconnect(); };
}

// ─── Tier 2: WebGL Pointer Glow ───────────────────────────────────────────

function mountWebGLGlow(host) {
  const canvas = document.createElement("canvas");
  canvas.className = "cs-shader-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);

  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) { mountCSSFollower(host); return; }

  let mouseX = -1000, mouseY = -1000;

  const vert = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;
  const frag = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 m  = u_mouse / u_resolution;
      float d = distance(uv, m);
      float glow = smoothstep(0.18, 0.0, d) * 0.35;
      gl_FragColor = vec4(0.024, 0.714, 0.831, glow); // cyan glow
    }
  `;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uRes   = gl.getUniformLocation(prog, "u_resolution");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  window.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = canvas.height - (e.clientY - r.top);
  });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let rafId;
  (function loop() {
    rafId = requestAnimationFrame(loop);
    canvas.width  = host.clientWidth;
    canvas.height = host.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  })();

  return () => { cancelAnimationFrame(rafId); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
}

// ─── Tier 3: CSS Radial Follower ──────────────────────────────────────────

function mountCSSFollower(host) {
  const follower = document.createElement("div");
  follower.className = "cs-cursor-follower";
  follower.setAttribute("aria-hidden", "true");
  host.appendChild(follower);

  let raf;
  let tx = -200, ty = -200, cx = -200, cy = -200;

  window.addEventListener("mousemove", (e) => {
    const r = host.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
  });

  (function loop() {
    raf = requestAnimationFrame(loop);
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    follower.style.transform = `translate(${cx}px, ${cy}px)`;
  })();

  return () => cancelAnimationFrame(raf);
}
