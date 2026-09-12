/**
 * Code Scaffold UI Primitives: Rolling Number Flow Ticker
 * Zero-layout-shift animated number ticker using vertical digit reels.
 */
export class NumberFlowTicker {
  constructor(containerElement, initialValue = 0) {
    this.container = containerElement;
    this.value = initialValue;
    this.initDOM();
    this.setValue(this.value);
  }

  initDOM() {
    this.container.innerHTML = '';
    this.container.classList.add('cs-ticker-container');
    this.digits = [];

    // Create 4 digit reel columns (expandable)
    for (let i = 0; i < 4; i++) {
      const col = document.createElement('div');
      col.className = 'cs-digit-col';
      const reel = document.createElement('div');
      reel.className = 'cs-digit-reel';
      for (let d = 0; d <= 9; d++) {
        const span = document.createElement('span');
        span.textContent = d;
        reel.appendChild(span);
      }
      col.appendChild(reel);
      this.container.appendChild(col);
      this.digits.push(reel);
    }
  }

  setValue(newValue) {
    this.value = Math.max(0, Math.min(9999, newValue));
    const str = String(this.value).padStart(4, '0');
    this.digits.forEach((reel, idx) => {
      const digit = parseInt(str[idx], 10);
      reel.style.transform = `translateY(-${digit * 10}%)`;
    });
  }
}
