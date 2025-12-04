# Histórico Resumen - Proyecto StickyWork

> Este archivo contiene un resumen ejecutivo del proyecto. Para detalles completos, consultar los archivos HISTORICO_SEMANA_XX_YYYY.md

---

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
- **Hosting Backend:** Railway
  - **Servicios en Railway:**
    - `stickywork-api` (backend Node.js/Express)
    - `stickywork-db` (MySQL)
  - **URLs públicas del backend:**
    - https://stickywork.com (producción principal)
    - https://www.stickywork.com
    - https://stickywork-api-production-a2d8.up.railway.app (Railway generada)
  - **URL privada:** stickywork-api.railway.internal
- **Frontend estático:** GitHub Pages (vrodriguezbernal95.github.io)
- **Base de datos MySQL:** Railway (switchback.proxy.rlwy.net:26447)

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


---

## Resumen de Cambios por Semana

### Semana 04 (2025)
**Período:** 2025-01-24 - 2025-01-26

- **2025-01-24 - Sistema de Registro de Negocios**
     - Nueva tabla `business_types`: Plantillas de tipos de negocio (peluquería, restaurante, clínica, etc.)
     - Nueva tabla `professionals`: Empleados/profesionales del negocio
     - Tabla `businesses` mejorada: añadido slug, subscription_status, trial_ends_at, booking_settings
- **2025-01-24 - Configuración dominio www**
  ---
- **2025-01-24 - Deploy a Producción y Fix SIGTERM**
  - Servidor desplegado en Railway obtenía error SIGTERM (timeout)
  - No se conectaba a la base de datos MySQL de Railway
  - Variables de entorno no estaban configuradas correctamente
- **2025-01-24 (tarde) - Sistema de Registro Funcionando 100%**
     - Causa: Servidor iniciado antes de ejecutar setup de BD
     - Solución: Ejecutar `npm run setup` y reiniciar servidor
     - Causa: Script de ALTER TABLE no incluía todas las columnas nuevas
- **2025-01-26 - Sistema de Email con Brevo**
  - No había sistema de emails configurado
  - Necesitaba enviar confirmaciones de reserva automáticas
  - Necesitaba recibir emails en direcciones corporativas (@stickywork.com)
- **2025-01-26 (tarde) - Mejoras UX: Dark Mode Admin + Emails en Footer + Fix UTF-8**
  - Panel de administración con diseño light mode básico
  - Caracteres especiales (ñ, acentos) mostrándose como símbolos raros (�)
  - Falta de información de contacto visible en la web

📄 *Detalles completos en: HISTORICO_SEMANA_04_2025.md*

### Semana 05 (2025)
**Período:** 2025-01-28 - 2025-01-28

- **2025-01-28 - Entorno de Demos Completo Desplegado en Producción**
  - Necesitábamos mostrar cómo StickyWork se adapta a diferentes tipos de negocios
  - Los demos deben ser accesibles pero no indexables por buscadores (noindex)
  - Cada demo debe tener un negocio funcional en la base de datos con acceso al dashboard
- **2025-01-28 (continuación) - Fix Completo del Entorno de Demos y Sistema de Login**
     - Peluquería mostraba servicios de nutrición
     - Psicólogo mostraba servicios de manicura/spa
     - Otros demos también mezclaban servicios
- **2025-01-28 (continuación 2) - Mejoras Masivas al Dashboard Admin**
  - Dashboard básico con estadísticas simples
  - No había forma de crear reservas manualmente (para clientes que llaman o vienen presencialmente)
  - Falta de visión clara de la agenda del día
- **2025-01-28 (continuación 3) - Descubrimiento: Sistema de Mensajes y Necesidad de Arquitectura Multi-tenant**
  - **Archivo:** `admin/js/messages.js` (ya implementado)
  - **Funcionalidad:**
    - Vista de mensajes con estadísticas (no leídos, leídos, respondidos, total)

📄 *Detalles completos en: HISTORICO_SEMANA_05_2025.md*

### Semana 48 (2025)
**Período:** 2025-11-28 - 2025-11-30

- **2025-11-28 - Fix Completo Super Admin Dashboard en Producción**
  - **Error:** `TypeError: Cannot read properties of undefined (reading 'total')`
  - **Causa:** Falta de safe navigation en acceso a resultados de queries
  - **Solución:** Cambiar `result[0]?.total` a `result?.[0]?.total`
- **2025-11-29 - Sistema de Mensajes de Soporte para Clientes**
  - Reportar bugs
  - Hacer preguntas
  - Enviar sugerencias
- **2025-11-29 (continuación) - Completar Sistema de Mensajes de Soporte**
  - **Archivo modificado:** `admin/js/super-messages.js`
  - **Función implementada:** `viewSupportMessage(messageId)`
    - Modal completo con detalles del mensaje
- **2025-11-30 (continuación) - Fix Dark Mode y Mejoras Responsive Dashboards**
  ---
  - El código intentaba acceder a `.theme-icon` span dentro del botón
  - Pero el elemento no existía en algunas páginas

📄 *Detalles completos en: HISTORICO_SEMANA_48_2025.md*

### Semana 49 (2025)
**Período:** 2025-12-01 - 2025-12-04

- **2025-12-01 - Implementación Completa de Seguridad: Password Recovery, Refresh Tokens y 2FA**
  - Sistema de recuperación de contraseña con emails automáticos
  - Refresh tokens (access token 15min, refresh token 7 días)
  - Autenticación de dos factores (2FA) con TOTP y códigos de backup
  - 6 nuevos endpoints de seguridad implementados

- **2025-12-02 - Fix Critical CSP + Mejoras UX + Reorganización de Histórico**
  - Fix crítico: Botones de reservas no funcionaban (CSP bloqueaba onclick)
  - Mejora UX: Eliminado efecto de burbuja en hover de navegación
  - Reorganización del histórico por semanas (reducción del 91% en tokens)

- **2025-12-04 - Fix Críticos en Widget QR y Sistema de Reservas**
  - Fix: QR code no visible en dashboard (apiUrl undefined)
  - Fix: CSP bloqueando carga de QRCode.js desde CDN
  - Fix crítico: Error 500 al crear reservas (service_id con nombre en lugar de ID)
  - 3 bugs de producción resueltos

📄 *Detalles completos en: HISTORICO_SEMANA_49_2025.md*

