const db = require('better-sqlite3')('database.sqlite');
try { db.prepare(`ALTER TABLE fuel_logs ADD COLUMN driver_id TEXT DEFAULT ''`).run(); } catch(e) {}
try { db.prepare(`ALTER TABLE fuel_logs ADD COLUMN fill_date TEXT DEFAULT ''`).run(); } catch(e) {}
try { db.prepare(`ALTER TABLE fuel_logs ADD COLUMN receipt_no TEXT DEFAULT ''`).run(); } catch(e) {}
try { db.prepare(`UPDATE fuel_logs SET fill_date = date WHERE fill_date = '' AND date IS NOT NULL`).run(); } catch(e) {}
try { db.prepare(`ALTER TABLE expenses ADD COLUMN trip_id TEXT DEFAULT ''`).run(); } catch(e) {}
try { db.prepare(`ALTER TABLE expenses ADD COLUMN description TEXT DEFAULT ''`).run(); } catch(e) {}
try { db.prepare(`UPDATE expenses SET description = title WHERE description = '' AND title IS NOT NULL`).run(); } catch(e) {}
try { db.prepare(`ALTER TABLE maintenance ADD COLUMN odometer REAL DEFAULT 0`).run(); } catch(e) {}
try { db.prepare(`ALTER TABLE maintenance ADD COLUMN workshop TEXT DEFAULT ''`).run(); } catch(e) {}
try { db.prepare(`UPDATE maintenance SET workshop = garage WHERE workshop = '' AND garage IS NOT NULL`).run(); } catch(e) {}
console.log('Migrations applied successfully');
