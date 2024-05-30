const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('recipeDatabase.db'); // create or open databasefile

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
        rating REAL DEFAULT 0,
        amount_ratings INTEGER DEFAULT 0
    )`);
});

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

module.exports = {
    db,
    addCocktailToDb,
    getCocktailById,
    getCocktailByName,
    getAllCocktailsFromDb,
    removeCocktailFromDb,
    clearCocktailDatabase
};