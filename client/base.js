export function displayMessage(element, text) {
    element.textContent = text;
    element.style.display = 'block';

    // Add the hidden class again after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000); // 5000 milliseconds = 5 seconds
}

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

export async function checkLoginStatus() {
    try {
        const response = await fetch('/login-status');
        const data = await response.json();

        if (data.loggedIn) {
            document.getElementById('login-btn').classList.add('hidden');
            document.getElementById('logout-btn').classList.remove('hidden');
        } else {
            document.getElementById('login-btn').classList.remove('hidden');
            document.getElementById('logout-btn').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

export async function handleProfileClick() {
    console.log('Profile picture clicked, checking login status...');
    try {
        window.location.href = '/profile';
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

export function slideValue(title, delimiter) {
    // Initialize slide value display
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");

    if (range && slideValue) {
        title ? slideValue.innerText = `Rating ( ★ ${range.value} ${delimiter} 5 )`: slideValue.innerText = `★ ${range.value} ${delimiter} 5`;

        const updateSlideValue = (value) => {
            if (title) {
                value === "5" ? slideValue.innerText = `Rating ( ★ ${value} )` : slideValue.innerText = `Rating ( ★ ${value} ${delimiter} 5 )`;
            } else {
                value === "5" ? slideValue.innerText = `★ ${value}` : slideValue.innerText = `★ ${value} ${delimiter} 5`;
            }
        };

        range.addEventListener("input", (event) => {
            updateSlideValue(event.target.value);
        });
    }
}

export async function updateCocktailRating() {
    const cocktailID = window.location.pathname.split('/').pop();

    try {
        const response = await fetch(`/api/cocktail/${cocktailID}/rating`);
        if (!response.ok) {
            console.error(`Failed to fetch rating: ${response.statusText}`);
            return 0; // Return 0 on fetch failure
        }
        let data = await response.json();
        console.log(data);

        // Handle null data
        if (data === null || data.averageRating === null) {
            return 0; // Return 0 if data or averageRating is null
        } else {
            return data.averageRating; // Return the rating value
        }
    } catch (error) {
        console.error('Error fetching rating:', error);
        return 0; // Return 0 on error
    }
}