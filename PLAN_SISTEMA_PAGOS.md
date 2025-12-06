# Plan Sistema de Pagos - StickyWork

**Fecha de creación:** 2025-12-06
**Prioridad:** ALTA
**Objetivo:** Monetizar StickyWork con suscripciones mensuales (modelo SaaS)

---

## 🎯 Objetivo

Implementar sistema de pagos recurrentes que permita a los dueños de negocios suscribirse a planes de pago mensuales con prueba gratuita de 14 días.

---

## 🏦 Proveedor Elegido: **Stripe**

### ¿Por qué Stripe?

1. ✅ **Líder mundial** en pagos SaaS
2. ✅ **Suscripciones nativas** (billing automático)
3. ✅ **Pruebas gratuitas** integradas (14 días gratis)
4. ✅ **Customer Portal** (usuarios gestionan su plan sin soporte)
5. ✅ **Webhooks** (notificaciones en tiempo real)
6. ✅ **Múltiples métodos:** Tarjeta, SEPA, Bizum
7. ✅ **Cumple con PSD2** (Europa)
8. ✅ **Librería Node.js** oficial
9. ✅ **Checkout embebible** (no sales de tu web)

### Comisiones
- **1.5% + €0.25** por transacción (tarjetas EU)
- Sin cuotas mensuales
- Sin costos de setup

---

## 💰 Planes de Precios

### Plan Básico (Gratis)
**Precio:** €0/mes (gratuito para siempre)

**Características:**
- ✅ Hasta 50 reservas/mes
- ✅ 1 usuario admin
- ✅ Widget básico
- ✅ Soporte por email

**Objetivo:** Captar usuarios, freemium

---

### Plan Pro (€29/mes)
**Precio:** €29/mes
**Prueba gratuita:** 14 días

**Características:**
- ✅ Reservas ilimitadas
- ✅ 5 usuarios admin
- ✅ Widget personalizable (colores, campos)
- ✅ **Feedback de clientes** (FASE 1 - próxima sesión)
- ✅ Múltiples servicios
- ✅ Código QR premium
- ✅ Notificaciones por email
- ✅ Soporte prioritario

**Objetivo:** Plan principal para negocios pequeños/medianos

---

### Plan Premium (€49/mes)
**Precio:** €49/mes
**Prueba gratuita:** 14 días

**Características:**
- ✅ **Todo lo de Pro +**
- ✅ Usuarios ilimitados
- ✅ **Reportes IA quincenales** (FASE 2 - futuro)
- ✅ Análisis avanzados
- ✅ Integración WhatsApp (futuro)
- ✅ Soporte 24/7
- ✅ Gestor de cuenta dedicado

**Objetivo:** Negocios grandes o cadenas

---

## 🔄 Flujo de Suscripción

```
1. Usuario elige plan en /admin/planes.html
   ↓
2. Click "Empezar Prueba Gratis"
   ↓
3. Redirige a Stripe Checkout (hosted)
   ↓
4. Usuario ingresa tarjeta (no se cobra todavía)
   ↓
5. Stripe valida tarjeta
   ↓
6. Webhook: checkout.session.completed
   ↓
7. Backend actualiza BD: status='trialing', trial_ends_at=+14 días
   ↓
8. Usuario redirigido a dashboard con plan activo
   ↓
9. Día 15: Stripe cobra automáticamente €29 o €49
   ↓
10. Webhook: invoice.payment_succeeded
   ↓
11. Backend actualiza: status='active'
   ↓
12. Cada mes: Cargo automático
```

### Cancelación:
```
1. Usuario va a "Gestionar Suscripción" en dashboard
   ↓
2. Redirige a Stripe Customer Portal
   ↓
3. Usuario cancela
   ↓
4. Webhook: customer.subscription.deleted
   ↓
5. Backend actualiza: status='canceled', plan='basic'
   ↓
6. Usuario mantiene acceso hasta fin de periodo pagado
```

---

## 💻 Implementación Técnica

### 1. Instalación

```bash
npm install stripe
```

### 2. Variables de Entorno

Añadir a Railway:

```env
# Stripe (usar claves de TEST primero)
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX

# URLs
APP_URL=https://stickywork.com
```

### 3. Configuración Backend

**Archivo:** `backend/config/stripe.js`
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
```

### 4. Crear Productos en Stripe

**Opción A: Stripe Dashboard** (recomendado para empezar)
1. Ir a https://dashboard.stripe.com/test/products
2. Create Product → "StickyWork Pro"
3. Price: €29.00 EUR, Recurring monthly
4. Copiar Price ID: `price_XXXXXXXXXXXXX`
5. Repetir para "StickyWork Premium" (€49/mes)

**Opción B: Por código**

**Archivo:** `backend/setup-stripe-products.js`
```javascript
const stripe = require('./config/stripe');

async function setupProducts() {
  console.log('🔧 Creando productos en Stripe...\n');

  // Plan Pro
  const proPlan = await stripe.products.create({
    name: 'StickyWork Pro',
    description: 'Reservas ilimitadas + Feedback de clientes + Widget personalizable'
  });

  const proPrice = await stripe.prices.create({
    product: proPlan.id,
    unit_amount: 2900, // €29.00 (en centavos)
    currency: 'eur',
    recurring: {
      interval: 'month',
      trial_period_days: 14
    },
    tax_behavior: 'exclusive' // IVA se añade aparte
  });

  console.log('✅ Plan Pro creado');
  console.log('   Price ID:', proPrice.id);
  console.log('');

  // Plan Premium
  const premiumPlan = await stripe.products.create({
    name: 'StickyWork Premium',
    description: 'Todo de Pro + Reportes IA quincenales + Análisis avanzados'
  });

  const premiumPrice = await stripe.prices.create({
    product: premiumPlan.id,
    unit_amount: 4900, // €49.00
    currency: 'eur',
    recurring: {
      interval: 'month',
      trial_period_days: 14
    },
    tax_behavior: 'exclusive'
  });

  console.log('✅ Plan Premium creado');
  console.log('   Price ID:', premiumPrice.id);
  console.log('');

  console.log('📝 Guarda estos Price IDs en tu código frontend');
}

setupProducts().catch(console.error);
```

**Ejecutar:**
```bash
node backend/setup-stripe-products.js
```

---

### 5. Migración Base de Datos

**Archivo:** `backend/migrations/013_subscriptions.sql`

```sql
-- Añadir columnas de suscripción a la tabla businesses
ALTER TABLE businesses
ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE COMMENT 'ID del cliente en Stripe',
ADD COLUMN stripe_subscription_id VARCHAR(255) UNIQUE COMMENT 'ID de la suscripción en Stripe',
ADD COLUMN subscription_plan ENUM('basic', 'pro', 'premium') DEFAULT 'basic' COMMENT 'Plan actual',
ADD COLUMN subscription_status ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid') DEFAULT 'trialing' COMMENT 'Estado de la suscripción',
ADD COLUMN trial_ends_at TIMESTAMP NULL COMMENT 'Fecha de fin del periodo de prueba',
ADD COLUMN subscription_started_at TIMESTAMP NULL COMMENT 'Fecha de inicio de suscripción',
ADD COLUMN subscription_ends_at TIMESTAMP NULL COMMENT 'Fecha de fin de suscripción (si cancelada)',
ADD INDEX idx_stripe_customer (stripe_customer_id),
ADD INDEX idx_stripe_subscription (stripe_subscription_id),
ADD INDEX idx_subscription_status (subscription_status);
```

**Ejecutar:**
```bash
node backend/run-migration.js 013
```

---

### 6. Endpoints Backend - Billing

**Archivo:** `backend/routes/billing.js`

```javascript
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { requireAuth } = require('../middleware/auth');
const db = require('../config/database');

// ========================================
// POST /api/billing/create-checkout-session
// Crear sesión de pago con Stripe
// ========================================
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { priceId } = req.body;
    const businessId = req.user.businessId;
    const userEmail = req.user.email;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId es requerido' });
    }

    console.log(`📝 Creando checkout para business ${businessId}, plan ${priceId}`);

    // Verificar si ya tiene un stripe_customer_id
    const [business] = await db.query(
      'SELECT stripe_customer_id, name FROM businesses WHERE id = ?',
      [businessId]
    );

    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    let customerId = business.stripe_customer_id;

    // Si no tiene customer en Stripe, crear uno
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          businessId: businessId.toString(),
          businessName: business.name
        }
      });

      customerId = customer.id;

      // Guardar customer_id en BD
      await db.query(
        'UPDATE businesses SET stripe_customer_id = ? WHERE id = ?',
        [customerId, businessId]
      );

      console.log(`✅ Customer Stripe creado: ${customerId}`);
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          businessId: businessId.toString()
        }
      },
      success_url: `${process.env.APP_URL}/admin/dashboard.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/admin/planes.html?canceled=true`,
      metadata: {
        businessId: businessId.toString()
      }
    });

    console.log(`✅ Checkout session creada: ${session.id}`);

    res.json({ url: session.url });

  } catch (error) {
    console.error('❌ Error creando checkout:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
});

// ========================================
// POST /api/billing/create-portal-session
// Portal del cliente (gestionar suscripción, facturas, etc.)
// ========================================
router.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const [business] = await db.query(
      'SELECT stripe_customer_id FROM businesses WHERE id = ?',
      [businessId]
    );

    if (!business || !business.stripe_customer_id) {
      return res.status(400).json({ error: 'No se encontró customer de Stripe' });
    }

    // Crear portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripe_customer_id,
      return_url: `${process.env.APP_URL}/admin/dashboard.html`
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('❌ Error creando portal:', error);
    res.status(500).json({ error: 'Error al abrir portal de cliente' });
  }
});

// ========================================
// GET /api/billing/subscription-status
// Obtener estado actual de suscripción
// ========================================
router.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const [business] = await db.query(`
      SELECT
        subscription_plan,
        subscription_status,
        trial_ends_at,
        subscription_ends_at
      FROM businesses
      WHERE id = ?
    `, [businessId]);

    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    // Determinar si está en trial
    const now = new Date();
    const trialEndsAt = business.trial_ends_at ? new Date(business.trial_ends_at) : null;
    const isInTrial = trialEndsAt && trialEndsAt > now;

    res.json({
      plan: business.subscription_plan,
      status: business.subscription_status,
      isInTrial,
      trialEndsAt: business.trial_ends_at,
      subscriptionEndsAt: business.subscription_ends_at
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    res.status(500).json({ error: 'Error al obtener estado de suscripción' });
  }
});

module.exports = router;
```

---

### 7. Webhooks de Stripe

**Archivo:** `backend/routes/webhooks.js`

```javascript
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const db = require('../config/database');

// ========================================
// POST /api/webhooks/stripe
// Recibir eventos de Stripe
// ========================================
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Webhook recibido: ${event.type}`);

  // Manejar diferentes tipos de eventos
  try {
    switch (event.type) {

      // ========================================
      // Checkout completado (suscripción iniciada)
      // ========================================
      case 'checkout.session.completed':
        const session = event.data.object;
        const businessId = parseInt(session.metadata.businessId);
        const subscriptionId = session.subscription;

        console.log(`✅ Checkout completado para business ${businessId}`);

        // Actualizar BD
        await db.query(`
          UPDATE businesses
          SET
            stripe_subscription_id = ?,
            subscription_status = 'trialing',
            trial_ends_at = DATE_ADD(NOW(), INTERVAL 14 DAY),
            subscription_started_at = NOW()
          WHERE id = ?
        `, [subscriptionId, businessId]);

        console.log(`   → Suscripción ${subscriptionId} en trial (14 días)`);
        break;

      // ========================================
      // Suscripción actualizada
      // ========================================
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const status = subscription.status;
        const subId = subscription.id;

        // Determinar plan basado en price
        let plan = 'basic';
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          // Aquí deberías tener los price IDs guardados
          // Por ahora, simplificamos con el amount
          const amount = subscription.items.data[0].price.unit_amount;
          if (amount === 2900) plan = 'pro';
          if (amount === 4900) plan = 'premium';
        }

        console.log(`📝 Suscripción ${subId} actualizada a estado: ${status}`);

        await db.query(`
          UPDATE businesses
          SET
            subscription_status = ?,
            subscription_plan = ?
          WHERE stripe_subscription_id = ?
        `, [status, plan, subId]);

        console.log(`   → Plan: ${plan}, Status: ${status}`);
        break;

      // ========================================
      // Suscripción cancelada
      // ========================================
      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        const deletedSubId = deletedSub.id;

        console.log(`❌ Suscripción ${deletedSubId} cancelada`);

        await db.query(`
          UPDATE businesses
          SET
            subscription_status = 'canceled',
            subscription_plan = 'basic',
            subscription_ends_at = NOW()
          WHERE stripe_subscription_id = ?
        `, [deletedSubId]);

        console.log(`   → Business vuelto a plan basic`);
        break;

      // ========================================
      // Pago exitoso (mensualidad cobrada)
      // ========================================
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const invoiceSubId = invoice.subscription;

        console.log(`💰 Pago exitoso para suscripción ${invoiceSubId}`);

        // Actualizar estado a 'active' si estaba en trial
        await db.query(`
          UPDATE businesses
          SET subscription_status = 'active'
          WHERE stripe_subscription_id = ? AND subscription_status = 'trialing'
        `, [invoiceSubId]);

        console.log(`   → Status actualizado a 'active'`);
        break;

      // ========================================
      // Pago fallido
      // ========================================
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        const failedSubId = failedInvoice.subscription;

        console.log(`⚠️  Pago fallido para suscripción ${failedSubId}`);

        await db.query(`
          UPDATE businesses
          SET subscription_status = 'past_due'
          WHERE stripe_subscription_id = ?
        `, [failedSubId]);

        // TODO: Enviar email al usuario notificando el fallo de pago
        console.log(`   → Status actualizado a 'past_due'`);
        console.log(`   → TODO: Enviar email de aviso al usuario`);
        break;

      default:
        console.log(`   → Evento no manejado: ${event.type}`);
    }

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }

  // Confirmar recepción
  res.json({ received: true });
});

module.exports = router;
```

---

### 8. Middleware: Verificar Suscripción Activa

**Archivo:** `backend/middleware/subscription.js`

```javascript
const db = require('../config/database');

// ========================================
// Middleware: Requiere suscripción activa
// Uso: router.get('/ruta', requireAuth, requireActiveSubscription, handler)
// ========================================
async function requireActiveSubscription(req, res, next) {
  try {
    const businessId = req.user.businessId;

    const [business] = await db.query(`
      SELECT
        subscription_status,
        subscription_plan,
        trial_ends_at
      FROM businesses
      WHERE id = ?
    `, [businessId]);

    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const { subscription_status, subscription_plan, trial_ends_at } = business;

    // Plan basic siempre tiene acceso limitado (no pasa este middleware)
    // Este middleware solo se usa en rutas "premium"

    // Permitir si está activo
    if (subscription_status === 'active') {
      return next();
    }

    // Permitir si está en trial y no ha expirado
    if (subscription_status === 'trialing' && trial_ends_at) {
      const now = new Date();
      const trialEnd = new Date(trial_ends_at);

      if (trialEnd > now) {
        return next();
      }
    }

    // Denegar acceso
    return res.status(402).json({
      error: 'Suscripción requerida',
      message: 'Tu periodo de prueba ha terminado o tu suscripción está inactiva. Por favor, suscríbete para continuar usando esta funcionalidad.',
      plan: subscription_plan,
      status: subscription_status
    });

  } catch (error) {
    console.error('❌ Error verificando suscripción:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}

// ========================================
// Middleware: Requiere plan específico
// Uso: router.get('/ruta', requireAuth, requirePlan('premium'), handler)
// ========================================
function requirePlan(...allowedPlans) {
  return async (req, res, next) => {
    try {
      const businessId = req.user.businessId;

      const [business] = await db.query(
        'SELECT subscription_plan FROM businesses WHERE id = ?',
        [businessId]
      );

      if (!business) {
        return res.status(404).json({ error: 'Negocio no encontrado' });
      }

      if (allowedPlans.includes(business.subscription_plan)) {
        return next();
      }

      return res.status(403).json({
        error: 'Plan insuficiente',
        message: `Esta funcionalidad requiere plan ${allowedPlans.join(' o ')}.`,
        currentPlan: business.subscription_plan
      });

    } catch (error) {
      console.error('❌ Error verificando plan:', error);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  };
}

module.exports = {
  requireActiveSubscription,
  requirePlan
};
```

**Uso en rutas:**

```javascript
const { requireActiveSubscription, requirePlan } = require('../middleware/subscription');

// Ruta que requiere suscripción activa (Pro o Premium)
router.get('/api/feedback/:businessId',
  requireAuth,
  requireActiveSubscription,
  getFeedback
);

// Ruta que requiere específicamente plan Premium
router.get('/api/reports/ai/:businessId',
  requireAuth,
  requirePlan('premium'),
  generateAIReport
);
```

---

### 9. Actualizar server.js

**Archivo:** `backend/server.js`

```javascript
// ... imports existentes ...
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');

// IMPORTANTE: Webhooks ANTES de express.json()
// (Stripe necesita el body raw)
app.use('/api/webhooks', webhookRoutes);

// Middleware
app.use(express.json());
// ... resto de middlewares ...

// Rutas
app.use('/api/billing', billingRoutes);
// ... resto de rutas ...
```

---

## 🎨 Frontend

### 1. Página de Planes

**Archivo:** `admin/planes.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planes y Precios - StickyWork</title>
    <link rel="stylesheet" href="css/admin-styles.css">
    <style>
        .pricing-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
        }

        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .plan-card {
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
        }

        .plan-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .plan-card.featured {
            border-color: var(--primary-color);
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
        }

        .plan-badge {
            display: inline-block;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 0.3rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .plan-name {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 1rem;
        }

        .plan-price {
            font-size: 3rem;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }

        .plan-price span {
            font-size: 1.2rem;
            color: var(--text-secondary);
        }

        .plan-trial {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 2rem;
        }

        .plan-features {
            list-style: none;
            padding: 0;
            margin: 2rem 0;
            text-align: left;
        }

        .plan-features li {
            padding: 0.75rem 0;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .plan-features li:before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            font-size: 1.2rem;
        }

        .btn-plan {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-plan:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-plan.current {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 2px solid var(--primary-color);
            cursor: default;
        }
    </style>
</head>
<body>
    <!-- Navegación (igual que otras páginas admin) -->

    <main class="pricing-container">
        <h1 style="text-align: center; color: var(--text-primary);">Elige el plan perfecto para tu negocio</h1>
        <p style="text-align: center; color: var(--text-secondary); font-size: 1.1rem; margin-top: 1rem;">
            Prueba gratis durante 14 días. Cancela cuando quieras.
        </p>

        <div class="pricing-grid">
            <!-- Plan Básico -->
            <div class="plan-card">
                <h2 class="plan-name">Básico</h2>
                <div class="plan-price">
                    €0<span>/mes</span>
                </div>
                <p class="plan-trial">Gratis para siempre</p>

                <ul class="plan-features">
                    <li>Hasta 50 reservas/mes</li>
                    <li>1 usuario admin</li>
                    <li>Widget básico</li>
                    <li>Soporte por email</li>
                </ul>

                <button class="btn-plan current" disabled>Plan Actual</button>
            </div>

            <!-- Plan Pro (Featured) -->
            <div class="plan-card featured">
                <span class="plan-badge">⭐ Más Popular</span>
                <h2 class="plan-name">Pro</h2>
                <div class="plan-price">
                    €29<span>/mes</span>
                </div>
                <p class="plan-trial">14 días gratis</p>

                <ul class="plan-features">
                    <li>Reservas ilimitadas</li>
                    <li>5 usuarios admin</li>
                    <li>Widget personalizable</li>
                    <li>Feedback de clientes</li>
                    <li>Múltiples servicios</li>
                    <li>Código QR premium</li>
                    <li>Soporte prioritario</li>
                </ul>

                <button class="btn-plan" onclick="suscribirse('price_XXXPRO')">
                    🚀 Empezar Prueba Gratis
                </button>
            </div>

            <!-- Plan Premium -->
            <div class="plan-card">
                <h2 class="plan-name">Premium</h2>
                <div class="plan-price">
                    €49<span>/mes</span>
                </div>
                <p class="plan-trial">14 días gratis</p>

                <ul class="plan-features">
                    <li>Todo lo de Pro +</li>
                    <li>Usuarios ilimitados</li>
                    <li>Reportes IA quincenales</li>
                    <li>Análisis avanzados</li>
                    <li>Integración WhatsApp</li>
                    <li>Soporte 24/7</li>
                    <li>Gestor de cuenta dedicado</li>
                </ul>

                <button class="btn-plan" onclick="suscribirse('price_XXXPREMIUM')">
                    🚀 Empezar Prueba Gratis
                </button>
            </div>
        </div>

        <div style="text-align: center; margin-top: 3rem; color: var(--text-secondary);">
            <p>✓ Sin permanencia • ✓ Cancela cuando quieras • ✓ Soporte en español</p>
        </div>
    </main>

    <script src="js/api.js"></script>
    <script>
        // Función para iniciar suscripción
        async function suscribirse(priceId) {
            try {
                const button = event.target;
                button.disabled = true;
                button.textContent = 'Procesando...';

                const response = await api.post('/billing/create-checkout-session', {
                    priceId
                });

                // Redirigir a Stripe Checkout
                window.location.href = response.url;

            } catch (error) {
                console.error('Error:', error);
                alert('Error al iniciar suscripción. Por favor, inténtalo de nuevo.');
                button.disabled = false;
                button.textContent = '🚀 Empezar Prueba Gratis';
            }
        }

        // Cargar plan actual del usuario
        async function cargarPlanActual() {
            try {
                const status = await api.get('/billing/subscription-status');

                // Actualizar UI según el plan actual
                document.querySelectorAll('.btn-plan').forEach(btn => {
                    btn.classList.remove('current');
                    btn.disabled = false;
                    btn.textContent = '🚀 Empezar Prueba Gratis';
                });

                // Marcar plan actual
                const currentPlan = status.plan; // 'basic', 'pro', 'premium'
                // TODO: Marcar botón del plan actual como "Plan Actual"

            } catch (error) {
                console.error('Error cargando plan:', error);
            }
        }

        // Cargar al inicio
        cargarPlanActual();
    </script>
</body>
</html>
```

---

### 2. Botón "Gestionar Suscripción" en Dashboard

**Modificar:** `admin/dashboard.html`

Añadir en la sección de perfil/configuración:

```html
<div class="subscription-card">
    <h3>Tu Suscripción</h3>
    <p id="current-plan">Plan: <strong>Pro</strong></p>
    <p id="subscription-status">Estado: <strong>Activo</strong></p>
    <button onclick="abrirPortalCliente()" class="btn-secondary">
        ⚙️ Gestionar Suscripción
    </button>
</div>

<script>
async function abrirPortalCliente() {
    try {
        const response = await api.post('/billing/create-portal-session');
        window.location.href = response.url;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al abrir portal de cliente');
    }
}

// Cargar info de suscripción
async function cargarInfoSuscripcion() {
    try {
        const status = await api.get('/billing/subscription-status');

        document.getElementById('current-plan').innerHTML =
            `Plan: <strong>${status.plan}</strong>`;

        document.getElementById('subscription-status').innerHTML =
            `Estado: <strong>${status.status}</strong>`;

        // Si está en trial, mostrar días restantes
        if (status.isInTrial) {
            const daysLeft = Math.ceil(
                (new Date(status.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)
            );
            document.getElementById('subscription-status').innerHTML +=
                `<br><small>Quedan ${daysLeft} días de prueba</small>`;
        }

    } catch (error) {
        console.error('Error cargando suscripción:', error);
    }
}

cargarInfoSuscripcion();
</script>
```

---

### 3. Banner si Suscripción Expirada

**Añadir en todas las páginas admin:**

```html
<!-- Banner de suscripción expirada -->
<div id="subscription-banner" style="display: none; background: #fef3c7; border-bottom: 2px solid #f59e0b; padding: 1rem; text-align: center;">
    <p style="margin: 0; color: #92400e;">
        ⚠️ <strong>Tu periodo de prueba ha terminado.</strong>
        <a href="planes.html" style="color: #1d4ed8; text-decoration: underline; margin-left: 1rem;">Ver Planes</a>
    </p>
</div>

<script>
// Verificar estado de suscripción
async function verificarSuscripcion() {
    try {
        const status = await api.get('/billing/subscription-status');

        if (status.status === 'canceled' || status.status === 'incomplete' ||
            (status.isInTrial === false && status.plan === 'basic')) {
            document.getElementById('subscription-banner').style.display = 'block';
        }
    } catch (error) {
        console.error('Error verificando suscripción:', error);
    }
}

verificarSuscripcion();
</script>
```

---

## 🧪 Testing

### Tarjetas de Prueba Stripe

```
Pago exitoso:
  Número:  4242 4242 4242 4242
  CVC:     Cualquier 3 dígitos
  Fecha:   Cualquier fecha futura

Pago rechazado:
  Número:  4000 0000 0000 0002

Requiere 3D Secure:
  Número:  4000 0027 6000 3184
```

### Flujo de Testing

1. **Registrar nuevo negocio**
2. **Ir a Planes** → Click "Empezar Prueba Gratis" (Plan Pro)
3. **Stripe Checkout** → Usar tarjeta 4242 4242 4242 4242
4. **Verificar** que redirige a dashboard con mensaje de éxito
5. **Comprobar BD** → subscription_status = 'trialing'
6. **Ver webhooks** en Stripe Dashboard → Debe aparecer `checkout.session.completed`
7. **Ir a "Gestionar Suscripción"** → Verificar que abre Stripe Portal
8. **Cancelar suscripción** → Verificar webhook `customer.subscription.deleted`
9. **Comprobar BD** → subscription_status = 'canceled', plan = 'basic'

---

## 🚀 Despliegue a Producción

### 1. Configurar Webhooks en Stripe

**Ir a:** https://dashboard.stripe.com/webhooks

1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://stickywork.com/api/webhooks/stripe`
3. **Eventos a escuchar:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **"Add endpoint"**
5. **Copiar Signing secret** (whsec_XXX)
6. Añadir a Railway como variable `STRIPE_WEBHOOK_SECRET`

### 2. Variables de Entorno en Railway

Añadir todas estas variables:

```env
# Stripe LIVE (cambiar de test a live)
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX

# URLs
APP_URL=https://stickywork.com
```

### 3. Activar Cuenta Stripe

1. Completar verificación de identidad
2. Añadir cuenta bancaria para recibir pagos
3. Activar modo LIVE

### 4. Recrear Productos en Modo LIVE

Ejecutar de nuevo `setup-stripe-products.js` con claves LIVE para crear productos en producción.

**O crearlos manualmente** en Stripe Dashboard (recomendado):
- Product: StickyWork Pro → Price: €29/mes
- Product: StickyWork Premium → Price: €49/mes

**Actualizar Price IDs en frontend** con los nuevos IDs de producción.

---

## 💰 Proyección de Ingresos

### Escenario Conservador (6 meses)

```
Mes 1:  10 usuarios Pro (€29)  = €290
Mes 2:  25 usuarios Pro        = €725
Mes 3:  50 usuarios Pro        = €1,450
        5 usuarios Premium (€49) = €245
Mes 4:  80 usuarios Pro        = €2,320
        10 usuarios Premium    = €490
Mes 5:  120 usuarios Pro       = €3,480
        20 usuarios Premium    = €980
Mes 6:  150 usuarios Pro       = €4,350
        30 usuarios Premium    = €1,470

TOTAL MES 6: €5,820/mes
TOTAL ANUAL: €69,840/año
```

### Costos

```
Stripe (1.5% + €0.25):  ~€100/mes
Railway:                €20/mes
Brevo (emails):         €25/mes
OpenAI API:             €10/mes
Dominio:                €10/año
---------------------------------
TOTAL COSTOS:           ~€155/mes

MARGEN: €5,665/mes (97%)
```

---

## ⚠️ Consideraciones Legales

### Facturación
- Stripe genera facturas automáticamente
- Incluyen IVA (21% en España)
- Se envían por email al cliente

### Impuestos
- Declarar ingresos trimestralmente (modelo 303 IVA + modelo 130 IRPF)
- Retener 21% IVA de cada pago
- Guardar facturas 5 años

### Política de Reembolsos
**Sugerencia:**
- 14 días de prueba gratis (sin cobro)
- 30 días money-back guarantee
- Cancelación efectiva al fin del periodo pagado (no prorata)

### Términos y Condiciones
Debe incluir:
- Descripción de planes
- Política de cancelación
- Qué pasa con los datos al cancelar
- Método de facturación
- Soporte disponible

---

## 📋 Checklist de Implementación

### Preparación
- [ ] Crear cuenta Stripe
- [ ] Instalar `npm install stripe`
- [ ] Crear productos en Stripe Dashboard (TEST)
- [ ] Copiar Price IDs

### Backend
- [ ] `backend/config/stripe.js` - Configuración
- [ ] `backend/migrations/013_subscriptions.sql` - Migración
- [ ] `backend/routes/billing.js` - Endpoints de billing
- [ ] `backend/routes/webhooks.js` - Webhooks de Stripe
- [ ] `backend/middleware/subscription.js` - Middleware verificación
- [ ] Actualizar `server.js` - Importar rutas
- [ ] Testing con Postman/Thunder Client

### Frontend
- [ ] `admin/planes.html` - Página de pricing
- [ ] Modificar `admin/dashboard.html` - Botón "Gestionar Suscripción"
- [ ] Banner de suscripción expirada en todas las páginas
- [ ] Testing flujo completo

### Configuración
- [ ] Configurar webhooks en Stripe Dashboard
- [ ] Añadir variables de entorno en Railway
- [ ] Testing con tarjetas de prueba
- [ ] Verificar logs de webhooks

### Legal
- [ ] Redactar términos de servicio
- [ ] Política de reembolsos
- [ ] Actualizar política de privacidad

### Producción
- [ ] Activar cuenta Stripe (verificación identidad + banco)
- [ ] Cambiar claves TEST → LIVE
- [ ] Recrear productos en modo LIVE
- [ ] Actualizar Price IDs en frontend
- [ ] Configurar webhooks en producción
- [ ] Monitorear primeros pagos

---

## 🎯 Orden de Implementación Sugerido

### **Semana 1:** Sistema de Feedback (PLAN_PROXIMA_SESION.md)
- Implementar FASE 1 completa
- Tener feature diferenciador

### **Semana 2:** Sistema de Pagos (este documento)
- Integrar Stripe
- Crear página de planes
- Testing completo

### **Semana 3:** Reportes IA
- Implementar FASE 2 de feedback
- Feature premium para Plan Premium

### **Semana 4:** Pulir y lanzar
- UX/UI refinements
- Documentación
- Marketing

---

## 📊 KPIs a Monitorear

**Conversión:**
- % usuarios que activan trial
- % trial → pago (objetivo: >40%)
- % cancelaciones (objetivo: <5%/mes)

**Ingresos:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate (tasa de cancelación)

**Soporte:**
- Tickets relacionados con pagos
- Tiempo de respuesta

---

**¡Sistema de Pagos listo para implementar! 💰**

Notas finales:
- Empezar con modo TEST de Stripe
- No apresurarse al modo LIVE
- Testing exhaustivo antes de producción
- Monitorear webhooks de cerca los primeros días
