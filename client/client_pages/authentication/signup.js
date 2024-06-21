import { displayMessage } from '/client/base.js';

document.querySelector('form[action="/signup"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const verification = document.getElementById('verification').value;
    const alertError = document.getElementById('alert-error');
    const errorImageContainer = document.getElementById('error-image-container');

    // Function to display error images
    const displayErrorImage = (url) => {
        fetch(url, { mode: 'no-cors' })
            .then(() => {
                errorImageContainer.innerHTML = `<img src="${url}" alt="Error Image">`;
                errorImageContainer.classList.add('element-cat');
                errorImageContainer.style.display = 'block';

                setTimeout(() => {
                    errorImageContainer.style.display = 'none';
                }, 3000);
            })
            .catch(() => {
                console.error('Failed to fetch error image from http.cat');
            });
    };

    // Validation checks
    if (username.length < 3 || /\s/.test(username)) {
        displayMessage(alertError, 'Username must be at least 3 characters long and contain no spaces!', 3000);
        displayErrorImage('https://http.cat/400');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        displayMessage(alertError, 'Please enter a valid email address!', 3000);
        displayErrorImage('https://http.cat/400');
        return;
    }

    if (password.length < 6) {
        displayMessage(alertError, 'Password must be at least 6 characters long!', 3000);
        displayErrorImage('https://http.cat/400');
        return;
    }

    if (password !== verification) {
        displayMessage(alertError, 'Passwords do not match!', 3000);
        displayErrorImage('https://http.cat/400');
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
            let imageUrl = '';

            switch (error.message) {
                case 'Username already in use':
                    displayMessage(alertError, 'Username already exists!', 3000);
                    imageUrl = 'https://http.cat/400';
                    break;
                case 'Email already in use':
                    displayMessage(alertError, 'Email already exists!', 3000);
                    imageUrl = 'https://http.cat/400';
                    break;
                case 'Passwords do not match':
                    displayMessage(alertError, 'Passwords do not match!', 3000);
                    imageUrl = 'https://http.cat/400';
                    break;
                default:
                    displayMessage(alertError, 'Error creating account. Please try again.', 3000);
                    imageUrl = 'https://http.cat/500';
                    break;
            }

            if (imageUrl) {
                displayErrorImage(imageUrl);
            }
        });
});