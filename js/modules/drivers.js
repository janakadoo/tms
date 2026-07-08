/* ================================================================
   TMS | DRIVERS MODULE
   ================================================================ */
import { DB }    from '../db.js?v=3';
import { Utils } from '../utils.js?v=3';

export const DriverModule = {
    _container: null,
    init(container) { DriverModule._container = container; DriverModule.render(); },

    render() {
        const drivers = DB.Drivers.getAll();
        const total    = drivers.length;
        const active   = drivers.filter(d=>d.status==='Active').length;
        const onLeave  = drivers.filter(d=>d.status==='On Leave').length;
        const inactive = drivers.filter(d=>d.status==='Inactive'||d.status==='Suspended').length;

        DriverModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Driver Management</h2><p>Manage drivers, licenses, and performance</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addDriverBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Driver
                    </button>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip"><div class="dot" style="background:#8fa4c4"></div><strong>${total}</strong> Total</div>
                <div class="stat-chip"><div class="dot" style="background:var(--success)"></div><strong>${active}</strong> Active</div>
                <div class="stat-chip"><div class="dot" style="background:var(--warning)"></div><strong>${onLeave}</strong> On Leave</div>
                <div class="stat-chip"><div class="dot" style="background:var(--text-muted)"></div><strong>${inactive}</strong> Inactive</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="dSearch" placeholder="Search drivers...">
                        </div>
                        <select class="form-select" id="dStatusFilter" style="max-width:150px">
                            <option value="">All Status</option>
                            <option>Active</option><option>On Leave</option>
                            <option>Inactive</option><option>Suspended</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Name</th><th>License No</th><th>License Expiry</th>
                            <th>Contact</th><th>Blood Group</th><th>Rating</th>
                            <th>Trips</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="driversTbody">${DriverModule._rows(drivers)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- MODAL -->
        <div class="modal-overlay" id="driverModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                        <span id="driverModalTitle">Add Driver</span>
                    </div>
                    <button class="modal-close" id="driverModalClose">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="driverForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group" style="grid-column:span 2">
                                <label class="form-label">Full Name <span class="req">*</span></label>
                                <input type="text" name="name" class="form-input" required placeholder="Kasun Perera">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option>Active</option><option>On Leave</option>
                                    <option>Inactive</option><option>Suspended</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">License No</label>
                                <input type="text" name="license_no" class="form-input" placeholder="B1234567">
                            </div>
                            <div class="form-group">
                                <label class="form-label">License Expiry</label>
                                <input type="date" name="license_expiry" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Joined Date</label>
                                <input type="date" name="joined_date" class="form-input">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Contact</label>
                                <input type="text" name="contact" class="form-input" placeholder="0771234567">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" name="email" class="form-input" placeholder="driver@mail.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Blood Group</label>
                                <select name="blood_group" class="form-select">
                                    <option value="">Unknown</option>
                                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                                    <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Emergency Contact</label>
                                <input type="text" name="emergency_contact" class="form-input" placeholder="0701234567">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Rating (0-5)</label>
                                <input type="number" name="rating" class="form-input" placeholder="4.5" min="0" max="5" step="0.1">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Address</label>
                            <textarea name="address" class="form-textarea" placeholder="Home address..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Additional notes..."></textarea>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Driving License Copy</label>
                            <input type="file" id="driverLicenseFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="license_attachment_id" id="driverLicenseId">
                            <div id="driverLicenseInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="driverModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Driver</button>
                    </div>
                </form>
            </div>
        </div>`;

        DriverModule._bindEvents();
    },

    _rows(drivers) {
        if (!drivers.length) return `<tr><td colspan="9"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            <p>No drivers found. Add your first driver!</p></div></td></tr>`;

        const stars = r => { const n = Math.round(+r||0); return '★'.repeat(n)+'☆'.repeat(5-n); };
        return drivers.map(d => `
            <tr data-name="${Utils.esc(d.name)}" data-status="${Utils.esc(d.status)}">
                <td>
                    <div style="display:flex;align-items:center;gap:0.625rem">
                        <div class="user-avatar" style="width:32px;height:32px;font-size:0.8rem;flex-shrink:0">${d.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="table-cell-main">${Utils.esc(d.name)}</div>
                            <div class="table-cell-sub">${Utils.esc(d.email||'')}</div>
                        </div>
                    </div>
                </td>
                <td>${Utils.esc(d.license_no)||'—'}</td>
                <td>${d.license_expiry ? `<span class="expiry-tag ${Utils.expiryClass(d.license_expiry)}">${Utils.expiryLabel(d.license_expiry)}</span>` : '—'}</td>
                <td>${Utils.esc(d.contact)||'—'}</td>
                <td>${d.blood_group ? `<span class="badge badge-info">${d.blood_group}</span>` : '—'}</td>
                <td><span style="color:var(--warning);font-size:0.8rem;letter-spacing:1px" title="${d.rating||0}/5">${stars(d.rating)}</span></td>
                <td>${d.trip_count||0}</td>
                <td>${Utils.driverStatusBadge(d.status)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" data-view="${d.id}" title="View Details" style="color:var(--success)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
                        ${d.license_attachment_id ? `<button class="btn-icon" data-view-att="${d.license_attachment_id}" title="View License" style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg></button>` : ''}
                        <button class="btn-icon" data-edit="${d.id}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        </button>
                        <button class="btn-icon danger" data-del="${d.id}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`).join('');
    },

    _bindEvents() {
        const modal  = document.getElementById('driverModal');
        const form   = document.getElementById('driverForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        document.getElementById('addDriverBtn').onclick = () => {
            document.getElementById('driverModalTitle').textContent = 'Add Driver';
            form.reset(); form.elements['id'].value = '';
            document.getElementById('driverLicenseInfo').innerHTML = '';
            openFn();
        };
        document.getElementById('driverModalClose').onclick  = closeFn;
        document.getElementById('driverModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = async e => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';
            try {
                const d = Object.fromEntries(new FormData(form).entries());
                const fileInput = document.getElementById('driverLicenseFile');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const dataUrl = await Utils.fileToDataURL(file);
                    const attId = 'att_' + Utils.id();
                    await DB.Attachments.save(attId, dataUrl, file.type);
                    d.license_attachment_id = attId;
                }
                
                if (d.id) { DB.Drivers.update(d); Utils.toast('Driver updated', 'success'); }
                else { d.id = Utils.id(); DB.Drivers.add(d); Utils.toast('Driver added', 'success'); }
                
                closeFn(); DriverModule.render(); window.App && App.updateAlerts();
            } catch (err) {
                console.error(err); Utils.toast('Failed to save', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Save Driver';
            }
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const d = DB.Drivers.getById(btn.dataset.edit);
                if (!d) return;
                document.getElementById('driverModalTitle').textContent = 'Edit Driver';
                form.reset();
                Object.entries(d).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
                document.getElementById('driverLicenseInfo').innerHTML = d.license_attachment_id 
                    ? `<span style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg> File attached</span>` 
                    : '';
                openFn();
            };
        });

        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => {
                const d = DB.Drivers.getById(btn.dataset.view);
                if (!d) return;
                const html = `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">NAME</strong><br>${Utils.esc(d.name)}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">EMAIL</strong><br>${Utils.esc(d.email || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">CONTACT</strong><br>${Utils.esc(d.contact || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">EMERGENCY</strong><br>${Utils.esc(d.emergency_contact || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">LICENSE NO</strong><br>${Utils.esc(d.license_no || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">LICENSE EXPIRY</strong><br>${d.license_expiry ? Utils.formatDate(d.license_expiry) : '—'}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">BLOOD GROUP</strong><br>${Utils.esc(d.blood_group || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">JOINED DATE</strong><br>${d.joined_date ? Utils.formatDate(d.joined_date) : '—'}</div>
                        <div style="grid-column:1/-1;"><strong style="color:var(--text-muted);font-size:0.75rem;">ADDRESS</strong><br>${Utils.esc(d.address || '—')}</div>
                    </div>
                    <div>
                        <strong style="color:var(--text-muted);font-size:0.75rem;">NOTES / REMARKS</strong>
                        <div style="background:var(--bg-input);padding:0.75rem;border-radius:var(--r-md);margin-top:0.5rem;min-height:60px;">
                            ${Utils.esc(d.notes || 'No remarks provided.')}
                        </div>
                    </div>
                `;
                Utils.viewDialog('Driver Details', html);
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
                const ok = await Utils.confirm('Delete this driver?', 'Delete Driver');
                if (ok) { DB.Drivers.delete(btn.dataset.del); Utils.toast('Driver deleted', 'success'); DriverModule.render(); window.App && App.updateAlerts(); }
            };
        });

        const filterRows = () => {
            const term   = document.getElementById('dSearch').value.toLowerCase();
            const status = document.getElementById('dStatusFilter').value;
            document.querySelectorAll('#driversTbody tr[data-name]').forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = (text.includes(term) && (!status || row.dataset.status === status)) ? '' : 'none';
            });
        };
        document.getElementById('dSearch').oninput        = filterRows;
        document.getElementById('dStatusFilter').onchange = filterRows;
    },
};
