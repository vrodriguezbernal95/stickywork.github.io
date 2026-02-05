# Guía de Deploy a Producción - StickyWork

## Datos Importantes

| Concepto | Valor |
|----------|-------|
| **Proyecto Railway** | `selfless-success` |
| **Servicio Backend** | `stickywork-api` |
| **Servicio BD** | `MySQL` |
| **Dominio API** | `api.stickywork.com` |
| **Dominio Railway** | `stickywork-api-production-a2d8.up.railway.app` |
| **Repo GitHub** | `vrodriguezbernal95/stickywork.github.io` |
| **Rama** | `master` |

---

## Proceso de Deploy

### 1. Hacer cambios en el código
```bash
# Editar archivos...
git add archivo1.js archivo2.js
git commit -m "feat/fix/docs: Descripción del cambio"
git push origin master
```

### 2. Deploy en Railway
1. Ir a [Railway](https://railway.app) → Proyecto **selfless-success**
2. Click en servicio **stickywork-api**
3. Ir a **Deployments**
4. Verificar que el deploy automático se inició (o click en **"Deploy"** manual)
5. Esperar a que termine (estado: **Success**)

### 3. Verificar que funciona
```bash
curl https://api.stickywork.com/api/health
```
Debe responder: `{"success":true,"message":"Servidor funcionando correctamente",...}`

---

## Ejecutar Migraciones de Base de Datos

### Migraciones disponibles:
| Endpoint | Descripción |
|----------|-------------|
| `/api/debug/run-customers-migration` | Crear tabla customers |
| `/api/debug/run-customer-status-migration` | Sistema de niveles (normal/premium/riesgo/baneado) |
| `/api/debug/run-workshop-sessions-migration` | Sesiones múltiples en talleres |
| `/api/debug/run-public-page-migration` | Páginas públicas de reservas |

### Ejecutar migración:
```bash
curl -X POST "https://api.stickywork.com/api/debug/run-NOMBRE-migration" \
  -H "Authorization: Bearer super-admin-test-token" \
  -H "Content-Type: application/json"
```

---

## Variables de Entorno (Railway)

### Dónde configurarlas:
1. Railway → Proyecto **selfless-success**
2. Click en **stickywork-api**
3. Pestaña **Variables**

### Variables de Base de Datos (usar referencias):
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
MYSQL_URL=mysql://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}
```

### Variables de Aplicación:
```
NODE_ENV=production
PORT=3000
APP_URL=https://api.stickywork.com
FRONTEND_URL=https://stickywork.com
JWT_SECRET=tu-secret-aqui
JWT_EXPIRES_IN=24h
```

### Variables de Email (Brevo):
```
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=tu-usuario@smtp-brevo.com
EMAIL_PASSWORD=tu-password
EMAIL_FROM=StickyWork <noreply@stickywork.com>
BREVO_API_KEY=tu-api-key
```

---

## Solución de Problemas

### Las variables no llegan al servidor
```bash
# Verificar qué variables tiene el servidor:
curl https://api.stickywork.com/api/debug/env
```

**Posibles causas:**
1. Variables en proyecto incorrecto (verificar que sea `selfless-success`)
2. Deploy no completado (verificar estado en Deployments)
3. Dominio apunta a otro proyecto (verificar en Settings → Networking)

### Error de conexión a BD (ECONNREFUSED)
1. Verificar que MySQL esté **Online** en Railway
2. Verificar que las variables usen `${{MySQL.VARIABLE}}` (referencias)
3. Si usas URL pública, añadir SSL: ver `config/database-mysql.js`

### Railway no hace deploy automático
1. Ir a **Settings → Source**
2. Verificar que el repo esté conectado
3. Si está trabado: **Disconnect** y reconectar el repo

### Ver logs del servidor
1. Railway → stickywork-api → **Deployments**
2. Click en el deployment activo
3. Ver **Logs** en tiempo real

---

## Comandos Útiles

```bash
# Ver estado del servidor
curl https://api.stickywork.com/api/health

# Ver variables de entorno
curl https://api.stickywork.com/api/debug/env

# Ver estructura de tablas
curl https://api.stickywork.com/api/debug/table-structure

# Probar conexión a BD (ejecutar migración de prueba)
curl -X POST "https://api.stickywork.com/api/debug/run-customer-status-migration" \
  -H "Authorization: Bearer super-admin-test-token"
```

---

## Checklist Pre-Deploy

- [ ] Código probado localmente
- [ ] Cambios commiteados y pusheados a `master`
- [ ] Variables de entorno actualizadas (si hay nuevas)
- [ ] Migraciones de BD preparadas (si hay cambios de esquema)

## Checklist Post-Deploy

- [ ] Deploy terminó con estado **Success**
- [ ] `/api/health` responde correctamente
- [ ] Funcionalidad nueva probada en producción
- [ ] Migraciones ejecutadas (si aplica)

---

**Última actualización:** 05-feb-2026
