const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Usar SQLite en lugar de MySQL
const db = require('./config/database-sqlite');
const routes = require('./backend/routes');

// Configurar las rutas para usar SQLite en lugar de MySQL
routes.setDatabase(db);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('\n🔵 Iniciando servidor con SQLite (sin necesidad de MySQL)\n');

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
        message: 'Servidor funcionando correctamente con SQLite',
        database: 'SQLite',
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
        // Crear base de datos SQLite e inicializar tablas
        await db.createPool();

        // Verificar conexión
        const isConnected = await db.testConnection();

        if (!isConnected) {
            console.error('\n⚠️  ADVERTENCIA: No se pudo conectar a SQLite');
            return;
        }

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🚀 SERVIDOR STICKYWORK INICIADO (SQLite)');
            console.log('='.repeat(60));
            console.log(`\n📍 URL: http://localhost:${PORT}`);
            console.log(`💾 Base de datos: SQLite (archivo local - sin MySQL)`);
            console.log(`📁 Archivo BD: stickywork.db`);
            console.log('\n📄 Páginas disponibles:');
            console.log(`   - Home: http://localhost:${PORT}`);
            console.log(`   - Demo: http://localhost:${PORT}/demo`);
            console.log(`   - Test API: http://localhost:${PORT}/test-api.html`);
            console.log('\n✨ Ventajas de SQLite:');
            console.log('   ✓ No necesitas instalar MySQL');
            console.log('   ✓ Base de datos en un archivo');
            console.log('   ✓ Perfecto para desarrollo y pruebas');
            console.log('\n' + '='.repeat(60) + '\n');
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
