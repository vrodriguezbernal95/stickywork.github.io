# Histórico de Desarrollo - Semana 07/2026

**Período:** 9-15 de febrero de 2026
**Rama de trabajo:** `master` (producción)

---

## Objetivo de la Semana

**Correcciones, mejoras de UX y páginas legales**

Sesión enfocada en resolver bugs acumulados, mejorar la experiencia del dashboard y completar páginas legales pendientes.

---

## Sesión 1: 09-feb-2026 - Correcciones y Mejoras Varias

### Completado

**1. Páginas legales enlazadas en el footer**
- Las 3 páginas legales ya existían (`terminos.html`, `politica-privacidad.html`, `politica-cookies.html`) pero los enlaces del footer apuntaban a `href="#"`
- Corregidos enlaces en **6 páginas**: `index.html`, `casos-exito.html`, `como-funciona.html`, `contacto.html`, `demo.html`, `planes.html`
- Cambiado meta robots a `noindex, nofollow` en las 3 páginas legales
- Corregido enlace a Términos en `politica-privacidad.html`
- Corregidos enlaces de "Acepto los Términos" en `registro.html` (con `target="_blank"`)

**2. Filtrar reservas por nivel de cliente**
- Añadidos 5 botones de filtro en la sección Reservas del dashboard: Todos, VIP, Normal, Riesgo, Baneado
- Cada botón muestra el conteo de reservas de ese nivel
- Colores consistentes con los badges existentes (dorado VIP, naranja riesgo, rojo baneado)
- El título de la tabla cambia según el filtro activo
- La paginación funciona correctamente con los filtros
- El filtro se mantiene al confirmar/cancelar/completar reservas

**3. Gráfico de Tendencia de Reservas corregido**
- **Problema:** Las barras del gráfico eran todas iguales de altas (planas) sin importar el número de reservas
- **Causa:** `align-items: flex-end` en el contenedor flex impedía que las columnas se estiraran a la altura completa, así que `height: %` no tenía referencia
- **Solución:** Cambiado a `align-items: stretch` + `padding-top: 35px` + `overflow: visible`
- Añadido `min-height: 8px` a las barras para que semanas con pocas reservas sean visibles
- Las etiquetas numéricas sobre las barras ya no se cortan

**4. Error 500 al crear servicio**
- **Problema:** Al crear un servicio desde el dashboard, error "Error al verificar límites de servicios"
- **Causa:** La columna `plan_limits` del negocio era `NULL` en la base de datos. El middleware hacía `null.maxServices` → TypeError → 500
- **Solución:** Añadidos límites por defecto sin restricciones cuando `plan_limits` es NULL
- **Archivo:** `backend/middleware/entitlements.js` → función `getBusinessPlan()`

**5. Fechas desplazadas un día en el calendario**
- **Problema:** Reservas creadas para el día 10 aparecían en el día 11 del calendario
- **Causa:** `toISOString().split('T')[0]` convierte a UTC. En España (UTC+1), a partir de las 23:00 la fecha UTC es el día siguiente
- **Solución:** Reemplazado `toISOString()` por construcción manual de fecha local (`getFullYear()-getMonth()-getDate()`)
- **Archivos corregidos:** `calendar.js` (vista mensual y diaria), `dashboard.js` (agenda de hoy), `bookings.js` (fecha por defecto y min del input), `workshops.js` (fecha mínima de sesiones)

**6. Descripción de servicios visible en el widget público**
- Al seleccionar un servicio en el formulario de reservas, aparece la descripción debajo del selector
- Estilo: texto en negrita, color oscuro (#1f2937), fondo blanco, borde lateral con color primario del widget
- Si el servicio no tiene descripción, no se muestra nada
- Desaparece al deseleccionar o cambiar de servicio

### Archivos modificados:
- `index.html` - Enlaces footer legales
- `casos-exito.html` - Enlaces footer legales
- `como-funciona.html` - Enlaces footer legales
- `contacto.html` - Enlaces footer legales
- `demo.html` - Enlaces footer legales
- `planes.html` - Enlaces footer legales
- `registro.html` - Enlaces Términos y Privacidad en formulario
- `politica-privacidad.html` - noindex + enlace a Términos
- `politica-cookies.html` - noindex
- `terminos.html` - noindex
- `admin/js/bookings.js` - Filtros por nivel + fix timezone fecha
- `admin/js/dashboard.js` - Fix gráfico tendencia + fix timezone agenda
- `admin/js/calendar.js` - Fix timezone vista mensual y diaria
- `admin/js/workshops.js` - Fix timezone fecha mínima
- `backend/middleware/entitlements.js` - Fix plan_limits NULL
- `widget/stickywork-widget.js` - Descripción de servicios

### Commits:
- `b2ff96c` - fix: Enlazar páginas legales en footer + noindex
- `650e222` - feat: Filtrar reservas por nivel de cliente (VIP, Normal, Riesgo, Baneado)
- `140b1c9` - fix: Corregir visualización del gráfico de tendencia de reservas
- `962c398` - fix: Barras del gráfico de tendencia no mostraban altura proporcional
- `abfbf26` - fix: Error 500 al crear servicio cuando plan_limits es NULL
- `b24276a` - fix: Fechas desplazadas un día por conversión UTC en el calendario
- `9a432d8` - feat: Mostrar descripción del servicio en el widget de reservas
- `dd733ec` - style: Descripción de servicio en negrita sobre fondo blanco

---

## Resumen de Cambios

### Bugs corregidos
| Bug | Causa | Archivo |
|-----|-------|---------|
| Gráfico de tendencia plano | `align-items: flex-end` impedía altura proporcional | `dashboard.js` |
| Error 500 al crear servicio | `plan_limits` NULL → TypeError | `entitlements.js` |
| Fechas +1 día en calendario | `toISOString()` convierte a UTC | `calendar.js`, `dashboard.js`, `bookings.js`, `workshops.js` |
| Enlaces legales rotos en footer | `href="#"` en 6 páginas | 6 HTML + `registro.html` + `politica-privacidad.html` |

### Features nuevas
| Feature | Estado |
|---------|--------|
| Filtrar reservas por nivel de cliente | ✅ |
| Descripción de servicios en widget | ✅ |
| Páginas legales enlazadas y noindex | ✅ |

---

## Próximas tareas sugeridas

1. **Notificaciones por email** al cliente cuando se crean citas repetidas
2. **Estadísticas de clientes** (retención, frecuencia de visitas)
3. **Recordatorios automáticos** para clientes que no vienen hace X tiempo
4. **Auto-degradar a Riesgo** clientes que no acuden X veces
5. **Páginas "Sobre nosotros" y "Blog"** — enlaces del footer aún apuntan a `#`

---

## Stack Tecnológico (sin cambios)

- **Backend:** Node.js + Express + MySQL (Railway)
- **Frontend:** Vanilla JS
- **Hosting:** Railway (API) + GitHub Pages (Frontend)

---

**Última actualización:** 09-feb-2026
**Próxima revisión:** 16-feb-2026 (inicio semana 08)
