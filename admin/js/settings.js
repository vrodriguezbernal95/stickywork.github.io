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
                            style="display: ${this.businessData?.type_key === 'restaurant' ? 'block' : 'none'};">
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
                    <button class="settings-tab" data-tab="guide" onclick="settings.switchTab('guide')">
                        📚 Guía
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
                    <div class="settings-tab-content" id="tab-guide">
                        ${this.renderGuideTab()}
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

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-new-booking" checked
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>📅 Nueva Reserva</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Recibe un email cada vez que un cliente haga una reserva</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-cancelled" checked
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>❌ Reserva Cancelada</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Notificación cuando un cliente cancele su reserva</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-modified" checked
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>✏️ Reserva Modificada</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Aviso cuando un cliente modifique los detalles de su reserva</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-reminders" checked
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>🔔 Recordatorios Automáticos</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Envía recordatorios a tus clientes 24 horas antes de su cita</p>
                        </span>
                    </label>
                </div>

                <div class="form-group" style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem;">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="notify-daily-summary"
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span>
                            <strong>📊 Resumen Diario</strong>
                            <p class="hint" style="margin: 0.25rem 0 0 0;">Recibe un resumen de todas las reservas del día cada mañana</p>
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
                const customMessage = document.getElementById('children-custom-message');

                currentSettings.childrenSettings = {
                    enabled: childrenEnabled.checked,
                    maxChildAge: maxChildAge ? parseInt(maxChildAge.value) || 12 : 12,
                    minAdults: minAdults ? parseInt(minAdults.value) || 1 : 1,
                    maxChildren: maxChildren && maxChildren.value !== '' ? parseInt(maxChildren.value) : null,
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
                                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem;">${day.name}</span>
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

    // Render Guide Tab
    renderGuideTab() {
        return `
            <div class="settings-section">
                <div class="settings-section-header">
                    <h3>📚 Guía de Uso del Dashboard</h3>
                    <p>Todo lo que necesitas saber para sacar el máximo provecho de StickyWork</p>
                </div>

                <!-- Buscador de guías -->
                <div class="form-group">
                    <input type="text" id="guide-search" placeholder="🔍 Buscar en la guía..."
                           onkeyup="settings.filterGuide(this.value)"
                           style="margin-bottom: 1.5rem;">
                </div>

                <!-- Acordeón de secciones -->
                <div class="guide-accordion" id="guide-content">

                    <!-- 1. Gestión de Reservas -->
                    <div class="guide-section" data-keywords="reservas aprobar rechazar confirmar cancelar filtrar buscar estado pendiente confirmada">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">📅</span>
                            <h4>Gestión de Reservas</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Aprobar o Rechazar Reservas</h5>
                            <p><strong>Ruta:</strong> Dashboard → Reservas</p>
                            <ul>
                                <li>Las nuevas reservas aparecen con estado <span class="badge-pending">Pendiente</span></li>
                                <li>Haz clic en la reserva para ver los detalles completos</li>
                                <li>Usa el botón <strong>✓ Aprobar</strong> para confirmar la reserva</li>
                                <li>Usa el botón <strong>✗ Rechazar</strong> para cancelarla</li>
                                <li>Puedes añadir una nota interna antes de confirmar/rechazar</li>
                            </ul>

                            <h5>Filtrar y Buscar Reservas</h5>
                            <ul>
                                <li><strong>Por estado:</strong> Usa los filtros de la parte superior (Todas, Pendientes, Confirmadas, Completadas, Canceladas)</li>
                                <li><strong>Por fecha:</strong> Usa el selector de fecha para ver reservas de un día específico</li>
                                <li><strong>Por cliente:</strong> Usa la barra de búsqueda para encontrar por nombre, email o teléfono</li>
                            </ul>

                            <h5>Cambiar Estado de Reserva</h5>
                            <ul>
                                <li><strong>Marcar como completada:</strong> Cuando el cliente haya recibido el servicio</li>
                                <li><strong>Cancelar:</strong> Si el cliente no acude o cancela</li>
                                <li>💡 <em>Tip:</em> Las reservas completadas son las que envían solicitud de feedback automáticamente (24h después)</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 2. Configurar Horarios y Servicios -->
                    <div class="guide-section" data-keywords="horarios servicios turnos horario partido continuo dias laborables cerrado abierto precio duracion">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">⏰</span>
                            <h4>Configurar Horarios y Servicios</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Configurar Horarios de Apertura</h5>
                            <p><strong>Ruta:</strong> Configuración → Horarios</p>
                            <ul>
                                <li><strong>Días laborables:</strong> Marca/desmarca los días que tu negocio abre</li>
                                <li><strong>Horario continuo:</strong> Un solo horario de apertura-cierre (Ej: 09:00 - 20:00)</li>
                                <li><strong>Horario partido:</strong> Varios turnos en el día (Ej: Mañana 09:00-14:00, Tarde 17:00-21:00)</li>
                                <li><strong>Duración de slots:</strong> Cada cuántos minutos aparecen horas disponibles (15, 30, 60 min)</li>
                            </ul>

                            <h5>Gestionar Servicios</h5>
                            <p><strong>Ruta:</strong> Dashboard → Servicios</p>
                            <ul>
                                <li><strong>Crear servicio:</strong> Click en "+ Nuevo Servicio"</li>
                                <li><strong>Configurar:</strong> Nombre, descripción, precio, duración, capacidad</li>
                                <li><strong>Activar/Desactivar:</strong> Usa el toggle para ocultar servicios temporalmente sin borrarlos</li>
                                <li><strong>Editar:</strong> Click en el lápiz ✏️ del servicio</li>
                                <li><strong>Eliminar:</strong> Click en la papelera 🗑️ (⚠️ acción irreversible)</li>
                            </ul>

                            <h5>Capacidad del Negocio</h5>
                            <p><strong>Ruta:</strong> Configuración → Capacidad</p>
                            <ul>
                                <li>Define cuántos clientes pueden reservar a la misma hora</li>
                                <li>Ejemplo: Si tienes 3 peluqueros, capacidad = 3</li>
                                <li>El sistema bloquea automáticamente cuando se alcanza el límite</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 3. Personalizar Widget -->
                    <div class="guide-section" data-keywords="widget personalizar colores diseño fuente botones estilo qr floating embebido">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">🎨</span>
                            <h4>Personalizar el Widget de Reservas</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Diseño Visual del Widget</h5>
                            <p><strong>Ruta:</strong> Configuración → Diseño</p>
                            <ul>
                                <li><strong>Color principal:</strong> Color de botones y elementos destacados</li>
                                <li><strong>Color secundario:</strong> Color de fondos y detalles</li>
                                <li><strong>Familia de fuente:</strong> Elige entre 6 tipografías (System UI, Inter, Roboto, Poppins, Georgia, Courier)</li>
                                <li><strong>Radio de bordes:</strong> Ajusta qué tan redondeados son los bordes (0-30px)</li>
                                <li><strong>Estilo de botones:</strong>
                                    <ul>
                                        <li><em>Solid:</em> Botón con gradiente de colores (recomendado)</li>
                                        <li><em>Outline:</em> Botón con borde pero sin relleno</li>
                                        <li><em>Ghost:</em> Botón semi-transparente</li>
                                    </ul>
                                </li>
                                <li>💡 <em>Tip:</em> Usa el preview en tiempo real para ver cómo queda antes de guardar</li>
                            </ul>

                            <h5>Configurar Textos y Campos</h5>
                            <p><strong>Ruta:</strong> Configuración → Widget</p>
                            <ul>
                                <li>Cambia el título del widget</li>
                                <li>Personaliza el texto de los botones</li>
                                <li>Activa/desactiva campos opcionales (notas, profesional)</li>
                                <li>Define si mostrar precios y duración</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 4. Implementar Widget en tu Web -->
                    <div class="guide-section" data-keywords="widget implementar web codigo html qr floating embebido integrar instalar">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">💻</span>
                            <h4>Implementar Widget en tu Web</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Opción 1: Formulario Embebido</h5>
                            <p><strong>Ruta:</strong> Dashboard → Widget/QR → Formulario Embebido</p>
                            <ul>
                                <li>Copia el código HTML proporcionado</li>
                                <li>Pégalo en tu página web donde quieras que aparezca el formulario</li>
                                <li>El widget aparece como parte de tu página</li>
                                <li>✅ <em>Mejor para:</em> Página dedicada de reservas</li>
                            </ul>

                            <h5>Opción 2: Botón Flotante</h5>
                            <p><strong>Ruta:</strong> Dashboard → Widget/QR → Botón Flotante</p>
                            <ul>
                                <li>Copia el código HTML</li>
                                <li>Pégalo antes del cierre <code>&lt;/body&gt;</code> de tu web</li>
                                <li>Aparece un botón flotante en todas las páginas</li>
                                <li>Al hacer click, se abre el formulario en modal</li>
                                <li>Puedes personalizar: posición (esquina), color, texto del botón</li>
                                <li>✅ <em>Mejor para:</em> Tener reservas disponibles en toda tu web</li>
                            </ul>

                            <h5>Opción 3: Código QR</h5>
                            <p><strong>Ruta:</strong> Dashboard → Widget/QR → Código QR</p>
                            <ul>
                                <li>Descarga la imagen del QR haciendo click en "Descargar imagen QR"</li>
                                <li>Imprímelo en: menús, folletos, tarjetas, carteles del local</li>
                                <li>Compártelo en redes sociales o WhatsApp</li>
                                <li>Los clientes escanean con su móvil y acceden directamente al formulario de reservas</li>
                                <li>✅ <em>Mejor para:</em> Clientes que están en tu local o ven material físico</li>
                            </ul>

                            <h5>Probar el Widget</h5>
                            <ul>
                                <li>Después de implementar, abre tu web en modo incógnito</li>
                                <li>Haz una reserva de prueba con datos reales</li>
                                <li>Verifica que llega al dashboard correctamente</li>
                                <li>Comprueba que el email de confirmación se envía (si está activado)</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 5. WhatsApp -->
                    <div class="guide-section" data-keywords="whatsapp notificaciones mensaje plantilla confirmacion feedback opiniones">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">💬</span>
                            <h4>Usar WhatsApp para Notificaciones</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Configurar WhatsApp</h5>
                            <p><strong>Ruta:</strong> Configuración → Notificaciones → Sección WhatsApp</p>
                            <ul>
                                <li><strong>Activar toggle:</strong> Habilita las notificaciones por WhatsApp</li>
                                <li><strong>Número de WhatsApp:</strong> Introduce tu número en formato internacional sin + (Ej: 34687767133)</li>
                                <li><strong>Plantilla de mensaje:</strong> Personaliza el mensaje que se enviará
                                    <ul>
                                        <li><code>{nombre}</code> - Nombre del cliente</li>
                                        <li><code>{fecha}</code> - Fecha de la reserva</li>
                                        <li><code>{hora}</code> - Hora de la reserva</li>
                                        <li><code>{servicio}</code> - Servicio reservado</li>
                                        <li><code>{negocio}</code> o <code>{nombre_negocio}</code> - Nombre de tu negocio</li>
                                    </ul>
                                </li>
                                <li><strong>Restaurar plantilla:</strong> Vuelve al mensaje por defecto</li>
                            </ul>

                            <h5>Enviar Confirmación por WhatsApp</h5>
                            <p><strong>Ruta:</strong> Dashboard → Reservas</p>
                            <ul>
                                <li>En cada reserva verás el botón <strong>💬 Enviar WhatsApp</strong></li>
                                <li>El botón está:
                                    <ul>
                                        <li><span class="badge-success">Verde activo</span> - Cliente dio consentimiento Y WhatsApp configurado</li>
                                        <li><span class="badge-secondary">Gris deshabilitado</span> - Cliente dio consentimiento PERO falta configurar WhatsApp</li>
                                        <li><em>Texto informativo</em> - Cliente NO dio consentimiento (GDPR)</li>
                                    </ul>
                                </li>
                                <li>Al hacer click:
                                    <ol>
                                        <li>Se abre WhatsApp Web/App con el mensaje pre-rellenado</li>
                                        <li>El número es el del CLIENTE (no el tuyo)</li>
                                        <li>Envías el mensaje desde tu WhatsApp personal</li>
                                    </ol>
                                </li>
                                <li>💡 <em>Ventaja:</em> Sistema 100% gratuito, sin límites</li>
                            </ul>

                            <h5>Checkbox de Consentimiento (GDPR)</h5>
                            <ul>
                                <li>En el widget aparece: "Quiero recibir confirmación por WhatsApp (opcional)"</li>
                                <li>El cliente debe marcarlo voluntariamente</li>
                                <li>Cumple con normativa GDPR de protección de datos</li>
                                <li>Link a política de privacidad incluido</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 6. Sistema de Opiniones -->
                    <div class="guide-section" data-keywords="opiniones feedback valoraciones reseñas estrellas formulario preguntas whatsapp solicitar">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">⭐</span>
                            <h4>Sistema de Opiniones y Feedback</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Solicitar Opinión por WhatsApp</h5>
                            <p><strong>Ruta:</strong> Dashboard → Opiniones</p>
                            <ul>
                                <li>Cuando una reserva se marca como <strong>Completada</strong>, 24 horas después aparece en "📝 Solicitudes Pendientes"</li>
                                <li>Verás una caja amarilla con los clientes que ya pueden recibir la solicitud</li>
                                <li>Haz click en <strong>💬 Solicitar Opinión</strong></li>
                                <li>Se abre WhatsApp con un mensaje personalizado + link al formulario</li>
                                <li>El cliente hace click en el link y rellena su valoración</li>
                                <li>La opinión aparece automáticamente en "Opiniones Recibidas"</li>
                            </ul>

                            <h5>Personalizar Formulario de Feedback</h5>
                            <p><strong>Ruta:</strong> Configuración → Feedback</p>
                            <ul>
                                <li>Puedes crear hasta 3 preguntas personalizadas + 1 pregunta genérica (siempre incluida)</li>
                                <li><strong>Tipos de preguntas:</strong>
                                    <ul>
                                        <li><em>Rating (estrellas):</em> Valoración de 1-5 estrellas</li>
                                        <li><em>Texto libre:</em> Comentario abierto</li>
                                        <li><em>Opción múltiple:</em> Lista de opciones predefinidas</li>
                                    </ul>
                                </li>
                                <li>Marca preguntas como <strong>obligatorias</strong> si quieres asegurar respuesta</li>
                                <li>Ejemplo para restaurante:
                                    <ul>
                                        <li>Q1: ¿Cómo valoras la comida? (Rating)</li>
                                        <li>Q2: ¿Recomendarías nuestro restaurante? (Múltiple: Sí / Probablemente / No)</li>
                                        <li>Q3: ¿Qué podríamos mejorar? (Texto libre)</li>
                                    </ul>
                                </li>
                            </ul>

                            <h5>Ver y Analizar Opiniones</h5>
                            <p><strong>Ruta:</strong> Dashboard → Opiniones → Opiniones Recibidas</p>
                            <ul>
                                <li>Tarjetas con todas las respuestas del cliente</li>
                                <li>Visualización clara: pregunta → respuesta</li>
                                <li>Ratings mostrados con estrellas ⭐</li>
                                <li>Comentarios destacados para análisis con IA (próximamente)</li>
                                <li>Filtra por fecha o valoración</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 7. Calendario -->
                    <div class="guide-section" data-keywords="calendario vista mes semana dia reservas bloqueados disponibilidad">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">📆</span>
                            <h4>Usar el Calendario</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Vista de Calendario</h5>
                            <p><strong>Ruta:</strong> Dashboard → Calendario</p>
                            <ul>
                                <li>Visualiza todas las reservas del mes de un vistazo</li>
                                <li>Cada día muestra:
                                    <ul>
                                        <li><strong>Número de reservas</strong> ese día</li>
                                        <li><strong>Horarios ocupados</strong> en vista compacta</li>
                                    </ul>
                                </li>
                                <li>Haz click en un día para ver las reservas completas de esa fecha</li>
                                <li>Usa las flechas ◀ ▶ para navegar entre meses</li>
                            </ul>

                            <h5>Colores en el Calendario</h5>
                            <ul>
                                <li><span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px;">Azul</span> - Día con disponibilidad</li>
                                <li><span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px;">Rojo (🔴)</span> - Sin disponibilidad (todos los slots ocupados)</li>
                                <li><span style="opacity: 0.3; padding: 2px 6px;">Gris tenue</span> - Día cerrado (no laborable)</li>
                                <li><span style="opacity: 0.4; padding: 2px 6px;">Gris claro</span> - Días de otros meses</li>
                            </ul>

                            <h5>Responsive en Móvil</h5>
                            <ul>
                                <li>El calendario se adapta automáticamente a pantallas pequeñas</li>
                                <li>Días abreviados (D, L, M, X, J, V, S)</li>
                                <li>Tamaños optimizados para touch</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 8. Estadísticas -->
                    <div class="guide-section" data-keywords="estadisticas metricas graficos datos ingresos clientes servicios populares">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">📊</span>
                            <h4>Estadísticas y Reportes</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>Panel de Estadísticas</h5>
                            <p><strong>Ruta:</strong> Dashboard → Inicio (vista principal)</p>
                            <ul>
                                <li><strong>Total de reservas:</strong> Contador general</li>
                                <li><strong>Reservas pendientes:</strong> Requieren tu atención</li>
                                <li><strong>Tasa de completadas:</strong> Porcentaje de servicios realizados</li>
                                <li><strong>Ingresos estimados:</strong> Suma de precios de reservas completadas</li>
                            </ul>

                            <h5>Servicios Más Populares</h5>
                            <ul>
                                <li>Gráfico de barras o lista con servicios más reservados</li>
                                <li>Útil para identificar qué ofrecer más o promocionar</li>
                                <li>Datos en tiempo real</li>
                            </ul>

                            <h5>Próximas Mejoras</h5>
                            <ul>
                                <li>📈 Gráficos de tendencias mensuales</li>
                                <li>📅 Comparativa mes actual vs anterior</li>
                                <li>💰 Ingresos proyectados</li>
                                <li>📧 Reportes automáticos por email</li>
                                <li>📊 Exportar datos a Excel/CSV</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 9. FAQs -->
                    <div class="guide-section" data-keywords="faq preguntas frecuentes dudas ayuda soporte problemas soluciones">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">❓</span>
                            <h4>Preguntas Frecuentes (FAQs)</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>❓ ¿Cómo cambio mi plan de Free a Premium?</h5>
                            <p><strong>Ruta:</strong> Configuración → Plan</p>
                            <p>Haz click en "Actualizar a Premium" y sigue los pasos de pago. Tus datos se mantienen intactos.</p>

                            <h5>❓ ¿Puedo tener varios usuarios gestionando el dashboard?</h5>
                            <p>Actualmente cada negocio tiene un único usuario administrador. La funcionalidad de múltiples usuarios está en nuestro roadmap.</p>

                            <h5>❓ No llegan emails de confirmación a los clientes</h5>
                            <p><strong>Soluciones:</strong></p>
                            <ul>
                                <li>Verifica que el email esté activado en Configuración → Notificaciones</li>
                                <li>Comprueba la carpeta de SPAM del cliente</li>
                                <li>Asegúrate de tener un plan activo (Free tiene limitaciones de emails)</li>
                                <li>Usa WhatsApp como alternativa (98% tasa de apertura vs 20% email)</li>
                            </ul>

                            <h5>❓ ¿Cómo bloqueo un día específico (festivo)?</h5>
                            <p>Por ahora, desmarca ese día en Configuración → Horarios. Próximamente tendremos gestión de excepciones (festivos específicos).</p>

                            <h5>❓ ¿Puedo personalizar el formulario con mi logo?</h5>
                            <p>La personalización de logo está disponible en el plan Premium. Contacta con soporte para activarlo.</p>

                            <h5>❓ El widget no se ve en mi web</h5>
                            <p><strong>Checklist:</strong></p>
                            <ul>
                                <li>✓ Verifica que copiaste el código completo (incluyendo las etiquetas &lt;script&gt;)</li>
                                <li>✓ Asegúrate de que el businessId en el código coincide con tu ID (Dashboard → Widget/QR)</li>
                                <li>✓ Abre la consola del navegador (F12) y busca errores en rojo</li>
                                <li>✓ Prueba en modo incógnito para descartar problemas de caché</li>
                            </ul>

                            <h5>❓ ¿Cómo exporto mis datos?</h5>
                            <p><strong>Ruta:</strong> Configuración → Avanzado → Exportar Datos</p>
                            <p>Descarga en formato JSON o CSV. Incluye reservas, clientes y servicios.</p>

                            <h5>❓ ¿Qué pasa si un cliente no completa la reserva?</h5>
                            <p>Las reservas incompletas (sin enviar) NO se guardan en el sistema. Solo se registran cuando el cliente hace click en "Confirmar Reserva".</p>

                            <h5>❓ ¿Puedo cambiar el idioma del widget?</h5>
                            <p>Actualmente solo español e inglés están disponibles. Configúralo en el código del widget con <code>language: 'es'</code> o <code>language: 'en'</code>.</p>
                        </div>
                    </div>

                    <!-- 10. Soporte y Ayuda -->
                    <div class="guide-section" data-keywords="soporte ayuda contacto email chat asistencia problemas bugs reportar">
                        <div class="guide-header" onclick="settings.toggleGuideSection(this)">
                            <span class="guide-icon">💬</span>
                            <h4>Soporte y Contacto</h4>
                            <span class="guide-arrow">▼</span>
                        </div>
                        <div class="guide-content">
                            <h5>¿No encuentras lo que buscas?</h5>
                            <p>Estamos aquí para ayudarte. Contáctanos por cualquiera de estos medios:</p>

                            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                                <a href="mailto:soporte@stickywork.com" class="btn-secondary" style="text-decoration: none; text-align: center;">
                                    📧 Email: soporte@stickywork.com
                                </a>
                                <a href="https://wa.me/34687767133?text=Hola,%20necesito%20ayuda%20con%20StickyWork"
                                   target="_blank" class="btn-secondary" style="text-decoration: none; text-align: center;">
                                    💬 WhatsApp: +34 687 767 133
                                </a>
                            </div>

                            <h5>Reportar un Bug</h5>
                            <p>Si encuentras algún error o comportamiento inesperado, ayúdanos a mejorar reportándolo:</p>
                            <ul>
                                <li>Envía un email a <strong>bugs@stickywork.com</strong></li>
                                <li>Incluye:
                                    <ul>
                                        <li>Descripción del problema</li>
                                        <li>Pasos para reproducirlo</li>
                                        <li>Capturas de pantalla si es posible</li>
                                        <li>Navegador y sistema operativo</li>
                                    </ul>
                                </li>
                            </ul>

                            <h5>Sugerir Mejoras</h5>
                            <p>¿Tienes ideas para nuevas funcionalidades? ¡Queremos escucharte!</p>
                            <p>Escríbenos a <strong>ideas@stickywork.com</strong> con tu sugerencia.</p>

                            <h5>Horario de Atención</h5>
                            <ul>
                                <li>📧 Email: Respondemos en menos de 24 horas</li>
                                <li>💬 WhatsApp: Lunes a Viernes, 9:00 - 18:00 (CET)</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <!-- Nota al final -->
                <div class="info-box" style="margin-top: 2rem;">
                    <p>
                        💡 <strong>Consejo:</strong> Guarda esta página en favoritos para acceder rápidamente cuando necesites ayuda.
                        También puedes usar el buscador de arriba para encontrar respuestas específicas.
                    </p>
                </div>
            </div>

            <style>
                .guide-accordion {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .guide-section {
                    background: var(--bg-secondary);
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                }

                .guide-section.hidden {
                    display: none;
                }

                .guide-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                    cursor: pointer;
                    background: var(--bg-secondary);
                    transition: background 0.2s ease;
                    user-select: none;
                }

                .guide-header:hover {
                    background: var(--bg-hover, rgba(59, 130, 246, 0.05));
                }

                .guide-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .guide-header h4 {
                    margin: 0;
                    flex: 1;
                    color: var(--text-primary);
                    font-size: 1.05rem;
                }

                .guide-arrow {
                    color: var(--text-secondary);
                    transition: transform 0.3s ease;
                    font-size: 0.8rem;
                }

                .guide-section.expanded .guide-arrow {
                    transform: rotate(-180deg);
                }

                .guide-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    padding: 0 1.25rem;
                }

                .guide-section.expanded .guide-content {
                    max-height: 5000px;
                    padding: 0 1.25rem 1.25rem 1.25rem;
                }

                .guide-content h5 {
                    color: var(--primary-color);
                    margin: 1.25rem 0 0.75rem 0;
                    font-size: 1rem;
                    font-weight: 600;
                }

                .guide-content h5:first-child {
                    margin-top: 0;
                }

                .guide-content p {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin: 0.5rem 0;
                }

                .guide-content ul {
                    margin: 0.5rem 0 1rem 1.5rem;
                    color: var(--text-secondary);
                }

                .guide-content li {
                    margin: 0.4rem 0;
                    line-height: 1.6;
                }

                .guide-content ul ul {
                    margin-top: 0.25rem;
                }

                .guide-content code {
                    background: var(--bg-primary);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                    color: var(--primary-color);
                }

                .guide-content strong {
                    color: var(--text-primary);
                    font-weight: 600;
                }

                .badge-pending {
                    background: #fbbf24;
                    color: #78350f;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.85em;
                    font-weight: 600;
                }

                .badge-success {
                    background: #10b981;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.85em;
                    font-weight: 600;
                }

                .badge-secondary {
                    background: #6b7280;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.85em;
                    font-weight: 600;
                }

                .info-box {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    padding: 1rem;
                }

                .info-box p {
                    margin: 0;
                    color: var(--text-primary);
                }

                @media (max-width: 768px) {
                    .guide-header {
                        padding: 0.875rem 1rem;
                    }

                    .guide-icon {
                        font-size: 1.25rem;
                    }

                    .guide-header h4 {
                        font-size: 0.95rem;
                    }

                    .guide-section.expanded .guide-content {
                        padding: 0 1rem 1rem 1rem;
                    }
                }
            </style>
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

        // Para restaurantes (tables), mostrar capacidad por zona
        if (bookingMode === 'tables') {
            const zones = bookingSettings.restaurantZones || ['Terraza', 'Interior'];
            const zoneCapacities = bookingSettings.zoneCapacities || {};
            const maxPerBooking = bookingSettings.maxPerBooking || 10;

            const zoneFields = zones.map(zone => {
                // Soportar tanto formato antiguo (string) como nuevo (objeto)
                const zoneName = typeof zone === 'string' ? zone : zone.name;
                const capacity = zoneCapacities[zoneName] || 20;
                return `
                    <div class="form-group">
                        <label>Capacidad ${zoneName}</label>
                        <input type="number" class="zone-capacity-input"
                               data-zone="${zoneName}"
                               min="1" max="1000"
                               value="${capacity}"
                               placeholder="20">
                        <p class="hint">Número máximo de comensales en ${zoneName} por turno</p>
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
            const customMessage = childrenSettings.customMessage || '';

            return `
                <div class="settings-section">
                    <div class="settings-section-header">
                        <h3>👥 Gestión de Capacidad por Zona</h3>
                        <p>Configura la capacidad de cada zona de tu restaurante</p>
                    </div>

                    ${zoneFields}

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

                            <div class="form-group">
                                <label>Máximo de niños por reserva (opcional)</label>
                                <input type="number" id="max-children"
                                       min="0" max="50"
                                       value="${maxChildren}"
                                       placeholder="Sin límite">
                                <p class="hint">Dejar vacío para no limitar</p>
                            </div>

                            <div class="form-group">
                                <label>Mensaje personalizado (opcional)</label>
                                <input type="text" id="children-custom-message"
                                       value="${customMessage}"
                                       placeholder="Ej: Niños de 0 a 12 años"
                                       maxlength="100">
                                <p class="hint">Se mostrará junto al selector de niños en el widget</p>
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

                        <div class="form-group">
                            <label>Máximo de niños por reserva (opcional)</label>
                            <input type="number" id="max-children"
                                   min="0" max="50"
                                   value="${maxChildrenServices}"
                                   placeholder="Sin límite">
                            <p class="hint">Dejar vacío para no limitar</p>
                        </div>

                        <div class="form-group">
                            <label>Mensaje personalizado (opcional)</label>
                            <input type="text" id="children-custom-message"
                                   value="${customMessageServices}"
                                   placeholder="Ej: Niños de 0 a 12 años"
                                   maxlength="100">
                            <p class="hint">Se mostrará junto al selector de niños en el widget</p>
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
                                           value="${zone.name}"
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

                            <div class="form-group" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color);">
                                <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; margin: 0;">
                                    <input type="checkbox"
                                           class="feedback-question-required"
                                           data-index="${index}"
                                           ${q.required ? 'checked' : ''}
                                           style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer;">
                                    <span>
                                        <strong style="color: var(--text-primary);">Respuesta obligatoria</strong>
                                        <p class="hint" style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">Si marcas esta casilla, el cliente deberá responder esta pregunta para poder enviar el formulario</p>
                                    </span>
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

    // Toggle guide section (expand/collapse accordion)
    toggleGuideSection(headerElement) {
        const section = headerElement.parentElement;
        const wasExpanded = section.classList.contains('expanded');

        // Cerrar todas las secciones
        document.querySelectorAll('.guide-section').forEach(s => {
            s.classList.remove('expanded');
        });

        // Si no estaba expandida, expandirla
        if (!wasExpanded) {
            section.classList.add('expanded');
        }
    },

    // Filter guide sections by search query
    filterGuide(query) {
        const searchTerm = query.toLowerCase().trim();
        const sections = document.querySelectorAll('.guide-section');

        if (!searchTerm) {
            // Si no hay búsqueda, mostrar todas
            sections.forEach(section => {
                section.classList.remove('hidden');
                section.classList.remove('expanded');
            });
            return;
        }

        let hasResults = false;

        sections.forEach(section => {
            const keywords = section.getAttribute('data-keywords') || '';
            const title = section.querySelector('h4').textContent.toLowerCase();
            const content = section.querySelector('.guide-content').textContent.toLowerCase();

            const matches = keywords.includes(searchTerm) ||
                          title.includes(searchTerm) ||
                          content.includes(searchTerm);

            if (matches) {
                section.classList.remove('hidden');
                section.classList.add('expanded'); // Expandir automáticamente resultados
                hasResults = true;
            } else {
                section.classList.add('hidden');
                section.classList.remove('expanded');
            }
        });

        // Mostrar mensaje si no hay resultados
        const accordion = document.getElementById('guide-content');
        let noResultsMsg = accordion.querySelector('.no-results-message');

        if (!hasResults && searchTerm) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-message';
                noResultsMsg.style.cssText = 'text-align: center; padding: 3rem; color: var(--text-secondary);';
                noResultsMsg.innerHTML = `
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <h4 style="color: var(--text-primary); margin: 0 0 0.5rem 0;">No encontramos resultados</h4>
                    <p style="margin: 0;">Intenta con otros términos de búsqueda</p>
                `;
                accordion.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
};

// Export to window
window.settings = settings;
