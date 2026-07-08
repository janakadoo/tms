/* ================================================================
   TMS | TRIPS MODULE — with Fuel Consumption Monitor
   ================================================================ */
import { DB }    from '../db.js?v=2';
import { Utils } from '../utils.js?v=2';

export const TripModule = {
    _container: null,
    init(container) { TripModule._container = container; TripModule.render(); },

    render() {
        const trips  = DB.Trips.getAll();
        const sym    = DB.Settings.get('currency_symbol') || 'Rs.';
        const completed = trips.filter(t=>t.status==='Completed').length;
        const active    = trips.filter(t=>t.status==='In Progress').length;
        const totalRev  = trips.reduce((s,t)=>s+(+t.revenue||0),0);
        const totalDist = trips.reduce((s,t)=>s+(+t.distance_km||0),0);

        TripModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Trip Management</h2><p>Log and monitor all vehicle trips with fuel consumption tracking</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" id="addTripBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        New Trip
                    </button>
                </div>
            </div>

            <div class="stats-row">
                <div class="stat-chip"><div class="dot" style="background:var(--primary)"></div><strong>${trips.length}</strong> Total</div>
                <div class="stat-chip"><div class="dot" style="background:var(--success)"></div><strong>${completed}</strong> Completed</div>
                <div class="stat-chip"><div class="dot" style="background:var(--amber)"></div><strong>${active}</strong> In Progress</div>
                <div class="stat-chip"><div class="dot" style="background:var(--cyan)"></div><strong>${totalDist.toLocaleString()} km</strong> Total Distance</div>
                <div class="stat-chip"><div class="dot" style="background:var(--emerald)"></div><strong>${Utils.currency(totalRev,sym)}</strong> Total Revenue</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="filter-bar">
                        <div class="search-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                            <input type="text" class="form-input" id="tripSearch" placeholder="Search trips...">
                        </div>
                        <select class="form-select" id="tripStatusFilter" style="max-width:160px">
                            <option value="">All Status</option>
                            <option>Scheduled</option><option>In Progress</option>
                            <option>Completed</option><option>Cancelled</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead><tr>
                            <th>Vehicle</th><th>Driver</th><th>Date</th>
                            <th>Purpose</th><th>Odometer</th><th>Distance</th>
                            <th>Revenue</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="tripsTbody">${TripModule._rows(trips, sym)}</tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ── TRIP FORM MODAL ─────────────────────────────── -->
        <div class="modal-overlay" id="tripModal">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>
                        <span id="tripModalTitle">New Trip</span>
                    </div>
                    <button class="modal-close" id="tripModalClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="tripForm">
                    <div class="modal-body">
                        <input type="hidden" name="id">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Vehicle <span class="req">*</span></label>
                                <select name="vehicle_id" class="form-select" required id="tripVehicleSelect">
                                    <option value="">Select vehicle...</option>
                                    ${DB.Vehicles.getActive().map(v=>`<option value="${v.id}">${Utils.esc(v.reg_no)} — ${Utils.esc(v.brand+' '+v.model)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Driver</label>
                                <select name="driver_id" class="form-select" id="tripDriverSelect">
                                    <option value="">Select driver...</option>
                                    ${DB.Drivers.getActive().map(d=>`<option value="${d.id}">${Utils.esc(d.name)}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Start Date <span class="req">*</span></label>
                                <input type="date" name="start_date" class="form-input" required value="${Utils.today()}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">End Date</label>
                                <input type="date" name="end_date" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select name="status" class="form-select">
                                    <option>Scheduled</option><option>In Progress</option>
                                    <option>Completed</option><option>Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <!-- ODOMETER SECTION -->
                        <div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:1rem;border:1px solid var(--border)">
                            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--primary);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.375rem">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Odometer Readings
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Start Odometer (km)</label>
                                    <input type="number" name="start_odometer" class="form-input" id="startOdo" placeholder="85000" min="0" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">End Odometer (km)</label>
                                    <input type="number" name="end_odometer" class="form-input" id="endOdo" placeholder="85250" min="0" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Distance (auto-calculated)</label>
                                    <div style="display:flex;align-items:center;gap:0.5rem">
                                        <input type="number" name="distance_km" class="form-input" id="distanceKm" placeholder="0" min="0" step="0.1" readonly style="background:var(--bg-card);color:var(--primary);font-weight:700">
                                        <span style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap">km</span>
                                    </div>
                                </div>
                            </div>
                            <div id="distanceHint" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem"></div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="flex:2">
                                <label class="form-label">Purpose / Description</label>
                                <input type="text" name="purpose" class="form-input" placeholder="Staff transport, client delivery...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Revenue (${sym})</label>
                                <input type="number" name="revenue" class="form-input" placeholder="0" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <textarea name="notes" class="form-textarea" placeholder="Additional notes..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="tripModalCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Trip</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ── FUEL CONSUMPTION MONITOR MODAL ─────────────── -->
        <div class="modal-overlay" id="fuelMonitorModal">
            <div class="modal modal-xl">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px;color:var(--amber)"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                        <span id="fuelMonitorTitle">Fuel Consumption Monitor</span>
                    </div>
                    <button class="modal-close" id="fuelMonitorClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="modal-body" id="fuelMonitorBody" style="gap:1rem"></div>
            </div>
        </div>

        <!-- ── FUEL FILL FORM MODAL ───────────────────────── -->
        <div class="modal-overlay" id="fuelFillModal">
            <div class="modal modal-sm">
                <div class="modal-header">
                    <div class="modal-header-title">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;color:var(--amber)"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                        <span id="fuelFillTitle">Add Fuel Fill</span>
                    </div>
                    <button class="modal-close" id="fuelFillClose"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="fuelFillForm">
                    <div class="modal-body">
                        <input type="hidden" id="ff_trip_id">
                        <input type="hidden" id="ff_phase">
                        <input type="hidden" id="ff_vehicle_id">
                        <input type="hidden" id="ff_driver_id">
                        <div class="form-group">
                            <label class="form-label">Date <span class="req">*</span></label>
                            <input type="date" id="ff_date" class="form-input" required value="${Utils.today()}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Station / Location</label>
                            <input type="text" id="ff_station" class="form-input" placeholder="Lanka IOC Colombo...">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Liters <span class="req">*</span></label>
                                <input type="number" id="ff_liters" class="form-input" required placeholder="45.5" min="0.1" step="0.1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Price/L (${sym})</label>
                                <input type="number" id="ff_cpl" class="form-input" placeholder="360" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Total Cost (${sym})</label>
                            <input type="number" id="ff_total" class="form-input" placeholder="Auto-calculated" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Odometer Reading (km)</label>
                            <input type="number" id="ff_odometer" class="form-input" placeholder="85000" step="0.1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notes</label>
                            <input type="text" id="ff_notes" class="form-input" placeholder="Receipt #, remarks...">
                        </div>
                        <div class="form-group" style="padding-top:0.5rem; border-top:1px solid var(--border-light)">
                            <label class="form-label">Attachment (Receipt / Bill)</label>
                            <input type="file" id="ff_attachment" class="form-input" accept="image/jpeg, image/png, application/pdf">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="fuelFillCancel">Cancel</button>
                        <button type="submit" class="btn btn-primary">Record Fill</button>
                    </div>
                </form>
            </div>
        </div>`;

        TripModule._bindEvents(sym);
    },

    _rows(trips, sym) {
        if (!trips.length) return `<tr><td colspan="9"><div class="table-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>
            <p>No trips yet. Add your first trip!</p></div></td></tr>`;

        return trips.map(t=>`
            <tr data-status="${Utils.esc(t.status)}">
                <td><div class="table-cell-main">${Utils.esc(t.reg_no||'—')}</div><div class="table-cell-sub">${Utils.esc(t.vehicle_name||'')}</div></td>
                <td>${Utils.esc(t.driver_name||'—')}</td>
                <td>${Utils.formatDate(t.start_date)}</td>
                <td><div style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.esc(t.purpose||'—')}</div></td>
                <td>
                    <div style="font-size:0.78rem;white-space:nowrap">
                        <span style="color:var(--cyan)">${t.start_odometer ? (+t.start_odometer).toLocaleString() : '—'}</span>
                        ${t.end_odometer > 0 ? `→ <span style="color:var(--emerald)">${(+t.end_odometer).toLocaleString()}</span>` : ''}
                    </div>
                </td>
                <td><strong style="color:var(--primary)">${t.distance_km > 0 ? (+t.distance_km).toFixed(1)+' km' : '—'}</strong></td>
                <td style="font-weight:600;color:var(--success)">${+t.revenue > 0 ? Utils.currency(t.revenue,sym) : '—'}</td>
                <td>${Utils.tripStatusBadge(t.status)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" data-view="${t.id}" title="View Details" style="color:var(--success)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg></button>
                        <button class="btn-icon" style="color:var(--amber);border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.08)" title="Fuel Consumption Monitor" data-fuel="${t.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                        </button>
                        <button class="btn-icon" data-edit="${t.id}" title="Edit trip"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg></button>
                        <button class="btn-icon danger" data-del="${t.id}" title="Delete trip"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
                    </div>
                </td>
            </tr>`).join('');
    },

    /* ── FUEL MONITOR RENDER ────────────────────────────────── */
    _renderFuelMonitor(tripId, sym) {
        const trip  = DB.Trips.getById(tripId);
        const fills = DB.Fuel.getByTrip(tripId);
        if (!trip) return;

        const pre  = fills.filter(f=>f.fill_phase==='pre_trip');
        const mid  = fills.filter(f=>f.fill_phase==='mid_trip');
        const post = fills.filter(f=>f.fill_phase==='post_trip');

        const dist     = +trip.distance_km || 0;
        const consumed = mid.reduce((s,f)=>s+(+f.liters||0),0) + post.reduce((s,f)=>s+(+f.liters||0),0);
        const totalCostFuel = fills.reduce((s,f)=>s+(+f.total_cost||0),0);
        const kmpl     = consumed > 0 && dist > 0 ? (dist / consumed).toFixed(2) : null;
        const l100km   = consumed > 0 && dist > 0 ? ((consumed / dist)*100).toFixed(2) : null;
        const cpkm     = totalCostFuel > 0 && dist > 0 ? (totalCostFuel / dist).toFixed(2) : null;

        const phaseColor = { pre_trip:'var(--cyan)', mid_trip:'var(--amber)', post_trip:'var(--success)' };

        const fillList = (arr, phase) => arr.length
            ? arr.map(f=>`
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:var(--bg-elevated);border-radius:var(--r-sm);margin-bottom:0.375rem">
                    <div style="width:8px;height:8px;border-radius:50%;background:${phaseColor[phase]};flex-shrink:0"></div>
                    <div style="flex:1;font-size:0.8rem">
                        <div style="font-weight:600">${+f.liters} L @ ${Utils.esc(f.station||'Unknown station')}</div>
                        <div style="color:var(--text-muted);font-size:0.72rem">${Utils.formatDate(f.date)} • Odo: ${f.odometer ? (+f.odometer).toLocaleString()+' km' : '—'} • ${f.total_cost > 0 ? Utils.currency(f.total_cost,sym) : 'Cost not recorded'}</div>
                    </div>
                    ${f.attachment_id ? `<button class="btn-icon" data-view-ff-att="${f.attachment_id}" style="width:26px;height:26px;color:var(--info)" title="View Receipt"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/></svg></button>` : ''}
                    <button class="btn-icon danger" data-delfuel="${f.id}" style="width:26px;height:26px" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>`).join('')
            : `<div style="font-size:0.78rem;color:var(--text-muted);padding:0.5rem;text-align:center;font-style:italic">No fills recorded yet</div>`;

        const phaseCard = (title, icon, color, bg, desc, arr, phase) => `
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg);padding:1rem;border-top:3px solid ${color}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
                    <div style="display:flex;align-items:center;gap:0.5rem">
                        <div style="width:30px;height:30px;background:${bg};border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:1rem">${icon}</div>
                        <div>
                            <div style="font-weight:700;font-size:0.875rem">${title}</div>
                            <div style="font-size:0.7rem;color:var(--text-muted)">${desc}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-secondary add-fill-btn" data-phase="${phase}" data-trip="${tripId}" data-vid="${trip.vehicle_id}" data-did="${trip.driver_id}">
                        + Add Fill
                    </button>
                </div>
                <div class="fill-list-${phase}">${fillList(arr, phase)}</div>
                <div style="font-size:0.78rem;font-weight:600;color:${color};margin-top:0.5rem;text-align:right">
                    Total: ${arr.reduce((s,f)=>s+(+f.liters||0),0).toFixed(1)} L = ${Utils.currency(arr.reduce((s,f)=>s+(+f.total_cost||0),0),sym)}
                </div>
            </div>`;

        document.getElementById('fuelMonitorTitle').textContent =
            `Fuel Monitor — ${trip.reg_no||'—'} | ${trip.purpose||'Trip'} (${Utils.formatDate(trip.start_date)})`;

        document.getElementById('fuelMonitorBody').innerHTML = `
            <!-- Trip Info Strip -->
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.75rem;padding:0.875rem;background:var(--bg-elevated);border-radius:var(--r-md)">
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600">Vehicle</div><div style="font-weight:700;color:var(--primary)">${Utils.esc(trip.reg_no||'—')}</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600">Start Odo</div><div style="font-weight:700">${trip.start_odometer ? (+trip.start_odometer).toLocaleString()+' km' : '—'}</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600">End Odo</div><div style="font-weight:700">${trip.end_odometer > 0 ? (+trip.end_odometer).toLocaleString()+' km' : '—'}</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600">Distance</div><div style="font-weight:700;color:var(--cyan)">${dist > 0 ? dist.toFixed(1)+' km' : '—'}</div></div>
                <div style="text-align:center"><div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600">Status</div><div style="font-weight:700">${Utils.tripStatusBadge(trip.status)}</div></div>
            </div>

            <!-- How It Works -->
            <div style="background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:var(--r-md);padding:0.75rem;font-size:0.78rem;color:var(--text-secondary)">
                <strong style="color:var(--cyan)">📖 How fuel consumption is calculated:</strong>
                Fill to FULL before trip (Phase 1 — baseline). Add fuel during trip if needed (Phase 2 — counted). Fill to FULL again at end (Phase 3 — counted).
                <strong>Total consumed = Phase 2 + Phase 3 liters</strong>. km/L = Distance ÷ Total consumed.
            </div>

            <!-- 3 Phase Cards -->
            <div style="display:grid;grid-template-columns:1fr;gap:0.875rem">
                ${phaseCard('Phase 1 — Pre-Trip Full Tank','⬛','var(--cyan)','rgba(6,182,212,0.1)','Fill to FULL before starting (baseline — not counted as consumption)',pre,'pre_trip')}
                ${phaseCard('Phase 2 — During Trip Fills','⛽','var(--amber)','rgba(245,158,11,0.1)','Any fuel added while travelling (counted toward consumption)',mid,'mid_trip')}
                ${phaseCard('Phase 3 — Post-Trip Full Tank','✅','var(--success)','rgba(16,185,129,0.1)','Fill to FULL again at end (counted — completes consumption measurement)',post,'post_trip')}
            </div>

            <!-- Consumption Summary -->
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-lg);padding:1rem">
                <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.875rem;display:flex;align-items:center;gap:0.5rem">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;color:var(--primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
                    Consumption Analysis
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.75rem">
                    ${TripModule._metric('Total Fuel Consumed', consumed > 0 ? consumed.toFixed(2)+' L' : '—', 'var(--amber)', consumed === 0 ? 'Phase 2 + Phase 3 fills' : 'Phase 2 + Phase 3 fills')}
                    ${TripModule._metric('Distance', dist > 0 ? dist.toFixed(1)+' km' : '—', 'var(--cyan)', 'End − Start odometer')}
                    ${TripModule._metric('Efficiency (km/L)', kmpl ? kmpl+' km/L' : '—', kmpl ? (parseFloat(kmpl)>=8?'var(--success)':'var(--warning)') : 'var(--text-muted)', 'Higher is better')}
                    ${TripModule._metric('Rate (L/100km)', l100km ? l100km+' L' : '—', l100km ? (parseFloat(l100km)<=12.5?'var(--success)':'var(--warning)') : 'var(--text-muted)', 'Lower is better')}
                    ${TripModule._metric('Total Fuel Cost', Utils.currency(totalCostFuel,sym), 'var(--rose)', 'All 3 phases combined')}
                    ${TripModule._metric('Cost per km', cpkm ? Utils.currency(cpkm,sym)+'/km' : '—', 'var(--primary)', 'Fuel cost only')}
                </div>
                ${consumed === 0 ? `<div style="text-align:center;padding:0.5rem;font-size:0.78rem;color:var(--text-muted);margin-top:0.5rem">⚠ Add Phase 2 and/or Phase 3 fills to see consumption metrics</div>` : ''}
            </div>`;

        // Bind add-fill buttons
        document.querySelectorAll('.add-fill-btn').forEach(btn => {
            btn.onclick = () => TripModule._openFillForm(btn.dataset.phase, btn.dataset.trip, btn.dataset.vid, btn.dataset.did, sym, tripId);
        });

        // Bind delete fuel fill buttons
        document.querySelectorAll('[data-delfuel]').forEach(btn => {
            btn.onclick = async () => {
                const ok = await Utils.confirm('Remove this fuel fill record?', 'Delete Fill');
                if (ok) {
                    DB.Fuel.delete(btn.dataset.delfuel);
                    Utils.toast('Fuel fill removed', 'success');
                    TripModule._renderFuelMonitor(tripId, sym);
                }
            };
        });

        // Bind view attachment buttons inside monitor
        document.querySelectorAll('[data-view-ff-att]').forEach(btn => {
            btn.onclick = async () => {
                const att = await DB.Attachments.get(btn.dataset.viewFfAtt);
                if (att) Utils.viewAttachment(att.dataUrl, att.type);
                else Utils.toast('Attachment not found', 'error');
            };
        });
    },

    _metric(label, value, color, sub) {
        return `<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:0.75rem;text-align:center">
            <div style="font-size:0.65rem;text-transform:uppercase;color:var(--text-muted);font-weight:600;margin-bottom:0.375rem">${label}</div>
            <div style="font-size:1.125rem;font-weight:800;color:${color}">${value}</div>
            <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.125rem">${sub}</div>
        </div>`;
    },

    _openFillForm(phase, tripId, vehicleId, driverId, sym, monitorTripId) {
        const phaseLabels = { pre_trip:'Pre-Trip Full Tank Fill', mid_trip:'During Trip Fuel Fill', post_trip:'Post-Trip Full Tank Fill' };
        document.getElementById('fuelFillTitle').textContent = phaseLabels[phase] || 'Add Fuel Fill';
        document.getElementById('ff_trip_id').value   = tripId;
        document.getElementById('ff_phase').value     = phase;
        document.getElementById('ff_vehicle_id').value= vehicleId||'';
        document.getElementById('ff_driver_id').value = driverId||'';
        document.getElementById('ff_date').value      = Utils.today();
        document.getElementById('ff_liters').value    = '';
        document.getElementById('ff_cpl').value       = '';
        document.getElementById('ff_total').value     = '';
        document.getElementById('ff_odometer').value  = '';
        document.getElementById('ff_station').value   = '';
        document.getElementById('ff_notes').value     = '';
        document.getElementById('ff_attachment').value= '';
        document.getElementById('fuelFillModal').classList.add('open');
    },

    /* ── EVENTS ─────────────────────────────────────────────── */
    _bindEvents(sym) {
        const tripModal       = document.getElementById('tripModal');
        const fuelMonitorModal= document.getElementById('fuelMonitorModal');
        const fuelFillModal   = document.getElementById('fuelFillModal');
        const form            = document.getElementById('tripForm');
        const openTrip = ()  => tripModal.classList.add('open');
        const closeTrip= ()  => tripModal.classList.remove('open');

        // Sidebar toggle for trip modal
        document.getElementById('addTripBtn').onclick = () => {
            document.getElementById('tripModalTitle').textContent = 'New Trip';
            form.reset();
            form.elements['id'].value = '';
            form.elements['start_date'].value = Utils.today();
            document.getElementById('distanceKm').value = '';
            document.getElementById('distanceHint').textContent = '';
            openTrip();
        };
        document.getElementById('tripModalClose').onclick  = closeTrip;
        document.getElementById('tripModalCancel').onclick = closeTrip;
        tripModal.onclick = e => { if (e.target === tripModal) closeTrip(); };

        // Auto-calculate distance from odometer
        const calcDist = () => {
            const s = +document.getElementById('startOdo').value || 0;
            const e = +document.getElementById('endOdo').value   || 0;
            if (s > 0 && e > 0) {
                const d = Math.max(0, e - s);
                document.getElementById('distanceKm').value = d.toFixed(1);
                document.getElementById('distanceHint').textContent = e >= s
                    ? `✓ Distance = ${e.toLocaleString()} − ${s.toLocaleString()} = ${d.toFixed(1)} km`
                    : '⚠ End odometer must be ≥ start odometer';
                document.getElementById('distanceHint').style.color = e >= s ? 'var(--success)' : 'var(--danger)';
            } else {
                document.getElementById('distanceKm').value = '';
                document.getElementById('distanceHint').textContent = s > 0 ? 'Enter end odometer to auto-calculate distance' : '';
            }
        };
        document.getElementById('startOdo').oninput = calcDist;
        document.getElementById('endOdo').oninput   = calcDist;

        // Trip form submit
        form.onsubmit = e => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form).entries());
            // Ensure distance is auto-calculated value
            d.distance_km = document.getElementById('distanceKm').value || d.distance_km || 0;
            if (d.id) { DB.Trips.update(d); Utils.toast('Trip updated','success'); }
            else { d.id = Utils.id(); DB.Trips.add(d); Utils.toast('Trip added','success'); }
            closeTrip(); TripModule.render();
        };

        // Edit trip
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.onclick = () => {
                const t = DB.Trips.getById(btn.dataset.edit);
                if (!t) return;
                document.getElementById('tripModalTitle').textContent = 'Edit Trip';
                Object.entries(t).forEach(([k,v])=>{ if(form.elements[k]) form.elements[k].value = v ?? ''; });
                document.getElementById('distanceKm').value = t.distance_km || '';
                if (t.start_odometer && t.end_odometer) calcDist();
                openTrip();
            };
        });

        // View trip details
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.onclick = () => {
                const t = DB.Trips.getById(btn.dataset.view);
                if (!t) return;
                const html = `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">DATE</strong><br>${Utils.formatDate(t.start_date)} - ${t.end_date ? Utils.formatDate(t.end_date) : 'Ongoing'}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">VEHICLE</strong><br>${Utils.esc(t.reg_no || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">DRIVER</strong><br>${Utils.esc(t.driver_name || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">PURPOSE</strong><br>${Utils.esc(t.purpose || '—')}</div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">DISTANCE</strong><br>${t.start_odometer ? (+t.start_odometer).toLocaleString() : '—'} ${t.end_odometer ? '→ ' + (+t.end_odometer).toLocaleString() : ''}<br>Total: <strong>${t.distance_km > 0 ? (+t.distance_km).toFixed(1) + ' km' : '—'}</strong></div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">REVENUE</strong><br><span style="color:var(--success);font-weight:600;">${+t.revenue > 0 ? Utils.currency(t.revenue) : '—'}</span></div>
                        <div><strong style="color:var(--text-muted);font-size:0.75rem;">STATUS</strong><br>${Utils.tripStatusBadge(t.status)}</div>
                    </div>
                    <div>
                        <strong style="color:var(--text-muted);font-size:0.75rem;">NOTES / REMARKS</strong>
                        <div style="background:var(--bg-input);padding:0.75rem;border-radius:var(--r-md);margin-top:0.5rem;min-height:60px;">
                            ${Utils.esc(t.notes || 'No remarks provided.')}
                        </div>
                    </div>
                `;
                Utils.viewDialog('Trip Details', html);
            };
        });

        // Delete trip
        document.querySelectorAll('[data-del]').forEach(btn => {
            btn.onclick = async () => {
                const ok = await Utils.confirm('Delete this trip and all its fuel consumption records?', 'Delete Trip');
                if (ok) {
                    // Delete associated fuel fills
                    DB.Fuel.getByTrip(btn.dataset.del).forEach(f=>DB.Fuel.delete(f.id));
                    DB.Trips.delete(btn.dataset.del);
                    Utils.toast('Trip deleted','success');
                    TripModule.render();
                }
            };
        });

        // Fuel monitor open
        document.querySelectorAll('[data-fuel]').forEach(btn => {
            btn.onclick = () => {
                fuelMonitorModal.classList.add('open');
                TripModule._renderFuelMonitor(btn.dataset.fuel, sym);
            };
        });

        // Close fuel monitor
        document.getElementById('fuelMonitorClose').onclick = () => fuelMonitorModal.classList.remove('open');
        fuelMonitorModal.onclick = e => { if (e.target === fuelMonitorModal) fuelMonitorModal.classList.remove('open'); };

        // Fuel fill modal close
        document.getElementById('fuelFillClose').onclick  = () => fuelFillModal.classList.remove('open');
        document.getElementById('fuelFillCancel').onclick = () => fuelFillModal.classList.remove('open');
        fuelFillModal.onclick = e => { if (e.target === fuelFillModal) fuelFillModal.classList.remove('open'); };

        // Auto total cost
        const calcTotal = () => {
            const l = +document.getElementById('ff_liters').value || 0;
            const p = +document.getElementById('ff_cpl').value   || 0;
            if (l > 0 && p > 0) document.getElementById('ff_total').value = (l*p).toFixed(2);
        };
        document.getElementById('ff_liters').oninput = calcTotal;
        document.getElementById('ff_cpl').oninput    = calcTotal;

        // Fuel fill form submit
        document.getElementById('fuelFillForm').onsubmit = async e => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Saving...';

            try {
                const tripId = document.getElementById('ff_trip_id').value;
                const entry  = {
                    id:           Utils.id(),
                    vehicle_id:   document.getElementById('ff_vehicle_id').value,
                    driver_id:    document.getElementById('ff_driver_id').value,
                    trip_id:      tripId,
                    fill_phase:   document.getElementById('ff_phase').value,
                    date:         document.getElementById('ff_date').value,
                    station:      document.getElementById('ff_station').value,
                    liters:       +document.getElementById('ff_liters').value || 0,
                    cost_per_liter: +document.getElementById('ff_cpl').value || 0,
                    total_cost:   +document.getElementById('ff_total').value || 0,
                    odometer:     +document.getElementById('ff_odometer').value || 0,
                    full_tank:    1,
                    notes:        document.getElementById('ff_notes').value,
                };

                const fileInput = document.getElementById('ff_attachment');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const dataUrl = await Utils.fileToDataURL(file);
                    const attId = 'att_' + Utils.id();
                    await DB.Attachments.save(attId, dataUrl, file.type);
                    entry.attachment_id = attId;
                }

                DB.Fuel.add(entry);
                Utils.toast('Fuel fill recorded!','success');
                fuelFillModal.classList.remove('open');
                TripModule._renderFuelMonitor(tripId, sym);
            } catch (err) {
                console.error(err);
                Utils.toast('Failed to save fuel fill', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Record Fill';
            }
        };

        // Table search / filter
        const filterRows = () => {
            const term   = document.getElementById('tripSearch').value.toLowerCase();
            const status = document.getElementById('tripStatusFilter').value;
            document.querySelectorAll('#tripsTbody tr[data-status]').forEach(row => {
                row.style.display = (row.innerText.toLowerCase().includes(term) && (!status || row.dataset.status === status)) ? '' : 'none';
            });
        };
        document.getElementById('tripSearch').oninput         = filterRows;
        document.getElementById('tripStatusFilter').onchange  = filterRows;
    },
};
