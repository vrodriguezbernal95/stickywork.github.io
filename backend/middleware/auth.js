const jwt = require('jsonwebtoken');

// Secret para JWT (en producción debe estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'stickywork-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Genera un token JWT para un usuario
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        businessId: user.business_id,
        role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
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
    verifyToken,
    requireAuth,
    requireRole,
    requireBusinessAccess,
    JWT_SECRET
};
