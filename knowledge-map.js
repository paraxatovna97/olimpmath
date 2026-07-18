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
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // ─── NODE BODY — GLASS EFFECT ───
            const color = node.color || '#4F46E5';
            ctx.globalAlpha = finalAlpha;

            // Shadow
            if (isActive || finalGlow > 0.1) {
                ctx.shadowColor = `rgba(79, 70, 229, ${0.15 * finalGlow})`;
                ctx.shadowBlur = 30 * finalGlow;
            } else {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 12;
            }

            // Main gradient — glass
            const grad = ctx.createRadialGradient(
                pos.x - finalR * 0.25, pos.y - finalR * 0.3, 0,
                pos.x, pos.y, finalR
            );
            const lightColor = lightenColor(color, 35);
            const darkColor = darkenColor(color, 25);
            grad.addColorStop(0, lightColor);
            grad.addColorStop(0.5, color);
            grad.addColorStop(1, darkColor);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, finalR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // ─── INNER GLOW (Apple style specular) ───
            const innerGlow = ctx.createRadialGradient(
                pos.x - finalR * 0.2, pos.y - finalR * 0.25, 0,
                pos.x, pos.y, finalR
            );
            innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            innerGlow.addColorStop(0.4, 'rgba(255, 255, 255, 0.03)');
            innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, finalR, 0, Math.PI * 2);
            ctx.fill();

            // ─── BORDER — Premium glass edge ───
            const borderAlpha = 0.04 + 0.12 * finalGlow + (isActive ? 0.12 : 0);
            ctx.strokeStyle = `rgba(255, 255, 255, ${borderAlpha})`;
            ctx.lineWidth = 1.2 + 0.5 * finalGlow;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, finalR - 0.5, 0, Math.PI * 2);
            ctx.stroke();

            // ─── TEXT ───
            ctx.globalAlpha = finalAlpha * (0.85 + 0.15 * finalGlow);
            ctx.fillStyle = '#FFFFFF';
            const fontSize = Math.max(10, 13 * Math.min(1, scale * 0.8));
            ctx.font = `${fontSize}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Text shadow for readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 8;
            ctx.fillText(node.label, pos.x, pos.y);
            ctx.shadowBlur = 0;

            // ─── MASTERY RING ───
            if (node.mastery !== undefined && node.mastery > 0) {
                const ringR = finalR + 5;
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (node.mastery / 100) * Math.PI * 2;
                ctx.globalAlpha = finalAlpha * 0.4;

                // Background ring
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, ringR, 0, Math.PI * 2);
                ctx.stroke();

                // Progress ring
                ctx.strokeStyle = isActive ?
                    `rgba(79, 70, 229, 0.7)` :
                    `rgba(79, 70, 229, 0.5)`;
                ctx.lineWidth = 2.5;
                if (isActive) {
                    ctx.shadowColor = 'rgba(79, 70, 229, 0.25)';
                    ctx.shadowBlur = 10;
                }
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, ringR, startAngle, endAngle);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            ctx.globalAlpha = 1;
        }
    }

    // ─── DRAW STARS ───
    function drawStars(time) {
        const w = starCanvas.width;
        const h = starCanvas.height;
        starCtx.clearRect(0, 0, w, h);

        for (const star of stars) {
            const x = star.x * w;
            const y = star.y * h;
            const brightness = star.brightness * (0.7 + 0.3 * Math.sin(time * star.speed + star.phase));
            const alpha = 0.3 + 0.7 * brightness;
            starCtx.globalAlpha = alpha;
            starCtx.fillStyle = '#FFFFFF';
            starCtx.beginPath();
            starCtx.arc(x, y, star.radius * (0.8 + 0.2 * brightness), 0, Math.PI * 2);
            starCtx.fill();
        }
        starCtx.globalAlpha = 1;
    }

    // ─── DRAW BACKGROUND ───
    function drawBackground() {
        const w = canvas.width;
        const h = canvas.height;

        // Deep space gradient
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, 'rgba(15, 10, 30, 1)');
        grad.addColorStop(0.3, 'rgba(12, 8, 25, 1)');
        grad.addColorStop(0.6, 'rgba(8, 6, 18, 1)');
        grad.addColorStop(1, 'rgba(5, 4, 10, 1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Nebula 1 - purple
        const nebula = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.6);
        nebula.addColorStop(0, 'rgba(79, 70, 229, 0.04)');
        nebula.addColorStop(0.5, 'rgba(124, 58, 237, 0.02)');
        nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, w, h);

        // Nebula 2 - cyan
        const nebula2 = ctx.createRadialGradient(w * 0.7, h * 0.8, 0, w * 0.7, h * 0.8, w * 0.5);
        nebula2.addColorStop(0, 'rgba(34, 211, 238, 0.03)');
        nebula2.addColorStop(0.6, 'rgba(79, 70, 229, 0.01)');
        nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, w, h);

        // Vignette
        const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.9);
        vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vg.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);
    }

    // ─── COLOR HELPERS ───
    function lightenColor(hex, amt) {
        let c = hexToRgb(hex);
        return `rgb(${Math.min(255, c.r + amt)}, ${Math.min(255, c.g + amt)}, ${Math.min(255, c.b + amt)})`;
    }

    function darkenColor(hex, amt) {
        let c = hexToRgb(hex);
        return `rgb(${Math.max(0, c.r - amt)}, ${Math.max(0, c.g - amt)}, ${Math.max(0, c.b - amt)})`;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 79, g: 70, b: 229 };
    }

    // ─── ZOOM ───
    function zoomAt(factor, cx, cy) {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
        if (newScale === scale) return;
        const world = screenToWorld(cx, cy);
        offsetX = cx - world.x * newScale;
        offsetY = cy - world.y * newScale;
        scale = newScale;
    }

    function zoomToNode(node) {
        const targetScale = Math.min(1.2, Math.max(0.8, 700 / (node.radius * 2)));
        const targetX = canvas.width / 2 - node.rx * targetScale;
        const targetY = canvas.height / 2 - node.ry * targetScale;
        animatingTo = node;
        node._targetX = targetX;
        node._targetY = targetY;
        node._targetScale = targetScale;
        animStartX = offsetX;
        animStartY = offsetY;
        animStartScale = scale;
        animProgress = 0;
        selectedNode = node;
    }

    // ─── MAIN LOOP ───
    function render(timestamp) {
        const time = timestamp || performance.now();

        // Animate to target
        if (animatingTo) {
            animProgress += 0.025;
            if (animProgress >= 1) {
                animProgress = 1;
                animatingTo = null;
            }
            const ease = 1 - Math.pow(1 - animProgress, 3);
            offsetX = animStartX + (animatingTo ? animatingTo._targetX - animStartX : 0) * ease;
            offsetY = animStartY + (animatingTo ? animatingTo._targetY - animStartY : 0) * ease;
            scale = animStartScale + (animatingTo ? animatingTo._targetScale - animStartScale : 0) * ease;
        }

        drawBackground();
        drawStars(time);
        drawEdges(time);
        drawNodes(time);

        updateMinimap();

        frameId = requestAnimationFrame(render);
    }

    // ─── MINIMAP ───
    function updateMinimap() {
        const mw = minimapCanvas.width;
        const mh = minimapCanvas.height;
        const mc = minimapCtx;

        mc.clearRect(0, 0, mw, mh);

        // Background
        mc.fillStyle = 'rgba(7, 7, 13, 0.6)';
        mc.fillRect(0, 0, mw, mh);

        // Find bounds
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const node of nodes) {
            if (node.rx < minX) minX = node.rx;
            if (node.ry < minY) minY = node.ry;
            if (node.rx > maxX) maxX = node.rx;
            if (node.ry > maxY) maxY = node.ry;
        }
        const pad = 40;
        minX -= pad;
        minY -= pad;
        maxX += pad;
        maxY += pad;
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const aspect = rangeX / rangeY;
        let drawW, drawH;
        if (aspect > mw / mh) {
            drawW = mw * 0.8;
            drawH = drawW / aspect;
        } else {
            drawH = mh * 0.8;
            drawW = drawH * aspect;
        }
        const ox = (mw - drawW) / 2;
        const oy = (mh - drawH) / 2;

        const toMinimap = (wx, wy) => {
            const x = ox + ((wx - minX) / rangeX) * drawW;
            const y = oy + ((wy - minY) / rangeY) * drawH;
            return { x, y };
        };

        // Edges
        mc.strokeStyle = 'rgba(255,255,255,0.05)';
        mc.lineWidth = 0.5;
        for (const edge of edges) {
            const f = toMinimap(edge.from.rx, edge.from.ry);
            const t = toMinimap(edge.to.rx, edge.to.ry);
            mc.beginPath();
            mc.moveTo(f.x, f.y);
            mc.lineTo(t.x, t.y);
            mc.stroke();
        }

        // Nodes
        for (const node of nodes) {
            const p = toMinimap(node.rx, node.ry);
            const r = Math.max(2, 4 * (node.radius / BASE_RADIUS));
            mc.fillStyle = node.color || '#4F46E5';
            mc.globalAlpha = 0.7;
            mc.beginPath();
            mc.arc(p.x, p.y, r, 0, Math.PI * 2);
            mc.fill();
            mc.globalAlpha = 1;
        }

        // Viewport
        const vx = ox + ((0 - minX) / rangeX) * drawW;
        const vy = oy + ((0 - minY) / rangeY) * drawH;
        const vw = (canvas.width / (scale * rangeX)) * drawW;
        const vh = (canvas.height / (scale * rangeY)) * drawH;
        minimapViewport.style.left = (vx - 1) + 'px';
        minimapViewport.style.top = (vy - 1) + 'px';
        minimapViewport.style.width = Math.min(mw - vx, vw + 2) + 'px';
        minimapViewport.style.height = Math.min(mh - vy, vh + 2) + 'px';
    }

    function updateMinimapViewport() {
        // triggered on resize
    }

    // ─── EVENTS ───
    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Cursor glow
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';

        // Hover
        let found = null;
        for (const node of nodes) {
            if (isNodeHovered(node, mx, my)) {
                found = node;
                break;
            }
        }

        if (found !== hoveredNode) {
            hoveredNode = found;
            if (hoveredNode) {
                tooltipTitle.textContent = hoveredNode.label;
                tooltipSubtitle.textContent = `Difficulty: ${hoveredNode.difficulty || 1}`;
                const mastery = hoveredNode.mastery || 0;
                tooltipFill.style.width = mastery + '%';
                tooltipLabel.textContent = mastery + '%';
                tooltip.classList.add('visible');
                const pos = getNodeScreen(hoveredNode);
                const r = getNodeRadius(hoveredNode);
                let tx = pos.x + r + 16;
                let ty = pos.y - 20;
                if (tx + 200 > canvas.width) tx = pos.x - r - 16 - 200;
                if (ty + 80 > canvas.height) ty = canvas.height - 80;
                if (ty < 20) ty = 20;
                tooltip.style.left = Math.max(10, tx) + 'px';
                tooltip.style.top = Math.max(10, ty) + 'px';
            } else {
                tooltip.classList.remove('visible');
            }
            canvas.style.cursor = found ? 'pointer' : isDragging ? 'grabbing' : 'grab';
        }

        // Parallax for nodes
        const px = (e.clientX / window.innerWidth - 0.5) * 2;
        const py = (e.clientY / window.innerHeight - 0.5) * 2;
        const shift = 4 * (1 - scale / MAX_SCALE);
        for (const node of nodes) {
            node._parallaxX = px * shift;
            node._parallaxY = py * shift;
        }
    }

    function onMouseDown(e) {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragOffsetX = offsetX;
        dragOffsetY = offsetY;
        canvas.style.cursor = 'grabbing';
    }

    function onMouseUp(e) {
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && hoveredNode) {
                hoveredNode.clickScale = 0.92;
                setTimeout(() => {
                    if (hoveredNode) {
                        hoveredNode.clickScale = 1;
                        zoomToNode(hoveredNode);
                    }
                }, 120);
            }
            isDragging = false;
            canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
        }
    }

    function onMouseDrag(e) {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        offsetX = dragOffsetX + dx;
        offsetY = dragOffsetY + dy;
    }

    function onWheel(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        zoomAt(factor, cx, cy);
    }

    function onKeyDown(e) {
        if (e.ctrlKey && e.key === '=') {
            e.preventDefault();
            zoomAt(1.1, canvas.width / 2, canvas.height / 2);
        } else if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            zoomAt(0.9, canvas.width / 2, canvas.height / 2);
        } else if (e.key === 'Escape') {
            animatingTo = null;
            offsetX = canvas.width / 2;
            offsetY = canvas.height / 2;
            scale = 1;
            selectedNode = null;
        }
    }

    // ─── EXPOSE PUBLIC API ───
    window.OlympMath = {
        nodes: () => nodes,
        edges: () => edges,
        zoomToNode: zoomToNode,
        zoomAt: zoomAt,
        getScale: () => scale,
        getOffset: () => ({ x: offsetX, y: offsetY }),
        resetView: () => {
            animatingTo = null;
            offsetX = canvas.width / 2;
            offsetY = canvas.height / 2;
            scale = 1;
            selectedNode = null;
        }
    };

    // ─── INIT ───
    function init() {
        initNodes();
        initStars();
        resize();

        offsetX = canvas.width / 2;
        offsetY = canvas.height / 2;
        scale = 1;

        window.addEventListener('resize', resize);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseDrag);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKeyDown);

        // Touch support
        let touchStartX = 0,
            touchStartY = 0;
        let touchOffsetX = 0,
            touchOffsetY = 0;
        let lastTouchDist = 0;
        let isTouching = false;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches;
            if (t.length === 1) {
                isTouching = true;
                touchStartX = t[0].clientX;
                touchStartY = t[0].clientY;
                touchOffsetX = offsetX;
                touchOffsetY = offsetY;
            } else if (t.length === 2) {
                const dx = t[0].clientX - t[1].clientX;
                const dy = t[0].clientY - t[1].clientY;
                lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches;
            if (t.length === 1 && isTouching) {
                const dx = t[0].clientX - touchStartX;
                const dy = t[0].clientY - touchStartY;
                offsetX = touchOffsetX + dx;
                offsetY = touchOffsetY + dy;
            } else if (t.length === 2) {
                const dx = t[0].clientX - t[1].clientX;
                const dy = t[0].clientY - t[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const factor = dist / lastTouchDist;
                if (factor > 0.1 && factor < 10) {
                    const rect = canvas.getBoundingClientRect();
                    const cx = (t[0].clientX + t[1].clientX) / 2 - rect.left;
                    const cy = (t[0].clientY + t[1].clientY) / 2 - rect.top;
                    zoomAt(factor, cx, cy);
                }
                lastTouchDist = dist;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            isTouching = false;
            if (e.changedTouches.length === 1 && hoveredNode) {
                hoveredNode.clickScale = 0.92;
                setTimeout(() => {
                    if (hoveredNode) {
                        hoveredNode.clickScale = 1;
                        zoomToNode(hoveredNode);
                    }
                }, 120);
            }
        });

        render(performance.now());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
