import { appendCocktail } from '/client/base.js';

// Event listeners for navigation
document.getElementById('logo-container').addEventListener('click', function() {
     window.location.href = '/home';
 });

// Assuming you have a logout button with id "logout-btn"
const logoutButton = document.getElementById('logout-btn');
logoutButton.addEventListener('click', async function(event) {
    try {
        const response = await fetch('/logout', {
            method: 'GET'
        });

        if (response.ok) {
            // Redirect to login page upon successful logout
            window.location.href = '/login';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});