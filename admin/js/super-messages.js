// Super Admin Messages Module
const superMessages = {
    currentStatus: '',
    selectedMessage: null,

    async load() {
        // Update page title
        document.getElementById('pageTitle').textContent = 'Mensajes';

        // Render layout
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Mensajes de Contacto</h3>
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

    filterByStatus() {
        this.currentStatus = document.getElementById('statusFilter').value;
        this.loadMessages();
    },

    async loadMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '<div class="loading">Cargando...</div>';

        try {
            let url = '/api/super-admin/messages';
            if (this.currentStatus) {
                url += `?status=${this.currentStatus}`;
            }

            const data = await superApi.get(url);

            if (!data.data || data.data.length === 0) {
                container.innerHTML = '<p class="empty-state">No hay mensajes</p>';
                return;
            }

            container.innerHTML = this.renderMessagesList(data.data);

        } catch (error) {
            console.error('Error loading messages:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Error al cargar los mensajes: ${error.message}</p>
                </div>
            `;
        }
    },

    renderMessagesList(messages) {
        return `
            <div class="messages-list">
                ${messages.map(message => {
                    const date = new Date(message.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const statusInfo = this.getStatusInfo(message.status);
                    const isUnread = message.status === 'unread';

                    return `
                        <div
                            class="message-item ${isUnread ? 'message-unread' : ''}"
                            onclick="superMessages.viewMessage(${message.id})"
                        >
                            <div class="message-header">
                                <div class="message-from">
                                    <strong>${message.name}</strong>
                                    ${statusInfo.badge}
                                </div>
                                <div class="message-date">${date}</div>
                            </div>
                            <div class="message-contact">
                                📧 ${message.email}
                                ${message.phone ? `• 📱 ${message.phone}` : ''}
                            </div>
                            <div class="message-preview">
                                ${message.message.substring(0, 150)}${message.message.length > 150 ? '...' : ''}
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

            const date = new Date(message.created_at).toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

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
                                <span class="detail-value">${message.name}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">
                                    <a href="mailto:${message.email}">${message.email}</a>
                                </span>
                            </div>
                            ${message.phone ? `
                                <div class="detail-item">
                                    <span class="detail-label">Teléfono:</span>
                                    <span class="detail-value">
                                        <a href="tel:${message.phone}">${message.phone}</a>
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Mensaje</h3>
                        <div class="message-content">
                            ${message.message.replace(/\n/g, '<br>')}
                        </div>
                    </div>

                    ${message.updated_at && message.updated_at !== message.created_at ? `
                        <div class="detail-section">
                            <div class="message-meta">
                                Última actualización: ${new Date(message.updated_at).toLocaleString('es-ES')}
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
                    <p>⚠️ Error al cargar el mensaje: ${error.message}</p>
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
                    `Mensaje marcado como ${statusLabels[status] || status}`,
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
                this.showNotification(`Error al actualizar el mensaje: ${error.message}`, 'error');
            }
        }
    },

    async deleteMessage() {
        if (!this.selectedMessage) return;

        if (!confirm('¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await superApi.delete(`/api/super-admin/messages/${this.selectedMessage}`);

            this.showNotification('Mensaje eliminado correctamente', 'success');
            this.closeDetailsModal();

        } catch (error) {
            console.error('Error deleting message:', error);
            this.showNotification(`Error al eliminar el mensaje: ${error.message}`, 'error');
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
