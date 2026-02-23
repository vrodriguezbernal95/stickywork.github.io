// Team Management Module

const team = {
    users: [],
    planInfo: null,
    currentPage: 1,
    itemsPerPage: 50,
    _container: null,

    // Devuelve el contenedor activo (settings tab o contentArea)
    _getContainer() {
        if (this._container && document.contains(this._container)) {
            return this._container;
        }
        this._container = null;
        return document.getElementById('contentArea');
    },

    // Load team data and render
    async load() {
        const contentArea = this._getContainer();
        if (!this._container) {
            document.getElementById('pageTitle').textContent = 'Gestión del Equipo';
        }

        contentArea.innerHTML = `
            <div class="loading">
                <p>Cargando equipo...</p>
            </div>
        `;

        try {
            await this.loadTeamData();
            this.render();
        } catch (error) {
            console.error('Error loading team:', error);
            this._getContainer().innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Error al cargar el equipo</p>
                </div>
            `;
        }
    },

    // Load team data from API
    async loadTeamData() {
        const businessId = auth.getBusinessId();

        // Load team members
        const teamData = await api.get(`/api/team/${businessId}`);
        this.users = teamData.users;

        // Load plan info to check limits
        const planData = await api.get(`/api/business/${businessId}/plan`);
        this.planInfo = planData.plan;
    },

    // Render team management UI
    render() {
        const contentArea = this._getContainer();
        const currentUser = auth.userData;
        const isOwner = currentUser.role === 'owner';

        // Calculate usage
        const maxUsers = this.planInfo?.limits?.maxUsers || null;
        const currentUsers = this.users.length;
        const usageText = maxUsers ? `${currentUsers}/${maxUsers} usuarios` : `${currentUsers} usuarios`;
        const limitReached = maxUsers && currentUsers >= maxUsers;

        contentArea.innerHTML = `
            <div class="team-container">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2 style="margin: 0 0 0.5rem 0;">Equipo de ${auth.userData.businessName || 'tu negocio'}</h2>
                        <span class="team-usage-badge ${limitReached ? 'limit-reached' : ''}">${usageText}</span>
                    </div>
                    ${isOwner ? `
                        <button id="addUserBtn" class="btn-primary" onclick="team.openCreateModal()" ${limitReached ? 'disabled title="Límite de usuarios alcanzado"' : ''}>
                            ➕ Agregar Usuario
                        </button>
                    ` : ''}
                </div>

                ${limitReached && isOwner ? `
                    <div class="warning-banner" style="margin-bottom: 2rem;">
                        <strong>⚠️ Límite alcanzado:</strong> Has alcanzado el límite de ${maxUsers} usuarios de tu plan.
                        <a href="#" onclick="app.navigateTo('settings'); return false;">Actualiza tu plan</a> para agregar más usuarios.
                    </div>
                ` : ''}

                <!-- Users Table -->
                ${this.renderUserTable()}
            </div>
        `;
    },

    // Render users table
    renderUserTable() {
        if (this.users.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>No hay usuarios en el equipo</p>
                </div>
            `;
        }

        const currentUser = auth.userData;
        const isOwner = currentUser.role === 'owner';

        const rows = this.users.map(user => {
            const roleLabel = {
                'owner': '👑 Propietario',
                'admin': '👔 Administrador',
                'staff': '👤 Personal'
            }[user.role] || user.role;

            const statusBadge = user.is_active
                ? '<span class="status-badge status-active">✅ Activo</span>'
                : '<span class="status-badge status-inactive">⏸️ Inactivo</span>';

            const lastLogin = user.last_login
                ? new Date(user.last_login).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Nunca';

            const isCurrentUser = user.id === currentUser.id;
            const canManage = isOwner && user.role !== 'owner' && !isCurrentUser;

            return `
                <tr>
                    <td>
                        <strong>${user.full_name}</strong>
                        ${isCurrentUser ? '<span style="color: var(--primary-color); font-size: 0.85rem;"> (Tú)</span>' : ''}
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge role-${user.role}">${roleLabel}</span>
                    </td>
                    <td>${statusBadge}</td>
                    <td style="color: var(--text-secondary); font-size: 0.9rem;">${lastLogin}</td>
                    <td>
                        ${canManage ? `
                            <div class="actions-dropdown">
                                <button class="btn-icon" onclick="team.openEditModal(${user.id})">✏️ Editar</button>
                                <button class="btn-icon" onclick="team.confirmResetPassword(${user.id}, '${user.full_name.replace(/'/g, "\\'")}', '${user.email}')">🔐 Reset Password</button>
                                ${user.is_active ? `
                                    <button class="btn-icon" onclick="team.confirmDeactivate(${user.id}, '${user.full_name.replace(/'/g, "\\'")}')">⏸️ Desactivar</button>
                                ` : `
                                    <button class="btn-icon" onclick="team.confirmReactivate(${user.id}, '${user.full_name.replace(/'/g, "\\'")}')">▶️ Reactivar</button>
                                `}
                                <button class="btn-icon btn-danger" onclick="team.confirmDelete(${user.id}, '${user.full_name.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>
                            </div>
                        ` : user.role === 'owner' ? '<span style="color: var(--text-secondary);">—</span>' : '<span style="color: var(--text-secondary);">Sin permisos</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Open create user modal
    openCreateModal() {
        const modalHTML = `
            <div id="createUserModal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Agregar Usuario al Equipo</h2>
                        <button class="modal-close" onclick="team.closeCreateModal()">&times;</button>
                    </div>
                    <form id="createUserForm" onsubmit="team.createUser(event); return false;">
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Nombre completo *</label>
                                <input type="text" id="fullName" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Email *</label>
                                <input type="email" id="email" class="form-input" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Contraseña *</label>
                                <input type="password" id="password" class="form-input" minlength="8" required>
                                <small style="color: var(--text-secondary); font-size: 0.85rem;">Mínimo 8 caracteres</small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Rol *</label>
                                <select id="role" class="form-input" required>
                                    <option value="">Selecciona un rol</option>
                                    <option value="admin">👔 Administrador</option>
                                    <option value="staff">👤 Personal</option>
                                </select>
                                <small style="color: var(--text-secondary); font-size: 0.85rem;">
                                    Admin: Gestiona reservas y servicios. Staff: Solo ve reservas.
                                </small>
                            </div>

                            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                                <small style="color: var(--text-secondary);">
                                    ℹ️ Se enviará un email automático al usuario con sus credenciales de acceso.
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="team.closeCreateModal()">Cancelar</button>
                            <button type="submit" class="btn-primary">Crear Usuario</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    closeCreateModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) modal.remove();
    },

    // Create user
    async createUser(event) {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            await api.post('/api/team', {
                businessId: auth.getBusinessId(),
                fullName,
                email,
                password,
                role
            });

            this.closeCreateModal();
            modal.toast('Usuario creado exitosamente. Se ha enviado un email con las credenciales.', 'success');
            await this.load(); // Reload team
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMsg = error.message || 'Error al crear usuario';

            // Si es error de límite de plan, mostrar mensaje más claro con opción de mejorar
            if (errorMsg.includes('límite') || errorMsg.includes('plan')) {
                const wantsUpgrade = await modal.confirm({
                    title: 'Límite de usuarios alcanzado',
                    message: `${errorMsg}\n\nPara añadir más usuarios, necesitas mejorar tu plan.`,
                    confirmText: '🚀 Mejorar Plan',
                    cancelText: 'Cerrar',
                    type: 'warning'
                });

                if (wantsUpgrade) {
                    window.location.href = 'planes.html';
                }
            } else {
                modal.toast({ message: errorMsg, type: 'error' });
            }
        }
    },

    // Open edit user modal
    openEditModal(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modalHTML = `
            <div id="editUserModal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Editar Usuario</h2>
                        <button class="modal-close" onclick="team.closeEditModal()">&times;</button>
                    </div>
                    <form id="editUserForm" onsubmit="team.updateUser(${userId}, event); return false;">
                        <div class="modal-body">
                            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                                <strong>${user.full_name}</strong><br>
                                <small style="color: var(--text-secondary);">${user.email}</small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Rol *</label>
                                <select id="editRole" class="form-input" required>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>👔 Administrador</option>
                                    <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>👤 Personal</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label style="display: flex; align-items: center; cursor: pointer;">
                                    <input type="checkbox" id="editIsActive" ${user.is_active ? 'checked' : ''} style="margin-right: 0.5rem;">
                                    <span>Usuario activo</span>
                                </label>
                                <small style="color: var(--text-secondary); font-size: 0.85rem;">
                                    Los usuarios inactivos no pueden iniciar sesión
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="team.closeEditModal()">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    closeEditModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) modal.remove();
    },

    // Update user
    async updateUser(userId, event) {
        event.preventDefault();

        const role = document.getElementById('editRole').value;
        const is_active = document.getElementById('editIsActive').checked;

        try {
            await api.patch(`/api/team/${userId}`, {
                role,
                is_active
            });

            this.closeEditModal();
            modal.toast('Usuario actualizado exitosamente', 'success');
            await this.load(); // Reload team
        } catch (error) {
            console.error('Error updating user:', error);
            modal.toast(error.response?.data?.message || 'Error al actualizar usuario', 'error');
        }
    },

    // Confirm delete user
    async confirmDelete(userId, userName) {
        const confirmed = await modal.confirm(
            `¿Eliminar a ${userName}?`,
            'Esta acción es permanente y no se puede deshacer. Se eliminará toda la información asociada a este usuario.'
        );

        if (confirmed) {
            await this.deleteUser(userId);
        }
    },

    // Delete user
    async deleteUser(userId) {
        try {
            await api.delete(`/api/team/${userId}`);
            modal.toast('Usuario eliminado exitosamente', 'success');
            await this.load(); // Reload team
        } catch (error) {
            console.error('Error deleting user:', error);
            modal.toast(error.response?.data?.message || 'Error al eliminar usuario', 'error');
        }
    },

    // Confirm deactivate user
    async confirmDeactivate(userId, userName) {
        const confirmed = await modal.confirm(
            `¿Desactivar a ${userName}?`,
            'El usuario no podrá iniciar sesión hasta que sea reactivado. Puedes reactivarlo en cualquier momento.'
        );

        if (confirmed) {
            await this.updateUserStatus(userId, false);
        }
    },

    // Confirm reactivate user
    async confirmReactivate(userId, userName) {
        const confirmed = await modal.confirm(
            `¿Reactivar a ${userName}?`,
            'El usuario podrá volver a iniciar sesión en el panel de administración.'
        );

        if (confirmed) {
            await this.updateUserStatus(userId, true);
        }
    },

    // Update user status (active/inactive)
    async updateUserStatus(userId, isActive) {
        try {
            await api.patch(`/api/team/${userId}`, {
                is_active: isActive
            });

            modal.toast(`Usuario ${isActive ? 'reactivado' : 'desactivado'} exitosamente`, 'success');
            await this.load(); // Reload team
        } catch (error) {
            console.error('Error updating user status:', error);
            modal.toast(error.response?.data?.message || 'Error al actualizar estado', 'error');
        }
    },

    // Confirm reset password
    async confirmResetPassword(userId, userName, userEmail) {
        const confirmed = await modal.confirm(
            `¿Resetear contraseña de ${userName}?`,
            `Se enviará un email a ${userEmail} con un link para crear una nueva contraseña.`
        );

        if (confirmed) {
            await this.resetPassword(userId);
        }
    },

    // Reset user password
    async resetPassword(userId) {
        try {
            await api.post(`/api/team/${userId}/reset-password`);
            modal.toast('Email de reset enviado exitosamente', 'success');
        } catch (error) {
            console.error('Error resetting password:', error);
            modal.toast(error.response?.data?.message || 'Error al enviar email de reset', 'error');
        }
    }
};

// Export
window.team = team;
