import { logoutBtnHandling } from '/client/base.js';

// Event listeners for navigation
document.getElementById('logo-container').addEventListener('click', function() {
     window.location.href = '/home';
 });

logoutBtnHandling();

document.addEventListener("DOMContentLoaded", async () => {

    // Function to fetch and display recipe data
    const displayProfile = async (userID) => {
        try {
            // Fetch username
            const usernameResponse = await fetch(`/api/user/${userID}/username`);
            const usernameData = await usernameResponse.json();
            document.getElementById('username').textContent = "@" + usernameData.username;

            // Fetch email
            const emailResponse = await fetch(`/api/user/${userID}/email`);
            const emailData = await emailResponse.json();
            document.getElementById('email').textContent = emailData.email;

            // Fetch password & make ****
            const passwordResponse = await fetch(`/api/user/${userID}/password`);
            const passwordData = await passwordResponse.json();
            const actualPassword = passwordData.password;
            document.getElementById('password').textContent = '*'.repeat(actualPassword.length);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        }
    };

    const response = await fetch(`/current-user`);
    const data = await response.json();
    const userID = data.userId;
    displayProfile(userID);

    const profilePictures = {
        1: 'client/images/dummy-img/schmirko-pb.jpg',
        2: 'client/images/dummy-img/lisa-pb.jpg',
        3: 'client/images/dummy-img/schmortn-pb.jpg',
        4: 'client/images/dummy-img/masud-pb.png',
        5: 'client/images/dummy-img/sabimami-pb.jpg',
        6: 'client/images/dummy-img/sarma-pb.png'
    };

    const profilePictureSrc = profilePictures[userID];
    if (profilePictureSrc) {
        document.querySelector('.profile-picture').src = profilePictureSrc;
    }
});

document.getElementById('delete-btn').addEventListener('click', async function () {
    try {
        console.log('Delete button clicked.');

        // Fetch current user ID
        const userResponse = await fetch('/current-user');
        if (!userResponse.ok) {
            console.error(`Failed to fetch current user: ${userResponse.statusText}`);
            return;
        }
        const { userId } = await userResponse.json();

        // Fetch username for the user ID
        const usernameResponse = await fetch(`/api/user/${userId}/username`);
        if (!usernameResponse.ok) {
            console.error(`Failed to fetch username: ${usernameResponse.statusText}`);
            return;
        }
        const { username } = await usernameResponse.json();

        if (!username) {
            console.error('Username is null or undefined');
            return;
        }

        // Call the delete user endpoint
        const deleteResponse = await fetch(`/users/${username}`, { method: 'DELETE' });
        if (!deleteResponse.ok) {
            console.error(`Failed to delete user: ${deleteResponse.statusText}`);
            return;
        }

        // Set the flag indicating the user was deleted
        localStorage.setItem('deleteSuccess', 'true');

        // Redirect to home immediately after session destruction
        console.log('Session destroyed successfully. Redirecting to home.');
        window.location.href = '/home';
    } catch (error) {
        console.error('Error during delete operation:', error);
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    // Fetch current user ID
    const userResponse = await fetch('/current-user');
    if (!userResponse.ok) {
        console.error(`Failed to fetch current user: ${userResponse.statusText}`);
        return;
    }
    const { userId } = await userResponse.json();

    const actions = [
        { id: 'value-recommended', action: 'recommend' },
        { id: 'value-recommended-no', action: 'not_recommend' },
        { id: 'value-planned', action: 'pin' }
    ];

    for (const { id, action } of actions) {
        try {
            const response = await fetch(`/api/user/${userId}/action/${action}/count`);
            if (!response.ok) {
                console.error(`Failed to fetch ${action} count: ${response.statusText}`);
            }
            const data = await response.json();
            document.getElementById(id).textContent = data.count;
            console.log(data.count)
        } catch (error) {
            console.error(`Error fetching count for ${action}:`, error);
        }
    }
});
