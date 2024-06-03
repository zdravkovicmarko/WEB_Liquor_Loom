import { displayMessage } from '/client/base.js';

document.querySelector('form[action="/signup"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const verification = document.getElementById('verification').value;
    const alertError = document.getElementById('alert-error');

    // Check if username is at least 3 characters long and has no spaces
    if (username.length < 3 || /\s/.test(username)) {
        displayMessage(alertError, 'Username must be at least 3 characters long and contain no spaces!', 3000);
        return;
    }

    /*
   Email-Pattern explanation: first part til the "+" checks if there are characters except for space and @ before the actual "@",
   then checks the same after the "@" and after the "."
    */
    // Check if email is valid
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        displayMessage(alertError, 'Please enter a valid email address!', 3000);
        return;
    }

    // Check if password is at least 6 characters
    if (password.length < 6) {
        displayMessage(alertError, 'Password must be at least 6 characters long!', 3000);
        return;
    }

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, verification })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => { throw new Error(error.error); });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // Store a flag in localStorage
            localStorage.setItem('accountCreated', 'true');
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.message === 'Username already in use') {
                displayMessage(alertError, 'Username already exists!', 3000);
            } else if (error.message === 'Email already in use') {
                displayMessage(alertError, 'Email already exists!', 3000);
            } else if (error.message === 'Passwords do not match') {
                displayMessage(alertError, 'Passwords do not match!', 3000);
            } else {
                // Handle other errors
                displayMessage(alertError, 'Error creating account. Please try again.', 3000);
            }
        });
});