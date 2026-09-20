/**
 * Code Scaffold - Micro Spring Kit
 * Toast queue controller and pointer burst particles. Zero dependencies.
 * Respects prefers-reduced-motion; toasts announce via aria-live.
 */

const REDUCED = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function toastQueue(region, options = {}) {
  if (!region) return () => {};
  const { durationMs = 3600, maxVisible = 3 } = options;
  region.setAttribute('aria-live', 'polite');
  const timers = new Map();
  const show = (message) => {
    while (region.children.length >= maxVisible) region.firstChild.remove();
    const el = document.createElement('div');
    el.className = 'cs-toast';
    el.textContent = message;
    region.appendChild(el);
    if (!REDUCED) {
      requestAnimationFrame(() => el.classList.add('cs-toast-in'));
    } else {
      el.classList.add('cs-toast-in');
    }
    timers.set(el, setTimeout(() => dismiss(el), durationMs));
  };
  const dismiss = (el) => {
    clearTimeout(timers.get(el));
    timers.delete(el);
    if (REDUCED || !el.isConnected) {
      el.remove();
      return;
    }
    el.classList.remove('cs-toast-in');
    setTimeout(() => el.remove(), 240);
  };
  return { show, dismiss };
}

export function pointerBurst(host, options = {}) {
  if (!host) return () => {};
  const { particles = 10, distancePx = 46, durationMs = 520 } = options;
  if (REDUCED) return () => {};
  const onDown = (e) => {
    const rect = host.getBoundingClientRect();
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
    for (let i = 0; i < particles; i++) {
      const p = document.createElement('span');
      p.className = 'cs-burst-p';
      p.setAttribute('aria-hidden', 'true');
      const ang = (i / particles) * Math.PI * 2 + Math.random() * 0.5;
      const dist = distancePx * (0.55 + Math.random() * 0.45);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      host.appendChild(p);
      p.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: '0' }
      ], { duration: durationMs, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => p.remove();
    }
  };
  host.classList.add('cs-burst-host');
  host.addEventListener('pointerdown', onDown);
  return () => host.removeEventListener('pointerdown', onDown);
}
