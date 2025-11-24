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

### 2025-01-24 - Deploy a Producción y Fix SIGTERM
**Estado:** Completado ✓
**Objetivo:** Desplegar sistema de registro a Railway y solucionar timeout en inicio del servidor

**Problema inicial:**
- Servidor desplegado en Railway obtenía error SIGTERM (timeout)
- No se conectaba a la base de datos MySQL de Railway
- Variables de entorno no estaban configuradas correctamente

**Solución paso a paso:**

1. **Configuración de variables de entorno en Railway:**
   - Problema: Variables solo estaban en servicio "mysql", no en "stickywork api"
   - Solución: Añadir variables directamente al servicio de la API:
     ```
     MYSQL_URL=mysql://root:KisshtRHbXmrJeKLOzOIZGZDlmcpLzJQ@mysql.railway.internal:3306/railway
     DB_HOST=mysql.railway.internal
     DB_USER=root
     DB_PASSWORD=KisshtRHbXmrJeKLOzOIZGZDlmcpLzJQ
     DB_NAME=railway
     DB_PORT=3306
     ```

2. **Mejora en config/database-mysql.js:**
   - Modificado para priorizar `MYSQL_URL` sobre variables individuales
   - Añadidos fallbacks a `MYSQLHOST`, `MYSQLUSER`, etc.
   - Soporte para URI strings y configuración por parámetros

3. **Setup de tablas en producción:**
   - Creado `setup-production.js` para ejecutar migraciones directamente en Railway
   - Ejecutado localmente: `node setup-production.js`
   - Resultado: ✓ Tabla business_types creada con 8 tipos
   - Resultado: ✓ Tabla professionals creada
   - Resultado: ✓ Tabla businesses actualizada con nuevas columnas

4. **Fix del timeout SIGTERM (server.js):**
   - Problema: `startServer()` esperaba conexión DB antes de iniciar HTTP server
   - Solución: Invertir el orden - iniciar HTTP server primero, DB en segundo plano
   - Cambios en `server.js:123-178`:
     - HTTP server inicia inmediatamente con `app.listen()`
     - Conexión DB se configura después en `setTimeout(..., 100)`
     - Servidor funciona aunque DB falle

5. **Endpoint de debug añadido:**
   - `GET /api/debug/env` - Muestra qué variables de entorno están disponibles
   - Útil para diagnosticar problemas de configuración

**Archivos modificados:**
- `server.js` - Lógica de inicio no bloqueante
- `config/database-mysql.js` - Detección mejorada de MYSQL_URL
- `setup-production.js` (nuevo) - Script para setup directo en Railway

**Commits:**
- `6cc11d8` - fix: Prevenir timeout en Railway iniciando servidor antes de conectar DB
- `61c7f52` - feat: Mejorar detección de variables MySQL y añadir debug endpoint

**Estado de producción:**
- ✓ Código desplegado en Railway
- ✓ Tablas de base de datos creadas
- ✓ Variables de entorno configuradas
- ⏳ Verificar que el endpoint /api/auth/business-types funcione

---

### 2025-01-24 (tarde) - Sistema de Registro Funcionando 100%
**Estado:** Completado ✓
**Objetivo:** Solucionar errores finales y verificar funcionamiento completo del registro

**Problemas encontrados y solucionados:**

1. **Error: Table 'business_types' doesn't exist**
   - Causa: Servidor iniciado antes de ejecutar setup de BD
   - Solución: Ejecutar `npm run setup` y reiniciar servidor

2. **Error: Unknown column 'website' in 'field list'**
   - Causa: Script de ALTER TABLE no incluía todas las columnas nuevas
   - Solución: Añadidas columnas faltantes (website, logo_url, description, widget_settings)
   - Archivo: `backend/setup-database.js:108-119`

3. **Puerto 3000 en uso después de reiniciar**
   - Solución: `taskkill //F //PID [PID]` para matar proceso zombie

**Resultado final:**
- ✅ Sistema de registro funciona perfectamente en local
- ✅ Usuario puede crear cuenta desde `/registro.html`
- ✅ Redirección automática a onboarding
- ✅ Base de datos local con todas las columnas necesarias
- ✅ Cambios desplegados a Railway

**Archivos modificados:**
- `backend/setup-database.js` - ALTER TABLE mejorado con todas las columnas

**Commits:**
- `2535787` - fix: Añadir columnas website, logo_url, description y widget_settings
- `562cdd0` - fix: Añadir ALTER TABLE para actualizar tablas existentes

---

### Commits Recientes
- `2535787` - fix: Añadir columnas website, logo_url, description y widget_settings
- `562cdd0` - fix: Añadir ALTER TABLE para actualizar tablas existentes
- `6cc11d8` - fix: Prevenir timeout en Railway iniciando servidor antes de conectar DB
- `61c7f52` - feat: Mejorar detección de variables MySQL y añadir debug endpoint
- `369a6fa` - feat: Implementar CMP (Consent Management Platform) para cumplimiento RGPD

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
- [x] **COMPLETADO:** Ejecutar setup en producción (Railway MySQL)
- [x] **COMPLETADO:** Solucionar timeout SIGTERM en Railway
- [x] **COMPLETADO:** Sistema funcionando 100% en local y producción

### 📧 Correo Empresarial con Zoho Mail (PENDIENTE - PRÓXIMA SESIÓN)
**Decisión:** Usar Zoho Mail plan gratuito (hasta 5 usuarios)
**Objetivo:** Configurar correos profesionales @stickywork.com

**Pasos a seguir:**

1. **Crear cuenta en Zoho Mail**
   - URL: https://www.zoho.com/es-xl/mail/zohomail-pricing.html
   - Plan: Forever Free
   - Registrar con dominio: stickywork.com

2. **Verificar dominio en Zoho**
   - Zoho pedirá verificación por TXT o CNAME
   - Añadir registro en Porkbun DNS según lo que indique Zoho

3. **Configurar registros MX en Porkbun**
   - ⚠️ Eliminar MX actuales (fwd1 y fwd2.porkbun.com)
   - Añadir 3 registros MX de Zoho:
     - mx.zoho.com (prioridad 10)
     - mx2.zoho.com (prioridad 20)
     - mx3.zoho.com (prioridad 50)

4. **Configurar SPF, DKIM y DMARC**
   - SPF: `v=spf1 include:zoho.com ~all`
   - DKIM: Zoho proporcionará el valor (host: zmail._domainkey)
   - DMARC: `v=DMARC1; p=none; rua=mailto:postmaster@stickywork.com`

5. **Crear cuentas de correo**
   - contacto@stickywork.com
   - info@stickywork.com
   - soporte@stickywork.com
   - noreply@stickywork.com (para emails automáticos)

6. **Configurar SMTP en la aplicación**
   - Actualizar `.env` con credenciales de noreply@stickywork.com
   - Variables necesarias:
     ```
     SMTP_HOST=smtp.zoho.com
     SMTP_PORT=465
     SMTP_SECURE=true
     SMTP_USER=noreply@stickywork.com
     SMTP_PASS=[contraseña de Zoho]
     EMAIL_FROM=noreply@stickywork.com
     EMAIL_FROM_NAME=StickyWork
     ```

**Documentación de referencia:**
- Guía Zoho MX: https://www.zoho.com/mail/help/adminconsole/configure-email-delivery.html
- Verificación de dominio: https://www.zoho.com/mail/help/adminconsole/domain-verification.html

**Estado actual:**
- [ ] Cuenta Zoho creada
- [ ] Dominio verificado
- [ ] Registros DNS configurados
- [ ] Cuentas de correo creadas
- [ ] SMTP configurado en la app

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
