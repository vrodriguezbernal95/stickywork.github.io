// Super Admin Messages Module
const superMessages = {
    currentStatus: '',
    selectedMessage: null,
    currentTab: 'contact', // 'contact' or 'support'

    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Mensajes';

        // Render layout
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <!-- Tabs -->
            <div class="tabs" style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color);">
                <button class="tab-btn active" data-tab="contact" onclick="superMessages.switchTab('contact')">
                    💬 Mensajes de Contacto
                </button>
                <button class="tab-btn" data-tab="support" onclick="superMessages.switchTab('support')">
                    🆘 Soporte Clientes
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 id="tabTitle">Mensajes de Contacto</h3>
                    <div class="filters-container">
                        <select id="statusFilter" class="filter-select" onchange="superMessages.filterByStatus()">
                            <option value="">Todos los mensajes</option>
                            <option value="unread">Sin leer</option>
                            <option value="read">Leídos</option>
                            <option value="replied">Respondidos</option>
                        </select>
                    </div>
                </div>

                <div id="messagesContainer">
                    <div class="loading">Cargando...</div>
                </div>
            </div>

            <!-- Modal de detalles del mensaje -->
            <div id="messageDetailsModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>Detalles del Mensaje</h2>
                        <button class="modal-close" onclick="superMessages.closeDetailsModal()">×</button>
                    </div>
                    <div id="messageDetailsContent" class="modal-body">
                        <!-- Content will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button onclick="superMessages.markAsRead()" class="btn-secondary" id="markReadBtn">
                            ✓ Marcar como leído
                        </button>
                        <button onclick="superMessages.markAsReplied()" class="btn-primary" id="markRepliedBtn">
                            📧 Marcar como respondido
                        </button>
                        <button onclick="superMessages.deleteMessage()" class="btn-danger" id="deleteBtn">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Load messages
        await this.loadMessages();
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.currentStatus = '';

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update title and filter options
        const tabTitle = document.getElementById('tabTitle');
        const statusFilter = document.getElementById('statusFilter');

        if (tab === 'contact') {
            tabTitle.textContent = 'Mensajes de Contacto';
            statusFilter.innerHTML = `
                <option value="">Todos los mensajes</option>
                <option value="unread">Sin leer</option>
                <option value="read">Leídos</option>
                <option value="replied">Respondidos</option>
            `;
        } else {
            tabTitle.textContent = 'Mensajes de Soporte de Clientes';
            statusFilter.innerHTML = `
                <option value="">Todos los mensajes</option>
                <option value="pending">Pendientes</option>
                <option value="answered">Respondidos</option>
                <option value="closed">Cerrados</option>
            `;
        }

        // Reload messages
        this.loadMessages();
    },

    filterByStatus() {
        this.currentStatus = document.getElementById('statusFilter').value;
        this.loadMessages();
    },

    async loadMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            let url;
            if (this.currentTab === 'contact') {
                url = '/api/super-admin/messages';
            } else {
                url = '/api/super-admin/support/messages';
            }

            if (this.currentStatus) {
                url += `?status=${this.currentStatus}`;
            }

            const data = await superApi.get(url);

            if (!data.data || data.data.length === 0) {
                container.innerHTML = '<p class="empty-state">No hay mensajes</p>';
                return;
            }

            if (this.currentTab === 'contact') {
                container.innerHTML = this.renderMessagesList(data.data);
            } else {
                container.innerHTML = this.renderSupportMessagesList(data.data);
            }

        } catch (error) {
            console.error('Error loading messages:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar los mensajes: ${utils.escapeHtml(error.message)}</p>
                </div>
            `;
        }
    },

    renderMessagesList(messages) {
        return `
            <div class="messages-list">
                ${messages.map(message => {
                    const date = utils.formatDateTime(message.created_at);

                    const statusInfo = this.getStatusInfo(message.status);
                    const isUnread = message.status === 'unread';

                    return `
                        <div
                            class="message-item ${isUnread ? 'message-unread' : ''}"
                            onclick="superMessages.viewMessage(${message.id})"
                        >
                            <div class="message-header">
                                <div class="message-from">
                                    <strong>${utils.escapeHtml(message.name)}</strong>
                                    ${statusInfo.badge}
                                </div>
                                <div class="message-date">${date}</div>
                            </div>
                            <div class="message-contact">
                                📧 ${utils.escapeHtml(message.email)}
                                ${message.phone ? `• 📱 ${utils.escapeHtml(message.phone)}` : ''}
                            </div>
                            <div class="message-preview">
                                ${utils.escapeHtml(message.message.substring(0, 150))}${message.message.length > 150 ? '...' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    getStatusInfo(status) {
        const statusMap = {
            'unread': {
                badge: '<span class="badge badge-warning">Sin leer</span>',
                icon: '📬',
                label: 'Sin leer'
            },
            'read': {
                badge: '<span class="badge badge-info">Leído</span>',
                icon: '📭',
                label: 'Leído'
            },
            'replied': {
                badge: '<span class="badge badge-success">Respondido</span>',
                icon: '✅',
                label: 'Respondido'
            }
        };

        return statusMap[status] || statusMap['unread'];
    },

    async viewMessage(messageId) {
        this.selectedMessage = messageId;

        const modal = document.getElementById('messageDetailsModal');
        const content = document.getElementById('messageDetailsContent');

        modal.style.display = 'flex';
        content.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            // Fetch all messages and find the one we need
            const data = await superApi.get('/api/super-admin/messages');
            const message = data.data.find(m => m.id === messageId);

            if (!message) {
                throw new Error('Mensaje no encontrado');
            }

            const date = utils.formatDateTime(message.created_at);

            const statusInfo = this.getStatusInfo(message.status);

            content.innerHTML = `
                <div class="message-details">
                    <div class="message-detail-header">
                        <div class="message-status-badge">
                            <span style="font-size: 2rem;">${statusInfo.icon}</span>
                            <div>
                                ${statusInfo.badge}
                                <div class="message-detail-date">${date}</div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Información de Contacto</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Nombre:</span>
                                <span class="detail-value">${utils.escapeHtml(message.name)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">
                                    <a href="mailto:${utils.escapeHtml(message.email)}">${utils.escapeHtml(message.email)}</a>
                                </span>
                            </div>
                            ${message.phone ? `
                                <div class="detail-item">
                                    <span class="detail-label">Teléfono:</span>
                                    <span class="detail-value">
                                        <a href="tel:${utils.escapeHtml(message.phone)}">${utils.escapeHtml(message.phone)}</a>
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Mensaje</h3>
                        <div class="message-content">
                            ${utils.escapeHtml(message.message).replace(/\n/g, '<br>')}
                        </div>
                    </div>

                    ${message.updated_at && message.updated_at !== message.created_at ? `
                        <div class="detail-section">
                            <div class="message-meta">
                                Última actualización: ${utils.formatDateTime(message.updated_at)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Update button visibility based on status
            document.getElementById('markReadBtn').style.display =
                message.status === 'unread' ? 'inline-block' : 'none';

            // If the message is unread, automatically mark it as read
            if (message.status === 'unread') {
                setTimeout(() => this.updateMessageStatus(messageId, 'read', false), 1000);
            }

        } catch (error) {
            console.error('Error loading message details:', error);
            content.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar el mensaje: ${utils.escapeHtml(error.message)}</p>
                </div>
            `;
        }
    },

    closeDetailsModal() {
        document.getElementById('messageDetailsModal').style.display = 'none';
        this.selectedMessage = null;
        this.loadMessages(); // Refresh list
    },

    async markAsRead() {
        if (!this.selectedMessage) return;
        await this.updateMessageStatus(this.selectedMessage, 'read', true);
    },

    async markAsReplied() {
        if (!this.selectedMessage) return;
        await this.updateMessageStatus(this.selectedMessage, 'replied', true);
    },

    async updateMessageStatus(messageId, status, showNotification = true) {
        try {
            await superApi.patch(`/api/super-admin/messages/${messageId}`, { status });

            if (showNotification) {
                const statusLabels = {
                    'read': 'leído',
                    'replied': 'respondido'
                };
                this.showNotification(
                    `Mensaje marcado como ${utils.escapeHtml(statusLabels[status] || status)}`,
                    'success'
                );
            }

            // Refresh the message details
            if (document.getElementById('messageDetailsModal').style.display === 'flex') {
                this.viewMessage(messageId);
            }

            // Refresh the list
            this.loadMessages();

        } catch (error) {
            console.error('Error updating message status:', error);
            if (showNotification) {
                this.showNotification(`Error al actualizar el mensaje: ${utils.escapeHtml(error.message)}`, 'error');
            }
        }
    },

    async deleteMessage() {
        if (!this.selectedMessage) return;

        const confirmed = await modal.confirm({
            title: '¿Eliminar mensaje?',
            message: 'Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await superApi.delete(`/api/super-admin/messages/${this.selectedMessage}`);

            this.showNotification('Mensaje eliminado correctamente', 'success');
            this.closeDetailsModal();

        } catch (error) {
            console.error('Error deleting message:', error);
            this.showNotification(`Error al eliminar el mensaje: ${utils.escapeHtml(error.message)}`, 'error');
        }
    },

    renderSupportMessagesList(messages) {
        return `
            <div class="messages-list">
                ${messages.map(msg => {
                    const date = utils.formatDateTime(msg.created_at);

                    const categoryLabels = {
                        'bug': '🐛 Bug',
                        'question': '❓ Pregunta',
                        'suggestion': '💡 Sugerencia',
                        'call_request': '📞 Llamada',
                        'email_request': '📧 Email'
                    };

                    const statusBadges = {
                        'pending': '<span class="badge badge-warning">⏳ Pendiente</span>',
                        'answered': '<span class="badge badge-success">✅ Respondido</span>',
                        'closed': '<span class="badge" style="background: rgba(148, 163, 184, 0.25); color: #cbd5e1;">🔒 Cerrado</span>'
                    };

                    return `
                        <div class="message-item ${msg.status === 'pending' ? 'message-unread' : ''}"
                            onclick="superMessages.viewSupportMessage(${msg.id})">
                            <div class="message-header">
                                <div class="message-from">
                                    <strong>${utils.escapeHtml(msg.business_name || 'Cliente')}</strong>
                                    ${utils.escapeHtml(categoryLabels[msg.category] || msg.category)}
                                    ${statusBadges[msg.status]}
                                </div>
                                <div class="message-date">${date}</div>
                            </div>
                            <div class="message-contact">
                                📧 ${utils.escapeHtml(msg.business_email || 'N/A')}
                                ${msg.business_type ? `• 🏢 ${utils.escapeHtml(msg.business_type)}` : ''}
                            </div>
                            <div class="message-preview">
                                ${utils.escapeHtml(msg.message.substring(0, 150))}${msg.message.length > 150 ? '...' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    async viewSupportMessage(messageId) {
        this.selectedMessage = messageId;

        const modal = document.getElementById('messageDetailsModal');
        const content = document.getElementById('messageDetailsContent');

        modal.style.display = 'flex';
        content.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            // Fetch all support messages and find the one we need
            const data = await superApi.get('/api/super-admin/support/messages');
            const message = data.data.find(m => m.id === messageId);

            if (!message) {
                throw new Error('Mensaje no encontrado');
            }

            const date = utils.formatDateTime(message.created_at);

            const categoryLabels = {
                'bug': '🐛 Bug/Error',
                'question': '❓ Pregunta General',
                'suggestion': '💡 Sugerencia/Mejora',
                'call_request': '📞 Solicitar Llamada',
                'email_request': '📧 Solicitar Email Detallado'
            };

            const statusBadges = {
                'pending': '<span class="badge badge-warning">⏳ Pendiente</span>',
                'answered': '<span class="badge badge-success">✅ Respondido</span>',
                'closed': '<span class="badge" style="background: rgba(148, 163, 184, 0.25); color: #cbd5e1;">🔒 Cerrado</span>'
            };

            content.innerHTML = `
                <div class="message-details">
                    <div class="message-detail-header">
                        <div class="message-status-badge">
                            <span style="font-size: 2rem;">${categoryLabels[message.category].split(' ')[0]}</span>
                            <div>
                                ${statusBadges[message.status]}
                                <div class="message-detail-date">${date}</div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Información del Cliente</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Negocio:</span>
                                <span class="detail-value">${utils.escapeHtml(message.business_name || 'N/A')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Tipo:</span>
                                <span class="detail-value">${utils.escapeHtml(message.business_type || 'N/A')}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">
                                    <a href="mailto:${utils.escapeHtml(message.business_email)}">${utils.escapeHtml(message.business_email)}</a>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Categoría:</span>
                                <span class="detail-value">${utils.escapeHtml(categoryLabels[message.category])}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Mensaje del Cliente</h3>
                        <div class="message-content" style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--primary-color);">
                            ${utils.escapeHtml(message.message).replace(/\n/g, '<br>')}
                        </div>
                        <p style="color: var(--text-tertiary); font-size: 0.85rem; margin-top: 0.5rem;">
                            ${message.word_count} palabras
                        </p>
                    </div>

                    ${message.admin_response ? `
                        <div class="detail-section">
                            <h3>✅ Respuesta Enviada</h3>
                            <div class="message-content" style="background: rgba(77, 83, 255, 0.1); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--primary-color);">
                                ${utils.escapeHtml(message.admin_response).replace(/\n/g, '<br>')}
                            </div>
                            <p style="color: var(--text-tertiary); font-size: 0.85rem; margin-top: 0.5rem;">
                                Respondido por ${utils.escapeHtml(message.answered_by)} el ${utils.formatDateTime(message.answered_at)}
                            </p>
                        </div>
                    ` : message.status !== 'closed' ? `
                        <div class="detail-section">
                            <h3>💬 Escribir Respuesta</h3>
                            <form id="responseForm">
                                <textarea
                                    id="responseText"
                                    rows="6"
                                    placeholder="Escribe aquí tu respuesta al cliente. El cliente recibirá esta respuesta por email y podrá verla en su dashboard..."
                                    style="width: 100%; padding: 1rem; background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 1rem; font-family: inherit; resize: vertical; line-height: 1.5;"
                                    required
                                ></textarea>
                                <p style="color: var(--text-tertiary); font-size: 0.85rem; margin-top: 0.5rem;">
                                    💡 Sé claro y profesional. Esta respuesta se enviará por email al cliente.
                                </p>
                            </form>
                        </div>
                    ` : ''}
                </div>
            `;

            // Update button visibility based on status
            const markReadBtn = document.getElementById('markReadBtn');
            const markRepliedBtn = document.getElementById('markRepliedBtn');
            const deleteBtn = document.getElementById('deleteBtn');

            // Hide "Mark as read" button (not applicable for support messages)
            if (markReadBtn) markReadBtn.style.display = 'none';

            // Show/hide respond button
            if (markRepliedBtn) {
                if (message.status === 'pending') {
                    markRepliedBtn.style.display = 'inline-block';
                    markRepliedBtn.innerHTML = '📤 Enviar Respuesta';
                    markRepliedBtn.onclick = () => this.sendSupportResponse();
                } else if (message.status === 'answered') {
                    markRepliedBtn.style.display = 'inline-block';
                    markRepliedBtn.innerHTML = '🔒 Cerrar Mensaje';
                    markRepliedBtn.onclick = () => this.closeSupportMessage();
                } else {
                    markRepliedBtn.style.display = 'none';
                }
            }

            // Delete button always visible
            if (deleteBtn) {
                deleteBtn.style.display = 'inline-block';
            }

        } catch (error) {
            console.error('Error loading support message details:', error);
            content.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar el mensaje: ${utils.escapeHtml(error.message)}</p>
                </div>
            `;
        }
    },

    async sendSupportResponse() {
        if (!this.selectedMessage) return;

        const responseText = document.getElementById('responseText');
        if (!responseText) return;

        const response = responseText.value.trim();

        if (!response) {
            this.showNotification('Por favor, escribe una respuesta antes de enviar', 'error');
            return;
        }

        if (response.length < 10) {
            this.showNotification('La respuesta es demasiado corta. Proporciona más detalles.', 'error');
            return;
        }

        try {
            await superApi.patch(`/api/super-admin/support/messages/${this.selectedMessage}/respond`, {
                response: response
            });

            this.showNotification('✅ Respuesta enviada correctamente. El cliente la verá en su dashboard.', 'success');

            // Reload message details to show the response
            setTimeout(() => {
                this.viewSupportMessage(this.selectedMessage);
            }, 1500);

            // Refresh the list
            this.loadMessages();

        } catch (error) {
            console.error('Error sending response:', error);
            this.showNotification(`Error al enviar respuesta: ${utils.escapeHtml(error.message)}`, 'error');
        }
    },

    async closeSupportMessage() {
        if (!this.selectedMessage) return;

        const confirmed = await modal.confirm({
            title: '¿Cerrar mensaje de soporte?',
            message: 'Esta acción no se puede deshacer. El mensaje será marcado como cerrado.',
            confirmText: 'Sí, cerrar',
            cancelText: 'Cancelar',
            type: 'warning'
        });

        if (!confirmed) return;

        try {
            await superApi.patch(`/api/super-admin/support/messages/${this.selectedMessage}/close`);

            this.showNotification('Mensaje cerrado correctamente', 'success');
            this.closeDetailsModal();

        } catch (error) {
            console.error('Error closing message:', error);
            this.showNotification(`Error al cerrar el mensaje: ${utils.escapeHtml(error.message)}`, 'error');
        }
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

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};
