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

    this.isTransitioning = false;
    this.activeFlowSlideId = null;
    this.slideOverlay = null;
    this.currentZoomController = null;
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

      <!-- Floating Presenter Zoom HUD (Active on Zoom Flow Slides) -->
      <div id="presenter-zoom-hud" class="presenter-zoom-hud is-hidden">
        <button id="pzh-prev-btn" class="hud-btn" style="width:30px;height:30px;font-size:11px;" title="Previous Node (Left Arrow)"><i class="fa-solid fa-chevron-left"></i></button>
        <div id="pzh-counter" class="zf-hud-counter">
          <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--udes-lime);"></i>
          <span id="pzh-label">Diagram Overview</span>
        </div>
        <button id="pzh-next-btn" class="hud-btn" style="width:30px;height:30px;font-size:11px;" title="Next Node (Right Arrow / Space)"><i class="fa-solid fa-chevron-right"></i></button>
        <div class="hud-divider"></div>
        <div id="pzh-dots" class="zf-hud-dots"></div>
        <div class="hud-divider"></div>
        <button id="pzh-overview-btn" class="btn btn-secondary btn-sm" style="padding:3px 9px;font-size:11px;" title="Zoom Out to Overview (O Key)">
          <i class="fa-solid fa-expand"></i> Overview
        </button>
      </div>

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

    // Zoom Flow HUD buttons
    document.getElementById('pzh-prev-btn')?.addEventListener('click', () => {
      this.prevSlide();
    });
    document.getElementById('pzh-next-btn')?.addEventListener('click', () => {
      this.nextSlide();
    });
    document.getElementById('pzh-overview-btn')?.addEventListener('click', () => {
      this.goToOverview();
    });

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
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        this.goToOverview();
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

  goToOverview() {
    if (this.isTransitioning) return;
    const currentSlide = window.state.slides[this.currentSlideIndex];
    if (currentSlide) {
      if (currentSlide.isZoomFlow) {
        if (this.currentZoomController) {
          this.currentZoomController.zoomOutToOverview();
        }
        return;
      }
      if (currentSlide.parentFlowSlideId) {
        const parentIdx = window.state.slides.findIndex(s => s.id === currentSlide.parentFlowSlideId);
        if (parentIdx !== -1) {
          this.goToSlide(parentIdx);
          return;
        }
      }
    }
    const anyFlowIdx = window.state.slides.findIndex(s => s.isZoomFlow);
    if (anyFlowIdx !== -1) {
      this.goToSlide(anyFlowIdx);
    }
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

    this.isTransitioning = false;
    this.activeFlowSlideId = null;
    this.slideOverlay = null;
    this.currentZoomController = null;

    window.state.setActiveSlideIndex(this.currentSlideIndex);
  }

  nextSlide() {
    if (this.isTransitioning) return;
    if (this.currentSlideIndex < window.state.slides.length - 1) {
      this.goToSlide(this.currentSlideIndex + 1);
    }
  }

  prevSlide() {
    if (this.isTransitioning) return;
    if (this.currentSlideIndex > 0) {
      this.goToSlide(this.currentSlideIndex - 1);
    }
  }

  goToSlide(index) {
    if (this.isTransitioning) return;
    if (index < 0 || index >= window.state.slides.length) return;
    if (index === this.currentSlideIndex) return;

    const prevIndex = this.currentSlideIndex;
    const prevSlide = window.state.slides[prevIndex];
    const targetSlide = window.state.slides[index];

    const getFlowId = (s) => {
      if (!s) return null;
      if (s.isZoomFlow) return s.id;
      if (s.isFlowChild) return s.parentFlowSlideId;
      return null;
    };

    const prevFlowId = getFlowId(prevSlide);
    const targetFlowId = getFlowId(targetSlide);

    // If navigating within the same Zoom Flow family, run cinematic camera transitions!
    if (prevFlowId && targetFlowId && prevFlowId === targetFlowId && this.currentZoomController) {
      const fromNodeIdx = prevSlide.isZoomFlow ? -1 : (prevSlide.flowNodeIndex !== undefined ? prevSlide.flowNodeIndex : -1);
      const toNodeIdx = targetSlide.isZoomFlow ? -1 : (targetSlide.flowNodeIndex !== undefined ? targetSlide.flowNodeIndex : -1);

      if (fromNodeIdx !== toNodeIdx) {
        this.isTransitioning = true;
        this.currentSlideIndex = index;

        // Fade out existing slide overlay if any and crossfade thumbnail card in
        if (this.currentZoomController && typeof this.currentZoomController.setSlideOverlayState === 'function') {
          this.currentZoomController.setSlideOverlayState(false);
        }
        if (this.slideOverlay && this.slideOverlay.children.length > 0) {
          this.slideOverlay.classList.remove('zf-slide-fade-enter');
          this.slideOverlay.classList.add('zf-slide-fade-exit');
        }

        setTimeout(() => {
          if (this.slideOverlay) {
            this.slideOverlay.innerHTML = '';
            this.slideOverlay.classList.remove('zf-slide-fade-exit');
            if (toNodeIdx === -1) {
              this.slideOverlay.style.display = 'none';
              this.slideOverlay.style.pointerEvents = 'none';
            }
          }

          this.currentZoomController.transitionSlideChange(fromNodeIdx, toNodeIdx, () => {
            if (toNodeIdx >= 0) {
              this.renderSlideOverlay(targetSlide);
            }
            this.isTransitioning = false;
            this.updatePresenterHUD();
            this.syncPresenterZoomHUD(toNodeIdx, toNodeIdx >= 0 ? targetSlide : null);
          });
        }, fromNodeIdx >= 0 ? 180 : 0);
        return;
      }
    }

    // Normal slide transition (different slides)
    this.currentSlideIndex = index;
    this.renderCurrentSlide();
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

    const bgEl = document.getElementById('presenter-bg');
    const elementsLayer = document.getElementById('presenter-elements');
    const zoomHud = document.getElementById('presenter-zoom-hud');

    const getFlowId = (s) => {
      if (!s) return null;
      if (s.isZoomFlow) return s.id;
      if (s.isFlowChild) return s.parentFlowSlideId;
      return null;
    };

    const flowId = getFlowId(slide);

    // If this slide is part of a Zoom Flow family (parent or child)
    if (flowId && window.zoomFlowEngine) {
      const parentFlowSlide = slide.isZoomFlow
        ? slide
        : window.state.slides.find(s => s.id === flowId) || slide;

      const themeKey = parentFlowSlide.zoomFlowData?.theme || 'udes-emerald';
      const theme = window.zoomFlowEngine.THEMES[themeKey] || window.zoomFlowEngine.THEMES['udes-emerald'];

      if (bgEl) {
        bgEl.style.backgroundImage = 'none';
        bgEl.style.background = theme.background;
      }

      // If we don't have the controller mounted yet or it's a different flow:
      if (!this.currentZoomController || this.activeFlowSlideId !== flowId) {
        this.activeFlowSlideId = flowId;
        elementsLayer.innerHTML = '';
        const dims = CONFIG.aspectRatios[window.state.aspectRatio] || CONFIG.aspectRatios['16_9'];
        const controller = window.zoomFlowEngine.createZoomFlowDOM(parentFlowSlide.zoomFlowData, {
          isPresenter: true,
          flowSlideId: parentFlowSlide.id,
          width: dims.width,
          height: dims.height,
          onNodeChange: (idx, node) => this.syncPresenterZoomHUD(idx, node)
        });

        elementsLayer.appendChild(controller.wrapper);
        this.currentZoomController = controller;

        // Overlay container on top of the flow stage for child slide elements
        this.slideOverlay = document.createElement('div');
        this.slideOverlay.className = 'zf-slide-overlay';
        this.slideOverlay.style.display = 'none';
        this.slideOverlay.style.pointerEvents = 'none';
        elementsLayer.appendChild(this.slideOverlay);
      }

      // Show Zoom HUD
      if (zoomHud) {
        zoomHud.classList.remove('is-hidden');
        this.buildZoomHUDDots(parentFlowSlide.zoomFlowData?.nodes || []);
      }

      if (slide.isZoomFlow) {
        if (this.currentZoomController && typeof this.currentZoomController.setSlideOverlayState === 'function') {
          this.currentZoomController.setSlideOverlayState(false);
        }
        if (this.slideOverlay) {
          this.slideOverlay.innerHTML = '';
          this.slideOverlay.classList.remove('zf-slide-fade-enter', 'zf-slide-fade-exit');
          this.slideOverlay.style.display = 'none';
          this.slideOverlay.style.pointerEvents = 'none';
        }
        this.currentZoomController.zoomOutToOverview();
        this.syncPresenterZoomHUD(-1, null);
      } else {
        const nodeIdx = slide.flowNodeIndex !== undefined ? slide.flowNodeIndex : 0;
        this.currentZoomController.zoomToNodeFullscreen(nodeIdx, () => {
          this.renderSlideOverlay(slide);
          this.syncPresenterZoomHUD(nodeIdx, slide);
        });
      }

      this.updatePresenterHUD();
      return;
    }

    // Completely non-flow slide
    this.activeFlowSlideId = null;
    this.currentZoomController = null;
    this.slideOverlay = null;
    if (zoomHud) zoomHud.classList.add('is-hidden');

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

    this.updatePresenterHUD();
  }

  renderSlideOverlay(slide) {
    if (!this.slideOverlay) return;
    this.slideOverlay.innerHTML = '';
    this.slideOverlay.style.display = 'block';
    this.slideOverlay.style.pointerEvents = 'auto';
    this.slideOverlay.className = 'zf-slide-overlay zf-slide-fade-enter';

    if (this.currentZoomController && typeof this.currentZoomController.setSlideOverlayState === 'function') {
      this.currentZoomController.setSlideOverlayState(true);
    }

    slide.elements.forEach(el => {
      const dom = window.canvasEngine.createElementDOM(el);
      dom.style.cursor = 'default';
      dom.onmousedown = null;
      this.slideOverlay.appendChild(dom);

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

    // Return Breadcrumb banner on top
    const banner = document.createElement('div');
    banner.className = 'zf-child-breadcrumb-banner';
    banner.style.zIndex = '2000';
    banner.style.pointerEvents = 'auto';
    banner.innerHTML = `
      <i class="fa-solid fa-arrow-left" style="color:var(--udes-lime);font-size:12px;"></i>
      <span>Return to Flow Diagram</span>
    `;
    banner.title = 'Return to the Main Flow Diagram';
    banner.addEventListener('click', (e) => {
      e.stopPropagation();
      this.goToOverview();
    });
    this.slideOverlay.appendChild(banner);
  }

  updatePresenterHUD() {
    const counter = document.getElementById('hud-slide-counter');
    if (counter) {
      counter.textContent = `${this.currentSlideIndex + 1} / ${window.state.slides.length}`;
    }
  }

  buildZoomHUDDots(nodes = []) {
    const dotsContainer = document.getElementById('pzh-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';

    nodes.forEach((n, idx) => {
      const dot = document.createElement('div');
      dot.className = 'zf-hud-dot';
      dot.title = `Jump to ${n.title}`;
      dot.addEventListener('click', () => {
        const targetSlideIdx = window.state.slides.findIndex(s =>
          (s.parentFlowSlideId === this.activeFlowSlideId || s.isFlowChild) &&
          (s.flowNodeIndex === idx || s.flowNodeId === n.id)
        );
        if (targetSlideIdx !== -1) {
          this.goToSlide(targetSlideIdx);
        }
      });
      dotsContainer.appendChild(dot);
    });
  }

  syncPresenterZoomHUD(nodeIndex, node) {
    const label = document.getElementById('pzh-label');
    const dots = document.querySelectorAll('#pzh-dots .zf-hud-dot');

    if (label) {
      if (nodeIndex === -1 || !node) {
        label.textContent = 'Diagram Overview';
      } else {
        const title = node.title || node.flowNodeTitle || 'Stage ' + (nodeIndex + 1);
        label.textContent = `${nodeIndex + 1}/${dots.length}: ${title}`;
      }
    }

    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === nodeIndex);
    });
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
