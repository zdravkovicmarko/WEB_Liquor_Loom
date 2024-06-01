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

    // Function to fetch and display recipe data
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

    // Get cocktail ID from URL
    const cocktailID = window.location.pathname.split('/').pop();
    // Call displayRecipe function with the cocktailID
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

                // Handle slide value
                slideValue("/");

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