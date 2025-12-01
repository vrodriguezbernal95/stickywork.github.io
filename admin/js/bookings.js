// Bookings Module

const bookings = {
    services: [], // Store services for the dropdown

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
            // Load services for the create booking form
            const servicesData = await api.get(`/api/services/${auth.getBusinessId()}`);
            this.services = servicesData.data;

            // Load bookings
            const data = await api.get(`/api/bookings/${auth.getBusinessId()}`);
            const bookingsList = data.data;

            this.render(bookingsList);
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

    // Render bookings table
    render(bookingsList) {
        const contentArea = document.getElementById('contentArea');

        contentArea.innerHTML = `
            <!-- Nueva Reserva Button -->
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; color: var(--text-primary);">Gestión de Reservas</h2>
                <button class="btn-primary" onclick="bookings.showCreateModal()">
                    ➕ Nueva Reserva
                </button>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">Todas las Reservas (${bookingsList.length})</div>
                </div>

                ${bookingsList.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p>No hay reservas todavía</p>
                        <button class="btn-secondary" onclick="bookings.showCreateModal()" style="margin-top: 1rem;">
                            Crear primera reserva
                        </button>
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
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookingsList.map(booking => this.renderBookingRow(booking)).join('')}
                        </tbody>
                    </table>
                `}
            </div>

            <!-- Create Booking Modal -->
            <div id="createBookingModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2 style="margin: 0;">Nueva Reserva</h2>
                        <button class="modal-close" onclick="bookings.closeCreateModal()">&times;</button>
                    </div>
                    <form id="createBookingForm" onsubmit="bookings.createBooking(event)">
                        <div class="modal-body">
                            <!-- Cliente Info -->
                            <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: 1.1rem;">Datos del Cliente</h3>

                            <div class="form-group">
                                <label for="customerName" class="form-label">Nombre Completo *</label>
                                <input type="text" id="customerName" class="form-input" required
                                       placeholder="Ej: Juan Pérez García">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customerEmail" class="form-label">Email *</label>
                                    <input type="email" id="customerEmail" class="form-input" required
                                           placeholder="cliente@email.com">
                                </div>
                                <div class="form-group">
                                    <label for="customerPhone" class="form-label">Teléfono *</label>
                                    <input type="tel" id="customerPhone" class="form-input" required
                                           placeholder="+34 600 123 456">
                                </div>
                            </div>

                            <!-- Booking Info -->
                            <h3 style="margin: 1.5rem 0 1rem; color: var(--text-primary); font-size: 1.1rem;">Detalles de la Reserva</h3>

                            <div class="form-group">
                                <label for="serviceId" class="form-label">Servicio</label>
                                <select id="serviceId" class="form-input">
                                    <option value="">Sin servicio específico</option>
                                    ${this.services.map(service => `
                                        <option value="${service.id}">
                                            ${service.name} ${service.duration ? `(${service.duration} min)` : ''} ${service.price ? `- ${service.price}€` : ''}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="bookingDate" class="form-label">Fecha *</label>
                                    <input type="date" id="bookingDate" class="form-input" required
                                           min="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="form-group">
                                    <label for="bookingTime" class="form-label">Hora *</label>
                                    <input type="time" id="bookingTime" class="form-input" required
                                           min="09:00" max="20:00" step="1800">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="notes" class="form-label">Notas (opcional)</label>
                                <textarea id="notes" class="form-input" rows="3"
                                          placeholder="Información adicional sobre la reserva..."></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="bookings.closeCreateModal()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                Crear Reserva
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    // Render a single booking row
    renderBookingRow(booking) {
        return `
            <tr>
                <td style="font-weight: 600; color: var(--primary-color);">#${booking.id}</td>
                <td style="font-weight: 600;">${booking.customer_name}</td>
                <td style="font-size: 0.9rem;">${booking.customer_email}</td>
                <td style="font-size: 0.9rem;">${booking.customer_phone}</td>
                <td>${booking.service_name || 'Sin servicio'}</td>
                <td>${new Date(booking.booking_date).toLocaleDateString('es-ES')}</td>
                <td style="font-weight: 600;">${booking.booking_time}</td>
                <td>
                    <span class="status-badge status-${booking.status}">
                        ${this.getStatusLabel(booking.status)}
                    </span>
                </td>
                <td>
                    <div class="booking-actions">
                        ${this.renderActions(booking)}
                    </div>
                </td>
            </tr>
        `;
    },

    // Render action buttons based on current status
    renderActions(booking) {
        const actions = [];

        // Confirmar (solo si está pendiente)
        if (booking.status === 'pending') {
            actions.push(`
                <button class="btn-action btn-confirm"
                        onclick="bookings.updateStatus(${booking.id}, 'confirmed')"
                        title="Confirmar reserva">
                    ✓
                </button>
            `);
        }

        // Completar (si está confirmada)
        if (booking.status === 'confirmed') {
            actions.push(`
                <button class="btn-action btn-complete"
                        onclick="bookings.updateStatus(${booking.id}, 'completed')"
                        title="Marcar como completada">
                    ✓✓
                </button>
            `);
        }

        // Cancelar (siempre disponible, excepto si ya está cancelada o completada)
        if (booking.status !== 'cancelled' && booking.status !== 'completed') {
            actions.push(`
                <button class="btn-action btn-cancel"
                        onclick="bookings.updateStatus(${booking.id}, 'cancelled')"
                        title="Cancelar reserva">
                    ✕
                </button>
            `);
        }

        return actions.length > 0 ? actions.join('') : '<span style="color: var(--text-tertiary); font-size: 0.85rem;">Sin acciones</span>';
    },

    // Show create booking modal
    showCreateModal() {
        const modal = document.getElementById('createBookingModal');
        modal.style.display = 'flex';

        // Set today as default date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookingDate').value = today;

        // Focus on first input
        setTimeout(() => document.getElementById('customerName').focus(), 100);
    },

    // Close create booking modal
    closeCreateModal() {
        const modal = document.getElementById('createBookingModal');
        modal.style.display = 'none';
        document.getElementById('createBookingForm').reset();
    },

    // Create new booking
    async createBooking(event) {
        event.preventDefault();

        const customerName = document.getElementById('customerName').value;
        const customerEmail = document.getElementById('customerEmail').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const serviceId = document.getElementById('serviceId').value || null;
        const bookingDate = document.getElementById('bookingDate').value;
        const bookingTime = document.getElementById('bookingTime').value + ':00'; // Add seconds
        const notes = document.getElementById('notes').value;

        try {
            await api.post('/api/bookings', {
                businessId: auth.getBusinessId(),
                serviceId: serviceId,
                customerName,
                customerEmail,
                customerPhone,
                bookingDate,
                bookingTime,
                notes: notes || null
            });

            this.showNotification('¡Reserva creada exitosamente!', 'success');
            this.closeCreateModal();
            this.load(); // Reload bookings
        } catch (error) {
            console.error('Error creating booking:', error);
            this.showNotification(`Error al crear la reserva: ${error.message}`, 'error');
        }
    },

    // Update booking status
    async updateStatus(bookingId, newStatus) {
        console.log('updateStatus called:', { bookingId, newStatus });

        const statusLabels = {
            'confirmed': 'confirmar',
            'cancelled': 'cancelar',
            'completed': 'completar'
        };

        const actionLabel = statusLabels[newStatus];

        // Confirm action
        if (!confirm(`¿Estás seguro de que quieres ${actionLabel} esta reserva #${bookingId}?`)) {
            console.log('User cancelled confirmation dialog');
            return;
        }

        try {
            console.log('Sending PATCH request to /api/booking/' + bookingId);
            const response = await api.patch(`/api/booking/${bookingId}`, { status: newStatus });
            console.log('PATCH response:', response);

            // Show success message
            this.showNotification(`Reserva ${actionLabel}da exitosamente`, 'success');

            // Reload bookings
            this.load();
        } catch (error) {
            console.error('Error updating booking status:', error);
            this.showNotification(`Error al ${actionLabel} la reserva: ${error.message}`, 'error');
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            background: ${type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
            color: white;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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

// Add CSS animations and modal styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .booking-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
    }

    .btn-action {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-action:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .btn-action:active {
        transform: scale(0.95);
    }

    .btn-confirm {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }

    .btn-confirm:hover {
        background: linear-gradient(135deg, #059669, #047857);
    }

    .btn-complete {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
    }

    .btn-complete:hover {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }

    .btn-cancel {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
    }

    .btn-cancel:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
    }

    /* Modal Styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .modal-content {
        background: var(--bg-secondary);
        border-radius: 15px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        color: var(--text-primary);
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 2rem;
        color: var(--text-secondary);
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.9rem;
    }

    .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 1rem;
        transition: all 0.3s ease;
    }

    .form-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(46, 53, 245, 0.1);
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }

        .modal-content {
            width: 95%;
            max-height: 95vh;
        }
    }
`;
document.head.appendChild(style);

// Export
window.bookings = bookings;
