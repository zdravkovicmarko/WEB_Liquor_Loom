const express = require('express')
const path = require('path')
const app = express()

// Serve static content in directory 'home'
app.use(express.static(path.join(__dirname, 'pages')));

app.get('/home', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages', 'home', 'home.html'));
})

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages', 'login', 'login.html'));
});

app.get('/profile/:userID', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages', 'profile', 'profile.html'));
});

app.get('/recipe/:recipeID', function (req, res) {
    res.sendFile(path.join(__dirname, 'pages', 'recipe', 'recipe.html'));
});

app.listen(666)
console.log("Server now listening on http://localhost:666/home")