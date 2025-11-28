// Middleware para verificar permisos de super-admin
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

// Verificar que el usuario es un super-admin
async function requireSuperAdmin(req, res, next) {
    try {
        // Verificar que haya token
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado - Token requerido'
            });
        }

        // Verificar el token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Verificar que el ID es de tipo super-admin
        if (!decoded.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado - Se requieren permisos de super-admin'
            });
        }

        // Verificar que el super-admin existe y está activo
        const superAdmins = await db.query(
            'SELECT * FROM platform_admins WHERE id = ? AND is_active = TRUE',
            [decoded.super_admin_id]
        );

        if (!superAdmins || superAdmins.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Super-admin no encontrado o inactivo'
            });
        }

        // Añadir info del super-admin al request
        req.superAdmin = superAdmins[0];

        next();
    } catch (error) {
        console.error('Error en requireSuperAdmin:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = { requireSuperAdmin };
