# Guía Rápida de Inicio - StickyWork

## Pasos para poner en marcha el sistema

### 1. Instalar Node.js

Si no tienes Node.js instalado, descárgalo desde: https://nodejs.org/

Verifica la instalación:
```bash
node --version
npm --version
```

### 2. Instalar MySQL

Si no tienes MySQL instalado:

**Windows:**
- Descarga MySQL desde: https://dev.mysql.com/downloads/installer/
- O instala XAMPP: https://www.apachefriends.org/

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

### 3. Configurar el proyecto

#### a) Instalar dependencias
```bash
cd stickywork
npm install
```

#### b) Configurar base de datos
Edita el archivo `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=stickywork
DB_PORT=3306
```

#### c) Crear base de datos
```bash
npm run setup
```

Verás este mensaje si todo va bien:
```
✅ ¡Base de datos configurada exitosamente!
```

### 4. Iniciar el servidor

```bash
npm start
```

Verás:
```
🚀 SERVIDOR STICKYWORK INICIADO
📍 URL: http://localhost:3000
```

### 5. Probar el sistema

Abre tu navegador y visita:

- **Sitio web:** http://localhost:3000
- **Demo en vivo:** http://localhost:3000/demo
- **Ejemplo de integración:** http://localhost:3000/ejemplo-integracion.html

### 6. Hacer tu primera reserva

1. Ve a http://localhost:3000/demo
2. Completa el formulario del widget
3. ¡Listo! La reserva se guardará en MySQL

### 7. Verificar reservas en la base de datos

Conéctate a MySQL:
```bash
mysql -u root -p
```

Consulta las reservas:
```sql
USE stickywork;
SELECT * FROM bookings;
```

## Integrar el widget en tu web

Copia este código en tu HTML:

```html
<div id="stickywork-widget"></div>

<script src="http://localhost:3000/public/widget/stickywork-widget.js"></script>
<script>
  StickyWork.init({
    businessId: 1,
    apiUrl: 'http://localhost:3000',
    primaryColor: '#3b82f6'
  });
</script>
```

## API REST - Ejemplos rápidos

### Obtener servicios
```bash
curl http://localhost:3000/api/services/1
```

### Crear reserva
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": 1,
    "serviceId": 1,
    "customerName": "Juan Pérez",
    "customerEmail": "juan@email.com",
    "customerPhone": "+34 600000000",
    "bookingDate": "2024-12-20",
    "bookingTime": "10:00:00"
  }'
```

### Ver todas las reservas
```bash
curl http://localhost:3000/api/bookings/1
```

### Ver disponibilidad
```bash
curl http://localhost:3000/api/availability/1?date=2024-12-20
```

## Problemas comunes

### Error: "Cannot connect to MySQL"

**Solución:**
1. Verifica que MySQL esté corriendo:
   ```bash
   # Windows (XAMPP)
   Inicia MySQL desde el panel de XAMPP

   # Mac
   brew services start mysql

   # Linux
   sudo systemctl start mysql
   ```

2. Verifica credenciales en `.env`

### Error: "Port 3000 already in use"

**Solución:** Cambia el puerto en `.env`:
```env
PORT=3001
```

### Widget no aparece

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores
3. Verifica que el servidor esté corriendo
4. Asegúrate de que la URL del script sea correcta

## Siguiente paso: Personalización

### Cambiar colores del widget

```javascript
StickyWork.init({
  businessId: 1,
  apiUrl: 'http://localhost:3000',
  primaryColor: '#FF6B6B',      // Rojo
  secondaryColor: '#4ECDC4',    // Turquesa
  language: 'es'
});
```

### Agregar tus propios servicios

Edita directamente en MySQL o usa phpMyAdmin:

```sql
INSERT INTO services (business_id, name, description, duration, price)
VALUES (
  1,
  'Corte Premium',
  'Corte de cabello con estilista profesional',
  45,
  30.00
);
```

### Crear tu propio negocio

```sql
INSERT INTO businesses (name, type, email, phone)
VALUES (
  'Mi Peluquería',
  'Peluquería',
  'contacto@mipeluqueria.com',
  '+34 900 000 000'
);
```

Anota el ID que se genera y úsalo en el widget:
```javascript
businessId: 2  // Tu nuevo ID
```

## Comandos útiles

```bash
# Iniciar servidor
npm start

# Modo desarrollo (auto-reload)
npm run dev

# Reinstalar base de datos
npm run setup

# Ver logs en tiempo real
npm start

# Detener servidor
Ctrl + C
```

## Recursos

- README completo: `README.md`
- Ejemplo de integración: `ejemplo-integracion.html`
- Demo en vivo: http://localhost:3000/demo

## Configurar Horarios Partidos (Múltiples Turnos)

### ¿Qué son los horarios partidos?

Permite configurar 1, 2 o 3 turnos independientes para tu negocio.

**Ejemplos de uso:**
- **Restaurante**: 3 turnos (Desayunos 08:00-11:00, Comidas 12:30-16:00, Cenas 20:00-23:00)
- **Taller**: 1 turno continuo (08:00-18:00)
- **Peluquería**: 2 turnos (Mañana 09:00-13:30, Tarde 16:00-20:00)

### Cómo configurarlo

1. Ve al panel de administración de tu negocio
2. Pestaña **"Horarios"**
3. Selecciona **"Horarios Partidos (Turnos)"**
4. Elige cuántos turnos necesitas (1, 2 o 3)
5. Configura cada turno:
   - Nombre del turno (ej: "Comidas", "Cenas")
   - Hora de inicio (ej: 12:30)
   - Hora de fin (ej: 16:00)
   - Activar/desactivar turno
6. Click **"Guardar Horarios"**

### Estructura en Base de Datos

Los horarios se guardan en formato JSON en el campo `booking_settings`:

```json
{
  "scheduleType": "multiple",
  "workDays": [1, 2, 3, 4, 5, 6],
  "shifts": [
    {
      "id": 1,
      "name": "Comidas",
      "startTime": "12:30",
      "endTime": "16:00",
      "enabled": true
    },
    {
      "id": 2,
      "name": "Cenas",
      "startTime": "20:00",
      "endTime": "23:00",
      "enabled": true
    }
  ],
  "slotDuration": 30
}
```

### Widget - Visualización

El widget mostrará las horas agrupadas por turno:

```
┌─────────────────────┐
│ Seleccione hora  ▼ │
├─────────────────────┤
│ 📅 COMIDAS         │
│   12:30            │
│   13:00            │
│   13:30            │
│   ...              │
│ 📅 CENAS           │
│   20:00            │
│   20:30            │
│   21:00            │
│   ...              │
└─────────────────────┘
```

### Migrar de Horario Continuo a Partidos

Si tienes un negocio con horario continuo y quieres cambiarlo a partidos:

1. Ve al dashboard de tu negocio
2. Cambia el tipo a "Horarios Partidos"
3. Configura tus turnos
4. Los clientes verán automáticamente la nueva configuración

El sistema mantiene compatibilidad con ambos modos.

---

## Soporte

Si tienes problemas:
1. Lee el README.md completo
2. Revisa las notas de sesión (NOTAS_SESION_*.md)
3. Revisa la sección de Troubleshooting
4. Verifica los logs del servidor
5. Abre un issue en GitHub

---

¡Feliz desarrollo! 🚀
