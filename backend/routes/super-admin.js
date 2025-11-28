// Rutas para Super Admin
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { requireSuperAdmin } = require('../middleware/super-admin');

// Login de super-admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar super-admin
        const superAdmins = await db.query(
            'SELECT * FROM platform_admins WHERE email = ? AND is_active = TRUE',
            [email]
        );

        if (!superAdmins || superAdmins.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const superAdmin = superAdmins[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, superAdmin.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                super_admin_id: superAdmin.id,
                email: superAdmin.email,
                role: superAdmin.role,
                is_super_admin: true
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Responder con token y datos del super-admin
        res.json({
            success: true,
            token,
            superAdmin: {
                id: superAdmin.id,
                email: superAdmin.email,
                fullName: superAdmin.full_name,
                role: superAdmin.role
            }
        });

    } catch (error) {
        console.error('Error en login de super-admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
});

// Obtener estadísticas globales de la plataforma
router.get('/stats', requireSuperAdmin, async (req, res) => {
    try {
        // Total de negocios
        const totalBusinessesResult = await db.query(
            'SELECT COUNT(*) as total FROM businesses'
        );
        const totalBusinesses = totalBusinessesResult?.[0]?.total || 0;

        // Negocios activos (con trial activo o suscripción activa)
        const activeBusinessesResult = await db.query(
            `SELECT COUNT(*) as total FROM businesses
             WHERE (trial_ends_at > NOW() OR subscription_status = 'active')
             AND is_active = TRUE`
        );
        const activeBusinesses = activeBusinessesResult?.[0]?.total || 0;

        // Negocios nuevos este mes
        const newThisMonthResult = await db.query(
            `SELECT COUNT(*) as total FROM businesses
             WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
             AND YEAR(created_at) = YEAR(CURRENT_DATE())`
        );
        const newThisMonth = newThisMonthResult?.[0]?.total || 0;

        // Total de reservas en toda la plataforma
        const totalBookingsResult = await db.query(
            'SELECT COUNT(*) as total FROM bookings'
        );
        const totalBookings = totalBookingsResult?.[0]?.total || 0;

        // Reservas este mes (todas las empresas)
        const bookingsThisMonthResult = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE MONTH(booking_date) = MONTH(CURRENT_DATE())
             AND YEAR(booking_date) = YEAR(CURRENT_DATE())`
        );
        const bookingsThisMonth = bookingsThisMonthResult?.[0]?.total || 0;

        // Mensajes de contacto sin leer
        const unreadMessagesResult = await db.query(
            "SELECT COUNT(*) as total FROM contact_messages WHERE status = 'unread'"
        );
        const unreadMessages = unreadMessagesResult?.[0]?.total || 0;

        // Negocios por tipo
        const businessesByType = await db.query(
            `SELECT type, COUNT(*) as count FROM businesses
             GROUP BY type
             ORDER BY count DESC`
        );

        // Crecimiento mensual de negocios (últimos 6 meses)
        const monthlyGrowth = await db.query(
            `SELECT
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
             FROM businesses
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC`
        );

        res.json({
            success: true,
            data: {
                totalBusinesses,
                activeBusinesses,
                inactiveBusinesses: totalBusinesses - activeBusinesses,
                newThisMonth,
                totalBookings,
                bookingsThisMonth,
                unreadMessages,
                businessesByType,
                monthlyGrowth
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas globales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

// Listar todos los negocios
router.get('/businesses', requireSuperAdmin, async (req, res) => {
    try {
        const { status, type, search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT
                b.*,
                (SELECT COUNT(*) FROM bookings WHERE business_id = b.id) as total_bookings,
                (SELECT COUNT(*) FROM admin_users WHERE business_id = b.id AND is_active = TRUE) as admin_count
            FROM businesses b
            WHERE 1=1
        `;
        const params = [];

        // Filtro por estado
        if (status === 'active') {
            query += ` AND ((b.trial_ends_at > NOW() OR b.subscription_status = 'active') AND b.is_active = TRUE)`;
        } else if (status === 'inactive') {
            query += ` AND (b.trial_ends_at <= NOW() AND b.subscription_status != 'active') OR b.is_active = FALSE`;
        }

        // Filtro por tipo
        if (type) {
            query += ` AND b.type = ?`;
            params.push(type);
        }

        // Búsqueda por nombre
        if (search) {
            query += ` AND b.name LIKE ?`;
            params.push(`%${search}%`);
        }

        // Ordenar por fecha de creación (más recientes primero)
        query += ` ORDER BY b.created_at DESC`;

        // Paginación
        query += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const businesses = await db.query(query, params);

        // Contar total (para paginación)
        let countQuery = 'SELECT COUNT(*) as total FROM businesses b WHERE 1=1';
        const countParams = [];

        if (status === 'active') {
            countQuery += ` AND ((b.trial_ends_at > NOW() OR b.subscription_status = 'active') AND b.is_active = TRUE)`;
        } else if (status === 'inactive') {
            countQuery += ` AND (b.trial_ends_at <= NOW() AND b.subscription_status != 'active') OR b.is_active = FALSE`;
        }

        if (type) {
            countQuery += ` AND b.type = ?`;
            countParams.push(type);
        }

        if (search) {
            countQuery += ` AND b.name LIKE ?`;
            countParams.push(`%${search}%`);
        }

        const totalResult = await db.query(countQuery, countParams);
        const total = totalResult?.[0]?.total || 0;

        res.json({
            success: true,
            data: businesses,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });

    } catch (error) {
        console.error('Error al listar negocios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener lista de negocios'
        });
    }
});

// Obtener detalles de un negocio específico
router.get('/businesses/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener negocio
        const businesses = await db.query('SELECT * FROM businesses WHERE id = ?', [id]);

        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const business = businesses[0];

        // Obtener estadísticas del negocio
        const bookingsCount = await db.query(
            'SELECT COUNT(*) as total FROM bookings WHERE business_id = ?',
            [id]
        );

        const admins = await db.query(
            'SELECT id, email, full_name, role, is_active, created_at FROM admin_users WHERE business_id = ?',
            [id]
        );

        const services = await db.query(
            'SELECT COUNT(*) as total FROM services WHERE business_id = ? AND is_active = TRUE',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...business,
                stats: {
                    totalBookings: bookingsCount?.[0]?.total || 0,
                    activeServices: services?.[0]?.total || 0,
                    admins: admins || []
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener detalles del negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles del negocio'
        });
    }
});

// Actualizar un negocio
router.patch('/businesses/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active, subscription_status, trial_ends_at } = req.body;

        const updates = [];
        const params = [];

        if (typeof is_active !== 'undefined') {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (subscription_status) {
            updates.push('subscription_status = ?');
            params.push(subscription_status);
        }

        if (trial_ends_at) {
            updates.push('trial_ends_at = ?');
            params.push(trial_ends_at);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        params.push(id);

        await db.query(
            `UPDATE businesses SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params
        );

        const updatedBusiness = await db.query('SELECT * FROM businesses WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Negocio actualizado correctamente',
            data: updatedBusiness[0]
        });

    } catch (error) {
        console.error('Error al actualizar negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar negocio'
        });
    }
});

// Eliminar un negocio (soft delete)
router.delete('/businesses/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Desactivar el negocio en lugar de eliminarlo
        await db.query(
            'UPDATE businesses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Negocio desactivado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar negocio'
        });
    }
});

// Listar mensajes de contacto (mover desde /api/contact)
router.get('/messages', requireSuperAdmin, async (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT * FROM contact_messages';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const messages = await db.query(query, params);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar los mensajes'
        });
    }
});

// Actualizar estado de mensaje
router.patch('/messages/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['unread', 'read', 'replied'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        await db.query(
            'UPDATE contact_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        const message = await db.query('SELECT * FROM contact_messages WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Estado actualizado',
            data: message[0]
        });
    } catch (error) {
        console.error('Error al actualizar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el mensaje'
        });
    }
});

// Eliminar mensaje
router.delete('/messages/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Mensaje eliminado'
        });
    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el mensaje'
        });
    }
});

module.exports = router;
