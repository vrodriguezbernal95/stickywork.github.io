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

        // Asistente de ayuda (botón "?" en todas las pantallas)
        if (window.helpAssistant) helpAssistant.init();

        // Load initial view (dashboard, o la sección pedida por una redirección, p. ej. admin/opiniones.html)
        let initialSection = 'dashboard';
        try {
            initialSection = sessionStorage.getItem('openSection') || 'dashboard';
            sessionStorage.removeItem('openSection');
        } catch (e) {}
        this.navigateTo(initialSection);
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

        // Checklist de primeros pasos: abrir Servicios cuenta como "revisar servicios"
        if (section === 'services' && window.dashboard) dashboard.markOnboarding('servicesReviewed');

        // Marcar en el menú la sección activa (también cuando se navega desde código, no solo con clic)
        const menuLink = document.querySelector(`.sidebar-link[data-section="${section}"]`);
        if (menuLink) {
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            menuLink.classList.add('active');
        }

        switch(section) {
            case 'dashboard':
                await dashboard.load();
                break;

            case 'bookings':
                await bookings.load();
                break;

            case 'clients':
                if (window.clients) {
                    await clients.load();
                } else {
                    this.showUnderConstruction();
                }
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

            case 'widget':
                if (window.widget) {
                    await widget.load();
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
                if (window.settings) {
                    await settings.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'opiniones':
                if (window.opiniones) {
                    await opiniones.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'ai-reports':
                if (window.aiReports) {
                    await aiReports.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'team':
                if (window.team) {
                    await team.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'billing':
                if (window.billing) {
                    await billing.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'consultancy':
                if (window.consultancy) {
                    await consultancy.load();
                } else {
                    this.showUnderConstruction();
                }
                break;

            case 'workshops':
                if (window.workshops) {
                    await workshops.load();
                } else {
                    this.showUnderConstruction();
                }
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
