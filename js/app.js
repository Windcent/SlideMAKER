/**
 * SlideMAKER - Main Application Controller & UI Coordinator
 */

class SlideMakerApp {
  constructor() {
    this.activeInspectorTab = 'background';
    this.selectedShapeId = 'rect';
  }

  init() {
    console.log('Initializing SlideMAKER application...');
    window.app = this;

    // Initialize Subsystems
    window.canvasEngine = new CanvasEngine();
    window.backgroundManager = new BackgroundManager();
    window.slideManager = new SlideManager();
    window.exportEngine = new ExportEngine();
    window.presenterEngine = new PresenterEngine();
    window.zoomFlowEngine = new ZoomFlowEngine();

    // Boot UI components
    window.canvasEngine.init();
    window.backgroundManager.init();
    window.slideManager.init();
    window.presenterEngine.init();

    this.bindHeaderActions();
    this.bindRibbonActions();
    this.bindFlowEditingEvents();
    this.bindContextualBar();
    this.bindInspectorPanel();
    this.bindModals();
    this.bindKeyboardShortcuts();
    this.bindTitleEditor();
    this.bindZoomFlowStudioEvents();

    // Listen to selection changes to sync contextual toolbar & inspector tab
    window.state.subscribe((type, details) => {
      this.handleStateChange(type, details);
    });

    this.syncEditorMode();

    console.log('SlideMAKER initialized successfully!');
  }

  handleStateChange(type, details) {
    this.syncEditorMode();

    if (type === 'history' || type === 'historyRestore') {
      const btnUndo = document.getElementById('btn-undo');
      const btnRedo = document.getElementById('btn-redo');
      if (btnUndo) {
        btnUndo.disabled = !window.state.canUndo();
        btnUndo.style.opacity = window.state.canUndo() ? '1' : '0.4';
      }
      if (btnRedo) {
        btnRedo.disabled = !window.state.canRedo();
        btnRedo.style.opacity = window.state.canRedo() ? '1' : '0.4';
      }

      if (type === 'historyRestore') {
        const activeSlide = window.state.getActiveSlide();
        if (activeSlide && activeSlide.isZoomFlow) {
          this.renderFlowInspector();
          const themeSel = document.getElementById('ribbon-flow-theme');
          if (themeSel && activeSlide.zoomFlowData?.theme) {
            themeSel.value = activeSlide.zoomFlowData.theme;
          }
        }
      }
    }

    if (type === 'selection' || type === 'elementAdded' || type === 'elementsDeleted' || type === 'slideChange' || type === 'historyRestore') {
      this.syncContextualToolbar();
      this.syncInspectorProperties();

      const selected = window.state.getSelectedElement();
      if (this.activeInspectorTab !== 'flow') {
        if (selected && this.activeInspectorTab === 'background') {
          this.switchInspectorTab('properties');
        } else if (!selected && this.activeInspectorTab === 'properties') {
          this.switchInspectorTab('background');
        }
      }
    }
  }

  // --- 1. Top Header Actions & Menus ---

  bindHeaderActions() {
    // Project Save / Export buttons
    document.getElementById('btn-export-html')?.addEventListener('click', () => window.exportEngine.exportToHtml());
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => window.exportEngine.exportToPdf());
    document.getElementById('btn-export-png')?.addEventListener('click', () => window.exportEngine.exportCurrentSlidePng());
    document.getElementById('btn-export-zip')?.addEventListener('click', () => window.exportEngine.exportAllSlidesZip());
    document.getElementById('btn-save-project')?.addEventListener('click', () => window.exportEngine.savePresentationJson());

    // File Open Input
    const openFileInput = document.getElementById('file-open-project');
    if (openFileInput) {
      openFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          window.exportEngine.loadPresentationJson(e.target.files[0]);
        }
      });
    }

    document.getElementById('btn-open-project')?.addEventListener('click', () => {
      openFileInput?.click();
    });

    // Undo / Redo buttons
    document.getElementById('btn-undo')?.addEventListener('click', () => window.state.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => window.state.redo());

    // Zoom buttons
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => window.canvasEngine.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => window.canvasEngine.zoomOut());
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => window.canvasEngine.fitToWindow());

    // Fullscreen Presenter
    document.getElementById('btn-present-main')?.addEventListener('click', () => window.presenterEngine.startPresentation());
  }

  // --- 2. Ribbon & Quick Insert Actions ---

  bindRibbonActions() {
    // Insert Title
    document.getElementById('btn-insert-title')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createTitle());
    });

    // Insert Subtitle
    document.getElementById('btn-insert-subtitle')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createSubtitle());
    });

    // Insert Body Text
    document.getElementById('btn-insert-text')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createText());
    });

    // Insert Bullet List
    document.getElementById('btn-insert-bullets')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createBulletList());
    });

    // Insert Shape Dropdown & Shapes
    this.setupShapePicker();

    // Insert Image Upload
    const imageUploadInput = document.getElementById('image-upload-input');
    document.getElementById('btn-insert-image')?.addEventListener('click', () => {
      imageUploadInput?.click();
    });

    if (imageUploadInput) {
      imageUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            window.state.addElement(ElementFactory.createImage(event.target.result));
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Insert Official UdeS Logos
    document.getElementById('btn-insert-logo-dark')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createImage('assets/logo_uds_b.png', { width: 280, height: 100 }));
    });

    document.getElementById('btn-insert-logo-light')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createImage('assets/logo_uds_a.avif', { width: 120, height: 120 }));
    });

    // Insert Line
    document.getElementById('btn-insert-line')?.addEventListener('click', () => {
      window.state.addElement(ElementFactory.createLine());
    });

    // Modals Triggers (Icon, Table, Chart, HTML, Zoom Flow)
    document.getElementById('btn-insert-icon')?.addEventListener('click', () => this.openIconModal());
    document.getElementById('btn-insert-table')?.addEventListener('click', () => this.openTableModal());
    document.getElementById('btn-insert-chart')?.addEventListener('click', () => this.openChartModal());
    document.getElementById('btn-insert-html')?.addEventListener('click', () => this.openHtmlModal());
    document.getElementById('btn-insert-zoom-flow')?.addEventListener('click', () => {
      window.state.addEmptyZoomFlowSlide();
    });
  }

  setupShapePicker() {
    const shapeBtn = document.getElementById('btn-insert-shape-dropdown');
    const shapeMenu = document.getElementById('shape-picker-menu');
    if (!shapeBtn || !shapeMenu) return;

    shapeMenu.innerHTML = `
      <div class="shape-grid-picker">
        ${CONFIG.shapes.map(s => `
          <button class="shape-picker-item" data-shape="${s.id}" title="${s.name}">
            <i class="fa-solid ${s.icon}"></i>
            <span>${s.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    shapeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shapeMenu.classList.toggle('is-open');
    });

    shapeMenu.querySelectorAll('.shape-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const shapeId = item.getAttribute('data-shape');
        window.state.addElement(ElementFactory.createShape(shapeId));
        shapeMenu.classList.remove('is-open');
      });
    });

    document.addEventListener('click', () => shapeMenu.classList.remove('is-open'));
  }

  // --- 3. Contextual Formatting Bar ---

  bindContextualBar() {
    // Text Formatting controls
    const fontSelect = document.getElementById('ctx-font-family');
    if (fontSelect) {
      fontSelect.innerHTML = CONFIG.fonts.map(f => `<option value="${f.name}">${f.name}</option>`).join('');
      fontSelect.addEventListener('change', (e) => {
        if (window.state.isDiagramTitleSelected) {
          window.state.syncTitleStyleToAllSlides({ fontFamily: e.target.value });
        } else {
          window.state.updateSelectedElements({ fontFamily: e.target.value });
        }
      });
    }

    const fontSizeInput = document.getElementById('ctx-font-size');
    if (fontSizeInput) {
      fontSizeInput.addEventListener('change', (e) => {
        const sz = parseInt(e.target.value, 10);
        if (window.state.isDiagramTitleSelected) {
          window.state.syncTitleStyleToAllSlides({ fontSize: sz });
        } else {
          window.state.updateSelectedElements({ fontSize: sz });
        }
      });
    }

    document.getElementById('ctx-btn-font-plus')?.addEventListener('click', () => {
      if (window.state.isDiagramTitleSelected) {
        const cur = window.state.titleStyle?.fontSize || 44;
        const newSize = cur + 2;
        window.state.syncTitleStyleToAllSlides({ fontSize: newSize });
        if (fontSizeInput) fontSizeInput.value = newSize;
        return;
      }
      const el = window.state.getSelectedElement();
      if (el && el.fontSize) {
        const newSize = el.fontSize + 2;
        window.state.updateSelectedElements({ fontSize: newSize });
        if (fontSizeInput) fontSizeInput.value = newSize;
      }
    });

    document.getElementById('ctx-btn-font-minus')?.addEventListener('click', () => {
      if (window.state.isDiagramTitleSelected) {
        const cur = window.state.titleStyle?.fontSize || 44;
        if (cur > 14) {
          const newSize = cur - 2;
          window.state.syncTitleStyleToAllSlides({ fontSize: newSize });
          if (fontSizeInput) fontSizeInput.value = newSize;
        }
        return;
      }
      const el = window.state.getSelectedElement();
      if (el && el.fontSize && el.fontSize > 8) {
        const newSize = el.fontSize - 2;
        window.state.updateSelectedElements({ fontSize: newSize });
        if (fontSizeInput) fontSizeInput.value = newSize;
      }
    });

    document.getElementById('ctx-btn-bold')?.addEventListener('click', () => {
      if (window.state.isDiagramTitleSelected) {
        const isBold = (window.state.titleStyle?.fontWeight === '700' || window.state.titleStyle?.fontWeight === 'bold');
        window.state.syncTitleStyleToAllSlides({ fontWeight: isBold ? '400' : '700' });
        this.syncContextualToolbar();
        return;
      }
      const el = window.state.getSelectedElement();
      if (!el) return;
      const isBold = el.fontWeight === '700' || el.fontWeight === 'bold';
      window.state.updateSelectedElements({ fontWeight: isBold ? '400' : '700' });
    });

    document.getElementById('ctx-btn-italic')?.addEventListener('click', () => {
      if (window.state.isDiagramTitleSelected) {
        const isItalic = window.state.titleStyle?.fontStyle === 'italic';
        window.state.syncTitleStyleToAllSlides({ fontStyle: isItalic ? 'normal' : 'italic' });
        this.syncContextualToolbar();
        return;
      }
      const el = window.state.getSelectedElement();
      if (!el) return;
      const isItalic = el.fontStyle === 'italic';
      window.state.updateSelectedElements({ fontStyle: isItalic ? 'normal' : 'italic' });
    });

    document.getElementById('ctx-btn-underline')?.addEventListener('click', () => {
      if (window.state.isDiagramTitleSelected) {
        const isUnder = window.state.titleStyle?.textDecoration === 'underline';
        window.state.syncTitleStyleToAllSlides({ textDecoration: isUnder ? 'none' : 'underline' });
        this.syncContextualToolbar();
        return;
      }
      const el = window.state.getSelectedElement();
      if (!el) return;
      const isUnder = el.textDecoration === 'underline';
      window.state.updateSelectedElements({ textDecoration: isUnder ? 'none' : 'underline' });
    });

    // Alignment
    ['left', 'center', 'right', 'justify'].forEach(align => {
      document.getElementById(`ctx-btn-align-${align}`)?.addEventListener('click', () => {
        if (window.state.isDiagramTitleSelected) {
          window.state.syncTitleStyleToAllSlides({ textAlign: align });
          this.syncContextualToolbar();
        } else {
          window.state.updateSelectedElements({ textAlign: align });
        }
      });
    });

    // Lists & Levels / Indentation
    document.getElementById('ctx-btn-list-ul')?.addEventListener('click', () => {
      this.execTextCommand('insertUnorderedList');
    });
    document.getElementById('ctx-btn-list-ol')?.addEventListener('click', () => {
      this.execTextCommand('insertOrderedList');
    });
    document.getElementById('ctx-btn-outdent')?.addEventListener('click', () => {
      this.execTextCommand('outdent');
    });
    document.getElementById('ctx-btn-indent')?.addEventListener('click', () => {
      this.execTextCommand('indent');
    });

    // Color Pickers
    const textColorInput = document.getElementById('ctx-text-color');
    if (textColorInput) {
      textColorInput.addEventListener('input', (e) => {
        if (window.state.isDiagramTitleSelected) {
          window.state.syncTitleStyleToAllSlides({ color: e.target.value });
        } else {
          window.state.updateSelectedElements({ color: e.target.value });
        }
      });
    }

    // Sync Title Style to All Slides Button
    document.getElementById('ctx-btn-sync-title')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (el) {
        window.state.syncTitleStyleToAllSlides({
          fontFamily: el.fontFamily,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          textDecoration: el.textDecoration,
          color: el.color,
          textAlign: el.textAlign
        });
        this.showToast('Title style synchronized across all slides');
      } else if (window.state.isDiagramTitleSelected) {
        window.state.syncTitleStyleToAllSlides(window.state.titleStyle);
        this.showToast('Diagram title style synchronized across all slides');
      }
    });

    const fillColorInput = document.getElementById('ctx-fill-color');
    if (fillColorInput) {
      fillColorInput.addEventListener('input', (e) => {
        window.state.updateSelectedElements({ fillColor: e.target.value, fillGradient: null });
      });
    }

    // Layering Actions
    document.getElementById('ctx-btn-bring-front')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (el) window.state.bringToFront(el.id);
    });

    document.getElementById('ctx-btn-send-back')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (el) window.state.sendToBack(el.id);
    });

    // Duplicate & Delete
    document.getElementById('ctx-btn-duplicate')?.addEventListener('click', () => window.state.duplicateSelectedElements());
    document.getElementById('ctx-btn-delete')?.addEventListener('click', () => window.state.deleteSelectedElements());
  }

  execTextCommand(cmd) {
    const el = window.state.getSelectedElement();
    if (!el || el.type !== 'text') return;

    if (window.canvasEngine && window.canvasEngine.isInlineEditing) {
      document.execCommand(cmd, false, null);
      return;
    }

    if (window.canvasEngine) {
      window.canvasEngine.startInlineEditing(el.id);
      setTimeout(() => {
        document.execCommand(cmd, false, null);
      }, 15);
    }
  }

  syncContextualToolbar() {
    const bar = document.getElementById('contextual-formatting-bar');
    if (!bar) return;

    const selected = window.state.getSelectedElement();
    const isDiagTitle = window.state.isDiagramTitleSelected;
    const textGroup = document.getElementById('ctx-group-text');
    const shapeGroup = document.getElementById('ctx-group-shape');
    const layerGroup = document.getElementById('ctx-group-layering');
    const syncTitleBtn = document.getElementById('ctx-btn-sync-title');

    if (!selected && !isDiagTitle) {
      bar.classList.add('is-disabled');
      if (textGroup) textGroup.style.display = 'none';
      if (shapeGroup) shapeGroup.style.display = 'none';
      if (layerGroup) layerGroup.style.display = 'none';
      if (syncTitleBtn) syncTitleBtn.style.display = 'none';
      return;
    }

    bar.classList.remove('is-disabled');

    if (isDiagTitle) {
      if (textGroup) textGroup.style.display = 'flex';
      if (shapeGroup) shapeGroup.style.display = 'none';
      if (layerGroup) layerGroup.style.display = 'none';
      if (syncTitleBtn) syncTitleBtn.style.display = 'inline-flex';

      const activeSlide = window.state.getActiveSlide();
      const style = Object.assign({}, window.state.titleStyle, activeSlide?.zoomFlowData?.titleStyle || {});

      const fontSelect = document.getElementById('ctx-font-family');
      if (fontSelect && style.fontFamily) fontSelect.value = style.fontFamily;

      const sizeInput = document.getElementById('ctx-font-size');
      if (sizeInput && style.fontSize) sizeInput.value = style.fontSize;

      const colorInput = document.getElementById('ctx-text-color');
      if (colorInput && style.color && style.color.startsWith('#')) colorInput.value = style.color;

      document.getElementById('ctx-btn-bold')?.classList.toggle('is-active', style.fontWeight === '700' || style.fontWeight === 'bold');
      document.getElementById('ctx-btn-italic')?.classList.toggle('is-active', style.fontStyle === 'italic');
      document.getElementById('ctx-btn-underline')?.classList.toggle('is-active', style.textDecoration === 'underline');

      ['left', 'center', 'right', 'justify'].forEach(align => {
        document.getElementById(`ctx-btn-align-${align}`)?.classList.toggle('is-active', (style.textAlign || 'left') === align);
      });

      document.getElementById('ctx-btn-list-ul')?.classList.remove('is-active');
      document.getElementById('ctx-btn-list-ol')?.classList.remove('is-active');
      return;
    }

    if (layerGroup) layerGroup.style.display = 'flex';

    if (selected.type === 'text') {
      if (textGroup) textGroup.style.display = 'flex';
      if (shapeGroup) shapeGroup.style.display = 'none';

      const isTitle = selected.textType === 'title' || (selected.id && selected.id.toLowerCase().includes('title'));
      if (syncTitleBtn) syncTitleBtn.style.display = isTitle ? 'inline-flex' : 'none';

      const fontSelect = document.getElementById('ctx-font-family');
      if (fontSelect && selected.fontFamily) fontSelect.value = selected.fontFamily;

      const sizeInput = document.getElementById('ctx-font-size');
      if (sizeInput && selected.fontSize) sizeInput.value = selected.fontSize;

      const colorInput = document.getElementById('ctx-text-color');
      if (colorInput && selected.color && selected.color.startsWith('#')) colorInput.value = selected.color;

      document.getElementById('ctx-btn-bold')?.classList.toggle('is-active', selected.fontWeight === '700' || selected.fontWeight === 'bold');
      document.getElementById('ctx-btn-italic')?.classList.toggle('is-active', selected.fontStyle === 'italic');
      document.getElementById('ctx-btn-underline')?.classList.toggle('is-active', selected.textDecoration === 'underline');

      ['left', 'center', 'right', 'justify'].forEach(align => {
        document.getElementById(`ctx-btn-align-${align}`)?.classList.toggle('is-active', (selected.textAlign || 'left') === align);
      });

      const hasUl = selected.content && /<ul\b/i.test(selected.content);
      const hasOl = selected.content && /<ol\b/i.test(selected.content);
      document.getElementById('ctx-btn-list-ul')?.classList.toggle('is-active', !!hasUl);
      document.getElementById('ctx-btn-list-ol')?.classList.toggle('is-active', !!hasOl);
    } else if (selected.type === 'shape' || selected.type === 'icon') {
      if (syncTitleBtn) syncTitleBtn.style.display = 'none';
      if (textGroup) textGroup.style.display = 'none';
      if (shapeGroup) shapeGroup.style.display = 'flex';

      const fillColor = document.getElementById('ctx-fill-color');
      if (fillColor) fillColor.value = selected.fillColor || selected.iconColor || CONFIG.colors.udesGreen;
    } else {
      if (syncTitleBtn) syncTitleBtn.style.display = 'none';
      if (textGroup) textGroup.style.display = 'none';
      if (shapeGroup) shapeGroup.style.display = 'none';
    }
  }

  // --- 4. Right Inspector Panel Tabs ---

  bindInspectorPanel() {
    const tabBtns = document.querySelectorAll('.inspector-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchInspectorTab(tab);
      });
    });

    // Aspect Ratio Changer
    const ratioSelect = document.getElementById('slide-aspect-ratio-select');
    if (ratioSelect) {
      ratioSelect.addEventListener('change', (e) => {
        window.state.aspectRatio = e.target.value;
        window.canvasEngine.updateStageDimensions();
        window.canvasEngine.fitToWindow();
        window.canvasEngine.renderActiveSlide();
        window.slideManager.renderThumbnails();
      });
    }

    // Toggle / Collapse Inspector Panel
    const toggleBtn = document.getElementById('btn-toggle-inspector');
    const expandBtn = document.getElementById('btn-expand-inspector');
    const inspectorPanel = document.getElementById('inspector-panel');

    const setInspectorCollapsed = (collapsed) => {
      if (!inspectorPanel) return;
      inspectorPanel.classList.toggle('is-collapsed', collapsed);
      if (expandBtn) expandBtn.classList.toggle('is-hidden', !collapsed);

      setTimeout(() => {
        if (window.canvasEngine) {
          window.canvasEngine.fitToWindow();
        }
      }, 240);
    };

    toggleBtn?.addEventListener('click', () => setInspectorCollapsed(true));
    expandBtn?.addEventListener('click', () => setInspectorCollapsed(false));
    this.setInspectorCollapsed = setInspectorCollapsed;

    // Toggle / Collapse Left Sidebar
    const toggleLeftBtn = document.getElementById('btn-toggle-left-sidebar');
    const expandLeftBtn = document.getElementById('btn-expand-left-sidebar');
    const leftSidebar = document.getElementById('sidebar-slides');

    const setLeftSidebarCollapsed = (collapsed) => {
      if (!leftSidebar) return;
      leftSidebar.classList.toggle('is-collapsed', collapsed);
      if (expandLeftBtn) expandLeftBtn.classList.toggle('is-hidden', !collapsed);

      setTimeout(() => {
        if (window.canvasEngine) {
          window.canvasEngine.fitToWindow();
        }
      }, 240);
    };

    toggleLeftBtn?.addEventListener('click', () => setLeftSidebarCollapsed(true));
    expandLeftBtn?.addEventListener('click', () => setLeftSidebarCollapsed(false));
    this.setLeftSidebarCollapsed = setLeftSidebarCollapsed;
  }

  switchInspectorTab(tabName) {
    // If panel is collapsed and user switches tab, auto-expand
    const inspectorPanel = document.getElementById('inspector-panel');
    if (inspectorPanel && inspectorPanel.classList.contains('is-collapsed')) {
      if (this.setInspectorCollapsed) this.setInspectorCollapsed(false);
    }
    this.activeInspectorTab = tabName;
    document.querySelectorAll('.inspector-tab-btn').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.inspector-tab-pane').forEach(pane => {
      pane.classList.toggle('is-active', pane.id === `tab-pane-${tabName}`);
    });

    if (tabName === 'properties') {
      this.syncInspectorProperties();
    } else if (tabName === 'flow') {
      this.renderFlowInspector();
    }
  }

  syncInspectorProperties() {
    const pane = document.getElementById('tab-pane-properties');
    if (!pane) return;

    const el = window.state.getSelectedElement();
    if (!el) {
      pane.innerHTML = `
        <div class="empty-inspector-state">
          <i class="fa-solid fa-arrow-pointer"></i>
          <h4>No Element Selected</h4>
          <p>Click on any title, text box, shape, or image to customize dimensions, colors, and styling.</p>
        </div>
      `;
      return;
    }

    pane.innerHTML = `
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-sliders"></i> Element Properties</h4>
          <span class="badge-tag">${el.type.toUpperCase()}</span>
        </div>

        <!-- Position & Size -->
        <div class="prop-grid-2">
          <div class="prop-field">
            <label>Position X</label>
            <input type="number" id="prop-x" value="${Math.round(el.x)}" class="prop-input">
          </div>
          <div class="prop-field">
            <label>Position Y</label>
            <input type="number" id="prop-y" value="${Math.round(el.y)}" class="prop-input">
          </div>
          <div class="prop-field">
            <label>Width (W)</label>
            <input type="number" id="prop-width" value="${Math.round(el.width)}" class="prop-input">
          </div>
          <div class="prop-field">
            <label>Height (H)</label>
            <input type="number" id="prop-height" value="${Math.round(el.height)}" class="prop-input">
          </div>
        </div>

        <!-- Rotation & Opacity -->
        <div class="prop-field" style="margin-top:12px;">
          <label>Rotation (<span id="lbl-val-rotation">${el.rotation || 0}°</span>)</label>
          <input type="range" id="prop-rotation" min="0" max="360" value="${el.rotation || 0}" class="prop-range">
        </div>

        <div class="prop-field" style="margin-top:12px;">
          <label>Opacity (<span id="lbl-val-opacity">${Math.round((el.opacity !== undefined ? el.opacity : 1) * 100)}%</span>)</label>
          <input type="range" id="prop-opacity" min="0.1" max="1" step="0.05" value="${el.opacity !== undefined ? el.opacity : 1}" class="prop-range">
        </div>
      </div>

      <!-- Style & Appearance -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-palette"></i> Style & Appearance</h4>
        </div>
        
        ${el.type === 'shape' || el.type === 'image' ? `
          <div class="prop-field">
            <label>Corner Radius (<span id="lbl-val-radius">${el.borderRadius || 0}px</span>)</label>
            <input type="range" id="prop-radius" min="0" max="100" value="${el.borderRadius || 0}" class="prop-range">
          </div>
        ` : ''}

        ${el.type === 'image' ? `
          <div class="prop-field" style="margin-top:10px;">
            <label>Image Fit</label>
            <select id="prop-object-fit" class="prop-select">
              <option value="contain" ${el.objectFit === 'contain' ? 'selected' : ''}>Contain (Full)</option>
              <option value="cover" ${el.objectFit === 'cover' ? 'selected' : ''}>Cover (Fill)</option>
            </select>
          </div>
          <div class="prop-field" style="margin-top:10px;">
            <label>Grayscale Filter (<span id="lbl-val-grayscale">${el.grayscale || 0}%</span>)</label>
            <input type="range" id="prop-grayscale" min="0" max="100" value="${el.grayscale || 0}" class="prop-range">
          </div>
        ` : ''}
        ${el.type === 'html' ? `
          <div class="prop-field" style="margin-top:10px;">
            <label>HTML / SVG Source Code</label>
            <textarea id="prop-html-content" class="code-textarea" style="width:100%;height:180px;font-family:'Fira Code',monospace;font-size:12px;padding:8px;background:#090d16;color:#38bdf8;border:1px solid var(--border-strong);border-radius:6px;outline:none;resize:vertical;">${escapeHtml(el.htmlContent || '')}</textarea>
          </div>
        ` : ''}
      </div>

      <!-- Shadow Effect Controls (Text, Images & Shapes) -->
      <div class="panel-section">
        <div class="section-header" style="display:flex;align-items:center;justify-content:space-between;">
          <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Shadow Effect</h4>
          <button id="btn-reset-shadow" class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px;" title="Reset Shadow to None">
            <i class="fa-solid fa-rotate-left"></i> Reset
          </button>
        </div>
        <div class="prop-field">
          <label>Shadow Blur (<span id="lbl-val-shadow-blur">${Math.min(20, el.shadowBlur || 0)}px</span>)</label>
          <input type="range" id="prop-shadow-blur" min="0" max="20" value="${Math.min(20, el.shadowBlur || 0)}" class="prop-range">
        </div>
        <div class="prop-field" style="margin-top:10px;">
          <label>Offset X (<span id="lbl-val-shadow-offset-x">${Math.min(20, Math.max(-20, el.shadowOffsetX || 0))}px</span>)</label>
          <input type="range" id="prop-shadow-offset-x" min="-20" max="20" value="${Math.min(20, Math.max(-20, el.shadowOffsetX || 0))}" class="prop-range">
        </div>
        <div class="prop-field" style="margin-top:10px;">
          <label>Offset Y (<span id="lbl-val-shadow-offset-y">${Math.min(20, Math.max(-20, el.shadowOffsetY !== undefined ? el.shadowOffsetY : (el.shadowBlur ? 4 : 0)))}px</span>)</label>
          <input type="range" id="prop-shadow-offset-y" min="-20" max="20" value="${Math.min(20, Math.max(-20, el.shadowOffsetY !== undefined ? el.shadowOffsetY : (el.shadowBlur ? 4 : 0)))}" class="prop-range">
        </div>
        <div class="prop-field" style="margin-top:10px;">
          <label>Shadow Color</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="color" id="prop-shadow-color" value="${el.shadowColor && el.shadowColor.startsWith('#') ? el.shadowColor : '#000000'}" style="width:36px;height:32px;border:none;border-radius:4px;cursor:pointer;background:transparent;">
            <span style="font-size:12px;color:var(--text-secondary);">Pick Color</span>
          </div>
        </div>
      </div>

      <!-- Quick Layering Buttons -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-layer-group"></i> Layer Arrangement</h4>
        </div>
        <div class="layer-buttons-grid">
          <button id="prop-btn-front" class="btn btn-secondary btn-sm"><i class="fa-solid fa-angles-up"></i> Bring to Front</button>
          <button id="prop-btn-forward" class="btn btn-secondary btn-sm"><i class="fa-solid fa-angle-up"></i> Bring Forward</button>
          <button id="prop-btn-backward" class="btn btn-secondary btn-sm"><i class="fa-solid fa-angle-down"></i> Send Backward</button>
          <button id="prop-btn-back" class="btn btn-secondary btn-sm"><i class="fa-solid fa-angles-down"></i> Send to Back</button>
        </div>
      </div>
    `;

    // Bind Inspector Inputs
    document.getElementById('prop-x')?.addEventListener('input', (e) => {
      window.state.updateElement(el.id, { x: parseInt(e.target.value, 10) || 0 });
    });
    document.getElementById('prop-y')?.addEventListener('input', (e) => {
      window.state.updateElement(el.id, { y: parseInt(e.target.value, 10) || 0 });
    });
    document.getElementById('prop-width')?.addEventListener('input', (e) => {
      window.state.updateElement(el.id, { width: Math.max(10, parseInt(e.target.value, 10) || 10) });
    });
    document.getElementById('prop-height')?.addEventListener('input', (e) => {
      window.state.updateElement(el.id, { height: Math.max(10, parseInt(e.target.value, 10) || 10) });
    });
    document.getElementById('prop-rotation')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      const lbl = document.getElementById('lbl-val-rotation');
      if (lbl) lbl.textContent = `${val}°`;
      window.state.updateElement(el.id, { rotation: val });
    });
    document.getElementById('prop-opacity')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 1;
      const lbl = document.getElementById('lbl-val-opacity');
      if (lbl) lbl.textContent = `${Math.round(val * 100)}%`;
      window.state.updateElement(el.id, { opacity: val });
    });
    document.getElementById('prop-radius')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      const lbl = document.getElementById('lbl-val-radius');
      if (lbl) lbl.textContent = `${val}px`;
      window.state.updateElement(el.id, { borderRadius: val });
    });
    document.getElementById('prop-grayscale')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      const lbl = document.getElementById('lbl-val-grayscale');
      if (lbl) lbl.textContent = `${val}%`;
      window.state.updateElement(el.id, { grayscale: val });
    });
    document.getElementById('prop-shadow-blur')?.addEventListener('input', (e) => {
      const val = Math.min(20, Math.max(0, parseInt(e.target.value, 10) || 0));
      const lbl = document.getElementById('lbl-val-shadow-blur');
      if (lbl) lbl.textContent = `${val}px`;
      window.state.updateElement(el.id, { shadowBlur: val });
    });
    document.getElementById('prop-shadow-offset-x')?.addEventListener('input', (e) => {
      const val = Math.min(20, Math.max(-20, parseInt(e.target.value, 10) || 0));
      const lbl = document.getElementById('lbl-val-shadow-offset-x');
      if (lbl) lbl.textContent = `${val}px`;
      window.state.updateElement(el.id, { shadowOffsetX: val });
    });
    document.getElementById('prop-shadow-offset-y')?.addEventListener('input', (e) => {
      const val = Math.min(20, Math.max(-20, parseInt(e.target.value, 10) || 0));
      const lbl = document.getElementById('lbl-val-shadow-offset-y');
      if (lbl) lbl.textContent = `${val}px`;
      window.state.updateElement(el.id, { shadowOffsetY: val });
    });
    document.getElementById('prop-shadow-color')?.addEventListener('input', (e) => {
      window.state.updateElement(el.id, { shadowColor: e.target.value });
    });
    document.getElementById('btn-reset-shadow')?.addEventListener('click', () => {
      window.state.updateElement(el.id, {
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowColor: '#000000',
        shadow: 'none'
      });
      this.syncInspectorProperties();
    });
    document.getElementById('prop-object-fit')?.addEventListener('change', (e) => {
      window.state.updateElement(el.id, { objectFit: e.target.value });
    });
    document.getElementById('prop-html-content')?.addEventListener('input', (e) => {
      window.state.updateElement(el.id, { htmlContent: e.target.value });
    });

    // Layer buttons
    document.getElementById('prop-btn-front')?.addEventListener('click', () => window.state.bringToFront(el.id));
    document.getElementById('prop-btn-back')?.addEventListener('click', () => window.state.sendToBack(el.id));
    document.getElementById('prop-btn-forward')?.addEventListener('click', () => window.state.bringForward(el.id));
    document.getElementById('prop-btn-backward')?.addEventListener('click', () => window.state.sendBackward(el.id));
  }

  // --- 5. Modals (Icons, Tables, Charts, HTML, Shortcuts) ---

  bindModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('is-open');
      });

      modal.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.classList.remove('is-open');
        });
      });
    });

    document.getElementById('btn-help-shortcuts')?.addEventListener('click', () => {
      document.getElementById('modal-shortcuts')?.classList.add('is-open');
    });

    // HTML Modal Confirm, File Drop Zone & Upload Handlers
    const confirmHtmlBtn = document.getElementById('btn-confirm-insert-html');
    const htmlFileInput = document.getElementById('file-input-html-upload');
    const htmlDropZone = document.getElementById('html-drop-zone');
    const htmlModal = document.getElementById('modal-insert-html');
    const htmlTextarea = document.getElementById('input-html-code');

    const processHtmlFile = (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result || '';
        if (htmlTextarea) htmlTextarea.value = content;

        // Confirm & Insert automatically
        const mode = htmlModal ? htmlModal.getAttribute('data-target-mode') : null;
        if (mode === 'new-slide') {
          window.state.addSlide({ background: { type: 'color', value: '#FFFFFF' } });
          window.state.addElement(ElementFactory.createHtmlElement(content, { x: 40, y: 40, width: 1200, height: 640 }));
        } else {
          window.state.addElement(ElementFactory.createHtmlElement(content));
        }

        if (htmlModal) {
          htmlModal.classList.remove('is-open');
          htmlModal.removeAttribute('data-target-mode');
        }
      };
      reader.readAsText(file);
    };

    htmlDropZone?.addEventListener('click', (e) => {
      e.stopPropagation();
      htmlFileInput?.click();
    });

    htmlDropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (htmlDropZone) {
        htmlDropZone.style.borderColor = 'var(--udes-lime)';
        htmlDropZone.style.background = 'var(--bg-surface-hover)';
      }
    });

    htmlDropZone?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (htmlDropZone) {
        htmlDropZone.style.borderColor = 'var(--border-strong)';
        htmlDropZone.style.background = 'var(--bg-surface)';
      }
    });

    htmlDropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (htmlDropZone) {
        htmlDropZone.style.borderColor = 'var(--border-strong)';
        htmlDropZone.style.background = 'var(--bg-surface)';
      }
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processHtmlFile(e.dataTransfer.files[0]);
      }
    });

    htmlFileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processHtmlFile(e.target.files[0]);
      }
    });

    confirmHtmlBtn?.addEventListener('click', () => {
      const htmlCode = htmlTextarea ? htmlTextarea.value.trim() : '';
      const mode = htmlModal ? htmlModal.getAttribute('data-target-mode') : null;

      if (mode === 'new-slide') {
        window.state.addSlide({ background: { type: 'color', value: '#FFFFFF' } });
        window.state.addElement(ElementFactory.createHtmlElement(htmlCode, { x: 40, y: 40, width: 1200, height: 640 }));
      } else {
        window.state.addElement(ElementFactory.createHtmlElement(htmlCode));
      }

      if (htmlModal) {
        htmlModal.classList.remove('is-open');
        htmlModal.removeAttribute('data-target-mode');
      }
    });
  }

  openHtmlModal(targetMode) {
    const modal = document.getElementById('modal-insert-html');
    if (!modal) return;
    if (targetMode) {
      modal.setAttribute('data-target-mode', targetMode);
    } else {
      modal.removeAttribute('data-target-mode');
    }
    const textarea = document.getElementById('input-html-code');
    if (textarea) textarea.value = '';
    modal.classList.add('is-open');
  }

  openIconModal() {
    const modal = document.getElementById('modal-icons');
    if (!modal) return;

    const iconGrid = document.getElementById('modal-icon-grid');
    const searchInput = document.getElementById('modal-icon-search');

    const renderIcons = (filter = '') => {
      if (!iconGrid) return;
      const filtered = CONFIG.popularIcons.filter(ic => ic.toLowerCase().includes(filter.toLowerCase()));
      iconGrid.innerHTML = filtered.map(ic => `
        <button class="icon-picker-btn" data-icon="${ic}" title="${ic}">
          <i class="fa-solid ${ic}"></i>
          <span>${ic.replace('fa-', '')}</span>
        </button>
      `).join('');

      iconGrid.querySelectorAll('.icon-picker-btn').forEach(b => {
        b.addEventListener('click', () => {
          const iconClass = b.getAttribute('data-icon');
          window.state.addElement(ElementFactory.createIcon(iconClass));
          modal.classList.remove('is-open');
        });
      });
    };

    renderIcons();

    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = (e) => renderIcons(e.target.value);
    }

    modal.classList.add('is-open');
  }

  openTableModal() {
    const modal = document.getElementById('modal-table');
    if (!modal) return;

    const insertBtn = document.getElementById('btn-modal-insert-table');
    if (insertBtn) {
      insertBtn.onclick = () => {
        const rows = parseInt(document.getElementById('table-input-rows')?.value || '3', 10);
        const cols = parseInt(document.getElementById('table-input-cols')?.value || '3', 10);
        window.state.addElement(ElementFactory.createTable(rows, cols));
        modal.classList.remove('is-open');
      };
    }

    modal.classList.add('is-open');
  }

  openChartModal() {
    const modal = document.getElementById('modal-chart');
    if (!modal) return;

    const insertBtn = document.getElementById('btn-modal-insert-chart');
    if (insertBtn) {
      insertBtn.onclick = () => {
        const type = document.getElementById('chart-type-select')?.value || 'bar';
        const title = document.getElementById('chart-title-input')?.value || 'UdeS Performance Statistics';
        window.state.addElement(ElementFactory.createChart(type, { chartTitle: title }));
        modal.classList.remove('is-open');
      };
    }

    modal.classList.add('is-open');
  }

  // --- 6. Keyboard Shortcuts ---

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || window.canvasEngine.isInlineEditing) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            window.state.redo();
          } else {
            window.state.undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          window.state.redo();
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          window.state.copySelectedElements();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          window.state.pasteElements();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          window.state.duplicateSelectedElements();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          window.state.selectAll();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          window.exportEngine.savePresentationJson();
        }
      } else {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          window.state.deleteSelectedElements();
        } else if (e.key === 'Escape') {
          window.state.clearSelection();
        } else if (e.key === 'PageDown') {
          e.preventDefault();
          if (window.state.activeSlideIndex < window.state.slides.length - 1) {
            window.state.setActiveSlideIndex(window.state.activeSlideIndex + 1);
          }
        } else if (e.key === 'PageUp') {
          e.preventDefault();
          if (window.state.activeSlideIndex > 0) {
            window.state.setActiveSlideIndex(window.state.activeSlideIndex - 1);
          }
        } else if (e.key === 'g' || e.key === 'G') {
          const activeSlide = window.state.getActiveSlide();
          if (activeSlide && activeSlide.isZoomFlow) {
            e.preventDefault();
            this.toggleFlowSnapToGrid();
          }
        }
      }
    });
  }

  // --- 7. Editable Title in Top Bar ---

  bindTitleEditor() {
    const titleInput = document.getElementById('presentation-title-input');
    if (!titleInput) return;

    titleInput.value = window.state.title;
    titleInput.addEventListener('input', (e) => {
      window.state.title = e.target.value || 'Untitled Presentation';
      document.title = `${window.state.title} - SlideMAKER`;
    });
  }

  // --- Flow Diagram Editor Controller (Direct On-Slide Flow Editing) ---

  bindFlowEditingEvents() {
    document.getElementById('btn-flow-add-node')?.addEventListener('click', () => {
      this.addNodeToActiveFlow();
    });

    document.getElementById('btn-flow-snap-grid')?.addEventListener('click', () => {
      this.toggleFlowSnapToGrid();
    });

    document.getElementById('ribbon-flow-theme')?.addEventListener('change', (e) => {
      this.updateFlowSettings('theme', e.target.value);
    });

    document.getElementById('btn-flow-overview')?.addEventListener('click', () => {
      if (window.canvasEngine && window.canvasEngine.currentZoomFlowController) {
        window.canvasEngine.currentZoomFlowController.zoomToOverview();
      }
    });
  }

  toggleFlowSnapToGrid() {
    if (!window.zoomFlowEngine) return;
    window.zoomFlowEngine.snapToGrid = !window.zoomFlowEngine.snapToGrid;
    this.syncFlowSnapGridUI();
  }

  syncFlowSnapGridUI() {
    const isSnap = !!(window.zoomFlowEngine && window.zoomFlowEngine.snapToGrid);
    const snapBtn = document.getElementById('btn-flow-snap-grid');
    if (snapBtn) {
      snapBtn.classList.toggle('active', isSnap);
      snapBtn.title = isSnap ? 'Snap to Grid: ON (Press G to toggle)' : 'Snap to Grid: OFF (Press G to toggle)';
    }
    const flowWrapper = document.querySelector('.zoom-flow-wrapper');
    if (flowWrapper) {
      flowWrapper.classList.toggle('is-grid-snapping', isSnap);
    }
  }

  syncEditorMode() {
    const activeSlide = window.state ? window.state.getActiveSlide() : null;
    const isFlow = !!(activeSlide && activeSlide.isZoomFlow);

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.classList.toggle('is-flow-slide-mode', isFlow);
    }

    const slideTools = document.getElementById('ribbon-slide-tools');
    const flowTools = document.getElementById('ribbon-flow-tools');
    if (slideTools) slideTools.style.display = isFlow ? 'none' : 'flex';
    if (flowTools) flowTools.style.display = isFlow ? 'flex' : 'none';

    const tabBtnFlow = document.getElementById('tab-btn-flow');
    const tabBtnBg = document.getElementById('tab-btn-background');
    if (tabBtnFlow) tabBtnFlow.style.display = isFlow ? 'inline-flex' : 'none';
    if (tabBtnBg) tabBtnBg.style.display = isFlow ? 'none' : 'inline-flex';

    if (isFlow) {
      const flowData = activeSlide.zoomFlowData || {};
      const themeSel = document.getElementById('ribbon-flow-theme');
      if (themeSel && flowData.theme) themeSel.value = flowData.theme;

      this.syncFlowSnapGridUI();

      if (this.activeInspectorTab !== 'flow' && this.activeInspectorTab !== 'settings') {
        this.switchInspectorTab('flow');
      } else if (this.activeInspectorTab === 'flow') {
        this.renderFlowInspector();
      }
    } else {
      if (this.activeInspectorTab === 'flow') {
        const selected = window.state.getSelectedElement();
        this.switchInspectorTab(selected ? 'properties' : 'background');
      }
    }
  }

  renderFlowInspector() {
    const container = document.getElementById('flow-inspector-content');
    if (!container) return;

    const activeSlide = window.state ? window.state.getActiveSlide() : null;
    if (!activeSlide || !activeSlide.isZoomFlow) {
      container.innerHTML = '<p class="empty-hint" style="padding:16px;">Select a Flow Diagram slide to edit.</p>';
      return;
    }

    const flowData = activeSlide.zoomFlowData || { title: 'Flow Diagram', layout: 'linear-horizontal', theme: 'udes-emerald', nodes: [] };
    const nodes = flowData.nodes || [];

    if (this.selectedFlowNodeIndex === undefined || this.selectedFlowNodeIndex === null || this.selectedFlowNodeIndex >= nodes.length) {
      this.selectedFlowNodeIndex = nodes.length > 0 ? 0 : -1;
    }

    const selectedNode = this.selectedFlowNodeIndex >= 0 ? nodes[this.selectedFlowNodeIndex] : null;

    const titleStyle = Object.assign({}, window.state.titleStyle, flowData.titleStyle || {});

    let html = `
      <div class="panel-section">
        <div class="section-header" style="justify-content:space-between;">
          <h4><i class="fa-solid fa-diagram-project" style="color:var(--udes-lime);"></i> Diagram Settings</h4>
          <span class="zf-badge" style="font-size:10px;padding:2px 7px;">${nodes.length} Nodes</span>
        </div>

        <div class="prop-field">
          <label>Diagram Title</label>
          <input type="text" id="flow-prop-title" class="prop-input" value="${this.escapeHtml(flowData.title || '')}" placeholder="Diagram Title">
        </div>

        <div class="prop-field">
          <label>Diagram Subtitle</label>
          <input type="text" id="flow-prop-subtitle" class="prop-input" value="${this.escapeHtml(flowData.subtitle || '')}" placeholder="Optional Subtitle">
        </div>

        <!-- Title Typography & Style (Synchronized across all slides) -->
        <div style="margin-top:10px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <label style="font-size:11px;font-weight:700;color:var(--udes-lime);text-transform:uppercase;letter-spacing:0.5px;margin:0;">
              <i class="fa-solid fa-heading"></i> Title Typography & Style
            </label>
            <span style="font-size:10px;color:var(--text-secondary);" title="Styles synchronize across all slides">Synced</span>
          </div>

          <div class="prop-field">
            <label style="font-size:11px;">Font Family</label>
            <select id="flow-title-font" class="prop-select" style="font-size:11px;padding:4px 6px;">
              ${CONFIG.fonts.map(f => `<option value="${f.name}" ${(titleStyle.fontFamily || CONFIG.defaultFont || 'JetBrains Mono') === f.name ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </div>

          <div class="prop-grid-2" style="margin-top:6px;">
            <div class="prop-field">
              <label style="font-size:11px;">Font Size</label>
              <input type="number" id="flow-title-size" class="prop-input" value="${titleStyle.fontSize || 44}" min="16" max="96" style="font-size:11px;padding:4px 6px;">
            </div>
            <div class="prop-field">
              <label style="font-size:11px;">Title Color</label>
              <input type="color" id="flow-title-color" value="${titleStyle.color && titleStyle.color.startsWith('#') ? titleStyle.color : '#FFFFFF'}" style="width:100%;height:28px;border:none;border-radius:4px;cursor:pointer;background:transparent;">
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:6px;margin-top:8px;">
            <button id="flow-title-bold" class="btn btn-secondary btn-sm ${titleStyle.fontWeight === '700' || titleStyle.fontWeight === 'bold' ? 'is-active' : ''}" style="flex:1;padding:4px;" title="Bold"><i class="fa-solid fa-bold"></i></button>
            <button id="flow-title-italic" class="btn btn-secondary btn-sm ${titleStyle.fontStyle === 'italic' ? 'is-active' : ''}" style="flex:1;padding:4px;" title="Italic"><i class="fa-solid fa-italic"></i></button>
            <button id="flow-title-align-left" class="btn btn-secondary btn-sm ${(titleStyle.textAlign || 'left') === 'left' ? 'is-active' : ''}" style="flex:1;padding:4px;" title="Align Left"><i class="fa-solid fa-align-left"></i></button>
            <button id="flow-title-align-center" class="btn btn-secondary btn-sm ${titleStyle.textAlign === 'center' ? 'is-active' : ''}" style="flex:1;padding:4px;" title="Align Center"><i class="fa-solid fa-align-center"></i></button>
            <button id="flow-title-align-right" class="btn btn-secondary btn-sm ${titleStyle.textAlign === 'right' ? 'is-active' : ''}" style="flex:1;padding:4px;" title="Align Right"><i class="fa-solid fa-align-right"></i></button>
          </div>

          <button id="flow-btn-sync-all-titles" class="btn btn-secondary btn-sm" style="width:100%;margin-top:10px;font-size:11px;padding:6px;color:var(--udes-lime);border-color:var(--udes-lime);background:rgba(127,194,63,0.08);" title="Apply this title style to all slides in the presentation">
            <i class="fa-solid fa-arrows-rotate"></i> Sync Title Style to All Slides
          </button>
        </div>

        <div class="prop-field">
          <label>Visual Theme</label>
          <select id="flow-prop-theme" class="prop-select">
            <option value="udes-emerald" ${flowData.theme === 'udes-emerald' ? 'selected' : ''}>UdeS Emerald</option>
            <option value="cyber-dark" ${flowData.theme === 'cyber-dark' ? 'selected' : ''}>Cyber Dark</option>
            <option value="ocean-teal" ${flowData.theme === 'ocean-teal' ? 'selected' : ''}>Oceanic</option>
            <option value="glass-light" ${flowData.theme === 'glass-light' ? 'selected' : ''}>Clean Glass</option>
          </select>
        </div>

        <button class="btn btn-primary btn-sm" id="flow-btn-add-node-panel" style="width:100%;margin-top:8px;">
          <i class="fa-solid fa-plus"></i> Add Node
        </button>
      </div>

      <!-- Nodes List Section -->
      <div class="panel-section">
        <div class="section-header">
          <h4><i class="fa-solid fa-list-ol" style="color:var(--udes-lime);"></i> Diagram Nodes</h4>
        </div>

        ${nodes.length === 0 ? `
          <div class="zf-empty-hint-card">
            <i class="fa-solid fa-circle-nodes" style="font-size:24px;color:var(--text-muted);margin-bottom:6px;"></i>
            <p style="font-size:12px;color:var(--text-secondary);margin:0;">No nodes yet. Click "+ Add Node" to add your first stage.</p>
          </div>
        ` : `
          <div class="zf-inspector-nodes-list">
            ${nodes.map((node, i) => `
              <div class="zf-inspector-node-item ${i === this.selectedFlowNodeIndex ? 'is-selected' : ''}" data-index="${i}">
                <div class="zf-node-item-drag-handle">
                  <span class="zf-node-badge-mini" style="background:${node.color || '#00A350'};">${i + 1}</span>
                </div>
                <div class="zf-node-item-info">
                  <div class="zf-node-item-title">${this.escapeHtml(node.title || `Node ${i + 1}`)}</div>
                  <div class="zf-node-item-sub">${this.escapeHtml(node.subtitle || '')}</div>
                </div>
                <div class="zf-node-item-actions">
                  <button class="zf-node-action-btn zf-btn-move-up" data-index="${i}" title="Move Up" ${i === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-up"></i>
                  </button>
                  <button class="zf-node-action-btn zf-btn-move-down" data-index="${i}" title="Move Down" ${i === nodes.length - 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-down"></i>
                  </button>
                  <button class="zf-node-action-btn zf-btn-delete-node" data-index="${i}" title="Delete Node">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    if (selectedNode) {
      html += `
        <!-- Selected Node Details -->
        <div class="panel-section">
          <div class="section-header">
            <h4><i class="fa-solid fa-sliders" style="color:var(--udes-lime);"></i> Node ${this.selectedFlowNodeIndex + 1} Properties</h4>
          </div>

          <div class="prop-field">
            <label>Node Title</label>
            <input type="text" id="flow-node-title" class="prop-input" value="${this.escapeHtml(selectedNode.title || '')}">
          </div>

          <div class="prop-field">
            <label>Subtitle / Description (Optional)</label>
            <input type="text" id="flow-node-subtitle" class="prop-input" value="${this.escapeHtml(selectedNode.subtitle || '')}">
          </div>

          <div class="prop-field">
            <label>Color</label>
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="color" id="flow-node-color" value="${selectedNode.color || '#00A350'}" style="width:36px;height:30px;border-radius:4px;border:none;cursor:pointer;background:transparent;">
              <input type="text" id="flow-node-color-text" class="prop-input" value="${selectedNode.color || '#00A350'}" style="flex:1;">
            </div>
          </div>

          <div class="prop-grid-2">
            <div class="prop-field">
              <label>Metric Value</label>
              <input type="text" id="flow-node-metric-val" class="prop-input" value="${this.escapeHtml(selectedNode.metricVal || '')}" placeholder="e.g. 98.4%">
            </div>
            <div class="prop-field">
              <label>Metric Label</label>
              <input type="text" id="flow-node-metric-lbl" class="prop-input" value="${this.escapeHtml(selectedNode.metricLbl || '')}" placeholder="e.g. ACCURACY">
            </div>
          </div>

          <div class="prop-field">
            <label>Icon</label>
            <div style="display:flex;align-items:center;gap:8px;">
              <select id="flow-node-icon" class="prop-select" style="flex:1;">
                <option value="fa-circle-dot" ${selectedNode.icon === 'fa-circle-dot' ? 'selected' : ''}>Circle Dot</option>
                <option value="fa-rocket" ${selectedNode.icon === 'fa-rocket' ? 'selected' : ''}>Rocket</option>
                <option value="fa-lightbulb" ${selectedNode.icon === 'fa-lightbulb' ? 'selected' : ''}>Lightbulb</option>
                <option value="fa-gears" ${selectedNode.icon === 'fa-gears' ? 'selected' : ''}>Gears</option>
                <option value="fa-chart-line" ${selectedNode.icon === 'fa-chart-line' ? 'selected' : ''}>Chart Line</option>
                <option value="fa-shield-halved" ${selectedNode.icon === 'fa-shield-halved' ? 'selected' : ''}>Shield</option>
                <option value="fa-flag" ${selectedNode.icon === 'fa-flag' ? 'selected' : ''}>Flag</option>
                <option value="fa-check-double" ${selectedNode.icon === 'fa-check-double' ? 'selected' : ''}>Checkmark</option>
                <option value="fa-bullseye" ${selectedNode.icon === 'fa-bullseye' ? 'selected' : ''}>Bullseye</option>
                <option value="fa-microchip" ${selectedNode.icon === 'fa-microchip' ? 'selected' : ''}>Microchip</option>
              </select>
              <div style="width:32px;height:32px;border-radius:6px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:${selectedNode.color || '#00A350'};">
                <i class="fa-solid ${selectedNode.icon || 'fa-circle-dot'}"></i>
              </div>
            </div>
          </div>

          <div class="prop-field">
            <label>Detailed Summary (Zoom Popout & Child Slide)</label>
            <textarea id="flow-node-summary" class="prop-input" style="height:60px;resize:vertical;">${this.escapeHtml(selectedNode.summary || '')}</textarea>
          </div>

          <div class="prop-field">
            <label>Bullet Points (One per line)</label>
            <textarea id="flow-node-bullets" class="prop-input" style="height:70px;resize:vertical;">${(selectedNode.bullets || []).map(b => this.escapeHtml(b)).join('\n')}</textarea>
          </div>

          <!-- Nested Sub-Diagram Section -->
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-subtle);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <label style="font-size:11px;font-weight:700;color:var(--text-secondary);display:flex;align-items:center;gap:5px;">
                <i class="fa-solid fa-diagram-project" style="color:var(--udes-lime);"></i> Nested Sub-Diagram
              </label>
              ${selectedNode.nestedDiagram ? `
                <span class="zf-badge" style="font-size:9.5px;padding:2px 6px;">
                  ${(selectedNode.nestedDiagram.nodes || []).length} Sub-Nodes
                </span>
              ` : ''}
            </div>

            ${selectedNode.nestedDiagram ? `
              <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:6px;padding:8px;display:flex;flex-direction:column;gap:6px;">
                <div style="font-size:11.5px;font-weight:600;color:#ffffff;display:flex;align-items:center;gap:6px;">
                  <i class="fa-solid fa-folder-tree" style="color:var(--udes-lime);font-size:12px;"></i>
                  <span>${this.escapeHtml(selectedNode.nestedDiagram.title || 'Nested Sub-Flow')}</span>
                </div>
                <div style="font-size:10.5px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${(selectedNode.nestedDiagram.nodes || []).map(sn => this.escapeHtml(sn.title)).join(' → ') || '<span style="color:var(--text-muted);font-style:italic;">No sub-nodes yet (click Open Slide to add)</span>'}
                </div>
                <div style="display:flex;gap:6px;margin-top:4px;">
                  <button class="btn btn-secondary btn-sm" id="flow-btn-open-nested-slide" style="flex:1;font-size:11px;" title="Jump to this nested diagram slide">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Slide
                  </button>
                  <button class="btn btn-sm" id="flow-btn-remove-nested-diagram" style="font-size:11px;background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);" title="Remove nested diagram">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ` : `
              <div style="background:rgba(0,0,0,0.2);border:1px dashed var(--border-subtle);border-radius:6px;padding:10px;text-align:center;">
                <p style="font-size:11px;color:var(--text-secondary);margin:0 0 8px 0;line-height:1.35;">
                  Create an interactive diagram inside this node to build multi-tier zoom presentations.
                </p>
                <button class="btn btn-primary btn-sm" id="flow-btn-add-nested-diagram" style="width:100%;font-size:11px;">
                  <i class="fa-solid fa-plus"></i> Add Diagram Inside Node
                </button>
              </div>
            `}
          </div>

          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn btn-secondary btn-sm" id="flow-btn-open-child" style="flex:1;" title="Open full regular slide content">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Slide
            </button>
            <button class="btn btn-sm" id="flow-btn-delete-current-node" style="background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.4);" title="Delete this node">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }

    // Connections Section
    const conns = flowData.connections || [];
    html += `
      <div class="panel-section">
        <div class="section-header" style="justify-content:space-between;">
          <h4><i class="fa-solid fa-bezier-curve" style="color:var(--udes-lime);"></i> Connections</h4>
          <span class="zf-badge" style="font-size:10px;padding:2px 7px;">${conns.length} Wires</span>
        </div>

        <p style="font-size:11.5px;color:var(--text-secondary);margin:0 0 10px 0;line-height:1.4;">
          <i class="fa-solid fa-circle-info" style="color:var(--udes-lime);margin-right:4px;"></i>
          Drag from circular ports on node edges to wire stages, or manage links below.
        </p>

        <div style="display:flex;gap:6px;margin-bottom:10px;">
          <button class="btn btn-secondary btn-sm" id="flow-btn-autoconnect" style="flex:1;font-size:11px;" title="Connect nodes sequentially 1→2→3...">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Connect
          </button>
          <button class="btn btn-sm" id="flow-btn-clear-conns" style="font-size:11px;background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3);" title="Remove all connections">
            <i class="fa-solid fa-trash-can"></i> Clear All
          </button>
        </div>

        ${conns.length === 0 ? `
          <div class="zf-empty-hint-card" style="padding:12px;">
            <p style="font-size:11.5px;color:var(--text-secondary);margin:0;">No connections yet. Drag between node ports to connect them.</p>
          </div>
        ` : `
          <div class="zf-inspector-conns-list" style="display:flex;flex-direction:column;gap:5px;max-height:160px;overflow-y:auto;">
            ${conns.map((conn) => {
      const fromN = nodes.find(n => n.id === conn.from);
      const toN = nodes.find(n => n.id === conn.to);
      const fromTitle = fromN ? fromN.title : conn.from;
      const toTitle = toN ? toN.title : conn.to;
      const fromColor = fromN ? (fromN.color || '#00A350') : '#00A350';
      const toColor = toN ? (toN.color || '#00A350') : '#00A350';
      const fPort = conn.fromPort || 'right';
      const tPort = conn.toPort || 'left';
      const isManual = conn.mode === 'manual' || (Array.isArray(conn.points) && conn.points.length === 3);

      return `
                <div class="zf-inspector-conn-item" style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:6px;font-size:11px;">
                  <div style="display:flex;align-items:center;gap:5px;min-width:0;flex:1;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${fromColor};flex-shrink:0;"></span>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70px;font-weight:600;" title="${this.escapeHtml(fromTitle)}">${this.escapeHtml(fromTitle)}</span>
                    <span style="font-size:9px;padding:1px 4px;background:rgba(255,255,255,0.08);border-radius:3px;color:var(--text-secondary);text-transform:uppercase;">${fPort}</span>
                    <i class="fa-solid fa-arrow-right" style="font-size:8px;color:var(--udes-lime);flex-shrink:0;"></i>
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${toColor};flex-shrink:0;"></span>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70px;font-weight:600;" title="${this.escapeHtml(toTitle)}">${this.escapeHtml(toTitle)}</span>
                    <span style="font-size:9px;padding:1px 4px;background:rgba(255,255,255,0.08);border-radius:3px;color:var(--text-secondary);text-transform:uppercase;">${tPort}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;margin-left:4px;">
                    <button class="zf-node-action-btn zf-btn-toggle-mode" data-from="${conn.from}" data-to="${conn.to}" data-from-port="${fPort}" data-to-port="${tPort}" title="${isManual ? 'Mode: Manual placing (Click to switch to Auto)' : 'Mode: Auto placing (Click to switch to Manual)'}" style="color:${isManual ? '#38bdf8' : 'var(--text-secondary)'};">
                      <i class="fa-solid ${isManual ? 'fa-sliders' : 'fa-wand-magic-sparkles'}"></i>
                    </button>
                    <button class="zf-node-action-btn zf-btn-delete-conn" data-from="${conn.from}" data-to="${conn.to}" data-from-port="${fPort}" data-to-port="${tPort}" title="Delete connection: ${fPort} → ${tPort}" style="color:var(--accent-rose);">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        `}

        ${selectedNode && nodes.length > 1 ? `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-subtle);">
            <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:5px;">Manual Link Node ${this.selectedFlowNodeIndex + 1}:</label>
            <div style="display:flex;flex-direction:column;gap:5px;">
              <div style="display:flex;gap:4px;align-items:center;">
                <span style="font-size:10px;color:var(--text-secondary);width:32px;">From:</span>
                <select id="flow-quick-connect-from-port" class="prop-select" style="font-size:11px;padding:3px 6px;flex:1;">
                  <option value="right" selected>Right Port</option>
                  <option value="bottom">Bottom Port</option>
                  <option value="top">Top Port</option>
                  <option value="left">Left Port</option>
                </select>
              </div>
              <div style="display:flex;gap:4px;align-items:center;">
                <span style="font-size:10px;color:var(--text-secondary);width:32px;">To:</span>
                <select id="flow-quick-connect-target" class="prop-select" style="flex:1.4;font-size:11px;padding:3px 6px;">
                  ${nodes.filter(n => n.id !== selectedNode.id).map(n => `
                    <option value="${n.id}">${this.escapeHtml(n.title)}</option>
                  `).join('')}
                </select>
                <select id="flow-quick-connect-to-port" class="prop-select" style="flex:1;font-size:11px;padding:3px 6px;">
                  <option value="left" selected>Left Port</option>
                  <option value="top">Top Port</option>
                  <option value="bottom">Bottom Port</option>
                  <option value="right">Right Port</option>
                </select>
                <button class="btn btn-primary btn-sm" id="flow-btn-quick-connect" style="font-size:11px;padding:3px 8px;" title="Create connection">
                  <i class="fa-solid fa-link"></i>
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
    this.attachFlowInspectorListeners();
  }

  attachFlowInspectorListeners() {
    const titleInput = document.getElementById('flow-prop-title');
    titleInput?.addEventListener('input', (e) => {
      const val = e.target.value;
      const activeSlide = window.state ? window.state.getActiveSlide() : null;
      if (activeSlide && activeSlide.isZoomFlow && activeSlide.zoomFlowData) {
        activeSlide.zoomFlowData.title = val;
        const canvasTitle = document.querySelector('#slide-elements-layer .zf-diagram-title');
        if (canvasTitle) canvasTitle.textContent = val;
      }
    });
    titleInput?.addEventListener('change', () => {
      window.state?.saveHistory('Change Diagram Title');
      if (window.slideManager) window.slideManager.renderThumbnails();
    });

    const subtitleInput = document.getElementById('flow-prop-subtitle');
    subtitleInput?.addEventListener('input', (e) => {
      const val = e.target.value;
      const activeSlide = window.state ? window.state.getActiveSlide() : null;
      if (activeSlide && activeSlide.isZoomFlow && activeSlide.zoomFlowData) {
        activeSlide.zoomFlowData.subtitle = val;
        const canvasSub = document.querySelector('#slide-elements-layer .zf-diagram-subtitle');
        if (canvasSub) canvasSub.textContent = val || 'Click to add subtitle';
      }
    });
    // Title Styling Controls (Synchronized across all slides)
    document.getElementById('flow-title-font')?.addEventListener('change', (e) => {
      window.state?.syncTitleStyleToAllSlides({ fontFamily: e.target.value });
      this.syncContextualToolbar();
    });

    document.getElementById('flow-title-size')?.addEventListener('change', (e) => {
      const sz = parseInt(e.target.value, 10);
      if (sz) {
        window.state?.syncTitleStyleToAllSlides({ fontSize: sz });
        this.syncContextualToolbar();
      }
    });

    document.getElementById('flow-title-color')?.addEventListener('input', (e) => {
      window.state?.syncTitleStyleToAllSlides({ color: e.target.value });
      this.syncContextualToolbar();
    });

    document.getElementById('flow-title-bold')?.addEventListener('click', () => {
      const isBold = (window.state.titleStyle?.fontWeight === '700' || window.state.titleStyle?.fontWeight === 'bold');
      window.state?.syncTitleStyleToAllSlides({ fontWeight: isBold ? '400' : '700' });
      document.getElementById('flow-title-bold')?.classList.toggle('is-active', !isBold);
      this.syncContextualToolbar();
    });

    document.getElementById('flow-title-italic')?.addEventListener('click', () => {
      const isItalic = window.state.titleStyle?.fontStyle === 'italic';
      window.state?.syncTitleStyleToAllSlides({ fontStyle: isItalic ? 'normal' : 'italic' });
      document.getElementById('flow-title-italic')?.classList.toggle('is-active', !isItalic);
      this.syncContextualToolbar();
    });

    ['left', 'center', 'right'].forEach(align => {
      document.getElementById(`flow-title-align-${align}`)?.addEventListener('click', () => {
        window.state?.syncTitleStyleToAllSlides({ textAlign: align });
        ['left', 'center', 'right'].forEach(a => {
          document.getElementById(`flow-title-align-${a}`)?.classList.toggle('is-active', a === align);
        });
        this.syncContextualToolbar();
      });
    });

    document.getElementById('flow-btn-sync-all-titles')?.addEventListener('click', () => {
      window.state?.syncTitleStyleToAllSlides(window.state.titleStyle);
      this.showToast('Diagram title style synchronized across all slides');
    });

    const themeSelect = document.getElementById('flow-prop-theme');
    themeSelect?.addEventListener('change', (e) => {
      this.updateFlowSettings('theme', e.target.value);
    });

    document.getElementById('flow-btn-add-node-panel')?.addEventListener('click', () => {
      this.addNodeToActiveFlow();
    });

    document.getElementById('flow-btn-autoconnect')?.addEventListener('click', () => {
      this.autoConnectFlowSequence();
    });

    document.getElementById('flow-btn-clear-conns')?.addEventListener('click', () => {
      if (confirm('Clear all connections between nodes?')) {
        this.clearAllFlowConnections();
      }
    });

    document.querySelectorAll('.zf-btn-delete-conn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const from = btn.getAttribute('data-from');
        const to = btn.getAttribute('data-to');
        const fromPort = btn.getAttribute('data-from-port');
        const toPort = btn.getAttribute('data-to-port');
        if (from && to) {
          this.deleteFlowConnection(from, to, fromPort, toPort);
        }
      });
    });

    document.querySelectorAll('.zf-btn-toggle-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const from = btn.getAttribute('data-from');
        const to = btn.getAttribute('data-to');
        const fromPort = btn.getAttribute('data-from-port');
        const toPort = btn.getAttribute('data-to-port');
        if (from && to) {
          this.toggleFlowConnectionMode(from, to, fromPort, toPort);
        }
      });
    });

    document.getElementById('flow-btn-quick-connect')?.addEventListener('click', () => {
      const activeSlide = window.state.getActiveSlide();
      if (!activeSlide || !activeSlide.zoomFlowData) return;
      const nodes = activeSlide.zoomFlowData.nodes || [];
      const selected = nodes[this.selectedFlowNodeIndex];
      const targetSelect = document.getElementById('flow-quick-connect-target');
      const fromPortSelect = document.getElementById('flow-quick-connect-from-port');
      const toPortSelect = document.getElementById('flow-quick-connect-to-port');
      if (selected && targetSelect && targetSelect.value) {
        const fromPort = fromPortSelect ? fromPortSelect.value : 'right';
        const toPort = toPortSelect ? toPortSelect.value : 'left';
        this.addFlowConnection(selected.id, targetSelect.value, fromPort, toPort);
      }
    });

    document.querySelectorAll('.zf-inspector-node-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.zf-node-action-btn')) return;
        const idx = parseInt(item.getAttribute('data-index'), 10);
        this.selectFlowNode(idx);
      });
    });

    document.querySelectorAll('.zf-btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.reorderFlowNodes(idx, idx - 1);
      });
    });

    document.querySelectorAll('.zf-btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.reorderFlowNodes(idx, idx + 1);
      });
    });

    document.querySelectorAll('.zf-btn-delete-node').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.deleteNodeFromActiveFlow(idx);
      });
    });

    const nodeTitleInput = document.getElementById('flow-node-title');
    nodeTitleInput?.addEventListener('input', (e) => {
      this.updateFlowNode(this.selectedFlowNodeIndex, { title: e.target.value });
    });

    const nodeSubInput = document.getElementById('flow-node-subtitle');
    nodeSubInput?.addEventListener('input', (e) => {
      this.updateFlowNode(this.selectedFlowNodeIndex, { subtitle: e.target.value });
    });

    const nodeColorInput = document.getElementById('flow-node-color');
    const nodeColorText = document.getElementById('flow-node-color-text');
    nodeColorInput?.addEventListener('input', (e) => {
      if (nodeColorText) nodeColorText.value = e.target.value;
      this.updateFlowNode(this.selectedFlowNodeIndex, { color: e.target.value });
    });
    nodeColorText?.addEventListener('change', (e) => {
      if (nodeColorInput) nodeColorInput.value = e.target.value;
      this.updateFlowNode(this.selectedFlowNodeIndex, { color: e.target.value });
    });

    const metricValInput = document.getElementById('flow-node-metric-val');
    metricValInput?.addEventListener('input', (e) => {
      this.updateFlowNode(this.selectedFlowNodeIndex, { metricVal: e.target.value });
    });

    const metricLblInput = document.getElementById('flow-node-metric-lbl');
    metricLblInput?.addEventListener('input', (e) => {
      this.updateFlowNode(this.selectedFlowNodeIndex, { metricLbl: e.target.value });
    });

    const nodeIconSelect = document.getElementById('flow-node-icon');
    nodeIconSelect?.addEventListener('change', (e) => {
      this.updateFlowNode(this.selectedFlowNodeIndex, { icon: e.target.value });
      this.renderFlowInspector();
    });

    const nodeSummaryInput = document.getElementById('flow-node-summary');
    nodeSummaryInput?.addEventListener('input', (e) => {
      this.updateFlowNode(this.selectedFlowNodeIndex, { summary: e.target.value });
    });

    const nodeBulletsInput = document.getElementById('flow-node-bullets');
    nodeBulletsInput?.addEventListener('input', (e) => {
      const bullets = e.target.value.split('\n').filter(Boolean);
      this.updateFlowNode(this.selectedFlowNodeIndex, { bullets });
    });

    document.getElementById('flow-btn-open-child')?.addEventListener('click', () => {
      const activeSlide = window.state.getActiveSlide();
      if (!activeSlide || !activeSlide.zoomFlowData) return;
      const nodes = activeSlide.zoomFlowData.nodes || [];
      const node = nodes[this.selectedFlowNodeIndex];
      if (!node) return;

      const childIdx = window.state.slides.findIndex(s =>
        s.parentFlowSlideId === activeSlide.id && (s.flowNodeIndex === this.selectedFlowNodeIndex || s.flowNodeId === node.id)
      );
      if (childIdx !== -1) {
        window.state.setActiveSlideIndex(childIdx);
      }
    });

    document.getElementById('flow-btn-add-nested-diagram')?.addEventListener('click', () => {
      const activeSlide = window.state.getActiveSlide();
      if (!activeSlide || !activeSlide.zoomFlowData) return;
      window.state.addNestedDiagramToNode(activeSlide.id, this.selectedFlowNodeIndex);
      window.canvasEngine.renderActiveSlide();
      if (window.slideManager) window.slideManager.renderThumbnails();
      this.renderFlowInspector();
      this.showToast('Nested diagram added inside node!');
    });

    document.getElementById('flow-btn-open-nested-slide')?.addEventListener('click', () => {
      const activeSlide = window.state.getActiveSlide();
      if (!activeSlide || !activeSlide.zoomFlowData) return;
      const nodes = activeSlide.zoomFlowData.nodes || [];
      const node = nodes[this.selectedFlowNodeIndex];
      if (!node) return;
      const childIdx = window.state.slides.findIndex(s =>
        s.parentFlowSlideId === activeSlide.id && (s.flowNodeIndex === this.selectedFlowNodeIndex || s.flowNodeId === node.id)
      );
      if (childIdx !== -1) {
        window.state.setActiveSlideIndex(childIdx);
      }
    });

    document.getElementById('flow-btn-remove-nested-diagram')?.addEventListener('click', () => {
      if (confirm('Remove nested diagram from this node? This will also remove its sub-slides.')) {
        const activeSlide = window.state.getActiveSlide();
        if (!activeSlide || !activeSlide.zoomFlowData) return;
        window.state.removeNestedDiagramFromNode(activeSlide.id, this.selectedFlowNodeIndex);
        window.canvasEngine.renderActiveSlide();
        if (window.slideManager) window.slideManager.renderThumbnails();
        this.renderFlowInspector();
        this.showToast('Nested diagram removed.');
      }
    });

    document.getElementById('flow-btn-delete-current-node')?.addEventListener('click', () => {
      this.deleteNodeFromActiveFlow(this.selectedFlowNodeIndex);
    });
  }

  addNodeToActiveFlow(nodeData = {}) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow) return;

    // Snapshot before mutation for instant undo
    window.state.saveHistory('Add Flow Node');

    if (!activeSlide.zoomFlowData) {
      activeSlide.zoomFlowData = { title: 'Flow Diagram', layout: 'linear-horizontal', theme: 'udes-emerald', nodes: [] };
    }
    const nodes = activeSlide.zoomFlowData.nodes || [];
    const idx = nodes.length;
    const themeKey = activeSlide.zoomFlowData.theme || 'udes-emerald';
    const theme = window.zoomFlowEngine?.THEMES[themeKey] || window.zoomFlowEngine?.THEMES['udes-emerald'];
    const accentColors = theme ? theme.accentColors : ['#00A350', '#7FC23F', '#087E5B', '#10B981'];
    const color = accentColors[idx % accentColors.length];

    const newNode = {
      id: `node_${Date.now()}_${idx + 1}`,
      title: nodeData.title || `Node ${idx + 1}`,
      subtitle: nodeData.subtitle || '',
      color: color,
      summary: nodeData.summary || `Detailed execution plan for Node ${idx + 1}.`,
      bullets: nodeData.bullets || [
        `Strategic objective for Node ${idx + 1}`,
        'Deliverable and execution milestone'
      ]
    };

    nodes.push(newNode);

    // Create linked child slide for regular slide content
    if (window.zoomFlowEngine) {
      const child = window.zoomFlowEngine.generateChildSlide(
        newNode,
        activeSlide.id,
        idx,
        nodes.length,
        themeKey
      );
      if (!activeSlide.childSlideIds) activeSlide.childSlideIds = [];
      activeSlide.childSlideIds.push(child.id);

      const parentIdx = window.state.slides.findIndex(s => s.id === activeSlide.id);
      let insertIdx = parentIdx + 1;
      while (
        insertIdx < window.state.slides.length &&
        (window.state.slides[insertIdx].parentFlowSlideId === activeSlide.id || window.state.slides[insertIdx].rootFlowSlideId === activeSlide.id)
      ) {
        insertIdx++;
      }
      window.state.slides.splice(insertIdx, 0, child);
      window.state.reorderSlidesHierarchically();
    }

    window.canvasEngine.renderActiveSlide();
    if (window.slideManager) {
      window.slideManager.renderThumbnails();
    }
    this.selectedFlowNodeIndex = idx;
    this.renderFlowInspector();
  }

  deleteNodeFromActiveFlow(nodeIdx) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const nodes = activeSlide.zoomFlowData.nodes || [];
    if (nodeIdx < 0 || nodeIdx >= nodes.length) return;

    // Snapshot before deletion for instant undo
    window.state.saveHistory('Delete Flow Node');

    const removedNode = nodes.splice(nodeIdx, 1)[0];

    // Remove child slide and its descendants and connections referencing this node
    if (removedNode) {
      const childSlide = window.state.slides.find(s =>
        s.parentFlowSlideId === activeSlide.id && (s.flowNodeId === removedNode.id || s.flowNodeIndex === nodeIdx)
      );
      const childSlideId = childSlide ? childSlide.id : null;

      window.state.slides = window.state.slides.filter(s => {
        if (s.parentFlowSlideId === activeSlide.id && (s.flowNodeId === removedNode.id || s.flowNodeIndex === nodeIdx)) return false;
        if (childSlideId && (s.parentFlowSlideId === childSlideId || s.rootFlowSlideId === childSlideId)) return false;
        return true;
      });

      if (activeSlide.zoomFlowData.connections) {
        activeSlide.zoomFlowData.connections = activeSlide.zoomFlowData.connections.filter(c =>
          c.from !== removedNode.id && c.to !== removedNode.id
        );
      }
      window.state.reorderSlidesHierarchically();
    }

    // Re-index remaining child slides
    let childIndex = 0;
    window.state.slides.forEach(s => {
      if (s.parentFlowSlideId === activeSlide.id) {
        s.flowNodeIndex = childIndex;
        childIndex++;
      }
    });

    if (this.selectedFlowNodeIndex >= nodes.length) {
      this.selectedFlowNodeIndex = nodes.length - 1;
    }

    window.canvasEngine.renderActiveSlide();
    if (window.slideManager) {
      window.slideManager.renderThumbnails();
    }
    this.renderFlowInspector();
  }

  addFlowConnection(fromId, toId, fromPort = 'right', toPort = 'left') {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const flowData = activeSlide.zoomFlowData;
    flowData.connections = flowData.connections || [];

    const exists = flowData.connections.some(c =>
      c.from === fromId &&
      c.to === toId &&
      (c.fromPort || 'right') === fromPort &&
      (c.toPort || 'left') === toPort
    );
    if (exists) return;

    // Snapshot before mutation for instant undo
    window.state.saveHistory('Add Flow Connection');

    flowData.connections.push({
      id: `conn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      from: fromId,
      to: toId,
      fromPort: fromPort,
      toPort: toPort,
      type: 'bezier'
    });

    window.canvasEngine.renderActiveSlide();
    this.renderFlowInspector();
  }

  deleteFlowConnection(fromId, toId, fromPort = null, toPort = null) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const flowData = activeSlide.zoomFlowData;
    if (!flowData.connections) return;

    // Snapshot before deletion for instant undo
    window.state.saveHistory('Delete Flow Connection');

    flowData.connections = flowData.connections.filter(c => {
      if (c.from === fromId && c.to === toId) {
        if (fromPort && toPort) {
          return !((c.fromPort || 'right') === fromPort && (c.toPort || 'left') === toPort);
        }
        return false;
      }
      return true;
    });

    window.canvasEngine.renderActiveSlide();
    this.renderFlowInspector();
  }

  toggleFlowConnectionMode(fromId, toId, fromPort = null, toPort = null) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const conns = activeSlide.zoomFlowData.connections || [];
    const conn = conns.find(c => {
      if (c.from === fromId && c.to === toId) {
        if (fromPort && toPort) {
          return (c.fromPort || 'right') === fromPort && (c.toPort || 'left') === toPort;
        }
        return true;
      }
      return false;
    });
    if (!conn) return;

    const isCurrentlyManual = conn.mode === 'manual' || (Array.isArray(conn.points) && conn.points.length === 3);

    // Snapshot before toggling for instant undo
    window.state.saveHistory(isCurrentlyManual ? 'Set Connection to Auto Placing' : 'Set Connection to Manual Placing');

    if (isCurrentlyManual) {
      conn.mode = 'auto';
      delete conn.points;
    } else {
      conn.mode = 'manual';
    }

    window.canvasEngine.renderActiveSlide();
    this.renderFlowInspector();
  }

  resetFlowConnectionPoints(fromId, toId, fromPort = null, toPort = null) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const conns = activeSlide.zoomFlowData.connections || [];
    const conn = conns.find(c => {
      if (c.from === fromId && c.to === toId) {
        if (fromPort && toPort) {
          return (c.fromPort || 'right') === fromPort && (c.toPort || 'left') === toPort;
        }
        return true;
      }
      return false;
    });
    if (conn && conn.points) {
      // Snapshot before reset for instant undo
      window.state.saveHistory('Reset Connection Line');
      delete conn.points;
      window.canvasEngine.renderActiveSlide();
      this.renderFlowInspector();
    }
  }

  updateFlowNodePosition(nodeId, x, y, alreadySnapshotted = false) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const nodes = activeSlide.zoomFlowData.nodes || [];
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      if (!alreadySnapshotted) {
        window.state.saveHistory('Move Flow Node');
      }
      node.x = Math.round(x);
      node.y = Math.round(y);
    }
  }

  autoConnectFlowSequence() {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const nodes = activeSlide.zoomFlowData.nodes || [];
    const newConns = [];
    for (let i = 1; i < nodes.length; i++) {
      newConns.push({
        id: `conn_${Date.now()}_${i}`,
        from: nodes[i - 1].id,
        to: nodes[i].id,
        fromPort: 'right',
        toPort: 'left',
        type: 'bezier'
      });
    }

    window.state.saveHistory('Auto-Connect Flow Nodes');
    activeSlide.zoomFlowData.connections = newConns;
    window.canvasEngine.renderActiveSlide();
    this.renderFlowInspector();
  }

  clearAllFlowConnections() {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;

    window.state.saveHistory('Clear Flow Connections');
    activeSlide.zoomFlowData.connections = [];
    window.canvasEngine.renderActiveSlide();
    this.renderFlowInspector();
  }

  updateFlowNode(nodeIdx, changes) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const nodes = activeSlide.zoomFlowData.nodes || [];
    const node = nodes[nodeIdx];
    if (!node) return;

    window.state.saveHistory('Edit Flow Node');
    Object.assign(node, changes);

    // Sync linked child slide
    const childSlide = window.state.slides.find(s => s.parentFlowSlideId === activeSlide.id && (s.flowNodeIndex === nodeIdx || s.flowNodeId === node.id));
    if (childSlide) {
      if (changes.title !== undefined) {
        childSlide.flowNodeTitle = changes.title;
        const titleEl = childSlide.elements.find(el => el.type === 'text' && (el.textType === 'title' || (el.id && el.id.includes('title'))));
        if (titleEl) titleEl.content = changes.title;
      }
      if (changes.subtitle !== undefined) {
        childSlide.flowNodeSubtitle = changes.subtitle;
        const subEl = childSlide.elements.find(el => el.type === 'text' && (el.textType === 'subtitle' || (el.id && el.id.includes('sub'))));
        if (subEl) subEl.content = changes.subtitle;
      }
      if (changes.status !== undefined) childSlide.flowNodeStatus = changes.status;
      if (changes.color !== undefined) childSlide.flowNodeColor = changes.color;
      if (changes.icon !== undefined) childSlide.flowNodeIcon = changes.icon;
      if (changes.summary !== undefined) {
        const narrEl = childSlide.elements.find(el => el.type === 'text' && (el.id && (el.id.includes('narrative') || el.id.includes('text'))));
        if (narrEl) narrEl.content = changes.summary;
      }
    }

    window.canvasEngine.renderActiveSlide();
    if (window.slideManager) {
      window.slideManager.renderThumbnails();
    }
  }

  selectFlowNode(nodeIdx) {
    this.selectedFlowNodeIndex = nodeIdx;
    if (this.activeInspectorTab !== 'flow') {
      this.switchInspectorTab('flow');
    } else {
      this.renderFlowInspector();
    }

    const canvasNodes = document.querySelectorAll('#slide-elements-layer .zoom-flow-node');
    canvasNodes.forEach((el, i) => {
      el.classList.toggle('is-active-node', i === nodeIdx);
    });
  }

  reorderFlowNodes(fromIdx, toIdx) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;
    const nodes = activeSlide.zoomFlowData.nodes || [];
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= nodes.length || toIdx >= nodes.length) return;

    window.state.saveHistory('Reorder Flow Nodes');
    const [movedNode] = nodes.splice(fromIdx, 1);
    nodes.splice(toIdx, 0, movedNode);

    // Re-index linked child slides
    nodes.forEach((n, idx) => {
      const child = window.state.slides.find(s => s.parentFlowSlideId === activeSlide.id && s.flowNodeId === n.id);
      if (child) child.flowNodeIndex = idx;
    });

    this.selectedFlowNodeIndex = toIdx;
    window.canvasEngine.renderActiveSlide();
    if (window.slideManager) {
      window.slideManager.renderThumbnails();
    }
    this.renderFlowInspector();
  }

  updateFlowSettings(field, value) {
    const activeSlide = window.state.getActiveSlide();
    if (!activeSlide || !activeSlide.isZoomFlow || !activeSlide.zoomFlowData) return;

    window.state.saveHistory(`Change Flow ${field}`);
    activeSlide.zoomFlowData[field] = value;

    if (field === 'theme' && window.zoomFlowEngine) {
      const theme = window.zoomFlowEngine.THEMES[value] || window.zoomFlowEngine.THEMES['udes-emerald'];
      activeSlide.background = { type: 'color', value: theme.background || '#060910' };
    }

    window.canvasEngine.renderActiveSlide();
    if (window.slideManager) {
      window.slideManager.renderThumbnails();
    }

    const themeSel = document.getElementById('ribbon-flow-theme');
    if (themeSel && field === 'theme') themeSel.value = value;

    this.renderFlowInspector();
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showToast(message) {
    let toast = document.getElementById('slidemaker-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'slidemaker-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '28px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = 'rgba(15, 23, 42, 0.95)';
      toast.style.border = '1px solid var(--udes-lime, #7FC23F)';
      toast.style.color = '#FFFFFF';
      toast.style.padding = '8px 18px';
      toast.style.borderRadius = '24px';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '9999';
      toast.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      toast.style.transition = 'all 0.25s ease';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--udes-lime, #7FC23F);"></i> <span>${message}</span>`;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'auto';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.pointerEvents = 'none';
      }
    }, 2400);
  }

  createDefaultZoomFlowData() {
    return {
      title: 'Flow Diagram',
      subtitle: '',
      layout: 'linear-horizontal',
      theme: 'udes-emerald',
      nodes: [
        {
          id: `node_${Date.now()}_1`,
          title: 'Stage 1',
          subtitle: '',
          icon: 'fa-arrow-right',
          color: '#00A350',
          summary: 'Detailed explanation of this initial milestone.',
          bullets: ['Key outcome and accomplishment']
        },
        {
          id: `node_${Date.now()}_2`,
          title: 'Stage 2',
          subtitle: '',
          icon: 'fa-arrow-right',
          color: '#7FC23F',
          summary: 'Detailed explanation of this middle milestone.',
          bullets: ['Key outcome and accomplishment']
        },
        {
          id: `node_${Date.now()}_3`,
          title: 'Stage 3',
          subtitle: '',
          icon: 'fa-check',
          color: '#38BDF8',
          summary: 'Detailed explanation of this final milestone.',
          bullets: ['Key outcome and accomplishment']
        }
      ]
    };
  }

  // --- 8. Zoom Flow Presentation Studio Controller ---

  openZoomFlowStudio(mode = 'new-slide') {
    this.zoomFlowStudioMode = mode;
    const modal = document.getElementById('modal-zoom-flow');
    if (!modal) return;

    if (mode === 'edit') {
      const activeSlide = window.state.getActiveSlide();
      if (activeSlide && activeSlide.isZoomFlow && activeSlide.zoomFlowData) {
        this.currentZoomFlowData = JSON.parse(JSON.stringify(activeSlide.zoomFlowData));
      } else {
        this.currentZoomFlowData = this.createDefaultZoomFlowData();
      }
    } else {
      this.currentZoomFlowData = this.createDefaultZoomFlowData();
    }

    // Set theme dropdown
    const themeSel = document.getElementById('zf-theme-select');
    if (themeSel) themeSel.value = this.currentZoomFlowData.theme || 'udes-emerald';

    // Set title and subtitle inputs
    const titleInput = document.getElementById('zf-title-input');
    if (titleInput) titleInput.value = this.currentZoomFlowData.title || '';
    const subtitleInput = document.getElementById('zf-subtitle-input');
    if (subtitleInput) subtitleInput.value = this.currentZoomFlowData.subtitle || '';

    this.renderZoomFlowNodesList();

    modal.classList.add('is-open');

    // Render preview after modal is open and has geometry
    requestAnimationFrame(() => {
      this.renderZoomFlowStudioPreview();
    });
    setTimeout(() => {
      this.renderZoomFlowStudioPreview();
    }, 100);
  }

  closeZoomFlowStudio() {
    const modal = document.getElementById('modal-zoom-flow');
    if (modal) modal.classList.remove('is-open');
  }

  renderZoomFlowTemplates() {
    const container = document.getElementById('zf-templates-container');
    if (!container || !window.zoomFlowEngine) return;

    container.innerHTML = window.zoomFlowEngine.TEMPLATES.map(tpl => `
      <div class="zf-template-card ${this.currentZoomFlowData && this.currentZoomFlowData.title === tpl.title ? 'is-active' : ''}" data-tpl-id="${tpl.id}">
        <div class="card-title">
          <i class="fa-solid ${tpl.icon}" style="color:var(--udes-lime);"></i>
          <span>${tpl.name}</span>
        </div>
        <div class="card-desc">${tpl.desc}</div>
      </div>
    `).join('');

    container.querySelectorAll('.zf-template-card').forEach(card => {
      card.addEventListener('click', () => {
        const tplId = card.getAttribute('data-tpl-id');
        const found = window.zoomFlowEngine.TEMPLATES.find(t => t.id === tplId);
        if (found) {
          this.currentZoomFlowData = JSON.parse(JSON.stringify(found));
          const themeSel = document.getElementById('zf-theme-select');
          if (themeSel) themeSel.value = this.currentZoomFlowData.theme;

          const titleInput = document.getElementById('zf-title-input');
          if (titleInput) titleInput.value = this.currentZoomFlowData.title || '';
          const subtitleInput = document.getElementById('zf-subtitle-input');
          if (subtitleInput) subtitleInput.value = this.currentZoomFlowData.subtitle || '';

          container.querySelectorAll('.zf-template-card').forEach(c => c.classList.remove('is-active'));
          card.classList.add('is-active');

          this.renderZoomFlowNodesList();
          this.renderZoomFlowStudioPreview();
        }
      });
    });
  }

  renderZoomFlowNodesList() {
    const listEl = document.getElementById('zf-nodes-list');
    const countEl = document.getElementById('zf-nodes-count');
    if (!listEl || !this.currentZoomFlowData) return;

    const nodes = this.currentZoomFlowData.nodes || [];
    if (countEl) countEl.textContent = nodes.length;

    listEl.innerHTML = nodes.map((node, idx) => `
      <div class="zf-node-item-row" data-index="${idx}">
        <div class="zf-node-item-info">
          <div class="zf-node-item-dot" style="background:${node.color || '#00A350'};box-shadow:0 0 6px ${node.color || '#00A350'};"></div>
          <span class="zf-node-item-name">${node.title}</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <button class="btn-icon zf-node-edit-btn" data-index="${idx}" style="width:24px;height:24px;font-size:11px;" title="Edit Node Details">
            <i class="fa-solid fa-pen"></i>
          </button>
          ${nodes.length > 2 ? `
            <button class="btn-icon zf-node-del-btn" data-index="${idx}" style="width:24px;height:24px;font-size:11px;color:var(--accent-rose);" title="Remove Node">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Clicking row highlights in preview
    listEl.querySelectorAll('.zf-node-item-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.zf-node-edit-btn') || e.target.closest('.zf-node-del-btn')) return;
        const idx = parseInt(row.getAttribute('data-index'), 10);
        if (this.previewZoomFlowController) {
          this.previewZoomFlowController.zoomToNode(idx);
        }
      });
    });

    // Delete node
    listEl.querySelectorAll('.zf-node-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.currentZoomFlowData.nodes.splice(idx, 1);
        this.renderZoomFlowNodesList();
        this.renderZoomFlowStudioPreview();
      });
    });

    // Edit node inline prompt
    listEl.querySelectorAll('.zf-node-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const node = this.currentZoomFlowData.nodes[idx];
        const newTitle = prompt('Edit Node Title:', node.title);
        if (newTitle && newTitle.trim()) {
          node.title = newTitle.trim();
          const newSub = prompt('Edit Node Subtitle:', node.subtitle || '');
          if (newSub !== null) node.subtitle = newSub.trim();
          this.renderZoomFlowNodesList();
          this.renderZoomFlowStudioPreview();
        }
      });
    });
  }

  renderZoomFlowStudioPreview() {
    const container = document.getElementById('zf-preview-stage');
    if (!container || !this.currentZoomFlowData || !window.zoomFlowEngine) return;

    container.innerHTML = '';
    const previewController = window.zoomFlowEngine.createZoomFlowDOM(this.currentZoomFlowData, {
      isPreview: true,
      width: 1280,
      height: 720,
      onNodeChange: (idx, node) => {
        const label = document.getElementById('zf-current-node-label');
        if (label) {
          if (idx === -1 || !node) {
            label.textContent = 'Diagram Overview';
          } else {
            label.textContent = `${idx + 1}/${this.currentZoomFlowData.nodes.length}: ${node.title}`;
          }
        }
      }
    });

    const rect = container.getBoundingClientRect();
    const containerW = rect.width > 50 ? rect.width : (container.clientWidth || 720);
    const containerH = rect.height > 50 ? rect.height : (container.clientHeight || 520);

    const paddingX = 40;
    const paddingY = 85;
    const availW = Math.max(200, containerW - paddingX);
    const availH = Math.max(150, containerH - paddingY);
    const scale = Math.min(availW / 1280, availH / 720, 1.0);

    // Centered scaler box matching scaled slide dimensions
    const previewBox = document.createElement('div');
    previewBox.className = 'zf-preview-scaler-box';
    previewBox.style.width = `${Math.round(1280 * scale)}px`;
    previewBox.style.height = `${Math.round(720 * scale)}px`;
    previewBox.style.position = 'relative';
    previewBox.style.overflow = 'hidden';
    previewBox.style.borderRadius = '12px';
    previewBox.style.boxShadow = '0 16px 45px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.12)';
    previewBox.style.flexShrink = '0';
    previewBox.style.margin = 'auto';

    const previewWrap = previewController.wrapper;
    previewWrap.style.width = '1280px';
    previewWrap.style.height = '720px';
    previewWrap.style.position = 'absolute';
    previewWrap.style.top = '0';
    previewWrap.style.left = '0';
    previewWrap.style.transformOrigin = '0 0';
    previewWrap.style.transform = `scale(${scale})`;

    previewBox.appendChild(previewWrap);
    container.appendChild(previewBox);
    this.previewZoomFlowController = previewController;

    const label = document.getElementById('zf-current-node-label');
    if (label) label.textContent = 'Diagram Overview';
  }

  bindZoomFlowStudioEvents() {
    document.getElementById('btn-close-zoom-flow')?.addEventListener('click', () => this.closeZoomFlowStudio());

    // Title & Subtitle inputs
    document.getElementById('zf-title-input')?.addEventListener('input', (e) => {
      if (this.currentZoomFlowData) {
        this.currentZoomFlowData.title = e.target.value;
        this.renderZoomFlowStudioPreview();
      }
    });

    document.getElementById('zf-subtitle-input')?.addEventListener('input', (e) => {
      if (this.currentZoomFlowData) {
        this.currentZoomFlowData.subtitle = e.target.value;
        this.renderZoomFlowStudioPreview();
      }
    });

    // Theme select change
    document.getElementById('zf-theme-select')?.addEventListener('change', (e) => {
      if (this.currentZoomFlowData) {
        this.currentZoomFlowData.theme = e.target.value;
        this.renderZoomFlowStudioPreview();
      }
    });

    // Add node button
    document.getElementById('zf-btn-add-node')?.addEventListener('click', () => {
      if (!this.currentZoomFlowData) return;
      const count = (this.currentZoomFlowData.nodes || []).length;
      if (count >= 8) {
        alert('Maximum of 8 nodes recommended for optimal presentation readability.');
        return;
      }
      const themeKey = this.currentZoomFlowData.theme || 'udes-emerald';
      const colors = window.zoomFlowEngine?.THEMES[themeKey]?.accentColors || ['#00A350', '#7FC23F', '#38BDF8'];
      const color = colors[count % colors.length];

      this.currentZoomFlowData.nodes.push({
        id: `node_${count + 1}`,
        title: `Node ${count + 1}`,
        subtitle: '',
        color: color,
        summary: 'Detailed explanation of this milestone objective and accomplishments.',
        bullets: ['Key outcome and accomplishment', 'Cross-functional coordination and handoff']
      });

      this.renderZoomFlowNodesList();
      this.renderZoomFlowStudioPreview();
    });

    // Preview Stepper buttons
    document.getElementById('zf-prev-node-btn')?.addEventListener('click', () => {
      if (this.previewZoomFlowController) this.previewZoomFlowController.stepPrev();
    });

    document.getElementById('zf-next-node-btn')?.addEventListener('click', () => {
      if (this.previewZoomFlowController) this.previewZoomFlowController.stepNext();
    });

    document.getElementById('zf-overview-btn')?.addEventListener('click', () => {
      if (this.previewZoomFlowController) this.previewZoomFlowController.zoomToOverview();
    });

    // Insert as Interactive Slide
    document.getElementById('zf-btn-insert-slide')?.addEventListener('click', () => {
      if (!this.currentZoomFlowData) return;

      if (this.zoomFlowStudioMode === 'edit') {
        const slide = window.state.getActiveSlide();
        if (slide) {
          window.state.saveHistory('Edit Zoom Flow Slide');
          slide.isZoomFlow = true;
          slide.zoomFlowData = JSON.parse(JSON.stringify(this.currentZoomFlowData));
          this.syncChildSlidesForFlow(slide);
          window.canvasEngine.renderActiveSlide();
          window.slideManager.renderThumbnails();
        }
      } else {
        window.state.addZoomFlowWithChildren(this.currentZoomFlowData);
      }

      this.closeZoomFlowStudio();
    });
  }

  syncChildSlidesForFlow(flowSlide) {
    if (!flowSlide || !flowSlide.zoomFlowData || !window.zoomFlowEngine) return;
    const nodes = flowSlide.zoomFlowData.nodes || [];
    const themeKey = flowSlide.zoomFlowData.theme || 'udes-emerald';
    flowSlide.childSlideIds = flowSlide.childSlideIds || [];

    nodes.forEach((node, i) => {
      let child = window.state.slides.find(s => s.parentFlowSlideId === flowSlide.id && s.flowNodeId === node.id);
      if (!child) {
        child = window.state.slides.find(s => s.id && flowSlide.childSlideIds.includes(s.id) && s.flowNodeIndex === i);
      }

      if (child) {
        child.flowNodeId = child.flowNodeId || node.id;
        child.flowNodeTitle = node.title;
        child.flowNodeSubtitle = node.subtitle;
        child.flowNodeColor = node.color;
        child.flowNodeIcon = node.icon;
        child.flowNodeStatus = node.status;
        child.flowNodeIndex = i;
        child.parentFlowSlideId = flowSlide.id;
        child.rootFlowSlideId = flowSlide.rootFlowSlideId || flowSlide.id;
        child.isFlowChild = true;
        child.thumbnailType = 'text';

        // Check if node has nested diagram
        if (node.nestedDiagram && Array.isArray(node.nestedDiagram.nodes) && node.nestedDiagram.nodes.length > 0) {
          child.hasNestedDiagram = true;
          child.isZoomFlow = true;
          child.isNestedFlow = true;
          child.zoomFlowData = JSON.parse(JSON.stringify(node.nestedDiagram));
          child.childSlideIds = child.childSlideIds || [];

          const subNodes = node.nestedDiagram.nodes;
          subNodes.forEach((subNode, sIdx) => {
            let grandChild = window.state.slides.find(s => s.parentFlowSlideId === child.id && (s.flowNodeId === subNode.id || s.flowNodeIndex === sIdx));
            if (!grandChild) {
              grandChild = window.zoomFlowEngine.generateChildSlide(subNode, child.id, sIdx, subNodes.length, node.nestedDiagram.theme || themeKey);
              grandChild.parentFlowSlideId = child.id;
              grandChild.rootFlowSlideId = flowSlide.id;
              grandChild.nestingLevel = 2;
              grandChild.isFlowChild = true;
              child.childSlideIds.push(grandChild.id);
              const cIdx = window.state.slides.indexOf(child);
              window.state.slides.splice(cIdx + 1 + sIdx, 0, grandChild);
            } else {
              grandChild.flowNodeTitle = subNode.title;
              grandChild.flowNodeSubtitle = subNode.subtitle;
              grandChild.flowNodeColor = subNode.color;
              grandChild.flowNodeIcon = subNode.icon;
              grandChild.flowNodeIndex = sIdx;
            }
          });
        }
      } else {
        const newChild = window.zoomFlowEngine.generateChildSlide(node, flowSlide.id, i, nodes.length, themeKey);
        newChild.nestingLevel = 1;
        newChild.rootFlowSlideId = flowSlide.id;
        flowSlide.childSlideIds.push(newChild.id);
        const pIdx = window.state.slides.indexOf(flowSlide);
        window.state.slides.splice(pIdx + 1 + i, 0, newChild);

        if (node.nestedDiagram && Array.isArray(node.nestedDiagram.nodes) && node.nestedDiagram.nodes.length > 0) {
          newChild.hasNestedDiagram = true;
          newChild.isZoomFlow = true;
          newChild.isNestedFlow = true;
          newChild.zoomFlowData = JSON.parse(JSON.stringify(node.nestedDiagram));
          newChild.childSlideIds = newChild.childSlideIds || [];
          const subNodes = node.nestedDiagram.nodes;
          subNodes.forEach((subNode, sIdx) => {
            const grandChild = window.zoomFlowEngine.generateChildSlide(subNode, newChild.id, sIdx, subNodes.length, node.nestedDiagram.theme || themeKey);
            grandChild.parentFlowSlideId = newChild.id;
            grandChild.rootFlowSlideId = flowSlide.id;
            grandChild.nestingLevel = 2;
            grandChild.isFlowChild = true;
            newChild.childSlideIds.push(grandChild.id);
            window.state.slides.splice(pIdx + 2 + sIdx, 0, grandChild);
          });
        }
      }
    });

    window.state.reorderSlidesHierarchically();

    window.addEventListener('resize', () => {
      const modal = document.getElementById('modal-zoom-flow');
      if (modal && modal.classList.contains('is-open')) {
        this.renderZoomFlowStudioPreview();
      }
    });
  }
}

// Global bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SlideMakerApp();
  window.app.init();
});
