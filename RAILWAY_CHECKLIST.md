# Railway - Checklist de Información para Deploy

**Fecha de creación:** 2025-12-10
**Propósito:** Documentar toda la información necesaria de Railway para debugging y deploy exitoso en cada sesión

---

## 🔍 Información Necesaria de Railway

### Cuando hay problemas con el deploy, proporciona:

#### 1. **Logs del Servicio (stickywork-api)**
```
Railway Dashboard > stickywork-api > Deployments > [Último deploy] > View Logs
```
**Qué buscar:**
- ✅ Errores de build (npm install, etc.)
- ✅ Errores de runtime (crashes, SIGTERM, etc.)
- ✅ Conexión a base de datos
- ✅ Variables de entorno faltantes

**Copiar y pegar:**
- Últimas 50-100 líneas del log
- Cualquier línea que contenga "ERROR", "Failed", "crashed"

---

#### 2. **Estado del Deploy**
```
Railway Dashboard > stickywork-api > Deployments
```
**Información a proporcionar:**
- Estado actual: ¿Building? ¿Crashed? ¿Running?
- Tiempo que lleva en ese estado
- Último deploy exitoso (fecha/hora)

---

#### 3. **Variables de Entorno**
```
Railway Dashboard > stickywork-api > Variables
```
**Lista de variables configuradas actualmente:**
- ✅ DB_HOST
- ✅ DB_USER
- ✅ DB_PASSWORD
- ✅ DB_NAME
- ✅ DB_PORT
- ✅ PORT
- ✅ NODE_ENV
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ APP_URL
- ✅ FRONTEND_URL
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_USER
- ✅ EMAIL_PASSWORD
- ✅ EMAIL_FROM

**Si falta alguna, avisarme cuál.**

---

#### 4. **Base de Datos (stickywork-db)**
```
Railway Dashboard > stickywork-db > Connect
```
**Información de conexión:**
- Host: `switchback.proxy.rlwy.net`
- Port: `26447`
- Database: `railway`
- User: (verificar en variables)

**Verificar:**
- ¿La BD está Running?
- ¿Hay errores en logs de la BD?
- ¿Las migraciones se ejecutaron?

---

#### 5. **Build Settings**
```
Railway Dashboard > stickywork-api > Settings > Build
```
**Verificar configuración:**
- Builder: ¿NIXPACKS o DOCKERFILE?
- Build command: (debería ser automático con npm)
- Start command: `npm start` o `node server.js`

**Archivos de configuración:**
- `railway.json` (si existe)
- `nixpacks.toml` (si existe)
- `Dockerfile` (si existe)

---

#### 6. **Comandos para Ejecutar Localmente (Debug)**

**Conectar a BD de Railway desde local:**
```bash
mysql -h switchback.proxy.rlwy.net -P 26447 -u [USER] -p railway
```

**Ver tablas actuales:**
```sql
SHOW TABLES;
DESCRIBE service_feedback;
DESCRIBE bookings;
```

**Verificar última migración:**
```sql
SELECT * FROM bookings LIMIT 1;
-- Ver si tiene columnas: feedback_sent, feedback_sent_at, feedback_token
```

---

## 🚀 Proceso de Deploy Correcto

### Antes de hacer push:

1. **Verificar que todos los cambios están commiteados:**
```bash
git status
git log -5 --oneline
```

2. **Verificar que las migraciones están creadas:**
```bash
ls backend/migrations/
```

3. **Si hay nuevas migraciones, crear script de ejecución:**
```bash
# Ejemplo: run-migration-XXX.js
```

4. **Commit y push:**
```bash
git add .
git commit -m "feat: [descripción del cambio]"
git push origin master
```

---

### Después de hacer push:

1. **Esperar a que Railway termine el deploy (1-3 minutos)**

2. **Ver logs en tiempo real:**
```
Railway Dashboard > stickywork-api > Deployments > View Logs
```

3. **Si el deploy falla:**
   - Copiar últimas 100 líneas de logs
   - Verificar variables de entorno
   - Ver si la BD está activa
   - Compartir info con Claude

4. **Si el deploy tiene éxito pero no funciona:**
   - Probar endpoint: `https://stickywork.com/api/health`
   - Ver logs de runtime
   - Verificar conexión a BD

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Cannot connect to database"
**Solución:**
- Verificar que stickywork-db está Running
- Verificar variables de entorno DB_*
- Verificar que DB_HOST usa la URL interna de Railway

### Problema 2: "SIGTERM" o servidor se apaga solo
**Solución:**
- Verificar que server.js escucha en `process.env.PORT`
- Verificar timeout de inicio (Railway espera max 300s)
- Revisar si hay errores antes del SIGTERM

### Problema 3: "Module not found"
**Solución:**
- Verificar que package.json tiene todas las dependencias
- Verificar que se ejecutó `npm install` en el build
- Ver logs de build para errores de npm

### Problema 4: Build exitoso pero errores 500
**Solución:**
- Ver logs de runtime (no de build)
- Verificar rutas de archivos (case-sensitive)
- Verificar que todas las tablas de BD existen

### Problema 5: Migraciones no se ejecutan
**Solución:**
- Railway NO ejecuta migraciones automáticamente
- Hay que ejecutarlas manualmente desde local:
```bash
node run-migration-XXX.js
```
- O crear endpoint temporal para ejecutarlas desde Railway

---

## 📋 Template de Reporte de Problema

Copia y completa esto cuando haya problemas:

```
🔴 PROBLEMA EN RAILWAY

**Servicio afectado:** stickywork-api / stickywork-db

**Estado actual:**
- [ ] Building
- [ ] Crashed
- [ ] Running pero con errores

**Logs (últimas 50 líneas):**
```
[Pegar logs aquí]
```

**Cambios recientes realizados:**
- [Describir qué se subió]

**¿Las migraciones se ejecutaron?**
- [ ] Sí
- [ ] No
- [ ] No sé

**Variables de entorno verificadas:**
- [ ] Todas están configuradas
- [ ] Falta alguna: ___________

**Error específico (si hay):**
[Copiar mensaje de error exacto]
```

---

## ✅ Checklist Pre-Deploy

Antes de cada deploy, verificar:

- [ ] `git status` no tiene archivos sin commitear importantes
- [ ] Si hay migraciones nuevas, están en `backend/migrations/`
- [ ] Si hay migraciones, hay script `run-migration-XXX.js`
- [ ] Variables de entorno están en `.env.example` documentadas
- [ ] El código funciona en local con `npm start`
- [ ] No hay console.log innecesarios (reducir ruido en logs)

---

## 🎯 Información Actual del Proyecto

**Última actualización:** 2025-12-10

**Servicios en Railway:**
- `stickywork-api` (Node.js backend)
- `stickywork-db` (MySQL)

**Branch principal:** master

**URL producción:** https://stickywork.com

**Dominio registrado en:** Porkbun

---

## 📝 Notas Adicionales

- Railway hace auto-deploy cuando se pushea a master
- El build tarda ~1-3 minutos normalmente
- Si tarda más de 5 minutos, probablemente falló
- Los logs se mantienen por 7 días
- Railway tiene límite de 500 horas/mes en plan gratuito

---

**Mantener este documento actualizado con cada problema nuevo que aparezca.**
