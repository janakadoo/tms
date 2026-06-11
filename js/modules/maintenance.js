/* ================================================================
   TMS | MAINTENANCE MODULE
   ================================================================ */
import { DB }    from '../db.js';
import { Utils } from '../utils.js';

const MAINT_TYPES = ['Routine Service','Oil Change','Tyre Rotation','Tyre Replacement','Brake Service','Engine Repair','Electrical','Body Work','AC Service','Major Overhaul','Other'];

export const MaintenanceModule = {
    _container: null,
    init(container) { MaintenanceModule._container = container; MaintenanceModule.render(); },

    render() {
        const records  = DB.Maintenance.getAll();
        const sym      = DB.Settings.get('currency_symbol') || 'Rs.';
        const today    = Utils.today();
        const sched    = records.filter(r=>r.status==='Scheduled').length;
        const inProg   = records.filter(r=>r.status==='In Progress').length;
        const comp     = records.filter(r=>r.status==='Completed').length;
        const overdue  = records.filter(r=>r.next_due_date && r.next_due_date < today && r.status !== 'Completed').length;
        const totalCost= records.filter(r=>r.status==='Completed').reduce((s,r)=>s+(+r.cost||0),0);

        const vehicles = DB.Vehicles.getActive();
        const vOpts    = vehicles.map(v=>`<option value="${v.id}">${Utils.esc(v.reg_no)} - ${Utils.esc(v.brand+' '+v.model)}</option>`).join('');
        const typeOpts = MAINT_TYPES.map(t=>`<option>${t}</option>`).join('');

        MaintenanceModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Service & Maintenance</h2><p>Track vehicle servicing, repairs and next due schedules</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addMaintBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Service Record
                    </button>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip"><div class="dot" style="background:var(--info)"></div><strong>${sched}</strong> Scheduled</div>
                <div class="stat-chip"><div class="dot" style="background:var(--warning)"></div><strong>${inProg}</strong> In Progress</div>
                <div class="stat-chip"><div class="dot" style="background:var(--success)"></div><strong>${comp}</strong> Completed</div>
                <div class="stat-chip"><div class="dot" style="background:var(--danger)"></div><strong>${overdue}</strong> Overdue</div>
                <div class="stat-chip"><div class="dot" style="background:var(--primary)"></div><strong>${Utils.currency(totalCost,sym)}</strong> Total Spent</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="mSearch" placeholder="Search records...">
                        </div>
                        <select class="form-select" id="mStatusFilter" style="max-width:150px">
                            <option value="">All Status</option>
                            <option>Scheduled</option><option>In Progress</option>
                            <option>Completed</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Vehicle</th><th>Type</th><th>Date</th>
                            <th>Garage</th><th>Cost</th><th>Next Due Date</th>
                            <th>Next Due KM</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="maintTbody">${MaintenanceModule._rows(records, sym, today)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="maintModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg>
                        <span id="maintModalTitle">Add Service Record</span>
                    </div>
                    <button class="modal-close" id="maintModalClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="maintForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Vehicle <span class="req">*</span></label>
                                <select name="vehicle_id" class="form-select" required>${vOpts}</select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Service Type <span class="req">*</span></label>
                                <select name="type" class="form-select">${typeOpts}</select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option>Scheduled</option><option>In Progress</option><option>Completed</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Service Date</label>
                                <input type="date" name="date" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Next Due Date</label>
                                <input type="date" name="next_due_date" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Next Due KM</label>
                                <input type="number" name="next_due_km" class="form-input" placeholder="0" min="0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Garage / Workshop</label>
                                <input type="text" name="garage" class="form-input" placeholder="Toyota Lanka, Local...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cost (${sym})</label>
                                <input type="number" name="cost" class="form-input" placeholder="0.00" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea name="description" class="form-textarea" placeholder="Details about the service or repair..."></textarea>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Attachment (Bill / Report)</label>
                            <input type="file" id="maintAttachmentFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="attachment_id" id="maintAttachmentId">
                            <div id="maintAttachmentInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="maintModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Record</button>
                    </div>
                </form>
            </div>
        </div>`;

        MaintenanceModule._bindEvents();
    },

    _rows(records, sym, today) {
        if (!records.length) return `<tr><td colspan="9"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63"/></svg>
            <p>No maintenance records yet.</p></div></td></tr>`;
        return records.map(r => {
            const overdue = r.next_due_date && r.next_due_date < today && r.status !== 'Completed';
            return `
            <tr data-status="${Utils.esc(r.status)}">
                <td><div class="table-cell-main">${Utils.esc(r.reg_no||'—')}</div><div class="table-cell-sub">${Utils.esc(r.vehicle_name||'')}</div></td>
                <td>${Utils.esc(r.type)}</td>
                <td>${r.date ? Utils.formatDate(r.date) : '<span class="text-muted-c text-xs">Not done</span>'}</td>
                <td>${Utils.esc(r.garage||'—')}</td>
                <td>${+r.cost > 0 ? `<span style="font-weight:600;color:var(--danger)">${Utils.currency(r.cost,sym)}</span>` : '—'}</td>
                <td>${r.next_due_date ? `<span class="expiry-tag ${overdue?'expiry-expired':'expiry-ok'}">${Utils.formatDate(r.next_due_date)}</span>` : '—'}</td>
                <td>${r.next_due_km ? (+r.next_due_km).toLocaleString()+' km' : '—'}</td>
                <td>${Utils.maintStatusBadge(r.status)}</td>
                <td>
                    <div class="table-actions">
                        ${r.attachment_id ? `<button class="btn-icon" data-view-att="${r.attachment_id}" title="View Bill" style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg></button>` : ''}
                        <button class="btn-icon" data-edit="${r.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                        <button class="btn-icon danger" data-del="${r.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    _bindEvents() {
        const modal  = document.getElementById('maintModal');
        const form   = document.getElementById('maintForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        document.getElementById('addMaintBtn').onclick = () => {
            document.getElementById('maintModalTitle').textContent = 'Add Service Record';
            form.reset(); form.elements['id'].value = '';
            form.elements['date'].value = Utils.today();
            document.getElementById('maintAttachmentInfo').innerHTML = '';
            openFn();
        };
        document.getElementById('maintModalClose').onclick  = closeFn;
        document.getElementById('maintModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = async e => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';
            
            try {
                const d = Object.fromEntries(new FormData(form).entries());
                const fileInput = document.getElementById('maintAttachmentFile');
                
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const dataUrl = await Utils.fileToDataURL(file);
                    const attId = 'att_' + Utils.id();
                    await DB.Attachments.save(attId, dataUrl, file.type);
                    d.attachment_id = attId;
                }
                
                if (d.id) { DB.Maintenance.update(d); Utils.toast('Record updated', 'success'); }
                else { d.id = Utils.id(); DB.Maintenance.add(d); Utils.toast('Record added', 'success'); }
                
                closeFn(); MaintenanceModule.render(); window.App && App.updateAlerts();
            } catch (err) {
                console.error(err);
                Utils.toast('Failed to save record', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Save Record';
            }
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const r = DB.Maintenance.getById(btn.dataset.edit);
                if (!r) return;
                document.getElementById('maintModalTitle').textContent = 'Edit Service Record';
                form.reset();
                Object.entries(r).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
                document.getElementById('maintAttachmentInfo').innerHTML = r.attachment_id 
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
                const ok = await Utils.confirm('Delete this maintenance record?', 'Delete Record');
                if (ok) { DB.Maintenance.delete(btn.dataset.del); Utils.toast('Record deleted', 'success'); MaintenanceModule.render(); window.App && App.updateAlerts(); }
            };
        });

        const filterRows = () => {
            const term   = document.getElementById('mSearch').value.toLowerCase();
            const status = document.getElementById('mStatusFilter').value;
            document.querySelectorAll('#maintTbody tr[data-status]').forEach(row => {
                row.style.display = (row.innerText.toLowerCase().includes(term) && (!status || row.dataset.status === status)) ? '' : 'none';
            });
        };
        document.getElementById('mSearch').oninput        = filterRows;
        document.getElementById('mStatusFilter').onchange = filterRows;
    },
};
