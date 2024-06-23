import {
    displayMessage,
    slideValue,
    updateCocktailRating,
    logoutBtnHandling,
    checkLoginStatus,
    handleProfileClick
} from '/client/base.js';

const alertSuccess = document.getElementById('alert-success');
const alertError = document.getElementById('alert-error');
const alertFetchError = document.getElementById('alert-fetch-error');
logoutBtnHandling();

let userID;
let cocktailID;
let isFavorite = false;
let action = null;

document.addEventListener("DOMContentLoaded", async () => {

    // Display inspirational quote if page accessed via random recipe button
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('fromRandom') === 'true') {
        try {
            const response = await fetch('/api/quote');
            const data = await response.json();
            if (data.content && data.author) {
                document.getElementById('quote-container').classList.remove('hidden');
                document.getElementById('quote').textContent = `"${data.content}" - ${data.author}`;
            } else {
                displayMessage(alertFetchError, 'Quote data is incomplete.', 3000);
            }
        } catch (error) {
            console.error('Error fetching quote:', error);
            displayMessage(alertFetchError, 'Failed to load quote. Please try again later.', 3000);
        }
    }

    // Fetch & display recipe data
    cocktailID = window.location.pathname.split('/').pop();
    await displayRecipe(cocktailID);

    // Fetch & display action stats
    await displayActionStats(cocktailID);

    // Check if user is logged in & display rating UI
    const currentUser = await fetch('/current-user').then(res => res.json());
    userID = currentUser.userId;
    if (userID) {
        await displayRate(userID);
        await updateInteractionAndRating(userID, cocktailID);
    }
});

// Fetch & display recipe data
async function displayRecipe(cocktailID) {
    const alertFetch = document.getElementById('alert-fetch-data');
    displayMessage(alertFetch, 'Currently fetching recipe...', 1000000);
    try {
        const response = await fetch(`/api/recipe/${cocktailID}`);
        if (!response.ok) console.error('Failed to fetch recipe data');

        const recipeData = await response.json();
        document.getElementById('name').textContent = recipeData.name.replace(/(^|\s)\w/g, char => char.toUpperCase());
        document.getElementById('rating').textContent = "★ " + (await updateCocktailRating(cocktailID));
        document.getElementById('img').src = recipeData.thumbnail;
        document.getElementById('category').textContent = `${recipeData.category.toLowerCase()}`;
        document.getElementById('alcoholic').textContent = `${recipeData.alcoholic.toLowerCase()}`;
        document.getElementById('glass').textContent = `${recipeData.glass.toLowerCase()}`;
        document.title = `${recipeData.name} - LiquorLoom`;

        const ingredientsList = document.getElementById('ingredients');
        ingredientsList.innerHTML = '';
        ingredientsList.classList.add('bullets');
        recipeData.ingredients.forEach(({ ingredient, measure }) => {
            const listItem = document.createElement('li');
            listItem.textContent = measure ? `${ingredient.toLowerCase()} - ${measure.toLowerCase()}` : ingredient.toLowerCase();
            ingredientsList.appendChild(listItem);
        });
        document.getElementById('instructions').textContent = recipeData.instructions;

        const ingredientsDiv = document.querySelector('.ingredients');
        ingredientsDiv.classList.toggle('exceeds-height', ingredientsDiv.scrollHeight > 250);
    } catch (error) {
        console.error('Error fetching recipe data:', error);
        displayMessage(alertFetchError, error.message === 'Failed to fetch' ? 'Too many requests. Please wait a few seconds and refresh the page!' : 'Error fetching initial cocktails.', 6000);
    } finally {
        displayMessage(alertFetch, '', 0);
    }
}

// Fetch & display cocktail's action stats
async function displayActionStats(cocktailID) {
    const actions = [
        { id: 'value-recommend', action: 'recommend' },
        { id: 'value-not_recommend', action: 'not_recommend' },
        { id: 'value-pin', action: 'pin' }
    ];

    for (const { id, action } of actions) {
        try {
            const response = await fetch(`/api/cocktail/${cocktailID}/action/${action}/count`);
            if (!response.ok) {
                console.error(`Failed to fetch ${action} count: ${response.statusText}`);
            }
            const data = await response.json();
            document.getElementById(id).textContent = data.count;
        } catch (error) {
            console.error(`Error fetching count for ${action}:`, error);
        }
    }
}

// Display rating UI for logged-in user
async function displayRate(userID) {
    try {
        document.getElementById('rate-container').classList.remove('hidden');
        document.getElementById('btn-fav').classList.remove('hidden');
        slideValue(false, "/", 2.5);

        const { username } = await fetch(`/api/user/${userID}/username`).then(res => res.json());
        document.getElementById('username').textContent = username;
    } catch (error) {
        console.error('Error fetching profile data:', error);
    }
}

// Display user's interaction & rating for cocktail
async function updateInteractionAndRating(userID, cocktailID) {
    await updateIsFavorite(userID, cocktailID);
    action = await fetchUserInteraction(userID, cocktailID);
    if (action) {
        const actionBtn = document.getElementById(`btn-${action}`);
        console.log(action);
        if (actionBtn) actionBtn.classList.add("selected");
    }

    const rating = await fetchUserRating(userID, cocktailID);
    if (rating !== null) {
        document.getElementById('slide').value = rating;
        slideValue(false, "/", rating);
    }
}

// Fetch user's interaction for cocktail
async function fetchUserInteraction(userId, cocktailId) {
    try {
        const response = await fetch(`/api/user/${userId}/interaction/${cocktailId}`);
        if (response.ok) {
            const data = await response.json();
            return data.action;
        } else {
            console.error('Failed to fetch user interaction for the cocktail');
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
}

// Fetch user's rating for cocktail
async function fetchUserRating(userId, cocktailId) {
    try {
        const response = await fetch(`/api/user/${userId}/rating/${cocktailId}`);
        if (response.ok) {
            const data = await response.json();
            return data.rating;
        } else {
            console.error('Failed to fetch user rating for the cocktail');
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
}

// Update user's favorite cocktail state
async function updateIsFavorite(userID, cocktailID) {
    const favCocktailId = await fetchUserFavoriteCocktailId(userID);
    isFavorite = favCocktailId === cocktailID;
    const btnFav = document.getElementById('btn-fav');
    btnFav.classList.toggle("selected", isFavorite);
    btnFav.classList.toggle("btn-grey", !isFavorite);
}

// Fetch user's favorite cocktail ID
async function fetchUserFavoriteCocktailId(userID) {
    try {
        const response = await fetch(`/api/user/${userID}/fav`);
        if (response.ok) {
            const data = await response.json();
            return data.favoriteCocktailId;
        } else {
            console.error('Failed to fetch user favorite cocktail ID');
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return null;
}

// Event listeners for cocktail interaction buttons
document.querySelectorAll(".btn-part").forEach(btnPart => {
    btnPart.addEventListener("click", async () => {
        const btnId = btnPart.id;
        const btnSet = btnPart.querySelector(".btn-img").getAttribute('data-tag-set');
        document.querySelectorAll(".btn-part").forEach(otherBtnPart => {
            const otherBtnSet = otherBtnPart.querySelector(".btn-img").getAttribute('data-tag-set');
            if (otherBtnSet === btnSet && otherBtnPart !== btnPart) {
                otherBtnPart.classList.remove("selected");
                otherBtnPart.classList.add("btn-grey");
            }
        });

        const isSelected = btnPart.classList.toggle("selected");
        btnPart.classList.toggle("btn-grey", !isSelected);

        const actionMap = {
            'btn-recommend': 'recommend',
            'btn-not_recommend': 'not_recommend',
            'btn-pin': 'pin'
        };
        action = isSelected ? actionMap[btnId] : null;

        if (btnId === 'btn-fav') {
            isFavorite = !isFavorite;
            await updateOrDeleteFavorite();
        }
    });
});

// Update or delete user's favorite cocktail
async function updateOrDeleteFavorite() {
    if (isFavorite) {
        try {
            const response = await fetch(`/api/user/${userID}/fav/${cocktailID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) console.error('Failed to add favorite');
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        try {
            const response = await fetch(`/api/user/${userID}/fav/delete`, { method: 'DELETE' });
            if (!response.ok) console.error('Failed to delete favorite');
        } catch (error) {
            console.error('Error:', error);
        }
    }
    await updateIsFavorite(userID, cocktailID);
}

// Save user's cocktail rating
document.getElementById('save-btn').addEventListener('click', async () => {
    if (action) {
        const rating = document.querySelector('#slide').value;
        const requestData = { userId: userID, cocktailId: cocktailID, action, rating };

        try {
            const response = await fetch('/updateInteraction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            if (!response.ok) console.error('Failed to save rating');
            displayMessage(alertSuccess, 'Rating successfully saved!', 3000);
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        console.log('No action selected');
    }
});

// Delete user's cocktail rating
document.getElementById('delete-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`/api/user/${userID}/interaction/${cocktailID}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            document.querySelectorAll('.btn-part').forEach(btnPart => {
                btnPart.classList.remove("selected");
                btnPart.classList.add("btn-grey");
            });
            document.getElementById('slide').value = 2.5;
            slideValue(false, "/", 2.5);

            displayMessage(alertSuccess, 'Rating successfully deleted!', 3000);
        } else {
            console.error('Failed to delete user interaction');
            displayMessage(alertError, 'Failed to delete rating.', 3000);
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage(alertError, 'An error occurred while deleting the rating.', 3000);
    }
});

// Navigation event listeners
document.getElementById('logo-container').addEventListener('click', () => window.location.href = '/home');
document.getElementById('login-btn').addEventListener('click', () => window.location.href = '/login');
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    document.getElementById('profile-btn').addEventListener('click', handleProfileClick);
});
