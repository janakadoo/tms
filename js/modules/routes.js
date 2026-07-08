/* ================================================================
   TMS | ROUTES MODULE
   ================================================================ */
import { DB }    from '../db.js?v=2';
import { Utils } from '../utils.js?v=2';

export const RouteModule = {
    _container: null,
    init(container) { RouteModule._container = container; RouteModule.render(); },

    render() {
        const routes = DB.Routes.getAll();

        RouteModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Route Management</h2><p>Define named routes used in trip logging</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addRouteBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Route
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="rtSearch" placeholder="Search routes...">
                        </div>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Route Name</th><th>Origin</th><th>Destination</th>
                            <th>Distance</th><th>Est. Duration</th><th>Trips</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="routesTbody">${RouteModule._rows(routes)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="routeModal">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
                        <span id="routeModalTitle">Add Route</span>
                    </div>
                    <button class="modal-close" id="routeModalClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="routeForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-group">
                            <label class="form-label">Route Name <span class="req">*</span></label>
                            <input type="text" name="name" class="form-input" required placeholder="Colombo - Kandy Express">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Origin</label>
                                <input type="text" name="origin" class="form-input" placeholder="Colombo Fort">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Destination</label>
                                <input type="text" name="destination" class="form-input" placeholder="Kandy Station">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Distance (km)</label>
                                <input type="number" name="distance_km" class="form-input" placeholder="0" min="0" step="0.1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Estimated Duration</label>
                                <input type="text" name="estimated_duration" class="form-input" placeholder="2h 30m">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Via highway, toll roads..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="routeModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Route</button>
                    </div>
                </form>
            </div>
        </div>`;

        RouteModule._bindEvents();
    },

    _rows(routes) {
        if (!routes.length) return `<tr><td colspan="7"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
            <p>No routes defined. Add your first route!</p></div></td></tr>`;
        return routes.map(r=>`
            <tr>
                <td class="table-cell-main">${Utils.esc(r.name)}</td>
                <td>${Utils.esc(r.origin||'—')}</td>
                <td>${Utils.esc(r.destination||'—')}</td>
                <td>${r.distance_km ? (+r.distance_km).toFixed(1)+' km' : '—'}</td>
                <td>${Utils.esc(r.estimated_duration||'—')}</td>
                <td>${r.trip_count||0}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" data-edit="${r.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                        <button class="btn-icon danger" data-del="${r.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                    </div>
                </td>
            </tr>`).join('');
    },

    _bindEvents() {
        const modal  = document.getElementById('routeModal');
        const form   = document.getElementById('routeForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        document.getElementById('addRouteBtn').onclick = () => {
            document.getElementById('routeModalTitle').textContent = 'Add Route';
            form.reset(); form.elements['id'].value = '';
            openFn();
        };
        document.getElementById('routeModalClose').onclick  = closeFn;
        document.getElementById('routeModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = e => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form).entries());
            if (d.id) { DB.Routes.update(d); Utils.toast('Route updated', 'success'); }
            else { d.id = Utils.id(); DB.Routes.add(d); Utils.toast('Route added', 'success'); }
            closeFn(); RouteModule.render();
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const r = DB.Routes.getById(btn.dataset.edit);
                if (!r) return;
                document.getElementById('routeModalTitle').textContent = 'Edit Route';
                Object.entries(r).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
                openFn();
            };
        });

        document.querySelectorAll('[data-del]').forEach(btn => {
            btn.onclick = async () => {
                const ok = await Utils.confirm('Delete this route?', 'Delete Route');
                if (ok) { DB.Routes.delete(btn.dataset.del); Utils.toast('Route deleted', 'success'); RouteModule.render(); }
            };
        });

        document.getElementById('rtSearch').oninput = function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('#routesTbody tr').forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
            });
        };
    },
};
