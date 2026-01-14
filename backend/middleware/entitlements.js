const db = require('../../config/database');

/**
 * Obtiene el plan y límites del negocio desde la base de datos
 */
async function getBusinessPlan(businessId) {
    const [rows] = await db.query(
        'SELECT plan, plan_limits FROM businesses WHERE id = ?',
        [businessId]
    );

    if (rows.length === 0) {
        throw new Error('Negocio no encontrado');
    }

    const business = rows[0];

    return {
        plan: business.plan,
        limits: typeof business.plan_limits === 'string'
            ? JSON.parse(business.plan_limits)
            : business.plan_limits
    };
}

/**
 * Middleware para validar si el plan tiene acceso a una feature específica
 *
 * Uso: requireFeature('aiReports')
 */
function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.businessId) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
            }

            const { plan, limits } = await getBusinessPlan(req.user.businessId);

            // Verificar si el plan incluye la feature
            if (!limits.features || !limits.features[featureName]) {
                return res.status(403).json({
                    success: false,
                    message: `Esta función no está disponible en tu plan ${plan.toUpperCase()}.`,
                    upgrade: true,
                    currentPlan: plan,
                    feature: featureName
                });
            }

            // Añadir plan info al request para uso posterior
            req.businessPlan = { plan, limits };
            next();

        } catch (error) {
            console.error('Error en middleware requireFeature:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos'
            });
        }
    };
}

/**
 * Middleware para validar límite de uso mensual de AI Reports
 */
async function validateAIReportLimit(req, res, next) {
    try {
        if (!req.user || !req.user.businessId) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        const { plan, limits } = await getBusinessPlan(req.user.businessId);

        // Si aiReportsPerMonth es null o undefined = ilimitado
        if (!limits.features.aiReportsPerMonth) {
            req.businessPlan = { plan, limits };
            return next();
        }

        // Contar reportes generados este mes
        const [usage] = await db.query(
            `SELECT COUNT(*) as total FROM ai_reports
             WHERE business_id = ?
             AND MONTH(generated_at) = MONTH(NOW())
             AND YEAR(generated_at) = YEAR(NOW())`,
            [req.user.businessId]
        );

        const reportsThisMonth = usage[0].total;
        const limit = limits.features.aiReportsPerMonth;

        if (reportsThisMonth >= limit) {
            return res.status(403).json({
                success: false,
                message: `Has alcanzado el límite de ${limit} reporte(s) IA por mes de tu plan ${plan.toUpperCase()}.`,
                upgrade: true,
                currentPlan: plan,
                usage: {
                    current: reportsThisMonth,
                    limit: limit
                }
            });
        }

        // Añadir info de uso al request
        req.businessPlan = { plan, limits };
        req.usage = {
            aiReportsThisMonth: reportsThisMonth,
            aiReportsLimit: limit
        };

        next();

    } catch (error) {
        console.error('Error en middleware validateAIReportLimit:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar límites de uso'
        });
    }
}

/**
 * Middleware para validar límite de reservas mensuales
 */
async function validateBookingLimit(req, res, next) {
    try {
        if (!req.user || !req.user.businessId) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        const { plan, limits } = await getBusinessPlan(req.user.businessId);

        // Si maxBookingsPerMonth es null = ilimitado
        if (!limits.maxBookingsPerMonth) {
            req.businessPlan = { plan, limits };
            return next();
        }

        // Contar reservas este mes
        const [usage] = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ?
             AND MONTH(booking_date) = MONTH(NOW())
             AND YEAR(booking_date) = YEAR(NOW())
             AND status != 'cancelled'`,
            [req.user.businessId]
        );

        const bookingsThisMonth = usage[0].total;
        const limit = limits.maxBookingsPerMonth;

        if (bookingsThisMonth >= limit) {
            return res.status(403).json({
                success: false,
                message: `Has alcanzado el límite de ${limit} reservas por mes de tu plan ${plan.toUpperCase()}.`,
                upgrade: true,
                currentPlan: plan,
                usage: {
                    current: bookingsThisMonth,
                    limit: limit
                }
            });
        }

        req.businessPlan = { plan, limits };
        req.usage = {
            bookingsThisMonth: bookingsThisMonth,
            bookingsLimit: limit
        };

        next();

    } catch (error) {
        console.error('Error en middleware validateBookingLimit:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar límites de reservas'
        });
    }
}

/**
 * Middleware para validar límite de servicios
 */
async function validateServicesLimit(req, res, next) {
    try {
        if (!req.user || !req.user.businessId) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        const { plan, limits } = await getBusinessPlan(req.user.businessId);

        // Si maxServices es null = ilimitado
        if (!limits.maxServices) {
            req.businessPlan = { plan, limits };
            return next();
        }

        // Contar servicios activos
        const [services] = await db.query(
            'SELECT COUNT(*) as total FROM services WHERE business_id = ?',
            [req.user.businessId]
        );

        const currentServices = services[0].total;
        const limit = limits.maxServices;

        if (currentServices >= limit) {
            return res.status(403).json({
                success: false,
                message: `Has alcanzado el límite de ${limit} servicios de tu plan ${plan.toUpperCase()}.`,
                upgrade: true,
                currentPlan: plan,
                usage: {
                    current: currentServices,
                    limit: limit
                }
            });
        }

        req.businessPlan = { plan, limits };
        next();

    } catch (error) {
        console.error('Error en middleware validateServicesLimit:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar límites de servicios'
        });
    }
}

/**
 * Middleware para validar límite de usuarios
 */
async function validateUsersLimit(req, res, next) {
    try {
        if (!req.user || !req.user.businessId) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        const { plan, limits } = await getBusinessPlan(req.user.businessId);

        // Si maxUsers es null = ilimitado
        if (!limits.maxUsers) {
            req.businessPlan = { plan, limits };
            return next();
        }

        // Contar usuarios activos
        const [users] = await db.query(
            'SELECT COUNT(*) as total FROM users WHERE business_id = ?',
            [req.user.businessId]
        );

        const currentUsers = users[0].total;
        const limit = limits.maxUsers;

        if (currentUsers >= limit) {
            return res.status(403).json({
                success: false,
                message: `Has alcanzado el límite de ${limit} usuario(s) de tu plan ${plan.toUpperCase()}.`,
                upgrade: true,
                currentPlan: plan,
                usage: {
                    current: currentUsers,
                    limit: limit
                }
            });
        }

        req.businessPlan = { plan, limits };
        next();

    } catch (error) {
        console.error('Error en middleware validateUsersLimit:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar límites de usuarios'
        });
    }
}

/**
 * Helper para obtener información del plan (para endpoints info)
 */
async function getPlanInfo(businessId) {
    const { plan, limits } = await getBusinessPlan(businessId);

    // Obtener uso actual
    const [aiReports] = await db.query(
        `SELECT COUNT(*) as total FROM ai_reports
         WHERE business_id = ?
         AND MONTH(generated_at) = MONTH(NOW())
         AND YEAR(generated_at) = YEAR(NOW())`,
        [businessId]
    );

    const [bookings] = await db.query(
        `SELECT COUNT(*) as total FROM bookings
         WHERE business_id = ?
         AND MONTH(booking_date) = MONTH(NOW())
         AND YEAR(booking_date) = YEAR(NOW())
         AND status != 'cancelled'`,
        [businessId]
    );

    const [services] = await db.query(
        'SELECT COUNT(*) as total FROM services WHERE business_id = ?',
        [businessId]
    );

    const [users] = await db.query(
        'SELECT COUNT(*) as total FROM users WHERE business_id = ?',
        [businessId]
    );

    return {
        plan: plan,
        limits: limits,
        usage: {
            aiReportsThisMonth: aiReports[0].total,
            bookingsThisMonth: bookings[0].total,
            services: services[0].total,
            users: users[0].total
        }
    };
}

module.exports = {
    requireFeature,
    validateAIReportLimit,
    validateBookingLimit,
    validateServicesLimit,
    validateUsersLimit,
    getPlanInfo,
    getBusinessPlan
};
