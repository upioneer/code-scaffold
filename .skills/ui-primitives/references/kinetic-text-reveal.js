/**
 * Code Scaffold - Kinetic Typography Reveal System
 * Staggered blur/rise reveals, typewriter, and circular rotating text.
 * Zero dependencies. IntersectionObserver gating, Web Animations API,
 * fixed structural bounds (no layout shift), reduced-motion fallbacks.
 */

const REDUCED = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitSegments(element, by) {
  const text = element.textContent;
  element.textContent = '';
  element.setAttribute('aria-label', text);
  const parts = by === 'chars' ? Array.from(text) : text.split(' ');
  const spans = parts.map((part) => {
    const s = document.createElement('span');
    s.className = 'cs-reveal-seg';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = part === ' ' ? '\u00A0' : part;
    element.appendChild(s);
    if (by === 'words') element.appendChild(document.createTextNode(' '));
    return s;
  });
  return spans;
}

export function staggerReveal(element, options = {}) {
  if (!element) return () => {};
  const {
    by = 'words',
    blurPx = 10,
    risePx = 28,
    staggerMs = 45,
    durationMs = 550,
    overshootPx = 5,
    once = true
  } = options;
  const spans = splitSegments(element, by);
  if (REDUCED) {
    spans.forEach((s) => { s.style.opacity = '1'; });
    return () => {};
  }
  spans.forEach((s) => {
    s.style.opacity = '0';
    s.style.filter = `blur(${blurPx}px)`;
    s.style.transform = `translateY(${risePx}px)`;
  });
  let done = false;
  const play = () => {
    if (done && once) return;
    done = true;
    spans.forEach((s, i) => {
      s.animate([
        { opacity: '0', filter: `blur(${blurPx}px)`, transform: `translateY(${risePx}px)` },
        { opacity: '0.6', filter: `blur(${blurPx / 2}px)`, transform: `translateY(${-overshootPx}px)`, offset: 0.7 },
        { opacity: '1', filter: 'blur(0px)', transform: 'translateY(0px)' }
      ], { duration: durationMs, delay: i * staggerMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
    });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        play();
        if (once) io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(element);
  return () => io.disconnect();
}

export function typewriter(element, options = {}) {
  if (!element) return () => {};
  const {
    text = element.textContent,
    charsPerSecond = 28,
    caret = true,
    minLines = 1
  } = options;
  const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 24;
  element.style.minHeight = `${lineHeight * minLines}px`;
  element.setAttribute('aria-label', text);
  if (REDUCED) {
    element.textContent = text;
    return () => {};
  }
  element.textContent = '';
  if (caret) element.classList.add('cs-type-caret');
  let i = 0;
  let last = performance.now();
  let raf = 0;
  const step = (now) => {
    const budget = ((now - last) / 1000) * charsPerSecond;
    last = now;
    i = Math.min(text.length, i + budget);
    element.textContent = text.slice(0, Math.floor(i));
    if (caret) element.classList.add('cs-type-caret');
    if (i < text.length) {
      raf = requestAnimationFrame(step);
    } else if (caret) {
      setTimeout(() => element.classList.remove('cs-type-caret'), 1200);
    }
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        last = performance.now();
        raf = requestAnimationFrame(step);
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(element);
  return () => { cancelAnimationFrame(raf); io.disconnect(); };
}

export function circularText(element, options = {}) {
  if (!element) return () => {};
  const {
    text = element.textContent.trim(),
    radius = 90,
    degreesPerSecond = 12,
    clockwise = true
  } = options;
  const size = radius * 2 + 40;
  const uid = `cs-circ-${Math.floor(Math.random() * 1e9).toString(36)}`;
  element.setAttribute('aria-label', text);
  element.classList.add('cs-circular-text');
  element.innerHTML =
    `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">` +
    `<defs><path id="${uid}" d="M ${size / 2},${size / 2} m ${-radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 ${-radius * 2},0"/></defs>` +
    `<text><textPath href="#${uid}">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textPath></text></svg>`;
  const svg = element.querySelector('svg');
  if (REDUCED) return () => {};
  let angle = 0;
  let last = performance.now();
  let raf = 0;
  let visible = true;
  const tick = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    if (visible) {
      angle = (angle + (clockwise ? 1 : -1) * degreesPerSecond * dt) % 360;
      svg.style.transform = `rotate(${angle}deg)`;
    }
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { visible = e.isIntersecting; });
  });
  io.observe(element);
  raf = requestAnimationFrame((t) => { last = t; tick(t); });
  return () => { cancelAnimationFrame(raf); io.disconnect(); };
}
