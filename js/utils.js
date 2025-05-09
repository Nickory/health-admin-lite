/**
 * Utilities Module for HealthAdmin Lite
 * Common utility functions used across the application
 */

// Create Utils namespace
window.Utils = {
    /**
     * Shows a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast: function(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');

        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.top = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.backgroundColor = '#fff';
        toast.style.borderRadius = '4px';
        toast.style.padding = '12px 20px';
        toast.style.marginBottom = '10px';
        toast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        toast.style.maxWidth = '350px';
        toast.style.wordBreak = 'break-word';

        // Add icon based on type
        let iconClass = '';
        let iconColor = '';

        switch (type) {
            case 'success':
                iconClass = 'fa-check-circle';
                iconColor = 'var(--accent-color)';
                break;
            case 'error':
                iconClass = 'fa-times-circle';
                iconColor = 'var(--danger-color)';
                break;
            case 'warning':
                iconClass = 'fa-exclamation-triangle';
                iconColor = 'var(--warning-color)';
                break;
            case 'info':
            default:
                iconClass = 'fa-info-circle';
                iconColor = 'var(--primary-color)';
                break;
        }

        // Create toast content
        toast.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fas ${iconClass}" style="color: ${iconColor}; margin-right: 10px; font-size: 18px;"></i>
                <span>${message}</span>
            </div>
            <button style="background: none; border: none; cursor: pointer; font-size: 16px; margin-left: 10px;">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast to container
        toastContainer.appendChild(toast);

        // Animate toast in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Set up close button
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', function() {
            Utils.removeToast(toast);
        });

        // Auto-remove toast after duration
        setTimeout(() => {
            Utils.removeToast(toast);
        }, duration);
    },

    /**
     * Removes a toast notification with animation
     * @param {Element} toast - The toast element to remove
     */
    removeToast: function(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            toast.remove();
        }, 300);
    },

    /**
     * Formats a date to a readable string
     * @param {string|Date} date - The date to format
     * @param {string} format - The format to use (full, short, time)
     * @returns {string} Formatted date string
     */
    formatDate: function(date, format = 'full') {
        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }

        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString();
            case 'time':
                return dateObj.toLocaleTimeString();
            case 'full':
            default:
                return dateObj.toLocaleString();
        }
    },

    /**
     * Validates an email address
     * @param {string} email - The email address to validate
     * @returns {boolean} True if valid, false otherwise
     */
    isValidEmail: function(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * Debounces a function
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait = 300) {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttles a function
     * @param {Function} func - The function to throttle
     * @param {number} limit - The throttle limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: function(func, limit = 300) {
        let inThrottle;

        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;

                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
        };
    },

    /**
     * Generates a unique ID
     * @returns {string} Unique ID
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * Formats a number with commas
     * @param {number} number - The number to format
     * @returns {string} Formatted number
     */
    formatNumber: function(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Gets a cookie value by name
     * @param {string} name - The name of the cookie
     * @returns {string} Cookie value or empty string if not found
     */
    getCookie: function(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);

        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }

        return '';
    },

    /**
     * Sets a cookie
     * @param {string} name - The name of the cookie
     * @param {string} value - The value of the cookie
     * @param {number} days - The number of days until the cookie expires
     */
    setCookie: function(name, value, days = 7) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/`;
    },

    /**
     * Deletes a cookie
     * @param {string} name - The name of the cookie to delete
     */
    deleteCookie: function(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    },

    /**
     * Gets a value from localStorage with error handling
     * @param {string} key - The key to get
     * @param {*} defaultValue - Default value if not found or error
     * @returns {*} The stored value or default value
     */
    getLocalStorage: function(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Error getting localStorage item:', error);
            return defaultValue;
        }
    },

    /**
     * Sets a value in localStorage with error handling
     * @param {string} key - The key to set
     * @param {*} value - The value to store
     * @returns {boolean} True if successful, false otherwise
     */
    setLocalStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting localStorage item:', error);
            return false;
        }
    },

    /**
     * Removes a value from localStorage with error handling
     * @param {string} key - The key to remove
     * @returns {boolean} True if successful, false otherwise
     */
    removeLocalStorage: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage item:', error);
            return false;
        }
    },

    /**
     * Copies text to clipboard
     * @param {string} text - The text to copy
     * @returns {Promise<boolean>} Promise resolving to true if successful
     */
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);

            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            return successful;
        }
    },

    /**
     * Sanitizes HTML to prevent XSS
     * @param {string} html - The HTML to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML: function(html) {
        const element = document.createElement('div');
        element.textContent = html;
        return element.innerHTML;
    },

    /**
     * Escapes HTML special characters
     * @param {string} html - The HTML to escape
     * @returns {string} Escaped HTML
     */
    escapeHTML: function(html) {
        return html.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Truncates text to specified length
     * @param {string} text - The text to truncate
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add after truncation
     * @returns {string} Truncated text
     */
    truncateText: function(text, length = 100, suffix = '...') {
        if (text.length <= length) {
            return text;
        }

        return text.substring(0, length).trim() + suffix;
    },

    /**
     * Capitalizes the first letter of a string
     * @param {string} string - The string to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeFirst: function(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    /**
     * Converts camelCase to human-readable form
     * @param {string} text - The camelCase text
     * @returns {string} Human-readable text
     */
    camelToHuman: function(text) {
        return text
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    },

    /**
     * Checks if dark mode is preferred by the user/system
     * @returns {boolean} True if dark mode is preferred
     */
    isDarkModePreferred: function() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    /**
     * Detects if the user is on a mobile device
     * @returns {boolean} True if on mobile device
     */
    isMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Gets the current browser name
     * @returns {string} Browser name
     */
    getBrowserName: function() {
        const userAgent = navigator.userAgent;
        let browserName;

        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "Chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "Firefox";
        } else if (userAgent.match(/safari/i)) {
            browserName = "Safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "Opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "Edge";
        } else {
            browserName = "Unknown";
        }

        return browserName;
    }
};