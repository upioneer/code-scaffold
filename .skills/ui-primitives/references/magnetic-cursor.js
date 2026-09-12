/**
 * Code Scaffold UI Primitives: Magnetic Cursor & Pointer Snapping
 * High-performance pointer tracking with spring physics on interactive elements.
 */
export class MagneticCursor {
  constructor(options = {}) {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    this.cursor = document.createElement('div');
    this.cursor.className = 'cs-custom-cursor';
    document.body.appendChild(this.cursor);

    this.pos = { x: -100, y: -100 };
    this.target = { x: -100, y: -100 };
    this.ease = options.ease || 0.22;

    window.addEventListener('mousemove', (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    });

    this.bindHoverElements();
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  bindHoverElements() {
    document.querySelectorAll('[data-magnetic], button, a, input').forEach((el) => {
      el.addEventListener('mouseenter', () => this.cursor.classList.add('active'));
      el.addEventListener('mouseleave', () => this.cursor.classList.remove('active'));

      if (el.hasAttribute('data-magnetic')) {
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) * 0.25;
          const dy = (e.clientY - cy) * 0.25;
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translate3d(0, 0, 0)';
          el.style.transition = 'transform 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)';
        });
      }
    });
  }

  render() {
    this.pos.x += (this.target.x - this.pos.x) * this.ease;
    this.pos.y += (this.target.y - this.pos.y) * this.ease;
    this.cursor.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
    requestAnimationFrame(this.render);
  }
}
