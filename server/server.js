const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { isValidUser } = require('../client/pages/authentication/login.js');
const { processCocktailData } = require('./cocktail-utils');
const { addCocktailToDb, getAllCocktailsFromDb, removeCocktailFromDb, clearDatabase, getCocktailById } = require('./cocktail-database');
const app = express();

let fetch;

import('node-fetch').then(module => {
    fetch = module.default;

    // Now that fetch is available, proceed with the server setup

    // Serve static content
    app.use('/client', express.static(path.join(__dirname, '../client')));

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

    // Middleware to redirect from '/' to '/home'
    app.get('/', (req, res) => {
        res.redirect('/home');
    });

    app.get('/home', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/home/home.html'));
    });

    app.get('/login', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/authentication/login.html'));
    });

    app.get('/profile/:userID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
    });

    app.get('/profile/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
    });

    app.get('/signup/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/authentication/signup.html'));
    });

    app.get('/recipe/:cocktailID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/recipe/recipe.html'));
    })

    app.get('/recipe/', async (req, res) => {
        await addAllCocktailsFromAPIToDb();
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

    // temporary endpoint containing all recipes as JSON, which will be used for /home later
    app.get('/api/allrecipes', async (req, res) => {
        const allCocktails = await getAllCocktailsFromAPI();
        res.json(allCocktails);
    });

    app.get('/api/recipe/:cocktailID', async (req, res) => {
        try {
            const cocktailID = req.params.cocktailID;

            // Fetch and process cocktail data asynchronously
            const jsonData = await fetchCocktailData('lookup.php', 'i', cocktailID);
            const drinks = processCocktailData(jsonData);

            // Find the specific cocktail by ID
            const recipeData = drinks.find(cocktail => cocktail.id === cocktailID);

            if (recipeData) {
                // Add cocktail to database
                try {
                    await addCocktailToDb(recipeData);
                    //console.log("Successfully added cocktail:", recipeData);
                } catch (error) {
                    console.log("Error adding cocktail:", error);
                }

                try {
                    await getAllCocktailsFromDb();
                } catch (error) {
                    console.error("Error retrieving updated list of cocktails from the database:", error);
                }

                // Send the recipe data as JSON response
                res.json(recipeData);
            } else {
                res.status(404).send('Recipe not found');
            }
        } catch (error) {
            console.error('Error fetching and processing cocktail data:', error);
            res.status(500).send('Internal Server Error');
        }
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

    async function getAllCocktailsFromAPI(offset, limit, shouldSlice) {
        let allCocktails = [];
        const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
        for (const letter of alphabet) { // fetchCocktailsByLetter is called with every letter and their results concatinated
            const cocktails = await fetchCocktailsByLetter(letter);
            allCocktails = allCocktails.concat(cocktails);
        }
        return allCocktails;
    }

    function fetchRecipeData(drinks, recipeID) {
        if (!Array.isArray(drinks)) {
            throw new Error('Drinks should be an array');
        }
        return drinks.find(drink => drink.id === recipeID);
    }

    async function addAllCocktailsFromAPIToDb()  {
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

    app.listen(666, () => {
        console.log("Server now listening on http://localhost:666");
    });
}).catch(err => {
    console.error('Error importing node-fetch:', err);
});
