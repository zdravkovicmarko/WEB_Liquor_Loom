const {processCocktailData} = require("./cocktail-utils");
const {addCocktailToDb} = require("./liquorloom-database-utils");
const jwt = require('jsonwebtoken');

const secretKey = 'DaS_ISt_meIN_sEcReT_KEY';

function transformCocktailData(apiCocktail) {
    return {
        id: apiCocktail.idDrink,
        name: apiCocktail.strDrink,
        category: apiCocktail.strCategory,
        alcoholic: apiCocktail.strAlcoholic,
        glass: apiCocktail.strGlass,
        instructions: apiCocktail.strInstructions,
        thumbnail: apiCocktail.strDrinkThumb,
        ingredients: [
            apiCocktail.strIngredient1,
            apiCocktail.strIngredient2,
            apiCocktail.strIngredient3,
            apiCocktail.strIngredient4,
            apiCocktail.strIngredient5,
            apiCocktail.strIngredient6,
            apiCocktail.strIngredient7,
            apiCocktail.strIngredient8,
            apiCocktail.strIngredient9,
            apiCocktail.strIngredient10,
            apiCocktail.strIngredient11,
            apiCocktail.strIngredient12,
            apiCocktail.strIngredient13,
            apiCocktail.strIngredient14,
            apiCocktail.strIngredient15,
        ].filter(ingredient => ingredient), // Filter out null/undefined ingredients
        measures: [
            apiCocktail.strMeasure1,
            apiCocktail.strMeasure2,
            apiCocktail.strMeasure3,
            apiCocktail.strMeasure4,
            apiCocktail.strMeasure5,
            apiCocktail.strMeasure6,
            apiCocktail.strMeasure7,
            apiCocktail.strMeasure8,
            apiCocktail.strMeasure9,
            apiCocktail.strMeasure10,
            apiCocktail.strMeasure11,
            apiCocktail.strMeasure12,
            apiCocktail.strMeasure13,
            apiCocktail.strMeasure14,
            apiCocktail.strMeasure15,
        ].filter(measure => measure), // Filter out null/undefined measures
    };
}

function fetchCocktailData(endpoint, searchType, searchTerm) {
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/${endpoint}?${searchType}=${searchTerm}`;
    // possible endpoints: search.php, filter.php, lookup.php, random.php, list.php
    // possible search types: s, f, i, iid, a, c, g,
    // visit https://www.thecocktaildb.com/api.php to see all endpoints, query, etc.

    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log(apiUrl);
            return response.json();
        })

        .catch(error => {
            console.error('Fetch error:', error);
            throw error; // Re-throw the error to propagate it down the promise chain
        });
}

async function addAllCocktailsFromAPIToDb() {
    const response = await fetch(`http://localhost:666/api/allrecipes`);
    const jsonData = await response.json();
    const wrappedResponse = { drinks: jsonData };

    let allCocktails = processCocktailData(wrappedResponse);
    allCocktails.forEach(cocktail => {
        addCocktailToDb(cocktail)
            .then(() => console.log(`Successfully added cocktail: ${cocktail.name}`))
            .catch(err => console.error(`Error adding cocktail: ${cocktail.name}`, err));
    });
}

function fetchCocktailsByLetter(letter) {
    return fetchCocktailData('search.php', 'f', letter)
        .then(data => data.drinks || []);
}

async function getAllCocktailsFromAPI() {
    let allCocktails = [];
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    for (const letter of alphabet) { // fetchCocktailsByLetter is called with every letter and their results concatenated
        const cocktails = await fetchCocktailsByLetter(letter);
        allCocktails = allCocktails.concat(cocktails);
    }
    return allCocktails;
}

function generateToken(user) {
    return jwt.sign({ id: user.id, isAdmin: user.is_admin }, secretKey, { expiresIn: '1h' });
}

// Middleware-Funktion zum Überprüfen des JWT-Tokens
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    console.log('This is my token in verify Token: ', token);

    if (!token) {
        return res.status(401).json({ error: 'Access Denied' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid Token' });
        }
        req.user = decoded;
        next();
    });
}

module.exports = {
    transformCocktailData,
    fetchCocktailData,
    addAllCocktailsFromAPIToDb,
    fetchCocktailsByLetter,
    getAllCocktailsFromAPI,
    generateToken,
    verifyToken
}