// Services Management Module

const services = {
    currentServices: [],

    // Load services management interface
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Gestión de Servicios';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando servicios...</p>
            </div>
        `;

        try {
            // Load services
            const data = await api.get(`/api/services/${auth.getBusinessId()}`);
            this.currentServices = data.data;

            this.render();
        } catch (error) {
            console.error('Error loading services:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar los servicios</p>
                </div>
            `;
        }
    },

    // Render the services interface
    render() {
        const contentArea = document.getElementById('contentArea');

        contentArea.innerHTML = `
            <!-- Add Service Button -->
            <div style="margin-bottom: 2rem;">
                <button class="btn-primary" onclick="services.showAddModal()">
                    ➕ Añadir Servicio
                </button>
            </div>

            <!-- Services Grid -->
            <div class="stats-grid">
                ${this.currentServices.length === 0 ? `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <div class="empty-state-icon">🛠️</div>
                        <p>No hay servicios configurados</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Añade tu primer servicio para comenzar</p>
                    </div>
                ` : this.currentServices.map(service => this.renderServiceCard(service)).join('')}
            </div>

            <!-- Modal Container -->
            <div id="serviceModal" style="display: none;"></div>
        `;
    },

    // Render a service card
    renderServiceCard(service) {
        return `
            <div class="stat-card" style="position: relative;">
                ${!service.is_active ? `
                    <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                        Inactivo
                    </div>
                ` : ''}

                <div style="margin-bottom: 1rem;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem; color: var(--text-primary);">
                        ${service.name}
                    </h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5;">
                        ${service.description || 'Sin descripción'}
                    </p>
                </div>

                <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Duración</div>
                        <div style="font-weight: 600; color: var(--text-primary);">⏱️ ${utils.formatDuration(service.duration)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Precio</div>
                        <div style="font-weight: 600; color: var(--primary-color);">💰 ${service.price ? utils.formatCurrency(service.price) : 'Gratis'}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-small btn-primary-small" onclick="services.showEditModal(${service.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn-small" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="services.deleteService(${service.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    },

    // Show add service modal
    showAddModal() {
        const modal = document.getElementById('serviceModal');
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;" onclick="services.closeModal(event)">
                <div class="feature-card" style="max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                    <h2 style="margin: 0 0 1.5rem 0;">➕ Añadir Servicio</h2>

                    <form id="serviceForm" onsubmit="services.submitAdd(event)">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nombre del Servicio *</label>
                            <input type="text" name="name" required
                                   style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);"
                                   placeholder="Ej: Corte de Cabello">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Descripción</label>
                            <textarea name="description" rows="3"
                                      style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); resize: vertical;"
                                      placeholder="Descripción del servicio"></textarea>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Duración (minutos) *</label>
                                <input type="number" name="duration" required min="5" step="5" value="30"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                            </div>

                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Precio (€)</label>
                                <input type="number" name="price" min="0" step="0.01" placeholder="0.00"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                            </div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="is_active" checked style="width: 18px; height: 18px;">
                                <span style="font-weight: 600;">Servicio activo</span>
                            </label>
                        </div>

                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button type="button" class="btn-small" onclick="services.closeModal()" style="background: var(--bg-secondary);">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-small btn-primary-small">
                                Guardar Servicio
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    // Show edit service modal
    showEditModal(serviceId) {
        const service = this.currentServices.find(s => s.id === serviceId);
        if (!service) return;

        const modal = document.getElementById('serviceModal');
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;" onclick="services.closeModal(event)">
                <div class="feature-card" style="max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
                    <h2 style="margin: 0 0 1.5rem 0;">✏️ Editar Servicio</h2>

                    <form id="serviceForm" onsubmit="services.submitEdit(event, ${serviceId})">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nombre del Servicio *</label>
                            <input type="text" name="name" required value="${service.name}"
                                   style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Descripción</label>
                            <textarea name="description" rows="3"
                                      style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); resize: vertical;">${service.description || ''}</textarea>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Duración (minutos) *</label>
                                <input type="number" name="duration" required min="5" step="5" value="${service.duration}"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                            </div>

                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Precio (€)</label>
                                <input type="number" name="price" min="0" step="0.01" value="${service.price || ''}"
                                       style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary);">
                            </div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="is_active" ${service.is_active ? 'checked' : ''} style="width: 18px; height: 18px;">
                                <span style="font-weight: 600;">Servicio activo</span>
                            </label>
                        </div>

                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button type="button" class="btn-small" onclick="services.closeModal()" style="background: var(--bg-secondary);">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-small btn-primary-small">
                                Actualizar Servicio
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    // Close modal
    closeModal(event) {
        if (event && event.target !== event.currentTarget) return;
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.style.display = 'none';
            modal.innerHTML = '';
        }
    },

    // Submit add form
    async submitAdd(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const serviceData = {
            business_id: auth.getBusinessId(),
            name: formData.get('name'),
            description: formData.get('description') || null,
            duration: parseInt(formData.get('duration')),
            price: formData.get('price') ? parseFloat(formData.get('price')) : null,
            is_active: formData.get('is_active') === 'on'
        };

        try {
            await api.post('/api/services', serviceData);
            this.closeModal();
            this.load(); // Reload services
        } catch (error) {
            console.error('Error adding service:', error);
            modal.toast({
                message: 'Error al añadir el servicio',
                type: 'error'
            });
        }
    },

    // Submit edit form
    async submitEdit(event, serviceId) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const serviceData = {
            name: formData.get('name'),
            description: formData.get('description') || null,
            duration: parseInt(formData.get('duration')),
            price: formData.get('price') ? parseFloat(formData.get('price')) : null,
            is_active: formData.get('is_active') === 'on'
        };

        try {
            await api.put(`/api/services/${serviceId}`, serviceData);
            this.closeModal();
            this.load(); // Reload services
        } catch (error) {
            console.error('Error updating service:', error);
            modal.toast({
                message: 'Error al actualizar el servicio',
                type: 'error'
            });
        }
    },

    // Delete service
    async deleteService(serviceId) {
        const confirmed = await modal.confirm({
            title: '¿Eliminar servicio?',
            message: 'Esta acción no se puede deshacer. El servicio será eliminado permanentemente.',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await api.delete(`/api/services/${serviceId}`);

            modal.toast({
                message: 'Servicio eliminado exitosamente',
                type: 'success'
            });

            this.load(); // Reload services
        } catch (error) {
            console.error('Error deleting service:', error);
            modal.toast({
                message: 'Error al eliminar el servicio',
                type: 'error'
            });
        }
    }
};

// Export
window.services = services;
