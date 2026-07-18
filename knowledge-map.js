(function() {
    'use strict';

    // ─── DOM REFS ───
    const canvas = document.getElementById('knowledge-canvas');
    const ctx = canvas.getContext('2d');
    const starCanvas = document.getElementById('starfield');
    const starCtx = starCanvas.getContext('2d');
    const minimapCanvas = document.getElementById('minimap-canvas');
    const minimapCtx = minimapCanvas.getContext('2d');
    const minimapViewport = document.getElementById('minimap-viewport');
    const tooltip = document.getElementById('tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipSubtitle = document.getElementById('tooltip-subtitle');
    const tooltipFill = document.getElementById('tooltip-fill');
    const tooltipLabel = document.getElementById('tooltip-label');
    const cursorGlow = document.getElementById('cursor-glow');

    // ─── NODE DATA ───
    const DOMAINS = [
        { id: 'matematika', label: 'Matematika', x: 0, y: 0, radius: 60, color: '#4F46E5', difficulty: 1,
        mastery: 85 },
        { id: 'arifmetika', label: 'Arifmetika', x: -280, y: -160, radius: 44, color: '#22D3EE', difficulty: 1,
            mastery: 92 },
        { id: 'algebra', label: 'Algebra', x: -160, y: -280, radius: 44, color: '#7C3AED', difficulty: 3,
            mastery: 78 },
        { id: 'geometriya', label: 'Geometriya', x: 160, y: -280, radius: 44, color: '#10B981', difficulty: 3,
            mastery: 65 },
        { id: 'trigonometriya', label: 'Trigonometriya', x: 280, y: -160, radius: 44, color: '#F59E0B',
            difficulty: 4, mastery: 42 },
        { id: 'sonlar', label: 'Sonlar nazariyasi', x: -320, y: 0, radius: 44, color: '#F43F5E', difficulty: 4,
            mastery: 38 },
        { id: 'tenglamalar', label: 'Tenglamalar', x: -240, y: 120, radius: 44, color: '#22D3EE', difficulty: 2,
            mastery: 85 },
        { id: 'tengsizliklar', label: 'Tengsizliklar', x: -120, y: 240, radius: 44, color: '#7C3AED',
            difficulty: 3, mastery: 70 },
        { id: 'funksiyalar', label: 'Funksiyalar', x: 120, y: 240, radius: 44, color: '#10B981', difficulty: 3,
            mastery: 60 },
        { id: 'ketma-ketliklar', label: 'Ketma-ketliklar', x: 240, y: 120, radius: 44, color: '#F59E0B',
            difficulty: 4, mastery: 45 },
        { id: 'kombinatorika', label: 'Kombinatorika', x: -200, y: -80, radius: 40, color: '#F43F5E',
            difficulty: 5, mastery: 30 },
        { id: 'ehtimollar', label: 'Ehtimollar', x: 200, y: -80, radius: 40, color: '#22D3EE', difficulty: 5,
            mastery: 28 },
        { id: 'analitik', label: 'Analitik geometriya', x: -80, y: -200, radius: 40, color: '#7C3AED',
            difficulty: 4, mastery: 50 },
        { id: 'graflar', label: 'Graflar nazariyasi', x: 80, y: -200, radius: 40, color: '#10B981',
            difficulty: 5, mastery: 25 },
        { id: 'mantiq', label: 'Matematik mantiq', x: -200, y: 200, radius: 40, color: '#F59E0B', difficulty: 4,
            mastery: 35 },
        { id: 'olimpiada', label: 'Olimpiada strategiyalari', x: 200, y: 200, radius: 40, color: '#F43F5E',
            difficulty: 6, mastery: 20 },
    ];

    const EDGES = [
        ['matematika', 'arifmetika'],
        ['matematika', 'algebra'],
        ['matematika', 'geometriya'],
        ['matematika', 'trigonometriya'],
        ['matematika', 'sonlar'],
        ['matematika', 'kombinatorika'],
        ['matematika', 'ehtimollar'],
        ['matematika', 'olimpiada'],
        ['algebra', 'tenglamalar'],
        ['algebra', 'tengsizliklar'],
        ['algebra', 'funksiyalar'],
        ['algebra', 'ketma-ketliklar'],
        ['geometriya', 'analitik'],
        ['geometriya', 'trigonometriya'],
        ['sonlar', 'mantiq'],
        ['sonlar', 'graflar'],
        ['tenglamalar', 'tengsizliklar'],
        ['funksiyalar', 'ketma-ketliklar'],
        ['kombinatorika', 'ehtimollar'],
    ];

    // ─── STATE ───
    let nodes = [];
    let edges = [];
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let hoveredNode = null;
    let selectedNode = null;
    let animatingTo = null;
    let animProgress = 0;
    let animStartX = 0;
    let animStartY = 0;
    let animStartScale = 0;
    let stars = [];
    let frameId = null;
    let startTime = 0;

    // ─── CONSTANTS ───
    const MIN_SCALE = 0.2;
    const MAX_SCALE = 2.5;
    const BASE_RADIUS = 60;
    const GLOW_BREATH_SPEED = 0.002;
    const EDGE_ANIMATION_SPEED = 0.006;
    const ENTRY_DURATION = 800;
    const STAGGER_INTERVAL = 40;

    // ─── NODE HELPER ───
    function buildNode(data, index) {
        return {
            ...data,
            rx: data.x,
            ry: data.y,
            radius: data.radius || 44,
            scale: 1,
            glow: 0,
            breathPhase: Math.random() * Math.PI * 2,
            targetScale: 1,
            currentScale: 1,
            clickScale: 1,
            entryDelay: index === 0 ? 0 : 400 + (index - 1) * STAGGER_INTERVAL,
            entryDone: false,
            entryScale: 0,
            entryOpacity: 0,
            _parallaxX: 0,
            _parallaxY: 0,
        };
    }

    function initNodes() {
        nodes = DOMAINS.map((d, i) => buildNode(d, i));
        edges = EDGES.map(([from, to]) => {
            const f = nodes.find(n => n.id === from);
            const t = nodes.find(n => n.id === to);
            return { from: f, to: t, progress: 0, done: false };
        });
    }

    // ─── STARS ───
    function initStars() {
        const count = 220;
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                radius: 0.5 + Math.random() * 1.8,
                brightness: 0.3 + Math.random() * 0.7,
                speed: 0.0003 + Math.random() * 0.0008,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    // ─── RESIZE ───
    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        starCanvas.width = w;
        starCanvas.height = h;
        minimapCanvas.width = 160;
        minimapCanvas.height = 100;
        updateMinimapViewport();
    }

    // ─── WORLD TRANSFORMS ───
    function worldToScreen(wx, wy) {
        return { x: wx * scale + offsetX, y: wy * scale + offsetY };
    }

    function screenToWorld(sx, sy) {
        return { x: (sx - offsetX) / scale, y: (sy - offsetY) / scale };
    }

    function getNodeScreen(node) {
        return worldToScreen(node.rx + (node._parallaxX || 0), node.ry + (node._parallaxY || 0));
    }

    function getNodeRadius(node) {
        return node.radius * scale * node.currentScale * node.clickScale;
    }

    function isNodeHovered(node, mx, my) {
        const pos = getNodeScreen(node);
        const r = getNodeRadius(node);
        const dx = mx - pos.x;
        const dy = my - pos.y;
        return dx * dx + dy * dy < r * r;
    }

    // ─── DRAW EDGES ───
    function drawEdges(time) {
        let allDone = true;

        for (const edge of edges) {
            if (!edge.done) {
                edge.progress = Math.min(1, edge.progress + EDGE_ANIMATION_SPEED);
                if (edge.progress >= 1) edge.done = true;
                allDone = false;
            }

            const progress = edge.done ? 1 : edge.progress;
            const f = getNodeScreen(edge.from);
            const t = getNodeScreen(edge.to);
            const fR = getNodeRadius(edge.from);
            const tR = getNodeRadius(edge.to);
            const dx = t.x - f.x;
            const dy = t.y - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) continue;

            const ux = dx / dist;
            const uy = dy / dist;
            const startX = f.x + ux * fR;
            const startY = f.y + uy * fR;
            const endX = t.x - ux * tR;
            const endY = t.y - uy * tR;

            const isHovered = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);
            const breath = 0.6 + 0.4 * (1 + Math.sin(time * GLOW_BREATH_SPEED + edge.from.breathPhase)) * 0.5;

            // Main line with progress
            const px = startX + (endX - startX) * progress;
            const py = startY + (endY - startY) * progress;

            if (isHovered) {
                // Glowing active edge
                const glowAlpha = 0.25 + 0.3 * breath;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(px, py);
                ctx.strokeStyle = `rgba(79, 70, 229, ${glowAlpha})`;
                ctx.lineWidth = 2.5 * Math.min(scale, 1.5);
                ctx.shadowColor = 'rgba(79, 70, 229, 0.3)';
                ctx.shadowBlur = 20;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Energy particles on hover
                const dotCount = 5;
                for (let i = 0; i < dotCount; i++) {
                    const tPos = (progress + i / dotCount) % 1;
                    const px2 = startX + (endX - startX) * tPos;
                    const py2 = startY + (endY - startY) * tPos;
                    const dotAlpha = 0.3 + 0.7 * (1 - Math.abs(tPos - 0.5) * 2);
                    const dotRadius = 1.5 + 2 * dotAlpha * Math.min(scale, 1.2);
                    ctx.beginPath();
                    ctx.arc(px2, py2, dotRadius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(79, 70, 229, ${0.6 * dotAlpha})`;
                    ctx.fill();
                }
            } else {
                // Normal edge
                const alpha = Math.min(0.35, 0.1 + 0.25 * progress);
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(px, py);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 1.2 * Math.min(scale, 1.5);
                ctx.shadowBlur = 0;
                ctx.stroke();

                // Subtle particles
                if (progress > 0.1 && progress < 0.9) {
                    const dotCount = 2;
                    for (let i = 0; i < dotCount; i++) {
                        const tPos = (progress + i / dotCount) % 1;
                        const px2 = startX + (endX - startX) * tPos;
                        const py2 = startY + (endY - startY) * tPos;
                        const dotAlpha = 0.2 + 0.5 * (1 - Math.abs(tPos - 0.5) * 2);
                        const dotRadius = 1 + 1.5 * dotAlpha * Math.min(scale, 1.2);
                        ctx.beginPath();
                        ctx.arc(px2, py2, dotRadius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * dotAlpha})`;
                        ctx.fill();
                    }
                }
            }
        }

        return allDone;
    }

    // ─── DRAW NODES ───
    function drawNodes(time) {
        const now = performance.now();

        for (const node of nodes) {
            // Entry animation
            if (!node.entryDone) {
                const elapsed = Math.max(0, now - node.entryDelay);
                const progress = Math.min(1, elapsed / ENTRY_DURATION);
                const ease = 1 - Math.pow(1 - progress, 3);
                node.entryScale = ease;
                node.entryOpacity = Math.min(1, ease * 1.5);
                if (progress >= 1) node.entryDone = true;
            }

            const entryScale = node.entryDone ? 1 : node.entryScale || 0;
            const finalAlpha = node.entryDone ? 1 : Math.min(1, node.entryOpacity || 0);

            const pos = getNodeScreen(node);
            const baseR = getNodeRadius(node);
            const r = baseR * Math.max(0.01, entryScale);

            // Breathing glow
            const breath = 0.5 + 0.5 * (1 + Math.sin(time * GLOW_BREATH_SPEED + node.breathPhase)) * 0.5;
            let glowIntensity = node.glow || 0;

            if (hoveredNode === node) {
                glowIntensity = Math.min(1, glowIntensity + 0.06);
            } else {
                glowIntensity = Math.max(0, glowIntensity - 0.025);
            }

            // Click animation
            if (node.clickScale !== 1) {
                node.clickScale += (1 - node.clickScale) * 0.08;
                if (Math.abs(node.clickScale - 1) < 0.001) node.clickScale = 1;
            }

            const finalR = r * node.clickScale;
            const finalGlow = glowIntensity * breath;
            const isActive = hoveredNode === node || selectedNode === node;

            // ─── OUTER GLOW ───
            if (finalGlow > 0.01 || isActive) {
                const glowR = finalR * (1 + 0.5 * (isActive ? 0.9 : 0.4));
                const glowAlpha = isActive ? 0.22 * finalGlow : 0.08 * finalGlow;
                const grad = ctx.createRadialGradient(pos.x, pos.y, finalR * 0.3, pos.x, pos.y, glowR);
                grad.addColorStop(0, `rgba(79, 70, 229, ${glowAlpha})`);
                grad.addColorStop(0.5, `rgba(79, 70, 229, ${glowAlpha * 0.3})`);
                grad.addColorStop(1, 'rgba(79, 70, 229, 0)');
                ctx.fillStyle = grad;
                ctx.globalAlpha = finalAlpha;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
                ctx.fill
