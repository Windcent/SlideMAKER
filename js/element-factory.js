/**
 * SlideMAKER - Element Factory
 * Creates structured element definitions for Text, Shapes, Images, Tables, Icons, Charts, and Lines
 */

const ElementFactory = {
  // 1. Text Elements
  createTitle(custom = {}) {
    return {
      type: 'text',
      textType: 'title',
      x: custom.x || 80,
      y: custom.y || 80,
      width: custom.width || 750,
      height: custom.height || 100,
      content: custom.content || 'Presentation Title',
      fontFamily: 'Outfit',
      fontSize: 44,
      fontWeight: '700',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: CONFIG.colors.udesDark,
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      backgroundColor: 'transparent',
      padding: 12,
      borderWidth: 0,
      borderColor: 'transparent',
      borderRadius: 0,
      shadow: 'none',
      opacity: 1
    };
  },

  createSubtitle(custom = {}) {
    return {
      type: 'text',
      textType: 'subtitle',
      x: custom.x || 80,
      y: custom.y || 190,
      width: custom.width || 650,
      height: custom.height || 60,
      content: custom.content || 'Explanatory subtitle or section name',
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: '500',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: CONFIG.colors.udesSlate,
      textAlign: 'left',
      lineHeight: 1.3,
      letterSpacing: 0,
      backgroundColor: 'transparent',
      padding: 8,
      borderWidth: 0,
      borderColor: 'transparent',
      borderRadius: 0,
      shadow: 'none',
      opacity: 1
    };
  },

  createText(custom = {}) {
    return {
      type: 'text',
      textType: 'body',
      x: custom.x || 80,
      y: custom.y || 260,
      width: custom.width || 600,
      height: custom.height || 160,
      content: custom.content || 'Type your content here. You can format text with bold, italic, customize fonts, sizes, and colors according to the brand guidelines.',
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: '400',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: CONFIG.colors.udesBlack,
      textAlign: 'left',
      lineHeight: 1.5,
      letterSpacing: 0,
      backgroundColor: 'transparent',
      padding: 10,
      borderWidth: 0,
      borderColor: 'transparent',
      borderRadius: 0,
      shadow: 'none',
      opacity: 1
    };
  },

  createBulletList(custom = {}) {
    return {
      type: 'text',
      textType: 'bullets',
      x: custom.x || 80,
      y: custom.y || 250,
      width: custom.width || 580,
      height: custom.height || 220,
      content: '<ul><li>First key takeaway or summary point</li><li>Second detailed argument and supporting rationale</li><li>Third strategic objective or conclusion</li></ul>',
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: '400',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: CONFIG.colors.udesBlack,
      textAlign: 'left',
      lineHeight: 1.6,
      letterSpacing: 0,
      backgroundColor: 'transparent',
      padding: 12,
      borderWidth: 0,
      borderColor: 'transparent',
      borderRadius: 0,
      shadow: 'none',
      opacity: 1
    };
  },

  // 2. Shape Elements
  createShape(shapeId = 'rect', custom = {}) {
    const defaultDimensions = {
      rect: { width: 240, height: 160 },
      'rounded-rect': { width: 240, height: 160, borderRadius: 16 },
      pill: { width: 200, height: 60, borderRadius: 999 },
      circle: { width: 160, height: 160, borderRadius: 999 },
      triangle: { width: 180, height: 160 },
      diamond: { width: 160, height: 160 },
      star: { width: 160, height: 160 },
      'arrow-right': { width: 220, height: 90 },
      'arrow-left': { width: 220, height: 90 },
      callout: { width: 240, height: 160 },
      hexagon: { width: 180, height: 180 }
    };

    const dims = defaultDimensions[shapeId] || { width: 200, height: 150 };

    return {
      type: 'shape',
      shapeId: shapeId,
      x: custom.x || 200,
      y: custom.y || 200,
      width: custom.width || dims.width,
      height: custom.height || dims.height,
      fillColor: custom.fillColor || CONFIG.colors.udesGreen,
      fillGradient: custom.fillGradient || null,
      strokeColor: custom.strokeColor || 'transparent',
      strokeWidth: custom.strokeWidth || 0,
      strokeDash: custom.strokeDash || 'solid', // solid, dashed, dotted
      borderRadius: custom.borderRadius !== undefined ? custom.borderRadius : (dims.borderRadius || 0),
      shadowColor: custom.shadowColor || 'rgba(0,0,0,0.12)',
      shadowBlur: custom.shadowBlur || 0,
      shadowOffsetX: 0,
      shadowOffsetY: custom.shadowBlur ? 4 : 0,
      opacity: custom.opacity !== undefined ? custom.opacity : 1
    };
  },

  // 3. Image Elements
  createImage(src, custom = {}) {
    return {
      type: 'image',
      src: src,
      x: custom.x || 150,
      y: custom.y || 150,
      width: custom.width || 380,
      height: custom.height || 260,
      aspectRatio: custom.aspectRatio || 1.46,
      objectFit: custom.objectFit || 'contain',
      borderRadius: custom.borderRadius || 8,
      borderWidth: custom.borderWidth || 0,
      borderColor: custom.borderColor || '#E2E8F0',
      shadowColor: custom.shadowColor || 'rgba(0,0,0,0.1)',
      shadowBlur: custom.shadowBlur || 8,
      shadowOffsetY: custom.shadowOffsetY || 4,
      shadowOffsetX: 0,
      opacity: custom.opacity !== undefined ? custom.opacity : 1,
      grayscale: custom.grayscale || 0,
      brightness: custom.brightness || 100,
      contrast: custom.contrast || 100
    };
  },

  // 4. Icon Elements (FontAwesome)
  createIcon(iconClass = 'fa-lightbulb', custom = {}) {
    return {
      type: 'icon',
      iconClass: iconClass.startsWith('fa-') ? `fa-solid ${iconClass}` : iconClass,
      x: custom.x || 200,
      y: custom.y || 200,
      width: custom.width || 90,
      height: custom.height || 90,
      iconColor: custom.iconColor || CONFIG.colors.udesGreen,
      backgroundColor: custom.backgroundColor || 'transparent',
      borderRadius: custom.borderRadius || 12,
      borderWidth: custom.borderWidth || 0,
      borderColor: 'transparent',
      shadowBlur: 0,
      opacity: 1
    };
  },

  // 5. Table Elements
  createTable(rows = 3, cols = 3, custom = {}) {
    const data = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          row.push(`Column ${c + 1}`);
        } else {
          row.push(`Data ${r}.${c + 1}`);
        }
      }
      data.push(row);
    }

    return {
      type: 'table',
      rows: rows,
      cols: cols,
      data: data,
      x: custom.x || 100,
      y: custom.y || 160,
      width: custom.width || 600,
      height: custom.height || 220,
      headerBg: CONFIG.colors.udesGreen,
      headerColor: '#FFFFFF',
      headerFontFamily: 'Outfit',
      headerFontSize: 16,
      bodyBg: '#FFFFFF',
      bodyColor: CONFIG.colors.udesBlack,
      bodyFontFamily: 'Inter',
      bodyFontSize: 14,
      alternateRowBg: '#F8FAFC',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: 8,
      shadowBlur: 6,
      opacity: 1
    };
  },

  // 6. Chart Elements
  createChart(chartType = 'bar', custom = {}) {
    return {
      type: 'chart',
      chartType: chartType, // 'bar', 'line', 'pie', 'doughnut'
      x: custom.x || 120,
      y: custom.y || 140,
      width: custom.width || 560,
      height: custom.height || 340,
      chartTitle: custom.chartTitle || 'Key Performance Indicators',
      labels: custom.labels || ['2023', '2024', '2025', '2026', '2027'],
      datasets: custom.datasets || [
        {
          label: 'UdeS Growth (%)',
          data: [42, 65, 82, 91, 98],
          backgroundColor: [
            CONFIG.colors.udesGreen,
            CONFIG.colors.udesForest,
            CONFIG.colors.udesLime,
            CONFIG.colors.udesSlate,
            CONFIG.colors.accentGold
          ],
          borderColor: CONFIG.colors.udesForest,
          borderWidth: 2
        }
      ],
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowBlur: 8,
      opacity: 1
    };
  },

  // 7. Line Elements
  createLine(custom = {}) {
    return {
      type: 'line',
      x: custom.x || 100,
      y: custom.y || 250,
      width: custom.width || 450,
      height: custom.height || 4,
      lineColor: custom.lineColor || CONFIG.colors.udesGreen,
      lineWidth: custom.lineWidth || 4,
      lineStyle: custom.lineStyle || 'solid',
      opacity: 1
    };
  },

  // 8. Self-Contained HTML Elements
  createHtmlElement(htmlContent = '', custom = {}) {
    return {
      type: 'html',
      x: custom.x || 80,
      y: custom.y || 80,
      width: custom.width || 800,
      height: custom.height || 480,
      htmlContent: htmlContent || '<div style="padding:24px;background:linear-gradient(135deg,#00A350 0%,#087E5B 100%);color:#ffffff;border-radius:12px;font-family:sans-serif;box-shadow:0 10px 25px rgba(0,0,0,0.2);">\n  <h2 style="margin:0 0 10px 0;font-size:24px;">Self-Contained HTML</h2>\n  <p style="margin:0;font-size:15px;opacity:0.95;">Interactive markup, inline CSS, SVG, or embedded widgets.</p>\n</div>',
      backgroundColor: custom.backgroundColor || 'transparent',
      borderRadius: custom.borderRadius || 8,
      borderWidth: custom.borderWidth || 0,
      borderColor: custom.borderColor || '#E2E8F0',
      shadowBlur: custom.shadowBlur || 8,
      opacity: custom.opacity !== undefined ? custom.opacity : 1
    };
  }
};

window.ElementFactory = ElementFactory;
