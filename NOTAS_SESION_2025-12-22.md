# Notas de Sesión - 22 Diciembre 2025

## Contexto
Sesión de continuación para arreglar problemas reportados en el sistema de reservas de restaurantes.

## Problemas Reportados

### 1. No se puede cancelar reserva desde dashboard
**Error**: "Unknown column 'cancellation_date' in 'field list'"
**Causa**: Migración 012 no ejecutada en Railway (producción)

### 2. Panel de reservas canceladas no funciona
**Error**: Modal se abre pero muestra "No hay reservas canceladas"
**Causa**: Endpoint devolvía datos en formato incorrecto

### 3. Botones +/- para número de personas no funcionan
**Causa**: Múltiples issues en el widget

### 4. No se ve número de personas en dashboard
**Causa**: Campo no mostrado en la tabla

### 5. Confusión entre servicios y zonas
**Problema**: El sistema mezclaba "Servicio" (Comida/Cena) con "Zona" (Terraza/Interior)
**Usuario reportó**: "en el formulario antes ponia zona preferida terraza o local, esto debería poder modificarse... ahora en vez de terraza local, pone comida o cena... has mezclado conceptos"

---

## Soluciones Implementadas

### 1. Cancelación de Reservas ✅

**Cambios en Base de Datos:**
- Ejecutada migración 012 en Railway
- Agregados campos:
  - `cancellation_reason` (TEXT)
  - `cancellation_date` (DATETIME)
  - `viewed_by_admin` (BOOLEAN)

**Backend** (`backend/routes.js` líneas 610-688):
```javascript
// Endpoint PATCH /api/booking/:id - Agregar razón de cancelación
if (status === 'cancelled') {
    await db.query(
        `UPDATE bookings
         SET status = ?,
             cancellation_date = NOW(),
             cancellation_reason = ?,
             viewed_by_admin = FALSE
         WHERE id = ?`,
        [status, cancellation_reason || null, id]
    );
}

// Endpoint GET /api/bookings/:businessId/cancelled-future
// Retorna solo reservas canceladas futuras ordenadas por viewed_by_admin
```

**Frontend** (`admin/js/dashboard.js` líneas 587-815):
- Modal para visualizar reservas canceladas futuras
- Fix: `response.bookings` → `response.data`
- Fix: `this.loadStats()` → `this.load()`

**Frontend** (`admin/js/bookings.js` líneas 359-498):
- Modal personalizado para cancelación con campo de razón
- Devuelve Promise con `{reason: string}` o `null`

---

### 2. Sistema de Personas y Zonas ✅

#### Problema Inicial
El widget mostraba:
- Servicio (Comida/Cena) ❌ No necesario (se deduce por hora)
- Personas (+/-) ⚠️ No funcionaba
- Zona (mostraba Comida/Cena en vez de Terraza/Interior) ❌

#### Solución Final

**Widget** (`widget/stickywork-widget.js`):

1. **Eliminado selector de servicio** (líneas 619-647)
   - Ya no pide al usuario que seleccione Comida o Cena
   - Se asignará automáticamente en el backend

2. **Arreglado contador de personas** (línea 848)
   ```javascript
   // ANTES: formData.numPeople = parseInt(form.numPeople.value) || 2;
   // AHORA: formData.numPeople = peopleCount; // Variable directa
   ```

3. **Zona separada de servicios** (líneas 621-627)
   ```javascript
   const zoneOptions = config.restaurantZones && config.restaurantZones.length > 0
       ? config.restaurantZones.map(z => `<option value="${z.name}">${z.name}</option>`).join('')
       : `
           <option value="Interior">Interior</option>
           <option value="Terraza">Terraza</option>
       `;
   ```

4. **BUG CRÍTICO - submitBooking** (líneas 796-807)
   **Problema**: La función NO enviaba `num_people` ni `zone` al backend
   ```javascript
   // AGREGADO:
   num_people: formData.numPeople || 2,
   zone: formData.zone || null,
   ```

**Backend** (`backend/routes.js`):

1. **Auto-asignación de servicio por hora** (líneas 385-424)
   ```javascript
   if (scheduleType === 'multiple' && bookingSettings.shifts) {
       // Encontrar turno que coincida con la hora
       let matchedShift = null;
       for (const shift of bookingSettings.shifts) {
           if (shift.enabled && isTimeInRange(bookingTime, shift.startTime, shift.endTime)) {
               matchedShift = shift;
               break;
           }
       }

       // Auto-asignar servicio basado en el nombre del turno
       if (bookingSettings.bookingMode === 'tables' && !autoAssignedServiceId) {
           const services = await db.query(
               'SELECT id, name FROM services WHERE business_id = ? AND is_active = TRUE',
               [businessId]
           );

           // Buscar servicio que coincida: "Comidas" → "Comida"
           const matchingService = services.find(s =>
               s.name.toLowerCase().includes(matchedShift.name.toLowerCase().replace(/s$/, '')) ||
               matchedShift.name.toLowerCase().includes(s.name.toLowerCase())
           );

           if (matchingService) {
               autoAssignedServiceId = matchingService.id;
           }
       }
   }
   ```

2. **Guardar campo zone** (líneas 334-335, 459-461)
   ```javascript
   // Extraer zone del request
   const zone = req.body.zone || null;

   // Guardar en INSERT
   INSERT INTO bookings (..., num_people, zone, notes, ...)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
   ```

3. **Remover mapeo incorrecto services→zones** (líneas 1070-1073)
   ```javascript
   // ANTES:
   const zones = bookingMode === 'tables' ? services.map(...) : [];

   // AHORA:
   const restaurantZones = bookingMode === 'tables' && bookingSettings.restaurantZones
       ? bookingSettings.restaurantZones
       : [];
   ```

4. **Retornar services para restaurantes** (línea 1108)
   ```javascript
   // ANTES: services: bookingMode === 'services' ? services : [],
   // AHORA:
   services: (bookingMode === 'services' || bookingMode === 'tables') ? services : [],
   ```

**Dashboard** (`admin/js/bookings.js`):

1. **Agregada columna "Personas"** (línea 73, 177-181)
   ```html
   <th>Personas</th>

   <td style="text-align: center; font-weight: 600;">
       <span style="background: rgba(59, 130, 246, 0.1); padding: 0.25rem 0.5rem; border-radius: 6px; color: #3b82f6;">
           👥 ${booking.num_people || 2}
       </span>
   </td>
   ```

2. **Agregada columna "Zona"** (línea 74, 182-187)
   ```html
   <th>Zona</th>

   <td style="text-align: center;">
       ${booking.zone
           ? `<span style="background: rgba(16, 185, 129, 0.1); padding: 0.25rem 0.5rem; border-radius: 6px; color: #10b981; font-weight: 500;">${booking.zone}</span>`
           : '<span style="color: var(--text-secondary); font-size: 0.9rem;">-</span>'
       }
   </td>
   ```

**Configuración Base de Datos** (Railway):
```javascript
// Agregadas zonas a La Famiglia (business_id 9)
booking_settings: {
    "shifts": [
        {"id": 1, "name": "Comidas", "enabled": true, "startTime": "12:00", "endTime": "15:00"},
        {"id": 2, "name": "Cenas", "enabled": true, "startTime": "20:00", "endTime": "23:00"}
    ],
    "workDays": [1, 2, 3, 4, 5, 6, 7],
    "bookingMode": "tables",
    "scheduleType": "multiple",
    "slotDuration": 30,
    "restaurantZones": [
        {"name": "Terraza", "capacity": 30},
        {"name": "Interior", "capacity": 50}
    ]
}
```

---

## Commits Realizados

### Commit 1: `794326e`
```
fix: Retornar servicios para restaurantes en widget API

- Modificar GET /api/widget/:businessId para incluir services cuando bookingMode='tables'
- Ahora restaurantes pueden mostrar opciones de servicio (Comida, Cena) en el widget
- Mantiene compatibilidad con zones para gestión de mesas
```

### Commit 2: `9011955`
```
fix: Guardar número de personas en reservas

- Agregar campo num_people al INSERT de reservas
- Extraer numPeople del request body del widget
- Default: 2 personas si no se especifica
```

### Commit 3: `855d92f`
```
fix: Separar servicios y zonas para restaurantes

Widget changes:
- Agregar selector de servicio (Comida/Cena) para restaurantes
- Usar restaurantZones para selector de zona (Terraza/Interior)
- Enviar service_id y zone por separado al backend

Backend changes:
- Eliminar mapeo incorrecto de services→zones
- Guardar campo zone en reservas
- Retornar restaurantZones desde booking_settings
- Extraer zone del request body
```

### Commit 4: `57c9b1a`
```
fix: Mejorar sistema de reservas de restaurantes

Widget changes:
- Quitar selector de servicio (se asigna automáticamente por hora)
- Usar variable peopleCount directamente (más confiable)
- Mostrar solo personas y zona en formulario

Backend changes:
- Auto-asignar service_id basado en el turno/hora de reserva
- Para "Comidas" (12:00-15:00) → asigna servicio "Comida"
- Para "Cenas" (20:00-23:00) → asigna servicio "Cena"
- Guardar campo zone correctamente

Dashboard changes:
- Agregar columna "Zona" con badge verde
- Mostrar Terraza, Interior, o "-" si no hay zona
```

### Commit 5: `51b3181` ⭐ CRÍTICO
```
fix: Enviar num_people y zone al backend desde el widget

Bug crítico: La función submitBooking() mapeaba los campos del formulario
pero NO incluía num_people y zone en el objeto bookingData que se envía
al backend.

Resultado: El backend siempre recibía undefined y usaba el default (2 personas).

Cambios:
- Agregar num_people: formData.numPeople || 2
- Agregar zone: formData.zone || null

Ahora SÍ se envía el número correcto de personas y la zona seleccionada.
```

---

## Estado Final del Sistema

### Widget para Restaurantes
Muestra **solo 2 campos**:
1. ✅ **Número de personas** (contador +/- de 1 a 20)
2. ✅ **Zona preferida** (dropdown: Terraza/Interior)

### Backend
- ✅ Auto-asigna servicio según hora de reserva
- ✅ Guarda `num_people` correctamente
- ✅ Guarda `zone` correctamente
- ✅ Valida horarios según turnos configurados

### Dashboard
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| ID | Número de reserva | #18 |
| Cliente | Nombre | Juan Pérez |
| Email | Email del cliente | juan@email.com |
| Teléfono | Teléfono | 612345678 |
| **Servicio** | Auto-asignado por hora | Cena ✅ |
| **Personas** | Badge azul con número | 👥 5 ✅ |
| **Zona** | Badge verde | 🟢 Terraza ✅ |
| Fecha | Fecha reserva | 25/12/2024 |
| Hora | Hora reserva | 21:00 |
| Estado | Badge estado | Pendiente |
| Acciones | Botones | Confirmar/Cancelar |

---

## Ejemplo de Flujo Completo

### Usuario hace reserva:
1. Entra al widget del restaurante
2. Selecciona fecha: 25/12/2024
3. Selecciona hora: 21:00 (está en turno "Cenas" 20:00-23:00)
4. Click en + para poner 5 personas
5. Selecciona zona: Terraza
6. Completa datos personales
7. Click en "Reservar"

### Backend procesa:
1. Recibe: `{date: "2024-12-25", time: "21:00", num_people: 5, zone: "Terraza"}`
2. Valida que 21:00 está en turno "Cenas" (20:00-23:00) ✅
3. Encuentra servicio "Cena" que coincide con turno "Cenas"
4. Auto-asigna `service_id = 39` (Cena)
5. Guarda reserva:
   ```sql
   INSERT INTO bookings
   (business_id, service_id, num_people, zone, booking_date, booking_time, ...)
   VALUES (9, 39, 5, 'Terraza', '2024-12-25', '21:00', ...)
   ```

### Dashboard muestra:
```
| #18 | Juan Pérez | ... | Cena | 👥 5 | 🟢 Terraza | 25/12/2024 | 21:00 | Pendiente |
```

---

## Archivos Modificados

### Backend
- `backend/routes.js`
  - Líneas 334-335: Extraer zone del request
  - Líneas 385-424: Auto-asignar service_id por hora
  - Líneas 459-461: INSERT con num_people y zone
  - Líneas 610-688: Endpoints de cancelación
  - Líneas 1070-1073: Remover mapeo services→zones
  - Línea 1108: Retornar services para restaurantes

### Frontend Admin
- `admin/js/dashboard.js`
  - Líneas 587-815: Modal reservas canceladas
  - Línea 597: Fix response.data
  - Línea 781: Fix this.load()

- `admin/js/bookings.js`
  - Líneas 73-74: Headers Personas y Zona
  - Líneas 177-187: Celdas con badges
  - Líneas 359-498: Modal cancelación personalizado

### Widget
- `widget/stickywork-widget.js`
  - Líneas 619-647: Remover selector servicio, simplificar campos restaurante
  - Líneas 796-807: **FIX CRÍTICO** - Enviar num_people y zone
  - Línea 848: Usar peopleCount directamente

### Base de Datos
- Migración 012 ejecutada en Railway
- `booking_settings` actualizado para La Famiglia con `restaurantZones`

---

## Testing Realizado

✅ Reserva con 5 personas → Se guarda correctamente
✅ Reserva a las 13:00 → Auto-asigna "Comida"
✅ Reserva a las 21:00 → Auto-asigna "Cena"
✅ Selección zona "Terraza" → Se guarda correctamente
✅ Dashboard muestra todos los campos correctamente
✅ Cancelación con razón → Funciona
✅ Modal reservas canceladas → Muestra correctamente

---

## Tareas Pendientes

- [ ] UI en dashboard para configurar zonas de restaurante
  - Actualmente las zonas están hardcodeadas en `booking_settings`
  - Permitir al admin agregar/editar/eliminar zonas desde Settings
  - Ejemplo: Terraza, Interior, Sala VIP, Barra, etc.

---

## Notas Técnicas

### Arquitectura de Datos para Restaurantes

**Conceptos separados:**
1. **Servicio** (service_id): Qué se ofrece (Comida, Cena, Brunch)
   - Se auto-asigna basado en la hora de reserva
   - Mapea turnos (shifts) a servicios por nombre

2. **Zona** (zone): Dónde se sienta el cliente (Terraza, Interior)
   - Campo de texto libre
   - Configurable desde `booking_settings.restaurantZones`
   - No afecta disponibilidad (solo preferencia)

3. **Personas** (num_people): Cuántos comensales
   - Entero de 1 a 20
   - Importante para preparación de mesa

### Debugging - submitBooking Bug

**Síntoma**: Siempre se guardaban 2 personas independientemente del valor seleccionado

**Diagnóstico**:
1. ✅ Widget preparaba `formData.numPeople = peopleCount` correctamente
2. ✅ Variable `peopleCount` se actualizaba con botones +/-
3. ❌ Función `submitBooking()` NO incluía `num_people` en el objeto enviado al backend

**Solución**: Agregar campos faltantes en el mapeo de datos

**Lección**: Siempre verificar que los datos del formulario se envíen completamente al backend

---

## Credenciales Railway (Ofuscadas)

**Base de Datos:**
- Host: `switchback.proxy.rlwy.net`
- Port: `26447`
- User: `root`
- Password: `[OFUSCADO]`
- Database: `railway`

**Negocio de Prueba:**
- ID: 9
- Nombre: "La Famiglia"
- Tipo: Restaurant (bookingMode: 'tables')

---

## Para Próxima Sesión

### Comandos Útiles

**Verificar última reserva:**
```javascript
const [rows] = await conn.query(
    'SELECT id, service_id, num_people, zone, booking_date, booking_time, created_at
     FROM bookings WHERE business_id = 9 ORDER BY created_at DESC LIMIT 1'
);
```

**Verificar configuración negocio:**
```javascript
const [rows] = await conn.query(
    'SELECT booking_settings FROM businesses WHERE id = 9'
);
console.log(JSON.parse(rows[0].booking_settings));
```

**Verificar widget API:**
```bash
curl https://stickywork.com/api/widget/9 | jq
```

### Estado del Repositorio
```bash
git log --oneline -5
# 51b3181 fix: Enviar num_people y zone al backend desde el widget
# 57c9b1a fix: Mejorar sistema de reservas de restaurantes
# 855d92f fix: Separar servicios y zonas para restaurantes
# 9011955 fix: Guardar número de personas en reservas
# 794326e fix: Retornar servicios para restaurantes en widget API
```

---

**Fecha**: 22 de Diciembre de 2025
**Duración**: ~3 horas
**Estado**: ✅ Completado exitosamente
**Usuario confirmó**: "ahora si!! está perfecto"
