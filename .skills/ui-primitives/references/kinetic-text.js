/**
 * Code Scaffold - Kinetic Typography & 3D Perspective Tilt
 * Hacker scramble text decoder, split-letter blur-in, and interactive 3D perspective card tilt.
 */

const GLYPHS = "ABCDEF0123456789!@#$%^&*()_+<>[]{}~";

export function scrambleText(element, finalText, duration = 800) {
  if (!element) return;
  const originalText = finalText || element.innerText;
  const length = originalText.length;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const resolvedCount = Math.floor(progress * length);

    let output = "";
    for (let i = 0; i < length; i++) {
      if (i < resolvedCount) {
        output += originalText[i];
      } else if (originalText[i] === " ") {
        output += " ";
      } else {
        output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
    }

    element.innerText = output;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

export function init3DTilt(cardElement, maxTiltDeg = 15) {
  if (!cardElement) return;

  function onMouseMove(e) {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTiltDeg;
    const tiltY = ((x - centerX) / centerX) * maxTiltDeg;

    cardElement.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

    // Dynamic specular glare calculation
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    cardElement.style.setProperty('--glare-pos', `${glareX}% ${glareY}%`);
  }

  function onMouseLeave() {
    cardElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  cardElement.addEventListener('mousemove', onMouseMove);
  cardElement.addEventListener('mouseleave', onMouseLeave);

  return () => {
    cardElement.removeEventListener('mousemove', onMouseMove);
    cardElement.removeEventListener('mouseleave', onMouseLeave);
  };
}
