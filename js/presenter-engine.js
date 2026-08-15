/**
 * SlideMAKER - Fullscreen Presenter Engine
 * Slideshow Mode, Laser Pointer, Timer, Keyboard navigation & Transitions
 */

class PresenterEngine {
  constructor() {
    this.isActive = false;
    this.currentSlideIndex = 0;
    this.isLaserActive = false;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.hudTimeout = null;

    this.container = null;
    this.slideStage = null;
    this.laserPointer = null;
  }

  init() {
    this.createPresenterDOM();
    this.bindEvents();
  }

  createPresenterDOM() {
    this.container = document.createElement('div');
    this.container.id = 'presenter-container';
    this.container.className = 'presenter-container is-hidden';

    this.container.innerHTML = `
      <div id="presenter-viewport" class="presenter-viewport">
        <div id="presenter-slide-stage" class="presenter-slide-stage">
          <div id="presenter-bg" class="slide-background"></div>
          <div id="presenter-elements" class="presenter-elements-layer"></div>
        </div>
      </div>

      <!-- Laser Pointer Element -->
      <div id="laser-pointer-cursor" class="laser-pointer-dot"></div>

      <!-- Floating Presenter HUD Bar -->
      <div id="presenter-hud" class="presenter-hud">
        <button id="hud-btn-prev" class="hud-btn" title="Previous Slide (Left Arrow)"><i class="fa-solid fa-chevron-left"></i></button>
        <span id="hud-slide-counter" class="hud-counter">1 / 1</span>
        <button id="hud-btn-next" class="hud-btn" title="Next Slide (Right Arrow / Space)"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="hud-divider"></div>
        <button id="hud-btn-laser" class="hud-btn" title="Virtual Laser Pointer (L Key)"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
        <div id="hud-timer-badge" class="hud-timer" title="Presentation Timer"><i class="fa-regular fa-clock"></i> 00:00</div>
        <button id="hud-btn-exit" class="hud-btn hud-btn-exit" title="Exit Fullscreen (Esc)"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;

    document.body.appendChild(this.container);
    this.slideStage = document.getElementById('presenter-slide-stage');
    this.laserPointer = document.getElementById('laser-pointer-cursor');
  }

  bindEvents() {
    const startBtn = document.getElementById('btn-start-presentation');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startPresentation());
    }

    document.getElementById('hud-btn-prev')?.addEventListener('click', () => this.prevSlide());
    document.getElementById('hud-btn-next')?.addEventListener('click', () => this.nextSlide());
    document.getElementById('hud-btn-exit')?.addEventListener('click', () => this.exitPresentation());
    document.getElementById('hud-btn-laser')?.addEventListener('click', () => this.toggleLaser());

    window.addEventListener('keydown', (e) => {
      if (!this.isActive) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        this.nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prevSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.exitPresentation();
      } else if (e.key === 'l' || e.key === 'L') {
        this.toggleLaser();
      } else if (e.key === 'Home') {
        this.goToSlide(0);
      } else if (e.key === 'End') {
        this.goToSlide(window.state.slides.length - 1);
      }
    });

    this.container.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;

      if (this.isLaserActive && this.laserPointer) {
        this.laserPointer.style.left = `${e.clientX}px`;
        this.laserPointer.style.top = `${e.clientY}px`;
      }

      this.showHudBriefly();
    });

    window.addEventListener('resize', () => {
      if (this.isActive) {
        this.scalePresenterStage();
      }
    });
  }

  startPresentation(startIndex = null) {
    this.isActive = true;
    this.currentSlideIndex = startIndex !== null ? startIndex : window.state.activeSlideIndex;
    this.container.classList.remove('is-hidden');

    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    this.timerSeconds = 0;
    this.startTimer();

    this.scalePresenterStage();
    this.renderCurrentSlide();
    this.showHudBriefly();
  }

  exitPresentation() {
    this.isActive = false;
    this.container.classList.add('is-hidden');
    this.stopTimer();

    if (this.isLaserActive) {
      this.toggleLaser();
    }

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    window.state.setActiveSlideIndex(this.currentSlideIndex);
  }

  nextSlide() {
    if (this.currentSlideIndex < window.state.slides.length - 1) {
      this.goToSlide(this.currentSlideIndex + 1);
    }
  }

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.goToSlide(this.currentSlideIndex - 1);
    }
  }

  goToSlide(index) {
    if (index >= 0 && index < window.state.slides.length) {
      this.currentSlideIndex = index;
      this.renderCurrentSlide();
    }
  }

  toggleLaser() {
    this.isLaserActive = !this.isLaserActive;
    if (this.laserPointer) {
      this.laserPointer.style.display = this.isLaserActive ? 'block' : 'none';
    }
    const btn = document.getElementById('hud-btn-laser');
    if (btn) {
      btn.classList.toggle('is-active', this.isLaserActive);
    }
    if (this.container) {
      this.container.style.cursor = this.isLaserActive ? 'none' : 'default';
    }
  }

  scalePresenterStage() {
    if (!this.slideStage) return;
    const dims = CONFIG.aspectRatios[window.state.aspectRatio] || CONFIG.aspectRatios['a4_landscape'];
    this.slideStage.style.width = `${dims.width}px`;
    this.slideStage.style.height = `${dims.height}px`;

    const availW = window.innerWidth;
    const availH = window.innerHeight;
    const scale = Math.min(availW / dims.width, availH / dims.height);

    this.slideStage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  renderCurrentSlide() {
    const slide = window.state.slides[this.currentSlideIndex];
    if (!slide) return;

    // 1. Render Background
    const bgEl = document.getElementById('presenter-bg');
    const bg = slide.background || { type: 'color', value: '#FFFFFF' };
    if (bgEl) {
      bgEl.style.backgroundImage = 'none';
      bgEl.style.backgroundColor = 'transparent';

      if (bg.type === 'pdf' || bg.type === 'image') {
        bgEl.style.backgroundImage = `url("${bg.value}")`;
        bgEl.style.backgroundSize = 'cover';
        bgEl.style.backgroundPosition = 'center';
      } else if (bg.type === 'gradient') {
        bgEl.style.backgroundImage = bg.value;
      } else {
        bgEl.style.backgroundColor = bg.value || '#FFFFFF';
      }
    }

    // 2. Render Elements
    const elementsLayer = document.getElementById('presenter-elements');
    if (elementsLayer) {
      elementsLayer.innerHTML = '';
      slide.elements.forEach(el => {
        const dom = window.canvasEngine.createElementDOM(el);
        dom.style.cursor = 'default';
        dom.onmousedown = null;
        elementsLayer.appendChild(dom);

        if (el.type === 'chart') {
          const canvas = dom.querySelector('canvas');
          if (canvas && typeof Chart !== 'undefined') {
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
              type: el.chartType || 'bar',
              data: {
                labels: el.labels || ['A', 'B', 'C'],
                datasets: el.datasets || [{ label: 'Data', data: [10, 20, 30] }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 }
              }
            });
          }
        }
      });
    }

    // 3. Update HUD Counter
    const counter = document.getElementById('hud-slide-counter');
    if (counter) {
      counter.textContent = `${this.currentSlideIndex + 1} / ${window.state.slides.length}`;
    }
  }

  showHudBriefly() {
    const hud = document.getElementById('presenter-hud');
    if (!hud) return;
    hud.classList.remove('is-hidden');

    if (this.hudTimeout) clearTimeout(this.hudTimeout);
    this.hudTimeout = setTimeout(() => {
      if (this.isActive) {
        hud.classList.add('is-hidden');
      }
    }, 2800);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
      const secs = String(this.timerSeconds % 60).padStart(2, '0');
      const badge = document.getElementById('hud-timer-badge');
      if (badge) {
        badge.innerHTML = `<i class="fa-regular fa-clock"></i> ${mins}:${secs}`;
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

window.PresenterEngine = PresenterEngine;
