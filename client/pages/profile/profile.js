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

document.addEventListener("DOMContentLoaded", async () => {

    // Function to fetch and display recipe data
    const displayProfile = async (userID) => {
        try {
            // Fetch username
            const usernameResponse = await fetch(`/api/user/${userID}/username`);
            const usernameData = await usernameResponse.json();
            document.getElementById('username').textContent = usernameData.username;

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
});