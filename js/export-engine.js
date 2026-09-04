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

    .element-inner {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .element-inner ul,
    .element-inner ol {
      margin: 0.25em 0;
      padding-left: 1.4em;
      box-sizing: border-box;
      text-align: inherit;
    }

    .element-inner ul { list-style-type: disc; }
    .element-inner ol { list-style-type: decimal; }
    .element-inner li { margin-bottom: 0.35em; line-height: inherit; list-style-position: outside; }
    .element-inner li:last-child { margin-bottom: 0; }
    .element-inner ul ul, .element-inner ol ul { list-style-type: circle; margin: 0.2em 0; padding-left: 1.3em; }
    .element-inner ol ol, .element-inner ul ol { list-style-type: lower-alpha; margin: 0.2em 0; padding-left: 1.3em; }
    .element-inner ul ul ul, .element-inner ol ul ul, .element-inner ul ol ul, .element-inner ol ol ul { list-style-type: square; margin: 0.15em 0; padding-left: 1.3em; }
    .element-inner ol ol ol, .element-inner ul ol ol, .element-inner ul ul ol, .element-inner ol ol ol { list-style-type: lower-roman; margin: 0.15em 0; padding-left: 1.3em; }

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

    /* Zoom Flow Styles for Standalone Export */
    .zoom-flow-wrapper { position: absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; user-select:none; }
    .zoom-flow-stage { position: absolute; top:0; left:0; width:100%; height:100%; transform-origin:0 0; transition: transform 0.65s cubic-bezier(0.25, 1, 0.35, 1); z-index:1; }
    .zoom-flow-svg-layer { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1; }
    .zoom-flow-connector { stroke-dasharray:6; animation: flowLineDash 30s linear infinite; }
    @keyframes flowLineDash { to { stroke-dashoffset: -1000; } }
    .zoom-flow-node { position: absolute; transform: translate(-50%, -50%); cursor: pointer; z-index:10; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, filter 0.4s ease, opacity 0.4s ease; }
    .zoom-flow-node-card { width:220px; background: rgba(22, 33, 50, 0.88); backdrop-filter: blur(12px); border: 1.5px solid rgba(255,255,255,0.15); border-radius:14px; padding:16px; box-shadow: 0 10px 25px rgba(0,0,0,0.45); display:flex; flex-direction:column; gap:10px; position:relative; overflow:hidden; transition: all 0.3s ease; }
    .zoom-flow-node-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:4px; background: var(--node-color, #00A350); }
    .zoom-flow-node:hover .zoom-flow-node-card { transform: translateY(-4px) scale(1.03); border-color: var(--node-color, #7FC23F); box-shadow: 0 16px 36px rgba(0,0,0,0.55); }
    .zoom-flow-node-header { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .zoom-flow-node-icon { width:38px; height:38px; border-radius:10px; background: rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:16px; color: var(--node-color, #7FC23F); border:1px solid rgba(255,255,255,0.1); }
    .zoom-flow-node-badge { font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 7px; border-radius:999px; background:rgba(255,255,255,0.1); color:#94a3b8; }
    .zoom-flow-node-title { font-family:'Outfit',sans-serif; font-size:15px; font-weight:700; color:#ffffff; line-height:1.25; margin:0; }
    .zoom-flow-node-sub { font-size:11.5px; color:#94a3b8; line-height:1.35; margin:0; }
    .zoom-flow-node-mini-metric { display:flex; align-items:baseline; gap:6px; background:rgba(0,0,0,0.25); padding:4px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.05); }
    .zoom-flow-node-mini-metric .val { font-size:14px; font-weight:700; color:var(--node-color, #7FC23F); }
    .zoom-flow-node-mini-metric .lbl { font-size:10px; color:#64748b; text-transform:uppercase; }
    .zoom-flow-stage.is-zoomed-in .zoom-flow-node { opacity:0.35; filter:blur(2px); }
    .zoom-flow-stage.is-zoomed-in .zoom-flow-node.is-active-node { opacity:1 !important; filter:none !important; z-index:100; }
    .zoom-flow-node.is-active-node .zoom-flow-node-card { border-color:var(--node-color, #7FC23F); box-shadow: 0 25px 60px rgba(0,0,0,0.8); }
    .zoom-detail-popout { position:absolute; top:calc(100% + 14px); left:50%; transform:translateX(-50%); width:340px; background:rgba(15, 23, 42, 0.95); backdrop-filter:blur(16px); border:1.5px solid var(--node-color, #7FC23F); border-radius:14px; padding:16px 18px; box-shadow:0 20px 50px rgba(0,0,0,0.75); display:none; flex-direction:column; gap:12px; z-index:105; animation: zoomPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes zoomPopIn { from { opacity:0; transform:translateX(-50%) translateY(12px) scale(0.92); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
    .zoom-flow-node.is-active-node .zoom-detail-popout { display:flex; }
    .zoom-detail-summary { font-size:13px; color:#e2e8f0; line-height:1.45; }
    .zoom-detail-bullets { margin:0; padding-left:18px; font-size:12px; color:#cbd5e1; display:flex; flex-direction:column; gap:6px; }
    .zoom-detail-metric-badge { display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:8px 12px; border-radius:8px; }
    .zoom-detail-metric-val { font-family:'Outfit',sans-serif; font-size:20px; font-weight:800; color:var(--node-color, #7FC23F); }
    .zoom-detail-metric-lbl { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; }

    /* Flow Dropdown Menu & Child Slide Breadcrumb */
    .zf-slide-dropdown-container { position:absolute; top:14px; left:18px; z-index:60; }
    .zf-slide-dropdown-trigger { background:rgba(15,23,42,0.92); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.18); border-radius:30px; padding:7px 15px; display:flex; align-items:center; gap:10px; color:#ffffff; font-family:inherit; font-size:12.5px; font-weight:600; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,0.5); transition:all 0.2s ease; }
    .zf-slide-dropdown-trigger:hover { border-color:#7fc23f; background:rgba(22,33,50,0.98); }
    .zf-dropdown-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px; background:rgba(127,194,63,0.2); color:#7fc23f; border:1px solid rgba(127,194,63,0.35); }
    .zf-slide-dropdown-menu { position:absolute; top:calc(100% + 8px); left:0; min-width:280px; background:rgba(15,23,42,0.96); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.16); border-radius:12px; padding:6px; box-shadow:0 16px 40px rgba(0,0,0,0.7); display:flex; flex-direction:column; gap:4px; z-index:100; }
    .zf-slide-dropdown-menu.is-hidden { display:none !important; }
    .zf-dropdown-header { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#94a3b8; padding:6px 10px 4px 10px; display:flex; align-items:center; gap:6px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:2px; }
    .zf-dropdown-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; background:transparent; border:none; cursor:pointer; text-align:left; width:100%; color:#f1f5f9; transition:all 0.15s ease; }
    .zf-dropdown-item:hover { background:rgba(255,255,255,0.08); color:#ffffff; }
    .zf-dropdown-item-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .zf-dropdown-item-text { flex:1; min-width:0; }
    .zf-dropdown-item-title { font-family:'Outfit',sans-serif; font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .zf-dropdown-item-sub { font-size:10.5px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .zf-dropdown-item-arrow { font-size:10px; color:#94a3b8; opacity:0; transition:all 0.15s ease; }
    .zf-dropdown-item:hover .zf-dropdown-item-arrow { opacity:1; color:#7fc23f; transform:translateX(2px); }

    .zf-child-breadcrumb-banner { position:absolute; top:16px; left:20px; background:rgba(15,23,42,0.88); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.18); border-radius:20px; padding:6px 14px; display:flex; align-items:center; gap:8px; z-index:50; cursor:pointer; transition:all 0.2s ease; box-shadow:0 4px 14px rgba(0,0,0,0.4); color:#ffffff; font-size:12px; font-weight:600; }
    .zf-child-breadcrumb-banner:hover { background:rgba(22,33,50,0.98); border-color:#7fc23f; transform:translateX(-2px); }
    .zf-node-jump-btn { margin-top:6px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#ffffff; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; transition:all 0.15s ease; width:100%; }
    .zf-node-jump-btn:hover { background:var(--node-color, #00A350); border-color:var(--node-color, #00A350); }

    /* Fullscreen Cinematic Zoom & Slide Crossfade */
    .zoom-flow-stage.is-zooming-fullscreen { transition: transform 0.52s cubic-bezier(0.22, 1, 0.36, 1) !important; }
    .zoom-flow-stage.is-zooming-fullscreen .zoom-flow-node:not(.is-active-node) { opacity: 0 !important; transition: opacity 0.35s ease !important; }
    .zoom-flow-stage.is-zooming-fullscreen .zoom-flow-svg-layer { opacity: 0.08 !important; transition: opacity 0.35s ease !important; }
    .zoom-flow-stage.has-slide-overlay .zoom-flow-node.is-fullscreen-node .zoom-flow-node-card { opacity: 0 !important; transition: opacity 0.32s cubic-bezier(0.25, 1, 0.5, 1) !important; }
    .zoom-flow-node.is-fullscreen-node .zoom-flow-node-card { box-shadow: 0 0 100px rgba(0, 0, 0, 0.95), 0 0 50px var(--node-glow, rgba(0, 163, 80, 0.6)); border-color: var(--node-color, #7fc23f); transition: opacity 0.32s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s ease; }
    .zoom-flow-stage.is-zooming-out { transition: transform 0.5s cubic-bezier(0.25, 1, 0.4, 1) !important; }
    .zoom-flow-stage.is-zooming-out .zoom-flow-node { opacity: 1 !important; transition: opacity 0.44s ease-out !important; }
    .zoom-flow-stage.is-zooming-out .zoom-flow-svg-layer { opacity: 1 !important; transition: opacity 0.44s ease-out !important; }
    .zf-slide-fade-enter { animation: zfSlideFadeIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .zf-slide-fade-exit { animation: zfSlideFadeOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards; }
    @keyframes zfSlideFadeIn { 0% { opacity: 0; transform: scale(0.97); filter: blur(4px); } 100% { opacity: 1; transform: scale(1); filter: blur(0px); } }
    @keyframes zfSlideFadeOut { 0% { opacity: 1; transform: scale(1); filter: blur(0px); } 100% { opacity: 0; transform: scale(0.97); filter: blur(4px); } }
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
    let currentZoomController = null;

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

      currentZoomController = null;
      chartInstances.forEach(c => c.destroy());
      chartInstances = [];
      elementsLayer.innerHTML = '';
      elementsLayer.className = 'elements-layer';
      if (slide.isFlowChild) {
        elementsLayer.classList.add('zf-slide-fade-enter');
      }

      // Check if Zoom Flow Slide
      if (slide.isZoomFlow && slide.zoomFlowData) {
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.background = 'radial-gradient(circle at center, #0a1f18 0%, #06110d 100%)';
        renderExportedZoomFlow(slide.zoomFlowData);
        counterEl.textContent = (currentIndex + 1) + ' / ' + DATA.slides.length;
        progressBar.style.width = (((currentIndex + 1) / DATA.slides.length) * 100) + '%';
        notesContent.textContent = slide.notes || 'Zoom Flow Diagram - Use Arrow Keys or click nodes to zoom in!';
        showHud();
        return;
      }

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
          } else if (el.type === 'html') {
            inner.style.overflow = 'hidden';
            if (el.borderRadius) inner.style.borderRadius = el.borderRadius + 'px';
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.background = el.backgroundColor || 'transparent';
            iframe.sandbox = 'allow-scripts allow-same-origin';
            iframe.srcdoc = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;font-family:sans-serif;background:transparent;}</style></head><body>' + (el.htmlContent || '') + '</body></html>';
            inner.appendChild(iframe);
          }

          dom.appendChild(inner);
          elementsLayer.appendChild(dom);
        });
      }

      // If this is a child slide linked to a Zoom Flow diagram, render Return Breadcrumb banner
      if (slide.isFlowChild) {
        const banner = document.createElement('div');
        banner.className = 'zf-child-breadcrumb-banner';
        banner.innerHTML = '<i class="fa-solid fa-arrow-left" style="color:#7fc23f;font-size:12px;"></i> <span>Return to Flow Diagram</span>';
        banner.title = 'Return to the Main Flow Diagram';
        banner.addEventListener('click', function(e) {
          e.stopPropagation();
          elementsLayer.classList.add('zf-slide-fade-exit');
          setTimeout(function() {
            elementsLayer.classList.remove('zf-slide-fade-exit');
            if (slide.parentFlowSlideId) {
              const pIdx = DATA.slides.findIndex(s => s.id === slide.parentFlowSlideId);
              if (pIdx !== -1) { renderSlide(pIdx); return; }
            }
            const anyFlowIdx = DATA.slides.findIndex(s => s.isZoomFlow);
            if (anyFlowIdx !== -1) { renderSlide(anyFlowIdx); }
          }, 180);
        });
        elementsLayer.appendChild(banner);
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

    // Zoom Flow renderer for exported presentation
    function renderExportedZoomFlow(flowData) {
      const nodes = flowData.nodes || [];
      const total = nodes.length;
      const pX = 140, pY = 160, uW = baseWidth - pX * 2;
      const stepX = total > 1 ? uW / (total - 1) : uW / 2;
      const positions = [];

      nodes.forEach((n, i) => {
        const x = (n.x !== undefined) ? n.x : (pX + i * stepX);
        const y = (n.y !== undefined) ? n.y : ((baseHeight / 2) + (i % 2 === 1 ? 25 : -25));
        positions.push({ id: n.id, x: x, y: y });
      });

      const posMap = new Map();
      positions.forEach(p => posMap.set(p.id, p));

      const flowWrap = document.createElement('div');
      flowWrap.className = 'zoom-flow-wrapper';

      const zoomStage = document.createElement('div');
      zoomStage.className = 'zoom-flow-stage';
      zoomStage.style.width = baseWidth + 'px';
      zoomStage.style.height = baseHeight + 'px';

      // SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'zoom-flow-svg-layer');
      svg.setAttribute('viewBox', '0 0 ' + baseWidth + ' ' + baseHeight);

      const getExportPortCoords = (p, port) => {
        const halfW = 112, halfH = 65;
        switch (port) {
          case 'top': return { x: p.x, y: p.y - halfH, dirX: 0, dirY: -1, port: 'top' };
          case 'bottom': return { x: p.x, y: p.y + halfH, dirX: 0, dirY: 1, port: 'bottom' };
          case 'left': return { x: p.x - halfW, y: p.y, dirX: -1, dirY: 0, port: 'left' };
          case 'right': default: return { x: p.x + halfW, y: p.y, dirX: 1, dirY: 0, port: 'right' };
        }
      };

      const generateExportSpline = (pt1, pt2, ptsArr) => {
        const pts = [
          { x: pt1.x, y: pt1.y },
          { x: ptsArr[0].x, y: ptsArr[0].y },
          { x: ptsArr[1].x, y: ptsArr[1].y },
          { x: ptsArr[2].x, y: ptsArr[2].y },
          { x: pt2.x, y: pt2.y }
        ];
        const dist01 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const dist34 = Math.hypot(pts[4].x - pts[3].x, pts[4].y - pts[3].y);
        const tan = [];
        tan[0] = { x: pt1.dirX * Math.max(30, dist01 * 0.75), y: pt1.dirY * Math.max(30, dist01 * 0.75) };
        tan[4] = { x: -pt2.dirX * Math.max(30, dist34 * 0.75), y: -pt2.dirY * Math.max(30, dist34 * 0.75) };
        for (let k = 1; k <= 3; k++) {
          tan[k] = { x: (pts[k + 1].x - pts[k - 1].x) * 0.5, y: (pts[k + 1].y - pts[k - 1].y) * 0.5 };
        }
        let res = 'M ' + pts[0].x + ' ' + pts[0].y;
        for (let k = 0; k < 4; k++) {
          const cp1x = Math.round(pts[k].x + tan[k].x / 3);
          const cp1y = Math.round(pts[k].y + tan[k].y / 3);
          const cp2x = Math.round(pts[k + 1].x - tan[k + 1].x / 3);
          const cp2y = Math.round(pts[k + 1].y - tan[k + 1].y / 3);
          res += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + pts[k + 1].x + ' ' + pts[k + 1].y;
        }
        return res;
      };

      const calculateExportAutoDetour = (pt1, pt2, fromId, toId) => {
        const dist = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
        const tension = Math.max(35, Math.min(dist * 0.45, 160));
        const cp1 = { x: pt1.x + pt1.dirX * tension, y: pt1.y + pt1.dirY * tension };
        const cp2 = { x: pt2.x + pt2.dirX * tension, y: pt2.y + pt2.dirY * tension };

        const cardHalfW = 114;
        const cardHalfH = 67;

        const obstacles = [];
        posMap.forEach((pos, nid) => {
          obstacles.push({
            id: nid,
            isFrom: nid === fromId,
            isTo: nid === toId,
            x: pos.x,
            y: pos.y,
            xMin: pos.x - cardHalfW,
            xMax: pos.x + cardHalfW,
            yMin: pos.y - cardHalfH,
            yMax: pos.y + cardHalfH,
            clearLeft: pos.x - (cardHalfW + 36),
            clearRight: pos.x + (cardHalfW + 36),
            clearTop: pos.y - (cardHalfH + 34),
            clearBottom: pos.y + (cardHalfH + 34)
          });
        });

        const evalBezier = (t) => {
          const mt = 1 - t;
          return {
            x: (mt ** 3) * pt1.x + 3 * (mt ** 2) * t * cp1.x + 3 * mt * (t ** 2) * cp2.x + (t ** 3) * pt2.x,
            y: (mt ** 3) * pt1.y + 3 * (mt ** 2) * t * cp1.y + 3 * mt * (t ** 2) * cp2.y + (t ** 3) * pt2.y
          };
        };

        const hitObstacles = [];
        for (let i = 1; i <= 24; i++) {
          const t = i / 25;
          const pt = evalBezier(t);
          for (let j = 0; j < obstacles.length; j++) {
            const obs = obstacles[j];
            if (obs.isFrom) {
              if (t >= 0.14 && pt.x >= obs.xMin && pt.x <= obs.xMax && pt.y >= obs.yMin && pt.y <= obs.yMax) {
                if (!hitObstacles.includes(obs)) hitObstacles.push(obs);
              }
            } else if (obs.isTo) {
              if (t <= 0.86 && pt.x >= obs.xMin && pt.x <= obs.xMax && pt.y >= obs.yMin && pt.y <= obs.yMax) {
                if (!hitObstacles.includes(obs)) hitObstacles.push(obs);
              }
            } else {
              if (pt.x >= obs.xMin && pt.x <= obs.xMax && pt.y >= obs.yMin && pt.y <= obs.yMax) {
                if (!hitObstacles.includes(obs)) hitObstacles.push(obs);
              }
            }
          }
        }

        if (hitObstacles.length === 0) return null;

        const dx = pt2.x - pt1.x;
        const dy = pt2.y - pt1.y;

        if (Math.abs(dx) >= Math.abs(dy)) {
          const avgObsY = hitObstacles.reduce((sum, o) => sum + o.y, 0) / hitObstacles.length;
          let preferTop = (pt1.port === 'top' || pt2.port === 'top' || (pt1.y + pt2.y) / 2 <= avgObsY);
          if (pt1.port === 'bottom' || pt2.port === 'bottom') preferTop = false;

          const minTop = Math.min(...hitObstacles.map(o => o.clearTop));
          const maxBottom = Math.max(...hitObstacles.map(o => o.clearBottom));

          let detourY;
          if (preferTop && minTop > 65) {
            detourY = Math.min(minTop, Math.min(pt1.y, pt2.y) - 30);
            detourY = Math.max(50, detourY);
          } else {
            detourY = Math.max(maxBottom, Math.max(pt1.y, pt2.y) + 30);
            detourY = Math.min(baseHeight - 50, detourY);
          }

          const stepX1 = pt1.dirX !== 0 ? (pt1.x + pt1.dirX * 55) : (pt1.x + dx * 0.25);
          const stepX3 = pt2.dirX !== 0 ? (pt2.x + pt2.dirX * 55) : (pt2.x - dx * 0.25);

          return [
            { x: Math.round(Math.max(45, Math.min(baseWidth - 45, stepX1))), y: Math.round(pt1.y + (detourY - pt1.y) * 0.7) },
            { x: Math.round(Math.max(45, Math.min(baseWidth - 45, (pt1.x + pt2.x) / 2))), y: Math.round(detourY) },
            { x: Math.round(Math.max(45, Math.min(baseWidth - 45, stepX3))), y: Math.round(pt2.y + (detourY - pt2.y) * 0.7) }
          ];
        } else {
          const avgObsX = hitObstacles.reduce((sum, o) => sum + o.x, 0) / hitObstacles.length;
          let preferLeft = (pt1.port === 'left' || pt2.port === 'left' || (pt1.x + pt2.x) / 2 <= avgObsX);
          if (pt1.port === 'right' || pt2.port === 'right') preferLeft = false;

          const minLeft = Math.min(...hitObstacles.map(o => o.clearLeft));
          const maxRight = Math.max(...hitObstacles.map(o => o.clearRight));

          let detourX;
          if (preferLeft && minLeft > 65) {
            detourX = Math.min(minLeft, Math.min(pt1.x, pt2.x) - 30);
            detourX = Math.max(50, detourX);
          } else {
            detourX = Math.max(maxRight, Math.max(pt1.x, pt2.x) + 30);
            detourX = Math.min(baseWidth - 50, detourX);
          }

          const stepY1 = pt1.dirY !== 0 ? (pt1.y + pt1.dirY * 55) : (pt1.y + dy * 0.25);
          const stepY3 = pt2.dirY !== 0 ? (pt2.y + pt2.dirY * 55) : (pt2.y - dy * 0.25);

          return [
            { x: Math.round(pt1.x + (detourX - pt1.x) * 0.7), y: Math.round(Math.max(45, Math.min(baseHeight - 45, stepY1))) },
            { x: Math.round(detourX), y: Math.round(Math.max(45, Math.min(baseHeight - 45, (pt1.y + pt2.y) / 2))) },
            { x: Math.round(pt2.x + (detourX - pt2.x) * 0.7), y: Math.round(Math.max(45, Math.min(baseHeight - 45, stepY3))) }
          ];
        }
      };

      const activeConns = Array.isArray(flowData.connections) ? flowData.connections : [];
      if (activeConns.length > 0) {
        activeConns.forEach(conn => {
          const p1 = posMap.get(conn.from);
          const p2 = posMap.get(conn.to);
          if (!p1 || !p2) return;

          let fPort = conn.fromPort;
          let tPort = conn.toPort;
          if (!fPort || !tPort) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            if (Math.abs(dy) > Math.abs(dx) * 1.2) {
              fPort = fPort || (dy >= 0 ? 'bottom' : 'top');
              tPort = tPort || (dy >= 0 ? 'top' : 'bottom');
            } else {
              fPort = fPort || (dx >= 0 ? 'right' : 'left');
              tPort = tPort || (dx >= 0 ? 'left' : 'right');
            }
          }

          const pt1 = getExportPortCoords(p1, fPort);
          const pt2 = getExportPortCoords(p2, tPort);

          let d;
          if (conn.mode === 'manual' && Array.isArray(conn.points) && conn.points.length === 3) {
            d = generateExportSpline(pt1, pt2, conn.points);
          } else {
            const detour = calculateExportAutoDetour(pt1, pt2, conn.from, conn.to);
            if (detour) {
              d = generateExportSpline(pt1, pt2, detour);
            } else if (Array.isArray(conn.points) && conn.points.length === 3) {
              d = generateExportSpline(pt1, pt2, conn.points);
            } else {
              const dist = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
              const tension = Math.max(35, Math.min(dist * 0.45, 160));
              const cp1x = pt1.x + pt1.dirX * tension;
              const cp1y = pt1.y + pt1.dirY * tension;
              const cp2x = pt2.x + pt2.dirX * tension;
              const cp2y = pt2.y + pt2.dirY * tension;
              d = 'M ' + pt1.x + ' ' + pt1.y + ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + pt2.x + ' ' + pt2.y;
            }
          }

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', '#00A350');
          path.setAttribute('stroke-width', '3');
          path.setAttribute('class', 'zoom-flow-connector');
          svg.appendChild(path);
        });
      } else {
        for (let i = 1; i < total; i++) {
          const p1 = positions[i - 1], p2 = positions[i];
          const x1 = p1.x + 112, y1 = p1.y, x2 = p2.x - 112, y2 = p2.y;
          const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
          const d = 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', '#00A350');
          path.setAttribute('stroke-width', '3');
          path.setAttribute('class', 'zoom-flow-connector');
          svg.appendChild(path);
        }
      }
      zoomStage.appendChild(svg);

      const nodeEls = [];
      nodes.forEach((node, idx) => {
        const pos = positions[idx];
        const nEl = document.createElement('div');
        nEl.className = 'zoom-flow-node';
        nEl.style.left = pos.x + 'px';
        nEl.style.top = pos.y + 'px';
        nEl.style.setProperty('--node-color', node.color || '#00A350');

        nEl.innerHTML = '<div class="zoom-flow-node-card"><div class="zoom-flow-node-header"><span class="zoom-flow-node-badge">' + (node.status || ('Stage ' + (idx + 1))) + '</span></div><h4 class="zoom-flow-node-title">' + node.title + '</h4><p class="zoom-flow-node-sub">' + (node.subtitle || '') + '</p>' + (node.metricVal ? ('<div class="zoom-flow-node-mini-metric"><span class="val">' + node.metricVal + '</span><span class="lbl">' + (node.metricLbl || '') + '</span></div>') : '') + '<div class="zoom-detail-popout">' + (node.metricVal ? ('<div class="zoom-detail-metric-badge"><div><div class="zoom-detail-metric-val">' + node.metricVal + '</div><div class="zoom-detail-metric-lbl">' + (node.metricLbl || 'Key Metric') + '</div></div></div>') : '') + '<p class="zoom-detail-summary">' + (node.summary || '') + '</p>' + (node.bullets && node.bullets.length ? ('<ul class="zoom-detail-bullets">' + node.bullets.map(b => '<li>' + b + '</li>').join('') + '</ul>') : '') + '<button class="zf-node-jump-btn" data-index="' + idx + '" title="Open this node\'s full slide"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Slide</button></div></div>';

        zoomStage.appendChild(nEl);
        nodeEls.push(nEl);
      });

      flowWrap.appendChild(zoomStage);

      function navigateToSlideIndex(nodeIdx) {
        const targetNode = nodes[nodeIdx];
        if (!targetNode) return;
        let targetIdx = DATA.slides.findIndex(s => s.parentFlowSlideId === slide.id && s.flowNodeId === targetNode.id);
        if (targetIdx === -1) targetIdx = DATA.slides.findIndex(s => s.isFlowChild && s.flowNodeId === targetNode.id);
        if (targetIdx === -1) targetIdx = DATA.slides.findIndex(s => s.isFlowChild && s.flowNodeIndex === nodeIdx);
        if (targetIdx !== -1) {
          currentZoomController.zoomToNodeFullscreen(nodeIdx, function() {
            renderSlide(targetIdx);
          });
        } else {
          currentZoomController.zoomToNodeFullscreen(nodeIdx);
        }
      }

      // On-Slide Dropdown Menu to navigate to any slide from the main flow slide
      if (nodes.length > 0) {
        const ddWrap = document.createElement('div');
        ddWrap.className = 'zf-slide-dropdown-container';
        ddWrap.innerHTML = '<button class="zf-slide-dropdown-trigger"><i class="fa-solid fa-layer-group" style="color:#7fc23f;"></i> <span class="zf-dropdown-label">Slides (' + nodes.length + ')</span> <span class="zf-dropdown-badge">Regular Content</span> <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:2px;"></i></button><div class="zf-slide-dropdown-menu is-hidden"><div class="zf-dropdown-header"><i class="fa-solid fa-diagram-project"></i> <span>Jump to Node Slide</span></div>' + nodes.map((n, i) => '<button class="zf-dropdown-item" data-index="' + i + '"><div class="zf-dropdown-item-dot" style="background:' + (n.color || '#00A350') + ';"></div><div class="zf-dropdown-item-text"><div class="zf-dropdown-item-title">' + n.title + '</div><div class="zf-dropdown-item-sub">' + (n.subtitle || n.status || '') + '</div></div><i class="fa-solid fa-arrow-right zf-dropdown-item-arrow"></i></button>').join('') + '</div>';

        const ddTrig = ddWrap.querySelector('.zf-slide-dropdown-trigger');
        const ddMenu = ddWrap.querySelector('.zf-slide-dropdown-menu');
        ddTrig.addEventListener('click', (e) => {
          e.stopPropagation();
          ddMenu.classList.toggle('is-hidden');
        });
        document.addEventListener('click', () => ddMenu.classList.add('is-hidden'));
        ddMenu.querySelectorAll('.zf-dropdown-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            ddMenu.classList.add('is-hidden');
            const idx = parseInt(item.getAttribute('data-index'), 10);
            navigateToSlideIndex(idx);
          });
        });
        flowWrap.appendChild(ddWrap);
      }

      elementsLayer.appendChild(flowWrap);

      currentZoomController = {
        activeNodeIndex: -1,
        setSlideOverlayState(hasOverlay) {
          zoomStage.classList.toggle('has-slide-overlay', !!hasOverlay);
        },
        zoomToOverview(onComplete) {
          this.activeNodeIndex = -1;
          this.setSlideOverlayState(false);
          zoomStage.classList.add('is-zooming-out');
          zoomStage.classList.remove('is-zooming-fullscreen');
          zoomStage.style.transform = 'translate(0px, 0px) scale(1)';
          setTimeout(() => {
            zoomStage.classList.remove('is-zoomed-in', 'is-zooming-out');
            nodeEls.forEach(el => el.classList.remove('is-active-node', 'is-fullscreen-node'));
            if (onComplete) onComplete();
          }, 480);
        },
        zoomToNode(i) {
          if (i < 0 || i >= nodes.length) { this.zoomToOverview(); return; }
          this.activeNodeIndex = i;
          const pos = positions[i];
          const zoomScale = 2.25;
          const tx = (baseWidth / 2) - (pos.x * zoomScale);
          const ty = (baseHeight / 2) - ((pos.y - 45) * zoomScale);
          zoomStage.classList.remove('is-zooming-out');
          zoomStage.classList.add('is-zoomed-in');
          nodeEls.forEach((el, idx) => el.classList.toggle('is-active-node', idx === i));
          zoomStage.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + zoomScale + ')';
        },
        zoomToNodeFullscreen(i, onComplete) {
          if (i < 0 || i >= nodes.length) { this.zoomToOverview(onComplete); return; }
          this.activeNodeIndex = i;
          const pos = positions[i];
          const zoomScale = Math.max(baseWidth / 220, baseHeight / 190, 4.8);
          const tx = (baseWidth / 2) - (pos.x * zoomScale);
          const ty = (baseHeight / 2) - (pos.y * zoomScale);
          this.setSlideOverlayState(false);
          zoomStage.classList.remove('is-zooming-out');
          zoomStage.classList.add('is-zoomed-in', 'is-zooming-fullscreen');
          nodeEls.forEach((el, idx) => {
            el.classList.toggle('is-active-node', idx === i);
            el.classList.toggle('is-fullscreen-node', idx === i);
          });
          zoomStage.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + zoomScale + ')';
          setTimeout(() => {
            this.setSlideOverlayState(true);
          }, 360);
          if (onComplete) setTimeout(onComplete, 480);
        },
        transitionSlideChange(fromIdx, toIdx, onComplete) {
          if (toIdx === -1) {
            this.zoomToOverview(onComplete);
            return;
          }
          if (fromIdx === -1 || fromIdx === toIdx) {
            this.zoomToNodeFullscreen(toIdx, onComplete);
            return;
          }
          this.zoomToOverview(() => {
            setTimeout(() => {
              this.zoomToNodeFullscreen(toIdx, onComplete);
            }, 120);
          });
        },
        stepNext() {
          if (this.activeNodeIndex < nodes.length - 1) { this.zoomToNode(this.activeNodeIndex + 1); return true; }
          return false;
        },
        stepPrev() {
          if (this.activeNodeIndex > 0) { this.zoomToNode(this.activeNodeIndex - 1); return true; }
          else if (this.activeNodeIndex === 0) { this.zoomToOverview(); return true; }
          return false;
        }
      };

      nodeEls.forEach((el, idx) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          navigateToSlideIndex(idx);
        });

        el.querySelector('.zf-node-jump-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          navigateToSlideIndex(idx);
        });
      });

      flowWrap.addEventListener('click', (e) => {
        if (e.target.closest('.zf-slide-dropdown-container') || e.target.closest('.zoom-flow-node')) return;
        currentZoomController.zoomToOverview();
      });
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
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (!e.shiftKey && currentZoomController && currentZoomController.stepNext()) return;
        nextSlide();
      }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (!e.shiftKey && currentZoomController && currentZoomController.stepPrev()) return;
        prevSlide();
      }
      else if (e.key === 'o' || e.key === 'O') {
        if (currentZoomController) { e.preventDefault(); currentZoomController.zoomToOverview(); }
      }
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
