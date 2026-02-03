# Histórico de Desarrollo - Semana 06/2026

**Período:** 2-8 de febrero de 2026
**Rama de trabajo:** `master` (producción)

---

## Objetivo de la Semana

**Gestión Avanzada de Clientes y Reservas Recurrentes**

Implementar herramientas para que los negocios puedan gestionar mejor sus clientes habituales y automatizar la creación de citas recurrentes.

---

## Sesión 1: 02-feb-2026 - Sistema de Clientes Premium/VIP

### Completado

**1. Nueva tabla `customers` en la base de datos**
- Migración ejecutada en producción via endpoint `/api/debug/run-customers-migration`
- Estructura:
  ```sql
  CREATE TABLE customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      is_premium BOOLEAN DEFAULT FALSE,
      notes TEXT,
      total_bookings INT DEFAULT 0,
      last_booking_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_customer (business_id, email, phone),
      INDEX idx_business (business_id),
      INDEX idx_premium (business_id, is_premium),
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );
  ```

**2. Backend - 6 endpoints CRUD para gestión de clientes**
- `GET /api/customers/:businessId` - Lista con filtros (premium, búsqueda, ordenamiento)
- `GET /api/customers/:businessId/:customerId` - Detalle con historial de reservas
- `POST /api/customers/:businessId` - Crear cliente manualmente
- `PATCH /api/customers/:businessId/:customerId` - Actualizar (marcar premium, notas)
- `DELETE /api/customers/:businessId/:customerId` - Eliminar cliente
- `POST /api/customers/:businessId/sync` - Sincronizar clientes desde reservas existentes

**3. Auto-detección de clientes al crear reservas**
- Modificado `POST /api/bookings` para crear/actualizar registro de cliente automáticamente
- Si el cliente existe (mismo email+phone): incrementa `total_bookings` y actualiza `last_booking_date`
- Si no existe: crea nuevo registro en `customers`

**4. Frontend - Nueva sección "Clientes" en el dashboard**
- Creado módulo `admin/js/clients.js` completo
- Vista de tabla con: Nombre, Email, Teléfono, Total reservas, Última reserva, Estado Premium
- Filtros: Todos / Solo Premium / Solo Normales
- Búsqueda por nombre, email o teléfono
- Acciones por cliente:
  - Ver detalle con historial de reservas (modal)
  - Toggle rápido Premium/Normal
  - Editar información y notas
  - Eliminar

**5. Badge VIP en reservas**
- Modificado `GET /api/bookings/:businessId` para incluir `customer_is_premium` (JOIN con customers)
- Modificado `bookings.js` para mostrar badge dorado "VIP" junto al nombre del cliente
- CSS del badge:
  ```css
  .badge-vip {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
  }
  ```

**6. Fix: Error de collation en MySQL**
- Problema: `Illegal mix of collations (utf8mb4_0900_ai_ci,IMPLICIT) and (utf8mb4_unicode_ci,IMPLICIT)`
- Causa: Tabla `customers` creada con collation diferente a `bookings`
- Solución: Añadido `COLLATE utf8mb4_unicode_ci` en el JOIN del query de bookings

### Archivos creados:
- `admin/js/clients.js` - Módulo completo de gestión de clientes (500+ líneas)

### Archivos modificados:
- `backend/routes.js` - Migración + endpoints de clientes + auto-detección + fix collation
- `admin-dashboard.html` - Enlace "Clientes" en sidebar + carga de script
- `admin/js/app.js` - Routing para sección "clients"
- `admin/js/bookings.js` - Badge VIP en tabla de reservas + CSS

### Commits:
- `338a53b` - feat: Sistema de Clientes Premium/VIP
- `c7bc42c` - fix: Corregir error collation en JOIN customers/bookings

---

## Sesión 2: 02-feb-2026 - Sistema de Citas Recurrentes

### Completado

**1. Backend - Endpoints para repetir y reprogramar citas**

**POST /api/booking/:id/repeat** - Repetir una cita para semanas futuras
- Parámetros: `frequency` (1-4 semanas), `repetitions` (1-12 citas)
- Crea múltiples reservas con los mismos datos pero fechas diferentes
- Cada cita creada es independiente (status: confirmed)
- Actualiza estadísticas del cliente automáticamente

**PATCH /api/booking/:id/reschedule** - Cambiar fecha/hora de una cita
- Parámetros: `booking_date`, `booking_time`
- Permite modificar cualquier cita individualmente
- Validaciones de permisos (acceso al negocio)

**2. Frontend - Nuevos botones de acción en reservas**

**Botón "Repetir" (morado)**
- Modal con interfaz visual de botones (no dropdowns)
- Selector de frecuencia: 1 sem, 2 sem, 3 sem, 4 sem
- Selector de cantidad: 2, 4, 6, 8, 12 citas
- Vista previa de las fechas que se crearán
- Confirmación antes de crear

**Botón "Reprogramar" (naranja)**
- Modal con inputs de fecha y hora
- Pre-cargado con fecha/hora actual de la cita
- Guardado inmediato

**3. Mejora de UI del modal de repetir**
- Problema inicial: Los dropdowns `<select>` tenían colores que no combinaban con tema oscuro
- Solución: Reemplazados por botones visuales con estados activo/inactivo
- Estilo consistente con el tema (morado para selección activa)

### Archivos modificados:
- `backend/routes.js` - Endpoints repeat y reschedule
- `admin/js/bookings.js` - Botones, modales y lógica de repetir/reprogramar + CSS

### Commits:
- `bfb438e` - feat: Repetir y reprogramar citas
- `a23f397` - fix: Mejorar UI del modal de repetir cita con botones en lugar de selects

---

## Resumen de Features Implementadas

### Sistema de Clientes Premium/VIP
| Feature | Estado |
|---------|--------|
| Tabla customers en BD | ✅ |
| Endpoints CRUD | ✅ |
| Sección Clientes en dashboard | ✅ |
| Sincronizar desde reservas | ✅ |
| Marcar/desmarcar Premium | ✅ |
| Badge VIP en reservas | ✅ |
| Auto-detección al crear reserva | ✅ |
| Notas por cliente | ✅ |
| Historial de reservas | ✅ |

### Sistema de Citas Recurrentes
| Feature | Estado |
|---------|--------|
| Repetir cita (1-4 semanas) | ✅ |
| Hasta 12 repeticiones | ✅ |
| Vista previa de fechas | ✅ |
| Reprogramar fecha/hora | ✅ |
| Citas independientes | ✅ |
| UI con botones visuales | ✅ |

---

## Cómo usar las nuevas funcionalidades

### Gestión de Clientes
1. Ir a **Dashboard → Clientes**
2. Click en **"Sincronizar desde Reservas"** para importar clientes existentes
3. Marcar clientes frecuentes como **Premium** con el botón ☆/★
4. Ver historial de reservas de cada cliente
5. Añadir notas (ej: "Prefiere horario de tarde", "Alergia a X producto")

### Repetir Citas
1. En **Reservas**, encontrar la cita a repetir
2. Click en botón **🔄** (morado)
3. Seleccionar frecuencia (cada cuántas semanas)
4. Seleccionar cantidad de citas a crear
5. Revisar vista previa y confirmar

### Reprogramar Citas
1. En **Reservas**, encontrar la cita a mover
2. Click en botón **📅** (naranja)
3. Cambiar fecha y/o hora
4. Guardar

---

## Stack Tecnológico (sin cambios)

- **Backend:** Node.js + Express + MySQL (Railway)
- **Frontend:** Vanilla JS
- **Hosting:** Railway (API) + GitHub Pages (Frontend)

---

## Sesión 3: 03-feb-2026 - Páginas Públicas de Reservas

### Contexto
Continuación del trabajo iniciado previamente en las páginas públicas de reservas para negocios sin web propia. En esta sesión se solucionaron errores y se añadieron mejoras.

### Completado

**1. Migración de columna `public_page_settings`**
- Ejecutada migración en producción via `node run-public-page-migration.js`
- Añadida columna JSON a tabla `businesses` para configuración de página pública

**2. Fix: Error 500 en endpoint `/api/public/business/:slug`**
- **Problema:** El endpoint usaba `active = 1` pero la columna correcta es `is_active`
- **Error:** `Unknown column 'active' in 'where clause'`
- **Solución:** Cambiado a `is_active = TRUE` en el query de servicios
- **Archivo:** `backend/routes.js:2254`

**3. SEO: Añadido noindex a páginas de reservas**
- Añadida meta tag `<meta name="robots" content="noindex, nofollow">`
- **Motivo:** Son páginas funcionales, no de contenido. Evita diluir autoridad SEO del dominio principal
- **Archivo:** `reservar.html`

**4. Nueva funcionalidad: Código QR descargable**
- Añadida sección de código QR en **Dashboard → Configuración → Mi Página**
- El QR se genera automáticamente con la URL de reservas del negocio
- Botón "Descargar QR" que guarda la imagen como PNG
- Nombre del archivo: `QR-[NombreNegocio].png`
- Uso de API externa: `api.qrserver.com` (sin dependencias de librerías)
- **Archivo:** `admin/js/settings.js`

### Archivos modificados:
- `backend/routes.js` - Fix columna is_active en query de servicios
- `reservar.html` - Meta noindex, nofollow
- `admin/js/settings.js` - Sección QR + función downloadQRCode()

### Commits:
- `54829ad` - fix: Corregir columna active -> is_active en endpoint público
- `3658d08` - chore: Añadir noindex a páginas públicas de reservas
- `0891c47` - feat: Añadir código QR descargable en Mi Página

---

## Resumen Páginas Públicas de Reservas

| Feature | Estado |
|---------|--------|
| URL personalizable (slug) | ✅ |
| Página pública funcional | ✅ |
| Activar/desactivar página | ✅ |
| Configurar qué mostrar (teléfono, dirección, web, horarios) | ✅ |
| Copiar URL al portapapeles | ✅ |
| Código QR generado automáticamente | ✅ |
| Descargar QR como imagen | ✅ |
| SEO noindex (evita indexación) | ✅ |

### Cómo usar el QR
1. Ir a **Dashboard → Configuración → Mi Página**
2. El código QR aparece automáticamente con tu URL
3. Click en **"Descargar QR"** para guardar la imagen
4. Imprimir y colocar en:
   - Mostrador del local
   - Tarjetas de visita
   - Folletos / flyers
   - Escaparate / ventana

---

## Sesión 4: 03-feb-2026 - Sesiones Múltiples en Talleres

### Contexto
Cada taller era un evento único con una sola fecha/hora. Los negocios que querían ofrecer el mismo taller en diferentes horarios tenían que duplicar toda la información. Se implementó un sistema donde cada taller es un "concepto" con múltiples sesiones independientes.

### Completado

**1. Nueva tabla `workshop_sessions` en la base de datos**
- Migración ejecutada en producción via endpoint `/api/debug/run-workshop-sessions-migration`
- Estructura:
  ```sql
  CREATE TABLE workshop_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      workshop_id INT NOT NULL,
      session_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      capacity INT NOT NULL DEFAULT 10,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
  );
  ```
- Migración automática de talleres existentes: cada taller se convirtió en 1 sesión
- Añadida columna `session_id` a `workshop_bookings` para vincular reservas a sesiones
- Bookings existentes vinculados a sus sesiones migradas

**2. Backend - Reescritura completa de `backend/routes/workshops.js`**

Endpoints públicos (widget):
- `GET /api/workshops/public/:businessId` - Talleres con sesiones anidadas (solo futuras con plazas)
- `POST /api/workshops/book-session/:sessionId` - Reservar por sesión específica
- `POST /api/workshops/book/:workshopId` - Backward compat (busca primera sesión disponible)

Endpoints admin:
- `GET /api/workshops` - Lista con conteo de sesiones y próxima fecha
- `GET /api/workshops/:id` - Detalle con array de sesiones y disponibilidad
- `POST /api/workshops` - Crear taller con array `sessions[]`
- `PUT /api/workshops/:id` - Upsert de sesiones (con id=update, sin id=insert, ausentes=delete si no tienen reservas)
- `DELETE /api/workshops/:id` - Verificar reservas activas a través de sesiones
- `PATCH /api/workshops/:id/toggle` - Activar/desactivar
- `GET /api/workshops/:id/bookings` - Reservas con info de sesión
- `PATCH /api/workshops/bookings/:bookingId/status` - Cambiar estado de reserva

**3. Frontend Admin - Reescritura de `admin/js/workshops.js`**
- Formulario con sección dinámica de sesiones
- Botón "+ Añadir Sesión" para agregar filas (fecha + hora inicio + hora fin + capacidad + eliminar)
- Mínimo 1 sesión obligatoria
- Tarjetas muestran "X sesiones | Próxima: fecha" en vez de fecha única
- Modal de reservas incluye columna "Sesión" con fecha y horario

**4. Widget - Modificación de `widget/stickywork-widget.js`**
- Tarjeta por taller con lista de sesiones seleccionables dentro
- Cada sesión muestra: fecha, horario, plazas disponibles
- Sesiones completas aparecen deshabilitadas
- `selectSession(workshopId, sessionId)` reemplaza a `selectWorkshop(workshopId)`
- Submit envía a `/api/workshops/book-session/:sessionId`
- Backward compat: si no hay sesiones, funciona con formato legacy

**5. Fix crítico: Query `IN (?)` con mysql2 `execute()`**
- **Problema:** `config/database-mysql.js` usa `connection.execute()` (prepared statements) que NO expande arrays en `IN (?)`
- **Síntoma:** Talleres existían pero sesiones devolvía 0 resultados (`workshopsFound: 3, sessionsFound: 0`)
- **Causa raíz:** `[workshopIds]` con `workshopIds = [2,3,4]` se pasaba como un solo parámetro
- **Solución:** Generar placeholders dinámicos: `IN (${ids.map(() => '?').join(',')})` con `...ids` como parámetros
- **Archivos afectados:** `backend/routes/workshops.js` (endpoint público + endpoint PUT)

### Archivos modificados:
- `backend/routes/workshops.js` - Reescritura completa (~850 líneas)
- `admin/js/workshops.js` - Reescritura completa con UI de sesiones
- `widget/stickywork-widget.js` - Selección de sesiones + backward compat
- `backend/routes.js` - Endpoint de migración

### Archivos creados:
- `run-workshop-sessions-migration.js` - Script para ejecutar migración

### Commits:
- `38a62f8` - feat: Sesiones múltiples para talleres (DB + backend + admin + widget)
- `0ec7ae7` - fix: Corregir query IN(?) para sesiones de talleres

---

## Resumen Sesiones Múltiples en Talleres

| Feature | Estado |
|---------|--------|
| Tabla workshop_sessions en BD | ✅ |
| Migración automática de datos existentes | ✅ |
| Crear taller con múltiples sesiones | ✅ |
| Editar/añadir/eliminar sesiones | ✅ |
| Reservar por sesión específica | ✅ |
| Plazas independientes por sesión | ✅ |
| Widget con selección de sesión | ✅ |
| Backward compat (formato legacy) | ✅ |
| Fix query IN(?) con mysql2 | ✅ |

### Cómo usar sesiones múltiples
1. Ir a **Dashboard → Talleres**
2. Crear nuevo taller o editar existente
3. En la sección **Sesiones**, añadir fechas y horarios
4. Cada sesión tiene su propia capacidad
5. En la web pública, el cliente elige la sesión que le conviene
6. Las plazas se gestionan de forma independiente por sesión

---

## Próximas tareas sugeridas

1. **Notificaciones por email** al cliente cuando se crean citas repetidas
2. **Filtrar reservas** por cliente Premium/Normal
3. **Estadísticas de clientes** (retención, frecuencia de visitas)
4. **Recordatorios automáticos** para clientes que no vienen hace X tiempo

---

**Última actualización:** 03-feb-2026
**Próxima revisión:** 09-feb-2026 (inicio semana 07)
