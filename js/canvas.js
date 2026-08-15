/**
 * SlideMAKER - Visual Canvas & WYSIWYG Manipulation Engine
 * Handles Drag, Resize, Rotation, Magnetic Snapping, Selection, and Keyboard Events.
 */

window.SlideCanvas = {
  currentScale: 0.6,
  isDragging: false,
  isResizing: false,
  isRotating: false,
  activeHandle: null,
  selectedElements: [],
  dragStartPos: { x: 0, y: 0 },
  elementStartBounds: {},

  init() {
    this.viewport = document.getElementById("canvas-viewport");
    this.stageWrapper = document.getElementById("slide-stage-wrapper");
    this.stage = document.getElementById("slide-stage");
    this.snapGuideH = document.getElementById("snap-guide-h");
    this.snapGuideV = document.getElementById("snap-guide-v");

    this.bindEvents();
    this.autoFitZoom();
    window.addEventListener("resize", () => this.autoFitZoom());
  },

  // Auto-calculate zoom to fit screen comfortably
  autoFitZoom() {
    if (!this.viewport || !this.stageWrapper) return;
    const vpRect = this.viewport.getBoundingClientRect();
    const pad = 60;
    const availW = vpRect.width - pad;
    const availH = vpRect.height - pad;
    const scaleW = availW / 1920;
    const scaleH = availH / 1080;
    const fitScale = Math.min(scaleW, scaleH, 1.0);
    this.setZoom(Math.max(0.2, fitScale));
  },

  setZoom(scale) {
    this.currentScale = scale;
    if (this.stageWrapper) {
      this.stageWrapper.style.transform = `scale(${scale})`;
    }
    const zoomValEl = document.getElementById("zoom-percentage-text");
    const zoomSlider = document.getElementById("zoom-slider");
    if (zoomValEl) zoomValEl.textContent = `${Math.round(scale * 100)}%`;
    if (zoomSlider) zoomSlider.value = Math.round(scale * 100);
  },

  bindEvents() {
    const stage = this.stage;
    if (!stage) return;

    // Mouse Down on Stage / Elements / Handles
    stage.addEventListener("mousedown", (e) => {
      // 1. Check if clicking on a resize handle
      if (e.target.classList.contains("resize-handle")) {
        e.stopPropagation();
        this.startResize(e, e.target.dataset.handle);
        return;
      }

      // 2. Check if clicking on rotation handle
      if (e.target.classList.contains("rotate-handle")) {
        e.stopPropagation();
        this.startRotate(e);
        return;
      }

      // 3. Check if clicking on replace image overlay
      if (e.target.closest(".image-replace-overlay")) {
        e.stopPropagation();
        const elDom = e.target.closest(".slide-element");
        if (elDom) {
          const elId = elDom.dataset.id;
          window.SlideApp.openImagePicker(elId);
        }
        return;
      }

      // 4. Check if clicking on a slide element
      const elDom = e.target.closest(".slide-element");
      if (elDom) {
        const elId = elDom.dataset.id;
        if (e.shiftKey) {
          this.toggleSelect(elId);
        } else if (!this.selectedElements.includes(elId)) {
          this.selectElement(elId);
        }

        // If clicking inside contenteditable to edit text, don't drag immediately
        if (e.target.isContentEditable) {
          return;
        }

        this.startDrag(e);
        return;
      }

      // 5. Clicking on empty canvas deselects all
      if (!e.shiftKey) {
        this.deselectAll();
      }
    });

    // Global Mouse Move
    window.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        this.onDrag(e);
      } else if (this.isResizing) {
        this.onResize(e);
      } else if (this.isRotating) {
        this.onRotate(e);
      }
    });

    // Global Mouse Up
    window.addEventListener("mouseup", (e) => {
      if (this.isDragging || this.isResizing || this.isRotating) {
        this.endTransform();
      }
    });

    // Sync contenteditable changes back to active slide data model
    stage.addEventListener("input", (e) => {
      const elDom = e.target.closest(".slide-element");
      if (!elDom) return;
      const elId = elDom.dataset.id;
      const slide = window.SlideApp.getActiveSlide();
      if (!slide) return;
      const elData = slide.elements.find(el => el.id === elId);
      if (!elData) return;

      if (elData.type === "text" || elData.type === "code") {
        elData.content = e.target.innerText;
      } else if (elData.type === "bullets") {
        const listItems = elDom.querySelectorAll(".uds-bullet-list > li");
        elData.items = Array.from(listItems).map((li, i) => ({
          text: li.innerText,
          level: li.classList.contains("level-2") ? 2 : 1
        }));
      } else if (elData.type === "table") {
        const ths = elDom.querySelectorAll("th");
        const tds = elDom.querySelectorAll("td");
        // Update table data
        if (ths.length > 0) {
          ths.forEach(th => {
            const r = parseInt(th.dataset.row);
            const c = parseInt(th.dataset.col);
            if (elData.data[r]) elData.data[r][c] = th.innerText;
          });
        }
        if (tds.length > 0) {
          tds.forEach(td => {
            const r = parseInt(td.dataset.row);
            const c = parseInt(td.dataset.col);
            if (elData.data[r]) elData.data[r][c] = td.innerText;
          });
        }
      }
      window.SlideApp.renderThumbnails();
    });

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      // Ignore if user is actively typing inside an input or contenteditable
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
        return;
      }

      // Delete selected elements
      if (e.key === "Delete" || e.key === "Backspace") {
        if (this.selectedElements.length > 0) {
          e.preventDefault();
          window.SlideApp.deleteSelectedElements();
        }
      }

      // Duplicate: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        window.SlideApp.duplicateSelectedElements();
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        window.SlideApp.undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        window.SlideApp.redo();
      }

      // Select All: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        this.selectAll();
      }

      // Nudge with arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (this.selectedElements.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 2;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          this.nudgeSelected(dx, dy);
        }
      }

      // Present mode: F5
      if (e.key === "F5") {
        e.preventDefault();
        window.SlidePresenter.startPresentation();
      }

      // Deselect: Escape
      if (e.key === "Escape") {
        this.deselectAll();
      }
    });
  },

  // Selection Logic
  selectElement(elId) {
    this.selectedElements = [elId];
    this.updateSelectionClasses();
    window.SlideApp.updateInspectorAndToolbar();
  },

  toggleSelect(elId) {
    const idx = this.selectedElements.indexOf(elId);
    if (idx >= 0) {
      this.selectedElements.splice(idx, 1);
    } else {
      this.selectedElements.push(elId);
    }
    this.updateSelectionClasses();
    window.SlideApp.updateInspectorAndToolbar();
  },

  selectAll() {
    const slide = window.SlideApp.getActiveSlide();
    if (!slide) return;
    this.selectedElements = slide.elements.map(el => el.id);
    this.updateSelectionClasses();
    window.SlideApp.updateInspectorAndToolbar();
  },

  deselectAll() {
    this.selectedElements = [];
    this.updateSelectionClasses();
    window.SlideApp.updateInspectorAndToolbar();
  },

  updateSelectionClasses() {
    document.querySelectorAll(".slide-element").forEach(elDom => {
      const elId = elDom.dataset.id;
      if (this.selectedElements.includes(elId)) {
        elDom.classList.add("selected");
      } else {
        elDom.classList.remove("selected");
      }
    });
  },

  // Dragging Logic
  startDrag(e) {
    this.isDragging = true;
    this.dragStartPos = { x: e.clientX, y: e.clientY };
    const slide = window.SlideApp.getActiveSlide();
    if (!slide) return;

    this.elementStartBounds = {};
    this.selectedElements.forEach(id => {
      const el = slide.elements.find(item => item.id === id);
      if (el) {
        this.elementStartBounds[id] = { x: el.x, y: el.y, width: el.width, height: el.height };
      }
    });
  },

  onDrag(e) {
    if (!this.isDragging) return;
    const dx = (e.clientX - this.dragStartPos.x) / this.currentScale;
    const dy = (e.clientY - this.dragStartPos.y) / this.currentScale;

    const slide = window.SlideApp.getActiveSlide();
    if (!slide) return;

    this.selectedElements.forEach(id => {
      const initial = this.elementStartBounds[id];
      const el = slide.elements.find(item => item.id === id);
      if (initial && el) {
        let newX = Math.round(initial.x + dx);
        let newY = Math.round(initial.y + dy);

        // Smart snapping (snap to slide center lines 960 and 540)
        if (Math.abs(newX + el.width / 2 - 960) < 8) {
          newX = 960 - el.width / 2;
          this.showSnapGuideV(960);
        } else {
          this.hideSnapGuideV();
        }

        if (Math.abs(newY + el.height / 2 - 540) < 8) {
          newY = 540 - el.height / 2;
          this.showSnapGuideH(540);
        } else {
          this.hideSnapGuideH();
        }

        el.x = newX;
        el.y = newY;

        const elDom = document.getElementById(id);
        if (elDom) {
          elDom.style.left = `${newX}px`;
          elDom.style.top = `${newY}px`;
        }
      }
    });
  },

  // Resize Logic
  startResize(e, handle) {
    this.isResizing = true;
    this.activeHandle = handle;
    this.dragStartPos = { x: e.clientX, y: e.clientY };
    const slide = window.SlideApp.getActiveSlide();
    if (!slide) return;

    this.elementStartBounds = {};
    this.selectedElements.forEach(id => {
      const el = slide.elements.find(item => item.id === id);
      if (el) {
        this.elementStartBounds[id] = { x: el.x, y: el.y, width: el.width, height: el.height };
      }
    });
  },

  onResize(e) {
    if (!this.isResizing || this.selectedElements.length === 0) return;
    const id = this.selectedElements[0];
    const initial = this.elementStartBounds[id];
    const slide = window.SlideApp.getActiveSlide();
    if (!initial || !slide) return;

    const el = slide.elements.find(item => item.id === id);
    if (!el) return;

    const dx = (e.clientX - this.dragStartPos.x) / this.currentScale;
    const dy = (e.clientY - this.dragStartPos.y) / this.currentScale;

    let newX = initial.x;
    let newY = initial.y;
    let newW = initial.width;
    let newH = initial.height;

    const h = this.activeHandle;
    if (h.includes("e")) newW = Math.max(50, initial.width + dx);
    if (h.includes("s")) newH = Math.max(30, initial.height + dy);
    if (h.includes("w")) {
      const diffW = initial.width - dx;
      if (diffW > 50) {
        newW = diffW;
        newX = initial.x + dx;
      }
    }
    if (h.includes("n")) {
      const diffH = initial.height - dy;
      if (diffH > 30) {
        newH = diffH;
        newY = initial.y + dy;
      }
    }

    el.x = Math.round(newX);
    el.y = Math.round(newY);
    el.width = Math.round(newW);
    el.height = Math.round(newH);

    const elDom = document.getElementById(id);
    if (elDom) {
      elDom.style.left = `${el.x}px`;
      elDom.style.top = `${el.y}px`;
      elDom.style.width = `${el.width}px`;
      elDom.style.height = `${el.height}px`;
    }
  },

  // Rotation Logic
  startRotate(e) {
    this.isRotating = true;
    const id = this.selectedElements[0];
    const elDom = document.getElementById(id);
    if (!elDom) return;
    const rect = elDom.getBoundingClientRect();
    this.rotateCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  },

  onRotate(e) {
    if (!this.isRotating || this.selectedElements.length === 0) return;
    const id = this.selectedElements[0];
    const slide = window.SlideApp.getActiveSlide();
    if (!slide) return;
    const el = slide.elements.find(item => item.id === id);
    if (!el) return;

    const rad = Math.atan2(e.clientY - this.rotateCenter.y, e.clientX - this.rotateCenter.x);
    let deg = Math.round((rad * (180 / Math.PI)) + 90);
    // Snap to 0, 90, 180, 270 if close
    if (Math.abs(deg % 90) < 4 || Math.abs(deg % 90) > 86) {
      deg = Math.round(deg / 90) * 90;
    }
    el.rotation = deg;

    const elDom = document.getElementById(id);
    if (elDom) {
      elDom.style.transform = `rotate(${deg}deg)`;
    }
  },

  endTransform() {
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.activeHandle = null;
    this.hideSnapGuideH();
    this.hideSnapGuideV();
    window.SlideApp.saveStateToHistory();
    window.SlideApp.renderThumbnails();
  },

  nudgeSelected(dx, dy) {
    const slide = window.SlideApp.getActiveSlide();
    if (!slide) return;
    this.selectedElements.forEach(id => {
      const el = slide.elements.find(item => item.id === id);
      if (el) {
        el.x += dx;
        el.y += dy;
        const elDom = document.getElementById(id);
        if (elDom) {
          elDom.style.left = `${el.x}px`;
          elDom.style.top = `${el.y}px`;
        }
      }
    });
    window.SlideApp.saveStateToHistory();
    window.SlideApp.renderThumbnails();
  },

  showSnapGuideH(y) {
    if (!this.snapGuideH) return;
    this.snapGuideH.style.top = `${y}px`;
    this.snapGuideH.style.display = "block";
  },
  hideSnapGuideH() {
    if (this.snapGuideH) this.snapGuideH.style.display = "none";
  },
  showSnapGuideV(x) {
    if (!this.snapGuideV) return;
    this.snapGuideV.style.left = `${x}px`;
    this.snapGuideV.style.display = "block";
  },
  hideSnapGuideV() {
    if (this.snapGuideV) this.snapGuideV.style.display = "none";
  }
};
