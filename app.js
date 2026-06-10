/* ============================================================
   ZaibiTrack — Application JavaScript
   Société Zaibi — Lean Manufacturing App
   ============================================================ */

// ===== DATA =====
const APP_DATA = {
    gasoilWeekly: [52, 68, 95, 74, 61, 45, 58],
    gasoilDays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    costBefore: [8360, 6960, 2213, 2205, 1900],
    costAfter: [3200, 2400, 880, 1540, 760],
    costLabels: ['Pan. 580', 'Pan. 440', 'Câble', 'Gasoil', 'Struct.'],
    wasteMonths: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    wastePanneaux: [46, 38, 29, 22, 15, 12],
    wasteCable: [494, 480, 420, 350, 290, 210],
    wasteGasoil: [1110, 1050, 920, 840, 750, 680],
    auditHistory: {
        seiri: [3, 4],
        seiton: [2, 3],
        seiso: [3, 4],
        seiketsu: [2, 3],
        shitsuke: [2, 3]
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    initNavigation();
    initSideMenu();
    initNotifications();
    initDate();
    initCharts();
    initGasoilForm();
    initAudit5S();
    initReceptionForm();
    initSignatureCanvas();
});

// ===== SPLASH SCREEN =====
function initSplash() {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app');

    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            app.classList.remove('hidden');
            animateKPIs();
        }, 500);
    }, 2200);
}

// ===== NAVIGATION =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const sideItems = document.querySelectorAll('.side-menu-list li');
    const actionBtns = document.querySelectorAll('.action-btn[data-goto]');

    function navigateTo(pageId) {
        pages.forEach(p => p.classList.remove('active'));
        navItems.forEach(n => n.classList.remove('active'));
        sideItems.forEach(s => s.classList.remove('active'));

        const targetPage = document.getElementById(`page-${pageId}`);
        const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
        const targetSide = document.querySelector(`.side-menu-list li[data-page="${pageId}"]`);

        if (targetPage) targetPage.classList.add('active');
        if (targetNav) targetNav.classList.add('active');
        if (targetSide) targetSide.classList.add('active');

        // Scroll to top
        document.getElementById('pages-container').scrollTop = 0;

        // Close side menu
        closeSideMenu();

        // Trigger chart redraws if needed
        if (pageId === 'dashboard') {
            setTimeout(() => {
                drawCostChart();
                drawGaugeChart(72);
                drawWasteChart();
            }, 100);
        }
        if (pageId === 'gasoil') {
            setTimeout(() => drawGasoilChart(), 100);
        }
        if (pageId === 'audit5s') {
            setTimeout(() => drawRadarChart(), 100);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    sideItems.forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.goto));
    });
}

// ===== SIDE MENU =====
function initSideMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const sideOverlay = document.getElementById('side-overlay');

    menuBtn.addEventListener('click', () => {
        sideMenu.classList.add('open');
        sideOverlay.classList.add('open');
    });

    sideOverlay.addEventListener('click', closeSideMenu);
}

function closeSideMenu() {
    document.getElementById('side-menu').classList.remove('open');
    document.getElementById('side-overlay').classList.remove('open');
}

// ===== NOTIFICATIONS =====
function initNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const notifPanel = document.getElementById('notif-panel');
    const notifClose = document.getElementById('notif-close');

    notifBtn.addEventListener('click', () => {
        notifPanel.classList.toggle('open');
    });

    notifClose.addEventListener('click', () => {
        notifPanel.classList.remove('open');
    });
}

// ===== DATE =====
function initDate() {
    const dateEl = document.getElementById('current-date');
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('fr-FR', options);

    // Set form dates
    const today = now.toISOString().split('T')[0];
    const gasoilDate = document.getElementById('gasoil-date');
    const rcDate = document.getElementById('rc-date');
    if (gasoilDate) gasoilDate.value = today;
    if (rcDate) rcDate.value = today;
}

// ===== KPI ANIMATION =====
function animateKPIs() {
    const kpiValues = document.querySelectorAll('.kpi-value');
    kpiValues.forEach(el => {
        const finalText = el.textContent;
        const finalNum = parseInt(finalText);
        if (isNaN(finalNum)) return;

        const suffix = finalText.replace(String(finalNum), '');
        let current = 0;
        const step = Math.ceil(finalNum / 30);
        const timer = setInterval(() => {
            current += step;
            if (current >= finalNum) {
                current = finalNum;
                clearInterval(timer);
            }
            el.textContent = current + suffix;
        }, 30);
    });
}

// ===== CHARTS =====
function initCharts() {
    drawCostChart();
    drawGaugeChart(72);
    drawWasteChart();
    drawGasoilChart();
    drawRadarChart();
}

// --- Cost Chart (Bar) ---
function drawCostChart() {
    const canvas = document.getElementById('costChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const W = parent ? parent.clientWidth - 16 : 350;
    const H = 220;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const { costBefore, costAfter, costLabels } = APP_DATA;
    const maxVal = Math.max(...costBefore) * 1.15;
    const barAreaX = 50;
    const barAreaW = W - 60;
    const barAreaY = 20;
    const barAreaH = H - 50;
    const groupW = barAreaW / costLabels.length;
    const barW = groupW * 0.28;

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const val = Math.round((maxVal / 4) * i);
        const y = barAreaY + barAreaH - (barAreaH * (val / maxVal));
        ctx.fillText(val.toLocaleString() + ' DT', barAreaX - 6, y + 3);
        // Grid line
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(barAreaX, y);
        ctx.lineTo(W - 10, y);
        ctx.stroke();
    }

    // Bars
    costLabels.forEach((label, i) => {
        const x = barAreaX + i * groupW + groupW * 0.15;
        const hBefore = (costBefore[i] / maxVal) * barAreaH;
        const hAfter = (costAfter[i] / maxVal) * barAreaH;

        // Before bar
        const grad1 = ctx.createLinearGradient(0, barAreaY + barAreaH - hBefore, 0, barAreaY + barAreaH);
        grad1.addColorStop(0, '#64748b');
        grad1.addColorStop(1, '#475569');
        ctx.fillStyle = grad1;
        roundRect(ctx, x, barAreaY + barAreaH - hBefore, barW, hBefore, 4);

        // After bar
        const grad2 = ctx.createLinearGradient(0, barAreaY + barAreaH - hAfter, 0, barAreaY + barAreaH);
        grad2.addColorStop(0, '#22c55e');
        grad2.addColorStop(1, '#16a34a');
        ctx.fillStyle = grad2;
        roundRect(ctx, x + barW + 4, barAreaY + barAreaH - hAfter, barW, hAfter, 4);

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barW + 2, barAreaY + barAreaH + 16);
    });
}

// --- Gauge Chart ---
function drawGaugeChart(value) {
    const canvas = document.getElementById('gaugeChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 200 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 100, cy = 110, r = 80;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const valueAngle = startAngle + (value / 100) * (endAngle - startAngle);

    // Background arc
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.stroke();

    // Value arc (animated)
    const gradient = ctx.createLinearGradient(20, 110, 180, 110);
    if (value >= 70) {
        gradient.addColorStop(0, '#16a34a');
        gradient.addColorStop(1, '#22c55e');
    } else if (value >= 50) {
        gradient.addColorStop(0, '#d97706');
        gradient.addColorStop(1, '#f59e0b');
    } else {
        gradient.addColorStop(0, '#dc2626');
        gradient.addColorStop(1, '#ef4444');
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, valueAngle);
    ctx.stroke();

    // Glow
    ctx.shadowColor = value >= 70 ? 'rgba(34,197,94,0.3)' : value >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, valueAngle);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// --- Waste Trend Chart (Line) ---
function drawWasteChart() {
    const canvas = document.getElementById('wasteChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const W = parent ? parent.clientWidth - 16 : 350;
    const H = 200;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const { wasteMonths, wastePanneaux } = APP_DATA;
    const padL = 40, padR = 10, padT = 15, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const maxVal = 50;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padT + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();

        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(val, padL - 6, y + 3);
    }

    // X labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    wasteMonths.forEach((m, i) => {
        const x = padL + (chartW / (wasteMonths.length - 1)) * i;
        ctx.fillText(m, x, H - 8);
    });

    // Line
    const points = wastePanneaux.map((v, i) => ({
        x: padL + (chartW / (wasteMonths.length - 1)) * i,
        y: padT + chartH - (v / maxVal) * chartH
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, padT + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padT + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    areaGrad.addColorStop(0, 'rgba(34,197,94,0.15)');
    areaGrad.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Points
    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#0a1628';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value label
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(wastePanneaux[i], p.x, p.y - 10);
    });
}

// --- Gasoil Weekly Chart ---
function drawGasoilChart() {
    const canvas = document.getElementById('gasoilChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const W = parent ? parent.clientWidth - 16 : 350;
    const H = 200;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const { gasoilWeekly, gasoilDays } = APP_DATA;
    const padL = 35, padR = 10, padT = 15, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const maxVal = 110;
    const threshold = 70;

    // Threshold line
    const thresholdY = padT + chartH - (threshold / maxVal) * chartH;
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padL, thresholdY);
    ctx.lineTo(W - padR, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '8px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Seuil: 70L', padL + 2, thresholdY - 4);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i <= 5; i++) {
        const y = padT + (chartH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();

        const val = Math.round(maxVal - (maxVal / 5) * i);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(val + ' L', padL - 4, y + 3);
    }

    // X labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';

    const points = gasoilWeekly.map((v, i) => ({
        x: padL + (chartW / (gasoilDays.length - 1)) * i,
        y: padT + chartH - (v / maxVal) * chartH
    }));

    gasoilDays.forEach((d, i) => {
        ctx.fillText(d, points[i].x, H - 8);
    });

    // Area
    ctx.beginPath();
    ctx.moveTo(points[0].x, padT + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padT + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(34,197,94,0.12)');
    grad.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Points
    points.forEach((p, i) => {
        const isHigh = gasoilWeekly[i] > threshold;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isHigh ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHigh ? '#f59e0b' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#0a1628';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value
        ctx.fillStyle = isHigh ? '#fbbf24' : '#e2e8f0';
        ctx.font = `bold ${isHigh ? 10 : 9}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText(gasoilWeekly[i] + 'L', p.x, p.y - 10);
    });
}

// --- Radar Chart (5S History) ---
function drawRadarChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 300 * dpr;
    canvas.height = 300 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 150, cy = 150, r = 110;
    const labels = ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'];
    const current = [4, 3, 4, 3, 3];
    const previous = [3, 2, 3, 2, 2];
    const maxVal = 5;
    const sides = 5;
    const angleStep = (Math.PI * 2) / sides;
    const startOffset = -Math.PI / 2;

    // Grid circles
    for (let level = 1; level <= maxVal; level++) {
        const lr = (level / maxVal) * r;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = startOffset + i * angleStep;
            const x = cx + lr * Math.cos(angle);
            const y = cy + lr * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Axes
    for (let i = 0; i < sides; i++) {
        const angle = startOffset + i * angleStep;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();

        // Labels
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], lx, ly);
    }

    // Previous data (gray)
    drawRadarArea(ctx, cx, cy, r, previous, maxVal, sides, startOffset, angleStep, 'rgba(100,116,139,0.15)', 'rgba(100,116,139,0.4)');

    // Current data (green)
    drawRadarArea(ctx, cx, cy, r, current, maxVal, sides, startOffset, angleStep, 'rgba(34,197,94,0.2)', '#22c55e');
}

function drawRadarArea(ctx, cx, cy, r, data, maxVal, sides, startOffset, angleStep, fillColor, strokeColor) {
    ctx.beginPath();
    data.forEach((val, i) => {
        const angle = startOffset + i * angleStep;
        const pr = (val / maxVal) * r;
        const x = cx + pr * Math.cos(angle);
        const y = cy + pr * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Points
    data.forEach((val, i) => {
        const angle = startOffset + i * angleStep;
        const pr = (val / maxVal) * r;
        const x = cx + pr * Math.cos(angle);
        const y = cy + pr * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
    });
}

// --- Rounded Rectangle Helper ---
function roundRect(ctx, x, y, w, h, radius) {
    if (h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// ===== GASOIL FORM =====
function initGasoilForm() {
    const form = document.getElementById('gasoil-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const liters = document.getElementById('gasoil-liters').value;
        const kmStart = document.getElementById('gasoil-km-start').value;
        const kmEnd = document.getElementById('gasoil-km-end').value;
        const zone = document.getElementById('gasoil-zone');
        const vehicle = document.getElementById('gasoil-vehicle');

        if (!liters || !kmStart || !kmEnd) {
            showToast('⚠️ Veuillez remplir les champs obligatoires', 'warning');
            return;
        }

        const km = parseFloat(kmEnd) - parseFloat(kmStart);
        const consumption = ((parseFloat(liters) / km) * 100).toFixed(1);

        // Add to history
        const historyList = document.getElementById('gasoil-history');
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
        const zoneText = zone.selectedOptions[0]?.text || 'Zone ?';
        const vehicleText = vehicle.selectedOptions[0]?.text?.split(' — ')[0] || 'Véhicule ?';

        const consumptionClass = parseFloat(consumption) > 14 ? 'high' : parseFloat(consumption) > 12 ? 'normal' : 'good';

        const newItem = document.createElement('div');
        newItem.className = 'history-item';
        newItem.style.animation = 'slideInRight 0.4s ease-out';
        newItem.innerHTML = `
            <div class="history-date">${dateStr}</div>
            <div class="history-details">
                <strong>${vehicleText} — ${zoneText}</strong>
                <span>${km} km • ${liters} L</span>
            </div>
            <div class="history-consumption ${consumptionClass}">${consumption} L/100</div>
        `;
        historyList.insertBefore(newItem, historyList.firstChild);

        // Reset form
        document.getElementById('gasoil-liters').value = '';
        document.getElementById('gasoil-km-start').value = '';
        document.getElementById('gasoil-km-end').value = '';

        showToast('✅ Saisie gasoil enregistrée', 'success');
    });
}

// ===== AUDIT 5S =====
function initAudit5S() {
    // Toggle sections
    const headers = document.querySelectorAll('.audit-section-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.audit-section');
            const wasOpen = section.classList.contains('open');

            // Close all
            document.querySelectorAll('.audit-section').forEach(s => s.classList.remove('open'));

            // Open this if it was closed
            if (!wasOpen) section.classList.add('open');
        });
    });

    // Slider changes
    const sliders = document.querySelectorAll('.audit-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', () => {
            const criteria = slider.dataset.criteria;
            const scoreEl = document.getElementById(`score-${criteria}`);
            scoreEl.textContent = `${slider.value}/5`;
            scoreEl.style.color = slider.value >= 4 ? '#22c55e' : slider.value >= 3 ? '#f59e0b' : '#ef4444';
            updateAuditProgress();
        });
    });

    // Submit audit
    document.getElementById('submit-audit')?.addEventListener('click', () => {
        const allScored = Array.from(sliders).every(s => {
            const scoreEl = document.getElementById(`score-${s.dataset.criteria}`);
            return scoreEl.textContent !== '—';
        });

        // Mark all as scored
        sliders.forEach(s => {
            const scoreEl = document.getElementById(`score-${s.dataset.criteria}`);
            if (scoreEl.textContent === '—') {
                scoreEl.textContent = `${s.value}/5`;
                scoreEl.style.color = s.value >= 4 ? '#22c55e' : s.value >= 3 ? '#f59e0b' : '#ef4444';
            }
        });

        updateAuditProgress();
        showToast('✅ Audit 5S soumis avec succès !', 'success');

        // Close all sections
        document.querySelectorAll('.audit-section').forEach(s => s.classList.remove('open'));
    });
}

function updateAuditProgress() {
    const sliders = document.querySelectorAll('.audit-slider');
    let total = 0;
    let completed = 0;

    sliders.forEach(s => {
        const scoreEl = document.getElementById(`score-${s.dataset.criteria}`);
        if (scoreEl.textContent !== '—') {
            total += parseInt(s.value);
            completed++;
        }
    });

    const pct = Math.round((completed / 5) * 100);
    document.getElementById('audit-progress-fill').style.width = `${pct}%`;
    document.getElementById('audit-progress-text').textContent = `${pct}% Complété`;
    document.querySelector('.audit-progress-sub').textContent = `(${completed}/5 Sections)`;
    document.getElementById('audit-total-score').textContent = total;
    document.getElementById('audit-total-pct').textContent = `${Math.round((total / 25) * 100)}%`;
}

// ===== RECEPTION FORM =====
function initReceptionForm() {
    const acceptBtn = document.getElementById('accept-btn');
    const rejectBtn = document.getElementById('reject-btn');
    const photoBtn = document.getElementById('take-photo-btn');
    const photoGrid = document.getElementById('photo-grid');

    acceptBtn?.addEventListener('click', () => {
        const batch = document.getElementById('rc-batch').value;
        if (!batch) {
            showToast('⚠️ Veuillez renseigner le N° de lot', 'warning');
            return;
        }
        showToast('✅ Lot accepté et enregistré', 'success');
        addInspectionToHistory(batch, true);
    });

    rejectBtn?.addEventListener('click', () => {
        const batch = document.getElementById('rc-batch').value;
        if (!batch) {
            showToast('⚠️ Veuillez renseigner le N° de lot', 'warning');
            return;
        }
        showToast('❌ Lot rejeté — notification fournisseur', 'error');
        addInspectionToHistory(batch, false);
    });

    photoBtn?.addEventListener('click', () => {
        // Simulate photo capture
        const thumb = document.createElement('div');
        thumb.className = 'photo-thumb';
        thumb.textContent = '📸';
        thumb.style.animation = 'slideInRight 0.3s ease-out';
        photoGrid.appendChild(thumb);
        showToast('📷 Photo ajoutée', 'success');
    });
}

function addInspectionToHistory(batch, accepted) {
    const list = document.querySelector('.inspection-list');
    if (!list) return;

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
    const damaged = document.getElementById('rc-damaged')?.value || '0';
    const units = document.getElementById('rc-units')?.value || '?';

    const item = document.createElement('div');
    item.className = `inspection-item ${accepted ? 'accepted' : 'rejected'}`;
    item.style.animation = 'slideInRight 0.4s ease-out';
    item.innerHTML = `
        <div class="inspection-status">${accepted ? '✅' : '❌'}</div>
        <div class="inspection-info">
            <strong>Lot ${batch}</strong>
            <span>${units} panneaux • ${damaged} endommagé(s)</span>
        </div>
        <span class="inspection-date">${dateStr}</span>
    `;
    list.insertBefore(item, list.firstChild);
}

// ===== SIGNATURE CANVAS =====
function initSignatureCanvas() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = 120 * dpr;
    ctx.scale(dpr, dpr);

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    ctx.strokeStyle = '#1a365d';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return {
            x: touch.clientX - r.left,
            y: touch.clientY - r.top
        };
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
    }

    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
    }

    function stopDraw() {
        drawing = false;
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // Clear button
    document.getElementById('clear-signature')?.addEventListener('click', () => {
        ctx.clearRect(0, 0, rect.width, 120);
    });
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
