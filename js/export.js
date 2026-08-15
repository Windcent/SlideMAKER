/**
 * SlideMAKER - Export & Persistence Suite
 * Primary Target: Self-contained, standalone interactive HTML presentation file.
 * Secondary: Project JSON save/load, PNG snapshot, and Print/PDF.
 */

window.SlideExport = {
  // Export Presentation as a Standalone Interactive HTML File
  exportToHtml() {
    const pres = window.SlideApp.presentation;
    const title = pres.title || "Presentation_UdeS_Genie";
    const faculty = pres.master.faculty || "Faculté de génie";
    const slidesData = pres.slides;

    // Generate embedded slides HTML
    const slidesHtml = slidesData.map((slide, idx) => {
      const layoutDef = window.SlideTemplates.getLayout(slide.layoutId);
      const isDarkBg = slide.layoutId === "layout-2" || slide.layoutId === "layout-3";
      const showLogo = pres.master.showLogo !== false;
      const elementsHtml = slide.elements.map(el => window.SlideElements.renderElement(el, false)).join("");

      return `
        <div class="deck-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}" data-layout="${slide.layoutId}">
          <div class="slide-canvas slide-${slide.layoutId}">
            <div class="layout-bg-graphic">
              ${layoutDef.getBackgroundSvg(pres.master)}
            </div>
            ${pres.master.showFaculty ? `<div class="slide-master-faculty">${faculty}</div>` : ''}
            ${showLogo ? `<div class="slide-master-logo">${window.SlideTemplates.getLogoSvg(isDarkBg)}</div>` : ''}
            <div class="slide-elements-layer">
              ${elementsHtml}
            </div>
          </div>
        </div>
      `;
    }).join("\n");

    const notesJson = JSON.stringify(slidesData.map(s => s.notes || ""));

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${faculty}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --uds-green-primary: #007A3D;
      --uds-green-emerald: #009639;
      --uds-green-dark: #004B28;
      --uds-green-light: #82C341;
      --uds-green-lime: #A2D45E;
      --uds-purple-accent: #6B3F75;
      --uds-charcoal: #222222;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: 'Outfit', 'Inter', sans-serif;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    #deck-viewport {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .deck-scaler {
      width: 1920px;
      height: 1080px;
      position: relative;
      background-color: #ffffff;
      transform-origin: center center;
      box-shadow: 0 0 50px rgba(0,0,0,0.8);
      overflow: hidden;
    }
    .deck-slide {
      position: absolute;
      top: 0; left: 0;
      width: 1920px; height: 1080px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out;
    }
    .deck-slide.active {
      opacity: 1;
      pointer-events: auto;
    }
    .slide-canvas {
      width: 1920px; height: 1080px;
      position: absolute; top: 0; left: 0;
      background-color: #ffffff;
      overflow: hidden;
    }
    .slide-master-faculty {
      position: absolute; top: 48px; right: 80px;
      font-family: 'Outfit', 'Inter', sans-serif;
      font-size: 26px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px;
      color: #007A3D; z-index: 10;
    }
    .slide-layout-2 .slide-master-faculty, .slide-layout-3 .slide-master-faculty { color: #ffffff; }
    .slide-layout-5 .slide-master-faculty, .slide-layout-6 .slide-master-faculty { color: #ffffff; top: 36px; right: 80px; font-size: 24px; }
    .slide-layout-4 .slide-master-faculty { top: auto; bottom: 48px; left: 80px; right: auto; font-size: 22px; }
    .slide-master-logo {
      position: absolute; bottom: 45px; right: 80px;
      width: 220px; height: auto; z-index: 10;
    }
    .slide-master-logo svg { width: 100%; height: auto; display: block; }
    .layout-bg-graphic {
      position: absolute; top: 0; left: 0;
      width: 1920px; height: 1080px; pointer-events: none; z-index: 1;
    }
    .slide-elements-layer {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%; z-index: 5;
    }
    .slide-element {
      position: absolute; box-sizing: border-box;
    }
    .element-text-content {
      width: 100%; height: 100%; word-break: break-word; white-space: pre-wrap;
    }
    .uds-bullet-list { list-style: none; padding-left: 0; margin: 0; }
    .uds-bullet-list > li { position: relative; padding-left: 36px; margin-bottom: 24px; line-height: 1.4; }
    .uds-bullet-list > li::before { content: "•"; position: absolute; left: 8px; top: -2px; color: #009639; font-size: 1.3em; font-weight: bold; }
    .uds-bullet-list > li.level-2 { padding-left: 72px; font-size: 0.88em; opacity: 0.9; margin-bottom: 16px; }
    .uds-bullet-list > li.level-2::before { content: "–"; left: 44px; color: #82C341; }
    .element-image-wrapper { width: 100%; height: 100%; position: relative; overflow: hidden; }
    .element-image-content { width: 100%; height: 100%; object-fit: cover; display: block; }
    .element-shape-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .element-table-content { width: 100%; height: 100%; border-collapse: collapse; }
    .element-table-content th, .element-table-content td { border: 2px solid #e2e8f0; padding: 12px 18px; text-align: left; }
    .element-table-content th { background-color: #007A3D; color: #ffffff; font-weight: 700; }
    .element-table-content tr:nth-child(even) td { background-color: #f8fafc; }
    .element-chart-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .element-icon-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #007A3D; }
    .element-icon-content svg { width: 100%; height: 100%; display: block; }
    .element-code-content { width: 100%; height: 100%; background-color: #1e222b; color: #f8f8f2; font-family: 'Fira Code', monospace; padding: 24px; border-radius: 12px; }

    /* Laser Pointer */
    #laser-dot {
      position: fixed; width: 18px; height: 18px; border-radius: 50%;
      background: radial-gradient(circle, #ff3366 0%, rgba(255, 51, 102, 0.8) 50%, rgba(255, 51, 102, 0) 100%);
      box-shadow: 0 0 14px #ff3366, 0 0 28px #ff3366;
      pointer-events: none; z-index: 9999; display: none;
      transform: translate(-50%, -50%); mix-blend-mode: screen;
    }

    /* Floating Navigation Controls */
    #deck-hud {
      position: fixed; bottom: 24px; left: 50%;
      transform: translateX(-50%);
      background-color: rgba(23, 26, 33, 0.88);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      padding: 6px 18px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 5000;
      transition: opacity 0.3s ease;
    }
    .hud-btn {
      background: transparent; border: none; color: #d8dee9;
      font-size: 16px; width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s ease;
    }
    .hud-btn:hover { background-color: rgba(255, 255, 255, 0.15); color: #ffffff; transform: scale(1.08); }
    .hud-btn.active { background-color: #009639; color: #ffffff; }
    .hud-counter { font-size: 13px; font-weight: 600; color: #eceff4; min-width: 60px; text-align: center; }

    /* Speaker Notes Popup */
    #notes-modal {
      position: fixed; bottom: 85px; right: 30px; width: 380px; max-height: 300px;
      background: rgba(23, 26, 33, 0.95); backdrop-filter: blur(10px);
      border: 1px solid #333a48; border-radius: 12px; padding: 16px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.6); display: none; flex-direction: column;
      gap: 10px; z-index: 6000; font-size: 14px; line-height: 1.5; color: #eceff4;
    }
    #notes-modal.active { display: flex; }
    .notes-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #82C341; }
  </style>
</head>
<body>
  <div id="deck-viewport">
    <div class="deck-scaler" id="deck-scaler">
      ${slidesHtml}
    </div>
  </div>

  <div id="laser-dot"></div>

  <div id="notes-modal">
    <div class="notes-title"><i class="fa-solid fa-note-sticky"></i> Notes de l'orateur</div>
    <div id="notes-body"></div>
  </div>

  <div id="deck-hud">
    <button class="hud-btn" id="btn-prev" title="Précédent (Flèche gauche / Espace)"><i class="fa-solid fa-chevron-left"></i></button>
    <div class="hud-counter" id="deck-counter">1 / ${slidesData.length}</div>
    <button class="hud-btn" id="btn-next" title="Suivant (Flèche droite)"><i class="fa-solid fa-chevron-right"></i></button>
    <div style="width:1px; height:20px; background:rgba(255,255,255,0.2);"></div>
    <button class="hud-btn" id="btn-laser" title="Pointeur Laser (L)"><i class="fa-solid fa-bullseye"></i></button>
    <button class="hud-btn" id="btn-notes" title="Notes (N)"><i class="fa-regular fa-comment-dots"></i></button>
    <button class="hud-btn" id="btn-fullscreen" title="Plein écran (F)"><i class="fa-solid fa-expand"></i></button>
  </div>

  <script>
    (function() {
      const slides = document.querySelectorAll('.deck-slide');
      const scaler = document.getElementById('deck-scaler');
      const counter = document.getElementById('deck-counter');
      const laserDot = document.getElementById('laser-dot');
      const notesModal = document.getElementById('notes-modal');
      const notesBody = document.getElementById('notes-body');
      const notesData = ${notesJson};

      let currentIndex = 0;
      let isLaser = false;
      const total = slides.length;

      function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.min(w / 1920, h / 1080);
        scaler.style.transform = 'scale(' + scale + ')';
      }
      window.addEventListener('resize', resize);
      resize();

      function updateSlide(idx) {
        if (idx < 0) idx = 0;
        if (idx >= total) idx = total - 1;
        currentIndex = idx;

        slides.forEach((s, i) => {
          s.classList.toggle('active', i === currentIndex);
        });
        counter.textContent = (currentIndex + 1) + ' / ' + total;
        if (notesBody) {
          notesBody.innerHTML = notesData[currentIndex] ? notesData[currentIndex].replace(/\\n/g, '<br>') : '<em style="color:#8892b0;">Aucune note</em>';
        }
      }

      function next() { updateSlide(currentIndex + 1); }
      function prev() { updateSlide(currentIndex - 1); }

      document.getElementById('btn-next').addEventListener('click', next);
      document.getElementById('btn-prev').addEventListener('click', prev);

      document.getElementById('btn-laser').addEventListener('click', function() {
        isLaser = !isLaser;
        this.classList.toggle('active', isLaser);
        laserDot.style.display = isLaser ? 'block' : 'none';
      });

      document.getElementById('btn-notes').addEventListener('click', function() {
        notesModal.classList.toggle('active');
        this.classList.toggle('active', notesModal.classList.contains('active'));
      });

      document.getElementById('btn-fullscreen').addEventListener('click', function() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });

      window.addEventListener('mousemove', function(e) {
        if (isLaser) {
          laserDot.style.left = e.clientX + 'px';
          laserDot.style.top = e.clientY + 'px';
        }
      });

      window.addEventListener('keydown', function(e) {
        if (['ArrowRight', 'Space', 'PageDown', 'ArrowDown'].includes(e.key)) {
          e.preventDefault(); next();
        } else if (['ArrowLeft', 'PageUp', 'ArrowUp'].includes(e.key)) {
          e.preventDefault(); prev();
        } else if (e.key === 'Home') {
          e.preventDefault(); updateSlide(0);
        } else if (e.key === 'End') {
          e.preventDefault(); updateSlide(total - 1);
        } else if (e.key.toLowerCase() === 'f') {
          document.getElementById('btn-fullscreen').click();
        } else if (e.key.toLowerCase() === 'l') {
          document.getElementById('btn-laser').click();
        } else if (e.key.toLowerCase() === 'n') {
          document.getElementById('btn-notes').click();
        }
      });

      updateSlide(0);
    })();
  </script>
</body>
</html>`;

    this.downloadFile(`${title}.html`, htmlContent, "text/html");
    window.SlideApp.showToast("Présentation HTML exportée avec succès !", "success");
  },

  // Save Presentation to JSON (.slidemaker file)
  exportToJson() {
    const pres = window.SlideApp.presentation;
    const title = pres.title || "Presentation_UdeS";
    const jsonStr = JSON.stringify(pres, null, 2);
    this.downloadFile(`${title}.slidemaker.json`, jsonStr, "application/json");
    window.SlideApp.showToast("Projet sauvegardé en fichier JSON !", "success");
  },

  // Load Presentation from JSON File
  importFromJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pres = JSON.parse(e.target.result);
        if (pres.slides && Array.isArray(pres.slides)) {
          window.SlideApp.presentation = pres;
          window.SlideApp.activeSlideIndex = 0;
          window.SlideApp.renderCurrentSlide();
          window.SlideApp.renderThumbnails();
          window.SlideApp.showToast("Projet importé avec succès !", "success");
        } else {
          window.SlideApp.showToast("Fichier JSON invalide.", "error");
        }
      } catch (err) {
        window.SlideApp.showToast("Erreur lors de la lecture du fichier.", "error");
      }
    };
    reader.readAsText(file);
  },

  // Helper: Trigger Browser Download
  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
