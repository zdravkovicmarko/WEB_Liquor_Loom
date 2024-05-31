export const appendCocktail = (cocktail) => {
    const cocktailsContainer = document.querySelector(".cocktails-container");
    const cocktailContainer = document.createElement("div");
    cocktailContainer.classList.add("cocktail-container");

    const cocktailTitleLabel = document.createElement("label");
    cocktailTitleLabel.classList.add("cocktail-title-label");
    cocktailTitleLabel.textContent = cocktail.strDrink.replace(/(^|\s)\w/g, char => char.toUpperCase());

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
}