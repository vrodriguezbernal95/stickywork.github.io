const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken, requireAuth } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rate-limit');

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

// ==================== REGISTRO DE NEGOCIO COMPLETO ====================

/**
 * POST /api/auth/register-business
 * Registrar un nuevo negocio con su administrador
 * Este es el endpoint principal para el flujo de registro público
 */
router.post('/api/auth/register-business', registerLimiter, async (req, res) => {
    try {
        const {
            // Datos del negocio
            businessType,
            businessName,
            businessEmail,
            businessPhone,
            businessAddress,
            businessWebsite,
            // Datos del admin
            adminName,
            adminEmail,
            adminPassword
        } = req.body;

        // Validaciones
        if (!businessType || !businessName || !businessEmail) {
            return res.status(400).json({
                success: false,
                error: 'Nombre del negocio, email y tipo son obligatorios'
            });
        }

        if (!adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y contraseña del administrador son obligatorios'
            });
        }

        // Validar formato de emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(businessEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email del negocio inválido'
            });
        }
        if (!emailRegex.test(adminEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email del administrador inválido'
            });
        }

        // Validar contraseña
        if (adminPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        // Verificar si el email del negocio ya existe
        const existingBusiness = await db.query(
            'SELECT id FROM businesses WHERE email = ?',
            [businessEmail]
        );

        if (existingBusiness.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un negocio con este email'
            });
        }

        // Verificar si el email del admin ya existe
        const existingUser = await db.query(
            'SELECT id FROM admin_users WHERE email = ?',
            [adminEmail]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya existe una cuenta con este email de administrador'
            });
        }

        // Obtener información del tipo de negocio
        const businessTypes = await db.query(
            'SELECT * FROM business_types WHERE type_key = ?',
            [businessType]
        );

        const typeInfo = businessTypes.length > 0 ? businessTypes[0] : {
            type_key: 'other',
            type_name: 'Otro',
            booking_mode: 'simple',
            default_services: '[]'
        };

        // Generar slug único
        const baseSlug = businessName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let slug = baseSlug;
        let slugCounter = 1;
        while (true) {
            const existingSlug = await db.query(
                'SELECT id FROM businesses WHERE slug = ?',
                [slug]
            );
            if (existingSlug.length === 0) break;
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }

        // Calcular fecha de fin de prueba (14 días)
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 14);

        // Crear el negocio
        const businessResult = await db.query(
            `INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?, FALSE, ?, ?)`,
            [
                businessName,
                slug,
                typeInfo.type_key,
                typeInfo.type_name,
                businessEmail,
                businessPhone || null,
                businessAddress || null,
                businessWebsite || null,
                trialEnds,
                JSON.stringify({
                    primaryColor: '#3b82f6',
                    secondaryColor: '#ef4444',
                    language: 'es',
                    showPrices: true,
                    showDuration: true
                }),
                JSON.stringify({
                    workDays: [1, 2, 3, 4, 5, 6],
                    workHoursStart: '09:00',
                    workHoursEnd: '20:00',
                    slotDuration: 30,
                    minAdvanceHours: 2,
                    maxAdvanceDays: 30
                })
            ]
        );

        const businessId = businessResult.insertId;

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Crear usuario administrador
        const userResult = await db.query(
            `INSERT INTO admin_users (business_id, email, password_hash, full_name, role)
             VALUES (?, ?, ?, ?, 'owner')`,
            [businessId, adminEmail, passwordHash, adminName]
        );

        const userId = userResult.insertId;

        // Crear servicios por defecto según el tipo de negocio
        if (typeInfo.default_services) {
            try {
                const defaultServices = JSON.parse(typeInfo.default_services);
                for (const service of defaultServices) {
                    await db.query(
                        `INSERT INTO services (business_id, name, duration, price, capacity, is_active)
                         VALUES (?, ?, ?, ?, ?, TRUE)`,
                        [
                            businessId,
                            service.name,
                            service.duration || 30,
                            service.price || 0,
                            service.capacity || 1
                        ]
                    );
                }
            } catch (e) {
                console.log('No se pudieron crear servicios por defecto:', e.message);
            }
        }

        // Obtener datos del usuario creado
        const [newUser] = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active, created_at
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        // Obtener datos del negocio creado
        const [newBusiness] = await db.query(
            `SELECT id, name, slug, type_key, type, email, phone, address, website,
                    subscription_status, trial_ends_at, onboarding_completed,
                    widget_settings, booking_settings, created_at
             FROM businesses WHERE id = ?`,
            [businessId]
        );

        // Generar token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'Negocio y cuenta creados exitosamente',
            token,
            user: newUser,
            business: newBusiness
        });

    } catch (error) {
        console.error('Error en registro de negocio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear el negocio. Por favor, inténtalo de nuevo.'
        });
    }
});

// ==================== OBTENER TIPOS DE NEGOCIO ====================

/**
 * GET /api/auth/business-types
 * Obtener lista de tipos de negocio disponibles (público)
 */
router.get('/api/auth/business-types', async (req, res) => {
    try {
        const types = await db.query(
            `SELECT type_key, type_name, icon, description, booking_mode
             FROM business_types
             WHERE is_active = TRUE
             ORDER BY display_order ASC`
        );

        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        console.error('Error al obtener tipos de negocio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener tipos de negocio'
        });
    }
});

// ==================== LOGIN ====================

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/api/auth/login', loginLimiter, async (req, res) => {
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

// ==================== RECUPERACIÓN DE CONTRASEÑA ====================

const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../email-service');

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 */
router.post('/api/auth/forgot-password', loginLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        // Validación
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El email es obligatorio'
            });
        }

        // Buscar usuario
        const users = await db.query(
            'SELECT id, email, full_name, is_active FROM admin_users WHERE email = ?',
            [email]
        );

        // Por seguridad, siempre retornamos el mismo mensaje
        // aunque el usuario no exista (evita enumeration attacks)
        const successMessage = 'Si el email está registrado, recibirás un enlace de recuperación';

        if (users.length === 0) {
            return res.json({
                success: true,
                message: successMessage
            });
        }

        const user = users[0];

        // Verificar que el usuario está activo
        if (!user.is_active) {
            return res.json({
                success: true,
                message: successMessage
            });
        }

        // Generar token seguro
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Calcular expiración (1 hora)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Guardar token en la base de datos
        await db.query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [
                user.id,
                tokenHash,
                expiresAt,
                req.ip || req.connection.remoteAddress,
                req.headers['user-agent'] || null
            ]
        );

        // Crear URL de reset
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

        // Enviar email
        const emailResult = await sendPasswordResetEmail(user, resetToken, resetUrl);

        if (!emailResult.success) {
            console.error('Error enviando email de reset:', emailResult.error);
            // No revelamos al usuario que hubo un error de email por seguridad
        }

        res.json({
            success: true,
            message: successMessage
        });

    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud. Inténtalo de nuevo.',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Restablecer contraseña con token
 */
router.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Validaciones
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y contraseña nueva son obligatorios'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Hash del token para buscar en DB
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Buscar token válido
        const tokens = await db.query(
            `SELECT rt.id, rt.user_id, rt.expires_at, rt.used,
                    u.id as user_id, u.email, u.is_active
             FROM password_reset_tokens rt
             INNER JOIN admin_users u ON rt.user_id = u.id
             WHERE rt.token = ? AND rt.used = FALSE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o ya utilizado'
            });
        }

        const tokenData = tokens[0];

        // Verificar expiración
        if (new Date() > new Date(tokenData.expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'El token ha expirado. Solicita uno nuevo.'
            });
        }

        // Verificar que el usuario está activo
        if (!tokenData.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        // Hash de la nueva contraseña
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await db.query(
            'UPDATE admin_users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, tokenData.user_id]
        );

        // Marcar token como usado
        await db.query(
            'UPDATE password_reset_tokens SET used = TRUE, used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [tokenData.id]
        );

        // Invalidar todos los otros tokens del usuario
        await db.query(
            'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND id != ?',
            [tokenData.user_id, tokenData.id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
        });

    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer contraseña',
            error: error.message
        });
    }
});

module.exports = router;
