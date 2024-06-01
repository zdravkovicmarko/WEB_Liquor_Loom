import { appendCocktail } from '/client/base.js';
import { checkLoginStatus } from '/client/base.js';
import { handleProfileClick } from '/client/base.js';
import { slideValue } from '/client/base.js';

document.addEventListener("DOMContentLoaded", () => {
    const randomContainer = document.getElementById("random-button");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const filterButton = document.getElementById("filter-button");
    const searchInput = document.getElementById("search");
    const ingredientSearchInput = document.getElementById("search-ingredients");
    const ingredientTagsContainer = document.querySelector(".element-inner-container.ingredients");
    let selectedTags = new Set();
    let selectedIngredients = new Set();
    let allCocktails = [];
    let isLoading = false;
    let sortOrder = 'asc';
    let allIngredients = new Set();

    const searchBarInput = document.getElementById('search');
    searchBarInput.addEventListener('input', function() {
        const searchBar = this.closest('.search-bar');
        this.value.trim() !== ''? searchBar.classList.add('input-hovered') : searchBar.classList.remove('input-hovered');
    });

    // Handle slide value
    slideValue(true,"-");

    const fetchCocktails = async (url) => {
        const response = await fetch(url);
        const data = await response.json();
        return data.drinks || [];
    };

    const fetchAllCocktails = async () => {
        const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
        for (const letter of alphabet) {
            const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`;
            const cocktails = await fetchCocktails(url);
            allCocktails.push(...cocktails);
        }
        allCocktails.forEach(cocktail => {
            for (let i = 1; i <= 15; i++) {
                const ingredient = cocktail[`strIngredient${i}`];
                if (ingredient) allIngredients.add(ingredient.toLowerCase());
            }
        });
    };

    const displayInitialCocktails = async () => {
        isLoading = true;

        try {
            await fetchAllCocktails();
            allCocktails.forEach(cocktail => appendCocktail(cocktail));
        } catch (error) {
            console.error('Error fetching initial cocktails:', error);
        } finally {
            isLoading = false;
        }
    };

    // Display all cocktails initially
    displayInitialCocktails();

    // Redirect to random recipe
    const redirectToRandomRecipe = async () => {
        try {
            // Fetch a random cocktail
            const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
            const data = await response.json();
            const randomCocktailID = data.drinks[0].idDrink;

            window.location.href = `/recipe/${randomCocktailID}`;
        } catch (error) {
            console.error('Error fetching random cocktail:', error);
        }
    };

    randomContainer.addEventListener('click', redirectToRandomRecipe);

    // Filter cocktails based on search term
    const filterCocktailsByName = (searchTerm) => {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        return allCocktails.filter(cocktail => cocktail.strDrink.toLowerCase().includes(lowercaseSearchTerm));
    };

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
                filteredCocktails.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
            } else if (sortOrder === 'desc') {
                filteredCocktails.sort((a, b) => b.strDrink.localeCompare(a.strDrink));
            }

            filteredCocktails.forEach(cocktail => appendCocktail(cocktail));
        }
    };

    // Event listener for input events on the search input field
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();
        updateDisplayedCocktails(searchTerm);
    });

    // Handle (de-)selection of tags visually & for filter method
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const tagText = tag.textContent.trim().toLowerCase();
            const tagSet = tag.getAttribute('data-tag-set');

            // Sets order type for filter method
            if (tagSet === '2') sortOrder = tagText;

            // Handles deselection of tags in same set
            if (tagSet !== '0') {
                const tagsInSameSet = document.querySelectorAll(`.tag[data-tag-set='${tagSet}']`);
                tagsInSameSet.forEach(otherTag => {
                    if (otherTag !== tag) {
                        otherTag.classList.remove("selected");
                        const otherTagText = otherTag.textContent.trim().toLowerCase();
                        selectedTags.delete(otherTagText);
                    }
                });
            }

            // Handles (de-)selection of clicked tag
            if (selectedTags.has(tagText) && tagSet) {
                tag.classList.remove("selected");
                selectedTags.delete(tagText);
            } else if (tagSet) {
                tag.classList.add("selected");
                selectedTags.add(tagText);
            }
        });
    });

    // Filter cocktails based on selected tags & ingredients (BE)
    const filterCocktails = () => {
        if (selectedTags.size === 0 && selectedIngredients.size === 0) {
            return allCocktails.sort((a, b) =>
                sortOrder === 'asc' ? a.strDrink.localeCompare(b.strDrink) : b.strDrink.localeCompare(a.strDrink)
            );
        }

        const selectedTagsArray = Array.from(selectedTags);
        const selectedAlcoholicTag = selectedTagsArray.includes('alcoholic');
        const selectedNonAlcoholicTag = selectedTagsArray.includes('non alcoholic');
        const selectedCategoryTags = selectedTagsArray
            .filter(tag => tag !== 'alcoholic' && tag !== 'non alcoholic' && tag !== 'asc' && tag !== 'desc');

        return allCocktails.filter(cocktail => {
            const isAlcoholicMatch = !selectedAlcoholicTag || cocktail.strAlcoholic.toLowerCase() === 'alcoholic';
            const isNonAlcoholicMatch = !selectedNonAlcoholicTag || cocktail.strAlcoholic.toLowerCase() === 'non alcoholic';
            const isCategoryMatch = selectedCategoryTags.length === 0 || selectedCategoryTags.includes(cocktail.strCategory.toLowerCase());

            const isIngredientMatch = Array.from(selectedIngredients).every(ingredient =>
                Object.keys(cocktail).some(key => cocktail[key] && cocktail[key].toLowerCase() === ingredient)
            );

            return isAlcoholicMatch && isNonAlcoholicMatch && isCategoryMatch && isIngredientMatch;
        }).sort((a, b) =>
            sortOrder === 'asc' ? a.strDrink.localeCompare(b.strDrink) : b.strDrink.localeCompare(a.strDrink)
        );
    };

    // Apply filter (FE)
    const applyFilter = () => {
        if (isLoading) return;

        cocktailsContainer.innerHTML = '';

        const filteredCocktails = filterCocktails();

        if (filteredCocktails.length === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found";
            noResultsMessage.classList.add("no-results-text");
            cocktailsContainer.appendChild(noResultsMessage);
        } else {
            filteredCocktails.forEach(appendCocktail);
        }
    };

    if (filterButton) filterButton.addEventListener("click", applyFilter);

    // Handle ingredient tags based on search input (FE & BE)
    const updateIngredientTags = (searchTerm) => {
        if (!ingredientTagsContainer) {
            console.error("Ingredient tags container not found");
            return;
        }

        ingredientTagsContainer.innerHTML = '';

        // Create ingredient tag (FE)
        const createIngredientTag = (ingredient, isSelected) => {
            const ingredientTag = document.createElement("span");
            ingredientTag.classList.add("tag");
            if (isSelected) ingredientTag.classList.add("selected");
            ingredientTag.textContent = ingredient;

            // Handle (de-)selection
            ingredientTag.addEventListener("click", () => {
                if (selectedIngredients.has(ingredient)) {
                    ingredientTag.classList.remove("selected");
                    selectedIngredients.delete(ingredient);
                } else {
                    ingredientTag.classList.add("selected");
                    selectedIngredients.add(ingredient);
                }
                updateIngredientTags(searchTerm);
            });

            ingredientTagsContainer.appendChild(ingredientTag);
        };

        selectedIngredients.forEach(ingredient => createIngredientTag(ingredient, true));

        if (searchTerm === '') return;

        const lowercaseSearchTerm = searchTerm.toLowerCase();
        const matchingIngredients = Array.from(allIngredients).filter(
            ingredient => ingredient.includes(lowercaseSearchTerm) && !selectedIngredients.has(ingredient)
        );

        matchingIngredients.forEach(ingredient => createIngredientTag(ingredient, false));

        if (matchingIngredients.length === 0 && selectedIngredients.size === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found";
            noResultsMessage.classList.add("no-results-text");
            ingredientTagsContainer.appendChild(noResultsMessage);
        }
    };

    // Event listener for input events on ingredient search input field
    ingredientSearchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();
        updateIngredientTags(searchTerm);
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

// Event listeners for navigation
document.getElementById('login-btn').addEventListener('click', function() {
    window.location.href = '/login';
});
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    checkLoginStatus();

    document.getElementById('profile-pic').addEventListener('click', handleProfileClick);
});