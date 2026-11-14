// Rutas para Super Admin
const express = require('express');
const { VALID_PLANS, getPlanLimits } = require('../plans');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { requireSuperAdmin } = require('../middleware/super-admin');
const { superAdminLoginLimiter } = require('../middleware/rate-limit');
const { getPlanInfo } = require('../middleware/entitlements');
const { sendConsultancyScheduledEmail } = require('../email-service');
const { realBusinessSql, DEMO_BUSINESS_IDS } = require('../demo-businesses');

// ==================== RECUPERAR CONTRASEÑA DEL SUPER ADMIN ====================
const rateLimit = require('express-rate-limit');
const superAdminReset = require('../super-admin-reset');
const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5,
    message: { success: false, message: 'Demasiados intentos. Espera una hora y vuelve a probar.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/forgot-password', resetLimiter, async (req, res) => {
    try {
        await superAdminReset.requestReset(db, require('../email-service'), (req.body || {}).email, req.ip);
    } catch (error) {
        console.error('Error en recuperación de super admin:', error.message);
    }
    // Siempre la misma respuesta: no revela si el email existe
    res.json({ success: true, message: 'Si el email corresponde a un super admin, recibirás un enlace para elegir una contraseña nueva. Caduca en 30 minutos.' });
});

router.post('/reset-password', resetLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body || {};
        const r = await superAdminReset.resetPassword(db, token, newPassword);
        if (r.error) return res.status(400).json({ success: false, message: r.error });
        res.json({ success: true, message: 'Contraseña cambiada. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error restableciendo contraseña de super admin:', error.message);
        res.status(500).json({ success: false, message: 'Error al cambiar la contraseña' });
    }
});

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

// Resumen real de la plataforma (sin demos ni cuentas de prueba): lo que muestra el Dashboard
const PLAN_PRICE = { founders: 25, professional: 39, premium: 79 };

router.get('/overview', requireSuperAdmin, async (req, res) => {
    try {
        const real = realBusinessSql('b');
        const negocios = await db.query(`
            SELECT b.id, b.plan, b.plan_bonus_until, COALESCE(b.is_active, 1) AS is_active, b.created_at,
                   s.status AS sub_status, s.plan_name AS sub_plan,
                   (SELECT COUNT(*) FROM bookings bk WHERE bk.business_id = b.id AND bk.status <> 'cancelled'
                      AND bk.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) AS reservas30
            FROM businesses b
            LEFT JOIN subscriptions s ON s.business_id = b.id
            WHERE ${real}`);

        const pagando = n => ['active', 'past_due'].includes(n.sub_status);
        const enPrueba = n => n.sub_status === 'trialing';
        const deRegalo = n => !!n.plan_bonus_until;
        const planDePago = n => !!PLAN_PRICE[n.plan];
        const resumen = {
            total: negocios.length,
            activos30: negocios.filter(n => Number(n.reservas30) > 0).length,
            suspendidos: negocios.filter(n => Number(n.is_active) === 0).length,
            nuevosMes: negocios.filter(n => {
                const d = new Date(n.created_at), h = new Date();
                return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
            }).length,
            planes: {
                free: negocios.filter(n => !planDePago(n)).length,
                pagando: negocios.filter(pagando).length,
                enPrueba: negocios.filter(enPrueba).length,
                regalo: negocios.filter(deRegalo).length,
                cortesia: negocios.filter(n => planDePago(n) && !pagando(n) && !enPrueba(n) && !deRegalo(n)).length
            },
            ingresosMes: negocios.filter(pagando).reduce((t, n) => t + (PLAN_PRICE[n.sub_plan || n.plan] || 0), 0)
        };

        const [reservas] = await db.query(`
            SELECT SUM(bk.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) AS creadas30,
                   SUM(MONTH(bk.booking_date) = MONTH(CURDATE()) AND YEAR(bk.booking_date) = YEAR(CURDATE())) AS delMes
            FROM bookings bk JOIN businesses b ON b.id = bk.business_id
            WHERE bk.status <> 'cancelled' AND ${real}`);

        const crecimiento = await db.query(`
            SELECT DATE_FORMAT(b.created_at, '%Y-%m') AS mes, COUNT(*) AS n
            FROM businesses b
            WHERE b.created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH) AND ${real}
            GROUP BY mes`);

        const contar = async (sql) => { try { const [r] = await db.query(sql); return Number(r.n) || 0; } catch (e) { return 0; } };
        const pendientes = {
            contacto: await contar(`SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'unread'`),
            soporte: await contar(`SELECT COUNT(*) AS n FROM support_messages WHERE status = 'pending'`),
            consultorias: await contar(`SELECT COUNT(*) AS n FROM consultancy_requests WHERE status = 'pending'`),
            captacionHoy: await contar(`SELECT COUNT(*) AS n FROM prospects WHERE next_action_at IS NOT NULL AND next_action_at <= CURDATE()
                                         AND status NOT IN ('no_interesa','no_contactar','descartado')`)
        };

        const [demos] = await db.query(`
            SELECT COUNT(*) AS n,
                   (SELECT COUNT(*) FROM bookings bk WHERE bk.business_id IN (${DEMO_BUSINESS_IDS.join(',')})
                      AND bk.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) AS reservas30
            FROM businesses WHERE id IN (${DEMO_BUSINESS_IDS.join(',')})`);

        res.json({
            success: true,
            data: {
                negocios: resumen,
                reservas: { creadas30: Number(reservas.creadas30) || 0, delMes: Number(reservas.delMes) || 0 },
                crecimiento: crecimiento.map(c => ({ mes: c.mes, n: Number(c.n) })),
                pendientes,
                demos: { negocios: Number(demos.n) || 0, reservas30: Number(demos.reservas30) || 0 }
            }
        });
    } catch (error) {
        console.error('Error en el resumen del super admin:', error);
        res.status(500).json({ success: false, message: 'Error al calcular el resumen' });
    }
});

// Listar todos los negocios
router.get('/businesses', requireSuperAdmin, async (req, res) => {
    try {
        const { status, plan, search, include_demos } = req.query;
        const limitNum = Math.min(parseInt(req.query.limit) || 50, 200);
        const offsetNum = Math.max(parseInt(req.query.offset) || 0, 0);

        const where = ['1=1'];
        const params = [];
        // Por defecto solo negocios reales (sin demos ni cuentas de prueba)
        if (include_demos !== '1') where.push(realBusinessSql('b'));
        if (status === 'active') where.push(`EXISTS (SELECT 1 FROM bookings bk WHERE bk.business_id = b.id AND bk.status <> 'cancelled' AND bk.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY))`);
        if (status === 'inactive') where.push(`NOT EXISTS (SELECT 1 FROM bookings bk WHERE bk.business_id = b.id AND bk.status <> 'cancelled' AND bk.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY))`);
        if (status === 'suspended') where.push('COALESCE(b.is_active, 1) = 0');
        if (plan && VALID_PLANS.includes(plan)) { where.push('b.plan = ?'); params.push(plan); }
        if (search) { where.push('(b.name LIKE ? OR b.email LIKE ? OR b.slug LIKE ?)'); const like = `%${String(search).slice(0, 80)}%`; params.push(like, like, like); }

        const businesses = await db.query(`
            SELECT b.id, b.name, b.slug, b.email, b.phone, b.type, b.type_key, b.plan, b.plan_bonus_until,
                   COALESCE(b.is_active, 1) AS is_active, b.created_at,
                   s.status AS sub_status, s.plan_name AS sub_plan, s.current_period_end, s.cancel_at_period_end,
                   (SELECT COUNT(*) FROM bookings bk WHERE bk.business_id = b.id AND bk.status <> 'cancelled'
                      AND bk.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) AS bookings_30d,
                   (SELECT COUNT(*) FROM bookings bk WHERE bk.business_id = b.id) AS total_bookings,
                   (SELECT MAX(bk.created_at) FROM bookings bk WHERE bk.business_id = b.id) AS last_booking_at,
                   (SELECT COUNT(*) FROM admin_users au WHERE au.business_id = b.id) AS admin_count,
                   (SELECT COUNT(*) FROM services sv WHERE sv.business_id = b.id AND sv.is_active = TRUE) AS services_count
            FROM businesses b
            LEFT JOIN subscriptions s ON s.business_id = b.id
            WHERE ${where.join(' AND ')}
            ORDER BY b.created_at DESC
            LIMIT ${limitNum} OFFSET ${offsetNum}`, params);

        const [count] = await db.query(`SELECT COUNT(*) AS total FROM businesses b WHERE ${where.join(' AND ')}`, params);
        const total = Number(count?.total) || 0;
        const demoIds = new Set(DEMO_BUSINESS_IDS);

        res.json({
            success: true,
            data: businesses.map(b => ({ ...b, is_demo: demoIds.has(Number(b.id)) })),
            pagination: { total, limit: limitNum, offset: offsetNum, hasMore: offsetNum + limitNum < total }
        });
    } catch (error) {
        console.error('Error al listar negocios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lista de negocios' });
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
        const [actividad] = await db.query(
            `SELECT SUM(status <> 'cancelled' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) AS reservas30,
                    MAX(created_at) AS ultima
             FROM bookings WHERE business_id = ?`, [id]);
        const [sub] = await db.query(
            'SELECT status, plan_name, current_period_end, cancel_at_period_end, trial_end FROM subscriptions WHERE business_id = ? LIMIT 1', [id]);
        // No enviar al navegador datos internos que no hacen falta
        for (const k of ['widget_settings', 'widget_customization', 'business_context', 'plan_limits', 'loyalty_config']) delete business[k];

        res.json({
            success: true,
            data: {
                ...business,
                is_demo: DEMO_BUSINESS_IDS.includes(Number(business.id)),
                subscription: sub || null,
                stats: {
                    totalBookings: bookingsCount?.[0]?.total || 0,
                    bookings30d: Number(actividad?.reservas30) || 0,
                    lastBookingAt: actividad?.ultima || null,
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
        if (is_active !== undefined) await require('../suspension').refresh().catch(() => {});

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
        if (!plan || !VALID_PLANS.includes(plan)) {
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

        const newLimits = getPlanLimits(plan);

        // Actualizar plan en la base de datos
        await db.query(
            // plan_bonus_until = NULL: un cambio manual de plan anula el mes regalado por recomendación
            'UPDATE businesses SET plan = ?, plan_limits = ?, ai_reports_enabled = ?, plan_bonus_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [plan, JSON.stringify(newLimits), newLimits.features.aiReports ? 1 : 0, id]
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
                DATE_FORMAT(cr.preferred_date_1, '%Y-%m-%d') AS preferred_date_1,
                DATE_FORMAT(cr.preferred_date_2, '%Y-%m-%d') AS preferred_date_2,
                DATE_FORMAT(cr.preferred_date_3, '%Y-%m-%d') AS preferred_date_3,
                DATE_FORMAT(cr.scheduled_date, '%Y-%m-%d') AS scheduled_date,
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
                DATE_FORMAT(cr.preferred_date_1, '%Y-%m-%d') AS preferred_date_1,
                DATE_FORMAT(cr.preferred_date_2, '%Y-%m-%d') AS preferred_date_2,
                DATE_FORMAT(cr.preferred_date_3, '%Y-%m-%d') AS preferred_date_3,
                DATE_FORMAT(cr.scheduled_date, '%Y-%m-%d') AS scheduled_date,
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
                DATE_FORMAT(cr.preferred_date_1, '%Y-%m-%d') AS preferred_date_1,
                DATE_FORMAT(cr.preferred_date_2, '%Y-%m-%d') AS preferred_date_2,
                DATE_FORMAT(cr.preferred_date_3, '%Y-%m-%d') AS preferred_date_3,
                DATE_FORMAT(cr.scheduled_date, '%Y-%m-%d') AS scheduled_date,
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

// ==================== LEADS (NUEVOS CLIENTES POTENCIALES) ====================

// Migración: crear tabla leads
router.post('/leads/migrate', requireSuperAdmin, async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_name VARCHAR(255) NOT NULL,
                contact_phone VARCHAR(50),
                website VARCHAR(500),
                status ENUM('pending', 'valid', 'invalid') DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        res.json({ success: true, message: 'Tabla leads creada correctamente' });
    } catch (error) {
        console.error('Error en migración leads:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Listar leads
router.get('/leads', requireSuperAdmin, async (req, res) => {
    try {
        const leads = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.json({ success: true, data: leads });
    } catch (error) {
        console.error('Error listando leads:', error);
        res.status(500).json({ success: false, message: 'Error al obtener leads' });
    }
});

// Crear lead
router.post('/leads', requireSuperAdmin, async (req, res) => {
    try {
        const { business_name, contact_phone, website, notes } = req.body;
        if (!business_name) return res.status(400).json({ success: false, message: 'Nombre requerido' });

        const result = await db.query(
            'INSERT INTO leads (business_name, contact_phone, website, notes) VALUES (?, ?, ?, ?)',
            [business_name, contact_phone || null, website || null, notes || null]
        );
        const [lead] = await db.query('SELECT * FROM leads WHERE id = ?', [result.insertId]);
        res.json({ success: true, data: lead });
    } catch (error) {
        console.error('Error creando lead:', error);
        res.status(500).json({ success: false, message: 'Error al crear lead' });
    }
});

// Actualizar lead
router.patch('/leads/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { business_name, contact_phone, website, status, notes } = req.body;

        const fields = [];
        const values = [];
        if (business_name !== undefined) { fields.push('business_name = ?'); values.push(business_name); }
        if (contact_phone !== undefined) { fields.push('contact_phone = ?'); values.push(contact_phone); }
        if (website !== undefined)       { fields.push('website = ?');       values.push(website); }
        if (status !== undefined)        { fields.push('status = ?');        values.push(status); }
        if (notes !== undefined)         { fields.push('notes = ?');         values.push(notes); }

        if (fields.length === 0) return res.status(400).json({ success: false, message: 'Nada que actualizar' });

        values.push(id);
        await db.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);
        const [lead] = await db.query('SELECT * FROM leads WHERE id = ?', [id]);
        res.json({ success: true, data: lead });
    } catch (error) {
        console.error('Error actualizando lead:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar lead' });
    }
});

// Borrar lead
router.delete('/leads/:id', requireSuperAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error borrando lead:', error);
        res.status(500).json({ success: false, message: 'Error al borrar lead' });
    }
});

// ==================== CAPTACIÓN (agente de captación) ====================
// Ver backend/prospects.js y docs/captacion/diseno-agente-captacion.md

const prospects = require('../prospects');

const PROSPECT_FIELDS = ['name', 'sector', 'address', 'district', 'city', 'phone', 'website', 'instagram',
    'booking_method', 'booking_tool', 'hook', 'call_script', 'wa_message', 'followup_message', 'notes', 'next_action_at'];

// Lista (vista «hoy» o «todos» con filtros)
router.get('/prospects', requireSuperAdmin, async (req, res) => {
    try {
        const { view, status, sector, tier, q } = req.query;
        const where = [];
        const vals = [];
        if (view === 'today') {
            where.push(`next_action_at IS NOT NULL AND next_action_at <= CURDATE() AND status NOT IN ('no_interesa','no_contactar','descartado')`);
        }
        if (status && prospects.ESTADOS.includes(status)) { where.push('status = ?'); vals.push(status); }
        if (sector && prospects.SECTORES.includes(sector)) { where.push('sector = ?'); vals.push(sector); }
        if (tier && ['A', 'B', 'C'].includes(tier)) { where.push('tier = ?'); vals.push(tier); }
        if (q && String(q).trim()) {
            where.push('(name LIKE ? OR city LIKE ? OR district LIKE ? OR phone LIKE ?)');
            const like = `%${String(q).trim().slice(0, 80)}%`;
            vals.push(like, like, like, like);
        }
        const order = view === 'today'
            ? `FIELD(status,'permiso_wa','volver_llamar','registrado','interesado','mensaje_enviado','seguimiento','no_contesta','nuevo'), score DESC`
            : 'updated_at DESC';
        const rows = await db.query(
            `SELECT * FROM prospects ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT 500`,
            vals
        );
        res.json({ success: true, data: rows.map(prospects.fixDates) });
    } catch (error) {
        console.error('Error listando captación:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los contactos' });
    }
});

// Historial de un contacto
router.get('/prospects/:id/events', requireSuperAdmin, async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM prospect_events WHERE prospect_id = ? ORDER BY created_at DESC LIMIT 100', [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el historial' });
    }
});

// Alta manual (el negocio que ves por la calle)
router.post('/prospects', requireSuperAdmin, async (req, res) => {
    try {
        const b = req.body || {};
        if (!b.name || !String(b.name).trim()) return res.status(400).json({ success: false, message: 'Falta el nombre del negocio' });
        if (await prospects.isDoNotContact(db, b)) return res.status(409).json({ success: false, message: 'Este negocio está en la lista de no contactar' });
        const dup = await prospects.findDuplicate(db, b);
        if (dup) return res.status(409).json({ success: false, message: 'Ya está en la lista', id: dup });
        const id = await prospects.insertProspect(db, { ...b, source: b.source || 'Añadido a mano', source_date: null });
        const [row] = await db.query('SELECT * FROM prospects WHERE id = ?', [id]);
        res.json({ success: true, data: prospects.fixDates(row) });
    } catch (error) {
        console.error('Error creando contacto:', error);
        res.status(500).json({ success: false, message: 'Error al añadir el negocio' });
    }
});

// Importar una tanda del agente
router.post('/prospects/import', requireSuperAdmin, async (req, res) => {
    try {
        const body = req.body || {};
        const items = Array.isArray(body) ? body : body.prospects;
        if (!Array.isArray(items) || !items.length) return res.status(400).json({ success: false, message: 'El archivo no trae negocios' });
        if (items.length > 300) return res.status(400).json({ success: false, message: 'Máximo 300 negocios por tanda' });
        const result = await prospects.importBatch(db, items, Array.isArray(body) ? null : body.batch);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error importando tanda:', error);
        res.status(500).json({ success: false, message: 'Error al importar la tanda' });
    }
});

// Editar datos (teléfono, notas, fecha del próximo paso…)
router.patch('/prospects/:id', requireSuperAdmin, async (req, res) => {
    try {
        const b = req.body || {};
        const sets = [];
        const vals = [];
        for (const f of PROSPECT_FIELDS) {
            if (b[f] === undefined) continue;
            if (f === 'next_action_at') {
                if (b[f] !== null && !/^\d{4}-\d{2}-\d{2}$/.test(b[f])) continue;
            }
            if (f === 'sector' && b[f] && !prospects.SECTORES.includes(b[f])) continue;
            sets.push(`${f} = ?`);
            vals.push(b[f] === '' ? null : b[f]);
            if (f === 'phone') { sets.push('phone_norm = ?'); vals.push(prospects.normPhone(b[f])); }
        }
        if (!sets.length) return res.status(400).json({ success: false, message: 'Nada que actualizar' });
        vals.push(req.params.id);
        await db.query(`UPDATE prospects SET ${sets.join(', ')} WHERE id = ?`, vals);
        if (b.notes !== undefined) await prospects.logEvent(db, req.params.id, 'nota', 'notas actualizadas');
        const [row] = await db.query('SELECT * FROM prospects WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: prospects.fixDates(row) });
    } catch (error) {
        console.error('Error actualizando contacto:', error);
        res.status(500).json({ success: false, message: 'Error al guardar' });
    }
});

// Resultado de una llamada, visita o mensaje
router.post('/prospects/:id/outcome', requireSuperAdmin, async (req, res) => {
    try {
        const { outcome, date, reason } = req.body || {};
        const r = await prospects.applyOutcome(db, req.params.id, outcome, { date, reason });
        if (!r) return res.status(404).json({ success: false, message: 'No encontrado' });
        if (r.error) return res.status(400).json({ success: false, message: r.error });
        res.json({ success: true, data: r.prospect, deleted: !!r.deleted });
    } catch (error) {
        console.error('Error guardando resultado:', error);
        res.status(500).json({ success: false, message: 'Error al guardar el resultado' });
    }
});

// Borrar un contacto (p. ej. si pide que borremos sus datos). Queda en la lista de no contactar.
router.delete('/prospects/:id', requireSuperAdmin, async (req, res) => {
    try {
        const [p] = await db.query('SELECT * FROM prospects WHERE id = ?', [req.params.id]);
        if (!p) return res.status(404).json({ success: false, message: 'No encontrado' });
        await prospects.addDoNotContact(db, { phone: p.phone, name: p.name, city: p.city, reason: 'Datos borrados a petición' });
        await db.query('DELETE FROM prospect_events WHERE prospect_id = ?', [p.id]);
        await db.query('DELETE FROM prospects WHERE id = ?', [p.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al borrar' });
    }
});

// Estadísticas del embudo
router.get('/prospects-stats', requireSuperAdmin, async (req, res) => {
    try {
        res.json({ success: true, data: await prospects.getStats(db) });
    } catch (error) {
        console.error('Error en estadísticas de captación:', error);
        res.status(500).json({ success: false, message: 'Error al calcular las estadísticas' });
    }
});

// Lista de no contactar
router.get('/do-not-contact', requireSuperAdmin, async (req, res) => {
    try {
        const rows = await db.query('SELECT * FROM do_not_contact ORDER BY created_at DESC LIMIT 2000');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la lista' });
    }
});

router.post('/do-not-contact', requireSuperAdmin, async (req, res) => {
    try {
        const { phone, name, city, reason } = req.body || {};
        if (!prospects.normPhone(phone) && !prospects.normText(name)) return res.status(400).json({ success: false, message: 'Indica un teléfono o un nombre' });
        await prospects.addDoNotContact(db, { phone, name, city, reason: reason || 'Añadido a mano' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al guardar' });
    }
});

// Exportar para el agente (CSV sin guiones ni mensajes)
router.get('/prospects-export', requireSuperAdmin, async (req, res) => {
    try {
        const csvCell = v => {
            if (v === null || v === undefined) return '';
            let s = v instanceof Date
                ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
                : String(v);
            if (/^[=+\-@]/.test(s)) s = "'" + s; // evita fórmulas al abrirlo en Excel
            return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        if (req.query.type === 'dnc') {
            const rows = await db.query('SELECT phone_norm, name_norm, city_norm, created_at FROM do_not_contact');
            const lines = ['phone_norm,name_norm,city_norm,created_at', ...rows.map(r => [r.phone_norm, r.name_norm, r.city_norm, r.created_at].map(csvCell).join(','))];
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="no-contactar.csv"');
            return res.send('﻿' + lines.join('\n'));
        }
        const cols = ['id', 'name', 'sector', 'district', 'city', 'phone_norm', 'website', 'instagram', 'booking_method', 'booking_tool',
            'score', 'tier', 'source', 'batch', 'variant', 'status', 'attempts', 'consent_wa_at', 'business_id', 'created_at', 'updated_at'];
        const rows = await db.query(`SELECT ${cols.join(', ')} FROM prospects ORDER BY id`);
        const events = await db.query(`SELECT prospect_id, type, created_at FROM prospect_events WHERE prospect_id > 0 ORDER BY id`);
        const byP = {};
        for (const e of events) (byP[e.prospect_id] = byP[e.prospect_id] || []).push(e.type);
        const lines = [[...cols, 'historial'].join(','),
            ...rows.map(r => [...cols.map(c => csvCell(r[c])), csvCell((byP[r.id] || []).join('>'))].join(','))];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="captacion.csv"');
        res.send('﻿' + lines.join('\n'));
    } catch (error) {
        console.error('Error exportando captación:', error);
        res.status(500).json({ success: false, message: 'Error al exportar' });
    }
});

// Documentos internos (guía de captación): se guardan en la base de datos para no publicarlos en el repositorio
const DOC_KEYS = ['guia-captacion'];

router.get('/documents/:key', requireSuperAdmin, async (req, res) => {
    try {
        if (!DOC_KEYS.includes(req.params.key)) return res.status(404).json({ success: false, message: 'Documento desconocido' });
        const [doc] = await db.query('SELECT content, updated_at FROM admin_documents WHERE doc_key = ?', [req.params.key]);
        res.json({ success: true, data: doc || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al leer el documento' });
    }
});

router.put('/documents/:key', requireSuperAdmin, async (req, res) => {
    try {
        if (!DOC_KEYS.includes(req.params.key)) return res.status(404).json({ success: false, message: 'Documento desconocido' });
        const content = String((req.body || {}).content || '');
        if (!content.trim()) return res.status(400).json({ success: false, message: 'El documento está vacío' });
        if (content.length > 500000) return res.status(400).json({ success: false, message: 'Documento demasiado grande' });
        await db.query(
            'INSERT INTO admin_documents (doc_key, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)',
            [req.params.key, content]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al guardar el documento' });
    }
});

// Salud del envío de emails (aviso en el dashboard si fallan)
router.get('/email-health', requireSuperAdmin, async (req, res) => {
    try {
        res.json({ success: true, data: await require('../email-health').getHealth(db) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al comprobar los emails' });
    }
});

// Regalar un mes de Profesional a un negocio (último empujón de la captación)
router.post('/businesses/:id/gift-month', requireSuperAdmin, async (req, res) => {
    try {
        const { grantMonth } = require('../referrals');
        const result = await grantMonth(db, Number(req.params.id));
        if (!result) return res.status(400).json({ success: false, message: 'No se puede regalar a este negocio (no existe o es una demo)' });
        if (result === 'pending') return res.json({ success: true, message: 'Ya paga un plan: apuntado como mes a descontar', result });
        const [b] = await db.query('SELECT plan, plan_bonus_until FROM businesses WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Mes de Profesional regalado', result, data: b });
    } catch (error) {
        console.error('Error regalando mes:', error);
        res.status(500).json({ success: false, message: 'Error al regalar el mes' });
    }
});

module.exports = router;
