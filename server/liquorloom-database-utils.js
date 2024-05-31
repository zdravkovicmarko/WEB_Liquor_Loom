const { db } = require('./liquorloom-database');

function runQuery(query, params) { // SQL query on database, creates Promise that either resolved or rejected
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

function insertIngredients(cocktailId, ingredients, measures) {
    // Combine ingredients and measures into an array of objects
    const combined = ingredients.map((ingredient, index) => ({
        ingredient,
        measure: measures[index] || null // Use null if there is no corresponding measure
    }));

    // Create an array of promises to insert each ingredient
    const promises = combined.map(({ ingredient, measure }) =>
        runQuery(`INSERT INTO ingredients (cocktail_id, ingredient, measure) VALUES (?, ?, ?)`, [cocktailId, ingredient, measure])
    );

    // Return a promise that resolves when all inserts are done
    return Promise.all(promises);
}

async function addCocktailToDb(cocktail) {
    const { id, name, category, alcoholic, glass, instructions, thumbnail, ingredients, measures } = cocktail;
    try {
        // Check if the cocktail already exists in the database
        const existingCocktail = await getCocktailById(id);
        if (existingCocktail) {
            // If the cocktail already exists, throw an error or handle it accordingly
            console.log('Cocktail already in database')
            return;
        }

        // Insert cocktail
        await runQuery(
            `INSERT INTO cocktails ( id, name, category, alcoholic, glass, instructions, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, category, alcoholic, glass, instructions, thumbnail]
        );

        // Insert ingredients
        await insertIngredients(id, ingredients, measures);

        console.log("Cocktail added successfully");
    } catch (err) {
        console.error("Error adding cocktail:", err);
        //throw err;
    }
}

async function removeCocktailFromDb(cocktailId) {
    try {
        // Check if the cocktail exists in the database
        const existingCocktail = await getCocktailById(cocktailId);
        if (!existingCocktail) {
            console.log("Cocktail not found in the database");
        }

        // Delete the cocktail from the cocktails table
        await runQuery(`DELETE FROM cocktails WHERE id = ?`, [cocktailId]);

        // Delete associated ingredients from the ingredients table
        await runQuery(`DELETE FROM ingredients WHERE cocktail_id = ?`, [cocktailId]);

        return { id: cocktailId };
    } catch (error) {
        // If any error occurs during deletion or checking for existence, throw the error
        console.log('Issue in removeCocktailFromDb: ', error);
    }
}

async function clearCocktailDatabase() {
    try {
        // Drop the cocktails table
        await runQuery(`DROP TABLE IF EXISTS cocktails`);

        // Drop the ingredients table
        await runQuery(`DROP TABLE IF EXISTS ingredients`);

        console.log("Database cleared successfully");
    } catch (err) {
        console.error("Error clearing database:", err);
    }
}

function getCocktailById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM cocktails WHERE id = ?`, [id], (err, cocktail) => {
            if (err) {
                return reject(err);
            }
            if (!cocktail) { // Cocktail nicht gefunden
                return resolve(null);
            }
            db.all(`SELECT ingredient, measure FROM ingredients WHERE cocktail_id = ?`, [id], (err, ingredients) => {
                if (err) {
                    return reject(err);
                }
                cocktail.ingredients = ingredients.map(row => ({ ingredient: row.ingredient, measure: row.measure }));
                resolve(cocktail);
            });
        });
    });
}

function getCocktailByName(name) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM cocktails WHERE name = ?`, [name], (err, cocktail) => {
            if (err) {
                return reject(err);
            }
            if (!cocktail) { // Cocktail not found
                return resolve(null);
            }
            db.all(`SELECT ingredient, measure FROM ingredients WHERE cocktail_id = ?`, [cocktail.id], (err, ingredients) => {
                if (err) {
                    return reject(err);
                }
                cocktail.ingredients = ingredients.map(row => ({ ingredient: row.ingredient, measure: row.measure }));
                resolve(cocktail);
            });
        });
    });
}

function getAllCocktailsFromDb() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM cocktails`, (err, rows) => {
            if (err) {
                return reject(err);
            }
            const cocktails = rows.map(row => ({
                id: row.id,
                name: row.name,
                category: row.category,
                alcoholic: row.alcoholic,
                glass: row.glass,
                instructions: row.instructions,
                thumbnail: row.thumbnail
            }));
            resolve(cocktails);
        });
    });
}
function updateCocktailInDb(id, name, category, alcoholic, glass, instructions, thumbnail) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE cocktails SET 
        name = ?,
        category = ?,
        alcoholic = ?,
        glass = ?,
        instructions = ?,
        thumbnail = ?
        WHERE id = ?`;

        db.run(query, [name, category, alcoholic, glass, instructions, thumbnail, id], function (err) {
            if (err) {
                console.error('Error updating cocktail:', err);
                reject(err);
            } else {
                console.log(`Cocktail with ID ${id} updated successfully`);
                resolve();
            }
        });
    });
}

function updateCocktailIngredients(cocktailId, ingredients) {
    return new Promise((resolve, reject) => {
        // Assuming ingredients are stored in a separate table
        const deleteQuery = `DELETE FROM ingredients WHERE cocktail_id = ?`;
        db.run(deleteQuery, [cocktailId], function (err) {
            if (err) {
                console.error('Error deleting old ingredients:', err);
                reject(err);
            } else {
                const insertQuery = `INSERT INTO ingredients (cocktail_id, ingredient, measure) VALUES (?, ?, ?)`;
                const stmt = db.prepare(insertQuery);
                ingredients.forEach(({ ingredient, measure }) => {
                    stmt.run([cocktailId, ingredient, measure]);
                });
                stmt.finalize((err) => {
                    if (err) {
                        console.error('Error inserting new ingredients:', err);
                        reject(err);
                    } else {
                        console.log(`Ingredients for cocktail with ID ${cocktailId} updated successfully`);
                        resolve();
                    }
                });
            }
        });
    });
}

function updateCocktailStats(id, recommendations, do_not_recommendations, pinned, rating, amount_ratings) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE cocktail_stats SET
        recommendations = ?,
        do_not_recommendations = ?,
        pinned = ?,
        rating = ?,
        amount_ratings = ?
        WHERE cocktail_id = ?`;
        db.run(query, [recommendations, do_not_recommendations, pinned, rating, amount_ratings, id], function (err) {
            if (err) {
                console.error('Error updating cocktail stats:', err);
                reject(err);
            } else {
                console.log(`Stats for cocktail with ID ${id} updated successfully`);
                resolve();
            }
        });
    });
}

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

function getUsernameById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT username FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.username : null);
            }
        });
    });
}

function getEmailById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT email FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.email : null);
            }
        });
    });
}

function getPasswordById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT password FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.password : null);
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

module.exports ={
    runQuery,
    insertIngredients,
    addCocktailToDb,
    removeCocktailFromDb,
    clearCocktailDatabase,
    getCocktailById,
    getCocktailByName,
    getAllCocktailsFromDb,
    updateCocktailInDb,
    updateCocktailIngredients,
    updateCocktailStats,
    insertUser,
    updateUser,
    updateUser2,
    removeUserByUsername,
    clearUserDatabase,
    getUser,
    getUsernameById,
    getEmailById,
    getPasswordById,
    checkEmailExists,
    checkUserExists
}