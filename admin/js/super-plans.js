// Super Admin Plans Management Module
const superPlans = {
    currentFilters: {
        plan: '',
        search: '',
        limit: 50,
        offset: 0
    },

    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Gestión de Planes';

        // Render layout
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <!-- Stats Cards -->
            <div class="stats-grid" id="planStatsGrid">
                <div class="loading">Cargando estadísticas...</div>
            </div>

            <!-- Businesses by Plan -->
            <div class="card" style="margin-top: 2rem;">
                <div class="card-header">
                    <h3>Negocios por Plan</h3>
                    <div class="filters-container">
                        <select id="planFilter" class="filter-select">
                            <option value="">Todos los planes</option>
                            <option value="free">FREE</option>
                            <option value="founders">FOUNDERS (€25/mes)</option>
                            <option value="professional">PROFESSIONAL (€39/mes)</option>
                            <option value="premium">PREMIUM (€79/mes)</option>
                        </select>

                        <input
                            type="text"
                            id="searchInput"
                            class="filter-input"
                            placeholder="Buscar por nombre..."
                        >

                        <button onclick="superPlans.applyFilters()" class="btn-primary">
                            🔍 Buscar
                        </button>
                    </div>
                </div>

                <div id="plansTableContainer">
                    <div class="loading">Cargando...</div>
                </div>
            </div>

            <!-- Modal para cambiar plan -->
            <div id="changePlanModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Cambiar Plan de Suscripción</h2>
                        <button class="modal-close" onclick="superPlans.closeChangePlanModal()">×</button>
                    </div>
                    <div id="changePlanContent" class="modal-body">
                        <div class="loading">Cargando...</div>
                    </div>
                </div>
            </div>

            <!-- Modal para ver histórico -->
            <div id="planHistoryModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Histórico de Cambios de Plan</h2>
                        <button class="modal-close" onclick="superPlans.closePlanHistoryModal()">×</button>
                    </div>
                    <div id="planHistoryContent" class="modal-body">
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

        // Load data
        await this.loadPlanStats();
        await this.loadBusinesses();
    },

    async loadPlanStats() {
        const container = document.getElementById('planStatsGrid');

        try {
            const data = await superApi.get('/api/super-admin/plans/stats');

            const stats = data.data;
            const byPlan = stats.byPlan || [];

            // Crear mapa de planes para acceso fácil
            const planMap = {};
            byPlan.forEach(p => {
                planMap[p.plan] = p;
            });

            const freePlan = planMap['free'] || { count: 0, monthly_revenue: 0 };
            const foundersPlan = planMap['founders'] || { count: 0, monthly_revenue: 0 };
            const professionalPlan = planMap['professional'] || { count: 0, monthly_revenue: 0 };
            const premiumPlan = planMap['premium'] || { count: 0, monthly_revenue: 0 };

            container.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon" style="color: #6b7280;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-label">FREE</div>
                        <div class="stat-value">${freePlan.count}</div>
                        <div class="stat-sublabel">€0/mes</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="color: #6366f1;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-label">FOUNDERS</div>
                        <div class="stat-value">${foundersPlan.count}</div>
                        <div class="stat-sublabel">€${foundersPlan.monthly_revenue}/mes</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="color: #3b82f6;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-label">PROFESSIONAL</div>
                        <div class="stat-value">${professionalPlan.count}</div>
                        <div class="stat-sublabel">€${professionalPlan.monthly_revenue}/mes</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="color: #f59e0b;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-label">PREMIUM</div>
                        <div class="stat-value">${premiumPlan.count}</div>
                        <div class="stat-sublabel">€${premiumPlan.monthly_revenue}/mes</div>
                    </div>
                </div>

                <div class="stat-card highlight">
                    <div class="stat-icon" style="color: #10b981;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                    <div class="stat-content">
                        <div class="stat-label">Ingresos Mensuales Totales</div>
                        <div class="stat-value">€${stats.totalMonthlyRevenue}</div>
                        <div class="stat-sublabel">MRR estimado</div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading plan stats:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar estadísticas</p>
                </div>
            `;
        }
    },

    applyFilters() {
        this.currentFilters = {
            plan: document.getElementById('planFilter').value,
            search: document.getElementById('searchInput').value,
            limit: 50,
            offset: 0
        };
        this.loadBusinesses();
    },

    async loadBusinesses() {
        const container = document.getElementById('plansTableContainer');
        container.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            // Build query string
            const params = new URLSearchParams();
            if (this.currentFilters.plan) params.append('plan', this.currentFilters.plan);
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
        const planBadges = {
            'free': '<span class="badge badge-secondary">FREE</span>',
            'founders': '<span class="badge badge-success">FOUNDERS</span>',
            'professional': '<span class="badge badge-primary">PROFESSIONAL</span>',
            'premium': '<span class="badge badge-warning">PREMIUM</span>'
        };

        const rows = businesses.map(b => `
            <tr>
                <td><strong>${b.name}</strong></td>
                <td>${planBadges[b.plan] || b.plan}</td>
                <td style="text-align: center;">
                    ${b.bookings_this_month || 0}
                </td>
                <td style="text-align: center;">
                    ${b.services_count || 0}
                </td>
                <td style="text-align: center;">
                    ${b.admin_count || 0}
                </td>
                <td style="text-align: center;">
                    <button
                        onclick="superPlans.showChangePlanModal(${b.id}, '${b.name}', '${b.plan}')"
                        class="btn-small btn-primary"
                        title="Cambiar plan"
                    >
                        🔄 Cambiar
                    </button>
                    <button
                        onclick="superPlans.showPlanHistory(${b.id}, '${b.name}')"
                        class="btn-small"
                        title="Ver histórico"
                    >
                        📜 Histórico
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Negocio</th>
                            <th>Plan Actual</th>
                            <th style="text-align: center;">Reservas/mes</th>
                            <th style="text-align: center;">Servicios</th>
                            <th style="text-align: center;">Usuarios</th>
                            <th style="text-align: center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>

            ${pagination.hasMore ? `
                <div class="pagination" style="margin-top: 1rem; text-align: center;">
                    <button
                        onclick="superPlans.loadMore()"
                        class="btn-secondary"
                    >
                        Cargar más
                    </button>
                </div>
            ` : ''}
        `;
    },

    async showChangePlanModal(businessId, businessName, currentPlan) {
        const modal = document.getElementById('changePlanModal');
        const content = document.getElementById('changePlanContent');

        modal.style.display = 'flex';
        content.innerHTML = '<div class="loading">Cargando información del plan...</div>';

        try {
            // Obtener información actual del plan
            const planInfo = await superApi.get(`/api/super-admin/businesses/${businessId}/plan`);

            const plans = [
                { value: 'free', label: 'FREE', price: '€0/mes', color: 'secondary' },
                { value: 'founders', label: 'FOUNDERS', price: '€25/mes', color: 'success' },
                { value: 'professional', label: 'PROFESSIONAL', price: '€39/mes', color: 'primary' },
                { value: 'premium', label: 'PREMIUM', price: '€79/mes', color: 'warning' }
            ];

            content.innerHTML = `
                <div style="margin-bottom: 1.5rem;">
                    <h3>${businessName}</h3>
                    <p style="color: var(--text-secondary);">
                        Plan actual: <strong>${currentPlan.toUpperCase()}</strong>
                    </p>
                </div>

                <div class="usage-info" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h4 style="margin-top: 0;">Uso Actual</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">Reportes IA este mes</div>
                            <div style="font-size: 1.25rem; font-weight: bold;">${planInfo.data.usage.aiReportsThisMonth}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">Reservas este mes</div>
                            <div style="font-size: 1.25rem; font-weight: bold;">${planInfo.data.usage.bookingsThisMonth}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">Servicios</div>
                            <div style="font-size: 1.25rem; font-weight: bold;">${planInfo.data.usage.services}</div>
                        </div>
                        <div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">Usuarios</div>
                            <div style="font-size: 1.25rem; font-weight: bold;">${planInfo.data.usage.users}</div>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">Nuevo Plan</label>
                    <select id="newPlanSelect" class="filter-select" style="width: 100%;">
                        ${plans.map(p => `
                            <option value="${p.value}" ${p.value === currentPlan ? 'selected' : ''}>
                                ${p.label} - ${p.price}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-primary);">Razón del cambio (opcional)</label>
                    <textarea
                        id="changeReason"
                        class="filter-input"
                        rows="3"
                        style="width: 100%; resize: vertical; font-family: inherit;"
                        placeholder="Ej: Upgrade solicitado por el cliente, promoción especial, etc."
                    ></textarea>
                </div>

                <div class="modal-actions">
                    <button onclick="superPlans.closeChangePlanModal()" class="btn-secondary">
                        Cancelar
                    </button>
                    <button
                        onclick="superPlans.changePlan(${businessId})"
                        class="btn-primary"
                    >
                        💾 Cambiar Plan
                    </button>
                </div>
            `;

        } catch (error) {
            console.error('Error loading plan info:', error);
            content.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar información del plan</p>
                    <button onclick="superPlans.closeChangePlanModal()" class="btn-secondary">
                        Cerrar
                    </button>
                </div>
            `;
        }
    },

    async changePlan(businessId) {
        const newPlan = document.getElementById('newPlanSelect').value;
        const reason = document.getElementById('changeReason').value;

        if (!confirm(`¿Estás seguro de cambiar el plan a ${newPlan.toUpperCase()}?`)) {
            return;
        }

        try {
            await superApi.patch(`/api/super-admin/businesses/${businessId}/change-plan`, {
                plan: newPlan,
                reason: reason || null
            });

            alert('Plan actualizado correctamente');
            this.closeChangePlanModal();
            await this.loadPlanStats();
            await this.loadBusinesses();

        } catch (error) {
            console.error('Error changing plan:', error);
            alert('Error al cambiar el plan: ' + error.message);
        }
    },

    closeChangePlanModal() {
        document.getElementById('changePlanModal').style.display = 'none';
    },

    async showPlanHistory(businessId, businessName) {
        const modal = document.getElementById('planHistoryModal');
        const content = document.getElementById('planHistoryContent');

        modal.style.display = 'flex';
        content.innerHTML = '<div class="loading">Cargando histórico...</div>';

        try {
            const data = await superApi.get(`/api/super-admin/businesses/${businessId}/plan-history`);

            if (!data.data || data.data.length === 0) {
                content.innerHTML = `
                    <p class="empty-state">No hay cambios de plan registrados para ${businessName}</p>
                    <button onclick="superPlans.closePlanHistoryModal()" class="btn-secondary">
                        Cerrar
                    </button>
                `;
                return;
            }

            const rows = data.data.map(change => {
                const date = new Date(change.changed_at);
                const dateStr = date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return `
                    <div class="history-item" style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <div>
                                <strong>${change.old_plan ? change.old_plan.toUpperCase() : 'N/A'}</strong>
                                →
                                <strong>${change.new_plan.toUpperCase()}</strong>
                            </div>
                            <div style="color: var(--text-secondary); font-size: 0.875rem;">
                                ${dateStr}
                            </div>
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">
                            Por: ${change.changed_by}
                        </div>
                        ${change.change_reason ? `
                            <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; font-size: 0.875rem;">
                                ${change.change_reason}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

            content.innerHTML = `
                <h3 style="margin-top: 0;">${businessName}</h3>
                <div style="margin-bottom: 1rem;">
                    ${rows}
                </div>
                <button onclick="superPlans.closePlanHistoryModal()" class="btn-secondary">
                    Cerrar
                </button>
            `;

        } catch (error) {
            console.error('Error loading plan history:', error);
            content.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar histórico</p>
                    <button onclick="superPlans.closePlanHistoryModal()" class="btn-secondary">
                        Cerrar
                    </button>
                </div>
            `;
        }
    },

    closePlanHistoryModal() {
        document.getElementById('planHistoryModal').style.display = 'none';
    },

    loadMore() {
        this.currentFilters.offset += this.currentFilters.limit;
        this.loadBusinesses();
    }
};
