// Support Module for Client Dashboard
const supportModule = {
    currentStatus: null,
    currentTab: 'send', // 'send' or 'history'

    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Mensajes';

        // Check if can send message
        await this.checkCanSendMessage();

        // Render layout with tabs
        this.renderLayout();

        // Load content based on current tab
        this.loadTabContent();
    },

    async checkCanSendMessage() {
        try {
            const data = await api.get('/api/support/can-send-message');
            this.currentStatus = data;
        } catch (error) {
            console.error('Error checking message status:', error);
            this.currentStatus = {
                canSend: false,
                reason: 'error',
                message: 'Error al verificar estado. Por favor, recarga la página.'
            };
        }
    },

    renderLayout() {
        const contentArea = document.getElementById('contentArea');

        contentArea.innerHTML = `
            <!-- Tabs -->
            <div class="tabs" style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color);">
                <button class="tab-btn ${this.currentTab === 'send' ? 'active' : ''}" data-tab="send" onclick="supportModule.switchTab('send')">
                    📤 Enviar Mensaje
                </button>
                <button class="tab-btn ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history" onclick="supportModule.switchTab('history')">
                    📜 Mis Mensajes
                </button>
            </div>

            <!-- Tab Content Container -->
            <div id="tabContent"></div>
        `;
    },

    switchTab(tab) {
        this.currentTab = tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Load content for the selected tab
        this.loadTabContent();
    },

    loadTabContent() {
        const container = document.getElementById('tabContent');

        if (this.currentTab === 'send') {
            this.renderSendMessageTab(container);
        } else {
            this.renderHistoryTab(container);
        }
    },

    renderSendMessageTab(container) {
        if (!this.currentStatus) {
            container.innerHTML = '<div class="loading">Cargando...</div>';
            return;
        }

        container.innerHTML = `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <div class="card-header">
                    <h3>💬 Contactar Equipo de StickyWork</h3>
                </div>

                <div class="card-body">
                    ${this.renderStatusMessage()}
                    ${this.currentStatus.canSend ? this.renderForm() : this.renderBlockedMessage()}
                </div>
            </div>
        `;

        // Add event listeners if form is visible
        if (this.currentStatus.canSend) {
            this.attachFormEventListeners();
        }
    },

    renderHistoryTab(container) {
        container.innerHTML = `
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <div class="card-header">
                    <h3>📜 Historial de Mensajes</h3>
                </div>
                <div id="messagesHistory" class="card-body">
                    <div class="loading">Cargando historial...</div>
                </div>
            </div>
        `;

        // Load messages
        this.loadPreviousMessages();
    },

    renderStatusMessage() {
        const { canSend, reason, message } = this.currentStatus;

        let icon = '📝';
        let colorClass = 'info';

        if (!canSend) {
            icon = '⏳';
            colorClass = 'warning';
        }

        if (reason === 'previous_answered') {
            icon = '✅';
            colorClass = 'success';
        }

        return `
            <div class="alert alert-${colorClass}" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(77, 83, 255, 0.1); border-left: 4px solid var(--primary-color); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">${icon}</span>
                    <p style="margin: 0; color: var(--text-primary); font-weight: 600;">${message}</p>
                </div>
            </div>
        `;
    },

    renderBlockedMessage() {
        return `
            <div style="text-align: center; padding: 2rem; background: var(--bg-tertiary); border-radius: 12px;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">⏳</div>
                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Mensaje Pendiente</h3>
                <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">
                    Actualmente tienes un mensaje pendiente de respuesta. Te responderemos lo antes posible.
                </p>
                <p style="color: var(--text-tertiary); font-size: 0.9rem; margin-top: 1rem;">
                    Si no recibes respuesta en 72 horas, podrás enviar otro mensaje.
                </p>
                <button
                    onclick="supportModule.switchTab('history')"
                    class="btn-secondary"
                    style="margin-top: 1.5rem; padding: 0.75rem 1.5rem;"
                >
                    📜 Ver Mis Mensajes
                </button>
            </div>
        `;
    },

    renderForm() {
        return `
            <form id="supportForm" style="margin-top: 1.5rem;">
                <!-- Categoría -->
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="category" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 700;">
                        📋 Categoría del Mensaje
                    </label>
                    <select id="category" name="category" required style="width: 100%; padding: 0.75rem; background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem; font-weight: 600;">
                        <option value="question">❓ Pregunta General</option>
                        <option value="bug">🐛 Reportar Error/Bug</option>
                        <option value="suggestion">💡 Sugerencia/Mejora</option>
                        <option value="call_request">📞 Solicitar Llamada</option>
                        <option value="email_request">📧 Solicitar Email Detallado</option>
                    </select>
                </div>

                <!-- Mensaje -->
                <div class="form-group" style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <label for="message" style="color: var(--text-primary); font-weight: 700;">
                            ✍️ Tu Mensaje
                        </label>
                        <span id="wordCount" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem;">
                            0 / 150 palabras
                        </span>
                    </div>
                    <textarea
                        id="message"
                        name="message"
                        required
                        rows="8"
                        placeholder="Describe tu pregunta, problema o sugerencia de forma clara y concisa...

Consejos:
• Sé específico sobre el problema
• Incluye pasos si es un error
• Menciona qué navegador usas si es relevante

Si necesitas enviar algo más largo, selecciona 'Solicitar Email Detallado' o 'Solicitar Llamada'."
                        style="width: 100%; padding: 1rem; background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem; font-family: inherit; resize: vertical; line-height: 1.5;"
                    ></textarea>
                    <p id="wordCountWarning" style="margin-top: 0.5rem; color: var(--text-tertiary); font-size: 0.85rem; display: none;">
                        ⚠️ Has excedido el límite de 150 palabras
                    </p>
                </div>

                <!-- Botones -->
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button
                        type="button"
                        onclick="supportModule.switchTab('history')"
                        class="btn-secondary"
                        style="padding: 0.75rem 1.5rem;"
                    >
                        Ver Historial
                    </button>
                    <button
                        type="submit"
                        class="btn-primary"
                        id="submitBtn"
                        style="padding: 0.75rem 2rem;"
                    >
                        📤 Enviar Mensaje
                    </button>
                </div>
            </form>

            <!-- Info adicional -->
            <div style="margin-top: 2rem; padding: 1rem; background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; border-radius: 8px;">
                <h4 style="color: #fbbf24; margin: 0 0 0.5rem 0; font-size: 1rem;">
                    ℹ️ Información Importante
                </h4>
                <ul style="color: var(--text-secondary); font-size: 0.9rem; margin: 0; padding-left: 1.5rem; line-height: 1.6;">
                    <li>Solo puedes enviar <strong>1 mensaje a la vez</strong></li>
                    <li>Límite: <strong>150 palabras máximo</strong></li>
                    <li>Te responderemos por email y aquí en el dashboard</li>
                    <li>Si no recibes respuesta en <strong>72 horas</strong>, podrás enviar otro mensaje</li>
                </ul>
            </div>
        `;
    },

    attachFormEventListeners() {
        const form = document.getElementById('supportForm');
        const textarea = document.getElementById('message');
        const wordCountSpan = document.getElementById('wordCount');
        const wordCountWarning = document.getElementById('wordCountWarning');

        // Word counter
        textarea.addEventListener('input', () => {
            const text = textarea.value.trim();
            const words = text ? text.split(/\s+/) : [];
            const count = words.length;

            wordCountSpan.textContent = `${count} / 150 palabras`;

            if (count > 150) {
                wordCountSpan.style.color = '#ef4444';
                wordCountWarning.style.display = 'block';
            } else {
                wordCountSpan.style.color = count > 120 ? '#fbbf24' : 'var(--text-secondary)';
                wordCountWarning.style.display = 'none';
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMessage();
        });
    },

    async submitMessage() {
        const submitBtn = document.getElementById('submitBtn');
        const category = document.getElementById('category').value;
        const message = document.getElementById('message').value.trim();

        // Validate word count
        const words = message.split(/\s+/);
        if (words.length > 150) {
            this.showNotification('El mensaje excede las 150 palabras. Por favor, reduce el texto.', 'error');
            return;
        }

        if (words.length < 5) {
            this.showNotification('El mensaje es demasiado corto. Por favor, proporciona más detalles.', 'error');
            return;
        }

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Enviando...';

        try {
            await api.post('/api/support/messages', { category, message });

            this.showNotification('¡Mensaje enviado correctamente! Te responderemos lo antes posible.', 'success');

            // Switch to history tab after a delay
            setTimeout(() => {
                this.switchTab('history');
                this.load(); // Reload to update status
            }, 2000);

        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification(error.response?.data?.message || 'Error al enviar mensaje', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '📤 Enviar Mensaje';
        }
    },

    async loadPreviousMessages() {
        const container = document.getElementById('messagesHistory');

        try {
            const data = await api.get('/api/support/messages/my-messages');
            const messages = data.data;

            if (!messages || messages.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                        <p>No tienes mensajes anteriores</p>
                        <button
                            onclick="supportModule.switchTab('send')"
                            class="btn-primary"
                            style="margin-top: 1rem; padding: 0.75rem 1.5rem;"
                        >
                            📤 Enviar Primer Mensaje
                        </button>
                    </div>
                `;
                return;
            }

            container.innerHTML = messages.map(msg => this.renderMessage(msg)).join('');

        } catch (error) {
            console.error('Error loading messages:', error);
            container.innerHTML = '<p class="error-message">Error al cargar historial de mensajes</p>';
        }
    },

    renderMessage(msg) {
        const categoryLabels = {
            'bug': '🐛 Bug',
            'question': '❓ Pregunta',
            'suggestion': '💡 Sugerencia',
            'call_request': '📞 Llamada',
            'email_request': '📧 Email'
        };

        const statusBadges = {
            'pending': '<span class="badge" style="background: rgba(251, 191, 36, 0.25); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4);">⏳ Pendiente</span>',
            'answered': '<span class="badge" style="background: rgba(34, 197, 94, 0.25); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4);">✅ Respondido</span>',
            'closed': '<span class="badge" style="background: rgba(148, 163, 184, 0.25); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.4);">🔒 Cerrado</span>'
        };

        const date = new Date(msg.created_at).toLocaleString('es-ES');

        return `
            <div style="padding: 1.5rem; background: var(--bg-tertiary); border-radius: 12px; margin-bottom: 1rem; border-left: 4px solid var(--primary-color);">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <span style="font-weight: 700; color: var(--text-primary);">${categoryLabels[msg.category] || msg.category}</span>
                        ${statusBadges[msg.status]}
                    </div>
                    <span style="color: var(--text-tertiary); font-size: 0.85rem;">${date}</span>
                </div>

                <!-- Tu mensaje -->
                <div style="margin-bottom: ${msg.admin_response ? '1.5rem' : '0'};">
                    <p style="color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem; font-size: 0.85rem;">Tu mensaje:</p>
                    <p style="color: var(--text-primary); line-height: 1.6; white-space: pre-wrap; margin: 0; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">${msg.message}</p>
                </div>

                <!-- Respuesta -->
                ${msg.admin_response ? `
                    <div style="padding: 1rem; background: rgba(77, 83, 255, 0.1); border-radius: 8px; border-left: 3px solid var(--primary-color);">
                        <p style="color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem; font-size: 0.85rem;">
                            💬 Respuesta de ${msg.answered_by || 'StickyWork'}:
                        </p>
                        <p style="color: var(--text-primary); line-height: 1.6; white-space: pre-wrap; margin: 0;">${msg.admin_response}</p>
                        <p style="color: var(--text-tertiary); font-size: 0.8rem; margin: 0.5rem 0 0 0;">
                            ${new Date(msg.answered_at).toLocaleString('es-ES')}
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
};

// Export
window.supportModule = supportModule;
