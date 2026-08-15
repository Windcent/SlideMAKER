/**
 * SlideMAKER - Main Application Controller & State Orchestrator
 * Integrates canvas, templates, elements, exporter, and presentation player.
 */

window.SlideApp = {
  presentation: null,
  activeSlideIndex: 0,
  historyStack: [],
  historyIndex: -1,
  isSaving: false,
  imagePickerCallback: null,

  init() {
    // Load existing presentation from localStorage or fallback to sample deck
    this.loadState();

    // Initialize Canvas & Presenter
    window.SlideCanvas.init();
    window.SlidePresenter.init();

    // Render Initial UI
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.bindUiEvents();
    this.saveStateToHistory();

    console.log("SlideMAKER initialized successfully!");
  },

  // State Persistence
  loadState() {
    const saved = localStorage.getItem("slidemaker_current_deck");
    if (saved) {
      try {
        this.presentation = JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved state, loading sample deck.");
        this.presentation = window.SampleDeck.getDeck();
      }
    } else {
      this.presentation = window.SampleDeck.getDeck();
    }

    // Ensure master defaults
    if (!this.presentation.master) {
      this.presentation.master = {
        faculty: "Faculté de génie",
        showFaculty: true,
        showLogo: true,
        themeColor: "#007A3D",
        accentColor: "#82C341"
      };
    }
  },

  saveState() {
    try {
      localStorage.setItem("slidemaker_current_deck", JSON.stringify(this.presentation));
    } catch (e) {
      console.warn("Storage quota exceeded or unavailable");
    }
  },

  // History & Undo / Redo
  saveStateToHistory() {
    const snapshot = JSON.stringify(this.presentation);
    // Trim forward history if we're branching
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    }
    this.historyStack.push(snapshot);
    if (this.historyStack.length > 50) this.historyStack.shift();
    this.historyIndex = this.historyStack.length - 1;
    this.saveState();
    this.updateUndoRedoButtons();
  },

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.presentation = JSON.parse(this.historyStack[this.historyIndex]);
      if (this.activeSlideIndex >= this.presentation.slides.length) {
        this.activeSlideIndex = this.presentation.slides.length - 1;
      }
      this.renderCurrentSlide();
      this.renderThumbnails();
      this.updateUndoRedoButtons();
      this.showToast("Annulation effectuée", "success");
    }
  },

  redo() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      this.presentation = JSON.parse(this.historyStack[this.historyIndex]);
      if (this.activeSlideIndex >= this.presentation.slides.length) {
        this.activeSlideIndex = this.presentation.slides.length - 1;
      }
      this.renderCurrentSlide();
      this.renderThumbnails();
      this.updateUndoRedoButtons();
      this.showToast("Rétablissement effectué", "success");
    }
  },

  updateUndoRedoButtons() {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");
    if (btnUndo) btnUndo.disabled = this.historyIndex <= 0;
    if (btnRedo) btnRedo.disabled = this.historyIndex >= this.historyStack.length - 1;
  },

  // Slide Data Helpers
  getActiveSlide() {
    return this.presentation.slides[this.activeSlideIndex];
  },

  selectSlide(index) {
    if (index >= 0 && index < this.presentation.slides.length) {
      this.activeSlideIndex = index;
      this.renderCurrentSlide();
      this.renderThumbnails();
      window.SlideCanvas.deselectAll();
    }
  },

  // Render Slide to Stage Canvas
  renderCurrentSlide() {
    const slide = this.getActiveSlide();
    const stage = document.getElementById("slide-stage");
    if (!slide || !stage) return;

    const layoutDef = window.SlideTemplates.getLayout(slide.layoutId);
    const faculty = this.presentation.master.faculty || "Faculté de génie";
    const showLogo = this.presentation.master.showLogo !== false;
    const isDarkBg = slide.layoutId === "layout-2" || slide.layoutId === "layout-3";

    // Elements HTML (interactive editor mode)
    const elementsHtml = slide.elements.map(el => window.SlideElements.renderElement(el, true)).join("");

    stage.innerHTML = `
      <div class="slide-canvas slide-${slide.layoutId}">
        <div class="layout-bg-graphic">
          ${layoutDef.getBackgroundSvg(this.presentation.master)}
        </div>
        ${this.presentation.master.showFaculty ? `<div class="slide-master-faculty" id="stage-master-faculty">${faculty}</div>` : ''}
        ${showLogo ? `<div class="slide-master-logo">${window.SlideTemplates.getLogoSvg(isDarkBg)}</div>` : ''}
        <div class="slide-elements-layer" id="slide-elements-layer">
          ${elementsHtml}
        </div>
      </div>
    `;

    // Update Bottom Bar Status & Notes
    const counterEl = document.getElementById("status-slide-counter");
    if (counterEl) {
      counterEl.textContent = `Diapositive ${this.activeSlideIndex + 1} sur ${this.presentation.slides.length}`;
    }

    const notesTextarea = document.getElementById("notes-textarea");
    if (notesTextarea) {
      notesTextarea.value = slide.notes || "";
    }

    const facultyBadge = document.getElementById("faculty-badge-text");
    if (facultyBadge) {
      facultyBadge.textContent = faculty;
    }

    const presTitle = document.getElementById("presentation-title-input");
    if (presTitle && presTitle.value !== this.presentation.title) {
      presTitle.value = this.presentation.title || "Présentation Faculté de génie";
    }

    this.updateInspectorAndToolbar();
  },

  // Render Sidebar Thumbnails
  renderThumbnails() {
    const container = document.getElementById("slides-list-container");
    if (!container) return;

    const faculty = this.presentation.master.faculty || "Faculté de génie";
    const showLogo = this.presentation.master.showLogo !== false;

    container.innerHTML = this.presentation.slides.map((slide, idx) => {
      const layoutDef = window.SlideTemplates.getLayout(slide.layoutId);
      const isDarkBg = slide.layoutId === "layout-2" || slide.layoutId === "layout-3";
      const elementsHtml = slide.elements.map(el => window.SlideElements.renderElement(el, false)).join("");

      return `
        <div class="slide-thumbnail-card ${idx === this.activeSlideIndex ? 'active' : ''}" data-index="${idx}">
          <div class="thumbnail-number">${idx + 1}</div>
          <div class="thumbnail-preview-frame">
            <div class="thumbnail-content-scaled" style="transform: scale(0.095);">
              <div class="slide-canvas slide-${slide.layoutId}">
                <div class="layout-bg-graphic">${layoutDef.getBackgroundSvg(this.presentation.master)}</div>
                ${this.presentation.master.showFaculty ? `<div class="slide-master-faculty">${faculty}</div>` : ''}
                ${showLogo ? `<div class="slide-master-logo">${window.SlideTemplates.getLogoSvg(isDarkBg)}</div>` : ''}
                <div class="slide-elements-layer">${elementsHtml}</div>
              </div>
            </div>
          </div>
          <div class="thumbnail-actions">
            <button class="thumb-action-btn btn-duplicate-slide" title="Dupliquer" data-index="${idx}"><i class="fa-regular fa-copy"></i></button>
            <button class="thumb-action-btn btn-delete-slide" title="Supprimer" data-index="${idx}"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
      `;
    }).join("");

    // Bind Thumbnail click events
    container.querySelectorAll(".slide-thumbnail-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".thumb-action-btn")) return;
        const idx = parseInt(card.dataset.index);
        this.selectSlide(idx);
      });
    });

    container.querySelectorAll(".btn-duplicate-slide").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        this.duplicateSlide(idx);
      });
    });

    container.querySelectorAll(".btn-delete-slide").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        this.deleteSlide(idx);
      });
    });
  },

  // Slide CRUD
  addNewSlide(layoutId = "layout-5") {
    const layoutDef = window.SlideTemplates.getLayout(layoutId);
    const faculty = this.presentation.master.faculty || "Faculté de génie";
    const newSlide = {
      id: `slide-${Date.now()}`,
      layoutId,
      notes: "",
      elements: JSON.parse(JSON.stringify(layoutDef.getDefaultElements(faculty)))
    };

    const insertIndex = this.activeSlideIndex + 1;
    this.presentation.slides.splice(insertIndex, 0, newSlide);
    this.activeSlideIndex = insertIndex;
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    this.closeModal("modal-new-slide");
    this.showToast("Nouvelle diapositive ajoutée", "success");
  },

  duplicateSlide(index = null) {
    const targetIdx = index !== null ? index : this.activeSlideIndex;
    const targetSlide = this.presentation.slides[targetIdx];
    if (!targetSlide) return;

    const duplicated = JSON.parse(JSON.stringify(targetSlide));
    duplicated.id = `slide-${Date.now()}`;
    duplicated.elements.forEach(el => el.id = window.SlideElements.generateId("el"));

    this.presentation.slides.splice(targetIdx + 1, 0, duplicated);
    this.activeSlideIndex = targetIdx + 1;
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    this.showToast("Diapositive dupliquée", "success");
  },

  deleteSlide(index = null) {
    if (this.presentation.slides.length <= 1) {
      this.showToast("Une présentation doit contenir au moins une diapositive.", "error");
      return;
    }
    const targetIdx = index !== null ? index : this.activeSlideIndex;
    this.presentation.slides.splice(targetIdx, 1);
    if (this.activeSlideIndex >= this.presentation.slides.length) {
      this.activeSlideIndex = this.presentation.slides.length - 1;
    }
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    this.showToast("Diapositive supprimée", "success");
  },

  changeCurrentSlideLayout(layoutId) {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const layoutDef = window.SlideTemplates.getLayout(layoutId);
    slide.layoutId = layoutId;
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    this.closeModal("modal-change-layout");
    this.showToast(`Mise en page modifiée: ${layoutDef.name}`, "success");
  },

  // Element Actions
  addElement(el) {
    const slide = this.getActiveSlide();
    if (!slide) return;
    slide.elements.push(el);
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    window.SlideCanvas.selectElement(el.id);
  },

  deleteSelectedElements() {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const selected = window.SlideCanvas.selectedElements;
    if (selected.length === 0) return;

    slide.elements = slide.elements.filter(el => !selected.includes(el.id));
    window.SlideCanvas.deselectAll();
    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    this.showToast("Élément(s) supprimé(s)", "success");
  },

  duplicateSelectedElements() {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const selected = window.SlideCanvas.selectedElements;
    if (selected.length === 0) return;

    const newIds = [];
    selected.forEach(id => {
      const el = slide.elements.find(item => item.id === id);
      if (el) {
        const copy = JSON.parse(JSON.stringify(el));
        copy.id = window.SlideElements.generateId("el");
        copy.x += 30;
        copy.y += 30;
        slide.elements.push(copy);
        newIds.push(copy.id);
      }
    });

    this.renderCurrentSlide();
    this.renderThumbnails();
    this.saveStateToHistory();
    window.SlideCanvas.selectedElements = newIds;
    window.SlideCanvas.updateSelectionClasses();
    this.showToast("Élément(s) dupliqué(s)", "success");
  },

  // Layer Ordering
  bringSelectedForward() {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const selected = window.SlideCanvas.selectedElements;
    selected.forEach(id => {
      const idx = slide.elements.findIndex(el => el.id === id);
      if (idx < slide.elements.length - 1) {
        const temp = slide.elements[idx];
        slide.elements[idx] = slide.elements[idx + 1];
        slide.elements[idx + 1] = temp;
      }
    });
    this.renderCurrentSlide();
    this.saveStateToHistory();
  },

  sendSelectedBackward() {
    const slide = this.getActiveSlide();
    if (!slide) return;
    const selected = window.SlideCanvas.selectedElements;
    selected.forEach(id => {
      const idx = slide.elements.findIndex(el => el.id === id);
      if (idx > 0) {
        const temp = slide.elements[idx];
        slide.elements[idx] = slide.elements[idx - 1];
        slide.elements[idx - 1] = temp;
      }
    });
    this.renderCurrentSlide();
    this.saveStateToHistory();
  },

  // Text Formatting Toolbar Execution
  formatText(command, value = null) {
    document.execCommand(command, false, value);
    window.SlideCanvas.endTransform();
  },

  // Inspector & Toolbar Synchronizer
  updateInspectorAndToolbar() {
    const selected = window.SlideCanvas.selectedElements;
    const hasSelection = selected.length > 0;

    // Enable/disable selection-dependent tools
    document.querySelectorAll(".require-selection").forEach(btn => {
      btn.disabled = !hasSelection;
    });

    // Inspector Tab sync
    const tabElement = document.getElementById("tab-element-props");
    const bodyElement = document.getElementById("inspector-element-section");
    if (tabElement && bodyElement) {
      if (hasSelection) {
        bodyElement.style.display = "flex";
        const slide = this.getActiveSlide();
        const el = slide.elements.find(item => item.id === selected[0]);
        if (el) {
          const inpX = document.getElementById("prop-x");
          const inpY = document.getElementById("prop-y");
          const inpW = document.getElementById("prop-w");
          const inpH = document.getElementById("prop-h");
          if (inpX) inpX.value = el.x;
          if (inpY) inpY.value = el.y;
          if (inpW) inpW.value = el.width;
          if (inpH) inpH.value = el.height;
        }
      } else {
        bodyElement.style.display = "none";
      }
    }
  },

  // Modal Dialogs
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  },

  openImagePicker(elementIdToReplace = null) {
    this.imagePickerCallback = (src) => {
      if (elementIdToReplace) {
        const slide = this.getActiveSlide();
        const el = slide.elements.find(item => item.id === elementIdToReplace);
        if (el) {
          el.src = src;
          this.renderCurrentSlide();
          this.renderThumbnails();
          this.saveStateToHistory();
        }
      } else {
        this.addElement(window.SlideElements.createImage(src));
      }
    };
    this.openModal("modal-insert-image");
  },

  // Toast Notifications
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-info-circle";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  },

  // UI Event Bindings
  bindUiEvents() {
    // Title Change
    const titleInput = document.getElementById("presentation-title-input");
    if (titleInput) {
      titleInput.addEventListener("input", (e) => {
        this.presentation.title = e.target.value;
        this.saveState();
      });
    }

    // New Presentation Button
    document.querySelectorAll(".action-new-deck").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Créer une nouvelle présentation basée sur le modèle Faculté de génie ?")) {
          this.presentation = window.SampleDeck.getDeck();
          this.activeSlideIndex = 0;
          this.renderCurrentSlide();
          this.renderThumbnails();
          this.saveStateToHistory();
          this.showToast("Nouvelle présentation créée !", "success");
        }
      });
    });

    // Master Faculty Change Modal Trigger
    const facultyBadge = document.getElementById("faculty-badge");
    if (facultyBadge) {
      facultyBadge.addEventListener("click", () => this.openModal("modal-master-settings"));
    }

    // Master Settings Form Submit
    const masterForm = document.getElementById("master-settings-form");
    if (masterForm) {
      masterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const facInp = document.getElementById("master-faculty-input");
        const logoInp = document.getElementById("master-logo-toggle");
        if (facInp) this.presentation.master.faculty = facInp.value;
        if (logoInp) this.presentation.master.showLogo = logoInp.checked;

        this.renderCurrentSlide();
        this.renderThumbnails();
        this.saveStateToHistory();
        this.closeModal("modal-master-settings");
        this.showToast("Paramètres du masque mis à jour !", "success");
      });
    }

    // Notes Sync
    const notesArea = document.getElementById("notes-textarea");
    if (notesArea) {
      notesArea.addEventListener("input", (e) => {
        const slide = this.getActiveSlide();
        if (slide) {
          slide.notes = e.target.value;
          this.saveState();
        }
      });
    }

    // Toggle Notes Drawer
    const btnToggleNotes = document.getElementById("btn-toggle-notes");
    if (btnToggleNotes) {
      btnToggleNotes.addEventListener("click", () => {
        const drawer = document.getElementById("notes-drawer");
        if (drawer) drawer.classList.toggle("open");
      });
    }

    // Present Button
    const btnPresent = document.getElementById("btn-present");
    if (btnPresent) {
      btnPresent.addEventListener("click", () => {
        window.SlidePresenter.startPresentation();
      });
    }

    // Primary Export HTML Button
    const btnExportHtml = document.getElementById("btn-export-html");
    if (btnExportHtml) {
      btnExportHtml.addEventListener("click", () => {
        window.SlideExport.exportToHtml();
      });
    }

    // Save JSON Button
    const btnSaveJson = document.getElementById("btn-save-json");
    if (btnSaveJson) {
      btnSaveJson.addEventListener("click", () => {
        window.SlideExport.exportToJson();
      });
    }

    // Load JSON File Input
    const fileImportInput = document.getElementById("file-import-json");
    if (fileImportInput) {
      fileImportInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          window.SlideExport.importFromJson(e.target.files[0]);
        }
      });
    }

    // Zoom Controls
    const zoomSlider = document.getElementById("zoom-slider");
    if (zoomSlider) {
      zoomSlider.addEventListener("input", (e) => {
        window.SlideCanvas.setZoom(parseInt(e.target.value) / 100);
      });
    }
    const btnZoomFit = document.getElementById("btn-zoom-fit");
    if (btnZoomFit) {
      btnZoomFit.addEventListener("click", () => window.SlideCanvas.autoFitZoom());
    }

    // Formatting Toolbar Buttons
    const btnBold = document.getElementById("tool-bold");
    if (btnBold) btnBold.addEventListener("click", () => this.formatText("bold"));
    const btnItalic = document.getElementById("tool-italic");
    if (btnItalic) btnItalic.addEventListener("click", () => this.formatText("italic"));
    const btnUnderline = document.getElementById("tool-underline");
    if (btnUnderline) btnUnderline.addEventListener("click", () => this.formatText("underline"));

    const btnAlignLeft = document.getElementById("tool-align-left");
    if (btnAlignLeft) btnAlignLeft.addEventListener("click", () => this.formatText("justifyLeft"));
    const btnAlignCenter = document.getElementById("tool-align-center");
    if (btnAlignCenter) btnAlignCenter.addEventListener("click", () => this.formatText("justifyCenter"));
    const btnAlignRight = document.getElementById("tool-align-right");
    if (btnAlignRight) btnAlignRight.addEventListener("click", () => this.formatText("justifyRight"));

    const textColorInp = document.getElementById("tool-text-color-input");
    if (textColorInp) {
      textColorInp.addEventListener("input", (e) => {
        this.formatText("foreColor", e.target.value);
      });
    }

    const fontFamilySel = document.getElementById("tool-font-family");
    if (fontFamilySel) {
      fontFamilySel.addEventListener("change", (e) => {
        this.formatText("fontName", e.target.value);
      });
    }

    // Undo / Redo Click
    const btnUndo = document.getElementById("btn-undo");
    if (btnUndo) btnUndo.addEventListener("click", () => this.undo());
    const btnRedo = document.getElementById("btn-redo");
    if (btnRedo) btnRedo.addEventListener("click", () => this.redo());

    // Layer buttons
    const btnForward = document.getElementById("btn-layer-forward");
    if (btnForward) btnForward.addEventListener("click", () => this.bringSelectedForward());
    const btnBackward = document.getElementById("btn-layer-backward");
    if (btnBackward) btnBackward.addEventListener("click", () => this.sendSelectedBackward());

    // Insert Elements dropdown actions
    document.querySelectorAll(".action-insert-text").forEach(btn => {
      btn.addEventListener("click", () => this.addElement(window.SlideElements.createText()));
    });
    document.querySelectorAll(".action-insert-bullets").forEach(btn => {
      btn.addEventListener("click", () => this.addElement(window.SlideElements.createBullets()));
    });
    document.querySelectorAll(".action-insert-image").forEach(btn => {
      btn.addEventListener("click", () => this.openImagePicker());
    });
    document.querySelectorAll(".action-insert-shape").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.shape || "rect";
        this.addElement(window.SlideElements.createShape(type));
      });
    });
    document.querySelectorAll(".action-insert-table").forEach(btn => {
      btn.addEventListener("click", () => this.addElement(window.SlideElements.createTable(4, 3)));
    });
    document.querySelectorAll(".action-insert-chart").forEach(btn => {
      btn.addEventListener("click", () => this.addElement(window.SlideElements.createChart()));
    });
    document.querySelectorAll(".action-insert-icon").forEach(btn => {
      btn.addEventListener("click", () => this.openModal("modal-insert-icon"));
    });
    document.querySelectorAll(".action-insert-code").forEach(btn => {
      btn.addEventListener("click", () => this.addElement(window.SlideElements.createCode()));
    });

    // Populate Icon Picker Grid
    const iconGrid = document.getElementById("icon-picker-grid");
    if (iconGrid) {
      iconGrid.innerHTML = window.SlideElements.iconLibrary.map(icn => `
        <div class="icon-picker-item" data-icon-id="${icn.id}">
          <div style="width:36px; height:36px;">${icn.svg}</div>
          <span class="icon-picker-name">${icn.name}</span>
        </div>
      `).join("");

      iconGrid.querySelectorAll(".icon-picker-item").forEach(item => {
        item.addEventListener("click", () => {
          const iconId = item.dataset.iconId;
          this.addElement(window.SlideElements.createIcon(iconId));
          this.closeModal("modal-insert-icon");
        });
      });
    }

    // Image Upload input handler
    const imgFileInput = document.getElementById("img-upload-file");
    if (imgFileInput) {
      imgFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (this.imagePickerCallback) this.imagePickerCallback(ev.target.result);
            this.closeModal("modal-insert-image");
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    // Modal Close Buttons
    document.querySelectorAll(".modal-close-btn, .modal-cancel-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = btn.closest(".modal-overlay");
        if (modal) modal.classList.remove("active");
      });
    });

    // Menu Item Dropdowns
    document.querySelectorAll(".menu-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const menuItem = btn.closest(".menu-item");
        const wasActive = menuItem.classList.contains("active");
        document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
        if (!wasActive) menuItem.classList.add("active");
      });
    });

    window.addEventListener("click", () => {
      document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
    });
  }
};

// Start app on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.SlideApp.init();
});
