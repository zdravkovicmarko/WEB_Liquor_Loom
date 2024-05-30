const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, 'userDatabase.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS 
    users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
  )`);
});

function insertUser(username, email, password) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.run(query, [username, email, password], function (err) {
            if (err) {
                console.log('Error inserting user:', err);
                reject(err);
            } else {
                console.log(`${username}, inserted with ID:`, this.lastID);
                resolve(this.lastID);
            }
        });
    });
}

function removeUserByUsername(username) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM users WHERE username = ?';
        db.run(query, [username], function (err) {
            // error function
            if (err) {
                console.error('Error removing user:', err);
                reject(err);
            } else {
                if (this.changes === 0) {
                    console.log('No user found with username:', username);
                    resolve(null);
                } else {
                    console.log('User removed with username:', username);
                }
            }
        });
    });
}

function clearUserDatabase() {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM users`, function (err) {
            if (err) {
                console.error('Error clearing database:', err);
                reject(err);
            } else {
                console.log('Database cleared successfully');
                resolve();
            }
        });
    });
}

function getUser(usernameOrEmail, password) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?';
        db.get(query, [usernameOrEmail, usernameOrEmail, password], (err, row) => {
            if (err) {
                console.error('Error fetching user:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = {
    insertUser,
    removeUserByUsername,
    clearUserDatabase,
    getUser
};