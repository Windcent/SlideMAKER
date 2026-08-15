/**
 * SlideMAKER - Fullscreen Presentation Engine & Presenter Tools
 * Supports Keyboard navigation, Laser Pointer, Pen Annotation Canvas, Presenter View & Timer.
 */

window.SlidePresenter = {
  currentSlideIndex: 0,
  isLaserActive: false,
  isPenActive: false,
  hudTimeout: null,
  timerInterval: null,
  elapsedSeconds: 0,
  drawingContext: null,
  isDrawing: false,

  init() {
    this.layer = document.getElementById("presentation-layer");
    this.scaler = document.getElementById("presentation-slide-scaler");
    this.laserPointer = document.getElementById("presenter-laser-pointer");
    this.drawingCanvas = document.getElementById("presenter-drawing-canvas");
    this.hud = document.getElementById("presenter-hud");
    this.presenterView = document.getElementById("presenter-view-window");

    if (this.drawingCanvas) {
      this.drawingCanvas.width = 1920;
      this.drawingCanvas.height = 1080;
      this.drawingContext = this.drawingCanvas.getContext("2d");
    }

    this.bindEvents();
  },

  startPresentation(startIndex = null) {
    if (startIndex !== null) {
      this.currentSlideIndex = startIndex;
    } else {
      this.currentSlideIndex = window.SlideApp.activeSlideIndex || 0;
    }

    this.layer.classList.add("active");
    this.renderCurrentSlide();
    this.autoScale();

    // Start timer
    this.elapsedSeconds = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();
    }, 1000);

    // Try requesting fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    this.showHud();
  },

  exitPresentation() {
    this.layer.classList.remove("active");
    if (this.presenterView) this.presenterView.classList.remove("active");
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.laserPointer) this.laserPointer.style.display = "none";
    this.isLaserActive = false;
    this.isPenActive = false;

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  },

  renderCurrentSlide() {
    const slides = window.SlideApp.presentation.slides;
    if (!slides || slides.length === 0) return;
    const slide = slides[this.currentSlideIndex];
    if (!slide) return;

    const layoutDef = window.SlideTemplates.getLayout(slide.layoutId);
    const faculty = window.SlideApp.presentation.master.faculty || "Faculté de génie";
    const showLogo = window.SlideApp.presentation.master.showLogo !== false;

    // Check if layout is dark
    const isDarkBg = slide.layoutId === "layout-2" || slide.layoutId === "layout-3";

    // Build elements HTML (non-editable for presentation)
    const elementsHtml = slide.elements.map(el => window.SlideElements.renderElement(el, false)).join("");

    this.scaler.innerHTML = `
      <div class="slide-canvas slide-${slide.layoutId}">
        <div class="layout-bg-graphic">
          ${layoutDef.getBackgroundSvg(window.SlideApp.presentation.master)}
        </div>
        ${window.SlideApp.presentation.master.showFaculty ? `<div class="slide-master-faculty">${faculty}</div>` : ''}
        ${showLogo ? `<div class="slide-master-logo">${window.SlideTemplates.getLogoSvg(isDarkBg)}</div>` : ''}
        <div class="slide-elements-layer">
          ${elementsHtml}
        </div>
      </div>
    `;

    // Update Counter
    const counterEl = document.getElementById("hud-slide-counter");
    if (counterEl) {
      counterEl.textContent = `${this.currentSlideIndex + 1} / ${slides.length}`;
    }

    // Clear annotation canvas for new slide
    this.clearPenCanvas();

    // Update Presenter View if open
    this.updatePresenterView();
  },

  autoScale() {
    if (!this.scaler) return;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const scaleW = winW / 1920;
    const scaleH = winH / 1080;
    const scale = Math.min(scaleW, scaleH);
    this.scaler.style.transform = `scale(${scale})`;
  },

  nextSlide() {
    const total = window.SlideApp.presentation.slides.length;
    if (this.currentSlideIndex < total - 1) {
      this.currentSlideIndex++;
      this.renderCurrentSlide();
    }
  },

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
      this.renderCurrentSlide();
    }
  },

  toggleLaser() {
    this.isLaserActive = !this.isLaserActive;
    if (this.isPenActive) this.togglePen(); // mutually exclusive
    const laserBtn = document.getElementById("hud-btn-laser");
    if (laserBtn) laserBtn.classList.toggle("active", this.isLaserActive);
    if (this.laserPointer) {
      this.laserPointer.style.display = this.isLaserActive ? "block" : "none";
    }
  },

  togglePen() {
    this.isPenActive = !this.isPenActive;
    if (this.isLaserActive) this.toggleLaser();
    const penBtn = document.getElementById("hud-btn-pen");
    if (penBtn) penBtn.classList.toggle("active", this.isPenActive);
    if (this.drawingCanvas) {
      this.drawingCanvas.classList.toggle("pen-active", this.isPenActive);
    }
  },

  clearPenCanvas() {
    if (this.drawingContext && this.drawingCanvas) {
      this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
    }
  },

  togglePresenterView() {
    if (!this.presenterView) return;
    const isOpen = this.presenterView.classList.toggle("active");
    if (isOpen) this.updatePresenterView();
  },

  updatePresenterView() {
    if (!this.presenterView || !this.presenterView.classList.contains("active")) return;
    const slides = window.SlideApp.presentation.slides;
    const current = slides[this.currentSlideIndex];
    const next = slides[this.currentSlideIndex + 1];

    const notesBox = document.getElementById("pv-notes-content");
    if (notesBox) {
      notesBox.innerHTML = current.notes ? current.notes.replace(/\n/g, "<br>") : "<em style='color:#8892b0;'>Aucune note pour cette diapositive.</em>";
    }
  },

  updateTimerDisplay() {
    const mins = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    const timerText = `${mins}:${secs}`;
    const hudTimer = document.getElementById("hud-timer");
    const pvTimer = document.getElementById("pv-timer");
    if (hudTimer) hudTimer.textContent = timerText;
    if (pvTimer) pvTimer.textContent = timerText;
  },

  showHud() {
    if (!this.hud) return;
    this.hud.classList.remove("hud-hidden");
    if (this.hudTimeout) clearTimeout(this.hudTimeout);
    this.hudTimeout = setTimeout(() => {
      if (!this.isPenActive) {
        this.hud.classList.add("hud-hidden");
      }
    }, 3000);
  },

  bindEvents() {
    window.addEventListener("resize", () => {
      if (this.layer && this.layer.classList.contains("active")) {
        this.autoScale();
      }
    });

    // Keyboard controls in presentation mode
    window.addEventListener("keydown", (e) => {
      if (!this.layer || !this.layer.classList.contains("active")) return;

      if (["ArrowRight", "Space", "PageDown", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        this.nextSlide();
      } else if (["ArrowLeft", "PageUp", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        this.prevSlide();
      } else if (e.key === "Home") {
        e.preventDefault();
        this.currentSlideIndex = 0;
        this.renderCurrentSlide();
      } else if (e.key === "End") {
        e.preventDefault();
        this.currentSlideIndex = window.SlideApp.presentation.slides.length - 1;
        this.renderCurrentSlide();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.exitPresentation();
      } else if (e.key.toLowerCase() === "l") {
        this.toggleLaser();
      } else if (e.key.toLowerCase() === "p") {
        this.togglePen();
      }
    });

    // Mouse movement for HUD & Laser pointer
    window.addEventListener("mousemove", (e) => {
      if (!this.layer || !this.layer.classList.contains("active")) return;
      this.showHud();

      if (this.isLaserActive && this.laserPointer) {
        this.laserPointer.style.left = `${e.clientX}px`;
        this.laserPointer.style.top = `${e.clientY}px`;
      }
    });

    // Drawing Canvas events (for Pen annotations)
    if (this.drawingCanvas) {
      this.drawingCanvas.addEventListener("mousedown", (e) => {
        if (!this.isPenActive) return;
        this.isDrawing = true;
        const rect = this.drawingCanvas.getBoundingClientRect();
        const scaleX = 1920 / rect.width;
        const scaleY = 1080 / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(x, y);
        this.drawingContext.strokeStyle = "#ef4444";
        this.drawingContext.lineWidth = 6;
        this.drawingContext.lineCap = "round";
      });

      this.drawingCanvas.addEventListener("mousemove", (e) => {
        if (!this.isDrawing || !this.isPenActive) return;
        const rect = this.drawingCanvas.getBoundingClientRect();
        const scaleX = 1920 / rect.width;
        const scaleY = 1080 / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        this.drawingContext.lineTo(x, y);
        this.drawingContext.stroke();
      });

      window.addEventListener("mouseup", () => {
        this.isDrawing = false;
      });
    }
  }
};
