import { appendCocktail } from '/client/base.js';

// Event listeners for navigation
document.getElementById('logo-container').addEventListener('click', function() {
     window.location.href = '/home';
 });

// Assuming you have a logout button with id "logout-btn"
const logoutButton = document.getElementById('logout-btn');
logoutButton.addEventListener('click', async function(event) {
    try {
        window.location.href='/logout'
    } catch (error) {
        console.error('Error:', error);
    }
});