/* ================================================================
   TMS | FUEL MODULE
   ================================================================ */
import { DB }    from '../db.js';
import { Utils } from '../utils.js';

export const FuelModule = {
    _container: null,
    _chart: null,
    init(container) { FuelModule._container = container; FuelModule.render(); },

    render() {
        const logs = DB.Fuel.getAll();
        const sym  = DB.Settings.get('currency_symbol') || 'Rs.';
        const m    = new Date().toISOString().slice(0,7);

        const monthLogs    = logs.filter(l => l.date && l.date.startsWith(m));
        const monthCost    = monthLogs.reduce((s,l)=>s+(+l.total_cost||0), 0);
        const monthLiters  = monthLogs.reduce((s,l)=>s+(+l.liters||0), 0);
        const avgCostPerL  = monthLiters > 0 ? monthCost / monthLiters : 0;
        const totalCost    = logs.reduce((s,l)=>s+(+l.total_cost||0), 0);

        const vehicles = DB.Vehicles.getActive();
        const drivers  = DB.Drivers.getActive();
        const vOpts = vehicles.map(v=>`<option value="${v.id}">${Utils.esc(v.reg_no)} - ${Utils.esc(v.brand+' '+v.model)}</option>`).join('');
        const dOpts = '<option value="">— None —</option>' + drivers.map(d=>`<option value="${d.id}">${Utils.esc(d.name)}</option>`).join('');

        FuelModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Fuel Management</h2><p>Track fuel consumption, costs, and efficiency</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addFuelBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Fuel Log
                    </button>
                </div>
            </div>

            <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
                <div class="kpi-card" style="--kpi-color:var(--grad-primary);--kpi-color-raw:var(--primary)">
                    <div class="kpi-top"><div class="kpi-label">This Month Cost</div><div class="kpi-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div>
                    <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(monthCost,sym)}</div>
                    <div class="kpi-footer text-muted-c text-sm">Current month</div>
                </div>
                <div class="kpi-card" style="--kpi-color:var(--grad-cyan);--kpi-color-raw:var(--cyan)">
                    <div class="kpi-top"><div class="kpi-label">Month Liters</div><div class="kpi-icon" style="background:rgba(6,182,212,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--cyan)"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg></div></div>
                    <div class="kpi-value">${monthLiters.toFixed(1)} L</div>
                    <div class="kpi-footer text-muted-c text-sm">This month</div>
                </div>
                <div class="kpi-card" style="--kpi-color:var(--grad-warning);--kpi-color-raw:var(--amber)">
                    <div class="kpi-top"><div class="kpi-label">Avg Cost/Liter</div><div class="kpi-icon" style="background:rgba(245,158,11,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--amber)"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg></div></div>
                    <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(avgCostPerL,sym)}</div>
                    <div class="kpi-footer text-muted-c text-sm">This month</div>
                </div>
                <div class="kpi-card" style="--kpi-color:var(--grad-success);--kpi-color-raw:var(--emerald)">
                    <div class="kpi-top"><div class="kpi-label">Total Fuel Spend</div><div class="kpi-icon" style="background:rgba(16,185,129,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--emerald)"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg></div></div>
                    <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(totalCost,sym)}</div>
                    <div class="kpi-footer text-muted-c text-sm">All time</div>
                </div>
            </div>

            <div class="charts-grid" style="margin-bottom:1.5rem">
                <div class="chart-card">
                    <div class="chart-header"><div class="chart-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>Monthly Fuel Cost (6 months)</div></div>
                    <div class="chart-body"><canvas id="fuelChart"></canvas></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="fSearch" placeholder="Search fuel logs...">
                        </div>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Date</th><th>Vehicle</th><th>Driver</th>
                            <th>Station</th><th>Liters</th><th>Rate/L</th>
                            <th>Total Cost</th><th>Odometer</th><th>Type</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="fuelTbody">${FuelModule._rows(logs, sym)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="fuelModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                        <span id="fuelModalTitle">Add Fuel Log</span>
                    </div>
                    <button class="modal-close" id="fuelModalClose">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="fuelForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Vehicle <span class="req">*</span></label>
                                <select name="vehicle_id" class="form-select" required>${vOpts}</select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Driver</label>
                                <select name="driver_id" class="form-select">${dOpts}</select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date <span class="req">*</span></label>
                                <input type="date" name="date" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Station</label>
                                <input type="text" name="station" class="form-input" placeholder="Lanka IOC / CPC...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Liters</label>
                                <input type="number" name="liters" class="form-input" id="fuelLiters" placeholder="0.0" min="0" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cost/Liter (${sym})</label>
                                <input type="number" name="cost_per_liter" class="form-input" id="fuelCPL" placeholder="0.00" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Total Cost (${sym})</label>
                                <input type="number" name="total_cost" class="form-input" id="fuelTotal" placeholder="0.00" min="0" step="0.01">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Odometer (km)</label>
                                <input type="number" name="odometer" class="form-input" placeholder="0" min="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fill Type</label>
                                <select name="full_tank" class="form-select">
                                    <option value="1">Full Tank</option>
                                    <option value="0">Partial Fill</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Additional notes..."></textarea>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Attachment (Receipt / Bill)</label>
                            <input type="file" id="fuelAttachmentFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="attachment_id" id="fuelAttachmentId">
                            <div id="fuelAttachmentInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="fuelModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Fuel Log</button>
                    </div>
                </form>
            </div>
        </div>`;

        FuelModule._renderChart();
        FuelModule._bindEvents();
    },

    _rows(logs, sym) {
        if (!logs.length) return `<tr><td colspan="10"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
            <p>No fuel logs yet.</p></div></td></tr>`;
        return logs.map(l=>`
            <tr>
                <td>${Utils.formatDate(l.date)}</td>
                <td><div class="table-cell-main">${Utils.esc(l.reg_no||'—')}</div><div class="table-cell-sub">${Utils.esc(l.vehicle_name||'')}</div></td>
                <td>${Utils.esc(l.driver_name||'—')}</td>
                <td>${Utils.esc(l.station||'—')}</td>
                <td>${(+l.liters||0).toFixed(1)} L</td>
                <td>${(+l.cost_per_liter||0) > 0 ? Utils.currency(l.cost_per_liter,sym) : '—'}</td>
                <td style="font-weight:600;color:var(--danger)">${Utils.currency(l.total_cost,sym)}</td>
                <td>${l.odometer ? (+l.odometer).toLocaleString()+' km' : '—'}</td>
                <td>${l.full_tank == 1 ? '<span class="badge badge-success">Full</span>' : '<span class="badge badge-neutral">Partial</span>'}</td>
                <td>
                    <div class="table-actions">
                        ${l.attachment_id ? `<button class="btn-icon" data-view-att="${l.attachment_id}" title="View Receipt" style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg></button>` : ''}
                        <button class="btn-icon" data-edit="${l.id}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        </button>
                        <button class="btn-icon danger" data-del="${l.id}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`).join('');
    },

    _renderChart() {
        const canvas = document.getElementById('fuelChart');
        if (!canvas) return;
        if (FuelModule._chart) { FuelModule._chart.destroy(); FuelModule._chart = null; }
        const data   = DB.Analytics.monthlyCosts(6);
        const labels = data.map(d => Utils.monthLabel(d.period));
        const values = data.map(d => +(d.fuel||0));
        FuelModule._chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{ label: 'Fuel Cost (Rs.)', data: values, backgroundColor: 'rgba(99,102,241,0.7)', borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 6 }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
        });
    },

    _bindEvents() {
        const modal  = document.getElementById('fuelModal');
        const form   = document.getElementById('fuelForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        // Auto-calc total
        const calcTotal = () => {
            const l = parseFloat(document.getElementById('fuelLiters').value)||0;
            const c = parseFloat(document.getElementById('fuelCPL').value)||0;
            if (l && c) document.getElementById('fuelTotal').value = (l*c).toFixed(2);
        };
        document.getElementById('fuelLiters').oninput = calcTotal;
        document.getElementById('fuelCPL').oninput    = calcTotal;

        document.getElementById('addFuelBtn').onclick = () => {
            document.getElementById('fuelModalTitle').textContent = 'Add Fuel Log';
            form.reset(); form.elements['id'].value = '';
            form.elements['date'].value = Utils.today();
            document.getElementById('fuelAttachmentInfo').innerHTML = '';
            openFn();
        };
        document.getElementById('fuelModalClose').onclick  = closeFn;
        document.getElementById('fuelModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = async e => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';
            
            try {
                const d = Object.fromEntries(new FormData(form).entries());
                const fileInput = document.getElementById('fuelAttachmentFile');
                
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const dataUrl = await Utils.fileToDataURL(file);
                    const attId = 'att_' + Utils.id();
                    await DB.Attachments.save(attId, dataUrl, file.type);
                    d.attachment_id = attId;
                }
                
                if (d.id) { DB.Fuel.update(d); Utils.toast('Fuel log updated', 'success'); }
                else { d.id = Utils.id(); DB.Fuel.add(d); Utils.toast('Fuel log added', 'success'); }
                
                closeFn(); FuelModule.render();
            } catch (err) {
                console.error(err);
                Utils.toast('Failed to save fuel log', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Save Fuel Log';
            }
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const f = DB.Fuel.getById(btn.dataset.edit);
                if (!f) return;
                document.getElementById('fuelModalTitle').textContent = 'Edit Fuel Log';
                form.reset();
                Object.entries(f).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
                document.getElementById('fuelAttachmentInfo').innerHTML = f.attachment_id 
                    ? `<span style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg> File attached</span>` 
                    : '';
                openFn();
            };
        });

        document.querySelectorAll('[data-view-att]').forEach(btn => {
            btn.onclick = async () => {
                const att = await DB.Attachments.get(btn.dataset.viewAtt);
                if (att) Utils.viewAttachment(att.dataUrl, att.type);
                else Utils.toast('Attachment not found', 'error');
            };
        });

        document.querySelectorAll('[data-del]').forEach(btn => {
            btn.onclick = async () => {
                const ok = await Utils.confirm('Delete this fuel log?', 'Delete Fuel Log');
                if (ok) { DB.Fuel.delete(btn.dataset.del); Utils.toast('Fuel log deleted', 'success'); FuelModule.render(); }
            };
        });

        document.getElementById('fSearch').oninput = function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('#fuelTbody tr').forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
            });
        };
    },
};
