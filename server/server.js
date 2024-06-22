const express = require('express');
const path = require('path');
const session = require('express-session');
const xml2js = require('xml2js');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
const { processCocktailData } = require('./cocktail-utils');
const { addCocktailToDb, updateCocktailStats, updateCocktailInDb, updateCocktailIngredients, getAllCocktailsFromDb, getCocktailsByIngredients, getCocktailIdsByUserId, removeCocktailFromDb, clearDatabase, getCocktailById, getCocktailByName, insertUser, setIsAdmin, isUserAdmin, updateUserPut, updateUserPatch, checkUserExists, checkEmailExists, deleteUserInteraction, removeUserByUsername, getUser, getUserRatingById, getUserInteractionById, updateUserInteraction, rateCocktail, getAllUniqueIngredients, getUserFavCocktailId, updateUserFav, deleteUserFav, getCounterByCocktailId, getCounterByUserId, getAverageRatingByCocktailId, getAverageRatingByUserId, getIngredientsByCocktailIDs, getCocktailsByIngredient } = require('./liquorloom-database-utils.js');
const { getUsernameById, getEmailById, getPasswordById } = require('./liquorloom-database-utils');
const { transformCocktailData, fetchCocktailData, addAllCocktailsFromAPIToDb, fetchCocktailsByLetter, getAllCocktailsFromAPI, generateToken, verifyToken} = require('./server-utils.js')
const app = express();
const app_admin = express();
let fetch;

import('node-fetch').then(module => {
    fetch = module.default;

    // Serve static content
    app.use('/client', express.static(path.join(__dirname, '../client')));

    // Middleware to parse URL-encoded data and JSON data
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.use(session({
        secret: secret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Use secure: true in production with HTTPS
    }));

    // Middleware to redirect from '/' to '/home'
    app.get('/', (req, res) => {
        res.redirect('/home');
    });

    app.get('/home', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/client_pages/home/home.html'));
    });

    app.get('/login', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/client_pages/authentication/login.html'));
    });

    app.get('/api/quote', async (req, res) => {
        try {
            let response = await fetch('https://api.quotable.io/random?tags=inspirational');

            if (!response.ok) {
                console.error('Network response was not ok.');
            }
            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('Failed to fetch quote:', error);
            res.status(500).json({ error: 'Failed to fetch quote' });
        }
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
        res.sendFile(path.join(__dirname, '../client/client_pages/authentication/signup.html'));
    });

    app.get('/profile', async function (req, res) {
        if (req.session && req.session.userId) {
            // If logged in, send profile page
            res.sendFile(path.join(__dirname, '../client/client_pages/profile/profile.html'));
        } else {
            // If not logged in, redirect to login page
            res.redirect('/login');
        }
    });

    app.get('/recipe/:cocktailID', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/client_pages/recipe/recipe.html'));
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

            let cocktail = await getCocktailById(cocktailID);

            // If  cocktail isn't in DB, fetch from the API
            if (!cocktail) {
                const jsonData = await fetchCocktailData('lookup.php', 'i', cocktailID);
                const drinks = processCocktailData(jsonData);

                // Find the specific cocktail by ID
                cocktail = drinks.find(cocktail => cocktail.id === cocktailID);

                // Add cocktail to the database if it was found
                if (cocktail) {
                    try {
                        await addCocktailToDb(cocktail);
                        console.log("Successfully added cocktail:", cocktail);
                    } catch (error) {
                        console.log("Error adding cocktail:", error);
                    }
                }
            }

            if (cocktail) {
                const acceptHeader = req.headers.accept;
                if (acceptHeader && acceptHeader.includes('application/xml')) {
                    // Convert the cocktail object to XML
                    const builder = new xml2js.Builder();
                    const xml = builder.buildObject({ cocktail });

                    res.set('Content-Type', 'application/xml');
                    res.send(xml);
                } else {
                    res.json(cocktail);
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

    app.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Check if user is already logged in
            if (req.session && req.session.userId) {
                res.status(409).json({ error: 'User already logged in'});
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
                console.log('user is admin? ' , await isUserAdmin(user.id));
                // Create a JWT token for admin users
                if (await isUserAdmin(user.id)) {
                    const token = generateToken(user);
                    res.json({ success: true, token });
                } else {
                    res.json({ success: true });
                }

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

        // Check if username is at least 3 characters long and has no spaces
        if (username.length < 3 || /\s/.test(username)) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long and contains no spaces'});
        }

        // Check if email is valid
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Check if password is at least 6 characters
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

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

    app.post('/user/:userId/set-admin', verifyToken, async (req, res) => {
        const userId = req.params.userId;

        try {
            // Call setIsAdmin function to set user as admin
            await setIsAdmin(userId, true);
            res.status(200).json({ message: 'Admin rights changed successfully' });
        } catch (error) {
            console.error('Error setting admin rights:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.patch('/users/:userId', async (req, res) => {
        const userId = req.params.userId;
        const userData = req.body;

        try {
            // Retrieve current email and username of the user
            const userEmail = await getEmailById(userId);
            const userUsername = await getUsernameById(userId);

            // Check if email or username already exist for other users
            const emailExists = await checkEmailExists(userData.email);
            const usernameExists = await checkUserExists(userData.username);

            if (emailExists && userData.email !== userEmail) {
                res.status(400).json({ error: 'Email already exists. Please use a different email.' });
            } else if (usernameExists && userData.username !== userUsername) {
                res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
            } else if (emailExists && userData.email === userEmail) {
                res.status(400).json({ error: 'That is your email??? Duh-doy!' });
            } else if (usernameExists && userData.username === userUsername) {
                res.status(400).json({ error: 'That is your username you idiot.' });
            } else {
                // Update user data in the database using the userId and provided data
                await updateUserPatch(userId, userData);
                res.status(200).json({ message: `User with ID ${userId} updated successfully` });
            }
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
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

    app.listen(666, () => {
        console.log("Normal client server now listening on http://localhost:666");
    });

    // Serve static content
    app_admin.use('/client', express.static(path.join(__dirname, '../client')));

    // Middleware to parse URL-encoded data and JSON data
    app_admin.use(bodyParser.urlencoded({ extended: true }));
    app_admin.use(bodyParser.json());

    // Middleware to redirect from '/' to '/home'
    app_admin.get('/', (req, res) => {
        res.redirect('/editor');
    });

    app_admin.get('/editor', function (req, res) {
        res.sendFile(path.join(__dirname, '../client/admin_pages/editor/editor.html'));
    });

    app_admin.get('/api/cocktail/:cocktailId', async (req, res) => {
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

    app_admin.get('/api/cocktail/name/:name', async (req, res) => {
        const cocktailName = req.params.name;

        try {
            const cocktail = await getCocktailByName(cocktailName);
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

    app_admin.post('/add-cocktail', (req, res) => {
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

    app_admin.delete('/recipe/:cocktailId', async (req, res) => {
        const cocktailId = req.params.cocktailId;

        try {
            const result = await removeCocktailFromDb(cocktailId);
            if (result.error) {
                res.status(404).json({ error: result.error });
            } else {
                res.json(result);
            }
        } catch (error) {
            console.error('Error removing cocktail:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Update Cocktail data
    app_admin.put('/recipe/:cocktailId', verifyToken, (req, res) => {
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
    app_admin.put('/recipe/:cocktailId/ingredients', verifyToken, (req, res) => {
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

    app_admin.listen(999, () => {
        console.log("Admin server now listening on http://localhost:999");
    });

}).catch(err => {
    console.error('Error importing node-fetch:', err);
});