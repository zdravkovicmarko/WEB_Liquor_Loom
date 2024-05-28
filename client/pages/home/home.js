document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");
    let isLoading = false;
    let offset = 0;
    const initialLimit = 24;
    const intervalLimit = 40;

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
            } else {
                // Deselect tags in same set
                document.querySelectorAll(`.tag[tag-set="${tagSet}"]`).forEach(otherTag => {
                    otherTag.classList.remove("selected");
                });
                // Select clicked tag
                tag.classList.add("selected");
            }
        });
    });
    
    const fetchMoreCocktails = async (limit) => {
        if (isLoading) return;
        isLoading = true;

        try {
            const response = await fetch(`/api/allrecipes?offset=${offset}&limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cocktails = await response.json();
            cocktails.forEach(cocktail => appendCocktail(cocktail));
            offset += limit;
        } catch (error) {
            console.error('Error fetching cocktails:', error);
        } finally {
            isLoading = false;
        }
    };

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

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight && !isLoading) {
            fetchMoreCocktails(intervalLimit);
        }
    });

    // Fetch initial cocktails
    fetchMoreCocktails(initialLimit);

    // Continue fetching in intervals
    const intervalId = setInterval(() => {
        if (!isLoading) {
            fetchMoreCocktails(intervalLimit);
        }
    }, 2000);

    // Optional: clear the interval after a certain time or condition
    setTimeout(() => clearInterval(intervalId), 50000); // stops fetching after 30 seconds
});
