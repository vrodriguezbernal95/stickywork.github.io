// StickyWork Backend Server - Updated 2026-01-05
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const cron = require('node-cron');
// Solo cargar dotenv en desarrollo (en producción Railway inyecta las variables)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const db = require('./config/database');
const routes = require('./backend/routes');
const emailService = require('./backend/email-service');
const { marcarFeedbacksPendientes } = require('./backend/jobs/enviar-feedback');
const { enviarRecordatoriosCitas } = require('./backend/jobs/enviar-recordatorios');

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

// Confiar en el proxy de Railway para X-Forwarded-For (necesario para express-rate-limit)
app.set('trust proxy', 1);

// ==================== MIDDLEWARE ====================

// Security Headers - Helmet (debe ir primero)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"], // Permite onclick, onsubmit, etc.
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Permite embedding del widget
  crossOriginResourcePolicy: false  // Permite que el widget se cargue desde otros dominios
}));

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
app.use('/admin', express.static(path.join(__dirname, 'admin')));

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
    // Mostrar TODAS las variables (ocultando passwords)
    const allVars = {};
    Object.keys(process.env).sort().forEach(key => {
        if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')) {
            allVars[key] = '***HIDDEN***';
        } else {
            allVars[key] = process.env[key];
        }
    });
    res.json({
        totalEnvVars: Object.keys(process.env).length,
        allVars
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

app.get('/gestionar-reserva', (req, res) => {
    res.sendFile(path.join(__dirname, 'gestionar-reserva.html'));
});

app.get('/fidelidad', (req, res) => {
    res.sendFile(path.join(__dirname, 'fidelidad.html'));
});

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada
app.use((req, res) => {
    // Si es una petición de API, devolver JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'Ruta no encontrada'
        });
    }

    // Para páginas HTML, devolver página 404 personalizada
    res.status(404).sendFile(path.join(__dirname, '404.html'));
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
    // Iniciar servidor HTTP primero (sin esperar DB)
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

    // Configurar DB en segundo plano (sin bloquear el inicio)
    // Force redeploy: 2025-12-10T09:30:00Z
    setTimeout(async () => {
        try {
            console.log('🔄 Configurando base de datos en segundo plano...');

            // Crear pool de conexiones a la base de datos
            await db.createPool();

            // Configurar base de datos en las rutas
            routes.setDatabase(db);

            // Verificar conexión a la base de datos
            const isConnected = await db.testConnection();

            if (!isConnected) {
                console.error('\n⚠️  ADVERTENCIA: No se pudo conectar a MySQL');
                console.error('El servidor está funcionando, pero las funciones de base de datos no están disponibles.');
                console.error('Por favor, verifica la configuración en el archivo .env\n');
                return;
            }

            // Ejecutar migraciones de BD
            await runMigrations();

            // Verificar configuración de email
            await emailService.verifyEmailService();

            console.log('✅ Base de datos configurada correctamente\n');

            // Configurar cron job para marcar feedbacks pendientes
            // Ejecutar cada hora
            cron.schedule('0 * * * *', async () => {
                console.log('⏰ [Cron] Ejecutando job de marcado de feedbacks pendientes...');
                try {
                    await marcarFeedbacksPendientes(db);
                } catch (error) {
                    console.error('❌ [Cron] Error en job de feedback:', error.message);
                }
            });

            console.log('⏰ Cron job de feedback configurado (cada hora - solo marca pendientes)\n');

            // Cron job: enviar recordatorios de citas cada día a las 10:00 AM (hora servidor UTC)
            cron.schedule('0 10 * * *', async () => {
                console.log('⏰ [Cron] Enviando recordatorios de citas...');
                try {
                    await enviarRecordatoriosCitas(db, emailService);
                } catch (error) {
                    console.error('❌ [Cron] Error en recordatorios de citas:', error.message);
                }
            });

            console.log('⏰ Cron job de recordatorios configurado (cada día a las 10:00 AM)\n');

        } catch (error) {
            console.error('⚠️  Error configurando base de datos:', error.message);
            console.error('El servidor continuará funcionando sin funcionalidad de BD\n');
        }
    }, 100);
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
