import { displayMessage } from '/client/base.js';

document.querySelector('form[action="/login"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => { throw new Error(error.error); });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // Handle success (e.g., redirect to profile page)
            window.location.href = '/home';
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.message === 'Account does not exist') {
                displayMessage(usernameError, 'Account does not exist');
            } else if (error.message === 'Invalid username or password') {
                displayMessage(passwordError, 'Invalid password');
            } else {
                // Handle other errors
                console.error('Unhandled error:', error);
            }
        });
});

document.addEventListener('DOMContentLoaded', function () {
    const accountCreatedMessage = document.getElementById('accountCreatedMessage');

    // Check if accountCreated flag is set in localStorage
    if (localStorage.getItem('accountCreated') === 'true') {
        displayMessage(accountCreatedMessage, 'Account successfully created. Please login now.');

        // Remove flag from localStorage
        localStorage.removeItem('accountCreated');
    }
});
