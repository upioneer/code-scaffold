/**
 * Code Scaffold UI Primitives: Quantum Thinking Orb Engine
 * Lightweight, zero-dependency HTML5 Canvas reasoning visualizer.
 */
export class ThinkingOrb {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.state = options.initialState || 'listening';
    this.size = options.size || 120;
    
    this.states = {
      listening: { colors: ['#38bdf8', '#818cf8', '#0284c7'], speed: 0.02, pulse: 1.0 },
      working:   { colors: ['#fbbf24', '#f59e0b', '#d97706'], speed: 0.05, pulse: 1.3 },
      searching: { colors: ['#22d3ee', '#38bdf8', '#0ea5e9'], speed: 0.04, pulse: 1.2 },
      solving:   { colors: ['#34d399', '#10b981', '#059669'], speed: 0.06, pulse: 1.4 },
      composing: { colors: ['#f472b6', '#e879f9', '#c084fc'], speed: 0.03, pulse: 1.1 },
      shaping:   { colors: ['#a78bfa', '#6366f1', '#4338ca'], speed: 0.04, pulse: 1.25 }
    };

    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  setState(newState) {
    if (this.states[newState]) {
      this.state = newState;
    }
  }

  animate() {
    const ctx = this.ctx;
    const cfg = this.states[this.state] || this.states.listening;
    this.time += cfg.speed;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const baseRadius = (this.size * 0.3) + Math.sin(this.time * 2) * (3 * cfg.pulse);

    // Ambient glow
    const glowGrad = ctx.createRadialGradient(
      centerX, centerY, baseRadius * 0.4,
      centerX, centerY, baseRadius * 1.6
    );
    glowGrad.addColorStop(0, cfg.colors[0] + '77');
    glowGrad.addColorStop(0.6, cfg.colors[1] + '33');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Core fluid plasma
    const coreGrad = ctx.createRadialGradient(
      centerX + Math.cos(this.time) * (baseRadius * 0.2),
      centerY + Math.sin(this.time) * (baseRadius * 0.2),
      2,
      centerX,
      centerY,
      baseRadius
    );
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, cfg.colors[0]);
    coreGrad.addColorStop(0.7, cfg.colors[1]);
    coreGrad.addColorStop(1, cfg.colors[2]);

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    this.rafId = requestAnimationFrame(this.animate);
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
