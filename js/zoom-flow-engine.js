/**
 * SlideMAKER - Zoom Flow Engine
 * Generates and renders zoom-in style flow presentations & custom interactive slides
 */

class ZoomFlowEngine {
  constructor() {
    this.activeInstances = new Map(); // elementId -> controller
    this.snapToGrid = true; // Toggleable snap to grid for flow diagrams
    this.initTemplates();
  }

  initTemplates() {
    this.THEMES = {
      'udes-emerald': {
        name: 'UdeS Institutional Emerald',
        background: 'radial-gradient(circle at center, #0a1f18 0%, #06110d 100%)',
        nodeBg: 'rgba(13, 56, 42, 0.88)',
        textColor: '#FFFFFF',
        accentColors: ['#00A350', '#7FC23F', '#087E5B', '#306A5B', '#F59E0B'],
        lineColor: '#00A350'
      },
      'cyber-dark': {
        name: 'Tech Dark / Cyber',
        background: 'radial-gradient(circle at center, #111a2e 0%, #060911 100%)',
        nodeBg: 'rgba(23, 37, 66, 0.9)',
        textColor: '#FFFFFF',
        accentColors: ['#38BDF8', '#818CF8', '#A855F7', '#34D399', '#FB7185'],
        lineColor: '#38BDF8'
      },
      'ocean-teal': {
        name: 'Oceanic Gradient',
        background: 'radial-gradient(circle at center, #082f49 0%, #02131f 100%)',
        nodeBg: 'rgba(12, 74, 110, 0.85)',
        textColor: '#FFFFFF',
        accentColors: ['#06B6D4', '#0EA5E9', '#10B981', '#6366F1', '#F59E0B'],
        lineColor: '#06B6D4'
      },
      'glass-light': {
        name: 'Modern Clean Glass',
        background: 'radial-gradient(circle at center, #f1f5f9 0%, #e2e8f0 100%)',
        nodeBg: 'rgba(255, 255, 255, 0.92)',
        textColor: '#0F172A',
        accentColors: ['#00A350', '#0284C7', '#7C3AED', '#EA580C', '#0D9488'],
        lineColor: '#64748B'
      }
    };

    this.TEMPLATES = [
      {
        id: 'strategic-pipeline',
        name: 'Strategic Process Pipeline',
        desc: '5-phase linear execution flow from discovery to global launch',
        icon: 'fa-diagram-project',
        layout: 'linear-horizontal',
        theme: 'udes-emerald',
        title: 'Strategic Innovation & Delivery Pipeline',
        nodes: [
          {
            id: 'node_1',
            title: '1. Discovery & Research',
            subtitle: 'User Interviews & Problem Space',
            icon: 'fa-magnifying-glass',
            color: '#7FC23F',
            status: 'Phase 1',
            metricVal: '100+',
            metricLbl: 'Interviews Analyzed',
            summary: 'Comprehensive qualitative and quantitative research exploring user pain points, competitor benchmarks, and domain requirements.',
            bullets: [
              'Synthesized findings across 4 key target user archetypes',
              'Identified high-impact architectural bottlenecks',
              'Established institutional design criteria and constraints'
            ]
          },
          {
            id: 'node_2',
            title: '2. Architecture & Design',
            subtitle: 'System Blueprint & UI Flows',
            icon: 'fa-compass-drafting',
            color: '#00A350',
            status: 'Phase 2',
            metricVal: '99.9%',
            metricLbl: 'Design Fidelity',
            summary: 'Engineered robust data flow architectures and interactive component hierarchies adhering to official UdeS design principles.',
            bullets: [
              'Modular component system built with Vanilla CSS variables',
              'Dynamic multi-layered canvas engine with coordinate transforms',
              'Real-time undo/redo history stack management'
            ],
            nestedDiagram: {
              title: 'Architecture Blueprint & Subsystems',
              subtitle: 'Multi-layer system infrastructure',
              theme: 'udes-emerald',
              nodes: [
                {
                  id: 'sub_arch_1',
                  title: 'A1. API Gateway',
                  subtitle: 'Edge Routing & Auth',
                  icon: 'fa-network-wired',
                  color: '#00A350',
                  status: 'Gateway',
                  metricVal: '2.4ms',
                  metricLbl: 'Latency',
                  summary: 'Secure edge proxy handling authentication tokens, rate limiting, and SSL termination.',
                  bullets: ['Zero-trust token verification', 'Load-balanced dynamic ingress', 'DDoS filtering shield']
                },
                {
                  id: 'sub_arch_2',
                  title: 'A2. Business Engine',
                  subtitle: 'Domain Logic & Services',
                  icon: 'fa-microchip',
                  color: '#7FC23F',
                  status: 'Compute',
                  metricVal: '12k req/s',
                  metricLbl: 'Throughput',
                  summary: 'High-concurrency microservices orchestrating business transactions and presentation transforms.',
                  bullets: ['Stateless containerized services', 'Event-driven message bus integration', 'Automatic autoscaling groups']
                },
                {
                  id: 'sub_arch_3',
                  title: 'A3. Persistence & Cache',
                  subtitle: 'Distributed Data Layer',
                  icon: 'fa-database',
                  color: '#38BDF8',
                  status: 'Storage',
                  metricVal: '99.99%',
                  metricLbl: 'Availability',
                  summary: 'Clustered distributed database with multi-region replication and Redis in-memory cache.',
                  bullets: ['Zero-downtime automated backups', 'Encrypted at-rest and in-transit', 'Sub-millisecond query caches']
                }
              ],
              connections: [
                { from: 'sub_arch_1', to: 'sub_arch_2', fromPort: 'right', toPort: 'left' },
                { from: 'sub_arch_2', to: 'sub_arch_3', fromPort: 'right', toPort: 'left' }
              ]
            }
          },
          {
            id: 'node_3',
            title: '3. Core Implementation',
            subtitle: 'Feature Build & Engine Integration',
            icon: 'fa-code',
            color: '#38BDF8',
            status: 'Phase 3',
            metricVal: '60 FPS',
            metricLbl: 'Smooth Performance',
            summary: 'Constructed the interactive slide canvas, SVG bezier connector pipelines, and presentation presenter engine.',
            bullets: [
              'Hardware-accelerated CSS 3D transform transitions',
              'Dynamic shape rasterization and chart bindings',
              'Direct double-click on-canvas text editing'
            ]
          },
          {
            id: 'node_4',
            title: '4. Validation & Testing',
            subtitle: 'Cross-Device & QA Benchmarks',
            icon: 'fa-shield-check',
            color: '#F59E0B',
            status: 'Phase 4',
            metricVal: '100%',
            metricLbl: 'Export Accuracy',
            summary: 'Rigorous end-to-end testing verifying vector rendering, standalone HTML generation, and multi-page HD PDF exports.',
            bullets: [
              'Verified crisp vector scaling on Retina and 4K displays',
              'Zero-dependency standalone HTML presentation packaging',
              'Cross-browser touch and keyboard navigation validation'
            ]
          },
          {
            id: 'node_5',
            title: '5. Deployment & Scale',
            subtitle: 'Global Rollout & Monitoring',
            icon: 'fa-rocket',
            color: '#8B5CF6',
            status: 'Phase 5',
            metricVal: '0.2s',
            metricLbl: 'Load Time',
            summary: 'Institutional deployment enabling researchers, educators, and students to deliver captivating presentations effortlessly.',
            bullets: [
              'Full offline capability with embedded vector backgrounds',
              'Streamlined project sharing via lightweight JSON savefiles',
              'Interactive zoom-in presentation experience out-of-the-box'
            ]
          }
        ]
      },
      {
        id: 'roadmap-timeline',
        name: 'Quarterly Strategic Roadmap',
        desc: 'Q1 to Q4 milestone journey with progress metrics',
        icon: 'fa-timeline',
        layout: 'linear-horizontal',
        theme: 'cyber-dark',
        title: 'Annual Strategic Product Roadmap',
        nodes: [
          {
            id: 'node_1',
            title: 'Q1: Foundation & Core',
            subtitle: 'Core Engine & Architecture',
            icon: 'fa-layer-group',
            color: '#38BDF8',
            status: 'Completed',
            metricVal: 'Q1',
            metricLbl: 'Milestone Met',
            summary: 'Established fundamental runtime architecture, state store, and canvas rendering engine.',
            bullets: [
              'Unified presentation state with undo/redo capability',
              'Base vector shape rendering with SVG generators',
              'Aspect ratio switching (16:9, A4, 4:3)'
            ]
          },
          {
            id: 'node_2',
            title: 'Q2: Rich Media & Charts',
            subtitle: 'Visuals, Tables & Base64 Assets',
            icon: 'fa-chart-pie',
            color: '#34D399',
            status: 'Completed',
            metricVal: '100%',
            metricLbl: 'On Schedule',
            summary: 'Expanded canvas capabilities with Chart.js visualization, custom table builder, and high-res templates.',
            bullets: [
              'Pre-encoded ultra-HD vector templates',
              'Dynamic bar, line, and doughnut charts',
              'Self-contained HTML drag-and-drop embedding'
            ]
          },
          {
            id: 'node_3',
            title: 'Q3: Interactive Zoom Flows',
            subtitle: 'Zoom-in Presentations & Prezi Mode',
            icon: 'fa-wand-magic-sparkles',
            color: '#F59E0B',
            status: 'In Progress',
            metricVal: 'v2.1',
            metricLbl: 'Release Target',
            summary: 'Engineered infinite-canvas flow diagrams where every node expands into an interactive deep dive during presentation.',
            bullets: [
              'Interactive flow diagram generator with AI prompt mode',
              'Smooth camera pan and zoom with bezier curves',
              'Custom interactive slide integration across export formats'
            ]
          },
          {
            id: 'node_4',
            title: 'Q4: Global Ecosystem',
            subtitle: 'Cloud Collaboration & Cloud Sync',
            icon: 'fa-globe',
            color: '#A855F7',
            status: 'Upcoming',
            metricVal: 'Global',
            metricLbl: 'Target Reach',
            summary: 'Institutional multi-seat collaboration, custom branding asset stores, and interactive web embed widgets.',
            bullets: [
              'Real-time peer presentation collaboration',
              'Cloud template repository for departments',
              'Embedded live polling and attendee interactions'
            ]
          }
        ]
      },
      {
        id: 'system-architecture',
        name: 'Deep Tech & AI Architecture',
        desc: 'Multi-stage data flow from raw ingestion to model inference',
        icon: 'fa-network-wired',
        layout: 's-curve',
        theme: 'ocean-teal',
        title: 'Deep Learning & Analytics Pipeline',
        nodes: [
          {
            id: 'node_1',
            title: 'Data Ingestion',
            subtitle: 'Streaming & Batch Feeds',
            icon: 'fa-database',
            color: '#06B6D4',
            status: 'Ingress',
            metricVal: '2.5 GB/s',
            metricLbl: 'Throughput',
            summary: 'High-throughput telemetry ingestion from IoT sensors, clinical logs, and real-time user events.',
            bullets: [
              'Distributed Kafka event stream ingestion',
              'Automated schema validation and cleaning',
              'Real-time deduplication and throttling'
            ]
          },
          {
            id: 'node_2',
            title: 'Feature Engineering',
            subtitle: 'Normalization & Embeddings',
            icon: 'fa-sliders',
            color: '#0EA5E9',
            status: 'Processing',
            metricVal: '512-D',
            metricLbl: 'Vector Space',
            summary: 'High-dimensional embedding extraction, statistical normalization, and feature store caching.',
            bullets: [
              'Sparse and dense feature computation',
              'Sub-millisecond feature store lookups',
              'Automated drift detection alerts'
            ]
          },
          {
            id: 'node_3',
            title: 'Model Inference',
            subtitle: 'Neural Network Execution',
            icon: 'fa-brain',
            color: '#10B981',
            status: 'Inference',
            metricVal: '8.4 ms',
            metricLbl: 'P99 Latency',
            summary: 'Quantized neural network inference executing on accelerated hardware with dynamic batching.',
            bullets: [
              'FP16 TensorRT inference runtime',
              'Automated fallback to ensemble trees',
              'Continuous confidence calibration'
            ]
          },
          {
            id: 'node_4',
            title: 'API Gateway',
            subtitle: 'Secure Edge Distribution',
            icon: 'fa-server',
            color: '#6366F1',
            status: 'Egress',
            metricVal: '99.99%',
            metricLbl: 'SLA Uptime',
            summary: 'Global low-latency API gateway routing authenticated prediction payloads to web and mobile clients.',
            bullets: [
              'JWT-based mutual TLS authentication',
              'Edge caching of static predictions',
              'Real-time rate limiting per client'
            ]
          },
          {
            id: 'node_5',
            title: 'Insights & UI',
            subtitle: 'Decision Intelligence',
            icon: 'fa-chart-line',
            color: '#F59E0B',
            status: 'Client',
            metricVal: 'Live',
            metricLbl: 'Telemetry',
            summary: 'Executive dashboard rendering real-time KPI alerts, decision recommendations, and diagnostic graphs.',
            bullets: [
              'Real-time WebSocket data stream updates',
              'Custom interactive visual drilldowns',
              'Automated daily summary reporting'
            ]
          }
        ]
      },
      {
        id: 'circular-flywheel',
        name: 'Iterative Growth Flywheel',
        desc: 'Continuous improvement loop: Measure, Learn, Build, Optimize',
        icon: 'fa-arrows-spin',
        layout: 'circular-cycle',
        theme: 'udes-emerald',
        title: 'Continuous Innovation & Quality Flywheel',
        nodes: [
          {
            id: 'node_1',
            title: '1. Telemetry & Signals',
            subtitle: 'Measure User Behaviors',
            icon: 'fa-radar',
            color: '#7FC23F',
            status: 'Step 1',
            metricVal: '4.8M',
            metricLbl: 'Events Tracked',
            summary: 'Gather accurate signals on how users construct slides, present content, and interact with visual tools.',
            bullets: [
              'Anonymized workflow tracking',
              'Heatmap analysis of formatting actions',
              'Feature usage retention curves'
            ]
          },
          {
            id: 'node_2',
            title: '2. Deep Insights',
            subtitle: 'Identify Bottlenecks',
            icon: 'fa-brain',
            color: '#00A350',
            status: 'Step 2',
            metricVal: '3 Key',
            metricLbl: 'Friction Points',
            summary: 'Distill quantitative signals into clear actionable product improvements and UX enhancements.',
            bullets: [
              'Identify where presentation preparation slows down',
              'Analyze common export formats and settings',
              'Survey speaker presentation preferences'
            ]
          },
          {
            id: 'node_3',
            title: '3. Rapid Prototyping',
            subtitle: 'Build & Iterate',
            icon: 'fa-hammer',
            color: '#38BDF8',
            status: 'Step 3',
            metricVal: '2 Weeks',
            metricLbl: 'Sprint Cycle',
            summary: 'Quickly implement intuitive solutions like the Zoom Flow Presentation generator and instant preview.',
            bullets: [
              'Component-first modular development',
              'Zero-friction one-click templates',
              'Immediate interactive validation'
            ]
          },
          {
            id: 'node_4',
            title: '4. Optimize & Scale',
            subtitle: 'Refine & Re-measure',
            icon: 'fa-arrow-trend-up',
            color: '#F59E0B',
            status: 'Step 4',
            metricVal: '+42%',
            metricLbl: 'Satisfaction',
            summary: 'Deploy enhancements, evaluate user delight, and feed new observations back into Step 1.',
            bullets: [
              'Refined presentation smoothness',
              'Documented feedback channels',
              'Continuous flywheel compounding'
            ]
          }
        ]
      }
    ];
  }

  // --- Generate Full Regular Slide for a Node ---

  generateChildSlide(node, parentFlowId, index, total, themeKey = 'udes-emerald') {
    const theme = this.THEMES[themeKey] || this.THEMES['udes-emerald'];
    const nodeColor = node.color || theme.accentColors[0];
    const slideId = window.state ? window.state.generateId('slide') : `slide_${Date.now()}_${index}`;

    // Rich structured elements for this regular slide
    const elements = [
      // 1. Stage Indicator Pill
      {
        id: `el_stage_${index}_${Date.now()}`,
        type: 'text',
        textType: 'subtitle',
        x: 80,
        y: 60,
        width: 700,
        height: 38,
        content: `<span style="display:inline-flex;align-items:center;gap:8px;background:${nodeColor}22;border:1px solid ${nodeColor}66;color:${nodeColor};padding:4px 14px;border-radius:20px;font-size:12.5px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;"><i class="fa-solid ${node.icon || 'fa-circle-dot'}"></i> STAGE ${index + 1} OF ${total} &bull; ${node.status || 'PHASE'}</span>`,
        fontFamily: 'Outfit',
        fontSize: 14,
        color: nodeColor,
        backgroundColor: 'transparent'
      },

      // 2. Main Title
      ElementFactory.createTitle({
        id: window.state ? window.state.generateId('title') : `el_title_${index}_${Date.now()}`,
        x: 80,
        y: 110,
        width: 760,
        height: 80,
        content: node.title
      }),

      // 3. Subtitle
      ElementFactory.createSubtitle({
        id: window.state ? window.state.generateId('subtitle') : `el_sub_${index}_${Date.now()}`,
        x: 80,
        y: 190,
        width: 760,
        height: 50,
        content: node.subtitle || 'Key strategic objectives and implementation focus'
      }),

      // 4. Narrative Paragraph
      ElementFactory.createText({
        id: window.state ? window.state.generateId('text') : `el_narrative_${index}_${Date.now()}`,
        x: 80,
        y: 250,
        width: 720,
        height: 110,
        content: node.summary || 'Detailed execution overview, methodology, and operational milestones.'
      }),

      // 5. Bullet List of Takeaways / Deliverables
      ElementFactory.createBulletList({
        id: window.state ? window.state.generateId('bullets') : `el_bullets_${index}_${Date.now()}`,
        x: 80,
        y: 370,
        width: 720,
        height: 260,
        content: `<ul>${(node.bullets || ['Key milestone deliverable', 'Cross-functional alignment', 'Quality validation']).map(b => `<li>${b}</li>`).join('')}</ul>`
      }),

      // 6. Right Side Highlight Metric Box (Rounded card container)
      {
        id: `el_card_${index}_${Date.now()}`,
        type: 'shape',
        shapeId: 'rounded-rect',
        x: 870,
        y: 120,
        width: 330,
        height: 460,
        fillColor: 'rgba(23, 37, 66, 0.88)',
        strokeColor: nodeColor,
        strokeWidth: 2,
        borderRadius: 16,
        shadowBlur: 16,
        shadowColor: 'rgba(0,0,0,0.4)',
        opacity: 1
      },

      // 7. Right Side Content (Icon + Metric + Details)
      {
        id: `el_metric_${index}_${Date.now()}`,
        type: 'text',
        textType: 'body',
        x: 890,
        y: 145,
        width: 290,
        height: 410,
        content: `
          <div style="text-align:center;padding:12px 0;">
            <div style="width:68px;height:68px;border-radius:18px;background:${nodeColor}25;border:1.5px solid ${nodeColor}66;display:inline-flex;align-items:center;justify-content:center;font-size:30px;color:${nodeColor};margin-bottom:16px;">
              <i class="fa-solid ${node.icon || 'fa-chart-simple'}"></i>
            </div>
            <div style="font-family:'Outfit',sans-serif;font-size:44px;font-weight:800;color:${nodeColor};line-height:1;margin-bottom:6px;">
              ${node.metricVal || '100%'}
            </div>
            <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:24px;">
              ${node.metricLbl || 'Milestone Metric'}
            </div>
            <div style="text-align:left;border-top:1px solid rgba(255,255,255,0.12);padding-top:18px;">
              <div style="font-size:11px;font-weight:700;color:#7fc23f;text-transform:uppercase;margin-bottom:6px;">Focus Objective</div>
              <p style="font-size:12.5px;color:#cbd5e1;line-height:1.45;margin:0;">${node.subtitle || 'Execute core requirements and deliver verified outputs.'}</p>
            </div>
          </div>
        `,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#FFFFFF',
        backgroundColor: 'transparent'
      }
    ];

    return {
      id: slideId,
      background: {
        type: 'color',
        value: themeKey === 'glass-light' ? '#F8FAFC' : '#090E17'
      },
      elements: elements,
      notes: `Speaker notes for ${node.title}:\n- ${node.summary}`,
      transition: 'fade',
      isFlowChild: true,
      thumbnailType: 'text',
      parentFlowSlideId: parentFlowId,
      flowNodeId: node.id,
      flowNodeIndex: index,
      flowNodeTitle: node.title,
      flowNodeSubtitle: node.subtitle,
      flowNodeColor: nodeColor,
      flowNodeIcon: node.icon,
      flowNodeStatus: node.status
    };
  }

  // --- Layout Calculation Engine ---

  calculateNodePositions(nodes, layout, stageWidth = 1280, stageHeight = 720, explicitConnections = null) {
    const total = nodes.length;
    const positions = [];
    const connections = [];

    const paddingX = 140;
    const paddingY = 160;
    const usableW = stageWidth - paddingX * 2;
    const usableH = stageHeight - paddingY * 2;

    switch (layout) {
      case 'linear-horizontal': {
        const stepX = total > 1 ? usableW / (total - 1) : usableW / 2;
        const centerY = stageHeight / 2;

        nodes.forEach((node, i) => {
          const x = paddingX + i * stepX;
          const y = centerY + (i % 2 === 1 ? 25 : -25); // Subtle pleasant alternation
          positions.push({ id: node.id, x, y });

          if (i > 0) {
            connections.push({ id: `conn_${nodes[i - 1].id}_${node.id}`, from: nodes[i - 1].id, to: node.id, fromPort: 'right', toPort: 'left', type: 'bezier' });
          }
        });
        break;
      }

      case 's-curve': {
        // Multi-row serpentine flow (e.g. 3 on top row left-to-right, remaining on bottom row right-to-left)
        const row1Count = Math.ceil(total / 2);
        const row2Count = total - row1Count;

        const row1Y = stageHeight * 0.35;
        const row2Y = stageHeight * 0.68;

        const row1Step = row1Count > 1 ? usableW / (row1Count - 1) : usableW / 2;
        const row2Step = row2Count > 1 ? usableW / (row2Count - 1) : usableW / 2;

        nodes.forEach((node, i) => {
          let x, y;
          if (i < row1Count) {
            x = paddingX + i * row1Step;
            y = row1Y;
          } else {
            const row2Index = i - row1Count;
            // Reverse direction for serpentine snake curve
            x = stageWidth - paddingX - row2Index * row2Step;
            y = row2Y;
          }
          positions.push({ id: node.id, x, y });

          if (i > 0) {
            let fPort = 'right';
            let tPort = 'left';
            if (i === row1Count) {
              fPort = 'bottom';
              tPort = 'top';
            } else if (i > row1Count) {
              fPort = 'left';
              tPort = 'right';
            }
            connections.push({ id: `conn_${nodes[i - 1].id}_${node.id}`, from: nodes[i - 1].id, to: node.id, fromPort: fPort, toPort: tPort, type: 's-curve' });
          }
        });
        break;
      }

      case 'circular-cycle': {
        const cx = stageWidth / 2;
        const cy = stageHeight / 2;
        const rx = usableW * 0.44;
        const ry = usableH * 0.48;

        nodes.forEach((node, i) => {
          // Start from top (-PI/2) and go clockwise
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / total;
          const x = cx + rx * Math.cos(angle);
          const y = cy + ry * Math.sin(angle);
          positions.push({ id: node.id, x, y });

          const nextIndex = (i + 1) % total;
          connections.push({ id: `conn_${node.id}_${nodes[nextIndex].id}`, from: node.id, to: nodes[nextIndex].id, fromPort: 'right', toPort: 'left', type: 'arc' });
        });
        break;
      }

      case 'grid-matrix':
      default: {
        const cols = total <= 4 ? 2 : 3;
        const rows = Math.ceil(total / cols);
        const cellW = usableW / (cols - 1 || 1);
        const cellH = usableH / (rows - 1 || 1);

        nodes.forEach((node, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = paddingX + c * cellW;
          const y = paddingY + r * cellH;
          positions.push({ id: node.id, x, y });

          if (i > 0) {
            connections.push({ id: `conn_${nodes[i - 1].id}_${node.id}`, from: nodes[i - 1].id, to: node.id, fromPort: 'right', toPort: 'left', type: 'bezier' });
          }
        });
        break;
      }
    }

    // Preserve custom dragged positions if present on node objects
    nodes.forEach((node, i) => {
      if (node.x !== undefined && node.y !== undefined && positions[i]) {
        positions[i].x = node.x;
        positions[i].y = node.y;
      }
    });

    // Use explicit connections if configured; fallback to default layout connections
    const activeConnections = Array.isArray(explicitConnections) ? explicitConnections : connections;

    return { positions, connections: activeConnections };
  }

  // --- SVG Connection Anchors & Path Generator ---

  getNodePortCoords(nodePos, port = 'right') {
    const halfW = 112;
    const halfH = 65;
    switch (port) {
      case 'top':
        return { x: nodePos.x, y: nodePos.y - halfH, dirX: 0, dirY: -1, port: 'top' };
      case 'bottom':
        return { x: nodePos.x, y: nodePos.y + halfH, dirX: 0, dirY: 1, port: 'bottom' };
      case 'left':
        return { x: nodePos.x - halfW, y: nodePos.y, dirX: -1, dirY: 0, port: 'left' };
      case 'right':
      default:
        return { x: nodePos.x + halfW, y: nodePos.y, dirX: 1, dirY: 0, port: 'right' };
    }
  }

  getConnectionAnchors(fromPos, toPos, fromPort = null, toPort = null) {
    let fPort = fromPort;
    let tPort = toPort;

    // Only fallback if ports were never assigned
    if (!fPort || !tPort) {
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        if (dy >= 0) {
          fPort = fPort || 'bottom';
          tPort = tPort || 'top';
        } else {
          fPort = fPort || 'top';
          tPort = tPort || 'bottom';
        }
      } else {
        if (dx >= 0) {
          fPort = fPort || 'right';
          tPort = tPort || 'left';
        } else {
          fPort = fPort || 'left';
          tPort = tPort || 'right';
        }
      }
    }

    const p1 = this.getNodePortCoords(fromPos, fPort);
    const p2 = this.getNodePortCoords(toPos, tPort);

    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const tension = Math.max(35, Math.min(dist * 0.45, 160));

    // Control points extend outward along each port's normal vector
    const cp1x = p1.x + p1.dirX * tension;
    const cp1y = p1.y + p1.dirY * tension;
    const cp2x = p2.x + p2.dirX * tension;
    const cp2y = p2.y + p2.dirY * tension;

    // Midpoint on the cubic bezier at t = 0.5
    const midX = 0.125 * p1.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * p2.x;
    const midY = 0.125 * p1.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * p2.y;

    return {
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      midX,
      midY,
      fromPort: fPort,
      toPort: tPort
    };
  }

  generateSplinePath(p1, p2, customPoints) {
    const pts = [
      { x: p1.x, y: p1.y },
      { x: customPoints[0].x, y: customPoints[0].y },
      { x: customPoints[1].x, y: customPoints[1].y },
      { x: customPoints[2].x, y: customPoints[2].y },
      { x: p2.x, y: p2.y }
    ];

    const tangents = [];
    const dist01 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    const dist34 = Math.hypot(pts[4].x - pts[3].x, pts[4].y - pts[3].y);

    const p1DirX = p1.dirX !== undefined ? p1.dirX : 1;
    const p1DirY = p1.dirY !== undefined ? p1.dirY : 0;
    tangents[0] = { x: p1DirX * Math.max(30, dist01 * 0.75), y: p1DirY * Math.max(30, dist01 * 0.75) };

    const p2DirX = p2.dirX !== undefined ? p2.dirX : -1;
    const p2DirY = p2.dirY !== undefined ? p2.dirY : 0;
    tangents[4] = { x: -p2DirX * Math.max(30, dist34 * 0.75), y: -p2DirY * Math.max(30, dist34 * 0.75) };

    for (let i = 1; i <= 3; i++) {
      tangents[i] = {
        x: (pts[i + 1].x - pts[i - 1].x) * 0.5,
        y: (pts[i + 1].y - pts[i - 1].y) * 0.5
      };
    }

    const allSameY = pts.every(pt => Math.abs(pt.y - pts[0].y) < 0.001);
    const allSameX = pts.every(pt => Math.abs(pt.x - pts[0].x) < 0.001);
    if (allSameY) {
      pts[pts.length - 1].y += 0.02;
    }
    if (allSameX) {
      pts[pts.length - 1].x += 0.02;
    }

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < 4; i++) {
      const cp1x = Math.round(pts[i].x + tangents[i].x / 3);
      const cp1y = Math.round(pts[i].y + tangents[i].y / 3);
      const cp2x = Math.round(pts[i + 1].x - tangents[i + 1].x / 3);
      const cp2y = Math.round(pts[i + 1].y - tangents[i + 1].y / 3);
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
    }

    return d;
  }

  getLineDragPoints(fromPos, toPos, fromPort = null, toPort = null, customPoints = null) {
    if (Array.isArray(customPoints) && customPoints.length === 3) {
      return [
        { x: customPoints[0].x, y: customPoints[0].y, isCustom: true },
        { x: customPoints[1].x, y: customPoints[1].y, isCustom: true },
        { x: customPoints[2].x, y: customPoints[2].y, isCustom: true }
      ];
    }

    const anchors = this.getConnectionAnchors(fromPos, toPos, fromPort, toPort);
    const { x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y } = anchors;

    const evalBezier = (t) => {
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      return {
        x: Math.round(mt3 * x1 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * x2),
        y: Math.round(mt3 * y1 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * y2),
        isCustom: false
      };
    };

    return [evalBezier(0.25), evalBezier(0.50), evalBezier(0.75)];
  }

  generateSvgPath(fromPos, toPos, type = 'bezier', fromPort = null, toPort = null, customPoints = null) {
    if (Array.isArray(customPoints) && customPoints.length === 3) {
      const p1 = this.getNodePortCoords(fromPos, fromPort || 'right');
      const p2 = this.getNodePortCoords(toPos, toPort || 'left');
      return this.generateSplinePath(p1, p2, customPoints);
    }

    const anchors = this.getConnectionAnchors(fromPos, toPos, fromPort, toPort);
    const { x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y } = anchors;

    // Prevent zero-dimension SVG bounding box on strictly horizontal or vertical paths
    const safeY2 = Math.abs(y1 - y2) < 0.001 ? y2 + 0.02 : y2;
    const safeX2 = Math.abs(x1 - x2) < 0.001 ? x2 + 0.02 : x2;

    if (type === 'straight' || type === 'line') {
      return `M ${x1} ${y1} L ${safeX2} ${safeY2}`;
    }

    if (type === 'arc') {
      const dX = x2 - x1;
      const dY = y2 - y1;
      const dist = Math.sqrt(dX * dX + dY * dY);
      return `M ${x1} ${y1} A ${dist * 0.9} ${dist * 0.9} 0 0 1 ${safeX2} ${safeY2}`;
    }

    // Default bezier with outward tangents from each port
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${safeX2} ${safeY2}`;
  }

  // --- Obstacle Avoidance Auto-Routing Engine (Ensures auto lines won't pass under blocs) ---

  calculateAutoLineDetour(fromPos, toPos, fromPort, toPort, posMap, connFromId, connToId, stageW = 1280, stageH = 720) {
    let fPort = fromPort;
    let tPort = toPort;
    if (!fPort || !tPort) {
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        fPort = fPort || (dy >= 0 ? 'bottom' : 'top');
        tPort = tPort || (dy >= 0 ? 'top' : 'bottom');
      } else {
        fPort = fPort || (dx >= 0 ? 'right' : 'left');
        tPort = tPort || (dx >= 0 ? 'left' : 'right');
      }
    }
    const p1 = this.getNodePortCoords(fromPos, fPort);
    const p2 = this.getNodePortCoords(toPos, tPort);

    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const tension = Math.max(35, Math.min(dist * 0.45, 160));

    const cp1 = { x: p1.x + p1.dirX * tension, y: p1.y + p1.dirY * tension };
    const cp2 = { x: p2.x + p2.dirX * tension, y: p2.y + p2.dirY * tension };

    // Card boundary dimensions (width: 220px -> half 114px, height: 130px -> half 67px)
    const cardHalfW = 114;
    const cardHalfH = 67;

    const obstacles = [];
    if (posMap && typeof posMap.forEach === 'function') {
      posMap.forEach((pos, nid) => {
        obstacles.push({
          id: nid,
          isFrom: nid === connFromId,
          isTo: nid === connToId,
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
    }

    const evalBezier = (t) => {
      const mt = 1 - t;
      return {
        x: (mt ** 3) * p1.x + 3 * (mt ** 2) * t * cp1.x + 3 * mt * (t ** 2) * cp2.x + (t ** 3) * p2.x,
        y: (mt ** 3) * p1.y + 3 * (mt ** 2) * t * cp1.y + 3 * mt * (t ** 2) * cp2.y + (t ** 3) * p2.y
      };
    };

    // Sample baseline curve at 24 points to detect any collision with node cards
    const hitObstacles = [];
    for (let i = 1; i <= 24; i++) {
      const t = i / 25;
      const pt = evalBezier(t);
      for (let j = 0; j < obstacles.length; j++) {
        const obs = obstacles[j];
        if (obs.isFrom) {
          // Check if curve cuts back under departure card
          if (t >= 0.14 && pt.x >= obs.xMin && pt.x <= obs.xMax && pt.y >= obs.yMin && pt.y <= obs.yMax) {
            if (!hitObstacles.includes(obs)) hitObstacles.push(obs);
          }
        } else if (obs.isTo) {
          // Check if curve cuts under destination card
          if (t <= 0.86 && pt.x >= obs.xMin && pt.x <= obs.xMax && pt.y >= obs.yMin && pt.y <= obs.yMax) {
            if (!hitObstacles.includes(obs)) hitObstacles.push(obs);
          }
        } else {
          // Intermediate node card
          if (pt.x >= obs.xMin && pt.x <= obs.xMax && pt.y >= obs.yMin && pt.y <= obs.yMax) {
            if (!hitObstacles.includes(obs)) hitObstacles.push(obs);
          }
        }
      }
    }

    if (hitObstacles.length === 0) {
      return null; // Baseline path does not pass under any bloc
    }

    // Solve smart detour corridor around all hit obstacles
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    let d1, d2, d3;

    if (Math.abs(dx) >= Math.abs(dy)) {
      // Primarily horizontal flow: detour vertically above or below blocs
      const avgObsY = hitObstacles.reduce((sum, o) => sum + o.y, 0) / hitObstacles.length;
      let preferTop = (p1.port === 'top' || p2.port === 'top' || (p1.y + p2.y) / 2 <= avgObsY);
      if (p1.port === 'bottom' || p2.port === 'bottom') {
        preferTop = false;
      }

      const minTop = Math.min(...hitObstacles.map(o => o.clearTop));
      const maxBottom = Math.max(...hitObstacles.map(o => o.clearBottom));

      let detourY;
      if (preferTop && minTop > 65) {
        detourY = Math.min(minTop, Math.min(p1.y, p2.y) - 30);
        detourY = Math.max(50, detourY);
      } else {
        detourY = Math.max(maxBottom, Math.max(p1.y, p2.y) + 30);
        detourY = Math.min(stageH - 50, detourY);
      }

      const stepX1 = p1.dirX !== 0 ? (p1.x + p1.dirX * 55) : (p1.x + dx * 0.25);
      const stepX3 = p2.dirX !== 0 ? (p2.x + p2.dirX * 55) : (p2.x - dx * 0.25);

      d1 = {
        x: Math.round(Math.max(45, Math.min(stageW - 45, stepX1))),
        y: Math.round(p1.y + (detourY - p1.y) * 0.7)
      };
      d2 = {
        x: Math.round(Math.max(45, Math.min(stageW - 45, (p1.x + p2.x) / 2))),
        y: Math.round(detourY)
      };
      d3 = {
        x: Math.round(Math.max(45, Math.min(stageW - 45, stepX3))),
        y: Math.round(p2.y + (detourY - p2.y) * 0.7)
      };
    } else {
      // Primarily vertical flow: detour horizontally left or right of blocs
      const avgObsX = hitObstacles.reduce((sum, o) => sum + o.x, 0) / hitObstacles.length;
      let preferLeft = (p1.port === 'left' || p2.port === 'left' || (p1.x + p2.x) / 2 <= avgObsX);
      if (p1.port === 'right' || p2.port === 'right') {
        preferLeft = false;
      }

      const minLeft = Math.min(...hitObstacles.map(o => o.clearLeft));
      const maxRight = Math.max(...hitObstacles.map(o => o.clearRight));

      let detourX;
      if (preferLeft && minLeft > 65) {
        detourX = Math.min(minLeft, Math.min(p1.x, p2.x) - 30);
        detourX = Math.max(50, detourX);
      } else {
        detourX = Math.max(maxRight, Math.max(p1.x, p2.x) + 30);
        detourX = Math.min(stageW - 50, detourX);
      }

      const stepY1 = p1.dirY !== 0 ? (p1.y + p1.dirY * 55) : (p1.y + dy * 0.25);
      const stepY3 = p2.dirY !== 0 ? (p2.y + p2.dirY * 55) : (p2.y - dy * 0.25);

      d1 = {
        x: Math.round(p1.x + (detourX - p1.x) * 0.7),
        y: Math.round(Math.max(45, Math.min(stageH - 45, stepY1)))
      };
      d2 = {
        x: Math.round(detourX),
        y: Math.round(Math.max(45, Math.min(stageH - 45, (p1.y + p2.y) / 2)))
      };
      d3 = {
        x: Math.round(p2.x + (detourX - p2.x) * 0.7),
        y: Math.round(Math.max(45, Math.min(stageH - 45, stepY3)))
      };
    }

    return [d1, d2, d3];
  }

  // --- Interactive Zoom Controller & DOM Factory ---

  createZoomFlowDOM(flowData, options = {}) {
    const isPresenter = !!options.isPresenter;
    const isEditor = !!options.isEditor;
    const isPreview = !!options.isPreview;

    const theme = this.THEMES[flowData.theme] || this.THEMES['udes-emerald'];
    const nodes = flowData.nodes || [];
    const layout = flowData.layout || 'linear-horizontal';

    const stageWidth = options.width || 1280;
    const stageHeight = options.height || 720;

    const { positions, connections } = this.calculateNodePositions(nodes, layout, stageWidth, stageHeight, flowData.connections);

    // If connections not yet initialized on flowData, persist calculated connections
    if (!Array.isArray(flowData.connections)) {
      flowData.connections = JSON.parse(JSON.stringify(connections));
    }

    const posMap = new Map();
    positions.forEach(p => posMap.set(p.id, p));

    // Outer Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `zoom-flow-wrapper ${isPresenter ? 'is-presenter-flow' : ''} ${isEditor ? 'is-editor-flow' : ''} ${this.snapToGrid ? 'is-grid-snapping' : ''}`;
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.background = theme.background;

    // Background subtle grid decoration
    const bgDeco = document.createElement('div');
    bgDeco.className = 'zoom-flow-background';
    bgDeco.innerHTML = `
      <div style="position:absolute;width:100%;height:100%;opacity:0.04;background-image:linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px);background-size:40px 40px;"></div>
    `;
    wrapper.appendChild(bgDeco);

    // Zoom Stage Container (The pan & zoom camera target)
    const zoomStage = document.createElement('div');
    zoomStage.className = 'zoom-flow-stage';
    zoomStage.style.width = `${stageWidth}px`;
    zoomStage.style.height = `${stageHeight}px`;

    // Diagram Header (Title & optional Subtitle)
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const titleText = flowData.title !== undefined ? flowData.title : 'Flow Diagram';
    const subtitleText = flowData.subtitle || '';

    // Inherit synchronized global title style
    const globalTitleStyle = (window.state && window.state.titleStyle) || {};
    const titleStyle = Object.assign({
      fontFamily: 'JetBrains Mono',
      fontSize: 44,
      fontWeight: '700',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: theme.textColor || '#FFFFFF',
      textAlign: 'left'
    }, globalTitleStyle, flowData.titleStyle || {});

    const headerEl = document.createElement('div');
    headerEl.className = 'zf-diagram-header';
    headerEl.innerHTML = `
      <h2 class="zf-diagram-title ${isEditor ? 'is-editable' : ''}" ${isEditor ? 'contenteditable="true" spellcheck="false"' : ''} title="${isEditor ? 'Click to edit diagram title' : ''}">${esc(titleText)}</h2>
      ${(subtitleText || isEditor) ? `
        <p class="zf-diagram-subtitle ${isEditor ? 'is-editable' : ''}" ${isEditor ? 'contenteditable="true" spellcheck="false"' : ''} title="${isEditor ? 'Click to edit subtitle' : ''}">${esc(subtitleText || (isEditor ? 'Click to add subtitle' : ''))}</p>
      ` : ''}
    `;

    const titleEl = headerEl.querySelector('.zf-diagram-title');
    const subtitleEl = headerEl.querySelector('.zf-diagram-subtitle');

    if (titleEl) {
      if (titleStyle.fontFamily) titleEl.style.fontFamily = titleStyle.fontFamily;
      if (titleStyle.fontSize) titleEl.style.fontSize = `${titleStyle.fontSize}px`;
      if (titleStyle.fontWeight) titleEl.style.fontWeight = titleStyle.fontWeight;
      if (titleStyle.fontStyle) titleEl.style.fontStyle = titleStyle.fontStyle;
      if (titleStyle.textDecoration) titleEl.style.textDecoration = titleStyle.textDecoration;
      if (titleStyle.color) titleEl.style.color = titleStyle.color;
      if (titleStyle.textAlign) {
        titleEl.style.textAlign = titleStyle.textAlign;
        headerEl.style.alignItems = titleStyle.textAlign === 'center' ? 'center' : (titleStyle.textAlign === 'right' ? 'flex-end' : 'flex-start');
        headerEl.style.textAlign = titleStyle.textAlign;
      }
    }
    if (subtitleEl && titleStyle.textAlign) {
      subtitleEl.style.textAlign = titleStyle.textAlign;
    }

    if (isEditor) {
      titleEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.state) {
          window.state.selectDiagramTitle();
          if (window.app && typeof window.app.syncContextualToolbar === 'function') {
            window.app.syncContextualToolbar();
          }
        }
      });
      titleEl?.addEventListener('focus', () => {
        if (window.state) {
          window.state.selectDiagramTitle();
          if (window.app && typeof window.app.syncContextualToolbar === 'function') {
            window.app.syncContextualToolbar();
          }
        }
      });
      titleEl?.addEventListener('mousedown', (e) => e.stopPropagation());
      titleEl?.addEventListener('input', () => {
        const val = titleEl.innerText.trim();
        flowData.title = val;
        const input = document.getElementById('flow-prop-title');
        if (input) input.value = val;
        if (window.state) {
          const activeSlide = window.state.getActiveSlide();
          if (activeSlide && activeSlide.isZoomFlow && activeSlide.zoomFlowData) {
            activeSlide.zoomFlowData.title = val;
          }
        }
      });
      titleEl?.addEventListener('blur', () => {
        if (window.state) {
          window.state.saveHistory('Edit Diagram Title');
        }
      });

      subtitleEl?.addEventListener('click', (e) => e.stopPropagation());
      subtitleEl?.addEventListener('mousedown', (e) => e.stopPropagation());
      subtitleEl?.addEventListener('input', () => {
        let val = subtitleEl.innerText.trim();
        if (val === 'Click to add subtitle') val = '';
        flowData.subtitle = val;
        const input = document.getElementById('flow-prop-subtitle');
        if (input) input.value = val;
        if (window.state) {
          const activeSlide = window.state.getActiveSlide();
          if (activeSlide && activeSlide.isZoomFlow && activeSlide.zoomFlowData) {
            activeSlide.zoomFlowData.subtitle = val;
          }
        }
      });
      subtitleEl?.addEventListener('blur', () => {
        if (window.state) {
          window.state.saveHistory('Edit Diagram Subtitle');
        }
      });
    }

    zoomStage.appendChild(headerEl);

    // 1. SVG Connectors Layer
    const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('class', 'zoom-flow-svg-layer');
    svgLayer.setAttribute('viewBox', `0 0 ${stageWidth} ${stageHeight}`);
    svgLayer.setAttribute('width', '100%');
    svgLayer.setAttribute('height', '100%');

    // SVG Defs (arrow markers, gradients)
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="zf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="${theme.lineColor || '#00A350'}" opacity="0.9" />
      </marker>
      <linearGradient id="zf-line-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${stageWidth}" y2="${stageHeight}">
        <stop offset="0%" stop-color="${theme.accentColors[0]}" stop-opacity="0.8" />
        <stop offset="50%" stop-color="${theme.accentColors[1] || theme.accentColors[0]}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${theme.accentColors[2] || theme.accentColors[0]}" stop-opacity="0.8" />
      </linearGradient>
    `;
    svgLayer.appendChild(defs);

    // SVG Connections Group for easy dynamic redraws
    const connGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connGroup.setAttribute('class', 'zf-connections-group');
    svgLayer.appendChild(connGroup);

    zoomStage.appendChild(svgLayer);

    // Helper for stage coordinate conversion
    const getStageCoords = (clientX, clientY) => {
      const rect = zoomStage.getBoundingClientRect();
      const scaleX = rect.width / (zoomStage.offsetWidth || stageWidth);
      const scaleY = rect.height / (zoomStage.offsetHeight || stageHeight);
      return {
        x: (clientX - rect.left) / scaleX,
        y: (clientY - rect.top) / scaleY
      };
    };

    // Midpoint delete badges container (editor mode)
    let connBadgesLayer = null;
    let dragPointsLayer = null;
    if (isEditor) {
      connBadgesLayer = document.createElement('div');
      connBadgesLayer.className = 'zf-connection-badges-layer';
      zoomStage.appendChild(connBadgesLayer);

      dragPointsLayer = document.createElement('div');
      dragPointsLayer.className = 'zf-conn-drag-points-layer';
      zoomStage.appendChild(dragPointsLayer);
    }

    // Dynamic Connection Redraw function
    const redrawConnections = () => {
      connGroup.innerHTML = '';
      if (connBadgesLayer) connBadgesLayer.innerHTML = '';
      if (dragPointsLayer) dragPointsLayer.innerHTML = '';

      const activeConns = flowData.connections || [];
      activeConns.forEach((conn, cIdx) => {
        const fromPos = posMap.get(conn.from);
        const toPos = posMap.get(conn.to);
        if (!fromPos || !toPos) return;

        const anchors = this.getConnectionAnchors(fromPos, toPos, conn.fromPort, conn.toPort);

        const isManual = conn.mode === 'manual' || (Array.isArray(conn.points) && conn.points.length === 3);
        let dragPoints;
        let isAutoDetour = false;

        if (isManual) {
          dragPoints = [
            { x: conn.points[0].x, y: conn.points[0].y, isCustom: true },
            { x: conn.points[1].x, y: conn.points[1].y, isCustom: true },
            { x: conn.points[2].x, y: conn.points[2].y, isCustom: true }
          ];
        } else {
          // Automatic obstacle avoidance: ensures autolines won't pass under any blocs
          const detour = this.calculateAutoLineDetour(
            fromPos, toPos, conn.fromPort, conn.toPort, posMap, conn.from, conn.to, stageWidth, stageHeight
          );
          if (detour) {
            isAutoDetour = true;
            dragPoints = [
              { x: detour[0].x, y: detour[0].y, isCustom: false, isDetour: true },
              { x: detour[1].x, y: detour[1].y, isCustom: false, isDetour: true },
              { x: detour[2].x, y: detour[2].y, isCustom: false, isDetour: true }
            ];
          } else {
            dragPoints = this.getLineDragPoints(fromPos, toPos, conn.fromPort, conn.toPort, null);
          }
        }

        const d = this.generateSvgPath(
          fromPos,
          toPos,
          conn.type || 'bezier',
          conn.fromPort,
          conn.toPort,
          (isManual || isAutoDetour) ? dragPoints : null
        );

        // Ambient glow line
        const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        glowPath.setAttribute('d', d);
        glowPath.setAttribute('fill', 'none');
        glowPath.setAttribute('stroke', theme.lineColor || '#00A350');
        glowPath.setAttribute('stroke-width', '6');
        glowPath.setAttribute('stroke-opacity', '0.15');
        glowPath.setAttribute('stroke-linecap', 'round');
        glowPath.setAttribute('class', 'zf-conn-glow');
        connGroup.appendChild(glowPath);

        // Animated dashed pipeline line
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'url(#zf-line-grad)');
        path.setAttribute('stroke-width', '2.8');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('class', 'zoom-flow-connector');
        path.setAttribute('marker-end', 'url(#zf-arrow)');
        connGroup.appendChild(path);

        // In editor mode, if in manual placing mode, create 3 interactive drag points along the line
        if (isEditor && isManual && dragPointsLayer) {
          dragPoints.forEach((pt, pIdx) => {
            const ptHandle = document.createElement('div');
            ptHandle.className = `zf-conn-drag-point ${pt.isCustom ? 'is-modified' : ''}`;
            ptHandle.style.left = `${pt.x}px`;
            ptHandle.style.top = `${pt.y}px`;
            ptHandle.setAttribute('data-conn-id', conn.id || `${conn.from}_${conn.to}`);
            ptHandle.setAttribute('data-point-idx', pIdx);

            const ptLabels = ['1 (Start Bend)', '2 (Center / Apex)', '3 (End Bend)'];
            ptHandle.title = `Line Point ${ptLabels[pIdx]}\n• Drag to place line\n• Double-click to reset auto curve`;

            // Mouse down to drag this point
            ptHandle.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              e.preventDefault();

              // Capture state before drag starts for instantaneous undo
              const preDragSlides = JSON.parse(JSON.stringify(window.state.slides));

              conn.mode = 'manual';

              // Initialize conn.points with current coordinates if not yet explicitly saved
              if (!Array.isArray(conn.points) || conn.points.length !== 3) {
                conn.points = [
                  { x: dragPoints[0].x, y: dragPoints[0].y },
                  { x: dragPoints[1].x, y: dragPoints[1].y },
                  { x: dragPoints[2].x, y: dragPoints[2].y }
                ];
              }

              let hasMovedPoint = false;
              ptHandle.classList.add('is-dragging');
              zoomStage.classList.add('is-dragging-line-point');

              const onDragMove = (ev) => {
                hasMovedPoint = true;
                const cur = getStageCoords(ev.clientX, ev.clientY);
                let targetX = cur.x;
                let targetY = cur.y;
                if (this.snapToGrid) {
                  const grid = 20;
                  targetX = Math.round(targetX / grid) * grid;
                  targetY = Math.round(targetY / grid) * grid;
                }
                conn.points[pIdx].x = Math.round(targetX);
                conn.points[pIdx].y = Math.round(targetY);
                redrawConnections();
              };

              const onDragUp = () => {
                window.removeEventListener('mousemove', onDragMove);
                window.removeEventListener('mouseup', onDragUp);

                zoomStage.classList.remove('is-dragging-line-point');

                if (hasMovedPoint && window.state) {
                  window.state.savePreActionSnapshot('Place Connection Line', preDragSlides);
                  if (window.app && typeof window.app.renderFlowInspector === 'function') {
                    window.app.renderFlowInspector();
                  }
                }
              };

              window.addEventListener('mousemove', onDragMove);
              window.addEventListener('mouseup', onDragUp);
            });

            // Double-click to reset custom line points back to natural curve
            ptHandle.addEventListener('dblclick', (e) => {
              e.stopPropagation();
              if (window.state) {
                window.state.saveHistory('Reset Connection Line');
              }
              delete conn.points;
              conn.mode = 'auto';
              redrawConnections();
              if (window.app && typeof window.app.renderFlowInspector === 'function') {
                window.app.renderFlowInspector();
              }
            });

            dragPointsLayer.appendChild(ptHandle);
          });
        }

        // In editor mode, create action badge group (Mode Toggle + Delete) near the destination port
        if (isEditor && connBadgesLayer) {
          const badgeGroup = document.createElement('div');
          badgeGroup.className = 'zf-conn-action-badges';

          const targetPortCoords = this.getNodePortCoords(toPos, conn.toPort || 'left');
          const badgeX = Math.round(dragPoints[2].x * 0.35 + targetPortCoords.x * 0.65);
          const badgeY = Math.round(dragPoints[2].y * 0.35 + targetPortCoords.y * 0.65);
          badgeGroup.style.left = `${badgeX}px`;
          badgeGroup.style.top = `${badgeY}px`;

          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          const fromName = fromNode ? fromNode.title : conn.from;
          const toName = toNode ? toNode.title : conn.to;

          // 1. Toggle Mode button (Auto vs Manual placing)
          const modeBtn = document.createElement('button');
          modeBtn.className = `zf-conn-mode-badge ${isManual ? 'is-manual' : 'is-auto'}`;
          modeBtn.title = isManual ? 'Mode: Manual Placing (Click to switch to Auto)' : 'Mode: Auto Placing (Click to switch to Manual)';
          modeBtn.innerHTML = `<i class="fa-solid ${isManual ? 'fa-sliders' : 'fa-wand-magic-sparkles'}"></i>`;

          modeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.app && typeof window.app.toggleFlowConnectionMode === 'function') {
              window.app.toggleFlowConnectionMode(conn.from, conn.to, conn.fromPort, conn.toPort);
            } else {
              if (isManual) {
                conn.mode = 'auto';
                delete conn.points;
              } else {
                conn.mode = 'manual';
              }
              redrawConnections();
            }
          });

          modeBtn.addEventListener('mouseenter', () => {
            glowPath.setAttribute('stroke-width', '10');
            glowPath.setAttribute('stroke-opacity', '0.45');
            path.setAttribute('stroke-width', '4');
          });
          modeBtn.addEventListener('mouseleave', () => {
            glowPath.setAttribute('stroke-width', '6');
            glowPath.setAttribute('stroke-opacity', '0.15');
            path.setAttribute('stroke-width', '2.8');
          });

          // 2. Delete connection button
          const delBtn = document.createElement('button');
          delBtn.className = 'zf-conn-del-badge';
          delBtn.title = `Disconnect: ${fromName} [${conn.fromPort || 'right'}] → ${toName} [${conn.toPort || 'left'}]`;
          delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.app && typeof window.app.deleteFlowConnection === 'function') {
              window.app.deleteFlowConnection(conn.from, conn.to, conn.fromPort, conn.toPort);
            } else {
              const idx = flowData.connections.indexOf(conn);
              if (idx !== -1) flowData.connections.splice(idx, 1);
              redrawConnections();
            }
          });

          delBtn.addEventListener('mouseenter', () => {
            glowPath.setAttribute('stroke', '#ef4444');
            glowPath.setAttribute('stroke-width', '10');
            glowPath.setAttribute('stroke-opacity', '0.6');
            path.setAttribute('stroke-width', '4');
          });
          delBtn.addEventListener('mouseleave', () => {
            glowPath.setAttribute('stroke', theme.lineColor || '#00A350');
            glowPath.setAttribute('stroke-width', '6');
            glowPath.setAttribute('stroke-opacity', '0.15');
            path.setAttribute('stroke-width', '2.8');
          });

          badgeGroup.appendChild(modeBtn);
          badgeGroup.appendChild(delBtn);
          connBadgesLayer.appendChild(badgeGroup);
        }
      });
    };

    // Initial draw of connection lines
    redrawConnections();

    // 2. Nodes Layer
    const nodeElements = [];

    nodes.forEach((node, idx) => {
      const pos = posMap.get(node.id) || { x: 100, y: 100 };
      const nodeEl = document.createElement('div');
      nodeEl.className = 'zoom-flow-node';
      nodeEl.setAttribute('data-id', node.id);
      nodeEl.setAttribute('data-index', idx);
      nodeEl.style.left = `${pos.x}px`;
      nodeEl.style.top = `${pos.y}px`;
      nodeEl.style.setProperty('--node-color', node.color || theme.accentColors[0]);
      nodeEl.style.setProperty('--node-glow', `${node.color || theme.accentColors[0]}40`);

      nodeEl.innerHTML = `
        <div class="zoom-flow-node-card">
          <h4 class="zoom-flow-node-title">${node.title}</h4>
          ${node.subtitle ? `<p class="zoom-flow-node-sub">${node.subtitle}</p>` : ''}
        </div>
      `;

      // In editor mode, add connection handles on all 4 sides (top, bottom, left, right)
      if (isEditor) {
        // Output connection port (right side)
        const portRight = document.createElement('div');
        portRight.className = 'zf-connector-handle zf-handle-right zf-handle-out';
        portRight.setAttribute('data-port', 'right');
        portRight.setAttribute('data-node-id', node.id);
        portRight.title = 'Drag to connect (Right)';

        // Input connection port (left side)
        const portLeft = document.createElement('div');
        portLeft.className = 'zf-connector-handle zf-handle-left zf-handle-in';
        portLeft.setAttribute('data-port', 'left');
        portLeft.setAttribute('data-node-id', node.id);
        portLeft.title = 'Drag to connect (Left)';

        // Top connection port
        const portTop = document.createElement('div');
        portTop.className = 'zf-connector-handle zf-handle-top';
        portTop.setAttribute('data-port', 'top');
        portTop.setAttribute('data-node-id', node.id);
        portTop.title = 'Drag to connect (Top)';

        // Bottom connection port
        const portBottom = document.createElement('div');
        portBottom.className = 'zf-connector-handle zf-handle-bottom';
        portBottom.setAttribute('data-port', 'bottom');
        portBottom.setAttribute('data-node-id', node.id);
        portBottom.title = 'Drag to connect (Bottom)';

        nodeEl.appendChild(portLeft);
        nodeEl.appendChild(portRight);
        nodeEl.appendChild(portTop);
        nodeEl.appendChild(portBottom);

        // Attach drag-to-connect listeners to all 4 ports
        [portRight, portLeft, portTop, portBottom].forEach(handle => {
          handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();

            const sourceNodeId = node.id;
            const sourcePos = posMap.get(sourceNodeId);
            if (!sourcePos) return;

            const sourcePort = handle.getAttribute('data-port') || 'right';
            const startPortInfo = this.getNodePortCoords(sourcePos, sourcePort);
            const startX = startPortInfo.x;
            const startY = startPortInfo.y;

            // Live temporary wire element in SVG layer
            const tempWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tempWire.setAttribute('class', 'zf-temp-wire');
            tempWire.setAttribute('fill', 'none');
            tempWire.setAttribute('stroke', '#7FC23F');
            tempWire.setAttribute('stroke-width', '3.5');
            tempWire.setAttribute('stroke-linecap', 'round');
            tempWire.setAttribute('stroke-dasharray', '6 4');
            tempWire.setAttribute('marker-end', 'url(#zf-arrow)');
            svgLayer.appendChild(tempWire);

            zoomStage.classList.add('is-connecting-wire');
            nodeEl.classList.add('is-wire-source');

            let activeTargetNodeId = null;
            let activeTargetPort = null;

            const getStageCoords = (clientX, clientY) => {
              const rect = zoomStage.getBoundingClientRect();
              const scaleX = rect.width / (zoomStage.offsetWidth || stageWidth);
              const scaleY = rect.height / (zoomStage.offsetHeight || stageHeight);
              return {
                x: (clientX - rect.left) / scaleX,
                y: (clientY - rect.top) / scaleY
              };
            };

            const onWireMouseMove = (ev) => {
              const cur = getStageCoords(ev.clientX, ev.clientY);

              const under = document.elementFromPoint(ev.clientX, ev.clientY);
              const targetHandle = under?.closest('.zf-connector-handle');
              const targetNodeEl = under?.closest('.zoom-flow-node');
              const targetId = targetNodeEl?.getAttribute('data-id');

              // Clear previous target port highlights
              zoomStage.querySelectorAll('.zf-connector-handle.is-target-port').forEach(h => {
                h.classList.remove('is-target-port');
              });

              if (targetNodeEl && targetId && targetId !== sourceNodeId) {
                activeTargetNodeId = targetId;
                const targetPos = posMap.get(targetId);

                if (targetHandle && targetHandle.getAttribute('data-node-id') === targetId) {
                  activeTargetPort = targetHandle.getAttribute('data-port') || 'left';
                  targetHandle.classList.add('is-target-port');
                } else if (targetPos) {
                  // Find closest of the 4 ports to cursor
                  const ports = ['top', 'bottom', 'left', 'right'];
                  let bestPort = 'left';
                  let bestDist = Infinity;
                  ports.forEach(p => {
                    const pt = this.getNodePortCoords(targetPos, p);
                    const dist = Math.hypot(cur.x - pt.x, cur.y - pt.y);
                    if (dist < bestDist) {
                      bestDist = dist;
                      bestPort = p;
                    }
                  });
                  activeTargetPort = bestPort;
                  const candidateHandle = targetNodeEl.querySelector(`.zf-connector-handle[data-port="${activeTargetPort}"]`);
                  if (candidateHandle) candidateHandle.classList.add('is-target-port');
                }

                nodeElements.forEach(el => {
                  const id = el.getAttribute('data-id');
                  if (id === activeTargetNodeId) {
                    el.classList.add('is-connection-target');
                  } else {
                    el.classList.remove('is-connection-target');
                  }
                });

                // Snap temp wire to candidate target port
                if (targetPos && activeTargetPort) {
                  const pathStr = this.generateSvgPath(sourcePos, targetPos, 'bezier', sourcePort, activeTargetPort);
                  tempWire.setAttribute('d', pathStr);
                }
              } else {
                activeTargetNodeId = null;
                activeTargetPort = null;
                nodeElements.forEach(el => el.classList.remove('is-connection-target'));

                // Free-floating curve towards cursor exiting source port
                const tension = Math.max(30, Math.hypot(cur.x - startX, cur.y - startY) * 0.4);
                const cp1x = startX + startPortInfo.dirX * tension;
                const cp1y = startY + startPortInfo.dirY * tension;
                const d = `M ${startX} ${startY} Q ${cp1x} ${cp1y}, ${cur.x} ${cur.y}`;
                tempWire.setAttribute('d', d);
              }
            };

            const onWireMouseUp = () => {
              window.removeEventListener('mousemove', onWireMouseMove);
              window.removeEventListener('mouseup', onWireMouseUp);

              if (tempWire.parentNode) {
                tempWire.parentNode.removeChild(tempWire);
              }
              zoomStage.classList.remove('is-connecting-wire');
              zoomStage.querySelectorAll('.zf-connector-handle.is-target-port').forEach(h => {
                h.classList.remove('is-target-port');
              });
              nodeElements.forEach(el => el.classList.remove('is-wire-source', 'is-connection-target'));

              if (activeTargetNodeId && activeTargetNodeId !== sourceNodeId && activeTargetPort) {
                if (window.app && typeof window.app.addFlowConnection === 'function') {
                  window.app.addFlowConnection(sourceNodeId, activeTargetNodeId, sourcePort, activeTargetPort);
                } else {
                  flowData.connections = flowData.connections || [];
                  const exists = flowData.connections.some(c => 
                    c.from === sourceNodeId && 
                    c.to === activeTargetNodeId && 
                    (c.fromPort || 'right') === sourcePort && 
                    (c.toPort || 'left') === activeTargetPort
                  );
                  if (!exists) {
                    flowData.connections.push({
                      id: `conn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                      from: sourceNodeId,
                      to: activeTargetNodeId,
                      fromPort: sourcePort,
                      toPort: activeTargetPort,
                      type: 'bezier'
                    });
                    redrawConnections();
                  }
                }
              }
            };

            window.addEventListener('mousemove', onWireMouseMove);
            window.addEventListener('mouseup', onWireMouseUp);
          });
        });

        // Node Card Dragging for Repositioning
        nodeEl.addEventListener('mousedown', (e) => {
          if (
            e.target.closest('.zf-connector-handle') ||
            e.target.closest('.zf-node-jump-btn') ||
            e.target.closest('button')
          ) {
            return;
          }

          // Capture state before drag starts for instantaneous undo
          const preDragSlides = JSON.parse(JSON.stringify(window.state.slides));

          const startClientX = e.clientX;
          const startClientY = e.clientY;
          const nodePos = posMap.get(node.id) || { x: 100, y: 100 };
          const origX = nodePos.x;
          const origY = nodePos.y;
          let hasDragged = false;

          const getStageScale = () => {
            const rect = zoomStage.getBoundingClientRect();
            return {
              scaleX: rect.width / (zoomStage.offsetWidth || stageWidth),
              scaleY: rect.height / (zoomStage.offsetHeight || stageHeight)
            };
          };

          const onNodeDragMove = (ev) => {
            const { scaleX, scaleY } = getStageScale();
            const dx = (ev.clientX - startClientX) / scaleX;
            const dy = (ev.clientY - startClientY) / scaleY;

            if (!hasDragged && Math.hypot(dx, dy) > 5) {
              hasDragged = true;
              nodeEl.classList.add('is-dragging-node');
              nodeEl._justDragged = true;
            }

            if (hasDragged) {
              let newX = Math.round(Math.max(120, Math.min(stageWidth - 120, origX + dx)));
              let newY = Math.round(Math.max(80, Math.min(stageHeight - 80, origY + dy)));

              if (this.snapToGrid) {
                const grid = 20;
                newX = Math.round(newX / grid) * grid;
                newY = Math.round(newY / grid) * grid;
              }

              const stepDeltaX = newX - nodePos.x;
              const stepDeltaY = newY - nodePos.y;

              nodePos.x = newX;
              nodePos.y = newY;
              node.x = newX;
              node.y = newY;

              // If any connection attached to this node has custom drag points, translate them proportionally
              if (Array.isArray(flowData.connections)) {
                flowData.connections.forEach(c => {
                  if (Array.isArray(c.points) && c.points.length === 3) {
                    if (c.from === node.id) {
                      c.points[0].x += Math.round(stepDeltaX * 0.75);
                      c.points[0].y += Math.round(stepDeltaY * 0.75);
                      c.points[1].x += Math.round(stepDeltaX * 0.50);
                      c.points[1].y += Math.round(stepDeltaY * 0.50);
                      c.points[2].x += Math.round(stepDeltaX * 0.25);
                      c.points[2].y += Math.round(stepDeltaY * 0.25);
                    } else if (c.to === node.id) {
                      c.points[0].x += Math.round(stepDeltaX * 0.25);
                      c.points[0].y += Math.round(stepDeltaY * 0.25);
                      c.points[1].x += Math.round(stepDeltaX * 0.50);
                      c.points[1].y += Math.round(stepDeltaY * 0.50);
                      c.points[2].x += Math.round(stepDeltaX * 0.75);
                      c.points[2].y += Math.round(stepDeltaY * 0.75);
                    }
                  }
                });
              }

              nodeEl.style.left = `${newX}px`;
              nodeEl.style.top = `${newY}px`;

              redrawConnections();
            }
          };

          const onNodeDragUp = () => {
            window.removeEventListener('mousemove', onNodeDragMove);
            window.removeEventListener('mouseup', onNodeDragUp);

            if (hasDragged) {
              nodeEl.classList.remove('is-dragging-node');
              setTimeout(() => {
                delete nodeEl._justDragged;
              }, 180);

              // Commit pre-drag snapshot for instantaneous undo on first Ctrl+Z
              window.state.savePreActionSnapshot('Move Flow Node', preDragSlides);

              if (window.app && typeof window.app.updateFlowNodePosition === 'function') {
                window.app.updateFlowNodePosition(node.id, nodePos.x, nodePos.y, true);
              }
            }
          };

          window.addEventListener('mousemove', onNodeDragMove);
          window.addEventListener('mouseup', onNodeDragUp);
        });
      }

      zoomStage.appendChild(nodeEl);
      nodeElements.push(nodeEl);
    });

    // If empty flow (0 nodes), render canvas empty state
    if (nodes.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'zf-empty-flow-placeholder';
      emptyCard.innerHTML = `
        <div class="zf-empty-flow-icon">
          <i class="fa-solid fa-diagram-project"></i>
        </div>
        <h3 class="zf-empty-flow-title">Empty Flow Diagram</h3>
        <p class="zf-empty-flow-desc">This interactive flow has no nodes yet. Click below or use the toolbar to add your first stage.</p>
        <button class="btn btn-primary zf-btn-add-node-canvas" id="btn-empty-add-node">
          <i class="fa-solid fa-plus"></i> Add First Node
        </button>
      `;
      zoomStage.appendChild(emptyCard);

      emptyCard.querySelector('#btn-empty-add-node')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app && typeof window.app.addNodeToActiveFlow === 'function') {
          window.app.addNodeToActiveFlow();
        }
      });
    }

    wrapper.appendChild(zoomStage);

    // Controller Object
    const controller = {
      wrapper,
      zoomStage,
      nodes,
      nodeElements,
      stageWidth,
      stageHeight,
      activeNodeIndex: -1, // -1 = Overview
      redrawConnections,

      zoomToOverview() {
        this.activeNodeIndex = -1;
        zoomStage.classList.remove('is-zoomed-in');
        nodeElements.forEach(el => el.classList.remove('is-active-node'));
        zoomStage.style.transform = 'translate(0px, 0px) scale(1)';

        if (options.onNodeChange) {
          options.onNodeChange(-1, null);
        }
      },

      zoomToNode(index) {
        if (index < 0 || index >= nodes.length) {
          this.zoomToOverview();
          return;
        }

        this.activeNodeIndex = index;
        const targetNode = nodes[index];
        const targetPos = posMap.get(targetNode.id);
        if (!targetPos) return;

        // Camera Scale: zoom 2.25x into the node
        const zoomScale = 2.25;
        const offsetY = -45;
        const targetX = targetPos.x;
        const targetY = targetPos.y + offsetY;

        const translateX = (stageWidth / 2) - (targetX * zoomScale);
        const translateY = (stageHeight / 2) - (targetY * zoomScale);

        zoomStage.classList.remove('is-zooming-out');
        zoomStage.classList.add('is-zoomed-in');
        nodeElements.forEach((el, i) => {
          el.classList.toggle('is-active-node', i === index);
        });

        zoomStage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;

        if (options.onNodeChange) {
          options.onNodeChange(index, targetNode);
        }
      },

      setSlideOverlayState(hasOverlay) {
        zoomStage.classList.toggle('has-slide-overlay', !!hasOverlay);
      },

      setNodePositionInstant(index) {
        if (index < 0 || index >= nodes.length) return;
        this.activeNodeIndex = index;
        const targetNode = nodes[index];
        const targetPos = posMap.get(targetNode.id);
        if (!targetPos) return;

        const zoomScale = Math.max(stageWidth / 220, stageHeight / 190, 4.8);
        const translateX = (stageWidth / 2) - (targetPos.x * zoomScale);
        const translateY = (stageHeight / 2) - (targetPos.y * zoomScale);

        zoomStage.style.transition = 'none';
        zoomStage.classList.add('is-zoomed-in', 'is-zooming-fullscreen');
        nodeElements.forEach((el, i) => {
          el.classList.toggle('is-active-node', i === index);
          el.classList.toggle('is-fullscreen-node', i === index);
        });
        zoomStage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;
        zoomStage.offsetHeight; // Force reflow
        zoomStage.style.transition = '';
      },

      zoomToNodeFullscreen(index, onComplete) {
        if (index < 0 || index >= nodes.length) {
          this.zoomOutToOverview(onComplete);
          return;
        }

        this.activeNodeIndex = index;
        const targetNode = nodes[index];
        const targetPos = posMap.get(targetNode.id);
        if (!targetPos) {
          if (onComplete) onComplete();
          return;
        }

        // Fullscreen scale: box expands to cover viewport
        const zoomScale = Math.max(stageWidth / 220, stageHeight / 190, 4.8);
        const translateX = (stageWidth / 2) - (targetPos.x * zoomScale);
        const translateY = (stageHeight / 2) - (targetPos.y * zoomScale);

        this.setSlideOverlayState(false);
        zoomStage.classList.remove('is-zooming-out');
        zoomStage.classList.add('is-zoomed-in', 'is-zooming-fullscreen');
        nodeElements.forEach((el, i) => {
          el.classList.toggle('is-active-node', i === index);
          el.classList.toggle('is-fullscreen-node', i === index);
        });

        zoomStage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomScale})`;

        if (options.onNodeChange) {
          options.onNodeChange(index, targetNode);
        }

        setTimeout(() => {
          this.setSlideOverlayState(true);
        }, 360);

        if (onComplete) {
          setTimeout(onComplete, 480);
        }
      },

      zoomOutToOverview(onComplete) {
        this.activeNodeIndex = -1;
        this.setSlideOverlayState(false);
        zoomStage.classList.add('is-zooming-out');
        zoomStage.classList.remove('is-zooming-fullscreen');
        zoomStage.style.transform = 'translate(0px, 0px) scale(1)';

        if (options.onNodeChange) {
          options.onNodeChange(-1, null);
        }

        setTimeout(() => {
          zoomStage.classList.remove('is-zoomed-in', 'is-zooming-out');
          nodeElements.forEach(el => {
            el.classList.remove('is-active-node', 'is-fullscreen-node');
          });
          if (onComplete) onComplete();
        }, 480);
      },

      transitionSlideChange(fromNodeIdx, toNodeIdx, onComplete) {
        if (toNodeIdx === -1) {
          this.zoomOutToOverview(onComplete);
          return;
        }

        if (fromNodeIdx === -1 || fromNodeIdx === toNodeIdx) {
          this.zoomToNodeFullscreen(toNodeIdx, onComplete);
          return;
        }

        // Zoom out to diagram overview first, brief beat, then zoom in to next item
        this.zoomOutToOverview(() => {
          setTimeout(() => {
            this.zoomToNodeFullscreen(toNodeIdx, onComplete);
          }, 120);
        });
      },

      stepNext() {
        if (this.activeNodeIndex < nodes.length - 1) {
          this.zoomToNode(this.activeNodeIndex + 1);
          return true;
        }
        return false; // Reached end of nodes
      },

      stepPrev() {
        if (this.activeNodeIndex > 0) {
          this.zoomToNode(this.activeNodeIndex - 1);
          return true;
        } else if (this.activeNodeIndex === 0) {
          this.zoomToOverview();
          return true;
        }
        return false; // Already at overview
      }
    };

    // Navigation to child regular slide
    const navigateToChildSlide = (nodeIdx) => {
      const targetNode = nodes[nodeIdx];
      if (!targetNode) return;
      if (options.onSelectSlide) {
        options.onSelectSlide(nodeIdx, targetNode);
        return;
      }
      if (window.state) {
        const currentSlide = (window.presenterEngine && window.presenterEngine.isActive)
          ? window.state.slides[window.presenterEngine.currentSlideIndex]
          : window.state.getActiveSlide();
        const parentId = options.flowSlideId || (currentSlide ? (currentSlide.isZoomFlow ? currentSlide.id : currentSlide.parentFlowSlideId) : null);
        let targetIdx = -1;

        if (parentId) {
          targetIdx = window.state.slides.findIndex(s => s.parentFlowSlideId === parentId && s.flowNodeId === targetNode.id);
        }
        if (targetIdx === -1 && parentId) {
          targetIdx = window.state.slides.findIndex(s => s.parentFlowSlideId === parentId && s.flowNodeIndex === nodeIdx);
        }
        if (targetIdx === -1) {
          targetIdx = window.state.slides.findIndex(s => s.isFlowChild && s.flowNodeId === targetNode.id);
        }
        if (targetIdx === -1) {
          targetIdx = window.state.slides.findIndex(s => s.isFlowChild && s.flowNodeIndex === nodeIdx);
        }

        // Auto-generate missing child slides if not found yet
        if (targetIdx === -1 && window.zoomFlowEngine) {
          const parentSlide = (parentId && window.state.slides.find(s => s.id === parentId)) || currentSlide;
          if (parentSlide) {
            const flowNodes = parentSlide.zoomFlowData?.nodes || nodes;
            const themeKey = parentSlide.zoomFlowData?.theme || 'udes-emerald';
            parentSlide.childSlideIds = parentSlide.childSlideIds || [];
            const pIdx = window.state.slides.indexOf(parentSlide);

            flowNodes.forEach((n, i) => {
              let existing = window.state.slides.find(s =>
                (s.parentFlowSlideId === parentSlide.id && (s.flowNodeId === n.id || s.flowNodeIndex === i)) ||
                (parentSlide.childSlideIds.includes(s.id) && s.flowNodeIndex === i)
              );
              if (!existing) {
                const child = window.zoomFlowEngine.generateChildSlide(n, parentSlide.id, i, flowNodes.length, themeKey);
                parentSlide.childSlideIds.push(child.id);
                window.state.slides.splice(pIdx + 1 + i, 0, child);
              }
            });

            targetIdx = window.state.slides.findIndex(s => s.parentFlowSlideId === parentSlide.id && (s.flowNodeId === targetNode.id || s.flowNodeIndex === nodeIdx));
            if (targetIdx === -1) {
              targetIdx = window.state.slides.findIndex(s => s.isFlowChild && (s.flowNodeId === targetNode.id || s.flowNodeIndex === nodeIdx));
            }
            if (window.slideManager) {
              window.slideManager.renderThumbnails();
            }
          }
        }

        if (targetIdx !== -1) {
          if (window.presenterEngine && window.presenterEngine.isActive) {
            window.presenterEngine.goToSlide(targetIdx);
          } else {
            controller.zoomToNodeFullscreen(nodeIdx, () => {
              window.state.setActiveSlideIndex(targetIdx);
            });
          }
        }
      }
    };

    controller.navigateToChildSlide = navigateToChildSlide;

    // Attach click handlers to nodes and jump buttons
    nodeElements.forEach((nodeEl, idx) => {
      nodeEl.addEventListener('click', (e) => {
        if (nodeEl._justDragged) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        if (isPresenter || (window.presenterEngine && window.presenterEngine.isActive)) {
          // In presenter mode, clicking an associated bloc in overview mode immediately jumps to that slide!
          navigateToChildSlide(idx);
        } else if (isEditor) {
          // Select node in Flow Diagram inspector
          if (window.app && typeof window.app.selectFlowNode === 'function') {
            window.app.selectFlowNode(idx);
          }
          controller.zoomToNode(idx);
        } else if (isPreview) {
          if (controller.activeNodeIndex === idx) {
            controller.zoomToOverview();
          } else {
            controller.zoomToNode(idx);
          }
        } else {
          navigateToChildSlide(idx);
        }
      });

      nodeEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        navigateToChildSlide(idx);
      });

      nodeEl.querySelector('.zf-node-jump-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToChildSlide(idx);
      });

      nodeEl.querySelector('.zf-btn-zoom-nested')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToChildSlide(idx);
      });

      nodeEl.querySelector('.zf-btn-open-nested')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateToChildSlide(idx);
      });
    });

    // Clicking empty space zooms back to overview
    wrapper.addEventListener('click', (e) => {
      if (
        e.target.closest('.zf-diagram-header') ||
        e.target.closest('.zoom-flow-editor-banner') ||
        e.target.closest('.zoom-flow-node') ||
        e.target.closest('.zf-toolbar-btn') ||
        e.target.closest('.presenter-zoom-hud')
      ) {
        return;
      }
      controller.zoomToOverview();
    });

    // If on editor canvas, add quick Floating Editor Banner
    if (isEditor) {
      const banner = document.createElement('div');
      banner.className = 'zoom-flow-editor-banner';
      banner.innerHTML = `
        <div class="zf-banner-tag">
          <i class="fa-solid fa-diagram-project"></i>
          <span>Flow Diagram</span>
        </div>
        <button class="zf-banner-btn" id="btn-banner-add-node" title="Add a New Node / Step">
          <i class="fa-solid fa-plus"></i> Add Node
        </button>
        <button class="zf-banner-btn" id="btn-reset-zoom-flow" title="Reset Camera to Overview">
          <i class="fa-solid fa-compress"></i> Overview
        </button>
      `;
      wrapper.appendChild(banner);

      banner.querySelector('#btn-banner-add-node')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app && typeof window.app.addNodeToActiveFlow === 'function') {
          window.app.addNodeToActiveFlow();
        }
      });

      banner.querySelector('#btn-reset-zoom-flow')?.addEventListener('click', (e) => {
        e.stopPropagation();
        controller.zoomToOverview();
      });
    }

    return controller;
  }
}

window.ZoomFlowEngine = ZoomFlowEngine;
