import {
    displayMessage,
    displayErrorImg,
    basicRedirectionHandling
} from '/client/base.js';

basicRedirectionHandling(true, false, false, false)

const alertError = document.getElementById('alert-error');
const alertSuccess = document.getElementById('alert-success');

// Check if redirected from successful signup & display success message
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('accountCreated') === 'true') {
        displayMessage(alertSuccess, 'Account successfully created! Please login now.', 3000);
        localStorage.removeItem('accountCreated');
    }
});

document.querySelector('form[action="/login"]').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get values from form inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Log in using POST endpoint
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })

        // If response is OK, parse response as JSON; otherwise, parse error & throw with status
        .then(response => response.ok ? response.json() : response.json().then(error => { error.status = response.status; throw error; }))

        // On success, redirect to home page
        .then(() => window.location.href = '/home')

        // On error, map status code to user-friendly message & image & display it
        .catch(error => {
            const status = error.status;
            const imageUrl = `https://http.cat/${status}`;
            const errorMessages = {
                404: 'Account does not exist!',
                401: 'Invalid password!',
                409: 'You are already logged in!'
            };

            displayMessage(alertError, errorMessages[status] || 'Unhandled error!', 5000);
            displayErrorImg(imageUrl);
            console.error('Error:', error);
        });
});

// Navigation event handler
document.getElementById('signup').addEventListener('click', () => window.location.href = '/signup');