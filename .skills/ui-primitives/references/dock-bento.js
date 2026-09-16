/**
 * Code Scaffold - Spring Dock Magnification & Spotlight Tracker
 */

export function initSpringDock(dockElement) {
  if (!dockElement) return;

  const items = dockElement.querySelectorAll('.cs-dock-item');
  const maxDistance = 140; // Pixel radius for influence
  const maxScale = 1.6;
  const baseScale = 1.0;

  function onMouseMove(e) {
    const mouseX = e.clientX;

    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - itemCenterX);

      if (distance < maxDistance) {
        // Cosine / Gaussian smooth interpolation
        const factor = (Math.cos((distance / maxDistance) * Math.PI) + 1) / 2;
        const scale = baseScale + (maxScale - baseScale) * factor;
        item.style.transform = `scale(${scale})`;
      } else {
        item.style.transform = `scale(${baseScale})`;
      }
    });
  }

  function onMouseLeave() {
    items.forEach(item => {
      item.style.transform = `scale(${baseScale})`;
    });
  }

  dockElement.addEventListener('mousemove', onMouseMove);
  dockElement.addEventListener('mouseleave', onMouseLeave);

  return () => {
    dockElement.removeEventListener('mousemove', onMouseMove);
    dockElement.removeEventListener('mouseleave', onMouseLeave);
  };
}

export function initSpotlightCards(selector = '.cs-bento-card') {
  const cards = document.querySelectorAll(selector);

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}
