// Authentication Module

const auth = {
    userData: null,
    businessId: null,

    // Check if user is authenticated
    async checkAuth() {
        const token = api.getToken();

        if (!token) {
            this.redirectToLogin();
            return false;
        }

        try {
            const response = await api.get('/api/auth/verify');

            this.userData = response.data.user;
            this.businessId = this.userData.business_id;

            // Update UI with user data
            this.updateUserInfo();

            return true;
        } catch (error) {
            console.error('Auth error:', error);
            api.clearAuthData();
            this.redirectToLogin();
            return false;
        }
    },

    // Update user info in sidebar
    updateUserInfo() {
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl && this.userData) {
            userNameEl.textContent = this.userData.full_name || this.userData.email;
        }

        if (userEmailEl && this.userData) {
            userEmailEl.textContent = this.userData.email;
        }

        if (userAvatarEl && this.userData) {
            const name = this.userData.full_name || this.userData.email;
            userAvatarEl.textContent = name.charAt(0).toUpperCase();
        }
    },

    // Logout user
    async logout() {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }

        api.clearAuthData();
        this.redirectToLogin();
    },

    // Redirect to login page
    redirectToLogin() {
        window.location.href = 'admin-login.html';
    },

    // Get current business ID
    getBusinessId() {
        return this.businessId;
    }
};

// Export
window.auth = auth;
