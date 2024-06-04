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

function updateUserPut(id, username, email, password) {
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

async function updateUserPatch(id, userData) {
    return new Promise((resolve, reject) => {
        const updateFields = Object.keys(userData).map(field => `${field} = ?`).join(', ');
        const values = Object.values(userData);
        values.push(id);

        const query = `UPDATE users SET ${updateFields} WHERE id = ?`;

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

function setIsAdmin(userId, isAdmin) { // isAdmin is a boolean
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET is_admin = ? WHERE id = ?`;
        db.run(sql, [isAdmin ? 'yes' : 'no', userId], function(err) {

            if (err) {
                reject(err);
            } else {
                resolve(`is_admin field for user with ID ${userId} set to ${isAdmin}`);
            }
        });
    });
}

async function isUserAdmin(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row && row.is_admin === 'yes') {
                    resolve(true);
                } else {
                    resolve(false);
                }
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

function getUserRatingById(userId, cocktailId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT rating FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`, [userId, cocktailId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.rating : null);
            }
        });
    });
}

async function rateCocktail(userId, cocktailId, rating) {
    try {
        // Check if the user exists
        const userExists = checkUserExists(userId);
        if (!userExists) {
            console.error('User does not exist');
            return;
        }

        // Check if the cocktail exists
        const cocktailExists = await getCocktailById(cocktailId);
        if (!cocktailExists) {
            console.error('Cocktail does not exist');
            return;
        }

        // Check if there's already a rating entry for this user and cocktail
        db.get(`SELECT * FROM user_interaction 
                WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`, [userId, cocktailId], (err, row) => {
            if (err) {
                console.error('Error checking existing entry:', err);
                return;
            }

            if (row) {
                // If a rating entry exists, update the rating value
                const updateQuery = `UPDATE user_interaction 
                                     SET rating = ?
                                     WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`;
                db.run(updateQuery, [rating, userId, cocktailId], (err) => {
                    if (err) {
                        console.error('Error updating rating:', err);
                    } else {
                        console.log('Rating updated successfully');
                    }
                });
            } else {
                // If no rating entry exists, insert a new one
                const insertQuery = `INSERT INTO user_interaction (user_id, cocktail_id, action, rating) 
                                     VALUES (?, ?, 'rating', ?)`;
                db.run(insertQuery, [userId, cocktailId, rating], (err) => {
                    if (err) {
                        console.error('Error adding rating:', err);
                    } else {
                        console.log('Rating added successfully');
                    }
                });
            }
        });
    } catch (err) {
        console.error('Error rating cocktail:', err.message);
    }
}

function getUserInteractionById(userId, cocktailId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT action FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action IN ("recommend", "not_recommend", "pin")', [userId, cocktailId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.action : null);
            }
        });
    });
}

function updateUserInteraction(userId, cocktailId, action) {
    return new Promise((resolve, reject) => {
        // Check if an entry with the same user_id and cocktail_id already exists for the given action types
        db.get(`SELECT * FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action IN ('recommend', 'not_recommend', 'pin')`, [userId, cocktailId], (err, row) => {
            if (err) {
                console.error('Error checking existing entry:', err);
                reject(err);
                return;
            }

            if (row) {
                // An entry already exists for this user_id and cocktail_id with the same action
                if (row.action === action) {
                    // If the existing action is the same as the new action, do nothing
                    console.log(`Action '${action}' already exists for user ${userId} and cocktail ${cocktailId}`);
                    resolve();
                } else {
                    // If the existing action is different from the new action, update the existing entry with the new action
                    db.run(`UPDATE user_interaction SET action = ? WHERE user_id = ? AND cocktail_id = ? AND action IN ('recommend', 'not_recommend', 'pin')`, [action, userId, cocktailId], function (err) {
                        if (err) {
                            console.error('Error updating action:', err);
                            reject(err);
                        } else {
                            console.log(`Action updated successfully for user ${userId} and cocktail ${cocktailId}`);

                            // If the action is now 'pin', delete any rating entry for this user and cocktail
                            if (action === 'pin') {
                                db.run(`DELETE FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`, [userId, cocktailId], function (err) {
                                    if (err) {
                                        console.error('Error deleting rating entry:', err);
                                        reject(err);
                                    } else {
                                        console.log('Rating entry deleted successfully');
                                        resolve();
                                    }
                                });
                            } else {
                                resolve();
                            }
                        }
                    });
                }
            } else {
                // No existing entry found with the specified actions, insert the new interaction with the action
                db.run(`INSERT INTO user_interaction (user_id, cocktail_id, action) VALUES (?, ?, ?)`, [userId, cocktailId, action], function (err) {
                    if (err) {
                        console.error('Error inserting user interaction:', err);
                        reject(err);
                    } else {
                        console.log('User interaction inserted successfully');

                        // If the action is 'pin', delete any rating entry for this user and cocktail
                        if (action === 'pin') {
                            db.run(`DELETE FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`, [userId, cocktailId], function (err) {
                                if (err) {
                                    console.error('Error deleting rating entry:', err);
                                    reject(err);
                                } else {
                                    console.log('Rating entry deleted successfully');
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    }
                });
            }
        });
    });
}

async function deleteUserInteraction(userId, cocktailId) {
    return new Promise((resolve, reject) => {
        const deleteQuery = `DELETE FROM user_interaction WHERE user_id = ? AND cocktail_id = ?`;
        db.run(deleteQuery, [userId, cocktailId], function (err) {
            if (err) {
                console.error('Error deleting user interactions:', err);
                reject(err);
            } else {
                console.log(`User interactions for user ${userId} and cocktail ${cocktailId} deleted successfully`);
                resolve();
            }
        });
    });
}

function getUserFavCocktailId(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT cocktail_id FROM user_interaction WHERE user_id = ? AND action = "fav"', [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.cocktail_id : null);
            }
        });
    });
}

function updateUserFav(userId, newCocktailId) {
    return new Promise((resolve, reject) => {
        // Check if there's already an entry with action set to 'favourites' for this user
        db.get(`SELECT * FROM user_interaction WHERE user_id = ? AND action = 'fav'`, [userId], (err, row) => {
            if (err) {
                console.error('Error checking existing entry:', err);
                reject(err);
                return;
            }

            if (row) {
                // If an entry with action set to 'favourites' already exists
                if (row.cocktail_id !== newCocktailId) {
                    // If the existing entry's cocktail_id is different from the new one, update it
                    db.run(`UPDATE user_interaction SET cocktail_id = ? WHERE user_id = ? AND action = 'fav'`, [newCocktailId, userId], function (err) {
                        if (err) {
                            console.error('Error updating favourites:', err);
                            reject(err);
                        } else {
                            console.log(`Favourites updated successfully for user ${userId}`);
                            resolve();
                        }
                    });
                } else {
                    // If the existing entry's cocktail_id is the same as the new one, do nothing
                    console.log(`Favourites already set for user ${userId} and cocktail ${newCocktailId}`);
                    resolve();
                }
            } else {
                // No existing entry found, insert the new favourite entry
                db.run(`INSERT INTO user_interaction (user_id, cocktail_id, action) VALUES (?, ?, 'fav')`, [userId, newCocktailId], function (err) {
                    if (err) {
                        console.error('Error inserting favourites:', err);
                        reject(err);
                    } else {
                        console.log('Favourites inserted successfully');
                        resolve();
                    }
                });
            }
        });
    });
}

function deleteUserFav(userId) {
    const query = `DELETE FROM user_interaction WHERE user_id = ? AND action = 'fav'`;

    // Execute the DELETE statement
    db.run(query, [userId], function(err) {
        if (err) {
            console.error('Error deleting favorite entry:', err.message);
        } else {
            console.log(`Deleted favorite entry for user ${userId}`);
        }
    });
}

function getCounterByCocktailId(cocktailID, action) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(*) as count 
            FROM user_interaction 
            WHERE cocktail_id = ? AND action = ?
        `;

        db.get(query, [cocktailID, action], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.count : 0);
            }
        });
    });
}

function getCounterByUserId(userId, action) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT COUNT(*) as count 
            FROM user_interaction 
            WHERE user_id = ? AND action = ?
        `;

        db.get(query, [userId, action], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.count : 0);
            }
        });
    });
}

function getCocktailIdsByUserId(userId, action) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT cocktail_id 
            FROM user_interaction 
            WHERE user_id = ? AND action = ?
        `;

        db.all(query, [userId, action], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const cocktailIds = rows.map(row => row.cocktail_id);
                resolve(cocktailIds);
            }
        });
    });
}


function getAverageRatingByCocktailId(cocktailID) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT AVG(rating) as averageRating 
            FROM user_interaction
            WHERE cocktail_id = ?
        `;

        db.get(query, [cocktailID], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.averageRating : 0);
            }
        });
    });
}

function getAverageRatingByUserId(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT AVG(rating) as averageRating 
            FROM user_interaction
            WHERE user_id = ?
        `;

        db.get(query, [userId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.averageRating : 0);
            }
        });
    });
}

function getAllUniqueIngredients(callback) {
    const query = `
        SELECT DISTINCT ingredient FROM ingredients
    `;

    // Execute the SQL query
    db.all(query, function(err, rows) {
        if (err) {
            console.error('Error retrieving unique ingredients:', err.message);
            callback(err, null);
        } else {
            const uniqueIngredients = rows.map(row => row.ingredient);
            callback(null, uniqueIngredients);
        }
    });
}

function getCocktailsByIngredients(ingredients) {
    return new Promise((resolve, reject) => {
        const placeholders = ingredients.map(() => '?').join(', ');
        const query = `
            SELECT c.id, c.name, c.category, c.alcoholic, c.glass, c.instructions, c.thumbnail
            FROM cocktails c
            JOIN ingredients i ON c.id = i.cocktail_id
            WHERE i.ingredient IN (${placeholders})
            GROUP BY c.id
        `;

        const params = [...ingredients];

        db.all(query, params, function(err, rows) {
            if (err) {
                console.error('Error retrieving cocktails by ingredients:', err.message);
                reject(err);
            } else {
                resolve(rows);
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
    setIsAdmin,
    isUserAdmin,
    updateUserPut,
    updateUserPatch,
    removeUserByUsername,
    clearUserDatabase,
    getUser,
    getUsernameById,
    getEmailById,
    getPasswordById,
    checkEmailExists,
    checkUserExists,
    getUserRatingById,
    rateCocktail,
    getUserInteractionById,
    updateUserInteraction,
    deleteUserInteraction,
    getUserFavCocktailId,
    updateUserFav,
    deleteUserFav,
    getCounterByCocktailId,
    getCounterByUserId,
    getAverageRatingByCocktailId,
    getAllUniqueIngredients,
    getCocktailsByIngredients,
    getCocktailIdsByUserId,
    getAverageRatingByUserId
}