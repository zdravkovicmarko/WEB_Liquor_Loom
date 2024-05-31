document.querySelector('form[action="/signup"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const verification = document.getElementById('verification').value;
    const usernameError = document.getElementById('usernameError');
    const emailError = document.getElementById('emailError');
    const verificationError = document.getElementById('verificationError');

    // Clear previous error messages
    usernameError.style.display = 'none';
    emailError.style.display = 'none';
    verificationError.style.display = 'none';

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
            // Handle success (e.g., redirect to login page)
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.message === 'Username already in use') {
                usernameError.textContent = 'Username already exists';
                usernameError.style.display = 'block';
            } else if (error.message === 'Email already in use') {
                emailError.textContent = 'Email already exists';
                emailError.style.display = 'block';
            } else if (error.message === 'Passwords do not match') {
                verificationError.textContent = 'Passwords do not match';
                verificationError.style.display = 'block';
            } else {
                // Handle other errors
                console.error('Unhandled error:', error);
            }
        });
});
