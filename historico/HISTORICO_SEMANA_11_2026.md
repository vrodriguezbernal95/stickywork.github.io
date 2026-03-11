# Histórico de Desarrollo - Semana 11/2026

**Período:** 9-15 de marzo de 2026
**Rama de trabajo:** `master` (producción)

---

## Objetivo de la Semana

Mejoras de UX en configuración del dashboard y lógica avanzada de gestión de mesas para restaurantes.

---

## Sesión 1: 11-mar-2026 — Configuración, capacidad y mesas

### Completado

---

**1. Prefijo +34 automático en número de WhatsApp (`admin/js/settings.js`)**

- El campo "Número de WhatsApp" en Configuración → Notificaciones ahora muestra `+34` fijo a la izquierda
- El usuario solo introduce los 9 dígitos sin prefijo de país
- Al guardar se añade `34` automáticamente (strip de `+34` o `34` si el usuario los metió por error)
- Al cargar, el número almacenado (`34XXXXXXXXX`) se muestra sin el prefijo

**Commits:** `a775dfa`

---

**2. Máximo de niños por adulto en configuración de capacidad (`admin/js/settings.js` + `widget/stickywork-widget.js` + `backend/routes.js`)**

- Nuevo campo en Configuración → Capacidad → sección Adultos/Niños
- Campo: "Máximo de niños por adulto" (opcional, vacío = sin límite)
- Ejemplo: valor 2 → con 1 adulto máx 2 niños, con 2 adultos máx 4 niños
- Validación en widget (botón `+` bloqueado) y en backend (protección server-side)
- También se bloquea reducir adultos si dejaría más niños de los permitidos

**Archivos modificados:**
- `admin/js/settings.js` — UI y guardado del nuevo campo
- `widget/stickywork-widget.js` — validación en tiempo real en el widget
- `backend/routes.js` — validación server-side al crear reserva

**Commits:** `95b9326`, `b9c636c`

---

**3. Contadores de adultos/niños no editables en el widget (`widget/stickywork-widget.js`)**

- Los inputs numéricos de adultos/niños en el widget ahora son `readonly`
- Solo se pueden cambiar con los botones `+` y `-`
- CSS: `cursor: default` y `caret-color: transparent` para que no parezca un campo de texto
- Afecta solo a los contadores de adultos/niños, no al selector estándar de personas

**Commit:** `d5597a2`

---

**4. Configuración de tipos de mesas por zona en restaurantes (`admin/js/settings.js` + `backend/routes.js`)**

Nueva funcionalidad opcional en Configuración → Capacidad → Gestión de Capacidad por Zona:

**UI:**
- Cada zona tiene un checkbox "Definir tipos de mesas (opcional)"
- Al activarlo, aparece un editor con filas: `[N] mesas de [X] personas`
- La capacidad total se recalcula automáticamente
- Si no se activa, funciona igual que antes (capacidad por plazas con redondeo par)

**Lógica de backend:**
- Algoritmo **best-fit con combinación de mesas**: busca la mesa más pequeña que quepa al grupo; si no hay ninguna individual, combina mesas
- Toggle "Permitir combinar mesas" (activado por defecto): si se desactiva, cada reserva debe caber en una sola mesa
- Mensajes de error descriptivos según el caso

**Estructura de datos en `booking_settings`:**
```json
{
  "zoneTableConfig": {
    "Terraza": [
      { "capacity": 4, "count": 3 },
      { "capacity": 2, "count": 2 }
    ]
  },
  "allowTableCombining": true
}
```
> Estructura preparada para añadir coordenadas `x/y` por mesa en el futuro (plano visual)

**Archivos modificados:**
- `admin/js/settings.js` — UI editor de mesas, toggle combinar, guardado
- `backend/routes.js` — helpers `getFreeTables()` + `canSeatWithTables()` a nivel de módulo, disponibilidad y validación de reserva

**Commits:** `ba9a111`, `6f67e90`, `85d6b2c`, `d4ef13a`, `ce0b7fa`

---

### Archivos modificados esta sesión
- `admin/js/settings.js`
- `widget/stickywork-widget.js`
- `backend/routes.js`

---

## Próximas tareas pendientes

### Corto plazo
1. **Eliminar endpoint** `debug/reset-password` — temporal, sigue en routes.js (pendiente de sesiones anteriores)
2. Valorar enviar **email de confirmación** al cliente tras cambiar la hora desde el enlace

### Medio plazo — Plano visual de mesas (feature planificada)

**Descripción:** Panel interactivo para que el propietario vea y gestione el plano físico de su local.

**Funcionalidades previstas:**
- Canvas con mesas arrastrables (drag & drop)
- El propietario puede añadir/quitar mesas y modificar su capacidad
- Al guardar, se almacena la posición `x/y` de cada mesa en `booking_settings`
- Vista de ocupación en tiempo real: mesa verde (libre) / roja (ocupada)
- Click en mesa ocupada → popup con datos de quién reservó (nombre, hora, personas)
- Posibilidad de mover una reserva de mesa manualmente desde el plano

**Arquitectura prevista:**
- La estructura `zoneTableConfig` ya está preparada; solo hay que añadir `x`, `y` e `id` único por mesa
- El plano se renderizará en el dashboard (nuevo tab o modal en Configuración → Capacidad)
- En producción mostrará el estado en tiempo real consultando reservas activas del día

**Complejidad estimada:** Alta — implica canvas, persistencia de coordenadas y sincronización con reservas

---

## Stack Tecnológico (sin cambios)

- **Backend:** Node.js + Express + MySQL (Railway)
- **Frontend:** Vanilla JS
- **Hosting:** Railway (API) + GitHub Pages (Frontend)

---

**Última actualización:** 11-mar-2026
