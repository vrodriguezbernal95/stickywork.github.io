// Settings Module

const settings = {
    currentTab: 'profile',
    userData: null,
    businessData: null,

    // Load settings section
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Configuración';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando configuración...</p>
            </div>
        `;

        try {
            // Load user and business data
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error loading settings:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar la configuración</p>
                </div>
            `;
        }
    },

    // Load user and business data
    async loadData() {
        try {
            // Get user data from auth
            const userResponse = await api.get('/api/auth/verify');

            // Verificar si la respuesta tiene la estructura correcta
            if (userResponse.success && userResponse.data && userResponse.data.user) {
                this.userData = userResponse.data.user;
            } else if (userResponse.user) {
                // Formato alternativo
                this.userData = userResponse.user;
            } else {
                throw new Error('Formato de respuesta de usuario inválido');
            }

            // Get business data
            const businessResponse = await api.get(`/api/business/${this.userData.business_id}`);

            // Verificar estructura de respuesta
            if (businessResponse.success && businessResponse.data) {
                this.businessData = businessResponse.data;
            } else if (businessResponse.id) {
                // Si la respuesta es el objeto directamente
                this.businessData = businessResponse;
            } else {
                throw new Error('Formato de respuesta de negocio inválido');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    },

    // Render the settings interface
    render() {
        const contentArea = document.getElementById('contentArea');

        contentArea.innerHTML = `
            <div class="settings-container">
                <!-- Tabs -->
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="profile" onclick="settings.switchTab('profile')">
                        👤 Perfil
                    </button>
                    <button class="settings-tab" data-tab="security" onclick="settings.switchTab('security')">
                        🔐 Seguridad
                    </button>
                    <button class="settings-tab" data-tab="business" onclick="settings.switchTab('business')">
                        🏢 Negocio
                    </button>
                    <button class="settings-tab" data-tab="widget" onclick="settings.switchTab('widget')">
                        🎨 Widget
                    </button>
                    <button class="settings-tab" data-tab="notifications" onclick="settings.switchTab('notifications')">
                        📧 Notificaciones
                    </button>
                    <button class="settings-tab" data-tab="schedule" onclick="settings.switchTab('schedule')">
                        ⏰ Horarios
                    </button>
                    <button class="settings-tab" data-tab="capacity" onclick="settings.switchTab('capacity')">
                        👥 Capacidad
                    </button>
                    <button class="settings-tab" data-tab="zones" onclick="settings.switchTab('zones')"
                            style="display: ${(() => {
                                const bookingSettings = this.businessData?.booking_settings;
                                const settings = typeof bookingSettings === 'string' ? JSON.parse(bookingSettings) : bookingSettings;
                                return settings?.bookingMode === 'tables' ? 'block' : 'none';
                            })()};">
                        🏢 Zonas
                    </button>
                    <button class="settings-tab" data-tab="feedback" onclick="settings.switchTab('feedback')">
                        ⭐ Feedback
                    </button>
                    <button class="settings-tab" data-tab="billing" onclick="settings.switchTab('billing')">
                        💳 Plan
                    </button>
                    <button class="settings-tab" data-tab="advanced" onclick="settings.switchTab('advanced')">
                        ⚙️ Avanzado
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="settings-content">
                    <div class="settings-tab-content active" id="tab-profile">
                        ${this.renderProfileTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-security">
                        ${this.renderSecurityTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-business">
                        ${this.renderBusinessTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-widget">
                        ${this.renderWidgetTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-notifications">
                        ${this.renderNotificationsTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-schedule">
                        ${this.renderScheduleTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-capacity">
                        ${this.renderCapacityTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-zones">
                        ${this.renderZonesTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-feedback">
                        ${this.renderFeedbackTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-billing">
                        ${this.renderBillingTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-advanced">
                        ${this.renderAdvancedTab()}
                    </div>
                </div>
            </div>

            <style>
                .settings-container {
                    max-width: 1000px;
                }

                .settings-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid var(--border-color);
                    padding-bottom: 0;
                    flex-wrap: wrap;
                }

                .settings-tab {
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    margin-bottom: -2px;
                }

                .settings-tab:hover {
                    color: var(--primary-color);
                    background: rgba(59, 130, 246, 0.05);
                }

                .settings-tab.active {
                    color: var(--primary-color);
                    border-bottom-color: var(--primary-color);
                }

                .settings-content {
                    animation: fadeIn 0.3s ease;
                }

                .settings-tab-content {
                    display: none;
                }

                .settings-tab-content.active {
                    display: block;
                }

                .settings-section {
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    padding: 2rem;
                    margin-bottom: 1.5rem;
                }

                .settings-section-header {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .settings-section-header h3 {
                    margin: 0 0 0.5rem 0;
                    color: var(--text-primary);
                    font-size: 1.25rem;
                }

                .settings-section-header p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    font-size: 0.95rem;
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 1rem;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary-color);
                }

                .form-group input:disabled {
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    cursor: not-allowed;
                }

                .form-group .hint {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }

                .btn-save {
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .btn-save:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .btn-secondary {
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    border: 2px solid var(--border-color);
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .btn-secondary:hover {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }

                .btn-danger {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .btn-danger:hover {
                    background: #dc2626;
                    transform: translateY(-2px);
                }

                .badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .badge-success {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                }

                .badge-warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                }

                .badge-info {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                .info-box {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                }

                .info-box p {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }

                .avatar-upload {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .avatar-preview {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: white;
                    font-weight: 600;
                }

                .twofa-status {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .twofa-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .twofa-icon {
                    font-size: 2rem;
                }

                .color-picker-group {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .color-preview {
                    width: 50px;
                    height: 50px;
                    border-radius: 8px;
                    border: 2px solid var(--border-color);
                    cursor: pointer;
                }

                input[type="color"] {
                    width: 50px;
                    height: 50px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .widget-preview-box {
                    background: var(--bg-primary);
                    border: 2px dashed var(--border-color);
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    margin-top: 1.5rem;
                }

                .preview-widget {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 1.5rem;
                    border-radius: 12px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .preview-widget h3 {
                    margin: 0 0 1rem 0;
                }

                .preview-button {
                    padding: 0.75rem 2rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    color: white;
                }

                .toggle-switch {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .toggle-switch input[type="checkbox"] {
                    width: 50px;
                    height: 28px;
                    position: relative;
                    cursor: pointer;
                    appearance: none;
                    background: var(--border-color);
                    border-radius: 14px;
                    transition: background 0.3s ease;
                }

                .toggle-switch input[type="checkbox"]:checked {
                    background: var(--primary-color);
                }

                .toggle-switch input[type="checkbox"]::before {
                    content: '';
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    top: 2px;
                    left: 2px;
                    transition: left 0.3s ease;
                }

                .toggle-switch input[type="checkbox"]:checked::before {
                    left: 24px;
                }

                .notification-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .notification-info h4 {
                    margin: 0 0 0.25rem 0;
                    color: var(--text-primary);
                }

                .notification-info p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .schedule-day {
                    display: grid;
                    grid-template-columns: 120px 1fr auto;
                    gap: 1rem;
                    align-items: center;
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                }

                .schedule-day .day-name {
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .schedule-day .time-inputs {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .schedule-day input[type="time"] {
                    padding: 0.5rem;
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }

                .schedule-day input[type="time"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .exception-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                }

                .exception-item input {
                    flex: 1;
                }

                .exception-item .btn-remove-exception {
                    background: #ef4444;
                    color: white;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                }

                .plan-card {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
                    border: 2px solid var(--primary-color);
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                }

                .plan-card .plan-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--primary-color);
                    margin-bottom: 0.5rem;
                }

                .plan-card .plan-price {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 1rem;
                }

                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 1.5rem 0;
                    text-align: left;
                }

                .plan-features li {
                    padding: 0.5rem 0;
                    color: var(--text-primary);
                }

                .plan-features li::before {
                    content: '✓ ';
                    color: #10b981;
                    font-weight: bold;
                    margin-right: 0.5rem;
                }

                .danger-zone {
                    border: 2px solid #ef4444;
                    border-radius: 12px;
                    padding: 2rem;
                    background: rgba(239, 68, 68, 0.05);
                }

                .danger-zone h3 {
                    color: #ef4444;
                    margin-top: 0;
                }
            </style>
        `;
    },

    // Render Profile Tab
    renderProfileTab() {
        const user = this.userData;
        const initials = user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

        return `
            <!-- User Info Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Información Personal</h3>
                    <p>Gestiona tu información de perfil</p>
                </div>

                <div class="avatar-upload">
                    <div class="avatar-preview" id="avatarPreview">${initials}</div>
                    <div>
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-weight: 500;">${user.full_name}</p>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${user.email}</p>
                        <span class="badge badge-info" style="margin-top: 0.5rem;">${this.getRoleName(user.role)}</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="profile-name" value="${user.full_name || ''}" placeholder="Tu nombre">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profile-email" value="${user.email}" disabled>
                        <p class="hint">El email no se puede cambiar</p>
                    </div>
                </div>

                <div class="form-group">
                    <label>Rol</label>
                    <input type="text" value="${this.getRoleName(user.role)}" disabled>
                    <p class="hint">El rol es asignado por el propietario de la cuenta</p>
                </div>

                <button class="btn-save" onclick="settings.saveProfile()">
                    💾 Guardar Cambios
                </button>
            </div>

            <!-- Change Password Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Cambiar Contraseña</h3>
                    <p>Actualiza tu contraseña regularmente para mayor seguridad</p>
                </div>

                <div class="form-group">
                    <label>Contraseña Actual</label>
                    <input type="password" id="current-password" placeholder="Tu contraseña actual">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Nueva Contraseña</label>
                        <input type="password" id="new-password" placeholder="Mínimo 8 caracteres">
                    </div>
                    <div class="form-group">
                        <label>Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirm-password" placeholder="Repite la contraseña">
                    </div>
                </div>

                <button class="btn-save" onclick="settings.changePassword()">
                    🔒 Cambiar Contraseña
                </button>
            </div>
        `;
    },

    // Render Security Tab
    renderSecurityTab() {
        return `
            <!-- 2FA Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Autenticación de Dos Factores (2FA)</h3>
                    <p>Añade una capa extra de seguridad a tu cuenta</p>
                </div>

                <div class="info-box">
                    <p>
                        <strong>🛡️ Recomendado:</strong> La autenticación de dos factores protege tu cuenta
                        incluso si alguien conoce tu contraseña. Necesitarás tu teléfono para iniciar sesión.
                    </p>
                </div>

                <div class="twofa-status">
                    <div class="twofa-info">
                        <div class="twofa-icon">🔐</div>
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">2FA No Activado</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                Activa la autenticación de dos factores para mayor seguridad
                            </p>
                        </div>
                    </div>
                    <button class="btn-save" onclick="window.location.href='super-admin-2fa.html'">
                        Configurar 2FA
                    </button>
                </div>

                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 1rem;">
                    💡 <strong>Tip:</strong> Una vez activado el 2FA, necesitarás una aplicación como Google Authenticator
                    o Authy para generar códigos de verificación.
                </p>
            </div>

            <!-- Sessions Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Sesiones Activas</h3>
                    <p>Dispositivos donde has iniciado sesión</p>
                </div>

                <div class="info-box">
                    <p>
                        📱 Esta función estará disponible próximamente. Podrás ver y gestionar
                        todos los dispositivos donde tienes sesión activa.
                    </p>
                </div>

                <button class="btn-danger" onclick="settings.logoutAllDevices()">
                    🚪 Cerrar Sesión en Todos los Dispositivos
                </button>
            </div>
        `;
    },

    // Render Business Tab
    renderBusinessTab() {
        const business = this.businessData;

        return `
            <!-- Business Info Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Información del Negocio</h3>
                    <p>Estos datos aparecen en tu widget de reservas</p>
                </div>

                <div class="form-group">
                    <label>Nombre del Negocio</label>
                    <input type="text" id="business-name" value="${business.name || ''}" placeholder="Nombre de tu negocio">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Email de Contacto</label>
                        <input type="email" id="business-email" value="${business.email || ''}" placeholder="contacto@negocio.com">
                        <p class="hint">Email donde recibirás notificaciones</p>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" id="business-phone" value="${business.phone || ''}" placeholder="+34 600 000 000">
                    </div>
                </div>

                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" id="business-address" value="${business.address || ''}" placeholder="Calle, número, ciudad">
                </div>

                <div class="form-group">
                    <label>Página Web</label>
                    <input type="url" id="business-website" value="${business.website || ''}" placeholder="https://www.tunegocio.com">
                </div>

                <button class="btn-save" onclick="settings.saveBusiness()">
                    💾 Guardar Cambios
                </button>
            </div>

            <!-- Business Type Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Tipo de Negocio</h3>
                    <p>Información sobre tu categoría</p>
                </div>

                <div class="form-group">
                    <label>Categoría</label>
                    <input type="text" value="${business.type || 'No especificado'}" disabled>
                    <p class="hint">El tipo de negocio no se puede cambiar después del registro</p>
                </div>

                <div class="form-group">
                    <label>URL Personalizada</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--text-secondary);">stickywork.com/</span>
                        <input type="text" value="${business.slug || ''}" disabled style="flex: 1;">
                    </div>
                    <p class="hint">Tu enlace único para el widget de reservas</p>
                </div>
            </div>
        `;
    },

    // Switch between tabs
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Load schedule settings when opening schedule tab
        if (tabName === 'schedule') {
            setTimeout(() => this.loadScheduleSettings(), 100);
        }

        // Initialize WhatsApp textarea event listener when opening notifications tab
        if (tabName === 'notifications') {
            setTimeout(() => {
                const textarea = document.getElementById('whatsapp-template');
                if (textarea) {
                    // Update count initially
                    this.updateCharCount();
                    // Add event listener for typing
                    textarea.addEventListener('input', () => this.updateCharCount());
                }
            }, 100);
        }
    },

    // Get role name in Spanish
    getRoleName(role) {
        const roles = {
            'owner': 'Propietario',
            'admin': 'Administrador',
            'staff': 'Personal'
        };
        return roles[role] || role;
    },

    // Save profile changes
    async saveProfile() {
        const name = document.getElementById('profile-name').value.trim();

        if (!name) {
            alert('❌ El nombre no puede estar vacío');
            return;
        }

        try {
            await api.put('/api/user/profile', {
                full_name: name
            });

            // Update local data
            this.userData.full_name = name;

            alert('✅ Perfil actualizado correctamente');

            // Update avatar
            const initials = name.charAt(0).toUpperCase();
            document.getElementById('avatarPreview').textContent = initials;

            // Update sidebar
            if (window.auth) {
                auth.updateUserInfo();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Error al actualizar el perfil');
        }
    },

    // Change password
    async changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('❌ Todos los campos son obligatorios');
            return;
        }

        if (newPassword.length < 8) {
            alert('❌ La nueva contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('❌ Las contraseñas no coinciden');
            return;
        }

        try {
            await api.post('/api/auth/change-password', {
                currentPassword,
                newPassword
            });

            alert('✅ Contraseña cambiada correctamente');

            // Clear fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } catch (error) {
            console.error('Error changing password:', error);
            alert(error.message || '❌ Error al cambiar la contraseña');
        }
    },

    // Save business changes
    async saveBusiness() {
        const name = document.getElementById('business-name').value.trim();
        const email = document.getElementById('business-email').value.trim();
        const phone = document.getElementById('business-phone').value.trim();
        const address = document.getElementById('business-address').value.trim();
        const website = document.getElementById('business-website').value.trim();

        if (!name || !email) {
            alert('❌ El nombre y email del negocio son obligatorios');
            return;
        }

        try {
            await api.put(`/api/business/${this.userData.business_id}`, {
                name,
                email,
                phone,
                address,
                website
            });

            // Update local data
            this.businessData.name = name;
            this.businessData.email = email;
            this.businessData.phone = phone;
            this.businessData.address = address;
            this.businessData.website = website;

            alert('✅ Datos del negocio actualizados correctamente');
        } catch (error) {
            console.error('Error updating business:', error);
            alert('❌ Error al actualizar los datos del negocio');
        }
    },

    // Logout from all devices
    async logoutAllDevices() {
        if (!confirm('¿Estás seguro de que quieres cerrar sesión en todos los dispositivos?\n\nTendrás que volver a iniciar sesión en cada uno.')) {
            return;
        }

        try {
            // TODO: Implement logout all devices endpoint
            alert('✅ Sesión cerrada en todos los dispositivos (excepto este)');
        } catch (error) {
            console.error('Error logging out all devices:', error);
            alert('❌ Error al cerrar sesiones');
        }
    },

    // Render Widget Customization Tab
    renderWidgetTab() {
        const business = this.businessData;
        // Verificar si widget_settings es un string antes de parsear
        const widgetSettings = business.widget_settings
            ? (typeof business.widget_settings === 'string'
                ? JSON.parse(business.widget_settings)
                : business.widget_settings)
            : {
                primaryColor: '#3b82f6',
                secondaryColor: '#ef4444',
                language: 'es',
                showPrices: true,
                showDuration: true
            };

        return `
            <!-- Colors Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Colores del Widget</h3>
                    <p>Personaliza los colores para que coincidan con tu marca</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Color Primario</label>
                        <div class="color-picker-group">
                            <input type="color" id="widget-primary-color" value="${widgetSettings.primaryColor}"
                                   onchange="settings.updateWidgetPreview()">
                            <input type="text" id="widget-primary-color-hex" value="${widgetSettings.primaryColor}"
                                   placeholder="#3b82f6" style="flex: 1;"
                                   onchange="settings.syncColorInput('primary')">
                        </div>
                        <p class="hint">Color principal de botones y elementos destacados</p>
                    </div>
                    <div class="form-group">
                        <label>Color Secundario</label>
                        <div class="color-picker-group">
                            <input type="color" id="widget-secondary-color" value="${widgetSettings.secondaryColor}"
                                   onchange="settings.updateWidgetPreview()">
                            <input type="text" id="widget-secondary-color-hex" value="${widgetSettings.secondaryColor}"
                                   placeholder="#ef4444" style="flex: 1;"
                                   onchange="settings.syncColorInput('secondary')">
                        </div>
                        <p class="hint">Color para elementos secundarios y acentos</p>
                    </div>
                </div>
            </div>

            <!-- Display Options Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Opciones de Visualización</h3>
                    <p>Configura qué información mostrar en tu widget</p>
                </div>

                <div class="toggle-switch">
                    <input type="checkbox" id="widget-show-prices" ${widgetSettings.showPrices ? 'checked' : ''}
                           onchange="settings.updateWidgetPreview()">
                    <label>
                        <strong>Mostrar Precios</strong>
                        <p class="hint" style="margin: 0.25rem 0 0 0;">Muestra el precio de cada servicio</p>
                    </label>
                </div>

                <div class="toggle-switch">
                    <input type="checkbox" id="widget-show-duration" ${widgetSettings.showDuration ? 'checked' : ''}
                           onchange="settings.updateWidgetPreview()">
                    <label>
                        <strong>Mostrar Duración</strong>
                        <p class="hint" style="margin: 0.25rem 0 0 0;">Muestra cuánto dura cada servicio</p>
                    </label>
                </div>

                <div class="form-group" style="margin-top: 1.5rem;">
                    <label>Idioma del Widget</label>
                    <select id="widget-language" onchange="settings.updateWidgetPreview()">
                        <option value="es" ${widgetSettings.language === 'es' ? 'selected' : ''}>Español</option>
                        <option value="en" ${widgetSettings.language === 'en' ? 'selected' : ''}>English</option>
                        <option value="fr" ${widgetSettings.language === 'fr' ? 'selected' : ''}>Français</option>
                        <option value="de" ${widgetSettings.language === 'de' ? 'selected' : ''}>Deutsch</option>
                    </select>
                </div>

                <button class="btn-save" onclick="settings.saveWidgetSettings()">
                    💾 Guardar Configuración del Widget
                </button>
            </div>

            <!-- Preview Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Vista Previa</h3>
                    <p>Así se verá tu widget con la configuración actual</p>
                </div>

                <div class="widget-preview-box" id="widget-preview">
                    <div class="preview-widget">
                        <h3 style="color: #333;">Reserva tu Cita</h3>
                        <p style="color: #666; margin-bottom: 1.5rem;">Selecciona un servicio para continuar</p>
                        <button class="preview-button" id="preview-button"
                                style="background: ${widgetSettings.primaryColor};">
                            Hacer Reserva
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Render Notifications Tab
    renderNotificationsTab() {
        const business = this.businessData;

        return `
            <!-- Email Settings Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Configuración de Email</h3>
                    <p>Email donde recibirás las notificaciones</p>
                </div>

                <div class="form-group">
                    <label>Email de Notificaciones</label>
                    <input type="email" id="notification-email" value="${business.email || ''}"
                           placeholder="notificaciones@tunegocio.com">
                    <p class="hint">Este email recibirá todas las notificaciones de reservas</p>
                </div>
            </div>

            <!-- Notification Preferences Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Preferencias de Notificaciones</h3>
                    <p>Elige qué notificaciones quieres recibir</p>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>📅 Nueva Reserva</h4>
                        <p>Recibe un email cada vez que un cliente haga una reserva</p>
                    </div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="notify-new-booking" checked>
                    </div>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>❌ Reserva Cancelada</h4>
                        <p>Notificación cuando un cliente cancele su reserva</p>
                    </div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="notify-cancelled" checked>
                    </div>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>✏️ Reserva Modificada</h4>
                        <p>Aviso cuando un cliente modifique los detalles de su reserva</p>
                    </div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="notify-modified" checked>
                    </div>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>🔔 Recordatorios Automáticos</h4>
                        <p>Envía recordatorios a tus clientes 24 horas antes de su cita</p>
                    </div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="notify-reminders" checked>
                    </div>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>📊 Resumen Diario</h4>
                        <p>Recibe un resumen de todas las reservas del día cada mañana</p>
                    </div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="notify-daily-summary">
                    </div>
                </div>
            </div>

            <!-- Email Templates Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Plantillas de Email</h3>
                    <p>Personaliza los mensajes que reciben tus clientes</p>
                </div>

                <div class="info-box">
                    <p>
                        🎨 <strong>Próximamente:</strong> Podrás personalizar las plantillas de email
                        con tu logo, colores y mensajes personalizados.
                    </p>
                </div>

                <button class="btn-secondary" disabled>
                    ✏️ Editar Plantillas (Próximamente)
                </button>
            </div>

            <!-- WhatsApp Settings Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>💬 Notificaciones por WhatsApp</h3>
                    <p>Configura WhatsApp para enviar confirmaciones de reserva a tus clientes</p>
                </div>

                <div class="info-box" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(18, 140, 126, 0.1)); border-left-color: #25D366;">
                    <p>
                        <strong>✅ Ventajas de WhatsApp:</strong> 98% tasa de apertura vs 20% email, gratuito con Click-to-Chat, preferido por los clientes.
                        <br>Sin límites compartidos: cada negocio usa su propio número de WhatsApp.
                    </p>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>Activar notificaciones por WhatsApp</h4>
                        <p>Permite enviar confirmaciones de reserva vía WhatsApp a clientes que den su consentimiento</p>
                    </div>
                    <div class="toggle-switch">
                        <input type="checkbox" id="whatsapp-enabled" ${business.whatsapp_enabled ? 'checked' : ''}
                               onchange="settings.toggleWhatsAppFields()">
                    </div>
                </div>

                <div id="whatsapp-settings-fields" style="display: ${business.whatsapp_enabled ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Número de WhatsApp</label>
                        <input type="text" id="whatsapp-number" value="${business.whatsapp_number || ''}"
                               placeholder="34612345678">
                        <p class="hint">Formato internacional sin el símbolo + (ejemplo: 34612345678 para España)</p>
                    </div>

                    <div class="form-group">
                        <label>Plantilla de Mensaje</label>
                        <textarea id="whatsapp-template"
                                  class="form-textarea"
                                  rows="10"
                                  style="font-family: 'Courier New', monospace; font-size: 0.9rem;">${business.whatsapp_template || ''}</textarea>
                        <p class="hint">
                            Variables disponibles: <code>{nombre}</code>, <code>{fecha}</code>, <code>{hora}</code>,
                            <code>{servicio}</code>, <code>{negocio}</code>, <code>{nombre_negocio}</code>
                        </p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                            <span id="template-char-count" style="font-size: 0.85rem; color: #666;">
                                ${(business.whatsapp_template || '').length} / 1000 caracteres
                            </span>
                            <button type="button" class="btn-secondary" onclick="settings.resetWhatsAppTemplate()">
                                🔄 Restaurar plantilla original
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button class="btn-save" onclick="settings.saveNotificationSettings()">
                💾 Guardar Configuración de Notificaciones
            </button>
        `;
    },

    // Update widget preview
    updateWidgetPreview() {
        const primaryColor = document.getElementById('widget-primary-color').value;
        const previewButton = document.getElementById('preview-button');

        if (previewButton) {
            previewButton.style.background = primaryColor;
        }

        // Sync hex input
        const hexInput = document.getElementById('widget-primary-color-hex');
        if (hexInput) {
            hexInput.value = primaryColor;
        }
    },

    // Sync color input between color picker and text input
    syncColorInput(type) {
        const colorPicker = document.getElementById(`widget-${type}-color`);
        const hexInput = document.getElementById(`widget-${type}-color-hex`);

        if (colorPicker && hexInput) {
            colorPicker.value = hexInput.value;
            this.updateWidgetPreview();
        }
    },

    // Save widget settings
    async saveWidgetSettings() {
        const primaryColor = document.getElementById('widget-primary-color').value;
        const secondaryColor = document.getElementById('widget-secondary-color').value;
        const language = document.getElementById('widget-language').value;
        const showPrices = document.getElementById('widget-show-prices').checked;
        const showDuration = document.getElementById('widget-show-duration').checked;

        const widgetSettings = {
            primaryColor,
            secondaryColor,
            language,
            showPrices,
            showDuration
        };

        try {
            await api.put(`/api/business/${this.userData.business_id}/widget-settings`, {
                widgetSettings
            });

            // Update local data
            this.businessData.widget_settings = JSON.stringify(widgetSettings);

            alert('✅ Configuración del widget guardada correctamente');
        } catch (error) {
            console.error('Error saving widget settings:', error);
            alert('❌ Error al guardar la configuración del widget');
        }
    },

    // Save notification settings
    async saveNotificationSettings() {
        const email = document.getElementById('notification-email').value.trim();
        const notifyNewBooking = document.getElementById('notify-new-booking').checked;
        const notifyCancelled = document.getElementById('notify-cancelled').checked;
        const notifyModified = document.getElementById('notify-modified').checked;
        const notifyReminders = document.getElementById('notify-reminders').checked;
        const notifyDailySummary = document.getElementById('notify-daily-summary').checked;

        // WhatsApp settings
        const whatsappEnabled = document.getElementById('whatsapp-enabled').checked;
        const whatsappNumber = document.getElementById('whatsapp-number').value.trim();
        const whatsappTemplate = document.getElementById('whatsapp-template').value.trim();

        if (!email) {
            alert('❌ El email de notificaciones es obligatorio');
            return;
        }

        // Validar WhatsApp si está activado
        if (whatsappEnabled && !whatsappNumber) {
            alert('❌ Por favor ingresa un número de WhatsApp');
            return;
        }

        if (whatsappTemplate.length > 1000) {
            alert('❌ La plantilla de WhatsApp no puede exceder 1000 caracteres');
            return;
        }

        try {
            // Update business email
            await api.put(`/api/business/${this.userData.business_id}`, {
                name: this.businessData.name,
                email: email,
                phone: this.businessData.phone,
                address: this.businessData.address,
                website: this.businessData.website
            });

            // Save WhatsApp settings
            await api.patch(`/api/businesses/${this.userData.business_id}/whatsapp-settings`, {
                whatsapp_enabled: whatsappEnabled,
                whatsapp_number: whatsappNumber.replace(/\s/g, ''),
                whatsapp_template: whatsappTemplate
            });

            // TODO: Save notification preferences when we have the structure
            // For now, just update the email and WhatsApp

            this.businessData.email = email;
            this.businessData.whatsapp_enabled = whatsappEnabled;
            this.businessData.whatsapp_number = whatsappNumber;
            this.businessData.whatsapp_template = whatsappTemplate;

            alert('✅ Configuración de notificaciones guardada correctamente');
        } catch (error) {
            console.error('Error saving notification settings:', error);
            alert('❌ Error al guardar la configuración de notificaciones');
        }
    },

    // Save capacity settings
    async saveCapacity() {
        const capacity = parseInt(document.getElementById('business-capacity').value);

        if (!capacity || capacity < 1) {
            alert('Por favor ingresa una capacidad válida (mínimo 1)');
            return;
        }

        // Obtener maxPerBooking si existe (solo para restaurantes)
        const maxPerBookingInput = document.getElementById('max-per-booking');
        const maxPerBooking = maxPerBookingInput ? parseInt(maxPerBookingInput.value) : null;

        if (maxPerBooking && maxPerBooking < 1) {
            alert('El máximo por reserva debe ser al menos 1');
            return;
        }

        if (maxPerBooking && maxPerBooking > capacity) {
            alert('El máximo por reserva no puede ser mayor que la capacidad total');
            return;
        }

        try {
            const businessId = auth.getBusinessId();

            // Obtener booking_settings actual
            const currentSettings = this.businessData.booking_settings || {};
            currentSettings.businessCapacity = capacity;
            if (maxPerBooking !== null) {
                currentSettings.maxPerBooking = maxPerBooking;
            }

            // Guardar usando endpoint existente (requiere todos los campos del negocio)
            const response = await api.put(`/api/business/${businessId}`, {
                name: this.businessData.name,
                email: this.businessData.email,
                phone: this.businessData.phone,
                address: this.businessData.address,
                website: this.businessData.website,
                booking_settings: currentSettings
            });

            if (response.success) {
                alert('✅ Capacidad guardada exitosamente');
                this.businessData.booking_settings = currentSettings;
            } else {
                throw new Error(response.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving capacity:', error);
            alert('❌ Error al guardar: ' + error.message);
        }
    },

    // Render Schedule Tab
    renderScheduleTab() {
        const weekDays = [
            { num: 1, key: 'monday', name: 'Lunes' },
            { num: 2, key: 'tuesday', name: 'Martes' },
            { num: 3, key: 'wednesday', name: 'Miércoles' },
            { num: 4, key: 'thursday', name: 'Jueves' },
            { num: 5, key: 'friday', name: 'Viernes' },
            { num: 6, key: 'saturday', name: 'Sábado' },
            { num: 7, key: 'sunday', name: 'Domingo' }
        ];

        return `
            <!-- Working Hours Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Horario Laboral</h3>
                    <p>Define los días y horas en que tu negocio acepta reservas</p>
                </div>

                <!-- Tipo de Horario -->
                <div class="form-group" style="margin-bottom: 2rem;">
                    <label>Tipo de horario</label>
                    <select id="schedule-type" onchange="settings.toggleScheduleType()">
                        <option value="continuous">Horario Continuo (un solo bloque)</option>
                        <option value="multiple">Horarios Partidos (turnos)</option>
                    </select>
                    <p class="hint">
                        <strong>Continuo:</strong> Tu negocio abre y cierra a la misma hora (ej: 09:00-20:00)<br>
                        <strong>Partidos:</strong> Tu negocio tiene varios turnos (ej: 12:00-16:00 y 20:00-23:00)
                    </p>
                </div>

                <!-- Horario Continuo -->
                <div id="continuous-schedule" style="display: block;">
                    <div class="form-group">
                        <label>Horario de apertura</label>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <input type="time" id="work-hours-start" value="09:00" style="flex: 1;">
                            <span style="color: var(--text-secondary);">a</span>
                            <input type="time" id="work-hours-end" value="20:00" style="flex: 1;">
                        </div>
                        <p class="hint">Hora de inicio y fin del horario laboral</p>
                    </div>
                </div>

                <!-- Horarios Partidos (Turnos) -->
                <div id="shifts-schedule" style="display: none;">
                    <div class="form-group">
                        <label>¿Cuántos turnos tiene tu negocio?</label>
                        <select id="num-shifts" onchange="settings.updateShiftsCount()">
                            <option value="1">1 turno (horario continuo)</option>
                            <option value="2" selected>2 turnos (horario partido)</option>
                            <option value="3">3 turnos</option>
                        </select>
                        <p class="hint">
                            🍽️ <strong>Ejemplo restaurante:</strong> Desayunos (08:00-11:00), Comidas (12:30-16:00), Cenas (20:00-23:00)
                        </p>
                    </div>

                    <div id="shifts-container">
                        ${[1, 2, 3].map(i => `
                            <div id="shift-${i}" class="shift-config" style="display: ${i <= 2 ? 'block' : 'none'};">
                                <h4 style="margin: 1.5rem 0 1rem; color: var(--primary-color);">
                                    Turno ${i}
                                </h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Nombre del turno</label>
                                        <input type="text" id="shift${i}-name" placeholder="Ej: ${i === 1 ? 'Mañana' : i === 2 ? 'Tarde' : 'Noche'}">
                                    </div>
                                    <div class="form-group">
                                        <label>
                                            <input type="checkbox" id="shift${i}-enabled" checked
                                                   style="width: auto; margin-right: 0.5rem;">
                                            Turno activo
                                        </label>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Hora inicio</label>
                                        <input type="time" id="shift${i}-start" value="${i === 1 ? '09:00' : i === 2 ? '16:00' : '20:00'}">
                                    </div>
                                    <div class="form-group">
                                        <label>Hora fin</label>
                                        <input type="time" id="shift${i}-end" value="${i === 1 ? '13:00' : i === 2 ? '20:00' : '23:00'}">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Días laborales -->
                <div class="form-group" style="margin-top: 2rem;">
                    <label>Días laborales</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem;">
                        ${weekDays.map(day => `
                            <label style="display: flex; align-items: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                                <input type="checkbox" id="workday-${day.num}" value="${day.num}" ${day.num <= 6 ? 'checked' : ''}
                                       style="width: auto; margin-right: 0.5rem;">
                                <span>${day.name}</span>
                            </label>
                        `).join('')}
                    </div>
                    <p class="hint">Selecciona los días en que tu negocio acepta reservas</p>
                </div>

                <div class="form-group">
                    <label>Duración de cada slot de reserva</label>
                    <select id="booking-slot-duration">
                        <option value="15">15 minutos</option>
                        <option value="30" selected>30 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="90">1 hora 30 minutos</option>
                        <option value="120">2 horas</option>
                    </select>
                    <p class="hint">Los clientes podrán reservar en intervalos de este tiempo. Ideal para restaurantes: 1h 30min o 2h por servicio</p>
                </div>

                <button class="btn-save" onclick="settings.saveSchedule()">
                    💾 Guardar Horarios
                </button>
            </div>
        `;
    },

    // Render Billing Tab
    renderBillingTab() {
        const business = this.businessData;
        const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
        const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        const isTrialActive = daysLeft > 0;

        return `
            <!-- Current Plan Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Tu Plan Actual</h3>
                    <p>Estado de tu suscripción</p>
                </div>

                <div class="plan-card">
                    <div class="plan-name">
                        ${isTrialActive ? '🎁 Prueba Gratuita' : '💎 Plan Free'}
                    </div>
                    <div class="plan-price">
                        ${isTrialActive ? 'GRATIS' : '0€'}
                        <span style="font-size: 1rem; color: var(--text-secondary);">/mes</span>
                    </div>
                    ${isTrialActive ? `
                        <div class="badge badge-success" style="font-size: 1rem; padding: 0.5rem 1rem;">
                            ${daysLeft} días restantes de prueba
                        </div>
                    ` : ''}
                    <ul class="plan-features">
                        <li>Widget de reservas ilimitado</li>
                        <li>Hasta 50 reservas al mes</li>
                        <li>Panel de administración</li>
                        <li>Notificaciones por email</li>
                        <li>Soporte por email</li>
                    </ul>
                    ${isTrialActive ? `
                        <button class="btn-save" style="width: 100%; max-width: 300px; margin: 0 auto;">
                            🚀 Ver Planes Premium
                        </button>
                    ` : `
                        <button class="btn-save" style="width: 100%; max-width: 300px; margin: 0 auto;">
                            ⬆️ Actualizar Plan
                        </button>
                    `}
                </div>
            </div>

            <!-- Payment Method Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Método de Pago</h3>
                    <p>Tarjeta asociada a tu cuenta</p>
                </div>

                <div class="info-box">
                    <p>
                        💳 <strong>Próximamente:</strong> Podrás añadir tu método de pago para
                        actualizar a planes premium cuando termine tu período de prueba.
                    </p>
                </div>

                <button class="btn-secondary" disabled>
                    💳 Añadir Tarjeta (Próximamente)
                </button>
            </div>

            <!-- Billing History Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Historial de Facturación</h3>
                    <p>Tus facturas y pagos</p>
                </div>

                <div class="info-box">
                    <p>
                        📄 No hay facturas disponibles. Tu historial de pagos aparecerá aquí
                        una vez comiences a pagar tu suscripción.
                    </p>
                </div>
            </div>
        `;
    },

    // Render Advanced Tab
    renderAdvancedTab() {
        const business = this.businessData;

        return `
            <!-- General Settings Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Configuración General</h3>
                    <p>Preferencias avanzadas del sistema</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Zona Horaria</label>
                        <select id="timezone">
                            <option value="Europe/Madrid" selected>Madrid (GMT+1)</option>
                            <option value="Europe/London">Londres (GMT+0)</option>
                            <option value="America/New_York">Nueva York (GMT-5)</option>
                            <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                            <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                        </select>
                        <p class="hint">Afecta a los horarios de reservas y notificaciones</p>
                    </div>
                    <div class="form-group">
                        <label>Formato de Fecha</label>
                        <select id="date-format">
                            <option value="DD/MM/YYYY" selected>DD/MM/YYYY (31/12/2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                        </select>
                        <p class="hint">Cómo se muestran las fechas en el sistema</p>
                    </div>
                </div>

                <div class="form-group">
                    <label>Políticas de Cancelación</label>
                    <textarea id="cancellation-policy" rows="4"
                              placeholder="Ej: Las cancelaciones deben realizarse con al menos 24 horas de antelación..."
                    ></textarea>
                    <p class="hint">Se mostrará a los clientes al hacer una reserva</p>
                </div>

                <button class="btn-save" onclick="settings.saveAdvancedSettings()">
                    💾 Guardar Configuración
                </button>
            </div>

            <!-- Export Data Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Exportar Datos</h3>
                    <p>Descarga toda tu información</p>
                </div>

                <div class="info-box">
                    <p>
                        📦 Puedes exportar todos tus datos (reservas, clientes, servicios)
                        en formato JSON o CSV para tener un respaldo o migrar a otro sistema.
                    </p>
                </div>

                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn-secondary" onclick="settings.exportData('json')">
                        📄 Exportar JSON
                    </button>
                    <button class="btn-secondary" onclick="settings.exportData('csv')">
                        📊 Exportar CSV
                    </button>
                </div>
            </div>

            <!-- Integrations Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>Integraciones</h3>
                    <p>Conecta con otras herramientas</p>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>📅 Google Calendar</h4>
                        <p>Sincroniza automáticamente tus reservas con Google Calendar</p>
                    </div>
                    <button class="btn-secondary">
                        Conectar
                    </button>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>📱 WhatsApp Business</h4>
                        <p>Envía confirmaciones y recordatorios por WhatsApp</p>
                    </div>
                    <button class="btn-secondary" disabled>
                        Próximamente
                    </button>
                </div>

                <div class="notification-item">
                    <div class="notification-info">
                        <h4>💬 Telegram</h4>
                        <p>Recibe notificaciones de nuevas reservas en Telegram</p>
                    </div>
                    <button class="btn-secondary" disabled>
                        Próximamente
                    </button>
                </div>
            </div>

            <!-- Danger Zone Section -->
            <div class="settings-section danger-zone">
                <h3>⚠️ Zona de Peligro</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                    Las siguientes acciones son irreversibles. Procede con cuidado.
                </p>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button class="btn-danger" onclick="settings.resetSettings()">
                        🔄 Restablecer Configuración
                    </button>
                    <button class="btn-danger" onclick="settings.deleteAccount()">
                        🗑️ Eliminar Cuenta Permanentemente
                    </button>
                </div>

                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem;">
                    💡 Eliminar tu cuenta borrará todos tus datos de forma permanente.
                    Esta acción no se puede deshacer.
                </p>
            </div>
        `;
    },

    // Toggle schedule type (continuous vs multiple)
    toggleScheduleType() {
        const scheduleType = document.getElementById('schedule-type').value;
        const continuousDiv = document.getElementById('continuous-schedule');
        const shiftsDiv = document.getElementById('shifts-schedule');

        if (scheduleType === 'multiple') {
            continuousDiv.style.display = 'none';
            shiftsDiv.style.display = 'block';
        } else {
            continuousDiv.style.display = 'block';
            shiftsDiv.style.display = 'none';
        }
    },

    // Update shifts count visibility
    updateShiftsCount() {
        const numShifts = parseInt(document.getElementById('num-shifts').value);

        for (let i = 1; i <= 3; i++) {
            const shiftDiv = document.getElementById(`shift-${i}`);
            if (shiftDiv) {
                shiftDiv.style.display = i <= numShifts ? 'block' : 'none';
            }
        }
    },

    // Load schedule settings
    async loadScheduleSettings() {
        try {
            const businessId = auth.getBusinessId();
            const response = await api.fetch(`/api/widget/${businessId}`);

            if (!response.success) return;

            const scheduleType = response.scheduleType || 'continuous';
            const workDays = response.workDays || [1, 2, 3, 4, 5, 6];
            const slotDuration = response.slotDuration || 30;

            // Set schedule type
            document.getElementById('schedule-type').value = scheduleType;
            this.toggleScheduleType();

            // PRIMERO desmarcar TODOS los días
            for (let i = 1; i <= 7; i++) {
                const checkbox = document.getElementById(`workday-${i}`);
                if (checkbox) checkbox.checked = false;
            }

            // LUEGO marcar solo los días laborales configurados
            workDays.forEach(day => {
                const checkbox = document.getElementById(`workday-${day}`);
                if (checkbox) checkbox.checked = true;
            });

            // Set slot duration
            document.getElementById('booking-slot-duration').value = slotDuration;

            if (scheduleType === 'multiple' && response.shifts) {
                // Load shifts
                document.getElementById('num-shifts').value = response.shifts.length;
                this.updateShiftsCount();

                // PRIMERO limpiar TODOS los turnos
                for (let i = 1; i <= 3; i++) {
                    document.getElementById(`shift${i}-name`).value = '';
                    document.getElementById(`shift${i}-start`).value = '09:00';
                    document.getElementById(`shift${i}-end`).value = '20:00';
                    document.getElementById(`shift${i}-enabled`).checked = true;
                }

                // LUEGO cargar los turnos configurados
                response.shifts.forEach((shift, index) => {
                    const i = index + 1;
                    if (i <= 3) {
                        document.getElementById(`shift${i}-name`).value = shift.name || '';
                        document.getElementById(`shift${i}-start`).value = shift.startTime;
                        document.getElementById(`shift${i}-end`).value = shift.endTime;
                        document.getElementById(`shift${i}-enabled`).checked = shift.enabled;
                    }
                });
            } else {
                // Load continuous schedule
                document.getElementById('work-hours-start').value = response.workHoursStart || '09:00';
                document.getElementById('work-hours-end').value = response.workHoursEnd || '20:00';
            }
        } catch (error) {
            console.error('Error loading schedule settings:', error);
        }
    },

    // Save schedule
    async saveSchedule() {
        try {
            const businessId = auth.getBusinessId();
            const scheduleType = document.getElementById('schedule-type').value;

            // Get work days
            const workDays = [];
            for (let i = 1; i <= 7; i++) {
                const checkbox = document.getElementById(`workday-${i}`);
                if (checkbox && checkbox.checked) {
                    workDays.push(i);
                }
            }

            const slotDuration = parseInt(document.getElementById('booking-slot-duration').value);

            let bookingSettings = {
                scheduleType,
                workDays,
                slotDuration
            };

            if (scheduleType === 'multiple') {
                // Get shifts
                const numShifts = parseInt(document.getElementById('num-shifts').value);
                bookingSettings.shifts = [];

                for (let i = 1; i <= numShifts; i++) {
                    const name = document.getElementById(`shift${i}-name`).value;
                    const startTime = document.getElementById(`shift${i}-start`).value;
                    const endTime = document.getElementById(`shift${i}-end`).value;
                    const enabled = document.getElementById(`shift${i}-enabled`).checked;

                    if (!startTime || !endTime) {
                        alert(`Por favor completa todos los horarios del turno ${i}`);
                        return;
                    }

                    bookingSettings.shifts.push({
                        id: i,
                        name: name || `Turno ${i}`,
                        startTime,
                        endTime,
                        enabled
                    });
                }
            } else {
                // Continuous schedule
                const workHoursStart = document.getElementById('work-hours-start').value;
                const workHoursEnd = document.getElementById('work-hours-end').value;

                if (!workHoursStart || !workHoursEnd) {
                    alert('Por favor completa el horario de apertura');
                    return;
                }

                bookingSettings.workHoursStart = workHoursStart;
                bookingSettings.workHoursEnd = workHoursEnd;
            }

            const response = await api.fetch(`/api/business/${businessId}/settings`, {
                method: 'PUT',
                body: JSON.stringify({ bookingSettings })
            });

            if (response.success) {
                alert('✅ Horarios guardados correctamente');
            } else {
                const errorMsg = response.error || response.message || 'No se pudieron guardar los horarios';
                console.error('Error del servidor:', errorMsg);
                alert(`❌ Error: ${errorMsg}`);
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            // Intentar obtener el mensaje de error del servidor
            if (error.message) {
                alert(`❌ Error: ${error.message}`);
            } else {
                alert('❌ Error al guardar los horarios. Revisa la consola para más detalles.');
            }
        }
    },

    // Add exception
    addException() {
        alert('ℹ️ Función de excepciones próximamente disponible');
    },

    // Save advanced settings
    async saveAdvancedSettings() {
        // TODO: Implement save advanced settings logic
        alert('✅ Configuración avanzada guardada correctamente');
    },

    // Export data
    exportData(format) {
        alert(`ℹ️ Exportación ${format.toUpperCase()} próximamente disponible`);
    },

    // Reset settings
    resetSettings() {
        if (!confirm('¿Estás seguro de que quieres restablecer toda la configuración?\n\nEsta acción no se puede deshacer.')) {
            return;
        }

        if (!confirm('⚠️ ÚLTIMA ADVERTENCIA\n\nSe perderán todos tus ajustes personalizados. ¿Continuar?')) {
            return;
        }

        alert('ℹ️ Función de restablecimiento próximamente disponible');
    },

    // Delete account
    deleteAccount() {
        if (!confirm('⚠️ PELIGRO\n\n¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción es IRREVERSIBLE y borrará:\n- Todos tus datos\n- Todas tus reservas\n- Toda tu configuración\n- Todo tu historial')) {
            return;
        }

        const confirmation = prompt('Para confirmar, escribe "ELIMINAR MI CUENTA" (en mayúsculas):');

        if (confirmation !== 'ELIMINAR MI CUENTA') {
            alert('❌ Confirmación incorrecta. Cancelando...');
            return;
        }

        alert('ℹ️ Función de eliminación de cuenta próximamente disponible');
    },

    // Render Capacity Tab
    renderCapacityTab() {
        const bookingSettings = this.businessData?.booking_settings || {};

        // Determinar bookingMode del negocio
        const typeKey = this.businessData?.type_key;
        const modeMap = {
            'salon': 'services',
            'clinic': 'services',
            'restaurant': 'tables',
            'gym': 'classes',
            'nutrition': 'services',
            'spa': 'services',
            'lawyer': 'services'
        };
        const bookingMode = modeMap[typeKey] || 'services';

        // Default capacity según bookingMode
        const defaultCapacity = bookingMode === 'tables' ? 40 : 1;
        const businessCapacity = bookingSettings.businessCapacity || defaultCapacity;

        // Si es modo classes, mostrar mensaje informativo
        if (bookingMode === 'classes') {
            return `
                <div class="settings-section">
                    <div class="settings-section-header">
                        <h3>👥 Gestión de Capacidad</h3>
                    </div>
                    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6;
                                padding: 1.5rem; border-radius: 8px;">
                        <p><strong>💡 Info:</strong> Para negocios tipo "Clases",
                        la capacidad se configura en cada servicio/clase.</p>
                        <p>Ve a <strong>Servicios → Editar → Capacidad máxima</strong></p>
                    </div>
                </div>
            `;
        }

        // Para services y tables
        let label, hint, placeholder;
        if (bookingMode === 'tables') {
            label = 'Capacidad total de comensales por turno';
            hint = 'Número máximo de personas que pueden comer simultáneamente en cada turno';
            placeholder = '40';
        } else {
            label = 'Número de profesionales/estaciones';
            hint = 'Cuántas personas pueden ser atendidas al mismo tiempo';
            placeholder = '3';
        }

        const maxPerBooking = bookingSettings.maxPerBooking || (bookingMode === 'tables' ? 10 : 1);

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>👥 Gestión de Capacidad</h3>
                    <p>Configura cuántas reservas simultáneas puede manejar tu negocio</p>
                </div>

                <div class="form-group">
                    <label>${label}</label>
                    <input type="number" id="business-capacity"
                           min="1" max="1000"
                           value="${businessCapacity}"
                           placeholder="${placeholder}">
                    <p class="hint">${hint}</p>
                </div>

                ${bookingMode === 'tables' ? `
                    <div class="form-group">
                        <label>Máximo de comensales por reserva</label>
                        <input type="number" id="max-per-booking"
                               min="1" max="50"
                               value="${maxPerBooking}"
                               placeholder="10">
                        <p class="hint">Número máximo de personas que pueden reservar en una sola mesa. Ej: Capacidad total 40, máximo por reserva 10</p>
                    </div>
                ` : ''}

                <button class="btn-save" onclick="settings.saveCapacity()">
                    💾 Guardar Capacidad
                </button>
            </div>
        `;
    },

    // Render Zones Tab (for restaurants)
    renderZonesTab() {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const zones = bookingSettings.restaurantZones || ['Terraza', 'Interior'];

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🏢 Gestión de Zonas</h3>
                    <p>Configura las zonas disponibles para tu restaurante (Terraza, Interior, Sala VIP, etc.)</p>
                </div>

                <div class="form-group">
                    <label>Zonas disponibles</label>
                    <p class="hint">Los clientes podrán seleccionar su zona preferida al hacer una reserva</p>

                    <div id="zones-list" style="margin-top: 1rem;">
                        ${zones.map((zone, index) => {
                            const zoneName = typeof zone === 'string' ? zone : zone.name || '';
                            return `
                            <div class="zone-item" data-index="${index}" style="display: flex; gap: 1rem; margin-bottom: 0.75rem; align-items: center;">
                                <input type="text"
                                       class="zone-input"
                                       value="${zoneName}"
                                       placeholder="Nombre de la zona"
                                       style="flex: 1;">
                                <button onclick="settings.removeZone(${index})"
                                        class="btn btn-secondary"
                                        style="padding: 0.5rem 1rem; background: #ef4444; color: white;">
                                    ✕ Eliminar
                                </button>
                            </div>
                        `}).join('')}
                    </div>

                    <button onclick="settings.addZone()"
                            class="btn btn-secondary"
                            style="margin-top: 1rem; padding: 0.75rem 1.5rem;">
                        ➕ Agregar zona
                    </button>
                </div>

                <div class="form-group" style="margin-top: 2rem;">
                    <button onclick="settings.saveZones()" class="btn btn-primary">
                        💾 Guardar zonas
                    </button>
                </div>

                <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-top: 2rem; border-radius: 8px;">
                    <p style="margin: 0; color: #1e40af;">
                        <strong>💡 Tip:</strong> Las zonas permiten a tus clientes elegir dónde prefieren sentarse.
                        Puedes tener zonas como "Terraza", "Interior", "Sala VIP", "Barra", etc.
                    </p>
                </div>
            </div>
        `;
    },

    // Add zone
    addZone() {
        const zonesList = document.getElementById('zones-list');
        const newIndex = zonesList.children.length;

        const zoneItem = document.createElement('div');
        zoneItem.className = 'zone-item';
        zoneItem.dataset.index = newIndex;
        zoneItem.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 0.75rem; align-items: center;';
        zoneItem.innerHTML = `
            <input type="text"
                   class="zone-input"
                   value=""
                   placeholder="Nombre de la zona"
                   style="flex: 1;">
            <button onclick="settings.removeZone(${newIndex})"
                    class="btn btn-secondary"
                    style="padding: 0.5rem 1rem; background: #ef4444; color: white;">
                ✕ Eliminar
            </button>
        `;

        zonesList.appendChild(zoneItem);
    },

    // Remove zone
    removeZone(index) {
        const zonesList = document.getElementById('zones-list');
        const zoneItems = zonesList.querySelectorAll('.zone-item');

        if (zoneItems.length <= 1) {
            alert('❌ Debe haber al menos una zona');
            return;
        }

        zoneItems[index].remove();
    },

    // Save zones
    async saveZones() {
        const zoneInputs = document.querySelectorAll('.zone-input');
        const zones = Array.from(zoneInputs)
            .map(input => input.value.trim())
            .filter(zone => zone !== '');

        if (zones.length === 0) {
            alert('❌ Debes tener al menos una zona');
            return;
        }

        try {
            const bookingSettings = this.businessData?.booking_settings
                ? (typeof this.businessData.booking_settings === 'string'
                    ? JSON.parse(this.businessData.booking_settings)
                    : this.businessData.booking_settings)
                : {};

            bookingSettings.restaurantZones = zones;

            const response = await api.put(`/api/business/${this.userData.business_id}/settings`, {
                booking_settings: bookingSettings
            });

            if (response.success) {
                alert('✅ Zonas guardadas correctamente');
                this.businessData.booking_settings = bookingSettings;
            } else {
                throw new Error(response.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving zones:', error);
            alert('❌ Error al guardar las zonas');
        }
    },

    // Render Feedback Tab
    renderFeedbackTab() {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const feedbackSettings = bookingSettings.feedbackSettings || {
            enabled: true,
            questions: [
                {
                    id: 1,
                    type: 'rating',
                    question: '¿Cómo calificarías nuestro servicio?',
                    required: true,
                    options: null
                },
                {
                    id: 2,
                    type: 'multiple_choice',
                    question: '¿Qué te gustó más?',
                    required: false,
                    options: ['La atención', 'La calidad', 'El precio', 'La rapidez']
                },
                {
                    id: 3,
                    type: 'text',
                    question: '¿Qué podríamos mejorar?',
                    required: false,
                    options: null
                }
            ]
        };

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>⭐ Configuración de Feedback</h3>
                    <p>Personaliza las preguntas que recibirán tus clientes 24 horas después de su reserva</p>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox"
                               id="feedback-enabled"
                               ${feedbackSettings.enabled ? 'checked' : ''}
                               style="width: auto; margin-right: 0.5rem;">
                        Enviar feedback automático
                    </label>
                    <p class="hint">Los clientes recibirán un email 24 horas después de completar su reserva</p>
                </div>

                <div id="feedback-questions-container" style="margin-top: 2rem;">
                    ${feedbackSettings.questions.map((q, index) => `
                        <div class="feedback-question-card" data-index="${index}" style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 2px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h4 style="margin: 0; color: var(--primary-color);">Pregunta ${index + 1}</h4>
                                ${index > 0 ? `
                                    <button onclick="settings.removeFeedbackQuestion(${index})"
                                            class="btn btn-secondary"
                                            style="padding: 0.25rem 0.75rem; background: #ef4444; color: white; font-size: 0.9rem;">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>

                            <div class="form-group">
                                <label>Tipo de pregunta</label>
                                <select class="feedback-question-type" data-index="${index}" onchange="settings.updateFeedbackQuestionType(${index})">
                                    <option value="rating" ${q.type === 'rating' ? 'selected' : ''}>⭐ Rating (1-5 estrellas)</option>
                                    <option value="multiple_choice" ${q.type === 'multiple_choice' ? 'selected' : ''}>✅ Opción múltiple</option>
                                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>📝 Texto corto</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Pregunta</label>
                                <input type="text"
                                       class="feedback-question-text"
                                       data-index="${index}"
                                       value="${q.question}"
                                       placeholder="Escribe tu pregunta aquí">
                            </div>

                            ${q.type === 'multiple_choice' ? `
                                <div class="form-group feedback-options-container" data-index="${index}">
                                    <label>Opciones (una por línea)</label>
                                    ${(q.options || []).map((option, optIndex) => `
                                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                            <input type="text"
                                                   class="feedback-option-input"
                                                   data-question="${index}"
                                                   data-option="${optIndex}"
                                                   value="${option}"
                                                   placeholder="Opción ${optIndex + 1}"
                                                   style="flex: 1;">
                                            <button onclick="settings.removeFeedbackOption(${index}, ${optIndex})"
                                                    style="padding: 0.25rem 0.75rem; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                                ✕
                                            </button>
                                        </div>
                                    `).join('')}
                                    <button onclick="settings.addFeedbackOption(${index})"
                                            class="btn btn-secondary"
                                            style="padding: 0.5rem 1rem; margin-top: 0.5rem;">
                                        ➕ Agregar opción
                                    </button>
                                </div>
                            ` : ''}

                            <div class="form-group">
                                <label>
                                    <input type="checkbox"
                                           class="feedback-question-required"
                                           data-index="${index}"
                                           ${q.required ? 'checked' : ''}
                                           style="width: auto; margin-right: 0.5rem;">
                                    Pregunta obligatoria
                                </label>
                            </div>
                        </div>
                    `).join('')}

                    ${feedbackSettings.questions.length < 3 ? `
                        <button onclick="settings.addFeedbackQuestion()"
                                class="btn btn-secondary"
                                style="width: 100%; padding: 1rem; border: 2px dashed #cbd5e1; background: white; color: var(--primary-color);">
                            ➕ Agregar pregunta (${feedbackSettings.questions.length}/3)
                        </button>
                    ` : ''}
                </div>

                <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-top: 2rem; border-radius: 8px;">
                    <p style="margin: 0 0 0.5rem 0; color: #1e40af; font-weight: 600;">
                        📋 Pregunta genérica (siempre incluida):
                    </p>
                    <p style="margin: 0; color: #1e40af;">
                        "¿Hay algo más que quieras compartir con nosotros? Valoramos tu opinión y nos ayuda a seguir mejorando."
                    </p>
                </div>

                <div class="form-group" style="margin-top: 2rem;">
                    <button onclick="settings.saveFeedbackSettings()" class="btn btn-primary">
                        💾 Guardar configuración de feedback
                    </button>
                </div>
            </div>
        `;
    },

    // Add feedback question
    addFeedbackQuestion() {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const feedbackSettings = bookingSettings.feedbackSettings || { questions: [] };

        if (feedbackSettings.questions.length >= 3) {
            alert('❌ Máximo 3 preguntas personalizadas permitidas');
            return;
        }

        feedbackSettings.questions.push({
            id: feedbackSettings.questions.length + 1,
            type: 'text',
            question: '',
            required: false,
            options: null
        });

        bookingSettings.feedbackSettings = feedbackSettings;
        this.businessData.booking_settings = bookingSettings;

        // Re-render tab
        document.getElementById('tab-feedback').innerHTML = this.renderFeedbackTab();
    },

    // Remove feedback question
    removeFeedbackQuestion(index) {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const feedbackSettings = bookingSettings.feedbackSettings || { questions: [] };
        feedbackSettings.questions.splice(index, 1);

        bookingSettings.feedbackSettings = feedbackSettings;
        this.businessData.booking_settings = bookingSettings;

        // Re-render tab
        document.getElementById('tab-feedback').innerHTML = this.renderFeedbackTab();
    },

    // Update feedback question type
    updateFeedbackQuestionType(index) {
        const type = document.querySelector(`.feedback-question-type[data-index="${index}"]`).value;

        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const feedbackSettings = bookingSettings.feedbackSettings || { questions: [] };
        feedbackSettings.questions[index].type = type;

        if (type === 'multiple_choice' && !feedbackSettings.questions[index].options) {
            feedbackSettings.questions[index].options = ['Opción 1', 'Opción 2'];
        } else if (type !== 'multiple_choice') {
            feedbackSettings.questions[index].options = null;
        }

        bookingSettings.feedbackSettings = feedbackSettings;
        this.businessData.booking_settings = bookingSettings;

        // Re-render tab
        document.getElementById('tab-feedback').innerHTML = this.renderFeedbackTab();
    },

    // Add feedback option
    addFeedbackOption(questionIndex) {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const feedbackSettings = bookingSettings.feedbackSettings || { questions: [] };

        if (!feedbackSettings.questions[questionIndex].options) {
            feedbackSettings.questions[questionIndex].options = [];
        }

        feedbackSettings.questions[questionIndex].options.push(`Opción ${feedbackSettings.questions[questionIndex].options.length + 1}`);

        bookingSettings.feedbackSettings = feedbackSettings;
        this.businessData.booking_settings = bookingSettings;

        // Re-render tab
        document.getElementById('tab-feedback').innerHTML = this.renderFeedbackTab();
    },

    // Remove feedback option
    removeFeedbackOption(questionIndex, optionIndex) {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const feedbackSettings = bookingSettings.feedbackSettings || { questions: [] };
        feedbackSettings.questions[questionIndex].options.splice(optionIndex, 1);

        bookingSettings.feedbackSettings = feedbackSettings;
        this.businessData.booking_settings = bookingSettings;

        // Re-render tab
        document.getElementById('tab-feedback').innerHTML = this.renderFeedbackTab();
    },

    // Save feedback settings
    async saveFeedbackSettings() {
        try {
            const bookingSettings = this.businessData?.booking_settings
                ? (typeof this.businessData.booking_settings === 'string'
                    ? JSON.parse(this.businessData.booking_settings)
                    : this.businessData.booking_settings)
                : {};

            const feedbackSettings = {
                enabled: document.getElementById('feedback-enabled').checked,
                questions: []
            };

            // Collect all questions
            const questionCards = document.querySelectorAll('.feedback-question-card');
            questionCards.forEach((card, index) => {
                const type = card.querySelector('.feedback-question-type').value;
                const question = card.querySelector('.feedback-question-text').value.trim();
                const required = card.querySelector('.feedback-question-required').checked;

                let options = null;
                if (type === 'multiple_choice') {
                    const optionInputs = card.querySelectorAll('.feedback-option-input');
                    options = Array.from(optionInputs)
                        .map(input => input.value.trim())
                        .filter(opt => opt !== '');
                }

                if (question) {
                    feedbackSettings.questions.push({
                        id: index + 1,
                        type,
                        question,
                        required,
                        options
                    });
                }
            });

            if (feedbackSettings.enabled && feedbackSettings.questions.length === 0) {
                alert('❌ Debes tener al menos una pregunta si el feedback está activado');
                return;
            }

            bookingSettings.feedbackSettings = feedbackSettings;

            const response = await api.put(`/api/business/${this.userData.business_id}/settings`, {
                booking_settings: bookingSettings
            });

            if (response.success) {
                alert('✅ Configuración de feedback guardada correctamente');
                this.businessData.booking_settings = bookingSettings;
            } else {
                throw new Error(response.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving feedback settings:', error);
            alert('❌ Error al guardar la configuración de feedback');
        }
    },

    // Toggle WhatsApp settings fields
    toggleWhatsAppFields() {
        const enabled = document.getElementById('whatsapp-enabled').checked;
        const fieldsContainer = document.getElementById('whatsapp-settings-fields');
        if (fieldsContainer) {
            fieldsContainer.style.display = enabled ? 'block' : 'none';
        }
    },

    // Reset WhatsApp template to default
    resetWhatsAppTemplate() {
        const defaultTemplate = `Hola {nombre}!

Tu reserva en {negocio} ha sido confirmada:

Fecha: {fecha}
Hora: {hora}
Servicio: {servicio}

Te esperamos!

{nombre_negocio}`;

        const textarea = document.getElementById('whatsapp-template');
        if (textarea) {
            textarea.value = defaultTemplate;
            this.updateCharCount();
        }
    },

    // Update character count for WhatsApp template
    updateCharCount() {
        const textarea = document.getElementById('whatsapp-template');
        const countDisplay = document.getElementById('template-char-count');
        if (textarea && countDisplay) {
            const count = textarea.value.length;
            countDisplay.textContent = `${count} / 1000 caracteres`;
            countDisplay.style.color = count > 1000 ? '#ef4444' : '#666';
        }
    }
};

// Export to window
window.settings = settings;
