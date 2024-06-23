// Display message for specified time
export function displayMessage(element, text, timeout) {
    element.innerHTML = text;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', timeout); // e.g.: 5000 ms = 5 s
}

// Display HTTP.cat error image from URL
export function displayErrorImg(url) {
    const errorImageContainer = document.getElementById('error-image-container');

    fetch(url, { mode: 'no-cors' })
        .then(() => {
            errorImageContainer.innerHTML = `<img src="${url}" alt="Error Image">`;
            errorImageContainer.classList.add('element-cat');
            errorImageContainer.style.display = 'block';
            setTimeout(() => errorImageContainer.style.display = 'none', 5000);
        })
        .catch(() => console.error('Failed to fetch error image from http.cat'));
}

// Append cocktail from API to container
export const appendCocktailFromAPI = (cocktail, containerId) => {
    const container = document.getElementById(containerId) || document.querySelector(".cocktails-container");
    const cocktailContainer = document.createElement("div");
    cocktailContainer.classList.add("cocktail-container");

    cocktailContainer.innerHTML = `
        <label class="cocktail-title-label">${cocktail.strDrink.replace(/(^|\s)\w/g, char => char.toUpperCase())}</label>
        <img class="cocktail-img" src="${cocktail.strDrinkThumb}" alt="${cocktail.strDrink}">
    `;

    container.appendChild(cocktailContainer);
    cocktailContainer.addEventListener("click", () => window.location.href = `/recipe/${cocktail.idDrink}`);
}

// Append cocktail from DB to container (with rating)
export const appendCocktailFromDb = async (cocktail, containerId) => {
    const container = document.getElementById(containerId) || document.querySelector(".cocktails-container");
    const cocktailContainer = document.createElement("div");
    cocktailContainer.classList.add("cocktail-container");

    if (cocktail.name && cocktail.thumbnail && cocktail.id) {
        const rating = await updateCocktailRating(cocktail.id).catch(error => {
            console.error('Error fetching rating:', error);
            return 0.0;
        });

        cocktailContainer.innerHTML = `
            <label class="cocktail-title-label">${cocktail.name.replace(/(^|\s)\w/g, char => char.toUpperCase())}</label>
            <label class="cocktail-rating-label">★ ${rating}</label>
            <img class="cocktail-img" src="${cocktail.thumbnail}" alt="${cocktail.name}">
        `;

        container.appendChild(cocktailContainer);
        cocktailContainer.addEventListener("click", () => window.location.href = `/recipe/${cocktail.id}`);
        return rating;
    } else {
        console.error('Incomplete cocktail data:', cocktail);
        return 0.0;
    }
}

// Fetch & append cocktail by ID
export async function appendCocktailById(cocktailId, containerId) {
    try {
        const response = await fetch(`/api/cocktail/${cocktailId}`);
        const cocktail = await response.json();
        await appendCocktailFromDb(cocktail, containerId).catch(() => {
            appendCocktailFromAPI(cocktail, containerId);
        });
    } catch (error) {
        console.error('Error fetching and appending cocktail:', error);
    }
}

// Check user login status & update UI
export async function checkLoginStatus() {
    try {
        const response = await fetch('/login-status');
        const data = await response.json();
        const isLoggedIn = data.loggedIn;

        document.getElementById('login-btn').classList.toggle('hidden', isLoggedIn);
        document.getElementById('logout-btn').classList.toggle('hidden', !isLoggedIn);
        document.getElementById('profile-btn').classList.toggle('hidden', !isLoggedIn);
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// Update & display slider value
export function slideValue(title, delimiter, initialValue) {
    const range = document.querySelector("#slide");
    const slideValue = document.querySelector(".slide-value");

    const updateSlideValue = value =>
        slideValue.innerText = title ?
            `Rating ( ★ ${value} ${value === "5" ? '' : `${delimiter} 5`} )`
            : `★ ${value} ${delimiter} 5`;

    if (range && slideValue) {
        updateSlideValue(initialValue);
        range.addEventListener("input", event => updateSlideValue(event.target.value));
    }
}

// Fetch & return cocktail rating
export async function updateCocktailRating(cocktailID) {
    try {
        const response = await fetch(`/api/cocktail/${cocktailID}/rating`);
        const data = await response.json();
        return data?.averageRating?.toFixed(1) || "0.0";
    } catch (error) {
        console.error('Error fetching rating:', error);
        return "0.0";
    }
}

// Handle basic redirection event handlers
export function basicRedirectionHandling(home = true, login = true, logout = true, profile = true) {
    if (home) document.getElementById('logo-container').addEventListener('click', () => window.location.href = '/home');
    if (login) document.getElementById('login-btn').addEventListener('click', () => window.location.href = '/login');
    if (profile) document.getElementById('profile-btn').addEventListener('click', () => window.location.href = '/profile');
    if (logout) {
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.setItem('logoutSuccess', 'true');
            window.location.href = '/logout';
        });
    }
}