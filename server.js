const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 8080;

app.use(cors());
// Need large limits for db upload
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the current directory (frontend)
app.use(express.static(__dirname));

const dbPath = path.join(__dirname, 'database.sqlite');
let db;

function initDb() {
    try {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    } catch (e) {
        console.error('Failed to open database:', e);
    }
}

initDb();

// Migration: Upload Base64 DB from frontend
app.post('/api/upload_db', (req, res) => {
    try {
        const { b64 } = req.body;
        if (!b64) return res.status(400).json({ error: 'No data provided' });

        const buffer = Buffer.from(b64, 'base64');
        
        // Close existing DB
        if (db) db.close();

        // Write the migrated file
        fs.writeFileSync(dbPath, buffer);
        console.log('Database migrated successfully from client.');

        // Re-open DB
        initDb();

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Sync Select Endpoint
app.post('/api/query', (req, res) => {
    try {
        const { sql, params = [] } = req.body;
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        res.json(rows);
    } catch (e) {
        console.error('Query Error:', e.message, req.body);
        res.status(500).json({ error: e.message });
    }
});

// Sync Run Endpoint
app.post('/api/run', (req, res) => {
    try {
        const { sql, params = [] } = req.body;
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        res.json({ success: true, changes: info.changes, lastInsertRowid: info.lastInsertRowid });
    } catch (e) {
        console.error('Run Error:', e.message, req.body);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`TMS Server running centrally on port ${PORT}`);
    console.log(`Access at http://localhost:${PORT}`);
    console.log(`=========================================`);
});
