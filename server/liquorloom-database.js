const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, 'liquorloom-database.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to LiquorLoom database', err);
    } else {
        console.log('Connected to LiquorLoom database');
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
                console.error('Error enabling foreign keys:', err);
            } else {
                console.log('Foreign keys enabled.');
            }
        });

    db.serialize(() => {

        db.run(`CREATE TABLE IF NOT EXISTS 
        cocktails (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            alcoholic TEXT,
            glass TEXT,
            instructions TEXT,
            thumbnail TEXT
        )`);

        // seperate table for ingredients with reference to table cocktails table
        db.run(`CREATE TABLE IF NOT EXISTS
        ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cocktail_id INTEGER,
            ingredient TEXT,
            measure TEXT,
            FOREIGN KEY(cocktail_id) REFERENCES cocktails(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS 
        users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            is_admin TEXT DEFAULT 'no'
      )`);

        db.run(`CREATE TABLE IF NOT EXISTS 
        user_interaction (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            cocktail_id TEXT,
            action TEXT NOT NULL,
            rating REAL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(cocktail_id) REFERENCES cocktails(id)
       )`);
    });
    }
});

module.exports = {
    db
};