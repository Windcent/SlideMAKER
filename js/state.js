/**
 * SlideMAKER - Presentation State Management & Undo/Redo Engine
 */

class PresentationState {
  constructor() {
    this.title = 'Untitled Presentation';
    this.aspectRatio = CONFIG.defaultAspectRatio;
    this.activeSlideIndex = 0;
    this.selectedElementIds = [];
    this.clipboard = [];
    this.zoomLevel = 1.0;
    this.autoFitZoom = true;
    this.isPresenterMode = false;

    // Undo / Redo History
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 40;
    this.isHistoryLocked = false;

    // Slides array - initialize with 1 clean slide using template A background
    this.slides = [
      this.createBlankSlide({
        background: {
          type: 'pdf',
          value: 'assets/backgrounds/template_a.png',
          pdfId: 'template_a',
          pageNumber: 1
        }
      })
    ];

    // Event listeners
    this.listeners = new Set();
  }

  // Generate unique ID
  generateId(prefix = 'el') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Create a clean blank slide with specified background
  createBlankSlide(options = {}) {
    const bg = options.background || {
      type: 'pdf',
      value: 'assets/backgrounds/template_c.png',
      pdfId: 'template_c',
      pageNumber: 3
    };

    return {
      id: this.generateId('slide'),
      background: { ...bg },
      elements: [], // Clean blank canvas for the user to create freely
      notes: '',
      transition: 'fade'
    };
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notify(changeType = 'general', details = {}) {
    for (const listener of this.listeners) {
      try {
        listener(changeType, details, this);
      } catch (err) {
        console.error('Error in state listener:', err);
      }
    }
  }

  // Get active slide object
  getActiveSlide() {
    if (this.activeSlideIndex < 0 || this.activeSlideIndex >= this.slides.length) {
      this.activeSlideIndex = 0;
    }
    return this.slides[this.activeSlideIndex] || null;
  }

  // Get single selected element or null
  getSelectedElement() {
    if (this.selectedElementIds.length !== 1) return null;
    const slide = this.getActiveSlide();
    if (!slide) return null;
    return slide.elements.find(el => el.id === this.selectedElementIds[0]) || null;
  }

  // Get array of all selected elements
  getSelectedElements() {
    const slide = this.getActiveSlide();
    if (!slide) return [];
    return slide.elements.filter(el => this.selectedElementIds.includes(el.id));
  }

  // Select single element
  selectElement(elementId, addToSelection = false) {
    if (!elementId) {
      this.clearSelection();
      return;
    }
    if (addToSelection) {
      if (this.selectedElementIds.includes(elementId)) {
        this.selectedElementIds = this.selectedElementIds.filter(id => id !== elementId);
      } else {
        this.selectedElementIds.push(elementId);
      }
    } else {
      this.selectedElementIds = [elementId];
    }
    this.notify('selection', { selectedIds: [...this.selectedElementIds] });
  }

  // Select multiple elements
  selectMultiple(elementIds) {
    this.selectedElementIds = [...elementIds];
    this.notify('selection', { selectedIds: [...this.selectedElementIds] });
  }

  // Select all elements on current slide
  selectAll() {
    const slide = this.getActiveSlide();
    if (!slide) return;
    this.selectedElementIds = slide.elements.map(el => el.id);
    this.notify('selection', { selectedIds: [...this.selectedElementIds] });
  }

  // Clear current selection
  clearSelection() {
    if (this.selectedElementIds.length > 0) {
      this.selectedElementIds = [];
      this.notify('selection', { selectedIds: [] });
    }
  }

  // Switch active slide
  setActiveSlideIndex(index) {
    if (index >= 0 && index < this.slides.length && index !== this.activeSlideIndex) {
      this.activeSlideIndex = index;
      this.selectedElementIds = [];
      this.notify('slideChange', { activeIndex: index });
    }
  }

  // Snapshot current state for Undo
  saveHistory(actionName = 'Edit') {
    if (this.isHistoryLocked) return;

    const snapshot = {
      actionName,
      title: this.title,
      aspectRatio: this.aspectRatio,
      activeSlideIndex: this.activeSlideIndex,
      slides: JSON.parse(JSON.stringify(this.slides))
    };

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo on new action
    this.notify('history', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return;

    const currentSnapshot = {
      actionName: 'Current State',
      title: this.title,
      aspectRatio: this.aspectRatio,
      activeSlideIndex: this.activeSlideIndex,
      slides: JSON.parse(JSON.stringify(this.slides))
    };
    this.redoStack.push(currentSnapshot);

    const previousSnapshot = this.undoStack.pop();
    this.isHistoryLocked = true;

    this.title = previousSnapshot.title;
    this.aspectRatio = previousSnapshot.aspectRatio;
    this.slides = previousSnapshot.slides;
    this.activeSlideIndex = Math.min(previousSnapshot.activeSlideIndex, this.slides.length - 1);
    this.selectedElementIds = [];

    this.isHistoryLocked = false;
    this.notify('historyRestore', { action: 'undo' });
  }

  redo() {
    if (!this.canRedo()) return;

    const currentSnapshot = {
      actionName: 'Current State',
      title: this.title,
      aspectRatio: this.aspectRatio,
      activeSlideIndex: this.activeSlideIndex,
      slides: JSON.parse(JSON.stringify(this.slides))
    };
    this.undoStack.push(currentSnapshot);

    const nextSnapshot = this.redoStack.pop();
    this.isHistoryLocked = true;

    this.title = nextSnapshot.title;
    this.aspectRatio = nextSnapshot.aspectRatio;
    this.slides = nextSnapshot.slides;
    this.activeSlideIndex = Math.min(nextSnapshot.activeSlideIndex, this.slides.length - 1);
    this.selectedElementIds = [];

    this.isHistoryLocked = false;
    this.notify('historyRestore', { action: 'redo' });
  }

  // --- Slide Operations ---

  addSlide(options = {}, insertAfterIndex = null) {
    this.saveHistory('Add Slide');
    const newSlide = this.createBlankSlide(options);
    const targetIndex = insertAfterIndex !== null ? insertAfterIndex + 1 : this.activeSlideIndex + 1;
    
    this.slides.splice(targetIndex, 0, newSlide);
    this.activeSlideIndex = targetIndex;
    this.selectedElementIds = [];
    this.notify('slideAdded', { index: targetIndex, slide: newSlide });
    return newSlide;
  }

  duplicateSlide(index = null) {
    const targetIdx = index !== null ? index : this.activeSlideIndex;
    const slideToDup = this.slides[targetIdx];
    if (!slideToDup) return;

    this.saveHistory('Duplicate Slide');
    const clonedSlide = JSON.parse(JSON.stringify(slideToDup));
    clonedSlide.id = this.generateId('slide');
    clonedSlide.elements.forEach(el => {
      el.id = this.generateId(el.type);
    });

    const newIdx = targetIdx + 1;
    this.slides.splice(newIdx, 0, clonedSlide);
    this.activeSlideIndex = newIdx;
    this.selectedElementIds = [];
    this.notify('slideDuplicated', { index: newIdx, slide: clonedSlide });
    return clonedSlide;
  }

  deleteSlide(index = null) {
    if (this.slides.length <= 1) {
      alert('A presentation must contain at least one slide.');
      return;
    }
    const targetIdx = index !== null ? index : this.activeSlideIndex;
    this.saveHistory('Delete Slide');

    this.slides.splice(targetIdx, 1);

    if (this.activeSlideIndex >= this.slides.length) {
      this.activeSlideIndex = this.slides.length - 1;
    }
    this.selectedElementIds = [];
    this.notify('slideDeleted', { index: targetIdx });
  }

  reorderSlide(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= this.slides.length || toIndex >= this.slides.length) return;
    this.saveHistory('Reorder Slides');
    const [moved] = this.slides.splice(fromIndex, 1);
    this.slides.splice(toIndex, 0, moved);
    this.activeSlideIndex = toIndex;
    this.notify('slideReordered', { fromIndex, toIndex });
  }

  // Set Background for active slide or all slides
  setSlideBackground(bgConfig, applyToAll = false) {
    this.saveHistory('Change Background');
    if (applyToAll) {
      this.slides.forEach(s => {
        s.background = { ...bgConfig };
      });
    } else {
      const slide = this.getActiveSlide();
      if (slide) {
        slide.background = { ...bgConfig };
      }
    }
    this.notify('backgroundChanged', { bgConfig, applyToAll });
  }

  // --- Element Operations ---

  addElement(elementData) {
    const slide = this.getActiveSlide();
    if (!slide) return null;

    this.saveHistory('Add Element');
    const newElement = {
      id: elementData.id || this.generateId(elementData.type || 'el'),
      type: elementData.type || 'text',
      x: elementData.x || 100,
      y: elementData.y || 100,
      width: elementData.width || 300,
      height: elementData.height || 100,
      rotation: elementData.rotation || 0,
      opacity: elementData.opacity !== undefined ? elementData.opacity : 1,
      zIndex: slide.elements.length + 1,
      ...elementData
    };

    slide.elements.push(newElement);
    this.selectElement(newElement.id);
    this.notify('elementAdded', { element: newElement });
    return newElement;
  }

  updateElement(elementId, changes, saveToHistory = true) {
    const slide = this.getActiveSlide();
    if (!slide) return;

    const el = slide.elements.find(e => e.id === elementId);
    if (!el) return;

    if (saveToHistory) {
      this.saveHistory('Edit Element');
    }

    Object.assign(el, changes);
    this.notify('elementUpdated', { elementId, changes, element: el });
  }

  updateSelectedElements(changes, saveToHistory = true) {
    if (this.selectedElementIds.length === 0) return;
    if (saveToHistory) {
      this.saveHistory('Edit Elements');
    }
    const slide = this.getActiveSlide();
    if (!slide) return;

    this.selectedElementIds.forEach(id => {
      const el = slide.elements.find(e => e.id === id);
      if (el) {
        Object.assign(el, changes);
      }
    });
    this.notify('elementsUpdated', { ids: this.selectedElementIds, changes });
  }

  deleteSelectedElements() {
    if (this.selectedElementIds.length === 0) return;
    const slide = this.getActiveSlide();
    if (!slide) return;

    this.saveHistory('Delete Elements');
    const deletedIds = [...this.selectedElementIds];
    slide.elements = slide.elements.filter(el => !this.selectedElementIds.includes(el.id));
    this.selectedElementIds = [];
    this.notify('elementsDeleted', { ids: deletedIds });
  }

  duplicateSelectedElements() {
    if (this.selectedElementIds.length === 0) return;
    const slide = this.getActiveSlide();
    if (!slide) return;

    this.saveHistory('Duplicate Elements');
    const newSelectedIds = [];

    this.selectedElementIds.forEach(id => {
      const el = slide.elements.find(e => e.id === id);
      if (el) {
        const cloned = JSON.parse(JSON.stringify(el));
        cloned.id = this.generateId(el.type);
        cloned.x += 30;
        cloned.y += 30;
        cloned.zIndex = slide.elements.length + 1;
        slide.elements.push(cloned);
        newSelectedIds.push(cloned.id);
      }
    });

    this.selectMultiple(newSelectedIds);
    this.notify('elementsDuplicated', { ids: newSelectedIds });
  }

  // Copy / Cut / Paste
  copySelectedElements() {
    const selected = this.getSelectedElements();
    if (selected.length === 0) return;
    this.clipboard = JSON.parse(JSON.stringify(selected));
    this.notify('clipboardChanged', { count: this.clipboard.length });
  }

  pasteElements() {
    if (!this.clipboard || this.clipboard.length === 0) return;
    const slide = this.getActiveSlide();
    if (!slide) return;

    this.saveHistory('Paste Elements');
    const newSelectedIds = [];

    this.clipboard.forEach(item => {
      const cloned = JSON.parse(JSON.stringify(item));
      cloned.id = this.generateId(item.type);
      cloned.x += 25;
      cloned.y += 25;
      cloned.zIndex = slide.elements.length + 1;
      slide.elements.push(cloned);
      newSelectedIds.push(cloned.id);
    });

    this.clipboard.forEach(item => {
      item.x += 25;
      item.y += 25;
    });

    this.selectMultiple(newSelectedIds);
    this.notify('elementsPasted', { ids: newSelectedIds });
  }

  // Layering
  bringToFront(elementId) {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const index = slide.elements.findIndex(el => el.id === elementId);
    if (index === -1 || index === slide.elements.length - 1) return;

    this.saveHistory('Bring to Front');
    const [el] = slide.elements.splice(index, 1);
    slide.elements.push(el);
    this.reindexLayers(slide);
    this.notify('layerOrderChanged', { elementId, action: 'bringToFront' });
  }

  sendToBack(elementId) {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const index = slide.elements.findIndex(el => el.id === elementId);
    if (index === -1 || index === 0) return;

    this.saveHistory('Send to Back');
    const [el] = slide.elements.splice(index, 1);
    slide.elements.unshift(el);
    this.reindexLayers(slide);
    this.notify('layerOrderChanged', { elementId, action: 'sendToBack' });
  }

  bringForward(elementId) {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const index = slide.elements.findIndex(el => el.id === elementId);
    if (index === -1 || index === slide.elements.length - 1) return;

    this.saveHistory('Bring Forward');
    const temp = slide.elements[index];
    slide.elements[index] = slide.elements[index + 1];
    slide.elements[index + 1] = temp;
    this.reindexLayers(slide);
    this.notify('layerOrderChanged', { elementId, action: 'bringForward' });
  }

  sendBackward(elementId) {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const index = slide.elements.findIndex(el => el.id === elementId);
    if (index === -1 || index === 0) return;

    this.saveHistory('Send Backward');
    const temp = slide.elements[index];
    slide.elements[index] = slide.elements[index - 1];
    slide.elements[index - 1] = temp;
    this.reindexLayers(slide);
    this.notify('layerOrderChanged', { elementId, action: 'sendBackward' });
  }

  reindexLayers(slide) {
    slide.elements.forEach((el, idx) => {
      el.zIndex = idx + 1;
    });
  }

  loadFromJson(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      this.title = data.title || 'UdeS Presentation';
      this.aspectRatio = data.aspectRatio || CONFIG.defaultAspectRatio;
      this.slides = data.slides && data.slides.length > 0 ? data.slides : [this.createBlankSlide()];
      this.activeSlideIndex = 0;
      this.selectedElementIds = [];
      this.undoStack = [];
      this.redoStack = [];
      this.notify('presentationLoaded', { presentation: data });
      return true;
    } catch (err) {
      console.error('Failed to parse presentation JSON:', err);
      alert('Invalid presentation file format.');
      return false;
    }
  }

  exportToJson() {
    return {
      version: CONFIG.version,
      title: this.title,
      aspectRatio: this.aspectRatio,
      createdAt: new Date().toISOString(),
      slides: this.slides
    };
  }
}

window.state = new PresentationState();
