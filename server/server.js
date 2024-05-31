const express = require('express');
const path = require('path');
const session = require('express-session');
const xml2js = require('xml2js');
const bodyParser = require('body-parser');
const { processCocktailData } = require('./cocktail-utils');
const { addCocktailToDb, updateCocktailStats, updateCocktailInDb, updateCocktailIngredients, getAllCocktailsFromDb, removeCocktailFromDb, clearDatabase, getCocktailById } = require('./cocktail-database');
const { insertUser, updateUser2, checkUserExists, checkEmailExists, updateUser, removeUserByUsername, getUser } = require('../client/pages/authentication/user-database.js');
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

    app.use(session({
        secret: 'your_secret_key', // Replace with your own secret key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Use secure: true in production with HTTPS
    }));

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

    app.get('/logout', (req, res) => {
        // Check if the user is logged in
        if (req.session && req.session.userId) {
            // Destroy the session
            req.session.destroy(err => {
                if (err) {
                    console.error('Error destroying session:', err);
                    res.status(500).send('Error logging out');
                } else {
                    // Redirect to the login page after logout
                    res.redirect('/login');
                }
            });
        } else {
            // If the user is not logged in, send a 401 status
            res.status(401).send('User is not logged in');
        }
    });

    app.get('/signup/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/authentication/signup.html'));
    });

    app.get('/profile/:userID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
    });

    app.get('/profile/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
    });

    app.get('/recipe/:cocktailID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/recipe/recipe.html'));
    });

    app.get('/recipe/', async (req, res) => {
        try {
            await addAllCocktailsFromAPIToDb();
            console.log('Successful');
            res.send('Enter a valid recipe ID');
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error occurred while adding cocktails to the database');
        }
    });

    app.post('/add-cocktail', (req, res) => {
        // If cocktail data is in the request body
        const cocktailData = req.body;

        addCocktailToDb(cocktailData)
            .then(cocktail => {
                res.status(201).json({ message: 'Cocktail added successfully', cocktail });
            })
            .catch(error => {
                res.status(500).json({ error: 'Failed to add cocktail' });
            });
    });

    app.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Check if user is already logged in
            if (req.session && req.session.userId) {
                res.status(200).send('User already logged in');
                return;
            }

            // Check if the user exists
            const userExists = await checkUserExists(username);
            const emailExists = await checkEmailExists(username); // Check if the username is an email

            if (!userExists && !emailExists) {
                res.status(404).json({ error: 'Account does not exist' });
                return;
            }

            // Authenticate the user
            const user = await getUser(username, password);

            if (user) {
                // Create a session for the logged-in user
                req.session.userId = user.id;
                res.redirect('/profile');
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        } catch (error) {
            console.error('Error logging in user:', error);
            res.status(500).json({ error: 'Error logging in user' });
        }
    });

    app.post('/signup', (req, res) => {
        console.log('Signup Request Body:', req.body);
        const { username, email, password, verification } = req.body;

        if (password !== verification) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        Promise.all([checkUserExists(username), checkEmailExists(email)])
            .then(([usernameExists, emailExists]) => {
                if (usernameExists) {
                    return res.status(400).json({ error: 'Username already in use' });
                }
                if (emailExists) {
                    return res.status(400).json({ error: 'Email already in use' });
                }

                return insertUser(username, email, password);
            })
            .then(userId => {
                res.status(201).json({ message: 'User created', userId });
            })
            .catch(error => {
                // Ensure this catch block only sends a response if an error occurred
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error creating user' });
                }
            });
    });


    // Update Cocktail data
    app.put('/recipe/:cocktailId', (req, res) => {
        const cocktailId = req.params.cocktailId;
        const { name, category, alcoholic, glass, instructions, thumbnail } = req.body;

        updateCocktailInDb(cocktailId, name, category, alcoholic, glass, instructions, thumbnail)
            .then(() => {
                res.status(200).send(`Cocktail with ID ${cocktailId} updated successfully`);
            })
            .catch((error) => {
                console.error('Error updating cocktail:', error);
                res.status(500).send(`Failed to update cocktail with ID ${cocktailId}`);
            });
    });

    // Update Cocktail ingredients and its measures,
    app.put('/recipe/:cocktailId/ingredients', (req, res) => {
        const cocktailId = req.params.cocktailId;
        const { ingredients } = req.body;

        updateCocktailIngredients(cocktailId, ingredients)
            .then(() => {
                res.status(200).send(`Ingredients for cocktail with ID ${cocktailId} updated successfully`);
            })
            .catch((error) => {
                console.error('Error updating cocktail ingredients:', error);
                res.status(500).send('Failed to update cocktail ingredients');
            });
    });

    // Update the stats of a cocktail
    app.put('/cocktails/:cocktailId/stats', (req, res) => {
        const cocktailId = req.params.cocktailId;
        const { recommendations, do_not_recommendations, pinned, rating, amount_ratings } = req.body;

        updateCocktailStats(cocktailId, recommendations, do_not_recommendations, pinned, rating, amount_ratings)
            .then(() => {
                res.status(200).send(`Stats for cocktail with ID ${cocktailId} updated successfully`);
            })
            .catch((error) => {
                console.error('Error updating cocktail stats:', error);
                res.status(500).send('Failed to update cocktail stats');
            });
    });

    app.patch('/users/:userId', (req, res) => {
        const userId = req.params.userId;
        const userData = req.body; // Contains fields to update

        // Update user data in the database using the userId and provided data
        updateUser2(userId, userData)
            .then(() => {
                res.status(200).send(`User with ID ${userId} updated successfully`);
            })
            .catch((error) => {
                console.error('Error updating user:', error);
                res.status(500).send('Failed to update user');
            });
    });

    app.delete('/users/:userId', (req, res) => {
        const userId = req.params.userId;

        // Delete user from the database using the userId
        removeUserByUsername(userId)
            .then(() => {
                res.status(200).send(`User with ID ${userId} deleted successfully`);
            })
            .catch((error) => {
                console.error('Error deleting user:', error);
                res.status(500).send('Failed to delete user');
            });
    });

    // returns all recipe data as JSON or XML
    app.get('/api/allrecipes', async (req, res) => {
        try {
            const allCocktails = await getAllCocktailsFromAPI();

            const acceptHeader = req.headers.accept;
            if (acceptHeader && acceptHeader.includes('application/xml')) {
                const builder = new xml2js.Builder();
                const xml = builder.buildObject({ cocktails: allCocktails });

                res.set('Content-Type', 'application/xml');
                res.send(xml);

            } else {
                res.json(allCocktails);
            }
        } catch (error) {
            console.log('Error fetch all cocktails', error);
            res.status(500).send('Failed to fetch all cocktails');
        }
    });

    // returns the data of a specific recipe as JSON or XML
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

                const acceptHeader = req.headers.accept;

                if (acceptHeader && acceptHeader.includes('application/xml')) {
                    // Convert the recipeData object to XML
                    const builder = new xml2js.Builder();
                    const xml = builder.buildObject({ cocktail: recipeData });

                    res.set('Content-Type', 'application/xml');
                    res.send(xml);
                } else {
                    res.json(recipeData);
                }

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

    function fetchCocktailsByLetter(letter) {
        return fetchCocktailData('search.php', 'f', letter)
            .then(data => data.drinks || []);
    }

    async function getAllCocktailsFromAPI(offset, limit, shouldSlice) {
        let allCocktails = [];
        const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
        for (const letter of alphabet) { // fetchCocktailsByLetter is called with every letter and their results concatenated
            const cocktails = await fetchCocktailsByLetter(letter);
            allCocktails = allCocktails.concat(cocktails);
        }
        return allCocktails;
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

    // Middleware to check if user is logged in
    function checkLoggedIn(req, res, next) {
        // Check if userId is present in the session
        if (req.session && req.session.userId) {
            // User is logged in, proceed to the next middleware
            next();
        } else {
            // User is not logged in, send 401 Unauthorized status
            res.status(401).send('User not logged in');
        }
    }

    app.listen(666, () => {
        console.log("Server now listening on http://localhost:666");
    });
}).catch(err => {
    console.error('Error importing node-fetch:', err);
});