const express = require('express')
const path = require('path')
const app = express()

// Serve static content
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/images', express.static(path.join(__dirname, '../client/images')));
app.use('/search', express.static(path.join(__dirname, '../client/search')));
app.use('/base.css', express.static(path.join(__dirname, '../client/base.css')));
const { processCocktailData } = require('./cocktail-model');

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
            console.log(apiUrl)
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
fetchCocktailData('s','Strawberry%20Margarita')
    .then(jsonData => {
        // console.log(jsonData);
        // Process the data here
        console.log(Array.from(extractValues(jsonData)));
        const drinks = processCocktailData(Array.from(extractValues(jsonData)));
        console.log("These are my drinks: ")
        console.log(drinks)
    });
function extractValues(obj) {
    const values = [];

    function recurse(o) {
        for (const key in o) {
            if (o.hasOwnProperty(key)) {
                if (typeof o[key] === 'object' && o[key] !== null) {
                    recurse(o[key]);
                } else {
                    values.push(o[key]);
                }
            }
        }
    }

    recurse(obj);
    return values;
}
app.listen(666)
console.log("Server now listening on http://localhost:666/home")