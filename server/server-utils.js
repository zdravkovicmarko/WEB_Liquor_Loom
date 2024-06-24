const Cocktail = require('./cocktail-model');
const xml2js = require('xml2js');

// Fetch API data
function fetchCocktailData(endpoint, searchType, searchTerm) {
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/${endpoint}?${searchType}=${searchTerm}`;
    // Possible endpoints: search.php, filter.php, lookup.php, random.php, list.php
    // Possible search types: s, f, i, iid, a, c, g,
    // (More info on https://www.thecocktaildb.com/api.php)

    return fetch(apiUrl)

        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            console.log(apiUrl);
            return response.json();
        })

        .catch(error => {
            console.error('Fetch error:', error);
            throw error; // Re-throw error to propagate it down promise chain
        });
}

async function getAllCocktailsFromAPI() {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    const fetchPromises = alphabet.map(letter => fetchCocktailData('search.php', 'f', letter));
    const allResults = await Promise.all(fetchPromises);
    return allResults.flatMap(data => data.drinks || []);
}

// Process API data into array of Cocktail objects
function processCocktailData(data) {
    // Validate data structure
    if (!data?.drinks || !Array.isArray(data.drinks)) throw new Error('Unexpected data format from API');

    return data.drinks.map(drink => {
        if (!drink) return null;

        // Extract ingredients & measures
        const ingredients = [];
        const measures = [];
        for (let i = 1; i <= 15; i++) {
            if (drink[`strIngredient${i}`]) ingredients.push(drink[`strIngredient${i}`]);
            if (drink[`strMeasure${i}`]) measures.push(drink[`strMeasure${i}`]);
        }

        return new Cocktail(
            drink.idDrink,
            drink.strDrink,
            drink.strCategory,
            drink.strAlcoholic,
            drink.strGlass,
            drink.strInstructions,
            drink.strDrinkThumb,
            ingredients.filter(ingredient => ingredient), // Filter out null/undefined
            measures.filter(measure => measure) // Filter out null/undefined
        );
    }).filter(Boolean); // Filter out null entries
}

// Sanitize keys for XML (Non-alphanumeric characters replaced by "_")
function sanitizeKeys(key) {
    let sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return /^[0-9]/.test(sanitizedKey) ? `_${sanitizedKey}` : sanitizedKey;
}

// Escape XML special characters
function escapeXmlCharacters(value) {
    return typeof value === 'string' ? value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        : value;
}

// Recursively sanitize data for XML
function sanitizeDataForXml(data) {
    if (Array.isArray(data)) { // If data is array, recursively call function for every array item separately
        return data.map(item => sanitizeDataForXml(item));

    } else if (typeof data === 'object' && data !== null) { // If data is object, recursively sanitize each key & value
        const sanitizedObject = {};
        Object.keys(data).forEach(key => {
            const sanitizedKey = sanitizeKeys(key);
            sanitizedObject[sanitizedKey] = sanitizeDataForXml(data[key]);
        });
        return sanitizedObject;

    } else { // If data is string, escape XML special characters
        return escapeXmlCharacters(data);
    }
}

// Send response in XML or JSON based on the request headers
function sendResponse(req, res, data, builderOptions = {}) {
    const acceptHeader = req.headers.accept;

    if (acceptHeader && acceptHeader.includes('application/xml')) {
        const sanitizedData = sanitizeDataForXml(data); // Sanitize data before XML conversion
        const rootName = builderOptions.rootName || 'response'; // Use rootName if given, otherwise "response"

        // Extract all builderOptions properties with "...builderOptions", our rootName overwrites builderOptions' rootName
        const xmlBuilder = new xml2js.Builder({ ...builderOptions, rootName });
        const xml = xmlBuilder.buildObject(sanitizedData);

        res.set('Content-Type', 'application/xml');
        res.status(200).send(xml);
    } else {
        res.status(200).json(data);
    }
}

module.exports = {
    processCocktailData,
    fetchCocktailData,
    getAllCocktailsFromAPI,
    sendResponse
}