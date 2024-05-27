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

function insertIngredients(cocktailId, ingredients) {
    const promises = ingredients.map(({ ingredient, measure }) =>
        runQuery(`INSERT INTO ingredients (cocktail_id, ingredient, measure) VALUES (?, ?, ?)`, [cocktailId, ingredient, measure])
    );
    return Promise.all(promises);
}

async function addCocktailToDb(cocktail) {
    const { id, name, category, alcoholic, glass, instructions, thumbnail, ingredients } = cocktail;
    try {
        // Check if the cocktail already exists in the database
        const existingCocktail = await getCocktailByName(id);
        if (existingCocktail) {
            // If the cocktail already exists, throw an error or handle it accordingly
            throw new Error("Cocktail already in database");
        }

        // Insert cocktail
        const result = await runQuery(
            `INSERT INTO cocktails ( id, name, category, alcoholic, glass, instructions, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, category, alcoholic, glass, instructions, thumbnail]
        );

        // Insert ingredients
        await insertIngredients(id, ingredients);

        console.log("Cocktail added successfully");
    } catch (err) {
        console.error("Error adding cocktail:", err);
        throw err;
    }
}

async function removeCocktailFromDb(cocktailId) {
    try {
        // Check if the cocktail exists in the database
        const existingCocktail = await getCocktailById(cocktailId);
        if (!existingCocktail) {
            throw new Error("Cocktail not found in the database");
        }

        // Delete the cocktail from the cocktails table
        await runQuery(`DELETE FROM cocktails WHERE id = ?`, [cocktailId]);

        // Delete associated ingredients from the ingredients table
        await runQuery(`DELETE FROM ingredients WHERE cocktail_id = ?`, [cocktailId]);

        return { id: cocktailId };
    } catch (error) {
        // If any error occurs during deletion or checking for existence, throw the error
        throw error;
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
    getAllCocktailsFromDb,
    removeCocktailFromDb
};