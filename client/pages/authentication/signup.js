import { displayMessage } from '/client/base.js';

document.querySelector('form[action="/signup"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const verification = document.getElementById('verification').value;
    const alertError = document.getElementById('alert-error');

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
                console.error('Unhandled error:', error);
            }
        });
});