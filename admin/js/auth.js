// Authentication Module

const auth = {
    userData: null,
    businessData: null,
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
            this.businessData = response.data.business;
            this.businessId = this.userData.business_id;

            // Update UI with user data
            this.updateUserInfo();

            // Show/hide AI Reports menu based on business settings
            this.updateAiReportsMenu();

            // Show/hide Team menu based on user role
            this.updateTeamMenu();

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
    },

    // Show/hide AI Reports menu based on business settings
    updateAiReportsMenu() {
        const aiReportsLink = document.getElementById('aiReportsLink');

        if (aiReportsLink) {
            if (this.businessData && this.businessData.ai_reports_enabled) {
                aiReportsLink.style.display = 'flex';
            } else {
                aiReportsLink.style.display = 'none';
            }
        }
    },

    // Show/hide Team menu based on user role (only owners can manage team)
    updateTeamMenu() {
        const teamLink = document.getElementById('teamLink');

        if (teamLink) {
            const user = this.getUser();
            if (user && (user.role === 'owner' || user.role === 'admin')) {
                teamLink.style.display = 'flex';
            } else {
                teamLink.style.display = 'none';
            }
        }
    },

    // Check if AI Reports is enabled for this business
    hasAiReportsEnabled() {
        return this.businessData && this.businessData.ai_reports_enabled === true;
    }
};

// Export
window.auth = auth;
