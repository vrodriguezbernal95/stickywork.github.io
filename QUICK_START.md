# ⚡ Quick Start - StickyWork

**Referencia rápida para Claude al iniciar sesión**

---

## 🎯 Workflow de Desarrollo

```
STAGING (desarrollo local) → MASTER (producción Railway)
```

### Trabajar en nueva feature:
```bash
git checkout staging
# ... hacer cambios ...
git add .
git commit -m "feat: descripción"
npm run dev  # Probar en localhost:3000
```

### Subir a producción:
```bash
git checkout master
git merge staging
git push origin master  # Railway despliega automáticamente
git checkout staging     # Volver a desarrollo
```

---

## 📂 Estructura Clave

```
backend/
  ├── routes/           # Endpoints API
  ├── middleware/       # auth.js, entitlements.js, rate-limit.js
  ├── migrations/       # Scripts SQL
  └── services/         # claude-service.js, etc.
admin/                  # Panel admin
widget/                 # Widget de reservas
config/database.js      # Configuración BD
server.js               # Entry point
```

---

## 🗄️ Base de Datos

**Tablas principales:**
- `businesses` - Negocios (con `plan` y `plan_limits`)
- `admin_users` - Usuarios del panel admin
- `services` - Servicios que ofrece cada negocio
- `bookings` - Reservas de clientes
- `ai_reports` - Reportes IA generados
- `usage_tracking` - Tracking de uso para entitlements

**Conexión:** Railway MySQL compartida entre local y producción

**⚠️ En desarrollo local:**
- NO borrar datos reales
- SÍ crear datos de prueba marcados como "TEST"

---

## 🔐 Sistema de Entitlements (2026-01-14)

### Planes implementados:

**FREE:**
- 1 usuario
- AI Reports: ❌ NO
- Servicios/Bookings: Ilimitados

**FOUNDERS (€25/mes):**
- 5 usuarios
- AI Reports: ✅ SÍ (1 por mes)
- Servicios/Bookings: Ilimitados
- API: ❌ NO
- White Label: ❌ NO

### Middleware disponible:
```javascript
const { requireFeature, validateAIReportLimit,
        validateServicesLimit, validateUsersLimit,
        getPlanInfo } = require('./middleware/entitlements');

// Uso:
router.post('/ruta', requireAuth, requireFeature('aiReports'), validateAIReportLimit, handler);
```

### Endpoint de plan:
```
GET /api/business/:id/plan
→ { plan, limits, usage }
```

---

## 🛠️ Comandos Frecuentes

```bash
# Ver rama actual
git branch

# Estado de archivos
git status

# Últimos commits
git log --oneline -10

# Diferencia staging vs master
git diff master..staging

# Iniciar servidor local
cd backend && npm run dev

# Ejecutar migración
node backend/migrations/run-NOMBRE-migration.js

# Ver proceso en puerto 3000
netstat -ano | findstr :3000

# Matar proceso
taskkill //F //PID xxxxx
```

---

## 🚨 Reglas Importantes

1. **SIEMPRE** trabajar en `staging`
2. **NUNCA** commitear `.env`
3. **PROBAR** todo localmente antes de mergear
4. **MERGEAR** a master SOLO cuando funcione 100%
5. **PROTEGER** datos de producción en pruebas locales

---

## 📍 URLs de Producción

- Backend: `https://api.stickywork.com`
- Frontend: `https://stickywork.com`
- Railway: https://railway.app
- GitHub: https://github.com/vrodriguezbernal95/stickywork.github.io

---

## 📚 Documentación Completa

Ver `WORKFLOW_DESARROLLO.md` para:
- Workflow detallado paso a paso
- Manejo de errores comunes
- Mejores prácticas
- Ejemplos prácticos

---

**Última actualización:** 2026-01-14
