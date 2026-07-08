/* ================================================================
   TMS | VEHICLES MODULE
   ================================================================ */
import { DB }    from '../db.js?v=2';
import { Utils } from '../utils.js?v=2';

export const VehicleModule = {
    _container: null,

    init(container) {
        VehicleModule._container = container;
        VehicleModule.render();
    },

    render() {
        const vehicles = DB.Vehicles.getAll();
        const sym = DB.Settings.get('currency_symbol') || 'Rs.';
        const total    = vehicles.length;
        const active   = vehicles.filter(v=>v.status==='Active').length;
        const repair   = vehicles.filter(v=>v.status==='Repair').length;
        const inactive = vehicles.filter(v=>v.status==='Inactive'||v.status==='Scrapped').length;

        VehicleModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left">
                    <h2>Vehicle Fleet</h2>
                    <p>Manage your vehicles, documents, and status</p>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addVehicleBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Vehicle
                    </button>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip"><div class="dot" style="background:#8fa4c4"></div><strong>${total}</strong> Total</div>
                <div class="stat-chip"><div class="dot" style="background:var(--success)"></div><strong>${active}</strong> Active</div>
                <div class="stat-chip"><div class="dot" style="background:var(--warning)"></div><strong>${repair}</strong> Under Repair</div>
                <div class="stat-chip"><div class="dot" style="background:var(--text-muted)"></div><strong>${inactive}</strong> Inactive</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="vSearch" placeholder="Search vehicles...">
                        </div>
                        <select class="form-select" id="vStatusFilter" style="max-width:150px">
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Repair">Under Repair</option>
                            <option value="Scrapped">Scrapped</option>
                        </select>
                        <select class="form-select" id="vTypeFilter" style="max-width:150px">
                            <option value="">All Types</option>
                            <option>Car</option><option>Van</option><option>Bus</option>
                            <option>Lorry</option><option>Bike</option><option>Truck</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table" id="vehiclesTable">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Type</th>
                                <th>Fuel</th>
                                <th>Odometer</th>
                                <th>Insurance</th>
                                <th>Road Tax</th>
                                <th>Status</th>
                                <th>Trips</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="vehiclesTbody">
                            ${VehicleModule._rows(vehicles, sym)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- MODAL -->
        <div class="modal-overlay" id="vehicleModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
                        <span id="vehicleModalTitle">Add Vehicle</span>
                    </div>
                    <button class="modal-close" id="vehicleModalClose">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="vehicleForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Registration No <span class="req">*</span></label>
                                <input type="text" name="reg_no" class="form-input" required placeholder="WP CAB-1234">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Brand</label>
                                <input type="text" name="brand" class="form-input" placeholder="Toyota">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Model</label>
                                <input type="text" name="model" class="form-input" placeholder="Prius">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select name="type" class="form-select">
                                    <option>Car</option><option>Van</option><option>Bus</option>
                                    <option>Lorry</option><option>Truck</option><option>Bike</option><option>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Year</label>
                                <input type="number" name="year" class="form-input" placeholder="2020" min="1990" max="2030">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Color</label>
                                <input type="text" name="color" class="form-input" placeholder="White">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Seats</label>
                                <input type="number" name="seats" class="form-input" placeholder="5" min="1" max="100">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Fuel Type</label>
                                <select name="fuel_type" class="form-select">
                                    <option>Petrol</option><option>Diesel</option>
                                    <option>Electric</option><option>Hybrid</option><option>CNG</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option>Active</option><option>Inactive</option>
                                    <option>Repair</option><option>Scrapped</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Odometer (km)</label>
                                <input type="number" name="odometer" class="form-input" placeholder="0" min="0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Engine No</label>
                                <input type="text" name="engine_no" class="form-input" placeholder="ENG001">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Chassis No</label>
                                <input type="text" name="chassis_no" class="form-input" placeholder="CHS001">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Insurance Expiry</label>
                                <input type="date" name="insurance_expiry" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Road Tax Expiry</label>
                                <input type="date" name="road_tax_expiry" class="form-input">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Tracking Device ID</label>
                                <input type="text" name="tracking_id" class="form-input" placeholder="Device ID">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Tracking Password</label>
                                <input type="text" name="tracking_password" class="form-input" placeholder="Password">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Additional notes..."></textarea>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Insurance Card Copy</label>
                            <input type="file" id="vehInsuranceFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="insurance_attachment_id" id="vehInsuranceId">
                            <div id="vehInsuranceInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Revenue License Copy</label>
                            <input type="file" id="vehRevenueFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="revenue_attachment_id" id="vehRevenueId">
                            <div id="vehRevenueInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Eco Test Report</label>
                            <input type="file" id="vehEcoFile" class="form-input" accept="image/jpeg, image/png, application/pdf">
                            <input type="hidden" name="eco_attachment_id" id="vehEcoId">
                            <div id="vehEcoInfo" style="margin-top:0.5rem;font-size:0.875rem;color:var(--text-muted)"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="vehicleModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Vehicle</button>
                    </div>
                </form>
            </div>
        </div>`;

        VehicleModule._bindEvents();
    },

    _rows(vehicles, sym) {
        if (!vehicles.length) return `<tr><td colspan="9"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
            <p>No vehicles found. Add your first vehicle!</p>
        </div></td></tr>`;

        return vehicles.map(v => `
            <tr data-reg="${Utils.esc(v.reg_no)}" data-status="${Utils.esc(v.status)}" data-type="${Utils.esc(v.type)}">
                <td>
                    <div class="table-cell-main">${Utils.esc(v.reg_no)}</div>
                    <div class="table-cell-sub">${Utils.esc(v.brand)} ${Utils.esc(v.model)} ${v.year || ''}</div>
                </td>
                <td>${Utils.esc(v.type)}</td>
                <td>${Utils.esc(v.fuel_type)}</td>
                <td>${v.odometer ? (+v.odometer).toLocaleString() + ' km' : '—'}</td>
                <td>${v.insurance_expiry ? `<span class="expiry-tag ${Utils.expiryClass(v.insurance_expiry)}">${Utils.expiryLabel(v.insurance_expiry)}</span>` : '<span class="text-muted-c text-xs">Not set</span>'}</td>
                <td>${v.road_tax_expiry ? `<span class="expiry-tag ${Utils.expiryClass(v.road_tax_expiry)}">${Utils.expiryLabel(v.road_tax_expiry)}</span>` : '<span class="text-muted-c text-xs">Not set</span>'}</td>
                <td>${Utils.vehicleStatusBadge(v.status)}</td>
                <td>${v.trip_count || 0}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" data-view="${v.id}" title="View Details" style="color:var(--success)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
                        ${v.insurance_attachment_id ? `<button class="btn-icon" data-view-att="${v.insurance_attachment_id}" title="View Insurance" style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></button>` : ''}
                        ${v.revenue_attachment_id ? `<button class="btn-icon" data-view-att="${v.revenue_attachment_id}" title="View Revenue License" style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg></button>` : ''}
                        ${v.eco_attachment_id ? `<button class="btn-icon" data-view-att="${v.eco_attachment_id}" title="View Eco Test" style="color:var(--success)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg></button>` : ''}
                        ${v.tracking_id && v.tracking_password ? `
                        <button class="btn-icon" title="Track Vehicle" onclick="window.open('https://en.aika168.com/?vms_id=${encodeURIComponent(v.tracking_id)}&vms_pwd=${encodeURIComponent(v.tracking_password)}', 'Tracker_${v.id}', 'width=1000,height=700')">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--cyan)"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        </button>
                        ` : ''}
                        <button class="btn-icon" data-edit="${Utils.esc(v.id)}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        </button>
                        <button class="btn-icon danger" data-del="${Utils.esc(v.id)}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`).join('');
    },

    _bindEvents() {
        const modal  = document.getElementById('vehicleModal');
        const form   = document.getElementById('vehicleForm');
        const openFn = () => modal.classList.add('open');
        const closeFn= () => modal.classList.remove('open');

        document.getElementById('addVehicleBtn').onclick = () => {
            document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
            form.reset(); form.elements['id'].value = '';
            document.getElementById('vehInsuranceInfo').innerHTML = '';
            document.getElementById('vehRevenueInfo').innerHTML = '';
            document.getElementById('vehEcoInfo').innerHTML = '';
            openFn();
        };
        document.getElementById('vehicleModalClose').onclick  = closeFn;
        document.getElementById('vehicleModalCancel').onclick = closeFn;
        modal.onclick = e => { if (e.target === modal) closeFn(); };

        form.onsubmit = async e => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';
            try {
                const d = Object.fromEntries(new FormData(form).entries());
                
                const processFile = async (inputId, hiddenId) => {
                    const input = document.getElementById(inputId);
                    if (input.files.length > 0) {
                        const dataUrl = await Utils.fileToDataURL(input.files[0]);
                        const attId = 'att_' + Utils.id();
                        await DB.Attachments.save(attId, dataUrl, input.files[0].type);
                        d[hiddenId] = attId;
                    }
                };
                
                await processFile('vehInsuranceFile', 'insurance_attachment_id');
                await processFile('vehRevenueFile', 'revenue_attachment_id');
                await processFile('vehEcoFile', 'eco_attachment_id');
                
                if (d.id) { DB.Vehicles.update(d); Utils.toast('Vehicle updated', 'success'); }
                else { d.id = Utils.id(); DB.Vehicles.add(d); Utils.toast('Vehicle added', 'success'); }
                
                closeFn(); VehicleModule.render(); window.App && App.updateAlerts();
            } catch (err) {
                console.error(err); Utils.toast('Failed to save', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Save Vehicle';
            }
        };

        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const v = DB.Vehicles.getById(btn.dataset.edit);
                if (!v) return;
                document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
                form.reset();
                Object.entries(v).forEach(([k,val]) => { if (form.elements[k]) form.elements[k].value = val ?? ''; });
                
                const fileHtml = `<span style="color:var(--info)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px;vertical-align:middle"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg> File attached</span>`;
                document.getElementById('vehInsuranceInfo').innerHTML = v.insurance_attachment_id ? fileHtml : '';
                document.getElementById('vehRevenueInfo').innerHTML   = v.revenue_attachment_id ? fileHtml : '';
                document.getElementById('vehEcoInfo').innerHTML       = v.eco_attachment_id ? fileHtml : '';
                
                openFn();
            };
        });
        
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => {
                const v = DB.Vehicles.getById(btn.dataset.view);
                if (!v) return;
                const html = `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">REG. NO</strong><br>${Utils.esc(v.reg_no)}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">BRAND & MODEL</strong><br>${Utils.esc(v.brand)} ${Utils.esc(v.model)}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">YEAR</strong><br>${Utils.esc(v.year || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">TYPE</strong><br>${Utils.esc(v.type || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">FUEL TYPE</strong><br>${Utils.esc(v.fuel_type || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">ODOMETER</strong><br>${v.odometer ? (+v.odometer).toLocaleString() + ' km' : '—'}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">ENGINE NO</strong><br>${Utils.esc(v.engine_no || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">CHASSIS NO</strong><br>${Utils.esc(v.chassis_no || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">INSURANCE EXPIRY</strong><br>${v.insurance_expiry ? Utils.formatDate(v.insurance_expiry) : '—'}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">ROAD TAX EXPIRY</strong><br>${v.road_tax_expiry ? Utils.formatDate(v.road_tax_expiry) : '—'}</div>
                    </div>
                    <div>
                        <strong style="color:var(--text-muted);font-size:0.75rem;">NOTES / REMARKS</strong>
                        <div style="background:var(--bg-input);padding:0.75rem;border-radius:var(--r-md);margin-top:0.5rem;min-height:60px;">
                            ${Utils.esc(v.notes || 'No remarks provided.')}
                        </div>
                    </div>
                `;
                Utils.viewDialog('Vehicle Details', html);
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
                const ok = await Utils.confirm('Delete this vehicle? All related trips & logs will become orphaned.', 'Delete Vehicle');
                if (ok) {
                    DB.Vehicles.delete(btn.dataset.del);
                    Utils.toast('Vehicle deleted', 'success');
                    VehicleModule.render();
                    window.App && App.updateAlerts();
                }
            };
        });

        // Search + filter
        const filterRows = () => {
            const term   = document.getElementById('vSearch').value.toLowerCase();
            const status = document.getElementById('vStatusFilter').value;
            const type   = document.getElementById('vTypeFilter').value;
            document.querySelectorAll('#vehiclesTbody tr[data-reg]').forEach(row => {
                const text = row.innerText.toLowerCase();
                const rowStatus = row.dataset.status;
                const rowType   = row.dataset.type;
                row.style.display = (
                    text.includes(term) &&
                    (!status || rowStatus === status) &&
                    (!type   || rowType   === type)
                ) ? '' : 'none';
            });
        };
        document.getElementById('vSearch').oninput      = filterRows;
        document.getElementById('vStatusFilter').onchange = filterRows;
        document.getElementById('vTypeFilter').onchange   = filterRows;
    },
};
