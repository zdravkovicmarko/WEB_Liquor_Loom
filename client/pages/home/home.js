document.addEventListener("DOMContentLoaded", () => {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");
    const cocktailsContainer = document.querySelector(".cocktails-container");

    // Initialize the slide value display
    slideValue.innerText = "≥ " + range.value;
    console.log("Initial slider value:", range.value); // Log initial value

    // Function to update slide value and log it to the console
    const updateSlideValue = (value) => {
        value === "5" ? slideValue.innerText = value : slideValue.innerText = "≥ " + value;
        console.log("Updated slider value:", value);
    };

    // Add event listener directly in JavaScript
    range.addEventListener("input", (event) => {
        updateSlideValue(event.target.value);
    });

    // Fetch cocktail data from the /allrecipes endpoint
    fetch('/allrecipes')
        .then(response => response.json())
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
        cocktailTitleLabel.textContent = cocktail.name;

        // Create img element for cocktail image
        const cocktailImg = document.createElement("img");
        cocktailImg.classList.add("cocktail-img");
        cocktailImg.src = cocktail.thumbnail;
        cocktailImg.alt = cocktail.name;

        // Append title & image to cocktail container
        cocktailContainer.appendChild(cocktailTitleLabel);
        cocktailContainer.appendChild(cocktailImg);

        // Append cocktail container to cocktails-container in DOM
        cocktailsContainer.appendChild(cocktailContainer);
    };
});


/*
// Example cocktail objects
const cocktail1 = {
    id: 1,
    name: "Mojito",
    url: "https://www.thecocktaildb.com/images/media/drink/rxtqps1478251029.jpg"
};
const cocktail2 = {
    id: 2,
    name: "Old Fashioned",
    url: "https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg"
};
const cocktail3 = {
    id: 3,
    name: "Long Island Tea",
    url: "https://www.thecocktaildb.com/images/media/drink/wx7hsg1504370510.jpg"
};
const cocktail4 = {
    id: 4,
    name: "Negroni",
    url: "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg"
};
const cocktail5 = {
    id: 5,
    name: "Whiskey Sour",
    url: "https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg"
};
const cocktail6 = {
    id: 6,
    name: "Dry Martini",
    url: "https://www.thecocktaildb.com/images/media/drink/6ck9yi1589574317.jpg"
};
const cocktail7 = {
    id: 7,
    name: "Planter's Punch",
    url: "https://www.thecocktaildb.com/images/media/drink/jn6o251643844541.jpg"
};
const cocktail8 = {
    id: 8,
    name: "Gin Lemon",
    url: "https://www.thecocktaildb.com/images/media/drink/6gdohq1681212476.jpg"
};
const cocktail9 = {
    id: 9,
    name: "Daiquiri",
    url: "https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg"
};
const cocktail10 = {
    id: 10,
    name: "Cocktail Horse’s Neck",
    url: "https://www.thecocktaildb.com/images/media/drink/4vobt21643844913.jpg"
};
const cocktail11 = {
    id: 11,
    name: "Black Russian",
    url: "https://www.thecocktaildb.com/images/media/drink/8oxlqf1606772765.jpg"
};
const cocktail12 = {
    id: 12,
    name: "Kiwi Lemon",
    url: "https://www.thecocktaildb.com/images/media/drink/tpupvr1478251697.jpg"
};
const cocktail13 = {
    id: 1,
    name: "Mojito",
    url: "https://www.thecocktaildb.com/images/media/drink/rxtqps1478251029.jpg"
};
const cocktail14 = {
    id: 2,
    name: "Old Fashioned",
    url: "https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg"
};
const cocktail15 = {
    id: 3,
    name: "Long Island Tea",
    url: "https://www.thecocktaildb.com/images/media/drink/wx7hsg1504370510.jpg"
};
const cocktail16 = {
    id: 4,
    name: "Negroni",
    url: "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg"
};
const cocktail17 = {
    id: 5,
    name: "Whiskey Sour",
    url: "https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg"
};
const cocktail18 = {
    id: 6,
    name: "Dry Martini",
    url: "https://www.thecocktaildb.com/images/media/drink/6ck9yi1589574317.jpg"
};
const cocktail19 = {
    id: 7,
    name: "Planter's Punch",
    url: "https://www.thecocktaildb.com/images/media/drink/jn6o251643844541.jpg"
};
const cocktail20 = {
    id: 8,
    name: "Gin Lemon",
    url: "https://www.thecocktaildb.com/images/media/drink/6gdohq1681212476.jpg"
};
const cocktail21 = {
    id: 9,
    name: "Daiquiri",
    url: "https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg"
};
const cocktail22 = {
    id: 10,
    name: "Cocktail Horse’s Neck",
    url: "https://www.thecocktaildb.com/images/media/drink/4vobt21643844913.jpg"
};
const cocktail23 = {
    id: 11,
    name: "Black Russian",
    url: "https://www.thecocktaildb.com/images/media/drink/8oxlqf1606772765.jpg"
};
const cocktail24 = {
    id: 12,
    name: "Kiwi Lemon",
    url: "https://www.thecocktaildb.com/images/media/drink/tpupvr1478251697.jpg"
};

// List of cocktails
const cocktailList =
    [cocktail1, cocktail2, cocktail3, cocktail4,
    cocktail5, cocktail6, cocktail7, cocktail8,
    cocktail9, cocktail10, cocktail11, cocktail12,
    cocktail13, cocktail14, cocktail15, cocktail16,
    cocktail15, cocktail16, cocktail17, cocktail18,
    cocktail19, cocktail20, cocktail21, cocktail22,
    cocktail23, cocktail24];

// Append each cocktail to the container
cocktailList.forEach(cocktail => appendCocktail(cocktail));
 */