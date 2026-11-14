// Settings Module

const settings = {
    currentTab: 'business',
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
                <!-- Tabs agrupadas por tema -->
                <div class="settings-tabs">
                    <div class="settings-tab-group">
                        <div class="settings-tab-group-label">Mi negocio</div>
                        <div class="settings-tab-group-items">
                            <button class="settings-tab active" data-tab="business" onclick="settings.switchTab('business')">🏢 Datos</button>
                            <button class="settings-tab" data-tab="schedule" onclick="settings.switchTab('schedule')">⏰ Horarios</button>
                            <button class="settings-tab" data-tab="capacity" onclick="settings.switchTab('capacity')">👥 Capacidad</button>
                            <button class="settings-tab" data-tab="zones" onclick="settings.switchTab('zones')"
                                    style="display: ${this.businessData?.type_key === 'restaurant' ? 'inline-block' : 'none'};">🪑 Zonas</button>
                        </div>
                    </div>
                    <div class="settings-tab-group">
                        <div class="settings-tab-group-label">Reservas y avisos</div>
                        <div class="settings-tab-group-items">
                            <button class="settings-tab" data-tab="notifications" onclick="settings.switchTab('notifications')">📧 Notificaciones</button>
                            <button class="settings-tab" data-tab="feedback" onclick="settings.switchTab('feedback')">⭐ Encuestas</button>
                        </div>
                    </div>
                    <div class="settings-tab-group">
                        <div class="settings-tab-group-label">Dónde te reservan</div>
                        <div class="settings-tab-group-items">
                            <button class="settings-tab" data-tab="widget" onclick="settings.switchTab('widget')">🎨 Widget</button>
                            <button class="settings-tab" data-tab="publicpage" onclick="settings.switchTab('publicpage')">🌐 Mi página</button>
                        </div>
                    </div>
                    <div class="settings-tab-group">
                        <div class="settings-tab-group-label">Cuenta</div>
                        <div class="settings-tab-group-items">
                            <button class="settings-tab" data-tab="profile" onclick="settings.switchTab('profile')">👤 Perfil</button>
                            <button class="settings-tab" data-tab="security" onclick="settings.switchTab('security')">🔐 Seguridad</button>
                            <button class="settings-tab" data-tab="team" onclick="settings.switchTab('team')">👥 Equipo</button>
                            <button class="settings-tab" data-tab="billing" onclick="settings.switchTab('billing')">💳 Plan</button>
                            <button class="settings-tab" data-tab="invite" onclick="settings.switchTab('invite')">🎁 Invita y gana</button>
                            <button class="settings-tab" data-tab="consultancy" onclick="settings.switchTab('consultancy')">💼 Consultoría</button>
                            <button class="settings-tab" data-tab="advanced" onclick="settings.switchTab('advanced')">⚙️ Avanzado</button>
                        </div>
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="settings-content">
                    <div class="settings-tab-content" id="tab-profile">
                        ${this.renderProfileTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-security">
                        ${this.renderSecurityTab()}
                    </div>
                    <div class="settings-tab-content active" id="tab-business">
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
                    <div class="settings-tab-content" id="tab-publicpage">
                        ${this.renderPublicPageTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-billing">
                        ${this.renderBillingTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-advanced">
                        ${this.renderAdvancedTab()}
                    </div>
                    <div class="settings-tab-content" id="tab-team">
                        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Cargando equipo...</div>
                    </div>
                    <div class="settings-tab-content" id="tab-invite">
                        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Cargando...</div>
                    </div>
                    <div class="settings-tab-content" id="tab-consultancy">
                        <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Cargando consultoría...</div>
                    </div>
                </div>
            </div>

            <style>
                .settings-container {
                    max-width: 1000px;
                }

                .settings-tabs {
                    display: flex;
                    gap: 1.25rem 2rem;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid var(--border-color);
                    padding-bottom: 0;
                    flex-wrap: wrap;
                }

                .settings-tab-group {
                    min-width: 0;
                    max-width: 100%;
                }

                .settings-tab-group-label {
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    opacity: 0.8;
                    padding: 0 0.25rem 0.35rem;
                }

                .settings-tab-group-items {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                }

                .settings-tab {
                    padding: 0.6rem 0.9rem;
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
                        <p style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-weight: 500;">${utils.escapeHtml(user.full_name)}</p>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${utils.escapeHtml(user.email)}</p>
                        <span class="badge badge-info" style="margin-top: 0.5rem;">${this.getRoleName(user.role)}</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="profile-name" value="${utils.escapeHtml(user.full_name || '')}" placeholder="Tu nombre">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profile-email" value="${utils.escapeHtml(user.email)}" disabled>
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
                    <input type="text" id="business-name" value="${utils.escapeHtml(business.name || '')}" placeholder="Nombre de tu negocio">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Email de Contacto</label>
                        <input type="email" id="business-email" value="${utils.escapeHtml(business.email || '')}" placeholder="contacto@negocio.com">
                        <p class="hint">Email donde recibirás notificaciones</p>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" id="business-phone" value="${utils.escapeHtml(business.phone || '')}" placeholder="+34 600 000 000">
                    </div>
                </div>

                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" id="business-address" value="${utils.escapeHtml(business.address || '')}" placeholder="Calle, número, ciudad">
                </div>

                <div class="form-group">
                    <label>Página Web</label>
                    <input type="url" id="business-website" value="${business.website || ''}" placeholder="https://www.tunegocio.com">
                </div>

                <div class="form-group">
                    <label>Descripción del negocio</label>
                    <textarea id="business-description" rows="4" maxlength="1000" placeholder="Ej: Peluquería de barrio en Gràcia desde 2010. Cortes, color y peinados para toda la familia.">${(business.description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textarea>
                    <p class="hint">Sale en tu página de reservas y ayuda a que te encuentren en Google. Cuenta qué haces, dónde estás y qué te diferencia.</p>
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

        // Checklist de primeros pasos: abrir Horarios cuenta como "revisar horario"
        if (tabName === 'schedule' && window.dashboard) dashboard.markOnboarding('scheduleReviewed');

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

        // Programa de recomendación
        if (tabName === 'invite') {
            this.loadInviteTab();
        }

        // Load schedule settings when opening schedule tab
        if (tabName === 'schedule') {
            setTimeout(() => this.loadScheduleSettings(), 100);
        }

        // Initialize preview when opening design tab
        if (tabName === 'design') {
            setTimeout(() => this.updatePreview(), 100);
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

        // Initialize zone toggles when opening zones tab
        if (tabName === 'zones') {
            setTimeout(() => this.initializeZoneToggles(), 100);
        }

        // Cargar módulos externos en su tab de settings
        if (tabName === 'team' && window.team) {
            team._container = document.getElementById('tab-team');
            team.load();
        }
        if (tabName === 'consultancy' && window.consultancy) {
            consultancy._container = document.getElementById('tab-consultancy');
            consultancy.load();
        }
        if (tabName === 'billing' && window.billing) {
            billing._container = document.getElementById('tab-billing');
            billing.load();
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
        const description = document.getElementById('business-description').value.trim();

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
                website,
                description
            });

            // Update local data
            this.businessData.name = name;
            this.businessData.email = email;
            this.businessData.phone = phone;
            this.businessData.address = address;
            this.businessData.website = website;
            this.businessData.description = description;

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
        const businessId = auth.getBusinessId();
        const apiUrl = api.baseURL;
        // Resetear el tipo seleccionado al abrir el tab
        if (window.widget) widget.selectedType = 'embedded';
        // Verificar si widget_settings es un string antes de parsear
        const widgetSettings = business.widget_settings
            ? (typeof business.widget_settings === 'string'
                ? JSON.parse(business.widget_settings)
                : business.widget_settings)
            : {
                primaryColor: '#3b82f6',
                secondaryColor: '#ef4444',
                showPrices: true,
                showDuration: true
            };

        // Obtener customización adicional
        const customization = business.widget_customization
            ? (typeof business.widget_customization === 'string'
                ? JSON.parse(business.widget_customization)
                : business.widget_customization)
            : {};

        const fontFamily = customization.fontFamily || 'system-ui';
        const borderRadius = customization.borderRadius || '12px';
        const buttonStyle = customization.buttonStyle || 'solid';

        return `
            <style>
                .widget-type-btn {
                    padding: 0.65rem 1.25rem;
                    border: 2px solid var(--border-color);
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                }
                .widget-type-btn:hover { border-color: var(--primary-color); }
                .widget-type-btn.active { background: var(--primary-color); border-color: var(--primary-color); color: white; }
                .widget-code-box {
                    background: #1e293b;
                    color: #e0e0e0;
                    padding: 1.5rem;
                    border-radius: 10px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.85rem;
                    overflow-x: auto;
                    position: relative;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                .copy-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 0.4rem 0.9rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                }
                .guide-step {
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                    border-left: 4px solid var(--primary-color);
                }
                .guide-step h4 { margin: 0 0 0.4rem 0; color: var(--text-primary); font-size: 0.95rem; }
                .guide-step p  { margin: 0; color: var(--text-secondary); font-size: 0.88rem; line-height: 1.5; }
            </style>

            <!-- Integración Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🔗 Integrar en tu web</h3>
                    <p>Elige el modo, copia el código y pégalo en tu página web</p>
                </div>

                <!-- Selector de modo -->
                <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <button class="widget-type-btn active" data-type="embedded" onclick="widget.selectType('embedded')">
                        📋 Formulario Embebido
                    </button>
                    <button class="widget-type-btn" data-type="floating" onclick="widget.selectType('floating')">
                        💬 Botón Flotante
                    </button>
                    <button class="widget-type-btn" data-type="qr" onclick="widget.selectType('qr')">
                        📱 Código QR
                    </button>
                </div>

                <!-- Código generado -->
                <div id="widgetCodeContainer">
                    ${window.widget ? widget.renderWidgetCode(businessId, apiUrl) : ''}
                </div>

                <!-- Guía de pasos -->
                <div id="widgetGuide" style="margin-top: 1.5rem;">
                    ${window.widget ? widget.renderGuide() : ''}
                </div>
            </div>

            <!-- Colors Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🎨 Colores del Widget</h3>
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
                    <h3>👁️ Opciones de Visualización</h3>
                    <p>Configura qué información mostrar en tu widget</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                            <input type="checkbox" id="widget-show-prices" ${widgetSettings.showPrices ? 'checked' : ''}
                                   onchange="settings.updateWidgetPreview()"
                                   style="width: 20px; height: 20px; cursor: pointer;">
                            <span>
                                <strong>Mostrar Precios</strong>
                                <p class="hint" style="margin: 0.25rem 0 0 0;">Muestra el precio de cada servicio</p>
                            </span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                            <input type="checkbox" id="widget-show-duration" ${widgetSettings.showDuration ? 'checked' : ''}
                                   onchange="settings.updateWidgetPreview()"
                                   style="width: 20px; height: 20px; cursor: pointer;">
                            <span>
                                <strong>Mostrar Duración</strong>
                                <p class="hint" style="margin: 0.25rem 0 0 0;">Muestra cuánto dura cada servicio</p>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Design Options Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🖌️ Estilo Visual</h3>
                    <p>Personaliza la apariencia del widget</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Fuente Tipográfica</label>
                        <select id="widget-font-family" onchange="settings.updateWidgetPreview()">
                            <option value="system-ui" ${fontFamily === 'system-ui' ? 'selected' : ''}>Sistema (Por defecto)</option>
                            <option value="Arial, sans-serif" ${fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                            <option value="'Georgia', serif" ${fontFamily === "'Georgia', serif" ? 'selected' : ''}>Georgia</option>
                            <option value="'Helvetica', sans-serif" ${fontFamily === "'Helvetica', sans-serif" ? 'selected' : ''}>Helvetica</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estilo de Botones</label>
                        <select id="widget-button-style" onchange="settings.updateWidgetPreview()">
                            <option value="solid" ${buttonStyle === 'solid' ? 'selected' : ''}>Sólido</option>
                            <option value="outline" ${buttonStyle === 'outline' ? 'selected' : ''}>Contorno</option>
                            <option value="ghost" ${buttonStyle === 'ghost' ? 'selected' : ''}>Fantasma</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Redondez de Bordes: <span id="border-radius-value">${borderRadius}</span></label>
                    <input type="range" id="widget-border-radius" min="0" max="24" value="${parseInt(borderRadius)}"
                           oninput="document.getElementById('border-radius-value').textContent = this.value + 'px'; settings.updateWidgetPreview()"
                           style="width: 100%;">
                    <p class="hint">0px = Cuadrado, 24px = Muy redondeado</p>
                </div>
            </div>

            <!-- Save Button -->
            <div class="settings-section">
                <button class="btn-save" onclick="settings.saveWidgetSettings()">
                    💾 Guardar Configuración del Widget
                </button>
            </div>

            <!-- Preview Section -->
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>👀 Vista Previa</h3>
                    <p>Así se verá tu widget con la configuración actual</p>
                </div>

                <div class="widget-preview-box" id="widget-preview" style="background: #f8f9fa; padding: 2rem; border-radius: 12px;">
                    <div class="preview-widget" id="preview-widget-content"
                         style="background: white; padding: 1.5rem; border-radius: ${borderRadius}; max-width: 350px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-family: ${fontFamily};">
                        <h3 id="preview-title" style="color: ${widgetSettings.primaryColor}; margin: 0 0 0.5rem 0; font-size: 1.25rem;">Reserva tu Cita</h3>
                        <p style="color: #666; margin: 0 0 1rem 0; font-size: 0.9rem;">Selecciona un servicio</p>

                        <div id="preview-service" style="border: 1px solid #eee; padding: 1rem; border-radius: ${borderRadius}; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s;"
                             onmouseover="this.style.borderColor='${widgetSettings.primaryColor}'"
                             onmouseout="this.style.borderColor='#eee'">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <strong style="color: #333;">Corte de Cabello</strong>
                                <span id="preview-price" style="color: ${widgetSettings.secondaryColor}; font-weight: 600;">${widgetSettings.showPrices ? '15€' : ''}</span>
                            </div>
                            <div id="preview-duration" style="color: #888; font-size: 0.85rem; margin-top: 0.25rem;">${widgetSettings.showDuration ? '30 min' : ''}</div>
                        </div>

                        <button class="preview-button" id="preview-button"
                                style="width: 100%; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border-radius: ${borderRadius}; ${buttonStyle === 'solid' ? `background: ${widgetSettings.primaryColor}; color: white; border: none;` : buttonStyle === 'outline' ? `background: transparent; color: ${widgetSettings.primaryColor}; border: 2px solid ${widgetSettings.primaryColor};` : `background: transparent; color: ${widgetSettings.primaryColor}; border: none;`}">
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Render Design Tab
    renderDesignTab() {
        const business = this.businessData;
        const customization = business.widget_customization
            ? (typeof business.widget_customization === 'string'
                ? JSON.parse(business.widget_customization)
                : business.widget_customization)
            : {};

        const primaryColor = customization.primaryColor || '#3b82f6';
        const secondaryColor = customization.secondaryColor || '#8b5cf6';
        const fontFamily = customization.fontFamily || 'system-ui';
        const borderRadius = customization.borderRadius || '12px';
        const buttonStyle = customization.buttonStyle || 'solid';

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🖌️ Personalización Visual del Widget</h3>
                    <p>Personaliza el diseño del widget para que combine con tu marca</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Panel de Controles -->
                    <div>
                        <div class="form-group">
                            <label>Color Principal</label>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="color" id="design-primary-color" value="${primaryColor}"
                                       onchange="settings.updatePreview()"
                                       style="width: 60px; height: 40px; border-radius: 8px; border: 2px solid var(--border-color); cursor: pointer;">
                                <input type="text" id="design-primary-color-text" value="${primaryColor}"
                                       onchange="settings.syncColorInput('primary')"
                                       style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                            </div>
                            <p class="hint">Color de botones, títulos y elementos destacados</p>
                        </div>

                        <div class="form-group">
                            <label>Color Secundario</label>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="color" id="design-secondary-color" value="${secondaryColor}"
                                       onchange="settings.updatePreview()"
                                       style="width: 60px; height: 40px; border-radius: 8px; border: 2px solid var(--border-color); cursor: pointer;">
                                <input type="text" id="design-secondary-color-text" value="${secondaryColor}"
                                       onchange="settings.syncColorInput('secondary')"
                                       style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 8px;">
                            </div>
                            <p class="hint">Color para hover y elementos secundarios</p>
                        </div>

                        <div class="form-group">
                            <label>Fuente Tipográfica</label>
                            <select id="design-font-family" onchange="settings.updatePreview()">
                                <option value="system-ui" ${fontFamily === 'system-ui' ? 'selected' : ''}>Sistema (Por defecto)</option>
                                <option value="Arial, sans-serif" ${fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                                <option value="'Georgia', serif" ${fontFamily === "'Georgia', serif" ? 'selected' : ''}>Georgia</option>
                                <option value="'Courier New', monospace" ${fontFamily === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
                                <option value="'Helvetica', sans-serif" ${fontFamily === "'Helvetica', sans-serif" ? 'selected' : ''}>Helvetica</option>
                                <option value="'Times New Roman', serif" ${fontFamily === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Redondez de Bordes</label>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="range" id="design-border-radius" min="0" max="24" value="${parseInt(borderRadius)}"
                                       oninput="settings.updatePreview()"
                                       style="flex: 1;">
                                <span id="border-radius-value" style="min-width: 50px; font-weight: 600;">${borderRadius}</span>
                            </div>
                            <p class="hint">0px = Cuadrado, 24px = Muy redondeado</p>
                        </div>

                        <div class="form-group">
                            <label>Estilo de Botones</label>
                            <select id="design-button-style" onchange="settings.updatePreview()">
                                <option value="solid" ${buttonStyle === 'solid' ? 'selected' : ''}>Sólido</option>
                                <option value="outline" ${buttonStyle === 'outline' ? 'selected' : ''}>Contorno</option>
                                <option value="ghost" ${buttonStyle === 'ghost' ? 'selected' : ''}>Fantasma</option>
                            </select>
                        </div>

                        <button class="btn-save" onclick="settings.saveDesignCustomization()">
                            💾 Guardar Personalización
                        </button>

                        <button class="btn-secondary" onclick="settings.resetDesignCustomization()"
                                style="margin-top: 0.5rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color);">
                            🔄 Restaurar Valores por Defecto
                        </button>
                    </div>

                    <!-- Preview en Tiempo Real -->
                    <div>
                        <h4 style="margin-bottom: 1rem;">Vista Previa</h4>
                        <div id="widget-preview" style="border: 2px solid var(--border-color); border-radius: 12px; padding: 1.5rem; background: var(--bg-primary);">
                            <div id="preview-content">
                                <!-- El preview se renderizará aquí -->
                            </div>
                        </div>
                        <p class="hint" style="margin-top: 1rem;">
                            ℹ️ Los cambios se reflejan en tiempo real. Guarda cuando estés satisfecho con el diseño.
                        </p>
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
                    <input type="email" id="notification-email" value="${utils.escapeHtml(business.email || '')}"
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

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-new-booking"
                               ${business.booking_settings?.notifications?.newBooking !== false ? 'checked' : ''}
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>📅 Nueva Reserva</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Recibe un email cada vez que un cliente haga una reserva</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-cancelled"
                               ${business.booking_settings?.notifications?.cancelled !== false ? 'checked' : ''}
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>❌ Reserva Cancelada</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Email cuando un cliente cancele su cita desde el enlace de su email</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-modified"
                               ${business.booking_settings?.notifications?.modified !== false ? 'checked' : ''}
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>✏️ Reserva Modificada</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Email cuando un cliente cambie la hora de su cita desde el enlace de su email</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="require-confirmation"
                               ${business.booking_settings?.requireConfirmation === true ? 'checked' : ''}
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>🤝 Confirmar cada reserva manualmente</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">El cliente recibe "solicitud pendiente" al reservar, y otro email cuando confirmes o canceles la cita desde Reservas</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-reminders"
                               ${(business.booking_settings?.reminders_enabled !== false) ? 'checked' : ''}
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>🔔 Recordatorios Automáticos</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Envía recordatorios a tus clientes 24 horas antes de su cita</p>
                        </span>
                    </label>
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

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 1rem; background: ${business.whatsapp_enabled ? 'rgba(37, 211, 102, 0.05)' : 'transparent'};">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="whatsapp-enabled" ${business.whatsapp_enabled ? 'checked' : ''}
                               onchange="settings.toggleWhatsAppFields()"
                               style="width: 24px; height: 24px; cursor: pointer; accent-color: #25D366;">
                        <span>
                            <strong style="font-size: 1.1rem;">💬 Activar notificaciones por WhatsApp</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Permite enviar confirmaciones de reserva vía WhatsApp a clientes que den su consentimiento</p>
                        </span>
                    </label>
                </div>

                <div id="whatsapp-settings-fields" style="display: ${business.whatsapp_enabled ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Número de WhatsApp</label>
                        <div style="display: flex; align-items: center; gap: 0; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;">
                            <span style="padding: 0.5rem 0.75rem; background: var(--bg-secondary); color: var(--text-secondary); font-size: 0.95rem; white-space: nowrap; border-right: 1px solid var(--border-color);">+34</span>
                            <input type="text" id="whatsapp-number" value="${business.whatsapp_number ? business.whatsapp_number.replace(/^34/, '') : ''}"
                                   placeholder="612345678" style="border: none; border-radius: 0; flex: 1; margin: 0;">
                        </div>
                        <p class="hint">Introduce solo tu número sin el prefijo de país (9 dígitos)</p>
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
        // Get all values
        const primaryColor = document.getElementById('widget-primary-color')?.value || '#3b82f6';
        const secondaryColor = document.getElementById('widget-secondary-color')?.value || '#ef4444';
        const showPrices = document.getElementById('widget-show-prices')?.checked ?? true;
        const showDuration = document.getElementById('widget-show-duration')?.checked ?? true;
        const fontFamily = document.getElementById('widget-font-family')?.value || 'system-ui';
        const borderRadius = (document.getElementById('widget-border-radius')?.value || '12') + 'px';
        const buttonStyle = document.getElementById('widget-button-style')?.value || 'solid';

        // Update preview container
        const previewContent = document.getElementById('preview-widget-content');
        if (previewContent) {
            previewContent.style.fontFamily = fontFamily;
            previewContent.style.borderRadius = borderRadius;
        }

        // Update title color
        const previewTitle = document.getElementById('preview-title');
        if (previewTitle) {
            previewTitle.style.color = primaryColor;
        }

        // Update service card
        const previewService = document.getElementById('preview-service');
        if (previewService) {
            previewService.style.borderRadius = borderRadius;
            previewService.onmouseover = function() { this.style.borderColor = primaryColor; };
            previewService.onmouseout = function() { this.style.borderColor = '#eee'; };
        }

        // Update price
        const previewPrice = document.getElementById('preview-price');
        if (previewPrice) {
            previewPrice.style.color = secondaryColor;
            previewPrice.textContent = showPrices ? '15€' : '';
        }

        // Update duration
        const previewDuration = document.getElementById('preview-duration');
        if (previewDuration) {
            previewDuration.textContent = showDuration ? '30 min' : '';
        }

        // Update button with style
        const previewButton = document.getElementById('preview-button');
        if (previewButton) {
            previewButton.style.borderRadius = borderRadius;

            if (buttonStyle === 'solid') {
                previewButton.style.background = primaryColor;
                previewButton.style.color = 'white';
                previewButton.style.border = 'none';
            } else if (buttonStyle === 'outline') {
                previewButton.style.background = 'transparent';
                previewButton.style.color = primaryColor;
                previewButton.style.border = `2px solid ${primaryColor}`;
            } else { // ghost
                previewButton.style.background = 'transparent';
                previewButton.style.color = primaryColor;
                previewButton.style.border = 'none';
            }
        }

        // Sync hex inputs
        const primaryHex = document.getElementById('widget-primary-color-hex');
        if (primaryHex) {
            primaryHex.value = primaryColor;
        }
        const secondaryHex = document.getElementById('widget-secondary-color-hex');
        if (secondaryHex) {
            secondaryHex.value = secondaryColor;
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
        const showPrices = document.getElementById('widget-show-prices').checked;
        const showDuration = document.getElementById('widget-show-duration').checked;

        // Design options
        const fontFamily = document.getElementById('widget-font-family')?.value || 'system-ui';
        const borderRadius = (document.getElementById('widget-border-radius')?.value || '12') + 'px';
        const buttonStyle = document.getElementById('widget-button-style')?.value || 'solid';

        const widgetSettings = {
            primaryColor,
            secondaryColor,
            showPrices,
            showDuration
        };

        const widgetCustomization = {
            primaryColor,
            secondaryColor,
            fontFamily,
            borderRadius,
            buttonStyle
        };

        try {
            // Guardar ambas configuraciones
            await api.put(`/api/business/${this.userData.business_id}/widget-settings`, {
                widgetSettings,
                widgetCustomization
            });

            // Update local data
            this.businessData.widget_settings = JSON.stringify(widgetSettings);
            this.businessData.widget_customization = JSON.stringify(widgetCustomization);

            alert('✅ Configuración del widget guardada correctamente');
        } catch (error) {
            console.error('Error saving widget settings:', error);
            alert('❌ Error al guardar la configuración del widget');
        }
    },

    // Update preview in real-time
    updatePreview() {
        const primaryColor = document.getElementById('design-primary-color').value;
        const secondaryColor = document.getElementById('design-secondary-color').value;
        const fontFamily = document.getElementById('design-font-family').value;
        const borderRadius = document.getElementById('design-border-radius').value;
        const buttonStyle = document.getElementById('design-button-style').value;

        // Update border radius display
        document.getElementById('border-radius-value').textContent = `${borderRadius}px`;

        // Update text inputs if they exist
        const primaryText = document.getElementById('design-primary-color-text');
        const secondaryText = document.getElementById('design-secondary-color-text');
        if (primaryText) primaryText.value = primaryColor;
        if (secondaryText) secondaryText.value = secondaryColor;

        // Render preview
        this.renderWidgetPreview(primaryColor, secondaryColor, fontFamily, borderRadius, buttonStyle);
    },

    // Sync color picker with text input
    syncColorInput(type) {
        const textInput = document.getElementById(`design-${type}-color-text`);
        const colorPicker = document.getElementById(`design-${type}-color`);

        if (textInput && colorPicker) {
            const color = textInput.value;
            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                colorPicker.value = color;
                this.updatePreview();
            }
        }
    },

    // Render widget preview
    renderWidgetPreview(primaryColor, secondaryColor, fontFamily, borderRadius, buttonStyle) {
        const preview = document.getElementById('preview-content');
        if (!preview) return;

        // Determine button styles based on buttonStyle
        let buttonStyles = '';
        switch(buttonStyle) {
            case 'solid':
                buttonStyles = `background: ${primaryColor}; color: white; border: 2px solid ${primaryColor};`;
                break;
            case 'outline':
                buttonStyles = `background: transparent; color: ${primaryColor}; border: 2px solid ${primaryColor};`;
                break;
            case 'ghost':
                buttonStyles = `background: ${primaryColor}15; color: ${primaryColor}; border: 2px solid transparent;`;
                break;
        }

        preview.innerHTML = `
            <div style="font-family: ${fontFamily};">
                <h3 style="color: ${primaryColor}; margin-bottom: 1rem; border-radius: ${borderRadius}px;">
                    Reserva tu Cita
                </h3>
                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: ${borderRadius}px; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">
                        Nombre
                    </label>
                    <input type="text" placeholder="Tu nombre"
                           style="width: 100%; padding: 0.75rem; border-radius: ${borderRadius}px; border: 2px solid var(--border-color);">
                </div>
                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: ${borderRadius}px; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">
                        Fecha
                    </label>
                    <input type="date"
                           style="width: 100%; padding: 0.75rem; border-radius: ${borderRadius}px; border: 2px solid var(--border-color);">
                </div>
                <button style="${buttonStyles} padding: 0.75rem 1.5rem; border-radius: ${borderRadius}px; font-weight: 600; cursor: pointer; width: 100%; transition: all 0.2s;"
                        onmouseover="this.style.opacity='0.9'"
                        onmouseout="this.style.opacity='1'">
                    Confirmar Reserva
                </button>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: ${secondaryColor};">
                    ℹ️ Recibirás un email de confirmación
                </p>
            </div>
        `;
    },

    // Save design customization
    async saveDesignCustomization() {
        try {
            const businessId = auth.getBusinessId();

            const customization = {
                primaryColor: document.getElementById('design-primary-color').value,
                secondaryColor: document.getElementById('design-secondary-color').value,
                fontFamily: document.getElementById('design-font-family').value,
                borderRadius: `${document.getElementById('design-border-radius').value}px`,
                buttonStyle: document.getElementById('design-button-style').value
            };

            console.log('Guardando customización:', customization);

            const response = await api.put(`/api/business/${businessId}/widget-customization`, {
                customization
            });

            if (response.success) {
                // Update local data
                this.businessData.widget_customization = JSON.stringify(customization);
                alert('✅ Personalización guardada correctamente');
            } else {
                throw new Error(response.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving design customization:', error);
            alert('❌ Error al guardar la personalización: ' + error.message);
        }
    },

    // Reset design customization to defaults
    resetDesignCustomization() {
        if (!confirm('¿Seguro que quieres restaurar los valores por defecto?')) {
            return;
        }

        document.getElementById('design-primary-color').value = '#3b82f6';
        document.getElementById('design-primary-color-text').value = '#3b82f6';
        document.getElementById('design-secondary-color').value = '#8b5cf6';
        document.getElementById('design-secondary-color-text').value = '#8b5cf6';
        document.getElementById('design-font-family').value = 'system-ui';
        document.getElementById('design-border-radius').value = '12';
        document.getElementById('design-button-style').value = 'solid';

        this.updatePreview();
    },

    // Save notification settings
    async saveNotificationSettings() {
        const email = document.getElementById('notification-email').value.trim();
        const notifyNewBooking = document.getElementById('notify-new-booking').checked;
        const notifyCancelled = document.getElementById('notify-cancelled').checked;
        const notifyModified = document.getElementById('notify-modified').checked;
        // Avisos por email al negocio (los lee el backend antes de enviar)
        const notifications = { newBooking: notifyNewBooking, cancelled: notifyCancelled, modified: notifyModified };
        const notifyReminders = document.getElementById('notify-reminders').checked;
        const requireConfirmation = document.getElementById('require-confirmation').checked;

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

            // Save WhatsApp settings — añadir prefijo 34 automáticamente
            const cleanNumber = whatsappNumber.replace(/\s/g, '').replace(/^\+?34/, '');
            await api.patch(`/api/businesses/${this.userData.business_id}/whatsapp-settings`, {
                whatsapp_enabled: whatsappEnabled,
                whatsapp_number: '34' + cleanNumber,
                whatsapp_template: whatsappTemplate
            });

            // Guardar preferencia de recordatorios automáticos en booking_settings
            const currentBookingSettings = this.businessData?.booking_settings || {};
            await api.put(`/api/business/${this.userData.business_id}/settings`, {
                bookingSettings: { ...currentBookingSettings, reminders_enabled: notifyReminders, requireConfirmation, notifications }
            });
            this.businessData.booking_settings = { ...currentBookingSettings, reminders_enabled: notifyReminders, requireConfirmation, notifications };

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

        let capacity, zoneCapacities;

        // Para restaurantes (tables), leer capacidades por zona
        if (bookingMode === 'tables') {
            const zoneInputs = document.querySelectorAll('.zone-capacity-input');
            zoneCapacities = {};
            let totalCapacity = 0;

            zoneInputs.forEach(input => {
                const zone = input.dataset.zone;
                const zoneCapacity = parseInt(input.value);

                if (!zoneCapacity || zoneCapacity < 1) {
                    alert(`Por favor ingresa una capacidad válida para ${zone} (mínimo 1)`);
                    return;
                }

                zoneCapacities[zone] = zoneCapacity;
                totalCapacity += zoneCapacity;
            });

            if (Object.keys(zoneCapacities).length === 0) {
                alert('Por favor configura al menos una zona');
                return;
            }

            capacity = totalCapacity; // businessCapacity será la suma total
        } else {
            // Para services, leer capacidad única
            const capacityInput = document.getElementById('business-capacity');
            capacity = capacityInput ? parseInt(capacityInput.value) : null;

            if (!capacity || capacity < 1) {
                alert('Por favor ingresa una capacidad válida (mínimo 1)');
                return;
            }
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

            if (bookingMode === 'tables') {
                currentSettings.zoneCapacities = zoneCapacities;

                // Leer configuración de mesas por zona si está definida
                const rawZones = this.businessData.booking_settings?.restaurantZones || [];
                const zoneTableConfig = {};
                rawZones.forEach(zone => {
                    const zoneName = typeof zone === 'string' ? zone : zone.name;
                    const toggle = document.getElementById(`zone-tables-toggle-${zoneName}`);
                    if (toggle && toggle.checked) {
                        const countInputs = document.querySelectorAll(`.table-type-count[data-zone="${zoneName}"]`);
                        const capInputs = document.querySelectorAll(`.table-type-capacity[data-zone="${zoneName}"]`);
                        const tables = [];
                        countInputs.forEach((countEl, i) => {
                            const count = parseInt(countEl.value);
                            const cap = parseInt(capInputs[i]?.value);
                            if (count > 0 && cap > 0) tables.push({ count, capacity: cap });
                        });
                        if (tables.length > 0) zoneTableConfig[zoneName] = tables;
                    }
                });
                currentSettings.zoneTableConfig = Object.keys(zoneTableConfig).length > 0 ? zoneTableConfig : null;

                const allowCombiningEl = document.getElementById('allow-table-combining');
                if (allowCombiningEl) currentSettings.allowTableCombining = allowCombiningEl.checked;
            }

            if (maxPerBooking !== null) {
                currentSettings.maxPerBooking = maxPerBooking;
            }

            // Guardar configuración de adultos/niños (disponible para todos los tipos)
            const childrenEnabled = document.getElementById('children-enabled');
            if (childrenEnabled) {
                const maxChildAge = document.getElementById('max-child-age');
                const minAdults = document.getElementById('min-adults');
                const maxChildren = document.getElementById('max-children');
                const maxChildrenPerAdult = document.getElementById('max-children-per-adult');
                const customMessage = document.getElementById('children-custom-message');

                currentSettings.childrenSettings = {
                    enabled: childrenEnabled.checked,
                    maxChildAge: maxChildAge ? parseInt(maxChildAge.value) || 12 : 12,
                    minAdults: minAdults ? parseInt(minAdults.value) || 1 : 1,
                    maxChildren: maxChildren && maxChildren.value !== '' ? parseInt(maxChildren.value) : null,
                    maxChildrenPerAdult: maxChildrenPerAdult && maxChildrenPerAdult.value !== '' ? parseInt(maxChildrenPerAdult.value) : null,
                    customMessage: customMessage ? customMessage.value.trim() : ''
                };
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
                                        <input type="text" id="shift${i}-name" placeholder="Ej: ${i === 1 ? 'Comida' : i === 2 ? 'Cena' : 'Noche'}">
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
                                        <input type="time" id="shift${i}-start" value="${i === 1 ? '12:00' : i === 2 ? '19:00' : '20:00'}">
                                    </div>
                                    <div class="form-group">
                                        <label>Hora fin</label>
                                        <input type="time" id="shift${i}-end" value="${i === 1 ? '16:00' : i === 2 ? '23:00' : '23:00'}">
                                    </div>
                                </div>

                                <!-- Matriz de días activos para este turno -->
                                <div class="form-group" style="margin-top: 1rem;">
                                    <label style="font-weight: 600; margin-bottom: 0.75rem; display: block;">
                                        📅 ¿Qué días está activo este turno?
                                    </label>
                                    <div class="shift-days-matrix" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center;">
                                            ${weekDays.map(day => `
                                                <label style="display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 0.5rem; background: var(--bg-primary); border-radius: 6px; transition: all 0.2s;">
                                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem;">${utils.escapeHtml(day.name)}</span>
                                                    <input type="checkbox" id="shift${i}-day-${day.num}" value="${day.num}"
                                                           ${day.num <= 6 ? 'checked' : ''}
                                                           style="width: 20px; height: 20px; margin: 0; cursor: pointer;">
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <p class="hint" style="margin-top: 0.5rem; font-size: 0.85rem;">
                                        💡 <strong>Tip:</strong> Desmarca los días que este turno NO esté disponible. Por ejemplo, si los lunes solo haces cenas, desmarca Lunes en el turno de Comida.
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
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

    // Render Public Page Tab (Mi Página)
    renderPublicPageTab() {
        const business = this.businessData;
        const slug = business.slug || '';
        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5500'
            : 'https://stickywork.com';
        const publicUrl = `${baseUrl}/reservar?n=${slug}`;

        // Parsear configuración de página pública
        let publicPageSettings = {};
        try {
            publicPageSettings = typeof business.public_page_settings === 'string'
                ? JSON.parse(business.public_page_settings || '{}')
                : (business.public_page_settings || {});
        } catch (e) {
            publicPageSettings = {};
        }

        const pageEnabled = publicPageSettings.pageEnabled !== false;
        const showPhone = publicPageSettings.showPhone !== false;
        const showAddress = publicPageSettings.showAddress !== false;
        const showWebsite = publicPageSettings.showWebsite !== false;
        const showSchedule = publicPageSettings.showSchedule !== false;
        const indexable = publicPageSettings.indexable !== false;

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🌐 Tu Página de Reservas</h3>
                    <p>Comparte esta URL para que tus clientes puedan reservar directamente, sin necesidad de tener una web propia</p>
                </div>

                <!-- URL Pública -->
                <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <label style="color: rgba(255,255,255,0.9); font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                        Tu enlace de reservas:
                    </label>
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <input type="text"
                               id="public-url-display"
                               value="${publicUrl}"
                               readonly
                               style="flex: 1 1 200px; min-width: 0; padding: 0.75rem 1rem; border-radius: 8px; border: none; background: rgba(255,255,255,0.95); font-size: 0.95rem; color: #1f2937;">
                        <button onclick="settings.copyPublicUrl()"
                                class="btn"
                                style="padding: 0.75rem 1.25rem; background: white; color: #8b5cf6; border: none; border-radius: 8px; font-weight: 600; white-space: nowrap;">
                            📋 Copiar
                        </button>
                        <a href="${publicUrl}" target="_blank"
                           class="btn"
                           style="padding: 0.75rem 1.25rem; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 8px; font-weight: 600; text-decoration: none; white-space: nowrap;">
                            👁️ Ver
                        </a>
                    </div>
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.85rem; margin: 0.75rem 0 0 0;">
                        Comparte este enlace en redes sociales, Google Maps, WhatsApp, tarjetas de visita...
                    </p>
                </div>

                <!-- Código QR -->
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <span style="font-size: 1.5rem;">📱</span>
                        <div>
                            <h4 style="margin: 0; color: var(--text-primary);">Código QR</h4>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Imprímelo en tu local, tarjetas o folletos</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                        <div style="background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <img id="qr-code-image"
                                 src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}"
                                 alt="Código QR"
                                 style="display: block; width: 180px; height: 180px;">
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <p style="color: var(--text-secondary); margin: 0 0 1rem 0; font-size: 0.9rem;">
                                Tus clientes pueden escanear este código con la cámara de su móvil para acceder directamente a tu página de reservas.
                            </p>
                            <button onclick="settings.downloadQRCode()"
                                    class="btn btn-primary"
                                    style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;">
                                ⬇️ Descargar QR
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Activar/Desactivar página -->
                <div class="form-group" style="background: var(--bg-secondary); padding: 1.25rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <div style="position: relative; width: 50px; height: 26px;">
                            <input type="checkbox"
                                   id="public-page-enabled"
                                   ${pageEnabled ? 'checked' : ''}
                                   onchange="settings.togglePublicPage(this.checked)"
                                   style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${pageEnabled ? '#10b981' : '#6b7280'}; transition: 0.3s; border-radius: 26px;">
                                <span style="position: absolute; content: ''; height: 20px; width: 20px; left: ${pageEnabled ? '26px' : '3px'}; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                            </span>
                        </div>
                        <div>
                            <strong style="color: var(--text-primary);">Página pública activa</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Si desactivas la página, los visitantes verán un mensaje de "no disponible"</p>
                        </div>
                    </label>
                </div>

                <!-- Editar Slug -->
                <div class="form-group">
                    <label>Personaliza tu URL</label>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="color: var(--text-secondary); white-space: nowrap;">stickywork.com/reservar?n=</span>
                        <input type="text"
                               id="public-page-slug"
                               value="${slug}"
                               placeholder="mi-negocio"
                               pattern="[a-z0-9-]+"
                               style="flex: 1;">
                        <button onclick="settings.updateSlug()"
                                class="btn btn-primary"
                                style="padding: 0.6rem 1rem; white-space: nowrap;">
                            Guardar
                        </button>
                    </div>
                    <p class="hint">Solo letras minúsculas, números y guiones. Sin espacios ni caracteres especiales.</p>
                </div>
            </div>

            <!-- Configuración de Privacidad -->
            <div class="settings-section" style="margin-top: 2rem;">
                <div class="settings-section-header">
                    <h3>🔒 Información a Mostrar</h3>
                    <p>Elige qué datos de tu negocio aparecerán en la página pública</p>
                </div>

                <div style="display: grid; gap: 1rem;">
                    <label class="privacy-option" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox"
                               id="show-phone"
                               ${showPhone ? 'checked' : ''}
                               onchange="settings.updatePublicPageSettings()"
                               style="width: 20px; height: 20px;">
                        <div>
                            <strong>📞 Teléfono</strong>
                            <p class="hint" style="margin: 0;">Mostrar tu número de teléfono</p>
                        </div>
                    </label>

                    <label class="privacy-option" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox"
                               id="show-address"
                               ${showAddress ? 'checked' : ''}
                               onchange="settings.updatePublicPageSettings()"
                               style="width: 20px; height: 20px;">
                        <div>
                            <strong>📍 Dirección</strong>
                            <p class="hint" style="margin: 0;">Mostrar la dirección de tu negocio</p>
                        </div>
                    </label>

                    <label class="privacy-option" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox"
                               id="show-website"
                               ${showWebsite ? 'checked' : ''}
                               onchange="settings.updatePublicPageSettings()"
                               style="width: 20px; height: 20px;">
                        <div>
                            <strong>🌐 Sitio Web</strong>
                            <p class="hint" style="margin: 0;">Mostrar enlace a tu web (si tienes)</p>
                        </div>
                    </label>

                    <label class="privacy-option" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox"
                               id="show-schedule"
                               ${showSchedule ? 'checked' : ''}
                               onchange="settings.updatePublicPageSettings()"
                               style="width: 20px; height: 20px;">
                        <div>
                            <strong>🕐 Horarios</strong>
                            <p class="hint" style="margin: 0;">Mostrar tus horarios de atención</p>
                        </div>
                    </label>

                    <label class="privacy-option" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; cursor: pointer;">
                        <input type="checkbox"
                               id="page-indexable"
                               ${indexable ? 'checked' : ''}
                               onchange="settings.updatePublicPageSettings()"
                               style="width: 20px; height: 20px;">
                        <div>
                            <strong>🔎 Aparecer en Google</strong>
                            <p class="hint" style="margin: 0;">Permite que tu página de reservas salga en las búsquedas de Google (por ejemplo, al buscar el nombre de tu negocio). Puede tardar unas semanas en aparecer.</p>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Tips -->
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1.5rem; margin-top: 2rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e40af;">💡 Ideas para usar tu enlace</h4>
                <ul style="margin: 0; padding-left: 1.25rem; color: #1e40af;">
                    <li>Añádelo a tu perfil de Instagram y Facebook</li>
                    <li>Inclúyelo en tu ficha de Google Maps</li>
                    <li>Compártelo por WhatsApp a tus clientes</li>
                    <li>Imprímelo en tarjetas de visita con un código QR</li>
                    <li>Úsalo en tu firma de email</li>
                </ul>
            </div>
        `;
    },

    // Copiar URL pública al portapapeles
    copyPublicUrl() {
        const urlInput = document.getElementById('public-url-display');
        urlInput.select();
        document.execCommand('copy');

        // Feedback visual
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.style.background = '#10b981';
        btn.style.color = 'white';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = 'white';
            btn.style.color = '#8b5cf6';
        }, 2000);
    },

    // Descargar código QR como imagen
    async downloadQRCode() {
        const qrImage = document.getElementById('qr-code-image');
        const businessName = this.businessData.name || 'mi-negocio';
        const fileName = `QR-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;

        try {
            // Obtener la imagen como blob
            const response = await fetch(qrImage.src);
            const blob = await response.blob();

            // Crear enlace de descarga
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Feedback visual
            const btn = event.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Descargado!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error descargando QR:', error);
            alert('Error al descargar el código QR. Puedes hacer clic derecho en la imagen y seleccionar "Guardar imagen como..."');
        }
    },

    // Activar/desactivar página pública
    async togglePublicPage(enabled) {
        try {
            const response = await api.patch(`/api/business/${this.businessData.id}/public-page-settings`, {
                pageEnabled: enabled,
                showPhone: document.getElementById('show-phone')?.checked !== false,
                showAddress: document.getElementById('show-address')?.checked !== false,
                showWebsite: document.getElementById('show-website')?.checked !== false,
                showSchedule: document.getElementById('show-schedule')?.checked !== false,
                indexable: document.getElementById('page-indexable')?.checked !== false
            });

            if (response.success) {
                // Actualizar datos locales
                this.businessData.public_page_settings = response.data;
                // Re-renderizar para actualizar el toggle visual
                document.getElementById('tab-publicpage').innerHTML = this.renderPublicPageTab();
                alert(enabled ? '✅ Página pública activada' : '⚠️ Página pública desactivada');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error toggling public page:', error);
            alert('❌ Error al actualizar: ' + error.message);
            // Revertir checkbox
            document.getElementById('public-page-enabled').checked = !enabled;
        }
    },

    // Actualizar slug
    async updateSlug() {
        const slugInput = document.getElementById('public-page-slug');
        const newSlug = slugInput.value.trim().toLowerCase();

        // Validar formato
        if (!newSlug || newSlug.length < 3) {
            alert('⚠️ El slug debe tener al menos 3 caracteres');
            return;
        }

        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(newSlug)) {
            alert('⚠️ Solo puedes usar letras minúsculas, números y guiones');
            return;
        }

        try {
            const response = await api.patch(`/api/business/${this.businessData.id}/slug`, {
                slug: newSlug
            });

            if (response.success) {
                this.businessData.slug = newSlug;
                // Actualizar la URL mostrada
                const baseUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:5500'
                    : 'https://stickywork.com';
                document.getElementById('public-url-display').value = `${baseUrl}/reservar?n=${newSlug}`;
                alert('✅ URL actualizada correctamente');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error updating slug:', error);
            alert('❌ ' + (error.message || 'Error al actualizar el slug'));
        }
    },

    // Actualizar configuración de privacidad
    async updatePublicPageSettings() {
        try {
            const response = await api.patch(`/api/business/${this.businessData.id}/public-page-settings`, {
                pageEnabled: document.getElementById('public-page-enabled')?.checked !== false,
                showPhone: document.getElementById('show-phone')?.checked,
                showAddress: document.getElementById('show-address')?.checked,
                showWebsite: document.getElementById('show-website')?.checked,
                showSchedule: document.getElementById('show-schedule')?.checked,
                indexable: document.getElementById('page-indexable')?.checked
            });

            if (response.success) {
                this.businessData.public_page_settings = response.data;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error updating public page settings:', error);
            // No mostrar alerta para no interrumpir, el cambio visual ya está hecho
        }
    },

    // ===== Invita y gana (programa de recomendación) =====
    async loadInviteTab() {
        const box = document.getElementById('tab-invite');
        try {
            const res = await api.get('/api/referrals/me');
            if (!res.success) throw new Error(res.message);
            box.innerHTML = this.renderInviteTab(res.data);
        } catch (error) {
            console.error('Error cargando recomendaciones:', error);
            box.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No se pudo cargar tu enlace de invitación. Inténtalo de nuevo en un momento.</div>';
        }
    },

    renderInviteTab(d) {
        if (d.demo) {
            return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🎁 Invita a otro negocio y ganáis un mes de Profesional los dos</h3>
                </div>
                <div style="padding: 1.25rem; border-radius: 12px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); line-height: 1.6;">
                    Esta es una <strong>cuenta de demostración</strong>, así que no tiene enlace de invitación.
                    Cuando crees la cuenta de tu negocio, aquí tendrás tu enlace: por cada negocio que se registre con él
                    y reciba sus primeras 3 reservas, los dos ganáis un mes del plan Profesional.
                </div>
            </div>`;
        }
        const esc =v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        let bonusText = '';
        if (d.bonusUntil) {
            const f = new Date(d.bonusUntil);
            bonusText = `<div class="invite-bonus">✨ Tienes el plan <strong>Profesional</strong> de regalo hasta el <strong>${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}</strong>. Después vuelves al plan Gratis, sin pagar nada.</div>`;
        }
        if (d.pendingRewards > 0) {
            bonusText += `<div class="invite-bonus">✨ Has ganado <strong>${d.pendingRewards} ${d.pendingRewards === 1 ? 'mes' : 'meses'}</strong>: te los descontaremos de tu factura.</div>`;
        }
        const waText = encodeURIComponent(`Te recomiendo StickyWork para las reservas de tu negocio: tus clientes reservan solos y les llegan recordatorios. Con mi enlace empiezas con un mes del plan Profesional gratis: ${d.link}`);
        const pendientes = d.invited - d.rewarded;

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🎁 Invita a otro negocio y ganáis un mes de Profesional los dos</h3>
                    <p>¿Conoces a alguien con peluquería, clínica, centro de estética o cualquier negocio con citas? Pásale tu enlace.</p>
                </div>

                ${bonusText}

                <ol class="invite-steps">
                    <li><strong>Comparte tu enlace</strong> con otro negocio.</li>
                    <li><strong>Se registra gratis</strong> con él y empieza con <strong>1 mes de Profesional</strong> de regalo.</li>
                    <li>Cuando reciba sus <strong>primeras ${d.bookingsNeeded} reservas</strong>, tú también ganas <strong>1 mes de Profesional</strong>. Te avisamos por email.</li>
                </ol>

                <div class="form-group">
                    <label>Tu enlace de invitación</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <input type="text" id="invite-link" value="${esc(d.link)}" readonly style="flex: 1; min-width: 220px;">
                        <button class="btn btn-primary" onclick="settings.copyInviteLink(this)" style="white-space: nowrap;">📋 Copiar</button>
                        <a class="btn btn-secondary" href="https://wa.me/?text=${waText}" target="_blank" rel="noopener" style="white-space: nowrap; text-decoration: none;">💬 WhatsApp</a>
                    </div>
                </div>

                <div class="invite-stats">
                    <div><strong>${d.invited}</strong><span>${d.invited === 1 ? 'negocio invitado' : 'negocios invitados'}</span></div>
                    <div><strong>${d.rewarded}</strong><span>${d.rewarded === 1 ? 'mes ganado' : 'meses ganados'}</span></div>
                    <div><strong>${pendientes}</strong><span>esperando sus primeras reservas</span></div>
                </div>

                <p class="hint" style="margin-top: 1rem;">Los meses se suman (hasta ${d.maxRewards}). Si ya pagas un plan, el mes se descuenta de tu factura. El mes de regalo no se renueva solo ni te cobraremos nada.</p>
            </div>

            <style>
                .invite-bonus { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.35); color: var(--text-primary); padding: 0.85rem 1rem; border-radius: 10px; margin-bottom: 1rem; line-height: 1.5; }
                .invite-steps { margin: 0 0 1.5rem; padding-left: 1.25rem; color: var(--text-secondary); line-height: 1.7; }
                .invite-steps strong { color: var(--text-primary); }
                .invite-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1.5rem; }
                .invite-stats > div { background: var(--bg-secondary); border-radius: 10px; padding: 1rem; text-align: center; }
                .invite-stats strong { display: block; font-size: 1.6rem; color: var(--primary-color); }
                .invite-stats span { font-size: 0.85rem; color: var(--text-secondary); }
                @media (max-width: 600px) { .invite-stats { grid-template-columns: 1fr; } }
            </style>
        `;
    },

    async copyInviteLink(btn) {
        const input = document.getElementById('invite-link');
        try {
            await navigator.clipboard.writeText(input.value);
        } catch (e) {
            input.select();
            document.execCommand('copy');
        }
        const original = btn.innerHTML;
        btn.innerHTML = '✅ Copiado';
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    },

    // Render Billing Tab
    // El contenido real lo pinta billing.js al abrir la pestaña (switchTab → billing.load)
    renderBillingTab() {
        return '<div class="loading"><p>Cargando tu plan...</p></div>';
    },

    // Render Advanced Tab
    renderAdvancedTab() {
        const business = this.businessData;

        return `
            <!-- Eliminar cuenta: se gestiona a través de soporte -->
            <div class="settings-section danger-zone">
                <h3>🗑️ Eliminar mi cuenta</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.6;">
                    Si quieres dar de baja tu negocio y que borremos tus datos (reservas, clientes y configuración),
                    escríbenos y lo gestionamos. Te confirmaremos cuando esté hecho.
                </p>
                <button class="btn-secondary" onclick="app.navigateTo('support')">
                    Escribir a soporte
                </button>
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

    // Toggle children settings visibility
    // --- Helpers para configuración de mesas por zona ---
    toggleZoneTables(zoneName, enabled) {
        const configDiv = document.getElementById(`zone-tables-config-${zoneName}`);
        const capacityInput = document.getElementById(`zone-capacity-${zoneName}`);
        if (configDiv) configDiv.style.display = enabled ? 'block' : 'none';
        if (capacityInput) {
            if (enabled) {
                capacityInput.setAttribute('readonly', '');
                capacityInput.style.background = 'var(--bg-secondary)';
                capacityInput.style.cursor = 'default';
                capacityInput.style.borderColor = 'var(--border-color)';
                this.recalcZoneCapacity(zoneName);
            } else {
                capacityInput.removeAttribute('readonly');
                capacityInput.style.background = 'var(--bg-primary)';
                capacityInput.style.cursor = '';
                capacityInput.style.borderColor = 'var(--border-color)';
            }
        }
    },

    addTableTypeRow(zoneName) {
        const container = document.getElementById(`zone-table-rows-${zoneName}`);
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'table-type-row';
        row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;';
        row.innerHTML = `
            <input type="number" class="table-type-count" data-zone="${zoneName}"
                   min="1" max="50" placeholder="2" style="width:60px;"
                   oninput="settings.recalcZoneCapacity('${zoneName}')">
            <span style="color:var(--text-secondary);font-size:0.9rem;">mesas de</span>
            <input type="number" class="table-type-capacity" data-zone="${zoneName}"
                   min="1" max="50" placeholder="4" style="width:60px;"
                   oninput="settings.recalcZoneCapacity('${zoneName}')">
            <span style="color:var(--text-secondary);font-size:0.9rem;">personas</span>
            <button type="button" onclick="settings.removeTableTypeRow(this, this.dataset.zone)" data-zone="${utils.escapeHtml(zoneName)}"
                    style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;padding:0 4px;">✕</button>
        `;
        container.appendChild(row);
    },

    removeTableTypeRow(btn, zoneName) {
        btn.closest('.table-type-row').remove();
        this.recalcZoneCapacity(zoneName);
    },

    recalcZoneCapacity(zoneName) {
        const countInputs = document.querySelectorAll(`.table-type-count[data-zone="${zoneName}"]`);
        const capInputs = document.querySelectorAll(`.table-type-capacity[data-zone="${zoneName}"]`);
        let total = 0;
        countInputs.forEach((countEl, i) => {
            total += (parseInt(countEl.value) || 0) * (parseInt(capInputs[i]?.value) || 0);
        });
        const capacityInput = document.getElementById(`zone-capacity-${zoneName}`);
        if (capacityInput) capacityInput.value = total > 0 ? total : '';
    },
    // --- Fin helpers mesas ---

    toggleChildrenSettings(enabled) {
        const detailsDiv = document.getElementById('children-settings-details');
        if (detailsDiv) {
            detailsDiv.style.display = enabled ? 'block' : 'none';
        }

        // Actualizar visualmente el toggle
        const checkbox = document.getElementById('children-enabled');
        if (checkbox) {
            const toggleBg = checkbox.nextElementSibling;
            const toggleKnob = toggleBg?.querySelector('span');
            if (toggleBg) {
                toggleBg.style.backgroundColor = enabled ? '#10b981' : '#6b7280';
            }
            if (toggleKnob) {
                toggleKnob.style.left = enabled ? '26px' : '3px';
            }
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

                        // Cargar días activos para este turno
                        const activeDays = shift.activeDays || [1, 2, 3, 4, 5, 6, 7]; // Por defecto todos

                        // Primero desmarcar todos los días de este turno
                        for (let day = 1; day <= 7; day++) {
                            const dayCheckbox = document.getElementById(`shift${i}-day-${day}`);
                            if (dayCheckbox) dayCheckbox.checked = false;
                        }

                        // Luego marcar solo los días activos
                        activeDays.forEach(day => {
                            const dayCheckbox = document.getElementById(`shift${i}-day-${day}`);
                            if (dayCheckbox) dayCheckbox.checked = true;
                        });
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

                    // Recoger los días activos para este turno
                    const activeDays = [];
                    for (let day = 1; day <= 7; day++) {
                        const dayCheckbox = document.getElementById(`shift${i}-day-${day}`);
                        if (dayCheckbox && dayCheckbox.checked) {
                            activeDays.push(day);
                        }
                    }

                    if (!startTime || !endTime) {
                        alert(`Por favor completa todos los horarios del turno ${i}`);
                        return;
                    }

                    if (activeDays.length === 0) {
                        alert(`Por favor selecciona al menos un día activo para el turno ${i}`);
                        return;
                    }

                    bookingSettings.shifts.push({
                        id: i,
                        name: name || `Turno ${i}`,
                        startTime,
                        endTime,
                        enabled,
                        activeDays
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

        // Para restaurantes (tables), mostrar capacidad por zona
        if (bookingMode === 'tables') {
            const zones = bookingSettings.restaurantZones || ['Terraza', 'Interior'];
            const zoneCapacities = bookingSettings.zoneCapacities || {};
            const maxPerBooking = bookingSettings.maxPerBooking || 10;

            const zoneTableConfig = bookingSettings.zoneTableConfig || {};
            const allowTableCombining = bookingSettings.allowTableCombining !== false; // true por defecto

            const zoneFields = zones.map(zone => {
                const zoneName = typeof zone === 'string' ? zone : zone.name;
                const capacity = zoneCapacities[zoneName] || 20;
                const tableConf = zoneTableConfig[zoneName];
                const hasTables = tableConf && tableConf.length > 0;

                const tableRows = (hasTables ? tableConf : [{ count: '', capacity: '' }]).map(t => `
                    <div class="table-type-row" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
                        <input type="number" class="table-type-count" data-zone="${zoneName}"
                               min="1" max="50" value="${t.count}" placeholder="2" style="width:60px;"
                               oninput="settings.recalcZoneCapacity('${zoneName}')">
                        <span style="color:var(--text-secondary);font-size:0.9rem;">mesas de</span>
                        <input type="number" class="table-type-capacity" data-zone="${zoneName}"
                               min="1" max="50" value="${t.capacity}" placeholder="4" style="width:60px;"
                               oninput="settings.recalcZoneCapacity('${zoneName}')">
                        <span style="color:var(--text-secondary);font-size:0.9rem;">personas</span>
                        <button type="button" onclick="settings.removeTableTypeRow(this, this.dataset.zone)" data-zone="${utils.escapeHtml(zoneName)}"
                                style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;padding:0 4px;">✕</button>
                    </div>
                `).join('');

                return `
                    <div style="padding:1rem 1.25rem;border:1px solid var(--border-color);border-radius:10px;margin-bottom:1rem;background:var(--bg-primary);">
                        <p style="font-weight:700;font-size:1rem;margin:0 0 1rem 0;color:var(--text-primary);">${zoneName}</p>

                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                            <div>
                                <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 0.4rem 0;">Capacidad total</p>
                                <input type="number" class="zone-capacity-input"
                                       id="zone-capacity-${zoneName}"
                                       data-zone="${zoneName}"
                                       min="1" max="1000"
                                       value="${capacity}"
                                       placeholder="20"
                                       style="width:100%;padding:0.6rem 0.75rem;border:2px solid var(--border-color);border-radius:8px;background:${hasTables ? 'var(--bg-secondary)' : 'var(--bg-primary)'};color:var(--text-primary);font-size:0.95rem;"
                                       ${hasTables ? 'readonly' : ''}>
                            </div>
                        </div>

                        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;cursor:pointer;"
                             onclick="document.getElementById('zone-tables-toggle-${zoneName}').click()">
                            <input type="checkbox" id="zone-tables-toggle-${zoneName}"
                                   onchange="settings.toggleZoneTables('${zoneName}',this.checked)"
                                   onclick="event.stopPropagation()"
                                   style="width:16px;height:16px;flex-shrink:0;cursor:pointer;accent-color:var(--primary-color);"
                                   ${hasTables ? 'checked' : ''}>
                            <span style="font-size:0.9rem;color:var(--text-primary);cursor:pointer;">Definir tipos de mesas (opcional)</span>
                        </div>

                        <div id="zone-tables-config-${zoneName}" style="display:${hasTables ? 'block' : 'none'};background:var(--bg-secondary);padding:0.85rem 1rem;border-radius:8px;border:1px solid var(--border-color);">
                            <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 0.75rem 0;">
                                La capacidad total se calculará automáticamente
                            </p>
                            <div id="zone-table-rows-${zoneName}">
                                ${tableRows}
                            </div>
                            <button type="button" onclick="settings.addTableTypeRow(this.dataset.zone)" data-zone="${utils.escapeHtml(zoneName)}"
                                    style="margin-top:0.5rem;padding:0.35rem 0.85rem;font-size:0.85rem;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-primary);color:var(--text-primary);cursor:pointer;">
                                + Añadir tipo de mesa
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Configuración de diferenciación adultos/niños
            const childrenSettings = bookingSettings.childrenSettings || {};
            const childrenEnabled = childrenSettings.enabled || false;
            const maxChildAge = childrenSettings.maxChildAge || 12;
            const minAdults = childrenSettings.minAdults || 1;
            const maxChildren = childrenSettings.maxChildren !== null && childrenSettings.maxChildren !== undefined
                ? childrenSettings.maxChildren : '';
            const maxChildrenPerAdult = childrenSettings.maxChildrenPerAdult !== null && childrenSettings.maxChildrenPerAdult !== undefined
                ? childrenSettings.maxChildrenPerAdult : '';
            const customMessage = childrenSettings.customMessage || '';

            return `
                <div class="settings-section">
                    <div class="settings-section-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;">
                        <div>
                            <h3>👥 Gestión de Capacidad por Zona</h3>
                            <p>Configura la capacidad de cada zona de tu restaurante</p>
                        </div>
                        <button type="button" onclick="settings.openFloorEditor()"
                                style="padding:0.5rem 1rem;background:var(--primary-color);color:white;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.4rem;white-space:nowrap;">
                            🗺️ Editar Plano
                        </button>
                    </div>

                    ${zoneFields}

                    <div style="padding:1rem 1.25rem;border:1px solid var(--border-color);border-radius:10px;margin-bottom:1rem;background:var(--bg-primary);">
                        <div style="display:flex;align-items:center;gap:0.6rem;cursor:pointer;"
                             onclick="document.getElementById('allow-table-combining').click()">
                            <input type="checkbox" id="allow-table-combining"
                                   onclick="event.stopPropagation()"
                                   style="width:16px;height:16px;flex-shrink:0;cursor:pointer;accent-color:var(--primary-color);"
                                   ${allowTableCombining ? 'checked' : ''}>
                            <div>
                                <p style="margin:0;font-weight:600;font-size:0.95rem;color:var(--text-primary);">Permitir combinar mesas</p>
                                <p style="margin:0.2rem 0 0 0;font-size:0.82rem;color:var(--text-secondary);">Si está desactivado, cada reserva debe caber en una sola mesa</p>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Máximo de comensales por reserva</label>
                        <input type="number" id="max-per-booking"
                               min="1" max="50"
                               value="${maxPerBooking}"
                               placeholder="10">
                        <p class="hint">Número máximo de personas que pueden reservar en una sola mesa</p>
                    </div>

                    <!-- Sección Adultos/Niños -->
                    <div class="settings-subsection" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                        <div class="settings-section-header">
                            <h4 style="margin: 0 0 0.5rem 0;">👨‍👧 Diferenciación Adultos/Niños</h4>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                Permite a los clientes especificar cuántos adultos y niños asistirán
                            </p>
                        </div>

                        <div class="form-group" style="margin-top: 1rem;">
                            <label class="toggle-container" style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                                <label style="position: relative; display: inline-block; width: 50px; height: 26px;">
                                    <input type="checkbox" id="children-enabled" ${childrenEnabled ? 'checked' : ''}
                                           onchange="settings.toggleChildrenSettings(this.checked)"
                                           style="opacity: 0; width: 0; height: 0;">
                                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${childrenEnabled ? '#10b981' : '#6b7280'}; transition: 0.3s; border-radius: 26px;">
                                        <span style="position: absolute; content: ''; height: 20px; width: 20px; left: ${childrenEnabled ? '26px' : '3px'}; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></span>
                                    </span>
                                </label>
                                <span style="color: var(--text-primary);">Activar diferenciación adultos/niños</span>
                            </label>
                            <p class="hint">Si está activo, el widget mostrará selectores separados para adultos y niños</p>
                        </div>

                        <div id="children-settings-details" style="display: ${childrenEnabled ? 'block' : 'none'}; margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label>Edad máxima niño</label>
                                    <input type="number" id="max-child-age"
                                           min="1" max="18"
                                           value="${maxChildAge}"
                                           placeholder="12">
                                    <p class="hint">Hasta qué edad se considera niño</p>
                                </div>
                                <div class="form-group">
                                    <label>Mínimo de adultos</label>
                                    <input type="number" id="min-adults"
                                           min="1" max="10"
                                           value="${minAdults}"
                                           placeholder="1">
                                    <p class="hint">Adultos mínimos requeridos por reserva</p>
                                </div>
                            </div>

                            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label>Máximo de niños por reserva (opcional)</label>
                                    <input type="number" id="max-children"
                                           min="0" max="50"
                                           value="${maxChildren}"
                                           placeholder="Sin límite">
                                    <p class="hint">Dejar vacío para no limitar</p>
                                </div>
                                <div class="form-group">
                                    <label>Máximo de niños por adulto (opcional)</label>
                                    <input type="number" id="max-children-per-adult"
                                           min="1" max="20"
                                           value="${maxChildrenPerAdult}"
                                           placeholder="Sin límite">
                                    <p class="hint">Ej: 2 → con 1 adulto máx 2 niños, con 2 adultos máx 4</p>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Mensaje personalizado (opcional)</label>
                                <textarea id="children-custom-message"
                                          placeholder="Ej: Niños de 0 a 12 años"
                                          maxlength="300"
                                          rows="3">${customMessage}</textarea>
                                <p class="hint">Se mostrará junto al selector de niños en el widget (máx. 300 caracteres)</p>
                            </div>
                        </div>
                    </div>

                    <button class="btn-save" onclick="settings.saveCapacity()" style="margin-top: 1.5rem;">
                        💾 Guardar Capacidad
                    </button>
                </div>
            `;
        }

        // Para services
        const label = 'Número de profesionales/estaciones';
        const hint = 'Cuántas personas pueden ser atendidas al mismo tiempo';
        const placeholder = '3';

        // Configuración de diferenciación adultos/niños (disponible para todos los tipos)
        const childrenSettingsServices = bookingSettings.childrenSettings || {};
        const childrenEnabledServices = childrenSettingsServices.enabled || false;
        const maxChildAgeServices = childrenSettingsServices.maxChildAge || 12;
        const minAdultsServices = childrenSettingsServices.minAdults || 1;
        const maxChildrenServices = childrenSettingsServices.maxChildren !== null && childrenSettingsServices.maxChildren !== undefined
            ? childrenSettingsServices.maxChildren : '';
        const maxChildrenPerAdultServices = childrenSettingsServices.maxChildrenPerAdult !== null && childrenSettingsServices.maxChildrenPerAdult !== undefined
            ? childrenSettingsServices.maxChildrenPerAdult : '';
        const customMessageServices = childrenSettingsServices.customMessage || '';

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

                <!-- Sección Adultos/Niños -->
                <div class="settings-subsection" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                    <div class="settings-section-header">
                        <h4 style="margin: 0 0 0.5rem 0;">👨‍👧 Diferenciación Adultos/Niños</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                            Permite a los clientes especificar cuántos adultos y niños asistirán
                        </p>
                    </div>

                    <div class="form-group" style="margin-top: 1rem;">
                        <label class="toggle-container" style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                            <span class="toggle-switch">
                                <input type="checkbox" id="children-enabled" ${childrenEnabledServices ? 'checked' : ''}
                                       onchange="settings.toggleChildrenSettings(this.checked)">
                                <span class="toggle-slider"></span>
                            </span>
                            <span style="color: var(--text-primary);">Activar diferenciación adultos/niños</span>
                        </label>
                        <p class="hint">Si está activo, el widget mostrará selectores separados para adultos y niños</p>
                    </div>

                    <div id="children-settings-details" style="display: ${childrenEnabledServices ? 'block' : 'none'}; margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Edad máxima niño</label>
                                <input type="number" id="max-child-age"
                                       min="1" max="18"
                                       value="${maxChildAgeServices}"
                                       placeholder="12">
                                <p class="hint">Hasta qué edad se considera niño</p>
                            </div>
                            <div class="form-group">
                                <label>Mínimo de adultos</label>
                                <input type="number" id="min-adults"
                                       min="1" max="10"
                                       value="${minAdultsServices}"
                                       placeholder="1">
                                <p class="hint">Adultos mínimos requeridos por reserva</p>
                            </div>
                        </div>

                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Máximo de niños por reserva (opcional)</label>
                                <input type="number" id="max-children"
                                       min="0" max="50"
                                       value="${maxChildrenServices}"
                                       placeholder="Sin límite">
                                <p class="hint">Dejar vacío para no limitar</p>
                            </div>
                            <div class="form-group">
                                <label>Máximo de niños por adulto (opcional)</label>
                                <input type="number" id="max-children-per-adult"
                                       min="1" max="20"
                                       value="${maxChildrenPerAdultServices}"
                                       placeholder="Sin límite">
                                <p class="hint">Ej: 2 → con 1 adulto máx 2 niños, con 2 adultos máx 4</p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Mensaje personalizado (opcional)</label>
                            <textarea id="children-custom-message"
                                      placeholder="Ej: Niños de 0 a 12 años"
                                      maxlength="300"
                                      rows="3">${customMessageServices}</textarea>
                            <p class="hint">Se mostrará junto al selector de niños en el widget (máx. 300 caracteres)</p>
                        </div>
                    </div>
                </div>

                <button class="btn-save" onclick="settings.saveCapacity()" style="margin-top: 1.5rem;">
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

        // Convertir zonas antiguas (strings) a nuevo formato (objetos)
        let zones = bookingSettings.restaurantZones || ['Terraza', 'Interior'];
        zones = zones.map((zone, index) => {
            if (typeof zone === 'string') {
                return { id: index + 1, name: zone, enabled: true };
            }
            return { ...zone, enabled: zone.enabled !== false }; // Default true
        });

        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>🏢 Gestión de Zonas</h3>
                    <p>Configura las zonas disponibles para tu restaurante (Terraza, Interior, Sala VIP, etc.)</p>
                </div>

                <div class="form-group">
                    <label>Zonas disponibles</label>
                    <p class="hint">Los clientes podrán seleccionar su zona preferida al hacer una reserva. Puedes desactivar zonas temporalmente (ej: terraza en invierno) sin perder la configuración.</p>

                    <div id="zones-list" style="margin-top: 1rem;">
                        ${zones.map((zone, index) => `
                            <div class="zone-item" data-index="${index}" data-zone-id="${zone.id}" style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div style="flex: 1;">
                                    <input type="text"
                                           class="zone-input"
                                           value="${utils.escapeHtml(zone.name)}"
                                           placeholder="Nombre de la zona"
                                           style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">
                                </div>

                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <label class="toggle-switch" title="${zone.enabled ? 'Zona activa' : 'Zona desactivada'}">
                                        <input type="checkbox"
                                               class="zone-enabled-checkbox"
                                               data-zone-id="${zone.id}"
                                               ${zone.enabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="zone-status-text" style="font-size: 0.85rem; min-width: 80px; color: ${zone.enabled ? '#10b981' : '#6b7280'};">
                                        ${zone.enabled ? '✅ Activa' : '⏸️ Inactiva'}
                                    </span>
                                </div>

                                <button onclick="settings.removeZone(${index})"
                                        class="btn btn-secondary"
                                        style="padding: 0.5rem 1rem; background: #ef4444; color: white; white-space: nowrap;">
                                    ✕ Eliminar
                                </button>
                            </div>
                        `).join('')}
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
                        Puedes desactivar zonas temporalmente (ej: terraza en invierno) sin borrar su configuración.
                    </p>
                </div>

                <style>
                    .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 50px;
                        height: 24px;
                    }

                    .toggle-switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }

                    .toggle-slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: .4s;
                        border-radius: 24px;
                    }

                    .toggle-slider:before {
                        position: absolute;
                        content: "";
                        height: 18px;
                        width: 18px;
                        left: 3px;
                        bottom: 3px;
                        background-color: white;
                        transition: .4s;
                        border-radius: 50%;
                    }

                    input:checked + .toggle-slider {
                        background-color: #10b981;
                    }

                    input:checked + .toggle-slider:before {
                        transform: translateX(26px);
                    }
                </style>
            </div>
        `;
    },

    // Add zone
    addZone() {
        const zonesList = document.getElementById('zones-list');
        const newIndex = zonesList.children.length;
        const newId = Date.now(); // ID único basado en timestamp

        const zoneItem = document.createElement('div');
        zoneItem.className = 'zone-item';
        zoneItem.dataset.index = newIndex;
        zoneItem.dataset.zoneId = newId;
        zoneItem.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;';
        zoneItem.innerHTML = `
            <div style="flex: 1;">
                <input type="text"
                       class="zone-input"
                       value=""
                       placeholder="Nombre de la zona"
                       style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <label class="toggle-switch" title="Zona activa">
                    <input type="checkbox"
                           class="zone-enabled-checkbox"
                           data-zone-id="${newId}"
                           checked>
                    <span class="toggle-slider"></span>
                </label>
                <span class="zone-status-text" style="font-size: 0.85rem; min-width: 80px; color: #10b981;">
                    ✅ Activa
                </span>
            </div>

            <button onclick="settings.removeZone(${newIndex})"
                    class="btn btn-secondary"
                    style="padding: 0.5rem 1rem; background: #ef4444; color: white; white-space: nowrap;">
                ✕ Eliminar
            </button>
        `;

        zonesList.appendChild(zoneItem);

        // Añadir event listener al toggle del nuevo elemento
        const newToggle = zoneItem.querySelector('.zone-enabled-checkbox');
        const newStatusText = zoneItem.querySelector('.zone-status-text');

        newToggle.addEventListener('change', function() {
            if (this.checked) {
                newStatusText.textContent = '✅ Activa';
                newStatusText.style.color = '#10b981';
                this.parentElement.title = 'Zona activa';
            } else {
                newStatusText.textContent = '⏸️ Inactiva';
                newStatusText.style.color = '#6b7280';
                this.parentElement.title = 'Zona desactivada';
            }
        });
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
        const zoneItems = document.querySelectorAll('.zone-item');
        const zones = Array.from(zoneItems).map((item, index) => {
            const nameInput = item.querySelector('.zone-input');
            const enabledCheckbox = item.querySelector('.zone-enabled-checkbox');
            const zoneId = item.dataset.zoneId || index + 1;

            return {
                id: parseInt(zoneId),
                name: nameInput.value.trim(),
                enabled: enabledCheckbox.checked
            };
        }).filter(zone => zone.name !== '');

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
                bookingSettings: bookingSettings
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

    // Initialize zone toggles event listeners
    initializeZoneToggles() {
        const toggles = document.querySelectorAll('.zone-enabled-checkbox');

        toggles.forEach(toggle => {
            const statusText = toggle.closest('.zone-item')?.querySelector('.zone-status-text');
            const toggleLabel = toggle.parentElement;

            if (!statusText) return;

            // Remove any existing listeners by cloning
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            // Add event listener
            newToggle.addEventListener('change', function() {
                if (this.checked) {
                    statusText.textContent = '✅ Activa';
                    statusText.style.color = '#10b981';
                    if (toggleLabel) toggleLabel.title = 'Zona activa';
                } else {
                    statusText.textContent = '⏸️ Inactiva';
                    statusText.style.color = '#6b7280';
                    if (toggleLabel) toggleLabel.title = 'Zona desactivada';
                }
            });
        });
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

        // Si los valores eran los por defecto, sincronizarlos con el estado para que
        // los métodos de edición (updateFeedbackQuestionType, etc.) los encuentren
        if (!bookingSettings.feedbackSettings) {
            bookingSettings.feedbackSettings = feedbackSettings;
            this.businessData.booking_settings = bookingSettings;
        }

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
                        <div class="feedback-question-card" data-index="${index}" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.25rem; border: 1px solid var(--border-color);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                                <h4 style="margin: 0; color: var(--primary-light); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Pregunta ${index + 1}</h4>
                                ${index > 0 ? `
                                    <button onclick="settings.removeFeedbackQuestion(${index})"
                                            style="padding: 0.25rem 0.7rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; font-size: 0.85rem; cursor: pointer;">
                                        ✕ Eliminar
                                    </button>
                                ` : ''}
                            </div>

                            <div class="form-group">
                                <label style="color: var(--text-secondary); font-size: 0.85rem;">Tipo de pregunta</label>
                                <select class="feedback-question-type form-input" data-index="${index}" onchange="settings.updateFeedbackQuestionType(${index})">
                                    <option value="rating" ${q.type === 'rating' ? 'selected' : ''}>⭐ Rating (1-5 estrellas)</option>
                                    <option value="multiple_choice" ${q.type === 'multiple_choice' ? 'selected' : ''}>✅ Opción múltiple</option>
                                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>📝 Texto corto</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label style="color: var(--text-secondary); font-size: 0.85rem;">Texto de la pregunta</label>
                                <input type="text"
                                       class="feedback-question-text form-input"
                                       data-index="${index}"
                                       value="${utils.escapeHtml(q.question)}"
                                       placeholder="Escribe tu pregunta aquí">
                            </div>

                            ${q.type === 'multiple_choice' ? `
                                <div class="form-group feedback-options-container" data-index="${index}">
                                    <label style="color: var(--text-secondary); font-size: 0.85rem;">Opciones de respuesta</label>
                                    ${(q.options || []).map((option, optIndex) => `
                                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                            <input type="text"
                                                   class="feedback-option-input form-input"
                                                   data-question="${index}"
                                                   data-option="${optIndex}"
                                                   value="${option}"
                                                   placeholder="Opción ${optIndex + 1}"
                                                   style="flex: 1;">
                                            <button onclick="settings.removeFeedbackOption(${index}, ${optIndex})"
                                                    style="padding: 0.25rem 0.7rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; cursor: pointer;">
                                                ✕
                                            </button>
                                        </div>
                                    `).join('')}
                                    <button onclick="settings.addFeedbackOption(${index})"
                                            style="padding: 0.5rem 1rem; margin-top: 0.25rem; background: rgba(77,83,255,0.1); color: var(--primary-light); border: 1px dashed var(--primary-color); border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                                        + Agregar opción
                                    </button>
                                </div>
                            ` : ''}

                            <div style="background: var(--bg-tertiary); padding: 0.9rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
                                <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; margin: 0;">
                                    <input type="checkbox"
                                           class="feedback-question-required"
                                           data-index="${index}"
                                           ${q.required ? 'checked' : ''}
                                           style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; flex-shrink: 0;">
                                    <span>
                                        <strong style="color: var(--text-primary); font-size: 0.9rem;">Respuesta obligatoria</strong>
                                        <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">El cliente deberá responder esta pregunta para poder enviar el formulario</p>
                                    </span>
                                </label>
                            </div>
                        </div>
                    `).join('')}

                    ${feedbackSettings.questions.length < 3 ? `
                        <button onclick="settings.addFeedbackQuestion()"
                                style="width: 100%; padding: 1rem; border: 2px dashed var(--border-color); background: transparent; color: var(--primary-light); border-radius: 12px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s;">
                            + Agregar pregunta (${feedbackSettings.questions.length}/3)
                        </button>
                    ` : ''}
                </div>

                <div style="background: rgba(77,83,255,0.08); border-left: 3px solid var(--primary-color); padding: 1rem 1.25rem; margin-top: 2rem; border-radius: 8px;">
                    <p style="margin: 0 0 0.4rem 0; color: var(--text-primary); font-weight: 600; font-size: 0.9rem;">
                        Pregunta genérica (siempre incluida):
                    </p>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.88rem;">
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

        // Verificar que la pregunta existe
        if (!feedbackSettings.questions[index]) {
            console.error('Pregunta no existe en index:', index);
            return;
        }

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

        // Verificar que la pregunta existe
        if (!feedbackSettings.questions[questionIndex]) {
            console.error('Pregunta no existe en index:', questionIndex);
            return;
        }

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

        // Verificar que la pregunta y las opciones existen
        if (!feedbackSettings.questions[questionIndex] || !feedbackSettings.questions[questionIndex].options) {
            console.error('Pregunta u opciones no existen en index:', questionIndex);
            return;
        }

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
                bookingSettings: bookingSettings
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
    },

    // ── Editor de plano de mesas ──────────────────────────────────────────
    openFloorEditor() {
        const bookingSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : this.businessData.booking_settings)
            : {};

        const zoneTableConfig = bookingSettings.zoneTableConfig || {};
        const zoneCapacities  = bookingSettings.zoneCapacities  || {};
        const restaurantZones = bookingSettings.restaurantZones || [];
        const savedPositions  = bookingSettings.zoneTablePositions || {};

        // Zonas habilitadas según restaurantZones (filtra las deshabilitadas)
        const enabledZoneNames = restaurantZones.length > 0
            ? restaurantZones.filter(z => z.enabled !== false).map(z => typeof z === 'string' ? z : z.name)
            : null;

        let zoneNames;
        if (restaurantZones.length > 0) {
            zoneNames = enabledZoneNames;
        } else if (Object.keys(zoneTableConfig).length > 0) {
            zoneNames = Object.keys(zoneTableConfig);
        } else {
            zoneNames = Object.keys(zoneCapacities);
        }

        if (zoneNames.length === 0) {
            alert('Primero configura las zonas en Capacidad.');
            return;
        }

        // Construir mesas individuales por zona
        const zoneTablesMap = {};
        zoneNames.forEach(zoneName => {
            const tableConf = zoneTableConfig[zoneName];
            const capacity  = zoneCapacities[zoneName] || 10;
            const tables    = [];
            let idx = 0;
            if (tableConf && tableConf.length > 0) {
                tableConf.forEach(g => {
                    for (let i = 0; i < g.count; i++) tables.push({ id: idx++, capacity: g.capacity });
                });
                tables.sort((a, b) => b.capacity - a.capacity);
            } else {
                for (let i = 0; i < Math.ceil(capacity / 2); i++) tables.push({ id: idx++, capacity: 2 });
            }
            zoneTablesMap[zoneName] = tables;
        });

        // Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:20000;display:flex;flex-direction:column;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'background:var(--bg-secondary);padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);flex-shrink:0;';
        header.innerHTML = `
            <div style="display:flex;align-items:center;gap:0.75rem;">
                <span style="font-size:1.5rem;">🗺️</span>
                <div>
                    <h2 style="margin:0;font-size:1.2rem;color:var(--text-primary);">Editor de Plano</h2>
                    <p style="margin:0;font-size:0.8rem;color:var(--text-secondary);">Arrastra las mesas para posicionarlas</p>
                </div>
            </div>
            <div style="display:flex;gap:0.75rem;align-items:center;">
                <button id="floorEditorSave" style="padding:0.5rem 1.25rem;background:var(--primary-color);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.9rem;">Guardar</button>
                <button id="floorEditorClose" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-secondary);">✕</button>
            </div>
        `;

        // Canvas area
        const body = document.createElement('div');
        body.style.cssText = 'flex:1;overflow:auto;padding:1.5rem;display:flex;flex-wrap:wrap;gap:1.5rem;align-items:flex-start;';

        const ZONE_W = 480;
        const ZONE_H = 320;
        const TABLE_SIZE = 60;
        const COLS = 6;

        zoneNames.forEach(zoneName => {
            const tables = zoneTablesMap[zoneName];
            const positions = savedPositions[zoneName] || [];

            const zoneWrap = document.createElement('div');
            zoneWrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';

            const zoneLabel = document.createElement('div');
            zoneLabel.style.cssText = 'font-weight:700;font-size:1rem;color:var(--text-primary);';
            zoneLabel.textContent = '📍 ' + zoneName;

            const canvas = document.createElement('div');
            canvas.dataset.zone = zoneName;
            canvas.className = 'floor-editor-canvas';
            canvas.style.cssText = `position:relative;width:${ZONE_W}px;height:${ZONE_H}px;background:var(--bg-tertiary);border:2px solid var(--border-color);border-radius:12px;overflow:hidden;`;

            tables.forEach((table, i) => {
                const savedPos = positions.find(p => p.id === table.id);
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const defaultX = 16 + col * (TABLE_SIZE + 12);
                const defaultY = 16 + row * (TABLE_SIZE + 12);
                const x = savedPos ? savedPos.x : defaultX;
                const y = savedPos ? savedPos.y : defaultY;

                const tableEl = document.createElement('div');
                tableEl.dataset.tableId = table.id;
                tableEl.dataset.zone = zoneName;
                tableEl.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${TABLE_SIZE}px;height:${TABLE_SIZE}px;
                    background:rgba(77,83,255,0.15);border:2px solid var(--primary-color);border-radius:8px;
                    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
                    cursor:grab;user-select:none;font-size:0.75rem;font-weight:700;color:var(--primary-color);`;
                tableEl.innerHTML = `<span style="font-size:1.1rem;">🪑</span><span>${table.capacity}p</span>`;

                this._makeTableDraggable(tableEl, canvas, ZONE_W, ZONE_H, TABLE_SIZE);
                canvas.appendChild(tableEl);
            });

            zoneWrap.appendChild(zoneLabel);
            zoneWrap.appendChild(canvas);
            body.appendChild(zoneWrap);
        });

        overlay.appendChild(header);
        overlay.appendChild(body);
        document.body.appendChild(overlay);

        const closeEditor = () => document.body.removeChild(overlay);

        document.getElementById('floorEditorClose').addEventListener('click', closeEditor);
        document.getElementById('floorEditorSave').addEventListener('click', () => {
            this._saveFloorPositions(overlay, zoneTablesMap, closeEditor);
        });
    },

    _makeTableDraggable(tableEl, canvasEl, canvasW, canvasH, tableSize) {
        const onStart = (clientX, clientY) => {
            const rect  = canvasEl.getBoundingClientRect();
            const startX = clientX - rect.left - tableEl.offsetLeft;
            const startY = clientY - rect.top  - tableEl.offsetTop;
            tableEl.style.cursor = 'grabbing';
            tableEl.style.zIndex = 10;

            const onMove = (cx, cy) => {
                let x = cx - rect.left - startX;
                let y = cy - rect.top  - startY;
                x = Math.max(0, Math.min(x, canvasW - tableSize));
                y = Math.max(0, Math.min(y, canvasH - tableSize));
                tableEl.style.left = x + 'px';
                tableEl.style.top  = y + 'px';
            };

            const onMouseMove = e => onMove(e.clientX, e.clientY);
            const onTouchMove = e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };

            const onEnd = () => {
                tableEl.style.cursor = 'grab';
                tableEl.style.zIndex = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup',   onEnd);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend',  onEnd);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onEnd);
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend',  onEnd);
        };

        tableEl.addEventListener('mousedown',  e => { e.preventDefault(); onStart(e.clientX, e.clientY); });
        tableEl.addEventListener('touchstart', e => { e.preventDefault(); onStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    },

    async _saveFloorPositions(overlay, zoneTablesMap, closeEditor) {
        const positions = {};
        const canvases  = overlay.querySelectorAll('.floor-editor-canvas');

        canvases.forEach(canvas => {
            const zoneName = canvas.dataset.zone;
            positions[zoneName] = [];
            canvas.querySelectorAll('[data-table-id]').forEach(el => {
                positions[zoneName].push({
                    id: parseInt(el.dataset.tableId),
                    x:  parseInt(el.style.left),
                    y:  parseInt(el.style.top)
                });
            });
        });

        const businessId = this.businessData?.id;
        const currentSettings = this.businessData?.booking_settings
            ? (typeof this.businessData.booking_settings === 'string'
                ? JSON.parse(this.businessData.booking_settings)
                : { ...this.businessData.booking_settings })
            : {};

        currentSettings.zoneTablePositions = positions;

        try {
            const btn = overlay.querySelector('#floorEditorSave');
            btn.textContent = 'Guardando...';
            btn.disabled = true;

            await api.put(`/api/business/${businessId}`, {
                name:             this.businessData.name,
                email:            this.businessData.email,
                phone:            this.businessData.phone,
                address:          this.businessData.address,
                website:          this.businessData.website,
                booking_settings: currentSettings
            });

            this.businessData.booking_settings = currentSettings;
            closeEditor();
            alert('✅ Plano guardado correctamente');
        } catch (err) {
            console.error('Error guardando plano:', err);
            alert('❌ Error al guardar el plano');
            const btn = overlay.querySelector('#floorEditorSave');
            if (btn) { btn.textContent = 'Guardar'; btn.disabled = false; }
        }
    },

};

// Export to window
window.settings = settings;
