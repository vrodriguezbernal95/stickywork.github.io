# 🔄 Workflow de Desarrollo - StickyWork

**Última actualización:** 2026-01-14

---

## 📋 Resumen Rápido

**StickyWork usa un workflow de 2 ramas:**

```
┌─────────────────────────────────────────────────────────┐
│  STAGING (desarrollo)  →  MASTER (producción)          │
│                                                         │
│  1. Desarrollo en staging                              │
│  2. Pruebas locales                                    │
│  3. Merge a master cuando funcione                     │
│  4. Railway despliega automáticamente                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🌳 Ramas del Proyecto

### `staging` - Rama de Desarrollo
- **Propósito:** Desarrollo de nuevas features y cambios
- **Entorno:** Pruebas locales (`localhost:3000`)
- **Base de datos:** Railway MySQL (misma que producción)
- **Deploy:** NO se despliega automáticamente
- **Regla:** NUNCA modificar datos reales en pruebas

### `master` - Rama de Producción
- **Propósito:** Código estable en producción
- **Entorno:** Railway auto-deploy
- **URLs:**
  - Backend: `https://api.stickywork.com`
  - Frontend: `https://stickywork.com`
- **Deploy:** Automático en cada push
- **Regla:** SOLO mergear cuando staging funcione 100%

---

## 🚀 Workflow Completo

### 1️⃣ Iniciar Nueva Feature

```bash
# Asegurarte de estar en staging
git checkout staging
git pull origin staging

# Verificar rama actual
git branch  # Debe mostrar * staging
```

### 2️⃣ Desarrollar en Staging

```bash
# Hacer cambios en el código...
# Ejemplo: editar backend/routes/...

# Ver cambios
git status

# Guardar progreso
git add .
git commit -m "feat: descripción del cambio"

# Backup en GitHub (opcional durante desarrollo)
git push origin staging
```

### 3️⃣ Probar Localmente

```bash
# Iniciar servidor local
cd backend
npm run dev

# El servidor corre en http://localhost:3000
# Probar todas las funcionalidades nuevas
# Verificar que no rompe nada existente
```

**⚠️ IMPORTANTE - Pruebas con Base de Datos:**
- Estás usando la BD de producción en local
- NO borres datos reales
- NO modifiques reservas de clientes
- SÍ puedes crear datos de prueba marcados como "TEST"
- SÍ puedes consultar/leer todo

### 4️⃣ Subir a Producción (cuando TODO funcione)

```bash
# Asegurarte que staging está commiteado
git add .
git commit -m "feat: descripción final"
git push origin staging

# Cambiar a master
git checkout master
git pull origin master

# Mergear staging → master
git merge staging

# Verificar que el merge fue exitoso
git log --oneline -5

# Subir a producción
git push origin master
```

**🚂 Railway detecta el push y despliega automáticamente (~2 minutos)**

### 5️⃣ Verificar Deploy en Producción

```bash
# Esperar 2-3 minutos y verificar
curl https://api.stickywork.com/health

# Ver logs en Railway:
# https://railway.app → tu proyecto → Deployments → View logs
```

### 6️⃣ Volver a Staging para Siguiente Feature

```bash
git checkout staging
# Listo para siguiente desarrollo
```

---

## 🛠️ Comandos Útiles

### Ver en qué rama estás
```bash
git branch
# * staging  ← estás aquí
#   master
```

### Ver últimos commits
```bash
git log --oneline -10
```

### Ver diferencias entre ramas
```bash
git diff master..staging
```

### Deshacer cambios locales (sin commitear)
```bash
git restore archivo.js          # Deshacer cambios en un archivo
git restore .                   # Deshacer todos los cambios
```

### Ver estado de staging vs master
```bash
git checkout staging
git log master..staging --oneline
# Muestra commits en staging que NO están en master
```

---

## 📊 Ejemplo Práctico

**Escenario:** Agregar nueva validación a formulario de reservas

```bash
# 1. Empezar en staging
git checkout staging
git pull origin staging

# 2. Hacer cambios
# Editar: backend/routes.js
# Añadir validación de teléfono

# 3. Commitear
git add backend/routes.js
git commit -m "feat: Add phone validation to booking form"

# 4. Probar localmente
cd backend
npm run dev
# Probar creando reservas en http://localhost:3000

# 5. Si funciona, backup en GitHub
git push origin staging

# 6. Subir a producción
git checkout master
git merge staging
git push origin master

# 7. Railway despliega automáticamente
# Esperar 2-3 min y verificar en https://api.stickywork.com

# 8. Volver a staging para siguiente feature
git checkout staging
```

---

## ⚠️ Errores Comunes

### ❌ "Ya hay cambios en staging sin mergear"
**Solución:** Revisa qué cambios hay:
```bash
git checkout staging
git log master..staging --oneline
# Si están listos, mergea a master
# Si NO, sigue trabajando en staging
```

### ❌ "Conflictos al hacer merge"
**Solución:**
```bash
# Ver archivos con conflicto
git status

# Editar archivos manualmente (buscar <<<<<<)
# Resolver conflictos

# Marcar como resuelto
git add archivo-con-conflicto.js
git commit -m "fix: Resolve merge conflicts"
```

### ❌ "El servidor local no arranca"
**Solución:**
```bash
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar proceso (reemplaza PID)
taskkill //F //PID 12345

# Reintentar
npm run dev
```

### ❌ "Deploy en Railway falló"
**Solución:**
1. Ve a Railway → Deployments → View logs
2. Busca el error (generalmente variables de entorno o npm install)
3. Corrige en staging
4. Vuelve a mergear a master

---

## 🎯 Mejores Prácticas

### ✅ HACER:
- Trabajar SIEMPRE en `staging` para nuevas features
- Probar TODO localmente antes de mergear
- Commits descriptivos: `feat:`, `fix:`, `docs:`
- Push a staging frecuentemente (backup)
- Mergear a master SOLO cuando funcione 100%

### ❌ NO HACER:
- Desarrollar directamente en `master`
- Hacer push a master sin probar
- Modificar datos reales en pruebas locales
- Mergear código con errores conocidos
- Saltarse pruebas "porque es cambio pequeño"

---

## 📁 Estructura del Proyecto

```
stickywork/
├── backend/              # Backend Node.js + Express
│   ├── routes/          # Endpoints API
│   ├── middleware/      # Auth, entitlements, etc.
│   ├── migrations/      # Scripts SQL de migraciones
│   └── services/        # Lógica de negocio
├── admin/               # Panel de administración
├── widget/              # Widget de reservas
├── config/              # Configuración (database, etc.)
├── .env                 # Variables de entorno (NO commitear)
├── server.js            # Entry point del servidor
├── WORKFLOW_DESARROLLO.md  # ← Este archivo
└── RAILWAY_STAGING_SETUP.md  # Configuración de Railway
```

---

## 🔐 Variables de Entorno

Las variables están en `.env` (NO se sube a GitHub):

```env
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=stickywork
JWT_SECRET=xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**⚠️ NUNCA commitear el archivo `.env`**

---

## 🆘 En Caso de Emergencia

### "Rompí producción"
```bash
# Ver último commit bueno en master
git log --oneline

# Revertir al commit anterior
git revert HEAD
git push origin master
# Railway despliega la reversión
```

### "Necesito empezar de cero en staging"
```bash
git checkout staging
git reset --hard master  # ⚠️ BORRA CAMBIOS EN STAGING
git push origin staging --force
```

### "Necesito ver el código de producción"
```bash
git checkout master
# Ver código en producción
git log -5
```

---

## 📞 Contacto y Ayuda

- **Repositorio:** https://github.com/vrodriguezbernal95/stickywork.github.io
- **Railway Dashboard:** https://railway.app (busca proyecto "stickywork-api")
- **Producción:** https://api.stickywork.com

---

## 📝 Historial de Cambios Importantes

| Fecha | Cambio | Rama |
|-------|--------|------|
| 2026-01-14 | Sistema de Entitlements implementado | staging |
| 2026-01-12 | Feature AI Reports completada | master |
| 2026-01-09 | Fix calendario (fecha día anterior) | master |

---

**✨ Recuerda: staging → probar → master → producción**

**🔒 Protege producción. Experimenta en staging.**
