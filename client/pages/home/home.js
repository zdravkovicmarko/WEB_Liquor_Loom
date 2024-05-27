document.addEventListener("DOMContentLoaded", () => {
    const minRange = document.querySelector("#min-slide");
    const maxRange = document.querySelector("#max-slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");

    // Initialize the slide value display
    const updateSlideValue = () => {
        const minValue = minRange.value;
        const maxValue = maxRange.value;
        slideValue.innerText = `★ ${minValue} - ${maxValue}`;
        console.log("Updated slider value:", minValue, maxValue);
    };

    // Add event listeners to update the slide value
    minRange.addEventListener("input", () => {
        if (parseFloat(minRange.value) > parseFloat(maxRange.value)) {
            minRange.value = maxRange.value;
        }
        updateSlideValue();
    });

    maxRange.addEventListener("input", () => {
        if (parseFloat(maxRange.value) < parseFloat(minRange.value)) {
            maxRange.value = minRange.value;
        }
        updateSlideValue();
    });

    // Initialize display
    updateSlideValue();

    // Fetch cocktail data from the /allrecipes endpoint
    fetch('/allrecipes')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(cocktails => {
            cocktails.forEach(cocktail => appendCocktail(cocktail));
        })
        .catch(error => {
            console.error('Error fetching cocktails:', error);
        });

    const appendCocktail = (cocktail) => {
        // Create new div for cocktail container
        const cocktailContainer = document.createElement("div");
        cocktailContainer.classList.add("cocktail-container");

        // Create label for cocktail title
        const cocktailTitleLabel = document.createElement("label");
        cocktailTitleLabel.classList.add("cocktail-title-label");
        cocktailTitleLabel.textContent = cocktail.strDrink;

        // Create img element for cocktail image
        const cocktailImg = document.createElement("img");
        cocktailImg.classList.add("cocktail-img");
        cocktailImg.src = cocktail.strDrinkThumb;
        cocktailImg.alt = cocktail.strDrink;

        // Append title & image to cocktail container
        cocktailContainer.appendChild(cocktailTitleLabel);
        cocktailContainer.appendChild(cocktailImg);

        // Append cocktail container to cocktails-container in DOM
        cocktailsContainer.appendChild(cocktailContainer);
    };
});