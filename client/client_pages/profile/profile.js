import {
    appendCocktailById,
    displayMessage,
    basicRedirectionHandling
} from '/client/base.js';

basicRedirectionHandling(true, false, true, false);

const alertError = document.getElementById('alert-error');
const alertSuccess = document.getElementById('alert-success');

// Display user data
async function displayUserData(userID) {
    try {
        const [usernameData, emailData, passwordData] = await Promise.all([
            fetch(`/api/user/${userID}/username`).then(res => res.json()),
            fetch(`/api/user/${userID}/email`).then(res => res.json()),
            fetch(`/api/user/${userID}/password`).then(res => res.json())
        ]);

        document.getElementById('username').textContent = usernameData.username;
        document.getElementById('email').textContent = emailData.email;
        document.getElementById('password').textContent = '*'.repeat(passwordData.password.length);
    } catch (error) {
        console.error('Error fetching profile data:', error);
    }
}

// Display user's favorite cocktail
async function displayUserFav(userID) {
    try {
        const response = await fetch(`/api/user/${userID}/fav`);
        if (response.ok) {
            const { favoriteCocktailId } = await response.json();
            if (favoriteCocktailId) {
                await appendCocktailById(favoriteCocktailId, 'fav-cocktail-container');
                document.getElementById('placeholder-fav').style.display = 'none';
            }
        } else {
            console.error('Failed to fetch favorite cocktail');
        }
    } catch (error) {
        console.error('Error fetching favorite cocktail:', error);
    }
}

// Display user's statistics
async function displayUserStats(userID) {
    const actions = [
        { id: 'value-recommended', action: 'recommend' },
        { id: 'value-recommended-no', action: 'not_recommend' },
        { id: 'value-planned', action: 'pin' }
    ];

    let totalTasted = 0;
    let totalSum = 0;
    const counts = {};

    // Handle extraction of totalTasted & totalSum
    for (const { id, action } of actions) {
        try {
            const { count } = await fetch(`/api/user/${userID}/action/${action}/count`).then(res => res.json());
            document.getElementById(id).textContent = count;
            counts[action] = count;
            if (action !== 'pin') totalTasted += count;
            totalSum += count;
        } catch (error) {
            console.error(`Error fetching count for ${action}:`, error);
        }
    }
    document.getElementById('value-tasted').textContent = totalTasted.toString();

    // Handle stats bar
    if (totalSum) {
        const ratios = {};
        actions.forEach(({ action }) => ratios[action] = counts[action] / totalSum);

        const container = document.querySelector('.stats-bar-container');
        const bar = document.querySelector('.stats-bar');

        container.style.background = `linear-gradient(90deg, 
            var(--green-50-opacity) 0%, var(--green-50-opacity) ${ratios['recommend'] * 100}%, 
            var(--red-50-opacity) ${ratios['recommend'] * 100}%, var(--red-50-opacity) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%, 
            var(--yellow-50-opacity) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%)`;

        bar.style.background = `linear-gradient(90deg, 
            var(--green) 0%, var(--green) ${ratios['recommend'] * 100}%, 
            var(--red) ${ratios['recommend'] * 100}%, var(--red) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%, 
            var(--yellow) ${(ratios['recommend'] + ratios['not_recommend']) * 100}%)`;
    }

    // Fetch user's average rating
    try {
        const { averageRating } = await fetch(`/api/user/${userID}/average-rating`).then(res => res.json());
        document.getElementById('value-mean-rating').textContent = `★ ${averageRating.toFixed(1)} / 5.0`;
    } catch (error) {
        console.error('Error fetching average rating:', error);
    }
}

// Display user's cocktail interactions
async function displayUserActions(userID) {
    const actions = [
        { containerId: 'recommended-cocktails', action: 'recommend' },
        { containerId: 'not-recommended-cocktails', action: 'not_recommend' },
        { containerId: 'planned-cocktails', action: 'pin' }
    ];

    for (const { containerId, action } of actions) {
        try {
            const { cocktailIds } = await fetch(`/api/user/${userID}/action/${action}/ids`).then(res => res.json());
            for (const cocktailId of cocktailIds) {
                await appendCocktailById(cocktailId, containerId);
            }
        } catch (error) {
            console.error(`Error fetching cocktail IDs for ${action}:`, error);
        }
    }
}

// Fetch current user ID & display profile, favorite cocktail, stats & actions
document.addEventListener("DOMContentLoaded", async () => {
    const { userId } = await fetch('/current-user').then(res => res.json());
    await Promise.all([
        displayUserData(userId),
        displayUserFav(userId),
        displayUserStats(userId),
        displayUserActions(userId)
    ]);
});

// Handle user data editing
document.addEventListener('DOMContentLoaded', async () => {
    const { userId } = await fetch('/current-user').then(res => res.json());
    const selectedBtn = new Set();
    const btnParts = document.querySelectorAll(".btn-edit");

    // Create & return label element (not writable) displaying current user data
    const createLabel = async (id) => {
        const label = document.createElement('label');
        label.classList.add('element-input', 'tags');
        label.id = id;
        label.name = id;

        try {
            const data = await fetch(`/api/user/${userId}/${id}`).then(res => res.json());
            label.textContent = id === 'password' ? '*'.repeat(data[id].length) : data[id];
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        return label;
    };

    // Create & return input element (writable) pre-filled with current user data
    const createInput = async (id) => {
        const input = document.createElement('input');
        input.classList.add('element-input', 'tags', 'input-writable');
        input.id = id;
        input.name = id;
        input.type = 'text';

        try {
            const data = await fetch(`/api/user/${userId}/${id}`).then(res => res.json());
            input.value = data[id];
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        input.setAttribute('data-original-text', input.value);
        return input;
    };

    // Update user data on server & display success / error message
    const updateUserData = async (userId, userData) => {
        try {
            const response = await fetch(`/user/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                displayMessage(alertSuccess, 'User info successfully updated!', 3000);
                return response.json();
            } else {
                const errorData = await response.json();
                displayMessage(alertError, errorData.error, 5000);
            }
        } catch (error) {
            console.error('Error updating user data:', error);
            displayMessage(alertError, 'An error occurred while updating the user data. Please try again later.', 10000);
        }
    };

    // Handle button click for editing user data
    btnParts.forEach(btnPart => {
        btnPart.addEventListener("click", async () => {
            const btnId = btnPart.id;
            const btnSet = btnPart.getAttribute('data-tag-set');
            const label = document.querySelector(`#${btnId}`).closest('.element-container').querySelector('.element-input');

            // Deselect other buttons in same set & revert any input back to label
            for (const otherBtnPart of btnParts) {
                const otherBtnSet = otherBtnPart.getAttribute('data-tag-set');
                if (otherBtnSet === btnSet && otherBtnPart !== btnPart) {
                    otherBtnPart.classList.remove("selected");
                    const otherLabel = otherBtnPart.closest('.element-container').querySelector('.element-input');
                    if (otherLabel.tagName === 'INPUT') otherLabel.replaceWith(await createLabel(otherLabel.id));
                    selectedBtn.delete(otherBtnPart.id);
                }
            }

            // Handle selection & deselection of clicked button
            if (selectedBtn.has(btnId)) {
                btnPart.classList.remove("selected");
                if (label.tagName === 'INPUT') {
                    const inputValue = label.value;
                    await updateUserData(userId, { [label.name]: inputValue });
                    label.replaceWith(await createLabel(label.id));
                }
                selectedBtn.delete(btnId);
            } else {
                btnPart.classList.add("selected");
                if (label.tagName === 'LABEL') label.replaceWith(await createInput(label.id));
                selectedBtn.add(btnId);
            }
        });
    });
});

// Delete user account using DELETE endpoint
document.getElementById('delete-btn').addEventListener('click', async () => {
    try {
        const { userId } = await fetch('/current-user').then(res => res.json());
        const { username } = await fetch(`/api/user/${userId}/username`).then(res => res.json());

        const deleteResponse = await fetch(`/user/${username}`, { method: 'DELETE' });
        if (deleteResponse.ok) {
            localStorage.setItem('deleteSuccess', 'true');
            window.location.href = '/home';
        } else {
            console.error(`Failed to delete user: ${deleteResponse.statusText}`);
        }
    } catch (error) {
        console.error('Error during delete operation:', error);
    }
});