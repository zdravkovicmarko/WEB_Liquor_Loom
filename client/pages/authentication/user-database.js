const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, 'userDatabase.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to user database');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS 
    users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    recommendations INTEGER DEFAULT 0,
    do_not_recommendations INTEGER DEFAULT 0,
    favourites INTEGER DEFAULT 0,
    plan_to_taste INTEGER DEFAULT 0
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
function updateUser(id, username, email, password) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?`;
        db.run(query, [username, email, password, id], function (err) {
            if (err) {
                console.error('Error updating user:', err);
                reject(err);
            } else {
                console.log(`User with ID ${id} updated successfully`);
                resolve();
            }
        });
    });
}

function updateUser2(id, userData) {
    return new Promise((resolve, reject) => {
        // Construct the SET clause dynamically based on provided fields
        const updateFields = Object.keys(userData).map(field => `${field} = ?`).join(', ');
        const values = Object.values(userData);

        const query = `UPDATE users SET ${updateFields} WHERE id = ?`;
        // Add the user ID at the end of the values array
        values.push(id);

        db.run(query, values, function (err) {
            if (err) {
                console.error('Error updating user:', err);
                reject(err);
            } else {
                console.log(`User with ID ${id} updated successfully`);
                resolve();
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

// New function to check if email exists
function checkEmailExists(email) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
        db.get(query, [email], (err, row) => {
            if (err) {
                console.error('Error checking email existence:', err);
                reject(err);
            } else {
                resolve(row.count > 0);
            }
        });
    });
}

function checkUserExists(username) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
        db.get(query, [username], (err, row) => {
            if (err) {
                console.error('Error checking user existence:', err);
                reject(err);
            } else {
                resolve(row.count > 0);
            }
        });
    });
}

module.exports = {
    insertUser,
    updateUser,
    updateUser2,
    removeUserByUsername,
    clearUserDatabase,
    getUser,
    checkEmailExists,
    checkUserExists
};