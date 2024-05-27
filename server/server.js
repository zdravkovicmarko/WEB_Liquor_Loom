const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const { isValidUser } = require('../client/pages/login/login.js');
let fetch;
const { processCocktailData } = require('./cocktail-utils');
const app = express();

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
    app.get('/allrecipes', async (req, res) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let allCocktails = [];

        for (const letter of alphabet) {
            const cocktails = await fetchCocktailsByLetter(letter);
            allCocktails = allCocktails.concat(cocktails);

            // Check if we have reached the limit of 20 cocktails
            if (allCocktails.length >= 20) {
                allCocktails = allCocktails.slice(0, 20); // Limit to 20 cocktails
                break;
            }
        }
        res.json(allCocktails);
    });

    app.get('/recipe/:cocktailID', async (req, res) => {
        try {
            const cocktailID = req.params.cocktailID;

            // Fetch and process cocktail data asynchronously
            const jsonData = await fetchCocktailData('lookup.php', 'i', cocktailID);
            const drinks = processCocktailData(jsonData);

            // Find the specific cocktail by ID
            const recipeData = drinks.find(cocktail => cocktail.id === cocktailID);

            if (recipeData) {
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

    app.get('/recipe/', function (req, res) {
        res.send("Enter a valid recipe ID");
    });

    function fetchCocktailData(endpoint, searchType, searchTerm) {
        const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/${endpoint}?${searchType}=${searchTerm}`;

        return fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
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
        for (const drink of drinks) {
            console.log(drink.id);
            console.log(typeof drink.id);
        }
        console.log(recipeID);
        console.log(typeof recipeID);
        return drinks.find(drink => drink.id === recipeID);
    }

    app.listen(666, () => {
        console.log("Server now listening on http://localhost:666/home");
    });
}).catch(err => {
    console.error('Error importing node-fetch:', err);
});
