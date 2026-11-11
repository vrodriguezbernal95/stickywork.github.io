/**
 * Definición única de los planes y sus límites.
 * La usan: el registro (plan free), el super admin (cambio de plan) y los webhooks de Stripe.
 * maxBookingsPerMonth / maxServices / maxUsers = null significa ilimitado.
 */
const PLAN_LIMITS = {
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

const VALID_PLANS = Object.keys(PLAN_LIMITS);

// Límites de un plan (si el plan no existe, los de free)
function getPlanLimits(plan) {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

// "Funciona con StickyWork" (emails al cliente, widget y página pública): solo en el plan gratuito.
// Quitar la marca es una ventaja de los planes de pago.
const PAID_PLANS = ['founders', 'professional', 'premium'];
function showsBranding(plan) {
    return !PAID_PLANS.includes(plan);
}

module.exports = { PLAN_LIMITS, VALID_PLANS, getPlanLimits, showsBranding };
