import { displayMessage } from '/client/base.js';
import { checkLoginStatus } from '/client/base.js';
import { handleProfileClick } from "/client/base.js";
import { slideValue } from '/client/base.js';
import { updateCocktailRating } from "/client/base.js";
import { logoutBtnHandling } from '/client/base.js';

// Event listeners for navigation
document.getElementById('logo-container').addEventListener('click', () => {
    window.location.href = '/home';
});
document.getElementById('login-btn').addEventListener('click', () => {
    window.location.href = '/login';
});
document.getElementById('profile-pic').addEventListener('click', () => {
    window.location.href = '/profile';
});

logoutBtnHandling();

const alertSuccess = document.getElementById('alert-success');

document.addEventListener("DOMContentLoaded", async () => {

    // Fetch & display recipe (FE & BE)
    const displayRecipe = async (cocktailID) => {
        const alertFetch = document.getElementById('alert-fetch-data');
        const mainContainer = document.getElementById('main');
        displayMessage(alertFetch, 'Currently fetching recipe...', 1000000);
        try {
            // Fetch cocktail data asynchronously
            const response = await fetch(`/api/recipe/${cocktailID}`);
            if (!response.ok) console.error('Failed to fetch recipe data');

            const recipeData = await response.json();

            // Update HTML elements with recipe data
            document.getElementById('name').textContent = recipeData.name.replace(/(^|\s)\w/g, char => char.toUpperCase());
            document.getElementById('rating').textContent = "★ " + (await updateCocktailRating(cocktailID));
            document.getElementById('img').src = recipeData.thumbnail;

            document.getElementById('category').textContent = `${recipeData.category.toLowerCase()}`;
            document.getElementById('alcoholic').textContent = `${recipeData.alcoholic.toLowerCase()}`;
            document.getElementById('glass').textContent = `${recipeData.glass.toLowerCase()}`;

            const titleElement = document.getElementById('name');
            document.title = `${titleElement.textContent.trim()} - LiquorLoom`;

            const ingredientsList = document.getElementById('ingredients');
            ingredientsList.innerHTML = '';
            ingredientsList.classList.add('bullets');

            for (let i = 0; i < recipeData.ingredients.length; i++) {
                const listItem = document.createElement('li');
                const ingredient = recipeData.ingredients[i].toLowerCase();
                const measure = recipeData.measures[i] ? recipeData.measures[i].toLowerCase() : '';
                listItem.textContent = measure ? `${ingredient} - ${measure}` : ingredient;
                ingredientsList.appendChild(listItem);
            }
            document.getElementById('instructions').textContent = recipeData.instructions;
            mainContainer.style.display = 'grid';

            // Adds columns for ingredients if exceeding 250px
            const ingredientsDiv = document.querySelector('.ingredients');
            const ingredientsContainer = ingredientsDiv.querySelector('.element-inner-container');
            ingredientsContainer.scrollHeight > 250 ? ingredientsDiv.classList.add('exceeds-height') : ingredientsDiv.classList.remove('exceeds-height');
        } catch (error) {
            console.error('Error fetching recipe data:', error);
            const alertFetchError = document.getElementById('alert-fetch-error');
            if (error.message === 'Failed to fetch') {
                displayMessage(alertFetchError, 'Too many requests. Please wait a few seconds and refresh the page!', 10000);
            } else {
                displayMessage(alertFetchError, 'Error fetching initial cocktails.', 6000);
            }
        } finally {
            displayMessage(alertFetch, '', 0);
        }
    };

    // Display recipe (FE)
    const cocktailID = window.location.pathname.split('/').pop();
    displayRecipe(cocktailID);

    const displayRate = async (userID) => {
        if (userID) {
            try {
                // Display rate container
                const mainContainer = document.getElementById('main');
                mainContainer.classList.remove('normal-main');
                mainContainer.classList.add('account-main');
                const rateContainer = document.getElementById('rate-container');
                rateContainer.classList.remove('hidden');
                const favContainer = document.getElementById('btn-fav');
                favContainer.classList.remove('hidden');

                // Handle slide value
                slideValue(false, "/", 2.5);

                // Fetch username
                const usernameResponse = await fetch(`/api/user/${userID}/username`);
                const usernameData = await usernameResponse.json();
                document.getElementById('username').textContent = usernameData.username;
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        }
    }

    const response = await fetch(`/current-user`);
    const data = await response.json();
    const userID = data.userId;
    displayRate(userID);

    const btnParts = document.querySelectorAll(".btn-part");
    let selectedButtons = new Set();
    let action = '';
    let rating = null;
    let isFavorite = false;

    // Function to fetch user's favorite cocktail ID
    async function fetchUserFavoriteCocktailId() {
        try {
            const response = await fetch(`/api/user/${userID}/fav`);
            if (response.ok) {
                const data = await response.json();
                return data.favoriteCocktailId;
            } else {
                console.error('Failed to fetch user favorite cocktail ID');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    // Update isFavorite based on fetched favorite cocktail ID
    async function updateIsFavorite() {
        const favCocktailId = await fetchUserFavoriteCocktailId();
        isFavorite = favCocktailId === cocktailID;
        const btnFav = document.getElementById('btn-fav');
        if (isFavorite) {
            btnFav.classList.add("selected");
            btnFav.classList.remove("btn-grey");
        } else {
            btnFav.classList.remove("selected");
            btnFav.classList.add("btn-grey");
        }
    }

    btnParts.forEach(btnPart => {
        btnPart.addEventListener("click", async () => {
            const btnId = btnPart.id;
            const btnSet = btnPart.querySelector(".btn-img").getAttribute('data-tag-set');

            // Deselect other buttons in the same set
            btnParts.forEach(otherBtnPart => {
                const otherBtnSet = otherBtnPart.querySelector(".btn-img").getAttribute('data-tag-set');
                if (otherBtnSet === btnSet && otherBtnPart !== btnPart) {
                    otherBtnPart.classList.remove("selected");
                    otherBtnPart.classList.add("btn-grey");
                    selectedButtons.delete(otherBtnPart.id);
                }
            });

            // Handles (de-)selection of clicked button
            if (selectedButtons.has(btnId)) {
                btnPart.classList.remove("selected");
                btnPart.classList.add("btn-grey");
                selectedButtons.delete(btnId);
                action = null;
            } else {
                btnPart.classList.add("selected");
                btnPart.classList.remove("btn-grey");
                selectedButtons.add(btnId);

                if (btnId === 'btn-recommend') {
                    action = 'recommend';
                } else if (btnId === 'btn-recommend-no') {
                    action = 'not_recommend';
                } else if (btnId === 'btn-pin') {
                    action = 'pin';
                }
            }
            // Check if 'btn-fav' is clicked and update isFavorite
            if (btnId === 'btn-fav') {
                isFavorite = !isFavorite; // Toggle isFavorite state
                await updateOrDeleteFavorite(); // Update or delete the favorite
            }
        });
    });

    async function updateOrDeleteFavorite() {
        if (isFavorite) {
            // If not a favorite, add it
            try {
                const response = await fetch(`/api/user/${userID}/fav/${cocktailID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    console.log('Favorite added successfully');
                } else {
                    console.error('Failed to add favorite');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            // If already a favorite, delete it
            try {
                const response = await fetch(`/api/user/${userID}/fav/delete`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    console.log('Favorite deleted successfully');
                } else {
                    console.error('Failed to delete favorite');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        // Update the isFavorite state after performing the action
        await updateIsFavorite();
    }

    updateIsFavorite();

    // Function to fetch user's interaction for the cocktail
    async function fetchUserInteraction(userId, cocktailId) {
        try {
            const response = await fetch(`/api/user/${userId}/interaction/${cocktailId}`);
            if (response.ok) {
                const data = await response.json();
                return data.action;
            } else {
                console.error('Failed to fetch user interaction for the cocktail');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    // Function to fetch user's rating for the cocktail
    async function fetchUserRatingForCocktail(userId, cocktailId) {
        try {
            const response = await fetch(`/api/user/${userId}/rating/${cocktailId}`);
            if (response.ok) {
                const data = await response.json();
                return data.rating;
            } else {
                console.error('Failed to fetch user rating for the cocktail');
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    // Update the interaction and rating based on fetched data
    async function updateInteractionAndRating(userId, cocktailId) {
        // Fetch user interaction
        let fetchedAction = await fetchUserInteraction(userId, cocktailId);  // Store fetched action in a different variable
        if (fetchedAction !== null) {
            // Set action to the fetched value
            let selectedButtonId = '';
            switch (fetchedAction) {  // Use fetchedAction instead of action to avoid overwriting
                case 'recommend':
                    selectedButtonId = 'btn-recommend';
                    break;
                case 'not_recommend':
                    selectedButtonId = 'btn-recommend-no';
                    break;
                case 'pin':
                    selectedButtonId = 'btn-pin';
                    break;
                default:
                    break;
            }

            // Select button if found
            if (selectedButtonId) {
                const selectedButton = document.getElementById(selectedButtonId);
                if (selectedButton) {
                    selectedButton.classList.add("selected");
                    selectedButton.classList.remove("btn-grey");
                    selectedButtons.add(selectedButtonId);  // Add to selectedButtons set
                    action = fetchedAction;  // Update the action variable
                }
            }
        }

        // Fetch user rating
        const rating = await fetchUserRatingForCocktail(userId, cocktailId);
        if (rating !== null) {
            document.getElementById('slide').value = rating;
            slideValue(false, "/", rating);
        }
    }

    updateInteractionAndRating(userID, cocktailID);

    const saveRatingButton = document.getElementById('save-btn');
    saveRatingButton.addEventListener('click', async () => {
        // Check if either "btn-recommend", "btn-recommend-no", or "btn-pin" has been selected
        if (selectedButtons.has('btn-recommend') || selectedButtons.has('btn-recommend-no') || selectedButtons.has('btn-pin')) {
            rating = document.querySelector('#slide').value;
            const requestData = {
                userId: userID,
                cocktailId: cocktailID,
                action,
                rating
            };

            try {
                const response = await fetch('/updateInteraction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) {
                    console.error('Failed to save rating');
                }

                const alertSuccess = document.getElementById('alert-success');
                displayMessage(alertSuccess, 'Rating successfully saved!', 3000);
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            console.log('Please select an action before saving the rating.');
        }
    });

    const deleteButton = document.getElementById('delete-btn');
    deleteButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/user/${userID}/interaction/${cocktailID}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                selectedButtons.clear();
                document.getElementById('slide').value = 2.5;
                slideValue(false, "/", 2.5);

                displayMessage(alertSuccess, 'Rating successfully deleted!', 3000);
                console.log('User interaction deleted successfully');
                // Deselect all buttons
                btnParts.forEach(btnPart => {
                    if (btnPart.tagName.toLowerCase() === 'button') {
                        btnPart.classList.remove("selected");
                        btnPart.classList.add("btn-grey");
                        updateIsFavorite()
                    }
                });
            } else {
                console.error('Failed to delete user interaction');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    checkLoginStatus();
    document.getElementById('profile-pic').addEventListener('click', handleProfileClick);
});

document.addEventListener('DOMContentLoaded', async function () {
    const cocktailID = window.location.pathname.split('/').pop();

    const actions = [
        { id: 'value-recommended', action: 'recommend' },
        { id: 'value-recommended-no', action: 'not_recommend' },
        { id: 'value-planned', action: 'pin' }
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
});