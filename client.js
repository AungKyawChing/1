document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const profileForm = document.getElementById('profileForm');
    const searchBtn = document.getElementById('searchBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
        loadProfile();
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    function handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(registerForm);
        fetch('/register', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Registration successful!');
                window.location.href = 'login.html';
            } else {
                alert('Registration failed: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('token', data.token);
                window.location.href = 'home.html';
            } else {
                alert('Login failed: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function loadProfile() {
        const token = localStorage.getItem('token');
        fetch('/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('name').value = data.user.name;
                document.getElementById('username').value = data.user.username;
                document.getElementById('email').value = data.user.email || '';
                document.getElementById('gender').value = data.user.gender || '';
                document.getElementById('dob').value = data.user.dob || '';
                document.getElementById('bio').value = data.user.bio || '';
                document.getElementById('relationshipStatus').value = data.user.relationshipStatus || '';
                if (data.user.profileImage) {
                    document.getElementById('profileImage').src = data.user.profileImage;
                }
            } else {
                alert('Failed to load profile: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function handleProfileUpdate(e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const formData = new FormData(profileForm);
        fetch('/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function handleSearch() {
        const searchInput = document.getElementById('searchInput').value;
        const token = localStorage.getItem('token');
        fetch(`/search?q=${encodeURIComponent(searchInput)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySearchResults(data.users);
            } else {
                alert('Search failed: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function displaySearchResults(users) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h3>${user.name}</h3>
                <p>Username: ${user.username}</p>
                <button onclick="sendMessage('${user.username}')">Send Message</button>
            `;
            searchResults.appendChild(userCard);
        });
    }

    function handleLogout() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});

function sendMessage(username) {
    // In a real application, this would open a messaging interface
    alert(`Sending message to ${username}`);
    }
