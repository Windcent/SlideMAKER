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

    // Boot UI components
    window.canvasEngine.init();
    window.backgroundManager.init();
    window.slideManager.init();
    window.presenterEngine.init();

    this.bindHeaderActions();
    this.bindRibbonActions();
    this.bindContextualBar();
    this.bindInspectorPanel();
    this.bindModals();
    this.bindKeyboardShortcuts();
    this.bindTitleEditor();

    // Listen to selection changes to sync contextual toolbar & inspector tab
    window.state.subscribe((type, details) => {
      this.handleStateChange(type, details);
    });

    console.log('SlideMAKER initialized successfully!');
  }

  handleStateChange(type, details) {
    if (type === 'selection' || type === 'elementAdded' || type === 'elementsDeleted' || type === 'slideChange') {
      this.syncContextualToolbar();
      this.syncInspectorProperties();

      const selected = window.state.getSelectedElement();
      if (selected && this.activeInspectorTab === 'background') {
        this.switchInspectorTab('properties');
      } else if (!selected && this.activeInspectorTab === 'properties') {
        this.switchInspectorTab('background');
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

    // Modals Triggers (Icon, Table, Chart, HTML)
    document.getElementById('btn-insert-icon')?.addEventListener('click', () => this.openIconModal());
    document.getElementById('btn-insert-table')?.addEventListener('click', () => this.openTableModal());
    document.getElementById('btn-insert-chart')?.addEventListener('click', () => this.openChartModal());
    document.getElementById('btn-insert-html')?.addEventListener('click', () => this.openHtmlModal());
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
        window.state.updateSelectedElements({ fontFamily: e.target.value });
      });
    }

    const fontSizeInput = document.getElementById('ctx-font-size');
    if (fontSizeInput) {
      fontSizeInput.addEventListener('change', (e) => {
        window.state.updateSelectedElements({ fontSize: parseInt(e.target.value, 10) });
      });
    }

    document.getElementById('ctx-btn-font-plus')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (el && el.fontSize) {
        const newSize = el.fontSize + 2;
        window.state.updateSelectedElements({ fontSize: newSize });
        if (fontSizeInput) fontSizeInput.value = newSize;
      }
    });

    document.getElementById('ctx-btn-font-minus')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (el && el.fontSize && el.fontSize > 8) {
        const newSize = el.fontSize - 2;
        window.state.updateSelectedElements({ fontSize: newSize });
        if (fontSizeInput) fontSizeInput.value = newSize;
      }
    });

    document.getElementById('ctx-btn-bold')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (!el) return;
      const isBold = el.fontWeight === '700' || el.fontWeight === 'bold';
      window.state.updateSelectedElements({ fontWeight: isBold ? '400' : '700' });
    });

    document.getElementById('ctx-btn-italic')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (!el) return;
      const isItalic = el.fontStyle === 'italic';
      window.state.updateSelectedElements({ fontStyle: isItalic ? 'normal' : 'italic' });
    });

    document.getElementById('ctx-btn-underline')?.addEventListener('click', () => {
      const el = window.state.getSelectedElement();
      if (!el) return;
      const isUnder = el.textDecoration === 'underline';
      window.state.updateSelectedElements({ textDecoration: isUnder ? 'none' : 'underline' });
    });

    // Alignment
    ['left', 'center', 'right', 'justify'].forEach(align => {
      document.getElementById(`ctx-btn-align-${align}`)?.addEventListener('click', () => {
        window.state.updateSelectedElements({ textAlign: align });
      });
    });

    // Color Pickers
    const textColorInput = document.getElementById('ctx-text-color');
    if (textColorInput) {
      textColorInput.addEventListener('input', (e) => {
        window.state.updateSelectedElements({ color: e.target.value });
      });
    }

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

  syncContextualToolbar() {
    const bar = document.getElementById('contextual-formatting-bar');
    if (!bar) return;

    const selected = window.state.getSelectedElement();
    const textGroup = document.getElementById('ctx-group-text');
    const shapeGroup = document.getElementById('ctx-group-shape');
    const layerGroup = document.getElementById('ctx-group-layering');

    if (!selected) {
      bar.classList.add('is-disabled');
      if (textGroup) textGroup.style.display = 'none';
      if (shapeGroup) shapeGroup.style.display = 'none';
      if (layerGroup) layerGroup.style.display = 'none';
      return;
    }

    bar.classList.remove('is-disabled');
    if (layerGroup) layerGroup.style.display = 'flex';

    if (selected.type === 'text') {
      if (textGroup) textGroup.style.display = 'flex';
      if (shapeGroup) shapeGroup.style.display = 'none';

      const fontSelect = document.getElementById('ctx-font-family');
      if (fontSelect && selected.fontFamily) fontSelect.value = selected.fontFamily;

      const sizeInput = document.getElementById('ctx-font-size');
      if (sizeInput && selected.fontSize) sizeInput.value = selected.fontSize;

      const colorInput = document.getElementById('ctx-text-color');
      if (colorInput && selected.color) colorInput.value = selected.color;

      document.getElementById('ctx-btn-bold')?.classList.toggle('is-active', selected.fontWeight === '700' || selected.fontWeight === 'bold');
      document.getElementById('ctx-btn-italic')?.classList.toggle('is-active', selected.fontStyle === 'italic');
      document.getElementById('ctx-btn-underline')?.classList.toggle('is-active', selected.textDecoration === 'underline');
    } else if (selected.type === 'shape' || selected.type === 'icon') {
      if (textGroup) textGroup.style.display = 'none';
      if (shapeGroup) shapeGroup.style.display = 'flex';

      const fillColor = document.getElementById('ctx-fill-color');
      if (fillColor) fillColor.value = selected.fillColor || selected.iconColor || CONFIG.colors.udesGreen;
    } else {
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
          <label>Shadow Blur (<span id="lbl-val-shadow-blur">${el.shadowBlur || 0}px</span>)</label>
          <input type="range" id="prop-shadow-blur" min="0" max="50" value="${el.shadowBlur || 0}" class="prop-range">
        </div>
        <div class="prop-field" style="margin-top:10px;">
          <label>Offset X (<span id="lbl-val-shadow-offset-x">${el.shadowOffsetX || 0}px</span>)</label>
          <input type="range" id="prop-shadow-offset-x" min="-50" max="50" value="${el.shadowOffsetX || 0}" class="prop-range">
        </div>
        <div class="prop-field" style="margin-top:10px;">
          <label>Offset Y (<span id="lbl-val-shadow-offset-y">${el.shadowOffsetY !== undefined ? el.shadowOffsetY : (el.shadowBlur ? 4 : 0)}px</span>)</label>
          <input type="range" id="prop-shadow-offset-y" min="-50" max="50" value="${el.shadowOffsetY !== undefined ? el.shadowOffsetY : (el.shadowBlur ? 4 : 0)}px" class="prop-range">
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
      const val = parseInt(e.target.value, 10) || 0;
      const lbl = document.getElementById('lbl-val-shadow-blur');
      if (lbl) lbl.textContent = `${val}px`;
      window.state.updateElement(el.id, { shadowBlur: val });
    });
    document.getElementById('prop-shadow-offset-x')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      const lbl = document.getElementById('lbl-val-shadow-offset-x');
      if (lbl) lbl.textContent = `${val}px`;
      window.state.updateElement(el.id, { shadowOffsetX: val });
    });
    document.getElementById('prop-shadow-offset-y')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
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
}

// Global bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SlideMakerApp();
  window.app.init();
});
