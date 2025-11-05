// Bookings Module

const bookings = {
    // Load all bookings
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Reservas';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando reservas...</p>
            </div>
        `;

        try {
            const data = await api.get(`/api/bookings/${auth.getBusinessId()}`);
            const bookingsList = data.data;

            contentArea.innerHTML = `
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">Todas las Reservas</div>
                    </div>

                    ${bookingsList.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <p>No hay reservas todavía</p>
                        </div>
                    ` : `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Servicio</th>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bookingsList.map(booking => `
                                    <tr>
                                        <td>#${booking.id}</td>
                                        <td style="font-weight: 600;">${booking.customer_name}</td>
                                        <td>${booking.customer_email}</td>
                                        <td>${booking.customer_phone}</td>
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
            console.error('Error loading bookings:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar las reservas</p>
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
window.bookings = bookings;
