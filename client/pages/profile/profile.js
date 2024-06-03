import { logoutBtnHandling } from '/client/base.js';
import { appendCocktailById } from '/client/base.js';

// Event listeners for navigation
document.getElementById('logo-container').addEventListener('click', function() {
    window.location.href = '/home';
});

logoutBtnHandling();

// Function to fetch and display the user's favorite cocktail
async function displayFavoriteCocktail(userID) {
    try {
        const response = await fetch(`/api/user/${userID}/fav`);
        if (!response.ok) {
            console.error('Failed to fetch favorite cocktail');
            return;
        }
        const favData = await response.json();
        if (favData && favData.favoriteCocktailId) {
            const cocktailID = favData.favoriteCocktailId;
            await appendCocktailById(cocktailID, 'fav-cocktail-container');
            const placeholderIMG = document.getElementById('placeholder-fav');
            placeholderIMG.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching favorite cocktail:', error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Function to fetch and display profile data
    const displayProfile = async (userID) => {
        try {
            // Fetch username
            const usernameResponse = await fetch(`/api/user/${userID}/username`);
            const usernameData = await usernameResponse.json();
            document.getElementById('username').textContent = "@" + usernameData.username;

            // Fetch email
            const emailResponse = await fetch(`/api/user/${userID}/email`);
            const emailData = await emailResponse.json();
            document.getElementById('email').textContent = emailData.email;

            // Fetch password & make ****
            const passwordResponse = await fetch(`/api/user/${userID}/password`);
            const passwordData = await passwordResponse.json();
            const actualPassword = passwordData.password;
            document.getElementById('password').textContent = '*'.repeat(actualPassword.length);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    const response = await fetch(`/current-user`);
    const data = await response.json();
    const userID = data.userId;
    displayProfile(userID);
    displayFavoriteCocktail(userID);

    const profilePictures = {
        1: 'client/images/dummy-img/schmirko-pb.jpg',
        2: 'client/images/dummy-img/lisa-pb.jpg',
        3: 'client/images/dummy-img/schmortn-pb.jpg',
        4: 'client/images/dummy-img/masud-pb.png',
        5: 'client/images/dummy-img/sabimami-pb.jpg',
        6: 'client/images/dummy-img/sarma-pb.png'
    };

    const profilePictureSrc = profilePictures[userID];
    if (profilePictureSrc) {
        document.querySelector('.profile-picture').src = profilePictureSrc;
    }
});

document.getElementById('delete-btn').addEventListener('click', async function () {
    try {
        console.log('Delete button clicked.');

        // Fetch current user ID
        const userResponse = await fetch('/current-user');
        if (!userResponse.ok) {
            console.error(`Failed to fetch current user: ${userResponse.statusText}`);
            return;
        }
        const { userId } = await userResponse.json();

        // Fetch username for the user ID
        const usernameResponse = await fetch(`/api/user/${userId}/username`);
        if (!usernameResponse.ok) {
            console.error(`Failed to fetch username: ${usernameResponse.statusText}`);
            return;
        }
        const { username } = await usernameResponse.json();

        if (!username) {
            console.error('Username is null or undefined');
            return;
        }

        // Call the delete user endpoint
        const deleteResponse = await fetch(`/users/${username}`, { method: 'DELETE' });
        if (!deleteResponse.ok) {
            console.error(`Failed to delete user: ${deleteResponse.statusText}`);
            return;
        }

        // Set the flag indicating the user was deleted
        localStorage.setItem('deleteSuccess', 'true');

        // Redirect to home immediately after session destruction
        console.log('Session destroyed successfully. Redirecting to home.');
        window.location.href = '/home';
    } catch (error) {
        console.error('Error during delete operation:', error);
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    // Fetch current user ID
    const userResponse = await fetch('/current-user');
    if (!userResponse.ok) {
        console.error(`Failed to fetch current user: ${userResponse.statusText}`);
        return;
    }
    const { userId } = await userResponse.json();

    const actions = [
        { id: 'value-recommended', action: 'recommend' },
        { id: 'value-recommended-no', action: 'not_recommend' },
        { id: 'value-planned', action: 'pin' }
    ];

    let totalTasted = 0; // Initialize totalTasted counter
    let totalSum = 0;
    const counts = {}; // Object to store counts for each action

    for (const { id, action } of actions) {
        try {
            const response = await fetch(`/api/user/${userId}/action/${action}/count`);
            if (!response.ok) {
                console.error(`Failed to fetch ${action} count: ${response.statusText}`);
            }
            const data = await response.json();
            document.getElementById(id).textContent = data.count;
            counts[action] = data.count;
            if (action !== 'pin') { totalTasted += data.count; }
            totalSum += data.count;
        } catch (error) {
            console.error(`Error fetching count for ${action}:`, error);
        }
    }

    // Update value-tasted span with the sum of all counts
    document.getElementById('value-tasted').textContent = totalTasted.toString();

    // Calculate ratios for each action
    const ratios = {};
    for (const { action } of actions) { ratios[action] = counts[action] / totalSum; }

    if (totalSum !== 0) {
        // Set linear gradients dynamically based on ratios
        const container = document.querySelector('.stats-bar-container');
        container.style.background = `linear-gradient(90deg, 
            var(--green-50-opacity) 0%, var(--green-50-opacity) ${ratios['recommend'] * 100}%, 
            var(--red-50-opacity) ${ratios['recommend'] * 100}%, var(--red-50-opacity) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%, 
            var(--yellow-50-opacity) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%)`;

        const bar = document.querySelector('.stats-bar');
        bar.style.background = `linear-gradient(90deg, 
            var(--green) 0%, var(--green) ${ratios['recommend'] * 100}%, 
            var(--red) ${ratios['recommend'] * 100}%, var(--red) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%, 
            var(--yellow) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%)`;
    }

    // Fetch average rating of user
    try {
        const ratingResponse = await fetch(`/api/user/${userId}/average-rating`);
        if (!ratingResponse.ok) {
            console.error(`Failed to fetch average rating: ${ratingResponse.statusText}`);
        }
        const { averageRating } = await ratingResponse.json();
        document.getElementById('value-mean-rating').textContent = "★ " + averageRating.toFixed(1) + " / 5.0";
    } catch (error) {
        console.error('Error fetching average rating:', error);
    }

    function createLabel(text, id) {
        const label = document.createElement('label');
        label.classList.add('element-input', 'tags');
        label.id = id;
        label.name = id;
        label.textContent = text;

        if (id === 'email-tag') {
            label.classList.add('scrollbox');
            const tagsContent = document.createElement('div');
            tagsContent.classList.add('tags-content');
            label.appendChild(tagsContent);
            label.id = 'email';
        }

        return label;
    }

    function createInput(value, id) {
        const input = document.createElement('input');
        input.classList.add('element-input', 'tags', 'input-writable'); // Add input-writable class initially
        input.id = id;
        input.name = id;
        input.type = 'text';
        input.value = value;
        input.setAttribute('data-original-text', value);

        if (id === 'email-tag') {
            input.classList.add('scrollbox');
            const tagsContent = document.createElement('div');
            tagsContent.classList.add('tags-content');
            input.appendChild(tagsContent);
            input.id = 'email';
        }

        return input;
    }

    // Handle (de-)selection of edit btn
    let selectedBtn = new Set();
    const btnParts = document.querySelectorAll(".btn-edit");

    btnParts.forEach(btnPart => {
        btnPart.addEventListener("click", () => {
            const btnId = btnPart.id;
            const btnSet = btnPart.getAttribute('data-tag-set');
            const label = document.querySelector(`#${btnId}`).closest('.element-container').querySelector('.element-input');

            // Deselect other buttons in the same set
            btnParts.forEach(otherBtnPart => {
                const otherBtnSet = otherBtnPart.getAttribute('data-tag-set');
                if (otherBtnSet === btnSet && otherBtnPart !== btnPart) {
                    otherBtnPart.classList.remove("selected");
                    const otherLabel = otherBtnPart.closest('.element-container').querySelector('.element-input');
                    if (otherLabel.tagName === 'INPUT') {
                        const inputValue = otherLabel.value;
                        const originalText = otherLabel.getAttribute('data-original-text');
                        otherLabel.replaceWith(createLabel(inputValue || originalText, otherLabel.id));
                    }
                    selectedBtn.delete(otherBtnPart.id);
                }
            });

            // Handle (de-)selection of clicked button
            if (selectedBtn.has(btnId)) {
                btnPart.classList.remove("selected");
                if (label.tagName === 'INPUT') {
                    const inputValue = label.value;
                    const originalText = label.getAttribute('data-original-text');
                    label.replaceWith(createLabel(inputValue || originalText, label.id));
                }
                selectedBtn.delete(btnId);
            } else {
                btnPart.classList.add("selected");
                if (label.tagName === 'LABEL') {
                    const originalText = label.textContent;
                    label.replaceWith(createInput(originalText, label.id));
                }
                selectedBtn.add(btnId);
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', async function () {
    // Fetch current user ID
    const userResponse = await fetch('/current-user');
    if (!userResponse.ok) {
        console.error(`Failed to fetch current user: ${userResponse.statusText}`);
        return;
    }
    const { userId } = await userResponse.json();

    const actions = [
        { containerId: 'recommended-cocktails', action: 'recommend' },
        { containerId: 'not-recommended-cocktails', action: 'not_recommend' },
        { containerId: 'planned-cocktails', action: 'pin' }
    ];

    for (const { containerId, action } of actions) {
        try {
            const response = await fetch(`/api/user/${userId}/action/${action}/ids`);
            if (!response.ok) {
                console.error(`Failed to fetch ${action} IDs: ${response.statusText}`);
            }
            const data = await response.json();
            for (const cocktailId of data.cocktailIds) {
                await appendCocktailById(cocktailId, containerId);
            }
        } catch (error) {
            console.error(`Error fetching cocktail IDs for ${action}:`, error);
        }
    }
});