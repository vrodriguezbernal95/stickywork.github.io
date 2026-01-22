// Rutas para Super Admin
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { requireSuperAdmin } = require('../middleware/super-admin');
const { superAdminLoginLimiter } = require('../middleware/rate-limit');
const { getPlanInfo } = require('../middleware/entitlements');
const { sendConsultancyScheduledEmail } = require('../email-service');

// Login de super-admin
router.post('/login', superAdminLoginLimiter, async (req, res) => {
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
             WHERE (trial_ends_at > NOW() OR subscription_status = 'active')`
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
        const { status, type, search, plan, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT
                b.*,
                (SELECT COUNT(*) FROM bookings WHERE business_id = b.id) as total_bookings,
                (SELECT COUNT(*) FROM admin_users WHERE business_id = b.id) as admin_count,
                (SELECT COUNT(*) FROM services WHERE business_id = b.id) as services_count,
                (SELECT COUNT(*) FROM bookings
                 WHERE business_id = b.id
                 AND MONTH(booking_date) = MONTH(NOW())
                 AND YEAR(booking_date) = YEAR(NOW())
                 AND status != 'cancelled') as bookings_this_month
            FROM businesses b
            WHERE 1=1
        `;
        const params = [];

        // Filtro por estado
        if (status === 'active') {
            query += ` AND (b.trial_ends_at > NOW() OR b.subscription_status = 'active')`;
        } else if (status === 'inactive') {
            query += ` AND (b.trial_ends_at <= NOW() AND b.subscription_status != 'active')`;
        }

        // Filtro por tipo
        if (type) {
            query += ` AND b.type = ?`;
            params.push(type);
        }

        // Filtro por plan
        if (plan) {
            query += ` AND b.plan = ?`;
            params.push(plan);
        }

        // Búsqueda por nombre
        if (search) {
            query += ` AND b.name LIKE ?`;
            params.push(`%${search}%`);
        }

        // Ordenar por fecha de creación (más recientes primero)
        query += ` ORDER BY b.created_at DESC`;

        // Paginación (usar valores directos en lugar de placeholders por compatibilidad con MySQL)
        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;
        query += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const businesses = await db.query(query, params);

        // Contar total (para paginación)
        let countQuery = 'SELECT COUNT(*) as total FROM businesses b WHERE 1=1';
        const countParams = [];

        if (status === 'active') {
            countQuery += ` AND (b.trial_ends_at > NOW() OR b.subscription_status = 'active')`;
        } else if (status === 'inactive') {
            countQuery += ` AND (b.trial_ends_at <= NOW() AND b.subscription_status != 'active')`;
        }

        if (type) {
            countQuery += ` AND b.type = ?`;
            countParams.push(type);
        }

        if (plan) {
            countQuery += ` AND b.plan = ?`;
            countParams.push(plan);
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
            'SELECT COUNT(*) as total FROM services WHERE business_id = ?',
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
        const { subscription_status, trial_ends_at, is_active, free_access } = req.body;

        const updates = [];
        const params = [];

        if (subscription_status) {
            updates.push('subscription_status = ?');
            params.push(subscription_status);
        }

        if (trial_ends_at) {
            updates.push('trial_ends_at = ?');
            params.push(trial_ends_at);
        }

        // Nueva columna: is_active (control manual de activación/desactivación)
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        // Nueva columna: free_access (acceso gratuito permanente)
        if (free_access !== undefined) {
            updates.push('free_access = ?');
            params.push(free_access ? 1 : 0);
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

// Toggle AI Reports para un negocio
router.patch('/businesses/:id/toggle-ai-reports', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        if (enabled === undefined) {
            return res.status(400).json({
                success: false,
                message: 'El campo "enabled" es requerido'
            });
        }

        await db.query(
            'UPDATE businesses SET ai_reports_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [enabled ? 1 : 0, id]
        );

        const updatedBusiness = await db.query('SELECT * FROM businesses WHERE id = ?', [id]);

        res.json({
            success: true,
            message: enabled ? 'Reportes IA activados correctamente' : 'Reportes IA desactivados correctamente',
            data: updatedBusiness[0]
        });

    } catch (error) {
        console.error('Error al actualizar reportes IA:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reportes IA'
        });
    }
});

// Eliminar un negocio (soft delete)
router.delete('/businesses/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Desactivar el negocio cambiando su subscription_status a 'cancelled'
        await db.query(
            "UPDATE businesses SET subscription_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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

// ==================== SUPPORT MESSAGES ====================

// Listar mensajes de soporte de clientes
router.get('/support/messages', requireSuperAdmin, async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT
                sm.*,
                b.name as business_name,
                b.email as business_email,
                b.type as business_type
            FROM support_messages sm
            JOIN businesses b ON sm.business_id = b.id
        `;

        const params = [];

        if (status) {
            query += ' WHERE sm.status = ?';
            params.push(status);
        }

        query += ' ORDER BY sm.created_at DESC';

        const messages = await db.query(query, params);

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Error fetching support messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes de soporte'
        });
    }
});

// Responder a un mensaje de soporte
router.patch('/support/messages/:id/respond', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;

        if (!response || response.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La respuesta no puede estar vacía'
            });
        }

        await db.query(`
            UPDATE support_messages
            SET
                admin_response = ?,
                answered_by = ?,
                answered_at = NOW(),
                status = 'answered'
            WHERE id = ?
        `, [response.trim(), req.superAdmin.email, id]);

        // Get updated message with business info
        const updatedMessage = await db.query(`
            SELECT sm.*, b.name as business_name, b.email as business_email
            FROM support_messages sm
            JOIN businesses b ON sm.business_id = b.id
            WHERE sm.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Respuesta enviada correctamente',
            data: updatedMessage[0]
        });

    } catch (error) {
        console.error('Error responding to support message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar respuesta'
        });
    }
});

// Cerrar mensaje de soporte
router.patch('/support/messages/:id/close', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "UPDATE support_messages SET status = 'closed' WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: 'Mensaje cerrado correctamente'
        });

    } catch (error) {
        console.error('Error closing support message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar mensaje'
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

// ==================== PLAN MANAGEMENT ====================

// Obtener información del plan y uso actual de un negocio
router.get('/businesses/:id/plan', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const planInfo = await getPlanInfo(id);

        res.json({
            success: true,
            data: planInfo
        });

    } catch (error) {
        console.error('Error al obtener información del plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del plan'
        });
    }
});

// Cambiar plan de un negocio
router.patch('/businesses/:id/change-plan', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, reason } = req.body;

        // Validar plan
        const validPlans = ['free', 'founders', 'professional', 'premium'];
        if (!plan || !validPlans.includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Plan inválido. Debe ser: free, founders, professional o premium'
            });
        }

        // Obtener plan actual
        const businesses = await db.query(
            'SELECT plan, plan_limits FROM businesses WHERE id = ?',
            [id]
        );

        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const business = businesses[0];
        const oldPlan = business.plan;
        const oldLimits = business.plan_limits;

        // Definir límites según el plan
        // Actualizado 16-ene-2026: Nueva estructura de precios
        const planLimits = {
            free: {
                maxBookingsPerMonth: 30, // Límite de 30 reservas/mes para plan gratuito
                maxServices: null, // ilimitado
                maxUsers: 1,
                features: {
                    aiReports: false,
                    aiReportsPerMonth: 0,
                    whatsapp: true,
                    feedback: true,
                    zones: true,
                    api: false,
                    whiteLabel: false,
                    landingPage: false
                }
            },
            founders: {
                maxBookingsPerMonth: null, // ilimitado
                maxServices: null, // ilimitado
                maxUsers: 3, // 3 usuarios para pequeños equipos
                features: {
                    aiReports: true,
                    aiReportsPerMonth: 1, // 1 reporte al mes
                    whatsapp: true,
                    feedback: true,
                    zones: true,
                    api: false, // API no implementada aún
                    whiteLabel: false, // White Label no implementado aún
                    landingPage: false // Landing page como add-on (+200€)
                }
            },
            professional: {
                maxBookingsPerMonth: null, // ilimitado
                maxServices: null, // ilimitado
                maxUsers: 3, // 3 usuarios (igual que founders)
                features: {
                    aiReports: true,
                    aiReportsPerMonth: 1, // 1 reporte al mes (igual que founders)
                    whatsapp: true,
                    feedback: true,
                    zones: true,
                    api: false, // API no implementada aún
                    whiteLabel: false, // White Label no implementado aún
                    landingPage: false // Landing page como add-on (+200€)
                }
            },
            premium: {
                maxBookingsPerMonth: null, // ilimitado
                maxServices: null, // ilimitado
                maxUsers: 10, // 10 usuarios para equipos
                features: {
                    aiReports: true,
                    aiReportsPerMonth: 8, // 2 reportes a la semana (8 al mes aprox)
                    whatsapp: true,
                    feedback: true,
                    zones: true,
                    api: false, // API no implementada aún (feature futura)
                    whiteLabel: false, // White Label no implementado aún (feature futura)
                    landingPage: true, // Landing page incluida gratis (valor 200€)
                    consultancy: true // 1h consultoría al mes
                }
            }
        };

        const newLimits = planLimits[plan];

        // Actualizar plan en la base de datos
        await db.query(
            'UPDATE businesses SET plan = ?, plan_limits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [plan, JSON.stringify(newLimits), id]
        );

        // Registrar cambio en histórico
        try {
            await db.query(
                `INSERT INTO plan_changes (business_id, old_plan, new_plan, old_limits, new_limits, changed_by, change_reason)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    oldPlan,
                    plan,
                    oldLimits ? JSON.stringify(oldLimits) : null,
                    JSON.stringify(newLimits),
                    req.superAdmin?.email || 'super-admin',
                    reason || null
                ]
            );
        } catch (historyError) {
            console.log('Warning: Could not save plan change history:', historyError.message);
            // No fallar si no se puede guardar el histórico
        }

        // Obtener negocio actualizado
        const updatedBusiness = await db.query('SELECT * FROM businesses WHERE id = ?', [id]);

        res.json({
            success: true,
            message: `Plan actualizado de ${oldPlan.toUpperCase()} a ${plan.toUpperCase()}`,
            data: updatedBusiness[0]
        });

    } catch (error) {
        console.error('Error al cambiar plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar plan'
        });
    }
});

// Obtener histórico de cambios de plan de un negocio
router.get('/businesses/:id/plan-history', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const history = await db.query(
            `SELECT * FROM plan_changes
             WHERE business_id = ?
             ORDER BY changed_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: history || []
        });

    } catch (error) {
        console.error('Error al obtener histórico de cambios:', error);

        // Si la tabla no existe, devolver array vacío
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                success: true,
                data: [],
                message: 'Tabla de histórico no creada aún'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al obtener histórico de cambios'
        });
    }
});

// Obtener estadísticas de planes
router.get('/plans/stats', requireSuperAdmin, async (req, res) => {
    try {
        const planStats = await db.query(
            `SELECT
                plan,
                COUNT(*) as count,
                SUM(CASE
                    WHEN plan = 'free' THEN 0
                    WHEN plan = 'founders' THEN 25
                    WHEN plan = 'professional' THEN 39
                    WHEN plan = 'premium' THEN 79
                    ELSE 0
                END) as monthly_revenue
             FROM businesses
             GROUP BY plan
             ORDER BY count DESC`
        );

        // Total de ingresos mensuales estimados
        const totalRevenue = planStats.reduce((sum, stat) => sum + (stat.monthly_revenue || 0), 0);

        res.json({
            success: true,
            data: {
                byPlan: planStats || [],
                totalMonthlyRevenue: totalRevenue
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de planes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de planes'
        });
    }
});

// ==================== CONSULTANCY MANAGEMENT ====================

// Listar todas las solicitudes de consultoría
router.get('/consultancy', requireSuperAdmin, async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT
                cr.*,
                b.name as business_name,
                b.email as business_email,
                b.type as business_type,
                au.full_name as user_name,
                au.email as user_email
            FROM consultancy_requests cr
            JOIN businesses b ON cr.business_id = b.id
            JOIN admin_users au ON cr.user_id = au.id
        `;

        const params = [];

        if (status) {
            query += ' WHERE cr.status = ?';
            params.push(status);
        }

        query += ' ORDER BY cr.created_at DESC';

        const requests = await db.query(query, params);

        // Contar por estado
        const stats = await db.query(`
            SELECT
                status,
                COUNT(*) as count
            FROM consultancy_requests
            GROUP BY status
        `);

        res.json({
            success: true,
            data: requests,
            stats: stats || []
        });

    } catch (error) {
        console.error('Error fetching consultancy requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes de consultoría'
        });
    }
});

// Ver detalle de una solicitud
router.get('/consultancy/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const request = await db.query(`
            SELECT
                cr.*,
                b.name as business_name,
                b.email as business_email,
                b.phone as business_phone,
                b.type as business_type,
                b.plan as business_plan,
                au.full_name as user_name,
                au.email as user_email
            FROM consultancy_requests cr
            JOIN businesses b ON cr.business_id = b.id
            JOIN admin_users au ON cr.user_id = au.id
            WHERE cr.id = ?
        `, [id]);

        if (!request || request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        res.json({
            success: true,
            data: request[0]
        });

    } catch (error) {
        console.error('Error fetching consultancy request:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitud'
        });
    }
});

// Agendar una consultoría
router.patch('/consultancy/:id/schedule', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduled_date, scheduled_time, meeting_link, admin_notes } = req.body;

        if (!scheduled_date || !scheduled_time) {
            return res.status(400).json({
                success: false,
                message: 'Fecha y hora son obligatorias'
            });
        }

        // Verificar que la solicitud existe y está pendiente
        const request = await db.query(
            'SELECT id, status FROM consultancy_requests WHERE id = ?',
            [id]
        );

        if (!request || request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (request[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden agendar solicitudes pendientes'
            });
        }

        // Actualizar la solicitud
        await db.query(`
            UPDATE consultancy_requests
            SET
                status = 'scheduled',
                scheduled_date = ?,
                scheduled_time = ?,
                meeting_link = ?,
                admin_notes = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [scheduled_date, scheduled_time, meeting_link || null, admin_notes || null, id]);

        // Obtener la solicitud actualizada con info del negocio
        const updatedRequest = await db.query(`
            SELECT
                cr.*,
                b.name as business_name,
                b.email as business_email,
                au.full_name as user_name,
                au.email as user_email
            FROM consultancy_requests cr
            JOIN businesses b ON cr.business_id = b.id
            JOIN admin_users au ON cr.user_id = au.id
            WHERE cr.id = ?
        `, [id]);

        // Enviar email de confirmación al cliente
        try {
            await sendConsultancyScheduledEmail(
                {
                    scheduled_date,
                    scheduled_time,
                    meeting_link,
                    topic: updatedRequest[0].topic
                },
                { name: updatedRequest[0].business_name },
                { email: updatedRequest[0].user_email, full_name: updatedRequest[0].user_name }
            );
        } catch (emailError) {
            console.error('Error sending consultancy scheduled email:', emailError);
            // No fallar si el email no se envía
        }

        res.json({
            success: true,
            message: 'Consultoría agendada correctamente',
            data: updatedRequest[0]
        });

    } catch (error) {
        console.error('Error scheduling consultancy:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agendar consultoría'
        });
    }
});

// Marcar consultoría como completada
router.patch('/consultancy/:id/complete', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        // Verificar que existe y está agendada
        const request = await db.query(
            'SELECT id, status FROM consultancy_requests WHERE id = ?',
            [id]
        );

        if (!request || request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (request[0].status !== 'scheduled') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden completar consultorías agendadas'
            });
        }

        await db.query(`
            UPDATE consultancy_requests
            SET
                status = 'completed',
                admin_notes = COALESCE(?, admin_notes),
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        `, [admin_notes, id]);

        res.json({
            success: true,
            message: 'Consultoría marcada como completada'
        });

    } catch (error) {
        console.error('Error completing consultancy:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar consultoría'
        });
    }
});

// Cancelar solicitud (desde super-admin)
router.patch('/consultancy/:id/cancel', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Verificar que existe
        const request = await db.query(
            'SELECT id, status FROM consultancy_requests WHERE id = ?',
            [id]
        );

        if (!request || request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (request[0].status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'No se pueden cancelar consultorías completadas'
            });
        }

        await db.query(`
            UPDATE consultancy_requests
            SET
                status = 'canceled',
                admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n[Cancelada] ', COALESCE(?, 'Sin motivo especificado')),
                updated_at = NOW()
            WHERE id = ?
        `, [reason, id]);

        // TODO: Enviar email de cancelación al cliente

        res.json({
            success: true,
            message: 'Solicitud cancelada correctamente'
        });

    } catch (error) {
        console.error('Error canceling consultancy:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar solicitud'
        });
    }
});

module.exports = router;
