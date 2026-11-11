# Notas de Sesión - 10 Diciembre 2025

## Resumen de la Sesión

**Objetivo principal**: Arreglar problemas de deployment en Railway y hacer funcionar el sistema de feedback.

**Estado final**: ✅ Sistema de feedback funcionando correctamente. ⚠️ Emails automáticos pendientes de arreglar.

---

## Problemas Encontrados y Solucionados

### 1. Variables de Entorno Faltantes ✅ RESUELTO
**Problema**: Servidor crasheaba con error "JWT_SECRET no está configurado"
**Causa**: Variables JWT no existían en Railway
**Solución**:
- Generados JWT_SECRET y JWT_REFRESH_SECRET con `crypto.randomBytes(64).toString('hex')`
- Agregados a Railway variables de entorno

### 2. Base de Datos Incorrecta ✅ RESUELTO
**Problema**: Servicio "stickywork-db" era un deployment de Node.js, no MySQL
**Descubrimiento**:
- Los logs mostraban errores de JWT, no de MySQL
- El servicio estaba intentando ejecutar server.js
**Solución**:
- Eliminado servicio "stickywork-db" falso
- Creado nuevo servicio MySQL en Railway
- Configuradas todas las variables de conexión

### 3. Conexión BD en el Código ✅ RESUELTO
**Problema**: El código no llamaba `routes.setDatabase(db)` después de crear el pool
**Efecto**: Las rutas de feedback no tenían acceso a la base de datos
**Solución**: Agregada línea en `server.js:183`:
```javascript
routes.setDatabase(db);
```

### 4. Columnas de Feedback Faltantes ✅ RESUELTO
**Problema**: Tabla `bookings` no tenía columnas `feedback_sent`, `feedback_sent_at`, `feedback_token`
**Causa**: Migraciones no ejecutadas en Railway
**Solución**:
- Creado endpoint temporal `/api/feedback/run-migrations`
- Ejecutadas migraciones para agregar las 3 columnas
- Verificado con `DESCRIBE bookings`

### 5. Tabla service_feedback No Existe ✅ RESUELTO
**Problema**: Error "Table 'railway.service_feedback' doesn't exist"
**Causa**: Migración 011 nunca se ejecutó en Railway
**Solución**:
- Creado endpoint temporal `/api/feedback/create-table`
- Ejecutado SQL para crear tabla completa con indexes y foreign keys
- Tabla creada exitosamente

### 6. Confusión con Dos Bases de Datos ✅ RESUELTO
**Problema**: Parecía haber dos bases de datos diferentes con mismo nombre "railway"
**Causa**:
- Volumen huérfano `stickywork-db-stickywork-mysql-data` del servicio viejo
- Script de prueba usando URL pública vs servidor usando URL interna
**Solución**:
- Usuario eliminó el volumen huérfano
- Confirmado que ambas URLs (pública e interna) apuntan a la misma BD
- Probado el sistema end-to-end exitosamente

### 7. Endpoints de Debug Públicos ✅ RESUELTO
**Problema**: Endpoints temporales de debugging quedaron expuestos sin autenticación
**Riesgo**: Cualquiera podría ejecutar migraciones o modificar la BD
**Solución**:
- Eliminados todos los endpoints temporales:
  - `/api/feedback/test-db`
  - `/api/feedback/run-migrations`
  - `/api/feedback/create-table`
  - `/api/feedback/debug-add-token`
  - `/api/feedback/debug-bookings`
- Mantenidos solo console.logs útiles para debugging futuro
- Código limpiado y deployado

---

## Estado del Sistema de Feedback

### ✅ Funcionando Correctamente

1. **Formulario de Feedback**
   - URL: `https://stickywork.com/feedback.html?token=XXX`
   - Carga correctamente
   - Muestra información de la reserva
   - Permite calificar 1-5 estrellas
   - Campo de comentarios funcional
   - Envío exitoso a la BD

2. **Endpoint de Verificación**
   - `GET /api/feedback/verify/:token`
   - Valida tokens correctamente
   - Devuelve info de la reserva
   - Detecta si ya se envió feedback

3. **Almacenamiento de Feedback**
   - Tabla `service_feedback` funcionando
   - Foreign keys configuradas
   - Indexes creados correctamente

4. **Panel de Administración**
   - `/admin/opiniones.html`
   - Muestra feedbacks correctamente
   - Usuario confirmó que funciona bien

### ⚠️ Pendiente de Arreglar

**Envío Automático de Emails de Feedback**
- **Problema**: Connection timeout al conectar con Brevo (smtp-relay.brevo.com:587)
- **Afecta**: Cron job que envía emails cada hora
- **Estado**: El cron job se ejecuta y encuentra las reservas, pero falla al enviar
- **Logs**:
  ```
  ⏰ [Cron] Ejecutando job de envío de feedback...
  📧 [Feedback Job] Encontradas 2 reservas para enviar feedback
  ❌ [Feedback Job] Error enviando email para booking #1: Connection timeout
  ❌ [Feedback Job] Error enviando email para booking #2: Connection timeout
  ```

**Prioridad**: Alta (para próxima sesión)

---

## Configuración Final de Railway

### Servicios Activos
1. **stickywork-api** (Node.js app)
2. **MySQL** (Base de datos)

### Servicios Eliminados
- ~~stickywork-db~~ (era un Node.js falso, eliminado)
- ~~stickywork-db-stickywork-mysql-data~~ (volumen huérfano, eliminado)

### Variables Críticas en stickywork-api
```env
MYSQL_URL="${{MySQL.MYSQL_URL}}"
JWT_SECRET="9f97f56438e0..."
JWT_REFRESH_SECRET="7b19c8f44c0..."
EMAIL_HOST="smtp-relay.brevo.com"
EMAIL_PORT="587"
EMAIL_USER="9c91da001@smtp-brevo.com"
EMAIL_PASSWORD="xsmtpsib-23339..."
```

### Variables del Servicio MySQL
```env
MYSQL_URL="mysql://root:<CONTRASEÑA>@mysql.railway.internal:3306/railway"
MYSQL_PUBLIC_URL="mysql://root:<CONTRASEÑA>@tramway.proxy.rlwy.net:49999/railway"
```

---

## Archivos Modificados en Esta Sesión

### Archivos Nuevos Creados
- ✅ `RAILWAY_CONFIGURACION.md` - Documentación completa de Railway
- ✅ `RAILWAY_CHECKLIST.md` - Checklist de troubleshooting (creado al inicio)
- ✅ `NOTAS_SESION_2025-12-10.md` - Este archivo
- 📝 Scripts de prueba temporales (pueden eliminarse):
  - `crear-reserva-railway.js`
  - `list-all-bookings-railway.js`
  - `check-booking-status.js`
  - `test-patch-booking.js`

### Archivos Modificados
- ✅ `server.js` - Agregado `routes.setDatabase(db)` (línea 183)
- ✅ `backend/routes/feedback.js` - Limpieza de endpoints de debugging
- ✅ `.env` - No tocado (correcto, debe mantenerse en .gitignore)

### Base de Datos - Cambios Estructurales
- ✅ Tabla `bookings` - Agregadas columnas: `feedback_sent`, `feedback_sent_at`, `feedback_token`
- ✅ Tabla `service_feedback` - Creada completamente con todos los campos e indexes

---

## Commits Importantes de Esta Sesión

```
a718fbc - clean: Eliminar endpoints de debugging temporales
24f55a1 - debug: Agregar endpoint para crear tabla service_feedback
fdacdcb - debug: Agregar endpoint para asignar token a reserva existente
fc017d5 - debug: Agregar info de conexión BD al endpoint debug-bookings
5dfefea - debug: Agregar endpoint para listar todas las reservas con tokens
6cdeb79 - debug: Agregar logging detallado al endpoint verify para diagnóstico
7f99ed3 - fix: Corregir sintaxis SQL en migraciones (MySQL no soporta IF NOT EXISTS en ALTER TABLE)
53644af - feat: Agregar endpoint temporal para ejecutar migraciones desde Railway
```

---

## Lecciones Aprendidas

### 1. Railway Tiene Dos Tipos de URLs de BD
- **Interna** (`mysql.railway.internal:3306`): Para servicios dentro de Railway
- **Pública** (`tramway.proxy.rlwy.net:49999`): Para conexiones externas
- Ambas apuntan a la misma base de datos

### 2. Verificar Tipo de Servicio Antes de Asumir
- El servicio "stickywork-db" parecía MySQL por el nombre
- Pero los logs mostraban que era Node.js
- Siempre verificar los logs del deployment

### 3. Referencias de Variables en Railway
- Sintaxis especial: `${{ServiceName.VARIABLE_NAME}}`
- Case-sensitive: `${{MySQL.MYSQL_URL}}` funciona, `${{mysql.MYSQL_URL}}` NO
- Railway resuelve estas referencias automáticamente

### 4. Migraciones en Producción
- Nunca asumir que las migraciones se ejecutaron automáticamente
- Siempre verificar estructura de tablas antes de usar
- Crear endpoints temporales para ejecutar migraciones cuando sea necesario

### 5. Seguridad de Endpoints Temporales
- Endpoints de debug sin autenticación son un riesgo
- Eliminarlos SIEMPRE después de usarlos
- No dejarlos "por si acaso"

---

## Testing Realizado

### Tests Exitosos ✅
1. Endpoint `/api/health` - Servidor funcionando
2. Endpoint `/api/feedback/verify/:token` - Token válido encontrado
3. Formulario `/feedback.html?token=XXX` - Carga correctamente
4. Envío de feedback - Guardado en BD exitosamente
5. Panel admin `/admin/opiniones.html` - Muestra feedbacks correctamente

### Tests Pendientes ⚠️
1. Envío de emails automáticos (cron job)
2. Verificación de límite de rate limiting
3. Performance con múltiples feedbacks simultáneos

---

## Próxima Sesión - Tareas Pendientes

### Prioridad Alta 🔴

**1. Arreglar Envío de Emails de Feedback**
- Diagnosticar por qué Brevo da timeout
- Opciones a revisar:
  - Verificar credenciales de Brevo
  - Probar con `EMAIL_SECURE="true"`
  - Probar puerto 465 en lugar de 587
  - Aumentar timeout de nodemailer
  - Verificar si Railway bloquea puerto 587
- Archivo a revisar: `backend/email-service.js`
- Job afectado: `backend/jobs/enviar-feedback.js`

### Prioridad Media 🟡

**2. Limpieza de Archivos Temporales**
- Eliminar scripts de prueba que ya no se necesitan:
  - `crear-reserva-railway.js`
  - `list-all-bookings-railway.js`
  - `check-booking-status.js`
  - `test-patch-booking.js`
  - `list-businesses.js`
  - `crear-reserva-prueba-feedback.js`
  - `crear-reserva-bellavista.js`
  - `test-feedback-api.js`
  - `test-feedback-endpoint.js`
  - `ejecutar-job-feedback.js`

**3. Documentación**
- Agregar comentarios en código donde sea necesario
- Documentar el flujo completo del sistema de feedback

### Prioridad Baja 🟢

**4. Optimizaciones**
- Revisar performance del cron job
- Agregar retry logic para emails fallidos
- Implementar queue para emails (opcional)

---

## Comandos Útiles para Próximas Sesiones

### Verificar estado de Railway
```bash
curl https://stickywork.com/api/health
```

### Ver reservas con tokens (local)
```bash
node list-all-bookings-railway.js
```

### Ejecutar migración (local contra Railway)
```bash
node run-migration-011.js
```

### Ver logs en tiempo real
Ir a Railway > stickywork-api > Deployments > (último) > Logs

---

## Notas Adicionales

### Credenciales y Accesos
- Railway: Acceso con cuenta de GitHub del usuario
- MySQL password: Ver Railway > MySQL > Variables
- JWT secrets: Guardados en variables de Railway

### Negocios Demo Creados
```
Salón Bella Vista | admin@bellavista.demo
Restaurante El Buen Sabor | admin@buensabor.demo
Centro Mente Clara (Psicólogo) | admin@menteclara.demo
NutriVida (Nutrición) | admin@nutrivida.demo
PowerFit Gym (Gimnasio) | admin@powerfit.demo
Bella & Bella (Estética) | admin@bellabella.demo
Lex & Partners (Abogados) | admin@lexpartners.demo
```

### Reserva de Prueba Usada
- **ID**: 1
- **Cliente**: Judith
- **Negocio**: Lex & Partners (ID: 7)
- **Token de prueba**: `07ff20ea69cfc5ab5efac35b61e2b784d6693eabb295e008c49238684e2b7d3b`
- **Estado**: Feedback enviado exitosamente ✅

---

**Sesión finalizada**: 2025-12-10
**Duración aproximada**: ~3 horas
**Resultado**: Sistema de feedback funcionando, pendiente arreglar emails automáticos
