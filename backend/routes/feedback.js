const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

// Permitir inyección de la base de datos
let db = require('../../config/database');

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

// ==================== ENVIAR FEEDBACK (PÚBLICO) ====================

/**
 * POST /api/feedback
 * Enviar feedback de un cliente (público, accesible vía token)
 */
router.post('/api/feedback', async (req, res) => {
    try {
        const { token, rating, comment, questions } = req.body;

        // Validaciones básicas
        if (!token || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Token y calificación son requeridos'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'La calificación debe estar entre 1 y 5'
            });
        }

        // Buscar la reserva con ese token
        const bookings = await db.query(
            `SELECT b.id, b.business_id, b.customer_name, b.customer_email,
                    b.service_id, b.booking_date, b.status, b.feedback_sent
             FROM bookings b
             WHERE b.feedback_token = ? AND b.status = 'completed'`,
            [token]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Reserva no encontrada o token inválido'
            });
        }

        const booking = bookings[0];

        // Verificar si ya existe feedback para esta reserva
        const existingFeedback = await db.query(
            'SELECT id FROM service_feedback WHERE booking_id = ?',
            [booking.id]
        );

        if (existingFeedback.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya has enviado tu opinión para esta reserva'
            });
        }

        // Guardar feedback
        await db.query(
            `INSERT INTO service_feedback
             (booking_id, business_id, customer_name, customer_email, rating, comment, questions, feedback_token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                booking.id,
                booking.business_id,
                booking.customer_name,
                booking.customer_email,
                rating,
                comment || null,
                questions ? JSON.stringify(questions) : null,
                token
            ]
        );

        res.json({
            success: true,
            message: '¡Gracias por tu opinión! Tu feedback ha sido registrado exitosamente.'
        });

    } catch (error) {
        console.error('Error al guardar feedback:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu opinión. Por favor, inténtalo de nuevo.'
        });
    }
});

// ==================== OBTENER FEEDBACK (ADMIN) ====================

/**
 * GET /api/admin/feedback/:businessId
 * Obtener lista de feedbacks del negocio (requiere autenticación)
 */
router.get('/api/admin/feedback/:businessId', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { rating, serviceId, startDate, endDate, limit = 50, offset = 0 } = req.query;

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId !== parseInt(businessId)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        // Construir query con filtros
        let query = `
            SELECT
                sf.id,
                sf.booking_id,
                sf.customer_name,
                sf.customer_email,
                sf.rating,
                sf.comment,
                sf.questions,
                sf.created_at,
                s.name as service_name,
                b.booking_date
            FROM service_feedback sf
            LEFT JOIN bookings b ON sf.booking_id = b.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE sf.business_id = ?
        `;

        const params = [parseInt(businessId)];

        // Filtros opcionales
        if (rating) {
            query += ' AND sf.rating = ?';
            params.push(parseInt(rating));
        }

        if (serviceId) {
            query += ' AND b.service_id = ?';
            params.push(parseInt(serviceId));
        }

        if (startDate) {
            query += ' AND sf.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND sf.created_at <= ?';
            params.push(endDate);
        }

        // Asegurar que limit y offset sean números válidos
        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;

        // Usar interpolación directa para LIMIT y OFFSET (seguro porque son números validados)
        query += ` ORDER BY sf.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const feedbacks = await db.query(query, params);

        // Parsear JSON questions (solo si es string, MySQL puede devolverlo ya parseado)
        feedbacks.forEach(feedback => {
            if (feedback.questions && typeof feedback.questions === 'string') {
                try {
                    feedback.questions = JSON.parse(feedback.questions);
                } catch (e) {
                    feedback.questions = null;
                }
            }
        });

        res.json({
            success: true,
            data: feedbacks
        });

    } catch (error) {
        console.error('Error al obtener feedbacks:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener opiniones'
        });
    }
});

// ==================== ESTADÍSTICAS DE FEEDBACK (ADMIN) ====================

/**
 * GET /api/admin/feedback/stats/:businessId
 * Obtener estadísticas de feedbacks del negocio
 */
router.get('/api/admin/feedback/stats/:businessId', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verificar acceso
        if (req.user.businessId !== parseInt(businessId)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        // Rating promedio y total de feedbacks
        const [generalStats] = await db.query(
            `SELECT
                COUNT(*) as total,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
             FROM service_feedback
             WHERE business_id = ?`,
            [businessId]
        );

        // Feedbacks de los últimos 7 días
        const [recentStats] = await db.query(
            `SELECT COUNT(*) as recent_count
             FROM service_feedback
             WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [businessId]
        );

        // Feedbacks de los últimos 30 días (para tendencia)
        const [monthlyStats] = await db.query(
            `SELECT COUNT(*) as monthly_count
             FROM service_feedback
             WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            [businessId]
        );

        // Tendencia por semana (últimas 4 semanas)
        const weeklyTrend = await db.query(
            `SELECT
                WEEK(created_at) as week_number,
                YEAR(created_at) as year,
                COUNT(*) as count,
                AVG(rating) as avg_rating
             FROM service_feedback
             WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
             GROUP BY YEAR(created_at), WEEK(created_at)
             ORDER BY year DESC, week_number DESC`,
            [businessId]
        );

        res.json({
            success: true,
            data: {
                total: generalStats.total || 0,
                averageRating: generalStats.average_rating ? parseFloat(generalStats.average_rating).toFixed(1) : 0,
                distribution: {
                    5: generalStats.five_stars || 0,
                    4: generalStats.four_stars || 0,
                    3: generalStats.three_stars || 0,
                    2: generalStats.two_stars || 0,
                    1: generalStats.one_star || 0
                },
                recentCount: recentStats.recent_count || 0,
                monthlyCount: monthlyStats.monthly_count || 0,
                weeklyTrend: weeklyTrend
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// ==================== VERIFICAR TOKEN (PÚBLICO) ====================

/**
 * GET /api/feedback/verify/:token
 * Verificar si un token de feedback es válido y obtener info de la reserva
 */
router.get('/api/feedback/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        console.log('🔍 [verify] Token recibido:', token);
        console.log('🔍 [verify] db module existe:', !!db);
        console.log('🔍 [verify] db.query existe:', !!db.query);

        const bookings = await db.query(
            `SELECT
                b.id,
                b.business_id,
                b.customer_name,
                b.booking_date,
                s.name as service_name,
                bus.name as business_name
             FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             LEFT JOIN businesses bus ON b.business_id = bus.id
             WHERE b.feedback_token = ? AND b.status = 'completed'`,
            [token]
        );

        console.log('🔍 [verify] Bookings encontrados:', bookings.length);
        if (bookings.length > 0) {
            console.log('🔍 [verify] Primera reserva:', bookings[0]);
        }

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Token inválido o reserva no encontrada'
            });
        }

        // Verificar si ya existe feedback
        const existingFeedback = await db.query(
            'SELECT id FROM service_feedback WHERE booking_id = ?',
            [bookings[0].id]
        );

        if (existingFeedback.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Ya has enviado tu opinión para esta reserva',
                alreadySubmitted: true
            });
        }

        res.json({
            success: true,
            data: {
                booking: bookings[0],
                alreadySubmitted: false
            }
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar token',
            details: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

module.exports = router;
