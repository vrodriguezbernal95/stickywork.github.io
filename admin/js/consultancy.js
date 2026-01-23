// Consultancy Module - Premium Feature
// Allows Premium clients to request monthly consultancy sessions

const consultancy = {
    canRequest: false,
    requests: [],

    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Consultoría Premium';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando información de consultoría...</p>
            </div>
        `;

        try {
            // Check eligibility and load requests in parallel
            const [eligibilityRes, requestsRes] = await Promise.all([
                api.get('/api/consultancy/can-request'),
                api.get('/api/consultancy/my-requests')
            ]);

            // La respuesta viene directamente, no envuelta en .data
            this.canRequest = eligibilityRes?.canRequest || false;
            this.requests = requestsRes?.data || [];

            this.render(eligibilityRes);
        } catch (error) {
            console.error('Error loading consultancy:', error);
            contentArea.innerHTML = `
                <div class="alert alert-error">
                    Error al cargar información de consultoría. Por favor, recarga la página.
                </div>
            `;
        }
    },

    render(eligibility) {
        const contentArea = document.getElementById('contentArea');

        contentArea.innerHTML = `
            <div class="consultancy-container">
                <!-- Header Section -->
                <div class="card consultancy-header">
                    <div class="card-header">
                        <h2>Consultoría Personalizada</h2>
                    </div>
                    <div class="card-body">
                        <p>Como cliente Premium, tienes derecho a <strong>1 hora de consultoría gratuita al mes</strong> con nuestro equipo de expertos.</p>
                        <p>Podemos ayudarte con:</p>
                        <ul class="consultancy-topics">
                            <li>Optimización de tu sistema de reservas</li>
                            <li>Estrategias para aumentar clientes</li>
                            <li>Configuración avanzada del widget</li>
                            <li>Análisis de métricas y reportes</li>
                            <li>Personalización de tu flujo de trabajo</li>
                        </ul>
                    </div>
                </div>

                <!-- Eligibility Status -->
                ${this.renderEligibilityStatus(eligibility)}

                <!-- Request Form (if eligible) -->
                ${this.canRequest ? this.renderRequestForm() : ''}

                <!-- Previous Requests -->
                ${this.renderRequestsList()}
            </div>
        `;

        // Setup form if eligible
        if (this.canRequest) {
            this.setupForm();
        }
    },

    renderEligibilityStatus(eligibility) {
        // Manejar caso de eligibility undefined o null
        if (!eligibility) {
            return `
                <div class="alert alert-warning">
                    <strong>No disponible:</strong> No se pudo verificar la elegibilidad. Por favor, recarga la página.
                </div>
            `;
        }

        if (this.canRequest) {
            return `
                <div class="alert alert-success">
                    <strong>Disponible:</strong> ${eligibility.message || 'Puedes solicitar tu consultoría gratuita.'}
                </div>
            `;
        }

        if (eligibility.reason === 'not_premium') {
            return `
                <div class="alert alert-warning">
                    <strong>No disponible:</strong> Las consultorías personalizadas están disponibles exclusivamente para clientes Premium.
                    <br><a href="#" onclick="app.navigateTo('billing'); return false;">Ver planes Premium</a>
                </div>
            `;
        }

        if (eligibility.reason === 'monthly_limit') {
            return `
                <div class="alert alert-info">
                    <strong>Límite alcanzado:</strong> ${eligibility.message || 'Ya has usado tu consultoría de este mes.'}
                </div>
            `;
        }

        return '';
    },

    renderRequestForm() {
        // Calculate min date (tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];

        // Calculate max date (2 months ahead)
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 2);
        const maxDateStr = maxDate.toISOString().split('T')[0];

        return `
            <div class="card consultancy-form-card">
                <div class="card-header">
                    <h3>Solicitar Consultoría</h3>
                </div>
                <div class="card-body">
                    <form id="consultancyForm">
                        <div class="form-group">
                            <label for="topic">Tema de la consultoría *</label>
                            <select id="topic" name="topic" required>
                                <option value="">Selecciona un tema</option>
                                <option value="Optimización de reservas">Optimización de reservas</option>
                                <option value="Estrategia de captación">Estrategia de captación de clientes</option>
                                <option value="Configuración avanzada">Configuración avanzada</option>
                                <option value="Análisis de métricas">Análisis de métricas</option>
                                <option value="Personalización">Personalización del sistema</option>
                                <option value="Otro">Otro tema</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="description">Describe lo que necesitas *</label>
                            <textarea id="description" name="description" rows="4" required
                                placeholder="Cuéntanos con detalle qué te gustaría trabajar en la consultoría. Cuanta más información nos des, mejor podremos prepararnos para ayudarte."
                                minlength="20"></textarea>
                            <small class="form-hint">Mínimo 20 caracteres</small>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="preferred_date_1">Fecha preferida 1 *</label>
                                <input type="date" id="preferred_date_1" name="preferred_date_1" required
                                    min="${minDate}" max="${maxDateStr}">
                            </div>
                            <div class="form-group">
                                <label for="preferred_date_2">Fecha alternativa 2</label>
                                <input type="date" id="preferred_date_2" name="preferred_date_2"
                                    min="${minDate}" max="${maxDateStr}">
                            </div>
                            <div class="form-group">
                                <label for="preferred_date_3">Fecha alternativa 3</label>
                                <input type="date" id="preferred_date_3" name="preferred_date_3"
                                    min="${minDate}" max="${maxDateStr}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="preferred_time_slot">Franja horaria preferida *</label>
                            <select id="preferred_time_slot" name="preferred_time_slot" required>
                                <option value="morning">Mañana (9:00 - 13:00)</option>
                                <option value="afternoon">Tarde (15:00 - 19:00)</option>
                                <option value="evening">Noche (19:00 - 21:00)</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="submitBtn">
                                Solicitar Consultoría
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderRequestsList() {
        if (!this.requests || this.requests.length === 0) {
            return `
                <div class="card">
                    <div class="card-header">
                        <h3>Mis Solicitudes</h3>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">No tienes solicitudes de consultoría anteriores.</p>
                    </div>
                </div>
            `;
        }

        const requestsHtml = this.requests.map(req => this.renderRequestCard(req)).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h3>Mis Solicitudes</h3>
                </div>
                <div class="card-body">
                    <div class="requests-list">
                        ${requestsHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderRequestCard(request) {
        const statusLabels = {
            pending: 'Pendiente',
            scheduled: 'Agendada',
            completed: 'Completada',
            canceled: 'Cancelada'
        };

        const statusClasses = {
            pending: 'status-pending',
            scheduled: 'status-confirmed',
            completed: 'status-completed',
            canceled: 'status-cancelled'
        };

        const createdAt = new Date(request.created_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        let scheduledInfo = '';
        if (request.status === 'scheduled' && request.scheduled_date) {
            const scheduledDate = new Date(request.scheduled_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            scheduledInfo = `
                <div class="request-scheduled">
                    <strong>Fecha agendada:</strong> ${scheduledDate} a las ${request.scheduled_time || 'Por confirmar'}
                    ${request.meeting_link ? `<br><a href="${request.meeting_link}" target="_blank">Enlace a la reunión</a>` : ''}
                </div>
            `;
        }

        const canCancel = request.status === 'pending';

        return `
            <div class="request-card">
                <div class="request-header">
                    <span class="request-topic">${request.topic}</span>
                    <span class="status-badge ${statusClasses[request.status] || ''}">${statusLabels[request.status] || request.status}</span>
                </div>
                <div class="request-description">${request.description}</div>
                <div class="request-dates">
                    <small>Fechas preferidas: ${this.formatPreferredDates(request)}</small>
                </div>
                ${scheduledInfo}
                <div class="request-footer">
                    <small class="text-muted">Solicitada el ${createdAt}</small>
                    ${canCancel ? `<button class="btn btn-small btn-danger" onclick="consultancy.cancelRequest(${request.id})">Cancelar</button>` : ''}
                </div>
            </div>
        `;
    },

    formatPreferredDates(request) {
        const dates = [];
        if (request.preferred_date_1) dates.push(new Date(request.preferred_date_1).toLocaleDateString('es-ES'));
        if (request.preferred_date_2) dates.push(new Date(request.preferred_date_2).toLocaleDateString('es-ES'));
        if (request.preferred_date_3) dates.push(new Date(request.preferred_date_3).toLocaleDateString('es-ES'));
        return dates.join(' / ') || 'No especificadas';
    },

    setupForm() {
        const form = document.getElementById('consultancyForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitRequest();
        });
    },

    async submitRequest() {
        const form = document.getElementById('consultancyForm');
        const submitBtn = document.getElementById('submitBtn');

        const formData = {
            topic: form.topic.value,
            description: form.description.value,
            preferred_date_1: form.preferred_date_1.value,
            preferred_date_2: form.preferred_date_2.value || null,
            preferred_date_3: form.preferred_date_3.value || null,
            preferred_time_slot: form.preferred_time_slot.value
        };

        // Validate
        if (!formData.topic || !formData.description || !formData.preferred_date_1) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (formData.description.length < 20) {
            alert('La descripción debe tener al menos 20 caracteres.');
            return;
        }

        // Disable button while submitting
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const response = await api.post('/api/consultancy', formData);

            if (response.success) {
                alert('Solicitud enviada correctamente. Nos pondremos en contacto contigo pronto para confirmar la fecha.');
                await this.load(); // Reload to show updated list
            } else {
                alert(response.message || 'Error al enviar la solicitud.');
            }
        } catch (error) {
            console.error('Error submitting consultancy request:', error);
            alert(error.message || 'Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Solicitar Consultoría';
        }
    },

    async cancelRequest(requestId) {
        if (!confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) {
            return;
        }

        try {
            const response = await api.delete(`/api/consultancy/${requestId}`);

            if (response.success) {
                alert('Solicitud cancelada correctamente.');
                await this.load(); // Reload to show updated list
            } else {
                alert(response.message || 'Error al cancelar la solicitud.');
            }
        } catch (error) {
            console.error('Error canceling consultancy request:', error);
            alert(error.message || 'Error al cancelar la solicitud.');
        }
    }
};

// Export
window.consultancy = consultancy;
