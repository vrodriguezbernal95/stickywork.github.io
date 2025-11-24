const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const routes = require('./backend/routes');
const emailService = require('./backend/email-service');

// Función para crear tablas necesarias
async function runMigrations() {
    const usePostgres = process.env.DATABASE_URL || process.env.USE_POSTGRES === 'true';
    if (!usePostgres) return; // Solo para PostgreSQL en producción

    console.log('🔄 Ejecutando migraciones PostgreSQL...');
    try {
        // Crear tabla business_types
        await db.query(`
            CREATE TABLE IF NOT EXISTS business_types (
                id SERIAL PRIMARY KEY,
                type_key VARCHAR(50) NOT NULL UNIQUE,
                type_name VARCHAR(100) NOT NULL,
                icon VARCHAR(10),
                description TEXT,
                booking_mode VARCHAR(20) DEFAULT 'services',
                required_fields JSONB,
                default_services JSONB,
                widget_config JSONB,
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insertar tipos de negocio
        const types = [
            ['salon', 'Peluquería / Salón', '💇', 'Cortes, tintes, tratamientos', 'services', 1],
            ['clinic', 'Clínica / Consultorio', '🏥', 'Consultas médicas', 'services', 2],
            ['restaurant', 'Restaurante / Bar', '🍽️', 'Reservas de mesas', 'tables', 3],
            ['nutrition', 'Centro de Nutrición', '🥗', 'Consultas nutricionales', 'services', 4],
            ['gym', 'Gimnasio', '💪', 'Clases y entrenamientos', 'classes', 5],
            ['spa', 'Spa / Bienestar', '🧖', 'Masajes, tratamientos', 'services', 6],
            ['lawyer', 'Despacho de Abogados', '⚖️', 'Consultas legales', 'services', 7],
            ['other', 'Otro', '🎯', 'Configúralo a tu medida', 'simple', 8]
        ];
        for (const t of types) {
            await db.query(`INSERT INTO business_types (type_key, type_name, icon, description, booking_mode, display_order) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (type_key) DO NOTHING`, t);
        }

        // Crear tabla professionals
        await db.query(`
            CREATE TABLE IF NOT EXISTS professionals (
                id SERIAL PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                specialization VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Migraciones completadas');
    } catch (err) {
        console.error('⚠️ Error en migraciones:', err.message);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// CORS - permitir peticiones desde cualquier origen
app.use(cors());

// Body parser para JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Logger simple
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==================== RUTAS API ====================

app.use(routes);

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// ==================== RUTAS HTML ====================

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Otras páginas
app.get('/como-funciona', (req, res) => {
    res.sendFile(path.join(__dirname, 'como-funciona.html'));
});

app.get('/planes', (req, res) => {
    res.sendFile(path.join(__dirname, 'planes.html'));
});

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

app.get('/contacto', (req, res) => {
    res.sendFile(path.join(__dirname, 'contacto.html'));
});

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== INICIAR SERVIDOR ====================

async function startServer() {
    try {
        // Crear pool de conexiones a la base de datos
        await db.createPool();

        // Verificar conexión a la base de datos
        const isConnected = await db.testConnection();

        if (!isConnected) {
            console.error('\n⚠️  ADVERTENCIA: No se pudo conectar a MySQL');
            console.error('El servidor se iniciará, pero las funciones de base de datos no estarán disponibles.');
            console.error('Por favor, verifica la configuración en el archivo .env\n');
        }

        // Ejecutar migraciones de BD
        await runMigrations();

        // Verificar configuración de email
        await emailService.verifyEmailService();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 SERVIDOR STICKYWORK INICIADO');
            console.log('='.repeat(50));
            console.log(`\n📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Base de datos: ${process.env.DB_NAME || 'stickywork'}`);
            console.log('\n📄 Páginas disponibles:');
            console.log(`   - Home: http://localhost:${PORT}`);
            console.log(`   - Cómo funciona: http://localhost:${PORT}/como-funciona`);
            console.log(`   - Planes: http://localhost:${PORT}/planes`);
            console.log(`   - Demo: http://localhost:${PORT}/demo`);
            console.log(`   - Contacto: http://localhost:${PORT}/contacto`);
            console.log('\n🔌 API Endpoints:');
            console.log(`   - GET  /api/health - Estado del servidor`);
            console.log(`   - GET  /api/services/:businessId - Obtener servicios`);
            console.log(`   - POST /api/bookings - Crear reserva`);
            console.log(`   - GET  /api/bookings/:businessId - Listar reservas`);
            console.log(`   - GET  /api/availability/:businessId - Horarios disponibles`);
            console.log('\n' + '='.repeat(50) + '\n');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM recibido. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
    process.exit(0);
});

// Iniciar
startServer();
