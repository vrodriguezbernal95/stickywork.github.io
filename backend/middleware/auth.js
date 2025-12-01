const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Secret para JWT - OBLIGATORIO en variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'; // 15 minutos
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // 7 días

// Verificar que JWT_SECRET está configurado
if (!JWT_SECRET) {
    throw new Error(
        '❌ SEGURIDAD: JWT_SECRET no está configurado en las variables de entorno.\n' +
        'Por favor, configura JWT_SECRET en tu archivo .env con una clave segura.\n' +
        'Ejemplo: JWT_SECRET=tu-clave-super-secreta-y-aleatoria-de-al-menos-32-caracteres'
    );
}

/**
 * Genera un ACCESS TOKEN JWT para un usuario (15 minutos)
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        businessId: user.business_id,
        role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
}

/**
 * Genera un REFRESH TOKEN seguro (7 días)
 * Retorna el token en texto plano (para enviar al cliente)
 * y el hash SHA-256 (para guardar en DB)
 */
function generateRefreshToken() {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return {
        token,      // Token original para enviar al cliente
        tokenHash   // Hash para guardar en DB
    };
}

/**
 * Calcula la fecha de expiración del refresh token
 */
function getRefreshTokenExpiration() {
    const expiresAt = new Date();

    // Parsear duración desde variable de entorno (ej: "7d" = 7 días)
    const duration = REFRESH_TOKEN_EXPIRES_IN;
    const days = parseInt(duration.replace('d', '')) || 7;

    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
}

/**
 * Verifica un token JWT
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Middleware para proteger rutas - requiere token válido
 */
function requireAuth(req, res, next) {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación requerido'
            });
        }

        const token = authHeader.substring(7); // Remover "Bearer "
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Agregar datos del usuario al request
        req.user = decoded;
        next();

    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar autenticación'
        });
    }
}

/**
 * Middleware para verificar roles específicos
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso'
            });
        }

        next();
    };
}

/**
 * Middleware para verificar que el usuario pertenece al negocio
 */
function requireBusinessAccess(req, res, next) {
    const businessId = req.params.businessId || req.body.business_id;

    if (!businessId) {
        return res.status(400).json({
            success: false,
            message: 'ID de negocio requerido'
        });
    }

    if (req.user.businessId !== parseInt(businessId)) {
        return res.status(403).json({
            success: false,
            message: 'No tienes acceso a este negocio'
        });
    }

    next();
}

module.exports = {
    generateToken,
    generateRefreshToken,
    getRefreshTokenExpiration,
    verifyToken,
    requireAuth,
    requireRole,
    requireBusinessAccess,
    JWT_SECRET,
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN
};
