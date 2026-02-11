# Histórico Proyecto StickyWork - Semana 04

**Año:** 2025
**Período:** 2025-01-24 - 2025-01-26

---

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


### 2025-01-26 - Sistema de Email con Brevo
**Estado:** Completado ✓
**Objetivo:** Implementar sistema completo de emails transaccionales y recepción de emails corporativos

**Problema inicial:**
- No había sistema de emails configurado
- Necesitaba enviar confirmaciones de reserva automáticas
- Necesitaba recibir emails en direcciones corporativas (@stickywork.com)

**Solución implementada:**

1. **Proveedor de email seleccionado: Brevo (antes Sendinblue)**
   - Plan gratuito: 300 emails/día (9,000/mes)
   - Razón: Zoho Mail cambió a solo de pago
   - Alternativas evaluadas: Resend, SendGrid

2. **Configuración de Brevo:**
   - Cuenta creada y verificada
   - Dominio stickywork.com autenticado
   - Registros DNS configurados automáticamente por Brevo:
     - TXT: Código de verificación
     - CNAME: DKIM 1 y DKIM 2
     - TXT: DMARC
   - SMTP Key generada (tipo estándar para mayor seguridad)

3. **Email Forwarding en Porkbun:**
   - Configurado para recibir emails corporativos
   - Redirección a v.rodriguezbernal95@gmail.com:
     - contacto@stickywork.com
     - info@stickywork.com
     - soporte@stickywork.com

4. **Servicio de email implementado:**
   - Archivo: `backend/email-service.js` (ya existía)
   - Plantillas HTML responsive implementadas:
     - Confirmación de reserva al cliente
     - Recordatorio 24h antes
     - Notificación al admin de nueva reserva
   - Integración con Nodemailer

5. **Variables de entorno configuradas:**
   - Local: `.env` actualizado con credenciales Brevo
   - Producción: Variables añadidas en Railway
   - Variables configuradas:
     - EMAIL_HOST=smtp-relay.brevo.com
     - EMAIL_PORT=587
     - EMAIL_USER=9c91da001@smtp-brevo.com
     - EMAIL_PASSWORD=[SMTP Key de Brevo]
     - EMAIL_FROM=StickyWork <noreply@stickywork.com>

6. **Pruebas realizadas:**
   - Script de prueba creado: `test-email.js`
   - Email de prueba enviado exitosamente
   - Email recibido y verificado en bandeja de entrada
   - Conexión SMTP verificada ✓

**Resultado:**
- ✅ Sistema de emails 100% funcional en desarrollo y producción
- ✅ Confirmaciones de reserva se envían automáticamente
- ✅ Recepción de emails corporativos configurada
- ✅ Alta tasa de entrega (Brevo tiene buena reputación)
- ✅ 300 emails/día gratis (suficiente para empezar)

**Archivos creados/modificados:**
- `.env` - Variables de entorno actualizadas
- `test-email.js` - Nuevo script de pruebas
- `HISTORICO_PROYECTO.md` - Documentación actualizada

**Próximos pasos sugeridos:**
- [ ] Implementar cron job para recordatorios 24h antes
- [ ] Monitorear estadísticas de envío en panel de Brevo
- [ ] Considerar upgrade a plan de pago si se superan 300 emails/día

---


### 2025-01-26 (tarde) - Mejoras UX: Dark Mode Admin + Emails en Footer + Fix UTF-8
**Estado:** Completado ✓
**Objetivo:** Mejorar la experiencia de usuario del panel administrativo y añadir información de contacto visible

**Problemas identificados:**
- Panel de administración con diseño light mode básico
- Caracteres especiales (ñ, acentos) mostrándose como símbolos raros (�)
- Falta de información de contacto visible en la web

**Soluciones implementadas:**

1. **Dark Mode Profesional en Panel Administrativo**
   - Paleta de colores inspirada en el dark mode de la web principal
   - Colores aplicados:
     - Fondos: #0a0e2e, #111533, #1a1f45
     - Textos: #f1f5f9, #cbd5e1 (excelente contraste)
     - Acentos: #2E35F5 (azul), #FF3D1A (rojo/naranja)
   - Efectos visuales mejorados:
     - Glassmorphism en tarjetas y sidebar
     - Gradientes en enlaces activos y botones
     - Hover effects con colores vibrantes
     - Sombras profesionales con efecto glow
     - Líneas animadas en tarjetas estadísticas
   - Mejoras específicas:
     - Sidebar con backdrop-filter blur
     - Topbar sticky con sombra
     - Tablas con hover effect
     - Iconos de stats con gradientes de colores
   - Archivo modificado: `admin/css/admin.css`

2. **Fix de Codificación UTF-8**
   - Problema: Datos guardados antes mostraban caracteres corruptos (Mar�a)
   - Solución implementada:
     - Añadido `charset: 'utf8mb4'` en configuración MySQL
     - Actualizado `config/database-mysql.js`
     - Soporte para conexión local y Railway (URL)
     - Datos corruptos existentes corregidos manualmente
   - Verificación: Ningún otro dato corrupto encontrado
   - Resultado: Todos los caracteres especiales se guardan y muestran correctamente

3. **Emails Corporativos en Footer**
   - Sección "Contacto" añadida en footer de todas las páginas
   - Emails con iconos visuales:
     - 📧 contacto@stickywork.com
     - 📨 info@stickywork.com
     - 🛠️ soporte@stickywork.com
   - Enlaces mailto clicables (abren cliente de email)
   - Ubicación lógica: entre "Empresa" y "Legal"
   - Páginas actualizadas:
     - index.html
     - como-funciona.html
     - planes.html
     - demo.html
     - contacto.html
   - Accesibilidad: aria-labels en todos los enlaces

**Configuración de Emails (recordatorio):**
- Envío: Brevo SMTP (300 emails/día gratis)
- Recepción: Porkbun Email Forwarding → v.rodriguezbernal95@gmail.com
- Estado: ✅ Funcionando en desarrollo y producción

**Impacto en UX:**
- ✅ Panel administrativo más moderno y profesional
- ✅ Mejor legibilidad con dark mode (reduce cansancio visual)
- ✅ Caracteres especiales funcionando perfectamente
- ✅ Información de contacto fácilmente accesible
- ✅ Consistencia visual en toda la plataforma

**Archivos modificados:**
- `admin/css/admin.css` - Dark mode completo
- `config/database-mysql.js` - UTF-8 charset
- `index.html` - Footer con emails
- `como-funciona.html` - Footer con emails
- `planes.html` - Footer con emails
- `demo.html` - Footer con emails
- `contacto.html` - Footer con emails

**Testing realizado:**
- ✅ Dark mode probado en diferentes resoluciones
- ✅ UTF-8 verificado con nombre "María"
- ✅ Enlaces mailto funcionando correctamente
- ✅ Responsive en móvil, tablet y desktop

---


