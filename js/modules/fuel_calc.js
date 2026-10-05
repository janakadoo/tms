/* ================================================================
   TMS | FUEL CALCULATOR MODULE
   ================================================================ */
import { DB }    from '../db.js?v=13';
import { Utils } from '../utils.js?v=13';

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

        const sym = DB.Settings.get('currency_symbol') || 'Rs.';

        FuelCalcModule._container.innerHTML = [
            '<div class="page-content" id="fuelCalcPage">',

            // --- SCREEN UI (Hidden on print) ---
            '<div class="no-print">',
            '  <div class="page-header">',
            '    <div class="page-header-left">',
            '      <h2>Fuel Consumption Calculator</h2>',
            '      <p>Calculate and print accurate consumption reports for trips</p>',
            '    </div>',
            '    <div class="page-header-actions">',
            '      <button class="btn btn-secondary" id="fcAddRowBtn">',
            '        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>',
            '        Add Filling',
            '      </button>',
            '      <button class="btn btn-primary" id="fcPrintBtn">',
            '        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/></svg>',
            '        Print Report',
            '      </button>',
            '    </div>',
            '  </div>',

            '  <div class="card" style="margin-bottom:1.5rem">',
            '    <div class="card-body">',
            '      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">',
            '        <div class="form-group">',
            '          <label class="form-label">Vehicle</label>',
            '          <select class="form-select" id="fcVehicle">',
            '            <option value="">Select Vehicle...</option>',
            vOptions,
            '          </select>',
            '        </div>',
            '        <div class="form-group">',
            '          <label class="form-label">Driver Name</label>',
            '          <input type="text" class="form-input" id="fcDriver" placeholder="Enter Driver Name" list="fcDriversList">',
            '          <datalist id="fcDriversList">' + dOptions + '</datalist>',
            '        </div>',
            '        <div class="form-group">',
            '          <label class="form-label">Route / Trip Info</label>',
            '          <input type="text" class="form-input" id="fcRoute" placeholder="e.g. Complete Tour / Real Fuel Data">',
            '        </div>',
            '        <div class="form-group">',
            '          <label class="form-label">Prepared By</label>',
            '          <input type="text" class="form-input" id="fcPreparedBy" placeholder="Enter Name">',
            '        </div>',
            '      </div>',
            '    </div>',
            '  </div>',

            '  <div class="card" style="margin-bottom:1.5rem">',
            '    <div class="table-wrap">',
            '      <table class="table" id="fcTable">',
            '        <thead>',
            '          <tr>',
            '            <th>Date</th>',
            '            <th>Amount (L)</th>',
            '            <th>Total Cost (' + sym + ')</th>',
            '            <th>Odometer (km)</th>',
            '            <th style="width:50px"></th>',
            '          </tr>',
            '        </thead>',
            '        <tbody id="fcTbody"></tbody>',
            '      </table>',
            '    </div>',
            '  </div>',
            '  <div style="padding:1rem;background:rgba(16,185,129,0.1);border-radius:8px;border:1px solid rgba(16,185,129,0.2);color:var(--emerald)">',
            '    <strong>Tip:</strong> The first row is treated as the starting baseline. Subsequent fills are used to calculate the tour consumption.',
            '  </div>',
            '</div>',

            // --- PRINT UI (Hidden on screen) ---
            '<div class="print-only" id="printReport">',
            '  <div style="text-align:center;margin-bottom:30px;">',
            '    <h1 style="margin:0;font-size:24px;text-transform:uppercase;">VEHICLE FUEL CONSUMPTION REPORT</h1>',
            '    <p style="margin:5px 0 0 0;font-size:16px;color:#555;">Vehicle No. <span id="prReg" style="font-weight:bold">--</span> | Driver: <span id="prDriver" style="font-weight:bold">--</span></p>',
            '    <p style="margin:5px 0 0 0;font-size:14px;color:#555;"><span id="prRoute">--</span></p>',
            '  </div>',

            '  <table style="width:100%;max-width:600px;margin:0 auto 30px auto;border-collapse:collapse;font-size:14px;">',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:50%">Start Mileage</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prStartOdo">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Final Mileage</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prEndOdo">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Total Distance</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prTotalDist">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Total Fuel Used</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prTotalFuel">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Total Fuel Cost</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prTotalCost">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Overall Consumption</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prKml">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Consumption</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prL100km">--</td></tr>',
            '    <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Fuel Cost per Km</td><td style="padding:8px;border:1px solid #ddd;text-align:right" id="prCostPerKm">--</td></tr>',
            '  </table>',

            '  <h3 style="margin-bottom:10px;font-size:18px;">Fuel Filling &amp; Section Consumption</h3>',
            '  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:30px;">',
            '    <thead>',
            '      <tr style="background-color:#2a364b;color:#fff;">',
            '        <th style="padding:8px;border:1px solid #555;text-align:left">Date</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Mileage</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Fuel Amount</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Price/L</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Litres</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Distance</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Km/L</th>',
            '        <th style="padding:8px;border:1px solid #555;text-align:right">Rs/km</th>',
            '      </tr>',
            '    </thead>',
            '    <tbody id="prTbody">',
            '    </tbody>',
            '  </table>',

            '  <div style="font-size:14px;line-height:1.6;">',
            '    <h3 style="margin-bottom:10px;font-size:18px;">Complete Tour Calculation</h3>',
            '    <p style="margin:0">• Distance travelled = <span id="prCalcDist">--</span></p>',
            '    <p style="margin:0">• Fuel used after starting fill = <strong id="prCalcFuel">--</strong></p>',
            '    <p style="margin:0">• Overall consumption = <span id="prCalcCons">--</span></p>',
            '    <p style="margin:0">• Equivalent consumption = <strong id="prCalcL100">--</strong></p>',
            '    <p style="margin:0">• Fuel cost for tour = <strong id="prCalcCost">--</strong></p>',
            '    <p style="margin:0">• Average fuel cost = <strong id="prCalcAvgCost">--</strong></p>',
            '    <p style="margin-top:20px;font-size:11px;color:#777;" id="prNotes">Note: Each fuel filling uses its actual fuel price. The starting fill is treated as baseline, subsequent fills are used to calculate tour consumption.</p>',
            '  </div>',

            '  <div style="margin-top:60px;display:flex;justify-content:space-between;page-break-inside:avoid;">',
            '    <div style="text-align:center;width:250px;">',
            '      <div style="margin-bottom:10px;font-style:italic;" id="prSignPreparedBy"></div>',
            '      <div style="border-top:1px solid #000;padding-top:5px;font-weight:bold;">Prepared By</div>',
            '    </div>',
            '    <div style="text-align:center;width:250px;">',
            '      <div style="margin-bottom:10px;">&nbsp;</div>',
            '      <div style="border-top:1px solid #000;padding-top:5px;font-weight:bold;">Approved By</div>',
            '    </div>',
            '  </div>',
            '</div>',

            // Print styles
            '<style>',
            '@media screen {',
            '  .print-only { display: none !important; }',
            '}',
            '@media print {',
            '  @page { margin:20mm; }',
            '  body * { visibility:hidden; }',
            '  #fuelCalcPage, #fuelCalcPage * { visibility:visible; }',
            '  #fuelCalcPage { position:absolute;left:0;top:0;width:100%;color:#000;background:#fff; }',
            '  .no-print { display:none !important; }',
            '}',
            '</style>',

            '</div>'
        ].join('\n');

        FuelCalcModule._bindEvents();
        FuelCalcModule._addRow();
        FuelCalcModule._addRow(); // Start with at least 2 rows for baseline and end
    },

    _bindEvents() {
        var addBtn   = document.getElementById('fcAddRowBtn');
        var printBtn = document.getElementById('fcPrintBtn');
        var vehicle  = document.getElementById('fcVehicle');
        var route    = document.getElementById('fcRoute');
        var driver   = document.getElementById('fcDriver');
        var prepBy   = document.getElementById('fcPreparedBy');

        if (addBtn)   addBtn.addEventListener('click',  function() { FuelCalcModule._addRow(); });
        if (printBtn) printBtn.addEventListener('click', function() {
            FuelCalcModule._calculateAll(); // Update print view before printing
            window.print();
        });
        if (vehicle)  vehicle.addEventListener('change', function() { 
            FuelCalcModule._triggerAutoFillAll(); 
            document.getElementById('prReg').textContent = vehicle.options[vehicle.selectedIndex].text.split(' - ')[0] || '--';
        });
        if (route) route.addEventListener('input', function() {
            document.getElementById('prRoute').textContent = route.value || 'Complete Tour / Real Fuel Data';
        });
        if (driver) driver.addEventListener('input', function() {
            document.getElementById('prDriver').textContent = driver.value || '--';
        });
        if (prepBy) prepBy.addEventListener('input', function() {
            document.getElementById('prSignPreparedBy').textContent = prepBy.value || '';
        });
    },

    _addRow() {
        var tbody = document.getElementById('fcTbody');
        if (!tbody) return;

        var tr = document.createElement('tr');
        tr.innerHTML = [
            '<td><input type="date" class="form-input fc-date" style="min-width:120px"></td>',
            '<td><input type="number" class="form-input fc-amount" step="0.1" placeholder="Liters"></td>',
            '<td><input type="number" class="form-input fc-cost" step="0.01" placeholder="Cost"></td>',
            '<td><input type="number" class="form-input fc-odo" placeholder="Odometer"></td>',
            '<td class="no-print" style="text-align:right">',
            '  <button class="btn-icon danger fc-del-btn" title="Remove">',
            '    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>',
            '  </button>',
            '</td>'
        ].join('');

        tbody.appendChild(tr);

        var inputs = tr.querySelectorAll('input');
        inputs.forEach(function(inp) {
            inp.addEventListener('change', function() { FuelCalcModule._autoFillRow(tr); });
            inp.addEventListener('input',  function() { FuelCalcModule._calculateAll(); });
        });

        var delBtn = tr.querySelector('.fc-del-btn');
        delBtn.addEventListener('click', function() { 
            tr.remove(); 
            FuelCalcModule._calculateAll(); 
        });
    },

    _triggerAutoFillAll() {
        var rows = document.querySelectorAll('#fcTbody tr');
        rows.forEach(function(tr) { FuelCalcModule._autoFillRow(tr); });
    },

    _autoFillRow(tr) {
        var vid  = document.getElementById('fcVehicle').value;
        var date = tr.querySelector('.fc-date').value;
        var amtInp  = tr.querySelector('.fc-amount');
        var costInp = tr.querySelector('.fc-cost');
        var odoInp  = tr.querySelector('.fc-odo');

        if (!vid || !date) return;

        var logs = DB.Fuel.getAll().filter(function(f) {
            return String(f.vehicle_id) === String(vid) && f.date === date;
        });

        if (logs.length > 0) {
            var amt = parseFloat(amtInp.value);
            var match = logs[0];
            if (logs.length > 1 && !isNaN(amt)) {
                match = logs.reduce(function(prev, curr) {
                    return Math.abs(parseFloat(curr.liters) - amt) < Math.abs(parseFloat(prev.liters) - amt) ? curr : prev;
                });
            }

            if (!costInp.value && match.total_cost) costInp.value = match.total_cost;
            if (!odoInp.value && match.odometer)    odoInp.value = match.odometer;
            if (!amtInp.value && match.liters)      amtInp.value = match.liters;
        }

        FuelCalcModule._calculateAll();
    },

    _calculateAll() {
        var rows = Array.from(document.querySelectorAll('#fcTbody tr'));
        var prTbody = document.getElementById('prTbody');
        if (!prTbody) return;
        prTbody.innerHTML = '';

        var sym = DB.Settings.get('currency_symbol') || 'Rs.';
        var fmt = function(n, d) { return Number(n || 0).toLocaleString(undefined, {minimumFractionDigits: d||0, maximumFractionDigits: d||0}); };

        var startOdo = 0;
        var endOdo = 0;
        var totalFuelUsed = 0;
        var totalFuelCost = 0;
        
        var previousOdo = 0;
        var firstDate = '';
        var firstPrice = 0;

        var notePrices = [];

        rows.forEach(function(tr, idx) {
            var date = tr.querySelector('.fc-date').value || '--';
            var amt  = parseFloat(tr.querySelector('.fc-amount').value) || 0;
            var cost = parseFloat(tr.querySelector('.fc-cost').value) || 0;
            var odo  = parseFloat(tr.querySelector('.fc-odo').value) || 0;
            
            var pricePerL = amt > 0 ? (cost / amt) : 0;
            
            if (idx === 0) {
                // Baseline row
                startOdo = odo;
                previousOdo = odo;
                firstDate = date;
                firstPrice = pricePerL;

                if(date !== '--' && pricePerL > 0) {
                    notePrices.push(sym + ' ' + Math.round(pricePerL) + '/L on ' + date);
                }
                
                prTbody.innerHTML += [
                    '<tr>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:left">' + date + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + fmt(odo) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + sym + ' ' + fmt(cost) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + sym + ' ' + Math.round(pricePerL) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + fmt(amt, 2) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">Starting</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">--</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">--</td>',
                    '</tr>'
                ].join('');
            } else {
                // Subsequent rows
                var dist = odo > previousOdo ? (odo - previousOdo) : 0;
                var kml = amt > 0 ? (dist / amt) : 0;
                var rsKm = dist > 0 ? (cost / dist) : 0;

                totalFuelUsed += amt;
                totalFuelCost += cost;
                
                if (odo > 0) endOdo = odo;
                previousOdo = odo;

                if(date !== '--' && pricePerL > 0) {
                    notePrices.push(sym + ' ' + Math.round(pricePerL) + ' on ' + date);
                }

                prTbody.innerHTML += [
                    '<tr>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:left">' + date + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + (odo > 0 ? fmt(odo) : '--') + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + sym + ' ' + fmt(cost) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + sym + ' ' + Math.round(pricePerL) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + fmt(amt, 2) + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + (dist > 0 ? fmt(dist) : '--') + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + (kml > 0 ? fmt(kml, 2) : '--') + '</td>',
                    '  <td style="padding:8px;border:1px solid #ddd;text-align:right">' + (rsKm > 0 ? fmt(rsKm, 2) : '--') + '</td>',
                    '</tr>'
                ].join('');
            }
        });

        var totalDist = endOdo > startOdo ? (endOdo - startOdo) : 0;
        var overallKml = totalFuelUsed > 0 ? (totalDist / totalFuelUsed) : 0;
        var l100km = overallKml > 0 ? (100 / overallKml) : 0;
        var avgCostKm = totalDist > 0 ? (totalFuelCost / totalDist) : 0;

        // Update Summary Table
        document.getElementById('prStartOdo').textContent = fmt(startOdo) + ' km';
        document.getElementById('prEndOdo').textContent = fmt(endOdo) + ' km';
        document.getElementById('prTotalDist').textContent = fmt(totalDist) + ' km';
        document.getElementById('prTotalFuel').textContent = fmt(totalFuelUsed, 2) + ' L';
        document.getElementById('prTotalCost').textContent = sym + ' ' + fmt(totalFuelCost);
        document.getElementById('prKml').textContent = fmt(overallKml, 2) + ' km/L';
        document.getElementById('prL100km').textContent = fmt(l100km, 2) + ' L/100 km';
        document.getElementById('prCostPerKm').textContent = sym + ' ' + fmt(avgCostKm, 2);

        // Update Text Summary
        var distText = endOdo + ' - ' + startOdo + ' = ' + fmt(totalDist) + ' km';
        document.getElementById('prCalcDist').textContent = distText;
        document.getElementById('prCalcFuel').textContent = fmt(totalFuelUsed, 2) + ' L';
        
        var consText = fmt(totalDist) + ' / ' + fmt(totalFuelUsed, 2) + ' = ' + fmt(overallKml, 2) + ' km/L';
        document.getElementById('prCalcCons').textContent = consText;
        document.getElementById('prCalcL100').textContent = fmt(l100km, 2) + ' L/100 km';
        document.getElementById('prCalcCost').textContent = sym + ' ' + fmt(totalFuelCost);
        document.getElementById('prCalcAvgCost').textContent = sym + ' ' + fmt(avgCostKm, 2) + '/km';

        // Update Note
        var note = 'Note: Each fuel filling uses its actual fuel price: ';
        if (notePrices.length > 0) {
            note += notePrices.join(' and ') + '. ';
        }
        note += 'The ' + (firstDate||'first') + ' filling is treated as the starting baseline, subsequent fills are used to calculate tour consumption.';
        document.getElementById('prNotes').textContent = note;
    }
};
