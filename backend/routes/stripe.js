const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Email service
const {
    sendSubscriptionWelcome,
    sendTrialEndingEmail,
    sendPaymentFailedEmail,
    sendSubscriptionCanceledEmail
} = require('../email-service');

// Stripe se inicializa con la API key
let stripe;
try {
    const Stripe = require('stripe');
    stripe = Stripe(process.env.STRIPE_SECRET_KEY);
} catch (error) {
    console.warn('⚠️ Stripe no configurado. Añade STRIPE_SECRET_KEY a las variables de entorno.');
}

// Importar base de datos
let db = require('../../config/database');

// Configuración de precios (se actualizará con los price IDs reales de Stripe)
const STRIPE_PRICES = {
    founders: process.env.STRIPE_PRICE_FOUNDERS || 'price_founders_placeholder',
    professional: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_placeholder',
    premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder'
};

const PLAN_DETAILS = {
    free: { name: 'Gratis', price: 0, maxUsers: 1, maxBookings: 30, aiReports: 0 },
    founders: { name: 'Founders', price: 25, maxUsers: 3, maxBookings: null, aiReports: 1 },
    professional: { name: 'Profesional', price: 39, maxUsers: 3, maxBookings: null, aiReports: 1 },
    premium: { name: 'Premium', price: 79, maxUsers: 10, maxBookings: null, aiReports: 8 }
};

/**
 * POST /api/stripe/create-checkout-session
 * Crear sesión de checkout para suscripción
 */
router.post('/api/stripe/create-checkout-session', requireAuth, requireRole('owner'), async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ success: false, message: 'Stripe no configurado' });
        }

        const { priceId, planName } = req.body;
        const businessId = req.user.businessId;
        const userEmail = req.user.email;

        // Verificar que el plan es válido
        if (!['founders', 'professional', 'premium'].includes(planName)) {
            return res.status(400).json({ success: false, message: 'Plan no válido' });
        }

        // Obtener o crear cliente de Stripe
        let stripeCustomerId;
        const business = await db.query('SELECT stripe_customer_id, name FROM businesses WHERE id = ?', [businessId]);

        if (business[0]?.stripe_customer_id) {
            stripeCustomerId = business[0].stripe_customer_id;
        } else {
            // Crear nuevo cliente en Stripe
            const customer = await stripe.customers.create({
                email: userEmail,
                name: business[0]?.name || 'Cliente StickyWork',
                metadata: {
                    business_id: businessId.toString()
                }
            });
            stripeCustomerId = customer.id;

            // Guardar en BD
            await db.query('UPDATE businesses SET stripe_customer_id = ? WHERE id = ?', [stripeCustomerId, businessId]);
        }

        // Crear sesión de checkout con trial de 7 días
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId || STRIPE_PRICES[planName],
                quantity: 1
            }],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 7,
                metadata: {
                    business_id: businessId.toString(),
                    plan_name: planName
                }
            },
            success_url: `${process.env.FRONTEND_URL || 'https://stickywork.com'}/admin-dashboard.html?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'https://stickywork.com'}/planes.html?subscription=cancelled`,
            metadata: {
                business_id: businessId.toString(),
                plan_name: planName
            },
            locale: 'es',
            allow_promotion_codes: true
        });

        res.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Error creando sesión de checkout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear sesión de pago',
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/create-portal-session
 * Crear sesión del portal de cliente (gestionar suscripción, facturas, método de pago)
 */
router.post('/api/stripe/create-portal-session', requireAuth, requireRole('owner'), async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ success: false, message: 'Stripe no configurado' });
        }

        const businessId = req.user.businessId;

        // Obtener stripe_customer_id
        const business = await db.query('SELECT stripe_customer_id FROM businesses WHERE id = ?', [businessId]);

        if (!business[0]?.stripe_customer_id) {
            return res.status(400).json({
                success: false,
                message: 'No tienes una suscripción activa'
            });
        }

        // Crear sesión del portal
        const session = await stripe.billingPortal.sessions.create({
            customer: business[0].stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL || 'https://stickywork.com'}/admin-dashboard.html?section=settings`
        });

        res.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('Error creando sesión del portal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al acceder al portal de facturación',
            error: error.message
        });
    }
});

/**
 * GET /api/stripe/subscription-status
 * Obtener estado de la suscripción del negocio
 */
router.get('/api/stripe/subscription-status', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const subscription = await db.query(`
            SELECT s.*, b.name as business_name, b.plan as current_plan
            FROM subscriptions s
            RIGHT JOIN businesses b ON s.business_id = b.id
            WHERE b.id = ?
        `, [businessId]);

        if (!subscription[0]) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const sub = subscription[0];
        const planDetails = PLAN_DETAILS[sub.plan_name || sub.current_plan || 'free'];

        res.json({
            success: true,
            data: {
                plan: sub.plan_name || sub.current_plan || 'free',
                planDetails,
                status: sub.status || 'free',
                trialEnd: sub.trial_end,
                currentPeriodEnd: sub.current_period_end,
                cancelAtPeriodEnd: sub.cancel_at_period_end || false,
                hasActiveSubscription: sub.status === 'active' || sub.status === 'trialing'
            }
        });

    } catch (error) {
        console.error('Error obteniendo estado de suscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado de suscripción',
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/webhook
 * Webhook de Stripe para eventos de pago
 */
router.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(500).send('Stripe no configurado');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('⚠️ Error verificando webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar eventos
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutComplete(event.data.object);
            break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            await handleSubscriptionUpdate(event.data.object);
            break;

        case 'customer.subscription.deleted':
            await handleSubscriptionCanceled(event.data.object);
            break;

        case 'invoice.paid':
            await handleInvoicePaid(event.data.object);
            break;

        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;

        case 'customer.subscription.trial_will_end':
            await handleTrialEnding(event.data.object);
            break;

        default:
            console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
});

// ==================== HANDLERS DE EVENTOS ====================

async function handleCheckoutComplete(session) {
    console.log('✅ Checkout completado:', session.id);

    const businessId = session.metadata?.business_id;
    const planName = session.metadata?.plan_name;

    if (!businessId) {
        console.error('No business_id en metadata del checkout');
        return;
    }

    // Actualizar plan del negocio
    await db.query(`
        UPDATE businesses
        SET plan = ?,
            subscription_status = 'trialing',
            trial_ends_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
        WHERE id = ?
    `, [planName, businessId]);

    // Enviar email de bienvenida
    const businessData = await db.query(`
        SELECT b.*, au.email as owner_email, au.full_name as owner_name
        FROM businesses b
        LEFT JOIN admin_users au ON au.business_id = b.id AND au.role = 'owner'
        WHERE b.id = ?
    `, [businessId]);

    if (businessData[0]?.owner_email) {
        const business = businessData[0];
        const user = { email: business.owner_email, full_name: business.owner_name };
        const plan = PLAN_DETAILS[planName] || { name: planName };

        try {
            await sendSubscriptionWelcome(business, plan, user);
            console.log(`📧 Email de bienvenida enviado a ${user.email}`);
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError.message);
        }
    }

    console.log(`✅ Negocio ${businessId} actualizado a plan ${planName}`);
}

async function handleSubscriptionUpdate(subscription) {
    console.log('🔄 Suscripción actualizada:', subscription.id);

    const businessId = subscription.metadata?.business_id;
    if (!businessId) return;

    const status = subscription.status;
    const planName = subscription.metadata?.plan_name;

    // Actualizar o crear registro de suscripción
    await db.query(`
        INSERT INTO subscriptions
        (business_id, stripe_subscription_id, stripe_customer_id, plan_name, status,
         trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end)
        VALUES (?, ?, ?, ?, ?,
                FROM_UNIXTIME(?), FROM_UNIXTIME(?), FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?)
        ON DUPLICATE KEY UPDATE
            stripe_subscription_id = VALUES(stripe_subscription_id),
            plan_name = VALUES(plan_name),
            status = VALUES(status),
            trial_end = VALUES(trial_end),
            current_period_start = VALUES(current_period_start),
            current_period_end = VALUES(current_period_end),
            cancel_at_period_end = VALUES(cancel_at_period_end),
            updated_at = NOW()
    `, [
        businessId,
        subscription.id,
        subscription.customer,
        planName,
        status,
        subscription.trial_start,
        subscription.trial_end,
        subscription.current_period_start,
        subscription.current_period_end,
        subscription.cancel_at_period_end
    ]);

    // Actualizar estado en businesses
    await db.query(`
        UPDATE businesses
        SET subscription_status = ?,
            plan = ?
        WHERE id = ?
    `, [status, planName, businessId]);

    // Si el pago falló, iniciar período de gracia
    if (status === 'past_due') {
        await startGracePeriod(businessId, subscription.id);
    }
}

async function handleSubscriptionCanceled(subscription) {
    console.log('❌ Suscripción cancelada:', subscription.id);

    const businessId = subscription.metadata?.business_id;
    if (!businessId) return;

    // Obtener datos del negocio y usuario para el email
    const businessData = await db.query(`
        SELECT b.*, au.email as owner_email, au.full_name as owner_name
        FROM businesses b
        LEFT JOIN admin_users au ON au.business_id = b.id AND au.role = 'owner'
        WHERE b.id = ?
    `, [businessId]);

    // Degradar a plan FREE
    await db.query(`
        UPDATE businesses
        SET plan = 'free',
            subscription_status = 'canceled'
        WHERE id = ?
    `, [businessId]);

    await db.query(`
        UPDATE subscriptions
        SET status = 'canceled',
            canceled_at = NOW()
        WHERE stripe_subscription_id = ?
    `, [subscription.id]);

    // Enviar email de cancelación
    if (businessData[0]?.owner_email) {
        const business = businessData[0];
        const user = { email: business.owner_email, full_name: business.owner_name };
        const endDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date();

        try {
            await sendSubscriptionCanceledEmail(business, user, endDate);
            console.log(`📧 Email de cancelación enviado a ${user.email}`);
        } catch (emailError) {
            console.error('Error enviando email de cancelación:', emailError.message);
        }
    }

    console.log(`⚠️ Negocio ${businessId} degradado a plan FREE`);
}

async function handleInvoicePaid(invoice) {
    console.log('💰 Factura pagada:', invoice.id);

    const customerId = invoice.customer;

    // Buscar negocio por stripe_customer_id
    const business = await db.query('SELECT id FROM businesses WHERE stripe_customer_id = ?', [customerId]);
    if (!business[0]) return;

    const businessId = business[0].id;

    // Registrar pago en historial
    await db.query(`
        INSERT INTO payment_history
        (business_id, stripe_invoice_id, stripe_payment_intent_id, amount, currency, status, description, invoice_url, invoice_pdf, paid_at)
        VALUES (?, ?, ?, ?, ?, 'succeeded', ?, ?, ?, NOW())
    `, [
        businessId,
        invoice.id,
        invoice.payment_intent,
        invoice.amount_paid / 100, // Stripe usa centavos
        invoice.currency.toUpperCase(),
        invoice.lines?.data?.[0]?.description || 'Suscripción StickyWork',
        invoice.hosted_invoice_url,
        invoice.invoice_pdf
    ]);

    // Limpiar período de gracia si existe
    await db.query('UPDATE businesses SET grace_period_ends_at = NULL WHERE id = ?', [businessId]);
    await db.query('DELETE FROM payment_reminders WHERE business_id = ?', [businessId]);
}

async function handlePaymentFailed(invoice) {
    console.log('⚠️ Pago fallido:', invoice.id);

    const customerId = invoice.customer;

    const business = await db.query('SELECT id, name FROM businesses WHERE stripe_customer_id = ?', [customerId]);
    if (!business[0]) return;

    const businessId = business[0].id;

    // Registrar intento fallido
    await db.query(`
        INSERT INTO payment_history
        (business_id, stripe_invoice_id, amount, currency, status, failure_reason)
        VALUES (?, ?, ?, ?, 'failed', ?)
    `, [
        businessId,
        invoice.id,
        invoice.amount_due / 100,
        invoice.currency.toUpperCase(),
        invoice.last_finalization_error?.message || 'Pago rechazado'
    ]);

    // Iniciar período de gracia de 5 días (pasamos invoice para el email)
    await startGracePeriod(businessId, null, { amount: invoice.amount_due });
}

async function handleTrialEnding(subscription) {
    console.log('⏰ Trial terminando en 3 días:', subscription.id);

    const businessId = subscription.metadata?.business_id;
    if (!businessId) return;

    // Obtener datos del negocio y usuario
    const businessData = await db.query(`
        SELECT b.*, au.email as owner_email, au.full_name as owner_name
        FROM businesses b
        LEFT JOIN admin_users au ON au.business_id = b.id AND au.role = 'owner'
        WHERE b.id = ?
    `, [businessId]);

    if (businessData[0]?.owner_email) {
        const business = businessData[0];
        const user = { email: business.owner_email, full_name: business.owner_name };
        const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : new Date();
        const daysLeft = 3; // Stripe envía este evento 3 días antes

        try {
            await sendTrialEndingEmail(business, user, daysLeft, trialEndDate);
            console.log(`📧 Email de fin de trial enviado a ${user.email}`);
        } catch (emailError) {
            console.error('Error enviando email de fin de trial:', emailError.message);
        }
    }
}

async function startGracePeriod(businessId, subscriptionId = null, invoice = null) {
    const gracePeriodDays = 5;
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + gracePeriodDays);

    // Actualizar negocio
    await db.query(`
        UPDATE businesses
        SET grace_period_ends_at = ?,
            subscription_status = 'past_due'
        WHERE id = ?
    `, [gracePeriodEnds, businessId]);

    // Registrar recordatorio
    if (subscriptionId) {
        await db.query(`
            INSERT INTO payment_reminders (business_id, subscription_id, reminder_type, grace_period_ends)
            VALUES (?, (SELECT id FROM subscriptions WHERE stripe_subscription_id = ?), 'first_warning', ?)
        `, [businessId, subscriptionId, gracePeriodEnds]);
    }

    // Enviar email de aviso de pago fallido
    const businessData = await db.query(`
        SELECT b.*, au.email as owner_email, au.full_name as owner_name
        FROM businesses b
        LEFT JOIN admin_users au ON au.business_id = b.id AND au.role = 'owner'
        WHERE b.id = ?
    `, [businessId]);

    if (businessData[0]?.owner_email) {
        const business = businessData[0];
        const user = { email: business.owner_email, full_name: business.owner_name };
        const invoiceData = invoice || { amount: 0 };

        try {
            await sendPaymentFailedEmail(business, user, invoiceData, gracePeriodEnds);
            console.log(`📧 Email de pago fallido enviado a ${user.email}`);
        } catch (emailError) {
            console.error('Error enviando email de pago fallido:', emailError.message);
        }
    }

    console.log(`⚠️ Período de gracia iniciado para negocio ${businessId}, termina ${gracePeriodEnds}`);
}

/**
 * GET /api/stripe/payment-history
 * Obtener historial de pagos del negocio
 */
router.get('/api/stripe/payment-history', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;

        const payments = await db.query(`
            SELECT * FROM payment_history
            WHERE business_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [businessId]);

        res.json({
            success: true,
            data: payments
        });

    } catch (error) {
        console.error('Error obteniendo historial de pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de pagos'
        });
    }
});

module.exports = router;
