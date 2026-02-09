/**
 * Módulo de Talleres/Eventos Grupales
 * Permite crear, editar y gestionar talleres con sesiones múltiples
 */

const workshops = {
    workshops: [],
    currentWorkshop: null,
    sessionCounter: 0,

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

                            <div class="form-group">
                                <label class="form-label">Sesiones *</label>
                                <p class="hint" style="margin: 0 0 0.75rem 0; color: var(--text-secondary); font-size: 0.85rem;">
                                    Añade las fechas y horarios en que se imparte el taller. Cada sesión tiene su propia capacidad.
                                </p>
                                <div id="workshopSessions" style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <!-- Sesiones dinámicas -->
                                </div>
                                <button type="button" class="btn btn-secondary" style="margin-top: 0.75rem; font-size: 0.9rem;"
                                        onclick="workshops.addSession()">
                                    + Añadir otra sesión
                                </button>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Estado</label>
                                    <select id="workshopActive" class="form-input">
                                        <option value="true">Activo (visible para clientes)</option>
                                        <option value="false">Inactivo (oculto)</option>
                                    </select>
                                </div>
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

            <style>
                .session-row {
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-end;
                    padding: 0.75rem;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    border: 1px solid var(--border-color, #e5e7eb);
                }
                .session-row .form-group {
                    margin-bottom: 0;
                    flex: 1;
                }
                .session-row .form-group.session-date-group {
                    flex: 1.5;
                }
                .session-row .form-group.session-capacity-group {
                    flex: 0.7;
                }
                .session-row .form-label {
                    font-size: 0.8rem;
                    margin-bottom: 0.25rem;
                }
                .session-row .form-input {
                    padding: 0.5rem;
                    font-size: 0.9rem;
                }
                .session-remove-btn {
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .session-remove-btn:hover {
                    background: #dc2626;
                }
                .sessions-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                .session-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.35rem 0.65rem;
                    background: var(--bg-secondary);
                    border-radius: 6px;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                @media (max-width: 600px) {
                    .session-row {
                        flex-wrap: wrap;
                    }
                    .session-row .form-group {
                        min-width: calc(50% - 0.5rem);
                    }
                }
            </style>
        `;
    },

    addSession(data = null) {
        this.sessionCounter++;
        const container = document.getElementById('workshopSessions');
        const index = this.sessionCounter;
        const _now = new Date();
        const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

        const dateVal = data?.session_date ? data.session_date.split('T')[0] : '';
        const startVal = data?.start_time ? data.start_time.substring(0, 5) : '';
        const endVal = data?.end_time ? data.end_time.substring(0, 5) : '';
        const capVal = data?.capacity || 10;
        const sessionDbId = data?.id || '';

        const html = `
            <div class="session-row" data-session-index="${index}" ${sessionDbId ? `data-session-id="${sessionDbId}"` : ''}>
                <div class="form-group session-date-group clickable-input">
                    <label class="form-label">Fecha</label>
                    <input type="date" class="form-input session-date" required min="${today}" value="${dateVal}">
                </div>
                <div class="form-group clickable-input">
                    <label class="form-label">Inicio</label>
                    <input type="time" class="form-input session-start" required value="${startVal}">
                </div>
                <div class="form-group clickable-input">
                    <label class="form-label">Fin</label>
                    <input type="time" class="form-input session-end" required value="${endVal}">
                </div>
                <div class="form-group session-capacity-group">
                    <label class="form-label">Plazas</label>
                    <input type="number" class="form-input session-capacity" min="1" value="${capVal}" required>
                </div>
                <button type="button" class="session-remove-btn" onclick="workshops.removeSession(${index})" title="Eliminar sesión">
                    &times;
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    removeSession(index) {
        const allRows = document.querySelectorAll('.session-row');
        if (allRows.length <= 1) {
            modal.toast('Debe haber al menos una sesión', 'error');
            return;
        }
        const row = document.querySelector(`.session-row[data-session-index="${index}"]`);
        if (row) row.remove();
    },

    getSessionsData() {
        const rows = document.querySelectorAll('.session-row');
        return Array.from(rows).map(row => {
            const sessionId = row.dataset.sessionId ? parseInt(row.dataset.sessionId) : undefined;
            return {
                id: sessionId || undefined,
                session_date: row.querySelector('.session-date').value,
                start_time: row.querySelector('.session-start').value,
                end_time: row.querySelector('.session-end').value,
                capacity: parseInt(row.querySelector('.session-capacity').value) || 10
            };
        }).filter(s => s.session_date && s.start_time && s.end_time);
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
        const totalSessions = parseInt(workshop.total_sessions) || 0;
        const nextDate = workshop.next_session_date;
        const totalBooked = parseInt(workshop.total_booked) || 0;
        const totalBookings = parseInt(workshop.total_bookings) || 0;

        let nextDateStr = 'Sin sesiones futuras';
        let isPast = true;
        if (nextDate) {
            const d = new Date(nextDate);
            nextDateStr = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            isPast = false;
        }

        let statusBadge = '';
        if (!nextDate && totalSessions > 0) {
            statusBadge = '<span class="badge badge-gray">Pasado</span>';
        } else if (!workshop.is_active) {
            statusBadge = '<span class="badge badge-yellow">Inactivo</span>';
        } else if (totalSessions === 0) {
            statusBadge = '<span class="badge badge-gray">Sin sesiones</span>';
        } else {
            statusBadge = '<span class="badge badge-green">Disponible</span>';
        }

        return `
            <div class="workshop-card ${!workshop.is_active ? 'inactive' : ''} ${isPast && totalSessions > 0 ? 'past' : ''}">
                <div class="workshop-card-header">
                    <h3 class="workshop-title">${workshop.name}</h3>
                    ${statusBadge}
                </div>

                <div class="workshop-info">
                    <div class="workshop-datetime">
                        <span class="icon">📅</span>
                        <span>${totalSessions} sesión${totalSessions !== 1 ? 'es' : ''}</span>
                    </div>
                    ${nextDate ? `
                        <div class="workshop-datetime">
                            <span class="icon">➡️</span>
                            <span>Próxima: ${nextDateStr}</span>
                        </div>
                    ` : ''}
                    ${workshop.price > 0 ? `
                        <div class="workshop-price">
                            <span class="icon">💰</span>
                            <span>${parseFloat(workshop.price).toFixed(2)}€ / persona</span>
                        </div>
                    ` : ''}
                </div>

                <div class="workshop-capacity">
                    <div class="capacity-text">
                        <span class="icon">👥</span>
                        <span><strong>${totalBooked}</strong> personas reservadas (${totalBookings} reservas)</span>
                    </div>
                </div>

                ${workshop.description ? `
                    <p class="workshop-description">${workshop.description}</p>
                ` : ''}

                <div class="workshop-actions">
                    <button class="btn btn-sm btn-secondary" onclick="workshops.viewBookings(${workshop.id})">
                        Ver reservas (${totalBookings})
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="workshops.editWorkshop(${workshop.id})">
                        Editar
                    </button>
                    <button class="btn btn-sm ${workshop.is_active ? 'btn-warning' : 'btn-success'}"
                            onclick="workshops.toggleActive(${workshop.id})">
                        ${workshop.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    ${totalBooked === 0 ? `
                        <button class="btn btn-sm btn-danger" onclick="workshops.deleteWorkshop(${workshop.id}, '${workshop.name.replace(/'/g, "\\'")}')">
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

        // Limpiar sesiones y añadir una vacía
        document.getElementById('workshopSessions').innerHTML = '';
        this.sessionCounter = 0;
        this.addSession();

        document.getElementById('workshopModal').style.display = 'flex';
    },

    async editWorkshop(id) {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/workshops/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!data.success) {
                modal.toast('Error al cargar taller', 'error');
                return;
            }

            const workshop = data.workshop;
            this.currentWorkshop = workshop;

            document.getElementById('workshopModalTitle').textContent = 'Editar Taller';
            document.getElementById('workshopSubmitBtn').textContent = 'Guardar Cambios';

            // Rellenar datos del concepto
            document.getElementById('workshopName').value = workshop.name || '';
            document.getElementById('workshopDescription').value = workshop.description || '';
            document.getElementById('workshopPrice').value = workshop.price || 0;
            document.getElementById('workshopActive').value = workshop.is_active ? 'true' : 'false';

            // Cargar sesiones
            document.getElementById('workshopSessions').innerHTML = '';
            this.sessionCounter = 0;

            if (workshop.sessions && workshop.sessions.length > 0) {
                workshop.sessions.forEach(s => this.addSession(s));
            } else {
                // Fallback: usar datos legacy
                this.addSession({
                    session_date: workshop.workshop_date,
                    start_time: workshop.start_time,
                    end_time: workshop.end_time,
                    capacity: workshop.capacity
                });
            }

            document.getElementById('workshopModal').style.display = 'flex';
        } catch (error) {
            console.error('Error loading workshop:', error);
            modal.toast('Error de conexión', 'error');
        }
    },

    closeModal() {
        document.getElementById('workshopModal').style.display = 'none';
        this.currentWorkshop = null;
    },

    async saveWorkshop(event) {
        event.preventDefault();

        const sessions = this.getSessionsData();
        if (sessions.length === 0) {
            modal.toast('Debes añadir al menos una sesión', 'error');
            return;
        }

        // Validar cada sesión
        for (const s of sessions) {
            if (s.start_time >= s.end_time) {
                modal.toast('La hora de fin debe ser posterior a la hora de inicio en todas las sesiones', 'error');
                return;
            }
        }

        const workshopData = {
            name: document.getElementById('workshopName').value.trim(),
            description: document.getElementById('workshopDescription').value.trim(),
            price: parseFloat(document.getElementById('workshopPrice').value) || 0,
            is_active: document.getElementById('workshopActive').value === 'true',
            sessions: sessions
        };

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

    formatSessionDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
                        <th>Sesión</th>
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
                            <td>
                                ${b.session_date
                                    ? `<span class="session-tag">${this.formatSessionDate(b.session_date)} ${b.session_start_time?.substring(0,5) || ''}</span>`
                                    : '-'}
                            </td>
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
