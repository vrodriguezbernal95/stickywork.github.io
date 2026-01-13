// Rutas para AI Reports
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireBusinessAccess } = require('../middleware/auth');

// ==================== OBTENER HISTÓRICO DE REPORTES ====================

/**
 * GET /api/reports/history
 * Obtener todos los reportes generados para el negocio actual
 */
router.get('/api/reports/history', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.business_id;

        // Verificar que el negocio tenga habilitados los reportes IA
        const businesses = await db.query(
            'SELECT ai_reports_enabled FROM businesses WHERE id = ?',
            [businessId]
        );

        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        if (!businesses[0].ai_reports_enabled) {
            return res.status(403).json({
                success: false,
                message: 'Los Reportes IA no están habilitados para este negocio'
            });
        }

        // Obtener todos los reportes del negocio
        const reports = await db.query(
            `SELECT
                id,
                month,
                year,
                generated_at,
                generated_by,
                tokens_used,
                generation_time_ms,
                pdf_generated,
                pdf_path
             FROM ai_reports
             WHERE business_id = ?
             ORDER BY year DESC, month DESC`,
            [businessId]
        );

        res.json({
            success: true,
            data: reports || []
        });

    } catch (error) {
        console.error('Error al obtener histórico de reportes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar el histórico de reportes'
        });
    }
});

// ==================== OBTENER REPORTE ESPECÍFICO ====================

/**
 * GET /api/reports/:id
 * Obtener un reporte específico con todos sus detalles
 */
router.get('/api/reports/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.business_id;

        // Obtener el reporte
        const reports = await db.query(
            `SELECT * FROM ai_reports
             WHERE id = ? AND business_id = ?`,
            [id, businessId]
        );

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        const report = reports[0];

        // Parse JSON fields
        if (report.stats && typeof report.stats === 'string') {
            report.stats = JSON.parse(report.stats);
        }
        if (report.ai_insights && typeof report.ai_insights === 'string') {
            report.ai_insights = JSON.parse(report.ai_insights);
        }
        if (report.ai_strengths && typeof report.ai_strengths === 'string') {
            report.ai_strengths = JSON.parse(report.ai_strengths);
        }
        if (report.ai_weaknesses && typeof report.ai_weaknesses === 'string') {
            report.ai_weaknesses = JSON.parse(report.ai_weaknesses);
        }
        if (report.ai_recommendations && typeof report.ai_recommendations === 'string') {
            report.ai_recommendations = JSON.parse(report.ai_recommendations);
        }
        if (report.ai_action_plan && typeof report.ai_action_plan === 'string') {
            report.ai_action_plan = JSON.parse(report.ai_action_plan);
        }

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Error al obtener reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar el reporte'
        });
    }
});

// ==================== GENERAR NUEVO REPORTE ====================

/**
 * POST /api/reports/generate
 * Generar un nuevo reporte con IA para un mes/año específico
 */
router.post('/api/reports/generate', requireAuth, async (req, res) => {
    try {
        const { month, year } = req.body;
        const businessId = req.user.business_id;

        // Validar parámetros
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                message: 'Mes inválido (debe ser entre 1 y 12)'
            });
        }

        if (yearNum < 2020 || yearNum > new Date().getFullYear()) {
            return res.status(400).json({
                success: false,
                message: 'Año inválido'
            });
        }

        // Verificar que el negocio tenga habilitados los reportes IA
        const businesses = await db.query(
            'SELECT name, ai_reports_enabled FROM businesses WHERE id = ?',
            [businessId]
        );

        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const business = businesses[0];

        if (!business.ai_reports_enabled) {
            return res.status(403).json({
                success: false,
                message: 'Los Reportes IA no están habilitados para este negocio'
            });
        }

        // Verificar si ya existe un reporte para este período
        const existingReports = await db.query(
            'SELECT id FROM ai_reports WHERE business_id = ? AND month = ? AND year = ?',
            [businessId, monthNum, yearNum]
        );

        if (existingReports && existingReports.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Ya existe un reporte para ${getMonthName(monthNum)} ${yearNum}`,
                reportId: existingReports[0].id
            });
        }

        // TODO: Aquí irá la integración con Claude API
        // Por ahora, crear un reporte de ejemplo

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        // Obtener estadísticas reales del período
        const stats = await getBusinessStats(businessId, startDate, endDate);

        // Insertar el reporte en la base de datos
        const result = await db.query(
            `INSERT INTO ai_reports (
                business_id, month, year, stats,
                ai_executive_summary, ai_insights, ai_strengths, ai_weaknesses,
                ai_feedback_analysis, ai_recommendations, ai_economic_impact, ai_action_plan,
                generated_by, tokens_used, generation_time_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                businessId,
                monthNum,
                yearNum,
                JSON.stringify(stats),
                'Resumen ejecutivo generado por IA (pendiente de implementación)',
                JSON.stringify(['Insight 1', 'Insight 2']),
                JSON.stringify(['Fortaleza 1', 'Fortaleza 2']),
                JSON.stringify(['Debilidad 1', 'Debilidad 2']),
                'Análisis de feedback (pendiente de implementación)',
                JSON.stringify(['Recomendación 1', 'Recomendación 2']),
                'Impacto económico (pendiente de implementación)',
                JSON.stringify(['Acción 1', 'Acción 2']),
                'manual', // Cambiar a 'claude-sonnet-4' cuando se integre
                0,
                0
            ]
        );

        const reportId = result.insertId;

        res.json({
            success: true,
            message: 'Reporte generado correctamente',
            data: {
                reportId,
                month: monthNum,
                year: yearNum
            }
        });

    } catch (error) {
        console.error('Error al generar reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar el reporte',
            error: error.message
        });
    }
});

// ==================== HELPER FUNCTIONS ====================

async function getBusinessStats(businessId, startDate, endDate) {
    try {
        // Total de reservas
        const bookingsResult = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ? AND booking_date BETWEEN ? AND ?`,
            [businessId, startDate, endDate]
        );

        // Reservas completadas
        const completedResult = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ? AND booking_date BETWEEN ? AND ? AND status = 'completed'`,
            [businessId, startDate, endDate]
        );

        // Reservas canceladas
        const cancelledResult = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ? AND booking_date BETWEEN ? AND ? AND status = 'cancelled'`,
            [businessId, startDate, endDate]
        );

        // Servicios más solicitados
        const topServicesResult = await db.query(
            `SELECT s.name, COUNT(*) as count
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             WHERE b.business_id = ? AND b.booking_date BETWEEN ? AND ?
             GROUP BY s.id, s.name
             ORDER BY count DESC
             LIMIT 5`,
            [businessId, startDate, endDate]
        );

        return {
            totalBookings: bookingsResult?.[0]?.total || 0,
            completedBookings: completedResult?.[0]?.total || 0,
            cancelledBookings: cancelledResult?.[0]?.total || 0,
            topServices: topServicesResult || []
        };

    } catch (error) {
        console.error('Error getting business stats:', error);
        return {
            totalBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            topServices: []
        };
    }
}

function getMonthName(month) {
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1];
}

module.exports = router;
