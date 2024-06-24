const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
const {
    getCocktailById, getCocktailByName, getCocktailsByIngredients, getAllUniqueIngredients, getAllCocktailsFromDb,
    addCocktailToDb, updateIngredients, updateCocktailInDb, removeCocktailFromDb, insertNewUser, getUser,
    getUsernameById, getEmailById, getPasswordById, checkUserExists, checkEmailExists, updateUserPatch, setIsAdmin,
    removeUserByUsername, getUserRatingById, getUserInteractionById, getCounterByCocktailId, getCounterByUserId,
    getCocktailIdsByUserId, getAverageRatingByCocktailId, getAverageRatingByUserId, rateCocktail, updateUserInteraction,
    deleteUserInteraction, getUserFavCocktailId, updateUserFav, deleteUserFav
} = require('./liquorloom-database-utils.js');
const { processCocktailData, fetchCocktailData, getAllCocktailsFromAPI, sendResponse} = require('./server-utils.js')
const app = express();
const app_admin = express();
let fetch;

import('node-fetch').then(module => {
    fetch = module.default;

    // Serve static content
    app.use('/client', express.static(path.join(__dirname, '../client')));

    // Middleware to parse URL-encoded data & JSON data
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Session management
    app.use(session({
        secret: secret,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Use secure: true in production with HTTPS
    }));

    // Basic endpoints for redirection & serving pages
    app.get('/', (req, res) =>
        res.redirect('/home'));

    app.get('/home', (req, res) =>
        res.sendFile(path.join(__dirname, '../client/client_pages/home/home.html')));

    app.get('/recipe/:cocktailID', (req, res) =>
        res.sendFile(path.join(__dirname, '../client/client_pages/recipe/recipe.html')));

    app.get('/login', (req, res) =>
        res.sendFile(path.join(__dirname, '../client/client_pages/authentication/login.html')));

    app.get('/signup/', (req, res) =>
        res.sendFile(path.join(__dirname, '../client/client_pages/authentication/signup.html')));

    app.get('/profile', (req, res) =>
        req.session && req.session.userId ?
            res.sendFile(path.join(__dirname, '../client/client_pages/profile/profile.html')) // Logged in, serves profile page
            : res.redirect('/login')); // Not logged in, redirects to login page

    // Check login status
    app.get('/login-status', (req, res) => {
        req.session && req.session.userId ?
            sendResponse(req, res, { loggedIn: true })
            : sendResponse(req, res, { loggedIn: false });
    });

    // Fetch current user ID
    app.get('/current-user', (req, res) => {
        if (req.session && req.session.userId) {
            const userId = req.session.userId;
            sendResponse(req, res, { userId });
        } else {
            res.status(401).send({ error: 'User not logged in' });
        }
    });

    // Fetch & send random quote
    app.get('/api/quote', async (req, res) => {
        try {
            const response = await fetch('https://api.quotable.io/random?tags=inspirational');
            if (!response.ok) console.error('Network response was not ok.');
            const data = await response.json();
            sendResponse(req, res, data);
        } catch (error) {
            console.error('Failed to fetch quote:', error);
            res.status(500).send({ error: 'Failed to fetch quote' });
        }
    });

    // (FOR DEVS) Fetch all recipe data (as JSON or XML)
    app.get('/api/all-recipes', async (req, res) => {
        try {
            const allCocktails = await getAllCocktailsFromAPI();
            sendResponse(req, res, { cocktails: allCocktails })
        } catch (error) {
            console.log('Error fetch all cocktails', error);
            res.status(500).send('Failed to fetch all cocktails');
        }
    });

    // Fetch all cocktails
    app.get('/cocktails', async (req, res) => {
        try {
            let cocktails = await getAllCocktailsFromDb();

            if (!cocktails.length) {  // If no cocktails in DB, fetch from API & add to DB
                const allCocktailsData = await getAllCocktailsFromAPI();
                const processedCocktails = processCocktailData({ drinks: allCocktailsData });
                for (const cocktail of processedCocktails) await addCocktailToDb(cocktail);

                cocktails = await getAllCocktailsFromDb(); // Fetch cocktails again after adding
            }
            sendResponse(req, res, cocktails);
        } catch (error) {
            console.error('Error fetching cocktails:', error);
            res.status(500).send('Error occurred while fetching cocktails');
        }
    });

    // Fetch cocktails by ingredients
    app.get('/api/cocktail', async (req, res) => {
        try {
            const ingredients = req.query.ingredients ? req.query.ingredients.split(',') : [];
            if (!ingredients.length) return res.status(400).send({ error: 'No ingredients provided' });
            const response = await getCocktailsByIngredients(ingredients);
            if (response.length) {
                sendResponse(req, res, response, { rootName: 'ingredients' }); // Wrap data in "ingredients" tags as root because of query parameter
            } else {
                console.log('No cocktails found for ingredients:', ingredients);
                res.status(404).send({ error: 'Cocktail not found' });
            }
        } catch (error) {
            console.error('Error getting filtered cocktails:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Fetch all unique ingredients
    app.get('/api/get-all-ingredients', async (req, res) => {
        try {
            getAllUniqueIngredients((err, ingredients) => {
                if (err) {
                    console.error('Error retrieving unique ingredients:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                sendResponse(req, res, ingredients);
            });
        } catch (error) {
            console.error('Unexpected error:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Fetch cocktail's data
    app.get('/api/cocktail/:cocktailID', async (req, res) => {
        try {
            const cocktailID = req.params.cocktailID;
            let cocktail = await getCocktailById(cocktailID);

            if (!cocktail) { // If cocktail isn't in DB, fetch from API
                const jsonData = await fetchCocktailData('lookup.php', 'i', cocktailID);
                const drinks = processCocktailData(jsonData);
                cocktail = drinks.find(cocktail => cocktail.id === cocktailID);

                if (cocktail) { // Add cocktail to DB if found
                    try {
                        await addCocktailToDb(cocktail);
                        cocktail = await getCocktailById(cocktailID);
                        console.log("Successfully added cocktail:", cocktail);
                    } catch (error) {
                        console.log("Error adding cocktail:", error);
                    }
                }
            }
            cocktail ? sendResponse(req, res, cocktail) : res.status(404).send('Recipe not found');

        } catch (error) {
            console.error('Error fetching and processing cocktail data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Fetch action's counter by cocktail ID & action
    app.get('/api/cocktail/:id/action/:action/count', async (req, res) => {
        try {
            const cocktailID = req.params.id;
            const action = req.params.action;
            const count = await getCounterByCocktailId(cocktailID, action);
            sendResponse(req, res, {cocktailID, action, count})
        } catch (error) {
            console.error('Error fetching the count:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch cocktail's overall average rating
    app.get('/api/cocktail/:id/rating', async (req, res) => {
        try {
            const cocktailID = req.params.id;
            const averageRating = await getAverageRatingByCocktailId(cocktailID);
            sendResponse(req, res, { cocktailID, averageRating })
        } catch (error) {
            console.error('Error fetching the average rating:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch user's average rating given to cocktails by user ID
    app.get('/api/user/:userId/average-rating', async (req, res) => {
        try {
            const userId = req.params.userId;
            const averageRating = await getAverageRatingByUserId(userId);
            sendResponse(req, res, { userId, averageRating })
        } catch (error) {
            console.error('Error fetching the average rating:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch user's favorite cocktail ID
    app.get('/api/user/:userId/fav', async (req, res) => {
        try {
            const userId = req.params.userId;
            const favCocktailId = await getUserFavCocktailId(userId);
            sendResponse(req, res, { userId, favoriteCocktailId: favCocktailId });
        } catch (error) {
            console.error('Error fetching user favorite cocktail ID:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch user's rating value for specific cocktail
    app.get('/api/user/:userId/rating/:cocktailId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const cocktailId = req.params.cocktailId;
            const rating = await getUserRatingById(userId, cocktailId);
            sendResponse(req, res, { userId, cocktailId, rating })
        } catch (error) {
            console.error('Error fetching the rating:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch user's interaction for specific cocktail
    app.get('/api/user/:userId/interaction/:cocktailId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const cocktailId = req.params.cocktailId;
            const action = await getUserInteractionById(userId, cocktailId);
            sendResponse(req, res, { userId, cocktailId, action })
        } catch (error) {
            console.error('Error fetching the interaction:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch username by user ID
    app.get('/api/user/:id/username', async (req, res) => {
        try {
            const username = await getUsernameById(req.params.id);
            sendResponse(req, res, {username})
        } catch (error) {
            console.error('Error fetching username:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Fetch email by user ID
    app.get('/api/user/:id/email', async (req, res) => {
        try {
            const email = await getEmailById(req.params.id);
            sendResponse(req, res, {email})
        } catch (error) {
            console.error('Error fetching email:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Fetch password by user ID
    app.get('/api/user/:id/password', async (req, res) => {
        try {
            const password = await getPasswordById(req.params.id);
            sendResponse(req, res, {password})
        } catch (error) {
            console.error('Error fetching password:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Fetch action's counter by user ID & action
    app.get('/api/user/:userId/action/:action/count', async (req, res) => {
        try {
            const userId = req.params.userId;
            const action = req.params.action;
            const count = await getCounterByUserId(userId, action);
            sendResponse(req, res, { userId, action, count })
        } catch (error) {
            console.error('Error fetching the count:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch cocktail IDs by user ID & action
    app.get('/api/user/:userId/action/:action/ids', async (req, res) => {
        try {
            const userId = req.params.userId;
            const action = req.params.action;
            const cocktailIds = await getCocktailIdsByUserId(userId, action);
            sendResponse(req, res, { userId, action, cocktailIds })
        } catch (error) {
            console.error('Error fetching the cocktail IDs:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create new account
    app.post('/signup', (req, res) => {
        const { username, email, password, verification } = req.body;

        // Validation checks
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (username.length < 3 || /\s/.test(username)) return res.status(400).send({ error: 'Username must be at least 3 characters long and contains no spaces'});
        if (!emailPattern.test(email)) return res.status(400).send({ error: 'Please enter a valid email address' });
        if (password.length < 6) return res.status(400).send({ error: 'Password must be at least 6 characters long' });
        if (password !== verification) return res.status(400).send({ error: 'Passwords do not match' });

        Promise.all([checkUserExists(username), checkEmailExists(email)])

            .then(([usernameExists, emailExists]) => {
                if (usernameExists) return res.status(400).send({ error: 'Username already in use' });
                if (emailExists) return res.status(400).send({ error: 'Email already in use' });
                return insertNewUser(username, email, password); // Insert new user if validation passes
            })

            // Respond with success message & userId
            .then(userId => {
                res.status(201).send({ message: 'User created', userId });
            })

            .catch(error => {
                if (error.status) return res.status(error.status).send({ error: error.message }); // Handle known errors
                console.error('Error creating user:', error);
                res.status(500).send({ error: 'Error creating user' }); // Handle unknown errors
            });
    });

    // Log-in user
    app.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;

            // Check if user is already logged in
            if (req.session && req.session.userId) return res.status(409).send({ error: 'User already logged in'});

            // Check if user / email exists
            const userExists = await checkUserExists(username);
            const emailExists = await checkEmailExists(username);
            if (!userExists && !emailExists) return res.status(404).send({ error: 'Account does not exist' });

            // Authenticate user
            const user = await getUser(username, password);
            if (!user) return res.status(401).send({ error: 'Invalid username or password' });

            // Create session
            req.session.userId = user.id;
            res.send({ success: true });
        } catch (error) {
            console.error('Error logging in user:', error);
            res.status(500).send({ error: 'Error logging in user' });
        }
    });

    // Log-out user
    app.post('/logout', (req, res) => {
        if (req.session && req.session.userId) { // Destroy session if user is logged in
            req.session.destroy(err => {
                if (err) {
                    console.error('Error destroying session:', err);
                    res.status(500).send('Error logging out');
                } else {
                    res.redirect('/home');
                }
            });
        } else {
            res.status(401).send('User is not logged in');
        }
    });

    // Update user's cocktail overall rating (rating value + interaction)
    app.post('/update-interaction', async (req, res) => {
        try {
            const { userId, cocktailId, action, rating } = req.body;
            if (rating !== null) await rateCocktail(userId, cocktailId, rating);
            await updateUserInteraction(userId, cocktailId, action);
            res.status(200).send({ message: 'User interaction updated successfully' });
        } catch (err) {
            console.error('Error updating user interaction:', err);
            res.status(500).send({ error: 'Error updating user interaction' });
        }
    });

    // Update user's favorite cocktail
    app.post('/api/user/:userId/fav/:id', async (req, res) => {
        try {
            await updateUserFav(req.params.userId, req.params.id);
            res.status(200).send({ message: 'Favorite updated successfully' });
        } catch (error) {
            console.error('Error updating user favorite:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update user's admin setting
    app.post('/user/:userId/set-admin', async (req, res) => {
        try {
            await setIsAdmin(req.params.userId, true);
            res.status(200).send({ message: 'Admin rights changed successfully' });
        } catch (error) {
            console.error('Error setting admin rights:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update user's profile information
    app.patch('/user/:userId', async (req, res) => {
        try {
            const userId = req.params.userId;
            const userData = req.body;

            // Check if email / username exist for other users
            const userEmail = await getEmailById(userId);
            const userUsername = await getUsernameById(userId);
            const emailExists = await checkEmailExists(userData.email);
            const usernameExists = await checkUserExists(userData.username);

            // Validation checks
            if (emailExists && userData.email !== userEmail)
                return res.status(400).send({ error: 'Email already exists. Please use a different email.' });
            if (usernameExists && userData.username !== userUsername)
                return res.status(400).send({ error: 'Username already exists. Please choose a different username.' });
            if (emailExists && userData.email === userEmail)
                return res.status(400).send({ error: 'That is your email??? Duh-doy!' });
            if (usernameExists && userData.username === userUsername)
                return res.status(400).send({ error: 'That is your username you idiot.' });

            // Update user data in DB
            await updateUserPatch(userId, userData);
            res.status(200).send({ message: `User with ID ${userId} updated successfully` });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).send({ error: 'Failed to update user' });
        }
    });

    // Delete user's favorite cocktail
    app.delete('/api/user/:userId/fav/delete', async (req, res) => {
        try {
            await deleteUserFav(req.params.userId);
            res.status(200).send({ message: 'Favorite deleted successfully' });
        } catch (error) {
            console.error('Error deleting user favorite:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete user's interaction
    app.delete('/api/user/:userId/interaction/:cocktailId', async (req, res) => {
        try {
            await deleteUserInteraction(req.params.userId, req.params.cocktailId);
            res.status(200).send({ message: 'User interaction deleted successfully' });
        } catch (error) {
            console.error('Error deleting user interaction:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete user's account
    app.delete('/user/:username', (req, res) => {
        req.session.destroy(err => { // Destroy session first
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).send('Failed to delete user and logout');
            } else {
                res.status(200).send('Session destroyed, proceeding with user deletion.');
                removeUserByUsername(req.params.username)
                    .catch((error) => console.error('Error deleting user:', error));
            }
        });
    });

    // Serve static content
    app_admin.use('/client', express.static(path.join(__dirname, '../client')));

    // Middleware to parse URL-encoded data & JSON data
    app_admin.use(bodyParser.urlencoded({ extended: true }));
    app_admin.use(bodyParser.json());

    // Basic endpoints for redirection & serving pages
    app_admin.get('/', (req, res) =>
        res.redirect('/editor'));

    app_admin.get('/editor', (req, res) =>
        res.sendFile(path.join(__dirname, '../client/admin_pages/editor/editor.html')));

    // Fetch cocktail by ID
    app_admin.get('/api/cocktail/id/:id', async (req, res) => {
        try {
            const cocktail = await getCocktailById(req.params.id);
            if (!cocktail) return res.status(404).send({ error: 'Cocktail not found' });
            sendResponse(req, res, cocktail)
        } catch (error) {
            console.error('Error fetching cocktail:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Fetch cocktail by name
    app_admin.get('/api/cocktail/name/:name', async (req, res) => {
        try {
            const cocktail = await getCocktailByName(req.params.name);
            if (!cocktail) return res.status(404).send({ error: 'Cocktail not found' });
            sendResponse(req, res, cocktail)
        } catch (error) {
            console.error('Error fetching cocktail:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Add cocktail to DB
    app_admin.post('/add-cocktail', async (req, res) => {
        const cocktailData = req.body;
        try {
            const cocktail = await addCocktailToDb(cocktailData);
            res.status(201).send({message: 'Cocktail added successfully', cocktail});
        } catch (error) {
            console.error('Failed to add cocktail:', error);
            res.status(500).send({error: 'Failed to add cocktail'});
        }
    });

    // Update cocktail's data in DB
    app_admin.put('/recipe/:cocktailId', async (req, res) => {
        const cocktailId = req.params.cocktailId;
        const { name, category, alcoholic, glass, instructions, thumbnail, ingredients, measures } = req.body;

        // Validation check
        if (!name || !category || !alcoholic || !glass || !instructions || !thumbnail || !Array.isArray(ingredients) || !Array.isArray(measures)) {
            return res.status(400).send('Missing required fields or ingredients/measures are not arrays');
        }

        try { // Update cocktail details & ingredients
            await updateCocktailInDb(cocktailId, name, category, alcoholic, glass, instructions, thumbnail);
            await updateIngredients(cocktailId, ingredients, measures);
            res.status(200).send(`Cocktail with ID ${cocktailId} updated successfully`);
        } catch (error) {
            console.error('Error updating cocktail:', error);
            res.status(500).send(`Failed to update cocktail with ID ${cocktailId}`);
        }
    });

    // Delete cocktail
    app_admin.delete('/recipe/:cocktailId', async (req, res) => {
        try {
            const result = await removeCocktailFromDb(req.params.cocktailId);
            if (result.error) return res.status(404).send({ error: result.error });
            sendResponse(req, res, result)
        } catch (error) {
            console.error('Error removing cocktail:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    app.listen(666, () => console.log("Normal client server now listening on http://localhost:666"));
    app_admin.listen(999, () => console.log("Admin server now listening on http://localhost:999"));

}).catch(err => console.error('Error importing node-fetch:', err));