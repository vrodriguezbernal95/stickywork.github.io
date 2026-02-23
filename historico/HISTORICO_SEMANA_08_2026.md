# Histórico de Desarrollo - Semana 08/2026

**Período:** 16-22 de febrero de 2026
**Rama de trabajo:** `master` (producción)

---

## Objetivo de la Semana

**Programa de Fidelización para negocios**

Implementación de un sistema de tarjeta de sellos digital que permite a los propietarios premiar la recurrencia de sus clientes, accesible desde el dashboard y mediante QR para los clientes.

---

## Sesión 1: 20-feb-2026 - Programa de Fidelización

### Completado

**1. Tab "Promociones" en sección Clientes del dashboard**
- Nueva 4ª pestaña `🎁 Promociones` junto a Clientes / Estadísticas / Recordatorios
- **Sección Configuración:**
  - Toggle activar/desactivar el programa
  - Número de reservas necesarias para el premio
  - Descripción del premio (texto libre: "Café gratis", "10% descuento", etc.)
  - Fecha de inicio y fin del periodo que cuenta (permite campañas temporales)
  - Botón "Guardar configuración"
- **Sección QR:**
  - Visible solo cuando el programa está activo
  - QR generado via quickchart.io apuntando a `stickywork.com/fidelidad.html?business=ID`
  - Botón "Descargar QR" para imprimir o poner en el local
- **Sección Vales pendientes:**
  - Tabla con clientes que han ganado su premio y esperan canjearlo
  - Columnas: Cliente, Email, Código (`SW-XXXX-XXXX`), Fecha obtenido, Acción
  - Botón "✅ Entregar premio" con modal de confirmación → marca como canjeado → reinicia ciclo
  - Desplegable con historial de vales ya canjeados

**2. Página pública `fidelidad.html`**
- El cliente escanea el QR del negocio y accede a la página
- Introduce su email y/o teléfono
- **Estado progreso:** tarjeta de sellos visual (círculos rellenos/vacíos), texto "Te faltan N visitas para tu premio", fechas de validez del programa
- **Estado vale ganado:** tarjeta verde con código único `SW-XXXX-XXXX`, descripción del premio, instrucción de mostrarlo en el negocio
- Botón "📥 Descargar imagen del vale" (html2canvas) para guardarlo en el móvil
- El mismo código persiste hasta que el negocio lo canjea

**3. Backend — 7 nuevos endpoints en `routes.js`**

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `POST /api/debug/run-loyalty-migration` | Bearer token | Crea tabla y columna en BD |
| `GET /api/loyalty/:id/config` | Privado | Leer configuración del programa |
| `PATCH /api/loyalty/:id/config` | Privado | Guardar configuración |
| `GET /api/loyalty/:id/vouchers` | Privado | Lista de vales activos y canjeados |
| `POST /api/loyalty/:id/redeem/:code` | Privado | Marcar vale como entregado |
| `GET /api/loyalty/:id/public` | Público | Info del programa para la página del cliente |
| `POST /api/loyalty/:id/check` | Público | El cliente consulta su progreso |

**4. Lógica del ciclo de fidelización**
- Se cuentan reservas con `status = 'completed'` dentro del rango de fechas configurado
- Si el cliente tiene un vale activo → contador congelado, siempre muestra el mismo código
- Al canjear: reinicia desde la fecha del canje (no acumulación)
- Código generado: `SW-XXXX-XXXX` con `crypto.randomBytes(2).toString('hex').toUpperCase()`

**5. Migración de base de datos**
- Nueva columna `loyalty_config` (JSON) en tabla `businesses`
- Nueva tabla `loyalty_vouchers` (id, business_id, customer_email, customer_phone, customer_name, code UNIQUE, status, earned_at, redeemed_at)
- Ejecutar una vez: `POST /api/debug/run-loyalty-migration` con `Authorization: Bearer super-admin-test-token`

### Archivos modificados/creados:
- `admin/js/clients.js` — 4º tab Promociones + métodos loadLoyaltyData, renderPromotionsContent, saveLoyaltyConfig, redeemVoucher + estilos CSS
- `backend/routes.js` — 7 nuevos endpoints de fidelización
- `server.js` — ruta `/fidelidad`
- `fidelidad.html` — **Nuevo** página pública del cliente

### Commits:
- `1b59c0c` — feat: Programa de fidelización - tab Promociones en Clientes

---

## Decisiones de diseño tomadas

| Decisión | Motivo |
|----------|--------|
| Contar todas las reservas (no por servicio) | Simplicidad — lo que importa es la recurrencia |
| El negocio aplica el descuento manualmente | Sin automatización de descuentos, más flexible |
| Código persistente hasta canjeo | El cliente puede enseñarlo cuando quiera sin volver a consultar |
| Fechas de inicio/fin configurables | Permite campañas temporales (ej: "solo en abril y mayo") |
| Sin acumulación de premios | Hasta no canjear el actual no se genera el siguiente |

---

---

## Sesión 2: 20-feb-2026 - Recordatorios automáticos de citas

### Completado

**Contexto:** El sistema de recordatorios existía al 60% — template de email listo, función de envío lista, pero sin automatismo real, sin guardar la preferencia en BD y sin protección contra duplicados.

**1. Nuevo job `backend/jobs/enviar-recordatorios.js`**
- Busca reservas de mañana con `status IN ('confirmed','pending')` y `reminder_sent = FALSE`
- Filtra por `booking_settings.reminders_enabled` del negocio (si no está configurado → envía por defecto, backwards compatible)
- Envía email via `emailService.sendBookingReminder()` ya existente
- Marca `reminder_sent = TRUE` tras cada envío para evitar duplicados
- Fix del bug UTC en cálculo de fecha (construcción local en vez de `toISOString()`)

**2. Cron job en `server.js`**
- Se ejecuta cada día a las 10:00 AM (hora servidor Railway, UTC)
- Llama a `enviarRecordatoriosCitas(db, emailService)`
- Sigue el mismo patrón que el job de feedback ya existente

**3. Checkbox "Recordatorios Automáticos" en Settings ahora funciona**
- Al cargar la pestaña Notificaciones, lee `booking_settings.reminders_enabled` de la BD
- Al guardar, persiste la preferencia en `booking_settings` via `PUT /api/business/:id/settings`
- Si el negocio no tenía configuración previa → aparece marcado por defecto

### Archivos modificados/creados:
- `backend/jobs/enviar-recordatorios.js` — **Nuevo** job de recordatorios
- `server.js` — import + cron job diario 10:00 AM
- `admin/js/settings.js` — checkbox guarda/carga preferencia real

### Commits:
- `2a7db37` — feat: Completar sistema de recordatorios automáticos de citas

---

---

## Sesión 3: 23-feb-2026 - Recordatorios mejorados (2 sub-páginas + mensajes configurables)

### Completado

**Reestructuración del tab "Recordatorios" en `clients.js`:**

- El tab ahora tiene **2 sub-páginas** con navegación por pestañas:
  1. **🔔 Recordatorio 24h** — lista de citas de mañana + botón WhatsApp individual
  2. **🔄 40 días sin venir** — lista de clientes inactivos + botón WhatsApp (igual que antes)

- **Mensaje predefinido editable** en cada sub-página (textarea + botón "Guardar mensaje")
  - Se guarda en `booking_settings.reminder_msg_24h` y `booking_settings.reminder_msg_40dias`
  - Mensajes por defecto incluidos si el negocio no tiene configurado ninguno

- **Variables disponibles en el mensaje 24h:** `{nombre}`, `{nombre_negocio}`, `{fecha}`, `{hora}`, `{servicio}`
- **Variables disponibles en el mensaje 40d:** `{nombre}`, `{nombre_negocio}`

- **Nueva función `sendReminder24hWhatsApp(bookingId)`** — abre WhatsApp con el mensaje 24h personalizado para la cita concreta
- **`sendReminderWhatsApp(clientId)`** ahora usa el mensaje configurable en vez del texto hardcodeado

- Las reservas de mañana se cargan en `load()` en paralelo con clientes y datos del negocio (sin latencia extra)
- Si se accede al tab sin haber cargado antes, hay fallback en `switchTab('recordatorios')` para cargarlas

### Archivos modificados:
- `admin/js/clients.js` — nuevas variables de estado, `loadTomorrowBookings()`, `getReminderSettings()`, `saveReminderMessage()`, `switchReminderSubTab()`, `render24hReminders()`, `render40DaysReminders()`, y estilos CSS incrustados

### Commits pendientes de hacer

---

## Próximas tareas pendientes

1. **Eliminar endpoint** `debug/reset-password` — temporal, sigue en routes.js
2. Valorar si añadir **notificación automática** al cliente cuando gana un premio (email/WhatsApp)

---

## Stack Tecnológico (sin cambios)

- **Backend:** Node.js + Express + MySQL (Railway)
- **Frontend:** Vanilla JS
- **Hosting:** Railway (API) + GitHub Pages (Frontend)

---

**Última actualización:** 23-feb-2026
