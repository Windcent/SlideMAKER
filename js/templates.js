/**
 * SlideMAKER - Template Engine & Layout Definitions
 * Faithfully recreated from Université de Sherbrooke template (template_uds.pdf)
 * Default Faculty: "Faculté de génie" (NOM DE L'UNITÉ removed)
 */

window.SlideTemplates = {
  // Global Master Variables
  masterDefaults: {
    faculty: "Faculté de génie",
    showFaculty: true,
    showLogo: true,
    themeColor: "#007A3D",
    accentColor: "#82C341"
  },

  // UdeS Logo SVG (Crisp vector for all screen resolutions)
  getLogoSvg(isWhite = false) {
    const textColor = isWhite ? "#ffffff" : "#004B28";
    const boxColor = isWhite ? "#ffffff" : "#007A3D";
    const textInBox = isWhite ? "#007A3D" : "#ffffff";
    return `
      <svg viewBox="0 0 220 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
        <rect x="2" y="2" width="102" height="48" rx="4" fill="${boxColor}"/>
        <text x="53" y="36" font-family="'Outfit', 'Inter', sans-serif" font-weight="900" font-size="34" fill="${textInBox}" text-anchor="middle" letter-spacing="1">UDS</text>
        <text x="114" y="24" font-family="'Outfit', 'Inter', sans-serif" font-weight="600" font-size="13" fill="${textColor}">Université de</text>
        <text x="114" y="42" font-family="'Outfit', 'Inter', sans-serif" font-weight="800" font-size="16" fill="${textColor}">Sherbrooke</text>
      </svg>
    `;
  },

  // Template Layout Definitions (1 to 6 from template_uds.pdf + 7 blank)
  layouts: [
    {
      id: "layout-1",
      name: "Titre / Couverture (UdeS)",
      description: "Page de titre avec courbes organiques vertes et violette",
      category: "Couverture",
      getBackgroundSvg(theme) {
        return `
          <svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <!-- Purple Accent Curve (Top Left) -->
            <path d="M 0 0 L 360 0 C 320 220 220 300 0 350 Z" fill="#6B3F75"/>
            <!-- Main Forest Green Organic Flow -->
            <path d="M 0 320 C 350 260 550 500 780 750 C 950 940 1250 1080 1600 1080 L 0 1080 Z" fill="#007A3D"/>
            <path d="M 360 0 C 600 0 900 200 950 550 C 1000 900 1300 1080 1920 1080 L 1920 0 Z" fill="#009639"/>
            <!-- Light Green Lime Secondary Flow -->
            <path d="M 1150 0 C 1050 300 1100 650 1450 920 C 1650 1050 1920 1080 1920 1080 L 1920 0 Z" fill="#82C341"/>
            <path d="M 1400 0 C 1300 200 1450 480 1700 680 C 1850 780 1920 800 1920 800 L 1920 0 Z" fill="#A2D45E"/>
          </svg>
        `;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-title",
            type: "text",
            x: 180,
            y: 380,
            width: 900,
            height: 180,
            content: "TITRE DU PROJET",
            style: {
              fontSize: "64px",
              fontWeight: "800",
              color: "#ffffff",
              textAlign: "left",
              lineHeight: "1.15",
              fontFamily: "Outfit, sans-serif"
            }
          },
          {
            id: "el-subtitle",
            type: "text",
            x: 180,
            y: 580,
            width: 800,
            height: 90,
            content: "Présentation de recherche appliquée et développement",
            style: {
              fontSize: "28px",
              fontWeight: "400",
              color: "#ffffff",
              textAlign: "left",
              opacity: "0.95",
              fontFamily: "Inter, sans-serif"
            }
          }
        ];
      }
    },
    {
      id: "layout-2",
      name: "Section Foncée (Univers en soi)",
      description: "Titre de section fond vert forêt avec bandeau horizontal",
      category: "Section",
      getBackgroundSvg(theme) {
        return `
          <svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <rect width="1920" height="1080" fill="#004B28"/>
            <!-- Univers en soi Watermark Pattern -->
            <g opacity="0.08" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="900" font-size="120" letter-spacing="4">
              <text x="960" y="240" text-anchor="middle">Univers en soi</text>
              <text x="960" y="420" text-anchor="middle">UNIVERS EN SOI</text>
              <text x="960" y="780" text-anchor="middle">Univers en soi</text>
              <text x="960" y="960" text-anchor="middle">UNIVERS EN SOI</text>
            </g>
            <!-- Center Horizontal Dark Stripe Band -->
            <rect x="0" y="480" width="1920" height="160" fill="#00381e"/>
          </svg>
        `;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-title",
            type: "text",
            x: 160,
            y: 510,
            width: 1600,
            height: 100,
            content: "01. TITRE DE LA SECTION",
            style: {
              fontSize: "52px",
              fontWeight: "800",
              color: "#ffffff",
              textAlign: "center",
              letterSpacing: "1px",
              fontFamily: "Outfit, sans-serif"
            }
          }
        ];
      }
    },
    {
      id: "layout-3",
      name: "Section Verte Éclatante",
      description: "Séparateur de section fond vert avec encadré blanc",
      category: "Section",
      getBackgroundSvg(theme) {
        return `
          <svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <rect width="1920" height="1080" fill="#009639"/>
            <!-- White horizontal title notch -->
            <rect x="420" y="470" width="1500" height="140" fill="#ffffff"/>
          </svg>
        `;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-title",
            type: "text",
            x: 460,
            y: 495,
            width: 1400,
            height: 90,
            content: "02. OBJECTIFS & MÉTHODOLOGIE",
            style: {
              fontSize: "46px",
              fontWeight: "800",
              color: "#004B28",
              textAlign: "left",
              fontFamily: "Outfit, sans-serif"
            }
          }
        ];
      }
    },
    {
      id: "layout-4",
      name: "Image & Colonne Verte",
      description: "Mise en page split avec cadre photo à gauche et texte à droite",
      category: "Contenu",
      getBackgroundSvg(theme) {
        return `
          <svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <rect width="1920" height="1080" fill="#ffffff"/>
            <!-- Left Green Decorative Column -->
            <rect x="0" y="0" width="460" height="1080" fill="#009639"/>
            <!-- Left subtle wave watermark -->
            <path d="M 0 650 Q 230 750 0 850 Z" fill="#007A3D" opacity="0.4"/>
            <path d="M 0 850 Q 230 950 0 1050 Z" fill="#007A3D" opacity="0.4"/>
          </svg>
        `;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-img-left",
            type: "image",
            x: 35,
            y: 120,
            width: 390,
            height: 380,
            src: "assets/sample-images/student_lab.png",
            style: {
              borderRadius: "6px",
              boxShadow: "0 8px 20px rgba(0,0,0,0.25)"
            }
          },
          {
            id: "el-img-caption",
            type: "text",
            x: 35,
            y: 520,
            width: 390,
            height: 120,
            content: "Laboratoire de recherche de pointe et expérimentation pratique.",
            style: {
              fontSize: "18px",
              color: "#ffffff",
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              lineHeight: "1.4"
            }
          },
          {
            id: "el-title",
            type: "text",
            x: 540,
            y: 140,
            width: 1280,
            height: 90,
            content: "INNOVATION & DÉVELOPPEMENT",
            style: {
              fontSize: "48px",
              fontWeight: "800",
              color: "#004B28",
              fontFamily: "Outfit, sans-serif"
            }
          },
          {
            id: "el-body",
            type: "text",
            x: 540,
            y: 260,
            width: 1280,
            height: 600,
            content: "La formation pratique et l'apprentissage par problèmes et par projets permettent aux ingénieurs et scientifiques de concevoir des solutions technologiques concrètes face aux défis contemporains.\n\n• Intégration continue de la théorie et des projets réels\n• Équipes multidisciplinaires et mentorat industriel\n• Laboratoires dotés d'équipements de pointe",
            style: {
              fontSize: "26px",
              color: "#333333",
              lineHeight: "1.6",
              fontFamily: "Inter, sans-serif"
            }
          }
        ];
      }
    },
    {
      id: "layout-5",
      name: "Contenu avec Puces (UdeS)",
      description: "Bandeau supérieur vert avec titre et liste à puces structurée",
      category: "Contenu",
      getBackgroundSvg(theme) {
        return `
          <svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <rect width="1920" height="1080" fill="#ffffff"/>
            <!-- Top Organic Wave Header Banner -->
            <path d="M 0 0 L 1920 0 L 1920 90 Q 1500 130 1100 80 Q 700 30 0 95 Z" fill="#007A3D"/>
            <path d="M 1100 0 L 1920 0 L 1920 85 Q 1600 120 1250 80 Z" fill="#009639"/>
            <path d="M 1550 0 L 1920 0 L 1920 80 Q 1750 110 1600 70 Z" fill="#82C341"/>
          </svg>
        `;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-title",
            type: "text",
            x: 120,
            y: 150,
            width: 1680,
            height: 90,
            content: "RÉSULTATS DE L'EXPÉRIMENTATION",
            style: {
              fontSize: "46px",
              fontWeight: "800",
              color: "#004B28",
              fontFamily: "Outfit, sans-serif"
            }
          },
          {
            id: "el-bullets",
            type: "bullets",
            x: 120,
            y: 270,
            width: 1680,
            height: 650,
            items: [
              { text: "Optimisation du rendement énergétique global (+24.8% mesuré en conditions réelles)", level: 1 },
              { text: "Diminution significative du temps de convergence des algorithmes", level: 2 },
              { text: "Validation expérimentale sur banc d'essai et prototypes à échelle 1:1", level: 1 },
              { text: "Conformité complète aux normes internationales IEEE et ISO", level: 2 },
              { text: "Déploiement en continu et robustesse face aux variations thermiques", level: 1 }
            ],
            style: {
              fontSize: "26px",
              color: "#222222",
              lineHeight: "1.5",
              fontFamily: "Inter, sans-serif"
            }
          }
        ];
      }
    },
    {
      id: "layout-6",
      name: "Contenu Texte & Données",
      description: "Bandeau supérieur vert avec mise en page multi-colonnes / tableaux",
      category: "Contenu",
      getBackgroundSvg(theme) {
        return `
          <svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
            <rect width="1920" height="1080" fill="#ffffff"/>
            <!-- Top Header Banner -->
            <path d="M 0 0 L 1920 0 L 1920 90 Q 1500 130 1100 80 Q 700 30 0 95 Z" fill="#007A3D"/>
            <path d="M 1100 0 L 1920 0 L 1920 85 Q 1600 120 1250 80 Z" fill="#009639"/>
            <path d="M 1550 0 L 1920 0 L 1920 80 Q 1750 110 1600 70 Z" fill="#82C341"/>
          </svg>
        `;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-title",
            type: "text",
            x: 120,
            y: 150,
            width: 1680,
            height: 90,
            content: "ANALYSE COMPARATIVE DES PERFORMANCES",
            style: {
              fontSize: "46px",
              fontWeight: "800",
              color: "#004B28",
              fontFamily: "Outfit, sans-serif"
            }
          },
          {
            id: "el-table",
            type: "table",
            x: 120,
            y: 280,
            width: 1680,
            height: 480,
            data: [
              ["Indicateur Clé", "Modèle Antérieur", "Prototype UdeS", "Gain Observé"],
              ["Efficacité énergétique", "68.2 %", "92.4 %", "+ 24.2 %"],
              ["Temps de réponse (ms)", "145 ms", "18 ms", "- 87.5 %"],
              ["Tolérance aux pannes", "99.1 %", "99.98 %", "+ 0.88 %"],
              ["Coût de fabrication relatif", "1.00x", "0.72x", "- 28.0 %"]
            ],
            style: {
              fontSize: "22px",
              fontFamily: "Inter, sans-serif"
            }
          }
        ];
      }
    },
    {
      id: "layout-7",
      name: "Diapositive Vierge",
      description: "Canvas blanc libre pour concevoir des mises en page sur-mesure",
      category: "Personnalisé",
      getBackgroundSvg(theme) {
        return `<svg viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;"><rect width="1920" height="1080" fill="#ffffff"/></svg>`;
      },
      getDefaultElements(faculty = "Faculté de génie") {
        return [
          {
            id: "el-title",
            type: "text",
            x: 120,
            y: 120,
            width: 1680,
            height: 80,
            content: "TITRE DE LA DIAPOSITIVE",
            style: {
              fontSize: "44px",
              fontWeight: "700",
              color: "#222222",
              fontFamily: "Outfit, sans-serif"
            }
          }
        ];
      }
    }
  ],

  // Find layout definition by ID
  getLayout(layoutId) {
    return this.layouts.find(l => l.id === layoutId) || this.layouts[0];
  }
};
