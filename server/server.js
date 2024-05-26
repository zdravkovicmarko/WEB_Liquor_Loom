const express = require('express');
const path = require('path');
let fetch;

import('node-fetch').then(module => {
    fetch = module.default;

    // Now that fetch is available, proceed with the server setup
    const app = express();
    const { processCocktailData } = require('./cocktail-model');

    // Serve static content
    app.use('/client', express.static(path.join(__dirname, '../client')));

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
        res.send("Enter a valid profile ID");
    });

    app.get('/recipe/:recipeID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/recipe/recipe.html'));
    });

    app.get('/recipe/', function (req, res) {
        res.send("Enter a valid recipe ID");
    });

    function fetchCocktailData(searchType, searchTerm) {
        const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?${searchType}=${searchTerm}`;

        return fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                console.log(apiUrl);
                return response.json();
            })
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }

    // Example usage:
    fetchCocktailData('s', 'Margarita')
        .then(jsonData => {
            // Process the data here
            const drinks = processCocktailData(jsonData);
            console.log("These are my drinks: ");
            drinks.forEach(drink => {
                console.log(drink.name);
            });
        });

    app.listen(666, () => {
        console.log("Server now listening on http://localhost:666/home");
    });
}).catch(err => {
    console.error('Error importing node-fetch:', err);
});