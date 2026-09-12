/**
 * Synchronized Media Comparison Stage Controller
 * Code Scaffold Specification Schema: https://code-scaffold.com/spec/v1
 * 
 * Orchestrates synchronized playback, layout switching (split, stack, spotlight),
 * aspect ratio framing (16:9, 9:16, 1:1), timecode scrubbing, and keyboard shortcuts.
 */

class ComparisonStageController {
  constructor(stageElement, options = {}) {
    this.stage = stageElement;
    this.options = Object.assign({
      initialLook: 'studio',
      initialFormat: '16-9',
      initialLayout: 'split',
      durationSeconds: 15.0,
      autoPlay: true,
      loop: true
    }, options);

    this.currentTime = 0.0;
    this.duration = this.options.durationSeconds;
    this.isPlaying = false;
    this.animationId = null;
    this.lastTimestamp = 0;

    this.primaryMedia = this.stage.querySelector('.cs-media-primary');
    this.secondaryMedia = this.stage.querySelector('.cs-media-secondary');
    this.timecodeEl = this.stage.querySelector('.cs-timecode');
    this.scrubTrack = this.stage.querySelector('.cs-scrub-track');
    this.scrubProgress = this.stage.querySelector('.cs-scrub-progress');
    this.playBtn = this.stage.querySelector('.cs-play-btn');

    this.init();
  }

  init() {
    this.setLook(this.options.initialLook);
    this.setFormat(this.options.initialFormat);
    this.setLayout(this.options.initialLayout);

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.scrubTrack) {
      this.scrubTrack.addEventListener('click', (e) => this.handleScrub(e));
    }

    this.bindKeyboardShortcuts();

    if (this.options.autoPlay) {
      this.play();
    }
  }

  setLook(lookName) {
    this.stage.dataset.motionLook = lookName;
    const cards = document.querySelectorAll('.cs-preset-card');
    cards.forEach(c => {
      const isMatch = c.dataset.look === lookName;
      c.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
  }

  setFormat(formatName) {
    this.stage.dataset.format = formatName;
  }

  setLayout(layoutName) {
    this.stage.dataset.layout = layoutName;
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    if (this.playBtn) this.playBtn.textContent = 'Pause';
    this.tick();
  }

  pause() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.playBtn) this.playBtn.textContent = 'Play';
  }

  restart() {
    this.currentTime = 0.0;
    this.updateUI();
  }

  tick() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.currentTime += delta;
    if (this.currentTime >= this.duration) {
      if (this.options.loop) {
        this.currentTime = 0.0;
      } else {
        this.currentTime = this.duration;
        this.pause();
      }
    }

    this.updateUI();
    this.animationId = requestAnimationFrame(() => this.tick());
  }

  handleScrub(event) {
    const rect = this.scrubTrack.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    this.currentTime = ratio * this.duration;
    this.updateUI();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  updateUI() {
    const ratio = Math.max(0, Math.min(this.currentTime / this.duration, 1.0));
    if (this.scrubProgress) {
      this.scrubProgress.style.width = `${ratio * 100}%`;
    }
    if (this.timecodeEl) {
      this.timecodeEl.textContent = `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
    }
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Space: toggle play/pause
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        this.togglePlay();
      }
      // R: restart playback
      if (e.code === 'KeyR' && e.target === document.body) {
        e.preventDefault();
        this.restart();
      }
    });
  }

  dispose() {
    this.pause();
  }
}

// Global browser / module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComparisonStageController };
} else {
  window.ComparisonStageController = ComparisonStageController;
}
