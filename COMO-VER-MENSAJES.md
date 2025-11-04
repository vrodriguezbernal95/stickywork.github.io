# 📧 Cómo Ver los Mensajes de Contacto

## ✅ Sistema Completo Implementado

He agregado un **sistema completo** para gestionar los mensajes del formulario de contacto.

---

## 🌐 Página de Administración

### Ver todos los mensajes:
```
http://localhost:3000/admin-mensajes.html
```

Esta página te muestra:
- ✅ **Estadísticas** - Total, sin leer, leídos, respondidos
- ✅ **Filtros** - Por estado (todos, sin leer, leídos, respondidos)
- ✅ **Lista de mensajes** - Con toda la información
- ✅ **Acciones** - Marcar como leído, respondido o eliminar

---

## 🧪 Probar el Sistema

### 1. Enviar un mensaje de prueba
```
http://localhost:3000/contacto.html
```

Completa el formulario y envíalo. Los datos se guardarán en la base de datos.

### 2. Ver el mensaje
```
http://localhost:3000/admin-mensajes.html
```

Verás tu mensaje aparecer en la lista con estado "Sin Leer".

---

## 🎨 Características del Panel de Admin

### Estadísticas en Tiempo Real
- Total de mensajes recibidos
- Mensajes sin leer
- Mensajes leídos
- Mensajes respondidos

### Filtros
- **Todos** - Ver todos los mensajes
- **Sin Leer** - Solo mensajes nuevos
- **Leídos** - Mensajes que ya revisaste
- **Respondidos** - Mensajes que ya atendiste

### Información de Cada Mensaje
- 👤 Nombre del contacto
- ✉️ Email
- 📞 Teléfono (si lo proporcionó)
- 🏢 Nombre del negocio (si lo proporcionó)
- 📋 Tipo de negocio
- 🎯 Área de interés
- 💬 Mensaje completo
- 📅 Fecha y hora de envío

### Acciones Disponibles
- ✓ **Marcar como Leído** - Para mensajes sin leer
- 💬 **Marcar como Respondido** - Cuando ya lo hayas atendido
- 🗑️ **Eliminar** - Borrar el mensaje permanentemente

---

## 🔧 API REST de Mensajes de Contacto

También tienes acceso directo a la API:

### Obtener todos los mensajes
```bash
curl http://localhost:3000/api/contact
```

### Obtener solo mensajes sin leer
```bash
curl http://localhost:3000/api/contact?status=unread
```

### Obtener un mensaje específico
```bash
curl http://localhost:3000/api/contact/1
```

### Marcar mensaje como leído
```bash
curl -X PATCH http://localhost:3000/api/contact/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "read"}'
```

### Marcar mensaje como respondido
```bash
curl -X PATCH http://localhost:3000/api/contact/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "replied"}'
```

### Eliminar mensaje
```bash
curl -X DELETE http://localhost:3000/api/contact/1
```

---

## 💾 Dónde se Guardan los Mensajes

Los mensajes se guardan en la **tabla `contact_messages`** de tu base de datos SQLite.

**Ubicación:** `stickywork.db` (en la raíz del proyecto)

### Estructura de la tabla:
- `id` - ID único del mensaje
- `name` - Nombre del contacto
- `email` - Email del contacto
- `phone` - Teléfono (opcional)
- `business_name` - Nombre del negocio (opcional)
- `business_type` - Tipo de negocio (opcional)
- `interest` - Área de interés (opcional)
- `message` - Mensaje completo
- `status` - Estado: `unread`, `read`, `replied`
- `created_at` - Fecha de creación
- `updated_at` - Fecha de última actualización

---

## 🔍 Ver los Mensajes con DB Browser

1. Descarga **DB Browser for SQLite**: https://sqlitebrowser.org/
2. Abre el archivo `stickywork.db`
3. Ve a la pestaña "Browse Data"
4. Selecciona la tabla "contact_messages"

¡Verás todos tus mensajes ahí!

---

## 📝 Flujo Completo

### Usuario:
1. Va a: http://localhost:3000/contacto.html
2. Completa el formulario
3. Hace clic en "Enviar Mensaje"
4. Recibe confirmación con ID del mensaje

### Administrador (Tú):
1. Vas a: http://localhost:3000/admin-mensajes.html
2. Ves el nuevo mensaje con badge "Sin Leer"
3. Lees el mensaje
4. Marcas como "Leído"
5. Respondes al cliente por email
6. Marcas como "Respondido"
7. (Opcional) Eliminas el mensaje si ya no lo necesitas

---

## 🚀 Resumen Rápido

**Para enviar mensaje:**
http://localhost:3000/contacto.html

**Para ver mensajes:**
http://localhost:3000/admin-mensajes.html

**Para pruebas de API:**
http://localhost:3000/test-api.html

---

## ✨ Lo Que Cambió

**ANTES:**
- Formulario mostraba solo un `alert()`
- No se guardaban los datos en ninguna parte

**AHORA:**
- ✅ Formulario envía datos a la API
- ✅ Datos se guardan en base de datos SQLite
- ✅ Panel de admin para gestionar mensajes
- ✅ Filtros por estado
- ✅ Estadísticas en tiempo real
- ✅ Acciones para marcar como leído/respondido
- ✅ API REST completa

---

## 🎊 ¡Todo Listo!

El sistema de mensajes de contacto está **100% funcional**.

**Pruébalo ahora:**
1. Abre: http://localhost:3000/contacto.html
2. Envía un mensaje de prueba
3. Abre: http://localhost:3000/admin-mensajes.html
4. ¡Ve tu mensaje aparecer!

¿Necesitas algo más? 😊
