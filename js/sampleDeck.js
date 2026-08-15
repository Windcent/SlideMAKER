/**
 * SlideMAKER - Preloaded Sample Presentation
 * Université de Sherbrooke — Faculté de génie
 */

window.SampleDeck = {
  getDeck() {
    return {
      title: "Projet_Genie_UdeS_2026",
      master: {
        faculty: "Faculté de génie",
        showFaculty: true,
        showLogo: true,
        themeColor: "#007A3D",
        accentColor: "#82C341"
      },
      slides: [
        // Slide 1: Couverture (Layout 1)
        {
          id: "slide-1",
          layoutId: "layout-1",
          notes: "Bienvenue à tous. Aujourd'hui nous présentons l'avancement du projet d'ingénierie énergétique pour la Faculté de génie de l'Université de Sherbrooke.",
          elements: [
            {
              id: "el-1-title",
              type: "text",
              x: 140,
              y: 360,
              width: 1050,
              height: 180,
              content: "RÉSEAUX ÉNERGÉTIQUES INTELLIGENTS",
              style: {
                fontSize: "60px",
                fontWeight: "900",
                color: "#ffffff",
                textAlign: "left",
                lineHeight: "1.15",
                fontFamily: "Outfit, sans-serif"
              }
            },
            {
              id: "el-1-sub",
              type: "text",
              x: 140,
              y: 560,
              width: 900,
              height: 100,
              content: "Projet de recherche appliquée et développement technologique\nDépartement de génie électrique et génie informatique",
              style: {
                fontSize: "26px",
                fontWeight: "400",
                color: "#ffffff",
                textAlign: "left",
                fontFamily: "Inter, sans-serif",
                opacity: "0.95"
              }
            }
          ]
        },

        // Slide 2: Section Foncée "Univers en soi" (Layout 2)
        {
          id: "slide-2",
          layoutId: "layout-2",
          notes: "Dans cette première partie, nous établissons les impératifs scientifiques et industriels du projet.",
          elements: [
            {
              id: "el-2-title",
              type: "text",
              x: 160,
              y: 510,
              width: 1600,
              height: 100,
              content: "01. CONTEXTE & OBJECTIFS SCIENTIFIQUES",
              style: {
                fontSize: "50px",
                fontWeight: "800",
                color: "#ffffff",
                textAlign: "center",
                letterSpacing: "1px",
                fontFamily: "Outfit, sans-serif"
              }
            }
          ]
        },

        // Slide 3: Section Verte Éclatante (Layout 3)
        {
          id: "slide-3",
          layoutId: "layout-3",
          notes: "Cette section détaille l'architecture modulaire et les algorithmes d'optimisation prédictive.",
          elements: [
            {
              id: "el-3-title",
              type: "text",
              x: 460,
              y: 495,
              width: 1400,
              height: 90,
              content: "02. ARCHITECTURE MODULAIRE & MÉTHODOLOGIE",
              style: {
                fontSize: "44px",
                fontWeight: "800",
                color: "#004B28",
                textAlign: "left",
                fontFamily: "Outfit, sans-serif"
              }
            }
          ]
        },

        // Slide 4: Image & Colonne (Layout 4)
        {
          id: "slide-4",
          layoutId: "layout-4",
          notes: "Voici un aperçu de nos essais en laboratoire et du banc de test à l'échelle.",
          elements: [
            {
              id: "el-4-img",
              type: "image",
              x: 35,
              y: 120,
              width: 390,
              height: 380,
              src: "assets/sample-images/student_lab.png",
              style: {
                borderRadius: "6px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
              }
            },
            {
              id: "el-4-caption",
              type: "text",
              x: 35,
              y: 520,
              width: 390,
              height: 120,
              content: "Laboratoire de micro-réseaux et expérimentation sur banc d'essai.",
              style: {
                fontSize: "18px",
                color: "#ffffff",
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
                lineHeight: "1.4"
              }
            },
            {
              id: "el-4-title",
              type: "text",
              x: 540,
              y: 140,
              width: 1280,
              height: 80,
              content: "EXPÉRIMENTATION EN LABORATOIRE",
              style: {
                fontSize: "48px",
                fontWeight: "800",
                color: "#004B28",
                fontFamily: "Outfit, sans-serif"
              }
            },
            {
              id: "el-4-body",
              type: "text",
              x: 540,
              y: 250,
              width: 1280,
              height: 600,
              content: "La méthodologie d'apprentissage par projets de la Faculté de génie permet de valider empiriquement nos modèles mathématiques face à des contraintes opérationnelles réelles.\n\n• Conception de circuits d'acquisition haute fidélité\n• Traitement des signaux en temps réel avec microcontrôleurs embarqués\n• Intégration de mécanismes de sécurité redondants\n• Validation conjointe avec des partenaires industriels québécois",
              style: {
                fontSize: "26px",
                color: "#222222",
                lineHeight: "1.6",
                fontFamily: "Inter, sans-serif"
              }
            }
          ]
        },

        // Slide 5: Puces & Bandeau Vert (Layout 5)
        {
          id: "slide-5",
          layoutId: "layout-5",
          notes: "Souligner les gains de performance mesurés par rapport aux architectures classiques.",
          elements: [
            {
              id: "el-5-title",
              type: "text",
              x: 120,
              y: 150,
              width: 1680,
              height: 80,
              content: "PRINCIPAUX RÉSULTATS OBTENUS",
              style: {
                fontSize: "46px",
                fontWeight: "800",
                color: "#004B28",
                fontFamily: "Outfit, sans-serif"
              }
            },
            {
              id: "el-5-bullets",
              type: "bullets",
              x: 120,
              y: 260,
              width: 1680,
              height: 650,
              items: [
                { text: "Gain d'efficacité de conversion mesuré à 94.2% sur cycle complet", level: 1 },
                { text: "Réduction des pertes thermiques grâce à la modulation adaptative", level: 2 },
                { text: "Temps de réponse inférieur à 15 millisecondes lors des pics de charge", level: 1 },
                { text: "Stabilité vérifiée sous perturbations réseau sévères", level: 2 },
                { text: "Algorithme d'apprentissage auto-calibré déployé sur cible FPGA", level: 1 }
              ],
              style: {
                fontSize: "26px",
                color: "#222222",
                lineHeight: "1.5",
                fontFamily: "Inter, sans-serif"
              }
            }
          ]
        },

        // Slide 6: Données & Table (Layout 6)
        {
          id: "slide-6",
          layoutId: "layout-6",
          notes: "Ce tableau résume les métriques clés de validation avant la phase de mise à l'échelle.",
          elements: [
            {
              id: "el-6-title",
              type: "text",
              x: 120,
              y: 150,
              width: 1680,
              height: 80,
              content: "SYNTHÈSE DES MÉTRIQUES DE PERFORMANCE",
              style: {
                fontSize: "46px",
                fontWeight: "800",
                color: "#004B28",
                fontFamily: "Outfit, sans-serif"
              }
            },
            {
              id: "el-6-table",
              type: "table",
              x: 120,
              y: 270,
              width: 1680,
              height: 500,
              data: [
                ["Métrique d'évaluation", "Cible Initiale", "Résultat UdeS", "Statut"],
                ["Rendement énergétique global", "≥ 90.0 %", "94.2 %", "Validé ✓"],
                ["Temps de stabilisation dynamique", "< 50 ms", "14.6 ms", "Dépassé ✓"],
                ["Consommation en veille", "< 2.0 W", "0.45 W", "Validé ✓"],
                ["Taux d'erreur de prédiction", "< 5.0 %", "1.8 %", "Validé ✓"]
              ],
              style: {
                fontSize: "22px",
                fontFamily: "Inter, sans-serif"
              }
            }
          ]
        }
      ]
    };
  }
};
