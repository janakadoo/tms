/* ================================================================
   TMS | REPORTS MODULE
   ================================================================ */
import { DB }    from '../db.js';
import { Utils } from '../utils.js';

export const ReportsModule = {
    _container: null,
    init(container) { ReportsModule._container = container; ReportsModule.render(); },

    render() {
        const sym = DB.Settings.get('currency_symbol') || 'Rs.';
        const today = Utils.today();
        const firstOfMonth = today.slice(0,7) + '-01';

        ReportsModule._container.innerHTML = `
        <div class="page-content">
            <div class="page-header">
                <div class="page-header-left"><h2>Reports & Analytics</h2><p>Generate detailed reports with date range filters</p></div>
                <div class="page-header-actions">
                    <button class="btn btn-secondary" id="exportExcelBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                        Export Excel
                    </button>
                    <button class="btn btn-secondary" id="exportPdfBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                        Export PDF
                    </button>
                    <button class="btn btn-ghost" id="printReportBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/></svg>
                        Print
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="card" style="margin-bottom:1.5rem">
                <div class="card-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;align-items:end">
                        <div class="form-group">
                            <label class="form-label">From Date</label>
                            <input type="date" class="form-input" id="rptFrom" value="${firstOfMonth}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">To Date</label>
                            <input type="date" class="form-input" id="rptTo" value="${today}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Vehicle</label>
                            <select class="form-select" id="rptVehicle">
                                <option value="">All Vehicles</option>
                                ${DB.Vehicles.getActive().map(v=>`<option value="${v.id}">${Utils.esc(v.reg_no)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Driver</label>
                            <select class="form-select" id="rptDriver">
                                <option value="">All Drivers</option>
                                ${DB.Drivers.getActive().map(d=>`<option value="${d.id}">${Utils.esc(d.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <button class="btn btn-primary w-full" id="generateReportBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="reportOutput"></div>
        </div>`;

        // Auto-generate on load
        ReportsModule._generate(sym);

        document.getElementById('generateReportBtn').onclick = () => ReportsModule._generate(sym);
        document.getElementById('printReportBtn').onclick    = () => window.print();
        document.getElementById('exportExcelBtn').onclick    = () => ReportsModule._exportExcel(sym);
        document.getElementById('exportPdfBtn').onclick      = () => ReportsModule._exportPDF(sym);
    },

    _generate(sym) {
        const from    = document.getElementById('rptFrom').value;
        const to      = document.getElementById('rptTo').value;
        const vid     = document.getElementById('rptVehicle').value;
        const did     = document.getElementById('rptDriver').value;

        // Filter fuel
        let fuel = DB.Fuel.getAll().filter(f => (!from || f.date >= from) && (!to || f.date <= to));
        if (vid) fuel = fuel.filter(f => f.vehicle_id === vid);
        if (did) fuel = fuel.filter(f => f.driver_id  === did);

        // Filter expenses
        let exp = DB.Expenses.getAll().filter(e => (!from || e.date >= from) && (!to || e.date <= to));
        if (vid) exp = exp.filter(e => e.vehicle_id === vid);

        // Filter trips
        let trips = DB.Trips.getAll().filter(t => (!from || t.start_date >= from) && (!to || t.start_date <= to));
        if (vid) trips = trips.filter(t => t.vehicle_id === vid);
        if (did) trips = trips.filter(t => t.driver_id  === did);

        // Filter maintenance
        let maint = DB.Maintenance.getAll().filter(m => (!from || m.date >= from) && (!to || m.date <= to));
        if (vid) maint = maint.filter(m => m.vehicle_id === vid);

        const totalFuel  = fuel.reduce((s,f)=>s+(+f.total_cost||0), 0);
        const totalExp   = exp.reduce((s,e)=>s+(+e.amount||0), 0);
        const totalMaint = maint.filter(m=>m.cost).reduce((s,m)=>s+(+m.cost||0), 0);
        const totalRev   = trips.reduce((s,t)=>s+(+t.revenue||0), 0);
        const totalDist  = trips.reduce((s,t)=>s+(+t.distance_km||0), 0);
        const totalCost  = totalFuel + totalExp + totalMaint;

        // Vehicle Stats
        const vStats = {};
        DB.Vehicles.getAll().forEach(v => {
            vStats[v.id] = { reg: v.reg_no, brand: v.brand, dist: 0, liters: 0, fuelCost: 0, exp: 0 };
        });
        trips.forEach(t => { if(vStats[t.vehicle_id]) vStats[t.vehicle_id].dist += (+t.distance_km||0); });
        fuel.forEach(f => {
            if(vStats[f.vehicle_id]) {
                if(f.fill_phase === 'mid_trip' || f.fill_phase === 'post_trip' || !f.fill_phase || f.fill_phase === 'general') {
                    vStats[f.vehicle_id].liters += (+f.liters||0);
                }
                vStats[f.vehicle_id].fuelCost += (+f.total_cost||0);
            }
        });
        exp.forEach(e => { if(vStats[e.vehicle_id]) vStats[e.vehicle_id].exp += (+e.amount||0); });
        const activeVStats = Object.values(vStats).filter(v => v.dist > 0 || v.liters > 0 || v.exp > 0 || v.fuelCost > 0);

        // Expense Category Stats
        const catStats = {};
        exp.forEach(e => { catStats[e.category] = (catStats[e.category] || 0) + (+e.amount||0); });
        const activeCats = Object.entries(catStats).sort((a,b)=>b[1]-a[1]);

        document.getElementById('reportOutput').innerHTML = `
        <!-- Summary KPIs -->
        <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-bottom:1.5rem">
            <div class="kpi-card" style="--kpi-color:var(--grad-primary);--kpi-color-raw:var(--primary)">
                <div class="kpi-top"><div class="kpi-label">Total Cost</div><div class="kpi-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div>
                <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(totalCost,sym)}</div>
                <div class="kpi-footer text-muted-c text-sm">Fuel + Expenses + Maint.</div>
            </div>
            <div class="kpi-card" style="--kpi-color:var(--grad-success);--kpi-color-raw:var(--emerald)">
                <div class="kpi-top"><div class="kpi-label">Revenue</div><div class="kpi-icon" style="background:rgba(16,185,129,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--emerald)"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg></div></div>
                <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(totalRev,sym)}</div>
                <div class="kpi-footer text-success-c text-sm">Profit: ${Utils.currency(totalRev-totalCost,sym)}</div>
            </div>
            <div class="kpi-card" style="--kpi-color:var(--grad-cyan);--kpi-color-raw:var(--cyan)">
                <div class="kpi-top"><div class="kpi-label">Trips</div><div class="kpi-icon" style="background:rgba(6,182,212,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--cyan)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg></div></div>
                <div class="kpi-value">${trips.length}</div>
                <div class="kpi-footer text-muted-c text-sm">${totalDist.toLocaleString()} km total</div>
            </div>
            <div class="kpi-card" style="--kpi-color:var(--grad-warning);--kpi-color-raw:var(--amber)">
                <div class="kpi-top"><div class="kpi-label">Fuel Cost</div><div class="kpi-icon" style="background:rgba(245,158,11,0.15)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:var(--amber)"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg></div></div>
                <div class="kpi-value" style="font-size:1.4rem">${Utils.currency(totalFuel,sym)}</div>
                <div class="kpi-footer text-muted-c text-sm">${fuel.reduce((s,f)=>s+(+f.liters||0),0).toFixed(1)} L total</div>
            </div>
        </div>

        <!-- Vehicle Fuel & Expenses -->
        <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><div class="card-title">Vehicle Fuel & Expenses Summary</div></div>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Vehicle</th><th>Distance</th><th>Fuel Consumed</th><th>Fuel Cost</th><th>Efficiency</th><th>Other Expenses</th><th>Total Cost</th></tr></thead>
                    <tbody>${activeVStats.length ? activeVStats.map(v => {
                        const kmpl = v.liters > 0 && v.dist > 0 ? (v.dist / v.liters).toFixed(2) : null;
                        const totalV = v.fuelCost + v.exp;
                        return `<tr>
                            <td class="table-cell-main">${Utils.esc(v.reg||'—')} <div class="table-cell-sub">${Utils.esc(v.brand||'')}</div></td>
                            <td>${v.dist > 0 ? v.dist.toFixed(1)+' km' : '—'}</td>
                            <td>${v.liters > 0 ? v.liters.toFixed(1)+' L' : '—'}</td>
                            <td style="color:var(--amber);font-weight:600">${v.fuelCost > 0 ? Utils.currency(v.fuelCost,sym) : '—'}</td>
                            <td>${kmpl ? `<span class="badge ${kmpl>=8?'badge-success':'badge-warning'}">${kmpl} km/L</span>` : '—'}</td>
                            <td style="color:var(--danger);font-weight:600">${v.exp > 0 ? Utils.currency(v.exp,sym) : '—'}</td>
                            <td style="color:var(--text-primary);font-weight:700">${Utils.currency(totalV,sym)}</td>
                        </tr>`;
                    }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No vehicle data in range</td></tr>'}</tbody>
                </table>
            </div>
        </div>

        <!-- Expenses by Category -->
        <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><div class="card-title">Expenses Breakdown by Category</div></div>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Category</th><th>Total Amount</th><th>% of Total</th></tr></thead>
                    <tbody>${activeCats.length ? activeCats.map(([cat, amt]) => {
                        const pct = totalExp > 0 ? ((amt / totalExp)*100).toFixed(1) : 0;
                        return `<tr>
                            <td><span class="badge badge-primary">${Utils.esc(cat)}</span></td>
                            <td style="color:var(--danger);font-weight:600">${Utils.currency(amt,sym)}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:0.5rem">
                                    <div style="flex:1;max-width:200px;height:6px;background:var(--bg-elevated);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--primary)"></div></div>
                                    <div style="font-size:0.75rem;color:var(--text-muted);width:35px;text-align:right">${pct}%</div>
                                </div>
                            </td>
                        </tr>`;
                    }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem">No expenses in range</td></tr>'}</tbody>
                </table>
            </div>
        </div>

        <!-- Trips Table -->
        <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><div class="card-title">Trips (${trips.length})</div></div>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Date</th><th>Vehicle</th><th>Driver</th><th>Purpose</th><th>Distance</th><th>Revenue</th><th>Status</th></tr></thead>
                    <tbody>${trips.length ? trips.map(t=>`<tr>
                        <td>${Utils.formatDate(t.start_date)}</td>
                        <td>${Utils.esc(t.reg_no||'—')}</td>
                        <td>${Utils.esc(t.driver_name||'—')}</td>
                        <td>${Utils.esc(t.purpose||'—')}</td>
                        <td>${t.distance_km ? (+t.distance_km).toFixed(1)+' km' : '—'}</td>
                        <td style="color:var(--success);font-weight:600">${+t.revenue > 0 ? Utils.currency(t.revenue,sym) : '—'}</td>
                        <td>${Utils.tripStatusBadge(t.status)}</td>
                    </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No trips in range</td></tr>'}</tbody>
                </table>
            </div>
        </div>

        <!-- Expenses Table -->
        <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><div class="card-title">Detailed Expenses (${exp.length})</div></div>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Vehicle</th><th>Amount</th></tr></thead>
                    <tbody>${exp.length ? exp.map(e=>`<tr>
                        <td>${Utils.formatDate(e.date)}</td>
                        <td><span class="badge badge-primary">${Utils.esc(e.category)}</span></td>
                        <td>${Utils.esc(e.title)}</td>
                        <td>${Utils.esc(e.reg_no||'—')}</td>
                        <td style="color:var(--danger);font-weight:600">${Utils.currency(e.amount,sym)}</td>
                    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No expenses in range</td></tr>'}</tbody>
                </table>
            </div>
        </div>`;
    },

    _exportExcel(sym) {
        const from = document.getElementById('rptFrom').value;
        const to   = document.getElementById('rptTo').value;

        const wb = XLSX.utils.book_new();

        const tripsData  = DB.Trips.getAll().filter(t => (!from || t.start_date >= from) && (!to || t.start_date <= to));
        const fuelData   = DB.Fuel.getAll().filter(f => (!from || f.date >= from) && (!to || f.date <= to));
        const expData    = DB.Expenses.getAll().filter(e => (!from || e.date >= from) && (!to || e.date <= to));
        const maintData  = DB.Maintenance.getAll().filter(m => (!from || m.date >= from) && (!to || m.date <= to));

        const sheetTrips = XLSX.utils.json_to_sheet(tripsData.map(t=>({
            Date: t.start_date, Vehicle: t.reg_no, Driver: t.driver_name,
            Purpose: t.purpose, 'Distance km': t.distance_km, Revenue: t.revenue, Status: t.status
        })));
        const sheetFuel = XLSX.utils.json_to_sheet(fuelData.map(f=>({
            Date: f.date, Vehicle: f.reg_no, Driver: f.driver_name,
            Station: f.station, Liters: f.liters, 'Cost/L': f.cost_per_liter, 'Total Cost': f.total_cost
        })));
        const sheetExp = XLSX.utils.json_to_sheet(expData.map(e=>({
            Date: e.date, Category: e.category, Title: e.title,
            Vehicle: e.reg_no, Amount: e.amount, Payment: e.payment_method
        })));
        const sheetMaint = XLSX.utils.json_to_sheet(maintData.map(m=>({
            Vehicle: m.reg_no, Type: m.type, Date: m.date,
            Garage: m.garage, Cost: m.cost, Status: m.status
        })));

        XLSX.utils.book_append_sheet(wb, sheetTrips,  'Trips');
        XLSX.utils.book_append_sheet(wb, sheetFuel,   'Fuel Logs');
        XLSX.utils.book_append_sheet(wb, sheetExp,    'Expenses');
        XLSX.utils.book_append_sheet(wb, sheetMaint,  'Maintenance');

        XLSX.writeFile(wb, `TMS_Report_${from}_to_${to}.xlsx`);
        Utils.toast('Excel report exported!', 'success');
    },

    _exportPDF(sym) {
        const from = document.getElementById('rptFrom').value;
        const to   = document.getElementById('rptTo').value;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text("TMS Pro - Comprehensive Report", 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Period: ${from || 'Beginning'} to ${to || 'Present'}`, 14, 28);
        doc.setTextColor(0);
        
        let startY = 35;

        // Trips Data
        const tripsData = DB.Trips.getAll().filter(t => (!from || t.start_date >= from) && (!to || t.start_date <= to));
        if (tripsData.length) {
            doc.setFontSize(14);
            doc.text("Trips", 14, startY);
            doc.autoTable({
                startY: startY + 5,
                head: [['Date', 'Vehicle', 'Driver', 'Purpose', 'Distance (km)', 'Revenue']],
                body: tripsData.map(t => [
                    Utils.formatDate(t.start_date),
                    t.reg_no || '-',
                    t.driver_name || '-',
                    t.purpose || '-',
                    t.distance_km || '-',
                    t.revenue > 0 ? Utils.currency(t.revenue, sym) : '-'
                ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [15, 23, 42] }
            });
            startY = doc.lastAutoTable.finalY + 15;
        }

        // Fuel Data
        const fuelData = DB.Fuel.getAll().filter(f => (!from || f.date >= from) && (!to || f.date <= to));
        if (fuelData.length) {
            if (startY > 250) { doc.addPage(); startY = 20; }
            doc.setFontSize(14);
            doc.text("Fuel Logs", 14, startY);
            doc.autoTable({
                startY: startY + 5,
                head: [['Date', 'Vehicle', 'Driver', 'Station', 'Liters', 'Cost/L', 'Total Cost']],
                body: fuelData.map(f => [
                    Utils.formatDate(f.date),
                    f.reg_no || '-',
                    f.driver_name || '-',
                    f.station || '-',
                    f.liters || '-',
                    f.cost_per_liter || '-',
                    f.total_cost || '-'
                ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [15, 23, 42] }
            });
            startY = doc.lastAutoTable.finalY + 15;
        }

        // Expenses Data
        const expData = DB.Expenses.getAll().filter(e => (!from || e.date >= from) && (!to || e.date <= to));
        if (expData.length) {
            if (startY > 250) { doc.addPage(); startY = 20; }
            doc.setFontSize(14);
            doc.text("Expenses", 14, startY);
            doc.autoTable({
                startY: startY + 5,
                head: [['Date', 'Category', 'Description', 'Vehicle', 'Amount']],
                body: expData.map(e => [
                    Utils.formatDate(e.date),
                    e.category || '-',
                    e.title || '-',
                    e.reg_no || '-',
                    Utils.currency(e.amount, sym)
                ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [15, 23, 42] }
            });
            startY = doc.lastAutoTable.finalY + 15;
        }

        // Maintenance Data
        const maintData = DB.Maintenance.getAll().filter(m => (!from || m.date >= from) && (!to || m.date <= to));
        if (maintData.length) {
            if (startY > 250) { doc.addPage(); startY = 20; }
            doc.setFontSize(14);
            doc.text("Maintenance", 14, startY);
            doc.autoTable({
                startY: startY + 5,
                head: [['Date', 'Vehicle', 'Type', 'Garage', 'Cost', 'Status']],
                body: maintData.map(m => [
                    Utils.formatDate(m.date),
                    m.reg_no || '-',
                    m.type || '-',
                    m.garage || '-',
                    m.cost || '-',
                    m.status || '-'
                ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [15, 23, 42] }
            });
        }

        doc.save(`TMS_Report_${from}_to_${to}.pdf`);
        Utils.toast('PDF report exported!', 'success');
    },
};
