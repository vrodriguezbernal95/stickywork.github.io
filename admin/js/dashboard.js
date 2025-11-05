// Dashboard Module

const dashboard = {
    // Load dashboard with stats and recent bookings
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Dashboard';

        try {
            // Load stats
            const statsData = await api.get(`/api/stats/${auth.getBusinessId()}`);
            const stats = statsData.data;

            // Load recent bookings
            const bookingsData = await api.get(`/api/bookings/${auth.getBusinessId()}`);
            const bookings = bookingsData.data.slice(0, 10); // Last 10 bookings

            // Load business info
            const businessData = await api.get(`/api/business/${auth.getBusinessId()}`);
            document.getElementById('businessName').textContent = businessData.data.name;

            // Render dashboard
            contentArea.innerHTML = `
                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">📊</div>
                        </div>
                        <div class="stat-value">${stats.totalBookings || 0}</div>
                        <div class="stat-label">Total Reservas</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1);">📅</div>
                        </div>
                        <div class="stat-value">${stats.thisMonth || 0}</div>
                        <div class="stat-label">Reservas Este Mes</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: rgba(234, 179, 8, 0.1);">⏳</div>
                        </div>
                        <div class="stat-value">${stats.bookingsByStatus.find(s => s.status === 'pending')?.count || 0}</div>
                        <div class="stat-label">Pendientes</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1);">✅</div>
                        </div>
                        <div class="stat-value">${stats.bookingsByStatus.find(s => s.status === 'confirmed')?.count || 0}</div>
                        <div class="stat-label">Confirmadas</div>
                    </div>
                </div>

                <!-- Recent Bookings Table -->
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">Reservas Recientes</div>
                    </div>

                    ${bookings.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <p>No hay reservas todavía</p>
                        </div>
                    ` : `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Servicio</th>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bookings.map(booking => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 600;">${booking.customer_name}</div>
                                            <div style="font-size: 0.85rem; color: var(--text-secondary);">${booking.customer_email}</div>
                                        </td>
                                        <td>${booking.service_name || 'N/A'}</td>
                                        <td>${new Date(booking.booking_date).toLocaleDateString('es-ES')}</td>
                                        <td>${booking.booking_time}</td>
                                        <td>
                                            <span class="status-badge status-${booking.status}">
                                                ${this.getStatusLabel(booking.status)}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            `;

        } catch (error) {
            console.error('Error loading dashboard:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar los datos del dashboard</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Verifica que el servidor esté funcionando</p>
                </div>
            `;
        }
    },

    // Helper function to get status label in Spanish
    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmada',
            'cancelled': 'Cancelada',
            'completed': 'Completada'
        };
        return labels[status] || status;
    }
};

// Export
window.dashboard = dashboard;
