// Rutas para AI Reports
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { requireAuth, requireBusinessAccess } = require('../middleware/auth');
const { requireFeature, validateAIReportLimit } = require('../middleware/entitlements');
const claudeService = require('../services/claude-service');

// ==================== OBTENER HISTÓRICO DE REPORTES ====================

/**
 * GET /api/reports/history
 * Obtener todos los reportes generados para el negocio actual
 */
router.get('/api/reports/history', requireAuth, requireFeature('aiReports'), async (req, res) => {
    try {
        const businessId = req.user.businessId; // Corregido: businessId en camelCase

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
router.get('/api/reports/:id', requireAuth, requireFeature('aiReports'), async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

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
router.post('/api/reports/generate', requireAuth, requireFeature('aiReports'), validateAIReportLimit, async (req, res) => {
    try {
        const { month, year } = req.body;
        const businessId = req.user.businessId;

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
            // Intentar generar reporte real con Claude
            try {
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
            } catch (claudeError) {
                // Si Claude falla, usar reporte DEMO
                console.warn('⚠️ Error con Claude API, usando reporte DEMO:', claudeError.message);

                const completionRate = stats.totalBookings > 0
                    ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                    : 0;
                const cancellationRate = stats.totalBookings > 0
                    ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100)
                    : 0;

                aiReport = {
                    executiveSummary: `🎯 REPORTE DEMO - ${business.name}\n\nEste es un reporte de demostración para ${getMonthName(monthNum)} ${yearNum}. Durante este período se registraron ${stats.totalBookings} reservas, con una tasa de finalización del ${completionRate}%. Los reportes completos con IA incluyen análisis detallado de tendencias, feedback de clientes y recomendaciones personalizadas.`,
                    insights: [
                        `Durante ${getMonthName(monthNum)} se procesaron ${stats.totalBookings} reservas en total`,
                        `${stats.completedBookings} reservas fueron completadas exitosamente (${completionRate}% de tasa de finalización)`,
                        `${stats.cancelledBookings} reservas fueron canceladas (${cancellationRate}% de tasa de cancelación)`,
                        'Los reportes con IA analizan patrones de comportamiento y tendencias estacionales'
                    ],
                    strengths: [
                        'Sistema de reservas funcionando correctamente',
                        'Datos de reservas registrados y organizados',
                        stats.topServices?.length > 0 ? `Servicio más solicitado: ${stats.topServices[0].name}` : 'Diversidad de servicios ofrecidos'
                    ],
                    weaknesses: [
                        'Este es un reporte de demostración con análisis limitado',
                        'Los reportes completos identifican oportunidades de mejora específicas',
                        'Análisis de feedback de clientes no incluido en versión DEMO'
                    ],
                    feedbackAnalysis: `Los reportes con IA analizan automáticamente todos los comentarios y calificaciones de clientes del mes, identificando patrones de satisfacción, quejas recurrentes y sugerencias de mejora. La versión DEMO no incluye este análisis detallado.`,
                    recommendations: [
                        'Monitorear tendencias de cancelación para identificar patrones',
                        'Analizar los horarios de mayor demanda para optimizar disponibilidad',
                        'Implementar seguimiento post-servicio para aumentar satisfacción',
                        'Los reportes completos incluyen recomendaciones personalizadas basadas en datos reales'
                    ],
                    economicImpact: `Con una tasa de finalización del ${completionRate}%, el negocio demuestra capacidad operativa. Los reportes con IA calculan el impacto económico estimado de cada recomendación y proyectan mejoras potenciales en ingresos.`,
                    actionPlan: [
                        { priority: 'Alta', action: 'Revisar procesos para reducir cancelaciones', expectedImpact: 'Aumento en tasa de finalización' },
                        { priority: 'Media', action: 'Analizar horarios de mayor demanda', expectedImpact: 'Mejor distribución de recursos' },
                        { priority: 'Media', action: 'Implementar recordatorios automáticos', expectedImpact: 'Reducción de no-shows' }
                    ]
                };
                tokensUsed = 0;
                generationTime = 0;
                modelUsed = 'demo-mode';
            }
        } else {
            // Fallback: generar reporte DEMO
            console.warn('⚠️ ANTHROPIC_API_KEY no configurada, usando reporte DEMO');

            const completionRate = stats.totalBookings > 0
                ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                : 0;
            const cancellationRate = stats.totalBookings > 0
                ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100)
                : 0;

            aiReport = {
                executiveSummary: `🎯 REPORTE DEMO - ${business.name}\n\nEste es un reporte de demostración para ${getMonthName(monthNum)} ${yearNum}. Durante este período se registraron ${stats.totalBookings} reservas, con una tasa de finalización del ${completionRate}%. Los reportes completos con IA incluyen análisis detallado de tendencias, feedback de clientes y recomendaciones personalizadas.`,
                insights: [
                    `Durante ${getMonthName(monthNum)} se procesaron ${stats.totalBookings} reservas en total`,
                    `${stats.completedBookings} reservas fueron completadas exitosamente (${completionRate}% de tasa de finalización)`,
                    `${stats.cancelledBookings} reservas fueron canceladas (${cancellationRate}% de tasa de cancelación)`,
                    'Los reportes con IA analizan patrones de comportamiento y tendencias estacionales'
                ],
                strengths: [
                    'Sistema de reservas funcionando correctamente',
                    'Datos de reservas registrados y organizados',
                    stats.topServices?.length > 0 ? `Servicio más solicitado: ${stats.topServices[0].name}` : 'Diversidad de servicios ofrecidos'
                ],
                weaknesses: [
                    'Este es un reporte de demostración con análisis limitado',
                    'Los reportes completos identifican oportunidades de mejora específicas',
                    'Análisis de feedback de clientes no incluido en versión DEMO'
                ],
                feedbackAnalysis: `Los reportes con IA analizan automáticamente todos los comentarios y calificaciones de clientes del mes, identificando patrones de satisfacción, quejas recurrentes y sugerencias de mejora. La versión DEMO no incluye este análisis detallado.`,
                recommendations: [
                    'Monitorear tendencias de cancelación para identificar patrones',
                    'Analizar los horarios de mayor demanda para optimizar disponibilidad',
                    'Implementar seguimiento post-servicio para aumentar satisfacción',
                    'Los reportes completos incluyen recomendaciones personalizadas basadas en datos reales'
                ],
                economicImpact: `Con una tasa de finalización del ${completionRate}%, el negocio demuestra capacidad operativa. Los reportes con IA calculan el impacto económico estimado de cada recomendación y proyectan mejoras potenciales en ingresos.`,
                actionPlan: [
                    { priority: 'Alta', action: 'Revisar procesos para reducir cancelaciones', expectedImpact: 'Aumento en tasa de finalización' },
                    { priority: 'Media', action: 'Analizar horarios de mayor demanda', expectedImpact: 'Mejor distribución de recursos' },
                    { priority: 'Media', action: 'Implementar recordatorios automáticos', expectedImpact: 'Reducción de no-shows' }
                ]
            };
            tokensUsed = 0;
            generationTime = 0;
            modelUsed = 'demo-mode';
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
        console.error('Error getting business feedback:', error.message);
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

// ==================== GENERAR Y DESCARGAR PDF ====================

/**
 * GET /api/reports/:id/pdf
 * Generar y descargar reporte como PDF
 */
router.get('/api/reports/:id/pdf', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        // Obtener el reporte completo
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
        const stats = typeof report.stats === 'string' ? JSON.parse(report.stats) : report.stats;
        const insights = typeof report.ai_insights === 'string' ? JSON.parse(report.ai_insights) : report.ai_insights;
        const strengths = typeof report.ai_strengths === 'string' ? JSON.parse(report.ai_strengths) : report.ai_strengths;
        const weaknesses = typeof report.ai_weaknesses === 'string' ? JSON.parse(report.ai_weaknesses) : report.ai_weaknesses;
        const recommendations = typeof report.ai_recommendations === 'string' ? JSON.parse(report.ai_recommendations) : report.ai_recommendations;
        const actionPlan = typeof report.ai_action_plan === 'string' ? JSON.parse(report.ai_action_plan) : report.ai_action_plan;

        // Generar PDF
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Configurar headers para descarga
        const filename = `Reporte_${getMonthName(report.month)}_${report.year}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF al response
        doc.pipe(res);

        // === PORTADA ===
        doc.fontSize(24).fillColor('#667eea').text('REPORTE MENSUAL CON IA', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).fillColor('#333').text(`${getMonthName(report.month)} ${report.year}`, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#999').text('Analisis Automatizado con Inteligencia Artificial', { align: 'center' });
        doc.moveDown(2);

        // === ESTADÍSTICAS CLAVE ===
        doc.fontSize(18).fillColor('#667eea').text('ESTADISTICAS DEL PERIODO');
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333');

        const completionRate = stats.totalBookings > 0
            ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
            : 0;

        doc.text(`• Total de Reservas: ${stats.totalBookings || 0}`, { indent: 20 });
        doc.text(`• Reservas Completadas: ${stats.completedBookings || 0} (${completionRate}%)`, { indent: 20 });
        doc.text(`• Reservas Canceladas: ${stats.cancelledBookings || 0}`, { indent: 20 });
        doc.moveDown(1.5);

        // === RESUMEN EJECUTIVO ===
        doc.fontSize(18).fillColor('#667eea').text('RESUMEN EJECUTIVO');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        doc.text(report.ai_executive_summary || 'No disponible', { align: 'justify', indent: 20 });
        doc.moveDown(1.5);

        // === INSIGHTS CLAVE ===
        doc.fontSize(18).fillColor('#667eea').text('INSIGHTS CLAVE');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        if (insights && insights.length > 0) {
            insights.forEach((insight, index) => {
                doc.text(`${index + 1}. ${insight}`, { indent: 20 });
                doc.moveDown(0.3);
            });
        }
        doc.moveDown(1);

        // === FORTALEZAS ===
        doc.fontSize(18).fillColor('#22c55e').text('FORTALEZAS');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        if (strengths && strengths.length > 0) {
            strengths.forEach(strength => {
                doc.text(`• ${strength}`, { indent: 20 });
                doc.moveDown(0.3);
            });
        }
        doc.moveDown(1);

        // === ÁREAS DE MEJORA ===
        doc.fontSize(18).fillColor('#ef4444').text('AREAS DE MEJORA');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        if (weaknesses && weaknesses.length > 0) {
            weaknesses.forEach(weakness => {
                doc.text(`• ${weakness}`, { indent: 20 });
                doc.moveDown(0.3);
            });
        }
        doc.moveDown(1);

        // === ANÁLISIS DE FEEDBACK ===
        if (report.ai_feedback_analysis) {
            doc.addPage();
            doc.fontSize(18).fillColor('#667eea').text('ANALISIS DE FEEDBACK DE CLIENTES');
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#333');
            doc.text(report.ai_feedback_analysis, { align: 'justify', indent: 20 });
            doc.moveDown(1.5);
        }

        // === RECOMENDACIONES ===
        doc.fontSize(18).fillColor('#667eea').text('RECOMENDACIONES');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        if (recommendations && recommendations.length > 0) {
            recommendations.forEach((rec, index) => {
                doc.text(`${index + 1}. ${rec}`, { indent: 20 });
                doc.moveDown(0.3);
            });
        }
        doc.moveDown(1.5);

        // === IMPACTO ECONÓMICO ===
        if (report.ai_economic_impact) {
            doc.fontSize(18).fillColor('#667eea').text('IMPACTO ECONOMICO');
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#333');
            doc.text(report.ai_economic_impact, { align: 'justify', indent: 20 });
            doc.moveDown(1.5);
        }

        // === PLAN DE ACCIÓN ===
        doc.fontSize(18).fillColor('#667eea').text('PLAN DE ACCION');
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#333');
        if (actionPlan && actionPlan.length > 0) {
            actionPlan.forEach((item, index) => {
                doc.fillColor('#667eea').text(`${index + 1}. ${item.action}`, { indent: 20 });
                doc.fillColor('#666').fontSize(10);
                doc.text(`   Prioridad: ${item.priority} | Impacto Esperado: ${item.expectedImpact}`, { indent: 20 });
                doc.fontSize(11).fillColor('#333');
                doc.moveDown(0.5);
            });
        }

        // === FOOTER ===
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#999').text(
            `Generado el ${new Date(report.generated_at).toLocaleDateString('es-ES')} | StickyWork - Sistema de Gestión`,
            { align: 'center' }
        );

        // Finalizar PDF
        doc.end();

        // Marcar como PDF generado en la base de datos
        await db.query(
            'UPDATE ai_reports SET pdf_generated = 1 WHERE id = ?',
            [id]
        );

    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar el PDF',
            error: error.message
        });
    }
});

// ==================== ELIMINAR REPORTE ====================

/**
 * DELETE /api/reports/:id
 * Eliminar un reporte específico
 */
router.delete('/api/reports/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const businessId = req.user.businessId;

        // Verificar que el reporte existe y pertenece al negocio
        const reports = await db.query(
            'SELECT id, month, year FROM ai_reports WHERE id = ? AND business_id = ?',
            [id, businessId]
        );

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        const report = reports[0];

        // Eliminar el reporte
        await db.query('DELETE FROM ai_reports WHERE id = ?', [id]);

        res.json({
            success: true,
            message: `Reporte de ${getMonthName(report.month)} ${report.year} eliminado correctamente`
        });

    } catch (error) {
        console.error('Error al eliminar reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el reporte',
            error: error.message
        });
    }
});

module.exports = router;
