document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const filterButton = document.getElementById("filter-button");
    const searchInput = document.getElementById("search");
    const ingredientSearchInput = document.getElementById("search-ingredients");
    const ingredientTagsContainer = document.querySelector(".element-inner-container.ingredients"); // Update this to match the correct container
    let selectedTags = new Set();
    let selectedIngredients = new Set();
    let allCocktails = [];
    let isLoading = false;
    let sortOrder = 'asc';
    let allIngredients = new Set();

    // Initialize the slide value display
    if (range && slideValue) {
        slideValue.innerText = "★ " + range.value + " - 5";

        const updateSlideValue = (value) => {
            value === "5" ? slideValue.innerText = "★ " + value : slideValue.innerText = "★ " + value + " - 5";
        };

        range.addEventListener("input", (event) => {
            updateSlideValue(event.target.value);
        });
    }

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

    const appendCocktail = (cocktail) => {
        const cocktailContainer = document.createElement("div");
        cocktailContainer.classList.add("cocktail-container");

        const cocktailTitleLabel = document.createElement("label");
        cocktailTitleLabel.classList.add("cocktail-title-label");
        cocktailTitleLabel.textContent = cocktail.strDrink.replace(/\b\w/g, char => char.toUpperCase());

        const cocktailImg = document.createElement("img");
        cocktailImg.classList.add("cocktail-img");
        cocktailImg.src = cocktail.strDrinkThumb;
        cocktailImg.alt = cocktail.strDrink;

        const cocktailRatingLabel = document.createElement("label");
        cocktailRatingLabel.classList.add("cocktail-rating-label");
        cocktailRatingLabel.textContent = "★ " + (Math.random() * 50 / 10).toFixed(1);

        cocktailContainer.appendChild(cocktailTitleLabel);
        cocktailContainer.appendChild(cocktailRatingLabel);
        cocktailContainer.appendChild(cocktailImg);

        cocktailsContainer.appendChild(cocktailContainer);

        // Add event listener to each cocktail element
        cocktailContainer.addEventListener("click", () => {
            // Redirect to recipe page with the appropriate recipe ID
            window.location.href = `/recipe/${cocktail.idDrink}`;
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

    // Function to filter cocktails based on search term
    const filterCocktailsByName = (searchTerm) => {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        return allCocktails.filter(cocktail => cocktail.strDrink.toLowerCase().includes(lowercaseSearchTerm));
    };

    const updateDisplayedCocktails = (searchTerm) => {
        cocktailsContainer.innerHTML = '';

        const filteredCocktails = filterCocktailsByName(searchTerm);

        if (filteredCocktails.length === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found.";
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
            const tagSet = tag.getAttribute('tag-set');

            // Sets order type for filter method
            if (tagSet === '2') sortOrder = tagText;

            // Handles deselection of tags in same set
            if (tagSet !== '0') {
                const tagsInSameSet = document.querySelectorAll(`.tag[tag-set='${tagSet}']`);
                tagsInSameSet.forEach(otherTag => {
                    if (otherTag !== tag) {
                        otherTag.classList.remove("selected");
                        const otherTagText = otherTag.textContent.trim().toLowerCase();
                        selectedTags.delete(otherTagText);
                    }
                });
            }

            // Handles (de-)selection of clicked tag
            if (selectedTags.has(tagText)) {
                tag.classList.remove("selected");
                if (tagSet !== '2') selectedTags.delete(tagText);
            } else {
                tag.classList.add("selected");
                if (tagSet !== '2') selectedTags.add(tagText);
            }
        });
    });

    // Function to filter cocktails based on selected tags and ingredients
    const filterCocktails = () => {
        if (selectedTags.size === 0 && selectedIngredients.size === 0) {
            return allCocktails.sort((a, b) =>
                sortOrder === 'asc' ? a.strDrink.localeCompare(b.strDrink) : b.strDrink.localeCompare(a.strDrink)
            );
        }

        const selectedTagsArray = Array.from(selectedTags);
        const selectedAlcoholicTag = selectedTagsArray.includes('alcoholic');
        const selectedNonAlcoholicTag = selectedTagsArray.includes('non alcoholic');
        const selectedCategoryTags = selectedTagsArray.filter(tag => tag !== 'alcoholic' && tag !== 'non alcoholic');

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

    const applyFilter = () => {
        if (isLoading) return;

        cocktailsContainer.innerHTML = '';

        const filteredCocktails = filterCocktails();

        if (filteredCocktails.length === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found.";
            cocktailsContainer.appendChild(noResultsMessage);
        } else {
            filteredCocktails.forEach(appendCocktail);
        }
    };

    if (filterButton) filterButton.addEventListener("click", applyFilter);

    // Function to update ingredient tags based on search input
    const updateIngredientTags = (searchTerm) => {
        if (!ingredientTagsContainer) {
            console.error("Ingredient tags container not found");
            return;
        }

        ingredientTagsContainer.innerHTML = '';
        const lowercaseSearchTerm = searchTerm.toLowerCase();

        const matchingIngredients = Array.from(allIngredients).filter(ingredient =>
            ingredient.includes(lowercaseSearchTerm)
        );

        matchingIngredients.forEach(ingredient => {
            const ingredientTag = document.createElement("span");
            ingredientTag.classList.add("tag");
            ingredientTag.textContent = ingredient;
            if (selectedIngredients.has(ingredient)) {
                ingredientTag.classList.add("selected");
            }

            ingredientTag.addEventListener("click", () => {
                if (selectedIngredients.has(ingredient)) {
                    ingredientTag.classList.remove("selected");
                    selectedIngredients.delete(ingredient);
                } else {
                    ingredientTag.classList.add("selected");
                    selectedIngredients.add(ingredient);
                }
            });

            ingredientTagsContainer.appendChild(ingredientTag);
        });

        if (matchingIngredients.length === 0) {
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found.";
            ingredientTagsContainer.appendChild(noResultsMessage);
        }
    };

    // Event listener for input events on the ingredient search input field
    ingredientSearchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.trim();
        updateIngredientTags(searchTerm);
    });
});