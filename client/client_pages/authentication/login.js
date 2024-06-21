import { displayMessage } from '/client/base.js';

document.querySelector('form[action="/login"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const alertError = document.getElementById('alert-error');
    const errorImageContainer = document.getElementById('error-image-container');

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    error.status = response.status;
                    throw error;
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            console.log('Success:', data);
            window.location.href = '/home';
        })
        .catch(error => {
            let status = error.status;

            let imageUrl = `https://http.cat/${status}`;

            // Use no-cors to fetch the image directly
            fetch(imageUrl, { mode: 'no-cors' })
                .then(() => {
                    errorImageContainer.innerHTML = `<img src="${imageUrl}" alt="Error Image">`;
                    errorImageContainer.classList.add('element-cat');
                    errorImageContainer.style.display = 'block';

                    setTimeout(() => {
                        errorImageContainer.style.display = 'none';
                    }, 3000);
                })
                .catch(() => {
                    console.error('Failed to fetch error image from http.cat');
                });

            if (status === 404) {
                displayMessage(alertError, 'Account does not exist!', 3000);
                console.error('Handled Error:', error);
            } else if (status === 401) {
                displayMessage(alertError, 'Invalid username or password!', 3000);
            } else if (status === 409) {
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
