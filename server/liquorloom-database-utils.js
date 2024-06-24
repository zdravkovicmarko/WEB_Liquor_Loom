const { db } = require('./liquorloom-database');

// Helper function to run an SQL query with parameters & return Promise
function runQuery(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Helper function to get results from an SQL query with parameters & return a Promise
function getQuery(query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Helper function to get all results from an SQL query with parameters & return a Promise
function allQuery(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Get cocktail by its ID
function getCocktailById(id) {
    return getQuery(`SELECT * FROM cocktails WHERE id = ?`, [id])
        .then(cocktail => {
            if (!cocktail) return null;
            return allQuery(`SELECT ingredient, measure FROM ingredients WHERE cocktail_id = ?`, [id])
                .then(ingredients => {
                    cocktail.ingredients = ingredients.map(row => ({ ingredient: row.ingredient, measure: row.measure }));
                    return cocktail;
                });
        });
}

// Get cocktail by its name
function getCocktailByName(name) {
    return getQuery(`SELECT * FROM cocktails WHERE name = ?`, [name])
        .then(cocktail => {
            if (!cocktail) return null;
            return allQuery(`SELECT ingredient, measure FROM ingredients WHERE cocktail_id = ?`, [cocktail.id])
                .then(ingredients => {
                    cocktail.ingredients = ingredients.map(row => ({ ingredient: row.ingredient, measure: row.measure }));
                    return cocktail;
                });
        });
}

// Get cocktails by ingredients
function getCocktailsByIngredients(ingredients) {
    const placeholders = ingredients.map(() => '?').join(', ');
    const query = `
        SELECT c.id, c.name, c.category, c.alcoholic, c.glass, c.instructions, c.thumbnail
        FROM cocktails c
        JOIN ingredients i ON c.id = i.cocktail_id
        WHERE i.ingredient IN (${placeholders})
        GROUP BY c.id
    `;
    return allQuery(query, ingredients)
        .catch(err => console.error('Error retrieving cocktails by ingredients:', err));
}

// Get all unique ingredients
function getAllUniqueIngredients(callback) {
    return allQuery(
        `SELECT DISTINCT ingredient FROM ingredients`, [])
        .then(rows => {
            const uniqueIngredients = rows.map(row => row.ingredient);
            callback(null, uniqueIngredients);
        })
        .catch(err => {
            console.error('Error retrieving unique ingredients:', err.message);
            callback(err, null);
        });
}

// Get all cocktails from database
function getAllCocktailsFromDb() {
    return allQuery(`SELECT * FROM cocktails`, [])
        .then(rows => rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            alcoholic: row.alcoholic,
            glass: row.glass,
            instructions: row.instructions,
            thumbnail: row.thumbnail
        })));
}

// Add new cocktail to database
async function addCocktailToDb(cocktail) {
    const { id, name, category, alcoholic, glass, instructions, thumbnail, ingredients, measures } = cocktail;
    try {
        // Check if cocktail already exists in DB
        const existingCocktail = await getCocktailById(id);
        if (existingCocktail) return console.log('Cocktail already in database')

        // Insert cocktail & ingredients
        await runQuery(
            `INSERT INTO cocktails ( id, name, category, alcoholic, glass, instructions, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, category, alcoholic, glass, instructions, thumbnail]);
        await insertIngredients(id, ingredients, measures);

        console.log("Cocktail added successfully");
    } catch (err) {
        console.error("Error adding cocktail:", err);
    }
}

// Insert ingredients for cocktail
function insertIngredients(cocktailId, ingredients, measures) {
    const promises = ingredients.map((ingredient, index) =>
        runQuery(
            `INSERT INTO ingredients (cocktail_id, ingredient, measure) VALUES (?, ?, ?)`,
            [cocktailId, ingredient, measures[index] || null]));
    return Promise.all(promises);
}

// Update cocktail ingredients in database
function updateIngredients(cocktailId, ingredients, measures) {
    if (ingredients.length !== measures.length) return Promise.reject(new Error('Ingredients and measures arrays must be of the same length'));

    return runQuery(`DELETE FROM ingredients WHERE cocktail_id = ?`, [cocktailId])
        .then(() => insertIngredients(cocktailId, ingredients, measures))
        .then(() => console.log(`Ingredients for cocktail with ID ${cocktailId} updated successfully`))
        .catch(err => console.error('Error updating ingredients:', err));
}

// Update cocktail in database
function updateCocktailInDb(id, name, category, alcoholic, glass, instructions, thumbnail) {
    return runQuery(
        `UPDATE cocktails SET name = ?, category = ?, alcoholic = ?, glass = ?, instructions = ?, thumbnail = ? WHERE id = ?`,
        [name, category, alcoholic, glass, instructions, thumbnail, id])
        .then(() => console.log(`Cocktail with ID ${id} updated successfully`))
        .catch(err => console.error('Error updating cocktail:', err));
}

// Remove cocktail from database
async function removeCocktailFromDb(cocktailId) {
    try {
        const existingCocktail = await getCocktailById(cocktailId);
        if (!existingCocktail) return console.log("Cocktail not found in the database");

        // Delete associated ingredients, user interactions & cocktail itself
        await runQuery(`DELETE FROM ingredients WHERE cocktail_id = ?`, [cocktailId]);
        console.log(`Ingredients deleted for cocktail with ID: ${cocktailId}`);

        await runQuery(`DELETE FROM user_interaction WHERE cocktail_id = ?`, [cocktailId]);
        console.log(`Deleted user interaction associated with CocktailID: ${cocktailId}`);

        await runQuery(`DELETE FROM cocktails WHERE id = ?`, [cocktailId]);
        console.log(`Cocktail deleted from cocktails table with ID: ${cocktailId}`);

        return { id: cocktailId };
    } catch (error) {
        console.log('Issue in removeCocktailFromDb: ', error);
    }
}

// Insert new user into database
function insertNewUser(username, email, password) {
    return runQuery(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password])
        .then(result => {
            console.log(`${username} inserted with ID:`, result.lastID);
            return result.lastID;
        })
        .catch(err => {
            console.log('Error inserting user:', err);
            throw err;
        });
}

// Get user by their username / email & password
function getUser(usernameOrEmail, password) {
    return getQuery(`SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?`, [usernameOrEmail, usernameOrEmail, password])
        .catch(err => {
            console.error('Error fetching user:', err);
            throw err;
        });
}

// Get username by user ID
function getUsernameById(id) {
    return getQuery('SELECT username FROM users WHERE id = ?', [id])
        .then(row => row ? row.username : null);
}

// Get email by user ID
function getEmailById(id) {
    return getQuery('SELECT email FROM users WHERE id = ?', [id])
        .then(row => row ? row.email : null);
}

// Get password by user ID
function getPasswordById(id) {
    return getQuery('SELECT password FROM users WHERE id = ?', [id])
        .then(row => row ? row.password : null);
}

// Check if username exists in database
function checkUserExists(username) {
    return getQuery(`SELECT COUNT(*) AS count FROM users WHERE username = ?`, [username])
        .then(row => row.count > 0)
        .catch(err => {
            console.error('Error checking user existence:', err);
            throw err;
        });
}

// Check if email exists in database
function checkEmailExists(email) {
    return getQuery(`SELECT COUNT(*) AS count FROM users WHERE email = ?`, [email])
        .then(row => row.count > 0)
        .catch(err => {
            console.error('Error checking email existence:', err);
            throw err;
        });
}

// Update user information in database
function updateUserPatch(id, userData) {
    const updateFields = Object.keys(userData).map(field => `${field} = ?`).join(', ');
    const values = Object.values(userData);
    values.push(id);

    return runQuery(`UPDATE users SET ${updateFields} WHERE id = ?`, values)
        .then(() => console.log(`User with ID ${id} updated successfully`))
        .catch(err => console.error('Error updating user:', err));
}

// Set user as admin
function setIsAdmin(userId, isAdmin) {
    return runQuery(`UPDATE users SET is_admin = ? WHERE id = ?`, [isAdmin ? 'yes' : 'no', userId])
        .then(() => `is_admin field for user with ID ${userId} set to ${isAdmin}`)
        .catch(err => { throw err; });
}

// Remove user by their username
function removeUserByUsername(username) {
    return runQuery(`DELETE FROM users WHERE username = ?`, [username])
        .then(result => {
            if (result.changes === 0) console.log('No user found with username:', username);
            else console.log('User removed with username:', username);
            return result.changes > 0;
        })
        .catch(err => {
            console.error('Error removing user:', err);
            throw err;
        });
}

// Get user's rating value for specific cocktail
function getUserRatingById(userId, cocktailId) {
    return getQuery(
        `SELECT rating FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`,
        [userId, cocktailId]
    ).then(row => row ? row.rating : null);
}

// Get user's interaction for specific cocktail
function getUserInteractionById(userId, cocktailId) {
    return getQuery(
        `SELECT action FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action IN ('recommend', 'not_recommend', 'pin')`,
        [userId, cocktailId]
    ).then(row => row ? row.action : null);
}

// Get action's counter by cocktail ID & action
function getCounterByCocktailId(cocktailID, action) {
    return getQuery(
        `SELECT COUNT(*) as count FROM user_interaction WHERE cocktail_id = ? AND action = ?`,
        [cocktailID, action]
    ).then(row => row ? row.count : 0);
}

// Get action's counter by user ID & action
function getCounterByUserId(userId, action) {
    return getQuery(
        `SELECT COUNT(*) as count FROM user_interaction WHERE user_id = ? AND action = ?`,
        [userId, action]
    ).then(row => row ? row.count : 0);
}

// Get cocktail IDs by user ID & action
function getCocktailIdsByUserId(userId, action) {
    return allQuery(
        `SELECT cocktail_id FROM user_interaction WHERE user_id = ? AND action = ?`,
        [userId, action]
    ).then(rows => rows.map(row => row.cocktail_id));
}

// Get cocktail's overall average rating by cocktail ID
function getAverageRatingByCocktailId(cocktailId) {
    return getQuery(
        `SELECT AVG(rating) as averageRating FROM user_interaction WHERE cocktail_id = ?`,
        [cocktailId]
    ).then(row => row ? row.averageRating : 0);
}

// Get user's average rating given to cocktails by user ID
function getAverageRatingByUserId(userId) {
    return getQuery(
        `SELECT AVG(rating) as averageRating FROM user_interaction WHERE user_id = ?`,
        [userId]
    ).then(row => row ? row.averageRating : 0);
}

// Update cocktail's rating value
async function rateCocktail(userId, cocktailId, rating) {
    try {
        // Check if user & cocktail exist
        const userExists = checkUserExists(userId);
        if (!userExists) return console.error('User does not exist');
        const cocktailExists = await getCocktailById(cocktailId);
        if (!cocktailExists) return console.error('Cocktail does not exist');

        // Check if rating entry exists for this user & cocktail
        db.get(`SELECT * FROM user_interaction 
                WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`, [userId, cocktailId], (err, row) => {
            if (err) return console.error('Error checking existing entry:', err);

            if (row) { // Update existing rating
                const updateQuery = `UPDATE user_interaction 
                                     SET rating = ?
                                     WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`;
                db.run(updateQuery, [rating, userId, cocktailId], (err) => {
                    if (err) console.error('Error updating rating:', err);
                    else console.log('Rating updated successfully');
                });
            } else { // Insert new rating entry
                const insertQuery = `INSERT INTO user_interaction (user_id, cocktail_id, action, rating) 
                                     VALUES (?, ?, 'rating', ?)`;
                db.run(insertQuery, [userId, cocktailId, rating], (err) => {
                    if (err) console.error('Error adding rating:', err);
                    else console.log('Rating added successfully');
                });
            }
        });
    } catch (err) {
        console.error('Error rating cocktail:', err.message);
    }
}

// Update user's interaction with cocktail
function updateUserInteraction(userId, cocktailId, action) {
    return getQuery(
        `SELECT * FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action IN ('recommend', 'not_recommend', 'pin')`,
        [userId, cocktailId]
    ).then(row => {
        if (row) { // If entry with same user_id & cocktail_id for given action types exists in DB
            if (row.action === action) { // Same action, do nothing
                console.log(`Action '${action}' already exists for user ${userId} and cocktail ${cocktailId}`);
                return;
            }
            return runQuery( // Different action, update existing entry
                `UPDATE user_interaction SET action = ? WHERE user_id = ? AND cocktail_id = ? AND action IN ('recommend', 'not_recommend', 'pin')`,
                [action, userId, cocktailId]
            ).then(() => {
                console.log(`Action updated successfully for user ${userId} and cocktail ${cocktailId}`);
                if (action === 'pin') { // If action is 'pin', delete user's rating
                    return runQuery(
                        `DELETE FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`,
                        [userId, cocktailId]
                    ).then(() => console.log('Rating entry deleted successfully'));
                }
            });
        } else { // No entry found, insert new interaction with action
            return runQuery(
                `INSERT INTO user_interaction (user_id, cocktail_id, action) VALUES (?, ?, ?)`,
                [userId, cocktailId, action]
            ).then(() => {
                console.log('User interaction inserted successfully');
                if (action === 'pin') { // If action is 'pin', delete user's rating
                    return runQuery(
                        `DELETE FROM user_interaction WHERE user_id = ? AND cocktail_id = ? AND action = 'rating'`,
                        [userId, cocktailId]
                    ).then(() => console.log('Rating entry deleted successfully'));
                }
            });
        }
    });
}

// Delete user interaction for specific cocktail
function deleteUserInteraction(userId, cocktailId) {
    return runQuery(
        `DELETE FROM user_interaction WHERE user_id = ? AND cocktail_id = ?`,
        [userId, cocktailId])
        .then(() => console.log(`User interactions for user ${userId} and cocktail ${cocktailId} deleted successfully`))
        .catch(err => console.error('Error deleting user interactions:', err));
}

// Get user's favorite cocktail ID
function getUserFavCocktailId(userId) {
    return getQuery(
        `SELECT cocktail_id FROM user_interaction WHERE user_id = ? AND action = 'fav'`,
        [userId]
    ).then(row => row ? row.cocktail_id : null);
}

// Update user's favorite cocktail
function updateUserFav(userId, newCocktailId) {
    return getQuery(
        `SELECT * FROM user_interaction WHERE user_id = ? AND action = 'fav'`,
        [userId]
    ).then(row => {
        if (row) { // If fav entry with same user_id exists in DB
            if (row.cocktail_id !== newCocktailId) { // Different cocktail_id, update it
                return runQuery(
                    `UPDATE user_interaction SET cocktail_id = ? WHERE user_id = ? AND action = 'fav'`,
                    [newCocktailId, userId]
                ).then(() => console.log(`Favourites updated successfully for user ${userId}`));
            } else {  // Same cocktail_id, do nothing
                console.log(`Favourites already set for user ${userId} and cocktail ${newCocktailId}`);
            }
        } else { // No entry found, insert new favourite entry
            return runQuery(
                `INSERT INTO user_interaction (user_id, cocktail_id, action) VALUES (?, ?, 'fav')`,
                [userId, newCocktailId]
            ).then(() => console.log('Favourites inserted successfully'));
        }
    });
}

// Delete user's favorite cocktail
function deleteUserFav(userId) {
    return runQuery(
        `DELETE FROM user_interaction WHERE user_id = ? AND action = 'fav'`,
        [userId]
    ).then(() => console.log(`Deleted favorite entry for user ${userId}`));
}

module.exports = {
    getCocktailById,
    getCocktailByName,
    getCocktailsByIngredients,
    getAllUniqueIngredients,
    getAllCocktailsFromDb,
    addCocktailToDb,
    updateIngredients,
    updateCocktailInDb,
    removeCocktailFromDb,
    insertNewUser,
    getUser,
    getUsernameById,
    getEmailById,
    getPasswordById,
    checkUserExists,
    checkEmailExists,
    updateUserPatch,
    setIsAdmin,
    removeUserByUsername,
    getUserRatingById,
    getUserInteractionById,
    getCounterByCocktailId,
    getCounterByUserId,
    getCocktailIdsByUserId,
    getAverageRatingByCocktailId,
    getAverageRatingByUserId,
    rateCocktail,
    updateUserInteraction,
    deleteUserInteraction,
    getUserFavCocktailId,
    updateUserFav,
    deleteUserFav
}