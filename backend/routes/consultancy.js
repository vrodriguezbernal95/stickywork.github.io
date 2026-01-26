const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { sendConsultancyRequestToAdmin } = require('../email-service');

// Permitir inyección de la base de datos
let db = require('../../config/database');

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

/**
 * Verificar si el negocio tiene plan Premium activo
 * Busca primero en subscriptions (Stripe), luego en businesses.plan (legacy)
 */
async function isPremiumBusiness(businessId) {
    // Primero intentar buscar en subscriptions (para suscripciones de Stripe)
    const subscription = await db.query(`
        SELECT plan_name, status
        FROM subscriptions
        WHERE business_id = ?
        AND status IN ('active', 'trialing')
        ORDER BY created_at DESC
        LIMIT 1
    `, [businessId]);

    if (subscription && subscription.length > 0) {
        return subscription[0].plan_name === 'premium';
    }

    // Si no hay suscripción en Stripe, verificar en la tabla businesses (legacy)
    const business = await db.query(`
        SELECT plan, subscription_status
        FROM businesses
        WHERE id = ?
    `, [businessId]);

    if (!business || business.length === 0) {
        return false;
    }

    // Verificar que tenga plan premium y estado activo o trial
    const validStatus = ['active', 'trialing', 'trial'];
    return business[0].plan === 'premium' && validStatus.includes(business[0].subscription_status);
}

/**
 * Verificar si el negocio ya usó su consultoría este mes
 */
async function hasUsedMonthlyConsultancy(businessId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const existing = await db.query(`
        SELECT id, status
        FROM consultancy_requests
        WHERE business_id = ?
        AND request_month = ?
        AND request_year = ?
        AND status != 'canceled'
    `, [businessId, currentMonth, currentYear]);

    return existing && existing.length > 0;
}

/**
 * GET /api/consultancy/can-request
 * Verificar si el cliente puede solicitar una consultoría
 */
router.get('/can-request', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;

        // Verificar si es Premium
        const isPremium = await isPremiumBusiness(businessId);

        if (!isPremium) {
            return res.json({
                success: true,
                canRequest: false,
                reason: 'not_premium',
                message: 'Las consultorías personalizadas están disponibles exclusivamente para clientes Premium.'
            });
        }

        // Verificar límite mensual
        const hasUsed = await hasUsedMonthlyConsultancy(businessId);

        if (hasUsed) {
            return res.json({
                success: true,
                canRequest: false,
                reason: 'monthly_limit',
                message: 'Ya has utilizado tu consultoría gratuita de este mes. Podrás solicitar otra el próximo mes.'
            });
        }

        res.json({
            success: true,
            canRequest: true,
            reason: 'eligible',
            message: 'Puedes solicitar tu consultoría gratuita de este mes.'
        });

    } catch (error) {
        console.error('Error checking consultancy eligibility:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar elegibilidad'
        });
    }
});

/**
 * POST /api/consultancy
 * Crear una solicitud de consultoría (solo Premium, 1/mes)
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const userId = req.user.id;
        const {
            topic,
            description,
            preferred_date_1,
            preferred_date_2,
            preferred_date_3,
            preferred_time_slot
        } = req.body;

        // Validaciones básicas
        if (!topic || !description || !preferred_date_1) {
            return res.status(400).json({
                success: false,
                message: 'Tema, descripción y al menos una fecha preferida son obligatorios'
            });
        }

        if (topic.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El tema no puede exceder 100 caracteres'
            });
        }

        if (description.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporciona una descripción más detallada (mínimo 20 caracteres)'
            });
        }

        // Verificar si es Premium
        const isPremium = await isPremiumBusiness(businessId);

        if (!isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Las consultorías están disponibles exclusivamente para clientes Premium.'
            });
        }

        // Verificar límite mensual
        const hasUsed = await hasUsedMonthlyConsultancy(businessId);

        if (hasUsed) {
            return res.status(400).json({
                success: false,
                message: 'Ya has utilizado tu consultoría gratuita de este mes.'
            });
        }

        // Validar fechas (deben ser futuras)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const date1 = new Date(preferred_date_1);
        if (date1 <= today) {
            return res.status(400).json({
                success: false,
                message: 'La fecha preferida debe ser posterior a hoy'
            });
        }

        // Validar time slot
        const validSlots = ['morning', 'afternoon', 'evening'];
        const timeSlot = preferred_time_slot || 'morning';
        if (!validSlots.includes(timeSlot)) {
            return res.status(400).json({
                success: false,
                message: 'Franja horaria no válida'
            });
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Crear la solicitud
        const result = await db.query(`
            INSERT INTO consultancy_requests (
                business_id,
                user_id,
                topic,
                description,
                preferred_date_1,
                preferred_date_2,
                preferred_date_3,
                preferred_time_slot,
                request_month,
                request_year,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [
            businessId,
            userId,
            topic,
            description,
            preferred_date_1,
            preferred_date_2 || null,
            preferred_date_3 || null,
            timeSlot,
            currentMonth,
            currentYear
        ]);

        // Obtener la solicitud creada con info del negocio
        const newRequest = await db.query(`
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
        `, [result.insertId]);

        // Enviar email de notificación al super-admin
        try {
            await sendConsultancyRequestToAdmin(
                {
                    topic,
                    description,
                    preferred_date_1,
                    preferred_date_2,
                    preferred_date_3,
                    preferred_time_slot: timeSlot
                },
                { name: newRequest[0].business_name },
                { email: newRequest[0].user_email, full_name: newRequest[0].user_name }
            );
        } catch (emailError) {
            console.error('Error sending consultancy notification email:', emailError);
            // No fallar si el email no se envía
        }

        res.json({
            success: true,
            message: 'Solicitud de consultoría enviada correctamente. Nos pondremos en contacto contigo pronto.',
            data: newRequest[0]
        });

    } catch (error) {
        console.error('Error creating consultancy request:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear solicitud de consultoría'
        });
    }
});

/**
 * GET /api/consultancy/my-requests
 * Obtener las solicitudes de consultoría del negocio actual
 */
router.get('/my-requests', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const requests = await db.query(`
            SELECT
                cr.*,
                au.full_name as user_name
            FROM consultancy_requests cr
            JOIN admin_users au ON cr.user_id = au.id
            WHERE cr.business_id = ?
            ORDER BY cr.created_at DESC
        `, [businessId]);

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Error fetching consultancy requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener solicitudes'
        });
    }
});

/**
 * GET /api/consultancy/:id
 * Obtener detalle de una solicitud específica
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const requestId = req.params.id;

        const request = await db.query(`
            SELECT
                cr.*,
                au.full_name as user_name,
                au.email as user_email
            FROM consultancy_requests cr
            JOIN admin_users au ON cr.user_id = au.id
            WHERE cr.id = ? AND cr.business_id = ?
        `, [requestId, businessId]);

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

/**
 * DELETE /api/consultancy/:id
 * Cancelar una solicitud (solo si está pendiente)
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const requestId = req.params.id;

        // Verificar que existe y pertenece al negocio
        const request = await db.query(`
            SELECT id, status
            FROM consultancy_requests
            WHERE id = ? AND business_id = ?
        `, [requestId, businessId]);

        if (!request || request.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        if (request[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar solicitudes pendientes'
            });
        }

        // Cancelar la solicitud
        await db.query(`
            UPDATE consultancy_requests
            SET status = 'canceled', updated_at = NOW()
            WHERE id = ?
        `, [requestId]);

        res.json({
            success: true,
            message: 'Solicitud cancelada correctamente'
        });

    } catch (error) {
        console.error('Error canceling consultancy request:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar solicitud'
        });
    }
});

module.exports = router;
