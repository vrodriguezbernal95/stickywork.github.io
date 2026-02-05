// Clients Module - Gestión de Clientes con Sistema de Niveles
// Niveles: normal, premium, riesgo, baneado

const clients = {
    allClients: [],
    currentFilter: 'all', // 'all', 'premium', 'normal', 'riesgo', 'baneado'
    searchTerm: '',

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

    // Fetch clients from API
    async fetchClients() {
        let url = `/api/customers/${auth.getBusinessId()}?sort=name`;

        // Filtro por status (nuevo sistema)
        if (this.currentFilter !== 'all') {
            url += `&status=${this.currentFilter}`;
        }

        if (this.searchTerm) {
            url += `&search=${encodeURIComponent(this.searchTerm)}`;
        }

        const data = await api.get(url);
        this.allClients = data.data;
    },

    // Render clients view
    render() {
        const contentArea = document.getElementById('contentArea');
        const clientsList = this.allClients;

        contentArea.innerHTML = `
            <!-- Header -->
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <h2 style="margin: 0; color: var(--text-primary);">Gestión de Clientes</h2>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
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

    // Get count by filter type
    getCountByFilter(filter) {
        if (filter === 'all') return this.allClients.length;
        return this.allClients.filter(c => (c.status || 'normal') === filter).length;
    },

    // Set filter and reload
    async setFilter(filter) {
        this.currentFilter = filter;
        await this.fetchClients();
        this.render();
    },

    // Handle search input
    handleSearch(event) {
        if (event.key === 'Enter' || event.type === 'blur') {
            this.searchTerm = event.target.value.trim();
            this.fetchClients().then(() => this.render());
        }
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
`;
document.head.appendChild(clientsStyles);

// Export
window.clients = clients;
