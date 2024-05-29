document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const filterButton = document.getElementById("filter-button");
    let selectedTags = new Set(); // Store selected tags
    let allCocktails = [];
    let isLoading = false;
    let sortOrder = 'asc'; // Default sort order

    // Initialize the slide value display
    if (range && slideValue) {
        slideValue.innerText = "★ " + range.value + " - 5";
        console.log("Initial slider value:", range.value);

        const updateSlideValue = (value) => {
            value === "5" ? slideValue.innerText = "★ " + value : slideValue.innerText = "★ " + value + " - 5";
            console.log("Updated slider value:", value);
        };

        range.addEventListener("input", (event) => {
            updateSlideValue(event.target.value);
        });
    }

    // Handles selection of tags
    const tags = document.querySelectorAll(".tag[tag-set='1']");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const tagText = tag.textContent.trim().toLowerCase();

            if (tagText === 'alcoholic' || tagText === 'non alcoholic') {
                // Handle alcoholic and non-alcoholic separately
                if (selectedTags.has(tagText)) {
                    // Deselect tag
                    tag.classList.remove("selected");
                    selectedTags.delete(tagText);
                } else {
                    // Deselect the other tag and select this one
                    const otherTagText = tagText === 'alcoholic' ? 'non alcoholic' : 'alcoholic';
                    tags.forEach(otherTag => {
                        if (otherTag.textContent.trim().toLowerCase() === otherTagText) {
                            otherTag.classList.remove("selected");
                            selectedTags.delete(otherTagText);
                        }
                    });
                    // Select tag
                    tag.classList.add("selected");
                    selectedTags.add(tagText);
                }
            } else {
                if (selectedTags.has(tagText)) {
                    // Deselect tag
                    tag.classList.remove("selected");
                    selectedTags.delete(tagText);
                } else {
                    // Select tag
                    tag.classList.add("selected");
                    selectedTags.add(tagText);
                }
            }
        });
    });

    // Handles selection of sort order
    const sortTags = document.querySelectorAll(".tag[tag-set='2']");
    sortTags.forEach(tag => {
        tag.addEventListener("click", () => {
            const tagText = tag.textContent.trim().toLowerCase();
            if (tagText === 'asc' || tagText === 'desc') {
                sortOrder = tagText;
                // Remove sorting order from selected tags
                selectedTags.delete('asc');
                selectedTags.delete('desc');
            } else {
                // Handle other tags if needed
            }
        });
    });

    const fetchCocktails = async (url) => {
        const response = await fetch(url);
        const data = await response.json();
        return data.drinks || [];
    };

    const fetchAllCocktails = async () => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        for (const letter of alphabet) {
            const url = `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`;
            const cocktails = await fetchCocktails(url);
            allCocktails.push(...cocktails);
        }
    };

    const filterCocktails = () => {
        if (selectedTags.size === 0) {
            // If no filter tags are selected
            if (sortOrder === 'asc') {
                // Sort alphabetically in ascending order
                allCocktails.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
            } else if (sortOrder === 'desc') {
                // Sort alphabetically in descending order
                allCocktails.sort((a, b) => b.strDrink.localeCompare(a.strDrink));
            }
            return allCocktails;
        }

        return allCocktails.filter(cocktail => {
            // Check if any selected tag matches the category
            const selectedAlcoholicTag = Array.from(selectedTags).find(tag => tag === 'alcoholic');
            const selectedNonAlcoholicTag = Array.from(selectedTags).find(tag => tag === 'non alcoholic');
            const selectedCategoryTags = Array.from(selectedTags).filter(tag => tag !== 'alcoholic' && tag !== 'non alcoholic');

            // Check if the cocktail matches both alcoholic/non-alcoholic and category criteria
            const matchesAlcoholicCriteria = selectedAlcoholicTag ? cocktail.strAlcoholic.toLowerCase() === 'alcoholic' : true;
            const matchesNonAlcoholicCriteria = selectedNonAlcoholicTag ? cocktail.strAlcoholic.toLowerCase() === 'non alcoholic' : true;
            const matchesCategoryCriteria = selectedCategoryTags.length === 0 || selectedCategoryTags.includes(cocktail.strCategory.toLowerCase());

            return matchesAlcoholicCriteria && matchesNonAlcoholicCriteria && matchesCategoryCriteria;
        });
    };



    const applyFilter = () => {
        if (isLoading) return;

        cocktailsContainer.innerHTML = ''; // Clear current cocktails

        const filteredCocktails = filterCocktails();
        if (filteredCocktails.length === 0) {
            // If no matches found, display a message
            const noResultsMessage = document.createElement("div");
            noResultsMessage.textContent = "No results found.";
            cocktailsContainer.appendChild(noResultsMessage);
        } else {
            // Sort the filtered cocktails based on the selected order
            if (sortOrder === 'asc') {
                filteredCocktails.sort((a, b) => a.strDrink.localeCompare(b.strDrink));
            } else if (sortOrder === 'desc') {
                filteredCocktails.sort((a, b) => b.strDrink.localeCompare(a.strDrink));
            }

            // If matches found, append cocktails
            filteredCocktails.forEach(cocktail => appendCocktail(cocktail));
        }
        console.log("Selected tags:", selectedTags);
        console.log("Sort order:", sortOrder);
        console.log("FilteredCocktails: ", filteredCocktails)
    };


    if (filterButton) {
        filterButton.addEventListener("click", applyFilter);
    }

    const appendCocktail = (cocktail) => {
        const cocktailContainer = document.createElement("div");
        cocktailContainer.classList.add("cocktail-container");

        const cocktailTitleLabel = document.createElement("label");
        cocktailTitleLabel.classList.add("cocktail-title-label");
        cocktailTitleLabel.textContent = cocktail.strDrink;

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
});