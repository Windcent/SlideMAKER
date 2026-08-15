/**
 * SlideMAKER - Export Engine
 * Exports presentation to PDF (Multi-page HD), PNG, ZIP image bundle, and JSON project save/load
 */

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class ExportEngine {
  constructor() {
    this.isExporting = false;
  }

  // --- 1. Export Entire Presentation to Multi-Page PDF ---

  async exportToPdf() {
    if (this.isExporting) return;
    this.isExporting = true;

    const state = window.state;
    const slidesCount = state.slides.length;
    const originalSlideIndex = state.activeSlideIndex;

    this.showProgressModal('Generating PDF File...', slidesCount);

    try {
      const { jsPDF } = window.jspdf;
      const dims = CONFIG.aspectRatios[state.aspectRatio] || CONFIG.aspectRatios['a4_landscape'];
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [dims.width, dims.height]
      });

      const stage = document.getElementById('slide-stage');

      for (let i = 0; i < slidesCount; i++) {
        this.updateProgressModal(i + 1, slidesCount, `Rendering Slide ${i + 1} of ${slidesCount}...`);

        state.activeSlideIndex = i;
        state.selectedElementIds = [];
        window.canvasEngine.renderActiveSlide();

        await new Promise(r => setTimeout(r, 120));

        const canvas = await html2canvas(stage, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage([dims.width, dims.height], 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, dims.width, dims.height);
      }

      state.activeSlideIndex = originalSlideIndex;
      window.canvasEngine.renderActiveSlide();

      const fileName = `${this.sanitizeFileName(state.title || 'UdeS_Presentation')}.pdf`;
      pdf.save(fileName);

      this.hideProgressModal();
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert(`Error during PDF export: ${err.message}`);
      this.hideProgressModal();
    } finally {
      this.isExporting = false;
    }
  }

  // --- 2. Export Active Slide to PNG ---

  async exportCurrentSlidePng() {
    const stage = document.getElementById('slide-stage');
    if (!stage) return;

    const state = window.state;
    const currentIdx = state.activeSlideIndex;

    const currentSel = [...state.selectedElementIds];
    state.clearSelection();

    try {
      const canvas = await html2canvas(stage, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = `${this.sanitizeFileName(state.title)}_slide_${currentIdx + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG Export Error:', err);
      alert('Error during PNG export.');
    } finally {
      if (currentSel.length > 0) {
        state.selectMultiple(currentSel);
      }
    }
  }

  // --- 3. Export All Slides to ZIP Bundle ---

  async exportAllSlidesZip() {
    if (typeof JSZip === 'undefined') {
      alert('JSZip library not loaded.');
      return;
    }

    if (this.isExporting) return;
    this.isExporting = true;

    const state = window.state;
    const slidesCount = state.slides.length;
    const originalSlideIndex = state.activeSlideIndex;

    this.showProgressModal('Exporting Image Bundle (ZIP)...', slidesCount);

    try {
      const zip = new JSZip();
      const stage = document.getElementById('slide-stage');
      const folder = zip.folder(this.sanitizeFileName(state.title));

      for (let i = 0; i < slidesCount; i++) {
        this.updateProgressModal(i + 1, slidesCount, `Capturing Slide ${i + 1} of ${slidesCount}...`);

        state.activeSlideIndex = i;
        state.selectedElementIds = [];
        window.canvasEngine.renderActiveSlide();

        await new Promise(r => setTimeout(r, 120));

        const canvas = await html2canvas(stage, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });

        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        folder.file(`slide_${String(i + 1).padStart(2, '0')}.png`, base64Data, { base64: true });
      }

      state.activeSlideIndex = originalSlideIndex;
      window.canvasEngine.renderActiveSlide();

      this.updateProgressModal(slidesCount, slidesCount, 'Compressing ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${this.sanitizeFileName(state.title)}_images.zip`;
      link.click();

      this.hideProgressModal();
    } catch (err) {
      console.error('ZIP Export Error:', err);
      alert('Error during ZIP creation.');
      this.hideProgressModal();
    } finally {
      this.isExporting = false;
    }
  }

  // --- 4. Export Standalone Interactive HTML Presentation ---

  async exportToHtml() {
    if (this.isExporting) return;
    this.isExporting = true;

    const state = window.state;
    const slidesCount = state.slides.length;
    this.showProgressModal('Packaging Standalone HTML Presentation...', slidesCount + 2);

    try {
      this.updateProgressModal(1, slidesCount + 2, 'Embedding high-definition backgrounds & images...');

      // Deep clone presentation data
      const presentationData = JSON.parse(JSON.stringify(state.exportToJson()));
      const dims = CONFIG.aspectRatios[state.aspectRatio] || CONFIG.aspectRatios['16_9'];

      // Cache for URL to Base64 conversions
      const imageCache = new Map();

      const fetchAsBase64 = async (url, idOrKey) => {
        if (!url) return url;
        if (url.startsWith('data:')) return url;

        // Check if pre-encoded in window.TEMPLATE_BASE64
        if (typeof window.TEMPLATE_BASE64 === 'object' && window.TEMPLATE_BASE64) {
          if (idOrKey && window.TEMPLATE_BASE64[idOrKey]) return window.TEMPLATE_BASE64[idOrKey];
          if (window.TEMPLATE_BASE64[url]) return window.TEMPLATE_BASE64[url];
          const filename = url.split('/').pop().split('?')[0];
          if (window.TEMPLATE_BASE64[filename]) return window.TEMPLATE_BASE64[filename];
          const fileWithoutExt = filename.replace(/\.[^/.]+$/, '');
          if (window.TEMPLATE_BASE64[fileWithoutExt]) return window.TEMPLATE_BASE64[fileWithoutExt];
        }

        if (imageCache.has(url)) return imageCache.get(url);

        // Try Canvas conversion first
        try {
          const b64 = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } catch (e) {
                reject(e);
              }
            };
            img.onerror = (e) => reject(e);
            img.src = url;
          });
          imageCache.set(url, b64);
          return b64;
        } catch (e) {
          // Fallback to fetch -> blob -> FileReader
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const b64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve(url);
              reader.readAsDataURL(blob);
            });
            imageCache.set(url, b64);
            return b64;
          } catch (err2) {
            console.warn('Could not base64 encode asset:', url, err2);
            return url;
          }
        }
      };

      // Convert all slide background images and element images to base64
      for (let i = 0; i < presentationData.slides.length; i++) {
        this.updateProgressModal(i + 1, slidesCount + 2, `Processing slide ${i + 1} assets...`);
        const s = presentationData.slides[i];

        if (s.background && (s.background.type === 'pdf' || s.background.type === 'image') && s.background.value) {
          s.background.value = await fetchAsBase64(s.background.value, s.background.pdfId);
        }

        if (s.elements && Array.isArray(s.elements)) {
          for (const el of s.elements) {
            if (el.type === 'image' && el.src) {
              el.src = await fetchAsBase64(el.src, el.id);
            }
          }
        }
      }

      this.updateProgressModal(slidesCount + 1, slidesCount + 2, 'Compiling interactive web player...');

      const jsonPayload = JSON.stringify(presentationData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

      const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(presentationData.title || 'Slide Presentation')}</title>
  
  <!-- Modern Typography & Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;600;700&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- Interactive Chart.js runtime -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #090d16;
      font-family: 'Inter', sans-serif;
      color: #ffffff;
      user-select: none;
    }

    #player-container {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #172033 0%, #080c14 100%);
    }

    #slide-wrapper {
      position: relative;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      background: #ffffff;
      flex-shrink: 0;
    }

    #slide-stage {
      position: absolute;
      top: 0; left: 0;
      width: ${dims.width}px;
      height: ${dims.height}px;
      transform-origin: 0 0;
      overflow: hidden;
      background: #ffffff;
    }

    .slide-background {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    #slide-elements-layer {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 1;
    }

    .slide-element {
      position: absolute;
      transform-origin: center center;
    }

    /* Laser Pointer */
    #laser-pointer {
      position: fixed;
      width: 8px;
      height: 8px;
      background: #FF0033;
      border-radius: 50%;
      box-shadow: 0 0 6px #FF0033, 0 0 12px rgba(255, 0, 51, 0.85), 0 0 20px rgba(255, 23, 68, 0.6);
      pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 99999;
      display: none;
    }

    /* Floating Navigation Controls HUD */
    #player-hud {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 30px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 10000;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    #player-hud.is-hidden {
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, 15px);
    }

    .hud-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s ease;
    }

    .hud-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
    }

    .hud-btn.is-active {
      color: #ffffff;
      background: #FF0033;
      box-shadow: 0 0 10px rgba(255, 0, 51, 0.6);
    }

    .hud-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.15);
    }

    .hud-counter {
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9;
      padding: 0 6px;
      font-family: 'Outfit', sans-serif;
    }

    /* Progress Bar along bottom */
    #progress-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      height: 4px;
      background: linear-gradient(90deg, #00A350, #7FC23F);
      z-index: 10001;
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Speaker Notes Modal */
    #notes-modal {
      position: fixed;
      bottom: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 16px 20px;
      max-width: 550px;
      width: 90%;
      max-height: 250px;
      overflow-y: auto;
      z-index: 10002;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
      display: none;
    }

    #notes-modal.is-open { display: block; }
    #notes-modal h4 {
      font-family: 'Outfit', sans-serif;
      font-size: 13px;
      color: #7fc23f;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #notes-modal p {
      font-size: 13px;
      color: #e2e8f0;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>

  <div id="player-container">
    <div id="slide-wrapper">
      <div id="slide-stage">
        <div id="slide-background" class="slide-background"></div>
        <div id="slide-elements-layer"></div>
      </div>
    </div>
  </div>

  <div id="laser-pointer"></div>
  <div id="progress-bar" style="width: 0%;"></div>

  <!-- Speaker Notes Popup -->
  <div id="notes-modal">
    <h4><i class="fa-solid fa-note-sticky"></i> Speaker Notes</h4>
    <p id="notes-content">No notes for this slide.</p>
  </div>

  <!-- Interactive Controls HUD -->
  <div id="player-hud">
    <button class="hud-btn" id="btn-prev" title="Previous Slide (Left Arrow)"><i class="fa-solid fa-chevron-left"></i></button>
    <span class="hud-counter" id="hud-counter">1 / 1</span>
    <button class="hud-btn" id="btn-next" title="Next Slide (Right Arrow / Space)"><i class="fa-solid fa-chevron-right"></i></button>
    <div class="hud-divider"></div>
    <button class="hud-btn" id="btn-laser" title="Toggle Laser Pointer (L)"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
    <button class="hud-btn" id="btn-notes" title="Toggle Notes (N)"><i class="fa-solid fa-note-sticky"></i></button>
    <button class="hud-btn" id="btn-fullscreen" title="Toggle Fullscreen (F)"><i class="fa-solid fa-expand"></i></button>
  </div>

  <script>
    const DATA = ${jsonPayload};
    let currentIndex = 0;
    let isLaserActive = false;
    let isNotesOpen = false;
    let chartInstances = [];
    let hudTimeout = null;

    const baseWidth = ${dims.width};
    const baseHeight = ${dims.height};

    const stage = document.getElementById('slide-stage');
    const wrapper = document.getElementById('slide-wrapper');
    const bgLayer = document.getElementById('slide-background');
    const elementsLayer = document.getElementById('slide-elements-layer');
    const counterEl = document.getElementById('hud-counter');
    const progressBar = document.getElementById('progress-bar');
    const hud = document.getElementById('player-hud');
    const laser = document.getElementById('laser-pointer');
    const notesModal = document.getElementById('notes-modal');
    const notesContent = document.getElementById('notes-content');

    function fitStage() {
      const availW = window.innerWidth - 32;
      const availH = window.innerHeight - 32;
      const scale = Math.min(availW / baseWidth, availH / baseHeight);

      wrapper.style.width = Math.round(baseWidth * scale) + 'px';
      wrapper.style.height = Math.round(baseHeight * scale) + 'px';
      stage.style.transform = 'scale(' + scale + ')';
    }

    function renderSlide(index) {
      if (!DATA.slides || !DATA.slides[index]) return;
      currentIndex = index;
      const slide = DATA.slides[index];

      // 1. Background
      bgLayer.style.backgroundImage = 'none';
      bgLayer.style.backgroundColor = 'transparent';
      const bg = slide.background || { type: 'color', value: '#FFFFFF' };
      if (bg.type === 'pdf' || bg.type === 'image') {
        bgLayer.style.backgroundImage = 'url("' + bg.value + '")';
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundRepeat = 'no-repeat';
      } else if (bg.type === 'gradient') {
        bgLayer.style.backgroundImage = bg.value;
      } else {
        bgLayer.style.backgroundColor = bg.value || '#FFFFFF';
      }

      // 2. Elements
      chartInstances.forEach(c => c.destroy());
      chartInstances = [];
      elementsLayer.innerHTML = '';

      if (slide.elements) {
        slide.elements.forEach(el => {
          const dom = document.createElement('div');
          dom.className = 'slide-element';
          dom.style.left = el.x + 'px';
          dom.style.top = el.y + 'px';
          dom.style.width = el.width + 'px';
          dom.style.height = el.height + 'px';
          dom.style.zIndex = el.zIndex || 1;
          dom.style.opacity = el.opacity !== undefined ? el.opacity : 1;
          dom.style.transform = 'rotate(' + (el.rotation || 0) + 'deg)';

          const inner = document.createElement('div');
          inner.style.width = '100%';
          inner.style.height = '100%';

          if (el.type === 'text') {
            inner.style.fontFamily = el.fontFamily || 'Inter';
            inner.style.fontSize = (el.fontSize || 18) + 'px';
            inner.style.fontWeight = el.fontWeight || '400';
            inner.style.fontStyle = el.fontStyle || 'normal';
            inner.style.textDecoration = el.textDecoration || 'none';
            inner.style.textAlign = el.textAlign || 'left';
            inner.style.color = el.color || '#0F172A';
            inner.style.lineHeight = el.lineHeight || 1.35;
            inner.style.letterSpacing = (el.letterSpacing || 0) + 'px';
            inner.style.padding = (el.padding || 8) + 'px';
            if (el.backgroundColor) inner.style.backgroundColor = el.backgroundColor;
            if (el.borderWidth) inner.style.border = el.borderWidth + 'px ' + (el.borderStyle || 'solid') + ' ' + (el.borderColor || '#000');
            if (el.borderRadius) inner.style.borderRadius = el.borderRadius + 'px';

            if (el.shadowBlur || el.shadowOffsetY || el.shadowOffsetX) {
              const sStr = (el.shadowOffsetX || 0) + 'px ' + (el.shadowOffsetY !== undefined ? el.shadowOffsetY : 4) + 'px ' + (el.shadowBlur || 8) + 'px ' + (el.shadowColor || 'rgba(0,0,0,0.4)');
              inner.style.textShadow = sStr;
              if (el.backgroundColor && el.backgroundColor !== 'transparent') inner.style.boxShadow = sStr;
            }

            inner.innerHTML = el.content || '';
          } else if (el.type === 'shape') {
            const fill = el.fillGradient || el.fillColor || '#00A350';
            const stroke = el.strokeColor || 'transparent';
            const sw = el.strokeWidth || 0;
            const shapeId = el.shapeType || 'rect';
            if (shapeId === 'rect' || shapeId === 'rounded-rect' || shapeId === 'pill' || shapeId === 'circle') {
              inner.style.background = fill;
              if (sw > 0) inner.style.border = sw + 'px solid ' + stroke;
              inner.style.borderRadius = (el.borderRadius || 0) + 'px';
              if (el.shadowBlur || el.shadowOffsetY || el.shadowOffsetX) {
                inner.style.boxShadow = (el.shadowOffsetX || 0) + 'px ' + (el.shadowOffsetY !== undefined ? el.shadowOffsetY : 4) + 'px ' + (el.shadowBlur || 8) + 'px ' + (el.shadowColor || 'rgba(0,0,0,0.3)');
              }
            } else {
              inner.innerHTML = renderShapeSvg(shapeId, el.width, el.height, fill, stroke, sw);
            }
          } else if (el.type === 'image') {
            const img = document.createElement('img');
            img.src = el.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = el.objectFit || 'contain';
            if (el.borderRadius) img.style.borderRadius = el.borderRadius + 'px';
            if (el.shadowBlur || el.shadowOffsetY || el.shadowOffsetX) {
              img.style.boxShadow = (el.shadowOffsetX || 0) + 'px ' + (el.shadowOffsetY !== undefined ? el.shadowOffsetY : 4) + 'px ' + (el.shadowBlur || 8) + 'px ' + (el.shadowColor || 'rgba(0,0,0,0.3)');
            }
            inner.appendChild(img);
          } else if (el.type === 'icon') {
            inner.style.display = 'flex';
            inner.style.alignItems = 'center';
            inner.style.justifyContent = 'center';
            const iconSize = Math.min(el.width, el.height) * 0.65;
            inner.innerHTML = '<i class="' + (el.iconClass || 'fa-solid fa-star') + '" style="font-size:' + iconSize + 'px;color:' + (el.iconColor || '#00A350') + ';"></i>';
          } else if (el.type === 'table') {
            let html = '<table style="width:100%;height:100%;border-collapse:collapse;border-radius:' + (el.borderRadius||8) + 'px;overflow:hidden;background:' + (el.bodyBg||'#fff') + ';">';
            (el.data || []).forEach((row, rIdx) => {
              html += '<tr>';
              row.forEach(cell => {
                if (rIdx === 0) {
                  html += '<th style="background:' + (el.headerBg||'#00A350') + ';color:' + (el.headerColor||'#fff') + ';font-size:' + (el.headerFontSize||16) + 'px;padding:10px;text-align:left;border:1px solid ' + (el.borderColor||'#CBD5E1') + ';">' + cell + '</th>';
                } else {
                  const bg = rIdx % 2 === 0 ? (el.alternateRowBg || '#F8FAFC') : (el.bodyBg || '#FFFFFF');
                  html += '<td style="background:' + bg + ';color:' + (el.bodyColor||'#0F172A') + ';font-size:' + (el.bodyFontSize||14) + 'px;padding:8px;border:1px solid ' + (el.borderColor||'#CBD5E1') + ';">' + cell + '</td>';
                }
              });
              html += '</tr>';
            });
            html += '</table>';
            inner.innerHTML = html;
          } else if (el.type === 'chart') {
            inner.innerHTML = '<div style="width:100%;height:100%;padding:14px;background:' + (el.backgroundColor||'#fff') + ';border-radius:' + (el.borderRadius||12) + 'px;border:1px solid ' + (el.borderColor||'#E2E8F0') + ';"><h4 style="margin:0 0 8px 0;font-size:15px;color:#0F172A;text-align:center;">' + (el.chartTitle||'') + '</h4><div style="position:relative;width:100%;height:calc(100% - 28px);"><canvas></canvas></div></div>';
            setTimeout(() => {
              const cvs = inner.querySelector('canvas');
              if (cvs && typeof Chart !== 'undefined') {
                const chart = new Chart(cvs.getContext('2d'), {
                  type: el.chartType || 'bar',
                  data: {
                    labels: el.labels || ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: el.datasets || [{ label: 'Performance', data: [12, 19, 3, 5] }]
                  },
                  options: { responsive: true, maintainAspectRatio: false }
                });
                chartInstances.push(chart);
              }
            }, 50);
          }

          dom.appendChild(inner);
          elementsLayer.appendChild(dom);
        });
      }

      // HUD & Progress
      counterEl.textContent = (currentIndex + 1) + ' / ' + DATA.slides.length;
      progressBar.style.width = (((currentIndex + 1) / DATA.slides.length) * 100) + '%';

      // Notes
      notesContent.textContent = slide.notes || 'No speaker notes for this slide.';
      showHud();
    }

    function renderShapeSvg(shapeId, w, h, fill, stroke, sw) {
      let path = '';
      if (shapeId === 'triangle') path = '<polygon points="' + (w/2) + ',' + sw + ' ' + (w-sw) + ',' + (h-sw) + ' ' + sw + ',' + (h-sw) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" />';
      else if (shapeId === 'diamond') path = '<polygon points="' + (w/2) + ',' + sw + ' ' + (w-sw) + ',' + (h/2) + ' ' + (w/2) + ',' + (h-sw) + ' ' + sw + ',' + (h/2) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" />';
      else if (shapeId === 'star') {
        const cx = w/2, cy = h/2, spikes = 5, outerR = Math.min(w,h)/2 - sw, innerR = outerR * 0.42;
        let pts = '', rot = (Math.PI/2)*3, step = Math.PI/spikes;
        for (let i = 0; i < spikes; i++) {
          pts += (cx + Math.cos(rot)*outerR) + ',' + (cy + Math.sin(rot)*outerR) + ' '; rot += step;
          pts += (cx + Math.cos(rot)*innerR) + ',' + (cy + Math.sin(rot)*innerR) + ' '; rot += step;
        }
        path = '<polygon points="' + pts.trim() + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" />';
      } else if (shapeId === 'arrow-right') {
        const bH = h*0.45, hW = w*0.35, tY = (h-bH)/2, bY = tY+bH;
        path = '<polygon points="0,' + tY + ' ' + (w-hW) + ',' + tY + ' ' + (w-hW) + ',0 ' + w + ',' + (h/2) + ' ' + (w-hW) + ',' + h + ' ' + (w-hW) + ',' + bY + ' 0,' + bY + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" />';
      } else if (shapeId === 'arrow-left') {
        const bH = h*0.45, hW = w*0.35, tY = (h-bH)/2, bY = tY+bH;
        path = '<polygon points="' + hW + ',' + tY + ' ' + w + ',' + tY + ' ' + w + ',' + bY + ' ' + hW + ',' + bY + ' ' + hW + ',' + h + ' 0,' + (h/2) + ' ' + hW + ',0" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" />';
      } else {
        path = '<rect width="' + w + '" height="' + h + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" />';
      }
      return '<svg width="100%" height="100%" viewBox="0 0 ' + w + ' ' + h + '">' + path + '</svg>';
    }

    function prevSlide() { if (currentIndex > 0) renderSlide(currentIndex - 1); }
    function nextSlide() { if (currentIndex < DATA.slides.length - 1) renderSlide(currentIndex + 1); }

    function showHud() {
      hud.classList.remove('is-hidden');
      if (hudTimeout) clearTimeout(hudTimeout);
      hudTimeout = setTimeout(() => { hud.classList.add('is-hidden'); }, 3000);
    }

    // Event Listeners
    window.addEventListener('resize', fitStage);
    window.addEventListener('mousemove', (e) => {
      showHud();
      if (isLaserActive) {
        laser.style.left = e.clientX + 'px';
        laser.style.top = e.clientY + 'px';
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); nextSlide(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prevSlide(); }
      else if (e.key === 'Home') { e.preventDefault(); renderSlide(0); }
      else if (e.key === 'End') { e.preventDefault(); renderSlide(DATA.slides.length - 1); }
      else if (e.key === 'l' || e.key === 'L') { toggleLaser(); }
      else if (e.key === 'n' || e.key === 'N') { toggleNotes(); }
      else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
      else if (e.key === 'Escape') { if (isNotesOpen) toggleNotes(); }
    });

    document.getElementById('btn-prev').addEventListener('click', prevSlide);
    document.getElementById('btn-next').addEventListener('click', nextSlide);

    function toggleLaser() {
      isLaserActive = !isLaserActive;
      laser.style.display = isLaserActive ? 'block' : 'none';
      document.getElementById('btn-laser').classList.toggle('is-active', isLaserActive);
      document.body.style.cursor = isLaserActive ? 'none' : 'default';
    }

    function toggleNotes() {
      isNotesOpen = !isNotesOpen;
      notesModal.classList.toggle('is-open', isNotesOpen);
      document.getElementById('btn-notes').classList.toggle('is-active', isNotesOpen);
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    document.getElementById('btn-laser').addEventListener('click', toggleLaser);
    document.getElementById('btn-notes').addEventListener('click', toggleNotes);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

    // Touch Swipe Navigation for Mobile / Tablet
    let touchStartX = 0;
    window.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    window.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) nextSlide();
      if (touchEndX > touchStartX + 50) prevSlide();
    }, { passive: true });

    // Initial Start
    fitStage();
    renderSlide(0);
  <\/script>
</body>
</html>`;

      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${this.sanitizeFileName(state.title || 'Presentation')}.html`;
      link.click();

      this.hideProgressModal();
    } catch (err) {
      console.error('HTML Export Error:', err);
      alert(`Error generating standalone HTML: ${err.message}`);
      this.hideProgressModal();
    } finally {
      this.isExporting = false;
    }
  }

  // --- 5. Save Presentation to JSON (.slidemaker) ---

  savePresentationJson() {
    const state = window.state;
    const data = state.exportToJson();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.sanitizeFileName(state.title)}.slidemaker`;
    link.click();
  }

  // --- 6. Load Presentation from JSON ---

  loadPresentationJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = window.state.loadFromJson(e.target.result);
        if (success) {
          const titleInput = document.getElementById('presentation-title-input');
          if (titleInput) {
            titleInput.value = window.state.title;
          }
        }
      } catch (err) {
        alert('Error loading presentation file.');
      }
    };
    reader.readAsText(file);
  }

  // Progress Modal Helpers
  showProgressModal(title, total) {
    let modal = document.getElementById('export-progress-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'export-progress-modal';
      modal.className = 'modal-backdrop is-open';
      modal.innerHTML = `
        <div class="modal-card modal-progress-card">
          <div class="spinner-udes"></div>
          <h3 id="export-modal-title">${title}</h3>
          <p id="export-modal-status">Initializing...</p>
          <div class="progress-bar-track">
            <div id="export-modal-bar" class="progress-bar-fill" style="width:0%;"></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.classList.add('is-open');
      document.getElementById('export-modal-title').textContent = title;
      document.getElementById('export-modal-bar').style.width = '0%';
    }
  }

  updateProgressModal(current, total, statusText) {
    const status = document.getElementById('export-modal-status');
    const bar = document.getElementById('export-modal-bar');
    if (status) status.textContent = statusText;
    if (bar) {
      const pct = Math.round((current / total) * 100);
      bar.style.width = `${pct}%`;
    }
  }

  hideProgressModal() {
    const modal = document.getElementById('export-progress-modal');
    if (modal) {
      modal.classList.remove('is-open');
    }
  }

  sanitizeFileName(str) {
    return (str || 'Presentation')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_');
  }
}

window.ExportEngine = ExportEngine;
