/**
 * Code Scaffold - Ambient Background Drift Field
 * Slow canvas particle drift for hero and section backdrops.
 * Zero dependencies. Device-pixel aware, offscreen pausing,
 * density capped, reduced-motion renders a static frame.
 */

const REDUCED = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function driftField(canvas, options = {}) {
  if (!canvas) return () => {};
  const {
    density = 1 / 16000,
    maxParticles = 90,
    driftPxPerSec = 9,
    sizeRange = [1, 2.6],
    hue = 190
  } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let w = 0;
  let h = 0;
  let parts = [];
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.floor(rect.width * dpr));
    h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = w;
    canvas.height = h;
    const count = Math.min(maxParticles, Math.floor((rect.width * rect.height) * density));
    parts = Array.from({ length: count }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 4,
    r: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    vy: -(driftPxPerSec * (0.5 + Math.random())) / 60,
    vx: (Math.random() - 0.5) * driftPxPerSec / 60,
    a: 0.25 + Math.random() * 0.45
  });
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${p.a})`;
      ctx.fill();
    }
  };
  const step = () => {
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -6 || p.x < -6 || p.x > w + 6) Object.assign(p, spawn(false));
    }
    draw();
  };
  resize();
  window.addEventListener('resize', resize);
  if (REDUCED) {
    draw();
    return () => window.removeEventListener('resize', resize);
  }
  let raf = 0;
  let visible = true;
  const loop = () => {
    if (visible) step();
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { visible = e.isIntersecting; });
  });
  io.observe(canvas);
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener('resize', resize);
  };
}
