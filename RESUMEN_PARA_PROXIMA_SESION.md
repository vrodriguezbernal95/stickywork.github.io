# Resumen para Próxima Sesión

## Estado Actual del Proyecto ✅

**Sistema de Feedback**: FUNCIONANDO
- ✅ Formulario de feedback carga correctamente
- ✅ Los clientes pueden enviar sus opiniones
- ✅ Se guarda en la base de datos
- ✅ Aparece en el panel de administración

**Railway**: CONFIGURADO CORRECTAMENTE
- ✅ 2 servicios activos: `stickywork-api` y `MySQL`
- ✅ Variables de entorno configuradas
- ✅ Auto-deployment desde GitHub funcionando
- ✅ Base de datos con todas las tablas necesarias

---

## ⚠️ TAREA PENDIENTE (PRIORIDAD ALTA)

### Arreglar Envío Automático de Emails de Feedback

**Problema**:
El cron job encuentra las reservas completadas pero NO puede enviar los emails a los clientes. Error: "Connection timeout" al conectar con Brevo.

**Logs del error**:
```
⏰ [Cron] Ejecutando job de envío de feedback...
📧 [Feedback Job] Encontradas 2 reservas para enviar feedback
❌ [Feedback Job] Error enviando email para booking #1: Connection timeout
❌ [Feedback Job] Error enviando email para booking #2: Connection timeout
```

**Archivo a revisar**: `backend/email-service.js`

**Variables de email actuales**:
```env
EMAIL_HOST="smtp-relay.brevo.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="9c91da001@smtp-brevo.com"
EMAIL_PASSWORD="xsmtpsib-XXXXXXX...XXXXXXX" # (Ver Railway)
```

**Posibles soluciones a probar**:
1. Cambiar `EMAIL_SECURE="true"`
2. Probar puerto 465 en lugar de 587
3. Aumentar timeout en nodemailer
4. Verificar si Railway bloquea SMTP saliente
5. Verificar credenciales en panel de Brevo

---

## Documentos Importantes

### Para entender Railway
📄 **RAILWAY_CONFIGURACION.md** - Explicación completa de:
- Qué servicios hay
- Cómo funcionan las variables de entorno
- Diferencia entre URL pública e interna de MySQL
- Cómo funciona el deployment
- Troubleshooting común

### Para entender lo que se hizo hoy
📄 **NOTAS_SESION_2025-12-10.md** - Detalles de:
- Todos los problemas encontrados y cómo se resolvieron
- Configuración final de Railway
- Commits importantes
- Lecciones aprendidas

### Para troubleshooting rápido
📄 **RAILWAY_CHECKLIST.md** - Checklist de:
- Información necesaria de Railway
- Pasos de diagnóstico
- Problemas comunes

---

## Información Clave de Railway

### URLs de Conexión MySQL

**Interna** (desde servidor Railway):
```
mysql://root:<CONTRASEÑA>@mysql.railway.internal:3306/railway
```

**Pública** (desde tu máquina local):
```
mysql://root:<CONTRASEÑA>@tramway.proxy.rlwy.net:49999/railway
```

⚠️ **Nota**: Las credenciales reales están en Railway > MySQL > Variables

⚠️ **Importante**: Ambas apuntan a la MISMA base de datos, solo cambia la ruta de acceso.

### Servicios en Railway
```
stickywork-api    → https://stickywork.com
MySQL             → Base de datos interna
```

### Variables Críticas (ya configuradas en Railway)
```
MYSQL_URL="${{MySQL.MYSQL_URL}}"
JWT_SECRET="9f97f56438e0bec328342e39ef8d78b1d..."
JWT_REFRESH_SECRET="7b19c8f44c04d9645879e2dff892ce6..."
EMAIL_HOST="smtp-relay.brevo.com"
EMAIL_PORT="587"
```

---

## Estructura de Base de Datos

### Tabla: bookings
**Columnas de feedback** (agregadas en esta sesión):
- `feedback_sent` (BOOLEAN) - Si se envió el email
- `feedback_sent_at` (TIMESTAMP) - Cuándo se envió
- `feedback_token` (VARCHAR) - Token único para el formulario

### Tabla: service_feedback (creada en esta sesión)
Almacena las opiniones de los clientes:
- `id`, `booking_id`, `business_id`
- `customer_name`, `customer_email`
- `rating` (1-5), `comment`, `questions` (JSON)
- `feedback_token`, `created_at`

---

## Cron Jobs Activos

### Envío de Feedback (cada hora)
**Archivo**: `backend/jobs/enviar-feedback.js`
**Frecuencia**: `'0 * * * *'` (cada hora en punto)
**Función**: Busca reservas completadas hace 24h y envía emails
**Estado**: ⚠️ NO FUNCIONA - timeout al enviar emails

---

## Testing del Sistema

### Para probar el formulario de feedback:

1. Crear un token de prueba para una reserva:
```bash
curl -X POST https://stickywork.com/api/admin/bookings/[ID]/generate-feedback-token
```

2. Abrir en navegador:
```
https://stickywork.com/feedback.html?token=[TOKEN]
```

3. Enviar feedback y verificar en:
```
https://stickywork.com/admin/opiniones.html
```

### Para ver logs de Railway:
1. Railway > stickywork-api > Deployments
2. Clic en el último deployment
3. Clic en "Logs" o "View Logs"

---

## Scripts de Prueba (pueden eliminarse)

Estos archivos se crearon para debugging y ya no son necesarios:
```
crear-reserva-railway.js
list-all-bookings-railway.js
check-booking-status.js
test-patch-booking.js
list-businesses.js
crear-reserva-prueba-feedback.js
crear-reserva-bellavista.js
test-feedback-api.js
test-feedback-endpoint.js
ejecutar-job-feedback.js
```

---

## Contexto Importante

### ¿Por qué había "dos bases de datos"?
No había dos. Era confusión porque:
- Mi script de prueba usaba la URL **pública** (tramway.proxy.rlwy.net)
- El servidor usaba la URL **interna** (mysql.railway.internal)
- Había un **volumen huérfano** del servicio viejo que causaba confusión

**Solución**: Usuario eliminó el volumen viejo, ahora todo está claro.

### ¿Por qué se eliminaron los endpoints de debug?
Había 5 endpoints temporales sin autenticación:
- `/api/feedback/test-db`
- `/api/feedback/run-migrations`
- `/api/feedback/create-table`
- `/api/feedback/debug-add-token`
- `/api/feedback/debug-bookings`

**Riesgo**: Cualquiera podría ejecutarlos y modificar la base de datos.
**Solución**: Eliminados después de cumplir su propósito.

---

## Comandos Rápidos

### Ver estado del servidor
```bash
curl https://stickywork.com/api/health
```

### Conectar a MySQL desde local
```bash
mysql -h tramway.proxy.rlwy.net -P 49999 -u root -p railway
# Password: doIXDoyRlYQpWjxfWaMBufyNMmdaFDUx
```

### Deploy manual (si es necesario)
```bash
git add .
git commit -m "mensaje"
git push origin master
# Railway auto-deploya en 2-3 minutos
```

---

## Negocios Demo Disponibles

```
Salón Bella Vista           | admin@bellavista.demo
Restaurante El Buen Sabor   | admin@buensabor.demo
Centro Mente Clara          | admin@menteclara.demo
NutriVida                   | admin@nutrivida.demo
PowerFit Gym                | admin@powerfit.demo
Bella & Bella               | admin@bellabella.demo
Lex & Partners (Abogados)   | admin@lexpartners.demo
```

---

## En Resumen

✅ **LO QUE FUNCIONA**:
- Sistema de feedback completo (formulario + almacenamiento + panel admin)
- Railway configurado correctamente
- Base de datos con todas las tablas necesarias
- Auto-deployment desde GitHub

⚠️ **LO QUE FALTA**:
- Arreglar envío automático de emails de feedback (Connection timeout con Brevo)

🎯 **PRÓXIMA TAREA**:
Diagnosticar y arreglar el problema de conexión con Brevo para que los emails de solicitud de feedback se envíen automáticamente.

---

**Última actualización**: 2025-12-10
**Siguiente sesión**: Arreglar emails automáticos
