// Bookings Module

const bookings = {
    services: [], // Store services for the dropdown
    allBookings: [], // Store all bookings
    currentPage: 1, // Current page number
    itemsPerPage: 50, // Items per page
    currentFilter: 'all', // Customer level filter

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
            this.allBookings = data.data;

            // Reset to page 1 when loading
            this.currentPage = 1;

            this.render();
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

    // Get filtered bookings based on current filter
    getFilteredBookings() {
        if (this.currentFilter === 'all') return this.allBookings;
        return this.allBookings.filter(b => (b.customer_status || 'normal') === this.currentFilter);
    },

    // Set filter and re-render
    setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.render();
    },

    // Render bookings table with pagination
    render() {
        const contentArea = document.getElementById('contentArea');
        const bookingsList = this.getFilteredBookings();

        contentArea.innerHTML = `
            <!-- Nueva Reserva Button -->
            <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; color: var(--text-primary);">Gestión de Reservas</h2>
                <button class="btn-primary" onclick="bookings.showCreateModal()">
                    ➕ Nueva Reserva
                </button>
            </div>

            <!-- Filtros por nivel de cliente -->
            <div class="booking-filters" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                ${this.renderFilterButton('all', 'Todos', this.allBookings.length)}
                ${this.renderFilterButton('premium', '⭐ VIP', this.allBookings.filter(b => b.customer_status === 'premium').length)}
                ${this.renderFilterButton('normal', '👤 Normal', this.allBookings.filter(b => !b.customer_status || b.customer_status === 'normal').length)}
                ${this.renderFilterButton('riesgo', '⚠️ Riesgo', this.allBookings.filter(b => b.customer_status === 'riesgo').length)}
                ${this.renderFilterButton('baneado', '🚫 Baneado', this.allBookings.filter(b => b.customer_status === 'baneado').length)}
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">${this.currentFilter === 'all' ? 'Todas las' : this.getFilterLabel(this.currentFilter)} Reservas (${bookingsList.length})</div>
                </div>

                ${bookingsList.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p>No hay reservas todavía</p>
                        <button class="btn-secondary" onclick="bookings.showCreateModal()" style="margin-top: 1rem;">
                            Crear primera reserva
                        </button>
                    </div>
                ` : this.renderPaginatedTable(bookingsList)}
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
                                           min="${(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })()}">
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

    // Render a filter button
    renderFilterButton(filter, label, count) {
        const isActive = this.currentFilter === filter;
        const colors = {
            all: { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.2)' },
            premium: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
            normal: { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' },
            riesgo: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.2)' },
            baneado: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
        };
        const c = colors[filter];
        return `<button onclick="bookings.setFilter('${filter}')" style="
            padding: 0.5rem 1rem;
            border: 2px solid ${isActive ? c.border : 'rgba(255,255,255,0.15)'};
            background: ${isActive ? c.bg : 'transparent'};
            color: ${isActive ? 'white' : 'var(--text-secondary)'};
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            transition: all 0.2s;
        ">${label} <span style="opacity: 0.7; font-weight: 400;">(${count})</span></button>`;
    },

    // Get label for current filter
    getFilterLabel(filter) {
        const labels = { premium: 'VIP', normal: 'Normal', riesgo: 'Riesgo', baneado: 'Baneado' };
        return labels[filter] || 'Todas las';
    },

    // Render paginated table with controls
    renderPaginatedTable(bookingsList) {
        // Calculate pagination
        const totalPages = Math.ceil(bookingsList.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageBookings = bookingsList.slice(startIndex, endIndex);

        // Pagination controls HTML
        const paginationControls = `
            <div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 1rem;">
                <button class="btn-secondary"
                        onclick="bookings.prevPage()"
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        style="opacity: ${this.currentPage === 1 ? '0.5' : '1'}; cursor: ${this.currentPage === 1 ? 'not-allowed' : 'pointer'};">
                    ← Anterior
                </button>
                <div style="color: var(--text-primary); font-weight: 500;">
                    Página ${this.currentPage} de ${totalPages}
                    <span style="color: var(--text-secondary); font-weight: normal; margin-left: 0.5rem;">
                        (Mostrando ${startIndex + 1}-${Math.min(endIndex, bookingsList.length)} de ${bookingsList.length})
                    </span>
                </div>
                <button class="btn-secondary"
                        onclick="bookings.nextPage()"
                        ${this.currentPage === totalPages ? 'disabled' : ''}
                        style="opacity: ${this.currentPage === totalPages ? '0.5' : '1'}; cursor: ${this.currentPage === totalPages ? 'not-allowed' : 'pointer'};">
                    Siguiente →
                </button>
            </div>
        `;

        return `
            ${paginationControls}

            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Servicio</th>
                        <th>Personas</th>
                        <th>Zona</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentPageBookings.map(booking => this.renderBookingRow(booking)).join('')}
                </tbody>
            </table>

            ${paginationControls}
        `;
    },

    // Go to next page
    nextPage() {
        const totalPages = Math.ceil(this.getFilteredBookings().length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.render();
            // Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    // Go to previous page
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.render();
            // Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    // Go to specific page
    goToPage(page) {
        const totalPages = Math.ceil(this.getFilteredBookings().length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.render();
            // Scroll to top of page
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    // Get customer status badge for booking row
    getCustomerBadge(status) {
        const badges = {
            premium: '<span class="badge-vip">VIP</span>',
            riesgo: '<span class="badge-riesgo">RIESGO</span>',
            baneado: '<span class="badge-baneado">BANEADO</span>'
        };
        return badges[status] || '';
    },

    // Render a single booking row
    renderBookingRow(booking) {
        return `
            <tr>
                <td style="font-weight: 600;">
                    ${this.getCustomerBadge(booking.customer_status)}
                    ${booking.customer_name}
                </td>
                <td style="font-size: 0.9rem;">${booking.customer_email}</td>
                <td style="font-size: 0.9rem;">${booking.customer_phone}</td>
                <td>${booking.service_name || 'Sin servicio'}</td>
                <td style="text-align: center; font-weight: 600;">
                    ${booking.num_adults !== null && booking.num_adults !== undefined
                        ? `<span style="background: rgba(59, 130, 246, 0.1); padding: 0.25rem 0.5rem; border-radius: 6px; color: #3b82f6;">
                               👨 ${booking.num_adults} + 👶 ${booking.num_children || 0}
                           </span>`
                        : `<span style="background: rgba(59, 130, 246, 0.1); padding: 0.25rem 0.5rem; border-radius: 6px; color: #3b82f6;">
                               👥 ${booking.num_people || 2}
                           </span>`
                    }
                </td>
                <td style="text-align: center;">
                    ${booking.zone
                        ? `<span style="background: rgba(16, 185, 129, 0.1); padding: 0.25rem 0.5rem; border-radius: 6px; color: #10b981; font-weight: 500;">${booking.zone}</span>`
                        : '<span style="color: var(--text-secondary); font-size: 0.9rem;">-</span>'
                    }
                </td>
                <td>${utils.formatDateShort(booking.booking_date)}</td>
                <td style="font-weight: 600;">${utils.formatTime(booking.booking_time)}</td>
                <td>
                    ${createStatusBadge(booking.status, 'booking')}
                    ${booking.status === 'cancelled' && booking.cancelled_by_name ? `
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
                            por ${booking.cancelled_by_name}
                        </div>
                    ` : ''}
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

        // Repetir cita (solo si no está cancelada)
        if (booking.status !== 'cancelled') {
            actions.push(`
                <button class="btn-action btn-repeat"
                        onclick="bookings.showRepeatModal(${booking.id})"
                        title="Repetir cita">
                    🔄
                </button>
            `);
        }

        // Reprogramar (cambiar fecha/hora) - solo si no está cancelada ni completada
        if (booking.status !== 'cancelled' && booking.status !== 'completed') {
            actions.push(`
                <button class="btn-action btn-reschedule"
                        onclick="bookings.showRescheduleModal(${booking.id})"
                        title="Cambiar fecha/hora">
                    📅
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
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

        // If cancelling, show custom modal with reason field
        if (newStatus === 'cancelled') {
            const result = await this.showCancelModal(bookingId);
            if (!result) {
                console.log('User cancelled cancellation dialog');
                return;
            }

            try {
                console.log('Sending PATCH request to /api/booking/' + bookingId);
                const response = await api.patch(`/api/booking/${bookingId}`, {
                    status: newStatus,
                    cancellation_reason: result.reason
                });
                console.log('PATCH response:', response);

                modal.toast({
                    message: `Reserva cancelada exitosamente`,
                    type: 'success'
                });

                this.load();
            } catch (error) {
                console.error('Error updating booking status:', error);
                modal.toast({
                    message: `Error al cancelar la reserva`,
                    type: 'error'
                });
            }
        } else {
            // For other status changes, use standard confirmation
            const confirmed = await modal.confirm({
                title: `¿${utils.capitalize(actionLabel)} reserva?`,
                message: `¿Estás seguro de que quieres ${actionLabel} la reserva #${bookingId}?`,
                confirmText: `Sí, ${actionLabel}`,
                cancelText: 'Cancelar',
                type: newStatus === 'completed' ? 'success' : 'primary'
            });

            if (!confirmed) {
                console.log('User cancelled confirmation dialog');
                return;
            }

            try {
                console.log('Sending PATCH request to /api/booking/' + bookingId);
                const response = await api.patch(`/api/booking/${bookingId}`, { status: newStatus });
                console.log('PATCH response:', response);

                modal.toast({
                    message: `Reserva ${actionLabel}da exitosamente`,
                    type: 'success'
                });

                this.load();
            } catch (error) {
                console.error('Error updating booking status:', error);
                modal.toast({
                    message: `Error al ${actionLabel} la reserva`,
                    type: 'error'
                });
            }
        }
    },

    // Show cancel modal with reason field
    showCancelModal(bookingId) {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            `;

            // Create modal
            const modalEl = document.createElement('div');
            modalEl.style.cssText = `
                background: var(--bg-secondary);
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            `;

            modalEl.innerHTML = `
                <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <h2 style="margin: 0; font-size: 1.3rem; color: var(--text-primary);">
                        ⚠️ Cancelar Reserva #${bookingId}
                    </h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        ¿Estás seguro de que quieres cancelar esta reserva?
                    </p>
                </div>

                <div style="padding: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
                        Motivo de cancelación (opcional)
                    </label>
                    <textarea
                        id="cancellation-reason"
                        placeholder="Ej: Cliente llamó, pasa la reserva a la semana que viene"
                        style="
                            width: 100%;
                            min-height: 100px;
                            padding: 0.75rem;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 8px;
                            background: rgba(0, 0, 0, 0.2);
                            color: var(--text-primary);
                            font-family: inherit;
                            font-size: 0.95rem;
                            resize: vertical;
                            box-sizing: border-box;
                        "
                    ></textarea>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-tertiary); font-size: 0.85rem;">
                        Esta nota ayudará a otros empleados a entender por qué se canceló.
                    </p>
                </div>

                <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button id="cancel-btn" style="
                        padding: 0.75rem 1.5rem;
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--text-primary);
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.2s ease;
                    ">
                        No, mantener
                    </button>
                    <button id="confirm-btn" style="
                        padding: 0.75rem 1.5rem;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.2s ease;
                    ">
                        Sí, cancelar reserva
                    </button>
                </div>
            `;

            overlay.appendChild(modalEl);
            document.body.appendChild(overlay);

            const textarea = modalEl.querySelector('#cancellation-reason');
            const cancelBtn = modalEl.querySelector('#cancel-btn');
            const confirmBtn = modalEl.querySelector('#confirm-btn');

            // Focus textarea
            setTimeout(() => textarea.focus(), 100);

            const cleanup = () => {
                overlay.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 200);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            confirmBtn.addEventListener('click', () => {
                const reason = textarea.value.trim();
                cleanup();
                resolve({ reason: reason || null });
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(null);
                }
            });

            // ESC key to close
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
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

    // Show repeat booking modal
    showRepeatModal(bookingId) {
        const booking = this.allBookings.find(b => b.id === bookingId);
        if (!booking) return;

        const bookingDate = utils.formatDateShort(booking.booking_date);
        const bookingTime = utils.formatTime(booking.booking_time);

        // Create modal
        const overlay = document.createElement('div');
        overlay.id = 'repeatModal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

        overlay.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 16px; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <h2 style="margin: 0; font-size: 1.3rem; color: var(--text-primary);">
                        🔄 Repetir Cita
                    </h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        ${booking.customer_name} - ${bookingDate} a las ${bookingTime}
                    </p>
                </div>

                <div style="padding: 1.5rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.75rem; color: var(--text-primary); font-weight: 600;">
                            Repetir cada
                        </label>
                        <div style="display: flex; gap: 0.5rem;" id="frequencyButtons">
                            <button type="button" data-value="1" class="freq-btn active" style="flex: 1; padding: 0.75rem; border: 2px solid #8b5cf6; background: rgba(139, 92, 246, 0.2); color: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">1 sem</button>
                            <button type="button" data-value="2" class="freq-btn" style="flex: 1; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">2 sem</button>
                            <button type="button" data-value="3" class="freq-btn" style="flex: 1; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">3 sem</button>
                            <button type="button" data-value="4" class="freq-btn" style="flex: 1; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">4 sem</button>
                        </div>
                        <input type="hidden" id="repeatFrequency" value="1">
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.75rem; color: var(--text-primary); font-weight: 600;">
                            Número de citas a crear
                        </label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" id="countButtons">
                            <button type="button" data-value="2" class="count-btn" style="flex: 1; min-width: 60px; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">2</button>
                            <button type="button" data-value="4" class="count-btn active" style="flex: 1; min-width: 60px; padding: 0.75rem; border: 2px solid #8b5cf6; background: rgba(139, 92, 246, 0.2); color: white; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">4</button>
                            <button type="button" data-value="6" class="count-btn" style="flex: 1; min-width: 60px; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">6</button>
                            <button type="button" data-value="8" class="count-btn" style="flex: 1; min-width: 60px; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">8</button>
                            <button type="button" data-value="12" class="count-btn" style="flex: 1; min-width: 60px; padding: 0.75rem; border: 2px solid rgba(255,255,255,0.2); background: transparent; color: var(--text-secondary); border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">12</button>
                        </div>
                        <input type="hidden" id="repeatCount" value="4">
                    </div>

                    <div id="repeatPreview" style="background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 8px; color: var(--text-secondary); font-size: 0.9rem; border: 1px solid rgba(139, 92, 246, 0.2);">
                        Se crearán citas para las próximas semanas
                    </div>
                </div>

                <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button id="repeatCancelBtn" style="padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Cancelar
                    </button>
                    <button id="repeatConfirmBtn" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Crear Citas
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Update preview when options change
        const updatePreview = () => {
            const freq = parseInt(document.getElementById('repeatFrequency').value);
            const count = parseInt(document.getElementById('repeatCount').value);
            const baseDate = new Date(booking.booking_date);

            let previewText = `Se crearán <strong>${count} citas</strong>:<br>`;
            for (let i = 1; i <= Math.min(count, 4); i++) {
                const newDate = new Date(baseDate);
                newDate.setDate(newDate.getDate() + (freq * 7 * i));
                previewText += `• ${newDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} a las ${bookingTime}<br>`;
            }
            if (count > 4) {
                previewText += `• ... y ${count - 4} más`;
            }

            document.getElementById('repeatPreview').innerHTML = previewText;
        };

        // Frequency button handlers
        document.querySelectorAll('.freq-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.freq-btn').forEach(b => {
                    b.style.border = '2px solid rgba(255,255,255,0.2)';
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.style.border = '2px solid #8b5cf6';
                btn.style.background = 'rgba(139, 92, 246, 0.2)';
                btn.style.color = 'white';
                document.getElementById('repeatFrequency').value = btn.dataset.value;
                updatePreview();
            });
        });

        // Count button handlers
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.count-btn').forEach(b => {
                    b.style.border = '2px solid rgba(255,255,255,0.2)';
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.style.border = '2px solid #8b5cf6';
                btn.style.background = 'rgba(139, 92, 246, 0.2)';
                btn.style.color = 'white';
                document.getElementById('repeatCount').value = btn.dataset.value;
                updatePreview();
            });
        });

        updatePreview();

        // Event handlers
        const cleanup = () => overlay.remove();

        document.getElementById('repeatCancelBtn').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });

        document.getElementById('repeatConfirmBtn').addEventListener('click', async () => {
            const frequency = document.getElementById('repeatFrequency').value;
            const repetitions = document.getElementById('repeatCount').value;

            document.getElementById('repeatConfirmBtn').disabled = true;
            document.getElementById('repeatConfirmBtn').textContent = 'Creando...';

            await this.repeatBooking(bookingId, frequency, repetitions);
            cleanup();
        });
    },

    // Repeat booking API call
    async repeatBooking(bookingId, frequency, repetitions) {
        try {
            const result = await api.post(`/api/booking/${bookingId}/repeat`, {
                frequency: parseInt(frequency),
                repetitions: parseInt(repetitions)
            });

            modal.toast({
                message: `Se crearon ${result.data.created.length} citas correctamente`,
                type: 'success'
            });

            this.load(); // Reload bookings
        } catch (error) {
            console.error('Error repeating booking:', error);
            modal.toast({
                message: `Error al repetir cita: ${error.message}`,
                type: 'error'
            });
        }
    },

    // Show reschedule modal
    showRescheduleModal(bookingId) {
        const booking = this.allBookings.find(b => b.id === bookingId);
        if (!booking) return;

        // Create modal
        const overlay = document.createElement('div');
        overlay.id = 'rescheduleModal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;

        // Format current date for input
        const currentDate = booking.booking_date.split('T')[0];
        const currentTime = booking.booking_time.substring(0, 5);

        overlay.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 16px; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                <div style="padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <h2 style="margin: 0; font-size: 1.3rem; color: var(--text-primary);">
                        📅 Cambiar Fecha/Hora
                    </h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        ${booking.customer_name}
                    </p>
                </div>

                <div style="padding: 1.5rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
                            Nueva fecha
                        </label>
                        <input type="date" id="rescheduleDate" value="${currentDate}"
                               style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(0, 0, 0, 0.2); color: var(--text-primary); font-size: 1rem; box-sizing: border-box;">
                    </div>

                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
                            Nueva hora
                        </label>
                        <input type="time" id="rescheduleTime" value="${currentTime}"
                               style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(0, 0, 0, 0.2); color: var(--text-primary); font-size: 1rem; box-sizing: border-box;">
                    </div>
                </div>

                <div style="padding: 1rem 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button id="rescheduleCancelBtn" style="padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Cancelar
                    </button>
                    <button id="rescheduleConfirmBtn" style="padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Guardar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Event handlers
        const cleanup = () => overlay.remove();

        document.getElementById('rescheduleCancelBtn').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });

        document.getElementById('rescheduleConfirmBtn').addEventListener('click', async () => {
            const newDate = document.getElementById('rescheduleDate').value;
            const newTime = document.getElementById('rescheduleTime').value;

            document.getElementById('rescheduleConfirmBtn').disabled = true;
            document.getElementById('rescheduleConfirmBtn').textContent = 'Guardando...';

            await this.rescheduleBooking(bookingId, newDate, newTime + ':00');
            cleanup();
        });
    },

    // Reschedule booking API call
    async rescheduleBooking(bookingId, newDate, newTime) {
        try {
            await api.patch(`/api/booking/${bookingId}/reschedule`, {
                booking_date: newDate,
                booking_time: newTime
            });

            modal.toast({
                message: 'Cita reprogramada correctamente',
                type: 'success'
            });

            this.load(); // Reload bookings
        } catch (error) {
            console.error('Error rescheduling booking:', error);
            modal.toast({
                message: `Error al reprogramar: ${error.message}`,
                type: 'error'
            });
        }
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

    .btn-repeat {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
    }

    .btn-repeat:hover {
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
    }

    .btn-reschedule {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }

    .btn-reschedule:hover {
        background: linear-gradient(135deg, #d97706, #b45309);
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

    .badge-riesgo {
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        margin-right: 8px;
        text-transform: uppercase;
        display: inline-block;
    }

    .badge-baneado {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        margin-right: 8px;
        text-transform: uppercase;
        display: inline-block;
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
