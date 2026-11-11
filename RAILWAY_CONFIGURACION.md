# Configuración de Railway - StickyWork

## Resumen Ejecutivo

Railway es la plataforma de hosting en la nube donde está desplegada la aplicación StickyWork. Este documento explica cómo está configurado el proyecto, qué servicios tiene, y cómo funciona el sistema de deployment.

---

## Servicios en Railway

El proyecto StickyWork tiene **2 servicios principales**:

### 1. **stickywork-api** (Aplicación Node.js)
- **Tipo**: Servicio de aplicación web
- **Runtime**: Node.js
- **Puerto**: 3000
- **URL pública**: https://stickywork.com
- **Deployment**: Auto-deploy desde GitHub (branch `master`)
- **Comando de inicio**: `npm start` (ejecuta `node server.js`)

### 2. **MySQL** (Base de datos)
- **Tipo**: Base de datos MySQL
- **Versión**: MySQL 8.x
- **Región**: Southeast Asia (Singapore)
- **Base de datos**: `railway`

---

## Variables de Entorno (stickywork-api)

El servicio `stickywork-api` tiene las siguientes variables configuradas:

```env
# URLs y Entorno
APP_URL="https://stickywork-api.onrender.com"
FRONTEND_URL="https://vrodriguezbernal95.github.io"
NODE_ENV="production"
PORT="3000"

# Base de Datos MySQL
MYSQL_URL="${{MySQL.MYSQL_URL}}"
# Esta referencia especial ${{MySQL.MYSQL_URL}} apunta automáticamente
# a la URL interna del servicio MySQL de Railway

# JWT Secrets
JWT_SECRET="9f97f56438e0bec328342e39ef8d78b1df05261b1b5746379e8cd6b09aa5969d83eaba2a3e607791aec27d5b5874fa38404eefee29a7c181019185f5dab6d550"
JWT_REFRESH_SECRET="7b19c8f44c04d9645879e2dff892ce66a7f759b0dc87b9410ee965d748ca693b40a37b6c17331cef547b52e928a7a4f41045b50951abee048f99da0b67806aae"
JWT_EXPIRES_IN="24h"

# Email (Brevo)
EMAIL_HOST="smtp-relay.brevo.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="9c91da001@smtp-brevo.com"
EMAIL_PASSWORD="xsmtpsib-XXXXXXX...XXXXXXX" # (Configurada en Railway)
EMAIL_FROM="StickyWork <noreply@stickywork.com>"
```

### Variables Importantes del Servicio MySQL

Dentro del servicio **MySQL**, Railway genera automáticamente estas variables:

```env
# URL Interna (para conexiones desde otros servicios de Railway)
MYSQL_URL="mysql://root:<CONTRASEÑA>@mysql.railway.internal:3306/railway"

# URL Pública (para conexiones externas/development)
MYSQL_PUBLIC_URL="mysql://root:<CONTRASEÑA>@tramway.proxy.rlwy.net:49999/railway"
```

**Diferencia clave:**
- `MYSQL_URL` (interna): Solo accesible desde otros servicios de Railway
- `MYSQL_PUBLIC_URL` (pública): Accesible desde internet (para scripts locales, herramientas externas)

---

## Cómo Funciona el Deployment

### Flujo de Deployment Automático

```
1. Push a GitHub (branch master)
   ↓
2. Railway detecta el cambio (webhook)
   ↓
3. Railway clona el código
   ↓
4. Railway ejecuta: npm install
   ↓
5. Railway inicia: npm start (node server.js)
   ↓
6. Aplicación disponible en https://stickywork.com
```

### Tiempo de Deployment
- **Duración promedio**: 2-3 minutos
- **Logs disponibles**: En Railway > stickywork-api > Deployments > (último deployment) > Logs

---

## Conexión a la Base de Datos

### Desde el Servidor (Dentro de Railway)

El servidor usa la referencia `${{MySQL.MYSQL_URL}}` que Railway resuelve automáticamente a:
```
mysql://root:<CONTRASEÑA>@mysql.railway.internal:3306/railway
```

Esta es la conexión **interna** optimizada para servicios dentro de Railway.

### Desde Scripts Locales (Desarrollo)

Para conectarte desde tu máquina local (scripts de migración, testing, etc.), usa `MYSQL_PUBLIC_URL`:

```javascript
const MYSQL_URL = 'mysql://root:<CONTRASEÑA>@tramway.proxy.rlwy.net:49999/railway';
const connection = await mysql.createConnection(MYSQL_URL);
```

**⚠️ Importante:** Ambas URLs apuntan a la **misma base de datos**, solo cambia la ruta de acceso.

---

## Estructura de la Base de Datos

### Tablas Principales

#### bookings
Almacena las reservas de los clientes.

**Columnas clave relacionadas con feedback:**
- `feedback_sent` (BOOLEAN): Si se envió el email de solicitud de feedback
- `feedback_sent_at` (TIMESTAMP): Cuándo se envió
- `feedback_token` (VARCHAR): Token único para el formulario de feedback

#### service_feedback
Almacena las opiniones/feedback de los clientes.

**Columnas:**
- `id` (INT): ID único
- `booking_id` (INT): Referencia a la reserva
- `business_id` (INT): Referencia al negocio
- `customer_name` (VARCHAR): Nombre del cliente
- `customer_email` (VARCHAR): Email del cliente
- `rating` (INT): Calificación 1-5 estrellas
- `comment` (TEXT): Comentario opcional
- `questions` (JSON): Respuestas a preguntas específicas
- `feedback_token` (VARCHAR): Token de validación
- `created_at` (TIMESTAMP): Fecha de creación

---

## Cron Jobs Activos

### Job de Envío de Feedback
- **Frecuencia**: Cada hora (cron: `'0 * * * *'`)
- **Función**: Busca reservas completadas hace 24h y envía emails de solicitud de feedback
- **Archivo**: `backend/jobs/enviar-feedback.js`
- **Logs**: Los verás en Railway con el prefijo `⏰ [Cron]`

**Estado actual:** ⚠️ Los emails NO se están enviando debido a problemas de conexión con Brevo (`Connection timeout`). Esto está pendiente de arreglar.

---

## Logs y Debugging

### Cómo Ver Logs en Railway

1. Ve a Railway Dashboard
2. Clic en **stickywork-api**
3. Clic en **Deployments**
4. Clic en el deployment más reciente
5. Clic en **Logs** (o **View Logs**)

### Logs Importantes al Arrancar

Cuando el servidor arranca, verás estos logs clave:

```
🚀 SERVIDOR STICKYWORK INICIADO
📦 Conectando vía MYSQL_URL: mysql://root:<CONTRASEÑA>@mysql.railway.internal:3306/railway
📦 Configuración parseada: { host: 'mysql.railway.internal', port: 3306, database: 'railway' }
✓ Pool de conexiones MySQL creado
✓ Conexión a MySQL exitosa
⏰ Cron job de feedback configurado (cada hora)
```

Si ves errores aquí, algo está mal con la configuración.

---

## Problemas Comunes y Soluciones

### 1. "Cannot connect to database"
**Causa:** Variables de entorno mal configuradas o servicio MySQL caído.
**Solución:**
- Verifica que `MYSQL_URL="${{MySQL.MYSQL_URL}}"` esté correctamente configurado
- Verifica que el servicio MySQL esté "Running" (no "Crashed")

### 2. "Table does not exist"
**Causa:** Migraciones no ejecutadas en Railway.
**Solución:**
- Las tablas se deben crear manualmente ejecutando los scripts de migración
- Ejemplo: `node run-migration-011.js` (conectando a la URL pública)

### 3. "Deployment taking too long"
**Causa:** Instalación de node_modules lenta o problema de red.
**Solución:**
- Espera 5 minutos. Si no completa, cancela el deployment y vuelve a intentar
- Verifica los logs para ver dónde se atascó

### 4. "502 Bad Gateway"
**Causa:** Servidor no arrancó correctamente o crasheó.
**Solución:**
- Revisa los logs del deployment
- Busca errores de sintaxis o variables de entorno faltantes

---

## Checklist Pre-Deployment

Antes de hacer push a master, verifica:

- [ ] ¿El código funciona localmente?
- [ ] ¿Todas las variables de entorno necesarias están en Railway?
- [ ] ¿No hay console.logs sensibles (contraseñas, tokens)?
- [ ] ¿Se probaron los cambios en development?
- [ ] ¿Las migraciones de BD están aplicadas (si aplica)?

---

## Comandos Útiles para Railway

### Instalar Railway CLI (opcional)
```bash
npm install -g @railway/cli
railway login
railway link
```

### Ver logs en vivo
```bash
railway logs
```

### Ejecutar comandos en Railway
```bash
railway run npm run migration
```

---

## Accesos y URLs Importantes

- **App pública**: https://stickywork.com
- **Admin login**: https://stickywork.com/admin/login.html
- **Formulario feedback**: https://stickywork.com/feedback.html?token=XXX
- **API health**: https://stickywork.com/api/health
- **Railway Dashboard**: https://railway.app/project/[tu-proyecto-id]

---

## Respaldo y Seguridad

### Backups de MySQL
- Railway hace backups automáticos cada 24h
- Se pueden ver en: MySQL service > Backups
- Retención: Depende del plan de Railway

### Secrets y Tokens
- **NUNCA** commitear `.env` al repositorio
- Todas las variables sensibles van en Railway Dashboard
- JWT_SECRET y JWT_REFRESH_SECRET: Generados con `crypto.randomBytes(64).toString('hex')`

---

## Próximos Pasos / Pendientes

### Tareas para la Siguiente Sesión

1. **⚠️ PENDIENTE: Arreglar envío automático de emails de feedback**
   - Problema actual: Connection timeout con Brevo
   - Afecta: Cron job de solicitud de feedback
   - Prioridad: Alta

2. **Verificar configuración de Brevo**
   - Credenciales correctas
   - Puerto y secure settings
   - Timeout de conexión

---

## Historial de Cambios Importantes

### 2025-12-10
- ✅ Configuración inicial de Railway con MySQL
- ✅ Eliminación de servicio viejo `stickywork-db`
- ✅ Eliminación de volumen huérfano `stickywork-db-stickywork-mysql-data`
- ✅ Creación de tabla `service_feedback`
- ✅ Configuración de columnas de feedback en `bookings`
- ✅ Sistema de feedback funcionando correctamente
- ⚠️ Emails de feedback pendientes de arreglar

---

## Contacto y Soporte

Para problemas con Railway:
- **Documentación**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **Status**: https://status.railway.app

---

**Última actualización**: 2025-12-10
**Mantenedor**: Claude Code (Anthropic)
