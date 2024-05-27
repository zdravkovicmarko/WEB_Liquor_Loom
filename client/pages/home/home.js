document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");

    // Initialize the slide value display
    slideValue.innerText = "★ " + range.value + " - 5";
    console.log("Initial slider value:", range.value); // Log initial value

    // Function to update slide value and log it to the console
    const updateSlideValue = (value) => {
        value === "5" ? slideValue.innerText = "★ " + value : slideValue.innerText = "★ " + value + " - 5";
        console.log("Updated slider value:", value);
    };

    // Add event listener directly in JavaScript
    range.addEventListener("input", (event) => {
        updateSlideValue(event.target.value);
    });

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
        console.log("Cocktail:", cocktail);
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

        // Add event listener to each cocktail element
        cocktailContainer.addEventListener("click", () => {
            // Redirect to recipe page with the appropriate recipe ID
            window.location.href = `/recipe/${cocktail.idDrink}`;
        });

        // Append title & image to cocktail container
        cocktailContainer.appendChild(cocktailTitleLabel);
        cocktailContainer.appendChild(cocktailImg);

        // Append cocktail container to cocktails-container in DOM
        cocktailsContainer.appendChild(cocktailContainer);
    };
});
