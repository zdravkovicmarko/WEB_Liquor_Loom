import {
    appendCocktailFromDb,
    checkLoginStatus,
    displayMessage,
    slideValue,
    basicRedirectionHandling
} from '/client/base.js';

checkLoginStatus();
basicRedirectionHandling();

document.addEventListener("DOMContentLoaded", () => {

    // Display success messages if set in localStorage
    const SuccessMessage = document.getElementById('alert-success');

    if (localStorage.getItem('logoutSuccess') === 'true') {
        displayMessage(SuccessMessage, 'Successfully logged out!', 3000);
        localStorage.removeItem('logoutSuccess');
    }

    if (localStorage.getItem('deleteSuccess') === 'true') {
        displayMessage(SuccessMessage, 'Account successfully deleted!', 3000);
        localStorage.removeItem('deleteSuccess');
    }

    const randomContainer = document.getElementById("random-button");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const searchInput = document.getElementById("search");
    const ingredientSearchInput = document.getElementById("search-ingredients");
    const ingredientTagsContainer = document.querySelector(".element-inner-container.ingredients");
    const ratingSlider = document.getElementById('slide');
    let selectedTags = new Set();
    let selectedIngredients = new Set();
    let allCocktails = [];
    let isLoading = false;
    let sortOrder = 'asc';
    let allIngredients = new Set();

    // Handle slide value
    slideValue(true, "-", 0);

    // Fetch cocktails from backend
    const fetchCocktailsFromBackend = async () => {
        try {
            const response = await fetch('/cocktails');
            return await response.json() || [];
        } catch (error) {
            console.error('Error fetching cocktails:', error);
            return [];
        }
    };

    // Display initial cocktails
    const displayInitialCocktails = async () => {
        isLoading = true;
        const alertFetch = document.getElementById('alert-fetch-data');
        displayMessage(alertFetch, 'Currently fetching cocktails...', 1000000);
        try {
            allCocktails = await fetchCocktailsFromBackend();
            const cocktailsWithRatings = [];
            for (let cocktail of allCocktails) {
                const rating = await appendCocktailFromDb(cocktail, 'cocktails-container');
                cocktailsWithRatings.push({ ...cocktail, rating });
            }
            allCocktails = cocktailsWithRatings;
            allIngredients = await getAllIngredients();
        } catch (error) {
            console.error('Error displaying initial cocktails:', error);
            displayMessage(alertFetch, 'Error displaying initial cocktails.', 6000);
        } finally {
            isLoading = false;
            displayMessage(alertFetch, '', 0);
        }
    };

    displayInitialCocktails();

    // Fetch all ingredients
    const getAllIngredients = async () => {
        try {
            const response = await fetch('/api/getAllIngredients');
            return await response.json() || [];
        } catch (error) {
            console.error('Error fetching ingredients:', error);
            return [];
        }
    };

    // Redirect to random recipe
    const redirectToRandomRecipe = async () => {
        try {
            const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
            const data = await response.json();
            const randomCocktailID = data.drinks[0].idDrink;
            window.location.href = `/recipe/${randomCocktailID}?fromRandom=true`;
        } catch (error) {
            console.error('Error fetching random cocktail:', error);
        }
    };

    randomContainer.addEventListener('click', redirectToRandomRecipe);

    // Filter cocktails by name
    const filterCocktailsByName = (searchTerm) => {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        return allCocktails.filter(cocktail => cocktail.name.toLowerCase().includes(lowercaseSearchTerm));
    };

    // Update displayed cocktails
    const updateDisplayedCocktails = (searchTerm) => {
        cocktailsContainer.innerHTML = '';
        const filteredCocktails = filterCocktailsByName(searchTerm);
        if (filteredCocktails.length === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found";
            noResultsMessage.classList.add("no-results-text");
            cocktailsContainer.appendChild(noResultsMessage);
        } else {
            if (sortOrder === 'asc') {
                filteredCocktails.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortOrder === 'desc') {
                filteredCocktails.sort((a, b) => b.name.localeCompare(a.name));
            } else if (sortOrder === 'rating') {
                filteredCocktails.sort((a, b) => b.rating - a.rating);
            }
            filteredCocktails.forEach(cocktail => appendCocktailFromDb(cocktail, 'cocktails-container'));
        }
    };

    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();
        updateDisplayedCocktails(searchTerm);
    });

    // Fetch cocktails by ingredients
    const getCocktailsFromIngredients = async (ingredients) => {
        if (!ingredients || ingredients.length === 0) return [];
        const queryString = ingredients.map(encodeURIComponent).join(',');
        try {
            const response = await fetch(`/api/cocktail?ingredients=${queryString}`);
            return await response.json() || [];
        } catch (error) {
            console.error('Error fetching cocktails by ingredients:', error);
            return [];
        }
    };

    // Handle (de-)selection of tags
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const tagText = tag.textContent.trim().toLowerCase();
            const tagSet = tag.getAttribute('data-tag-set');

            if (tagSet === '2') sortOrder = tagText;

            if (tagSet !== '0') {
                document.querySelectorAll(`.tag[data-tag-set='${tagSet}']`).forEach(otherTag => {
                    if (otherTag !== tag) {
                        otherTag.classList.remove("selected");
                        selectedTags.delete(otherTag.textContent.trim().toLowerCase());
                    }
                });
            }

            if (selectedTags.has(tagText) && tagSet) {
                tag.classList.remove("selected");
                selectedTags.delete(tagText);
            } else if (tagSet) {
                tag.classList.add("selected");
                selectedTags.add(tagText);
            }
        });
    });

    // Filter cocktails
    const filterCocktails = async () => {
        const selectedRating = parseFloat(ratingSlider.value);
        let ingredientMatchedCocktails = allCocktails;

        if (selectedIngredients.size > 0) {
            const ingredientMatchResponse = await getCocktailsFromIngredients(Array.from(selectedIngredients));
            ingredientMatchedCocktails = ingredientMatchResponse.map(cocktail => cocktail.id);
        }

        const filtered = allCocktails.filter(cocktail => {
            const isAlcoholicMatch = !selectedTags.has('alcoholic') || cocktail.alcoholic.toLowerCase() === 'alcoholic';
            const isNonAlcoholicMatch = !selectedTags.has('non alcoholic') || cocktail.alcoholic.toLowerCase() === 'non alcoholic';
            const selectedCategoryTags = Array.from(selectedTags).filter(tag => !['alcoholic', 'non alcoholic', 'asc', 'desc', 'top rated'].includes(tag));
            const isCategoryMatch = selectedCategoryTags.length === 0 || selectedCategoryTags.some(tag => cocktail.category.toLowerCase().includes(tag));
            const isIngredientMatch = selectedIngredients.size === 0 || ingredientMatchedCocktails.includes(cocktail.id);
            const isRatingMatch = cocktail.rating >= selectedRating;
            return isAlcoholicMatch && isNonAlcoholicMatch && isCategoryMatch && isIngredientMatch && isRatingMatch;
        });

        filtered.sort((a, b) => {
            if (sortOrder === 'asc') return a.name.localeCompare(b.name);
            if (sortOrder === 'desc') return b.name.localeCompare(a.name);
            if (sortOrder === 'top rated') return b.rating - a.rating;
        });

        return filtered;
    };

    const applyFilter = async () => {
        while (isLoading) await new Promise(resolve => setTimeout(resolve, 500));
        cocktailsContainer.innerHTML = '';

        const filteredCocktails = await filterCocktails();
        if (filteredCocktails.length === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found";
            noResultsMessage.classList.add("no-results-text");
            cocktailsContainer.appendChild(noResultsMessage);
        } else {
            filteredCocktails.forEach(appendCocktailFromDb);
        }
    };

    document.querySelectorAll("#sidebar .tag")
        .forEach(tag => tag.addEventListener("click", applyFilter));
    ratingSlider.addEventListener("change", applyFilter);

    const updateIngredientTags = (searchTerm) => {
        if (!ingredientTagsContainer) {
            console.error("Ingredient tags container not found");
            return;
        }

        ingredientTagsContainer.innerHTML = '';

        const createIngredientTag = (ingredient, isSelected) => {
            const ingredientTag = document.createElement("span");
            ingredientTag.classList.add("tag");
            if (isSelected) ingredientTag.classList.add("selected");
            ingredientTag.textContent = ingredient.toLowerCase();

            ingredientTag.addEventListener("click", () => {
                if (selectedIngredients.has(ingredient)) {
                    ingredientTag.classList.remove("selected");
                    selectedIngredients.delete(ingredient);
                } else {
                    ingredientTag.classList.add("selected");
                    selectedIngredients.add(ingredient);
                }
                updateIngredientTags(searchTerm);
                applyFilter();
            });

            ingredientTagsContainer.appendChild(ingredientTag);
        };

        selectedIngredients.forEach(ingredient => createIngredientTag(ingredient, true));

        if (searchTerm === '') return;

        const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
        const matchingIngredients = Array.from(allIngredients).filter(ingredient =>
            ingredient.toLowerCase().includes(lowercaseSearchTerm) && !selectedIngredients.has(ingredient.toLowerCase())
        );

        matchingIngredients.forEach(ingredient => createIngredientTag(ingredient, false));

        if (matchingIngredients.length === 0 && selectedIngredients.size === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found";
            noResultsMessage.classList.add("no-results-text");
            ingredientTagsContainer.appendChild(noResultsMessage);
        }
    };

    ingredientSearchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();
        updateIngredientTags(searchTerm);
    });
});