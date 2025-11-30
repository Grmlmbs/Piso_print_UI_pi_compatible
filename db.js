const Database = require('better-sqlite3');
const path = require("path");
const dbPath = path.join(__dirname, 'db', 'PisoPrintDb.db'); 
const db = new Database(dbPath);

// CRITICAL: SQL to create the Transactions table if it doesn't exist
// The table is spelled correctly: T-r-a-n-s-a-c-t-i-o-n-s
console.log("Database conneccted to:", dbPath);
db.prepare(`
    CREATE TABLE IF NOT EXISTS Transactions (
        Transaction_Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Date TEXT NOT NULL,
        Amount REAL,
        Color TEXT,
        Pages TEXT NOT NULL,
        Copies INTEGER,
        Paper_Size TEXT,
        File_Path TEXT,
        File_Size TEXT,
        Status TEXT
    )
`).run();

// Set database performance settings (pragmas)
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 3000');

module.exports = db;