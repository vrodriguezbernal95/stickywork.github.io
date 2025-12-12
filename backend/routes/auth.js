const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {
    generateToken,
    generateRefreshToken,
    getRefreshTokenExpiration,
    requireAuth
} = require('../middleware/auth');
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
                    scheduleType: 'continuous',  // Por defecto horario continuo
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

        // Buscar usuario (incluir two_factor_enabled)
        const users = await db.query(
            `SELECT id, business_id, email, password_hash, full_name, role, is_active, two_factor_enabled
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

        // Si el usuario tiene 2FA activado, NO generar tokens aún
        if (user.two_factor_enabled) {
            return res.json({
                success: true,
                requiresTwoFactor: true,
                message: 'Ingresa el código de autenticación de dos factores',
                data: {
                    email: user.email // Necesario para el siguiente paso
                }
            });
        }

        // Si NO tiene 2FA, proceder con login normal
        // Actualizar último login
        await db.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Eliminar password_hash antes de enviar
        delete user.password_hash;
        delete user.two_factor_enabled;

        // Generar ACCESS TOKEN (15 minutos)
        const accessToken = generateToken(user);

        // Generar REFRESH TOKEN (7 días)
        const { token: refreshToken, tokenHash } = generateRefreshToken();
        const refreshExpiresAt = getRefreshTokenExpiration();

        // Guardar refresh token en la base de datos
        await db.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [
                user.id,
                tokenHash, // Guardamos el hash, no el token original
                refreshExpiresAt,
                req.ip || req.connection.remoteAddress,
                req.headers['user-agent'] || null
            ]
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user,
                accessToken,      // Token de 15 minutos
                refreshToken,     // Token de 7 días
                expiresIn: '15m'  // Info para el frontend
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

// ==================== REFRESH TOKEN ====================

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
router.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requerido'
            });
        }

        // Hash del refresh token para buscar en DB
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Buscar refresh token en la base de datos
        const tokens = await db.query(
            `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
                    u.id as user_id, u.email, u.full_name, u.business_id, u.role, u.is_active
             FROM refresh_tokens rt
             INNER JOIN admin_users u ON rt.user_id = u.id
             WHERE rt.token = ? AND rt.revoked = FALSE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token inválido o revocado'
            });
        }

        const tokenData = tokens[0];

        // Verificar expiración
        if (new Date() > new Date(tokenData.expires_at)) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expirado. Por favor, inicia sesión de nuevo.'
            });
        }

        // Verificar que el usuario está activo
        if (!tokenData.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Usuario desactivado'
            });
        }

        // Actualizar last_used_at del refresh token
        await db.query(
            'UPDATE refresh_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
            [tokenData.id]
        );

        // Generar nuevo ACCESS TOKEN
        const user = {
            id: tokenData.user_id,
            email: tokenData.email,
            full_name: tokenData.full_name,
            business_id: tokenData.business_id,
            role: tokenData.role
        };

        const newAccessToken = generateToken(user);

        res.json({
            success: true,
            message: 'Token renovado exitosamente',
            data: {
                accessToken: newAccessToken,
                expiresIn: '15m'
            }
        });

    } catch (error) {
        console.error('Error en refresh token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al renovar token',
            error: error.message
        });
    }
});

// ==================== LOGOUT ====================

/**
 * POST /api/auth/logout
 * Cerrar sesión y revocar refresh token
 */
router.post('/api/auth/logout', requireAuth, async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // Si se proporciona refresh token, revocarlo
        if (refreshToken) {
            const crypto = require('crypto');
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

            await db.query(
                'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = CURRENT_TIMESTAMP WHERE token = ?',
                [tokenHash]
            );
        }

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    }
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

// ==================== TWO-FACTOR AUTHENTICATION (2FA) ====================

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * POST /api/auth/2fa/setup
 * Generar secret y QR code para configurar 2FA
 * Requiere autenticación
 */
router.post('/api/auth/2fa/setup', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Verificar que el usuario existe y obtener su info
        const users = await db.query(
            `SELECT id, email, full_name, two_factor_enabled
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // Si ya tiene 2FA activado, retornar error
        if (user.two_factor_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA ya está activado. Desactívalo primero si quieres reconfigurarlo.'
            });
        }

        // Generar secret TOTP
        const secret = speakeasy.generateSecret({
            name: `StickyWork (${user.email})`,
            issuer: 'StickyWork',
            length: 32
        });

        // Generar QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Guardar el secret temporalmente (aún no activado)
        await db.query(
            `UPDATE admin_users
             SET two_factor_secret = ?
             WHERE id = ?`,
            [secret.base32, userId]
        );

        res.json({
            success: true,
            message: 'Secret generado. Escanea el QR con Google Authenticator.',
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntry: secret.base32 // Para entrada manual si el QR no funciona
            }
        });

    } catch (error) {
        console.error('Error en 2FA setup:', error);
        res.status(500).json({
            success: false,
            message: 'Error al configurar 2FA',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/2fa/verify-setup
 * Verificar el primer código para activar 2FA
 * Requiere autenticación
 */
router.post('/api/auth/2fa/verify-setup', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Código requerido'
            });
        }

        // Obtener secret del usuario
        const users = await db.query(
            `SELECT id, two_factor_secret, two_factor_enabled
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0 || !users[0].two_factor_secret) {
            return res.status(400).json({
                success: false,
                message: 'Primero debes iniciar el setup de 2FA'
            });
        }

        const user = users[0];

        // Verificar el código TOTP
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 2 // Permite 2 pasos de tiempo de diferencia (60 segundos antes/después)
        });

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Código inválido. Verifica que el código sea el actual.'
            });
        }

        // Generar códigos de backup (10 códigos de 8 caracteres)
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
        }

        // Hash de los códigos de backup antes de guardarlos
        const hashedBackupCodes = backupCodes.map(code =>
            crypto.createHash('sha256').update(code).digest('hex')
        );

        // Activar 2FA
        await db.query(
            `UPDATE admin_users
             SET two_factor_enabled = TRUE,
                 two_factor_backup_codes = ?,
                 two_factor_enabled_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [JSON.stringify(hashedBackupCodes), userId]
        );

        res.json({
            success: true,
            message: '¡2FA activado exitosamente!',
            data: {
                backupCodes: backupCodes // Estos se muestran UNA SOLA VEZ
            }
        });

    } catch (error) {
        console.error('Error en 2FA verify-setup:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar código',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/2fa/validate
 * Validar código 2FA durante el login
 * NO requiere autenticación (se usa después de email/password)
 */
router.post('/api/auth/2fa/validate', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email y código son requeridos'
            });
        }

        // Obtener usuario con 2FA info
        const users = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active,
                    two_factor_enabled, two_factor_secret, two_factor_backup_codes
             FROM admin_users
             WHERE email = ? AND two_factor_enabled = TRUE`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Código inválido'
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

        let isValid = false;
        let usedBackupCode = false;

        // Primero intentar validar como código TOTP
        isValid = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        // Si no es válido como TOTP, intentar con códigos de backup
        if (!isValid && user.two_factor_backup_codes) {
            const backupCodes = JSON.parse(user.two_factor_backup_codes);
            const codeHash = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');

            const codeIndex = backupCodes.indexOf(codeHash);
            if (codeIndex !== -1) {
                isValid = true;
                usedBackupCode = true;

                // Eliminar el código de backup usado
                backupCodes.splice(codeIndex, 1);
                await db.query(
                    'UPDATE admin_users SET two_factor_backup_codes = ? WHERE id = ?',
                    [JSON.stringify(backupCodes), user.id]
                );
            }
        }

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Código inválido o expirado'
            });
        }

        // Actualizar último login
        await db.query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Eliminar datos sensibles
        delete user.two_factor_secret;
        delete user.two_factor_backup_codes;

        // Generar tokens
        const accessToken = generateToken(user);
        const { token: refreshToken, tokenHash } = generateRefreshToken();
        const refreshExpiresAt = getRefreshTokenExpiration();

        // Guardar refresh token
        await db.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [
                user.id,
                tokenHash,
                refreshExpiresAt,
                req.ip || req.connection.remoteAddress,
                req.headers['user-agent'] || null
            ]
        );

        const backupCodesRemaining = user.two_factor_backup_codes
            ? JSON.parse(user.two_factor_backup_codes).length
            : 0;

        res.json({
            success: true,
            message: usedBackupCode
                ? `Código de backup usado. Quedan ${backupCodesRemaining} códigos.`
                : 'Autenticación 2FA exitosa',
            data: {
                user,
                accessToken,
                refreshToken,
                expiresIn: '15m',
                backupCodesRemaining: usedBackupCode ? backupCodesRemaining : undefined
            }
        });

    } catch (error) {
        console.error('Error en 2FA validate:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar 2FA',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/2fa/disable
 * Desactivar 2FA para el usuario actual
 * Requiere autenticación y contraseña
 */
router.post('/api/auth/2fa/disable', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña requerida para desactivar 2FA'
            });
        }

        // Obtener usuario con password
        const users = await db.query(
            `SELECT id, password_hash, two_factor_enabled
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Desactivar 2FA
        await db.query(
            `UPDATE admin_users
             SET two_factor_enabled = FALSE,
                 two_factor_secret = NULL,
                 two_factor_backup_codes = NULL,
                 two_factor_enabled_at = NULL
             WHERE id = ?`,
            [userId]
        );

        res.json({
            success: true,
            message: '2FA desactivado exitosamente'
        });

    } catch (error) {
        console.error('Error en 2FA disable:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar 2FA',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Regenerar códigos de backup
 * Requiere autenticación y código 2FA actual
 */
router.post('/api/auth/2fa/regenerate-backup-codes', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Código 2FA requerido'
            });
        }

        // Obtener usuario
        const users = await db.query(
            `SELECT id, two_factor_enabled, two_factor_secret
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0 || !users[0].two_factor_enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA no está activado'
            });
        }

        const user = users[0];

        // Verificar código actual
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Código inválido'
            });
        }

        // Generar nuevos códigos de backup
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
        }

        const hashedBackupCodes = backupCodes.map(code =>
            crypto.createHash('sha256').update(code).digest('hex')
        );

        // Actualizar códigos
        await db.query(
            'UPDATE admin_users SET two_factor_backup_codes = ? WHERE id = ?',
            [JSON.stringify(hashedBackupCodes), userId]
        );

        res.json({
            success: true,
            message: 'Códigos de backup regenerados',
            data: {
                backupCodes: backupCodes
            }
        });

    } catch (error) {
        console.error('Error en regenerate-backup-codes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al regenerar códigos',
            error: error.message
        });
    }
});

/**
 * GET /api/auth/2fa/status
 * Obtener estado de 2FA del usuario actual
 * Requiere autenticación
 */
router.get('/api/auth/2fa/status', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const users = await db.query(
            `SELECT two_factor_enabled, two_factor_enabled_at, two_factor_backup_codes
             FROM admin_users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];
        const backupCodesCount = user.two_factor_backup_codes
            ? JSON.parse(user.two_factor_backup_codes).length
            : 0;

        res.json({
            success: true,
            data: {
                enabled: user.two_factor_enabled,
                enabledAt: user.two_factor_enabled_at,
                backupCodesRemaining: user.two_factor_enabled ? backupCodesCount : 0
            }
        });

    } catch (error) {
        console.error('Error en 2FA status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado 2FA',
            error: error.message
        });
    }
});

module.exports = router;
