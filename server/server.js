const express = require('express')
const path = require('path')
const app = express()

// Serve static content
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/images', express.static(path.join(__dirname, '../client/images')));
app.use('/search', express.static(path.join(__dirname, '../client/search')));
app.use('/base.css', express.static(path.join(__dirname, '../client/base.css')));

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


const apiUrl = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita';
fetch(apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(responseData => {
        // Process the data
        // console.log(responseData);
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });

function fetchCocktailData(searchType, searchTerm) {
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?${searchType}=${searchTerm}`;

    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
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
fetchCocktailData('s','Martini')
    .then(data => {
        console.log(data);
        // Process the data here
    });

app.listen(666)
console.log("Server now listening on http://localhost:666/home")