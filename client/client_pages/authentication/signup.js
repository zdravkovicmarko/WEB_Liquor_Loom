import {displayMessage, displayErrorImg} from '/client/base.js';
const alertError = document.getElementById('alert-error');

document.querySelector('form[action="/signup"]').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get values from form inputs
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const verification = document.getElementById('verification').value;

    // Validation checks
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (username.length < 3 || /\s/.test(username)) return showError('Username must be at least 3 characters long and contain no spaces!', 'https://http.cat/400');
    if (!emailPattern.test(email)) return showError('Please enter a valid email address!', 'https://http.cat/400');
    if (password.length < 6) return showError('Password must be at least 6 characters long!', 'https://http.cat/400');
    if (password !== verification) return showError('Passwords do not match!', 'https://http.cat/400');

    // Sign up using POST endpoint
    fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, verification })
    })

        // If response is OK, parse response as JSON; otherwise, parse error & reject the promise
        .then(response => response.ok ? response.json() : response.json().then(error => Promise.reject(error)))

        // On success, save account creation flag in local storage & redirect to the login page
        .then(data => {
            localStorage.setItem('accountCreated', 'true');
            window.location.href = '/login';
        })

        // On error, map error message to user-friendly message & image & display it
        .catch(error => {
            const errorMessageMap = {
                'Username already in use': ['Username already exists!', 'https://http.cat/400'],
                'Email already in use': ['Email already exists!', 'https://http.cat/400'],
                'Passwords do not match': ['Passwords do not match!', 'https://http.cat/400']
            };
            const [message, imageUrl] = errorMessageMap[error.error] || ['Error creating account. Please try again.', 'https://http.cat/500'];
            showError(message, imageUrl);
        });
});

// Display user-friendly error message & image
const showError = (message, imageUrl) => {
    displayMessage(alertError, message, 5000);
    displayErrorImg(imageUrl);
};

// Navigation event handlers
document.getElementById('logo-container').addEventListener('click', () => window.location.href = '/home');
document.getElementById('login-btn').addEventListener('click', () => window.location.href = '/login');