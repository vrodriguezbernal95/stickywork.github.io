// API Configuration and Utilities
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://stickywork.com';  // URL del backend en Railway

// API Helper Functions
const api = {
    // Get access token from localStorage
    getToken() {
        return localStorage.getItem('accessToken');
    },

    // Get refresh token from localStorage
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    },

    // Get user data from localStorage
    getUserData() {
        return JSON.parse(localStorage.getItem('userData') || '{}');
    },

    // Save auth data (con ambos tokens)
    saveAuthData(accessToken, refreshToken, userData) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userData', JSON.stringify(userData));
    },

    // Clear auth data
    clearAuthData() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        // También limpiar el token viejo si existe
        localStorage.removeItem('authToken');
    },

    // Renovar access token usando refresh token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            if (data.success && data.data.accessToken) {
                // Guardar nuevo access token
                localStorage.setItem('accessToken', data.data.accessToken);
                return data.data.accessToken;
            } else {
                throw new Error('Invalid refresh response');
            }
        } catch (error) {
            // Si falla el refresh, limpiar auth y forzar re-login
            this.clearAuthData();
            throw error;
        }
    },

    // Generic fetch wrapper with auth y auto-refresh
    async fetch(endpoint, options = {}, retryCount = 0) {
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

        // Si es 401 (token expirado) y no hemos reintentado aún, renovar token
        if (response.status === 401 && retryCount === 0) {
            try {
                console.log('🔄 Access token expirado, renovando...');
                await this.refreshAccessToken();
                console.log('✅ Token renovado, reintentando petición...');

                // Reintentar la petición original con el nuevo token
                return this.fetch(endpoint, options, retryCount + 1);
            } catch (refreshError) {
                console.error('❌ Error al renovar token:', refreshError);
                // Si falla el refresh, redirigir a login
                window.location.href = 'admin-login.html';
                throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
            }
        }

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
