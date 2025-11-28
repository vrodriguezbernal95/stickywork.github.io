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
            const allBookings = bookingsData.data;
            const bookings = allBookings.slice(0, 10); // Last 10 bookings

            // Get today's bookings
            const today = new Date().toISOString().split('T')[0];
            const todayBookings = allBookings.filter(booking =>
                booking.booking_date.startsWith(today) &&
                booking.status !== 'cancelled'
            ).sort((a, b) => a.booking_time.localeCompare(b.booking_time));

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

                <!-- Today's Agenda Widget -->
                <div style="margin: 2rem 0;">
                    <div style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius: 15px; padding: 1.5rem; box-shadow: 0 8px 20px rgba(46, 53, 245, 0.2);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h2 style="margin: 0; color: white; font-size: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 2rem;">📋</span>
                                Agenda de Hoy
                            </h2>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem 1rem; border-radius: 8px; color: white; font-weight: 600;">
                                ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </div>

                        ${todayBookings.length === 0 ? `
                            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 2rem; text-align: center; color: white;">
                                <div style="font-size: 3rem; margin-bottom: 0.5rem;">✨</div>
                                <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">¡Día libre! No hay reservas programadas para hoy.</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 1rem;">
                                ${todayBookings.map(booking => this.renderTodayBooking(booking)).join('')}
                            </div>
                        `}
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

    // Render a single today booking card
    renderTodayBooking(booking) {
        const now = new Date();
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const hoursUntil = (bookingDateTime - now) / (1000 * 60 * 60);
        const isUpcoming = hoursUntil > 0 && hoursUntil <= 2; // Next 2 hours
        const isPast = hoursUntil < 0;

        return `
            <div style="background: ${isPast ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)'}; backdrop-filter: blur(10px); border-radius: 12px; padding: 1.25rem; border-left: 4px solid ${isUpcoming ? '#fbbf24' : isPast ? '#6b7280' : '#ffffff'}; transition: all 0.3s ease; ${isPast ? 'opacity: 0.7;' : ''}"
                 onmouseover="this.style.transform='translateX(5px)'; this.style.background='rgba(255, 255, 255, 0.25)'"
                 onmouseout="this.style.transform='translateX(0)'; this.style.background='${isPast ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)'}'">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; flex-wrap: wrap;">
                    <!-- Time & Status -->
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="background: ${isUpcoming ? 'rgba(251, 191, 36, 0.2)' : isPast ? 'rgba(107, 114, 128, 0.2)' : 'rgba(255, 255, 255, 0.2)'}; padding: 0.75rem; border-radius: 10px; min-width: 80px; text-align: center;">
                            <div style="color: white; font-size: 1.75rem; font-weight: 700; line-height: 1;">
                                ${booking.booking_time.substring(0, 5)}
                            </div>
                            ${isUpcoming ? `
                                <div style="color: #fbbf24; font-size: 0.7rem; font-weight: 600; margin-top: 0.25rem;">
                                    ¡PRÓXIMA!
                                </div>
                            ` : isPast ? `
                                <div style="color: #9ca3af; font-size: 0.7rem; font-weight: 600; margin-top: 0.25rem;">
                                    PASADA
                                </div>
                            ` : ''}
                        </div>

                        <!-- Customer Info -->
                        <div>
                            <div style="color: white; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem;">
                                ${booking.customer_name}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
                                ${booking.service_name || 'Sin servicio especificado'}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 0.25rem;">
                                📧 ${booking.customer_email} • 📞 ${booking.customer_phone}
                            </div>
                        </div>
                    </div>

                    <!-- Status Badge -->
                    <div>
                        <span style="display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; background: ${this.getStatusColor(booking.status)}; color: white;">
                            ${this.getStatusLabel(booking.status)}
                        </span>
                    </div>
                </div>

                ${booking.notes ? `
                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
                        <strong>Notas:</strong> ${booking.notes}
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Helper function to get status color
    getStatusColor(status) {
        const colors = {
            'pending': 'rgba(234, 179, 8, 0.9)',
            'confirmed': 'rgba(34, 197, 94, 0.9)',
            'cancelled': 'rgba(239, 68, 68, 0.9)',
            'completed': 'rgba(59, 130, 246, 0.9)'
        };
        return colors[status] || 'rgba(107, 114, 128, 0.9)';
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
