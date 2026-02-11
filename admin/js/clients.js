// Clients Module - Gestión de Clientes con Sistema de Niveles
// Niveles: normal, premium, riesgo, baneado

const clients = {
    allClients: [],
    businessData: null,
    currentFilter: 'all', // 'all', 'premium', 'normal', 'riesgo', 'baneado'
    searchTerm: '',
    currentTab: 'clientes', // 'clientes', 'estadisticas', 'recordatorios'

    // Status config (colores e iconos)
    statusConfig: {
        premium: { label: 'Premium', icon: '⭐', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
        normal: { label: 'Normal', icon: '👤', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)' },
        riesgo: { label: 'Riesgo', icon: '⚠️', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
        baneado: { label: 'Baneado', icon: '🚫', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' }
    },

    // Load clients view
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Clientes';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando clientes...</p>
            </div>
        `;

        try {
            await this.fetchClients();
            await this.fetchBusinessData();
            this.render();
        } catch (error) {
            console.error('Error loading clients:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar los clientes</p>
                    <button class="btn-secondary" onclick="clients.load()" style="margin-top: 1rem;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    // Fetch all clients from API (no filter - we filter locally)
    async fetchClients() {
        const url = `/api/customers/${auth.getBusinessId()}?sort=name`;
        const data = await api.get(url);
        this.allClients = data.data;
    },

    // Fetch business data (for WhatsApp settings)
    async fetchBusinessData() {
        try {
            const result = await api.get(`/api/business/${auth.getBusinessId()}`);
            this.businessData = result.data;
        } catch (error) {
            console.error('Error loading business data:', error);
            this.businessData = null;
        }
    },

    // Get clients filtered by current filter and search
    getFilteredClients() {
        let filtered = this.allClients;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(c => (c.status || 'normal') === this.currentFilter);
        }

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term) ||
                c.phone.includes(term)
            );
        }

        return filtered;
    },

    // Main render - tab structure
    render() {
        const contentArea = document.getElementById('contentArea');

        // Count inactive clients for badge
        const inactiveCount = this.getInactiveClients().length;

        contentArea.innerHTML = `
            <div class="clients-container">
                <div class="clients-tabs">
                    <button class="clients-tab ${this.currentTab === 'clientes' ? 'active' : ''}"
                            data-tab="clientes" onclick="clients.switchTab('clientes')">
                        👥 Clientes
                    </button>
                    <button class="clients-tab ${this.currentTab === 'estadisticas' ? 'active' : ''}"
                            data-tab="estadisticas" onclick="clients.switchTab('estadisticas')">
                        📊 Estadísticas
                    </button>
                    <button class="clients-tab ${this.currentTab === 'recordatorios' ? 'active' : ''}"
                            data-tab="recordatorios" onclick="clients.switchTab('recordatorios')">
                        🔔 Recordatorios ${inactiveCount > 0 ? `<span class="clients-badge-count">${inactiveCount}</span>` : ''}
                    </button>
                </div>

                <div class="clients-content">
                    <div class="clients-tab-content ${this.currentTab === 'clientes' ? 'active' : ''}" id="tab-clientes">
                        ${this.renderClientsList()}
                    </div>
                    <div class="clients-tab-content ${this.currentTab === 'estadisticas' ? 'active' : ''}" id="tab-estadisticas">
                        ${this.renderStats()}
                    </div>
                    <div class="clients-tab-content ${this.currentTab === 'recordatorios' ? 'active' : ''}" id="tab-recordatorios">
                        ${this.renderReminders()}
                    </div>
                </div>
            </div>

            <!-- Create/Edit Client Modal -->
            <div id="clientModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 style="margin: 0;" id="clientModalTitle">Nuevo Cliente</h2>
                        <button class="modal-close" onclick="clients.closeModal()">&times;</button>
                    </div>
                    <form id="clientForm" onsubmit="clients.saveClient(event)">
                        <div class="modal-body">
                            <input type="hidden" id="clientId">

                            <div class="form-group">
                                <label for="clientName" class="form-label">Nombre Completo *</label>
                                <input type="text" id="clientName" class="form-input" required
                                       placeholder="Ej: Juan Pérez García">
                            </div>

                            <div class="form-group">
                                <label for="clientEmail" class="form-label">Email *</label>
                                <input type="email" id="clientEmail" class="form-input" required
                                       placeholder="cliente@email.com">
                            </div>

                            <div class="form-group">
                                <label for="clientPhone" class="form-label">Teléfono *</label>
                                <input type="tel" id="clientPhone" class="form-input" required
                                       placeholder="+34 600 123 456">
                            </div>

                            <div class="form-group">
                                <label for="clientStatus" class="form-label">Nivel del Cliente</label>
                                <select id="clientStatus" class="form-input">
                                    <option value="normal">👤 Normal - Cliente estándar</option>
                                    <option value="premium">⭐ Premium - Cliente VIP</option>
                                    <option value="riesgo">⚠️ Riesgo - No acude a citas</option>
                                    <option value="baneado">🚫 Baneado - No puede reservar</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="clientNotes" class="form-label">Notas</label>
                                <textarea id="clientNotes" class="form-input" rows="3"
                                          placeholder="Información adicional sobre el cliente..."></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="clients.closeModal()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary" id="clientSubmitBtn">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Client Detail Modal -->
            <div id="clientDetailModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 style="margin: 0;" id="clientDetailTitle">Detalle del Cliente</h2>
                        <button class="modal-close" onclick="clients.closeDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="clientDetailContent">
                        <!-- Content loaded dynamically -->
                    </div>
                </div>
            </div>

            <!-- Change Status Modal -->
            <div id="changeStatusModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2 style="margin: 0;">Cambiar Nivel</h2>
                        <button class="modal-close" onclick="clients.closeStatusModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="changeStatusContent">
                        <!-- Content loaded dynamically -->
                    </div>
                </div>
            </div>
        `;
    },

    // Switch tab
    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.clients-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        document.querySelectorAll('.clients-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
    },

    // =============================================
    // TAB 1: CLIENTES (vista existente)
    // =============================================

    renderClientsList() {
        const clientsList = this.getFilteredClients();

        return `
            <!-- Header -->
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <h2 style="margin: 0; color: var(--text-primary);">Gestión de Clientes</h2>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="clients.exportCSV()">
                        📥 Exportar CSV
                    </button>
                    <button class="btn-secondary" onclick="clients.syncFromBookings()">
                        🔄 Sincronizar desde Reservas
                    </button>
                    <button class="btn-primary" onclick="clients.showCreateModal()">
                        ➕ Nuevo Cliente
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
                <div class="filter-tabs" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}"
                            onclick="clients.setFilter('all')">
                        Todos (${this.getCountByFilter('all')})
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'premium' ? 'active' : ''}"
                            onclick="clients.setFilter('premium')"
                            style="${this.currentFilter === 'premium' ? '' : 'border-color: #f59e0b; color: #f59e0b;'}">
                        ⭐ Premium (${this.getCountByFilter('premium')})
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'normal' ? 'active' : ''}"
                            onclick="clients.setFilter('normal')">
                        Normal (${this.getCountByFilter('normal')})
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'riesgo' ? 'active' : ''}"
                            onclick="clients.setFilter('riesgo')"
                            style="${this.currentFilter === 'riesgo' ? '' : 'border-color: #f97316; color: #f97316;'}">
                        ⚠️ Riesgo (${this.getCountByFilter('riesgo')})
                    </button>
                    <button class="filter-tab ${this.currentFilter === 'baneado' ? 'active' : ''}"
                            onclick="clients.setFilter('baneado')"
                            style="${this.currentFilter === 'baneado' ? '' : 'border-color: #ef4444; color: #ef4444;'}">
                        🚫 Baneado (${this.getCountByFilter('baneado')})
                    </button>
                </div>
                <div style="flex: 1; min-width: 200px; max-width: 300px;">
                    <input type="text"
                           class="form-input"
                           placeholder="Buscar por nombre, email o teléfono..."
                           value="${this.searchTerm}"
                           onkeyup="clients.handleSearch(event)"
                           style="width: 100%;">
                </div>
            </div>

            <!-- Clients Table -->
            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">
                        ${clientsList.length} cliente${clientsList.length !== 1 ? 's' : ''}
                    </div>
                </div>

                ${clientsList.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p>${this.searchTerm || this.currentFilter !== 'all'
                            ? 'No se encontraron clientes con estos filtros'
                            : 'No hay clientes todavía'}</p>
                        ${!this.searchTerm && this.currentFilter === 'all' ? `
                            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                                Click en "Sincronizar desde Reservas" para importar clientes existentes
                            </p>
                        ` : ''}
                    </div>
                ` : `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th style="text-align: center;">Reservas</th>
                                <th>Última Reserva</th>
                                <th style="text-align: center;">Nivel</th>
                                <th style="text-align: center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientsList.map(client => this.renderClientRow(client)).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
    },

    // =============================================
    // TAB 2: ESTADÍSTICAS
    // =============================================

    renderStats() {
        const total = this.allClients.length;
        if (total === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>No hay clientes para mostrar estadísticas</p>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                        Sincroniza clientes desde reservas para ver las estadísticas
                    </p>
                </div>
            `;
        }

        // Calculate metrics
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const newThisMonth = this.allClients.filter(c => {
            if (!c.created_at) return false;
            const d = new Date(c.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const totalBookings = this.allClients.reduce((sum, c) => sum + (c.total_bookings || 0), 0);
        const avgBookings = total > 0 ? (totalBookings / total).toFixed(1) : 0;

        const activeLast30 = this.allClients.filter(c => {
            if (!c.last_booking_date) return false;
            return new Date(c.last_booking_date) >= thirtyDaysAgo;
        }).length;

        // Status distribution
        const statusCounts = { premium: 0, normal: 0, riesgo: 0, baneado: 0 };
        this.allClients.forEach(c => {
            const s = c.status || 'normal';
            if (statusCounts[s] !== undefined) statusCounts[s]++;
        });

        // Top 5 clients
        const topClients = [...this.allClients]
            .sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0))
            .slice(0, 5);

        return `
            <h2 style="margin: 0 0 1.5rem 0; color: var(--text-primary);">Estadísticas de Clientes</h2>

            <!-- Metric Cards -->
            <div class="stats-cards-grid">
                <div class="stats-card">
                    <div class="stats-card-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">👥</div>
                    <div class="stats-card-info">
                        <div class="stats-card-value">${total}</div>
                        <div class="stats-card-label">Total clientes</div>
                    </div>
                </div>
                <div class="stats-card">
                    <div class="stats-card-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🆕</div>
                    <div class="stats-card-info">
                        <div class="stats-card-value">${newThisMonth}</div>
                        <div class="stats-card-label">Nuevos este mes</div>
                    </div>
                </div>
                <div class="stats-card">
                    <div class="stats-card-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">📅</div>
                    <div class="stats-card-info">
                        <div class="stats-card-value">${avgBookings}</div>
                        <div class="stats-card-label">Media reservas/cliente</div>
                    </div>
                </div>
                <div class="stats-card">
                    <div class="stats-card-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✅</div>
                    <div class="stats-card-info">
                        <div class="stats-card-value">${activeLast30}</div>
                        <div class="stats-card-label">Activos (últimos 30 días)</div>
                    </div>
                </div>
            </div>

            <!-- Two columns: Distribution + Top clients -->
            <div class="stats-two-cols">
                <!-- Distribution by level -->
                <div class="stats-section">
                    <h3 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.1rem;">Distribución por nivel</h3>
                    <div class="stats-distribution">
                        ${Object.entries(this.statusConfig).map(([status, config]) => {
                            const count = statusCounts[status] || 0;
                            const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                            return `
                                <div class="stats-dist-row">
                                    <div class="stats-dist-label">
                                        <span>${config.icon} ${config.label}</span>
                                        <span style="color: var(--text-secondary);">${count} (${pct}%)</span>
                                    </div>
                                    <div class="stats-dist-bar-bg">
                                        <div class="stats-dist-bar" style="width: ${pct}%; background: ${config.color};"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Top 5 clients -->
                <div class="stats-section">
                    <h3 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.1rem;">Top 5 clientes más fieles</h3>
                    ${topClients.length > 0 ? `
                        <table class="table" style="font-size: 0.9rem;">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Cliente</th>
                                    <th style="text-align: center;">Reservas</th>
                                    <th>Última visita</th>
                                    <th style="text-align: center;">Nivel</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topClients.map((c, i) => `
                                    <tr>
                                        <td style="font-weight: 700; color: ${i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-secondary)'};">
                                            ${i + 1}
                                        </td>
                                        <td style="font-weight: 600;">${c.name}</td>
                                        <td style="text-align: center;">
                                            <span style="background: rgba(59, 130, 246, 0.1); padding: 0.2rem 0.6rem; border-radius: 20px; color: #3b82f6; font-weight: 600;">
                                                ${c.total_bookings || 0}
                                            </span>
                                        </td>
                                        <td>${c.last_booking_date ? utils.formatDateShort(c.last_booking_date) : 'Nunca'}</td>
                                        <td style="text-align: center;">${this.getStatusBadge(c.status || 'normal')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <p style="color: var(--text-secondary);">No hay datos suficientes</p>
                    `}
                </div>
            </div>
        `;
    },

    // =============================================
    // TAB 3: RECORDATORIOS
    // =============================================

    // Get inactive clients (40+ days without visit)
    getInactiveClients() {
        const now = new Date();
        const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

        return this.allClients
            .filter(c => {
                if (!c.last_booking_date) return true; // never visited
                return new Date(c.last_booking_date) < fortyDaysAgo;
            })
            .map(c => {
                let daysSince = null;
                if (c.last_booking_date) {
                    daysSince = Math.floor((now - new Date(c.last_booking_date)) / (1000 * 60 * 60 * 24));
                }
                return { ...c, daysSince };
            })
            .sort((a, b) => {
                // Null (never visited) first, then by most days
                if (a.daysSince === null && b.daysSince === null) return 0;
                if (a.daysSince === null) return -1;
                if (b.daysSince === null) return 1;
                return b.daysSince - a.daysSince;
            });
    },

    renderReminders() {
        const inactiveClients = this.getInactiveClients();
        const whatsappReady = this.businessData && this.businessData.whatsapp_enabled && this.businessData.whatsapp_number;

        return `
            <h2 style="margin: 0 0 1.5rem 0; color: var(--text-primary);">Recordatorios</h2>

            <!-- Summary alert -->
            <div class="reminder-alert ${inactiveClients.length > 0 ? 'warning' : 'success'}">
                <div class="reminder-alert-icon">
                    ${inactiveClients.length > 0 ? '🔔' : '✅'}
                </div>
                <div>
                    <div class="reminder-alert-title">
                        ${inactiveClients.length > 0
                            ? `${inactiveClients.length} cliente${inactiveClients.length !== 1 ? 's' : ''} lleva${inactiveClients.length === 1 ? '' : 'n'} más de 40 días sin venir`
                            : 'Todos tus clientes están al día'}
                    </div>
                    <div class="reminder-alert-desc">
                        ${inactiveClients.length > 0
                            ? 'Contacta con ellos por WhatsApp para reactivar su interés'
                            : 'No hay clientes inactivos en este momento'}
                    </div>
                </div>
            </div>

            ${!whatsappReady && inactiveClients.length > 0 ? `
                <div class="reminder-alert" style="margin-top: 1rem; background: rgba(37, 211, 102, 0.08); border-color: rgba(37, 211, 102, 0.3);">
                    <div class="reminder-alert-icon">💬</div>
                    <div>
                        <div class="reminder-alert-title">Configura WhatsApp para contactar clientes</div>
                        <div class="reminder-alert-desc">
                            Activa WhatsApp en <strong>Configuración > Notificaciones</strong> para enviar recordatorios directamente desde aquí.
                        </div>
                    </div>
                </div>
            ` : ''}

            ${inactiveClients.length > 0 ? `
                <!-- Inactive clients table -->
                <div class="table-container" style="margin-top: 1.5rem;">
                    <div class="table-header">
                        <div class="table-title">Clientes inactivos (+40 días)</div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Última visita</th>
                                <th style="text-align: center;">Días sin venir</th>
                                <th style="text-align: center;">Nivel</th>
                                ${whatsappReady ? '<th style="text-align: center;">Acción</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${inactiveClients.map(c => {
                                const daysText = c.daysSince !== null ? c.daysSince : null;
                                const urgency = c.daysSince === null ? '#ef4444'
                                    : c.daysSince > 90 ? '#ef4444'
                                    : c.daysSince > 60 ? '#f97316'
                                    : '#f59e0b';
                                return `
                                    <tr>
                                        <td style="font-weight: 600;">${c.name}</td>
                                        <td style="font-size: 0.9rem;">${c.email}</td>
                                        <td style="font-size: 0.9rem;">${c.phone}</td>
                                        <td>${c.last_booking_date ? utils.formatDateShort(c.last_booking_date) : 'Nunca'}</td>
                                        <td style="text-align: center;">
                                            <span style="background: ${urgency}20; color: ${urgency}; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">
                                                ${daysText !== null ? daysText + 'd' : 'Sin visitas'}
                                            </span>
                                        </td>
                                        <td style="text-align: center;">${this.getStatusBadge(c.status || 'normal')}</td>
                                        ${whatsappReady ? `
                                            <td style="text-align: center;">
                                                <button class="btn-whatsapp-reminder"
                                                        onclick="clients.sendReminderWhatsApp(${c.id})"
                                                        title="Enviar recordatorio por WhatsApp">
                                                    💬 WhatsApp
                                                </button>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    },

    // Send reminder via WhatsApp (Click-to-Chat)
    sendReminderWhatsApp(clientId) {
        const client = this.allClients.find(c => c.id === clientId);
        if (!client) return;

        if (!client.phone) {
            modal.toast({ message: 'Este cliente no tiene número de teléfono', type: 'error' });
            return;
        }

        if (!this.businessData || !this.businessData.whatsapp_enabled || !this.businessData.whatsapp_number) {
            modal.toast({ message: 'WhatsApp no está configurado. Ve a Configuración > Notificaciones.', type: 'error' });
            return;
        }

        const businessName = this.businessData.name || 'nuestro negocio';

        // Build reminder message
        const message = `Hola ${client.name}!\n\nHace tiempo que no te vemos por ${businessName}. Te echamos de menos!\n\n¿Te gustaría reservar una nueva cita? Estaremos encantados de atenderte.\n\n${businessName}`;

        // Clean phone number
        let phoneNumber = client.phone.replace(/\D/g, '');

        // Add Spain prefix if needed (9 digits starting with 6/7/8/9)
        if (phoneNumber.length === 9 && /^[6789]/.test(phoneNumber)) {
            phoneNumber = '34' + phoneNumber;
        }

        // Open WhatsApp Click-to-Chat
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    },

    // =============================================
    // SHARED METHODS (unchanged)
    // =============================================

    // Get status badge HTML
    getStatusBadge(status) {
        const config = this.statusConfig[status] || this.statusConfig.normal;
        return `<span class="client-badge" style="background: ${config.bgColor}; color: ${config.color};">
            ${config.icon} ${config.label}
        </span>`;
    },

    // Render single client row
    renderClientRow(client) {
        const lastBooking = client.last_booking_date
            ? utils.formatDateShort(client.last_booking_date)
            : 'Nunca';

        const status = client.status || 'normal';
        const config = this.statusConfig[status] || this.statusConfig.normal;

        return `
            <tr style="${status === 'baneado' ? 'opacity: 0.6;' : ''}">
                <td style="font-weight: 600;">
                    ${status === 'premium' ? '<span class="badge-vip">VIP</span>' : ''}
                    ${client.name}
                </td>
                <td style="font-size: 0.9rem;">${client.email}</td>
                <td style="font-size: 0.9rem;">${client.phone}</td>
                <td style="text-align: center;">
                    <span style="background: rgba(59, 130, 246, 0.1); padding: 0.25rem 0.75rem; border-radius: 20px; color: #3b82f6; font-weight: 600;">
                        ${client.total_bookings}
                    </span>
                </td>
                <td>${lastBooking}</td>
                <td style="text-align: center;">
                    ${this.getStatusBadge(status)}
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="btn-action"
                                onclick="clients.viewDetail(${client.id})"
                                title="Ver detalle"
                                style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;">
                            👁
                        </button>
                        <button class="btn-action"
                                onclick="clients.showStatusModal(${client.id})"
                                title="Cambiar nivel"
                                style="background: ${config.bgColor}; color: ${config.color};">
                            ${config.icon}
                        </button>
                        <button class="btn-action"
                                onclick="clients.editClient(${client.id})"
                                title="Editar"
                                style="background: rgba(16, 185, 129, 0.2); color: #10b981;">
                            ✏️
                        </button>
                        <button class="btn-action"
                                onclick="clients.deleteClient(${client.id}, '${client.name.replace(/'/g, "\\'")}')"
                                title="Eliminar"
                                style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    // Get count by filter type (always counts from all clients)
    getCountByFilter(filter) {
        if (filter === 'all') return this.allClients.length;
        return this.allClients.filter(c => (c.status || 'normal') === filter).length;
    },

    // Set filter and re-render (local filtering, no API call)
    setFilter(filter) {
        this.currentFilter = filter;
        const tabContent = document.getElementById('tab-clientes');
        if (tabContent) {
            tabContent.innerHTML = this.renderClientsList();
        }
    },

    // Handle search input
    handleSearch(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            this.searchTerm = event.target.value.trim();
            const tabContent = document.getElementById('tab-clientes');
            if (tabContent) {
                tabContent.innerHTML = this.renderClientsList();
            }
        }
    },

    // Export clients to CSV
    exportCSV() {
        const clientsList = this.getFilteredClients();
        if (clientsList.length === 0) {
            modal.toast({ message: 'No hay clientes para exportar', type: 'error' });
            return;
        }

        const headers = ['Nombre', 'Email', 'Teléfono', 'Nivel', 'Total Reservas', 'Última Reserva', 'Notas'];
        const rows = clientsList.map(c => [
            c.name,
            c.email,
            c.phone,
            (c.status || 'normal').charAt(0).toUpperCase() + (c.status || 'normal').slice(1),
            c.total_bookings || 0,
            c.last_booking_date ? new Date(c.last_booking_date).toLocaleDateString('es-ES') : 'Nunca',
            (c.notes || '').replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(val => `"${val}"`).join(';'))
        ].join('\n');

        // UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes_${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        modal.toast({ message: `${clientsList.length} clientes exportados`, type: 'success' });
    },

    // Sync clients from bookings
    async syncFromBookings() {
        const confirmed = await modal.confirm({
            title: '¿Sincronizar clientes?',
            message: 'Se importarán todos los clientes de las reservas existentes. Los clientes ya existentes se actualizarán con las estadísticas más recientes.',
            confirmText: 'Sincronizar',
            cancelText: 'Cancelar',
            type: 'primary'
        });

        if (!confirmed) return;

        try {
            modal.toast({ message: 'Sincronizando clientes...', type: 'info' });

            const result = await api.post(`/api/customers/${auth.getBusinessId()}/sync`);

            modal.toast({
                message: `Sincronización completada: ${result.stats.created} creados, ${result.stats.updated} actualizados`,
                type: 'success'
            });

            await this.fetchClients();
            this.render();
        } catch (error) {
            console.error('Error syncing clients:', error);
            modal.toast({ message: 'Error al sincronizar clientes', type: 'error' });
        }
    },

    // Show create modal
    showCreateModal() {
        document.getElementById('clientModalTitle').textContent = 'Nuevo Cliente';
        document.getElementById('clientSubmitBtn').textContent = 'Crear Cliente';
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
        document.getElementById('clientStatus').value = 'normal';
        document.getElementById('clientModal').style.display = 'flex';
        setTimeout(() => document.getElementById('clientName').focus(), 100);
    },

    // Edit client
    async editClient(clientId) {
        const client = this.allClients.find(c => c.id === clientId);
        if (!client) return;

        document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
        document.getElementById('clientSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientEmail').value = client.email;
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientStatus').value = client.status || 'normal';
        document.getElementById('clientNotes').value = client.notes || '';
        document.getElementById('clientModal').style.display = 'flex';
    },

    // Close modal
    closeModal() {
        document.getElementById('clientModal').style.display = 'none';
        document.getElementById('clientForm').reset();
    },

    // Save client (create or update)
    async saveClient(event) {
        event.preventDefault();

        const clientId = document.getElementById('clientId').value;
        const data = {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            status: document.getElementById('clientStatus').value,
            notes: document.getElementById('clientNotes').value || null
        };

        try {
            if (clientId) {
                // Update
                await api.patch(`/api/customers/${auth.getBusinessId()}/${clientId}`, data);
                modal.toast({ message: 'Cliente actualizado correctamente', type: 'success' });
            } else {
                // Create
                await api.post(`/api/customers/${auth.getBusinessId()}`, data);
                modal.toast({ message: 'Cliente creado correctamente', type: 'success' });
            }

            this.closeModal();
            await this.fetchClients();
            this.render();
        } catch (error) {
            console.error('Error saving client:', error);
            modal.toast({ message: error.message || 'Error al guardar cliente', type: 'error' });
        }
    },

    // Show status change modal
    showStatusModal(clientId) {
        const client = this.allClients.find(c => c.id === clientId);
        if (!client) return;

        const currentStatus = client.status || 'normal';

        document.getElementById('changeStatusContent').innerHTML = `
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                Selecciona el nuevo nivel para <strong>${client.name}</strong>:
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${Object.entries(this.statusConfig).map(([status, config]) => `
                    <button class="status-option ${status === currentStatus ? 'active' : ''}"
                            onclick="clients.changeStatus(${clientId}, '${status}')"
                            style="
                                display: flex;
                                align-items: center;
                                gap: 0.75rem;
                                padding: 0.75rem 1rem;
                                border: 2px solid ${status === currentStatus ? config.color : 'var(--border-color)'};
                                background: ${status === currentStatus ? config.bgColor : 'var(--bg-secondary)'};
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s;
                                text-align: left;
                            ">
                        <span style="font-size: 1.25rem;">${config.icon}</span>
                        <div>
                            <div style="font-weight: 600; color: ${config.color};">${config.label}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                ${this.getStatusDescription(status)}
                            </div>
                        </div>
                        ${status === currentStatus ? '<span style="margin-left: auto; color: var(--primary-color);">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;

        document.getElementById('changeStatusModal').style.display = 'flex';
    },

    // Get status description
    getStatusDescription(status) {
        const descriptions = {
            premium: 'Cliente VIP, trato preferente',
            normal: 'Cliente estándar sin marcas',
            riesgo: 'Ha faltado a citas, vigilar',
            baneado: 'Bloqueado, no puede reservar'
        };
        return descriptions[status] || '';
    },

    // Close status modal
    closeStatusModal() {
        document.getElementById('changeStatusModal').style.display = 'none';
    },

    // Change client status
    async changeStatus(clientId, newStatus) {
        try {
            await api.patch(`/api/customers/${auth.getBusinessId()}/${clientId}`, {
                status: newStatus
            });

            const config = this.statusConfig[newStatus];
            modal.toast({
                message: `Cliente marcado como ${config.label}`,
                type: 'success'
            });

            this.closeStatusModal();
            await this.fetchClients();
            this.render();
        } catch (error) {
            console.error('Error changing status:', error);
            modal.toast({ message: 'Error al cambiar nivel', type: 'error' });
        }
    },

    // View client detail
    async viewDetail(clientId) {
        try {
            const result = await api.get(`/api/customers/${auth.getBusinessId()}/${clientId}`);
            const client = result.data;
            const status = client.status || 'normal';

            document.getElementById('clientDetailTitle').textContent = client.name;
            document.getElementById('clientDetailContent').innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Email</div>
                        <div style="font-weight: 500;">${client.email}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Teléfono</div>
                        <div style="font-weight: 500;">${client.phone}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Nivel</div>
                        <div style="font-weight: 500;">
                            ${this.getStatusBadge(status)}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.25rem;">Total Reservas</div>
                        <div style="font-weight: 500; color: #3b82f6;">${client.total_bookings}</div>
                    </div>
                </div>

                ${client.notes ? `
                    <div style="margin-bottom: 2rem;">
                        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">Notas</div>
                        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; white-space: pre-wrap;">
                            ${client.notes}
                        </div>
                    </div>
                ` : ''}

                <div>
                    <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
                        Historial de Reservas (últimas 20)
                    </div>
                    ${client.bookings && client.bookings.length > 0 ? `
                        <table class="table" style="font-size: 0.9rem;">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Servicio</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${client.bookings.map(b => `
                                    <tr>
                                        <td>${utils.formatDateShort(b.booking_date)}</td>
                                        <td>${utils.formatTime(b.booking_time)}</td>
                                        <td>${b.service_name || 'Sin servicio'}</td>
                                        <td>${createStatusBadge(b.status, 'booking')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <div style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                            No hay reservas registradas
                        </div>
                    `}
                </div>
            `;

            document.getElementById('clientDetailModal').style.display = 'flex';
        } catch (error) {
            console.error('Error loading client detail:', error);
            modal.toast({ message: 'Error al cargar detalle del cliente', type: 'error' });
        }
    },

    // Close detail modal
    closeDetailModal() {
        document.getElementById('clientDetailModal').style.display = 'none';
    },

    // Delete client
    async deleteClient(clientId, clientName) {
        const confirmed = await modal.confirm({
            title: '¿Eliminar cliente?',
            message: `¿Estás seguro de que quieres eliminar a "${clientName}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await api.delete(`/api/customers/${auth.getBusinessId()}/${clientId}`);

            modal.toast({ message: 'Cliente eliminado correctamente', type: 'success' });

            await this.fetchClients();
            this.render();
        } catch (error) {
            console.error('Error deleting client:', error);
            modal.toast({ message: 'Error al eliminar cliente', type: 'error' });
        }
    }
};

// Add CSS styles for clients module
const clientsStyles = document.createElement('style');
clientsStyles.textContent = `
    .badge-vip {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        margin-right: 8px;
        text-transform: uppercase;
        display: inline-block;
    }

    .client-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .filter-tabs {
        display: flex;
        gap: 0.5rem;
    }

    .filter-tab {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-secondary);
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .filter-tab:hover {
        border-color: var(--primary-color);
        color: var(--text-primary);
    }

    .filter-tab.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
    }

    .status-option:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* ========== CLIENTS TABS ========== */
    .clients-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 0;
        flex-wrap: wrap;
    }

    .clients-tab {
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .clients-tab:hover {
        color: var(--primary-color);
        background: rgba(59, 130, 246, 0.05);
    }

    .clients-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }

    .clients-badge-count {
        background: #ef4444;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 10px;
        min-width: 20px;
        text-align: center;
    }

    .clients-content {
        animation: fadeIn 0.3s ease;
    }

    .clients-tab-content {
        display: none;
    }

    .clients-tab-content.active {
        display: block;
    }

    /* ========== STATS CARDS ========== */
    .stats-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stats-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .stats-card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        flex-shrink: 0;
    }

    .stats-card-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
    }

    .stats-card-label {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
    }

    /* ========== STATS TWO COLUMNS ========== */
    .stats-two-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    @media (max-width: 768px) {
        .stats-two-cols {
            grid-template-columns: 1fr;
        }
    }

    .stats-section {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
    }

    /* ========== DISTRIBUTION BARS ========== */
    .stats-distribution {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .stats-dist-row {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .stats-dist-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .stats-dist-bar-bg {
        height: 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        overflow: hidden;
    }

    .stats-dist-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
        min-width: 2px;
    }

    /* ========== REMINDER ALERT ========== */
    .reminder-alert {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        border-radius: 12px;
        border: 1px solid;
    }

    .reminder-alert.warning {
        background: rgba(245, 158, 11, 0.08);
        border-color: rgba(245, 158, 11, 0.3);
    }

    .reminder-alert.success {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.3);
    }

    .reminder-alert-icon {
        font-size: 2rem;
        flex-shrink: 0;
    }

    .reminder-alert-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--text-primary);
    }

    .reminder-alert-desc {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
    }

    /* ========== WHATSAPP REMINDER BUTTON ========== */
    .btn-whatsapp-reminder {
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #25D366, #128C7E);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        white-space: nowrap;
    }

    .btn-whatsapp-reminder:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(37, 211, 102, 0.4);
    }
`;
document.head.appendChild(clientsStyles);

// Export
window.clients = clients;
