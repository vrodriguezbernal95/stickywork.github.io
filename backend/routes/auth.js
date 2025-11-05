const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken, requireAuth } = require('../middleware/auth');

// Permitir inyección de la base de datos
let db = require('../../config/database');

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

// ==================== REGISTRO ====================

/**
 * POST /api/auth/register
 * Registrar un nuevo administrador
 */
router.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, fullName, businessId, role } = req.body;

        // Validaciones
        if (!email || !password || !fullName || !businessId) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await db.query(
            'SELECT id FROM admin_users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Verificar que el negocio existe
        const business = await db.query(
            'SELECT id FROM businesses WHERE id = ?',
            [businessId]
        );

        if (business.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const result = await db.query(
            `INSERT INTO admin_users (business_id, email, password_hash, full_name, role)
             VALUES (?, ?, ?, ?, ?)`,
            [businessId, email, passwordHash, fullName, role || 'admin']
        );

        // Obtener usuario creado (sin password)
        const [newUser] = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active, created_at
             FROM admin_users WHERE id = ?`,
            [result.insertId]
        );

        // Generar token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: newUser,
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});

// ==================== LOGIN ====================

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        }

        // Buscar usuario
        const users = await db.query(
            `SELECT id, business_id, email, password_hash, full_name, role, is_active
             FROM admin_users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const user = users[0];

        // Verificar si el usuario está activo
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Actualizar último login
        await db.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Eliminar password_hash antes de enviar
        delete user.password_hash;

        // Generar token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
});

// ==================== VERIFICAR TOKEN ====================

/**
 * GET /api/auth/verify
 * Verificar si el token es válido y obtener usuario actual
 */
router.get('/api/auth/verify', requireAuth, async (req, res) => {
    try {
        // El middleware requireAuth ya verificó el token
        // y agregó req.user con los datos del payload

        // Obtener datos actualizados del usuario
        const users = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active, last_login, created_at
             FROM admin_users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar token',
            error: error.message
        });
    }
});

// ==================== LOGOUT ====================

/**
 * POST /api/auth/logout
 * Cerrar sesión (en el frontend se elimina el token)
 */
router.post('/api/auth/logout', requireAuth, (req, res) => {
    // En un sistema JWT stateless, el logout es del lado del cliente
    // Simplemente elimina el token del localStorage/cookie

    // Aquí podríamos registrar el logout en logs si fuera necesario
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

// ==================== CAMBIAR CONTRASEÑA ====================

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario actual
 */
router.post('/api/auth/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva son obligatorias'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario con password
        const users = await db.query(
            'SELECT password_hash FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hash de la nueva contraseña
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await db.query(
            'UPDATE admin_users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
});

module.exports = router;
