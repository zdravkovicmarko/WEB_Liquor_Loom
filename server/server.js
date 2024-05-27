const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { isValidUser } = require('../client/pages/login/login.js');
const { processCocktailData } = require('./cocktail-utils');
const { addCocktailToDb } = require('./recipeDatabase');
const { getAllCocktailsFromDb } = require('./recipeDatabase');
const { removeCocktailFromDb } = require('./recipeDatabase');
const app = express();

let fetch;

import('node-fetch').then(module => {
    fetch = module.default;

    // Now that fetch is available, proceed with the server setup

    // Serve static content
    app.use('/client', express.static(path.join(__dirname, '../client')));
    app.use('/images', express.static(path.join(__dirname, '../client/images')));
    app.use('/search', express.static(path.join(__dirname, '../client/search')));
    app.use('/base.css', express.static(path.join(__dirname, '../client/base.css')));
    app.use('/home.css', express.static(path.join(__dirname, '../client/pages/home/home.css')));
    app.use('/home.js', express.static(path.join(__dirname, '../client/pages/home/home.js')));

    // Middleware to parse URL-encoded data and JSON data
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Session setup
    app.use(session({
        secret: 'secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 60000 } // session timeout of 60 seconds
    }));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/pages/login/login.html'));
    });

    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        if (isValidUser(username, password)) {
            req.session.isLoggedIn = true;
            req.session.username = username;
            res.redirect('/home');
        } else {
            res.redirect('/login');
        }
    });

    app.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/home');
            }
        });
    });

    app.get('/home', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/home/home.html'));
    });

    app.get('/login', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/login/login.html'));
    });

    app.get('/profile/:userID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
    });

    app.get('/profile/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
    });

    app.get('/signup/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/signup/signup.html'));
    });

    // temporary endpoint containing all recipes as JSON, which will be used for /home later
    app.get('/allrecipes/', async (req, res) => {
        const allCocktails = await getAllCocktailsFromAPI();
        res.json(allCocktails);
    });

    app.get('/recipe/:cocktailID', async (req, res) => {
        try {
            const cocktailID = req.params.cocktailID;

            // Fetch and process cocktail data asynchronously
            const jsonData = await fetchCocktailData('lookup.php', 'i', cocktailID);
            const drinks = processCocktailData(jsonData);
    app.get('/recipe/:recipeID', function (req, res) {
        // Fetch and process cocktail data asynchronously
        fetchCocktailData('search.php', 's', 'Margarita')
            .then(jsonData => {
                const drinks = processCocktailData(jsonData);
                // Now fetch the specific recipe data
                const recipeID = req.params.recipeID; // Get recipeID from request params
                const recipeData = fetchRecipeData(drinks, recipeID);
                console.log("My recipe data: ", recipeData);

                addCocktailToDb(recipeData)
                    .then(addedCocktails => {
                        console.log("Successfully added cocktails:", addedCocktails);

                        getAllCocktailsFromDb()
                            .then(cocktails => {
                                // Handle the resolved value (cocktails) here
                                console.log("Retrieved cocktails from the database:", cocktails);
                            })
                            .catch(error => {
                                // Handle any errors that occurred during the execution of getAllCocktailsFromDb()
                                console.error("Error retrieving cocktails from the database:", error);
                            });

                        // Do something with the added cocktails
                    })
                    .catch(error => { // If adding cocktail to db fails (b.c. of duplicate entries), then show all entries in db
                        console.error("Error adding cocktails:", error);

                        getAllCocktailsFromDb()
                            .then(cocktails => {
                                // Handle the resolved value (cocktails) here
                                console.log("Retrieved cocktails from the database:", cocktails);
                            })
                            .catch(error => {
                                // Handle any errors that occurred during the execution of getAllCocktailsFromDb()
                                console.error("Error retrieving cocktails from the database:", error);
                            });
                        // Handle the error
                    });

                // Render recipe HTML page and pass recipeData to the template
                if (recipeData) {
                    // Send the recipe data as JSON response
                    res.json(recipeData);
                } else {
                    res.status(404).send('Recipe not found');
                }
            })
            .catch(error => {
                console.error('Error fetching and processing cocktail data:', error);
                res.status(500).send('Internal Server Error');
            });
    });

    app.get('/recipe/', function (req, res) {
        res.send("Enter a valid recipe ID");
    });

    app.post('/add-cocktail', (req, res) => {
        //If cocktail data is in the request body
        const cocktailData = req.body;

        addCocktailToDb(cocktailData)
            .then(cocktail => {
                res.status(201).json({ message: 'Cocktail added successfully', cocktail });
            })
            .catch(error => {
                res.status(500).json({ error: 'Failed to add cocktail', message: error.message });
            });
    });

    function fetchCocktailData(endpoint, searchType, searchTerm) {
        const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/${endpoint}?${searchType}=${searchTerm}`;
        // possible endpoints: search.php, filter.php, lookup.php, random.php, list.php
        // possible searchtypes: s, f, i, iid, a, c, g,
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

    function fetchCocktailsByLetter(letter) {
        return fetchCocktailData('search.php', 'f', letter)
            .then(data => data.drinks || []);
    }

    // Example usage:
    fetchCocktailData('search.php', 's', 'Strawberry%20Margarita')
        .then(jsonData => {
            // Process the data here
            const drinks = processCocktailData(jsonData);

            console.log("These are my drinks: ");
            Object.values(drinks).forEach(drink => {
                console.log(drink.name);
            });
        })
        .catch(error => {
            console.error('Error fetching and processing cocktail data:', error);
        });
    // End of example usage

    function fetchRecipeData(drinks, recipeID) {
        if (!Array.isArray(drinks)) {
            throw new Error('Drinks should be an array');
        }
        //for (const drink of drinks) {
            //console.log(drink.id);
            //console.log(typeof drink.id);
        //
        //}
        //console.log(recipeID);
        //console.log(typeof recipeID);
        return drinks.find(drink => drink.id === recipeID);
    }

async function getAllCocktailsFromAPI(){
    let allCocktails = [];
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (const letter of alphabet) { // fetchCocktailsByLetter is called with every letter and their results concatinated
        const cocktails = await fetchCocktailsByLetter(letter);
        allCocktails = allCocktails.concat(cocktails);

        if (allCocktails.length >= 20) {
            allCocktails = allCocktails.slice(0, 20); // Limit to 20 cocktails
            break;
        }
    }
    return allCocktails;
}

app.listen(666, () => {
    console.log("Server now listening on http://localhost:666/home");
});
}).catch(err => {
    console.error('Error importing node-fetch:', err);
});
