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
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookingsList.map(booking => this.renderBookingRow(booking)).join('')}
                        </tbody>
                    </table>
                `}
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
                <td>${booking.service_name || 'N/A'}</td>
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

    // Update booking status
    async updateStatus(bookingId, newStatus) {
        const statusLabels = {
            'confirmed': 'confirmar',
            'cancelled': 'cancelar',
            'completed': 'completar'
        };

        const actionLabel = statusLabels[newStatus];

        // Confirm action
        if (!confirm(`¿Estás seguro de que quieres ${actionLabel} esta reserva #${bookingId}?`)) {
            return;
        }

        try {
            await api.patch(`/api/booking/${bookingId}`, { status: newStatus });

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

// Add CSS animations
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
`;
document.head.appendChild(style);

// Export
window.bookings = bookings;
