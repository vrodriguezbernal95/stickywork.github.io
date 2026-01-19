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

**3. Sistema Multi-Usuario** (2-3 sesiones)
- [ ] Modificar tabla `admin_users` para permitir múltiples usuarios por negocio
- [ ] Sistema de roles: Owner, Admin, Staff
- [ ] Endpoints de gestión de equipo (invitar, listar, eliminar)
- [ ] UI en panel admin: Sección "Equipo"
- [ ] Validación de límite de usuarios según plan
- [ ] Sistema de invitaciones por email

**Sin esto, no se puede vender plan PREMIUM** (10 usuarios)

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
- [ ] Validación de límite de usuarios (requiere sistema multi-usuario)

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

## 📚 Referencias

- **Anterior:** [HISTORICO_SEMANA_03_2026.md](./HISTORICO_SEMANA_03_2026.md)
- **README:** [README_CLAUDE.md](./README_CLAUDE.md)
- **Workflow:** [WORKFLOW_DESARROLLO.md](./WORKFLOW_DESARROLLO.md)

---

**Última actualización:** 16-ene-2026
**Próxima revisión:** 26-ene-2026 (fin de semana 04)

---

**🎯 Objetivo clave semana 04:** Tener sistema multi-usuario funcionando para poder vender plan PREMIUM sin bloqueantes técnicos.
