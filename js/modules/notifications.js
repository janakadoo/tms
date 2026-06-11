/* ================================================================
   TMS | NOTIFICATIONS / ALERTS MODULE
   ================================================================ */
import { DB }    from '../db.js';
import { Utils } from '../utils.js';

export const NotificationsModule = {
    _container: null,
    init(container) { NotificationsModule._container = container; NotificationsModule.render(); },

    render() {
        const alerts = DB.Analytics.getAlerts();
        const danger  = alerts.filter(a=>a.type==='danger').length;
        const warning = alerts.filter(a=>a.type==='warning').length;

        NotificationsModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Alerts & Notifications</h2><p>Document expiries, overdue maintenance, and system alerts</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-secondary" id="refreshAlertsBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                        Refresh
                    </button>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip"><div class="dot" style="background:var(--danger)"></div><strong>${danger}</strong> Critical</div>
                <div class="stat-chip"><div class="dot" style="background:var(--warning)"></div><strong>${warning}</strong> Warnings</div>
                <div class="stat-chip"><div class="dot" style="background:var(--success)"></div>Checks up to <strong>30 days</strong> ahead</div>
            </div>

            ${alerts.length === 0 ? `
            <div class="card">
                <div class="card-body">
                    <div class="empty-state">
                        <div class="empty-icon" style="background:var(--success-bg)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color:var(--success)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <div class="empty-title" style="color:var(--success)">All Clear!</div>
                        <div class="empty-desc">No alerts at this time. All documents and maintenance are up to date.</div>
                    </div>
                </div>
            </div>` : `
            <div class="card">
                <div class="notif-list">
                    ${alerts.map((a,i) => NotificationsModule._alertItem(a, i)).join('')}
                </div>
            </div>`}

            <!-- ALERT INFO CARD -->
            <div class="card mt-4">
                <div class="card-header">
                    <div class="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
                        What's Checked
                    </div>
                </div>
                <div class="card-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem">
                        ${[
                            {icon:'🚗', label:'Vehicle Insurance', desc:'Alerts when insurance expires within 30 days'},
                            {icon:'📄', label:'Road Tax', desc:'Alerts when road tax expires within 30 days'},
                            {icon:'👤', label:'Driver License', desc:'Alerts when license expires within 30 days'},
                            {icon:'🔧', label:'Overdue Maintenance', desc:'Alerts for past-due maintenance schedules'},
                        ].map(item=>`
                            <div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem;background:var(--bg-elevated);border-radius:var(--r-md)">
                                <div style="font-size:1.5rem;flex-shrink:0">${item.icon}</div>
                                <div>
                                    <div style="font-weight:600;font-size:0.875rem">${item.label}</div>
                                    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.125rem">${item.desc}</div>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('refreshAlertsBtn').onclick = () => NotificationsModule.render();
    },

    _alertItem(alert, i) {
        const icons = {
            'insurance': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>`,
            'road_tax': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`,
            'vehicle':  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`,
            'driver':   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>`,
            'maintenance': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg>`,
        };
        const color = alert.type === 'danger' ? 'var(--danger)' : 'var(--warning)';
        const bg    = alert.type === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)';
        const iconKey = alert.etype === 'driver' ? 'driver' : (alert.etype === 'maintenance' ? 'maintenance' : (alert.doc === 'Insurance' ? 'insurance' : (alert.doc === 'Road Tax' ? 'road_tax' : 'vehicle')));
        return `
        <div class="notif-item anim-up delay-${Math.min(i+1,6)}">
            <div class="notif-icon-wrap" style="background:${bg};color:${color}">${icons[iconKey]||icons['vehicle']}</div>
            <div class="notif-content">
                <div class="notif-title">${Utils.esc(alert.label)} — <span style="color:${color}">${Utils.esc(alert.doc)}</span></div>
                <div class="notif-desc">${Utils.esc(alert.msg)}</div>
                <div class="notif-time">${alert.etype === 'vehicle' ? 'Vehicle' : alert.etype === 'driver' ? 'Driver' : 'Maintenance'} Record</div>
            </div>
            <span class="badge ${alert.type === 'danger' ? 'badge-danger' : 'badge-warning'}">${alert.type === 'danger' ? 'Critical' : 'Warning'}</span>
        </div>`;
    },
};
