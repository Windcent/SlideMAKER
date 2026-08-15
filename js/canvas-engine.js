/**
 * SlideMAKER - Canvas Engine & Slide Renderer
 * Renders slide stage, background, elements, selection overlays, and inline editing
 */

class CanvasEngine {
  constructor() {
    this.viewport = null;
    this.stage = null;
    this.currentScale = 1.0;
    this.isInlineEditing = false;
    this.activeInlineElementId = null;
    this.chartInstances = new Map();

    this.transformManager = new TransformManager(this);
  }

  init() {
    this.viewport = document.getElementById('slide-viewport');
    this.stage = document.getElementById('slide-stage');

    if (!this.viewport || !this.stage) {
      console.error('Canvas viewport or stage elements not found.');
      return;
    }

    // Bind viewport stage mouse events
    this.stage.addEventListener('mousedown', (e) => this.onStageMouseDown(e));

    // Window resize observer to auto-fit slide
    window.addEventListener('resize', () => {
      if (window.state.autoFitZoom) {
        this.fitToWindow();
      }
    });

    // Subscribe to state notifications
    window.state.subscribe((type, details) => {
      this.handleStateChange(type, details);
    });

    // Initial render
    this.updateStageDimensions();
    this.fitToWindow();
    this.renderActiveSlide();

    // Re-verify fit after full DOM layout
    requestAnimationFrame(() => {
      this.fitToWindow();
    });
  }

  getSlideDimensions() {
    const config = CONFIG.aspectRatios[window.state.aspectRatio] || CONFIG.aspectRatios['16_9'];
    return { width: config.width, height: config.height };
  }

  updateStageDimensions() {
    if (!this.stage) return;
    const dims = this.getSlideDimensions();
    this.stage.style.width = `${dims.width}px`;
    this.stage.style.height = `${dims.height}px`;

    const wrapper = document.getElementById('slide-stage-wrapper');
    if (wrapper) {
      wrapper.style.width = `${Math.round(dims.width * this.currentScale)}px`;
      wrapper.style.height = `${Math.round(dims.height * this.currentScale)}px`;
    }
  }

  fitToWindow() {
    if (!this.viewport || !this.stage) return;
    const dims = this.getSlideDimensions();
    const vpRect = this.viewport.getBoundingClientRect();

    // Viewport usable area with padding
    const paddingX = 48;
    const paddingY = 48;
    const availWidth = Math.max(200, vpRect.width - paddingX * 2);
    const availHeight = Math.max(150, vpRect.height - paddingY * 2);

    const scaleX = availWidth / dims.width;
    const scaleY = availHeight / dims.height;
    const fitScale = Math.min(scaleX, scaleY);

    this.setScale(fitScale, true);
  }

  setScale(scale, isAuto = false) {
    this.currentScale = Math.max(0.15, Math.min(3.0, scale));
    window.state.zoomLevel = this.currentScale;
    window.state.autoFitZoom = isAuto;

    const dims = this.getSlideDimensions();

    // Update wrapper container dimensions so flexbox centers it perfectly
    const wrapper = document.getElementById('slide-stage-wrapper');
    if (wrapper) {
      wrapper.style.width = `${Math.round(dims.width * this.currentScale)}px`;
      wrapper.style.height = `${Math.round(dims.height * this.currentScale)}px`;
    }

    if (this.stage) {
      this.stage.style.width = `${dims.width}px`;
      this.stage.style.height = `${dims.height}px`;
      this.stage.style.transform = `scale(${this.currentScale})`;
    }

    // Update zoom UI indicator
    const zoomText = document.getElementById('zoom-percentage');
    if (zoomText) {
      zoomText.textContent = `${Math.round(this.currentScale * 100)}%`;
    }
  }

  zoomIn() {
    this.setScale(this.currentScale * 1.15, false);
  }

  zoomOut() {
    this.setScale(this.currentScale / 1.15, false);
  }

  handleStateChange(type, details) {
    if (type === 'slideChange' || type === 'slideAdded' || type === 'slideDeleted' || type === 'presentationLoaded' || type === 'historyRestore') {
      this.updateStageDimensions();
      if (window.state.autoFitZoom) {
        this.fitToWindow();
      }
      this.renderActiveSlide();
    } else if (type === 'selection') {
      this.renderSelectionOverlay();
    } else if (type === 'backgroundChanged') {
      this.renderBackground();
    } else if (type === 'elementAdded' || type === 'elementsDeleted' || type === 'elementsDuplicated' || type === 'elementsPasted' || type === 'layerOrderChanged') {
      this.renderActiveSlide();
    } else if (type === 'elementUpdated' || type === 'elementsUpdated') {
      this.renderActiveSlide(false);
    }
  }

  onStageMouseDown(e) {
    // If clicked on stage background (not an element or selection handle)
    if (e.target === this.stage || e.target.id === 'slide-background' || e.target.id === 'slide-elements-layer') {
      if (this.isInlineEditing) {
        this.endInlineEditing();
      }
      this.transformManager.startMarquee(e);
    }
  }

  // --- Main Slide Rendering ---

  renderActiveSlide(updateSelection = true) {
    const slide = window.state.getActiveSlide();
    if (!slide || !this.stage) return;

    this.renderBackground();
    this.renderElements();

    if (updateSelection) {
      this.renderSelectionOverlay();
    }
  }

  renderBackground() {
    let bgEl = document.getElementById('slide-background');
    if (!bgEl) {
      bgEl = document.createElement('div');
      bgEl.id = 'slide-background';
      this.stage.insertBefore(bgEl, this.stage.firstChild);
    }

    const slide = window.state.getActiveSlide();
    if (!slide) return;

    const bg = slide.background || { type: 'color', value: '#FFFFFF' };
    bgEl.className = 'slide-background';
    bgEl.style.backgroundImage = 'none';
    bgEl.style.backgroundColor = 'transparent';

    if (bg.type === 'pdf' || bg.type === 'image') {
      bgEl.style.backgroundImage = `url("${bg.value}")`;
      bgEl.style.backgroundSize = 'cover';
      bgEl.style.backgroundPosition = 'center';
      bgEl.style.backgroundRepeat = 'no-repeat';
    } else if (bg.type === 'gradient') {
      bgEl.style.backgroundImage = bg.value;
    } else if (bg.type === 'color') {
      bgEl.style.backgroundColor = bg.value || '#FFFFFF';
    }
  }

  renderElements() {
    let elementsLayer = document.getElementById('slide-elements-layer');
    if (!elementsLayer) {
      elementsLayer = document.createElement('div');
      elementsLayer.id = 'slide-elements-layer';
      this.stage.appendChild(elementsLayer);
    }

    const slide = window.state.getActiveSlide();
    if (!slide) {
      elementsLayer.innerHTML = '';
      return;
    }

    // Destroy existing charts to prevent memory leaks
    this.chartInstances.forEach(chart => chart.destroy());
    this.chartInstances.clear();

    // Track active DOM elements to keep DOM updates minimal
    elementsLayer.innerHTML = '';

    slide.elements.forEach(el => {
      const elNode = this.createElementDOM(el);
      elementsLayer.appendChild(elNode);

      // Render chart if applicable
      if (el.type === 'chart') {
        this.renderChartElement(el);
      }
    });
  }

  createElementDOM(el) {
    const container = document.createElement('div');
    container.id = `el-${el.id}`;
    container.className = `slide-element slide-element-${el.type}`;
    container.setAttribute('data-id', el.id);

    // Coordinate & Box Styles
    container.style.position = 'absolute';
    container.style.left = `${el.x}px`;
    container.style.top = `${el.y}px`;
    container.style.width = `${el.width}px`;
    container.style.height = `${el.height}px`;
    container.style.zIndex = el.zIndex || 1;
    container.style.opacity = el.opacity !== undefined ? el.opacity : 1;
    container.style.transform = `rotate(${el.rotation || 0}deg)`;

    // Attach drag listener
    container.addEventListener('mousedown', (e) => {
      this.transformManager.startDrag(e, el.id);
    });

    // Attach double-click for inline editing if text
    if (el.type === 'text') {
      container.addEventListener('dblclick', (e) => {
        this.startInlineEditing(el.id, e);
      });
    }

    // Inner Content Renderer based on Element Type
    const inner = document.createElement('div');
    inner.className = 'element-inner';
    inner.style.width = '100%';
    inner.style.height = '100%';

    switch (el.type) {
      case 'text':
        this.applyTextStyles(inner, el);
        inner.innerHTML = el.content || '';
        break;

      case 'shape':
        this.renderShapeContent(inner, el);
        break;

      case 'image':
        this.renderImageContent(inner, el);
        break;

      case 'icon':
        this.renderIconContent(inner, el);
        break;

      case 'table':
        this.renderTableContent(inner, el);
        break;

      case 'chart':
        inner.innerHTML = `<div class="chart-wrapper" style="width:100%;height:100%;padding:16px;background:${el.backgroundColor||'#fff'};border-radius:${el.borderRadius||12}px;box-shadow:0 ${el.shadowBlur||8}px 24px rgba(0,0,0,0.08);border:${el.borderWidth||1}px solid ${el.borderColor||'#E2E8F0'};"><h4 style="margin:0 0 10px 0;font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;color:${CONFIG.colors.udesDark};text-align:center;">${el.chartTitle||''}</h4><div style="position:relative;width:100%;height:calc(100% - 32px);"><canvas id="chart-canvas-${el.id}"></canvas></div></div>`;
        break;

      case 'line':
        this.renderLineContent(inner, el);
        break;

      case 'html':
        this.renderHtmlContent(inner, el);
        break;
    }

    container.appendChild(inner);
    return container;
  }

  renderHtmlContent(inner, el) {
    inner.style.overflow = 'hidden';
    inner.style.borderRadius = `${el.borderRadius || 0}px`;
    inner.style.border = el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#E2E8F0'}` : 'none';
    if (el.shadowBlur) {
      inner.style.boxShadow = `0 ${el.shadowOffsetY || 4}px ${el.shadowBlur}px ${el.shadowColor || 'rgba(0,0,0,0.15)'}`;
    }

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = el.backgroundColor || 'transparent';
    iframe.style.pointerEvents = 'auto';
    iframe.sandbox = 'allow-scripts allow-same-origin';
    iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;font-family:sans-serif;background:transparent;}</style></head><body>${el.htmlContent || ''}</body></html>`;
    inner.appendChild(iframe);
  }

  // --- Element Specific Renderers ---

  applyTextStyles(inner, el) {
    inner.style.fontFamily = el.fontFamily || 'Inter';
    inner.style.fontSize = `${el.fontSize || 18}px`;
    inner.style.fontWeight = el.fontWeight || '400';
    inner.style.fontStyle = el.fontStyle || 'normal';
    inner.style.textDecoration = el.textDecoration || 'none';
    inner.style.color = el.color || CONFIG.colors.udesBlack;
    inner.style.textAlign = el.textAlign || 'left';
    inner.style.lineHeight = el.lineHeight || 1.4;
    inner.style.letterSpacing = `${el.letterSpacing || 0}px`;
    inner.style.backgroundColor = el.backgroundColor || 'transparent';
    inner.style.padding = `${el.padding || 8}px`;
    inner.style.borderRadius = `${el.borderRadius || 0}px`;
    inner.style.border = el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none';

    if (el.shadowBlur || el.shadowOffsetY || el.shadowOffsetX) {
      const sStr = `${el.shadowOffsetX || 0}px ${el.shadowOffsetY !== undefined ? el.shadowOffsetY : 4}px ${el.shadowBlur}px ${el.shadowColor || 'rgba(0,0,0,0.4)'}`;
      inner.style.textShadow = sStr;
      if (el.backgroundColor && el.backgroundColor !== 'transparent') {
        inner.style.boxShadow = sStr;
      } else {
        inner.style.boxShadow = 'none';
      }
    } else if (el.shadow && el.shadow !== 'none') {
      inner.style.textShadow = 'none';
      inner.style.boxShadow = el.shadow;
    } else {
      inner.style.textShadow = 'none';
      inner.style.boxShadow = 'none';
    }

    inner.style.wordBreak = 'break-word';
    inner.style.overflowWrap = 'break-word';
  }

  renderShapeContent(inner, el) {
    const shapeId = el.shapeId || 'rect';
    const fill = el.fillGradient || el.fillColor || CONFIG.colors.udesGreen;
    const stroke = el.strokeColor || 'transparent';
    const strokeWidth = el.strokeWidth || 0;
    const shadow = el.shadowBlur ? `0 ${el.shadowOffsetY !== undefined ? el.shadowOffsetY : 4}px ${el.shadowBlur}px ${el.shadowColor || 'rgba(0,0,0,0.15)'}` : 'none';

    if (shapeId === 'rect' || shapeId === 'rounded-rect' || shapeId === 'pill' || shapeId === 'circle') {
      inner.style.background = fill;
      inner.style.border = strokeWidth > 0 ? `${strokeWidth}px ${el.strokeDash || 'solid'} ${stroke}` : 'none';
      inner.style.borderRadius = `${el.borderRadius || 0}px`;
      inner.style.boxShadow = shadow;
    } else {
      // SVG Based Shapes (Triangle, Star, Diamond, Hexagon, Arrows, Callout)
      inner.innerHTML = this.getShapeSvg(shapeId, el.width, el.height, fill, stroke, strokeWidth, shadow);
    }
  }

  getShapeSvg(shapeId, width, height, fill, stroke, strokeWidth, shadow) {
    const sw = strokeWidth || 0;
    let path = '';

    if (shapeId === 'triangle') {
      path = `<polygon points="${width/2},${sw} ${width-sw},${height-sw} ${sw},${height-sw}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    } else if (shapeId === 'diamond') {
      path = `<polygon points="${width/2},${sw} ${width-sw},${height/2} ${width/2},${height-sw} ${sw},${height/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    } else if (shapeId === 'star') {
      // 5-pointed star
      const cx = width / 2;
      const cy = height / 2;
      const spikes = 5;
      const outerRadius = Math.min(width, height) / 2 - sw;
      const innerRadius = outerRadius * 0.42;
      let points = '';
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        points += `${x},${y} `;
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        points += `${x},${y} `;
        rot += step;
      }
      path = `<polygon points="${points.trim()}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    } else if (shapeId === 'hexagon') {
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2 - sw;
      let points = '';
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 30) * (Math.PI / 180);
        points += `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)} `;
      }
      path = `<polygon points="${points.trim()}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    } else if (shapeId === 'arrow-right') {
      const h3 = height / 3;
      const w2 = width * 0.65;
      path = `<polygon points="${sw},${h3} ${w2},${h3} ${w2},${sw} ${width-sw},${height/2} ${w2},${height-sw} ${w2},${height-h3} ${sw},${height-h3}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    } else if (shapeId === 'arrow-left') {
      const h3 = height / 3;
      const w2 = width * 0.35;
      path = `<polygon points="${width-sw},${h3} ${w2},${h3} ${w2},${sw} ${sw},${height/2} ${w2},${height-sw} ${w2},${height-h3} ${width-sw},${height-h3}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    } else if (shapeId === 'callout') {
      const r = 12;
      const bubbleH = height * 0.75;
      path = `<path d="M 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 L ${width-r} 0 A ${r} ${r} 0 0 1 ${width} ${r} L ${width} ${bubbleH-r} A ${r} ${r} 0 0 1 ${width-r} ${bubbleH} L 60 ${bubbleH} L 30 ${height} L 40 ${bubbleH} L ${r} ${bubbleH} A ${r} ${r} 0 0 1 0 ${bubbleH-r} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    }

    return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow:visible;filter:${shadow !== 'none' ? `drop-shadow(0 4px 6px rgba(0,0,0,0.15))` : 'none'}">${path}</svg>`;
  }

  renderImageContent(inner, el) {
    const img = document.createElement('img');
    img.src = el.src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = el.objectFit || 'contain';
    img.style.borderRadius = `${el.borderRadius || 0}px`;
    img.style.border = el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#E2E8F0'}` : 'none';

    if (el.shadowBlur || el.shadowOffsetY || el.shadowOffsetX) {
      img.style.boxShadow = `${el.shadowOffsetX || 0}px ${el.shadowOffsetY !== undefined ? el.shadowOffsetY : 4}px ${el.shadowBlur}px ${el.shadowColor || 'rgba(0,0,0,0.3)'}`;
    } else {
      img.style.boxShadow = 'none';
    }

    img.style.filter = `grayscale(${el.grayscale || 0}%) brightness(${el.brightness || 100}%) contrast(${el.contrast || 100}%)`;
    img.draggable = false;
    inner.appendChild(img);
  }

  renderIconContent(inner, el) {
    inner.style.display = 'flex';
    inner.style.alignItems = 'center';
    inner.style.justifyContent = 'center';
    inner.style.backgroundColor = el.backgroundColor || 'transparent';
    inner.style.borderRadius = `${el.borderRadius || 0}px`;
    inner.style.border = el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none';

    const iconSize = Math.min(el.width, el.height) * 0.65;
    inner.innerHTML = `<i class="${el.iconClass || 'fa-solid fa-lightbulb'}" style="font-size:${iconSize}px;color:${el.iconColor || CONFIG.colors.udesGreen};"></i>`;
  }

  renderTableContent(inner, el) {
    let tableHtml = `<table class="slide-table" style="width:100%;height:100%;border-collapse:collapse;border-radius:${el.borderRadius||8}px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);background:${el.bodyBg||'#fff'};">`;

    const rows = el.data || [];
    rows.forEach((row, rIdx) => {
      tableHtml += '<tr>';
      row.forEach((cell, cIdx) => {
        if (rIdx === 0) {
          tableHtml += `<th contenteditable="true" data-row="${rIdx}" data-col="${cIdx}" style="background:${el.headerBg||CONFIG.colors.udesGreen};color:${el.headerColor||'#fff'};font-family:${el.headerFontFamily||'Outfit'};font-size:${el.headerFontSize||16}px;padding:10px 14px;font-weight:600;text-align:left;border:1px solid ${el.borderColor||'#CBD5E1'};">${cell}</th>`;
        } else {
          const bg = rIdx % 2 === 0 ? (el.alternateRowBg || '#F8FAFC') : (el.bodyBg || '#FFFFFF');
          tableHtml += `<td contenteditable="true" data-row="${rIdx}" data-col="${cIdx}" style="background:${bg};color:${el.bodyColor||CONFIG.colors.udesBlack};font-family:${el.bodyFontFamily||'Inter'};font-size:${el.bodyFontSize||14}px;padding:8px 12px;border:1px solid ${el.borderColor||'#CBD5E1'};">${cell}</td>`;
        }
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</table>';
    inner.innerHTML = tableHtml;

    // Attach table cell live edit
    inner.querySelectorAll('[contenteditable]').forEach(cellNode => {
      cellNode.addEventListener('blur', () => {
        const r = parseInt(cellNode.getAttribute('data-row'), 10);
        const c = parseInt(cellNode.getAttribute('data-col'), 10);
        if (el.data[r] && el.data[r][c] !== undefined) {
          el.data[r][c] = cellNode.innerText;
          window.state.saveHistory('Modifier tableau');
        }
      });
    });
  }

  renderChartElement(el) {
    const canvas = document.getElementById(`chart-canvas-${el.id}`);
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    const chartConfig = {
      type: el.chartType || 'bar',
      data: {
        labels: el.labels || ['A', 'B', 'C'],
        datasets: el.datasets || [{ label: 'Données', data: [10, 20, 30] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: el.chartType === 'pie' || el.chartType === 'doughnut' || (el.datasets && el.datasets.length > 1),
            position: 'bottom',
            labels: { font: { family: 'Inter', size: 12 } }
          }
        },
        animation: false
      }
    };

    const chartInstance = new Chart(ctx, chartConfig);
    this.chartInstances.set(el.id, chartInstance);
  }

  renderLineContent(inner, el) {
    inner.style.display = 'flex';
    inner.style.alignItems = 'center';
    const borderStyle = el.lineStyle || 'solid';
    inner.innerHTML = `<div style="width:100%;height:${el.lineWidth||4}px;background:${el.lineColor||CONFIG.colors.udesGreen};border-radius:2px;${borderStyle !== 'solid' ? `background:none;border-top:${el.lineWidth||4}px ${borderStyle} ${el.lineColor||CONFIG.colors.udesGreen};` : ''}"></div>`;
  }

  // --- Inline Text Editing ---

  startInlineEditing(elementId, e) {
    const slide = window.state.getActiveSlide();
    if (!slide) return;

    const el = slide.elements.find(item => item.id === elementId);
    if (!el || el.type !== 'text') return;

    const container = document.getElementById(`el-${elementId}`);
    if (!container) return;

    const inner = container.querySelector('.element-inner');
    if (!inner) return;

    this.isInlineEditing = true;
    this.activeInlineElementId = elementId;

    inner.contentEditable = 'true';
    inner.focus();

    // Select text range or place caret
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(inner);
    sel.removeAllRanges();
    sel.addRange(range);

    container.classList.add('is-editing');

    inner.addEventListener('blur', () => {
      this.endInlineEditing();
    }, { once: true });
  }

  endInlineEditing() {
    if (!this.isInlineEditing || !this.activeInlineElementId) return;

    const container = document.getElementById(`el-${this.activeInlineElementId}`);
    if (container) {
      const inner = container.querySelector('.element-inner');
      if (inner) {
        inner.contentEditable = 'false';
        const newHtml = inner.innerHTML;

        const slide = window.state.getActiveSlide();
        const el = slide ? slide.elements.find(item => item.id === this.activeInlineElementId) : null;
        if (el && el.content !== newHtml) {
          el.content = newHtml;
          window.state.saveHistory('Modifier texte');
        }
      }
      container.classList.remove('is-editing');
    }

    this.isInlineEditing = false;
    this.activeInlineElementId = null;
    this.renderSelectionOverlay();
  }

  // --- Selection Bounding Box & 8 Handles ---

  renderSelectionOverlay() {
    let overlay = document.getElementById('selection-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'selection-overlay';
      this.stage.appendChild(overlay);
    }

    overlay.innerHTML = '';
    const selected = window.state.getSelectedElements();

    if (selected.length === 0 || this.isInlineEditing) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';

    // Single Element Selection
    if (selected.length === 1) {
      const el = selected[0];
      const box = document.createElement('div');
      box.className = 'selection-box single-selection';
      box.style.left = `${el.x}px`;
      box.style.top = `${el.y}px`;
      box.style.width = `${el.width}px`;
      box.style.height = `${el.height}px`;
      box.style.transform = `rotate(${el.rotation || 0}deg)`;

      // 8 Resize Handles
      const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      handles.forEach(h => {
        const handleNode = document.createElement('div');
        handleNode.className = `resize-handle handle-${h}`;
        handleNode.setAttribute('data-handle', h);
        handleNode.addEventListener('mousedown', (e) => {
          this.transformManager.startResize(e, h);
        });
        box.appendChild(handleNode);
      });

      // Rotation Handle
      const rotateStem = document.createElement('div');
      rotateStem.className = 'rotate-stem';
      const rotateHandle = document.createElement('div');
      rotateHandle.className = 'rotate-handle';
      rotateHandle.title = 'Pivoter l\'élément';
      rotateHandle.addEventListener('mousedown', (e) => {
        this.transformManager.startRotate(e);
      });
      rotateStem.appendChild(rotateHandle);
      box.appendChild(rotateStem);

      overlay.appendChild(box);
    } else {
      // Multiple Selection: Compute combined bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selected.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      });

      const box = document.createElement('div');
      box.className = 'selection-box multi-selection';
      box.style.left = `${minX}px`;
      box.style.top = `${minY}px`;
      box.style.width = `${maxX - minX}px`;
      box.style.height = `${maxY - minY}px`;

      overlay.appendChild(box);
    }
  }
}

window.CanvasEngine = CanvasEngine;
