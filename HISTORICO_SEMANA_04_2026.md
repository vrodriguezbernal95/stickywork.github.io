# 📅 Histórico de Desarrollo - Semana 04/2026

**Período:** 20-26 de enero de 2026
**Rama de trabajo:** `staging` (desarrollo) → `master` (producción)

---

## 🎯 Objetivo de la Semana

**Refinamiento del Sistema de Planes y Preparación para Monetización**

Después de completar el dashboard SuperAdmin en la semana 03, esta semana nos enfocamos en:
1. Definir estructura de precios final y coherente
2. Actualizar comunicación en web (planes.html)
3. Implementar limitaciones técnicas por plan
4. Preparar base para sistema multi-usuario (desarrollo próxima semana)

---

## 📊 Estado Inicial (20-ene-2026)

### ✅ En Producción (master)
- Sistema de Entitlements completo
- Dashboard SuperAdmin con gestión de planes
- Tabla `plan_changes` para audit trail
- Validación de límites en servicios y reportes IA

### 🎯 Planes Implementados en SuperAdmin (semana 03)
**Estructura antigua que requería ajuste:**
- FREE: 0€ (1 usuario, sin reportes IA)
- FOUNDERS: 25€ (5 usuarios, 1 reporte/mes)
- PROFESSIONAL: 39€ (10 usuarios, 5 reportes/mes, API)
- PREMIUM: 79€ (∞ usuarios, reportes ilimitados, White Label)

### ⚠️ Problemas Detectados
1. **Desalineación web vs backend**: planes.html mostraba 20€/mes, backend tenía 25€/39€/79€
2. **Falta límite en FREE**: Sin restricción de reservas mensuales
3. **Confusión FOUNDERS vs PROFESSIONAL**: Ambos eran casi iguales
4. **API y White Label no implementados**: Se prometían features inexistentes

---

## 🎨 Nueva Estructura de Planes (Definida 16-ene-2026)

### Decisiones Clave

1. **FOUNDERS = PROFESSIONAL** (mismo contenido, precio diferente)
   - FOUNDERS: Precio especial €25/mes para primeros 50 clientes
   - PROFESSIONAL: Precio regular €39/mes (mismo plan, post-early adopters)

2. **Límites ajustados para forzar escalado:**
   - FREE: 1 usuario, 30 reservas/mes → Trial/testeo
   - FOUNDERS/PRO: 3 usuarios, ∞ reservas, 1 reporte/mes → Pequeño negocio
   - PREMIUM: 10 usuarios, ∞ reservas, 2 reportes/semana → Equipo/empresa

3. **Features Premium diferenciadas:**
   - Consultoría 1h/mes (exclusiva Premium)
   - Landing page incluida gratis (valor €200)
   - Soporte prioritario

4. **Estrategia API/White Label:**
   - NO comunicar en web hasta implementación completa
   - Desarrollar en silencio
   - Lanzar como "sorpresa" para clientes Premium
   - Genera valor añadido inesperado

### Tabla Final de Planes

| Plan | Precio | Usuarios | Reservas/mes | Reportes IA | Consultoría | Landing | Implementación |
|------|--------|----------|--------------|-------------|-------------|---------|----------------|
| **GRATIS** | €0 | 1 | 30 máx | ❌ | ❌ | ❌ | ❌ Autoservicio |
| **FOUNDERS** | €25* | 3 | ∞ | 1/mes | ❌ | +€200 | ✅ Te ayudamos |
| **PROFESIONAL** | €39 | 3 | ∞ | 1/mes | ❌ | +€200 | ✅ Te ayudamos |
| **PREMIUM** | €79 | 10 | ∞ | 2/semana | ✅ 1h/mes | ✅ Gratis | ✅ Prioritario |

*Solo primeros 50 clientes

---

## 🚀 Trabajo Realizado

### Sesión 1: 16-ene-2026 - Despliegue SuperAdmin + Definición de Precios

#### ✅ Completado
1. **Despliegue exitoso a producción**
   - Sistema de Entitlements
   - Dashboard SuperAdmin de Planes
   - Migraciones en base de datos Railway
   - Resolución de problema: Railway tenía repo "trabado" en commit viejo

2. **Actualización de documentación**
   - `README_CLAUDE.md` → Referencia a semana 03
   - Estado del proyecto actualizado
   - Features en producción documentadas

3. **Definición de nueva estructura de precios**
   - 4 planes claramente diferenciados
   - Estrategia de escalado forzado (FREE trial → upgrade necesario)
   - Plan FOUNDERS como urgencia limitada (solo 50 primeros)

#### 📝 Decisiones Técnicas
- **Límite FREE**: 30 reservas/mes (suficiente para testeo, insuficiente para producción)
- **FOUNDERS/PRO**: 3 usuarios (cubre pequeños equipos sin saltar a Premium)
- **PREMIUM**: 10 usuarios (equipos más grandes)
- **Reportes IA**:
  - FREE: 0
  - FOUNDERS/PRO: 1/mes
  - PREMIUM: 2/semana (8/mes aprox)

---

### Sesión 2: 16-ene-2026 - Actualización Web y Backend

#### ✅ Completado (Tareas 1 y 2)

**1. Actualización de planes.html**
- ✅ Reescrita sección de planes con 4 bloques verticales
- ✅ Plan GRATIS con mensaje de 30 reservas/mes + opción de solicitar plan Profesional gratis si aportan valor
- ✅ Plan FOUNDERS con badge "Solo primeros 50 clientes"
- ✅ Plan PROFESIONAL con precio regular €39/mes
- ✅ Plan PREMIUM con consultoría, landing gratis y 10 usuarios
- ✅ Tabla comparativa actualizada
- ✅ FAQ actualizada con nuevos precios
- ✅ Eliminadas referencias a API y White Label (no mencionarlos hasta implementarlos)

**2. Implementación de Limitaciones Técnicas**

**Backend - SuperAdmin (`backend/routes/super-admin.js`):**
- ✅ Actualizada definición de `planLimits`:
  ```javascript
  free: {
    maxUsers: 1,
    maxBookingsPerMonth: 30,
    aiReportsPerMonth: 0
  }
  founders: {
    maxUsers: 3,
    maxBookingsPerMonth: null,
    aiReportsPerMonth: 1
  }
  professional: {
    maxUsers: 3,
    maxBookingsPerMonth: null,
    aiReportsPerMonth: 1
  }
  premium: {
    maxUsers: 10,
    maxBookingsPerMonth: null,
    aiReportsPerMonth: 8  // 2/semana
  }
  ```

**Backend - Entitlements (`backend/middleware/entitlements.js`):**
- ✅ Implementado middleware `validateBookingsLimit`
- ✅ Validación de 30 reservas/mes para plan FREE
- ✅ Mensaje de error amigable cuando se alcanza límite
- ✅ Query optimizada para contar reservas del mes actual

**Backend - Routes (`backend/routes.js`):**
- ✅ Middleware `validateBookingsLimit` añadido a `POST /api/bookings`
- ✅ Se ejecuta después de `createBookingLimiter` (rate limit) y antes de crear reserva

**Archivos modificados:**
- `planes.html` - Estructura completa nueva
- `backend/routes/super-admin.js` - Límites actualizados
- `backend/middleware/entitlements.js` - Validación de reservas mensuales
- `backend/routes.js` - Integración del middleware

---

## 📝 Notas Técnicas Importantes

### Validación de Reservas Mensuales

**Funcionamiento:**
1. Usuario con plan FREE intenta crear reserva
2. Middleware `validateBookingsLimit` se ejecuta
3. Cuenta reservas del mes actual (excluyendo canceladas)
4. Si >= 30: Error 403 con mensaje claro
5. Si < 30: Continúa con creación de reserva

**Query SQL:**
```sql
SELECT COUNT(*) as count
FROM bookings
WHERE business_id = ?
  AND MONTH(booking_date) = MONTH(CURRENT_DATE)
  AND YEAR(booking_date) = YEAR(CURRENT_DATE)
  AND status != 'cancelled'
```

### Planes FOUNDERS vs PROFESSIONAL

**Implementación backend:**
- Ambos tienen mismos límites (`maxUsers: 3`, `aiReportsPerMonth: 1`)
- Diferencia solo en precio (€25 vs €39)
- Backend no diferencia funcionalidad
- Diferenciación es solo de marketing (primeros 50)

**Contador de FOUNDERS:**
- **NO implementado automáticamente** en esta sesión
- Se gestionará manualmente desde SuperAdmin
- Cuando se alcancen 50, cambiar nuevos registros a "professional"
- Alternativa futura: Contador automático en registro

---

## 🎯 Próximas Tareas (Semana 04 continuación)

### 🟢 Prioridad ALTA (Bloqueantes para venta)

**3. Sistema Multi-Usuario** (2-3 sesiones) ✅ COMPLETADO Sesión 3
- [x] Modificar tabla `admin_users` para permitir múltiples usuarios por negocio
- [x] Sistema de roles: Owner, Admin, Staff
- [x] Endpoints de gestión de equipo (invitar, listar, eliminar)
- [x] UI en panel admin: Sección "Equipo"
- [x] Validación de límite de usuarios según plan
- [x] Sistema de invitaciones por email (simplificado: owner crea cuenta directamente)

**✅ Ya se puede vender plan PREMIUM** (10 usuarios)

### 🟡 Prioridad MEDIA (Diferenciadores)

**4. Consultoría 1h/mes Premium** (0.5-1 sesión)
- [ ] Sistema de agendamiento (puede ser manual inicialmente)
- [ ] Email mensual automático a clientes Premium
- [ ] Integración con Calendly o similar
- [ ] Documentar proceso de consultoría

### 🔵 Prioridad BAJA (Features avanzadas)

**5. API Pública** (3-4 sesiones)
- [ ] Autenticación con API Keys
- [ ] Documentación (Swagger)
- [ ] Rate limiting por cliente
- [ ] Endpoints: bookings, services, availability
- [ ] Webhooks (opcional)

**6. White Label** (2-3 sesiones)
- [ ] Sistema de configuración de branding por negocio
- [ ] Plantillas de email personalizables
- [ ] Ocultar marca en widget y panel
- [ ] Subdominios custom (opcional)

---

## 📦 Stack Tecnológico

### Backend
- **Framework:** Node.js + Express
- **Base de datos:** MySQL en Railway
- **Autenticación:** JWT + Refresh Tokens
- **IA:** Claude API (Anthropic)

### Frontend
- **Admin Panel:** Vanilla JS
- **Widget:** Vanilla JS (embebible)
- **Estilos:** CSS custom con variables

### Infraestructura
- **Hosting Backend:** Railway (auto-deploy desde master)
- **Hosting Frontend:** GitHub Pages
- **Base de datos:** MySQL en Railway
- **Dominio:** stickywork.com, api.stickywork.com

---

## 🗂️ Estructura de Archivos Clave

```
stickywork/
├── backend/
│   ├── routes/
│   │   ├── super-admin.js        # Gestión de planes (modificado)
│   │   └── ...
│   ├── middleware/
│   │   ├── entitlements.js       # Validación de límites (modificado)
│   │   └── ...
│   └── migrations/
│       ├── add-entitlements.sql  # Migración de planes
│       └── add-plan-history.sql  # Auditoría de cambios
├── planes.html                    # Página de precios (reescrita)
├── HISTORICO_SEMANA_04_2026.md   # Este archivo
└── README_CLAUDE.md              # Onboarding de Claude
```

---

## 📊 Métricas y KPIs

### Límites Técnicos Implementados
- Plan FREE: 30 reservas/mes ✅
- Plan FOUNDERS: 3 usuarios, 1 reporte IA/mes ✅
- Plan PROFESSIONAL: 3 usuarios, 1 reporte IA/mes ✅
- Plan PREMIUM: 10 usuarios, 8 reportes IA/mes ✅

### Revenue Potencial
- FOUNDERS (50 clientes): €1,250/mes
- PROFESSIONAL: €39/mes por cliente
- PREMIUM: €79/mes por cliente
- Landing Page: €200 one-time

**MRR objetivo con 100 clientes:**
- 30 FREE: €0
- 50 FOUNDERS: €1,250
- 15 PROFESSIONAL: €585
- 5 PREMIUM: €395
- **Total: €2,230/mes**

---

## 🐛 Problemas Conocidos

### ✅ Resueltos
1. ~~Railway desplegando código viejo~~ → Resuelto reconectando repo
2. ~~Desalineación precios web vs backend~~ → Resuelto actualizando planes.html
3. ~~FREE sin límite de reservas~~ → Resuelto con validación de 30/mes

### ⚠️ Pendientes
1. **Sistema multi-usuario no existe** → Bloqueante para venta de Premium
2. **FOUNDERS sin contador automático** → Se gestiona manualmente
3. **Consultoría sin sistema de agendamiento** → Puede ser manual inicialmente

---

## 🔐 Seguridad y Validaciones

### Implementadas
- ✅ Validación de límite de reservas mensuales (plan FREE)
- ✅ Validación de límite de servicios (todos los planes)
- ✅ Validación de límite de reportes IA (todos los planes)
- ✅ Middleware de autenticación JWT
- ✅ Rate limiting en endpoints públicos

### Pendientes
- [x] Validación de límite de usuarios ✅ (completado con sistema multi-usuario)

---

## 💡 Lecciones Aprendidas

1. **Railway y Git:** Railway puede quedarse "trabado" en commits viejos. Solución: Desconectar y reconectar repo.

2. **Escalado de precios:**
   - FREE debe ser restrictivo (30 reservas/mes) para forzar upgrade
   - Salto FREE → FOUNDERS pequeño (€0 → €25) = bajo riesgo
   - Salto FOUNDERS → PREMIUM grande (€25 → €79) pero justificado (10 usuarios, consultoría, landing)

3. **Marketing de urgencia:**
   - "Solo primeros 50" en FOUNDERS crea FOMO efectivo
   - No prometer features no implementadas (API, White Label)
   - Mejor sorprender positivamente después

4. **Desarrollo incremental:**
   - Implementar límites técnicos ANTES de comunicar planes
   - Validar en local exhaustivamente antes de desplegar
   - Documentar cada cambio inmediatamente

---

### Sesión 3: 19-ene-2026 - Sistema Multi-Usuario Completo

#### ✅ Completado (Tarea 3)

**1. Backend - Sistema completo de gestión de equipos**
- ✅ Creado `backend/routes/team.js` con 5 endpoints:
  - GET /api/team/:businessId - Listar usuarios del equipo
  - POST /api/team - Crear usuario (con validateUsersLimit middleware)
  - PATCH /api/team/:userId - Actualizar usuario (rol, estado)
  - DELETE /api/team/:userId - Eliminar usuario permanentemente
  - POST /api/team/:userId/reset-password - Resetear contraseña
- ✅ Todas las validaciones de seguridad implementadas:
  - Solo owner puede gestionar equipo
  - No se pueden crear más owners (solo 1 por negocio)
  - No se puede eliminar/editar al owner
  - No eliminarse a sí mismo
  - Solo roles válidos (admin, staff)
- ✅ Integrado en `backend/routes.js`

**2. Backend - Emails de notificación**
- ✅ 3 nuevas templates en `backend/email-service.js`:
  - teamMemberWelcome - Email con credenciales de acceso
  - teamMemberRoleChanged - Notificación de cambio de rol
  - teamMemberDeactivated - Notificación de desactivación
- ✅ Funciones de envío exportadas y funcionales
- ✅ Integradas en endpoints de team.js

**3. Frontend - Sección completa de gestión de equipo**
- ✅ Módulo `admin/js/team.js` con todas las funciones:
  - load() y loadTeamData() - Carga de datos
  - render() y renderUserTable() - Renderizado UI
  - Modales: crear, editar, confirmar eliminar
  - Acciones: crear, actualizar, eliminar, activar/desactivar, reset password
- ✅ Integrado en sidebar (solo visible para owner/admin)
- ✅ Routing en `admin/js/app.js`
- ✅ Visibilidad controlada en `admin/js/auth.js` (updateTeamMenu)

**4. Frontend - Estilos CSS completos**
- ✅ Agregados en `admin/css/admin.css`:
  - .team-container, .team-usage-badge
  - .role-badge (owner, admin, staff) con gradientes
  - .status-badge (activo, inactivo)
  - .actions-dropdown con botones de acción
  - .warning-banner para límite alcanzado
  - .form-group, .form-label, .form-input para modales
  - Responsive design para móviles

**5. Características implementadas**
- ✅ Validación de límite de usuarios según plan (middleware existente aplicado)
- ✅ Indicador visual de uso (ej: "3/5 usuarios")
- ✅ Advertencia cuando se alcanza límite de plan
- ✅ Roles visuales diferenciados (owner dorado, admin azul, staff morado)
- ✅ Estados activo/inactivo con control
- ✅ Sistema de emails automáticos para todas las acciones
- ✅ Interfaz intuitiva con confirmaciones para acciones destructivas

#### 📝 Decisiones Técnicas
**Permisos por rol (definidos por usuario):**
- Owner: Gestiona equipo y planes (acceso completo a Team)
- Admin: Gestiona reservas y servicios (puede VER equipo pero no modificar)
- Staff: Solo ve reservas, puede confirmar/cancelar (sin acceso a Team)

**Flujo de creación de usuarios:**
- Owner crea cuenta completa desde panel (sin sistema de invitaciones por token)
- Sistema envía email automático con credenciales
- Usuario puede cambiar contraseña después

**Reglas de Owner:**
- Solo 1 Owner por negocio (el que registró)
- No se pueden crear más Owners
- Owner no puede ser eliminado ni editado

**Acciones del Owner:**
- ✅ Desactivar/reactivar usuarios temporalmente
- ✅ Eliminar usuarios permanentemente
- ✅ Cambiar rol (solo admin ↔ staff)
- ✅ Resetear contraseña de usuarios

#### Archivos modificados/creados:
**Backend:**
- `backend/routes/team.js` - NUEVO (427 líneas)
- `backend/routes.js` - Integración de teamRoutes
- `backend/email-service.js` - 3 templates nuevas + funciones

**Frontend:**
- `admin/js/team.js` - NUEVO (460 líneas)
- `admin/js/auth.js` - Función updateTeamMenu()
- `admin/js/app.js` - Case 'team' en routing
- `admin-dashboard.html` - Link sidebar + script
- `admin/css/admin.css` - 180 líneas de estilos

---

### Sesión 4: 20-ene-2026 - Corrección de Bugs en Panel Admin y Deploy

#### ✅ Completado

**1. Fix: Login expulsaba al usuario inmediatamente**
- **Problema:** Al hacer login, el usuario entraba al dashboard pero era redirigido al login inmediatamente
- **Causa:** Faltaba la columna `ai_reports_enabled` en la tabla `businesses` de la BD local
- **Solución:** `ALTER TABLE businesses ADD COLUMN ai_reports_enabled BOOLEAN DEFAULT FALSE`

**2. Fix: Sección "Equipo" mostraba "en construcción"**
- **Problema:** Al hacer clic en "Equipo" aparecía mensaje de sección en construcción
- **Causa:** Faltaba exportar el módulo `window.team = team;` al final de `admin/js/team.js`
- **Solución:** Añadido export al final del archivo

**3. Fix: Error `auth.getUser()` no existía**
- **Problema:** Error silencioso que causaba redirect al login
- **Causa:** Se llamaba a `auth.getUser()` pero el método no existía en el objeto auth
- **Solución:**
  - Cambiado `auth.getUser()` a `auth.userData` en `team.js` y `auth.js`
  - Añadido método `getUser()` a `auth.js` para compatibilidad futura

**4. Fix: `modal.toast` y `modal.confirm` no funcionaban**
- **Problema:** Los métodos esperaban objeto de opciones pero se llamaban con parámetros posicionales
- **Solución:** Actualizados ambos métodos en `admin/js/components/modal.js` para soportar ambos estilos:
  ```javascript
  // Ahora soporta ambos:
  modal.toast('mensaje', 'success');
  modal.toast({ message: 'mensaje', type: 'success' });
  ```

**5. Mejora UX: Modal de límite de plan con botón de upgrade**
- **Antes:** Toast simple con mensaje de error
- **Ahora:** Modal con título, mensaje explicativo y botón "🚀 Mejorar Plan" que redirige a `planes.html`

**6. Deploy a producción - Problema con Railway**
- **Problema:** Railway no desplegaba los cambios aunque se hacía push a master
- **Diagnóstico:** La ruta `/api/team/9` devolvía 404 en producción
- **Solución:** Desconectar y reconectar repo en Railway (Settings > Source > Disconnect)
- **Nota importante:** Al reconectar, dejar "Root Directory" completamente vacío

#### Archivos modificados:
- `admin/js/auth.js` - Añadido método `getUser()`, corregida referencia a `userData`
- `admin/js/team.js` - Añadido export `window.team`, mejorado manejo de errores de límite
- `admin/js/components/modal.js` - Soporte dual para parámetros posicionales y objeto

#### Commits:
- `4b12417` - fix: Corregir errores en panel admin y mejorar UX de límite de plan
- `bdecf9d` - chore: Trigger redeploy for team routes

---

## 🎯 Próximas Tareas (Siguiente Sesión)

### ✅ Completado de Semana 04
- [x] Sistema Multi-Usuario completo
- [x] Validación de límites por plan
- [x] UI de gestión de equipo
- [x] Deploy a producción funcionando

### 🟡 Pendiente para próximas sesiones

**1. Testing en producción**
- [ ] Crear usuario de prueba en producción (plan superior a FREE)
- [ ] Verificar que se pueden añadir usuarios al equipo
- [ ] Verificar emails de bienvenida se envían correctamente

**2. Consultoría 1h/mes Premium**
- [ ] Sistema de agendamiento (Calendly o similar)
- [ ] Email mensual automático a clientes Premium

**3. Mejoras menores detectadas**
- [ ] Añadir columna `ai_reports_enabled` a BD de producción si no existe
- [ ] Considerar migración automática al iniciar servidor

---

## 📚 Referencias

- **Anterior:** [HISTORICO_SEMANA_03_2026.md](./HISTORICO_SEMANA_03_2026.md)
- **README:** [README_CLAUDE.md](./README_CLAUDE.md)
- **Workflow:** [WORKFLOW_DESARROLLO.md](./WORKFLOW_DESARROLLO.md)

---

### Sesión 5: 21-ene-2026 - Sistema de Pagos con Stripe

#### ✅ Completado

**1. Configuración de cuenta Stripe**
- ✅ Cuenta de Stripe creada (modo producción)
- ✅ 3 productos configurados con precios recurrentes mensuales:
  - Founders: €25/mes (`price_1Ss2l3CmufkxijAWiadxQAbd`)
  - Profesional: €39/mes (`price_1Ss2lvCmufkxijAWrqQh4kDo`)
  - Premium: €79/mes (`price_1Ss2nLCmufkxijAWb5XWduZE`)
- ✅ Webhook configurado (`whsec_d1GBcd0eSLwvnKBSWSKKTrx9ZkkxqCxQ`)
  - Eventos: checkout.session.completed, customer.subscription.*, invoice.paid, invoice.payment_failed

**2. Backend - Endpoints de Stripe**
- ✅ Creado `backend/routes/stripe.js` con:
  - POST `/api/stripe/create-checkout-session` - Crea sesión de pago con 7 días trial
  - POST `/api/stripe/create-portal-session` - Acceso al portal de cliente Stripe
  - GET `/api/stripe/subscription-status` - Estado actual de suscripción
  - POST `/api/stripe/webhook` - Maneja eventos de Stripe
  - GET `/api/stripe/payment-history` - Historial de pagos
- ✅ Handlers para eventos:
  - handleCheckoutComplete - Actualiza plan al completar pago
  - handleSubscriptionUpdate - Sincroniza estado de suscripción
  - handleSubscriptionCanceled - Degrada a FREE al cancelar
  - handleInvoicePaid - Registra pago exitoso
  - handlePaymentFailed - Inicia período de gracia de 5 días
  - handleTrialEnding - Notifica fin de trial (3 días antes)

**3. Base de datos - Migración ejecutada**
- ✅ Tabla `subscriptions`:
  - business_id, stripe_customer_id, stripe_subscription_id
  - plan_name, status (trialing/active/past_due/canceled)
  - trial_start, trial_end, current_period_start, current_period_end
  - cancel_at_period_end, canceled_at
- ✅ Tabla `payment_history`:
  - stripe_invoice_id, stripe_payment_intent_id
  - amount, currency, status, description
  - invoice_url, invoice_pdf, failure_reason
- ✅ Tabla `payment_reminders`:
  - reminder_type (first_warning, second_warning, final_warning, suspended)
  - grace_period_ends
- ✅ Columnas añadidas a `businesses`:
  - stripe_customer_id, subscription_status, trial_ends_at, grace_period_ends_at

**4. Frontend - Sección de Facturación**
- ✅ Módulo `admin/js/billing.js`:
  - Muestra plan actual con estado (trial/activo/pendiente/cancelado)
  - Tarjetas de upgrade para los 3 planes de pago
  - Historial de pagos (solo para owners)
  - Botón "Gestionar suscripción" → Portal de Stripe
  - Botón "Empezar prueba gratis" → Checkout de Stripe
- ✅ Integrado en sidebar: "💳 Facturación"
- ✅ Restringido para staff (solo owners y admins ven la sección)
- ✅ Estilos CSS completos en `admin/css/admin.css`

**5. Variables de entorno en Railway**
- ✅ STRIPE_SECRET_KEY configurada
- ✅ STRIPE_PRICE_FOUNDERS configurada
- ✅ STRIPE_PRICE_PROFESSIONAL configurada
- ✅ STRIPE_PRICE_PREMIUM configurada
- ✅ STRIPE_WEBHOOK_SECRET configurada

**6. Restricciones de permisos**
- ✅ Staff no puede ver sección Facturación (billingLink añadido a restrictedElements)
- ✅ Solo owners pueden crear checkout y acceder al portal (requireRole('owner'))
- ✅ Admins pueden ver estado pero no gestionar

#### 📝 Características del sistema de pagos

**Trial de 7 días:**
- Usuario selecciona plan → Stripe Checkout
- 7 días de acceso completo sin cobro
- Al día 8 se cobra automáticamente
- Si cancela antes del día 7, no se cobra nada

**Período de gracia (5 días):**
- Si falla el pago → estado "past_due"
- 5 días para actualizar método de pago
- Se envían recordatorios (TODO: implementar emails)
- Después de 5 días → degradación a FREE

**Gestión de suscripción:**
- Portal de Stripe para:
  - Cambiar método de pago
  - Ver facturas
  - Cancelar suscripción
  - Actualizar datos de facturación

#### Archivos creados/modificados:
**Backend:**
- `backend/routes/stripe.js` - NUEVO (484 líneas)
- `backend/routes.js` - Import y uso de stripeRoutes
- `backend/migrations/012_subscriptions.sql` - NUEVO
- `package.json` - Añadida dependencia stripe

**Frontend:**
- `admin/js/billing.js` - NUEVO (280 líneas)
- `admin/js/app.js` - Case 'billing' en routing
- `admin/js/auth.js` - billingLink en restrictedElements
- `admin-dashboard.html` - Link sidebar + script
- `admin/css/admin.css` - ~200 líneas de estilos billing

**Scripts auxiliares:**
- `run-stripe-migration.js` - Script para ejecutar migración

#### Commits:
- `1b6c159` - feat: Implementar sistema de pagos con Stripe
- `9ef2bd9` - fix: Añadir dependencia stripe a package.json

#### ⚠️ Problema recurrente con Railway
- **Síntoma:** Push a master no despliega automáticamente
- **Solución temporal:** Settings > Source > Disconnect repo > Reconnect > Deploy
- **Causa probable:** Webhook de GitHub con Railway no funciona correctamente

---

## 🎯 Pendiente para Próxima Sesión

### 🔴 Prioridad ALTA - Probar sistema de pagos

**1. Configurar modo TEST en Stripe (recomendado)**
- [ ] Activar "Test mode" en Stripe Dashboard
- [ ] Obtener claves de test (`sk_test_...`, `pk_test_...`)
- [ ] Crear productos de test con mismos precios
- [ ] Configurar webhook de test
- [ ] Actualizar variables en Railway con claves test
- [ ] Probar flujo completo con tarjeta `4242 4242 4242 4242`

**2. Probar flujo completo de suscripción**
- [ ] Crear checkout desde panel admin
- [ ] Completar pago en Stripe
- [ ] Verificar webhook actualiza BD
- [ ] Verificar plan cambia en dashboard
- [ ] Probar portal de cliente
- [ ] Probar cancelación

**3. Emails de suscripción** ✅ COMPLETADO (verificado sesión 8)
- [x] Email de bienvenida al suscribirse
- [x] Email de recordatorio fin de trial (3 días antes)
- [x] Email de pago fallido
- [x] Email de cancelación

### 🟡 Prioridad MEDIA

**4. Mejorar UX de facturación**
- [ ] Mostrar días restantes de trial
- [ ] Indicador visual de período de gracia
- [ ] Notificaciones in-app de estado de pago

**5. Documentar proceso**
- [ ] Guía para configurar Stripe desde cero
- [ ] Troubleshooting de problemas comunes
- [ ] Proceso de reembolsos

---

---

### Sesión 5 (continuación): 21-ene-2026 - Pruebas de Stripe Exitosas

#### ✅ Completado

**1. Configuración de modo TEST en Stripe**
- ✅ Activado entorno de prueba en Stripe
- ✅ Creados 3 productos de test con mismos precios
- ✅ Configurado webhook de test
- ✅ Variables de test actualizadas en Railway

**2. Prueba de flujo de pago completa**
- ✅ Checkout funciona correctamente
- ✅ Redirect a dashboard después del pago ✅
- ✅ Tarjeta de prueba `4242 4242 4242 4242` aceptada
- ✅ Suscripción creada en modo trial (7 días)

**3. Fix importante encontrado**
- **Problema:** Después del pago, redirigía a GitHub Pages (404)
- **Causa:** `FRONTEND_URL` estaba configurado como `https://vrodriguezbernal95.github.io`
- **Solución:** Cambiado a `https://stickywork.com`
- **Nota:** Este error podría haber causado otros problemas de redirect en el pasado

**4. Variables restauradas a PRODUCCIÓN**
- ✅ Claves LIVE restauradas en Railway para uso real

---

## 🔐 Credenciales de Stripe (Referencia)

### PRODUCCIÓN (LIVE) - Usar en producción real
```
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_PRICE_FOUNDERS=price_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_PRICE_PROFESSIONAL=price_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_PRICE_PREMIUM=price_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXX (ver Dashboard Stripe)
```

### TEST - Usar para pruebas sin cobros reales
```
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_PRICE_FOUNDERS=price_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_PRICE_PROFESSIONAL=price_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_PRICE_PREMIUM=price_XXXXXXXXXX (ver Dashboard Stripe)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXX (ver Dashboard Stripe)
```

⚠️ **IMPORTANTE**: Las claves reales están en el Dashboard de Stripe y en las variables de entorno de Railway.
Nunca commitear claves reales a git.

### Tarjeta de prueba (solo funciona con claves TEST)
```
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura (ej: 12/28)
CVC: Cualquier 3 dígitos (ej: 123)
```

---

### Sesión 6: 23-ene-2026 - Fix Bug Consultoría Premium

#### ✅ Completado

**1. Diagnóstico del problema**
- **Síntoma:** Error en consola al acceder a la sección Consultoría en el dashboard
- **Error:** `TypeError: Cannot read properties of undefined (reading 'reason')`
- **Ubicación:** `consultancy.js:88` en función `renderEligibilityStatus`

**2. Causa raíz identificada (2 problemas)**

**Problema 1: Estructura de respuesta incorrecta**
- El endpoint `/api/consultancy/can-request` devuelve: `{ success, canRequest, reason, message }`
- El frontend esperaba: `eligibilityRes.data?.canRequest`
- Pero la respuesta NO está envuelta en `.data`

**Problema 2: Falta de validación defensiva**
- La función `renderEligibilityStatus(eligibility)` accedía a `eligibility.reason` sin verificar que `eligibility` existiera
- Si el API fallaba o devolvía algo inesperado, crasheaba

**3. Solución implementada**

**Fix 1 - Estructura de respuesta (commit `40834b0`):**
```javascript
// Antes (incorrecto)
this.canRequest = eligibilityRes.data?.canRequest || false;
this.render(eligibilityRes.data);

// Después (correcto)
this.canRequest = eligibilityRes?.canRequest || false;
this.render(eligibilityRes);
```

**Fix 2 - Validación defensiva (commit `66636c5`):**
```javascript
renderEligibilityStatus(eligibility) {
    // Manejar caso de eligibility undefined o null
    if (!eligibility) {
        return `<div class="alert alert-warning">
            <strong>No disponible:</strong> No se pudo verificar la elegibilidad.
        </div>`;
    }
    // ... resto del código
}
```

#### Archivos modificados:
- `admin/js/consultancy.js` - Fix estructura respuesta + validación defensiva

#### Commits:
- `40834b0` - fix: Corregir estructura de respuesta en módulo consultoría
- `66636c5` - fix: Manejar eligibility undefined en renderEligibilityStatus

#### 📝 Lección aprendida
- Los endpoints del backend no son consistentes: algunos devuelven `{ success, data: {...} }` y otros devuelven los datos directamente en el objeto raíz
- Siempre añadir validaciones defensivas en el frontend para manejar respuestas inesperadas

---

### Sesión 7: 23-ene-2026 - Optimización SEO y Google Search Console

#### 📊 Análisis de Search Console
- **9 páginas indexadas**, **30 sin indexar**
- Revisión de motivos de no indexación

#### ✅ Problemas Resueltos

**1. Errores 404 corregidos:**

| URL | Problema | Solución |
|-----|----------|----------|
| `/privacidad.html` | No existía | Creada redirección a `politica-privacidad.html` |
| `/terminos.html` | No existía | Creada página completa de Términos y Condiciones |
| `/api/auth/forgot-password` | URL incorrecta | Bug corregido en `forgot-password.html` |

**2. Bugs de funcionalidad encontrados gracias a Search Console:**

| Página | Bug | Causa |
|--------|-----|-------|
| `forgot-password.html` | Recuperar contraseña no funcionaba | URL relativa `/api/...` apuntaba a frontend en vez de backend |
| `index.html` | Formulario contacto no funcionaba | URL antigua de Render (`stickywork-github-io.onrender.com`) |

**3. Sitemap actualizado:**
- Fechas actualizadas a 2026-01-23
- Añadidas páginas: `demo.html`, `casos-exito.html`, `terminos.html`, `politica-privacidad.html`
- Eliminadas demos (tienen `noindex` intencional - solo para mostrar a clientes)

**4. Páginas con redirección (correcto, no hacer nada):**
- `http://www.stickywork.com/` → `https://stickywork.com/`
- `http://stickywork.com/` → `https://stickywork.com/`
- `https://www.stickywork.com/` → `https://stickywork.com/`
- `https://www.stickywork.com/index.html` → `https://stickywork.com/`

**5. Páginas con noindex intencional (correcto):**
- `super-admin-login.html`, `super-admin.html`, `404.html`
- Todas las demos (`demos/*.html`) - solo para mostrar a clientes

#### Archivos creados:
- `terminos.html` - Página completa de Términos y Condiciones para SaaS
- `privacidad.html` - Redirección a politica-privacidad.html

#### Archivos modificados:
- `forgot-password.html` - Añadido API_URL correcto
- `index.html` - Corregida URL del API (de Render a api.stickywork.com)
- `sitemap.xml` - Actualizado fechas, añadidas páginas, quitadas demos

#### Commits:
- `b220e8a` - feat: Añadir página Términos y Condiciones + mejorar SEO
- `6a17b67` - fix: Corregir URL de API en forgot-password.html
- `13d8b7e` - fix: Corregir URL de API en formulario de contacto (index.html)
- `6cfd104` - chore: Quitar demos del sitemap (tienen noindex intencional)

#### 📝 Lecciones aprendidas
- Google Search Console ayuda a encontrar bugs de funcionalidad, no solo problemas de SEO
- Las URLs relativas (`/api/...`) en páginas estáticas de GitHub Pages apuntan al frontend, no al backend
- Mantener consistencia entre `noindex` y `sitemap.xml` - no incluir páginas con noindex en el sitemap

#### 🔧 Acciones pendientes en Search Console
1. Solicitar indexación de `/privacidad.html` y `/terminos.html`
2. Las demás URLs incorrectas (api.stickywork.com/demos/*) desaparecerán solas

---

### Sesión 8: 26-ene-2026 - Fix Premium Access + Auditoría de Emails

#### ✅ Completado

**1. Fix: Clientes Premium no podían acceder a Consultoría**
- **Síntoma:** Usuario "La Famiglia" con plan Premium veía mensaje "no eres premium"
- **Diagnóstico:** La función `isPremiumBusiness()` solo buscaba en tabla `subscriptions` (vacía para clientes legacy)
- **Causa:** El plan estaba en `businesses.plan = 'premium'` pero la función no verificaba esta tabla

**Solución implementada en `backend/routes/consultancy.js`:**
```javascript
async function isPremiumBusiness(businessId) {
    // 1. Primero verificar tabla subscriptions (Stripe)
    const subscription = await db.query(`
        SELECT plan_name, status FROM subscriptions
        WHERE business_id = ? AND status IN ('active', 'trialing')
        ORDER BY created_at DESC LIMIT 1
    `, [businessId]);

    if (subscription?.length > 0) {
        return subscription[0].plan_name === 'premium';
    }

    // 2. Fallback: verificar tabla businesses (legacy)
    const business = await db.query(`
        SELECT plan, subscription_status FROM businesses WHERE id = ?
    `, [businessId]);

    if (!business?.length) return false;

    const validStatus = ['active', 'trialing', 'trial'];
    return business[0].plan === 'premium' &&
           validStatus.includes(business[0].subscription_status);
}
```

**2. Auditoría de Emails de Suscripción - ¡Ya implementados!**

Al revisar los archivos `stripe.js` y `email-service.js`, se descubrió que **todos los emails de suscripción ya estaban implementados** desde la Sesión 5:

| Email | Handler | Cuándo se envía |
|-------|---------|-----------------|
| **Bienvenida** | `handleCheckoutComplete()` | Al completar checkout de Stripe |
| **Fin de trial** | `handleTrialEnding()` | 3 días antes (evento `customer.subscription.trial_will_end`) |
| **Pago fallido** | `startGracePeriod()` | Al fallar un cobro (evento `invoice.payment_failed`) |
| **Cancelación** | `handleSubscriptionCanceled()` | Al cancelar suscripción |

**Templates en `email-service.js`:**
- `subscriptionWelcome` - Bienvenida con info del plan
- `trialEnding` - Recordatorio con días restantes
- `paymentFailed` - Aviso con período de gracia de 5 días
- `subscriptionCanceled` - Confirmación de cancelación

**Nota:** La tarea "Implementar emails de suscripción" marcada como pendiente en Sesión 5 ya estaba resuelta. Los emails se implementaron junto con los webhook handlers de Stripe.

#### 📝 Lecciones aprendidas
- Siempre hay que verificar múltiples fuentes de datos (en este caso `subscriptions` Y `businesses.plan`)
- Los clientes que no vinieron vía Stripe (legacy) tienen datos en `businesses.plan` en vez de `subscriptions`
- Es útil hacer auditorías periódicas del código - a veces hay features implementadas pero no documentadas

#### Commits:
- `120c811` - chore: Actualizar versión debug endpoint
- `654d27f` - feat: Implementar sistema de consultorías para clientes Premium

---

**Última actualización:** 26-ene-2026
**Próxima revisión:** 02-feb-2026 (inicio semana 05)

---

**🎯 Objetivo clave semana 04:** ~~Tener sistema multi-usuario funcionando~~ ✅ COMPLETADO + ✅ Sistema de pagos Stripe implementado Y PROBADO con éxito + ✅ Bug consultoría corregido + ✅ Optimización SEO y corrección de bugs encontrados via Search Console + ✅ Fix acceso Premium a Consultoría + ✅ Emails de suscripción verificados como funcionales.
