// Main Application Module - Routing and Initialization

const app = {
    // Initialize the application
    async init() {
        // Check authentication first
        const authenticated = await auth.checkAuth();

        if (!authenticated) {
            return;
        }

        // Set up event listeners
        this.setupNavigation();
        this.setupLogout();

        // Load initial view (dashboard)
        this.navigateTo('dashboard');
    },

    // Setup sidebar navigation
    setupNavigation() {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Solo prevenir default si tiene data-section (navegación interna)
                const section = link.dataset.section;

                if (section) {
                    e.preventDefault();

                    // Update active state
                    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Navigate to section
                    this.navigateTo(section);
                }
                // Si no tiene data-section, dejar que navegue normalmente (ej: 2FA)
            });
        });
    },

    // Setup logout button
    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => auth.logout());
        }
    },

    // Navigate to a specific section
    async navigateTo(section) {
        const contentArea = document.getElementById('contentArea');

        switch(section) {
            case 'dashboard':
                await dashboard.load();
                break;

            case 'bookings':
                await bookings.load();
                break;

            case 'messages':
                await messages.load();
                break;

            case 'services':
                if (window.services) {
                    await services.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'calendar':
                if (window.calendar) {
                    await calendar.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'support':
                if (window.supportModule) {
                    await supportModule.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'settings':
                this.showUnderConstruction();
                break;

            default:
                this.showUnderConstruction();
        }
    },

    // Show under construction message
    showUnderConstruction() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚧</div>
                <p>Sección en construcción</p>
            </div>
        `;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Export
window.app = app;
