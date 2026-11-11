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

            // Show/hide Consultancy menu based on Premium plan
            this.updateConsultancyMenu();

            // Restrict menu for staff role
            this.updateStaffRestrictions();

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

    // Get current user data
    getUser() {
        return this.userData;
    },

    // Reportes IA: visible para todos menos staff; con candado si el plan no los incluye
    // (así el negocio sabe que existen; al entrar se explica qué plan los incluye)
    updateAiReportsMenu() {
        const aiReportsLink = document.getElementById('aiReportsLink');
        if (!aiReportsLink) return;

        if (this.userData && this.userData.role === 'staff') {
            aiReportsLink.style.display = 'none';
            return;
        }
        aiReportsLink.style.display = 'flex';

        const enabled = !!(this.businessData && this.businessData.ai_reports_enabled);
        let lock = aiReportsLink.querySelector('.sidebar-lock');
        if (!enabled && !lock) {
            lock = document.createElement('span');
            lock.className = 'sidebar-lock';
            lock.textContent = '🔒';
            lock.style.cssText = 'margin-left: auto; font-size: 0.8rem; opacity: 0.8;';
            aiReportsLink.appendChild(lock);
        } else if (enabled && lock) {
            lock.remove();
        }
    },

    // Show/hide Team menu based on user role (only owners can manage team)
    updateTeamMenu() {
        const teamLink = document.getElementById('teamLink');

        if (teamLink) {
            const user = this.userData;
            if (user && (user.role === 'owner' || user.role === 'admin')) {
                teamLink.style.display = 'flex';
            } else {
                teamLink.style.display = 'none';
            }
        }
    },

    // Show/hide Consultancy menu based on Premium plan
    updateConsultancyMenu() {
        const consultancyLink = document.getElementById('consultancyLink');

        if (consultancyLink) {
            // Solo mostrar si el plan es Premium
            if (this.businessData && this.businessData.plan === 'premium') {
                consultancyLink.style.display = 'flex';
            } else {
                consultancyLink.style.display = 'none';
            }
        }
    },

    // Check if business has Premium plan
    isPremium() {
        return this.businessData && this.businessData.plan === 'premium';
    },

    // Check if AI Reports is enabled for this business
    hasAiReportsEnabled() {
        return this.businessData && this.businessData.ai_reports_enabled === true;
    },

    // Restrict menu items for staff role
    // Staff can only: view dashboard, bookings, calendar, messages
    // Staff cannot: edit services, access settings, widget, AI reports
    updateStaffRestrictions() {
        const user = this.userData;
        if (!user) return;

        const isStaff = user.role === 'staff';

        // Elements to hide for staff
        const restrictedElements = [
            'servicesLink',    // No puede editar servicios
            'widgetLink',      // No puede configurar widget
            'settingsLink',    // No puede acceder a configuración
            'aiReportsLink',   // No puede ver reportes IA (info estratégica)
            'billingLink',     // No puede gestionar facturación
            'consultancyLink'  // No puede solicitar consultorías
        ];

        restrictedElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                if (isStaff) {
                    element.style.display = 'none';
                } else if (elementId !== 'aiReportsLink') {
                    // aiReportsLink se maneja en updateAiReportsMenu
                    element.style.display = 'flex';
                }
            }
        });
    },

    // Check if current user is staff (for use in other modules)
    isStaff() {
        return this.userData && this.userData.role === 'staff';
    },

    // Check if current user can edit (owner or admin)
    canEdit() {
        return this.userData && (this.userData.role === 'owner' || this.userData.role === 'admin');
    }
};

// Export
window.auth = auth;
