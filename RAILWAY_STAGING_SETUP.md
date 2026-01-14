# 🚂 Configurar Staging en Railway - Guía Paso a Paso

**Tiempo estimado:** 5 minutos
**Dificultad:** Fácil

---

## ✅ Parte 1: YA HECHO (por Claude)

- ✅ Rama `staging` creada en Git
- ✅ Push a GitHub
- ✅ Documentación creada

---

## 🎯 Parte 2: LO QUE TIENES QUE HACER (Railway)

### Paso 1: Ir a Railway Dashboard

1. Abre https://railway.app
2. Login con tu cuenta
3. Busca tu proyecto: **stickywork-api** (o como lo hayas llamado)
4. Click en el proyecto

---

### Paso 2: Activar Branch Deploys

1. En tu proyecto, click en el servicio **backend** (Node.js)
2. Ve a la pestaña **"Settings"** (⚙️ icono arriba a la derecha)
3. Busca la sección **"Deploys"** o **"Source"**
4. Encontrarás algo como:

```
┌─────────────────────────────────┐
│ Source Repository               │
│ ✓ github.com/vrodriguez../..    │
│                                 │
│ Branch: master ▼                │
│ [ ] Watch Paths                 │
│ [x] Automatic deploys           │
│                                 │
│ ▼ Advanced (click aquí)         │
└─────────────────────────────────┘
```

5. Click en **"Advanced"** o busca **"PR Deploys"** / **"Branch Deploys"**

6. Activa la opción:
```
[✓] Enable PR Deploys
[✓] Deploy from branches matching pattern: staging
```

O si no hay checkbox, busca un botón "Add branch" y añade: `staging`

---

### Paso 3: Verificar Variables de Entorno (Opcional)

**IMPORTANTE:** Las variables de staging heredan de master por defecto.

Si quieres variables DIFERENTES para staging:

1. En Railway Settings → Variables
2. Click en **"Add Variable"**
3. En el selector de **Environment**, elige `staging` (debería aparecer ahora)
4. Añade variables específicas:

```
NODE_ENV = staging
STAGING_MODE = true
```

**Nota:** Por ahora puedes dejarlo igual que producción, ya ajustaremos después si es necesario.

---

### Paso 4: Esperar el Deploy

1. Railway detectará la rama `staging` automáticamente
2. Hará el primer deploy (tarda ~2-3 minutos)
3. Verás un nuevo deployment en el dashboard con etiqueta `staging`

---

### Paso 5: Obtener URL de Staging

1. En el dashboard, deberías ver algo como:

```
Deployments:
├─ master (production) ✓
│  └─ api.stickywork.com
│
└─ staging ✓
   └─ stickywork-staging-xxx.up.railway.app  ← ESTA ES TU URL
```

2. Click en el deployment de `staging`
3. Copia la URL generada
4. **Guárdala** (la necesitaremos para configurar el frontend)

---

## 🧪 Verificación Final

### Test 1: Backend arranca

```bash
# Reemplaza con tu URL de staging:
curl https://stickywork-staging-xxx.up.railway.app/health
```

**Respuesta esperada:**
```json
{"status":"ok","environment":"staging"}
```

---

### Test 2: Endpoint funciona

```bash
curl https://stickywork-staging-xxx.up.railway.app/api/widget/9
```

**Respuesta esperada:** JSON con datos de La Famiglia

---

## 🎉 ¡Listo!

Si los tests pasan, **tienes staging funcionando**.

---

## 📋 Resumen de URLs

Después de configurar, tendrás:

```
PRODUCCIÓN:
Backend:  https://api.stickywork.com
Frontend: https://stickywork.com
BD:       MySQL Railway (producción)

STAGING:
Backend:  https://stickywork-staging-xxx.up.railway.app
Frontend: http://localhost (por ahora)
BD:       Misma BD (compartida)
```

---

## 🚨 Si algo sale mal

### Problema 1: "No veo la rama staging en Railway"
**Solución:**
- Espera 1-2 minutos, Railway tarda en detectar ramas nuevas
- Refresca el dashboard de Railway
- Verifica que el push a GitHub se hizo correctamente

### Problema 2: "Deploy falla en staging"
**Solución:**
- Ve a Railway → Deployments → staging → View logs
- Busca el error
- Probablemente sea variables de entorno faltantes

### Problema 3: "No encuentro dónde activar Branch Deploys"
**Solución:**
- Railway cambia UI frecuentemente
- Busca: "PR Deploys", "Branch Deploys", o "Source Settings"
- Si no lo encuentras, avísame y te guío con capturas

---

## ⏭️ Próximo Paso

Una vez tengas staging funcionando, **avísame** y empezamos a desarrollar el sistema de entitlements en la rama staging, sin tocar producción.

---

**¿Dudas?** Pregúntame lo que necesites.
