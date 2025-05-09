/**
 * Authentication Module for HealthAdmin Lite
 * Handles user login, registration, session management and logout
 */

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupAuthEventListeners();
    initAuthUI();
});

/**
 * Sets up event listeners for authentication forms
 */
function setupAuthEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginUser();
        });
    }

    // Registration form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            registerUser();
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutUser();
        });
    }

    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    if (togglePasswordButtons) {
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function() {
                const passwordInput = this.previousElementSibling;
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;

                // Update icon
                const icon = this.querySelector('i');
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        });
    }

    // Social login buttons (in a real app, these would authenticate with OAuth providers)
    const socialButtons = document.querySelectorAll('.social-btn');
    if (socialButtons) {
        socialButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Social login functionality would go here
                const provider = this.classList.contains('google') ? 'Google' : 'Microsoft';
                Utils.showToast(`${provider} authentication would be implemented in a production environment.`, 'info');
            });
        });
    }

    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            // In a real app, this would open a forgot password form
            Utils.showToast('Password reset functionality would be implemented in a production environment.', 'info');
        });
    }
}

/**
 * Initializes the authentication UI
 */
function initAuthUI() {
    // Add animation to the login/register form
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        setTimeout(() => {
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0)';
        }, 100);
    }

    // Focus on the first input field
    const firstInput = document.querySelector('.login-form input:first-of-type');
    if (firstInput) {
        setTimeout(() => {
            firstInput.focus();
        }, 500);
    }
}

/**
 * Verifies if a user is currently logged in
 * Redirects to login page if not authenticated
 */
function checkAuthStatus() {
    const currentPath = window.location.pathname;
    const authToken = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const publicPages = ['/login.html', '/register.html'];
    const isPublicPage = publicPages.some(page => currentPath.includes(page));

    // If no auth token and trying to access protected page, redirect to login
    if (!authToken && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }

    // If has auth token and on public page, redirect to dashboard
    if (authToken && isPublicPage) {
        window.location.href = 'index.html';
        return;
    }

    // Update user info in the sidebar if on a protected page
    if (authToken && !isPublicPage) {
        updateUserInfo(userData);
    }
}

/**
 * Updates the user information displayed in the UI
 * @param {Object} userData - The user data object
 */
function updateUserInfo(userData) {
    const userNameElements = document.querySelectorAll('#user-name');
    const userRoleElements = document.querySelectorAll('#user-role');
    const userAvatarElements = document.querySelectorAll('#user-avatar');

    if (userData.name) {
        userNameElements.forEach(el => {
            el.textContent = userData.name;
        });
    }

    if (userData.role) {
        userRoleElements.forEach(el => {
            el.textContent = userData.role;
        });
    }

    if (userData.avatar) {
        userAvatarElements.forEach(el => {
            el.src = userData.avatar;
        });
    }
}

/**
 * Processes user login
 */
async function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const errorElement = document.getElementById('login-error');

    if (errorElement) {
        errorElement.style.display = 'none';
    }

    try {
        // Show loading state
        const loginButton = document.querySelector('.login-btn');
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Signing In...';
            loginButton.disabled = true;
        }

        // In a real application, this would be an API call to the server
        // For demo purposes, we'll simulate a successful login with mock data
        const response = await API.login(username, password);

        if (response.success) {
            // Store authentication data
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_data', JSON.stringify(response.user));

            if (rememberMe) {
                localStorage.setItem('remember_auth', 'true');
            }

            // Show success message
            Utils.showToast('Login successful! Redirecting...', 'success');

            // Redirect after a short delay
            setTimeout(() => {
                // Redirect to admin page if admin, otherwise to dashboard
                if (response.user.role === 'Administrator' || response.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } else {
            // Restore button state
            if (loginButton) {
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                loginButton.disabled = false;
            }

            // Show error message
            if (errorElement) {
                errorElement.textContent = response.message || 'Login failed. Please check your credentials.';
                errorElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Login error:', error);

        // Restore button state
        const loginButton = document.querySelector('.login-btn');
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            loginButton.disabled = false;
        }

        // Show error message
        if (errorElement) {
            errorElement.textContent = 'Login failed. Please try again later.';
            errorElement.style.display = 'block';
        }
    }
}

/**
 * Processes user registration
 */
async function registerUser() {
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const userRole = document.getElementById('user-role').value;
    const termsAccepted = document.getElementById('terms').checked;
    const errorElement = document.getElementById('register-error');

    if (errorElement) {
        errorElement.style.display = 'none';
    }

    // Validate password match
    if (password !== confirmPassword) {
        if (errorElement) {
            errorElement.textContent = 'Passwords do not match.';
            errorElement.style.display = 'block';
        }
        return;
    }

    // Validate terms acceptance
    if (!termsAccepted) {
        if (errorElement) {
            errorElement.textContent = 'You must accept the Terms and Conditions.';
            errorElement.style.display = 'block';
        }
        return;
    }

    try {
        // Show loading state
        const registerButton = document.querySelector('.login-btn');
        if (registerButton) {
            registerButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Creating Account...';
            registerButton.disabled = true;
        }

        // In a real application, this would be an API call to the server
        // For demo purposes, we'll simulate a successful registration with mock data
        const response = await API.register({
            fullname,
            email,
            username,
            password,
            role: userRole
        });

        if (response.success) {
            // Show success message
            Utils.showToast('Registration successful! Redirecting...', 'success');

            // After successful registration, automatically log the user in
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_data', JSON.stringify(response.user));

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Restore button state
            if (registerButton) {
                registerButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
                registerButton.disabled = false;
            }

            // Show error message
            if (errorElement) {
                errorElement.textContent = response.message || 'Registration failed. Please try again.';
                errorElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Registration error:', error);

        // Restore button state
        const registerButton = document.querySelector('.login-btn');
        if (registerButton) {
            registerButton.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            registerButton.disabled = false;
        }

        // Show error message
        if (errorElement) {
            errorElement.textContent = 'Registration failed. Please try again later.';
            errorElement.style.display = 'block';
        }
    }
}

/**
 * Logs out the current user
 */
function logoutUser() {
    // Show confirmation
    if (confirm('Are you sure you want to log out?')) {
        // Show loading toast
        Utils.showToast('Logging out...', 'info');

        // Clear authentication data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('remember_auth');

        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Export functions for use in other modules
window.Auth = {
    checkAuthStatus,
    loginUser,
    registerUser,
    logoutUser,
    updateUserInfo
};