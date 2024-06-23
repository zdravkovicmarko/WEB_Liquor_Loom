const {processCocktailData} = require("./cocktail-utils");
const {addCocktailToDb} = require("./liquorloom-database-utils");
const xml2js = require('xml2js');

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

function sanitizeKeys(key) { // replaces all characters that are dots, underscores, hyphens or not alphanumeric characters with "_"
    let sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (/^[0-9]/.test(sanitizedKey)) {
        sanitizedKey = '_' + sanitizedKey;
    }
    return sanitizedKey;
}

function escapeXmlCharacters(value) {
    if (typeof value === 'string') {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    return value;
}

function sanitizeDataForXml(data) {
    if (Array.isArray(data)) { // if data is an array then recursively call function but for every item of array separately
        return data.map(item => sanitizeDataForXml(item));
    } else if (typeof data === 'object' && data !== null) { // if data is an object then sanitize each key and recursively sanitize each value
        const sanitizedObject = {};
        Object.keys(data).forEach(key => {
            const sanitizedKey = sanitizeKeys(key);
            sanitizedObject[sanitizedKey] = sanitizeDataForXml(data[key]);
        });
        return sanitizedObject;
    } else { // if data is a string
        return escapeXmlCharacters(data);
    }
}

function sendResponse(req, res, data, builderOptions = {}) {
    const acceptHeader = req.headers.accept;

    if (acceptHeader && acceptHeader.includes('application/xml')) {

        const sanitizedData = sanitizeDataForXml(data); // Sanitize data before XML conversion

        const rootName = builderOptions.rootName || 'response'; // if given a rootName then use it, otherwise use "response" as rootName

        const xmlBuilder = new xml2js.Builder({ ...builderOptions, rootName }); // Extract all properties in builderOptions with "...builderOptions", our rootName overwrites the rootName of builderOptions
        const xml = xmlBuilder.buildObject(sanitizedData);

        res.set('Content-Type', 'application/xml');
        res.status(200).send(xml);
    } else {
        res.status(200).json(data);
    }
}

module.exports = {
    transformCocktailData,
    fetchCocktailData,
    getAllCocktailsFromAPI,
    sendResponse
}