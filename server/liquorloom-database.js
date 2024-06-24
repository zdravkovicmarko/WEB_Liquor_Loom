const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.resolve(__dirname, 'liquorloom-database.db');

// Connect to DB
const db = new sqlite3.Database(dbPath, err => {
    if (err) return console.error('Could not connect to LiquorLoom database', err);
    console.log('Connected to LiquorLoom database');

    // Enable foreign keys (to represent relationships between tables)
    db.run('PRAGMA foreign_keys = ON;', err => {
        if (err) return console.error('Error enabling foreign keys:', err);
        console.log('Foreign keys enabled.');
    });

    // Initialize tables
    db.serialize(() => {
        // Cocktails table
        db.run(`CREATE TABLE IF NOT EXISTS cocktails (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            alcoholic TEXT,
            glass TEXT,
            instructions TEXT,
            thumbnail TEXT
        )`);

        // Ingredients table
        db.run(`CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cocktail_id INTEGER,
            ingredient TEXT,
            measure TEXT,
            FOREIGN KEY(cocktail_id) REFERENCES cocktails(id)
        )`);

        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            is_admin TEXT DEFAULT 'no'
        )`);

        // User interaction table
        db.run(`CREATE TABLE IF NOT EXISTS user_interaction (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            cocktail_id TEXT,
            action TEXT NOT NULL,
            rating REAL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(cocktail_id) REFERENCES cocktails(id)
        )`);
    });
});

module.exports = { db }; // Export DB for use in other files