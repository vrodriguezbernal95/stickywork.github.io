# Guía de Deploy en Railway

## 🚀 Pasos para deployar StickyWork en Railway

### 1. Preparación Local (YA HECHO ✅)
- ✅ Proyecto en GitHub
- ✅ package.json configurado
- ✅ .env.example creado
- ✅ railway.json creado

### 2. Crear cuenta en Railway

1. Ve a: https://railway.app
2. Haz clic en "Start a New Project"
3. Conéctate con GitHub
4. Autoriza Railway a acceder a tus repositorios

### 3. Crear nuevo proyecto

1. En Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona: `vrodriguezbernal95/stickywork.github.io`
4. Railway detectará automáticamente que es Node.js

### 4. Añadir base de datos MySQL

1. En tu proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database"
3. Elige "MySQL"
4. Railway creará la base de datos automáticamente

### 5. Configurar variables de entorno

En el servicio de tu aplicación (no en la base de datos):

**Variables necesarias:**
```
NODE_ENV=production
PORT=3000
APP_URL=https://tu-app.railway.app (Railway te dará esta URL)
FRONTEND_URL=https://tu-app.railway.app

# JWT
JWT_SECRET=genera-un-secret-aleatorio-aqui
JWT_EXPIRES_IN=24h

# Email (opcional por ahora)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password-app
EMAIL_FROM=StickyWork <noreply@stickywork.com>
```

**Variables de MySQL (Railway las crea automáticamente):**
Railway conectará automáticamente estas variables:
- MYSQL_URL
- MYSQLHOST
- MYSQLPORT
- MYSQLUSER
- MYSQLPASSWORD
- MYSQLDATABASE

Pero necesitarás mapearlas a tus variables:
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}
```

### 6. Deploy automático

1. Railway hará deploy automáticamente
2. Espera 2-3 minutos
3. Verás los logs en tiempo real
4. Cuando veas "🚀 SERVIDOR STICKYWORK INICIADO" estará listo

### 7. Configurar dominio personalizado

1. En Railway, ve a tu servicio
2. Pestaña "Settings"
3. Sección "Domains"
4. Haz clic en "Generate Domain" (te dará una URL .railway.app gratis)
5. Luego haz clic en "Custom Domain"
6. Añade: stickywork.com

Railway te dará un CNAME record:
```
CNAME: @
Value: el-que-te-de-railway.railway.app
```

### 8. Configurar DNS en Porkbun

1. Ve a Porkbun.com
2. Entra a tu dominio stickywork.com
3. Ve a DNS Records
4. Añade el CNAME que te dio Railway

---

## 📊 Costos estimados

**Primeros 3 meses: GRATIS**
- $5 de crédito gratis al mes
- Suficiente para proyecto pequeño

**Después:**
- ~$5-10/mes si superas el tier gratuito
- Solo pagas por uso real

---

## 🔧 Comandos útiles

### Subir cambios:
```bash
git add .
git commit -m "tu mensaje"
git push origin master
```

Railway hará deploy automático al detectar el push.

### Ver logs en Railway:
Ve a tu proyecto → Deployments → View Logs

---

## 📝 Checklist de deploy

- [ ] Cuenta de Railway creada
- [ ] Repositorio conectado
- [ ] MySQL database añadida
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] Dominio personalizado añadido
- [ ] DNS configurado en Porkbun
- [ ] SSL activo (automático)
- [ ] Base de datos inicializada

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en Railway
2. Verifica las variables de entorno
3. Asegúrate de que MySQL esté conectado
4. Chequea que el dominio apunte correctamente

¡Listo para desplegar! 🚀
