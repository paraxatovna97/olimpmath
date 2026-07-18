(function() {
    // ─── CANVAS SOZLAMALARI ───
    const canvas = document.getElementById('knowledge-map-canvas');
    const ctx = canvas.getContext('2d');

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    let nodes = [];
    let hoveredNode = null;
    let selectedNode = null;
    let animatingTo = null;
    let animProgress = 0;
    let animStartX, animStartY, animStartScale;

    // ─── SIDEBAR LABELS & LOGIC ───
    const panel = document.getElementById('node-panel');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = document.getElementById('panel-close');
    const panelCategory = document.getElementById('panel-category');
    const panelTitle = document.getElementById('panel-title');
    const panelDifficulty = document.getElementById('panel-difficulty');
    const panelProgressText = document.getElementById('panel-progress-text');
    const panelProgressBar = document.getElementById('panel-progress-bar');
    const panelDescription = document.getElementById('panel-description');
    const panelPrereqs = document.getElementById('panel-prereqs');
    const panelCta = document.getElementById('panel-cta');
    let isPanelOpen = false;
    let currentNodeId = null;

    const NODE_DETAILS = {
        matematika: {
            category: 'FOUNDATION',
            description: 'Matematika — miqdor, tuzilma, fazo va o\'zgarishlarni o\'rganuvchi fundamental fan. Barcha matematik bilimlarning asosi.',
            prerequisites: []
        },
        algebra: {
            category: 'ALGEBRA',
            description: 'Algebra — sonlar va matematik ifodalar ustida amallar bajarish, tenglamalar va tengsizliklarni yechish haqidagi fan.',
            prerequisites: ['arifmetika']
        },
        geometriya: {
            category: 'GEOMETRY',
            description: 'Geometriya — fazodagi shakllar, ularning xossalari, o\'lchamlari va o\'zaro munosabatlarini o\'rganuvchi fan.',
            prerequisites: ['arifmetika']
        },
        arifmetika: {
            category: 'ARITHMETIC',
            description: 'Arifmetika — sonlar ustida qo\'shish, ayirish, ko\'paytirish va bo\'lish amallarini o\'rganuvchi matematikaning asosiy bo\'limi.',
            prerequisites: []
        },
        trigonometriya: {
            category: 'TRIGONOMETRY',
            description: 'Trigonometriya — uchburchaklar, burchaklar va ular orasidagi munosabatlarni o\'rganuvchi fan.',
            prerequisites: ['geometriya', 'algebra']
        },
        sonlar: {
            category: 'NUMBER THEORY',
            description: 'Sonlar nazariyasi — butun sonlar, ularning xossalari va munosabatlarini o\'rganuvchi matematika bo\'limi.',
            prerequisites: ['arifmetika']
        },
        tenglamalar: {
            category: 'EQUATIONS',
            description: 'Tenglamalar — noma\'lum miqdorlarni topish usullari va ularni yechish metodlari haqidagi fan.',
            prerequisites: ['algebra']
        },
        tengsizliklar: {
            category: 'INEQUALITIES',
            description: 'Tengsizliklar — ifodalar orasidagi munosabatlarni, ularning solishtirilishi va isbotlash usullarini o\'rganadi.',
            prerequisites: ['algebra']
        },
        funksiyalar: {
            category: 'FUNCTIONS',
            description: 'Funksiyalar — o\'zgaruvchilar orasidagi bog\'liqlikni ifodalovchi matematik tushuncha.',
            prerequisites: ['algebra']
        },
        ketma-ketliklar: {
            category: 'SEQUENCES',
            description: 'Ketma-ketliklar — sonlarning qonuniyatli tartibda joylashishi va ularning xossalari.',
            prerequisites: ['algebra', 'funksiyalar']
        },
        kombinatorika: {
            category: 'COMBINATORICS',
            description: 'Kombinatorika — obyektlarni tanlash, joylashtirish va guruhlash usullarini o\'rganuvchi fan.',
            prerequisites: ['arifmetika']
        },
        ehtimollar: {
            category: 'PROBABILITY',
            description: 'Ehtimollar nazariyasi — tasodifiy hodisalarning yuz berish ehtimolini o\'rganuvchi matematika bo\'limi.',
            prerequisites: ['kombinatorika']
        },
        analitik: {
            category: 'ANALYTIC GEOMETRY',
            description: 'Analitik geometriya — geometrik shakllarni koordinatalar va algebraik tenglamalar orqali o\'rganadi.',
            prerequisites: ['geometriya', 'algebra']
        },
        graflar: {
            category: 'GRAPH THEORY',
            description: 'Graflar nazariyasi — tugunlar va ular orasidagi bog\'lanishlarni o\'rganuvchi matematika bo\'limi.',
            prerequisites: ['kombinatorika']
        },
        mantiq: {
            category: 'LOGIC',
            description: 'Matematik mantiq — to\'g\'ri fikrlash, isbotlash va matematik mulohazalarni o\'rganuvchi fan.',
            prerequisites: ['sonlar']
        },
        olimpiada: {
            category: 'OLYMPIAD',
            description: 'Olimpiada strategiyalari — murakkab masalalarni yechish, nostandart yondashuvlar va tanlovlarga tayyorgarlik.',
            prerequisites: ['algebra', 'geometriya', 'kombinatorika']
        }
    };

    function getNodeDetails(nodeId) {
        return NODE_DETAILS[nodeId] || {
            category: 'MATHEMATICS',
            description: 'Matematik bilimlar tarmog\'i.',
            prerequisites: []
        };
    }

    function getPrereqState(prereqId) {
        const node = nodes.find(n => n.id === prereqId);
        if (!node) return 'locked';
        const mastery = node.mastery || 0;
        if (mastery >= 80) return 'mastered';
        if (mastery > 0) return 'available';
        return 'locked';
    }

    function openPanel(nodeId) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        currentNodeId = nodeId;
        const details = getNodeDetails(nodeId);

        panelCategory.textContent = details.category;
        panelCategory.style.color = node.color || '#4F46E5';
        panelTitle.textContent = node.label;
        panelDifficulty.textContent = `${node.difficulty || 1} / 5`;
        
        const mastery = node.mastery || 0;
        panelProgressText.textContent = `${mastery}%`;
        panelProgressBar.style.width = `${mastery}%`;
        panelDescription.textContent = details.description;
        
        panelPrereqs.innerHTML = '';
        if (details.prerequisites.length === 0) {
            const empty = document.createElement('span');
            empty.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.2);';
            empty.textContent = 'Hech qanday prerequisite yo\'q';
            panelPrereqs.appendChild(empty);
        } else {
            details.prerequisites.forEach(prereqId => {
                const prereqNode = nodes.find(n => n.id === prereqId);
                const state = getPrereqState(prereqId);
                const chip = document.createElement('span');
                chip.className = `prereq-chip ${state}`;
                chip.innerHTML = `<span class="dot"></span> ${prereqNode ? prereqNode.label : prereqId}`;
                
                if (state === 'available' || state === 'mastered') {
                    chip.addEventListener('click', () => {
                        const target = nodes.find(n => n.id === prereqId);
                        if (target) {
                            closePanel();
                            setTimeout(() => zoomToNode(target), 350);
                        }
                    });
                }
                panelPrereqs.appendChild(chip);
            });
        }

        const state = getPrereqState(nodeId);
        if (state === 'locked') {
            panelCta.textContent = '🔒 Locked';
            panelCta.disabled = true;
            panelCta.className = 'panel-cta locked';
        } else if (node.mastery && node.mastery >= 80) {
            panelCta.textContent = '🔄 Review';
            panelCta.disabled = false;
            panelCta.className = 'panel-cta mastered';
        } else if (node.mastery && node.mastery > 0) {
            panelCta.textContent = '▶ Continue';
            panelCta.disabled = false;
            panelCta.className = 'panel-cta';
        } else {
            panelCta.textContent = '▶ Start';
            panelCta.disabled = false;
            panelCta.className = 'panel-cta';
        }

        isPanelOpen = true;
        panel.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        selectedNode = node;
    }

    function closePanel() {
        isPanelOpen = false;
        panel.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!isPanelOpen) {
                selectedNode = null;
            }
        }, 350);
    }

    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isPanelOpen) {
            closePanel();
        }
    });

    let originalZoomToNode = zoomToNode;
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
    originalZoomToNode = zoomToNode;

    // Zoom trigger with Panel
    zoomToNode = function(node) {
        if (isPanelOpen) {
            closePanel();
            setTimeout(() => {
                originalZoomToNode(node);
            }, 350);
        } else {
            originalZoomToNode(node);
            setTimeout(() => {
                openPanel(node.id);
            }, 500);
        }
    };

    panelCta.addEventListener('click', function() {
        if (this.disabled) return;
        if (currentNodeId) {
            const node = nodes.find(n => n.id === currentNodeId);
            if (node) {
                console.log(`Starting/continuing: ${node.label}`);
            }
        }
    });

    function onMouseUp(e) {
        if (isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && hoveredNode) {
                hoveredNode.clickScale = 0.92;
                const targetNode = hoveredNode;
                setTimeout(() => {
                    if (targetNode) {
                        targetNode.clickScale = 1;
                        if (isPanelOpen) {
                            closePanel();
                            setTimeout(() => {
                                originalZoomToNode(targetNode);
                                setTimeout(() => openPanel(targetNode.id), 500);
                            }, 350);
                        } else {
                            originalZoomToNode(targetNode);
                            setTimeout(() => openPanel(targetNode.id), 500);
                        }
                    }
                }, 120);
            }
            isDragging = false;
            canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
        }
    }

    window.OlympMath = {
        init: function(data) {
            nodes = data.nodes || [];
            // Boshqa canvas chizish logikalari shu yerda davom etadi...
            canvas.addEventListener('mouseup', onMouseUp);
        },
        zoomToNode: zoomToNode,
        openPanel: openPanel,
        closePanel: closePanel
    };
})();
