document.addEventListener("DOMContentLoaded", () => {

    // Function to fetch and display recipe data
    const displayRecipe = async (cocktailID) => {
        try {
            // Fetch cocktail data asynchronously
            const response = await fetch(`/api/recipe/${cocktailID}`);
            if (!response.ok) console.error('Failed to fetch recipe data');

            const recipeData = await response.json();

            // Update HTML elements with recipe data
            document.getElementById('name').textContent = recipeData.name.replace(/\b\w/g, char => char.toUpperCase());
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

    // Add event listener to logo for navigation
    document.getElementById('logo-container').addEventListener('click', () => {
        window.location.href = '/home';
    });
    // Add event listener to login button for navigation
    document.getElementById('login-btn').addEventListener('click', () => {
        window.location.href = '/login';
    });
    // Add event listener to profile picture for navigation
    document.getElementById('profile-pic').addEventListener('click', () => {
        window.location.href = '/profile';
    });
});
