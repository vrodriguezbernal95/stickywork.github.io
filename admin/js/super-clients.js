// Super Admin Clients Module
const superClients = {
    currentFilters: {
        status: '',
        type: '',
        search: '',
        limit: 50,
        offset: 0
    },

    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Clientes';

        // Render layout
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Negocios Registrados</h3>
                    <div class="filters-container">
                        <select id="statusFilter" class="filter-select">
                            <option value="">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>

                        <select id="typeFilter" class="filter-select">
                            <option value="">Todos los tipos</option>
                            <option value="spa">Spa & Wellness</option>
                            <option value="peluqueria">Peluquería</option>
                            <option value="nutricion">Nutrición</option>
                            <option value="psicologo">Psicología</option>
                            <option value="abogados">Abogados</option>
                            <option value="gimnasio">Gimnasio</option>
                            <option value="otro">Otros</option>
                        </select>

                        <input
                            type="text"
                            id="searchInput"
                            class="filter-input"
                            placeholder="Buscar por nombre..."
                        >

                        <button onclick="superClients.applyFilters()" class="btn-primary">
                            🔍 Buscar
                        </button>
                    </div>
                </div>

                <div id="clientsTableContainer">
                    <div class="loading">Cargando...</div>
                </div>
            </div>

            <!-- Modal de detalles -->
            <div id="businessDetailsModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Detalles del Negocio</h2>
                        <button class="modal-close" onclick="superClients.closeDetailsModal()">×</button>
                    </div>
                    <div id="businessDetailsContent" class="modal-body">
                        <div class="loading">Cargando...</div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });

        // Load businesses
        await this.loadBusinesses();
    },

    applyFilters() {
        this.currentFilters = {
            status: document.getElementById('statusFilter').value,
            type: document.getElementById('typeFilter').value,
            search: document.getElementById('searchInput').value,
            limit: 50,
            offset: 0
        };
        this.loadBusinesses();
    },

    async loadBusinesses() {
        const container = document.getElementById('clientsTableContainer');
        container.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            // Build query string
            const params = new URLSearchParams();
            if (this.currentFilters.status) params.append('status', this.currentFilters.status);
            if (this.currentFilters.type) params.append('type', this.currentFilters.type);
            if (this.currentFilters.search) params.append('search', this.currentFilters.search);
            params.append('limit', this.currentFilters.limit);
            params.append('offset', this.currentFilters.offset);

            const data = await superApi.get(`/api/super-admin/businesses?${params.toString()}`);

            if (!data.data || data.data.length === 0) {
                container.innerHTML = '<p class="empty-state">No se encontraron negocios</p>';
                return;
            }

            container.innerHTML = this.renderBusinessesTable(data.data, data.pagination);

        } catch (error) {
            console.error('Error loading businesses:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar los negocios: ${error.message}</p>
                </div>
            `;
        }
    },

    renderBusinessesTable(businesses, pagination) {
        const typeLabels = {
            'spa': 'Spa & Wellness',
            'peluqueria': 'Peluquería',
            'nutricion': 'Nutrición',
            'psicologo': 'Psicología',
            'abogados': 'Abogados',
            'gimnasio': 'Gimnasio',
            'otro': 'Otros'
        };

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Negocio</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Reservas</th>
                            <th>Admins</th>
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${businesses.map(business => {
                            const isActive = this.isBusinessActive(business);
                            const statusBadge = this.getStatusBadge(business);
                            const createdDate = new Date(business.created_at).toLocaleDateString('es-ES');

                            return `
                                <tr>
                                    <td>
                                        <div class="business-name">${business.name}</div>
                                        <div class="business-email">${business.email || 'Sin email'}</div>
                                    </td>
                                    <td>${typeLabels[business.type] || business.type}</td>
                                    <td>${statusBadge}</td>
                                    <td>${business.total_bookings || 0}</td>
                                    <td>${business.admin_count || 0}</td>
                                    <td>${createdDate}</td>
                                    <td style="white-space: nowrap;">
                                        <button
                                            onclick="superClients.viewDetails(${business.id})"
                                            class="btn-icon"
                                            title="Ver detalles"
                                            style="font-size: 1.2rem;"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onclick="superClients.toggleActiveStatus(${business.id}, ${business.is_active || 1})"
                                            class="btn-icon"
                                            title="${business.is_active === 0 || business.is_active === false ? 'Activar negocio' : 'Suspender negocio'}"
                                            style="font-size: 1.2rem;"
                                        >
                                            ${business.is_active === 0 || business.is_active === false ? '🟢' : '🔴'}
                                        </button>
                                        <button
                                            onclick="superClients.toggleFreeAccess(${business.id}, ${business.free_access || 0})"
                                            class="btn-icon"
                                            title="${business.free_access === 1 || business.free_access === true ? 'QUITAR acceso gratuito' : 'DAR acceso gratuito permanente'}"
                                            style="font-size: 1.3rem; ${business.free_access === 1 || business.free_access === true ? 'opacity: 1; filter: drop-shadow(0 0 3px #fbbf24);' : 'opacity: 0.4; filter: grayscale(1);'}"
                                        >
                                            ⭐
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            ${this.renderPagination(pagination)}
        `;
    },

    isBusinessActive(business) {
        // 1. Si está desactivado manualmente → INACTIVO (máxima prioridad)
        if (business.is_active === 0 || business.is_active === false) {
            return false;
        }

        // 2. Si tiene acceso gratuito permanente → ACTIVO
        if (business.free_access === 1 || business.free_access === true) {
            return true;
        }

        // 3. Si tiene suscripción de pago activa → ACTIVO
        if (business.subscription_status === 'active') {
            return true;
        }

        // 4. Si tiene trial válido (14 días o 365 días para demos) → ACTIVO
        const now = new Date();
        const trialEnds = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
        if (business.subscription_status === 'trial' && trialEnds && trialEnds > now) {
            return true;
        }

        // 5. En cualquier otro caso → INACTIVO
        return false;
    },

    getStatusBadge(business) {
        // Suspendido manualmente
        if (business.is_active === 0 || business.is_active === false) {
            return '<span class="badge" style="background: rgba(239, 68, 68, 0.25); color: #ff6b6b; border: 1px solid rgba(239, 68, 68, 0.5); font-weight: 700;">⛔ Suspendido</span>';
        }

        // Acceso gratuito permanente
        if (business.free_access === 1 || business.free_access === true) {
            return '<span class="badge" style="background: rgba(251, 191, 36, 0.3); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.6); font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">⭐ Gratuito</span>';
        }

        // Suscripción activa (pagada) - VERDE BRILLANTE
        if (business.subscription_status === 'active') {
            return '<span class="badge" style="background: rgba(34, 197, 94, 0.25); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.5); font-weight: 700;">✅ Activo</span>';
        }

        // Trial válido - VERDE también (activo)
        const now = new Date();
        const trialEnds = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
        if (business.subscription_status === 'trial' && trialEnds && trialEnds > now) {
            const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
            return `<span class="badge" style="background: rgba(34, 197, 94, 0.25); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.5); font-weight: 700;">✅ Trial (${daysLeft}d)</span>`;
        }

        // Trial expirado o cancelado
        return '<span class="badge" style="background: rgba(148, 163, 184, 0.25); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.4); font-weight: 700;">⚪ Inactivo</span>';
    },

    renderPagination(pagination) {
        if (!pagination || pagination.total <= pagination.limit) {
            return '';
        }

        const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
        const totalPages = Math.ceil(pagination.total / pagination.limit);

        return `
            <div class="pagination">
                <button
                    onclick="superClients.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="btn-secondary"
                >
                    ← Anterior
                </button>

                <span class="pagination-info">
                    Página ${currentPage} de ${totalPages} (${pagination.total} negocios)
                </span>

                <button
                    onclick="superClients.goToPage(${currentPage + 1})"
                    ${!pagination.hasMore ? 'disabled' : ''}
                    class="btn-secondary"
                >
                    Siguiente →
                </button>
            </div>
        `;
    },

    goToPage(page) {
        this.currentFilters.offset = (page - 1) * this.currentFilters.limit;
        this.loadBusinesses();
    },

    async viewDetails(businessId) {
        const modal = document.getElementById('businessDetailsModal');
        const content = document.getElementById('businessDetailsContent');

        modal.style.display = 'flex';
        content.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            const data = await superApi.get(`/api/super-admin/businesses/${businessId}`);
            const business = data.data;

            const typeLabels = {
                'spa': 'Spa & Wellness',
                'peluqueria': 'Peluquería',
                'nutricion': 'Nutrición',
                'psicologo': 'Psicología',
                'abogados': 'Abogados',
                'gimnasio': 'Gimnasio',
                'otro': 'Otros'
            };

            content.innerHTML = `
                <div class="business-details">
                    <div class="detail-section">
                        <h3>Información General</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Nombre:</span>
                                <span class="detail-value">${business.name}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Tipo:</span>
                                <span class="detail-value">${typeLabels[business.type] || business.type}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${business.email || 'No especificado'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Teléfono:</span>
                                <span class="detail-value">${business.phone || 'No especificado'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Estado:</span>
                                <span class="detail-value">
                                    ${this.isBusinessActive(business)
                                        ? '<span class="badge badge-success">Activo</span>'
                                        : '<span class="badge badge-inactive">Inactivo</span>'}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Suscripción:</span>
                                <span class="detail-value">${business.subscription_status || 'Ninguna'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Trial</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Trial activo:</span>
                                <span class="detail-value">${business.trial_active ? 'Sí' : 'No'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Finaliza:</span>
                                <span class="detail-value">
                                    ${business.trial_ends_at
                                        ? new Date(business.trial_ends_at).toLocaleString('es-ES')
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Estadísticas</h3>
                        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                            <div class="stat-card-small">
                                <div class="stat-value">${business.stats?.totalBookings || 0}</div>
                                <div class="stat-label">Reservas</div>
                            </div>
                            <div class="stat-card-small">
                                <div class="stat-value">${business.stats?.activeServices || 0}</div>
                                <div class="stat-label">Servicios</div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Administradores (${business.stats?.admins?.length || 0})</h3>
                        ${business.stats?.admins?.length > 0 ? `
                            <div class="admins-list">
                                ${business.stats.admins.map(admin => `
                                    <div class="admin-item">
                                        <div class="admin-info">
                                            <strong>${admin.full_name}</strong>
                                            <span class="admin-email">${admin.email}</span>
                                        </div>
                                        <div class="admin-meta">
                                            <span class="badge ${admin.is_active ? 'badge-success' : 'badge-inactive'}">
                                                ${admin.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                            <span class="admin-role">${admin.role}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="empty-state">No hay administradores registrados</p>'}
                    </div>

                    <div class="detail-section">
                        <h3>Fechas</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Registrado:</span>
                                <span class="detail-value">
                                    ${new Date(business.created_at).toLocaleString('es-ES')}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Última actualización:</span>
                                <span class="detail-value">
                                    ${new Date(business.updated_at).toLocaleString('es-ES')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading business details:', error);
            content.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar los detalles: ${error.message}</p>
                </div>
            `;
        }
    },

    closeDetailsModal() {
        document.getElementById('businessDetailsModal').style.display = 'none';
    },

    async toggleActiveStatus(businessId, currentStatus) {
        const isCurrentlyActive = currentStatus === 1 || currentStatus === true;
        const action = isCurrentlyActive ? 'suspender' : 'activar';
        const actionPast = isCurrentlyActive ? 'suspendido' : 'activado';

        const message = isCurrentlyActive
            ? '⚠️ ¿Estás seguro de que quieres SUSPENDER este negocio?\n\nEl negocio NO podrá:\n- Acceder al panel de administración\n- Recibir nuevas reservas\n- Usar el widget de reservas'
            : '✅ ¿Activar este negocio?\n\nEl negocio podrá volver a usar la plataforma normalmente.';

        if (!confirm(message)) {
            return;
        }

        try {
            await superApi.patch(`/api/super-admin/businesses/${businessId}`, {
                is_active: !isCurrentlyActive
            });

            this.showNotification(`Negocio ${actionPast} correctamente`, 'success');
            this.loadBusinesses();

        } catch (error) {
            console.error('Error updating business:', error);
            this.showNotification(`Error al ${action} el negocio: ${error.message}`, 'error');
        }
    },

    async toggleFreeAccess(businessId, currentStatus) {
        const hasAccess = currentStatus === 1 || currentStatus === true;
        const action = hasAccess ? 'quitar' : 'dar';
        const actionPast = hasAccess ? 'quitado' : 'otorgado';

        const message = hasAccess
            ? '⚠️ ¿Quitar acceso gratuito permanente?\n\nEste negocio volverá a estar sujeto a:\n- Expiración del trial\n- Necesidad de suscripción de pago'
            : '⭐ ¿Dar acceso GRATUITO PERMANENTE?\n\nEste negocio tendrá:\n- Acceso ilimitado sin pagar\n- Sin expiración de trial\n- Todas las funciones activas\n\n💡 Útil para: ONGs, proyectos patrocinados, beta testers, etc.';

        if (!confirm(message)) {
            return;
        }

        try {
            await superApi.patch(`/api/super-admin/businesses/${businessId}`, {
                free_access: !hasAccess
            });

            this.showNotification(`Acceso gratuito ${actionPast} correctamente ${!hasAccess ? '⭐' : ''}`, 'success');
            this.loadBusinesses();

        } catch (error) {
            console.error('Error updating business:', error);
            this.showNotification(`Error al ${action} acceso gratuito: ${error.message}`, 'error');
        }
    },

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};
