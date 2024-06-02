export function displayMessage(element, text, timeout) {
    element.textContent = text;
    element.style.display = 'block';

    // Add hidden class again after defined time
    setTimeout(() => {
        element.style.display = 'none';
    }, timeout); // e.g.: 5000 ms = 5 s
}

export const appendCocktailFromAPI = (cocktail, containerId) => {
    let cocktailsContainer = document.getElementById(containerId);
    if (!cocktailsContainer) {
        cocktailsContainer = document.querySelector(".cocktails-container");
    }
    const cocktailContainer = document.createElement("div");
    cocktailContainer.classList.add("cocktail-container");

    const cocktailTitleLabel = document.createElement("label");
    cocktailTitleLabel.classList.add("cocktail-title-label");
    cocktailTitleLabel.textContent = cocktail.strDrink.replace(/(^|\s)\w/g, char => char.toUpperCase());

    const cocktailImg = document.createElement("img");
    cocktailImg.classList.add("cocktail-img");
    cocktailImg.src = cocktail.strDrinkThumb;
    cocktailImg.alt = cocktail.strDrink;

    cocktailContainer.appendChild(cocktailTitleLabel);
    cocktailContainer.appendChild(cocktailImg);

    cocktailsContainer.appendChild(cocktailContainer);

    // Add event listener to each cocktail element
    cocktailContainer.addEventListener("click", () => {
        // Redirect to recipe page with the appropriate recipe ID
        window.location.href = `/recipe/${cocktail.idDrink}`;
    });
}


export const appendCocktailFromDb = async (cocktail, containerId) => {
    let cocktailsContainer = document.getElementById(containerId);
    if (!cocktailsContainer) {
        cocktailsContainer = document.querySelector(".cocktails-container");
    }
    const cocktailContainer = document.createElement("div");
    cocktailContainer.classList.add("cocktail-container");

    if (cocktail.name && cocktail.thumbnail && cocktail.id) {
        const cocktailTitleLabel = document.createElement("label");
        cocktailTitleLabel.classList.add("cocktail-title-label");
        cocktailTitleLabel.textContent = cocktail.name.replace(/(^|\s)\w/g, char => char.toUpperCase());

        const cocktailImg = document.createElement("img");
        cocktailImg.classList.add("cocktail-img");
        cocktailImg.src = cocktail.thumbnail;
        cocktailImg.alt = cocktail.name;

        const cocktailRatingLabel = document.createElement("label");
        cocktailRatingLabel.classList.add("cocktail-rating-label");

        try {
            const rating = await updateCocktailRating(cocktail.id);
            cocktailRatingLabel.textContent = `★ ${rating}`;
            cocktail.rating = rating; // Add rating to the cocktail object
        } catch (error) {
            console.error('Error fetching rating:', error);
            cocktailRatingLabel.textContent = "★ 0.0";
            cocktail.rating = 0.0;
        }

        cocktailContainer.appendChild(cocktailTitleLabel);
        cocktailContainer.appendChild(cocktailRatingLabel);
        cocktailContainer.appendChild(cocktailImg);

        cocktailsContainer.appendChild(cocktailContainer);

        cocktailContainer.addEventListener("click", () => {
            window.location.href = `/recipe/${cocktail.id}`;
        });

        return cocktail.rating; // Return the rating
    } else {
        console.error('Incomplete cocktail data:', cocktail);
        return 0.0; // Return 0 rating if data is incomplete
    }
}

export async function appendCocktailById(cocktailId, containerId) {
    try {
        const response = await fetch(`/api/cocktail/${cocktailId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch cocktail with ID ${cocktailId}`);
        }
        const cocktail = await response.json();
        try {
            appendCocktailFromDb(cocktail, containerId);
        } catch (dbError) {
            console.error('Error appending cocktail from DB, falling back to API:', dbError);
            appendCocktailFromAPI(cocktail, containerId);
        }
    } catch (error) {
        console.error('Error fetching and appending cocktail:', error);
    }
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

export function slideValue(title, delimiter, initialValue) {
    // Initialize slide value display
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");

    if (range && slideValue) {
        if (title) {
            slideValue.innerText = initialValue === 5 ? `Rating ( ★ ${initialValue} )` : `Rating ( ★ ${initialValue} ${delimiter} 5 )`;
        } else {
            slideValue.innerText = initialValue === 5 ? `★ ${initialValue}` : `★ ${initialValue} ${delimiter} 5`;
        }

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

export async function updateCocktailRating(cocktailID) {
    try {
        const response = await fetch(`/api/cocktail/${cocktailID}/rating`);
        if (!response.ok) {
            console.error(`Failed to fetch rating: ${response.statusText}`);
            return "0.0"; // Return 0 on fetch failure
        }
        let data = await response.json();

        // Handle null data
        if (data === null || data.averageRating === null) {
            return "0.0"; // Return 0 if data or averageRating is null
        } else {
            return data.averageRating.toFixed(1); // Return the rating value
        }
    } catch (error) {
        console.error('Error fetching rating:', error);
        return "0.0"; // Return 0 on error
    }
}

export function logoutBtnHandling() {
    const logoutButton = document.getElementById('logout-btn');

    logoutButton.addEventListener('click', async function(event) {
        try {
            localStorage.setItem('logoutSuccess', 'true');
            window.location.href = '/logout';
        } catch (error) {
            console.error('Error:', error);
        }
    });
}