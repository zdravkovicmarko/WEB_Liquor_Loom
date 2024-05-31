const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, 'liquorloom-database.db');

// Connect to the combined database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to combined database', err);
    } else {
        console.log('Connected to LiquorLoom database');
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
    cocktail_stats (
        cocktail_id INTEGER PRIMARY KEY,
        recommendations INTEGER DEFAULT 0,
        do_not_recommendations INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        rating REAL DEFAULT 0.0,
        amount_ratings INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS 
    users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS 
    user_interaction (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        cocktail_id TEXT,
        action TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(cocktail_id) REFERENCES cocktails(id)
    )`);

});

module.exports = {
    db
};