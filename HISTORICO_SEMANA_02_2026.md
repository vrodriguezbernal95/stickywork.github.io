# Histórico Proyecto StickyWork - Semana 02

**Año:** 2026
**Período:** 2026-01-05 - 2026-01-11

---

### 2026-01-05 - Implementación Sistema WhatsApp Click-to-Chat
**Estado:** Completado ✓
**Objetivo:** Implementar sistema completo de notificaciones por WhatsApp usando Click-to-Chat (gratuito), con consentimiento GDPR y configuración personalizada por negocio

**Contexto:**
- Necesidad de mejorar la comunicación con clientes post-reserva
- WhatsApp tiene 98% tasa de apertura vs 20% email
- Click-to-Chat es gratuito (no requiere WhatsApp Business API)
- Cada negocio debe poder configurar su propio número y plantilla de mensaje
- Cumplimiento GDPR: consentimiento explícito del cliente

**Implementación realizada (7 fases, ~6 horas):**

#### Fase 1: Base de Datos (30 min)
**Cambios en MySQL:**
- Tabla `businesses`: 3 nuevas columnas
  - `whatsapp_number` VARCHAR(20) - Número en formato internacional sin +
  - `whatsapp_enabled` BOOLEAN - Activar/desactivar notificaciones
  - `whatsapp_template` TEXT - Plantilla personalizable del mensaje
- Tabla `bookings`: 1 nueva columna
  - `whatsapp_consent` BOOLEAN - Consentimiento del cliente

**Archivos creados:**
- `backend/migrations/add-whatsapp-fields.sql` - SQL para añadir columnas
- `backend/migrations/run-whatsapp-migration.js` - Script para ejecutar migración
- Migración ejecutada en Railway: 8 negocios actualizados con plantilla por defecto

#### Fase 2: Backend API (45 min)
**Archivo modificado:** `backend/routes.js`

**Cambios:**
- Línea 337: Captura de `whatsapp_consent` en POST /api/bookings
  ```javascript
  const whatsappConsent = req.body.whatsappConsent || req.body.whatsapp_consent || false;
  ```
- Líneas 459-462: Añadir campo a INSERT de bookings
- Líneas 783-852: Nuevo endpoint PATCH /api/businesses/:id/whatsapp-settings
  - Validación de formato de número (10-15 dígitos, sin +)
  - Validación de longitud de plantilla (máx 1000 caracteres)
  - Solo el owner del negocio puede modificar
  - Limpieza automática de espacios en el número

#### Fase 3: Widget de Reservas (60 min)
**Archivo modificado:** `widget/stickywork-widget.js`

**Cambios:**
- Líneas 60-62, 96-98: Traducciones ES/EN para checkbox
- Líneas 276-315: Estilos CSS para checkbox y nota de privacidad
- Líneas 738-749: Renderizado del checkbox de consentimiento
  ```html
  <div class="stickywork-whatsapp-consent">
    <input type="checkbox" id="stickywork-whatsapp-consent" name="whatsapp_consent">
    <span>Quiero recibir confirmación por WhatsApp (opcional)</span>
    <p>Al marcar, consientes contacto vía WhatsApp</p>
    <a href="/politica-privacidad.html">Política de privacidad</a>
  </div>
  ```
- Líneas 883-897: Captura del valor del checkbox en submit
- Líneas 853-865: Envío del campo al backend

#### Fase 4: Política de Privacidad (30 min)
**Archivo creado:** `politica-privacidad.html`

**Contenido:**
- Información sobre datos recopilados
- Uso específico de WhatsApp y consentimiento
- Derechos del usuario (acceso, rectificación, eliminación, oposición)
- Período de retención de datos (2 años)
- Medidas de seguridad
- Información de contacto
- Diseño responsive con CSS incluido
- Cumplimiento GDPR completo

#### Fase 5: Dashboard - Configuración (90 min)
**Archivo modificado:** `admin/js/settings.js`

**Cambios:**
- Líneas 1202-1255: Nueva sección "Notificaciones por WhatsApp" en pestaña Notificaciones
  - Toggle para activar/desactivar
  - Input para número de WhatsApp (con hint de formato)
  - Textarea para plantilla de mensaje (estilo monospace)
  - Contador de caracteres (1000 máx)
  - Botón para restaurar plantilla original
  - Variables disponibles: {nombre}, {fecha}, {hora}, {servicio}, {negocio}, {nombre_negocio}

- Líneas 1330-1381: Actualización de `saveNotificationSettings()`
  - Validación de número si está habilitado
  - Validación de longitud de plantilla
  - Llamada a endpoint PATCH /api/businesses/:id/whatsapp-settings
  - Actualización de businessData local

- Líneas 2415-2454: Tres nuevas funciones auxiliares
  - `toggleWhatsAppFields()` - Mostrar/ocultar campos según toggle
  - `resetWhatsAppTemplate()` - Restaurar plantilla por defecto
  - `updateCharCount()` - Actualizar contador de caracteres

- Líneas 859-870: Event listener para contador de caracteres en textarea

#### Fase 6: Dashboard - Envío WhatsApp (60 min)
**Archivo modificado:** `admin/js/dashboard.js`

**Cambios:**
- Línea 4: Nueva propiedad `businessSettings` para almacenar config de WhatsApp
- Líneas 38-44: Carga de configuración de WhatsApp del negocio
- Líneas 842-893: Botón "💬 Enviar WhatsApp" con 3 estados condicionales:
  1. **Verde activo**: Cliente dio consentimiento Y WhatsApp configurado
  2. **Gris deshabilitado**: Cliente dio consentimiento PERO WhatsApp no configurado
  3. **Texto informativo**: Cliente NO dio consentimiento

- Líneas 1183-1249: Función `sendWhatsApp(bookingId)`
  - Obtener detalles de la reserva
  - Validar consentimiento del cliente
  - Validar configuración de WhatsApp del negocio
  - Formatear fecha y hora en español
  - Reemplazar variables en la plantilla
  - Limpiar número de teléfono (eliminar caracteres no numéricos)
  - Detectar números españoles sin prefijo (9 dígitos, empieza con 6/7/8/9)
  - Añadir automáticamente prefijo +34 si falta
  - Construir URL de WhatsApp: `https://wa.me/{phone}?text={message}`
  - Abrir WhatsApp Web/App en nueva ventana

#### Fase 7: Testing y Documentación (60 min)
**Archivos creados:**
- `PLAN_WHATSAPP_CLICKTOCHAT.md` - Plan de implementación original
- `IMPLEMENTACION_WHATSAPP_COMPLETADA.md` - Documentación completa del sistema

**Testing realizado:**
- ✅ Migración de base de datos local y Railway
- ✅ Widget muestra checkbox de consentimiento
- ✅ Backend guarda campo whatsapp_consent correctamente
- ✅ Dashboard permite configurar WhatsApp
- ✅ Botón de envío aparece con estados correctos
- ✅ Generación y apertura de URL de WhatsApp

**Problemas encontrados y solucionados:**

1. **Templates con emojis causaban problemas de codificación**
   - Síntoma: Emojis aparecían como "?" en WhatsApp
   - Solución: Eliminar emojis de plantilla por defecto
   - Commit: `1c54af4` - Actualizar templates sin emojis

2. **Números sin prefijo internacional no funcionaban**
   - Síntoma: Si cliente ponía "687767133" en vez de "+34687767133", mensaje no se enviaba
   - Solución: Detectar números españoles (9 dígitos, empiezan con 6/7/8/9) y añadir "34" automáticamente
   - Commit: `b511dc7` - Fix prefijo +34 automático
   - Código: Líneas 1239-1244 de `admin/js/dashboard.js`

3. **Railway no redesplegaba automáticamente**
   - Síntoma: Código actualizado en GitHub pero backend seguía devolviendo versión antigua
   - Solución: Forzar redeploy modificando `server.js` con comentario
   - Commit: `1c5e5bb` - Forzar redeploy Railway

4. **IDs duplicados en checkbox cuando hay múltiples widgets**
   - Síntoma: Página con widget embedded Y floating creaba 2 checkboxes con mismo ID
   - Problema: `document.getElementById()` devolvía siempre el primero, aunque usuario marcara el segundo
   - Diagnóstico:
     - `document.querySelectorAll('#stickywork-whatsapp-consent').length` → 2
     - Usuario marcaba checkbox 2, pero se consultaba checkbox 1 → false
   - Solución: Cambiar de `document.getElementById()` a `form.querySelector()` para buscar dentro del formulario específico
   - Commit: `88cfada` - Fix IDs duplicados checkbox
   - Código: Línea 896 de `widget/stickywork-widget.js`
     ```javascript
     // ANTES:
     whatsappConsent: document.getElementById('stickywork-whatsapp-consent')?.checked || false

     // DESPUÉS:
     whatsappConsent: form.querySelector('input[name="whatsapp_consent"]')?.checked || false
     ```

**Plantilla de mensaje por defecto (sin emojis):**
```
Hola {nombre}!

Tu reserva en {negocio} ha sido confirmada:

Fecha: {fecha}
Hora: {hora}
Servicio: {servicio}

Te esperamos!

{nombre_negocio}
```

**Variables disponibles:**
- `{nombre}` - Nombre del cliente
- `{fecha}` - Fecha formateada (ej: "lunes, 5 de enero de 2026")
- `{hora}` - Hora de la reserva (ej: "14:30")
- `{servicio}` - Nombre del servicio reservado
- `{negocio}` - Nombre del negocio
- `{nombre_negocio}` - Nombre del negocio (alias)

**Cómo funciona Click-to-Chat:**
1. Admin hace clic en "💬 Enviar WhatsApp" en el dashboard
2. Se abre WhatsApp Web/App con mensaje pre-rellenado
3. El mensaje está dirigido AL NÚMERO DEL CLIENTE (no del admin)
4. Admin envía el mensaje desde su WhatsApp personal
5. Cliente recibe confirmación personalizada de su reserva

**Ventajas del sistema:**
- ✅ Gratuito (no requiere WhatsApp Business API)
- ✅ Sin límites compartidos entre negocios (cada uno usa su WhatsApp)
- ✅ 98% tasa de apertura vs 20% email
- ✅ Preferido por clientes españoles
- ✅ Cumple GDPR con consentimiento explícito
- ✅ Plantillas personalizables por negocio
- ✅ Prefijo internacional automático para España

**Commits realizados:**
- `1c54af4` - feat: Implementar sistema de notificaciones WhatsApp Click-to-Chat
- `b511dc7` - fix: Añadir prefijo +34 automáticamente a números sin código de país
- `1c5e5bb` - chore: Forzar redeploy de Railway para actualizar backend con soporte WhatsApp
- `88cfada` - fix: Resolver conflicto de IDs duplicados en checkbox WhatsApp con múltiples widgets

**Deployment:**
- ✅ Frontend: GitHub Pages (https://vrodriguezbernal95.github.io/stickywork.github.io/)
- ✅ Widget: https://stickywork.com/widget/stickywork-widget.js
- ✅ Backend: Railway (https://api.stickywork.com)
- ✅ Base de datos: Railway MySQL (migrada exitosamente)

**Estadísticas:**
- 9 archivos modificados/creados
- 2,201 líneas añadidas
- 4 commits realizados
- 4 bugs críticos resueltos
- 100% funcional en producción

**Testing en producción:**
- Negocio de prueba: La Famiglia (Business ID: 9)
- Usuario: admin@lafamiglia.demo
- Página de test: https://vrodriguezbernal95.github.io/la-famiglia-restaurant/
- Reservas de prueba exitosas con whatsapp_consent = true
- Botón "💬 Enviar WhatsApp" funcionando correctamente

**Próximos pasos sugeridos:**
1. ✅ Sistema operativo - no requiere más cambios inmediatos
2. Considerar añadir soporte para otros países (actualmente optimizado para España)
3. Añadir estadísticas de mensajes enviados por WhatsApp
4. Considerar integración con WhatsApp Business API para mensajes automáticos (futuro, de pago)

**Lecciones aprendidas:**
1. GitHub Pages puede tardar 5-10 minutos en actualizar archivos cacheados
2. Railway auto-deploya al detectar push a master
3. Múltiples widgets en una página requieren selectores específicos, no IDs globales
4. WhatsApp Click-to-Chat requiere código de país obligatorio en formato internacional
5. Los emojis en URLs pueden causar problemas de codificación según dispositivo/navegador

---

**Tiempo total de implementación:** ~8 horas (incluyendo debugging)
**Complejidad:** Media-Alta
**Impacto:** Alto - Mejora significativa en comunicación con clientes
**Estado final:** ✅ Producción - 100% Operativo
