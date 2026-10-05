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
        const vehicles = DB.Vehicles.getActive ? DB.Vehicles.getActive() : DB.Vehicles.getAll();
        const drivers  = DB.Drivers.getActive  ? DB.Drivers.getActive()  : DB.Drivers.getAll();

        const vOptions = vehicles.map(function(v) {
            return '<option value="' + v.id + '">' + Utils.esc(v.reg_no) + ' - ' + Utils.esc(v.brand || '') + '</option>';
        }).join('');

        const dOptions = drivers.map(function(d) {
            return '<option value="' + Utils.esc(d.name) + '">';
        }).join('');

        const sym = DB.Settings.get('currency_symbol') || 'Rs.';

        FuelCalcModule._container.innerHTML = [
            '<div class="page-content" id="fuelCalcPage">',

            // Header (hidden on print)
            '<div class="page-header no-print">',
            '  <div class="page-header-left">',
            '    <h2>Fuel Consumption Calculator</h2>',
            '    <p>Calculate and print accurate consumption reports for trips</p>',
            '  </div>',
            '  <div class="page-header-actions">',
            '    <button class="btn btn-secondary" id="fcAddRowBtn">',
            '      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>',
            '      Add Filling',
            '    </button>',
            '    <button class="btn btn-primary" id="fcPrintBtn">',
            '      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/></svg>',
            '      Print Report',
            '    </button>',
            '  </div>',
            '</div>',

            // Print-only header
            '<div class="print-only" style="text-align:center;border-bottom:2px solid #ccc;padding-bottom:10px;margin-bottom:20px;">',
            '  <h2>Fuel Consumption Report</h2>',
            '  <div id="printDate" style="color:#666;margin-bottom:10px;"></div>',
            '</div>',

            // Trip info card
            '<div class="card" style="margin-bottom:1.5rem">',
            '  <div class="card-body">',
            '    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">',
            '      <div class="form-group">',
            '        <label class="form-label">Vehicle</label>',
            '        <select class="form-select" id="fcVehicle">',
            '          <option value="">Select Vehicle...</option>',
            vOptions,
            '        </select>',
            '      </div>',
            '      <div class="form-group">',
            '        <label class="form-label">Driver Name</label>',
            '        <input type="text" class="form-input" id="fcDriver" placeholder="Enter Driver Name" list="fcDriversList">',
            '        <datalist id="fcDriversList">' + dOptions + '</datalist>',
            '      </div>',
            '      <div class="form-group">',
            '        <label class="form-label">Route / Trip Info</label>',
            '        <input type="text" class="form-input" id="fcRoute" placeholder="e.g. Colombo - Kandy - Colombo">',
            '      </div>',
            '      <div class="form-group">',
            '        <label class="form-label">Start Odometer (km) <small class="no-print text-muted">(Optional)</small></label>',
            '        <input type="number" class="form-input" id="fcStartOdo" placeholder="e.g. 45000">',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>',

            // Fillings table
            '<div class="card" style="margin-bottom:1.5rem">',
            '  <div class="table-wrap">',
            '    <table class="table" id="fcTable">',
            '      <thead>',
            '        <tr>',
            '          <th>Date</th>',
            '          <th>Amount (L)</th>',
            '          <th>Station &amp; Cost</th>',
            '          <th>Odometer (km)</th>',
            '          <th>Distance (km)</th>',
            '          <th>Consumption (km/L)</th>',
            '          <th class="no-print">Action</th>',
            '        </tr>',
            '      </thead>',
            '      <tbody id="fcTbody"></tbody>',
            '      <tfoot style="background:var(--bg-elevated);font-weight:bold;">',
            '        <tr>',
            '          <td colspan="3" style="text-align:right">Total Liters:</td>',
            '          <td colspan="4"><span id="fcTotalLiters" style="color:var(--amber);font-size:1.1rem">0.0</span> L</td>',
            '        </tr>',
            '        <tr>',
            '          <td colspan="3" style="text-align:right">Total Distance:</td>',
            '          <td colspan="4"><span id="fcTotalDistance" style="color:var(--cyan);font-size:1.1rem">0</span> km</td>',
            '        </tr>',
            '        <tr>',
            '          <td colspan="3" style="text-align:right">Average Consumption:</td>',
            '          <td colspan="4"><span id="fcAvgConsumption" style="color:var(--success);font-size:1.2rem">0.00</span> km/L</td>',
            '        </tr>',
            '      </tfoot>',
            '    </table>',
            '  </div>',
            '</div>',

            // Signatures
            '<div style="margin-top:3rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:2rem;">',
            '  <div class="form-group" style="min-width:220px">',
            '    <label class="form-label">Prepared By</label>',
            '    <input type="text" class="form-input" id="fcPreparedBy" placeholder="Enter Name">',
            '    <div class="print-only" style="border-top:1px solid #333;margin-top:40px;text-align:center;padding-top:5px;">Signature</div>',
            '  </div>',
            '  <div class="form-group print-only" style="min-width:220px">',
            '    <div style="border-top:1px solid #333;margin-top:68px;text-align:center;padding-top:5px;">Approved By</div>',
            '  </div>',
            '</div>',

            // Tip box
            '<div class="no-print" style="margin-top:2rem;padding:1rem;background:rgba(16,185,129,0.1);border-radius:8px;border:1px solid rgba(16,185,129,0.2);color:var(--emerald)">',
            '  <strong>Tip:</strong> Select a vehicle &amp; date to auto-fill Station, Cost &amp; Odometer from your Fuel Logs. Then it calculates km/L automatically!',
            '</div>',

            // Print styles
            '<style>',
            '@media print {',
            '  @page { margin:15mm; }',
            '  body * { visibility:hidden; }',
            '  #fuelCalcPage, #fuelCalcPage * { visibility:visible; }',
            '  #fuelCalcPage { position:absolute;left:0;top:0;width:100%; }',
            '  .no-print { display:none !important; }',
            '  .table { color:#000 !important; }',
            '  .table th { background:#f0f0f0 !important;color:#000 !important;-webkit-print-color-adjust:exact;border-bottom:1px solid #000; }',
            '  .table td { border-bottom:1px solid #ddd; }',
            '  input.form-input,select.form-select { border:none;background:transparent;padding:0;color:#000;font-weight:bold; }',
            '}',
            '</style>',

            '</div>'
        ].join('\n');

        FuelCalcModule._bindEvents();
        FuelCalcModule._addRow();
    },

    _bindEvents() {
        var addBtn   = document.getElementById('fcAddRowBtn');
        var printBtn = document.getElementById('fcPrintBtn');
        var startOdo = document.getElementById('fcStartOdo');
        var vehicle  = document.getElementById('fcVehicle');

        if (addBtn)   addBtn.addEventListener('click',  function() { FuelCalcModule._addRow(); });
        if (printBtn) printBtn.addEventListener('click', function() {
            var d = document.getElementById('printDate');
            if (d) d.textContent = 'Generated on: ' + new Date().toLocaleDateString('en-GB');
            window.print();
        });
        if (startOdo) startOdo.addEventListener('input', function() { FuelCalcModule._calculateAll(); });
        if (vehicle)  vehicle.addEventListener('change', function() { FuelCalcModule._triggerAutoFillAll(); });
    },

    _addRow() {
        var tbody = document.getElementById('fcTbody');
        if (!tbody) return;

        var tr = document.createElement('tr');
        tr.innerHTML = [
            '<td><input type="date" class="form-input fc-date" style="min-width:120px"></td>',
            '<td><input type="number" class="form-input fc-amount" step="0.1" placeholder="e.g. 20" style="min-width:80px"></td>',
            '<td>',
            '  <div class="fc-station" style="font-size:0.9rem;color:var(--text-secondary)">--</div>',
            '  <div class="fc-cost" style="font-size:0.8rem;color:var(--text-muted)">--</div>',
            '</td>',
            '<td><input type="number" class="form-input fc-odo" placeholder="Odometer" style="min-width:100px"></td>',
            '<td><span class="fc-dist" style="font-weight:600">--</span></td>',
            '<td><span class="fc-cons badge badge-neutral">--</span></td>',
            '<td class="no-print">',
            '  <button class="btn-icon danger fc-del-btn" title="Remove">',
            '    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>',
            '  </button>',
            '</td>'
        ].join('');

        tbody.appendChild(tr);

        var dateInp = tr.querySelector('.fc-date');
        var amtInp  = tr.querySelector('.fc-amount');
        var odoInp  = tr.querySelector('.fc-odo');
        var delBtn  = tr.querySelector('.fc-del-btn');

        dateInp.addEventListener('change', function() { FuelCalcModule._autoFillRow(tr); });
        amtInp.addEventListener('input',   function() { FuelCalcModule._autoFillRow(tr); });
        odoInp.addEventListener('input',   function() { FuelCalcModule._calculateAll(); });
        delBtn.addEventListener('click',   function() { tr.remove(); FuelCalcModule._calculateAll(); });
    },

    _triggerAutoFillAll() {
        var rows = document.querySelectorAll('#fcTbody tr');
        rows.forEach(function(tr) { FuelCalcModule._autoFillRow(tr); });
    },

    _autoFillRow(tr) {
        var vid  = document.getElementById('fcVehicle').value;
        var date = tr.querySelector('.fc-date').value;
        var amt  = parseFloat(tr.querySelector('.fc-amount').value);

        if (!vid || !date) return;

        var logs = DB.Fuel.getAll().filter(function(f) {
            return String(f.vehicle_id) === String(vid) && f.date === date;
        });

        var match = null;
        if (logs.length === 1) {
            match = logs[0];
        } else if (logs.length > 1) {
            if (!isNaN(amt)) {
                match = logs.reduce(function(prev, curr) {
                    return Math.abs(parseFloat(curr.liters) - amt) < Math.abs(parseFloat(prev.liters) - amt) ? curr : prev;
                });
            } else {
                match = logs[0];
            }
        }

        if (match) {
            var sym = DB.Settings.get('currency_symbol') || 'Rs.';
            tr.querySelector('.fc-station').textContent = match.station || 'Unknown Station';
            tr.querySelector('.fc-cost').textContent    = (match.total_cost > 0) ? sym + ' ' + parseFloat(match.total_cost).toFixed(2) : '--';

            var odoInp = tr.querySelector('.fc-odo');
            if (!odoInp.value && match.odometer) odoInp.value = match.odometer;

            var amtInp = tr.querySelector('.fc-amount');
            if (!amtInp.value && match.liters) amtInp.value = match.liters;
        }

        FuelCalcModule._calculateAll();
    },

    _calculateAll() {
        var rows     = Array.from(document.querySelectorAll('#fcTbody tr'));
        var startOdo = parseFloat(document.getElementById('fcStartOdo').value) || 0;

        var totalLiters   = 0;
        var totalDistance = 0;
        var previousOdo   = startOdo;

        rows.forEach(function(tr) {
            var amt  = parseFloat(tr.querySelector('.fc-amount').value) || 0;
            var odo  = parseFloat(tr.querySelector('.fc-odo').value)    || 0;
            var distSpan = tr.querySelector('.fc-dist');
            var consSpan = tr.querySelector('.fc-cons');

            totalLiters += amt;

            if (odo > 0 && previousOdo > 0 && odo > previousOdo) {
                var dist = odo - previousOdo;
                totalDistance += dist;
                distSpan.textContent = dist.toFixed(1) + ' km';
                distSpan.style.color = 'var(--text-primary)';

                if (amt > 0) {
                    var kml = (dist / amt).toFixed(2);
                    consSpan.textContent = kml + ' km/L';
                    consSpan.className   = 'fc-cons badge ' + (kml >= 8 ? 'badge-success' : kml >= 5 ? 'badge-primary' : 'badge-warning');
                } else {
                    consSpan.textContent = '--';
                    consSpan.className   = 'fc-cons badge badge-neutral';
                }
            } else {
                distSpan.textContent = '--';
                distSpan.style.color = 'var(--text-muted)';
                consSpan.textContent = '--';
                consSpan.className   = 'fc-cons badge badge-neutral';
            }

            if (odo > 0) previousOdo = odo;
        });

        document.getElementById('fcTotalLiters').textContent    = totalLiters.toFixed(1);
        document.getElementById('fcTotalDistance').textContent  = totalDistance.toFixed(1);
        document.getElementById('fcAvgConsumption').textContent = (totalDistance > 0 && totalLiters > 0)
            ? (totalDistance / totalLiters).toFixed(2)
            : '0.00';
    }
};
