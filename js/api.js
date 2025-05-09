/**
 * API Module for HealthAdmin Lite
 * Handles all API requests to the backend server
 */

// API Base URL - update this to your actual backend endpoint
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * API error handler
 * @param {Error} error - The error object
 * @returns {Object} Standardized error response
 */
function handleApiError(error) {
    console.error('API Error:', error);
    return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        error: error
    };
}

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint to call
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Request payload for POST/PUT requests
 * @returns {Promise<Object>} API response
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add auth token if available
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add request body for POST/PUT requests
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'API request failed');
        }

        return responseData;
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * For demo purposes - simulates API responses when a real backend is not available
 * In a production environment, these functions would make actual API calls
 */
const mockAPI = {
    /**
     * Simulates login API response
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Object} Mock login response
     */
    login(username, password) {
        // For demo: accept any non-empty credentials
        if (!username || !password) {
            return {
                success: false,
                message: 'Username and password are required'
            };
        }

        // Mock successful response
        return {
            success: true,
            token: 'mock_auth_token_' + Date.now(),
            user: {
                id: 1,
                name: username === 'admin' ? 'Admin User' : 'John Doe',
                username: username,
                email: username + '@example.com',
                role: username === 'admin' ? 'Administrator' : (username === 'vip' ? 'Subscriber' : 'Regular User'),
                avatar: 'https://via.placeholder.com/150'
            }
        };
    },

    /**
     * Simulates registration API response
     * @param {Object} userData - User registration data
     * @returns {Object} Mock registration response
     */
    register(userData) {
        // Validate required fields
        if (!userData.username || !userData.password || !userData.email) {
            return {
                success: false,
                message: 'All fields are required'
            };
        }

        // Mock successful response
        return {
            success: true,
            token: 'mock_auth_token_' + Date.now(),
            user: {
                id: Math.floor(Math.random() * 1000) + 1,
                name: userData.fullname,
                username: userData.username,
                email: userData.email,
                role: userData.role || 'Patient',
                avatar: 'https://via.placeholder.com/150'
            }
        };
    },

    /**
     * Simulates getting health data API response
     * @param {Object} filters - Data filters (date range, data type, etc.)
     * @returns {Object} Mock health data response
     */
    getHealthData(filters = {}) {
        // Generate mock data points
        const dataPoints = [];
        const now = new Date();
        const dataTypes = ['heart-rate', 'oxygen', 'temperature', 'respiratory'];

        // If specific data type is requested, filter the list
        const types = filters.dataType && filters.dataType !== 'all'
            ? [filters.dataType]
            : dataTypes;

        // Generate 25 data points by default, or the requested amount
        const count = filters.limit || 25;

        for (let i = 0; i < count; i++) {
            const time = new Date(now.getTime() - (i * 3600000)); // Each hour back

            const heartRate = Math.floor(Math.random() * 20) + 65; // 65-85
            const oxygenLevel = Math.floor(Math.random() * 5) + 94; // 94-99
            const temperature = (Math.random() * 1.5 + 36.0).toFixed(1); // 36.0-37.5
            const respRate = Math.floor(Math.random() * 8) + 12; // 12-20

            // Determine status based on values
            let status = 'normal';
            if (heartRate > 100 || heartRate < 50 || oxygenLevel < 95 ||
                parseFloat(temperature) > 37.5 || respRate > 20 || respRate < 12) {
                status = Math.random() > 0.5 ? 'warning' : 'danger';
            }

            dataPoints.push({
                id: i + 1,
                timestamp: time.toISOString(),
                heartRate,
                oxygenLevel,
                temperature,
                respRate,
                status
            });
        }

        // Simulate random abnormal readings for alerts
        const alerts = [];
        if (Math.random() > 0.7) {
            alerts.push({
                id: 1,
                type: 'danger',
                metric: 'Heart Rate',
                value: '110 BPM',
                timestamp: new Date(now.getTime() - (Math.random() * 24 * 3600000)).toISOString(),
                message: 'Heart rate reached 110 BPM, which is above normal range.'
            });
        }

        if (Math.random() > 0.7) {
            alerts.push({
                id: 2,
                type: 'warning',
                metric: 'Oxygen Level',
                value: '93%',
                timestamp: new Date(now.getTime() - (Math.random() * 24 * 3600000)).toISOString(),
                message: 'Oxygen level dropped to 93%, which is below optimal range.'
            });
        }

        return {
            success: true,
            data: dataPoints,
            alerts,
            pagination: {
                total: 100,
                page: filters.page || 1,
                limit: count,
                pages: Math.ceil(100 / count)
            }
        };
    },

    /**
     * Simulates getting health data chart data
     * @param {string} metric - Metric to get data for (heart-rate, oxygen, etc.)
     * @param {string} period - Time period (day, week, month)
     * @returns {Object} Mock chart data response
     */
    getChartData(metric, period = 'day') {
        const labels = [];
        const data = [];
        const now = new Date();

        let pointCount = 0;
        let timeStep = 0;

        switch (period) {
            case 'day':
                pointCount = 24; // 24 hours
                timeStep = 60 * 60 * 1000; // 1 hour in ms
                break;
            case 'week':
                pointCount = 7; // 7 days
                timeStep = 24 * 60 * 60 * 1000; // 1 day in ms
                break;
            case 'month':
                pointCount = 30; // 30 days
                timeStep = 24 * 60 * 60 * 1000; // 1 day in ms
                break;
            default:
                pointCount = 24;
                timeStep = 60 * 60 * 1000;
        }

        // Generate data points
        for (let i = 0; i < pointCount; i++) {
            const time = new Date(now.getTime() - (i * timeStep));

            let value = 0;
            switch (metric) {
                case 'heart-rate':
                    value = Math.floor(Math.random() * 20) + 65; // 65-85
                    break;
                case 'oxygen':
                    value = Math.floor(Math.random() * 5) + 94; // 94-99
                    break;
                case 'temperature':
                    value = (Math.random() * 1.5 + 36.0).toFixed(1); // 36.0-37.5
                    break;
                case 'respiratory':
                    value = Math.floor(Math.random() * 8) + 12; // 12-20
                    break;
                default:
                    value = Math.floor(Math.random() * 100);
            }

            // Format label based on period
            let label = '';
            if (period === 'day') {
                label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                label = time.toLocaleDateString();
            }

            labels.unshift(label);
            data.unshift(value);
        }

        return {
            success: true,
            labels,
            data
        };
    },

    /**
     * Simulates getting user profile data
     * @param {number} userId - User ID
     * @returns {Object} Mock user profile response
     */
    getUserProfile(userId) {
        return {
            success: true,
            user: {
                id: userId || 1,
                name: 'John Doe',
                displayName: 'John',
                email: 'john.doe@example.com',
                phone: '+1 (555) 123-4567',
                role: 'Administrator',
                avatar: 'https://via.placeholder.com/150',
                birthDate: '1985-05-15',
                gender: 'male',
                address: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                zipCode: '12345',
                country: 'us',
                emergencyContact: 'Jane Doe: +1 (555) 987-6543',
                medicalInfo: {
                    bloodType: 'o+',
                    allergies: 'Penicillin, Peanuts',
                    conditions: 'Hypertension, Type 2 Diabetes',
                    medications: 'Lisinopril 10mg, Metformin 500mg'
                },
                accountInfo: {
                    username: 'johndoe',
                    status: 'active',
                    created: '2025-01-15'
                },
                preferences: {
                    theme: 'light',
                    language: 'en',
                    dateFormat: 'mdy',
                    timeFormat: '12h',
                    notifications: {
                        email: true,
                        browser: true,
                        sms: false,
                        frequency: 'real-time'
                    },
                    thresholds: {
                        heartRateLow: 50,
                        heartRateHigh: 100,
                        oxygenLow: 94,
                        temperatureHigh: 37.8,
                        respRateLow: 12,
                        respRateHigh: 20
                    }
                },
                stats: {
                    dataPoints: 1254,
                    lastActivity: '24h',
                    avgHeartRate: 72,
                    avgOxygen: '98%'
                }
            }
        };
    },

    /**
     * Simulates updating user profile data
     * @param {number} userId - User ID
     * @param {Object} profileData - Updated profile data
     * @returns {Object} Mock update response
     */
    updateUserProfile(userId, profileData) {
        return {
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...profileData,
                id: userId || 1
            }
        };
    },

    /**
     * Simulates getting system status
     * @returns {Object} Mock system status response
     */
    getSystemStatus() {
        return {
            success: true,
            system: {
                cpu: Math.floor(Math.random() * 60) + 10, // 10-70%
                memory: Math.floor(Math.random() * 40) + 30, // 30-70%
                disk: Math.floor(Math.random() * 30) + 40, // 40-70%
                uptime: '3d 7h 22m',
                temperature: Math.floor(Math.random() * 20) + 40, // 40-60°C
                lastUpdate: new Date().toISOString()
            },
            database: {
                status: 'healthy',
                size: '1.24 GB',
                connections: Math.floor(Math.random() * 5) + 1, // 1-6
                lastBackup: '2025-05-08 02:00:00'
            },
            services: [
                { name: 'Web Server', status: 'running', uptime: '3d 7h 22m' },
                { name: 'Data Collector', status: 'running', uptime: '3d 7h 22m' },
                { name: 'Notification Service', status: 'running', uptime: '3d 7h 22m' },
                { name: 'Backup Service', status: 'running', uptime: '1d 13h 45m' }
            ]
        };
    }
};

// Define the API interface
window.API = {
    // Auth endpoints
    login: async (username, password) => {
        // In a real app, use: return apiRequest('/auth/login', 'POST', { username, password });
        return mockAPI.login(username, password);
    },

    register: async (userData) => {
        // In a real app, use: return apiRequest('/auth/register', 'POST', userData);
        return mockAPI.register(userData);
    },

    // Health data endpoints
    getHealthData: async (filters) => {
        // In a real app, use: return apiRequest('/health-data?' + new URLSearchParams(filters));
        return mockAPI.getHealthData(filters);
    },

    getChartData: async (metric, period) => {
        // In a real app, use: return apiRequest(`/health-data/chart/${metric}?period=${period}`);
        return mockAPI.getChartData(metric, period);
    },

    // User profile endpoints
    getUserProfile: async (userId) => {
        // In a real app, use: return apiRequest(`/users/${userId}`);
        return mockAPI.getUserProfile(userId);
    },

    updateUserProfile: async (userId, profileData) => {
        // In a real app, use: return apiRequest(`/users/${userId}`, 'PUT', profileData);
        return mockAPI.updateUserProfile(userId, profileData);
    },

    // System endpoints
    getSystemStatus: async () => {
        // In a real app, use: return apiRequest('/system/status');
        return mockAPI.getSystemStatus();
    }
};