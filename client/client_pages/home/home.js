import {
    appendCocktailFromDb,
    checkLoginStatus,
    displayMessage,
    handleProfileClick,
    logoutBtnHandling,
    slideValue
} from '/client/base.js';

logoutBtnHandling();

document.addEventListener("DOMContentLoaded", () => {
    const randomContainer = document.getElementById("random-button");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const searchInput = document.getElementById("search");
    const ingredientSearchInput = document.getElementById("search-ingredients");
    const ingredientTagsContainer = document.querySelector(".element-inner-container.ingredients");
    const tagElements = document.querySelectorAll("#sidebar .tag");
    const ratingSlider = document.getElementById('slide');
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
    slideValue(true, "-", 0);

    const fetchCocktailsFromBackend = async () => {
        try {
            const response = await fetch('/cocktails');
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching cocktails:', error);
            return [];
        }
    };

    const displayInitialCocktails = async () => {
        isLoading = true;
        const alertFetch = document.getElementById('alert-fetch-data');
        displayMessage(alertFetch, 'Currently fetching cocktails...', 1000000);
        try {
            // Fetch cocktails from BE-DB
            allCocktails = await fetchCocktailsFromBackend();
            const cocktailsWithRatings = [];

            if (allCocktails.length > 0) {
                displayMessage(alertFetch, '', 0);
                for (let cocktail of allCocktails) {
                    const rating = await appendCocktailFromDb(cocktail, 'cocktails-container');
                    cocktailsWithRatings.push({ ...cocktail, rating });
                }
                allCocktails = cocktailsWithRatings; // Store cocktails with ratings
            }

            allIngredients = await getAllIngredients();
        } catch (error) {
            console.error('Error displaying initial cocktails:', error);
            const alertFetchError = document.getElementById('alert-fetch-error');
            if (error.message === 'Failed to fetch') {
                displayMessage(alertFetchError, 'Too many requests. Please wait a few seconds and refresh the page!', 10000);
            } else {
                displayMessage(alertFetchError, 'Error displaying initial cocktails.', 6000);
            }
        } finally {
            isLoading = false;
            displayMessage(alertFetch, '', 0);
        }
    };


    // Display all cocktails initially
    displayInitialCocktails();

    const getAllIngredients = async () => {
        try {
            const response = await fetch('/api/getAllIngredients');
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching random cocktail:', error);
        }
    };

    // Redirect to random recipe
    const redirectToRandomRecipe = async () => {
        try {
            // Fetch a random cocktail
            const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
            const data = await response.json();
            const randomCocktailID = data.drinks[0].idDrink;

            window.location.href = `/recipe/${randomCocktailID}?fromRandom=true`;
        } catch (error) {
            console.error('Error fetching random cocktail:', error);
        }
    };

    randomContainer.addEventListener('click', redirectToRandomRecipe, testPost);

    function testPost() {
        const token = localStorage.getItem('token');
        console.log('Token:', token); // Debugging: Stellen Sie sicher, dass der Token vorhanden ist

        fetch('/add-cocktail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}` // assuming the token is stored in localStorage
            },
            body: JSON.stringify({
                id: '20202020', // unique identifier for the cocktail
                name: 'Margarita',
                category: 'Cocktail',
                alcoholic: 'Alcoholic',
                glass: 'Cocktail glass',
                instructions: 'Rub the rim of the glass with the lime slice to make the salt stick to it. Take care to moisten only the outer rim and sprinkle the salt on it. The salt should present to the lips of the imbiber and never mix into the cocktail. Shake the other ingredients with ice, then carefully pour into the glass.',
                thumbnail: 'https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg',
                ingredients: [
                    'Tequila',
                    'Triple sec',
                    'Lime juice',
                    'Salt'
                ],
                measures: [
                    '1 1/2 oz',
                    '1/2 oz',
                    '1 oz',
                    '1 pinch'
                ]
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        console.error('Response JSON:', error); // Debugging: Anzeigen der JSON-Antwort
                        throw new Error(error.error); // Hier wird der Fehler weitergegeben
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Cocktail added successfully:', data);
            })
            .catch(error => {
                console.error('Error adding cocktail:', error);
            });
    }
    // Filter cocktails based on search term
    const filterCocktailsByName = (searchTerm) => {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        return allCocktails.filter(cocktail => cocktail.name.toLowerCase().includes(lowercaseSearchTerm));
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
                filteredCocktails.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortOrder === 'desc') {
                filteredCocktails.sort((a, b) => b.name.localeCompare(a.name));
            } else if (sortOrder === 'rating') {
                filteredCocktails.sort((a, b) => b.rating - a.rating); // Sort by rating
            }

            filteredCocktails.forEach(cocktail => appendCocktailFromDb(cocktail, 'cocktails-container'));
        }
    };

    // Event listener for input events on the search input field
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();
        updateDisplayedCocktails(searchTerm);
    });

    const getCocktailsFromIngredients = async (ingredients) => {
        try {
            if (!ingredients || ingredients.length === 0) return [];
            const queryString = ingredients.map(encodeURIComponent).join(',');
            const response = await fetch(`/api/cocktail?ingredients=${queryString}`);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Error fetching cocktails by ingredients:', error);
            return [];
        }
    };

    // Handle (de-)selection of tags visually & for filter method
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const tagText = tag.textContent.trim().toLowerCase();
            const tagSet = tag.getAttribute('data-tag-set');

            // Sets order type for filter method
            if (tagSet === '2') {
                sortOrder = tagText; // Sets order type for filter method
            }

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

    // Filter cocktails based on selected tags, ingredients, and rating (BE)
    const filterCocktails = async () => {
        // Get the selected rating value from the slider
        const selectedRating = parseFloat(ratingSlider.value);

        let ingredientMatchedCocktails = allCocktails;

        if (selectedIngredients.size > 0) {
            const ingredientMatchResponse = await getCocktailsFromIngredients(Array.from(selectedIngredients));
            ingredientMatchedCocktails = ingredientMatchResponse.map(cocktail => cocktail.id);
        }

        const filtered = allCocktails.filter(cocktail => {
            const isAlcoholicMatch = !selectedTags.has('alcoholic') || cocktail.alcoholic.toLowerCase() === 'alcoholic';
            const isNonAlcoholicMatch = !selectedTags.has('non alcoholic') || cocktail.alcoholic.toLowerCase() === 'non alcoholic';

            const selectedCategoryTags = Array.from(selectedTags).filter(tag => tag !== 'alcoholic' && tag !== 'non alcoholic' && tag !== 'asc' && tag !== 'desc' && tag !== 'top rated');

            const isCategoryMatch = selectedCategoryTags.length === 0 || selectedCategoryTags.some(tag =>
                cocktail.category.toLowerCase().includes(tag)
            );

            const isIngredientMatch = selectedIngredients.size === 0 || ingredientMatchedCocktails.includes(cocktail.id);
            const isRatingMatch = cocktail.rating >= selectedRating;

            return isAlcoholicMatch && isNonAlcoholicMatch && isCategoryMatch && isIngredientMatch && isRatingMatch;
        });

        // Sort filtered results
        filtered.sort((a, b) => {
            if (sortOrder === 'asc') return a.name.localeCompare(b.name);
            if (sortOrder === 'desc') return b.name.localeCompare(a.name);
            if (sortOrder === 'top rated') return b.rating - a.rating;
        });
        return filtered;
    };

    // Apply filter (FE)
    const applyFilter = async () => {
        // Wait until isLoading becomes false to filter
        while (isLoading) { await new Promise(resolve => setTimeout(resolve, 500)); }

        console.log('Applying filter');
        cocktailsContainer.innerHTML = '';

        const filteredCocktails = await filterCocktails();

        if (filteredCocktails.length === 0) {
            console.log('No results found');
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found";
            noResultsMessage.classList.add("no-results-text");
            cocktailsContainer.appendChild(noResultsMessage);
        } else {
            filteredCocktails.forEach(appendCocktailFromDb);
        }
    };

    // Add event listeners to all tag elements
    tagElements.forEach(tag => {
        tag.addEventListener("click", applyFilter);
    });

    // Add event listener to slider's value change
    if (ratingSlider) { ratingSlider.addEventListener("change", applyFilter); }

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
            ingredientTag.textContent = ingredient.toLowerCase();

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
                applyFilter();
            });

            ingredientTagsContainer.appendChild(ingredientTag);
        };

        selectedIngredients.forEach(ingredient => createIngredientTag(ingredient, true));

        if (searchTerm === '') return;

        const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
        const matchingIngredients = Array.from(allIngredients).filter(ingredient => {
            const lowerCaseIngredient = ingredient.toLowerCase();
            return lowerCaseIngredient.includes(lowercaseSearchTerm) && !selectedIngredients.has(ingredient);
        });

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

document.addEventListener('DOMContentLoaded', function () {
    const SuccessMessage = document.getElementById('alert-success');

    // Check if the logoutSuccess flag is set in localStorage
    if (localStorage.getItem('logoutSuccess') === 'true') {
        displayMessage(SuccessMessage, 'Successfully logged out!', 3000);

        // Remove the flag from localStorage
        localStorage.removeItem('logoutSuccess');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const SuccessMessage = document.getElementById('alert-success');

    // Check if the deleteSuccess flag is set in localStorage
    if (localStorage.getItem('deleteSuccess') === 'true') {
        displayMessage(SuccessMessage, 'Account successfully deleted!', 3000);

        // Remove the flag from localStorage
        localStorage.removeItem('deleteSuccess');
    }
});

// Event listeners for navigation
document.getElementById('logo-container').addEventListener('click', function() {
    window.location.href = '/home';
});
document.getElementById('login-btn').addEventListener('click', function() {
    window.location.href = '/login';
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    checkLoginStatus();

    document.getElementById('profile-btn').addEventListener('click', handleProfileClick);
});