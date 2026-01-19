const express = require('express');
const router = express.Router();
const db = require('../services/db');
const bcrypt = require('bcrypt');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateUsersLimit } = require('../middleware/entitlements');
const crypto = require('crypto');

// Importar funciones de email
const { sendTeamMemberWelcome, sendRoleChangedEmail, sendDeactivationEmail, sendPasswordResetEmail } = require('../email-service');

/**
 * GET /api/team/:businessId
 * Listar todos los usuarios del equipo de un negocio
 * Acceso: Owner y Admin
 */
router.get('/api/team/:businessId', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId !== parseInt(businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a este negocio'
            });
        }

        // Obtener todos los usuarios del negocio
        const users = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active,
                    last_login, created_at, two_factor_enabled
             FROM admin_users
             WHERE business_id = ?
             ORDER BY
                CASE role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'staff' THEN 3
                END,
                created_at ASC`,
            [businessId]
        );

        res.json({
            success: true,
            users: users
        });

    } catch (error) {
        console.error('Error al obtener usuarios del equipo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios del equipo'
        });
    }
});

/**
 * POST /api/team
 * Crear nuevo usuario en el equipo
 * Acceso: Solo Owner
 */
router.post('/api/team', requireAuth, requireRole('owner'), validateUsersLimit, async (req, res) => {
    try {
        const { businessId, email, password, fullName, role } = req.body;

        // Validar que el owner tiene acceso a este negocio
        if (req.user.businessId !== parseInt(businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para gestionar este negocio'
            });
        }

        // Validaciones básicas
        if (!email || !password || !fullName || !role) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // No permitir crear role='owner'
        if (role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'No se pueden crear más propietarios. Solo puede haber un propietario por negocio.'
            });
        }

        // Validar roles válidos
        const validRoles = ['admin', 'staff'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Solo se permite: admin o staff'
            });
        }

        // Validar contraseña
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // Verificar que el email no exista
        const existingUser = await db.query(
            'SELECT id FROM admin_users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const result = await db.query(
            `INSERT INTO admin_users
             (business_id, email, password_hash, full_name, role, is_active)
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [businessId, email, hashedPassword, fullName, role]
        );

        // Obtener usuario creado
        const newUser = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active, created_at
             FROM admin_users WHERE id = ?`,
            [result.insertId]
        );

        // Obtener datos del negocio para el email
        const business = await db.query(
            'SELECT name, email as business_email FROM businesses WHERE id = ?',
            [businessId]
        );

        // Enviar email de bienvenida con credenciales
        await sendTeamMemberWelcome(newUser[0], business[0], password);

        res.status(201).json({
            success: true,
            message: `Usuario creado exitosamente. Se ha enviado un email a ${email} con las credenciales.`,
            user: newUser[0]
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario'
        });
    }
});

/**
 * PATCH /api/team/:userId
 * Actualizar usuario del equipo (rol o estado)
 * Acceso: Solo Owner
 */
router.patch('/api/team/:userId', requireAuth, requireRole('owner'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, is_active } = req.body;

        // Obtener usuario a modificar
        const userToUpdate = await db.query(
            'SELECT id, business_id, email, full_name, role, is_active FROM admin_users WHERE id = ?',
            [userId]
        );

        if (userToUpdate.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = userToUpdate[0];

        // Verificar que el owner tiene acceso a este negocio
        if (req.user.businessId !== user.business_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar este usuario'
            });
        }

        // No permitir editar al owner
        if (user.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'No se puede modificar al propietario del negocio'
            });
        }

        // No permitir que el owner se modifique a sí mismo
        if (req.user.id === parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'No puedes modificar tu propio usuario'
            });
        }

        // Construir update dinámico
        const updates = [];
        const values = [];

        if (role !== undefined) {
            // Validar rol
            const validRoles = ['admin', 'staff'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rol inválido. Solo se permite: admin o staff'
                });
            }
            updates.push('role = ?');
            values.push(role);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se especificaron cambios'
            });
        }

        // Actualizar
        values.push(userId);
        await db.query(
            `UPDATE admin_users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        // Obtener usuario actualizado
        const updatedUser = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active, updated_at
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        // Obtener datos del negocio y owner
        const business = await db.query(
            'SELECT name FROM businesses WHERE id = ?',
            [user.business_id]
        );

        const owner = await db.query(
            'SELECT full_name FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        // Enviar email de notificación según el cambio
        if (role && role !== user.role) {
            await sendRoleChangedEmail(updatedUser[0], business[0], role, owner[0].full_name);
        }
        if (is_active === false && user.is_active === true) {
            await sendDeactivationEmail(updatedUser[0], business[0], null);
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
});

/**
 * DELETE /api/team/:userId
 * Eliminar usuario del equipo permanentemente
 * Acceso: Solo Owner
 */
router.delete('/api/team/:userId', requireAuth, requireRole('owner'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Obtener usuario a eliminar
        const userToDelete = await db.query(
            'SELECT id, business_id, email, full_name, role FROM admin_users WHERE id = ?',
            [userId]
        );

        if (userToDelete.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = userToDelete[0];

        // Verificar que el owner tiene acceso a este negocio
        if (req.user.businessId !== user.business_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este usuario'
            });
        }

        // No permitir eliminar al owner
        if (user.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'No se puede eliminar al propietario del negocio'
            });
        }

        // No permitir que el owner se elimine a sí mismo
        if (req.user.id === parseInt(userId)) {
            return res.status(403).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        // Eliminar usuario (CASCADE eliminará sus refresh_tokens, etc.)
        await db.query('DELETE FROM admin_users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: `Usuario ${user.full_name} eliminado exitosamente`
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
});

/**
 * POST /api/team/:userId/reset-password
 * Generar link de reset de contraseña para un usuario del equipo
 * Acceso: Solo Owner
 */
router.post('/api/team/:userId/reset-password', requireAuth, requireRole('owner'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Obtener usuario
        const userResult = await db.query(
            'SELECT id, business_id, email, full_name, role FROM admin_users WHERE id = ?',
            [userId]
        );

        if (userResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = userResult[0];

        // Verificar que el owner tiene acceso a este negocio
        if (req.user.businessId !== user.business_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para resetear la contraseña de este usuario'
            });
        }

        // No permitir resetear password del owner
        if (user.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'No se puede resetear la contraseña del propietario'
            });
        }

        // Generar token de reset (igual que en forgot-password)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Guardar token en base de datos
        await db.query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [user.id, hashedToken, expiresAt, req.ip, req.get('user-agent') || 'unknown']
        );

        // Enviar email con link de reset
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
        await sendPasswordResetEmail(user, resetToken, resetUrl);

        res.json({
            success: true,
            message: `Se ha enviado un email a ${user.email} con instrucciones para resetear su contraseña`
        });

    } catch (error) {
        console.error('Error al generar reset de contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar link de reset de contraseña'
        });
    }
});

module.exports = router;
