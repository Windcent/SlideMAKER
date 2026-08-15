/**
 * SlideMAKER - Configuration & Constants
 * Guides & Brand Colors inspired by Université de Sherbrooke (UdeS) Template
 */

const CONFIG = {
  appName: 'SlideMAKER',
  version: '2.0.0',

  // Official & Harmonious UdeS Brand Color Palette extracted from template_background.pdf
  colors: {
    udesGreen: '#00A350',      // Primary UdeS Green
    udesForest: '#087E5B',     // Forest Green
    udesLime: '#7FC23F',       // Energetic Lime Green
    udesSlate: '#306A5B',      // Slate Green
    udesDark: '#0D382A',       // Deep Dark Green
    udesBlack: '#0F172A',      // Charcoal Black
    udesWhite: '#FFFFFF',      // Pure White
    udesGrayLight: '#F1F5F9',  // Very Light Gray
    udesGray: '#94A3B8',       // Medium Gray
    udesGrayDark: '#334155',   // Dark Gray
    accentGold: '#F59E0B',     // Golden Amber
    accentTeal: '#06B6D4',     // Modern Cyan
    accentPurple: '#8B5CF6',   // Soft Violet
    accentCoral: '#F43F5E'      // Vivid Coral
  },

  // Color Swatches for Quick Color Pickers
  colorPalette: [
    '#00A350', '#087E5B', '#7FC23F', '#306A5B', '#0D382A',
    '#0F172A', '#1E293B', '#334155', '#64748B', '#94A3B8', '#CBD5E1', '#F1F5F9', '#FFFFFF',
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
  ],

  // Gradient Presets matching UdeS design aesthetics
  gradientPresets: [
    { name: 'UdeS Green Gradient', value: 'linear-gradient(135deg, #00A350 0%, #087E5B 100%)' },
    { name: 'Lime & Emerald', value: 'linear-gradient(135deg, #7FC23F 0%, #00A350 100%)' },
    { name: 'Dark & Forest', value: 'linear-gradient(135deg, #0F172A 0%, #087E5B 100%)' },
    { name: 'Slate & Emerald', value: 'linear-gradient(135deg, #306A5B 0%, #0D382A 100%)' },
    { name: 'Subtle Dawn', value: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' },
    { name: 'UdeS Light Mist', value: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' },
    { name: 'Elegant Night', value: 'linear-gradient(135deg, #0F172A 0%, #020617 100%)' }
  ],

  // Available Backgrounds (4K Ultra-HD 16:9 widescreen PNG templates)
  pdfBackgrounds: [
    {
      id: 'template_a',
      pageNumber: 1,
      image: 'assets/backgrounds/template_a.png',
      thumbnail: 'assets/thumbnails/thumb_template_a.jpg',
      aspectRatio: 1.7778
    },
    {
      id: 'template_b',
      pageNumber: 2,
      image: 'assets/backgrounds/template_b.png',
      thumbnail: 'assets/thumbnails/thumb_template_b.jpg',
      aspectRatio: 1.7778
    },
    {
      id: 'template_c',
      pageNumber: 3,
      image: 'assets/backgrounds/template_c.png',
      thumbnail: 'assets/thumbnails/thumb_template_c.jpg',
      aspectRatio: 1.7778
    },
    {
      id: 'template_d',
      pageNumber: 4,
      image: 'assets/backgrounds/template_d.png',
      thumbnail: 'assets/thumbnails/thumb_template_d.jpg',
      aspectRatio: 1.7778
    },
    {
      id: 'template_e',
      pageNumber: 5,
      image: 'assets/backgrounds/template_e.png',
      thumbnail: 'assets/thumbnails/thumb_template_e.jpg',
      aspectRatio: 1.7778
    },
    {
      id: 'template_f',
      pageNumber: 6,
      image: 'assets/backgrounds/template_f.png',
      thumbnail: 'assets/thumbnails/thumb_template_f.jpg',
      aspectRatio: 1.7778
    }
  ],

  // Official Logos
  logos: [
    { name: 'UdeS Official (Color/Dark)', src: 'assets/logo_uds_b.png' },
    { name: 'UdeS Emblem (Vector/AVIF)', src: 'assets/logo_uds_a.avif' }
  ],

  // Available Typography
  fonts: [
    { name: 'Outfit', family: "'Outfit', sans-serif", category: 'Modern / Titles' },
    { name: 'Inter', family: "'Inter', sans-serif", category: 'Body & Neutral' },
    { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Geometric' },
    { name: 'Roboto', family: "'Roboto', sans-serif", category: 'Standard' },
    { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Elegant / Serif' },
    { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'Code / Technical' }
  ],

  // Standard Canvas Dimensions (16:9 Widescreen by default matching Google Slides)
  aspectRatios: {
    '16_9': { name: '16:9 Widescreen (1280×720)', width: 1280, height: 720, ratio: 1.777778 },
    'a4_landscape': { name: 'A4 Landscape (PDF Template 842×595)', width: 1190, height: 842, ratio: 1.4133 },
    '4_3': { name: '4:3 Standard (1024×768)', width: 1024, height: 768, ratio: 1.333333 }
  },

  defaultAspectRatio: '16_9',

  // Available Vector Shapes
  shapes: [
    { id: 'rect', name: 'Rectangle', icon: 'fa-square' },
    { id: 'rounded-rect', name: 'Rounded Rectangle', icon: 'fa-square', radius: 16 },
    { id: 'pill', name: 'Pill / Badge', icon: 'fa-capsules', radius: 999 },
    { id: 'circle', name: 'Circle', icon: 'fa-circle' },
    { id: 'triangle', name: 'Triangle', icon: 'fa-play fa-rotate-270' },
    { id: 'diamond', name: 'Diamond', icon: 'fa-diamond' },
    { id: 'star', name: 'Star', icon: 'fa-star' },
    { id: 'arrow-right', name: 'Right Arrow', icon: 'fa-arrow-right' },
    { id: 'arrow-left', name: 'Left Arrow', icon: 'fa-arrow-left' },
    { id: 'callout', name: 'Speech Bubble', icon: 'fa-comment' },
    { id: 'hexagon', name: 'Hexagon', icon: 'fa-cube' }
  ],

  // Pre-configured Curated Icons (FontAwesome)
  popularIcons: [
    'fa-lightbulb', 'fa-chart-line', 'fa-graduation-cap', 'fa-brain',
    'fa-rocket', 'fa-check-circle', 'fa-award', 'fa-bullseye',
    'fa-book-open', 'fa-microscope', 'fa-atom', 'fa-globe',
    'fa-user-graduate', 'fa-calendar-alt', 'fa-laptop-code', 'fa-shield-halved',
    'fa-folder-open', 'fa-comments', 'fa-quote-left', 'fa-arrow-trend-up'
  ]
};

// Export to global scope
window.CONFIG = CONFIG;
