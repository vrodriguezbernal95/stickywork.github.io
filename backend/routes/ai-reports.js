// Rutas para AI Reports
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireBusinessAccess } = require('../middleware/auth');
const claudeService = require('../services/claude-service');

// ==================== OBTENER HISTÓRICO DE REPORTES ====================

/**
 * GET /api/reports/history
 * Obtener todos los reportes generados para el negocio actual
 */
router.get('/api/reports/history', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.business_id;

        console.log('[AI Reports] Loading history for business:', businessId);

        // Verificar que el negocio tenga habilitados los reportes IA
        const businesses = await db.query(
            'SELECT ai_reports_enabled FROM businesses WHERE id = ?',
            [businessId]
        );

        console.log('[AI Reports] Business query result:', businesses);

        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const aiReportsEnabled = businesses[0].ai_reports_enabled;
        console.log('[AI Reports] ai_reports_enabled value:', aiReportsEnabled, 'type:', typeof aiReportsEnabled);

        // Verificar si está habilitado (puede ser boolean o 1/0)
        if (aiReportsEnabled !== true && aiReportsEnabled !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Los Reportes IA no están habilitados para este negocio'
            });
        }

        // Obtener todos los reportes del negocio
        console.log('[AI Reports] Querying ai_reports table for business:', businessId);
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

        console.log('[AI Reports] Found reports:', reports ? reports.length : 0);

        res.json({
            success: true,
            data: reports || []
        });

    } catch (error) {
        console.error('[AI Reports] Error al obtener histórico de reportes:', error);
        console.error('[AI Reports] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al cargar el histórico de reportes',
            error: error.message
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
        const aiReportsEnabled = business.ai_reports_enabled;

        // Verificar si está habilitado (puede ser boolean o 1/0)
        if (aiReportsEnabled !== true && aiReportsEnabled !== 1) {
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

        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        // Obtener estadísticas reales del período
        const stats = await getBusinessStats(businessId, startDate, endDate);

        // Obtener feedback/comentarios del período (si existen)
        const feedback = await getBusinessFeedback(businessId, startDate, endDate);

        // Generar reporte con Claude AI
        console.log('🤖 Generando reporte con Claude API...');

        let aiReport, tokensUsed, generationTime, modelUsed;

        if (claudeService.isConfigured()) {
            // Generar reporte real con Claude
            const claudeResponse = await claudeService.generateBusinessReport({
                businessName: business.name,
                month: monthNum,
                year: yearNum,
                stats,
                feedback
            });

            aiReport = claudeResponse.report;
            tokensUsed = claudeResponse.metadata.tokensUsed;
            generationTime = claudeResponse.metadata.generationTimeMs;
            modelUsed = claudeResponse.metadata.model;

            console.log(`✅ Reporte generado con ${modelUsed} (${tokensUsed} tokens, ${generationTime}ms)`);
        } else {
            // Fallback: generar reporte de ejemplo
            console.warn('⚠️ ANTHROPIC_API_KEY no configurada, usando reporte de ejemplo');
            aiReport = {
                executiveSummary: `Reporte de ejemplo para ${business.name} - ${getMonthName(monthNum)} ${yearNum}. Configure ANTHROPIC_API_KEY para generar reportes reales con IA.`,
                insights: [
                    'Este es un reporte de ejemplo',
                    'Configure su API key de Anthropic en el archivo .env',
                    'Luego agregue la misma clave en Railway como variable de entorno'
                ],
                strengths: ['Fortaleza de ejemplo 1', 'Fortaleza de ejemplo 2'],
                weaknesses: ['Área de mejora de ejemplo 1', 'Área de mejora de ejemplo 2'],
                feedbackAnalysis: 'Análisis de feedback no disponible en modo de ejemplo',
                recommendations: [
                    'Configure ANTHROPIC_API_KEY para obtener recomendaciones reales',
                    'Los reportes con IA proporcionan insights personalizados',
                    'Costo aproximado: €0.017 por reporte'
                ],
                economicImpact: 'Análisis económico no disponible en modo de ejemplo',
                actionPlan: [
                    { priority: 'Alta', action: 'Configurar API de Claude', expectedImpact: 'Reportes inteligentes automáticos' }
                ]
            };
            tokensUsed = 0;
            generationTime = 0;
            modelUsed = 'example-mode';
        }

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
                aiReport.executiveSummary || null,
                JSON.stringify(aiReport.insights || []),
                JSON.stringify(aiReport.strengths || []),
                JSON.stringify(aiReport.weaknesses || []),
                aiReport.feedbackAnalysis || null,
                JSON.stringify(aiReport.recommendations || []),
                aiReport.economicImpact || null,
                JSON.stringify(aiReport.actionPlan || []),
                modelUsed || 'unknown',
                tokensUsed || 0,
                generationTime || 0
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

async function getBusinessFeedback(businessId, startDate, endDate) {
    try {
        // Obtener feedback de la tabla de feedback
        const feedbackResult = await db.query(
            `SELECT
                rating,
                comment,
                created_at as date
             FROM feedback
             WHERE business_id = ? AND created_at BETWEEN ? AND ?
             ORDER BY created_at DESC
             LIMIT 20`,
            [businessId, startDate, endDate]
        );

        return feedbackResult || [];

    } catch (error) {
        console.error('Error getting business feedback:', error);
        return [];
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
