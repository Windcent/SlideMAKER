/**
 * SlideMAKER - Background Manager
 * PDF Backgrounds gallery, UdeS Palette swatches, Gradients, and Custom Background uploads
 */

class BackgroundManager {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.getElementById('background-panel-content');
    if (!this.container) return;

    this.renderPanel();
    this.setupCustomUpload();

    window.state.subscribe((type) => {
      if (type === 'slideChange' || type === 'backgroundChanged' || type === 'presentationLoaded') {
        this.updateActiveSelectionHighlight();
      }
    });
  }

  renderPanel() {
    if (!this.container) return;

    this.container.innerHTML = `
      <!-- 1. PDF Template Backgrounds Section -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-file-image" style="color:var(--udes-green);"></i> Template Backgrounds</h4>
        </div>
        
        <div class="pdf-bg-grid" id="pdf-bg-grid">
          ${CONFIG.pdfBackgrounds.map(bg => `
            <div class="pdf-bg-card" data-pdf-id="${bg.id}" data-page="${bg.pageNumber}" data-image="${bg.image}">
              <div class="pdf-bg-thumb-wrap">
                <img src="${bg.thumbnail}" alt="Template" class="pdf-bg-thumb" loading="lazy">
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. Brand Solid Colors -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-palette"></i> UdeS Brand Colors</h4>
        </div>
        <div class="color-swatches-grid">
          ${CONFIG.colorPalette.map(color => `
            <button class="color-swatch-btn" data-color="${color}" style="background-color: ${color};" title="${color}"></button>
          `).join('')}
        </div>
        <div class="custom-color-row">
          <label for="custom-bg-color-picker" class="custom-color-label">
            <i class="fa-solid fa-eye-dropper"></i> Custom Color
          </label>
          <input type="color" id="custom-bg-color-picker" class="color-input-native" value="#00A350">
        </div>
      </div>

      <!-- 3. Gradient Presets -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Modern Gradients</h4>
        </div>
        <div class="gradient-presets-grid">
          ${CONFIG.gradientPresets.map(grad => `
            <button class="gradient-preset-btn" data-gradient="${grad.value}" style="background: ${grad.value};" title="${grad.name}">
              <span>${grad.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- 4. Custom Upload -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-cloud-arrow-up"></i> Custom Image / Background</h4>
        </div>
        <label class="custom-upload-zone" id="bg-upload-zone">
          <i class="fa-solid fa-image upload-icon"></i>
          <span>Click or drop an image (PNG, JPG, WebP)</span>
          <input type="file" id="bg-file-input" accept="image/*,.pdf" style="display:none;">
        </label>
      </div>

      <!-- 5. Actions Footer -->
      <div class="panel-actions-row">
        <button id="btn-apply-bg-all" class="btn btn-secondary btn-full" title="Apply this background to all slides">
          <i class="fa-solid fa-clone"></i> Apply to All Slides
        </button>
      </div>
    `;

    this.bindEvents();
    this.updateActiveSelectionHighlight();
  }

  bindEvents() {
    // 1. PDF Background Cards click
    const cards = this.container.querySelectorAll('.pdf-bg-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const pageNum = parseInt(card.getAttribute('data-page'), 10);
        const pdfId = card.getAttribute('data-pdf-id');
        const imgPath = card.getAttribute('data-image');
        const bgConfig = {
          type: 'pdf',
          value: imgPath || `assets/backgrounds/${pdfId}.png`,
          pdfId: pdfId,
          pageNumber: pageNum
        };
        window.state.setSlideBackground(bgConfig, false);
      });
    });

    // 2. Color Swatches click
    const swatches = this.container.querySelectorAll('.color-swatch-btn');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.getAttribute('data-color');
        const bgConfig = {
          type: 'color',
          value: color
        };
        window.state.setSlideBackground(bgConfig, false);
      });
    });

    // Custom Color Picker
    const customColorInput = document.getElementById('custom-bg-color-picker');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        window.state.setSlideBackground({ type: 'color', value: e.target.value }, false);
      });
    }

    // 3. Gradient Presets click
    const gradBtns = this.container.querySelectorAll('.gradient-preset-btn');
    gradBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const gradValue = btn.getAttribute('data-gradient');
        window.state.setSlideBackground({ type: 'gradient', value: gradValue }, false);
      });
    });

    // 4. Apply to all button
    const applyAllBtn = document.getElementById('btn-apply-bg-all');
    if (applyAllBtn) {
      applyAllBtn.addEventListener('click', () => {
        const activeSlide = window.state.getActiveSlide();
        if (activeSlide && activeSlide.background) {
          window.state.setSlideBackground(activeSlide.background, true);
          alert('Background applied to all slides in the presentation!');
        }
      });
    }
  }

  setupCustomUpload() {
    const fileInput = document.getElementById('bg-file-input');
    const uploadZone = document.getElementById('bg-upload-zone');
    if (!fileInput || !uploadZone) return;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const bgConfig = {
          type: 'image',
          value: event.target.result,
          name: file.name
        };
        window.state.setSlideBackground(bgConfig, false);
      };
      reader.readAsDataURL(file);
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('is-dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('is-dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('is-dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          window.state.setSlideBackground({ type: 'image', value: event.target.result, name: file.name }, false);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  updateActiveSelectionHighlight() {
    if (!this.container) return;
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.background) return;

    const bg = activeSlide.background;

    // Highlight PDF card if active
    const cards = this.container.querySelectorAll('.pdf-bg-card');
    cards.forEach(c => {
      const p = parseInt(c.getAttribute('data-page'), 10);
      const pdfId = c.getAttribute('data-pdf-id');
      if (bg.type === 'pdf' && (bg.pdfId === pdfId || bg.pageNumber === p || (bg.value && bg.value.includes(pdfId)))) {
        c.classList.add('is-active');
      } else {
        c.classList.remove('is-active');
      }
    });

    // Highlight Color Swatch if active
    const swatches = this.container.querySelectorAll('.color-swatch-btn');
    swatches.forEach(s => {
      const col = s.getAttribute('data-color');
      if (bg.type === 'color' && bg.value.toLowerCase() === col.toLowerCase()) {
        s.classList.add('is-active');
      } else {
        s.classList.remove('is-active');
      }
    });
  }
}

window.BackgroundManager = BackgroundManager;
