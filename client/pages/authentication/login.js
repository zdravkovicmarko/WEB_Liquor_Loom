import { displayMessage } from '/client/base.js';

document.querySelector('form[action="/login"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const alertError = document.getElementById('alert-error');

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
            window.location.href = '/home';
        })
        .catch(error => {
            if (error.message === 'Account does not exist') {
                displayMessage(alertError, 'Account does not exist!', 3000);
                console.error('Handled Error:', error);
            } else if (error.message === 'Invalid username or password') {
                displayMessage(alertError, 'Invalid password!', 3000);
            } else if (error.message === 'Unexpected token \'U\', "User alrea"... is not valid JSON') {
                displayMessage(alertError, 'You are already logged in!', 3000);
            } else {
                console.error('Unhandled error:', error);
            }
        });
});

document.addEventListener('DOMContentLoaded', function () {
    const alertSuccess = document.getElementById('alert-success');

    // Check if accountCreated flag is set in localStorage
    if (localStorage.getItem('accountCreated') === 'true') {
        displayMessage(alertSuccess, 'Account successfully created! Please login now.', 3000);

        // Remove flag from localStorage
        localStorage.removeItem('accountCreated');
    }
});
