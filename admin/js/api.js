// API Configuration and Utilities
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://stickywork.com';  // URL del backend en Railway

// API Helper Functions
const api = {
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Get user data from localStorage
    getUserData() {
        return JSON.parse(localStorage.getItem('userData') || '{}');
    },

    // Save auth data
    saveAuthData(token, userData) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
    },

    // Clear auth data
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    },

    // Generic fetch wrapper with auth
    async fetch(endpoint, options = {}) {
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };

        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(error.message || `HTTP error ${response.status}`);
        }

        return response.json();
    },

    // GET request
    async get(endpoint) {
        return this.fetch(endpoint, { method: 'GET' });
    },

    // POST request
    async post(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT request
    async put(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // PATCH request
    async patch(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // DELETE request
    async delete(endpoint) {
        return this.fetch(endpoint, { method: 'DELETE' });
    }
};

// Export for use in other modules
window.api = api;
window.API_URL = API_URL;
