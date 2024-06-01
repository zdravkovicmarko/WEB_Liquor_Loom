import { checkLoginStatus } from '/client/base.js';
import { handleProfileClick } from "/client/base.js";
import { slideValue } from '/client/base.js';

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

document.addEventListener("DOMContentLoaded", async () => {

    // Fetch & display recipe (FE & BE)
    const displayRecipe = async (cocktailID) => {
        try {
            // Fetch cocktail data asynchronously
            const response = await fetch(`/api/recipe/${cocktailID}`);
            if (!response.ok) console.error('Failed to fetch recipe data');

            const recipeData = await response.json();

            // Update HTML elements with recipe data
            document.getElementById('name').textContent = recipeData.name.replace(/(^|\s)\w/g, char => char.toUpperCase());
            document.getElementById('rating').textContent = "★ " + (Math.random() * 50 / 10).toFixed(1);
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

            // Adds columns for ingredients if exceeding 250px
            const ingredientsDiv = document.querySelector('.ingredients');
            const ingredientsContainer = ingredientsDiv.querySelector('.element-inner-container');
            ingredientsContainer.scrollHeight > 250 ? ingredientsDiv.classList.add('exceeds-height') : ingredientsDiv.classList.remove('exceeds-height');
        } catch (error) {
            console.error('Error fetching recipe data:', error);
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
                slideValue(false, "/");

                // Fetch username
                const usernameResponse = await fetch(`/api/user/${userID}/username`);
                const usernameData = await usernameResponse.json();
                document.getElementById('username').textContent = "@" + usernameData.username;
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

    btnParts.forEach(btnPart => {
        btnPart.addEventListener("click", () => {
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
            } else {
                btnPart.classList.add("selected");
                btnPart.classList.remove("btn-grey");
                selectedButtons.add(btnId);
            }

            if (btnId === 'btn-recommend') {
                action = 'recommend';
            } else if (btnId === 'btn-recommend-no') {
                action = 'not_recommend';
            } else if (btnId === 'btn-pin') {
                action = 'pin';
            }
        });
    });

    const saveRatingButton = document.getElementById('save-btn');
    saveRatingButton.addEventListener('click', async () => {
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

            const notificationContainer = document.getElementById('notification-container');
            const notificationMessage = document.getElementById('notification-message');

            notificationMessage.textContent = 'Rating saved successfully!';
            notificationContainer.classList.remove('hidden');

            setTimeout(() => {
                notificationContainer.classList.add('hidden');
            }, 5000);
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

// Assuming you have a logout button with id "logout-btn"
const logoutButton = document.getElementById('logout-btn');

logoutButton.addEventListener('click', async function(event) {
    try {
        window.location.href = '/logout';
    } catch (error) {
        console.error('Error:', error);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    checkLoginStatus();
    document.getElementById('profile-pic').addEventListener('click', handleProfileClick);
});