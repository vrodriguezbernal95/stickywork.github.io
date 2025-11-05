# 🚀 Guía de Despliegue - StickyWork

Esta guía te ayudará a desplegar tu aplicación StickyWork completa en producción.

## 📋 Arquitectura de Despliegue

```
Frontend (GitHub Pages)     Backend + DB (Render.com)
┌─────────────────────┐    ┌──────────────────────┐
│                     │    │                      │
│  HTML, CSS, JS      │───▶│  Node.js + Express   │
│  (Páginas públicas) │    │  PostgreSQL Database │
│                     │    │  API REST            │
└─────────────────────┘    └──────────────────────┘
https://vrodriguezbernal95   https://stickywork-api
.github.io/                  .onrender.com
```

---

## 🎯 Paso 1: Crear Cuenta en Render.com

1. Ve a [render.com](https://render.com)
2. Haz clic en "Get Started"
3. Registrate con tu cuenta de GitHub
4. Autoriza el acceso a tus repositorios

---

## 🗄️ Paso 2: Crear Base de Datos PostgreSQL

### En Render (Gratis - Recomendado)

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"PostgreSQL"** (⚠️ Render solo ofrece PostgreSQL, no MySQL)
3. Configuración:
   ```
   Name: stickywork-db
   Database: stickywork
   User: stickywork (se genera automáticamente)
   Region: Frankfurt (o el más cercano a ti)
   Plan: Free
   ```
4. Clic en **"Create Database"**
5. **IMPORTANTE**: Guarda la **Internal Database URL** que te muestra:
   ```
   Internal Database URL: postgresql://user:password@host/database
   ```

**Nota:** La aplicación detectará automáticamente que estás usando PostgreSQL y usará el driver correcto. En local seguirás usando MySQL sin problemas.

---

## 🌐 Paso 3: Desplegar el Backend en Render

### 3.1 Crear el Web Service

1. En Render dashboard, clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona: `vrodriguezbernal95/stickywork.github.io`

### 3.2 Configuración del Servicio

```
Name: stickywork-api
Region: Frankfurt (o tu preferido)
Branch: master
Root Directory: (dejar vacío)
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 3.3 Variables de Entorno

Haz clic en **"Advanced"** y añade estas variables de entorno:

#### Base de Datos PostgreSQL:
```
DATABASE_URL=postgresql://user:password@host/database
```
👆 **Copia esto de tu base de datos en Render (Internal Database URL)**

#### Aplicación:
```
NODE_ENV=production
PORT=3000
APP_URL=https://stickywork-api.onrender.com
FRONTEND_URL=https://vrodriguezbernal95.github.io
```

#### JWT (Seguridad):
```
JWT_SECRET=genera_una_cadena_aleatoria_larga_y_segura_aqui_min_32_caracteres
JWT_EXPIRES_IN=24h
```

#### Email (Opcional - déjalo vacío si no tienes):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com (opcional)
EMAIL_PASSWORD=tu-password-app (opcional)
EMAIL_FROM=StickyWork <noreply@stickywork.com>
```

### 3.4 Crear el Servicio

1. Haz clic en **"Create Web Service"**
2. Espera de 3-5 minutos mientras Render despliega tu app
3. Una vez completado, verás tu URL: `https://stickywork-api.onrender.com`

---

## 🗃️ Paso 4: Inicializar la Base de Datos

### 4.1 Conectar vía Shell

1. En tu servicio de Render, ve a la pestaña **"Shell"**
2. Ejecuta:
```bash
npm run setup
```

Esto creará todas las tablas y el usuario demo.

### 4.2 Verificar que funciona

Abre en tu navegador:
```
https://stickywork-api.onrender.com/api/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "Servidor funcionando correctamente",
  "timestamp": "..."
}
```

---

## 🔗 Paso 5: Conectar Frontend con Backend

### 5.1 Actualizar configuración del Frontend

Los archivos ya están configurados para detectar automáticamente si están en producción o desarrollo:

```javascript
// En admin-login.html y admin-dashboard.html
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://stickywork-api.onrender.com';  // ← Ya configurado
```

### 5.2 Actualizar la URL en el código

Busca en estos archivos y verifica/actualiza la URL de producción:

**admin-login.html** (línea ~100):
```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://stickywork-api.onrender.com';  // ← Cambia si tu URL es diferente
```

**admin-dashboard.html** (similar):
```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://stickywork-api.onrender.com';  // ← Cambia si tu URL es diferente
```

### 5.3 Habilitar CORS

En Render, las variables de entorno ya incluyen `FRONTEND_URL`, lo que permite que GitHub Pages se conecte sin problemas.

---

## ✅ Paso 6: Probar el Sistema Completo

### 6.1 Acceder al Admin

Ve a:
```
https://vrodriguezbernal95.github.io/stickywork.github.io/admin-login.html
```

### 6.2 Credenciales de Prueba

```
Email:    admin@demo.com
Password: admin123
```

### 6.3 Verificar Funcionalidades

- ✅ Login funciona
- ✅ Dashboard carga estadísticas
- ✅ Puedes crear servicios
- ✅ Calendario muestra reservas
- ✅ Mensajes se cargan

---

## 🔧 Paso 7: Mantenimiento

### Ver Logs en Render

1. Ve a tu servicio en Render
2. Pestaña **"Logs"**
3. Aquí verás todos los errores y actividad

### Actualizar el Backend

Cada vez que hagas `git push` a master, Render se actualizará automáticamente.

### Reiniciar el Servicio

Si algo falla:
1. Ve a tu servicio en Render
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎯 Configuración Opcional: Dominio Personalizado

### En Render (Backend):

1. Ve a tu servicio → **"Settings"**
2. Sección **"Custom Domain"**
3. Añade: `api.tudominio.com`
4. Configura los DNS según las instrucciones

### En GitHub Pages (Frontend):

1. Settings → Pages → Custom domain
2. Añade: `www.tudominio.com` o `tudominio.com`
3. Configura DNS con los registros que te indiquen

---

## 🆘 Solución de Problemas

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que las variables `DB_HOST`, `DB_USER`, `DB_PASSWORD` sean correctas
2. Comprueba que la base de datos esté activa en Render
3. Revisa los logs para ver el error exacto

### Error: "CORS policy"

**Solución:**
1. Verifica que `FRONTEND_URL` esté configurado correctamente
2. Debe ser: `https://vrodriguezbernal95.github.io` (sin trailing slash)

### Error: "Table doesn't exist"

**Solución:**
```bash
# En Render Shell:
npm run setup
```

### El servicio se duerme (Free tier)

Render Free pone tu servicio en "sleep" después de 15 minutos sin uso.
- Primera petición tarda ~30 segundos en despertar
- Considera el plan pagado ($7/mes) si necesitas disponibilidad 24/7

---

## 💰 Costos

### Plan Gratuito:
- ✅ Backend en Render: **GRATIS**
- ✅ PostgreSQL en Render: **GRATIS** (1 GB)
- ✅ Frontend en GitHub Pages: **GRATIS**
- ⚠️ Servicio se duerme tras inactividad

### Plan Pagado (~$7-10/mes):
- ✅ Servicio siempre activo
- ✅ Más recursos (RAM, CPU)
- ✅ Base de datos más grande
- ✅ Sin tiempo de sleep

---

## 🎉 ¡Listo!

Tu aplicación completa ahora está en producción:

```
🌐 Frontend:  https://vrodriguezbernal95.github.io/stickywork.github.io/
🔌 Backend:   https://stickywork-api.onrender.com
🔐 Admin:     https://vrodriguezbernal95.github.io/stickywork.github.io/admin-login.html
```

---

## 📚 Recursos Adicionales

- [Documentación de Render](https://render.com/docs)
- [GitHub Pages Docs](https://docs.github.com/pages)
- [Node.js en Producción](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**¿Necesitas ayuda?** Consulta los logs en Render o contacta soporte en su chat.
