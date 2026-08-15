/**
 * SlideMAKER - Slide Manager
 * Left thumbnail strip, slide drag-and-drop reordering, slide actions, and presenter notes drawer
 */

class SlideManager {
  constructor() {
    this.stripContainer = null;
    this.draggedSlideIndex = null;
  }

  init() {
    this.stripContainer = document.getElementById('slide-thumbnails-list');
    if (!this.stripContainer) return;

    this.renderThumbnails();
    this.setupNotesDrawer();
    this.setupNewSlideButton();

    window.state.subscribe((type) => {
      if (['slideChange', 'slideAdded', 'slideDuplicated', 'slideDeleted', 'slideReordered', 'backgroundChanged', 'presentationLoaded', 'historyRestore'].includes(type)) {
        this.renderThumbnails();
        this.updateNotesContent();
      }
    });
  }

  renderThumbnails() {
    if (!this.stripContainer) return;
    const state = window.state;
    const slides = state.slides;
    const activeIdx = state.activeSlideIndex;

    this.stripContainer.innerHTML = '';

    slides.forEach((slide, idx) => {
      const item = document.createElement('div');
      item.className = `slide-thumb-card ${idx === activeIdx ? 'is-active' : ''}`;
      item.setAttribute('data-index', idx);
      item.setAttribute('draggable', 'true');

      // Slide number badge
      const numBadge = document.createElement('div');
      numBadge.className = 'thumb-number';
      numBadge.textContent = idx + 1;

      // Miniature Canvas Preview container
      const dims = window.canvasEngine ? window.canvasEngine.getSlideDimensions() : { width: 1280, height: 720 };
      const previewWrap = document.createElement('div');
      previewWrap.className = 'thumb-preview-wrap';
      previewWrap.style.aspectRatio = `${dims.width} / ${dims.height}`;

      // Background preview
      const bg = slide.background || { type: 'color', value: '#FFFFFF' };
      if (bg.type === 'pdf' || bg.type === 'image') {
        const bgImg = document.createElement('img');
        bgImg.className = 'thumb-bg-img';
        bgImg.src = bg.value;
        bgImg.alt = `Slide ${idx + 1}`;
        bgImg.loading = 'lazy';
        previewWrap.appendChild(bgImg);
      } else if (bg.type === 'gradient') {
        previewWrap.style.background = bg.value;
      } else {
        previewWrap.style.backgroundColor = bg.value || '#FFFFFF';
      }

      // Element counts / miniature indicators
      if (slide.elements && slide.elements.length > 0) {
        const dotsOverlay = document.createElement('div');
        dotsOverlay.className = 'thumb-elements-overlay';
        const scale = 136 / dims.width;
        slide.elements.forEach(el => {
          const dot = document.createElement('div');
          dot.className = `thumb-el-indicator thumb-el-${el.type}`;
          dot.style.left = `${el.x * scale}px`;
          dot.style.top = `${el.y * scale}px`;
          dot.style.width = `${Math.max(3, el.width * scale)}px`;
          dot.style.height = `${Math.max(2, el.height * scale)}px`;
          dotsOverlay.appendChild(dot);
        });
        previewWrap.appendChild(dotsOverlay);
      }

      // Hover Actions overlay (Duplicate, Delete)
      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'thumb-hover-actions';

      const dupBtn = document.createElement('button');
      dupBtn.className = 'thumb-action-btn';
      dupBtn.title = 'Duplicate this slide';
      dupBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
      dupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.duplicateSlide(idx);
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'thumb-action-btn thumb-action-delete';
      delBtn.title = 'Delete this slide';
      delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.deleteSlide(idx);
      });

      actionsWrap.appendChild(dupBtn);
      if (slides.length > 1) {
        actionsWrap.appendChild(delBtn);
      }

      // Click to select
      item.addEventListener('click', () => {
        state.setActiveSlideIndex(idx);
      });

      // Drag and Drop Events for Reordering
      this.attachDragEvents(item, idx);

      item.appendChild(numBadge);
      item.appendChild(previewWrap);
      item.appendChild(actionsWrap);
      this.stripContainer.appendChild(item);
    });

    // Update slide counter in status bar
    const counterEl = document.getElementById('slide-counter-badge');
    if (counterEl) {
      counterEl.textContent = `${activeIdx + 1} / ${slides.length}`;
    }
  }

  attachDragEvents(item, idx) {
    item.addEventListener('dragstart', (e) => {
      this.draggedSlideIndex = idx;
      item.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', idx);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      this.draggedSlideIndex = null;
      document.querySelectorAll('.slide-thumb-card').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (this.draggedSlideIndex === null || this.draggedSlideIndex === idx) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        item.classList.add('drag-over-top');
        item.classList.remove('drag-over-bottom');
      } else {
        item.classList.add('drag-over-bottom');
        item.classList.remove('drag-over-top');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over-top', 'drag-over-bottom');
      if (this.draggedSlideIndex === null || this.draggedSlideIndex === idx) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      let targetIndex = idx;
      if (e.clientY >= midY && this.draggedSlideIndex < idx) {
        targetIndex = idx;
      } else if (e.clientY < midY && this.draggedSlideIndex > idx) {
        targetIndex = idx;
      }

      window.state.reorderSlide(this.draggedSlideIndex, targetIndex);
    });
  }

  setupNewSlideButton() {
    const newSlideBtn = document.getElementById('btn-new-slide-main');
    if (newSlideBtn) {
      newSlideBtn.addEventListener('click', () => {
        this.openNewSlideModal();
      });
    }

    this.renderNewSlideModalOptions();
  }

  openNewSlideModal() {
    const modal = document.getElementById('modal-new-slide');
    if (modal) {
      this.renderNewSlideModalOptions();
      modal.classList.add('is-open');
    }
  }

  renderNewSlideModalOptions() {
    const grid = document.getElementById('new-slide-modal-grid');
    const modal = document.getElementById('modal-new-slide');
    if (!grid) return;

    grid.innerHTML = `
      <!-- Blank / Empty Slide Option -->
      <div class="new-slide-option-card" data-type="blank" title="Blank Slide">
        <div class="new-slide-option-thumb is-blank-thumb">
          <div class="blank-slide-preview">
            <i class="fa-solid fa-file"></i>
            <span>Blank</span>
          </div>
        </div>
      </div>

      <!-- Self-Contained HTML Slide Option -->
      <div class="new-slide-option-card" data-type="html" title="Self-Contained HTML Slide">
        <div class="new-slide-option-thumb is-blank-thumb" style="background: linear-gradient(135deg, #090d16 0%, #1e293b 100%); color: #10b981; border: 1px dashed #10b981;">
          <div class="blank-slide-preview">
            <i class="fa-solid fa-code" style="font-size:22px;"></i>
            <span style="color:#10b981;font-weight:700;">HTML</span>
          </div>
        </div>
      </div>

      <!-- 6 Official 16:9 Template Options -->
      ${CONFIG.pdfBackgrounds.map(bg => `
        <div class="new-slide-option-card" data-type="template" data-id="${bg.id}" data-page="${bg.pageNumber}" data-image="${bg.image}">
          <div class="new-slide-option-thumb">
            <img src="${bg.thumbnail}" alt="Template Background" loading="lazy">
          </div>
        </div>
      `).join('')}
    `;

    // Click handler for cards
    grid.querySelectorAll('.new-slide-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-type');
        let bgConfig;

        if (type === 'html') {
          if (modal) modal.classList.remove('is-open');
          if (window.app && typeof window.app.openHtmlModal === 'function') {
            window.app.openHtmlModal('new-slide');
          } else {
            const htmlModal = document.getElementById('modal-insert-html');
            if (htmlModal) {
              htmlModal.setAttribute('data-target-mode', 'new-slide');
              htmlModal.classList.add('is-open');
            }
          }
          return;
        }

        if (type === 'blank') {
          bgConfig = {
            type: 'color',
            value: '#FFFFFF'
          };
        } else {
          const bgId = card.getAttribute('data-id');
          const pageNum = parseInt(card.getAttribute('data-page'), 10);
          const imgPath = card.getAttribute('data-image');
          bgConfig = {
            type: 'pdf',
            value: imgPath || `assets/backgrounds/${bgId}.png`,
            pdfId: bgId,
            pageNumber: pageNum
          };
        }

        window.state.addSlide({ background: bgConfig });
        if (modal) {
          modal.classList.remove('is-open');
        }
      });
    });
  }

  setupNotesDrawer() {
    const notesToggle = document.getElementById('btn-toggle-notes');
    const notesDrawer = document.getElementById('presenter-notes-drawer');
    const notesTextarea = document.getElementById('slide-notes-input');

    if (notesToggle && notesDrawer) {
      notesToggle.addEventListener('click', () => {
        notesDrawer.classList.toggle('is-collapsed');
        notesToggle.classList.toggle('is-active');
      });
    }

    if (notesTextarea) {
      notesTextarea.addEventListener('input', (e) => {
        const activeSlide = window.state.getActiveSlide();
        if (activeSlide) {
          activeSlide.notes = e.target.value;
        }
      });

      this.updateNotesContent();
    }
  }

  updateNotesContent() {
    const notesTextarea = document.getElementById('slide-notes-input');
    const activeSlide = window.state.getActiveSlide();
    if (notesTextarea && activeSlide) {
      notesTextarea.value = activeSlide.notes || '';
    }
  }
}

window.SlideManager = SlideManager;
