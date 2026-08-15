/**
 * SlideMAKER - Element Factory & Rendering Components
 * Generates and renders Text, Bullets, Images, Shapes, Tables, Charts, Icons, and Code.
 */

window.SlideElements = {
  // Generate unique element IDs
  generateId(prefix = "el") {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  },

  // Icon Library (Curated Vector SVGs for Academic & Engineering Decks)
  iconLibrary: [
    { id: "gear", name: "Génie / Mécanique", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' },
    { id: "cpu", name: "Informatique / Puce", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>' },
    { id: "zap", name: "Énergie / Électrique", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' },
    { id: "globe", name: "Environnement / Réseau", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' },
    { id: "bar-chart", name: "Statistiques", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
    { id: "award", name: "Distinction / Qualité", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>' },
    { id: "flask", name: "Recherche / Labo", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.62 19.3A2 2 0 0 0 6.38 22h11.24a2 2 0 0 0 1.76-2.7L14 9.31V2"></path><line x1="8" y1="2" x2="16" y2="2"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>' },
    { id: "check-circle", name: "Validation", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' },
    { id: "shield", name: "Sécurité / Robustesse", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
    { id: "target", name: "Objectif / Cible", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>' },
    { id: "trending-up", name: "Croissance / Gain", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>' },
    { id: "users", name: "Équipe / Partenaires", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' }
  ],

  // Create Element Templates
  createText(text = "Texte à modifier", x = 200, y = 200, width = 600, height = 120, fontSize = "32px") {
    return {
      id: this.generateId("txt"),
      type: "text",
      x, y, width, height,
      content: text,
      style: {
        fontSize,
        fontWeight: "400",
        color: "#222222",
        textAlign: "left",
        fontFamily: "Inter, sans-serif",
        lineHeight: "1.4"
      }
    };
  },

  createBullets(items = ["Premier point", "Deuxième point avec détails", "Troisième point"], x = 200, y = 250, width = 800, height = 400) {
    return {
      id: this.generateId("blt"),
      type: "bullets",
      x, y, width, height,
      items: items.map((text, i) => ({ text, level: i === 1 ? 2 : 1 })),
      style: {
        fontSize: "26px",
        color: "#222222",
        lineHeight: "1.5",
        fontFamily: "Inter, sans-serif"
      }
    };
  },

  createImage(src, x = 300, y = 200, width = 600, height = 400) {
    return {
      id: this.generateId("img"),
      type: "image",
      x, y, width, height,
      src,
      style: {
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
      }
    };
  },

  createShape(shapeType = "rect", x = 250, y = 250, width = 200, height = 200, color = "#009639") {
    return {
      id: this.generateId("shp"),
      type: "shape",
      shapeType,
      x, y, width, height,
      style: {
        backgroundColor: color,
        borderRadius: shapeType === "circle" ? "50%" : shapeType === "rounded" ? "16px" : "4px",
        opacity: "1"
      }
    };
  },

  createTable(rows = 3, cols = 3, x = 200, y = 250, width = 1000, height = 300) {
    const data = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(r === 0 ? `En-tête ${c + 1}` : `Valeur ${r}.${c + 1}`);
      }
      data.push(row);
    }
    return {
      id: this.generateId("tbl"),
      type: "table",
      x, y, width, height,
      data,
      style: {
        fontSize: "20px",
        fontFamily: "Inter, sans-serif"
      }
    };
  },

  createChart(chartType = "bar", x = 250, y = 250, width = 600, height = 400) {
    return {
      id: this.generateId("crt"),
      type: "chart",
      chartType,
      x, y, width, height,
      title: "Progression des données",
      labels: ["2023", "2024", "2025", "2026"],
      values: [45, 68, 85, 96],
      colors: ["#007A3D", "#009639", "#82C341", "#A2D45E"],
      style: {
        fontFamily: "Outfit, sans-serif"
      }
    };
  },

  createIcon(iconId = "gear", x = 300, y = 300, size = 120, color = "#007A3D") {
    return {
      id: this.generateId("icn"),
      type: "icon",
      iconId,
      x, y, width: size, height: size,
      color,
      style: {
        color
      }
    };
  },

  createCode(code = "// Algorithme d'optimisation génie UdeS\nfunction optimiserPerformance(donnees) {\n  return donnees.map(d => d * 1.248);\n}", x = 200, y = 250, width = 800, height = 320) {
    return {
      id: this.generateId("cod"),
      type: "code",
      x, y, width, height,
      content: code,
      style: {
        fontSize: "20px",
        fontFamily: "Fira Code, monospace"
      }
    };
  },

  // Render Element HTML inside slide
  renderElement(el, isEditable = true) {
    const styleObj = el.style || {};
    let contentHtml = "";

    switch (el.type) {
      case "text":
        contentHtml = `
          <div class="element-text-content" ${isEditable ? 'contenteditable="true"' : ''} 
               style="font-size:${styleObj.fontSize || '32px'}; font-weight:${styleObj.fontWeight || '400'}; color:${styleObj.color || '#222'}; text-align:${styleObj.textAlign || 'left'}; font-family:${styleObj.fontFamily || 'Inter, sans-serif'}; line-height:${styleObj.lineHeight || '1.35'}; opacity:${styleObj.opacity || '1'};">${el.content || ''}</div>
        `;
        break;

      case "bullets":
        const items = el.items || [{ text: "Point 1", level: 1 }];
        contentHtml = `
          <div class="element-text-content" style="font-size:${styleObj.fontSize || '26px'}; font-family:${styleObj.fontFamily || 'Inter, sans-serif'}; color:${styleObj.color || '#222'};">
            <ul class="uds-bullet-list">
              ${items.map((item, idx) => `
                <li class="level-${item.level || 1}" ${isEditable ? 'contenteditable="true"' : ''} data-bullet-idx="${idx}">${item.text}</li>
              `).join("")}
            </ul>
          </div>
        `;
        break;

      case "image":
        contentHtml = `
          <div class="element-image-wrapper" style="border-radius:${styleObj.borderRadius || '0px'}; box-shadow:${styleObj.boxShadow || 'none'};">
            <img src="${el.src}" class="element-image-content" alt="Slide image">
            ${isEditable ? '<div class="image-replace-overlay" title="Changer l\'image"><i class="fa-solid fa-camera"></i>&nbsp; Remplacer l\'image</div>' : ''}
          </div>
        `;
        break;

      case "shape":
        contentHtml = `
          <div class="element-shape-content" style="background-color:${styleObj.backgroundColor || '#009639'}; border-radius:${styleObj.borderRadius || '0px'}; opacity:${styleObj.opacity || '1'}; border:${styleObj.border || 'none'};"></div>
        `;
        break;

      case "table":
        const data = el.data || [["A", "B"], ["1", "2"]];
        contentHtml = `
          <table class="element-table-content" style="font-size:${styleObj.fontSize || '20px'}; font-family:${styleObj.fontFamily || 'Inter, sans-serif'};">
            <thead>
              <tr>
                ${(data[0] || []).map((cell, c) => `<th ${isEditable ? 'contenteditable="true"' : ''} data-row="0" data-col="${c}">${cell}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data.slice(1).map((row, r) => `
                <tr>
                  ${row.map((cell, c) => `<td ${isEditable ? 'contenteditable="true"' : ''} data-row="${r+1}" data-col="${c}">${cell}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        break;

      case "chart":
        const labels = el.labels || ["A", "B", "C"];
        const values = el.values || [30, 60, 90];
        const colors = el.colors || ["#007A3D", "#009639", "#82C341"];
        const maxVal = Math.max(...values, 100);
        contentHtml = `
          <div class="element-chart-wrapper" style="font-family:${styleObj.fontFamily || 'Outfit, sans-serif'};">
            <div style="font-size:18px; font-weight:700; color:#004B28; margin-bottom:14px;">${el.title || 'Données'}</div>
            <div style="display:flex; align-items:flex-end; gap:24px; height:180px; width:100%; justify-content:center;">
              ${values.map((v, i) => `
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1;">
                  <span style="font-size:14px; font-weight:bold; color:#333;">${v}%</span>
                  <div style="width:100%; height:${(v / maxVal) * 140}px; background-color:${colors[i % colors.length]}; border-radius:4px 4px 0 0; min-height:8px;"></div>
                  <span style="font-size:13px; color:#666;">${labels[i]}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
        break;

      case "icon":
        const iconItem = this.iconLibrary.find(i => i.id === el.iconId) || this.iconLibrary[0];
        contentHtml = `
          <div class="element-icon-content" style="color:${el.color || styleObj.color || '#007A3D'};">
            ${iconItem.svg}
          </div>
        `;
        break;

      case "code":
        contentHtml = `
          <pre class="element-code-content" ${isEditable ? 'contenteditable="true"' : ''} style="font-size:${styleObj.fontSize || '20px'};">${el.content || ''}</pre>
        `;
        break;
    }

    // Handles for editor mode
    const handlesHtml = isEditable ? `
      <div class="resize-handle handle-nw" data-handle="nw"></div>
      <div class="resize-handle handle-n" data-handle="n"></div>
      <div class="resize-handle handle-ne" data-handle="ne"></div>
      <div class="resize-handle handle-e" data-handle="e"></div>
      <div class="resize-handle handle-se" data-handle="se"></div>
      <div class="resize-handle handle-s" data-handle="s"></div>
      <div class="resize-handle handle-sw" data-handle="sw"></div>
      <div class="resize-handle handle-w" data-handle="w"></div>
      <div class="rotate-line"></div>
      <div class="rotate-handle" data-handle="rotate"></div>
    ` : '';

    return `
      <div class="slide-element" id="${el.id}" data-id="${el.id}" data-type="${el.type}"
           style="left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px; transform: rotate(${el.rotation || 0}deg); z-index:${el.zIndex || 10};">
        ${contentHtml}
        ${handlesHtml}
      </div>
    `;
  }
};
