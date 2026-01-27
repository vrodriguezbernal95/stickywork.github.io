/**
 * Módulo de Talleres/Eventos Grupales
 * Permite crear, editar y gestionar talleres con capacidad limitada
 */

const workshops = {
    workshops: [],
    currentWorkshop: null,

    async load() {
        this.render();
        await this.loadWorkshops();
    },

    async loadWorkshops(includePast = false) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/workshops?includesPast=${includePast}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.workshops = data.workshops;
                this.renderWorkshopsList();
            } else {
                modal.toast(data.message || 'Error al cargar talleres', 'error');
            }
        } catch (error) {
            console.error('Error loading workshops:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    render() {
        const container = document.getElementById('contentArea');
        container.innerHTML = `
            <div class="workshops-container">
                <div class="workshops-header">
                    <div class="header-left">
                        <h1>🎫 Talleres y Eventos</h1>
                        <p class="subtitle">Gestiona tus talleres, clases grupales y eventos con capacidad limitada</p>
                    </div>
                    <div class="header-right">
                        <label class="checkbox-label">
                            <input type="checkbox" id="showPastWorkshops" onchange="workshops.togglePastWorkshops()">
                            Mostrar pasados
                        </label>
                        <button class="btn btn-primary" onclick="workshops.showCreateModal()">
                            + Crear Taller
                        </button>
                    </div>
                </div>

                <div id="workshopsList" class="workshops-grid">
                    <div class="loading-spinner">Cargando talleres...</div>
                </div>
            </div>

            <!-- Modal Crear/Editar Taller -->
            <div id="workshopModal" class="modal-overlay" style="display: none;">
                <div class="modal-content modal-xl">
                    <div class="modal-header">
                        <h2 id="workshopModalTitle">Crear Taller</h2>
                        <button class="modal-close" onclick="workshops.closeModal()">&times;</button>
                    </div>
                    <form id="workshopForm" onsubmit="workshops.saveWorkshop(event)">
                        <div class="modal-body">
                            <div class="form-row">
                                <div class="form-group flex-2">
                                    <label class="form-label">Nombre del taller *</label>
                                    <input type="text" id="workshopName" class="form-input" required
                                           placeholder="Ej: Taller de Coctelería">
                                </div>
                                <div class="form-group flex-1">
                                    <label class="form-label">Precio (€)</label>
                                    <input type="number" id="workshopPrice" class="form-input"
                                           min="0" step="0.01" value="0" placeholder="0.00">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Descripción</label>
                                <textarea id="workshopDescription" class="form-input" rows="3"
                                          placeholder="Describe el taller, qué incluye, qué aprenderán..."></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Fecha *</label>
                                    <input type="date" id="workshopDate" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Hora inicio *</label>
                                    <input type="time" id="workshopStartTime" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Hora fin *</label>
                                    <input type="time" id="workshopEndTime" class="form-input" required>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Capacidad máxima (plazas) *</label>
                                    <input type="number" id="workshopCapacity" class="form-input"
                                           min="1" value="10" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Estado</label>
                                    <select id="workshopActive" class="form-input">
                                        <option value="true">Activo (visible para clientes)</option>
                                        <option value="false">Inactivo (oculto)</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">URL de imagen (opcional)</label>
                                <input type="url" id="workshopImage" class="form-input"
                                       placeholder="https://ejemplo.com/imagen.jpg">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="workshops.closeModal()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary" id="workshopSubmitBtn">
                                Guardar Taller
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal Ver Reservas -->
            <div id="bookingsModal" class="modal-overlay" style="display: none;">
                <div class="modal-content modal-xl">
                    <div class="modal-header">
                        <h2 id="bookingsModalTitle">Reservas</h2>
                        <button class="modal-close" onclick="workshops.closeBookingsModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="bookingsList"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="workshops.closeBookingsModal()">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderWorkshopsList() {
        const container = document.getElementById('workshopsList');

        if (!this.workshops || this.workshops.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎫</div>
                    <h3>No hay talleres</h3>
                    <p>Crea tu primer taller para empezar a recibir inscripciones</p>
                    <button class="btn btn-primary" onclick="workshops.showCreateModal()">
                        + Crear Taller
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.workshops.map(w => this.renderWorkshopCard(w)).join('');
    },

    renderWorkshopCard(workshop) {
        const date = new Date(workshop.workshop_date);
        const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const startTime = workshop.start_time.substring(0, 5);
        const endTime = workshop.end_time.substring(0, 5);
        const bookedSpots = parseInt(workshop.booked_spots) || 0;
        const availableSpots = parseInt(workshop.available_spots) || workshop.capacity;
        const percentage = Math.round((bookedSpots / workshop.capacity) * 100);

        const isPast = new Date(workshop.workshop_date) < new Date().setHours(0,0,0,0);

        let statusBadge = '';
        if (isPast) {
            statusBadge = '<span class="badge badge-gray">Pasado</span>';
        } else if (!workshop.is_active) {
            statusBadge = '<span class="badge badge-yellow">Inactivo</span>';
        } else if (availableSpots === 0) {
            statusBadge = '<span class="badge badge-red">Completo</span>';
        } else if (availableSpots <= 3) {
            statusBadge = '<span class="badge badge-orange">Últimas plazas</span>';
        } else {
            statusBadge = '<span class="badge badge-green">Disponible</span>';
        }

        return `
            <div class="workshop-card ${!workshop.is_active ? 'inactive' : ''} ${isPast ? 'past' : ''}">
                <div class="workshop-card-header">
                    <h3 class="workshop-title">${workshop.name}</h3>
                    ${statusBadge}
                </div>

                <div class="workshop-info">
                    <div class="workshop-datetime">
                        <span class="icon">📅</span>
                        <span>${dateStr}</span>
                    </div>
                    <div class="workshop-datetime">
                        <span class="icon">🕐</span>
                        <span>${startTime} - ${endTime}</span>
                    </div>
                    ${workshop.price > 0 ? `
                        <div class="workshop-price">
                            <span class="icon">💰</span>
                            <span>${parseFloat(workshop.price).toFixed(2)}€ / persona</span>
                        </div>
                    ` : ''}
                </div>

                <div class="workshop-capacity">
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="capacity-text">
                        <span class="icon">👥</span>
                        <span><strong>${bookedSpots}</strong> / ${workshop.capacity} plazas</span>
                    </div>
                </div>

                ${workshop.description ? `
                    <p class="workshop-description">${workshop.description}</p>
                ` : ''}

                <div class="workshop-actions">
                    <button class="btn btn-sm btn-secondary" onclick="workshops.viewBookings(${workshop.id})">
                        Ver reservas (${workshop.total_bookings || 0})
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="workshops.editWorkshop(${workshop.id})">
                        Editar
                    </button>
                    <button class="btn btn-sm ${workshop.is_active ? 'btn-warning' : 'btn-success'}"
                            onclick="workshops.toggleActive(${workshop.id})">
                        ${workshop.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    ${bookedSpots === 0 ? `
                        <button class="btn btn-sm btn-danger" onclick="workshops.deleteWorkshop(${workshop.id}, '${workshop.name}')">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    togglePastWorkshops() {
        const checkbox = document.getElementById('showPastWorkshops');
        this.loadWorkshops(checkbox.checked);
    },

    showCreateModal() {
        this.currentWorkshop = null;
        document.getElementById('workshopModalTitle').textContent = 'Crear Taller';
        document.getElementById('workshopSubmitBtn').textContent = 'Crear Taller';
        document.getElementById('workshopForm').reset();

        // Establecer fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('workshopDate').min = today;
        document.getElementById('workshopDate').value = '';

        document.getElementById('workshopModal').style.display = 'flex';
    },

    editWorkshop(id) {
        const workshop = this.workshops.find(w => w.id === id);
        if (!workshop) return;

        this.currentWorkshop = workshop;
        document.getElementById('workshopModalTitle').textContent = 'Editar Taller';
        document.getElementById('workshopSubmitBtn').textContent = 'Guardar Cambios';

        // Rellenar formulario
        document.getElementById('workshopName').value = workshop.name || '';
        document.getElementById('workshopDescription').value = workshop.description || '';
        document.getElementById('workshopDate').value = workshop.workshop_date.split('T')[0];
        document.getElementById('workshopStartTime').value = workshop.start_time.substring(0, 5);
        document.getElementById('workshopEndTime').value = workshop.end_time.substring(0, 5);
        document.getElementById('workshopCapacity').value = workshop.capacity;
        document.getElementById('workshopPrice').value = workshop.price || 0;
        document.getElementById('workshopActive').value = workshop.is_active ? 'true' : 'false';
        document.getElementById('workshopImage').value = workshop.image_url || '';

        document.getElementById('workshopModal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('workshopModal').style.display = 'none';
        this.currentWorkshop = null;
    },

    async saveWorkshop(event) {
        event.preventDefault();

        const workshopData = {
            name: document.getElementById('workshopName').value.trim(),
            description: document.getElementById('workshopDescription').value.trim(),
            workshop_date: document.getElementById('workshopDate').value,
            start_time: document.getElementById('workshopStartTime').value,
            end_time: document.getElementById('workshopEndTime').value,
            capacity: parseInt(document.getElementById('workshopCapacity').value),
            price: parseFloat(document.getElementById('workshopPrice').value) || 0,
            is_active: document.getElementById('workshopActive').value === 'true',
            image_url: document.getElementById('workshopImage').value.trim() || null
        };

        // Validación de horas
        if (workshopData.start_time >= workshopData.end_time) {
            modal.toast('La hora de fin debe ser posterior a la hora de inicio', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const isEdit = this.currentWorkshop !== null;
            const url = isEdit
                ? `${API_URL}/api/workshops/${this.currentWorkshop.id}`
                : `${API_URL}/api/workshops`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(workshopData)
            });

            const data = await response.json();

            if (data.success) {
                modal.toast(data.message || (isEdit ? 'Taller actualizado' : 'Taller creado'), 'success');
                this.closeModal();
                this.loadWorkshops(document.getElementById('showPastWorkshops')?.checked || false);
            } else {
                modal.toast(data.message || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error('Error saving workshop:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    async toggleActive(id) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/workshops/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                modal.toast(data.message, 'success');
                this.loadWorkshops(document.getElementById('showPastWorkshops')?.checked || false);
            } else {
                modal.toast(data.message || 'Error al cambiar estado', 'error');
            }
        } catch (error) {
            console.error('Error toggling workshop:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    async deleteWorkshop(id, name) {
        const confirmed = await modal.confirm({
            title: 'Eliminar Taller',
            message: `¿Estás seguro de que quieres eliminar "${name}"?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/workshops/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                modal.toast(data.message, 'success');
                this.loadWorkshops(document.getElementById('showPastWorkshops')?.checked || false);
            } else {
                modal.toast(data.message || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Error deleting workshop:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    async viewBookings(workshopId) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/workshops/${workshopId}/bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('bookingsModalTitle').textContent =
                    `Reservas: ${data.workshop.name}`;

                this.renderBookingsList(data.bookings);
                document.getElementById('bookingsModal').style.display = 'flex';
            } else {
                modal.toast(data.message || 'Error al cargar reservas', 'error');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    renderBookingsList(bookings) {
        const container = document.getElementById('bookingsList');

        if (!bookings || bookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>No hay reservas para este taller</p>
                </div>
            `;
            return;
        }

        const totalPeople = bookings.reduce((sum, b) => {
            return b.status !== 'cancelled' ? sum + b.num_people : sum;
        }, 0);

        container.innerHTML = `
            <div class="bookings-summary">
                <strong>Total: ${totalPeople} personas</strong> en ${bookings.filter(b => b.status !== 'cancelled').length} reserva(s)
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Personas</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(b => `
                        <tr class="${b.status === 'cancelled' ? 'row-cancelled' : ''}">
                            <td><strong>${b.customer_name}</strong></td>
                            <td>${b.customer_email}</td>
                            <td>${b.customer_phone || '-'}</td>
                            <td><span class="badge badge-blue">👥 ${b.num_people}</span></td>
                            <td>${parseFloat(b.total_price).toFixed(2)}€</td>
                            <td>${this.getStatusBadge(b.status)}</td>
                            <td>
                                <select class="form-input form-input-sm"
                                        onchange="workshops.updateBookingStatus(${b.id}, this.value)"
                                        ${b.status === 'cancelled' ? 'disabled' : ''}>
                                    <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                    <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                                    <option value="attended" ${b.status === 'attended' ? 'selected' : ''}>Asistió</option>
                                    <option value="no_show" ${b.status === 'no_show' ? 'selected' : ''}>No vino</option>
                                    <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge badge-yellow">Pendiente</span>',
            confirmed: '<span class="badge badge-green">Confirmada</span>',
            attended: '<span class="badge badge-blue">Asistió</span>',
            no_show: '<span class="badge badge-red">No vino</span>',
            cancelled: '<span class="badge badge-gray">Cancelada</span>'
        };
        return badges[status] || status;
    },

    async updateBookingStatus(bookingId, status) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/workshops/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (data.success) {
                modal.toast('Estado actualizado', 'success');
                // Recargar lista de talleres para actualizar contadores
                this.loadWorkshops(document.getElementById('showPastWorkshops')?.checked || false);
            } else {
                modal.toast(data.message || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    closeBookingsModal() {
        document.getElementById('bookingsModal').style.display = 'none';
    }
};

// Exportar para uso global
window.workshops = workshops;
