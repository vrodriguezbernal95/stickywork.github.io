# 🚧 Entorno de STAGING - StickyWork

**Rama:** `staging`
**Propósito:** Entorno de pruebas antes de desplegar a producción

---

## 🎯 ¿Qué es Staging?

Este entorno te permite:
- ✅ Probar nuevas features sin afectar clientes reales
- ✅ Detectar bugs antes de producción
- ✅ Validar cambios críticos con seguridad
- ✅ Desarrollar features grandes (ej: sistema de pagos, entitlements)

---

## 🔄 Workflow de Desarrollo

### 1. Desarrollo en Staging
```bash
# Asegúrate de estar en staging
git checkout staging
git pull origin staging

# Desarrolla tu feature
# ... código ...

# Commit y push a staging
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin staging

# Railway despliega automáticamente en staging
# Prueba en: https://stickywork-staging-xxx.up.railway.app
```

### 2. Merge a Producción (cuando todo funcione)
```bash
# Cambia a master
git checkout master
git pull origin master

# Merge staging → master
git merge staging

# Push a producción
git push origin master

# Railway despliega automáticamente en producción
```

---

## 🌐 URLs

### Staging:
- **Backend API:** `https://stickywork-staging-xxx.up.railway.app` (Railway lo genera)
- **Frontend:** Desarrollo local (`http://localhost` o rama gh-pages-staging)
- **Base de datos:** Misma BD que producción (con validaciones)

### Producción:
- **Backend API:** `https://api.stickywork.com`
- **Frontend:** `https://stickywork.com`
- **Base de datos:** MySQL Railway (producción)

---

## ⚙️ Variables de Entorno

### Staging debe tener:
```bash
NODE_ENV=staging
DATABASE_URL=mysql://... (misma BD)
STAGING_MODE=true
ANTHROPIC_API_KEY=... (puede ser diferente key de prueba)
```

### Validaciones en código:
```javascript
// En cualquier operación crítica:
if (process.env.NODE_ENV === 'staging') {
  console.log('⚠️ STAGING MODE - Operación de prueba');
}
```

---

## 🛡️ Protecciones

### En Staging puedes:
- Crear/eliminar datos de prueba
- Probar integraciones (Stripe test mode)
- Ejecutar scripts de migración
- Romper cosas sin miedo

### NO hacer en Staging:
- ❌ Usar clientes reales para pruebas (crea clientes de prueba)
- ❌ Compartir URLs públicamente (solo equipo interno)
- ❌ Enviar emails/WhatsApp reales (usa números de prueba)

---

## 🧪 Testing Checklist

Antes de merge staging → master:

- [ ] Backend arranca sin errores
- [ ] Login funciona
- [ ] Crear reserva funciona
- [ ] Dashboard carga correctamente
- [ ] Nueva feature funciona según esperado
- [ ] No hay errores en logs de Railway
- [ ] Tests manuales pasados

---

## 🚨 Troubleshooting

### Problema: "Railway no despliega staging"
**Solución:** Verifica Branch Deploys activado en Railway Settings

### Problema: "Base de datos tiene datos viejos"
**Solución:** En staging es OK, no es necesario copiar datos siempre

### Problema: "Errores en staging después de merge desde master"
**Solución:**
```bash
git checkout staging
git merge master  # Traer cambios de producción
git push origin staging
```

---

## 📚 Recursos

- [Railway Branch Deploys](https://docs.railway.app/deploy/deployments#branch-deploys)
- [Git Branching Strategy](https://nvie.com/posts/a-successful-git-branching-model/)

---

**Última actualización:** 2026-01-14
**Mantenido por:** Victor Rodriguez
