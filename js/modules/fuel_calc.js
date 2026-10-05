/* ================================================================
   TMS | FUEL CALCULATOR MODULE
   ================================================================ */
import { DB }    from '../db.js?v=10';
import { Utils } from '../utils.js?v=10';

export const FuelCalcModule = {
    _container: null,
    
    init(container) {
        FuelCalcModule._container = container;
        FuelCalcModule.render();
    },

    render() {
        const vehicles = DB.Vehicles.getActive();
        const drivers = DB.Drivers.getActive();
        
        FuelCalcModule._container.innerHTML = `
        <div class="page-content" id="fuelCalcPage">
            <!-- Hide header on print -->
            <div class="page-header no-print">
                <div class="page-header-left">
                    <h2>Fuel Consumption Calculator</h2>
                    <p>Calculate and print accurate consumption reports for trips</p>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-secondary" id="fcAddRowBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Add Filling
                    </button>
                    <button class="btn btn-primary" id="fcPrintBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/></svg>
                        Print Report
                    </button>
                </div>
            </div>

            <!-- Print Header -->
            <div class="print-only print-header">
                <h2>Fuel Consumption Report</h2>
                <div id="printDate" style="color:#666; margin-bottom:20px;"></div>
            </div>

            <div class="card" style="margin-bottom:1.5rem">
                <div class="card-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
                        <div class="form-group">
                            <label class="form-label">Vehicle</label>
                            <select class="form-select" id="fcVehicle">
                                <option value="">Select Vehicle...</option>
                                ${vehicles.map(v => \`<option value="\${v.id}">\${Utils.esc(v.reg_no)} - \${Utils.esc(v.brand)}</option>\`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Driver Name</label>
                            <input type="text" class="form-input" id="fcDriver" placeholder="Enter Driver Name or Select" list="fcDriversList">
                            <datalist id="fcDriversList">
                                ${drivers.map(d => \`<option value="\${Utils.esc(d.name)}">\`).join('')}
                            </datalist>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Route / Trip Info</label>
                            <input type="text" class="form-input" id="fcRoute" placeholder="e.g. Colombo - Kandy - Colombo">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Start Odometer (km) <small class="no-print text-muted">(Optional)</small></label>
                            <input type="number" class="form-input" id="fcStartOdo" placeholder="e.g. 45000">
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom:1.5rem">
                <div class="table-wrap">
                    <table class="table" id="fcTable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Fuel Amount (L)</th>
                                <th>Station & Cost</th>
                                <th>Odometer (km)</th>
                                <th>Distance (km)</th>
                                <th>Consumption (km/L)</th>
                                <th class="no-print">Act</th>
                            </tr>
                        </thead>
                        <tbody id="fcTbody">
                            <!-- Rows will be added dynamically -->
                        </tbody>
                        <tfoot style="background:var(--bg-elevated); font-weight:bold;">
                            <tr>
                                <td colspan="3" style="text-align:right">Total Liters:</td>
                                <td colspan="4">
                                    <span id="fcTotalLiters" style="color:var(--amber);font-size:1.1rem">0.0</span> L
                                </td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-align:right">Total Distance:</td>
                                <td colspan="4">
                                    <span id="fcTotalDistance" style="color:var(--cyan);font-size:1.1rem">0</span> km
                                </td>
                            </tr>
                            <tr>
                                <td colspan="3" style="text-align:right">Average Consumption:</td>
                                <td colspan="4">
                                    <span id="fcAvgConsumption" style="color:var(--success);font-size:1.2rem">0.00</span> km/L
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Signatures for Print -->
            <div style="margin-top:3rem; display:flex; justify-content:space-between;">
                <div class="form-group" style="width:250px">
                    <label class="form-label">Prepared By</label>
                    <input type="text" class="form-input" id="fcPreparedBy" placeholder="Enter Name">
                    <div class="print-only" style="border-top:1px solid #333; margin-top:40px; text-align:center; padding-top:5px;">Signature</div>
                </div>
                <div class="form-group print-only" style="width:250px">
                    <div style="border-top:1px solid #333; margin-top:68px; text-align:center; padding-top:5px;">Approved By</div>
                </div>
            </div>
            
            <div class="no-print" style="margin-top:2rem; padding:1rem; background:rgba(16,185,129,0.1); border-radius:8px; border:1px solid rgba(16,185,129,0.2); color:var(--emerald)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;vertical-align:text-bottom;margin-right:8px"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
                <strong>Tip:</strong> Select a vehicle, then enter the <strong>Date</strong> and <strong>Amount (L)</strong> for each filling. The system will automatically fetch Station, Cost, and Odometer from your Fuel Logs and calculate consumption!
            </div>
        </div>

        <style>
            @media print {
                @page { margin: 15mm; }
                body * { visibility: hidden; }
                .app-shell.sidebar-collapsed .main-area, .main-area { margin-left: 0 !important; }
                #fuelCalcPage, #fuelCalcPage * { visibility: visible; }
                #fuelCalcPage { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
                .print-header { text-align:center; border-bottom:2px solid #ccc; padding-bottom:10px; margin-bottom:20px; }
                .table { color: #000 !important; }
                .table th { background: #f0f0f0 !important; color: #000 !important; -webkit-print-color-adjust: exact; border-bottom:1px solid #000; }
                .table td { border-bottom: 1px solid #ddd; }
                input.form-input { border:none; background:transparent; padding:0; height:auto; color:#000; font-weight:bold; }
                select.form-select { border:none; background:transparent; appearance:none; -moz-appearance:none; -webkit-appearance:none; padding:0; color:#000; font-weight:bold;}
            }
            .fc-row-inputs input { width:100%; min-width:80px; }
            .fc-row-text { font-size: 0.9rem; color:var(--text-secondary); }
        </style>
        `;

        FuelCalcModule._bindEvents();
        
        // Add one initial empty row
        FuelCalcModule._addRow();
    },

    _bindEvents() {
        document.getElementById('fcAddRowBtn').addEventListener('click', () => FuelCalcModule._addRow());
        
        document.getElementById('fcPrintBtn').addEventListener('click', () => {
            const today = Utils.today();
            document.getElementById('printDate').textContent = "Generated on: " + today;
            window.print();
        });

        // Recalculate on any changes to start odometer
        document.getElementById('fcStartOdo').addEventListener('input', () => FuelCalcModule._calculateAll());
        document.getElementById('fcVehicle').addEventListener('change', () => FuelCalcModule._triggerAutoFillAll());
    },

    _addRow() {
        const tbody = document.getElementById('fcTbody');
        const tr = document.createElement('tr');
        const rowId = 'fc_row_' + Date.now() + '_' + Math.floor(Math.random()*1000);
        
        tr.innerHTML = `
            <td class="fc-row-inputs">
                <input type="date" class="form-input fc-date" data-id="\${rowId}">
            </td>
            <td class="fc-row-inputs">
                <input type="number" class="form-input fc-amount" data-id="\${rowId}" step="0.1" placeholder="e.g. 20">
            </td>
            <td>
                <div class="fc-station fc-row-text">--</div>
                <div class="fc-cost" style="font-weight:600; font-size:0.8rem; color:var(--text-muted)">--</div>
            </td>
            <td class="fc-row-inputs">
                <input type="number" class="form-input fc-odo" data-id="\${rowId}" placeholder="Odometer">
            </td>
            <td>
                <span class="fc-dist" style="font-weight:600">--</span>
            </td>
            <td>
                <span class="fc-cons badge badge-neutral">--</span>
            </td>
            <td class="no-print">
                <button class="btn-icon danger fc-del-btn" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button>
            </td>
        `;
        
        tbody.appendChild(tr);

        // Bind events for this row
        const dateInp = tr.querySelector('.fc-date');
        const amtInp = tr.querySelector('.fc-amount');
        const odoInp = tr.querySelector('.fc-odo');
        const delBtn = tr.querySelector('.fc-del-btn');

        const autoFillHandler = () => FuelCalcModule._autoFillRow(tr);
        const calcHandler = () => FuelCalcModule._calculateAll();

        dateInp.addEventListener('change', autoFillHandler);
        amtInp.addEventListener('input', autoFillHandler);
        
        odoInp.addEventListener('input', calcHandler);

        delBtn.addEventListener('click', () => {
            tr.remove();
            FuelCalcModule._calculateAll();
        });
    },

    _triggerAutoFillAll() {
        const rows = document.querySelectorAll('#fcTbody tr');
        rows.forEach(tr => FuelCalcModule._autoFillRow(tr));
    },

    _autoFillRow(tr) {
        const vid = document.getElementById('fcVehicle').value;
        const date = tr.querySelector('.fc-date').value;
        const amt = parseFloat(tr.querySelector('.fc-amount').value);
        
        if (!vid || !date) return; // Need at least vehicle and date

        const logs = DB.Fuel.getAll().filter(f => f.vehicle_id === vid && f.date === date);
        
        let match = null;
        if (logs.length === 1) {
            match = logs[0];
        } else if (logs.length > 1 && !isNaN(amt)) {
            // Find closest matching amount if multiple fillings on same day
            match = logs.reduce((prev, curr) => 
                Math.abs(parseFloat(curr.liters) - amt) < Math.abs(parseFloat(prev.liters) - amt) ? curr : prev
            );
        } else if (logs.length > 0) {
            match = logs[0];
        }

        if (match) {
            const sym = DB.Settings.get('currency_symbol') || 'Rs.';
            
            // Auto fill station and cost
            tr.querySelector('.fc-station').textContent = match.station || 'Unknown Station';
            tr.querySelector('.fc-cost').textContent = (match.total_cost > 0) ? Utils.currency(match.total_cost, sym) : '--';
            
            // Auto fill Odometer if empty or if we want to overwrite
            const odoInp = tr.querySelector('.fc-odo');
            if (!odoInp.value && match.odometer) {
                odoInp.value = match.odometer;
            }
            
            // Auto fill Amount if empty (so they can just pick date and it fills)
            const amtInp = tr.querySelector('.fc-amount');
            if (!amtInp.value && match.liters) {
                amtInp.value = match.liters;
            }
        }
        
        FuelCalcModule._calculateAll();
    },

    _calculateAll() {
        const rows = Array.from(document.querySelectorAll('#fcTbody tr'));
        let startOdo = parseFloat(document.getElementById('fcStartOdo').value) || 0;
        
        let totalLiters = 0;
        let totalDistance = 0;
        
        // Sort rows by Date? (Let's assume user enters in order, so we process top to bottom)
        let previousOdo = startOdo;

        rows.forEach((tr, index) => {
            const amt = parseFloat(tr.querySelector('.fc-amount').value) || 0;
            const odo = parseFloat(tr.querySelector('.fc-odo').value) || 0;
            
            const distSpan = tr.querySelector('.fc-dist');
            const consSpan = tr.querySelector('.fc-cons');
            
            totalLiters += amt;

            if (odo > 0 && previousOdo > 0 && odo > previousOdo) {
                const dist = odo - previousOdo;
                totalDistance += dist;
                
                distSpan.textContent = dist.toFixed(1) + ' km';
                distSpan.style.color = 'var(--text-primary)';
                
                if (amt > 0) {
                    const kml = (dist / amt).toFixed(2);
                    consSpan.textContent = kml + ' km/L';
                    
                    if (kml >= 8) {
                        consSpan.className = 'fc-cons badge badge-success';
                    } else if (kml >= 5) {
                        consSpan.className = 'fc-cons badge badge-primary';
                    } else {
                        consSpan.className = 'fc-cons badge badge-warning';
                    }
                } else {
                    consSpan.textContent = '--';
                    consSpan.className = 'fc-cons badge badge-neutral';
                }
            } else {
                distSpan.textContent = '--';
                distSpan.style.color = 'var(--text-muted)';
                consSpan.textContent = '--';
                consSpan.className = 'fc-cons badge badge-neutral';
            }
            
            if (odo > 0) {
                previousOdo = odo;
            }
        });
        
        document.getElementById('fcTotalLiters').textContent = totalLiters.toFixed(1);
        document.getElementById('fcTotalDistance').textContent = totalDistance.toFixed(1);
        
        const avg = (totalDistance > 0 && totalLiters > 0) ? (totalDistance / totalLiters).toFixed(2) : '0.00';
        document.getElementById('fcAvgConsumption').textContent = avg;
    }
};
