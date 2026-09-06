/**
 * SlideMAKER - Slide Manager
 * Left thumbnail strip, slide drag-and-drop reordering, slide actions, and presenter notes drawer
 */

class SlideManager {
  constructor() {
    this.stripContainer = null;
    this.draggedSlideIndex = null;
    this.collapsedSlideIds = new Set();
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getSlideNesting(slide, slides) {
    if (!slide) return { level: 0, parent: null, isNestedFlow: false };
    if (!slide.parentFlowSlideId && !slide.isFlowChild) {
      return { level: 0, parent: null, isNestedFlow: false };
    }
    const parent = slides.find(s => s.id === slide.parentFlowSlideId);
    if (!parent) {
      return { level: slide.nestingLevel || (slide.isFlowChild ? 1 : 0), parent: null, isNestedFlow: false };
    }
    if (parent.parentFlowSlideId) {
      return { level: 2, parent: parent, isNestedFlow: !!slide.isZoomFlow };
    }
    return {
      level: slide.nestingLevel || 1,
      parent: parent,
      isNestedFlow: (slide.isZoomFlow && slide.isFlowChild) || !!slide.hasNestedDiagram
    };
  }

  getChildSlides(slide, slides) {
    if (!slide) return [];
    return slides.filter(s => s.parentFlowSlideId === slide.id);
  }

  isSlideHiddenByCollapse(slide, slides) {
    let current = slide;
    while (current && current.parentFlowSlideId) {
      if (this.collapsedSlideIds.has(current.parentFlowSlideId)) {
        return true;
      }
      current = slides.find(s => s.id === current.parentFlowSlideId);
    }
    return false;
  }

  init() {
    this.stripContainer = document.getElementById('slide-thumbnails-list');
    if (!this.stripContainer) return;

    this.renderThumbnails();
    this.setupNotesDrawer();
    this.setupNewSlideButton();

    window.state.subscribe((type) => {
      if (['slideChange', 'slideAdded', 'slideDuplicated', 'slideDeleted', 'slideReordered', 'backgroundChanged', 'presentationLoaded', 'historyRestore'].includes(type)) {
        if (type === 'historyRestore') {
          requestAnimationFrame(() => {
            this.renderThumbnails();
            this.updateNotesContent();
          });
        } else {
          this.renderThumbnails();
          this.updateNotesContent();
        }
      }
    });
  }

  renderThumbnails() {
    if (!this.stripContainer) return;
    const state = window.state;
    if (state && typeof state.reorderSlidesHierarchically === 'function') {
      state.reorderSlidesHierarchically();
    }
    const slides = state.slides;
    const activeIdx = state.activeSlideIndex;

    this.stripContainer.innerHTML = '';

    slides.forEach((slide, idx) => {
      if (this.isSlideHiddenByCollapse(slide, slides)) {
        return;
      }

      const nesting = this.getSlideNesting(slide, slides);
      const childSlides = this.getChildSlides(slide, slides);
      const hasChildren = childSlides.length > 0;
      const isCollapsed = this.collapsedSlideIds.has(slide.id);

      const item = document.createElement('div');
      item.className = `slide-thumb-card is-level-${nesting.level} ${idx === activeIdx ? 'is-active' : ''} ${hasChildren ? 'has-children' : ''} ${nesting.isNestedFlow ? 'is-nested-flow-node' : ''}`;
      item.setAttribute('data-index', idx);
      item.setAttribute('data-level', nesting.level);
      item.setAttribute('draggable', 'true');

      // Tree Branch Guide for Level 1 and Level 2
      if (nesting.level === 1) {
        const guide = document.createElement('div');
        guide.className = 'thumb-tree-guide thumb-guide-level-1';
        guide.innerHTML = '<span class="thumb-guide-elbow"></span>';
        item.appendChild(guide);
      } else if (nesting.level === 2) {
        const guide = document.createElement('div');
        guide.className = 'thumb-tree-guide thumb-guide-level-2';
        guide.innerHTML = '<span class="thumb-guide-trunk"></span><span class="thumb-guide-elbow"></span>';
        item.appendChild(guide);
      }

      // Slide number badge or hierarchy prefix
      const numBadge = document.createElement('div');
      numBadge.className = 'thumb-number';
      numBadge.textContent = idx + 1;

      // Tree Collapsible Toggle Button if slide has nested children
      if (hasChildren) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = `thumb-tree-toggle ${isCollapsed ? 'is-collapsed' : ''}`;
        toggleBtn.title = isCollapsed ? `Expand ${childSlides.length} sub-slides` : 'Collapse sub-slides';
        toggleBtn.innerHTML = `<i class="fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}"></i>`;
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.collapsedSlideIds.has(slide.id)) {
            this.collapsedSlideIds.delete(slide.id);
          } else {
            this.collapsedSlideIds.add(slide.id);
          }
          this.renderThumbnails();
        });
        item.appendChild(toggleBtn);
      }

      if (slide.isFlowChild) {
        item.classList.add('is-flow-child');
        item.style.setProperty('--flow-color', slide.flowNodeColor || (nesting.level === 2 ? '#38BDF8' : 'var(--udes-green)'));
      }

      // Miniature Canvas Preview container
      const dims = window.canvasEngine ? window.canvasEngine.getSlideDimensions() : { width: 1280, height: 720 };
      const previewWrap = document.createElement('div');
      previewWrap.className = 'thumb-preview-wrap';
      previewWrap.style.aspectRatio = `${dims.width} / ${dims.height}`;

      if (slide.isZoomFlow) {
        // Generic Flow Chart Symbol when Zoom Flow Diagram
        const themeKey = slide.zoomFlowData?.theme || 'udes-emerald';
        const theme = window.zoomFlowEngine ? window.zoomFlowEngine.THEMES[themeKey] : null;
        previewWrap.style.background = theme ? theme.background : 'radial-gradient(circle at center, #0a1f18 0%, #06110d 100%)';

        const flowSymbol = document.createElement('div');
        flowSymbol.className = 'thumb-flowchart-symbol';
        flowSymbol.innerHTML = `
          <svg class="thumb-flowchart-svg" viewBox="0 0 74 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 19 H26 M48 19 H53" stroke="var(--udes-lime, #7fc23f)" stroke-width="2" stroke-linecap="round"/>
            <polygon points="26,16 30,19 26,22" fill="var(--udes-lime, #7fc23f)"/>
            <polygon points="53,16 57,19 53,22" fill="var(--udes-lime, #7fc23f)"/>
            <rect x="2" y="9" width="19" height="20" rx="3.5" fill="rgba(0, 163, 80, 0.35)" stroke="#00A350" stroke-width="1.6"/>
            <line x1="5" y1="16" x2="18" y2="16" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
            <line x1="5" y1="21" x2="14" y2="21" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
            <rect x="28" y="9" width="19" height="20" rx="3.5" fill="rgba(127, 194, 63, 0.35)" stroke="#7FC23F" stroke-width="1.6"/>
            <line x1="31" y1="16" x2="44" y2="16" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
            <line x1="31" y1="21" x2="40" y2="21" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
            <rect x="53" y="9" width="19" height="20" rx="3.5" fill="rgba(56, 189, 248, 0.35)" stroke="#38BDF8" stroke-width="1.6"/>
            <line x1="56" y1="16" x2="69" y2="16" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
            <line x1="56" y1="21" x2="65" y2="21" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
          </svg>
          <span class="thumb-flowchart-label">${this.escapeHtml(slide.zoomFlowData?.title || 'Flow Diagram')}</span>
        `;
        previewWrap.appendChild(flowSymbol);

        if (isCollapsed && hasChildren) {
          const collapsedPill = document.createElement('div');
          collapsedPill.className = 'thumb-collapsed-pill thumb-collapsed-overlay';
          collapsedPill.innerHTML = `<i class="fa-solid fa-layer-group"></i> +${childSlides.length} sub-slides`;
          previewWrap.appendChild(collapsedPill);
        }
      } else {
        // Regular Slide: Show Slide Appearance!
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
            if (el.type === 'text') {
              dot.style.background = el.color || 'rgba(255, 255, 255, 0.75)';
              dot.style.opacity = el.textType === 'title' ? '0.9' : '0.6';
            } else if (el.type === 'shape') {
              dot.style.background = el.fillColor || 'rgba(0, 163, 80, 0.4)';
              if (el.strokeColor) dot.style.border = `1px solid ${el.strokeColor}`;
            } else if (el.type === 'image') {
              dot.style.background = 'rgba(56, 189, 248, 0.4)';
            }
            dotsOverlay.appendChild(dot);
          });
          previewWrap.appendChild(dotsOverlay);
        }
      }

      item.appendChild(numBadge);
      item.appendChild(previewWrap);

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
      item.appendChild(actionsWrap);

      // Click to select
      item.addEventListener('click', () => {
        try {
          const currentSlide = state.getActiveSlide ? state.getActiveSlide() : state.slides[state.activeSlideIndex];
          const targetSlide = slides[idx];
          if (currentSlide && currentSlide.isFlowChild && targetSlide && targetSlide.isZoomFlow && (currentSlide.parentFlowSlideId === targetSlide.id || !currentSlide.parentFlowSlideId)) {
            if (window.canvasEngine) {
              window.canvasEngine.returningFromNodeIndex = currentSlide.flowNodeIndex !== undefined ? currentSlide.flowNodeIndex : 0;
            }
          } else if (currentSlide && currentSlide.isZoomFlow && targetSlide && targetSlide.isFlowChild && (targetSlide.parentFlowSlideId === currentSlide.id || targetSlide.rootFlowSlideId === currentSlide.id)) {
            const nodeIdx = targetSlide.flowNodeIndex !== undefined ? targetSlide.flowNodeIndex : 0;
            if (window.canvasEngine && window.canvasEngine.currentZoomFlowController && typeof window.canvasEngine.currentZoomFlowController.zoomToNodeFullscreen === 'function') {
              window.canvasEngine.currentZoomFlowController.zoomToNodeFullscreen(nodeIdx, () => {
                state.setActiveSlideIndex(idx);
              });
              return;
            }
          }
        } catch (err) {
          console.warn('Error in thumbnail click handler:', err);
        }
        state.setActiveSlideIndex(idx);
      });

      // Drag and Drop Events for Reordering
      this.attachDragEvents(item, idx);

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

      <!-- Zoom Flow Interactive Slide Option -->
      <div class="new-slide-option-card" data-type="zoom-flow" title="Interactive Zoom-In Flow Slide">
        <div class="new-slide-option-thumb is-blank-thumb" style="background: radial-gradient(circle at center, #0a1f18 0%, #06110d 100%); color: #7FC23F; border: 1.5px solid var(--udes-green); box-shadow: 0 0 14px rgba(0,163,80,0.3);">
          <div class="blank-slide-preview">
            <i class="fa-solid fa-wand-magic-sparkles" style="font-size:24px;color:var(--udes-lime);"></i>
            <span style="color:var(--udes-lime);font-weight:700;font-size:12px;">Zoom Flow</span>
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

        if (type === 'zoom-flow') {
          if (modal) modal.classList.remove('is-open');
          window.state.addEmptyZoomFlowSlide();
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
