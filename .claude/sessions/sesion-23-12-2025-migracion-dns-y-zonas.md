# Sesión 23-12-2025: Migración DNS y Corrección de Zonas

## Resumen Ejecutivo

**Objetivo principal:** Migrar la arquitectura de StickyWork para separar frontend (GitHub Pages) y backend (Railway), y corregir bugs en la visualización de zonas de restaurantes.

**Estado final:** ✅ Completado exitosamente

---

## 1. Arquitectura Antes y Después

### ANTES (Arquitectura duplicada)
```
Frontend:
  - https://vrodriguezbernal95.github.io/stickywork.github.io/
  - https://stickywork.com (apuntando a Railway, sirviendo frontend + backend)

Backend:
  - https://stickywork.com (Railway)
  - MySQL database en Railway
```

**Problemas:**
- Frontend duplicado en dos ubicaciones
- Usuario confundido sobre cuál usar
- Railway sirviendo tanto frontend como backend (innecesario)

### DESPUÉS (Arquitectura separada)
```
Frontend:
  - https://stickywork.com → GitHub Pages (archivos estáticos)
  - https://www.stickywork.com → Redirige a stickywork.com

Backend:
  - https://api.stickywork.com → Railway (API + Database)
  - MySQL database en Railway
```

**Ventajas:**
- Frontend gratuito en GitHub Pages (sin límites de ancho de banda)
- Backend optimizado en Railway (solo API)
- Separación clara de responsabilidades
- Mejor escalabilidad

---

## 2. Configuración DNS en Porkbun

### Registros DNS ANTES

```
ALIAS
Host: stickywork.com
Value: ipghzvhi.up.railway.app
TTL: 600

CNAME
Host: www.stickywork.com
Value: ipghzvhi.up.railway.app
TTL: 600
```

### Registros DNS DESPUÉS

```
# Registros para GitHub Pages (Frontend)
A
Host: stickywork.com
Value: 185.199.108.153
TTL: 600

A
Host: stickywork.com
Value: 185.199.109.153
TTL: 600

A
Host: stickywork.com
Value: 185.199.110.153
TTL: 600

A
Host: stickywork.com
Value: 185.199.111.153
TTL: 600

CNAME
Host: www
Value: vrodriguezbernal95.github.io
TTL: 600

# Registro para Railway (Backend API)
CNAME
Host: api
Value: os24kmkg.up.railway.app
TTL: 600

# Registros de Email (sin cambios)
CNAME
Host: brevo1._domainkey.stickywork.com
Value: b1.stickywork-com.dkim.brevo.com
TTL: 300

CNAME
Host: brevo2._domainkey.stickywork.com
Value: b2.stickywork-com.dkim.brevo.com
TTL: 300

MX
Host: stickywork.com
Value: fwd1.porkbun.com
Priority: 10
TTL: 600

MX
Host: stickywork.com
Value: fwd2.porkbun.com
Priority: 20
TTL: 600

TXT
Host: stickywork.com
Value: brevo-code:947041f8cdc63287f8774103e06860cd
TTL: 300

TXT
Host: stickywork.com
Value: v=spf1 include:_spf.porkbun.com ~all
TTL: 600

TXT
Host: _dmarc.stickywork.com
Value: v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
TTL: 300
```

### Notas importantes sobre DNS

- **Registros A:** Apuntan `stickywork.com` a GitHub Pages (4 IPs para redundancia)
- **CNAME www:** Redirige `www.stickywork.com` a GitHub Pages
- **CNAME api:** Apunta `api.stickywork.com` al backend en Railway
- **Registros de email:** No modificados, siguen usando Brevo para transaccionales

---

## 3. Configuración de Railway

### Proyecto: selfless-success

**URL del proyecto Railway:** (accesible desde tu dashboard de Railway)

**Dominios configurados:**
```
1. stickywork-api-production-a2d8.up.railway.app (generado por Railway)
2. api.stickywork.com (dominio personalizado)
```

**Dominio eliminado:**
- ❌ `www.stickywork.com` (eliminado para liberar espacio del límite de dominios)

**Variables de entorno importantes:**
```
DB_HOST=mysql.railway.internal
MYSQLHOST=autorack.proxy.rlwy.net
MYSQL_URL=mysql://root:...@autorack.proxy.rlwy.net:PORT/railway

NODE_ENV=production
PORT=3000
```

**URL del CNAME para DNS:**
```
os24kmkg.up.railway.app
```

---

## 4. Configuración de GitHub Pages

### Repositorio
```
Usuario: vrodriguezbernal95
Repositorio: stickywork.github.io
URL: https://github.com/vrodriguezbernal95/stickywork.github.io
```

### Configuración de Custom Domain

**Settings → Pages:**
- ✅ Custom domain: `stickywork.com`
- ✅ Enforce HTTPS: Activado
- ✅ Source: Deploy from branch `master`

### Archivo CNAME

**Ubicación:** `C:\Users\vic_e\Desktop\stickywork\CNAME`

**Contenido:**
```
stickywork.com
```

---

## 5. Cambios en el Código

### 5.1. API URLs actualizadas

Se cambió la URL del backend en 3 archivos para usar el nuevo subdominio:

#### `admin/js/api.js` (líneas 1-4)
```javascript
// ANTES
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://stickywork.com';  // URL del backend en Railway

// DESPUÉS
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://api.stickywork.com';  // Backend API en Railway
```

#### `js/main.js` (líneas 116-118)
```javascript
// DESPUÉS
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://api.stickywork.com';
```

#### `admin-login.html` (líneas 294-297)
```javascript
// DESPUÉS
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://api.stickywork.com';  // Backend API en Railway
```

### 5.2. Corrección del bug de visibilidad de Zonas

#### `admin/js/settings.js` (líneas 94-100)

**Problema:** El tab de Zonas no aparecía porque comprobaba una propiedad inexistente.

```javascript
// ANTES - ❌ Bug
<button class="settings-tab" data-tab="zones" onclick="settings.switchTab('zones')"
        style="display: ${this.businessData?.booking_mode === 'tables' ? 'block' : 'none'};">
    🏢 Zonas
</button>

// DESPUÉS - ✅ Correcto
<button class="settings-tab" data-tab="zones" onclick="settings.switchTab('zones')"
        style="display: ${(() => {
            const bookingSettings = this.businessData?.booking_settings;
            const settings = typeof bookingSettings === 'string' ? JSON.parse(bookingSettings) : bookingSettings;
            return settings?.bookingMode === 'tables' ? 'block' : 'none';
        })()};">
    🏢 Zonas
</button>
```

**Cambios:**
- Cambió de `booking_mode` (no existe) a `booking_settings.bookingMode`
- Agregó soporte para JSON parseado

### 5.3. Corrección del renderizado de zonas

#### `admin/js/settings.js` (líneas 1888-1905)

**Problema:** Zonas guardadas como objetos `{name, capacity}` se mostraban como "[object Object]".

```javascript
// ANTES - ❌ Bug
<div id="zones-list" style="margin-top: 1rem;">
    ${zones.map((zone, index) => `
        <div class="zone-item" data-index="${index}">
            <input type="text"
                   class="zone-input"
                   value="${zone}"  // ← Problema: si zone es objeto, muestra [object Object]
                   placeholder="Nombre de la zona">
            <button onclick="settings.removeZone(${index})">✕ Eliminar</button>
        </div>
    `).join('')}
</div>

// DESPUÉS - ✅ Correcto
<div id="zones-list" style="margin-top: 1rem;">
    ${zones.map((zone, index) => {
        const zoneName = typeof zone === 'string' ? zone : zone.name || '';
        return `
        <div class="zone-item" data-index="${index}">
            <input type="text"
                   class="zone-input"
                   value="${zoneName}"  // ← Soporta tanto strings como objetos
                   placeholder="Nombre de la zona">
            <button onclick="settings.removeZone(${index})">✕ Eliminar</button>
        </div>
    `}).join('')}
</div>
```

**Cambios:**
- Agregó detección del tipo de dato (string u objeto)
- Extrae `zone.name` si es objeto, usa el string directamente si no lo es
- Compatible con ambos formatos de datos

---

## 6. Commits Realizados

```bash
8c26ab0 - fix: Soportar zonas como objetos y strings en renderZonesTab
0ec2a02 - fix: Actualizar API URL en admin-login.html
cd4d178 - config: Cambiar API URL a subdominio api.stickywork.com
36a3c85 - config: Agregar CNAME para dominio personalizado stickywork.com
b30ce4b - fix: Corregir visibilidad del tab Zonas en Settings
```

**Repositorio remoto:**
```
https://github.com/vrodriguezbernal95/stickywork.github.io.git
Branch: master
```

---

## 7. Datos del Negocio de Prueba

### La Famiglia Restaurant

**Usuario admin:**
```
Email: admin@lafamiglia.demo
Password: lafamiglia2024
```

**Configuración del negocio:**
```json
{
  "business_id": 9,
  "user_id": 10,
  "name": "La Famiglia",
  "type": "restaurant",
  "booking_settings": {
    "bookingMode": "tables",
    "restaurantZones": [
      {
        "name": "Terraza",
        "capacity": 30
      },
      {
        "name": "Interior",
        "capacity": 50
      }
    ],
    "slotDuration": 30,
    "workDays": [1, 2, 3, 4, 5, 6],
    "workHoursStart": "09:00",
    "workHoursEnd": "23:00"
  }
}
```

**Ubicación en base de datos:**
- Backend: `https://api.stickywork.com` (Railway MySQL)
- Database: `railway` (MySQL en Railway)
- Tabla: `businesses` (id: 9)
- Tabla: `admin_users` (id: 10)

---

## 8. Problemas Encontrados y Soluciones

### Problema 1: Usuario no encontrado en Railway database

**Error inicial:**
```
Query: SELECT * FROM admin_users WHERE email = 'admin@lafamiglia.demo'
Resultado: [] (vacío)
```

**Causa raíz:**
- Estaba consultando la base de datos de Railway LOCAL (variables de entorno .env)
- El usuario accedía a través de `stickywork.com` que apunta a OTRA base de datos
- Hay DOS backends diferentes:
  - `railway.up.railway.app` (backend de desarrollo/local)
  - `stickywork.com` (backend de producción anterior)

**Solución:**
- Identificar que el usuario está en la base de datos de `stickywork.com`
- Verificar con `test-stickywork-com.js` que el usuario existe ahí
- Migrar a `api.stickywork.com` (mismo backend de producción)

### Problema 2: Login exitoso pero redirige a login

**Error:**
```
Usuario: admin@lafamiglia.demo
Estado: Login exitoso
Comportamiento: Redirige de vuelta a admin-login.html
```

**Causa raíz:**
- `admin-login.html` usaba `https://stickywork.com/api/auth/login` (URL vieja)
- `admin/js/api.js` usaba `https://api.stickywork.com/api/auth/verify` (URL nueva)
- Login guardaba token correctamente
- Dashboard intentaba verificar token con URL nueva (no existe aún)
- Verificación fallaba → redirect a login

**Solución:**
- Actualizar `admin-login.html` para usar `api.stickywork.com`
- Asegurar consistencia en las 3 ubicaciones (api.js, main.js, admin-login.html)

### Problema 3: Error de conexión después de cambiar DNS

**Error:**
```
Error de conexión. Verifica que el servidor esté en funcionamiento.
```

**Causa raíz:**
- Caché del navegador tenía la versión antigua del HTML
- HTML antiguo aún apuntaba a `stickywork.com` en lugar de `api.stickywork.com`

**Solución:**
- Hard refresh del navegador (Ctrl+Shift+R)
- Esperar a que GitHub Pages despliegue la nueva versión (30-60 segundos)
- Verificar con DevTools que se carga la nueva versión

### Problema 4: Zonas mostradas como "[object Object]"

**Error visual:**
```
Input value: [object Object]
Esperado: Terraza, Interior
```

**Causa raíz:**
- La Famiglia tiene zonas guardadas como objetos: `{name: "Terraza", capacity: 30}`
- El código esperaba solo strings: `"Terraza"`
- Al hacer `value="${zone}"`, convertía el objeto a string → "[object Object]"

**Solución:**
- Detectar tipo de dato (string vs objeto)
- Si es objeto, extraer `zone.name`
- Si es string, usar directamente

### Problema 5: Límite de dominios en Railway

**Error:**
```
Has alcanzado el límite de dominios personalizados de tu plan
```

**Dominios existentes en Railway:**
1. stickywork-api-production-a2d8.up.railway.app
2. stickywork.com
3. www.stickywork.com

**Solución:**
- Eliminar `www.stickywork.com` de Railway (ya no necesario)
- Agregar `api.stickywork.com`
- Configurar `www.stickywork.com` en GitHub Pages

---

## 9. Verificación del Funcionamiento

### Tests realizados

#### Test 1: DNS Resolution
```bash
$ nslookup stickywork.com
Respuesta:
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153

$ nslookup www.stickywork.com
Respuesta:
  vrodriguezbernal95.github.io → GitHub Pages IPs

$ nslookup api.stickywork.com
Respuesta:
  os24kmkg.up.railway.app → 66.33.22.35
```

✅ DNS propagado correctamente

#### Test 2: Frontend accessibility
```bash
$ curl -I https://stickywork.com
HTTP/1.1 200 OK
Server: GitHub.com
Content-Type: text/html
```

✅ Frontend sirviéndose desde GitHub Pages

#### Test 3: Backend API
```bash
$ curl -X POST https://api.stickywork.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lafamiglia.demo","password":"lafamiglia2024"}'

Respuesta:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 10,
      "business_id": 9,
      "email": "admin@lafamiglia.demo",
      "full_name": "Administrador La Famiglia",
      "role": "owner"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "ca4f9c1a...",
    "expiresIn": "15m"
  }
}
```

✅ Backend API funcionando correctamente

#### Test 4: Login completo (manual)
```
1. Acceder a https://stickywork.com/admin-login.html ✅
2. Ingresar credenciales de La Famiglia ✅
3. Login exitoso → redirige a dashboard ✅
4. Dashboard carga correctamente ✅
5. Settings → Tab Zonas visible ✅
6. Zonas mostradas correctamente: "Terraza", "Interior" ✅
```

✅ Flujo completo funcionando

---

## 10. Pasos para Continuar en el Futuro

### Si necesitas agregar más dominios a Railway:

1. Ve a Railway → Proyecto "selfless-success"
2. Settings → Networking → Custom Domains
3. Verifica límite de dominios de tu plan
4. Si es necesario, elimina un dominio no usado
5. Agregar nuevo dominio (ej: `api2.stickywork.com`)
6. Railway te dará un CNAME (ej: `xyz123.up.railway.app`)
7. Ir a Porkbun → DNS → Agregar CNAME:
   ```
   Tipo: CNAME
   Host: api2
   Value: xyz123.up.railway.app
   TTL: 600
   ```
8. Esperar 5-15 minutos para propagación DNS
9. Verificar con `nslookup api2.stickywork.com`
10. Railway provisionará SSL automáticamente

### Si necesitas modificar zonas de restaurantes:

1. Login en https://stickywork.com/admin-login.html
2. Ir a Settings → 🏢 Zonas
3. Modificar nombres de zonas existentes
4. Agregar nuevas zonas con el botón "➕ Agregar zona"
5. Eliminar zonas (mínimo 1 zona requerida)
6. Guardar cambios con "💾 Guardar zonas"

**Nota:** Las zonas se guardan en `booking_settings.restaurantZones` en la tabla `businesses`.

### Si el frontend no actualiza después de un push:

1. Verificar que el commit está en GitHub:
   ```bash
   git log --oneline -5
   ```

2. Verificar GitHub Actions (despliegue automático):
   ```
   https://github.com/vrodriguezbernal95/stickywork.github.io/actions
   ```

3. Esperar 30-60 segundos después del despliegue

4. Hacer hard refresh en el navegador:
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

5. Si persiste, limpiar caché del navegador completamente

### Si necesitas revertir cambios de DNS:

**⚠️ IMPORTANTE: Guarda esta configuración por si necesitas volver atrás**

**DNS anterior (Railway frontend + backend):**
```
ALIAS stickywork.com → ipghzvhi.up.railway.app
CNAME www → ipghzvhi.up.railway.app
```

**Para revertir:**
1. Eliminar los 4 registros A de GitHub Pages
2. Agregar de vuelta el ALIAS a Railway
3. Actualizar CNAME de www a Railway
4. Esperar propagación DNS (5-15 minutos)

---

## 11. URLs Importantes

### Producción
- Frontend: https://stickywork.com
- Backend API: https://api.stickywork.com
- Admin Login: https://stickywork.com/admin-login.html
- Admin Dashboard: https://stickywork.com/admin-dashboard.html

### Desarrollo/Testing
- Railway Dashboard: https://railway.app (login requerido)
- GitHub Repository: https://github.com/vrodriguezbernal95/stickywork.github.io
- GitHub Pages Settings: https://github.com/vrodriguezbernal95/stickywork.github.io/settings/pages

### DNS Management
- Porkbun Dashboard: https://porkbun.com/account/domainsSpeedy
- Dominio: stickywork.com

### Verificación DNS
- DNS Checker: https://dnschecker.org
- Herramienta CLI: `nslookup stickywork.com`

---

## 12. Archivos Creados/Modificados en Esta Sesión

### Archivos modificados (committed)
```
admin/js/settings.js    - Bug fixes de zonas
admin/js/api.js         - API URL actualizada
js/main.js              - API URL actualizada
admin-login.html        - API URL actualizada
CNAME                   - Nuevo archivo para GitHub Pages
```

### Scripts de testing creados (no committed)
```
test-api-subdomain.js              - Verificar api.stickywork.com
test-stickywork-com.js             - Verificar backend stickywork.com
check-lafamiglia-stickywork.js     - Verificar negocio La Famiglia
```

### Documentación
```
.claude/sessions/sesion-23-12-2025-migracion-dns-y-zonas.md  (este archivo)
```

---

## 13. Próximos Pasos Recomendados

### Limpieza (Opcional)
- ✅ Eliminar `stickywork.com` de Railway (ya no necesario, solo usar `api.stickywork.com`)
- ✅ Limpiar scripts de testing temporales del directorio raíz
- ✅ Documentar variables de entorno de Railway en un lugar seguro

### Mejoras Futuras
- [ ] Configurar CDN (Cloudflare) delante de GitHub Pages para mejor rendimiento
- [ ] Agregar monitoreo (UptimeRobot) para api.stickywork.com
- [ ] Implementar staging environment (staging.stickywork.com)
- [ ] Agregar tests automáticos en GitHub Actions

### Seguridad
- [ ] Habilitar 2FA en cuenta de Railway
- [ ] Habilitar 2FA en cuenta de Porkbun
- [ ] Rotar secrets de JWT en producción periódicamente
- [ ] Revisar logs de Railway regularmente

---

## 14. Contactos y Credenciales

### GitHub
- Usuario: vrodriguezbernal95
- Repositorio: stickywork.github.io
- Branch principal: master

### Railway
- Proyecto: selfless-success
- Servicios: 2 (backend + MySQL)
- Plan: Hobby (límite de 3 dominios personalizados)

### Porkbun
- Dominio: stickywork.com
- Registrado: (verificar en dashboard)
- Renovación: (verificar en dashboard)

### Base de Datos Producción
- Host: api.stickywork.com
- Database: railway (MySQL)
- Usuarios de prueba:
  - admin@lafamiglia.demo / lafamiglia2024 (Restaurante)
  - admin@bellavista.demo / demo123 (Peluquería)

---

## 15. Notas Finales

### Lecciones Aprendidas

1. **Siempre verificar qué backend está usando el frontend**
   - GitHub Pages puede cachear archivos
   - Usar DevTools Network tab para verificar URLs llamadas

2. **DNS tarda en propagar**
   - Porkbun: 5-15 minutos típicamente
   - Railway SSL: 5-10 minutos adicionales
   - Usar `nslookup` para verificar propagación

3. **Caché del navegador puede ser engañoso**
   - Siempre hacer hard refresh después de cambios
   - Usar modo incógnito para testing
   - Verificar con `curl` desde terminal para estar seguro

4. **GitHub Pages limitations**
   - Archivos estáticos solamente
   - No server-side rendering
   - Límite de 100GB bandwidth/mes (suficiente para la mayoría)
   - Despliegue automático tarda 30-60 segundos

5. **Railway limitations**
   - Plan Hobby: 3 dominios personalizados máximo
   - Plan Hobby: $5/mes de recursos incluidos
   - Dormir servicios después de inactividad (solo en plan gratuito)

### Estado Final

✅ **Frontend:** GitHub Pages funcionando en stickywork.com
✅ **Backend:** Railway funcionando en api.stickywork.com
✅ **DNS:** Configurado correctamente en Porkbun
✅ **Login:** Funcionando correctamente
✅ **Zonas:** Visibles y editables para La Famiglia
✅ **Código:** Todos los cambios committed y pusheados
✅ **Documentación:** Completa y guardada

**Sistema 100% operacional** 🚀

---

**Fecha:** 23 de diciembre de 2025
**Duración de sesión:** ~2 horas
**Commits realizados:** 5
**Bugs corregidos:** 2 (visibilidad zonas + renderizado objetos)
**Migración:** Completada exitosamente
