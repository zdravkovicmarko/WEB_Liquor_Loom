document.querySelector('form[action="/login"]').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    // Clear previous error messages
    usernameError.style.display = 'none';
    passwordError.style.display = 'none';

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
            window.location.href = '/profile';
        })
        .catch(error => {
            console.error('Error:', error);
            if (error.message === 'Account does not exist') {
                usernameError.textContent = 'Account does not exist';
                usernameError.style.display = 'block';
            } else if (error.message === 'Invalid username or password') {
                passwordError.textContent = 'Invalid password';
                passwordError.style.display = 'block';
            } else {
                // Handle other errors
                console.error('Unhandled error:', error);
            }
        });
});