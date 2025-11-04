# StickyWork - Sistema de Reservas Online

Sistema completo de reservas online para negocios físicos (restaurantes, peluquerías, clínicas, etc.) con widget embebible y gestión mediante API REST.

## Características

- Widget JavaScript embebible en cualquier sitio web
- Backend con Node.js y Express
- Base de datos MySQL para almacenar reservas
- API REST completa
- Verificación de disponibilidad en tiempo real
- Sistema de notificaciones (preparado para expansión)
- Diseño responsive y profesional

## Requisitos Previos

- Node.js 14+ instalado
- MySQL 5.7+ o MariaDB instalado y en ejecución
- Git (opcional)

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

Edita el archivo `.env` con tus credenciales de MySQL:

```env
PORT=3000
NODE_ENV=development

# Configuración de MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=stickywork
DB_PORT=3306

APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 3. Crear base de datos y tablas

Ejecuta el script de configuración:

```bash
npm run setup
```

Este script:
- Crea la base de datos `stickywork`
- Crea las tablas necesarias (businesses, services, bookings)
- Inserta datos de ejemplo (negocio demo y servicios)

### 4. Iniciar el servidor

```bash
npm start
```

O para desarrollo con auto-reload:

```bash
npm run dev
```

El servidor estará disponible en: http://localhost:3000

## Estructura del Proyecto

```
stickywork/
├── backend/
│   ├── routes.js              # Rutas de la API
│   └── setup-database.js      # Script de configuración de BD
├── config/
│   └── database.js            # Configuración de MySQL
├── public/
│   └── widget/
│       └── stickywork-widget.js  # Widget embebible
├── css/
│   └── styles.css             # Estilos del sitio
├── js/
│   └── main.js                # JavaScript del sitio
├── index.html                 # Página principal
├── como-funciona.html         # Página "Cómo funciona"
├── planes.html                # Página de planes y precios
├── demo.html                  # Demo interactiva con widget real
├── contacto.html              # Página de contacto
├── server.js                  # Servidor Express
├── package.json               # Dependencias
├── .env                       # Configuración (crear desde .env.example)
└── README.md                  # Este archivo
```

## Uso del Widget

### Integración Básica

Agrega este código a cualquier página HTML:

```html
<!-- Contenedor del widget -->
<div id="stickywork-widget"></div>

<!-- Cargar script -->
<script src="http://localhost:3000/public/widget/stickywork-widget.js"></script>

<!-- Inicializar -->
<script>
  StickyWork.init({
    businessId: 1,                    // ID de tu negocio
    apiUrl: 'http://localhost:3000',  // URL de tu API
    primaryColor: '#3b82f6',          // Color principal
    language: 'es'                    // Idioma
  });
</script>
```

### Opciones de Configuración

```javascript
StickyWork.init({
  businessId: 1,                      // Requerido: ID de tu negocio
  apiUrl: 'http://localhost:3000',    // Requerido: URL base de la API
  primaryColor: '#3b82f6',            // Opcional: Color principal
  secondaryColor: '#10b981',          // Opcional: Color secundario
  language: 'es',                     // Opcional: 'es' o 'en'
  containerId: 'stickywork-widget'    // Opcional: ID del contenedor
});
```

## API REST

### Endpoints Disponibles

#### Servicios

**GET** `/api/services/:businessId`
- Obtiene todos los servicios activos de un negocio
- Respuesta: `{ success: true, data: [...] }`

#### Reservas

**POST** `/api/bookings`
- Crea una nueva reserva
- Body:
  ```json
  {
    "businessId": 1,
    "serviceId": 1,
    "customerName": "María García",
    "customerEmail": "maria@email.com",
    "customerPhone": "+34 600 000 000",
    "bookingDate": "2024-12-25",
    "bookingTime": "10:00:00",
    "notes": "Nota opcional"
  }
  ```

**GET** `/api/bookings/:businessId`
- Obtiene todas las reservas de un negocio
- Query params opcionales: `?date=2024-12-25&status=pending`

**GET** `/api/booking/:id`
- Obtiene una reserva específica

**PATCH** `/api/booking/:id`
- Actualiza el estado de una reserva
- Body: `{ "status": "confirmed" }`
- Estados válidos: `pending`, `confirmed`, `cancelled`, `completed`

#### Disponibilidad

**GET** `/api/availability/:businessId?date=2024-12-25`
- Obtiene horarios disponibles para una fecha
- Respuesta incluye: `availableTimes` y `bookedTimes`

#### Negocios

**GET** `/api/business/:businessId`
- Obtiene información de un negocio

#### Estadísticas

**GET** `/api/stats/:businessId`
- Obtiene estadísticas del negocio
- Total de reservas, reservas por estado, reservas del mes

### Ejemplos de Uso con cURL

Crear una reserva:
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": 1,
    "serviceId": 1,
    "customerName": "Juan Pérez",
    "customerEmail": "juan@email.com",
    "customerPhone": "+34 600 000 000",
    "bookingDate": "2024-12-20",
    "bookingTime": "10:00:00"
  }'
```

Obtener disponibilidad:
```bash
curl http://localhost:3000/api/availability/1?date=2024-12-20
```

## Base de Datos

### Tabla: businesses
Almacena información de los negocios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| name | VARCHAR(255) | Nombre del negocio |
| type | VARCHAR(100) | Tipo de negocio |
| email | VARCHAR(255) | Email de contacto |
| phone | VARCHAR(50) | Teléfono |
| address | TEXT | Dirección |
| widget_settings | JSON | Configuración del widget |

### Tabla: services
Almacena los servicios ofrecidos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| business_id | INT | ID del negocio |
| name | VARCHAR(255) | Nombre del servicio |
| description | TEXT | Descripción |
| duration | INT | Duración en minutos |
| price | DECIMAL(10,2) | Precio |
| is_active | BOOLEAN | Si está activo |

### Tabla: bookings
Almacena las reservas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| business_id | INT | ID del negocio |
| service_id | INT | ID del servicio |
| customer_name | VARCHAR(255) | Nombre del cliente |
| customer_email | VARCHAR(255) | Email del cliente |
| customer_phone | VARCHAR(50) | Teléfono |
| booking_date | DATE | Fecha de la reserva |
| booking_time | TIME | Hora de la reserva |
| notes | TEXT | Notas adicionales |
| status | ENUM | Estado: pending, confirmed, cancelled, completed |

## Desarrollo

### Scripts disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor con nodemon (auto-reload)
- `npm run setup` - Configura la base de datos

### Agregar un nuevo negocio

Puedes agregar negocios directamente en la base de datos:

```sql
INSERT INTO businesses (name, type, email, phone, address, widget_settings)
VALUES (
  'Mi Negocio',
  'Restaurante',
  'contacto@minegocio.com',
  '+34 900 000 000',
  'Calle Principal 123',
  '{"primaryColor": "#3b82f6", "language": "es"}'
);
```

### Agregar servicios

```sql
INSERT INTO services (business_id, name, description, duration, price)
VALUES (1, 'Servicio Especial', 'Descripción del servicio', 60, 45.00);
```

## Troubleshooting

### Error de conexión a MySQL

Si ves el error "Access denied for user":
1. Verifica las credenciales en el archivo `.env`
2. Asegúrate de que MySQL esté en ejecución
3. Verifica los permisos del usuario en MySQL

```sql
GRANT ALL PRIVILEGES ON stickywork.* TO 'tu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

### El widget no se carga

1. Verifica que el servidor esté en ejecución
2. Revisa la consola del navegador para errores
3. Asegúrate de que la URL del `apiUrl` sea correcta
4. Verifica que el `businessId` exista en la base de datos

### Puerto 3000 ya en uso

Cambia el puerto en el archivo `.env`:
```env
PORT=3001
```

Y actualiza la URL en el widget:
```javascript
apiUrl: 'http://localhost:3001'
```

## Próximas Funcionalidades

- [ ] Panel de administración completo
- [ ] Sistema de autenticación de usuarios
- [ ] Notificaciones por email automáticas
- [ ] Notificaciones SMS
- [ ] Integración con Google Calendar
- [ ] Pasarela de pagos (Stripe/PayPal)
- [ ] Reportes y analytics avanzados
- [ ] Multi-idioma completo
- [ ] Temas personalizables
- [ ] App móvil

## Licencia

Proyecto educativo - Libre para uso y modificación

## Soporte

Para preguntas o problemas, abre un issue en el repositorio.

---

Desarrollado con ❤️ para negocios que buscan digitalizar sus reservas
