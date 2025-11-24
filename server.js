const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const routes = require('./backend/routes');
const emailService = require('./backend/email-service');

// Función para ejecutar migraciones MySQL
async function runMigrations() {
    console.log('🔄 Verificando tablas MySQL...');
    try {
        // Verificar si existe la tabla business_types
        const tables = await db.query("SHOW TABLES LIKE 'business_types'");
        if (tables.length === 0) {
            console.log('⚠️ Tabla business_types no existe. Ejecuta: npm run setup');
        } else {
            console.log('✅ Tablas verificadas');
        }
    } catch (err) {
        console.error('⚠️ Error verificando tablas:', err.message);
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

// Debug de variables de entorno (solo en producción)
app.get('/api/debug/env', (req, res) => {
    res.json({
        hasMySQL_URL: !!process.env.MYSQL_URL,
        hasMYSQLURL: !!process.env.MYSQLURL,
        hasDB_HOST: !!process.env.DB_HOST,
        hasMYSQLHOST: !!process.env.MYSQLHOST,
        NODE_ENV: process.env.NODE_ENV,
        DB_HOST_value: process.env.DB_HOST || 'not set',
        MYSQLHOST_value: process.env.MYSQLHOST || 'not set'
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
