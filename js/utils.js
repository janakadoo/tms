/* ================================================================
   TMS | UTILITIES
   ================================================================ */

export const Utils = {

    /* ── ID GENERATION ──────────────────────────────────────── */
    id: () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,

    /* ── CURRENCY ───────────────────────────────────────────── */
    currency(amount, symbol = 'Rs.') {
        const n = parseFloat(amount) || 0;
        return `${symbol} ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },

    /* ── DATES ──────────────────────────────────────────────── */
    today: () => new Date().toISOString().slice(0, 10),

    formatDate(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso + 'T00:00:00');
            return d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return iso; }
    },

    daysBetween(isoA, isoB = new Date().toISOString().slice(0,10)) {
        return Math.round((new Date(isoA) - new Date(isoB)) / 86400000);
    },

    expiryClass(isoDate) {
        if (!isoDate) return '';
        const d = Utils.daysBetween(isoDate);
        if (d < 0)  return 'expiry-expired';
        if (d <= 30) return 'expiry-soon';
        return 'expiry-ok';
    },

    expiryLabel(isoDate) {
        if (!isoDate) return '';
        const d = Utils.daysBetween(isoDate);
        if (d < 0)  return `Expired ${Math.abs(d)}d ago`;
        if (d === 0) return 'Expires today!';
        if (d <= 30) return `Expires in ${d}d`;
        return Utils.formatDate(isoDate);
    },

    monthLabel(ym) {
        if (!ym) return '';
        const [y, m] = ym.split('-');
        return new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    },

    /* ── STATUS HELPERS ─────────────────────────────────────── */
    vehicleStatusBadge(status) {
        const map = {
            'Active': 'badge-success',
            'Inactive': 'badge-neutral',
            'Repair': 'badge-warning',
            'Scrapped': 'badge-danger',
        };
        return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
    },

    driverStatusBadge(status) {
        const map = {
            'Active':   'badge-success',
            'On Leave': 'badge-warning',
            'Inactive': 'badge-neutral',
            'Suspended':'badge-danger',
        };
        return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
    },

    tripStatusBadge(status) {
        const map = {
            'Scheduled':   'badge-info',
            'In Progress': 'badge-warning',
            'Completed':   'badge-success',
            'Cancelled':   'badge-danger',
        };
        return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
    },

    maintStatusBadge(status) {
        const map = {
            'Scheduled':   'badge-info',
            'In Progress': 'badge-warning',
            'Completed':   'badge-success',
            'Overdue':     'badge-danger',
        };
        return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
    },

    /* ── CHART DEFAULTS ─────────────────────────────────────── */
    chartDefaults() {
        Chart.defaults.color             = '#8fa4c4';
        Chart.defaults.borderColor       = 'rgba(255,255,255,0.05)';
        Chart.defaults.font.family       = 'Inter';
        Chart.defaults.font.size         = 12;
        Chart.defaults.plugins.legend.labels.boxWidth  = 10;
        Chart.defaults.plugins.legend.labels.padding   = 16;
        Chart.defaults.plugins.tooltip.padding         = 10;
        Chart.defaults.plugins.tooltip.cornerRadius    = 8;
        Chart.defaults.plugins.tooltip.backgroundColor = '#1a2d47';
        Chart.defaults.plugins.tooltip.borderColor     = 'rgba(255,255,255,0.1)';
        Chart.defaults.plugins.tooltip.borderWidth      = 1;
        Chart.defaults.plugins.tooltip.titleColor       = '#e8eeff';
        Chart.defaults.plugins.tooltip.bodyColor        = '#8fa4c4';
    },

    /* ── ESCAPE HTML ────────────────────────────────────────── */
    esc: s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),

    /* ── TOAST ──────────────────────────────────────────────── */
    toast(msg, type = 'success', title = '') {
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`,
            error:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`,
            info:    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>`,
        };
        const titles = { success:'Success', error:'Error', warning:'Warning', info:'Info' };

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title || titles[type]}</div>
                <div class="toast-msg">${Utils.esc(msg)}</div>
            </div>`;

        container.appendChild(el);
        setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(110%)'; el.style.transition='all 0.3s ease'; setTimeout(()=>el.remove(), 300); }, 3500);
    },

    /* ── CONFIRM DIALOG ─────────────────────────────────────── */
    confirm(msg, title = 'Confirm Action') {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay open';
            overlay.style.zIndex = '1200';
            overlay.innerHTML = `
                <div class="modal modal-sm anim-scale">
                    <div class="modal-header">
                        <div class="modal-header-title">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--warning)"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                            ${Utils.esc(title)}
                        </div>
                    </div>
                    <div class="modal-body"><p style="color:var(--text-secondary)">${Utils.esc(msg)}</p></div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="_cfm_cancel">Cancel</button>
                        <button class="btn btn-danger" id="_cfm_ok">Delete</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#_cfm_cancel').onclick = () => { overlay.remove(); resolve(false); };
            overlay.querySelector('#_cfm_ok').onclick     = () => { overlay.remove(); resolve(true);  };
        });
    },

    /* ── ATTACHMENTS ────────────────────────────────────────── */
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
        });
    },

    viewAttachment(dataUrl, type) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay open';
        overlay.style.zIndex = '1300';
        
        let content = '';
        if (type.startsWith('image/')) {
            content = `<img src="${dataUrl}" style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:8px">`;
        } else if (type === 'application/pdf') {
            content = `<iframe src="${dataUrl}" style="width:100%;height:80vh;border:none;border-radius:8px"></iframe>`;
        } else {
            content = `<div style="padding:2rem;text-align:center">Unsupported file type</div>`;
        }

        overlay.innerHTML = `
            <div class="modal modal-lg anim-scale" style="max-width:800px;background:var(--bg-card)">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        View Attachment
                    </div>
                    <button class="modal-close" id="_att_close">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="modal-body" style="padding:1rem;display:flex;justify-content:center;align-items:center;min-height:200px">
                    ${content}
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#_att_close').onclick = () => overlay.remove();
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    },
};
