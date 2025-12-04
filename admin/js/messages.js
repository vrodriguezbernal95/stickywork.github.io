// Messages Module

const messages = {
    // Load all messages
    async load() {
        const contentArea = document.getElementById('contentArea');
        document.getElementById('pageTitle').textContent = 'Mensajes de Contacto';

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando mensajes...</p>
            </div>
        `;

        try {
            const data = await api.get('/api/contact');
            const messagesList = data.data;

            // Count messages by status
            const unreadCount = messagesList.filter(m => m.status === 'unread').length;
            const readCount = messagesList.filter(m => m.status === 'read').length;
            const repliedCount = messagesList.filter(m => m.status === 'replied').length;

            contentArea.innerHTML = `
                <!-- Stats Cards -->
                <div class="stats-grid" style="margin-bottom: 2rem;">
                    ${createStatCard({
                        icon: '📬',
                        value: unreadCount,
                        label: 'No Leídos',
                        iconBg: 'rgba(239, 68, 68, 0.1)'
                    })}

                    ${createStatCard({
                        icon: '📭',
                        value: readCount,
                        label: 'Leídos',
                        iconBg: 'rgba(59, 130, 246, 0.1)'
                    })}

                    ${createStatCard({
                        icon: '✅',
                        value: repliedCount,
                        label: 'Respondidos',
                        iconBg: 'rgba(34, 197, 94, 0.1)'
                    })}

                    ${createStatCard({
                        icon: '📊',
                        value: messagesList.length,
                        label: 'Total Mensajes',
                        iconBg: 'rgba(139, 92, 246, 0.1)'
                    })}
                </div>

                <!-- Messages List -->
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">Todos los Mensajes</div>
                    </div>

                    ${messagesList.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <p>No hay mensajes todavía</p>
                        </div>
                    ` : `
                        <div style="display: grid; gap: 1rem;">
                            ${messagesList.map(msg => this.renderMessage(msg)).join('')}
                        </div>
                    `}
                </div>
            `;
        } catch (error) {
            console.error('Error loading messages:', error);
            contentArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar los mensajes</p>
                </div>
            `;
        }
    },

    // Render a single message card
    renderMessage(msg) {
        const borderColor = msg.status === 'unread' ? '#ef4444' :
                           msg.status === 'replied' ? '#22c55e' : '#3b82f6';

        const statusBadgeStyle = msg.status === 'unread' ? 'background: rgba(239, 68, 68, 0.1); color: #ef4444;' :
                                msg.status === 'read' ? 'background: rgba(59, 130, 246, 0.1); color: #3b82f6;' :
                                'background: rgba(34, 197, 94, 0.1); color: #22c55e;';

        return `
            <div class="feature-card" style="text-align: left; border-left: 4px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${msg.name}</h3>
                        <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: var(--text-secondary); flex-wrap: wrap;">
                            <span>📧 ${msg.email}</span>
                            ${msg.phone ? `<span>📞 ${msg.phone}</span>` : ''}
                            <span>📅 ${new Date(msg.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                    </div>
                    <span class="status-badge status-${msg.status}" style="${statusBadgeStyle}">
                        ${this.getStatusLabel(msg.status)}
                    </span>
                </div>

                ${msg.business_name ? `
                    <div style="margin-bottom: 0.5rem;">
                        <strong>Negocio:</strong> ${msg.business_name}
                        ${msg.business_type ? `<span style="color: var(--text-secondary);"> (${msg.business_type})</span>` : ''}
                    </div>
                ` : ''}

                ${msg.interest ? `
                    <div style="margin-bottom: 0.5rem;">
                        <strong>Interés:</strong>
                        <span style="background: rgba(59, 130, 246, 0.1); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; color: var(--primary-color);">
                            ${msg.interest}
                        </span>
                    </div>
                ` : ''}

                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                    <strong style="display: block; margin-bottom: 0.5rem;">Mensaje:</strong>
                    <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${msg.message}</p>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    ${msg.status === 'unread' ? `
                        <button class="btn-small btn-primary-small" onclick="messages.markAs(${msg.id}, 'read')">
                            Marcar como Leído
                        </button>
                    ` : ''}
                    ${msg.status !== 'replied' ? `
                        <button class="btn-small btn-primary-small" onclick="messages.markAs(${msg.id}, 'replied')">
                            Marcar como Respondido
                        </button>
                    ` : ''}
                    <button class="btn-small" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="messages.delete(${msg.id})">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    },

    // Mark message as read/replied
    async markAs(messageId, status) {
        try {
            await api.patch(`/api/contact/${messageId}`, { status });
            // Reload messages to update UI
            this.load();
        } catch (error) {
            console.error('Error updating message:', error);
            alert('Error al actualizar el mensaje');
        }
    },

    // Delete message
    async delete(messageId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
            return;
        }

        try {
            await api.delete(`/api/contact/${messageId}`);
            // Reload messages to update UI
            this.load();
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Error al eliminar el mensaje');
        }
    },

    // Get status label in Spanish
    getStatusLabel(status) {
        const labels = {
            'unread': 'No leído',
            'read': 'Leído',
            'replied': 'Respondido'
        };
        return labels[status] || status;
    }
};

// Export
window.messages = messages;
