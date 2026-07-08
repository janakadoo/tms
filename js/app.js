/* ================================================================
   TMS | APP.JS — Main Application Controller + Dashboard
   ================================================================ */
import { DB }    from './db.js?v=2';
import { Utils } from './utils.js?v=2';

import { VehicleModule }       from './modules/vehicles.js';
import { DriverModule }        from './modules/drivers.js';
import { TripModule }          from './modules/trips.js';
import { FuelModule }          from './modules/fuel.js';
import { ExpenseModule }       from './modules/expenses.js';
import { MaintenanceModule }   from './modules/maintenance.js';
import { ReportsModule }       from './modules/reports.js';
import { NotificationsModule } from './modules/notifications.js';
import { SettingsModule }      from './modules/settings.js';
import { TrackingModule }      from './modules/tracking.js';

let _dashCharts = {};

/* ── BOOT ─────────────────────────────────────────────────────── */
let _appInitialized = false;

// Initialize Firebase (if not already)
const _fbConfig = {
    apiKey:            "AIzaSyAAPXz79A3M142K-MgArp-JK4BBFzpCVK0",
    authDomain:        "ja-transport-managemnt-system.firebaseapp.com",
    databaseURL:       "https://ja-transport-managemnt-system-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "ja-transport-managemnt-system",
    storageBucket:     "ja-transport-managemnt-system.firebasestorage.app",
    messagingSenderId: "683270467932",
    appId:             "1:683270467932:web:2029e94537a633ebacd199",
};
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(_fbConfig);
}

// Initialize secondary app for creating users without logging out
let _secondaryApp;
try {
    _secondaryApp = window.firebase.initializeApp(_fbConfig, "Secondary");
} catch(e) {
    _secondaryApp = window.firebase.app("Secondary");
}
window._fbSecondaryAuth = _secondaryApp.auth();

// Check Auth State
firebase.auth().onAuthStateChanged(async (user) => {
    const loadScreen = document.getElementById('loadingScreen');
    const authScreen = document.getElementById('authScreen');
    const appShell   = document.getElementById('appShell');

    if (user) {
        // User logged in
        authScreen.classList.add('hidden');
        if (loadScreen) loadScreen.style.display = 'flex';
        
        try {
            if (!_appInitialized) {
                // Check if this is a Sub-User mapped to a Main User
                let targetUid = user.uid;
                try {
                    const snap = await firebase.database().ref(`tms_database/mappings/${user.uid}`).once('value');
                    if (snap.exists() && snap.val()) {
                        targetUid = snap.val();
                        window._isSubUser = true;
                    }
                } catch(e) { console.warn('Mapping check failed', e); }

                // Pass the resolved targetUID to DB init
                await DB.init(targetUid);

                // Determine User Role and Display Name
                window._userRole = 'Owner';
                let displayName = 'Admin';

                if (window._isSubUser) {
                    const sysUser = DB.select('SELECT name, role FROM system_users WHERE id=?', [user.uid]);
                    if (sysUser && sysUser.length > 0) {
                        window._userRole = sysUser[0].role;
                        displayName = sysUser[0].name;
                    } else {
                        displayName = user.email.split('@')[0];
                    }
                } else {
                    displayName = 'Super Admin';
                }

                // Update Topbar User Pill
                const nameLbl = document.getElementById('topbarUserName');
                const roleLbl = document.getElementById('topbarRoleName');
                const avatar  = document.getElementById('topbarAvatar');
                
                if (nameLbl) nameLbl.textContent = displayName;
                if (roleLbl) roleLbl.textContent = window._userRole;
                if (avatar)  avatar.textContent  = displayName.charAt(0).toUpperCase();

                // Set Company name in the sidebar brand
                const cname = DB.Settings.get('company_name') || 'TMS Pro';
                const sidebarBrandName = document.querySelector('.sidebar-brand .brand-name');
                if (sidebarBrandName) sidebarBrandName.textContent = cname;

                // Set Chart.js global defaults
                Utils.chartDefaults();

                // Expose App globally for modules to call
                window.App = { updateAlerts };

                // Apply saved theme
                const savedTheme = DB.Settings.get('theme') || 'dark';
                if (savedTheme === 'light') applyLightMode();

                // Setup sidebar collapse
                const sidebarToggle = document.getElementById('sidebarToggle');
                if (sidebarToggle) {
                    sidebarToggle.addEventListener('click', () => {
                        appShell.classList.toggle('sidebar-collapsed');
                    });
                }

                // Theme toggle
                const themeBtn = document.getElementById('themeToggleBtn');
                if (themeBtn) {
                    themeBtn.addEventListener('click', () => {
                        const isLight = document.body.classList.toggle('light-mode');
                        DB.Settings.set('theme', isLight ? 'light' : 'dark');
                        applyThemeIcon(isLight);
                    });
                }

                // Logout button
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        firebase.auth().signOut();
                    });
                }

                // Navigation
                document.querySelectorAll('.nav-item[data-page]').forEach(item => {
                    item.addEventListener('click', () => {
                        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                        item.classList.add('active');
                    });
                });

                // Router
                window.addEventListener('hashchange', handleRoute);
                
                _appInitialized = true;
            }

            // Hide loading screen, show app
            if (loadScreen) loadScreen.classList.add('hidden');
            appShell.classList.remove('hidden');

            handleRoute();
            updateAlerts();

        } catch (err) {
            console.error('TMS Boot failed:', err);
            const errDiv = document.getElementById('startupError');
            if (errDiv) {
                errDiv.style.display = 'block';
                errDiv.textContent = '❌ Error loading workspace: ' + (err.message || err);
            }
        }
    } else {
        // User logged out
        if (loadScreen) loadScreen.classList.add('hidden');
        appShell.classList.add('hidden');
        authScreen.classList.remove('hidden');
    }
});

/* ── AUTHENTICATION LOGIC ─────────────────────────────────────── */
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const pass  = document.getElementById('authPassword').value;
    const errDiv= document.getElementById('authErrorMsg');
    const btn   = document.getElementById('loginBtn');
    
    errDiv.textContent = '';
    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (error) {
        errDiv.textContent = error.message;
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
});

document.getElementById('forgotPasswordBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const errDiv= document.getElementById('authErrorMsg');
    
    if (!email) {
        errDiv.textContent = 'Please enter your email address first.';
        return;
    }
    
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        errDiv.style.color = 'var(--success)';
        errDiv.textContent = 'Password reset email sent! Check your inbox.';
    } catch (error) {
        errDiv.style.color = 'var(--danger)';
        errDiv.textContent = error.message;
    }
});

/* ── ROUTER ───────────────────────────────────────────────────── */
const PAGE_META = {
    dashboard:     { title: 'Dashboard',            sub: 'Overview & analytics' },
    vehicles:      { title: 'Vehicle Fleet',         sub: 'Manage your vehicles' },
    drivers:       { title: 'Driver Management',     sub: 'Manage your drivers' },
    trips:         { title: 'Trip Management',       sub: 'Trips with fuel consumption monitoring' },
    fuel:          { title: 'Fuel Logs',             sub: 'General fuel consumption & costs' },
    expenses:      { title: 'Expenses',              sub: 'Track all expenses' },
    maintenance:   { title: 'Service & Maintenance', sub: 'Vehicle servicing records' },
    reports:       { title: 'Reports',               sub: 'Analytics & data export' },
    notifications: { title: 'Alerts & Notifications',sub: 'Expiries and overdue items' },
    settings:      { title: 'Settings',              sub: 'System configuration' },
    tracking:      { title: 'Live Tracking',         sub: 'Real-time vehicle location' },
};

function handleRoute() {
    const page    = (window.location.hash.slice(1) || 'dashboard').toLowerCase();
    const content = document.getElementById('contentArea');
    const meta    = PAGE_META[page] || PAGE_META.dashboard;

    document.getElementById('pageTitle').textContent    = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.sub;

    // Update nav active
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (active) active.classList.add('active');

    // Destroy old dashboard charts before re-render
    if (page !== 'dashboard') {
        Object.values(_dashCharts).forEach(c => { try { c.destroy(); } catch {} });
        _dashCharts = {};
    }

    switch (page) {
        case 'dashboard':     renderDashboard(content);                break;
        case 'vehicles':      VehicleModule.init(content);             break;
        case 'drivers':       DriverModule.init(content);              break;
        case 'trips':         TripModule.init(content);                break;
        case 'fuel':          FuelModule.init(content);                break;
        case 'expenses':      ExpenseModule.init(content);             break;
        case 'maintenance':   MaintenanceModule.init(content);         break;
        case 'reports':       ReportsModule.init(content);             break;
        case 'notifications': NotificationsModule.init(content);       break;
        case 'settings':      SettingsModule.init(content);            break;
        case 'tracking':      TrackingModule.init(content);            break;
        default:
            content.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg></div><div class="empty-title">Page Not Found</div></div>`;
    }
}

/* ── ALERT BADGE ──────────────────────────────────────────────── */
function updateAlerts() {
    const count = DB.Analytics.alertsCount();
    const badge   = document.getElementById('topbarAlertCount');
    const sideBdg = document.getElementById('sidebarAlertBadge');
    if (badge) {
        if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
        else badge.classList.add('hidden');
    }
    if (sideBdg) {
        if (count > 0) { sideBdg.textContent = count; sideBdg.classList.remove('hidden'); }
        else sideBdg.classList.add('hidden');
    }
}

/* ── THEME HELPERS ────────────────────────────────────────────── */
function applyLightMode() {
    document.body.classList.add('light-mode');
    applyThemeIcon(true);
}

function applyThemeIcon(isLight) {
    const btn  = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.innerHTML = isLight
        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>`;
}

/* ── DASHBOARD ────────────────────────────────────────────────── */
function renderDashboard(container) {
    const sym     = DB.Settings.get('currency_symbol') || 'Rs.';
    const monthly = DB.Analytics.currentMonthSummary();
    const vehicles = DB.Vehicles.getAll();
    const drivers  = DB.Drivers.getAll();
    const alerts   = DB.Analytics.alertsCount();

    const activeV  = vehicles.filter(v=>v.status==='Active').length;
    const activeD  = drivers.filter(d=>d.status==='Active').length;

    const monthName = new Date().toLocaleString('default', {month:'long', year:'numeric'});
    const totalCost = (monthly.fuel || 0) + (monthly.expenses || 0);
    const tripCount = DB.scalar(`SELECT COUNT(*) FROM trips WHERE start_date LIKE ?`, [new Date().toISOString().slice(0,7)+'%']) || 0;

    container.innerHTML = `
    <div class="page-content">

        <!-- KPI CARDS -->
        <div class="kpi-grid anim-up">
            ${kpi('Total Vehicles',    vehicles.length, `${activeV} active`, 'var(--grad-primary)',  'var(--primary)',  iconTruck())}
            ${kpi('Active Vehicles',   activeV, `${vehicles.length} total`, 'var(--grad-success)', 'var(--emerald)',  iconCheck())}
            ${kpi('Total Drivers',     drivers.length, `${activeD} active`, 'var(--grad-cyan)',    'var(--cyan)',     iconUsers())}
            ${kpi('Monthly Cost',      Utils.currency(totalCost,sym), monthName, 'var(--grad-danger)',  'var(--rose)',     iconMoney(), true)}
            ${kpi('Monthly Revenue',   Utils.currency(monthly.revenue,sym), `${tripCount} trips`, 'var(--grad-success)', 'var(--emerald)', iconRevenue(), true)}
            ${kpi('Active Alerts',     alerts, 'View details →', 'var(--grad-warning)', 'var(--amber)',    iconBell(), false, '#notifications')}
        </div>

        <!-- CHARTS ROW 1 -->
        <div class="charts-grid anim-up delay-2">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">${iconChart()} Monthly Cost Trend</div>
                    <span class="badge badge-neutral">6 months</span>
                </div>
                <div class="chart-body"><canvas id="dashCostChart"></canvas></div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">${iconPie()} Expense Breakdown</div>
                    <span class="badge badge-neutral">All time</span>
                </div>
                <div class="chart-body"><canvas id="dashExpChart"></canvas></div>
            </div>
        </div>

        <!-- CHARTS ROW 2 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1rem;margin-bottom:1.5rem" class="anim-up delay-3">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">${iconBar()} Trip Volume</div>
                    <span class="badge badge-neutral">6 months</span>
                </div>
                <div class="chart-body"><canvas id="dashTripChart"></canvas></div>
            </div>

            <!-- Recent Activity -->
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">${iconActivity()} Recent Activity</div>
                </div>
                <div class="chart-body" style="padding:0">
                    ${renderActivity(sym)}
                </div>
            </div>
        </div>

        <!-- ALERTS STRIP -->
        ${alerts > 0 ? `
        <div class="alert alert-warning anim-up delay-4" style="margin-bottom:1.5rem">
            ${iconWarn()}
            <div>
                <strong>${alerts} active alert${alerts>1?'s':''}</strong> — 
                Documents expiring soon or overdue maintenance.
                <a href="#notifications" data-page="notifications" style="color:var(--warning);font-weight:600;margin-left:4px">View Alerts →</a>
            </div>
        </div>` : ''}

        <!-- QUICK SUMMARY CARDS -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem" class="anim-up delay-5">
            ${quickCard('Fuel This Month',  Utils.currency(monthly.fuel,sym),  'var(--amber)',   '#fuel')}
            ${quickCard('Expenses This Month', Utils.currency(monthly.expenses,sym), 'var(--rose)',    '#expenses')}
            ${quickCard('Maintenance This Month', Utils.currency(monthly.maintenance,sym),'var(--violet)','#maintenance')}
            ${quickCard('Net P&L This Month', Utils.currency(monthly.revenue - totalCost,sym), monthly.revenue >= totalCost ? 'var(--emerald)' : 'var(--rose)', '#reports')}
        </div>
    </div>`;

    // Attach alert navigation
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function(e) {
            if (this.tagName === 'A') {
                e.preventDefault();
                window.location.hash = this.getAttribute('href') || '#dashboard';
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                const nav = document.querySelector(`.nav-item[data-page="${this.dataset.page}"]`);
                if (nav) nav.classList.add('active');
            }
        });
    });

    // Render charts after DOM is ready
    requestAnimationFrame(() => {
        renderCostChart();
        renderExpChart();
        renderTripChart();
    });
}

function kpi(label, value, sub, grad, colorRaw, icon, isLarge=false, href=null) {
    const style = `--kpi-color:${grad};--kpi-color-raw:${colorRaw}`;
    const wrap  = href ? `<a href="${href}" data-page="${href.slice(1)}" style="text-decoration:none">` : '<div>';
    const endw  = href ? '</a>' : '</div>';
    return `${wrap}<div class="kpi-card" style="${style}">
        <div class="kpi-top">
            <div class="kpi-label">${label}</div>
            <div class="kpi-icon">${icon}</div>
        </div>
        <div class="kpi-value" style="${isLarge ? 'font-size:1.5rem' : ''}">${value}</div>
        <div class="kpi-footer text-muted-c text-sm">${sub}</div>
    </div>${endw}`;
}

function quickCard(label, value, color, href) {
    return `<a href="${href}" data-page="${href.slice(1)}" style="text-decoration:none">
        <div class="card" style="padding:1.125rem;transition:all var(--t-base);cursor:pointer" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            <div style="font-size:0.75rem;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.375rem">${label}</div>
            <div style="font-size:1.375rem;font-weight:700;color:${color}">${value}</div>
        </div>
    </a>`;
}

function renderActivity(sym) {
    let activity = [];
    DB.Trips.getAll().slice(0,3).forEach(t => activity.push({
        color: 'var(--cyan)', label: `Trip: ${t.purpose || 'General Trip'}`,
        sub: `${t.driver_name||'—'} • ${Utils.formatDate(t.start_date)}`,
        val: +t.revenue > 0 ? Utils.currency(t.revenue,sym) : t.status
    }));
    DB.Fuel.getAll().slice(0,2).forEach(f => activity.push({
        color: 'var(--amber)', label: `Fuel: ${f.vehicle_reg||'—'}`,
        sub: `${f.station||'—'} • ${Utils.formatDate(f.date || f.fill_date)}`,
        val: Utils.currency(f.total_cost,sym)
    }));
    DB.Expenses.getAll().slice(0,2).forEach(e => activity.push({
        color: 'var(--rose)', label: `${e.category}: ${e.description || 'Expense'}`,
        sub: `${e.vehicle_reg||'—'} • ${Utils.formatDate(e.date)}`,
        val: Utils.currency(e.amount,sym)
    }));

    if (!activity.length) return `<div class="empty-state" style="padding:2rem"><div class="empty-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/></svg></div><p class="text-muted-c text-sm">No activity yet</p></div>`;

    return `<div class="activity-list" style="padding:0 1.25rem">${activity.slice(0,6).map(a => `
        <div class="activity-item">
            <div class="activity-dot" style="background:${a.color}"></div>
            <div class="activity-info">
                <div class="activity-title">${Utils.esc(a.label)}</div>
                <div class="activity-meta">${Utils.esc(a.sub)}</div>
            </div>
            <div class="activity-value" style="font-size:0.8rem">${Utils.esc(a.val)}</div>
        </div>`).join('')}</div>`;
}

/* ── DASHBOARD CHARTS ─────────────────────────────────────────── */
function renderCostChart() {
    const canvas = document.getElementById('dashCostChart');
    if (!canvas) return;
    if (_dashCharts.cost) { _dashCharts.cost.destroy(); }
    const data   = DB.Analytics.monthlyCosts(6);
    _dashCharts.cost = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Fuel Cost', data: data.fuel,
                    borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
                    borderWidth: 2.5, pointBackgroundColor: '#6366f1'
                },
                {
                    label: 'Expenses', data: data.expenses,
                    borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.08)',
                    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
                    borderWidth: 2.5, pointBackgroundColor: '#f43f5e'
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true, interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => 'Rs. '+(v/1000).toFixed(0)+'K' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderExpChart() {
    const canvas = document.getElementById('dashExpChart');
    if (!canvas) return;
    if (_dashCharts.exp) { _dashCharts.exp.destroy(); }
    const expData = DB.Analytics.expenseByCategory();
    if (!expData.labels || expData.labels.length === 0) return;
    const COLORS = ['#6366f1','#06b6d4','#8b5cf6','#10b981','#f59e0b','#f43f5e','#0ea5e9','#ec4899'];
    _dashCharts.exp = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: expData.labels,
            datasets: [{ data: expData.data, backgroundColor: COLORS.slice(0,expData.labels.length), borderWidth: 2, borderColor: 'var(--bg-card)', hoverBorderColor: 'var(--border-strong)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' } } }
    });
}

function renderTripChart() {
    const canvas = document.getElementById('dashTripChart');
    if (!canvas) return;
    if (_dashCharts.trip) { _dashCharts.trip.destroy(); }
    const data   = DB.Analytics.monthlyTrips(6);
    _dashCharts.trip = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Trips', data: data.counts,
                    backgroundColor: 'rgba(6,182,212,0.7)', borderColor: '#06b6d4',
                    borderWidth: 1.5, borderRadius: 6, yAxisID: 'y'
                },
                {
                    label: 'Revenue', data: data.revenue,
                    type: 'line', borderColor: '#10b981', backgroundColor: 'transparent',
                    tension: 0.4, pointRadius: 4, borderWidth: 2.5, yAxisID: 'y2'
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true, interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: {
                y:  { grid: { color: 'rgba(255,255,255,0.04)' }, position: 'left' },
                y2: { grid: { display: false }, position: 'right', ticks: { callback: v => 'Rs. '+(v/1000).toFixed(0)+'K' } },
                x:  { grid: { display: false } }
            }
        }
    });
}

/* ── SVG ICON HELPERS ─────────────────────────────────────────── */
const _icon = (path, vb='0 0 24 24') => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="${vb}" stroke-width="2" stroke="currentColor">${path}</svg>`;
const iconTruck    = () => _icon(`<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>`);
const iconCheck    = () => _icon(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`);
const iconUsers    = () => _icon(`<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>`);
const iconMoney    = () => _icon(`<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`);
const iconRevenue  = () => _icon(`<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>`);
const iconBell     = () => _icon(`<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>`);
const iconChart    = () => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:15px;height:15px;color:var(--primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>`;
const iconPie      = () => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:15px;height:15px;color:var(--primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/></svg>`;
const iconBar      = () => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:15px;height:15px;color:var(--primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`;
const iconActivity = () => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:15px;height:15px;color:var(--primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/></svg>`;
const iconWarn     = () => `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`;
