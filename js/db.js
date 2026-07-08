/* ================================================================
   TMS | DATABASE LAYER  — sql.js + Firebase Realtime Database Sync
   ================================================================ */

const DB_KEY        = 'tms_db_v3';
let FB_DB_PATH      = '';   // Set dynamically on init

// ── FIREBASE CONFIG ───────────────────────────────────────────────
const _firebaseConfig = {
    apiKey:            "AIzaSyAAPXz79A3M142K-MgArp-JK4BBFzpCVK0",
    authDomain:        "ja-transport-managemnt-system.firebaseapp.com",
    databaseURL:       "https://ja-transport-managemnt-system-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "ja-transport-managemnt-system",
    storageBucket:     "ja-transport-managemnt-system.firebasestorage.app",
    messagingSenderId: "683270467932",
    appId:             "1:683270467932:web:2029e94537a633ebacd199",
    measurementId:     "G-D0B67YC6SC"
};

let _fbApp      = null;
let _fbDatabase = null;
let _sqlJs      = null;
let _saveTimer  = null;

// ── INIT FIREBASE ─────────────────────────────────────────────────
function _initFirebase() {
    if (_fbApp) return;
    try {
        if (window.firebase.apps && window.firebase.apps.length > 0) {
            _fbApp = window.firebase.apps[0];
        } else {
            _fbApp = window.firebase.initializeApp(_firebaseConfig);
        }
        _fbDatabase = window.firebase.database(_fbApp);
        console.log('✅ Firebase initialized successfully');
    } catch(e) {
        console.error('❌ Firebase init error:', e);
    }
}

// ── SAVE DB TO FIREBASE (debounced 2s) ────────────────────────────
function _scheduleSave() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => _saveToFirebase(), 2000);
}

async function _saveToFirebase() {
    if (!DB._db || !_fbDatabase || !FB_DB_PATH) return;
    try {
        const data = DB._db.export();
        const b64  = btoa(String.fromCharCode(...data));
        await _fbDatabase.ref(FB_DB_PATH).set(b64);
        console.log('✅ TMS: Database synced to Firebase');
    } catch(e) {
        console.error('Firebase save error:', e);
    }
}

// ── LOAD DB FROM FIREBASE ─────────────────────────────────────────
async function _loadFromFirebase() {
    if (!_fbDatabase || !FB_DB_PATH) return null;
    try {
        const snapshot = await _fbDatabase.ref(FB_DB_PATH).get();
        if (snapshot.exists()) {
            const b64  = snapshot.val();
            const bin  = atob(b64);
            const arr  = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return arr;
        }
    } catch(e) {
        console.error('Firebase load error:', e);
    }
    return null;
}

export const DB = {
    _db: null,

    /* ── INITIALISE ─────────────────────────────────────────── */
    async init(uid) {
        if (!uid) throw new Error("Database init requires a user UID");
        
        FB_DB_PATH = `tms_database/users/${uid}/db_data`;

        // 1. Init Firebase
        _initFirebase();

        // 2. Load sql.js engine
        _sqlJs = await initSqlJs({ locateFile: f => `lib/${f}` });

        // 3. Try to load DB from Firebase first
        const fbData = await _loadFromFirebase();

        if (fbData) {
            // Existing DB from Firebase
            DB._db = new _sqlJs.Database(fbData);
            console.log('✅ TMS: Database loaded from Firebase');
        } else {
            // Brand new database for this user
            DB._db = new _sqlJs.Database();
            console.log('✅ TMS: Created new database for user', uid);
        }

        DB._createSchema();
        DB._ensureDefaults();
        DB._migrateSchema();

        // Save initial state if new
        if (!fbData) await _saveToFirebase();

        await DB.Attachments.init();
        return DB;
    },

    /* ── CORE HELPERS ────────────────────────────────────────── */
    run(sql, params = []) {
        try {
            DB._db.run(sql, params);
            _scheduleSave();
        } catch(e) {
            console.error('DB.run error:', e, sql);
        }
    },

    select(sql, params = []) {
        try {
            const stmt = DB._db.prepare(sql);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();
            return rows;
        } catch(e) {
            console.error('DB.select error:', e, sql);
            return [];
        }
    },

    scalar(sql, params = []) {
        const rows = DB.select(sql, params);
        if (!rows.length) return null;
        return Object.values(rows[0])[0];
    },

    /* ── SCHEMA ─────────────────────────────────────────────── */
    _migrateSchema() {
        ['fuel_logs', 'expenses', 'maintenance'].forEach(table => {
            try { DB._db.run(`ALTER TABLE ${table} ADD COLUMN attachment_id TEXT DEFAULT ''`); } catch(e) {}
        });

        // Migrate fuel_logs from v2 to v3 schema
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN driver_id TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN fill_date TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN receipt_no TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN trip_id TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN fill_phase TEXT DEFAULT 'general'`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN date TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN cost_per_liter REAL DEFAULT 0`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE fuel_logs ADD COLUMN full_tank INTEGER DEFAULT 0`); } catch(e) {}
        try { DB._db.run(`UPDATE fuel_logs SET fill_date = date WHERE fill_date = '' AND date IS NOT NULL`); } catch(e) {}

        // Migrate expenses from v2 to v3 schema
        try { DB._db.run(`ALTER TABLE expenses ADD COLUMN trip_id TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE expenses ADD COLUMN description TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE expenses ADD COLUMN title TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE expenses ADD COLUMN payment_method TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`UPDATE expenses SET description = title WHERE description = '' AND title IS NOT NULL`); } catch(e) {}

        // Migrate maintenance from v2 to v3 schema
        try { DB._db.run(`ALTER TABLE maintenance ADD COLUMN odometer REAL DEFAULT 0`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE maintenance ADD COLUMN workshop TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`UPDATE maintenance SET workshop = garage WHERE workshop = '' AND garage IS NOT NULL`); } catch(e) {}

        // Migrate attachments for drivers and vehicles
        try { DB._db.run(`ALTER TABLE drivers ADD COLUMN license_attachment_id TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE vehicles ADD COLUMN insurance_attachment_id TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE vehicles ADD COLUMN revenue_attachment_id TEXT DEFAULT ''`); } catch(e) {}
        try { DB._db.run(`ALTER TABLE vehicles ADD COLUMN eco_attachment_id TEXT DEFAULT ''`); } catch(e) {}
    },

    _createSchema() {
        DB._db.run(`PRAGMA foreign_keys = ON;`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS vehicles (
                id TEXT PRIMARY KEY, reg_no TEXT, brand TEXT, model TEXT,
                type TEXT, year INTEGER, color TEXT, seats INTEGER,
                fuel_type TEXT, engine_no TEXT, chassis_no TEXT,
                status TEXT DEFAULT 'Active', insurance_expiry TEXT,
                road_tax_expiry TEXT, tracking_id TEXT, tracking_password TEXT,
                odometer REAL DEFAULT 0, notes TEXT, 
                insurance_attachment_id TEXT DEFAULT '', revenue_attachment_id TEXT DEFAULT '', eco_attachment_id TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS drivers (
                id TEXT PRIMARY KEY, name TEXT, license_no TEXT,
                license_expiry TEXT, contact TEXT, email TEXT, address TEXT,
                status TEXT DEFAULT 'Active', joined_date TEXT,
                emergency_contact TEXT, blood_group TEXT,
                rating REAL DEFAULT 5, notes TEXT, 
                license_attachment_id TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY, name TEXT, type TEXT, contact TEXT,
                email TEXT, address TEXT, company TEXT, notes TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS routes (
                id TEXT PRIMARY KEY, name TEXT, origin TEXT,
                destination TEXT, distance_km REAL, estimated_duration TEXT,
                notes TEXT, created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY, vehicle_id TEXT, driver_id TEXT,
                start_date TEXT, end_date TEXT, purpose TEXT,
                distance_km REAL, start_odometer REAL, end_odometer REAL,
                status TEXT DEFAULT 'Scheduled', revenue REAL DEFAULT 0,
                notes TEXT, created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS fuel_logs (
                id TEXT PRIMARY KEY, vehicle_id TEXT, driver_id TEXT, trip_id TEXT DEFAULT '', fill_phase TEXT DEFAULT 'general',
                fill_date TEXT, date TEXT DEFAULT '', liters REAL, cost_per_liter REAL DEFAULT 0, total_cost REAL, full_tank INTEGER DEFAULT 0,
                odometer REAL, station TEXT, receipt_no TEXT, notes TEXT,
                attachment_id TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY, trip_id TEXT DEFAULT '', vehicle_id TEXT,
                date TEXT, category TEXT, title TEXT DEFAULT '', amount REAL,
                description TEXT, receipt_no TEXT, payment_method TEXT DEFAULT '',
                attachment_id TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS maintenance (
                id TEXT PRIMARY KEY, vehicle_id TEXT, date TEXT,
                type TEXT, odometer REAL, cost REAL, workshop TEXT,
                description TEXT, next_due_date TEXT, next_due_km REAL,
                status TEXT DEFAULT 'Completed', attachment_id TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY, value TEXT
            )`);
        DB._db.run(`
            CREATE TABLE IF NOT EXISTS system_users (
                id TEXT PRIMARY KEY, email TEXT, name TEXT,
                role TEXT DEFAULT 'Staff', status TEXT DEFAULT 'Active',
                created_at TEXT DEFAULT (datetime('now'))
            )`);
    },

    _ensureDefaults() {
        const hasCompany = DB.select("SELECT COUNT(*) as c FROM system_settings WHERE key='company_name'");
        if (!hasCompany || hasCompany.length === 0 || hasCompany[0].c === 0) {
            DB._db.run("INSERT INTO system_settings (key,value) VALUES ('company_name','TMS Pro')");
            DB._db.run("INSERT INTO system_settings (key,value) VALUES ('currency','LKR')");
            DB._db.run("INSERT INTO system_settings (key,value) VALUES ('theme','dark')");
            DB._db.run("INSERT INTO system_settings (key,value) VALUES ('currency_symbol','Rs.')");
            DB._db.run("INSERT INTO system_settings (key,value) VALUES ('timezone','Asia/Colombo')");
        }
    },

    /* ── SYSTEM USERS (STAFF) ────────────────────────────────── */
    SystemUsers: {
        getAll: () => DB.select('SELECT * FROM system_users ORDER BY name'),
        add: u => DB.run('INSERT INTO system_users (id,email,name,role,status) VALUES (?,?,?,?,?)', [u.id, u.email, u.name, u.role, u.status]),
        delete: id => DB.run('DELETE FROM system_users WHERE id=?', [id]),
    },

    /* ── VEHICLES ────────────────────────────────────────────── */
    Vehicles: {
        getAll: () => DB.select(`
            SELECT v.*, COUNT(t.id) as trip_count
            FROM vehicles v LEFT JOIN trips t ON t.vehicle_id = v.id
            GROUP BY v.id ORDER BY v.reg_no`),
        getById:    id => DB.select('SELECT * FROM vehicles WHERE id=?',[id])[0],
        getActive:  () => DB.select("SELECT * FROM vehicles WHERE status='Active' ORDER BY reg_no"),
        add: v => DB.run(`INSERT INTO vehicles (id,reg_no,brand,model,type,year,color,seats,fuel_type,engine_no,chassis_no,status,insurance_expiry,road_tax_expiry,tracking_id,tracking_password,odometer,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [v.id,v.reg_no,v.brand,v.model,v.type,v.year,v.color,v.seats,v.fuel_type,v.engine_no,v.chassis_no,v.status,v.insurance_expiry,v.road_tax_expiry,v.tracking_id,v.tracking_password,v.odometer,v.notes]),
        update: v => DB.run(`UPDATE vehicles SET reg_no=?,brand=?,model=?,type=?,year=?,color=?,seats=?,fuel_type=?,engine_no=?,chassis_no=?,status=?,insurance_expiry=?,road_tax_expiry=?,tracking_id=?,tracking_password=?,odometer=?,notes=? WHERE id=?`,
            [v.reg_no,v.brand,v.model,v.type,v.year,v.color,v.seats,v.fuel_type,v.engine_no,v.chassis_no,v.status,v.insurance_expiry,v.road_tax_expiry,v.tracking_id,v.tracking_password,v.odometer,v.notes,v.id]),
        delete: id => DB.run('DELETE FROM vehicles WHERE id=?',[id]),
    },

    /* ── DRIVERS ─────────────────────────────────────────────── */
    Drivers: {
        getAll: () => DB.select(`
            SELECT d.*, COUNT(t.id) as trip_count
            FROM drivers d LEFT JOIN trips t ON t.driver_id = d.id
            GROUP BY d.id ORDER BY d.name`),
        getById:   id => DB.select('SELECT * FROM drivers WHERE id=?',[id])[0],
        getActive: () => DB.select("SELECT * FROM drivers WHERE status='Active' ORDER BY name"),
        add: d => DB.run(`INSERT INTO drivers (id,name,license_no,license_expiry,contact,email,address,status,joined_date,emergency_contact,blood_group,rating,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.id,d.name,d.license_no,d.license_expiry,d.contact,d.email,d.address,d.status,d.joined_date,d.emergency_contact,d.blood_group,d.rating,d.notes]),
        update: d => DB.run(`UPDATE drivers SET name=?,license_no=?,license_expiry=?,contact=?,email=?,address=?,status=?,joined_date=?,emergency_contact=?,blood_group=?,rating=?,notes=? WHERE id=?`,
            [d.name,d.license_no,d.license_expiry,d.contact,d.email,d.address,d.status,d.joined_date,d.emergency_contact,d.blood_group,d.rating,d.notes,d.id]),
        delete: id => DB.run('DELETE FROM drivers WHERE id=?',[id]),
    },

    /* ── CUSTOMERS ───────────────────────────────────────────── */
    Customers: {
        getAll: () => DB.select(`
            SELECT c.*, COUNT(t.id) as trip_count
            FROM customers c LEFT JOIN trips t ON t.driver_id = c.id
            GROUP BY c.id ORDER BY c.name`),
        getById: id => DB.select('SELECT * FROM customers WHERE id=?',[id])[0],
        getList: () => DB.select('SELECT id,name FROM customers ORDER BY name'),
        add: c => DB.run(`INSERT INTO customers (id,name,type,contact,email,address,company,notes) VALUES (?,?,?,?,?,?,?,?)`,
            [c.id,c.name,c.type,c.contact,c.email,c.address,c.company,c.notes]),
        update: c => DB.run(`UPDATE customers SET name=?,type=?,contact=?,email=?,address=?,company=?,notes=? WHERE id=?`,
            [c.name,c.type,c.contact,c.email,c.address,c.company,c.notes,c.id]),
        delete: id => DB.run('DELETE FROM customers WHERE id=?',[id]),
    },

    /* ── ROUTES ──────────────────────────────────────────────── */
    Routes: {
        getAll: () => DB.select('SELECT * FROM routes ORDER BY name'),
        getById: id => DB.select('SELECT * FROM routes WHERE id=?',[id])[0],
        add: r => DB.run(`INSERT INTO routes (id,name,origin,destination,distance_km,estimated_duration,notes) VALUES (?,?,?,?,?,?,?)`,
            [r.id,r.name,r.origin,r.destination,r.distance_km,r.estimated_duration,r.notes]),
        update: r => DB.run(`UPDATE routes SET name=?,origin=?,destination=?,distance_km=?,estimated_duration=?,notes=? WHERE id=?`,
            [r.name,r.origin,r.destination,r.distance_km,r.estimated_duration,r.notes,r.id]),
        delete: id => DB.run('DELETE FROM routes WHERE id=?',[id]),
    },

    /* ── TRIPS ───────────────────────────────────────────────── */
    Trips: {
        getAll: () => DB.select(`
            SELECT t.*,
                v.reg_no as vehicle_reg, v.type as vehicle_type,
                d.name as driver_name
            FROM trips t
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            LEFT JOIN drivers  d ON t.driver_id  = d.id
            ORDER BY t.start_date DESC`),
        getById: id => DB.select('SELECT * FROM trips WHERE id=?',[id])[0],
        add: t => DB.run(`INSERT INTO trips (id,vehicle_id,driver_id,start_date,end_date,purpose,distance_km,start_odometer,end_odometer,status,revenue,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [t.id,t.vehicle_id,t.driver_id,t.start_date,t.end_date,t.purpose,t.distance_km,t.start_odometer,t.end_odometer,t.status,t.revenue,t.notes]),
        update: t => DB.run(`UPDATE trips SET vehicle_id=?,driver_id=?,start_date=?,end_date=?,purpose=?,distance_km=?,start_odometer=?,end_odometer=?,status=?,revenue=?,notes=? WHERE id=?`,
            [t.vehicle_id,t.driver_id,t.start_date,t.end_date,t.purpose,t.distance_km,t.start_odometer,t.end_odometer,t.status,t.revenue,t.notes,t.id]),
        delete: id => DB.run('DELETE FROM trips WHERE id=?',[id]),
    },

    /* ── FUEL ────────────────────────────────────────────────── */
    Fuel: {
        getAll: () => DB.select(`
            SELECT f.*, v.reg_no as vehicle_reg, d.name as driver_name
            FROM fuel_logs f
            LEFT JOIN vehicles v ON f.vehicle_id = v.id
            LEFT JOIN drivers  d ON f.driver_id  = d.id
            ORDER BY f.date DESC`),
        getByTrip: tripId => DB.select('SELECT * FROM fuel_logs WHERE trip_id=?', [tripId]),
        getById: id => DB.select('SELECT * FROM fuel_logs WHERE id=?', [id])[0],
        add: f => DB.run(`INSERT INTO fuel_logs (id,vehicle_id,driver_id,trip_id,fill_phase,date,station,liters,cost_per_liter,total_cost,odometer,full_tank,notes,attachment_id,fill_date,receipt_no) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [f.id,f.vehicle_id,f.driver_id,f.trip_id||'',f.fill_phase||'general',f.date,f.station,f.liters,f.cost_per_liter||0,f.total_cost,f.odometer,f.full_tank||0,f.notes,f.attachment_id||'',f.fill_date||'',f.receipt_no||'']),
        update: f => DB.run(`UPDATE fuel_logs SET vehicle_id=?,driver_id=?,trip_id=?,fill_phase=?,date=?,station=?,liters=?,cost_per_liter=?,total_cost=?,odometer=?,full_tank=?,notes=?,attachment_id=?,fill_date=?,receipt_no=? WHERE id=?`,
            [f.vehicle_id,f.driver_id,f.trip_id||'',f.fill_phase||'general',f.date,f.station,f.liters,f.cost_per_liter||0,f.total_cost,f.odometer,f.full_tank||0,f.notes,f.attachment_id||'',f.fill_date||'',f.receipt_no||'',f.id]),
        delete: id => DB.run('DELETE FROM fuel_logs WHERE id=?',[id]),
    },

    /* ── EXPENSES ────────────────────────────────────────────── */
    Expenses: {
        getAll: () => DB.select(`
            SELECT e.*, v.reg_no as vehicle_reg
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            ORDER BY e.date DESC`),
        getById: id => DB.select('SELECT * FROM expenses WHERE id=?', [id])[0],
        add: e => DB.run(`INSERT INTO expenses (id,trip_id,vehicle_id,date,category,title,amount,description,receipt_no,payment_method,attachment_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [e.id,e.trip_id||'',e.vehicle_id||'',e.date,e.category,e.title||'',e.amount,e.description||'',e.receipt_no||'',e.payment_method||'',e.attachment_id||'']),
        update: e => DB.run(`UPDATE expenses SET trip_id=?,vehicle_id=?,date=?,category=?,title=?,amount=?,description=?,receipt_no=?,payment_method=?,attachment_id=? WHERE id=?`,
            [e.trip_id||'',e.vehicle_id||'',e.date,e.category,e.title||'',e.amount,e.description||'',e.receipt_no||'',e.payment_method||'',e.attachment_id||'',e.id]),
        delete: id => DB.run('DELETE FROM expenses WHERE id=?',[id]),
    },

    /* ── MAINTENANCE ─────────────────────────────────────────── */
    Maintenance: {
        getAll: () => DB.select(`
            SELECT m.*, v.reg_no as vehicle_reg
            FROM maintenance m
            LEFT JOIN vehicles v ON m.vehicle_id = v.id
            ORDER BY m.date DESC`),
        getById: id => DB.select('SELECT * FROM maintenance WHERE id=?', [id])[0],
        add: m => DB.run(`INSERT INTO maintenance (id,vehicle_id,date,type,odometer,cost,workshop,description,next_due_date,next_due_km,status,attachment_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [m.id, m.vehicle_id, m.date||'', m.type||'', m.odometer||0, m.cost||0, m.workshop||m.garage||'', m.description||'', m.next_due_date||'', m.next_due_km||0, m.status||'Completed', m.attachment_id||'']),
        update: m => DB.run(`UPDATE maintenance SET vehicle_id=?,date=?,type=?,odometer=?,cost=?,workshop=?,description=?,next_due_date=?,next_due_km=?,status=?,attachment_id=? WHERE id=?`,
            [m.vehicle_id, m.date||'', m.type||'', m.odometer||0, m.cost||0, m.workshop||m.garage||'', m.description||'', m.next_due_date||'', m.next_due_km||0, m.status||'Completed', m.attachment_id||'', m.id]),
        delete: id => DB.run('DELETE FROM maintenance WHERE id=?',[id]),
    },

    /* ── SETTINGS ────────────────────────────────────────────── */
    Settings: {
        getAll() {
            const rows = DB.select('SELECT * FROM system_settings');
            const obj  = {};
            rows.forEach(r => obj[r.key] = r.value);
            return obj;
        },
        get:  key      => DB.scalar('SELECT value FROM system_settings WHERE key=?',[key]),
        set: (key, val) => DB.run('INSERT OR REPLACE INTO system_settings (key,value) VALUES (?,?)', [key, val])
    },

    /* ── ANALYTICS ───────────────────────────────────────────── */
    Analytics: {
        getAlerts() {
            const alerts = [];
            const today = new Date();
            const in30  = new Date(); in30.setDate(today.getDate() + 30);
            
            // Check Vehicles
            const vehicles = DB.select("SELECT * FROM vehicles WHERE status='Active'");
            vehicles.forEach(v => {
                if (!v.insurance_expiry) {
                    alerts.push({ type: 'danger', etype: 'vehicle', doc: 'Insurance', label: v.reg_no, msg: 'Missing insurance expiry date' });
                } else if (new Date(v.insurance_expiry) < today) {
                    alerts.push({ type: 'danger', etype: 'vehicle', doc: 'Insurance', label: v.reg_no, msg: 'Insurance has EXPIRED' });
                } else if (new Date(v.insurance_expiry) <= in30) {
                    alerts.push({ type: 'warning', etype: 'vehicle', doc: 'Insurance', label: v.reg_no, msg: `Expires on ${v.insurance_expiry}` });
                }

                if (!v.road_tax_expiry) {
                    alerts.push({ type: 'danger', etype: 'vehicle', doc: 'Road Tax', label: v.reg_no, msg: 'Missing road tax expiry date' });
                } else if (new Date(v.road_tax_expiry) < today) {
                    alerts.push({ type: 'danger', etype: 'vehicle', doc: 'Road Tax', label: v.reg_no, msg: 'Road tax has EXPIRED' });
                } else if (new Date(v.road_tax_expiry) <= in30) {
                    alerts.push({ type: 'warning', etype: 'vehicle', doc: 'Road Tax', label: v.reg_no, msg: `Expires on ${v.road_tax_expiry}` });
                }
            });

            // Check Drivers
            const drivers = DB.select("SELECT * FROM drivers WHERE status='Active'");
            drivers.forEach(d => {
                if (!d.license_expiry) {
                    alerts.push({ type: 'danger', etype: 'driver', doc: 'License', label: d.name, msg: 'Missing license expiry date' });
                } else if (new Date(d.license_expiry) < today) {
                    alerts.push({ type: 'danger', etype: 'driver', doc: 'License', label: d.name, msg: 'License has EXPIRED' });
                } else if (new Date(d.license_expiry) <= in30) {
                    alerts.push({ type: 'warning', etype: 'driver', doc: 'License', label: d.name, msg: `Expires on ${d.license_expiry}` });
                }
            });

            // Check Maintenance
            const maint = DB.select("SELECT m.*, v.reg_no FROM maintenance m LEFT JOIN vehicles v ON m.vehicle_id = v.id WHERE m.status='Scheduled'");
            maint.forEach(m => {
                if (m.next_due_date) {
                    if (new Date(m.next_due_date) < today) {
                        alerts.push({ type: 'danger', etype: 'maintenance', doc: 'Service Due', label: m.reg_no, msg: `Overdue since ${m.next_due_date}` });
                    } else if (new Date(m.next_due_date) <= in30) {
                        alerts.push({ type: 'warning', etype: 'maintenance', doc: 'Service Due', label: m.reg_no, msg: `Scheduled on ${m.next_due_date}` });
                    }
                }
            });

            return alerts;
        },
        alertsCount() {
            return this.getAlerts().length;
        },
        currentMonthSummary() {
            const m        = new Date().toISOString().slice(0, 7);
            const revenue  = DB.scalar("SELECT SUM(revenue) FROM trips WHERE start_date LIKE ?",    [`${m}%`]) || 0;
            const fuel     = DB.scalar("SELECT SUM(total_cost) FROM fuel_logs WHERE date LIKE ?", [`${m}%`]) || 0;
            const expenses = DB.scalar("SELECT SUM(amount) FROM expenses WHERE date LIKE ?",         [`${m}%`]) || 0;
            const maintenance = DB.scalar("SELECT SUM(cost) FROM maintenance WHERE date LIKE ?",     [`${m}%`]) || 0;
            return { revenue, fuel, expenses, maintenance };
        },
        monthlyCosts(months = 6) {
            const data = { labels: [], fuel: [], expenses: [] };
            for (let i = months - 1; i >= 0; i--) {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                const m = d.toISOString().slice(0, 7);
                data.labels.push(d.toLocaleString('default', { month: 'short' }));
                data.fuel.push(    DB.scalar("SELECT SUM(total_cost) FROM fuel_logs WHERE date LIKE ?", [`${m}%`]) || 0);
                data.expenses.push(DB.scalar("SELECT SUM(amount) FROM expenses WHERE date LIKE ?",           [`${m}%`]) || 0);
            }
            return data;
        },
        expenseByCategory() {
            const rows = DB.select("SELECT category, SUM(amount) as total FROM expenses GROUP BY category");
            return { labels: rows.map(r => r.category), data: rows.map(r => r.total) };
        },
        monthlyTrips(months = 6) {
            const data = { labels: [], counts: [], revenue: [] };
            for (let i = months - 1; i >= 0; i--) {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                const m = d.toISOString().slice(0, 7);
                data.labels.push(d.toLocaleString('default', { month: 'short' }));
                data.counts.push(DB.scalar("SELECT COUNT(*) FROM trips WHERE start_date LIKE ?", [`${m}%`]) || 0);
                data.revenue.push(DB.scalar("SELECT SUM(revenue) FROM trips WHERE start_date LIKE ?", [`${m}%`]) || 0);
            }
            return data;
        }
    },

    /* ── ATTACHMENTS (IndexedDB) ─────────────────────────────────── */
    Attachments: {
        _db: null,
        async init() {
            return new Promise((res, rej) => {
                const req = indexedDB.open('tms_attachments', 1);
                req.onupgradeneeded = e => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('files')) {
                        db.createObjectStore('files', { keyPath: 'id' });
                    }
                };
                req.onsuccess = e => { DB.Attachments._db = e.target.result; res(); };
                req.onerror   = e => { console.error('IndexedDB error', e); res(); };
            });
        },
        async save(id, dataUrl, type) {
            return new Promise((res, rej) => {
                const tx  = DB.Attachments._db.transaction('files', 'readwrite');
                const req = tx.objectStore('files').put({ id, dataUrl, type });
                req.onsuccess = async () => {
                    if (window.firebase && window.firebase.auth().currentUser) {
                        try {
                            const uid = window.firebase.auth().currentUser.uid;
                            await window.firebase.database().ref(`tms_database/users/${uid}/attachments/${id}`).set({ dataUrl, type });
                        } catch(e) { console.error('FB Att save error', e); }
                    }
                    res();
                };
                req.onerror   = e  => rej(e);
            });
        },
        async get(id) {
            return new Promise((res, rej) => {
                const tx  = DB.Attachments._db.transaction('files', 'readonly');
                const req = tx.objectStore('files').get(id);
                req.onsuccess = async e  => {
                    let r = e.target.result;
                    if (!r && window.firebase && window.firebase.auth().currentUser) {
                        try {
                            const uid = window.firebase.auth().currentUser.uid;
                            const snap = await window.firebase.database().ref(`tms_database/users/${uid}/attachments/${id}`).once('value');
                            if (snap.exists()) {
                                r = snap.val();
                                const tx2 = DB.Attachments._db.transaction('files', 'readwrite');
                                tx2.objectStore('files').put({ id: id, dataUrl: r.dataUrl, type: r.type });
                            }
                        } catch(err) { console.error('FB Att load error', err); }
                    }
                    if (!r) return res(null);
                    if (r.blob && !r.dataUrl) {
                        r.dataUrl = r.blob;
                        const match = r.blob.match(/^data:(.*?);base64/);
                        r.type = match ? match[1] : 'image/jpeg';
                    }
                    res(r);
                };
                req.onerror   = e  => rej(e);
            });
        },
        async delete(id) {
            return new Promise((res, rej) => {
                const tx  = DB.Attachments._db.transaction('files', 'readwrite');
                const req = tx.objectStore('files').delete(id);
                req.onsuccess = async () => {
                    if (window.firebase && window.firebase.auth().currentUser) {
                        try {
                            const uid = window.firebase.auth().currentUser.uid;
                            await window.firebase.database().ref(`tms_database/users/${uid}/attachments/${id}`).remove();
                        } catch(e) { console.error('FB Att delete error', e); }
                    }
                    res();
                };
                req.onerror   = e  => rej(e);
            });
        }
    }
};
