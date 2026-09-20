/**
 * Code Scaffold - Component Motion Expansion
 * Pixel-dissolve card reveal, fanned card stack, staggered masonry entrance.
 * Zero dependencies. IntersectionObserver gating, reduced-motion fallbacks.
 */

const REDUCED = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function pixelDissolve(card, options = {}) {
  if (!card) return () => {};
  const { cellPx = 14, durationMs = 700, staggerMs = 12 } = options;
  if (REDUCED) {
    card.classList.add('cs-dissolved');
    return () => {};
  }
  const rect = card.getBoundingClientRect();
  const cols = Math.max(1, Math.ceil(rect.width / cellPx));
  const rows = Math.max(1, Math.ceil(rect.height / cellPx));
  const veil = document.createElement('div');
  veil.className = 'cs-pixel-veil';
  veil.setAttribute('aria-hidden', 'true');
  veil.style.setProperty('--cs-cols', cols);
  veil.style.setProperty('--cs-rows', rows);
  for (let i = 0; i < cols * rows; i++) {
    const cell = document.createElement('span');
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    cell.style.transitionDelay = `${(cx + cy) * staggerMs}ms`;
    veil.appendChild(cell);
  }
  card.appendChild(veil);
  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    requestAnimationFrame(() => {
      veil.classList.add('cs-dissolving');
      setTimeout(() => veil.remove(), durationMs + (cols + rows) * staggerMs + 60);
    });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        play();
        io.disconnect();
      }
    });
  }, { threshold: 0.25 });
  io.observe(card);
  card.classList.add('cs-dissolved');
  return () => io.disconnect();
}

export function cardStack(stack, options = {}) {
  if (!stack) return () => {};
  const { fanDeg = 7, spreadPx = 26, activeIndex = 0 } = options;
  const cards = Array.from(stack.querySelectorAll(':scope > *'));
  const layout = (active) => {
    cards.forEach((c, i) => {
      const offset = i - active;
      c.style.setProperty('--cs-stack-rot', `${offset * fanDeg}deg`);
      c.style.setProperty('--cs-stack-x', `${offset * spreadPx}px`);
      c.style.zIndex = String(cards.length - Math.abs(offset));
      c.classList.toggle('cs-stack-active', i === active);
    });
  };
  layout(activeIndex);
  cards.forEach((c, i) => {
    c.addEventListener('click', () => layout(i));
  });
  return () => {};
}

export function masonryReveal(grid, options = {}) {
  if (!grid) return () => {};
  const { staggerMs = 60, risePx = 24 } = options;
  const items = Array.from(grid.querySelectorAll(':scope > *'));
  if (REDUCED) {
    items.forEach((el) => { el.style.opacity = '1'; });
    return () => {};
  }
  items.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = `translateY(${risePx}px)`;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const el = e.target;
        const idx = items.indexOf(el);
        el.animate(
          [{ opacity: '0', transform: `translateY(${risePx}px)` }, { opacity: '1', transform: 'translateY(0px)' }],
          { duration: 500, delay: idx * staggerMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
        );
        io.unobserve(el);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px 40px 0px' });
  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
