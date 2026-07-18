(function() {
    'use strict';

    // ─── DOM ELEMENTLAR VA CANVAS SOZLAMALARI ───
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

    // ─── NAVIGATSIYA VA ZOOM HOLATLARI ───
    let transform = { x: window.innerWidth / 2, y: window.innerHeight / 2, scale: 1 };
    let isDragging = false;
    let startDrag = { x: 0, y: 0 };
    let activeNode = null;
    let hoveredNode = null;
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 3.0;

    // ─── MA'LUMOTLARNI YUKLASH (KNOWLEDGE-MAP.JS DAN) ───
    // Global oyna (window) obyektidan ma'lumotlarni qidirish yoki modelga bog'lash
    const nodes = [
        { id: 'matematika', label: 'Matematika', x: 0, y: 0, radius: 55, color: '#4F46E5', difficulty: 1, mastery: 85 },
        { id: 'arifmetika', label: 'Arifmetika', x: -240, y: -140, radius: 40, color: '#22D3EE', difficulty: 1, mastery: 92 },
        { id: 'algebra', label: 'Algebra', x: -140, y: -260, radius: 42, color: '#7C3AED', difficulty: 3, mastery: 78 },
        { id: 'geometriya', label: 'Geometriya', x: 140, y: -260, radius: 42, color: '#10B981', difficulty: 3, mastery: 65 },
        { id: 'trigonometriya', label: 'Trigonometriya', x: 260, y: -140, radius: 40, color: '#F59E0B', difficulty: 4, mastery: 42 },
        { id: 'sonlar', label: 'Sonlar nazariyasi', x: -280, y: 0, radius: 40, color: '#F43F5E', difficulty: 4, mastery: 38 },
        { id: 'tenglamalar', label: 'Tenglamalar', x: -220, y: 140, radius: 40, color: '#22D3EE', difficulty: 2, mastery: 85 },
        { id: 'tengsizliklar', label: 'Tengsizliklar', x: -100, y: 240, radius: 40, color: '#7C3AED', difficulty: 3, mastery: 70 },
        { id: 'funksiyalar', label: 'Funksiyalar', x: 100, y: 240, radius: 40, color: '#10B981', difficulty: 3, mastery: 60 },
        { id: 'ketma-ketliklar', label: 'Ketma-ketliklar', x: 220, y: 140, radius: 40, color: '#F59E0B', difficulty: 4, mastery: 45 }
    ];

    const edges = [
        ['matematika', 'arifmetika'], ['matematika', 'algebra'], ['matematika', 'geometriya'],
        ['matematika', 'trigonometriya'], ['matematika', 'sonlar'], ['algebra', 'tenglamalar'],
        ['algebra', 'tengsizliklar'], ['algebra', 'funksiyalar'], ['algebra', 'ketma-ketliklar']
    ];

    // ─── CANVAS O'LCHAMLARINI MOSLASHTIRISH ───
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
        drawStars();
        render();
    }

    // Orqa fondagi yulduzlar (Starfield effect)
    function drawStars() {
        starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
        starCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 150; i++) {
            starCtx.beginPath();
            const x = (Math.sin(i * 99) + 1) * starCanvas.width / 2;
            const y = (Math.cos(i * 33) + 1) * starCanvas.height / 2;
            const r = (i % 3 === 0) ? 1.5 : 0.8;
            starCtx.arc(x, y, r, 0, Math.PI * 2);
            starCtx.fill();
        }
    }

    // ─── EKRANGA CHIZISH LOGIKASI (RENDER) ───
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.scale, transform.scale);

        // 1. Bog'lovchi chiziqlarni chizish (Edges)
        edges.forEach(edge => {
            const source = nodes.find(n => n.id === edge[0]);
            const target = nodes.find(n => n.id === edge[1]);
            if (!source || !target) return;

            ctx.beginPath();
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 2 / transform.scale;
            ctx.stroke();
        });

        // 2. Nodelarni chizish (Tugunlar)
        nodes.forEach(node => {
            const isHovered = hoveredNode === node;
            
            // Neon nur tarqalishi (Glow)
            ctx.save();
            ctx.shadowBlur = isHovered ? 24 : 12;
            ctx.shadowColor = node.color;
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = isHovered ? node.color : 'rgba(7, 7, 13, 0.85)';
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Matnni yozish
            ctx.fillStyle = isHovered ? '#FFFFFF' : '#E2E8F0';
            ctx.font = `600 ${14}px 'Inter', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, node.x, node.y);
        });

        ctx.restore();
        updateMinimap();
    }

    // ─── MINIMAP YANGILANISHI ───
    function updateMinimap() {
        minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // Minimap markazi
        const mmW = minimapCanvas.width;
        const mmH = minimapCanvas.height;
        
        minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        nodes.forEach(node => {
            const mx = mmW / 2 + node.x * 0.15;
            const my = mmH / 2 + node.y * 0.15;
            minimapCtx.beginPath();
            minimapCtx.arc(mx, my, 3, 0, Math.PI * 2);
            minimapCtx.fillStyle = node.color;
            minimapCtx.fill();
        });

        // Ko'rinish to'rtburchagi (Viewport locator)
        const vx = (mmW / 2) - (transform.x / transform.scale) * 0.15;
        const vy = (mmH / 2) - (transform.y / transform.scale) * 0.15;
        
        minimapViewport.style.width = `${Math.max(20, (canvas.width / transform.scale) * 0.15)}px`;
        minimapViewport.style.height = `${Math.max(15, (canvas.height / transform.scale) * 0.15)}px`;
        minimapViewport.style.left = `${Math.min(mmW - 30, Math.max(0, vx))}px`;
        minimapViewport.style.top = `${Math.min(mmH - 20, Math.max(0, vy))}px`;
    }

    // ─── KOORDINATALARNI HISOBLASH VA HODISALAR ───
    function getMousePos(e) {
        return { x: e.clientX, y: e.clientY };
    }

    function toCanvasCoords(e) {
        const pos = getMousePos(e);
        return {
            x: (pos.x - transform.x) / transform.scale,
            y: (pos.y - transform.y) / transform.scale
        };
    }

    window.addEventListener('mousedown', (e) => {
        if (e.target !== canvas) return;
        isDragging = true;
        const pos = getMousePos(e);
        startDrag = { x: pos.x - transform.x, y: pos.y - transform.y };
    });

    window.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        
        // Kursor ortidagi neon nur effekti
        cursorGlow.style.left = `${pos.x}px`;
        cursorGlow.style.top = `${pos.y}px`;

        if (isDragging) {
            transform.x = pos.x - startDrag.x;
            transform.y = pos.y - startDrag.y;
            render();
            return;
        }

        // Hover holatini tekshirish
        const cCoords = toCanvasCoords(e);
        let foundNode = null;

        for (let node of nodes) {
            const dist = Math.hypot(cCoords.x - node.x, cCoords.y - node.y);
            if (dist < node.radius) {
                foundNode = node;
                break;
            }
        }

        if (foundNode !== hoveredNode) {
            hoveredNode = foundNode;
            render();
            
            if (hoveredNode) {
                // Tooltipni yangilash va ko'rsatish
                tooltipTitle.textContent = hoveredNode.label;
                tooltipSubtitle.textContent = `Qiyinchilik: ${hoveredNode.difficulty}/6`;
                tooltipFill.style.width = `${hoveredNode.mastery}%`;
                tooltipLabel.textContent = `${hoveredNode.mastery}%`;
                
                tooltip.classList.add('visible');
                tooltip.style.left = `${pos.x + 15}px`;
                tooltip.style.top = `${pos.y + 15}px`;
            } else {
                tooltip.classList.remove('visible');
            }
        } else if (hoveredNode) {
            // Tooltipni kursor bilan birga surish
            tooltip.style.left = `${pos.x + 15}px`;
            tooltip.style.top = `${pos.y + 15}px`;
        }
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    // Sichqoncha g'ildiragi orqali yaqinlashtirish (Zoom)
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const pos = getMousePos(e);
        const cCoords = toCanvasCoords(e);

        const zoomFactor = 1.1;
        let newScale = e.deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        transform.x = pos.x - cCoords.x * newScale;
        transform.y = pos.y - cCoords.y * newScale;
        transform.scale = newScale;
        
        render();
    }, { passive: false });

    // Ekran o'lchami o'zgarganda moslashish
    window.addEventListener('resize', resize);
    
    // Ilk yuklanish
    setTimeout(() => {
        minimapCanvas.width = 160;
        minimapCanvas.height = 100;
        resize();
    }, 100);

})();
