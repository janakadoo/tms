/* ================================================================
   TMS | CUSTOMERS MODULE
   ================================================================ */
import { DB }    from '../db.js?v=2';
import { Utils } from '../utils.js?v=2';

export const CustomerModule = {
    _container: null,
    init(container) { CustomerModule._container = container; CustomerModule.render(); },

    render() {
        const customers = DB.Customers.getAll();
        const sym       = DB.Settings.get('currency_symbol') || 'Rs.';
        const corp      = customers.filter(c=>c.type==='Corporate').length;
        const indiv     = customers.filter(c=>c.type==='Individual').length;
        const totalRev  = customers.reduce((s,c)=>s+(+c.total_revenue||0),0);

        CustomerModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Customer Management</h2><p>Manage clients linked to trips and revenue</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addCustomerBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Customer
                    </button>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip"><div class="dot" style="background:#8fa4c4"></div><strong>${customers.length}</strong> Total</div>
                <div class="stat-chip"><div class="dot" style="background:var(--primary)"></div><strong>${corp}</strong> Corporate</div>
                <div class="stat-chip"><div class="dot" style="background:var(--cyan)"></div><strong>${indiv}</strong> Individual</div>
                <div class="stat-chip"><div class="dot" style="background:var(--success)"></div><strong>${Utils.currency(totalRev,sym)}</strong> Total Revenue</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="custSearch" placeholder="Search customers...">
                        </div>
                        <select class="form-select" id="custTypeFilter" style="max-width:160px">
                            <option value="">All Types</option>
                            <option>Individual</option><option>Corporate</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Customer</th><th>Type</th><th>Company</th>
                            <th>Contact</th><th>Email</th><th>Trips</th>
                            <th>Revenue</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="customersTbody">${CustomerModule._rows(customers, sym)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="customerModal">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
                        <span id="custModalTitle">Add Customer</span>
                    </div>
                    <button class="modal-close" id="custModalClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="customerForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group" style="flex:2">
                                <label class="form-label">Name <span class="req">*</span></label>
                                <input type="text" name="name" class="form-input" required placeholder="Full name / Company name">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select name="type" class="form-select">
                                    <option>Individual</option><option>Corporate</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Company</label>
                            <input type="text" name="company" class="form-input" placeholder="Company name (if applicable)">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Contact</label>
                                <input type="text" name="contact" class="form-input" placeholder="0112345678">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" name="email" class="form-input" placeholder="client@company.com">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Address</label>
                            <textarea name="address" class="form-textarea" placeholder="Full address..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Additional notes..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="custModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Customer</button>
                    </div>
                </form>
            </div>
        </div>`;

        CustomerModule._bindEvents();
    },

    _rows(customers, sym) {
        if (!customers.length) return `<tr><td colspan="8"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
            <p>No customers yet. Add your first client!</p></div></td></tr>`;
        return customers.map(c=>`
            <tr data-type="${Utils.esc(c.type)}">
                <td>
                    <div style="display:flex;align-items:center;gap:0.625rem">
                        <div class="user-avatar" style="width:32px;height:32px;font-size:0.8rem;flex-shrink:0;background:var(--grad-cyan)">${c.name.charAt(0).toUpperCase()}</div>
                        <div class="table-cell-main">${Utils.esc(c.name)}</div>
                    </div>
                </td>
                <td>${c.type === 'Corporate' ? '<span class="badge badge-primary">Corporate</span>' : '<span class="badge badge-info">Individual</span>'}</td>
                <td>${Utils.esc(c.company||'—')}</td>
                <td>${Utils.esc(c.contact||'—')}</td>
                <td>${Utils.esc(c.email||'—')}</td>
                <td>${c.trip_count||0}</td>
                <td style="font-weight:600;color:var(--success)">${+c.total_revenue > 0 ? Utils.currency(c.total_revenue,sym) : '—'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" data-edit="${c.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                        <button class="btn-icon danger" data-del="${c.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                    </div>
                </td>
            </tr>`).join('');
    },

    _bindEvents() {
        const modal  = document.getElementById('customerModal');
        const form   = document.getElementById('customerForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        document.getElementById('addCustomerBtn').onclick = () => {
            document.getElementById('custModalTitle').textContent = 'Add Customer';
            form.reset(); form.elements['id'].value = '';
            openFn();
        };
        document.getElementById('custModalClose').onclick  = closeFn;
        document.getElementById('custModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = e => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form).entries());
            if (d.id) { DB.Customers.update(d); Utils.toast('Customer updated', 'success'); }
            else { d.id = Utils.id(); DB.Customers.add(d); Utils.toast('Customer added', 'success'); }
            closeFn(); CustomerModule.render();
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const c = DB.Customers.getById(btn.dataset.edit);
                if (!c) return;
                document.getElementById('custModalTitle').textContent = 'Edit Customer';
                Object.entries(c).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
                openFn();
            };
        });

        document.querySelectorAll('[data-del]').forEach(btn => {
            btn.onclick = async () => {
                const ok = await Utils.confirm('Delete this customer?', 'Delete Customer');
                if (ok) { DB.Customers.delete(btn.dataset.del); Utils.toast('Customer deleted', 'success'); CustomerModule.render(); }
            };
        });

        const filterRows = () => {
            const term = document.getElementById('custSearch').value.toLowerCase();
            const type = document.getElementById('custTypeFilter').value;
            document.querySelectorAll('#customersTbody tr[data-type]').forEach(row => {
                row.style.display = (row.innerText.toLowerCase().includes(term) && (!type || row.dataset.type === type)) ? '' : 'none';
            });
        };
        document.getElementById('custSearch').oninput       = filterRows;
        document.getElementById('custTypeFilter').onchange  = filterRows;
    },
};
