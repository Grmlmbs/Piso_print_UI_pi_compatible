// seed.js
const db = require('./db'); 
const bcrypt = require('bcrypt');

const saltRounds = 10;

async function runSeed() {
    console.log("Starting Secure Seed...");
    
    // Hashing the password before saving it
    const password = 'pisoPrint123'; 
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.exec(`
        CREATE TABLE IF NOT EXISTS Admins (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    try {
        const insert = db.prepare('INSERT INTO Admins (username, password) VALUES (?, ?)');
        insert.run('admin', hashedPassword);
        console.log("✅ Admin account created with HASHED password.");
    } catch (err) {
        console.log("⚠️ Note: Admin already exists.");
    }
}

runSeed();
