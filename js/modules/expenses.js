/* ================================================================
   TMS | EXPENSES MODULE
   ================================================================ */
import { DB }    from '../db.js?v=2';
import { Utils } from '../utils.js?v=2';

const EXPENSE_CATS = ['Fuel','Toll','Insurance','Maintenance','Repair','Tyres','Parking','Licence','Fine','Salary','Other'];
const CAT_COLORS   = ['#6366f1','#06b6d4','#8b5cf6','#10b981','#f59e0b','#f43f5e','#0ea5e9','#ec4899','#14b8a6','#84cc16','#94a3b8'];

export const ExpenseModule = {
    _container: null,
    _chart: null,
    init(container) { ExpenseModule._container = container; ExpenseModule.render(); },

    render() {
        const expenses = DB.Expenses.getAll();
        const sym      = DB.Settings.get('currency_symbol') || 'Rs.';
        const m        = new Date().toISOString().slice(0,7);

        const monthExp  = expenses.filter(e => e.date && e.date.startsWith(m));
        const monthCost = monthExp.reduce((s,e)=>s+(+e.amount||0), 0);
        const totalCost = expenses.reduce((s,e)=>s+(+e.amount||0), 0);

        const vehicles = DB.Vehicles.getActive();
        const vOpts    = '<option value="">— None —</option>' + vehicles.map(v=>`<option value="${v.id}">${Utils.esc(v.reg_no)} - ${Utils.esc(v.brand+' '+v.model)}</option>`).join('');
        const catOpts  = EXPENSE_CATS.map(c=>`<option>${c}</option>`).join('');

        ExpenseModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Expense Tracker</h2><p>Monitor all vehicle-related expenses by category</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addExpenseBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Expense
                    </button>
                </div>
            </div>

            <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:1.5rem">
                <div class="kpi-card" style="--kpi-color:var(--grad-danger);--kpi-color-raw:var(--rose)">
                    <div class="kpi-top"><div class="kpi-label">This Month</div><div class="kpi-icon" style="background:rgba(244,63,94,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--rose)"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg></div></div>
                    <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(monthCost,sym)}</div>
                    <div class="kpi-footer text-muted-c text-sm">${monthExp.length} expenses</div>
                </div>
                <div class="kpi-card" style="--kpi-color:var(--grad-primary);--kpi-color-raw:var(--primary)">
                    <div class="kpi-top"><div class="kpi-label">Total All Time</div><div class="kpi-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div>
                    <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(totalCost,sym)}</div>
                    <div class="kpi-footer text-muted-c text-sm">${expenses.length} expenses</div>
                </div>
            </div>

            <div class="charts-grid" style="margin-bottom:1.5rem">
                <div class="chart-card">
                    <div class="chart-header"><div class="chart-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/></svg>Expense Breakdown</div></div>
                    <div class="chart-body" style="position:relative; height:260px; display:flex; justify-content:center"><canvas id="expenseChart"></canvas></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="eSearch" placeholder="Search expenses...">
                        </div>
                        <select class="form-select" id="eCatFilter" style="max-width:160px">
                            <option value="">All Categories</option>
                            ${EXPENSE_CATS.map(c=>`<option>${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Date</th><th>Category</th><th>Title</th>
                            <th>Vehicle</th><th>Amount</th><th>Payment</th>
                            <th>Receipt</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="expenseTbody">${ExpenseModule._rows(expenses, sym)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal-overlay" id="expenseModal">
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
                        <span id="expModalTitle">Add Expense</span>
                    </div>
                    <button class="modal-close" id="expModalClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="expenseForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select name="category" class="form-select">${catOpts}</select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date <span class="req">*</span></label>
                                <input type="date" name="date" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Title / Description <span class="req">*</span></label>
                            <input type="text" name="title" class="form-input" required placeholder="Tyre replacement, toll fee...">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Vehicle</label>
                                <select name="vehicle_id" class="form-select">${vOpts}</select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Amount (${sym}) <span class="req">*</span></label>
                                <input type="number" name="amount" class="form-input" required placeholder="0.00" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Payment Method</label>
                                <select name="payment_method" class="form-select">
                                    <option>Cash</option><option>Bank Transfer</option>
                                    <option>Card</option><option>Cheque</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Receipt No</label>
                                <input type="text" name="receipt_no" class="form-input" placeholder="REC001">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Additional notes..."></textarea>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Attachment (Receipt / Bill)</label>
                            <input type="file" id="expAttachmentFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="attachment_id" id="expAttachmentId">
                            <div id="expAttachmentInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="expModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Expense</button>
                    </div>
                </form>
            </div>
        </div>`;

        ExpenseModule._renderChart();
        ExpenseModule._bindEvents();
    },

    _rows(expenses, sym) {
        if (!expenses.length) return `<tr><td colspan="8"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
            <p>No expenses recorded yet.</p></div></td></tr>`;
        return expenses.map(e=>`
            <tr data-cat="${Utils.esc(e.category)}">
                <td>${Utils.formatDate(e.date)}</td>
                <td><span class="badge badge-primary">${Utils.esc(e.category)}</span></td>
                <td class="table-cell-main">${Utils.esc(e.title)}</td>
                <td>${Utils.esc(e.reg_no||'—')}</td>
                <td style="font-weight:600;color:var(--danger)">${Utils.currency(e.amount,sym)}</td>
                <td>${Utils.esc(e.payment_method||'—')}</td>
                <td>${Utils.esc(e.receipt_no||'—')}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" data-view="${e.id}" title="View Details" style="color:var(--success)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
                        ${e.attachment_id ? `<button class="btn-icon" data-view-att="${e.attachment_id}" title="View Receipt" style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg></button>` : ''}
                        <button class="btn-icon" data-edit="${e.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                        <button class="btn-icon danger" data-del="${e.id}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                    </div>
                </td>
            </tr>`).join('');
    },

    _renderChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        if (ExpenseModule._chart) { ExpenseModule._chart.destroy(); ExpenseModule._chart = null; }
        const data   = DB.Analytics.expenseByCategory();
        if (!data.length) return;
        ExpenseModule._chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: data.map(d=>d.category),
                datasets: [{ data: data.map(d=>+d.total), backgroundColor: CAT_COLORS.slice(0,data.length), borderWidth: 2, borderColor: 'var(--bg-card)', hoverBorderColor: 'var(--border-strong)' }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' } } }
        });
    },

    _bindEvents() {
        const modal  = document.getElementById('expenseModal');
        const form   = document.getElementById('expenseForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        document.getElementById('addExpenseBtn').onclick = () => {
            document.getElementById('expModalTitle').textContent = 'Add Expense';
            form.reset(); form.elements['id'].value = '';
            form.elements['date'].value = Utils.today();
            document.getElementById('expAttachmentInfo').innerHTML = '';
            openFn();
        };
        document.getElementById('expModalClose').onclick  = closeFn;
        document.getElementById('expModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = async e => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';
            
            try {
                const d = Object.fromEntries(new FormData(form).entries());
                const fileInput = document.getElementById('expAttachmentFile');
                
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const dataUrl = await Utils.fileToDataURL(file);
                    const attId = 'att_' + Utils.id();
                    await DB.Attachments.save(attId, dataUrl, file.type);
                    d.attachment_id = attId;
                }
                
                if (d.id) { DB.Expenses.update(d); Utils.toast('Expense updated', 'success'); }
                else { d.id = Utils.id(); DB.Expenses.add(d); Utils.toast('Expense added', 'success'); }
                
                closeFn(); ExpenseModule.render();
            } catch (err) {
                console.error(err);
                Utils.toast('Failed to save expense', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Save Expense';
            }
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const e = DB.Expenses.getById(btn.dataset.edit);
                if (!e) return;
                document.getElementById('expModalTitle').textContent = 'Edit Expense';
                form.reset();
                Object.entries(e).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
                document.getElementById('expAttachmentInfo').innerHTML = e.attachment_id 
                    ? `<span style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg> File attached</span>` 
                    : '';
                openFn();
            };
        });

        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => {
                const e = DB.Expenses.getById(btn.dataset.view);
                if (!e) return;
                const html = `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">DATE</strong><br>${Utils.formatDate(e.date)}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">CATEGORY</strong><br><span class="badge badge-primary">${Utils.esc(e.category)}</span></div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">TITLE</strong><br>${Utils.esc(e.title)}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">VEHICLE</strong><br>${Utils.esc(e.reg_no || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">TRIP</strong><br>${Utils.esc(e.trip_name || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">AMOUNT</strong><br><span style="color:var(--danger);font-weight:600;">${Utils.currency(e.amount)}</span></div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">PAYMENT METH.</strong><br>${Utils.esc(e.payment_method || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">RECEIPT NO</strong><br>${Utils.esc(e.receipt_no || '—')}</div>
                    </div>
                    <div>
                        <strong style="color:var(--text-muted);font-size:0.75rem;">REMARKS / DESCRIPTION</strong>
                        <div style="background:var(--bg-input);padding:0.75rem;border-radius:var(--r-md);margin-top:0.5rem;min-height:60px;">
                            ${Utils.esc(e.description || 'No remarks provided.')}
                        </div>
                    </div>
                    ${e.attachment_id ? `
                    <div style="margin-top:1rem;">
                        <button class="btn btn-secondary" onclick="document.querySelector('[data-view-att=\\'${e.attachment_id}\\']').click()">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;vertical-align:middle;margin-right:0.25rem;"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg>
                            View Attachment
                        </button>
                    </div>` : ''}
                `;
                Utils.viewDialog('Expense Details', html);
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
                const ok = await Utils.confirm('Delete this expense?', 'Delete Expense');
                if (ok) { DB.Expenses.delete(btn.dataset.del); Utils.toast('Expense deleted', 'success'); ExpenseModule.render(); }
            };
        });

        const filterRows = () => {
            const term = document.getElementById('eSearch').value.toLowerCase();
            const cat  = document.getElementById('eCatFilter').value;
            document.querySelectorAll('#expenseTbody tr[data-cat]').forEach(row => {
                row.style.display = (row.innerText.toLowerCase().includes(term) && (!cat || row.dataset.cat === cat)) ? '' : 'none';
            });
        };
        document.getElementById('eSearch').oninput      = filterRows;
        document.getElementById('eCatFilter').onchange  = filterRows;
    },
};
