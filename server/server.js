const express = require('express');
const path = require('path');
const session = require('express-session');
const xml2js = require('xml2js');
const bodyParser = require('body-parser');
const { processCocktailData } = require('./cocktail-utils');
const { addCocktailToDb, updateCocktailStats, updateCocktailInDb, updateCocktailIngredients, getAllCocktailsFromDb, getCocktailsByIngredients, getCocktailIdsByUserId, removeCocktailFromDb, clearDatabase, getCocktailById, insertUser, updateUser2, checkUserExists, checkEmailExists, updateUser, deleteUserInteraction, removeUserByUsername, getUser, getUserRatingById, getUserInteractionById, updateUserInteraction, rateCocktail, getAllUniqueIngredients, getUserFavCocktailId, updateUserFav, deleteUserFav, getCounterByCocktailId, getCounterByUserId, getAverageRatingByCocktailId, getAverageRatingByUserId, getIngredientsByCocktailIDs, getCocktailsByIngredient } = require('./liquorloom-database-utils.js');
const app = express();
const { getUsernameById, getEmailById, getPasswordById } = require('./liquorloom-database-utils');

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
                    // Redirect to login page after logout
                    res.redirect('/home');
                }
            });
        } else {
            // If the user is not logged in, send a 401 status
            res.status(401).send('User is not logged in');
        }
    });

    app.get('/login-status', (req, res) => {
        if (req.session && req.session.userId) {
            res.json({ loggedIn: true });
        } else {
            res.json({ loggedIn: false });
        }
    });

    app.get('/current-user', (req, res) => {
        if (req.session && req.session.userId) {
            const userId = req.session.userId;
            res.json({ userId });
        } else {
            res.status(401).json({ error: 'User not logged in' });
        }
    });

    app.get('/signup/', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/authentication/signup.html'));
    });

    app.get('/profile', async function (req, res) {
        if (req.session && req.session.userId) {
            // If logged in, send profile page
            res.sendFile(path.join(__dirname, '../client/pages/profile/profile.html'));
        } else {
            // If not logged in, redirect to login page
            res.redirect('/login');
        }
    });

    app.get('/recipe/:cocktailID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/pages/recipe/recipe.html'));
    });

    app.get('/cocktails', async (req, res) => {
        try {
            let cocktails = await getAllCocktailsFromDb();

            if (cocktails.length === 0) {
                // If no cocktails in DB, fetch from API and add to DB
                const allCocktailsData = await getAllCocktailsFromAPI();

                for (const apiCocktail of allCocktailsData) {
                    const cocktail = transformCocktailData(apiCocktail);
                    await addCocktailToDb(cocktail);
                }

                cocktails = await getAllCocktailsFromDb(); // Fetch the cocktails again after adding
            }

            res.json(cocktails);
        } catch (error) {
            console.error('Error fetching cocktails:', error);
            res.status(500).send('Error occurred while fetching cocktails');
        }
    });

    app.get('/api/cocktail/:id', async (req, res) => {
        const cocktailId = req.params.id;

        try {
            const cocktail = await getCocktailById(cocktailId);
            if (!cocktail) {
                res.status(404).json({ error: 'Cocktail not found' });
            } else {
                res.json(cocktail);
            }
        } catch (error) {
            console.error('Error fetching cocktail:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/cocktail/:id/action/:action/count', async (req, res) => {
        const cocktailID = req.params.id;
        const action = req.params.action;

        try {
            const count = await getCounterByCocktailId(cocktailID, action);
            res.json({ cocktailID, action, count });
        } catch (error) {
            console.error('Error fetching the count:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/user/:userId/action/:action/count', async (req, res) => {
        const userId = req.params.userId;
        const action = req.params.action;

        try {
            const count = await getCounterByUserId(userId, action);
            res.json({ userId, action, count });
        } catch (error) {
            console.error('Error fetching the count:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/user/:userId/action/:action/ids', async (req, res) => {
        const userId = req.params.userId;
        const action = req.params.action;

        try {
            const cocktailIds = await getCocktailIdsByUserId(userId, action);
            res.json({ userId, action, cocktailIds });
        } catch (error) {
            console.error('Error fetching the cocktail IDs:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/user/:userId/average-rating', async (req, res) => {
        const userId = req.params.userId;

        try {
            const averageRating = await getAverageRatingByUserId(userId);
            res.json({ userId, averageRating });
        } catch (error) {
            console.error('Error fetching the average rating:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });


    app.get('/api/cocktail/:id/rating', async (req, res) => {
        const cocktailID = req.params.id;

        try {
            const averageRating = await getAverageRatingByCocktailId(cocktailID);
            res.json({ cocktailID, averageRating });
        } catch (error) {
            console.error('Error fetching the average rating:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/user/:userId/rating/:cocktailId', async (req, res) => {
        const userId = req.params.userId;
        const cocktailId = req.params.cocktailId;

        try {
            const rating = await getUserRatingById(userId, cocktailId);
            res.json({ userId, cocktailId, rating });
        } catch (error) {
            console.error('Error fetching the rating:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.get('/api/user/:userId/interaction/:cocktailId', async (req, res) => {
        const userId = req.params.userId;
        const cocktailId = req.params.cocktailId;

        try {
            const action = await getUserInteractionById(userId, cocktailId);
            res.json({ userId, cocktailId, action });
        } catch (error) {
            console.error('Error fetching the interaction:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Endpoint to get user's favorite cocktail ID
    app.get('/api/user/:userId/fav', async (req, res) => {
        const userId = req.params.userId;

        try {
            const favCocktailId = await getUserFavCocktailId(userId);
            res.status(200).json({ userId, favoriteCocktailId: favCocktailId });
        } catch (error) {
            console.error('Error fetching user favorite cocktail ID:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Update user favorite endpoint
    app.post('/api/user/:userId/fav/:id', async (req, res) => {
        const userId = req.params.userId;
        const cocktailId = req.params.id;

        try {
            await updateUserFav(userId, cocktailId);
            res.status(200).json({ message: 'Favorite updated successfully' });
        } catch (error) {
            console.error('Error updating user favorite:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Delete user favorite endpoint
    app.delete('/api/user/:userId/fav/delete', async (req, res) => {
        const userId = req.params.userId;

        try {
            await deleteUserFav(userId);
            res.status(200).json({ message: 'Favorite deleted successfully' });
        } catch (error) {
            console.error('Error deleting user favorite:', error);
            res.status(500).json({ error: 'Internal Server Error' });
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
                res.json({ success: true });
            } else {
                res.status(401).json({ error: 'Invalid username or password' });
            }
        } catch (error) {
            console.error('Error logging in user:', error);
            res.status(500).json({ error: 'Error logging in user' });
        }
    });

    app.post('/signup', (req, res) => {
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

    app.post('/updateInteraction', async (req, res) => {
        const { userId, cocktailId, action, rating } = req.body;

        try {
            if (rating !== null) {
                await rateCocktail(userId, cocktailId, rating);
            }
            await updateUserInteraction(userId, cocktailId, action);
            res.status(200).send({ message: 'User interaction updated successfully' });
        } catch (err) {
            console.error('Error updating user interaction:', err);
            res.status(500).send({ error: 'Error updating user interaction' });
        }
    });

    // Delete user interaction endpoint
    app.delete('/api/user/:userId/interaction/:cocktailId', async (req, res) => {
        const userId = req.params.userId;
        const cocktailId = req.params.cocktailId;

        try {
            await deleteUserInteraction(userId, cocktailId);
            res.status(200).json({ message: 'User interaction deleted successfully' });
        } catch (error) {
            console.error('Error deleting user interaction:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/ingredients', async (req, res) => {
        try {
            const { cocktailIDs } = req.body;
            if (!cocktailIDs || cocktailIDs.length === 0) {
                return res.status(400).send('No cocktail IDs provided');
            }

            const ingredients = await getIngredientsByCocktailIDs(cocktailIDs);
            res.json(ingredients);
        } catch (error) {
            console.error('Error fetching ingredients:', error);
            res.status(500).send('Error occurred while fetching ingredients');
        }
    });

    app.post('/cocktails-by-ingredient', async (req, res) => {
        try {
            const { ingredient } = req.body;
            if (!ingredient) {
                return res.status(400).send('No ingredient provided');
            }

            const cocktails = await getCocktailsByIngredient(ingredient);
            res.json(cocktails);
        } catch (error) {
            console.error('Error fetching cocktails:', error);
            res.status(500).send('Error occurred while fetching cocktails');
        }
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

    app.delete('/users/:username', (req, res) => {
        const username = req.params.username;

        // Destroy the session first
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).send('Failed to delete user and logout');
            } else {
                // Respond to the client indicating the session was destroyed
                res.status(200).send('Session destroyed, proceeding with user deletion.');

                // Delete user from the database using the username
                removeUserByUsername(username)
                    .then(() => {
                    })
                    .catch((error) => {
                        console.error('Error deleting user:', error);
                    });
            }
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

    app.get('/api/getAllIngredients', async (req, res) => {
        getAllUniqueIngredients((err, ingredients) => {
            if (err) {
                console.error('Fehler beim Abrufen der eindeutigen Zutaten:', err);
            } else {
                //console.log('Eindeutige Zutaten:', ingredients);
                res.send(ingredients);
            }
        });
    })

    app.get('/api/user/:id/username', async (req, res) => {
        try {
            const username = await getUsernameById(req.params.id);
            res.json({ username });
        } catch (error) {
            console.error('Error fetching username:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/api/user/:id/email', async (req, res) => {
        try {
            const email = await getEmailById(req.params.id);
            res.json({ email });
        } catch (error) {
            console.error('Error fetching email:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/api/user/:id/password', async (req, res) => {
        try {
            const password = await getPasswordById(req.params.id);
            res.json({ password });
        } catch (error) {
            console.error('Error fetching password:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.get('/api/cocktail', async (req, res) => {
        try {
            const ingredients = req.query.ingredients ? req.query.ingredients.split(',') : [];
            if (ingredients.length === 0) {
                return res.status(400).json({ error: 'No ingredients provided' });
            }
            const response = await getCocktailsByIngredients(ingredients);
            if (response.length > 0) {
                res.json(response);
            } else {
                console.log('No cocktails found for ingredients:', ingredients);
                res.status(404).json({ error: 'Cocktail not found' });
            }
        } catch (error) {
            console.error('Error getting filtered cocktails:', error);
            res.status(500).send('Internal Server Error');
        }
    });

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

    app.listen(666, () => {
        console.log("Server now listening on http://localhost:666");
    });
}).catch(err => {
    console.error('Error importing node-fetch:', err);
});