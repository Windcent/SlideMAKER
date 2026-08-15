/**
 * SlideMAKER - Transform Manager
 * Handles Dragging, 8-Point Resizing, Rotation, Alignment Guides & Snapping
 */

class TransformManager {
  constructor(canvasEngine) {
    this.canvasEngine = canvasEngine;
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.isMarquee = false;

    this.dragStartX = 0;
    this.dragStartY = 0;
    this.elementStartStates = new Map();
    this.activeHandle = null;
    this.resizeOrigin = null;

    // Alignment guides state
    this.snapThreshold = 8;
    this.activeGuides = []; // { type: 'v'|'h', pos: number }

    this.initGlobalEvents();
  }

  initGlobalEvents() {
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  // Convert mouse screen coordinates to slide virtual space
  getSlideCoords(clientX, clientY) {
    const stage = document.getElementById('slide-stage');
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    const scale = this.canvasEngine.currentScale || 1.0;

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale
    };
  }

  // --- 1. Dragging Elements ---

  startDrag(e, elementId) {
    if (this.canvasEngine.isInlineEditing) return;
    if (e.button !== 0) return; // only left click

    const state = window.state;
    if (!state.selectedElementIds.includes(elementId)) {
      if (e.shiftKey) {
        state.selectElement(elementId, true);
      } else {
        state.selectElement(elementId, false);
      }
    }

    const coords = this.getSlideCoords(e.clientX, e.clientY);
    this.isDragging = true;
    this.dragStartX = coords.x;
    this.dragStartY = coords.y;

    // Store initial positions of all selected elements
    this.elementStartStates.clear();
    const selectedElements = state.getSelectedElements();
    selectedElements.forEach(el => {
      this.elementStartStates.set(el.id, {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: el.rotation || 0
      });
    });

    e.stopPropagation();
  }

  // --- 2. 8-Point Resizing ---

  startResize(e, handle) {
    if (e.button !== 0) return;
    const state = window.state;
    const selected = state.getSelectedElement();
    if (!selected) return;

    this.isResizing = true;
    this.activeHandle = handle;
    const coords = this.getSlideCoords(e.clientX, e.clientY);
    this.dragStartX = coords.x;
    this.dragStartY = coords.y;

    this.elementStartStates.clear();
    this.elementStartStates.set(selected.id, {
      x: selected.x,
      y: selected.y,
      width: selected.width,
      height: selected.height,
      aspectRatio: selected.width / (selected.height || 1)
    });

    e.stopPropagation();
    e.preventDefault();
  }

  // --- 3. Rotating ---

  startRotate(e) {
    if (e.button !== 0) return;
    const state = window.state;
    const selected = state.getSelectedElement();
    if (!selected) return;

    this.isRotating = true;
    const center = {
      x: selected.x + selected.width / 2,
      y: selected.y + selected.height / 2
    };

    const coords = this.getSlideCoords(e.clientX, e.clientY);
    const initialAngle = Math.atan2(coords.y - center.y, coords.x - center.x) * (180 / Math.PI);

    this.elementStartStates.clear();
    this.elementStartStates.set(selected.id, {
      centerX: center.x,
      centerY: center.y,
      initialRotation: selected.rotation || 0,
      initialAngle: initialAngle
    });

    e.stopPropagation();
    e.preventDefault();
  }

  // --- 4. Marquee Selection ---

  startMarquee(e) {
    if (this.canvasEngine.isInlineEditing) return;
    if (e.button !== 0) return;

    // Check if clicked directly on stage background
    if (e.target.closest('.slide-element') || e.target.closest('.selection-box')) return;

    const coords = this.getSlideCoords(e.clientX, e.clientY);
    this.isMarquee = true;
    this.marqueeStart = coords;
    this.marqueeCurrent = coords;

    if (!e.shiftKey) {
      window.state.clearSelection();
    }

    this.updateMarqueeVisual();
  }

  // --- Global Mouse Move & Drag Physics ---

  onMouseMove(e) {
    if (!this.isDragging && !this.isResizing && !this.isRotating && !this.isMarquee) return;

    const coords = this.getSlideCoords(e.clientX, e.clientY);

    // Handle Dragging
    if (this.isDragging) {
      const dx = coords.x - this.dragStartX;
      const dy = coords.y - this.dragStartY;
      this.handleDragMove(dx, dy);
    }

    // Handle Resizing
    else if (this.isResizing) {
      const dx = coords.x - this.dragStartX;
      const dy = coords.y - this.dragStartY;
      this.handleResizeMove(dx, dy, e.shiftKey);
    }

    // Handle Rotating
    else if (this.isRotating) {
      this.handleRotateMove(coords, e.shiftKey);
    }

    // Handle Marquee
    else if (this.isMarquee) {
      this.marqueeCurrent = coords;
      this.updateMarqueeVisual();
      this.evaluateMarqueeSelection();
    }
  }

  handleDragMove(dx, dy) {
    const state = window.state;
    const selected = state.getSelectedElements();
    if (selected.length === 0) return;

    // Calculate smart snapping if single element selected
    let snapDx = dx;
    let snapDy = dy;
    this.activeGuides = [];

    if (selected.length === 1) {
      const start = this.elementStartStates.get(selected[0].id);
      if (start) {
        const proposedX = start.x + dx;
        const proposedY = start.y + dy;
        const width = start.width;
        const height = start.height;

        const snapResult = this.computeSnapping(proposedX, proposedY, width, height, selected[0].id);
        snapDx = snapResult.snappedX - start.x;
        snapDy = snapResult.snappedY - start.y;
        this.activeGuides = snapResult.guides;
      }
    }

    selected.forEach(el => {
      const start = this.elementStartStates.get(el.id);
      if (start) {
        el.x = Math.round(start.x + snapDx);
        el.y = Math.round(start.y + snapDy);
      }
    });

    this.canvasEngine.renderActiveSlide(false);
    this.renderAlignmentGuides();
  }

  handleResizeMove(dx, dy, maintainAspect) {
    const state = window.state;
    const selected = state.getSelectedElement();
    if (!selected) return;

    const start = this.elementStartStates.get(selected.id);
    if (!start) return;

    let newX = start.x;
    let newY = start.y;
    let newWidth = start.width;
    let newHeight = start.height;

    const handle = this.activeHandle;

    // X-axis adjustments
    if (handle.includes('e')) {
      newWidth = Math.max(20, start.width + dx);
    } else if (handle.includes('w')) {
      const maxDx = start.width - 20;
      const appliedDx = Math.min(dx, maxDx);
      newWidth = start.width - appliedDx;
      newX = start.x + appliedDx;
    }

    // Y-axis adjustments
    if (handle.includes('s')) {
      newHeight = Math.max(20, start.height + dy);
    } else if (handle.includes('n')) {
      const maxDy = start.height - 20;
      const appliedDy = Math.min(dy, maxDy);
      newHeight = start.height - appliedDy;
      newY = start.y + appliedDy;
    }

    // Maintain aspect ratio if Shift is pressed or element is circular / image / icon
    if (maintainAspect || selected.type === 'icon' || (selected.type === 'shape' && (selected.shapeId === 'circle' || selected.shapeId === 'star'))) {
      const ratio = start.aspectRatio;
      if (handle === 'e' || handle === 'w') {
        newHeight = newWidth / ratio;
      } else if (handle === 'n' || handle === 's') {
        newWidth = newHeight * ratio;
      } else {
        // Corner handles
        const avgScale = Math.max(newWidth / start.width, newHeight / start.height);
        newWidth = start.width * avgScale;
        newHeight = newWidth / ratio;
      }
    }

    selected.x = Math.round(newX);
    selected.y = Math.round(newY);
    selected.width = Math.round(newWidth);
    selected.height = Math.round(newHeight);

    this.canvasEngine.renderActiveSlide(false);
  }

  handleRotateMove(coords, snap15Deg) {
    const state = window.state;
    const selected = state.getSelectedElement();
    if (!selected) return;

    const start = this.elementStartStates.get(selected.id);
    if (!start) return;

    const currentAngle = Math.atan2(coords.y - start.centerY, coords.x - start.centerX) * (180 / Math.PI);
    let deltaAngle = currentAngle - start.initialAngle;
    let newRotation = (start.initialRotation + deltaAngle) % 360;

    if (newRotation < 0) newRotation += 360;

    if (snap15Deg) {
      newRotation = Math.round(newRotation / 15) * 15;
    }

    selected.rotation = Math.round(newRotation);
    this.canvasEngine.renderActiveSlide(false);
  }

  // --- Smart Snapping Computation ---

  computeSnapping(x, y, width, height, currentElId) {
    const guides = [];
    let snappedX = x;
    let snappedY = y;

    const slideDims = this.canvasEngine.getSlideDimensions();
    const snapPointsX = [
      { pos: 0, type: 'edge-left' },
      { pos: slideDims.width / 2, type: 'center-h' },
      { pos: slideDims.width, type: 'edge-right' }
    ];

    const snapPointsY = [
      { pos: 0, type: 'edge-top' },
      { pos: slideDims.height / 2, type: 'center-v' },
      { pos: slideDims.height, type: 'edge-bottom' }
    ];

    // Other elements on slide
    const slide = window.state.getActiveSlide();
    if (slide) {
      slide.elements.forEach(other => {
        if (other.id === currentElId) return;
        snapPointsX.push({ pos: other.x, type: 'el-left' });
        snapPointsX.push({ pos: other.x + other.width / 2, type: 'el-center-h' });
        snapPointsX.push({ pos: other.x + other.width, type: 'el-right' });

        snapPointsY.push({ pos: other.y, type: 'el-top' });
        snapPointsY.push({ pos: other.y + other.height / 2, type: 'el-center-v' });
        snapPointsY.push({ pos: other.y + other.height, type: 'el-bottom' });
      });
    }

    // Check X snap (Left, Center, Right)
    const currentCenterX = x + width / 2;
    const currentRightX = x + width;

    for (const sp of snapPointsX) {
      if (Math.abs(x - sp.pos) < this.snapThreshold) {
        snappedX = sp.pos;
        guides.push({ orientation: 'v', pos: sp.pos });
        break;
      }
      if (Math.abs(currentCenterX - sp.pos) < this.snapThreshold) {
        snappedX = sp.pos - width / 2;
        guides.push({ orientation: 'v', pos: sp.pos });
        break;
      }
      if (Math.abs(currentRightX - sp.pos) < this.snapThreshold) {
        snappedX = sp.pos - width;
        guides.push({ orientation: 'v', pos: sp.pos });
        break;
      }
    }

    // Check Y snap (Top, Center, Bottom)
    const currentCenterY = y + height / 2;
    const currentBottomY = y + height;

    for (const sp of snapPointsY) {
      if (Math.abs(y - sp.pos) < this.snapThreshold) {
        snappedY = sp.pos;
        guides.push({ orientation: 'h', pos: sp.pos });
        break;
      }
      if (Math.abs(currentCenterY - sp.pos) < this.snapThreshold) {
        snappedY = sp.pos - height / 2;
        guides.push({ orientation: 'h', pos: sp.pos });
        break;
      }
      if (Math.abs(currentBottomY - sp.pos) < this.snapThreshold) {
        snappedY = sp.pos - height;
        guides.push({ orientation: 'h', pos: sp.pos });
        break;
      }
    }

    return { snappedX, snappedY, guides };
  }

  renderAlignmentGuides() {
    let guidesContainer = document.getElementById('alignment-guides');
    if (!guidesContainer) {
      const stage = document.getElementById('slide-stage');
      if (!stage) return;
      guidesContainer = document.createElement('div');
      guidesContainer.id = 'alignment-guides';
      stage.appendChild(guidesContainer);
    }

    guidesContainer.innerHTML = '';
    this.activeGuides.forEach(g => {
      const line = document.createElement('div');
      line.className = `snap-guide snap-guide-${g.orientation}`;
      if (g.orientation === 'v') {
        line.style.left = `${g.pos}px`;
      } else {
        line.style.top = `${g.pos}px`;
      }
      guidesContainer.appendChild(line);
    });
  }

  clearAlignmentGuides() {
    this.activeGuides = [];
    const guidesContainer = document.getElementById('alignment-guides');
    if (guidesContainer) {
      guidesContainer.innerHTML = '';
    }
  }

  // --- 5. Mouse Up: Commit actions ---

  onMouseUp(e) {
    if (this.isDragging || this.isResizing || this.isRotating) {
      // Commit action to undo history
      window.state.saveHistory(
        this.isDragging ? 'Déplacer élément(s)' :
        this.isResizing ? 'Redimensionner élément' : 'Pivoter élément'
      );
    }

    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.activeHandle = null;
    this.elementStartStates.clear();
    this.clearAlignmentGuides();

    if (this.isMarquee) {
      this.isMarquee = false;
      const marqueeEl = document.getElementById('marquee-box');
      if (marqueeEl) marqueeEl.style.display = 'none';
    }

    this.canvasEngine.renderActiveSlide(true);
  }

  // Marquee visuals
  updateMarqueeVisual() {
    let marqueeEl = document.getElementById('marquee-box');
    if (!marqueeEl) {
      const stage = document.getElementById('slide-stage');
      if (!stage) return;
      marqueeEl = document.createElement('div');
      marqueeEl.id = 'marquee-box';
      stage.appendChild(marqueeEl);
    }

    const minX = Math.min(this.marqueeStart.x, this.marqueeCurrent.x);
    const minY = Math.min(this.marqueeStart.y, this.marqueeCurrent.y);
    const width = Math.abs(this.marqueeCurrent.x - this.marqueeStart.x);
    const height = Math.abs(this.marqueeCurrent.y - this.marqueeStart.y);

    marqueeEl.style.display = 'block';
    marqueeEl.style.left = `${minX}px`;
    marqueeEl.style.top = `${minY}px`;
    marqueeEl.style.width = `${width}px`;
    marqueeEl.style.height = `${height}px`;
  }

  evaluateMarqueeSelection() {
    const minX = Math.min(this.marqueeStart.x, this.marqueeCurrent.x);
    const minY = Math.min(this.marqueeStart.y, this.marqueeCurrent.y);
    const maxX = Math.max(this.marqueeStart.x, this.marqueeCurrent.x);
    const maxY = Math.max(this.marqueeStart.y, this.marqueeCurrent.y);

    const slide = window.state.getActiveSlide();
    if (!slide) return;

    const hitIds = [];
    slide.elements.forEach(el => {
      const elRight = el.x + el.width;
      const elBottom = el.y + el.height;

      // Check bounding box intersection
      const intersects = !(el.x > maxX || elRight < minX || el.y > maxY || elBottom < minY);
      if (intersects) {
        hitIds.push(el.id);
      }
    });

    window.state.selectMultiple(hitIds);
  }

  // Keyboard Nudging
  onKeyDown(e) {
    if (this.canvasEngine.isInlineEditing) return;
    const selected = window.state.getSelectedElements();
    if (selected.length === 0) return;

    const step = e.shiftKey ? 10 : 1;
    let moved = false;

    if (e.key === 'ArrowLeft') {
      selected.forEach(el => el.x -= step);
      moved = true;
    } else if (e.key === 'ArrowRight') {
      selected.forEach(el => el.x += step);
      moved = true;
    } else if (e.key === 'ArrowUp') {
      selected.forEach(el => el.y -= step);
      moved = true;
    } else if (e.key === 'ArrowDown') {
      selected.forEach(el => el.y += step);
      moved = true;
    }

    if (moved) {
      e.preventDefault();
      this.canvasEngine.renderActiveSlide(true);
      window.state.saveHistory('Déplacement clavier');
    }
  }
}

window.TransformManager = TransformManager;
