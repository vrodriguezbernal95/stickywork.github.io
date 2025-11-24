# Histórico del Proyecto StickyWork

## Sobre el Proyecto
**StickyWork** es un proyecto personal con objetivo de ser un negocio rentable.

### Modelo de Negocio
- **Tipo:** SaaS (Software as a Service)
- **Producto:** Sistema de reservas online con widget embebible
- **Propuesta de valor:** Los negocios físicos pueden integrar un sistema de reservas profesional en su web en menos de 5 minutos, sin conocimientos técnicos
- **Modelo de ingresos:** Freemium (14 días gratis, luego planes de pago)

### Clientes Objetivo
- Restaurantes
- Peluquerías y salones de belleza
- Clínicas y consultorios médicos
- Despachos de abogados
- Centros de nutrición
- Gimnasios y spas
- Cualquier negocio que gestione citas

### Características Principales
- Widget de reservas embebible (copiar/pegar código)
- 100% responsive (móvil, tablet, desktop)
- Panel de administración para gestionar reservas
- Notificaciones automáticas por email
- Totalmente personalizable (colores, campos)
- Código QR para acceso directo
- Cumplimiento RGPD (CMP implementado)

---

## Información Técnica
- **Dominio:** stickywork.com / www.stickywork.com
- **Registrador de dominio:** Porkbun
- **Hosting Backend:** Railway (ipghzvhi.up.railway.app)
- **Frontend estático:** GitHub Pages (vrodriguezbernal95.github.io)

## Configuración DNS (Porkbun)
| Tipo | Host | Destino |
|------|------|---------|
| ALIAS | stickywork.com | ipghzvhi.up.railway.app |
| CNAME | www.stickywork.com | ipghzvhi.up.railway.app |
| MX | stickywork.com | fwd1.porkbun.com (pri 10) |
| MX | stickywork.com | fwd2.porkbun.com (pri 20) |
| TXT | stickywork.com | v=spf1 include:_spf.porkbun.com ~all |

## Stack Tecnológico
- **Backend:** Node.js + Express
- **Base de datos:** MySQL
- **Autenticación:** JWT + Bcrypt
- **Frontend Admin:** HTML/CSS/JS vanilla

---

## Registro de Cambios

### 2025-01-24 - Sistema de Registro de Negocios
**Estado:** En desarrollo
**Objetivo:** Permitir que usuarios se registren autónomamente sin intervención manual

**Cambios realizados:**

1. **Base de datos ampliada** (`backend/setup-database.js`):
   - Nueva tabla `business_types`: Plantillas de tipos de negocio (peluquería, restaurante, clínica, etc.)
   - Nueva tabla `professionals`: Empleados/profesionales del negocio
   - Tabla `businesses` mejorada: añadido slug, subscription_status, trial_ends_at, booking_settings
   - Tabla `bookings` mejorada: añadido professional_id, num_people, zone, custom_fields
   - Tabla `services` mejorada: añadido capacity, category, color

2. **Tipos de negocio predefinidos** con configuración adaptada:
   - `salon`: Peluquería/Salón (modo: servicios + profesional)
   - `clinic`: Clínica/Consultorio (modo: servicios + profesional + notas)
   - `restaurant`: Restaurante/Bar (modo: mesas + nº personas + zona)
   - `nutrition`: Centro Nutrición (modo: servicios)
   - `gym`: Gimnasio (modo: clases grupales)
   - `spa`: Spa/Bienestar (modo: servicios)
   - `lawyer`: Despacho Abogados (modo: servicios)
   - `other`: Genérico

3. **Página de registro** (`registro.html`):
   - Formulario en 3 pasos: Tipo negocio → Datos negocio → Cuenta admin
   - Selector visual de tipo de negocio
   - Validación de contraseña (8+ chars, letras y números)
   - Trial de 14 días automático
   - Redirección automática al dashboard

4. **Endpoint de registro** (`backend/routes/auth.js`):
   - `POST /api/auth/register-business`: Crea negocio + usuario + servicios por defecto
   - `GET /api/auth/business-types`: Lista tipos de negocio disponibles
   - Genera slug único para cada negocio
   - Crea servicios predeterminados según tipo

5. **UI actualizada**:
   - Botón "Empezar Gratis" en navbar (index.html)
   - Botón "Empezar Prueba Gratis" en planes.html

**Completado posteriormente en esta sesión:**
- [x] Flujo de onboarding post-registro (`onboarding.html`)
- [x] Widget adaptativo según tipo de negocio (v2.0.0)
- [ ] Ejecutar migración de base de datos en producción

**Nuevos archivos creados:**
- `onboarding.html` - Guía al usuario para configurar servicios y horarios
- `widget/stickywork-widget.js` v2.0.0 - Widget adaptativo con soporte para:
  - `services`: Peluquerías, clínicas, spas (servicio + profesional)
  - `tables`: Restaurantes (nº personas + zona)
  - `classes`: Gimnasios (clases grupales)

**Nuevos endpoints:**
- `GET /api/widget/:businessId` - Configuración pública del widget
- `POST /api/business/:businessId/complete-onboarding` - Marcar onboarding completado
- `PUT /api/business/:businessId/settings` - Actualizar configuración
- `GET /api/professionals/:businessId` - Listar profesionales
- `POST /api/professionals` - Crear profesional

---

### 2025-01-24 - Configuración dominio www
**Estado:** Completado ✓
**Problema:** El dominio https://stickywork.com funciona pero https://www.stickywork.com no estaba configurado.
**Solución:**
1. Añadir www.stickywork.com como Custom Domain en Railway
2. Actualizar CNAME en Porkbun de zsgsmffl.up.railway.app → ipghzvhi.up.railway.app
3. Ambos dominios ahora funcionan correctamente

---

### Commits Recientes (al iniciar esta sesión)
- `369a6fa` - feat: Implementar CMP (Consent Management Platform) para cumplimiento RGPD
- `2a158c8` - fix: Mejorar ajuste responsive del código QR
- `e3ad3d8` - feat: Optimizar sección QR para móviles y actualizar URL
- `04640ba` - feat: Añadir configuración para deploy en Railway
- `8481e85` - feat: Añadir modo Código QR como tercera opción de integración

---

## Configuración Importante

### Variables de Entorno Producción
- `NODE_ENV=production`
- `JWT_EXPIRES_IN=24h`
- `APP_URL=https://stickywork-api.onrender.com`
- `FRONTEND_URL=https://vrodriguezbernal95.github.io`

### Credenciales Demo (desarrollo)
- Email: admin@demo.com
- Password: admin123

---

## Notas y Pendientes

### Sistema de Registro (COMPLETADO 2025-01-24)
- [x] Configurar registro www en Porkbun
- [x] Aumentar requisitos de contraseña a mínimo 8 caracteres
- [x] Crear página de registro con tipos de negocio
- [x] Crear endpoint de registro completo
- [x] Flujo de onboarding post-registro
- [x] Widget adaptativo según tipo de negocio
- [ ] **PENDIENTE:** Ejecutar setup-database.js en producción para crear nuevas tablas

### Seguridad (pendiente)
- [ ] Implementar rate limiting en login
- [ ] Considerar 2FA para admins

### Monetización (pendiente)
- [ ] Integrar Stripe para pagos
- [ ] Sistema de gestión de suscripciones

---

## Cómo usar este archivo
Este archivo sirve como memoria del proyecto entre sesiones de Claude Code.
Al iniciar una nueva sesión, pide a Claude que lea este archivo para tener contexto.
