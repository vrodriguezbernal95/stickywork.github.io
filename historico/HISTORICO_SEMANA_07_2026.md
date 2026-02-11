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

## Sesión 2: 11-feb-2026 - Features del Dashboard + IA + Limpieza

### Completado

**1. Permitir reservas a cualquier hora**
- **Problema:** Al crear reserva manual, solo permitía horas en punto o y media (:00, :30)
- **Causa:** `step="1800"` en el input de hora + restricciones `min="09:00" max="20:00"`
- **Solución:** Cambiado a `step="60"`, eliminadas restricciones de min/max
- **Archivo:** `admin/js/bookings.js`

**2. Pestañas Estadísticas y Recordatorios en Clientes**
- Nuevo sistema de tabs en la sección Clientes (mismo patrón que Configuración)
- **Tab Estadísticas:** Total clientes, distribución por nivel (VIP/Normal/Riesgo/Baneado), top 5 clientes frecuentes, clientes recientes
- **Tab Recordatorios:** Lista de clientes inactivos (40+ días sin venir) con botón WhatsApp para enviar recordatorio
- Filtrado local de clientes (ya no recarga desde API al cambiar filtro)

**3. Botón WhatsApp en Recordatorios**
- Cada cliente inactivo tiene un botón "WhatsApp" que abre wa.me con mensaje pre-rellenado
- Usa la plantilla configurada en Ajustes > Notificaciones o un mensaje por defecto

**4. Fix trust proxy para Railway**
- **Problema:** CORS error `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` tras push
- **Causa:** express-rate-limit requiere `trust proxy` cuando hay un proxy delante (Railway)
- **Solución:** `app.set('trust proxy', 1)` en `server.js`

**5. Estadísticas de negocio mejoradas en Dashboard**
- 2 nuevos stat cards: "Ingresos Este Mes" (con % vs mes anterior) y "Tasa Cancelación" (con color según severidad)
- 2 nuevos gráficos: "Horas Punta" (barras horizontales) y "Ingresos Mensuales" (barras verticales, últimos 6 meses)

**6. Exportar clientes a CSV**
- Botón "Exportar CSV" en la pestaña Clientes
- Formato: UTF-8 BOM, separador punto y coma (compatible con Excel español)
- Respeta el filtro activo (solo exporta los clientes filtrados)

**7. Contexto de negocio en Reportes IA (pestaña "Mi Negocio")**
- Nueva pestaña "Mi Negocio" en Reportes IA con 7 cajas de texto: descripción, diferenciación, servicios, percepción, retos, público objetivo, objetivos
- El propietario describe su negocio y la IA lo usa para generar reportes más personalizados
- Backend: nueva columna `business_context` (JSON) en tabla `businesses` + endpoints GET/PATCH
- Claude service: inyecta el contexto en el prompt al generar reportes
- Requiere migración: `POST /api/debug/run-business-context-migration`

**8. Búsqueda global en el dashboard**
- Barra de búsqueda en el header (topbar), siempre visible
- Busca en paralelo en clientes, reservas y servicios con un solo endpoint `GET /api/search?q=`
- Resultados en dropdown agrupados por categoría con resaltado de coincidencias
- Debounce 300ms, cierre con Escape, clic navega a la sección correspondiente
- Responsive: se adapta a móvil

**9. Limpieza del repositorio**
- Eliminados 37 scripts sueltos de test/migración/debug de la raíz
- Movidos 11 archivos de histórico a carpeta `historico/`
- Conservados 4 archivos .md de análisis/notas

### Archivos modificados/creados:
- `admin/js/bookings.js` — Fix step hora
- `admin/js/clients.js` — Tabs + estadísticas + recordatorios + WhatsApp + CSV export
- `admin/js/dashboard.js` — Estadísticas mejoradas (ingresos, cancelación, horas punta)
- `admin/js/ai-reports.js` — Tabs + formulario "Mi Negocio" con 7 cajas
- `admin/js/global-search.js` — **Nuevo** módulo de búsqueda global
- `admin/css/admin.css` — Estilos de búsqueda global
- `admin-dashboard.html` — Barra de búsqueda en topbar + script tag
- `server.js` — Trust proxy
- `backend/routes.js` — Endpoints: búsqueda global + contexto negocio + migración
- `backend/routes/ai-reports.js` — Cargar business_context al generar reporte
- `backend/services/claude-service.js` — Inyectar contexto en prompt de Claude

### Commits:
- `56a7feb` — fix: Permitir crear reservas a cualquier hora en el dashboard
- `76ab28a` — feat: Añadir pestañas Estadísticas y Recordatorios en sección Clientes
- `2064378` — feat: Botón de WhatsApp en pestaña Recordatorios para clientes inactivos
- `4b65c26` — fix: Añadir trust proxy para express-rate-limit en Railway
- `fa8f4a4` — feat: Estadísticas de negocio mejoradas + exportar clientes a CSV
- `35435b4` — feat: Contexto de negocio en Reportes IA (pestaña Mi Negocio)
- `8ec8fc7` — style: Corregir colores de Mi Negocio para dark mode del dashboard
- `931ef78` — feat: Búsqueda global en el dashboard

---

## Resumen de Cambios

### Bugs corregidos
| Bug | Causa | Archivo | Sesión |
|-----|-------|---------|--------|
| Gráfico de tendencia plano | `align-items: flex-end` impedía altura proporcional | `dashboard.js` | S1 |
| Error 500 al crear servicio | `plan_limits` NULL → TypeError | `entitlements.js` | S1 |
| Fechas +1 día en calendario | `toISOString()` convierte a UTC | `calendar.js`, `dashboard.js`, `bookings.js`, `workshops.js` | S1 |
| Enlaces legales rotos en footer | `href="#"` en 6 páginas | 6 HTML + `registro.html` | S1 |
| Reservas solo a horas exactas | `step="1800"` en input hora | `bookings.js` | S2 |
| CORS error en Railway | Falta `trust proxy` para express-rate-limit | `server.js` | S2 |

### Features nuevas
| Feature | Estado | Sesión |
|---------|--------|--------|
| Filtrar reservas por nivel de cliente | ✅ | S1 |
| Descripción de servicios en widget | ✅ | S1 |
| Páginas legales enlazadas y noindex | ✅ | S1 |
| Pestañas Estadísticas y Recordatorios en Clientes | ✅ | S2 |
| Botón WhatsApp en Recordatorios | ✅ | S2 |
| Estadísticas de negocio mejoradas (ingresos, cancelación, horas punta) | ✅ | S2 |
| Exportar clientes a CSV | ✅ | S2 |
| Contexto de negocio en Reportes IA ("Mi Negocio") | ✅ | S2 |
| Búsqueda global en el dashboard | ✅ | S2 |
| Limpieza repo (37 scripts + históricos organizados) | ✅ | S2 |

---

## Próximas tareas pendientes

1. **Notificaciones por email** al cliente cuando se crean citas repetidas
4. **Auto-degradar a Riesgo** clientes que faltan a X citas (automático desde backend)
5. **Páginas "Sobre nosotros" y "Blog"** — enlaces del footer aún apuntan a `#`

---

## Stack Tecnológico (sin cambios)

- **Backend:** Node.js + Express + MySQL (Railway)
- **Frontend:** Vanilla JS
- **Hosting:** Railway (API) + GitHub Pages (Frontend)

---

**Última actualización:** 11-feb-2026
**Próxima revisión:** 16-feb-2026 (inicio semana 08)
