# Plan de Implementación: WhatsApp Click-to-Chat

**Fecha de creación**: 2026-01-02
**Objetivo**: Implementar sistema de confirmación de reservas por WhatsApp con Click-to-Chat

## Resumen Ejecutivo

Implementar una solución de confirmación por WhatsApp que:
- Permite a cada negocio configurar su propio número de WhatsApp
- Solicita consentimiento opcional al cliente (no bloquea la reserva)
- Ofrece plantillas personalizables con variables
- Integra botón "Enviar WhatsApp" en el dashboard
- Cumple con GDPR

**Ventajas sobre email**:
- Sin límites compartidos (cada negocio usa su WhatsApp)
- 98% tasa de apertura vs 20% email
- Gratuito (Click-to-Chat)
- Preferido por los clientes

---

## Fase 1: Base de Datos (30 min)

### Tarea 1.1: Actualizar tabla `businesses`
```sql
ALTER TABLE businesses
ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL,
ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN whatsapp_template TEXT DEFAULT NULL;

-- Actualizar con plantilla por defecto
UPDATE businesses
SET whatsapp_template = '¡Hola {nombre}! ✅\n\nTu reserva en {negocio} ha sido confirmada:\n\n📅 Fecha: {fecha}\n🕐 Hora: {hora}\n🛠️ Servicio: {servicio}\n\n¡Te esperamos!\n\n{nombre_negocio}';
```

**Validación**:
- Ejecutar `DESCRIBE businesses;` para verificar columnas nuevas
- Verificar que todas las filas existentes tengan la plantilla por defecto

### Tarea 1.2: Actualizar tabla `bookings`
```sql
ALTER TABLE bookings
ADD COLUMN whatsapp_consent BOOLEAN DEFAULT FALSE;
```

**Validación**:
- Ejecutar `DESCRIBE bookings;` para verificar columna nueva
- Verificar que reservas existentes tengan `whatsapp_consent = 0`

---

## Fase 2: Backend API (45 min)

### Tarea 2.1: Crear endpoint para configuración de WhatsApp

**Archivo**: `backend/routes/businesses.js`

```javascript
// PATCH /api/businesses/:id/whatsapp-settings
router.patch('/:id/whatsapp-settings', authenticateToken, async (req, res) => {
    try {
        const businessId = req.params.id;
        const { whatsapp_number, whatsapp_enabled, whatsapp_template } = req.body;

        // Verificar que el usuario tiene acceso a este negocio
        if (parseInt(businessId) !== parseInt(req.user.businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar este negocio'
            });
        }

        // Validar formato de número de WhatsApp (debe ser internacional sin +)
        if (whatsapp_number) {
            const phoneRegex = /^[0-9]{10,15}$/;
            if (!phoneRegex.test(whatsapp_number.replace(/\s/g, ''))) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de número inválido. Usa formato internacional sin + (ej: 34612345678)'
                });
            }
        }

        // Validar longitud de plantilla
        if (whatsapp_template && whatsapp_template.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'La plantilla no puede exceder 1000 caracteres'
            });
        }

        // Actualizar configuración
        const [result] = await req.db.query(
            `UPDATE businesses
             SET whatsapp_number = ?,
                 whatsapp_enabled = ?,
                 whatsapp_template = ?
             WHERE id = ?`,
            [whatsapp_number || null, whatsapp_enabled || false, whatsapp_template || null, businessId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Configuración de WhatsApp actualizada'
        });

    } catch (error) {
        console.error('Error al actualizar configuración de WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración'
        });
    }
});
```

**Validación**:
- Probar con Postman/Thunder Client
- Verificar validación de número incorrecto
- Verificar validación de plantilla muy larga
- Verificar que solo el dueño puede modificar

### Tarea 2.2: Actualizar endpoint de bookings para incluir consent

**Archivo**: `backend/routes/bookings.js`

En el endpoint `POST /api/bookings`, añadir:

```javascript
// Dentro de la función de crear booking, añadir whatsapp_consent
const {
    business_id,
    customer_name,
    customer_email,
    customer_phone,
    booking_date,
    booking_time,
    service_id,
    num_people,
    zone,
    notes,
    whatsapp_consent  // NUEVO
} = req.body;

// En el INSERT, añadir el campo
const [result] = await req.db.query(
    `INSERT INTO bookings (
        business_id, customer_name, customer_email, customer_phone,
        booking_date, booking_time, service_id, num_people, zone, notes,
        whatsapp_consent, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
    [
        business_id, customer_name, customer_email, customer_phone,
        booking_date, booking_time, service_id || null, num_people || 1,
        zone || null, notes || '', whatsapp_consent || false
    ]
);
```

**Validación**:
- Crear reserva con `whatsapp_consent: true`
- Verificar en BD que el campo se guarda correctamente
- Crear reserva sin el campo y verificar que default es `false`

---

## Fase 3: Widget (60 min)

### Tarea 3.1: Añadir checkbox de consentimiento

**Archivo**: `widget/stickywork-widget.js`

En la función `buildBookingForm()`, después del campo de notas, añadir:

```javascript
// Después del textarea de notas, añadir:
<div class="sw-form-group">
    <label class="sw-checkbox-container">
        <input type="checkbox" id="sw-whatsapp-consent" class="sw-checkbox">
        <span class="sw-checkbox-label">
            Quiero recibir confirmación de mi reserva por WhatsApp (opcional)
        </span>
    </label>
    <p class="sw-privacy-note">
        Al marcar esta casilla, consientes que te contactemos vía WhatsApp.
        Lee nuestra <a href="https://stickywork.com/politica-privacidad.html" target="_blank">política de privacidad</a>.
    </p>
</div>
```

### Tarea 3.2: Actualizar estilos del checkbox

En la sección de estilos del widget, añadir:

```css
.sw-checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    margin-bottom: 8px;
}

.sw-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 2px;
}

.sw-checkbox-label {
    font-size: 0.95rem;
    color: #333;
    line-height: 1.4;
}

.sw-privacy-note {
    font-size: 0.85rem;
    color: #666;
    margin: 5px 0 0 28px;
    line-height: 1.4;
}

.sw-privacy-note a {
    color: #3b82f6;
    text-decoration: none;
}

.sw-privacy-note a:hover {
    text-decoration: underline;
}
```

### Tarea 3.3: Capturar el consentimiento en el submit

En la función `handleBookingSubmit()`, modificar:

```javascript
// Capturar el valor del checkbox
const whatsappConsent = document.getElementById('sw-whatsapp-consent')?.checked || false;

const bookingData = {
    business_id: config.businessId,
    customer_name: formData.name,
    customer_email: formData.email,
    customer_phone: formData.phone || '',
    booking_date: formData.date,
    booking_time: formData.time,
    service_id: formData.service || null,
    num_people: formData.numPeople || defaultNumPeople,
    zone: formData.zone || null,
    notes: formData.notes || '',
    whatsapp_consent: whatsappConsent  // NUEVO
};
```

**Validación**:
- Abrir `test-widget-simple.html` en navegador
- Hacer reserva CON checkbox marcado
- Verificar en BD que `whatsapp_consent = 1`
- Hacer reserva SIN checkbox marcado
- Verificar en BD que `whatsapp_consent = 0`

---

## Fase 4: Política de Privacidad (30 min)

### Tarea 4.1: Crear página de política de privacidad

**Archivo**: `politica-privacidad.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidad - StickyWork</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container" style="max-width: 800px; margin: 50px auto; padding: 20px;">
        <h1>Política de Privacidad</h1>

        <p><strong>Última actualización:</strong> 2 de enero de 2026</p>

        <h2>1. Información que Recopilamos</h2>
        <p>Al realizar una reserva a través de StickyWork, recopilamos:</p>
        <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
            <li>Detalles de la reserva (fecha, hora, servicio)</li>
        </ul>

        <h2>2. Cómo Usamos tu Información</h2>
        <p>Utilizamos tu información para:</p>
        <ul>
            <li>Procesar y gestionar tu reserva</li>
            <li>Enviarte confirmaciones por correo electrónico</li>
            <li>Si has dado tu consentimiento, enviarte confirmaciones por WhatsApp</li>
            <li>Permitir al negocio gestionar sus reservas</li>
        </ul>

        <h2>3. WhatsApp</h2>
        <p>Si marcas la casilla de consentimiento para WhatsApp:</p>
        <ul>
            <li>El negocio puede contactarte vía WhatsApp para confirmar tu reserva</li>
            <li>Tu número de teléfono se utilizará únicamente para este propósito</li>
            <li>Puedes revocar este consentimiento en cualquier momento contactando al negocio</li>
        </ul>

        <h2>4. Compartir Información</h2>
        <p>Tu información es compartida únicamente con el negocio donde realizaste la reserva. No vendemos ni compartimos tu información con terceros para fines de marketing.</p>

        <h2>5. Tus Derechos (GDPR)</h2>
        <p>Tienes derecho a:</p>
        <ul>
            <li><strong>Acceso:</strong> Solicitar una copia de tus datos</li>
            <li><strong>Rectificación:</strong> Corregir datos incorrectos</li>
            <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos</li>
            <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos</li>
        </ul>

        <h2>6. Retención de Datos</h2>
        <p>Conservamos tu información mientras sea necesaria para gestionar tu reserva y cumplir con obligaciones legales. Los datos de reservas pasadas se conservan durante 2 años.</p>

        <h2>7. Seguridad</h2>
        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal.</p>

        <h2>8. Contacto</h2>
        <p>Para ejercer tus derechos o consultas sobre privacidad, contacta directamente con el negocio donde realizaste la reserva.</p>

        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <a href="index.html">← Volver al inicio</a>
        </p>
    </div>
</body>
</html>
```

**Validación**:
- Abrir `https://stickywork.com/politica-privacidad.html` en navegador
- Verificar que el enlace desde el widget funciona
- Revisar que todos los puntos están claros

---

## Fase 5: Dashboard - Configuración (90 min)

### Tarea 5.1: Añadir sección de WhatsApp en Settings

**Archivo**: `admin/js/settings.js`

Modificar la función `renderContent()` para añadir una nueva sección:

```javascript
// Después de la sección de horarios, añadir:
<div class="settings-section">
    <h2>💬 Notificaciones por WhatsApp</h2>
    <p class="section-description">
        Configura WhatsApp para enviar confirmaciones de reserva a tus clientes.
    </p>

    <div class="form-group">
        <label class="switch-container">
            <input type="checkbox" id="whatsapp-enabled"
                   ${settings.whatsapp_enabled ? 'checked' : ''}>
            <span class="switch-slider"></span>
            <span class="switch-label">Activar notificaciones por WhatsApp</span>
        </label>
    </div>

    <div class="form-group">
        <label for="whatsapp-number">Número de WhatsApp</label>
        <input type="text"
               id="whatsapp-number"
               value="${settings.whatsapp_number || ''}"
               placeholder="34612345678"
               class="form-input">
        <small class="form-hint">
            Formato internacional sin el símbolo + (ejemplo: 34612345678 para España)
        </small>
    </div>

    <div class="form-group">
        <label for="whatsapp-template">Plantilla de Mensaje</label>
        <textarea id="whatsapp-template"
                  class="form-input"
                  rows="10"
                  style="font-family: monospace; font-size: 0.9rem;">${settings.whatsapp_template || ''}</textarea>
        <small class="form-hint">
            Variables disponibles: {nombre}, {fecha}, {hora}, {servicio}, {negocio}, {nombre_negocio}
        </small>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <span id="template-char-count" style="font-size: 0.85rem; color: #666;">
                0 / 1000 caracteres
            </span>
            <button type="button" class="btn-secondary" onclick="settings.resetTemplate()">
                Restaurar plantilla original
            </button>
        </div>
    </div>

    <button type="button" class="btn-primary" onclick="settings.saveWhatsAppSettings()">
        Guardar Configuración de WhatsApp
    </button>
</div>
```

### Tarea 5.2: Añadir función para contar caracteres

```javascript
// En settings.js, después de renderizar el contenido, añadir:
const templateTextarea = document.getElementById('whatsapp-template');
if (templateTextarea) {
    const updateCharCount = () => {
        const count = templateTextarea.value.length;
        const countDisplay = document.getElementById('template-char-count');
        countDisplay.textContent = `${count} / 1000 caracteres`;
        countDisplay.style.color = count > 1000 ? '#ef4444' : '#666';
    };

    updateCharCount();
    templateTextarea.addEventListener('input', updateCharCount);
}
```

### Tarea 5.3: Añadir función para resetear plantilla

```javascript
resetTemplate() {
    const defaultTemplate = `¡Hola {nombre}! ✅

Tu reserva en {negocio} ha sido confirmada:

📅 Fecha: {fecha}
🕐 Hora: {hora}
🛠️ Servicio: {servicio}

¡Te esperamos!

{nombre_negocio}`;

    document.getElementById('whatsapp-template').value = defaultTemplate;

    // Actualizar contador
    const countDisplay = document.getElementById('template-char-count');
    countDisplay.textContent = `${defaultTemplate.length} / 1000 caracteres`;
    countDisplay.style.color = '#666';
},
```

### Tarea 5.4: Añadir función para guardar configuración

```javascript
async saveWhatsAppSettings() {
    try {
        const whatsappEnabled = document.getElementById('whatsapp-enabled').checked;
        const whatsappNumber = document.getElementById('whatsapp-number').value.trim();
        const whatsappTemplate = document.getElementById('whatsapp-template').value.trim();

        // Validación básica
        if (whatsappEnabled && !whatsappNumber) {
            showMessage('Por favor ingresa un número de WhatsApp', 'error');
            return;
        }

        if (whatsappTemplate.length > 1000) {
            showMessage('La plantilla no puede exceder 1000 caracteres', 'error');
            return;
        }

        const response = await api.fetch(
            `/api/businesses/${auth.getBusinessId()}/whatsapp-settings`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    whatsapp_enabled: whatsappEnabled,
                    whatsapp_number: whatsappNumber.replace(/\s/g, ''),
                    whatsapp_template: whatsappTemplate
                })
            }
        );

        if (response.success) {
            showMessage('Configuración de WhatsApp guardada correctamente', 'success');
        } else {
            showMessage(response.message || 'Error al guardar configuración', 'error');
        }

    } catch (error) {
        console.error('Error saving WhatsApp settings:', error);
        showMessage('Error al guardar configuración de WhatsApp', 'error');
    }
}
```

### Tarea 5.5: Actualizar estilos para la nueva sección

**Archivo**: `admin/css/admin.css`

```css
.switch-container {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;
}

.switch-slider {
    position: relative;
    width: 50px;
    height: 26px;
    background-color: #ccc;
    border-radius: 13px;
    transition: background-color 0.3s;
}

.switch-slider::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    top: 3px;
    left: 3px;
    transition: transform 0.3s;
}

input[type="checkbox"]:checked + .switch-slider {
    background-color: #3b82f6;
}

input[type="checkbox"]:checked + .switch-slider::before {
    transform: translateX(24px);
}

input[type="checkbox"] {
    display: none;
}

.switch-label {
    font-size: 0.95rem;
    color: #333;
}

.btn-secondary {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
}

.btn-secondary:hover {
    background: #4b5563;
}

.form-hint {
    display: block;
    margin-top: 5px;
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
}
```

**Validación**:
- Abrir panel de administración → Configuración
- Verificar que la nueva sección aparece
- Probar activar/desactivar el switch
- Ingresar número de WhatsApp con espacios, verificar que se eliminan
- Modificar plantilla y verificar contador de caracteres
- Probar botón "Restaurar plantilla original"
- Guardar y verificar en BD que se actualiza correctamente

---

## Fase 6: Dashboard - Botón de WhatsApp en Reservas (60 min)

### Tarea 6.1: Añadir botón de WhatsApp en cada reserva

**Archivo**: `admin/js/dashboard.js`

Modificar la función que renderiza las reservas en el modal para incluir el botón:

```javascript
// En la función openBookingsModal(), donde se construye el HTML de cada reserva:
<div class="booking-actions" style="display: flex; gap: 10px; margin-top: 15px;">
    ${booking.whatsapp_consent && businessWhatsappEnabled
        ? `<button class="btn-whatsapp" onclick="dashboard.sendWhatsApp(${booking.id})">
               💬 Enviar WhatsApp
           </button>`
        : booking.whatsapp_consent
            ? `<button class="btn-whatsapp-disabled" disabled title="Configura WhatsApp en Ajustes">
                   💬 WhatsApp (no configurado)
               </button>`
            : `<span class="whatsapp-no-consent" title="Cliente no dio consentimiento">
                   Cliente no autorizó WhatsApp
               </span>`
    }

    ${booking.status === 'pending'
        ? `<button class="btn-confirm" onclick="dashboard.confirmBooking(${booking.id})">
               ✅ Confirmar
           </button>`
        : ''
    }

    ${booking.status !== 'cancelled'
        ? `<button class="btn-cancel" onclick="dashboard.cancelBooking(${booking.id})">
               ❌ Cancelar
           </button>`
        : ''
    }
</div>
```

### Tarea 6.2: Obtener configuración de WhatsApp del negocio

En `dashboard.js`, al cargar el dashboard:

```javascript
async loadBusinessSettings() {
    try {
        const businessId = auth.getBusinessId();
        const response = await api.fetch(`/api/businesses/${businessId}`);

        if (response.success && response.data) {
            this.businessSettings = {
                whatsappEnabled: response.data.whatsapp_enabled,
                whatsappNumber: response.data.whatsapp_number,
                whatsappTemplate: response.data.whatsapp_template,
                businessName: response.data.name
            };
        }
    } catch (error) {
        console.error('Error loading business settings:', error);
    }
}
```

Y llamar esta función en `init()`:

```javascript
async init() {
    // ... código existente ...
    await this.loadBusinessSettings();
    await this.loadStats();
    await this.loadRecentBookings();
}
```

### Tarea 6.3: Implementar función sendWhatsApp

```javascript
async sendWhatsApp(bookingId) {
    try {
        // Obtener detalles de la reserva
        const businessId = auth.getBusinessId();
        const response = await api.fetch(`/api/bookings/${businessId}`);
        const booking = response.data.find(b => b.id === bookingId);

        if (!booking) {
            alert('No se encontró la reserva');
            return;
        }

        if (!booking.whatsapp_consent) {
            alert('Este cliente no autorizó contacto por WhatsApp');
            return;
        }

        if (!this.businessSettings.whatsappEnabled || !this.businessSettings.whatsappNumber) {
            alert('WhatsApp no está configurado. Ve a Configuración para activarlo.');
            return;
        }

        if (!booking.customer_phone) {
            alert('Este cliente no proporcionó número de teléfono');
            return;
        }

        // Formatear fecha y hora
        const date = new Date(booking.booking_date);
        const formattedDate = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = booking.booking_time.substring(0, 5);

        // Reemplazar variables en la plantilla
        let message = this.businessSettings.whatsappTemplate
            .replace(/{nombre}/g, booking.customer_name)
            .replace(/{fecha}/g, formattedDate)
            .replace(/{hora}/g, formattedTime)
            .replace(/{servicio}/g, booking.service_name || 'Reserva')
            .replace(/{negocio}/g, this.businessSettings.businessName)
            .replace(/{nombre_negocio}/g, this.businessSettings.businessName);

        // Limpiar número de teléfono (eliminar espacios, guiones, etc.)
        const phoneNumber = booking.customer_phone.replace(/\D/g, '');

        // Construir URL de WhatsApp
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        // Abrir WhatsApp en nueva ventana
        window.open(whatsappUrl, '_blank');

    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        alert('Error al preparar mensaje de WhatsApp');
    }
}
```

### Tarea 6.4: Añadir estilos para botones de WhatsApp

**Archivo**: `admin/css/admin.css`

```css
.btn-whatsapp {
    background: linear-gradient(135deg, #25D366, #128C7E);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: transform 0.2s;
}

.btn-whatsapp:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(37, 211, 102, 0.3);
}

.btn-whatsapp-disabled {
    background: #ccc;
    color: #666;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: not-allowed;
}

.whatsapp-no-consent {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
    padding: 8px 0;
}

.booking-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.btn-confirm {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: transform 0.2s;
}

.btn-confirm:hover {
    transform: translateY(-2px);
}

.btn-cancel {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: transform 0.2s;
}

.btn-cancel:hover {
    transform: translateY(-2px);
}
```

**Validación**:
- Crear una reserva CON consentimiento de WhatsApp
- Abrir dashboard y hacer clic en alguna tarjeta de estadísticas
- Verificar que el botón "💬 Enviar WhatsApp" aparece
- Hacer clic y verificar que abre WhatsApp Web con el mensaje correcto
- Crear una reserva SIN consentimiento
- Verificar que muestra "Cliente no autorizó WhatsApp"
- Desactivar WhatsApp en configuración
- Verificar que el botón aparece deshabilitado con mensaje apropiado

---

## Fase 7: Testing Completo (45 min)

### Checklist de Pruebas

#### Base de Datos
- [ ] Columnas nuevas existen en `businesses`
- [ ] Columna nueva existe en `bookings`
- [ ] Plantilla por defecto se aplica a negocios existentes
- [ ] `whatsapp_consent` default es `false`

#### Backend API
- [ ] Endpoint `/api/businesses/:id/whatsapp-settings` responde correctamente
- [ ] Validación de número funciona (rechaza formatos incorrectos)
- [ ] Validación de longitud funciona (rechaza > 1000 chars)
- [ ] Solo el dueño puede modificar configuración
- [ ] POST de booking guarda `whatsapp_consent` correctamente

#### Widget
- [ ] Checkbox de WhatsApp aparece en el formulario
- [ ] Texto y estilos se ven correctos en desktop
- [ ] Texto y estilos se ven correctos en mobile
- [ ] Enlace a política de privacidad funciona
- [ ] Marcar checkbox y enviar guarda `whatsapp_consent = true`
- [ ] No marcar checkbox guarda `whatsapp_consent = false`
- [ ] Reserva se completa correctamente con o sin checkbox

#### Política de Privacidad
- [ ] Página `politica-privacidad.html` carga correctamente
- [ ] Contenido es claro y completo
- [ ] Enlace desde widget funciona
- [ ] Responsive en mobile

#### Dashboard - Configuración
- [ ] Sección de WhatsApp aparece en Configuración
- [ ] Switch de activación funciona
- [ ] Campo de número acepta entrada
- [ ] Plantilla se puede editar
- [ ] Contador de caracteres funciona
- [ ] Cambia a rojo cuando excede 1000 chars
- [ ] Botón "Restaurar plantilla" funciona
- [ ] Guardar actualiza correctamente en BD
- [ ] Mensajes de éxito/error se muestran

#### Dashboard - Reservas
- [ ] Botón de WhatsApp aparece si cliente dio consentimiento Y WhatsApp está configurado
- [ ] Botón deshabilitado si WhatsApp no está configurado
- [ ] Mensaje "no autorizó" si cliente no dio consentimiento
- [ ] Clic en botón abre WhatsApp Web
- [ ] Variables se reemplazan correctamente en mensaje
- [ ] Número de teléfono se limpia correctamente
- [ ] Fecha y hora se formatean correctamente

#### Flujo Completo End-to-End
1. [ ] Negocio configura WhatsApp en Configuración
2. [ ] Cliente hace reserva y marca checkbox de WhatsApp
3. [ ] Reserva aparece en dashboard con botón de WhatsApp
4. [ ] Negocio hace clic en "Enviar WhatsApp"
5. [ ] Se abre WhatsApp Web con mensaje correcto
6. [ ] Negocio puede enviar el mensaje desde WhatsApp

---

## Estimación de Tiempos

| Fase | Tiempo Estimado |
|------|----------------|
| 1. Base de Datos | 30 min |
| 2. Backend API | 45 min |
| 3. Widget | 60 min |
| 4. Política de Privacidad | 30 min |
| 5. Dashboard - Configuración | 90 min |
| 6. Dashboard - Reservas | 60 min |
| 7. Testing Completo | 45 min |
| **TOTAL** | **6 horas** |

---

## Orden Recomendado de Implementación

1. **Base de Datos** (Fase 1) - Fundación de todo
2. **Backend API** (Fase 2) - Lógica de negocio
3. **Política de Privacidad** (Fase 4) - Necesaria antes del widget
4. **Widget** (Fase 3) - Captura de consentimiento
5. **Dashboard - Configuración** (Fase 5) - Configuración del negocio
6. **Dashboard - Reservas** (Fase 6) - Uso de la funcionalidad
7. **Testing Completo** (Fase 7) - Validación final

---

## Notas Importantes

### GDPR y Privacidad
- ✅ Consentimiento es OPCIONAL (no bloquea reservas)
- ✅ Enlace a política de privacidad proporcionado
- ✅ Usuario puede revocar consentimiento (contactando negocio)
- ✅ Datos solo se usan para confirmación de reserva

### Seguridad
- ✅ Solo el dueño del negocio puede modificar configuración
- ✅ Validación de formato de número de teléfono
- ✅ Sanitización de plantilla (límite de caracteres)
- ✅ No se exponen números de teléfono innecesariamente

### UX
- ✅ Click-to-Chat es simple y familiar para usuarios
- ✅ No requiere API de WhatsApp Business (sin costos)
- ✅ Cada negocio usa su propio número
- ✅ Plantillas personalizables por negocio

### Escalabilidad
- ✅ Sin límites compartidos (cada negocio usa su WhatsApp)
- ✅ No hay costos por volumen
- ✅ Fácil de mantener (sin integraciones complejas)

---

## Próximos Pasos Después de Implementación

1. **Monitorear Uso**
   - Añadir analytics para ver % de usuarios que dan consentimiento
   - Medir % de negocios que configuran WhatsApp
   - Rastrear clicks en botón "Enviar WhatsApp"

2. **Mejoras Futuras Opcionales**
   - Integración con WhatsApp Business API (automático)
   - Múltiples plantillas por tipo de reserva
   - Envío automático al confirmar reserva
   - Recordatorios por WhatsApp 24h antes

3. **Documentación**
   - Crear guía para negocios: "Cómo configurar WhatsApp"
   - FAQ sobre WhatsApp vs Email
   - Video tutorial de configuración

---

**¡Listo para implementar! 🚀**
