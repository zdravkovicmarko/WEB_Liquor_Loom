document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const filterButton = document.getElementById("filter-button");
    let selectedTag = null;
    let isLoading = false;

    // Initialize the slide value display
    slideValue.innerText = "★ " + range.value + " - 5";
    console.log("Initial slider value:", range.value);

    const updateSlideValue = (value) => {
        value === "5" ? slideValue.innerText = "★ " + value : slideValue.innerText = "★ " + value + " - 5";
        console.log("Updated slider value:", value);
    };

    range.addEventListener("input", (event) => {
        updateSlideValue(event.target.value);
    });

    // Handles selection of tags & tag sets
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        tag.addEventListener("click", () => {
            const tagSet = tag.getAttribute("tag-set");

            if (tag.classList.contains("selected")) {
                // Deselect selected tag
                tag.classList.remove("selected");
                selectedTag = null;
            } else {
                // Deselect tags in same set
                document.querySelectorAll(`.tag[tag-set="${tagSet}"]`).forEach(otherTag => {
                    otherTag.classList.remove("selected");
                });
                // Select clicked tag
                tag.classList.add("selected");
                selectedTag = tag.textContent.trim().toLowerCase();
            }
        });
    });

    const fetchCocktails = async (url) => {
        const response = await fetch(url);
        const data = await response.json();
        return data.drinks || [];
    };

    const applyFilter = async () => {
        if (isLoading || !selectedTag) return;
        isLoading = true;

        try {
            cocktailsContainer.innerHTML = ''; // Clear current cocktails
            let apiUrl = 'https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=';
            apiUrl += selectedTag === 'alcoholic' ? 'Alcoholic' : 'Non_Alcoholic';

            const cocktails = await fetchCocktails(apiUrl);
            cocktails.forEach(cocktail => appendCocktail(cocktail));
        } catch (error) {
            console.error('Error fetching and filtering cocktails:', error);
        } finally {
            isLoading = false;
        }
    };

    filterButton.addEventListener("click", applyFilter);

    const appendCocktail = (cocktail) => {
        console.log("Cocktail:", cocktail);
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
});
