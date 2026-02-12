const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const authRoutes = require('./routes/auth');
const setupDemosRoutes = require('./routes/setup-demos');
const superAdminRoutes = require('./routes/super-admin');
const supportRoutes = require('./routes/support');
const feedbackRoutes = require('./routes/feedback');
const aiReportsRoutes = require('./routes/ai-reports');
const teamRoutes = require('./routes/team');
const stripeRoutes = require('./routes/stripe');
const consultancyRoutes = require('./routes/consultancy');
const workshopsRoutes = require('./routes/workshops');
const { requireAuth, requireBusinessAccess, requireRole } = require('./middleware/auth');
const { validateServicesLimit, validateUsersLimit, validateBookingLimit, getPlanInfo } = require('./middleware/entitlements');
const emailService = require('./email-service');
const { setupPostgres } = require('./setup-postgres');
const { createBookingLimiter, contactLimiter } = require('./middleware/rate-limit');

// Permitir inyección de la base de datos (MySQL o SQLite)
let db = require('../config/database');

function setDatabase(database) {
    db = database;
    authRoutes.setDatabase(database);
    feedbackRoutes.setDatabase(database);
    consultancyRoutes.setDatabase(database);
    workshopsRoutes.setDatabase(database);
}

router.setDatabase = setDatabase;

// ==================== FUNCIONES AUXILIARES DE HORARIOS ====================

/**
 * Convierte una hora en formato HH:MM a minutos desde medianoche
 * @param {string} time - Hora en formato HH:MM
 * @returns {number} - Minutos desde medianoche
 */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Verifica si una hora está dentro de un rango
 * @param {string} time - Hora a validar (HH:MM)
 * @param {string} startTime - Hora inicio del rango (HH:MM)
 * @param {string} endTime - Hora fin del rango (HH:MM)
 * @returns {boolean}
 */
function isTimeInRange(time, startTime, endTime) {
    const timeMin = timeToMinutes(time);
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    return timeMin >= startMin && timeMin < endMin;
}

/**
 * Valida que dos rangos de tiempo no se solapen
 * @param {Object} shift1 - Primer turno {startTime, endTime}
 * @param {Object} shift2 - Segundo turno {startTime, endTime}
 * @returns {boolean} - true si hay solapamiento
 */
function shiftsOverlap(shift1, shift2) {
    const start1 = timeToMinutes(shift1.startTime);
    const end1 = timeToMinutes(shift1.endTime);
    const start2 = timeToMinutes(shift2.startTime);
    const end2 = timeToMinutes(shift2.endTime);

    return (start1 < end2 && end1 > start2);
}

/**
 * Verifica solapamientos en un array de turnos
 * @param {Array} shifts - Array de turnos [{id, startTime, endTime, enabled}]
 * @throws {Error} Si hay solapamientos
 */
function checkOverlaps(shifts) {
    const activeShifts = shifts.filter(s => s.enabled);

    for (let i = 0; i < activeShifts.length; i++) {
        for (let j = i + 1; j < activeShifts.length; j++) {
            if (shiftsOverlap(activeShifts[i], activeShifts[j])) {
                throw new Error(`Los turnos "${activeShifts[i].name || i+1}" y "${activeShifts[j].name || j+1}" se solapan`);
            }
        }
    }
}

/**
 * Valida formato HH:MM
 * @param {string} time - Hora a validar
 * @returns {boolean}
 */
function isValidTimeFormat(time) {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
}

/**
 * Valida un array de turnos
 * @param {Array} shifts - Array de turnos a validar
 * @throws {Error} Si la validación falla
 */
function validateShifts(shifts) {
    if (!Array.isArray(shifts)) {
        throw new Error('Los turnos deben ser un array');
    }

    if (shifts.length === 0) {
        throw new Error('Debe haber al menos un turno');
    }

    if (shifts.length > 3) {
        throw new Error('Máximo 3 turnos permitidos');
    }

    // Verificar que haya al menos un turno activo
    const activeShifts = shifts.filter(s => s.enabled);
    if (activeShifts.length === 0) {
        throw new Error('Debe haber al menos un turno activo');
    }

    // Validar cada turno
    for (const shift of shifts) {
        if (!shift.startTime || !shift.endTime) {
            throw new Error('Cada turno debe tener hora de inicio y fin');
        }

        if (!isValidTimeFormat(shift.startTime)) {
            throw new Error(`Formato de hora inicio inválido: ${shift.startTime}`);
        }

        if (!isValidTimeFormat(shift.endTime)) {
            throw new Error(`Formato de hora fin inválido: ${shift.endTime}`);
        }

        const start = timeToMinutes(shift.startTime);
        const end = timeToMinutes(shift.endTime);

        if (start >= end) {
            throw new Error(`La hora fin debe ser mayor que la hora inicio en el turno "${shift.name || ''}"`);
        }
    }

    // Validar solapamientos
    checkOverlaps(shifts);
}

// ==================== AUTENTICACIÓN ====================
router.use(authRoutes);

// ==================== SUPER ADMIN ====================
router.use('/api/super-admin', superAdminRoutes);

// ==================== SUPPORT MESSAGES ====================
router.use('/api/support', supportRoutes);

// ==================== FEEDBACK ====================
router.use(feedbackRoutes);

// ==================== AI REPORTS ====================
router.use(aiReportsRoutes);

// ==================== TEAM MANAGEMENT ====================
router.use(teamRoutes);

// ==================== STRIPE / PAGOS ====================
router.use(stripeRoutes);

// ==================== CONSULTORÍAS (PREMIUM) ====================
router.use('/api/consultancy', consultancyRoutes);

// ==================== TALLERES / WORKSHOPS ====================
router.use('/api/workshops', workshopsRoutes);

// ==================== DEBUG ENDPOINT ====================
router.get('/api/debug/version', async (req, res) => {
    // Verificar estado del email service
    let emailStatus = 'not_configured';
    let emailMethod = 'none';

    // Preferir Brevo API
    if (process.env.BREVO_API_KEY) {
        emailStatus = 'configured';
        emailMethod = 'brevo_api';
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        emailMethod = 'smtp';
        try {
            const transporter = emailService.getTransporter();
            if (transporter) {
                await transporter.verify();
                emailStatus = 'connected';
            }
        } catch (error) {
            emailStatus = 'error: ' + error.message;
        }
    }

    res.json({
        success: true,
        version: '3f43ff9',
        timestamp: '2026-01-26T11:00:00Z',
        message: 'Brevo API HTTP para emails',
        features: {
            aiReportsEnabled: true,
            nullHandling: true,
            apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
            emailConfigured: !!process.env.BREVO_API_KEY || !!process.env.EMAIL_USER,
            emailMethod: emailMethod,
            emailStatus: emailStatus,
            stripeConfigured: !!process.env.STRIPE_SECRET_KEY
        }
    });
});

// Endpoint de prueba de email (solo super-admin)
router.post('/api/debug/test-email', async (req, res) => {
    // Verificar token de super-admin simple
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado'
        });
    }

    const { email, type } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email requerido'
        });
    }

    try {
        const testUser = {
            id: 999,
            email: email,
            full_name: 'Usuario de Prueba',
            role: 'staff'
        };

        const testBusiness = {
            name: 'Negocio de Prueba',
            email: 'test@stickywork.com'
        };

        let result;

        if (type === 'team-welcome') {
            // Probar email de bienvenida de equipo
            result = await emailService.sendTeamMemberWelcome(
                testUser,
                testBusiness,
                'password-temporal-123'
            );
        } else {
            // Email genérico de prueba
            result = await emailService.sendEmail(email, {
                subject: '🧪 Email de Prueba - StickyWork',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h1 style="color: #10b981;">✅ Email de Prueba Exitoso</h1>
                        <p>Este es un email de prueba del sistema StickyWork.</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                        <p>Si recibes este email, el sistema de emails está funcionando correctamente.</p>
                    </div>
                `
            });
        }

        res.json({
            success: true,
            message: `Email de prueba enviado a ${email}`,
            result: result
        });

    } catch (error) {
        console.error('Error enviando email de prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando email',
            error: error.message
        });
    }
});

// Endpoint para ejecutar migración de talleres (solo una vez)
router.post('/api/debug/run-workshops-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        // Crear tabla workshops
        await db.query(`
            CREATE TABLE IF NOT EXISTS workshops (
                id INT PRIMARY KEY AUTO_INCREMENT,
                business_id INT NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                workshop_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                capacity INT NOT NULL DEFAULT 10,
                price DECIMAL(10,2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT TRUE,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_workshop_business (business_id),
                INDEX idx_workshop_date (workshop_date),
                INDEX idx_workshop_active (is_active)
            )
        `);

        // Crear tabla workshop_bookings
        await db.query(`
            CREATE TABLE IF NOT EXISTS workshop_bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                workshop_id INT NOT NULL,
                customer_name VARCHAR(100) NOT NULL,
                customer_email VARCHAR(100) NOT NULL,
                customer_phone VARCHAR(20),
                num_people INT NOT NULL DEFAULT 1,
                total_price DECIMAL(10,2) DEFAULT 0.00,
                status ENUM('pending', 'confirmed', 'cancelled', 'attended', 'no_show') DEFAULT 'confirmed',
                notes TEXT,
                whatsapp_consent BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_wb_workshop (workshop_id),
                INDEX idx_wb_email (customer_email),
                INDEX idx_wb_status (status)
            )
        `);

        res.json({
            success: true,
            message: 'Migración de talleres ejecutada correctamente',
            tables: ['workshops', 'workshop_bookings']
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// Migración para sesiones múltiples en talleres
router.post('/api/debug/run-workshop-sessions-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: Sesiones múltiples para talleres');

        // 1. Crear tabla workshop_sessions
        console.log('📝 Creando tabla workshop_sessions...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS workshop_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                workshop_id INT NOT NULL,
                session_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                capacity INT NOT NULL DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_ws_workshop (workshop_id),
                INDEX idx_ws_date (session_date),
                FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla workshop_sessions creada');

        // 2. Migrar talleres que no tengan sesiones todavía
        console.log('📝 Migrando talleres sin sesiones...');
        const result = await db.query(`
            INSERT INTO workshop_sessions (workshop_id, session_date, start_time, end_time, capacity)
            SELECT w.id, w.workshop_date, w.start_time, w.end_time, w.capacity
            FROM workshops w
            LEFT JOIN workshop_sessions ws ON w.id = ws.workshop_id
            WHERE w.workshop_date IS NOT NULL AND ws.id IS NULL
        `);
        console.log(`✅ ${result.affectedRows || 0} sesiones migradas`);

        // 3. Añadir columna session_id a workshop_bookings
        console.log('📝 Añadiendo columna session_id a workshop_bookings...');
        try {
            await db.query(`
                ALTER TABLE workshop_bookings
                ADD COLUMN session_id INT DEFAULT NULL AFTER workshop_id,
                ADD INDEX idx_wb_session (session_id)
            `);
            console.log('✅ Columna session_id añadida');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna session_id ya existe');
            } else {
                throw error;
            }
        }

        // 4. Vincular bookings existentes a sus sesiones
        console.log('📝 Vinculando reservas existentes a sesiones...');
        await db.query(`
            UPDATE workshop_bookings wb
            JOIN workshop_sessions ws ON ws.workshop_id = wb.workshop_id
            SET wb.session_id = ws.id
            WHERE wb.session_id IS NULL
        `);
        console.log('✅ Reservas vinculadas');

        res.json({
            success: true,
            message: 'Migración de sesiones ejecutada correctamente',
            tables: ['workshop_sessions'],
            columns: ['workshop_bookings.session_id']
        });

    } catch (error) {
        console.error('Error en migración de sesiones:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// Endpoint para ejecutar migración de adultos/niños en reservas (solo una vez)
router.post('/api/debug/run-children-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: Diferenciación Adultos/Niños');

        // Agregar columna num_adults a bookings
        console.log('📝 Agregando columna num_adults...');
        try {
            await db.query(`
                ALTER TABLE bookings
                ADD COLUMN num_adults INT DEFAULT NULL
                COMMENT 'Número de adultos en la reserva'
            `);
            console.log('✅ Columna num_adults agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna num_adults ya existe');
            } else {
                throw error;
            }
        }

        // Agregar columna num_children a bookings
        console.log('📝 Agregando columna num_children...');
        try {
            await db.query(`
                ALTER TABLE bookings
                ADD COLUMN num_children INT DEFAULT NULL
                COMMENT 'Número de niños en la reserva'
            `);
            console.log('✅ Columna num_children agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna num_children ya existe');
            } else {
                throw error;
            }
        }

        res.json({
            success: true,
            message: 'Migración de adultos/niños ejecutada correctamente',
            columns: ['num_adults', 'num_children']
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// Endpoint para ejecutar migración de clientes/customers (solo una vez)
router.post('/api/debug/run-customers-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: Sistema de Clientes Premium/VIP');

        // Crear tabla customers
        console.log('📝 Creando tabla customers...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                is_premium BOOLEAN DEFAULT FALSE,
                notes TEXT,
                total_bookings INT DEFAULT 0,
                last_booking_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_customer (business_id, email, phone),
                INDEX idx_business (business_id),
                INDEX idx_premium (business_id, is_premium),
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla customers creada');

        res.json({
            success: true,
            message: 'Migración de clientes ejecutada correctamente',
            table: 'customers'
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// Migración para sistema de niveles de clientes (normal, premium, riesgo, baneado)
router.post('/api/debug/run-customer-status-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: Sistema de Niveles de Clientes');

        // Paso 1: Añadir columna status si no existe
        console.log('📝 Añadiendo columna status...');
        try {
            await db.query(`
                ALTER TABLE customers
                ADD COLUMN status ENUM('normal', 'premium', 'riesgo', 'baneado') DEFAULT 'normal'
                AFTER phone
            `);
            console.log('✅ Columna status añadida');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna status ya existe');
            } else {
                throw error;
            }
        }

        // Paso 2: Migrar datos de is_premium a status (si existe la columna is_premium)
        console.log('📝 Migrando datos de is_premium a status...');
        try {
            await db.query(`
                UPDATE customers
                SET status = CASE
                    WHEN is_premium = TRUE THEN 'premium'
                    ELSE 'normal'
                END
                WHERE status = 'normal' OR status IS NULL
            `);
            console.log('✅ Datos migrados');
        } catch (migrationError) {
            // Si la columna is_premium no existe, simplemente continuamos
            console.log('ℹ️  Columna is_premium no existe, saltando migración de datos');
        }

        // Paso 3: Actualizar índice
        console.log('📝 Actualizando índice...');
        try {
            await db.query('DROP INDEX idx_premium ON customers');
            console.log('✅ Índice idx_premium eliminado');
        } catch (error) {
            console.log('ℹ️  Índice idx_premium no existía');
        }

        try {
            await db.query('CREATE INDEX idx_status ON customers (business_id, status)');
            console.log('✅ Índice idx_status creado');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Índice idx_status ya existe');
            } else {
                throw error;
            }
        }

        // Nota: No eliminamos is_premium para mantener compatibilidad temporal
        // Se puede eliminar en una migración futura

        res.json({
            success: true,
            message: 'Migración de niveles de clientes completada',
            changes: [
                'Añadida columna status ENUM(normal, premium, riesgo, baneado)',
                'Migrados datos de is_premium a status',
                'Creado índice idx_status'
            ]
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message || error.sqlMessage || String(error),
            code: error.code
        });
    }
});

// Migración para página pública de reservas
router.post('/api/debug/run-public-page-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: Página Pública de Reservas');

        // Agregar columna public_page_settings a businesses
        console.log('📝 Agregando columna public_page_settings...');
        try {
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN public_page_settings JSON DEFAULT NULL
                COMMENT 'Configuración de la página pública de reservas (qué mostrar, privacidad)'
            `);
            console.log('✅ Columna public_page_settings agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna public_page_settings ya existe');
            } else {
                throw error;
            }
        }

        // Establecer configuración por defecto para negocios existentes
        console.log('📝 Estableciendo configuración por defecto...');
        const defaultSettings = JSON.stringify({
            pageEnabled: true,
            showPhone: true,
            showAddress: true,
            showWebsite: true,
            showSchedule: true
        });

        await db.query(`
            UPDATE businesses
            SET public_page_settings = ?
            WHERE public_page_settings IS NULL
        `, [defaultSettings]);
        console.log('✅ Configuración por defecto establecida');

        res.json({
            success: true,
            message: 'Migración de página pública ejecutada correctamente',
            column: 'public_page_settings'
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// ==================== SETUP DEMOS ====================
router.use(setupDemosRoutes);

// ==================== CLIENTES / CUSTOMERS ====================

/**
 * GET /api/customers/:businessId
 * Lista de clientes del negocio con filtros
 */
router.get('/api/customers/:businessId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { status, premium, search, sort } = req.query;

        let query = `
            SELECT * FROM customers
            WHERE business_id = ?
        `;
        const params = [businessId];

        // Filtro por status (nuevo sistema de niveles)
        if (status && ['normal', 'premium', 'riesgo', 'baneado'].includes(status)) {
            query += ' AND status = ?';
            params.push(status);
        } else if (premium === 'true') {
            // Compatibilidad: premium=true → status='premium'
            query += ' AND status = ?';
            params.push('premium');
        } else if (premium === 'false') {
            // Compatibilidad: premium=false → status='normal'
            query += ' AND status = ?';
            params.push('normal');
        }

        // Búsqueda por nombre, email o teléfono
        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Ordenamiento
        switch (sort) {
            case 'bookings':
                query += ' ORDER BY total_bookings DESC';
                break;
            case 'recent':
                query += ' ORDER BY last_booking_date DESC';
                break;
            case 'name':
            default:
                query += ' ORDER BY name ASC';
        }

        const customers = await db.query(query, params);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
});

/**
 * GET /api/customers/:businessId/:customerId
 * Detalle de cliente con historial de reservas
 */
router.get('/api/customers/:businessId/:customerId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId, customerId } = req.params;

        // Obtener cliente
        const customerQuery = await db.query(
            'SELECT * FROM customers WHERE id = ? AND business_id = ?',
            [customerId, businessId]
        );

        if (customerQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        const customer = customerQuery[0];

        // Obtener historial de reservas (últimas 20)
        const bookingsQuery = await db.query(`
            SELECT b.*, s.name as service_name
            FROM bookings b
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.business_id = ?
            AND (b.customer_email = ? OR b.customer_phone = ?)
            ORDER BY b.booking_date DESC, b.booking_time DESC
            LIMIT 20
        `, [businessId, customer.email, customer.phone]);

        res.json({
            success: true,
            data: {
                ...customer,
                bookings: bookingsQuery
            }
        });
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cliente',
            error: error.message
        });
    }
});

/**
 * POST /api/customers/:businessId
 * Crear cliente manualmente
 */
router.post('/api/customers/:businessId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { name, email, phone, status, is_premium, notes } = req.body;

        // Validaciones
        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y teléfono son obligatorios'
            });
        }

        // Validar status si viene
        const validStatuses = ['normal', 'premium', 'riesgo', 'baneado'];
        let customerStatus = 'normal';
        if (status && validStatuses.includes(status)) {
            customerStatus = status;
        } else if (is_premium) {
            // Compatibilidad: is_premium=true → status='premium'
            customerStatus = 'premium';
        }

        // Verificar si ya existe
        const existingQuery = await db.query(
            'SELECT id FROM customers WHERE business_id = ? AND email = ? AND phone = ?',
            [businessId, email, phone]
        );

        if (existingQuery.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un cliente con ese email y teléfono'
            });
        }

        // Crear cliente
        const result = await db.query(
            `INSERT INTO customers (business_id, name, email, phone, status, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [businessId, name, email, phone, customerStatus, notes || null]
        );

        // Obtener cliente creado
        const customerQuery = await db.query(
            'SELECT * FROM customers WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente',
            data: customerQuery[0]
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cliente',
            error: error.message
        });
    }
});

/**
 * PATCH /api/customers/:businessId/:customerId
 * Actualizar cliente (cambiar nivel, notas, etc.)
 */
router.patch('/api/customers/:businessId/:customerId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId, customerId } = req.params;
        const { name, email, phone, status, is_premium, notes } = req.body;

        // Verificar que existe
        const existingQuery = await db.query(
            'SELECT id FROM customers WHERE id = ? AND business_id = ?',
            [customerId, businessId]
        );

        if (existingQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Construir query dinámico
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        // Nuevo campo status
        const validStatuses = ['normal', 'premium', 'riesgo', 'baneado'];
        if (status !== undefined && validStatuses.includes(status)) {
            updates.push('status = ?');
            params.push(status);
        } else if (is_premium !== undefined) {
            // Compatibilidad: is_premium → status
            updates.push('status = ?');
            params.push(is_premium ? 'premium' : 'normal');
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }

        params.push(customerId, businessId);

        await db.query(
            `UPDATE customers SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`,
            params
        );

        // Obtener cliente actualizado
        const customerQuery = await db.query(
            'SELECT * FROM customers WHERE id = ?',
            [customerId]
        );

        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente',
            data: customerQuery[0]
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar cliente',
            error: error.message
        });
    }
});

/**
 * DELETE /api/customers/:businessId/:customerId
 * Eliminar cliente
 */
router.delete('/api/customers/:businessId/:customerId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId, customerId } = req.params;

        // Verificar que existe
        const existingQuery = await db.query(
            'SELECT id FROM customers WHERE id = ? AND business_id = ?',
            [customerId, businessId]
        );

        if (existingQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        await db.query(
            'DELETE FROM customers WHERE id = ? AND business_id = ?',
            [customerId, businessId]
        );

        res.json({
            success: true,
            message: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cliente',
            error: error.message
        });
    }
});

/**
 * POST /api/customers/:businessId/sync
 * Sincronizar clientes desde reservas existentes
 */
router.post('/api/customers/:businessId/sync', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId } = req.params;

        console.log('🔄 Sincronizando clientes desde reservas para negocio:', businessId);

        // Obtener clientes únicos de las reservas
        const bookingsQuery = await db.query(`
            SELECT
                customer_name as name,
                customer_email as email,
                customer_phone as phone,
                COUNT(*) as total_bookings,
                MAX(booking_date) as last_booking_date
            FROM bookings
            WHERE business_id = ?
            AND customer_email IS NOT NULL
            AND customer_phone IS NOT NULL
            GROUP BY customer_email, customer_phone, customer_name
        `, [businessId]);

        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const booking of bookingsQuery) {
            // Verificar si ya existe
            const existingQuery = await db.query(
                'SELECT id, total_bookings FROM customers WHERE business_id = ? AND email = ? AND phone = ?',
                [businessId, booking.email, booking.phone]
            );

            if (existingQuery.length > 0) {
                // Actualizar estadísticas si es necesario
                const existing = existingQuery[0];
                if (booking.total_bookings > existing.total_bookings) {
                    await db.query(
                        `UPDATE customers
                         SET total_bookings = ?, last_booking_date = ?, name = ?
                         WHERE id = ?`,
                        [booking.total_bookings, booking.last_booking_date, booking.name, existing.id]
                    );
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                // Crear nuevo cliente
                await db.query(
                    `INSERT INTO customers (business_id, name, email, phone, total_bookings, last_booking_date)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [businessId, booking.name, booking.email, booking.phone, booking.total_bookings, booking.last_booking_date]
                );
                created++;
            }
        }

        console.log(`✅ Sincronización completada: ${created} creados, ${updated} actualizados, ${skipped} sin cambios`);

        res.json({
            success: true,
            message: 'Sincronización completada',
            stats: {
                total: bookingsQuery.length,
                created,
                updated,
                skipped
            }
        });
    } catch (error) {
        console.error('Error al sincronizar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al sincronizar clientes',
            error: error.message
        });
    }
});

// ==================== SERVICIOS ====================

// Crear un nuevo servicio (requiere owner o admin)
router.post('/api/services', requireAuth, requireRole('owner', 'admin'), requireBusinessAccess, validateServicesLimit, async (req, res) => {
    try {
        const {
            business_id,
            name,
            description,
            duration,
            price,
            is_active
        } = req.body;

        // Validaciones
        if (!business_id || !name || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios (business_id, name, duration)'
            });
        }

        // Crear servicio
        const result = await db.query(
            `INSERT INTO services (business_id, name, description, duration, price, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [business_id, name, description || null, duration, price || null, is_active !== false]
        );

        // Obtener el servicio creado
        const service = await db.query(
            'SELECT * FROM services WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Servicio creado exitosamente',
            data: service[0]
        });

    } catch (error) {
        console.error('Error al crear servicio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear servicio',
            error: error.message
        });
    }
});

// Actualizar un servicio (requiere owner o admin)
router.put('/api/services/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            duration,
            price,
            is_active
        } = req.body;

        // Verificar que el servicio existe
        const existing = await db.query('SELECT * FROM services WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        // Actualizar servicio
        await db.query(
            `UPDATE services
             SET name = ?, description = ?, duration = ?, price = ?, is_active = ?
             WHERE id = ?`,
            [
                name || existing[0].name,
                description !== undefined ? description : existing[0].description,
                duration || existing[0].duration,
                price !== undefined ? price : existing[0].price,
                is_active !== undefined ? is_active : existing[0].is_active,
                id
            ]
        );

        // Obtener servicio actualizado
        const service = await db.query('SELECT * FROM services WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Servicio actualizado exitosamente',
            data: service[0]
        });

    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar servicio',
            error: error.message
        });
    }
});

// Eliminar un servicio (requiere owner o admin)
router.delete('/api/services/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el servicio existe
        const existing = await db.query('SELECT * FROM services WHERE id = ?', [id]);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        // Eliminar servicio
        await db.query('DELETE FROM services WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Servicio eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar servicio',
            error: error.message
        });
    }
});

// Obtener todos los servicios de un negocio
router.get('/api/services/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        const services = await db.query(
            'SELECT * FROM services WHERE business_id = ? AND is_active = TRUE',
            [businessId]
        );

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener servicios',
            error: error.message
        });
    }
});

// Obtener disponibilidad de slots para una fecha
router.get('/api/availability/:businessId/:date', async (req, res) => {
    try {
        const { businessId, date } = req.params;

        // Obtener configuración del negocio
        const [business] = await db.query(
            'SELECT type_key, booking_settings FROM businesses WHERE id = ?',
            [businessId]
        );

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        // Obtener booking_mode
        const typeKey = business.type_key;
        const [businessType] = await db.query(
            'SELECT booking_mode FROM business_types WHERE type_key = ?',
            [typeKey]
        );
        const bookingMode = businessType?.booking_mode || 'services';

        const bookingSettings = business.booking_settings
            ? (typeof business.booking_settings === 'string'
                ? JSON.parse(business.booking_settings)
                : business.booking_settings)
            : {};

        // Capacidad del negocio
        const defaultCapacity = bookingMode === 'tables' ? 40 : 1;
        const businessCapacity = bookingSettings.businessCapacity || defaultCapacity;

        // Obtener todas las reservas para esa fecha (incluir zone para restaurantes)
        const bookings = await db.query(
            `SELECT booking_time, num_people, service_id, zone, status
             FROM bookings
             WHERE business_id = ? AND booking_date = ? AND status != 'cancelled'`,
            [businessId, date]
        );

        // Verificar si hay capacidad por zonas configurada
        const zoneCapacities = bookingSettings.zoneCapacities;
        const hasZoneCapacities = zoneCapacities && Object.keys(zoneCapacities).length > 0;

        // Calcular disponibilidad por slot
        const availability = {};

        if (bookingMode === 'tables' && hasZoneCapacities) {
            // MODO TABLES CON ZONAS: Sumar num_people por slot y zona
            // Redondear al par superior (3 personas ocupan mesa de 4)
            bookings.forEach(booking => {
                const time = booking.booking_time.substring(0, 5); // "HH:MM"
                const zone = booking.zone || 'Sin zona';
                const numPeople = booking.num_people || 1;
                const occupiedSeats = numPeople + (numPeople % 2); // Redondeo al par superior

                if (!availability[time]) {
                    availability[time] = {};
                }
                if (!availability[time][zone]) {
                    availability[time][zone] = { occupied: 0 };
                }
                availability[time][zone].occupied += occupiedSeats;
            });
        } else if (bookingMode === 'tables') {
            // MODO TABLES SIN ZONAS: Sumar num_people por slot
            // Redondear al par superior (3 personas ocupan mesa de 4)
            bookings.forEach(booking => {
                const time = booking.booking_time.substring(0, 5);
                const numPeople = booking.num_people || 1;
                const occupiedSeats = numPeople + (numPeople % 2); // Redondeo al par superior

                if (!availability[time]) {
                    availability[time] = { occupied: 0 };
                }
                availability[time].occupied += occupiedSeats;
            });
        } else if (bookingMode === 'classes') {
            // MODO CLASSES: Contar reservas por slot
            bookings.forEach(booking => {
                const time = booking.booking_time.substring(0, 5);
                if (!availability[time]) {
                    availability[time] = { occupied: 0 };
                }
                availability[time].occupied += 1;
            });
        } else {
            // MODO SERVICES: Contar número de reservas por slot
            bookings.forEach(booking => {
                const time = booking.booking_time.substring(0, 5);
                if (!availability[time]) {
                    availability[time] = { occupied: 0 };
                }
                availability[time].occupied += 1;
            });
        }

        // Calcular disponibilidad final
        const slots = {};

        if (bookingMode === 'tables' && hasZoneCapacities) {
            // Calcular disponibilidad por zona
            Object.keys(availability).forEach(time => {
                slots[time] = { zones: {} };

                // Calcular disponibilidad de cada zona
                Object.keys(zoneCapacities).forEach(zoneName => {
                    const capacity = zoneCapacities[zoneName];
                    const occupied = availability[time][zoneName]?.occupied || 0;
                    const available = Math.max(0, capacity - occupied);
                    const percentage = Math.round((occupied / capacity) * 100);

                    slots[time].zones[zoneName] = {
                        total: capacity,
                        occupied,
                        available,
                        percentage
                    };
                });
            });
        } else {
            // Calcular disponibilidad general
            Object.keys(availability).forEach(time => {
                const occupied = availability[time].occupied;
                const available = Math.max(0, businessCapacity - occupied);
                const percentage = Math.round((occupied / businessCapacity) * 100);

                slots[time] = {
                    total: businessCapacity,
                    occupied,
                    available,
                    percentage
                };
            });
        }

        res.json({
            success: true,
            date,
            businessCapacity,
            bookingMode,
            slots
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
            error: error.message
        });
    }
});

// ==================== RESERVAS ====================

// Crear una nueva reserva
router.post('/api/bookings', createBookingLimiter, async (req, res) => {
    try {
        // Soportar tanto businessId (camelCase) como business_id (snake_case) para compatibilidad con widget
        const businessId = req.body.businessId || req.body.business_id;
        const serviceId = req.body.serviceId || req.body.service_id;
        const customerName = req.body.customerName || req.body.customer_name;
        const customerEmail = req.body.customerEmail || req.body.customer_email;
        const customerPhone = req.body.customerPhone || req.body.customer_phone;
        const bookingDate = req.body.bookingDate || req.body.booking_date;
        const bookingTime = req.body.bookingTime || req.body.booking_time;
        const zone = req.body.zone || null; // Zona (Terraza, Interior, etc.)
        const notes = req.body.notes;
        const whatsappConsent = req.body.whatsappConsent || req.body.whatsapp_consent || false; // Consentimiento para WhatsApp

        // Soporte para diferenciación adultos/niños
        const numAdults = req.body.num_adults !== undefined ? parseInt(req.body.num_adults) : null;
        const numChildren = req.body.num_children !== undefined ? parseInt(req.body.num_children) : null;

        // Calcular numPeople: si hay adultos/niños, sumar; si no, usar valor directo
        let numPeople;
        if (numAdults !== null && numChildren !== null) {
            numPeople = numAdults + numChildren;
        } else {
            numPeople = parseInt(req.body.numPeople || req.body.num_people) || 2;
        }

        // Validaciones básicas
        if (!businessId || !customerName || !customerEmail || !customerPhone || !bookingDate || !bookingTime) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // Verificar si el cliente está baneado
        const bannedCheck = await db.query(
            `SELECT id, status FROM customers
             WHERE business_id = ? AND email = ? AND phone = ? AND status = 'baneado'`,
            [businessId, customerEmail, customerPhone]
        );

        if (bannedCheck.length > 0) {
            return res.status(403).json({
                success: false,
                message: '😔 Lo sentimos, no es posible realizar esta reserva. Por favor, contacta directamente con el establecimiento.',
                code: 'CUSTOMER_BANNED'
            });
        }

        // Obtener configuración del negocio para validar horarios, capacidad y límites de plan
        const businessSettingsQuery = await db.query(
            'SELECT type_key, booking_settings, plan, plan_limits FROM businesses WHERE id = ?',
            [businessId]
        );

        if (businessSettingsQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const business = businessSettingsQuery[0];
        const bookingSettings = business.booking_settings
            ? (typeof business.booking_settings === 'string'
                ? JSON.parse(business.booking_settings)
                : business.booking_settings)
            : {};

        // Validar límite de reservas mensuales según el plan
        const planLimits = business.plan_limits
            ? (typeof business.plan_limits === 'string'
                ? JSON.parse(business.plan_limits)
                : business.plan_limits)
            : null;

        if (planLimits && planLimits.maxBookingsPerMonth) {
            // Contar reservas del mes actual
            const bookingsCountQuery = await db.query(
                `SELECT COUNT(*) as total FROM bookings
                 WHERE business_id = ?
                 AND MONTH(booking_date) = MONTH(CURRENT_DATE)
                 AND YEAR(booking_date) = YEAR(CURRENT_DATE)
                 AND status != 'cancelled'`,
                [businessId]
            );

            const currentBookings = bookingsCountQuery[0].total;
            const limit = planLimits.maxBookingsPerMonth;

            if (currentBookings >= limit) {
                return res.status(403).json({
                    success: false,
                    message: `Este negocio ha alcanzado el límite de ${limit} reservas al mes de su plan. Por favor, contacta con el establecimiento directamente.`,
                    limitReached: true,
                    plan: business.plan
                });
            }
        }

        // Validar que la zona seleccionada esté activa (solo para restaurantes)
        if (zone && bookingSettings.restaurantZones) {
            const selectedZone = bookingSettings.restaurantZones.find(z => {
                const zoneName = typeof z === 'string' ? z : z.name;
                return zoneName === zone;
            });

            // Si la zona está en formato objeto y NO está explícitamente activa, rechazar
            if (selectedZone && typeof selectedZone === 'object') {
                // Si enabled está definido y es false, rechazar
                if (selectedZone.enabled === false || selectedZone.enabled === 'false') {
                    return res.status(400).json({
                        success: false,
                        message: 'La zona seleccionada no está disponible actualmente'
                    });
                }
            }
        }

        // Obtener booking_mode del negocio
        const typeKey = businessSettingsQuery[0].type_key;
        const businessTypesQuery = await db.query(
            'SELECT booking_mode FROM business_types WHERE type_key = ?',
            [typeKey]
        );
        const bookingMode = businessTypesQuery[0]?.booking_mode || 'services';

        // Validar máximo de personas por reserva (solo para restaurantes)
        if (bookingMode === 'tables' && bookingSettings.maxPerBooking) {
            const maxPerBooking = bookingSettings.maxPerBooking;
            if (numPeople > maxPerBooking) {
                return res.status(400).json({
                    success: false,
                    message: `El máximo de comensales por reserva es ${maxPerBooking} personas`
                });
            }
        }

        // Validar configuración de adultos/niños si está habilitada
        const childrenSettings = bookingSettings.childrenSettings;
        if (childrenSettings && childrenSettings.enabled && numAdults !== null) {
            // Validar mínimo de adultos
            const minAdults = childrenSettings.minAdults || 1;
            if (numAdults < minAdults) {
                return res.status(400).json({
                    success: false,
                    message: `Se requiere al menos ${minAdults} adulto${minAdults > 1 ? 's' : ''} por reserva`
                });
            }

            // Validar máximo de niños si está configurado
            if (childrenSettings.maxChildren !== null && childrenSettings.maxChildren !== undefined) {
                if (numChildren > childrenSettings.maxChildren) {
                    return res.status(400).json({
                        success: false,
                        message: `El máximo de niños por reserva es ${childrenSettings.maxChildren}`
                    });
                }
            }
        }

        // Validar día laboral
        const bookingDay = new Date(bookingDate + 'T00:00:00').getDay() || 7; // 0=Domingo -> 7

        // Determinar días laborales según el tipo de horario
        let workDays;
        const scheduleType = bookingSettings.scheduleType || 'continuous';

        if (scheduleType === 'multiple' && bookingSettings.shifts && bookingSettings.shifts.length > 0) {
            // Modo horarios partidos: construir workDays desde los activeDays de los turnos
            const allActiveDays = new Set();
            bookingSettings.shifts.forEach(shift => {
                if (shift.enabled) {
                    const activeDays = shift.activeDays || [1, 2, 3, 4, 5, 6, 7];
                    activeDays.forEach(day => allActiveDays.add(day));
                }
            });
            workDays = Array.from(allActiveDays);
        } else {
            // Modo continuo: usar workDays global
            workDays = bookingSettings.workDays || [1, 2, 3, 4, 5, 6];
        }

        if (!workDays.includes(bookingDay) || workDays.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El negocio no abre este día de la semana'
            });
        }

        // Validar que no se puedan hacer reservas para horas pasadas del mismo día
        const now = new Date();
        const bookingDateTime = new Date(bookingDate + 'T' + bookingTime);

        if (bookingDateTime < now) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden hacer reservas para horas pasadas'
            });
        }

        // Validar horario según tipo de configuración
        // scheduleType ya está declarado arriba en la validación de workDays (línea 581)
        let autoAssignedServiceId = serviceId; // Mantener el serviceId si viene del widget

        if (scheduleType === 'multiple' && bookingSettings.shifts) {
            // Validar que la hora esté dentro de algún turno activo
            let matchedShift = null;
            const bookingDayOfWeek = new Date(bookingDate).getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
            const bookingDay = bookingDayOfWeek === 0 ? 7 : bookingDayOfWeek; // Convertir a formato 1=Lunes, 7=Domingo

            for (const shift of bookingSettings.shifts) {
                if (!shift.enabled) continue;

                // Verificar si el turno está activo en este día de la semana
                const activeDays = shift.activeDays || [1, 2, 3, 4, 5, 6, 7]; // Por defecto todos los días
                const isDayActive = activeDays.includes(bookingDay);

                if (isDayActive && isTimeInRange(bookingTime, shift.startTime, shift.endTime)) {
                    matchedShift = shift;
                    break;
                }
            }

            if (!matchedShift) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora seleccionada está fuera del horario de atención para este día'
                });
            }

            // Para restaurantes, auto-asignar servicio basado en el turno
            if (bookingSettings.bookingMode === 'tables' && !autoAssignedServiceId) {
                // Buscar servicio que coincida con el nombre del turno
                const services = await db.query(
                    'SELECT id, name FROM services WHERE business_id = ? AND is_active = TRUE',
                    [businessId]
                );

                // Buscar servicio cuyo nombre coincida parcialmente con el turno (ej: "Comidas" → "Comida")
                const matchingService = services.find(s =>
                    s.name.toLowerCase().includes(matchedShift.name.toLowerCase().replace(/s$/, '')) ||
                    matchedShift.name.toLowerCase().includes(s.name.toLowerCase())
                );

                if (matchingService) {
                    autoAssignedServiceId = matchingService.id;
                }
            }
        } else {
            // Modo continuo - validar rango único
            const workStart = bookingSettings.workHoursStart || '09:00';
            const workEnd = bookingSettings.workHoursEnd || '20:00';

            if (!isTimeInRange(bookingTime, workStart, workEnd)) {
                return res.status(400).json({
                    success: false,
                    message: `El horario de atención es de ${workStart} a ${workEnd}`
                });
            }
        }

        // Validar capacidad según el modo de reserva
        // Default: 40 para restaurantes (tables), 1 para otros
        const defaultCapacity = bookingMode === 'tables' ? 40 : 1;
        const businessCapacity = bookingSettings.businessCapacity || defaultCapacity;

        if (bookingMode === 'classes') {
            // MODO CLASSES: Verificar capacidad del servicio específico
            const serviceQuery = await db.query(
                'SELECT capacity FROM services WHERE id = ?',
                [autoAssignedServiceId]
            );

            const serviceCapacity = serviceQuery[0]?.capacity || 15;

            // Contar reservas existentes para ese servicio en ese horario
            const countQuery = await db.query(
                `SELECT COUNT(*) as count FROM bookings
                 WHERE business_id = ?
                 AND booking_date = ?
                 AND booking_time = ?
                 AND service_id = ?
                 AND status != 'cancelled'`,
                [businessId, bookingDate, bookingTime, autoAssignedServiceId]
            );

            if (countQuery[0].count >= serviceCapacity) {
                return res.status(409).json({
                    success: false,
                    message: `😔 ¡Ups! Esta clase ya está completa. ¿Por qué no pruebas con otro horario? ¡Tenemos más opciones para ti!`
                });
            }

        } else if (bookingMode === 'tables') {
            // MODO TABLES: Sumar num_people de reservas existentes
            // Si hay zoneCapacities configuradas y viene una zona, validar por zona
            const zoneCapacities = bookingSettings.zoneCapacities;
            const hasZoneCapacities = zoneCapacities && Object.keys(zoneCapacities).length > 0;

            let capacityToCheck, queryParams, queryWhere;

            if (hasZoneCapacities && zone) {
                // Validar capacidad de zona específica
                capacityToCheck = zoneCapacities[zone];

                if (!capacityToCheck) {
                    return res.status(400).json({
                        success: false,
                        message: `La zona "${zone}" no está configurada`
                    });
                }

                // Contar solo reservas de esa zona
                queryWhere = `WHERE business_id = ? AND booking_date = ? AND booking_time = ?
                             AND zone = ? AND status != 'cancelled'`;
                queryParams = [businessId, bookingDate, bookingTime, zone];
            } else {
                // Sin zonas configuradas o sin zona seleccionada, usar capacidad general
                capacityToCheck = businessCapacity;
                queryWhere = `WHERE business_id = ? AND booking_date = ? AND booking_time = ?
                             AND status != 'cancelled'`;
                queryParams = [businessId, bookingDate, bookingTime];
            }

            // Para restaurantes: redondear al par superior (3 personas ocupan mesa de 4)
            // La fórmula num_people + (num_people % 2) suma 1 si es impar, 0 si es par
            const sumQuery = await db.query(
                `SELECT COALESCE(SUM(num_people + (num_people % 2)), 0) as total_people FROM bookings ${queryWhere}`,
                queryParams
            );

            const currentPeople = parseInt(sumQuery[0].total_people) || 0;
            const rawRequestedPeople = parseInt(numPeople) || 1;
            // Redondear al par superior: 1→2, 2→2, 3→4, 4→4, 5→6, etc.
            const requestedPeople = rawRequestedPeople + (rawRequestedPeople % 2);

            console.log('🔍 [DEBUG CAPACITY] zone:', zone || 'sin zona');
            console.log('🔍 [DEBUG CAPACITY] hasZoneCapacities:', hasZoneCapacities);
            console.log('🔍 [DEBUG CAPACITY] capacityToCheck:', capacityToCheck, typeof capacityToCheck);
            console.log('🔍 [DEBUG CAPACITY] currentPeople:', currentPeople, typeof currentPeople);
            console.log('🔍 [DEBUG CAPACITY] requestedPeople:', requestedPeople, typeof requestedPeople);
            console.log('🔍 [DEBUG CAPACITY] Suma:', currentPeople + requestedPeople);
            console.log('🔍 [DEBUG CAPACITY] Validación:', (currentPeople + requestedPeople), '>', capacityToCheck, '=', (currentPeople + requestedPeople > capacityToCheck));

            if (currentPeople + requestedPeople > capacityToCheck) {
                const available = capacityToCheck - currentPeople;
                const zoneText = zone ? ` en ${zone}` : '';

                let friendlyMessage;
                if (available === 0) {
                    friendlyMessage = `😔 ¡Vaya! Este horario está completo${zoneText}. ¿Qué tal si pruebas con otro horario? ¡Seguro encontramos hueco para ti!`;
                } else {
                    friendlyMessage = `😔 Solo quedan ${available} plazas${zoneText}, pero necesitas ${requestedPeople}. ¿Probamos con menos personas o con otro horario?`;
                }

                return res.status(409).json({
                    success: false,
                    message: friendlyMessage
                });
            }

        } else {
            // MODO SERVICES: Contar número de reservas simultáneas
            const countQuery = await db.query(
                `SELECT COUNT(*) as count FROM bookings
                 WHERE business_id = ?
                 AND booking_date = ?
                 AND booking_time = ?
                 AND status != 'cancelled'`,
                [businessId, bookingDate, bookingTime]
            );

            if (countQuery[0].count >= businessCapacity) {
                return res.status(409).json({
                    success: false,
                    message: '😔 ¡Vaya! Este horario ya está completo. ¿Qué tal si pruebas con otro? ¡Seguro encontramos el momento perfecto para ti!'
                });
            }
        }

        // Crear la reserva con manage_token
        const manageToken = crypto.randomBytes(32).toString('hex');
        const result = await db.query(
            `INSERT INTO bookings
            (business_id, service_id, customer_name, customer_email, customer_phone,
             booking_date, booking_time, num_people, num_adults, num_children, zone, notes, whatsapp_consent, status, manage_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [businessId, autoAssignedServiceId || null, customerName, customerEmail, customerPhone,
             bookingDate, bookingTime, numPeople, numAdults, numChildren, zone, notes || null, whatsappConsent, manageToken]
        );

        // Obtener la reserva creada con información del servicio
        const bookingQuery = await db.query(
            `SELECT b.*, s.name as service_name
             FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             WHERE b.id = ?`,
            [result.insertId]
        );
        const bookingData = bookingQuery[0];
        bookingData.manage_token = manageToken;

        // Obtener información del negocio para los emails
        const businessQuery = await db.query(
            'SELECT * FROM businesses WHERE id = ?',
            [businessId]
        );
        const businessData = businessQuery[0];

        // Enviar emails de confirmación (asíncrono, no bloqueante)
        if (businessData) {
            // Email de confirmación al cliente
            emailService.sendBookingConfirmation(bookingData, businessData)
                .then(() => console.log('✓ Email de confirmación enviado al cliente'))
                .catch(err => console.error('✗ Error enviando email al cliente:', err.message));

            // Email de notificación al administrador
            emailService.sendAdminNotification(bookingData, businessData)
                .then(() => console.log('✓ Email de notificación enviado al admin'))
                .catch(err => console.error('✗ Error enviando email al admin:', err.message));
        }

        // Auto-detectar/crear cliente (asíncrono, no bloqueante)
        (async () => {
            try {
                // Buscar si existe cliente con ese email+phone
                const existingCustomer = await db.query(
                    'SELECT id, total_bookings FROM customers WHERE business_id = ? AND email = ? AND phone = ?',
                    [businessId, customerEmail, customerPhone]
                );

                if (existingCustomer.length > 0) {
                    // Actualizar estadísticas del cliente existente
                    await db.query(
                        `UPDATE customers
                         SET total_bookings = total_bookings + 1,
                             last_booking_date = ?,
                             name = ?
                         WHERE id = ?`,
                        [bookingDate, customerName, existingCustomer[0].id]
                    );
                    console.log('✓ Cliente actualizado:', customerEmail);
                } else {
                    // Crear nuevo cliente
                    await db.query(
                        `INSERT INTO customers (business_id, name, email, phone, total_bookings, last_booking_date)
                         VALUES (?, ?, ?, ?, 1, ?)`,
                        [businessId, customerName, customerEmail, customerPhone, bookingDate]
                    );
                    console.log('✓ Nuevo cliente creado:', customerEmail);
                }
            } catch (err) {
                console.error('✗ Error auto-detectando cliente:', err.message);
            }
        })();

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente',
            data: bookingData
        });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la reserva',
            error: error.message
        });
    }
});

// Obtener todas las reservas de un negocio (requiere autenticación)
router.get('/api/bookings/:businessId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { date, status } = req.query;

        let query = `
            SELECT b.*, s.name as service_name, s.duration, s.price,
                   c.status as customer_status
            FROM bookings b
            LEFT JOIN services s ON b.service_id = s.id
            LEFT JOIN customers c ON c.business_id = b.business_id
                AND c.email COLLATE utf8mb4_unicode_ci = b.customer_email COLLATE utf8mb4_unicode_ci
                AND c.phone COLLATE utf8mb4_unicode_ci = b.customer_phone COLLATE utf8mb4_unicode_ci
            WHERE b.business_id = ?
        `;
        const params = [businessId];

        if (date) {
            query += ' AND b.booking_date = ?';
            params.push(date);
        }

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.booking_date DESC, b.booking_time DESC';

        const bookings = await db.query(query, params);

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservas',
            error: error.message
        });
    }
});

// Obtener horarios disponibles para una fecha
router.get('/api/availability/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Fecha requerida'
            });
        }

        // Obtener reservas existentes para esa fecha
        const bookings = await db.query(
            'SELECT booking_time FROM bookings WHERE business_id = ? AND booking_date = ? AND status != "cancelled"',
            [businessId, date]
        );

        // Horarios de trabajo (9 AM a 6 PM)
        const workingHours = [];
        for (let hour = 9; hour <= 18; hour++) {
            workingHours.push(`${hour.toString().padStart(2, '0')}:00:00`);
        }

        // Filtrar horarios ocupados
        const bookedTimes = bookings.map(b => b.booking_time);
        const availableTimes = workingHours.filter(time => !bookedTimes.includes(time));

        res.json({
            success: true,
            data: {
                date,
                availableTimes,
                bookedTimes
            }
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad',
            error: error.message
        });
    }
});

// Obtener una reserva específica
router.get('/api/booking/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await db.query(
            `SELECT b.*, s.name as service_name, s.duration, s.price,
                    bus.name as business_name
             FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             LEFT JOIN businesses bus ON b.business_id = bus.id
             WHERE b.id = ?`,
            [id]
        );

        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.json({
            success: true,
            data: booking[0]
        });
    } catch (error) {
        console.error('Error al obtener reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reserva',
            error: error.message
        });
    }
});

// Actualizar estado de una reserva (requiere autenticación)
router.patch('/api/booking/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellation_reason } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        // Si se está cancelando, guardar información de cancelación incluyendo quién canceló
        if (status === 'cancelled') {
            // Obtener nombre del usuario que cancela
            const cancelledByUserId = req.user.id;
            const cancelledByName = req.user.fullName || req.user.email || 'Usuario del sistema';

            await db.query(
                `UPDATE bookings
                 SET status = ?,
                     cancellation_date = NOW(),
                     cancellation_reason = ?,
                     cancelled_by_user_id = ?,
                     cancelled_by_name = ?,
                     cancelled_at = NOW(),
                     viewed_by_admin = FALSE
                 WHERE id = ?`,
                [status, cancellation_reason || null, cancelledByUserId, cancelledByName, id]
            );
        } else {
            // Para otros estados, solo actualizar el status
            await db.query(
                'UPDATE bookings SET status = ? WHERE id = ?',
                [status, id]
            );
        }

        const booking = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);

        // Auto-degradar cliente a "riesgo" si acumula 3+ no_shows
        if (status === 'no_show' && booking[0]) {
            try {
                const b = booking[0];
                const businessId = b.business_id;

                // Contar no_shows del cliente en este negocio
                const noShowCount = await db.query(
                    `SELECT COUNT(*) as total FROM bookings
                     WHERE business_id = ? AND customer_email = ? AND customer_phone = ? AND status = 'no_show'`,
                    [businessId, b.customer_email, b.customer_phone]
                );

                const total = noShowCount[0]?.total || 0;

                if (total >= 3) {
                    // Buscar cliente en la tabla customers
                    const customer = await db.query(
                        `SELECT id, status FROM customers
                         WHERE business_id = ? AND email = ? AND phone = ?`,
                        [businessId, b.customer_email, b.customer_phone]
                    );

                    // Solo degradar si está en "normal" (no tocar VIP, ya baneados, etc.)
                    if (customer.length > 0 && customer[0].status === 'normal') {
                        await db.query(
                            `UPDATE customers SET status = 'riesgo', notes = CONCAT(IFNULL(notes, ''), '\n[Auto] Degradado a Riesgo por ${total} faltas de asistencia (${new Date().toLocaleDateString('es-ES')})') WHERE id = ?`,
                            [customer[0].id]
                        );
                        console.log(`⚠️ Cliente ${b.customer_name} auto-degradado a Riesgo (${total} no-shows)`);
                    }
                }
            } catch (noShowError) {
                // No fallar la petición principal si la auto-degradación falla
                console.error('Error en auto-degradación:', noShowError.message);
            }
        }

        res.json({
            success: true,
            message: 'Reserva actualizada',
            data: booking[0]
        });
    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reserva',
            error: error.message
        });
    }
});

/**
 * POST /api/booking/:id/repeat
 * Repetir una reserva para semanas futuras
 */
router.post('/api/booking/:id/repeat', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { frequency, repetitions } = req.body;

        // Validar parámetros
        if (!frequency || !repetitions) {
            return res.status(400).json({
                success: false,
                message: 'Frecuencia y número de repeticiones son obligatorios'
            });
        }

        const freqWeeks = parseInt(frequency);
        const numReps = parseInt(repetitions);

        if (freqWeeks < 1 || freqWeeks > 4) {
            return res.status(400).json({
                success: false,
                message: 'La frecuencia debe ser entre 1 y 4 semanas'
            });
        }

        if (numReps < 1 || numReps > 12) {
            return res.status(400).json({
                success: false,
                message: 'El número de repeticiones debe ser entre 1 y 12'
            });
        }

        // Obtener la reserva original
        const bookingQuery = await db.query(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );

        if (bookingQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        const original = bookingQuery[0];

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId != original.business_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a esta reserva'
            });
        }

        // Crear las reservas repetidas
        const createdBookings = [];
        const originalDate = new Date(original.booking_date);

        for (let i = 1; i <= numReps; i++) {
            // Calcular nueva fecha
            const newDate = new Date(originalDate);
            newDate.setDate(newDate.getDate() + (freqWeeks * 7 * i));
            const formattedDate = newDate.toISOString().split('T')[0];

            try {
                const result = await db.query(
                    `INSERT INTO bookings
                    (business_id, service_id, customer_name, customer_email, customer_phone,
                     booking_date, booking_time, num_people, num_adults, num_children, zone, notes, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
                    [
                        original.business_id,
                        original.service_id,
                        original.customer_name,
                        original.customer_email,
                        original.customer_phone,
                        formattedDate,
                        original.booking_time,
                        original.num_people,
                        original.num_adults,
                        original.num_children,
                        original.zone,
                        original.notes ? `${original.notes} (Repetida)` : 'Cita repetida'
                    ]
                );

                createdBookings.push({
                    id: result.insertId,
                    date: formattedDate,
                    time: original.booking_time
                });

                // Actualizar estadísticas del cliente (asíncrono)
                db.query(
                    `UPDATE customers
                     SET total_bookings = total_bookings + 1,
                         last_booking_date = ?
                     WHERE business_id = ? AND email = ? AND phone = ?`,
                    [formattedDate, original.business_id, original.customer_email, original.customer_phone]
                ).catch(err => console.error('Error actualizando cliente:', err.message));

            } catch (err) {
                console.error(`Error creando reserva para ${formattedDate}:`, err.message);
                // Continuar con las siguientes aunque falle una
            }
        }

        res.json({
            success: true,
            message: `Se crearon ${createdBookings.length} reservas`,
            data: {
                original_id: id,
                created: createdBookings
            }
        });

    } catch (error) {
        console.error('Error al repetir reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al repetir reserva',
            error: error.message
        });
    }
});

/**
 * PATCH /api/booking/:id/reschedule
 * Cambiar fecha y/o hora de una reserva
 */
router.patch('/api/booking/:id/reschedule', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { booking_date, booking_time } = req.body;

        if (!booking_date && !booking_time) {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar fecha o hora para modificar'
            });
        }

        // Obtener la reserva original
        const bookingQuery = await db.query(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );

        if (bookingQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        const original = bookingQuery[0];

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId != original.business_id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a esta reserva'
            });
        }

        // Construir query de actualización
        const updates = [];
        const params = [];

        if (booking_date) {
            updates.push('booking_date = ?');
            params.push(booking_date);
        }
        if (booking_time) {
            updates.push('booking_time = ?');
            params.push(booking_time);
        }

        params.push(id);

        await db.query(
            `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Obtener reserva actualizada
        const updatedBooking = await db.query(
            'SELECT * FROM bookings WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Reserva reprogramada correctamente',
            data: updatedBooking[0]
        });

    } catch (error) {
        console.error('Error al reprogramar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reprogramar reserva',
            error: error.message
        });
    }
});

// Obtener reservas canceladas futuras (requiere autenticación)
router.get('/api/bookings/:businessId/cancelled-future', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;

        const cancelledBookings = await db.query(
            `SELECT b.*, s.name as service_name
             FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             WHERE b.business_id = ?
             AND b.status = 'cancelled'
             AND b.booking_date >= CURDATE()
             ORDER BY b.viewed_by_admin ASC, b.cancellation_date DESC`,
            [businessId]
        );

        res.json({
            success: true,
            data: cancelledBookings
        });
    } catch (error) {
        console.error('Error al obtener canceladas futuras:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener canceladas futuras',
            error: error.message
        });
    }
});

// Marcar reservas canceladas como vistas (requiere autenticación)
router.patch('/api/bookings/mark-viewed', requireAuth, async (req, res) => {
    try {
        const { bookingIds } = req.body;

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un array de IDs de reservas'
            });
        }

        const placeholders = bookingIds.map(() => '?').join(',');
        await db.query(
            `UPDATE bookings
             SET viewed_by_admin = TRUE
             WHERE id IN (${placeholders})`,
            bookingIds
        );

        res.json({
            success: true,
            message: 'Reservas marcadas como vistas'
        });
    } catch (error) {
        console.error('Error al marcar como vistas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar como vistas',
            error: error.message
        });
    }
});

// ==================== NEGOCIOS ====================

// Obtener información de un negocio
router.get('/api/business/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        const business = await db.query(
            'SELECT * FROM businesses WHERE id = ?',
            [businessId]
        );

        if (business.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        res.json({
            success: true,
            data: business[0]
        });
    } catch (error) {
        console.error('Error al obtener negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener negocio',
            error: error.message
        });
    }
});

// ==================== PÁGINA PÚBLICA DE RESERVAS ====================

// Obtener negocio por slug (PÚBLICO - para página de reservas)
router.get('/api/public/business/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const business = await db.query(
            `SELECT
                id, name, slug, type_key, type,
                phone, address, website, logo_url, description,
                widget_settings, booking_settings, widget_customization,
                public_page_settings
            FROM businesses
            WHERE slug = ?`,
            [slug]
        );

        if (business.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const businessData = business[0];

        // Parsear JSON fields
        try {
            businessData.widget_settings = JSON.parse(businessData.widget_settings || '{}');
        } catch (e) {
            businessData.widget_settings = {};
        }
        try {
            businessData.booking_settings = JSON.parse(businessData.booking_settings || '{}');
        } catch (e) {
            businessData.booking_settings = {};
        }
        try {
            businessData.widget_customization = JSON.parse(businessData.widget_customization || '{}');
        } catch (e) {
            businessData.widget_customization = {};
        }
        try {
            businessData.public_page_settings = JSON.parse(businessData.public_page_settings || '{}');
        } catch (e) {
            businessData.public_page_settings = {};
        }

        // Aplicar configuración de privacidad de la página pública
        const pageSettings = businessData.public_page_settings;
        if (!pageSettings.showPhone) delete businessData.phone;
        if (!pageSettings.showAddress) delete businessData.address;
        if (!pageSettings.showWebsite) delete businessData.website;

        // Obtener servicios del negocio (para mostrar en la página)
        const services = await db.query(
            `SELECT id, name, description, duration, price, category
            FROM services
            WHERE business_id = ? AND is_active = TRUE
            ORDER BY category, name`,
            [businessData.id]
        );

        res.json({
            success: true,
            data: {
                ...businessData,
                services
            }
        });
    } catch (error) {
        console.error('Error al obtener negocio por slug:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener negocio',
            error: error.message
        });
    }
});

// Actualizar slug del negocio (requiere owner o admin)
router.patch('/api/business/:id/slug', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.params.id;
        const { slug } = req.body;

        // Verificar permisos
        if (parseInt(businessId) !== parseInt(req.user.businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar este negocio'
            });
        }

        // Validar formato del slug
        if (!slug || slug.length < 3 || slug.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El slug debe tener entre 3 y 50 caracteres'
            });
        }

        // Solo permitir letras minúsculas, números y guiones
        const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
            return res.status(400).json({
                success: false,
                message: 'El slug solo puede contener letras minúsculas, números y guiones (sin espacios ni caracteres especiales)'
            });
        }

        // Verificar que no exista otro negocio con ese slug
        const existing = await db.query(
            'SELECT id FROM businesses WHERE slug = ? AND id != ?',
            [slug, businessId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Este slug ya está en uso. Por favor elige otro.'
            });
        }

        // Actualizar el slug
        await db.query(
            'UPDATE businesses SET slug = ? WHERE id = ?',
            [slug, businessId]
        );

        res.json({
            success: true,
            message: 'Slug actualizado correctamente',
            data: { slug }
        });
    } catch (error) {
        console.error('Error al actualizar slug:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar slug',
            error: error.message
        });
    }
});

// Actualizar configuración de página pública (requiere owner o admin)
router.patch('/api/business/:id/public-page-settings', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.params.id;
        const { showPhone, showAddress, showWebsite, showSchedule, pageEnabled } = req.body;

        // Verificar permisos
        if (parseInt(businessId) !== parseInt(req.user.businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar este negocio'
            });
        }

        const settings = {
            showPhone: showPhone !== false,
            showAddress: showAddress !== false,
            showWebsite: showWebsite !== false,
            showSchedule: showSchedule !== false,
            pageEnabled: pageEnabled !== false
        };

        await db.query(
            'UPDATE businesses SET public_page_settings = ? WHERE id = ?',
            [JSON.stringify(settings), businessId]
        );

        res.json({
            success: true,
            message: 'Configuración de página pública actualizada',
            data: settings
        });
    } catch (error) {
        console.error('Error al actualizar configuración de página pública:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración',
            error: error.message
        });
    }
});

// Actualizar configuración de WhatsApp de un negocio (requiere owner o admin)
router.patch('/api/businesses/:id/whatsapp-settings', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
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
            const cleanNumber = whatsapp_number.replace(/\s/g, '');
            if (!phoneRegex.test(cleanNumber)) {
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
        const result = await db.query(
            `UPDATE businesses
             SET whatsapp_number = ?,
                 whatsapp_enabled = ?,
                 whatsapp_template = ?
             WHERE id = ?`,
            [
                whatsapp_number ? whatsapp_number.replace(/\s/g, '') : null,
                whatsapp_enabled || false,
                whatsapp_template || null,
                businessId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Configuración de WhatsApp actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar configuración de WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar configuración',
            error: error.message
        });
    }
});

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas de un negocio (requiere autenticación)
router.get('/api/stats/:businessId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Total de reservas
        const totalBookingsResult = await db.query(
            'SELECT COUNT(*) as total FROM bookings WHERE business_id = ?',
            [businessId]
        );
        const totalBookings = totalBookingsResult?.[0]?.total || 0;

        // Reservas por estado
        const bookingsByStatus = await db.query(
            'SELECT status, COUNT(*) as count FROM bookings WHERE business_id = ? GROUP BY status',
            [businessId]
        );

        // Reservas este mes (usando CURDATE() para MySQL)
        const thisMonthResult = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ?
             AND MONTH(booking_date) = MONTH(CURDATE())
             AND YEAR(booking_date) = YEAR(CURDATE())`,
            [businessId]
        );
        const thisMonth = thisMonthResult?.[0]?.total || 0;

        // Canceladas futuras (reservas canceladas que eran para hoy en adelante)
        const cancelledFutureResult = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ?
             AND status = 'cancelled'
             AND booking_date >= CURDATE()`,
            [businessId]
        );
        const cancelledFuture = cancelledFutureResult?.[0]?.total || 0;

        res.json({
            success: true,
            data: {
                totalBookings,
                bookingsByStatus,
                thisMonth,
                cancelledFuture
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

// ==================== MENSAJES DE CONTACTO ====================

// Crear un nuevo mensaje de contacto
router.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            business,
            businessType,
            interest,
            message
        } = req.body;

        // Validaciones básicas
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios (nombre, email, mensaje)'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // Crear el mensaje de contacto
        const result = await db.query(
            `INSERT INTO contact_messages
            (name, email, phone, business_name, business_type, interest, message, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'unread')`,
            [name, email, phone || null, business || null, businessType || null, interest || null, message]
        );

        // Obtener el mensaje creado
        const contactMessage = await db.query(
            'SELECT * FROM contact_messages WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado exitosamente',
            data: contactMessage[0]
        });

    } catch (error) {
        console.error('Error al crear mensaje de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el mensaje',
            error: error.message
        });
    }
});

// Obtener todos los mensajes de contacto (requiere autenticación)
router.get('/api/contact', requireAuth, async (req, res) => {
    try {
        const { status } = req.query;

        let query = 'SELECT * FROM contact_messages';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const messages = await db.query(query, params);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error al obtener mensajes de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes',
            error: error.message
        });
    }
});

// Obtener un mensaje específico (requiere autenticación)
router.get('/api/contact/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const message = await db.query(
            'SELECT * FROM contact_messages WHERE id = ?',
            [id]
        );

        if (message.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        res.json({
            success: true,
            data: message[0]
        });
    } catch (error) {
        console.error('Error al obtener mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensaje',
            error: error.message
        });
    }
});

// Actualizar estado de un mensaje (requiere autenticación)
router.patch('/api/contact/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['unread', 'read', 'replied'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser: unread, read o replied'
            });
        }

        await db.query(
            'UPDATE contact_messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        const message = await db.query('SELECT * FROM contact_messages WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Estado actualizado',
            data: message[0]
        });
    } catch (error) {
        console.error('Error al actualizar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar mensaje',
            error: error.message
        });
    }
});

// Eliminar un mensaje (requiere autenticación)
router.delete('/api/contact/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Mensaje eliminado'
        });
    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar mensaje',
            error: error.message
        });
    }
});

// ==================== WIDGET - CONFIGURACIÓN PÚBLICA ====================

/**
 * GET /api/widget/:businessId
 * Obtener configuración completa del widget para un negocio (público)
 * El widget usa este endpoint para cargar servicios, profesionales, etc.
 */
router.get('/api/widget/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        // Obtener negocio
        const businesses = await db.query(
            `SELECT id, name, type_key, type, email, phone, address,
                    widget_settings, booking_settings, widget_customization
             FROM businesses WHERE id = ?`,
            [businessId]
        );

        if (businesses.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Negocio no encontrado'
            });
        }

        const business = businesses[0];

        // Parsear configuraciones JSON
        let widgetSettings = {};
        let bookingSettings = {};
        let widgetCustomization = {};
        try {
            // MySQL puede devolver JSON ya parseado o como string, verificar tipo
            widgetSettings = business.widget_settings
                ? (typeof business.widget_settings === 'string'
                    ? JSON.parse(business.widget_settings)
                    : business.widget_settings)
                : {};

            bookingSettings = business.booking_settings
                ? (typeof business.booking_settings === 'string'
                    ? JSON.parse(business.booking_settings)
                    : business.booking_settings)
                : {};

            widgetCustomization = business.widget_customization
                ? (typeof business.widget_customization === 'string'
                    ? JSON.parse(business.widget_customization)
                    : business.widget_customization)
                : {};
        } catch (e) {
            console.log('Error parseando settings:', e);
        }

        // Obtener tipo de negocio para el booking_mode
        const businessTypes = await db.query(
            'SELECT booking_mode FROM business_types WHERE type_key = ?',
            [business.type_key]
        );
        const bookingMode = businessTypes.length > 0 ? businessTypes[0].booking_mode : 'services';

        // Obtener servicios activos
        const services = await db.query(
            `SELECT id, name, description, duration, price, capacity
             FROM services WHERE business_id = ? AND is_active = TRUE
             ORDER BY display_order, name`,
            [businessId]
        );

        // Obtener profesionales activos
        const professionals = await db.query(
            `SELECT id, name, role
             FROM professionals WHERE business_id = ? AND is_active = TRUE
             ORDER BY display_order, name`,
            [businessId]
        );

        // Zonas para restaurantes (Terraza, Interior, etc.) - desde booking_settings
        const restaurantZones = bookingMode === 'tables' && bookingSettings.restaurantZones
            ? bookingSettings.restaurantZones
            : [];

        // Para gimnasios, los servicios actúan como clases
        const classes = bookingMode === 'classes' ? services.map(s => ({
            id: s.id,
            name: s.name,
            duration: s.duration,
            capacity: s.capacity
        })) : [];

        res.json({
            success: true,
            businessId: business.id,
            businessName: business.name,
            bookingMode,
            // Configuración del widget
            primaryColor: widgetSettings.primaryColor || '#3b82f6',
            secondaryColor: widgetSettings.secondaryColor || '#ef4444',
            language: widgetSettings.language || 'es',
            showPrices: widgetSettings.showPrices !== false,
            showDuration: widgetSettings.showDuration !== false,
            // Personalización visual del widget
            customization: {
                primaryColor: widgetCustomization.primaryColor || widgetSettings.primaryColor || '#3b82f6',
                secondaryColor: widgetCustomization.secondaryColor || widgetSettings.secondaryColor || '#8b5cf6',
                fontFamily: widgetCustomization.fontFamily || 'system-ui',
                borderRadius: widgetCustomization.borderRadius || '12px',
                buttonStyle: widgetCustomization.buttonStyle || 'solid',
                darkMode: widgetCustomization.darkMode || false
            },
            // Configuración de horarios
            scheduleType: bookingSettings.scheduleType || 'continuous',
            workDays: bookingSettings.workDays || [1, 2, 3, 4, 5, 6],
            slotDuration: bookingSettings.slotDuration || 30,
            // Si es horario partido (múltiple), retornar turnos
            ...(bookingSettings.scheduleType === 'multiple' && bookingSettings.shifts
                ? { shifts: bookingSettings.shifts.filter(s => s.enabled) }
                : {
                    // Modo continuo (legacy)
                    workHoursStart: bookingSettings.workHoursStart || '09:00',
                    workHoursEnd: bookingSettings.workHoursEnd || '20:00'
                }),
            // Datos
            // Para restaurantes, retornar servicios (Comida, Cena) Y zones (áreas de mesas)
            services: (bookingMode === 'services' || bookingMode === 'tables') ? services : [],
            professionals,
            restaurantZones, // Zonas configurables desde dashboard (Terraza, Interior, etc.)
            classes,
            // Configuración de diferenciación adultos/niños (para restaurantes principalmente)
            childrenSettings: bookingSettings.childrenSettings || null
        });
    } catch (error) {
        console.error('Error obteniendo config del widget:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración del widget'
        });
    }
});

// ==================== ONBOARDING ====================

/**
 * POST /api/business/:businessId/complete-onboarding
 * Marcar el onboarding como completado
 */
router.post('/api/business/:businessId/complete-onboarding', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId != businessId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        await db.query(
            'UPDATE businesses SET onboarding_completed = TRUE WHERE id = ?',
            [businessId]
        );

        res.json({
            success: true,
            message: 'Onboarding completado'
        });
    } catch (error) {
        console.error('Error completando onboarding:', error);
        res.status(500).json({
            success: false,
            error: 'Error al completar onboarding'
        });
    }
});

// ==================== BUSINESS MANAGEMENT ====================

/**
 * GET /api/business/:id
 * Obtener información del negocio
 */
router.get('/api/business/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId != id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        const business = await db.query(
            'SELECT * FROM businesses WHERE id = ?',
            [id]
        );

        if (business.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Negocio no encontrado'
            });
        }

        res.json({
            success: true,
            data: business[0]
        });
    } catch (error) {
        console.error('Error al obtener negocio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener información del negocio'
        });
    }
});

/**
 * GET /api/business/:id/plan
 * Obtener información del plan de suscripción y uso actual
 */
router.get('/api/business/:id/plan', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId != id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este negocio'
            });
        }

        const planInfo = await getPlanInfo(id);

        res.json({
            success: true,
            data: planInfo
        });
    } catch (error) {
        console.error('Error al obtener información del plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del plan'
        });
    }
});

/**
 * PUT /api/business/:id
 * Actualizar información básica del negocio (requiere owner o admin)
 */
router.put('/api/business/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, website, booking_settings } = req.body;

        // Verificar que el usuario tiene acceso a este negocio
        if (req.user.businessId != id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        // Validaciones
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y email son obligatorios'
            });
        }

        // Actualizar negocio (con booking_settings opcional)
        if (booking_settings !== undefined) {
            await db.query(
                `UPDATE businesses
                 SET name = ?, email = ?, phone = ?, address = ?, website = ?, booking_settings = ?
                 WHERE id = ?`,
                [name, email, phone || null, address || null, website || null,
                 JSON.stringify(booking_settings), id]
            );
        } else {
            await db.query(
                `UPDATE businesses
                 SET name = ?, email = ?, phone = ?, address = ?, website = ?
                 WHERE id = ?`,
                [name, email, phone || null, address || null, website || null, id]
            );
        }

        // Obtener datos actualizados
        const business = await db.query(
            'SELECT * FROM businesses WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Negocio actualizado correctamente',
            data: business[0]
        });
    } catch (error) {
        console.error('Error al actualizar negocio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el negocio'
        });
    }
});

// ==================== USER PROFILE ====================

/**
 * PUT /api/user/profile
 * Actualizar perfil del usuario
 */
router.put('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const { full_name } = req.body;

        // Validaciones
        if (!full_name) {
            return res.status(400).json({
                success: false,
                error: 'El nombre es obligatorio'
            });
        }

        // Actualizar usuario
        await db.query(
            'UPDATE admin_users SET full_name = ? WHERE id = ?',
            [full_name, req.user.id]
        );

        // Obtener datos actualizados
        const user = await db.query(
            `SELECT id, business_id, email, full_name, role, is_active, created_at
             FROM admin_users WHERE id = ?`,
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: user[0]
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el perfil'
        });
    }
});

/**
 * PUT /api/business/:businessId/widget-settings
 * Actualizar configuración del widget (requiere owner o admin)
 */
router.put('/api/business/:businessId/widget-settings', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { businessId } = req.params;
        const { widgetSettings } = req.body;

        // Verificar acceso
        if (req.user.businessId != businessId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        // Validaciones
        if (!widgetSettings) {
            return res.status(400).json({
                success: false,
                error: 'Configuración del widget es requerida'
            });
        }

        // Actualizar widget_settings
        await db.query(
            'UPDATE businesses SET widget_settings = ? WHERE id = ?',
            [JSON.stringify(widgetSettings), businessId]
        );

        res.json({
            success: true,
            message: 'Configuración del widget actualizada correctamente'
        });
    } catch (error) {
        console.error('Error actualizando widget settings:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la configuración'
        });
    }
});

/**
 * PUT /api/business/:businessId/settings
 * Actualizar configuración del negocio (widget_settings, booking_settings)
 * Requiere owner o admin
 */
router.put('/api/business/:businessId/settings', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { businessId } = req.params;
        const { widgetSettings, bookingSettings } = req.body;

        console.log('🔧 PUT /api/business/settings - businessId:', businessId);
        console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

        // Verificar acceso
        if (req.user.businessId != businessId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        const updates = [];
        const params = [];

        if (widgetSettings) {
            updates.push('widget_settings = ?');
            params.push(JSON.stringify(widgetSettings));
        }

        if (bookingSettings) {
            console.log('✅ bookingSettings existe');
            console.log('   - scheduleType:', bookingSettings.scheduleType);
            console.log('   - feedbackSettings:', bookingSettings.feedbackSettings ? 'SÍ existe' : 'NO existe');
            if (bookingSettings.feedbackSettings) {
                console.log('   - Preguntas:', bookingSettings.feedbackSettings.questions?.length || 0);
            }
            // Validar turnos si el tipo de horario es múltiple
            if (bookingSettings.scheduleType === 'multiple' && bookingSettings.shifts) {
                try {
                    validateShifts(bookingSettings.shifts);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        error: error.message
                    });
                }
            }

            // Validar horario continuo
            if (bookingSettings.scheduleType === 'continuous') {
                if (bookingSettings.workHoursStart && bookingSettings.workHoursEnd) {
                    if (!isValidTimeFormat(bookingSettings.workHoursStart)) {
                        return res.status(400).json({
                            success: false,
                            error: 'Formato de hora inicio inválido'
                        });
                    }
                    if (!isValidTimeFormat(bookingSettings.workHoursEnd)) {
                        return res.status(400).json({
                            success: false,
                            error: 'Formato de hora fin inválido'
                        });
                    }
                    if (timeToMinutes(bookingSettings.workHoursStart) >= timeToMinutes(bookingSettings.workHoursEnd)) {
                        return res.status(400).json({
                            success: false,
                            error: 'La hora fin debe ser mayor que la hora inicio'
                        });
                    }
                }
            }

            updates.push('booking_settings = ?');
            params.push(JSON.stringify(bookingSettings));
            console.log('📝 JSON a guardar:', JSON.stringify(bookingSettings));
        }

        if (updates.length > 0) {
            params.push(businessId);
            const query = `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`;
            console.log('🗄️ Ejecutando UPDATE:', query);
            console.log('📊 Params:', params.map((p, i) => i === params.length - 1 ? p : `[${p.substring(0, 100)}...]`));

            const result = await db.query(query, params);
            console.log('✅ UPDATE ejecutado. Filas afectadas:', result.affectedRows);
        } else {
            console.log('⚠️ No hay updates para ejecutar');
        }

        res.json({
            success: true,
            message: 'Configuración actualizada'
        });
    } catch (error) {
        console.error('Error actualizando settings:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar configuración'
        });
    }
});

/**
 * PUT /api/business/:businessId/widget-customization
 * Actualizar personalización visual del widget (requiere owner o admin)
 */
router.put('/api/business/:businessId/widget-customization', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const { businessId } = req.params;
        const { customization } = req.body;

        console.log('🎨 PUT /api/business/widget-customization - businessId:', businessId);
        console.log('📦 Customization recibida:', JSON.stringify(customization, null, 2));

        // Verificar acceso
        if (req.user.businessId != businessId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        // Validar estructura de customization
        const allowedFields = ['primaryColor', 'secondaryColor', 'fontFamily', 'borderRadius', 'buttonStyle', 'darkMode'];
        const validCustomization = {};

        for (const field of allowedFields) {
            if (customization[field] !== undefined) {
                validCustomization[field] = customization[field];
            }
        }

        // Validar colores (formato hex)
        const colorRegex = /^#[0-9A-F]{6}$/i;
        if (validCustomization.primaryColor && !colorRegex.test(validCustomization.primaryColor)) {
            return res.status(400).json({
                success: false,
                error: 'primaryColor debe ser un color hex válido (ej: #3b82f6)'
            });
        }
        if (validCustomization.secondaryColor && !colorRegex.test(validCustomization.secondaryColor)) {
            return res.status(400).json({
                success: false,
                error: 'secondaryColor debe ser un color hex válido (ej: #8b5cf6)'
            });
        }

        // Validar buttonStyle
        const validButtonStyles = ['solid', 'outline', 'ghost'];
        if (validCustomization.buttonStyle && !validButtonStyles.includes(validCustomization.buttonStyle)) {
            return res.status(400).json({
                success: false,
                error: `buttonStyle debe ser uno de: ${validButtonStyles.join(', ')}`
            });
        }

        // Actualizar en la base de datos
        await db.query(
            'UPDATE businesses SET widget_customization = ? WHERE id = ?',
            [JSON.stringify(validCustomization), businessId]
        );

        console.log('✅ Customization guardada:', validCustomization);

        res.json({
            success: true,
            message: 'Personalización del widget actualizada',
            customization: validCustomization
        });
    } catch (error) {
        console.error('Error actualizando widget customization:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar personalización del widget'
        });
    }
});

// ==================== PROFESIONALES ====================

/**
 * GET /api/professionals/:businessId
 * Obtener profesionales de un negocio
 */
router.get('/api/professionals/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        const professionals = await db.query(
            `SELECT id, name, email, phone, role, avatar_url, bio, services, schedule, is_active
             FROM professionals WHERE business_id = ?
             ORDER BY display_order, name`,
            [businessId]
        );

        res.json({
            success: true,
            data: professionals
        });
    } catch (error) {
        console.error('Error obteniendo profesionales:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener profesionales'
        });
    }
});

/**
 * POST /api/professionals
 * Crear un nuevo profesional
 */
router.post('/api/professionals', requireAuth, async (req, res) => {
    try {
        const { businessId, name, email, phone, role, bio } = req.body;

        if (!businessId || !name) {
            return res.status(400).json({
                success: false,
                error: 'businessId y name son obligatorios'
            });
        }

        // Verificar acceso
        if (req.user.businessId != businessId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a este negocio'
            });
        }

        const result = await db.query(
            `INSERT INTO professionals (business_id, name, email, phone, role, bio)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [businessId, name, email || null, phone || null, role || null, bio || null]
        );

        const professional = await db.query(
            'SELECT * FROM professionals WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            data: professional[0]
        });
    } catch (error) {
        console.error('Error creando profesional:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear profesional'
        });
    }
});

// ==================== SETUP TEMPORAL (Solo para inicialización) ====================

// Endpoint temporal para inicializar la base de datos
// Protegido con JWT_SECRET para evitar accesos no autorizados
router.post('/api/setup-database', async (req, res) => {
    try {
        const { secret } = req.body;

        // Verificar que se proporcionó el secreto correcto
        if (!secret || secret !== process.env.JWT_SECRET) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Secret incorrecto.'
            });
        }

        // Ejecutar setup de PostgreSQL
        const result = await setupPostgres();

        res.json({
            success: true,
            message: 'Base de datos inicializada correctamente',
            details: result
        });

    } catch (error) {
        console.error('Error en setup de base de datos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al inicializar la base de datos',
            error: error.message
        });
    }
});

// ==================== DEBUG: Ver estructura de tabla (TEMPORAL) ====================
router.get('/api/debug/table-structure', async (req, res) => {
    try {
        const structure = await db.query('DESCRIBE businesses');
        res.json({
            success: true,
            structure: structure
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== DEBUG: Ver rutas registradas (TEMPORAL) ====================
router.get('/api/debug/routes', (req, res) => {
    const routes = [];

    // Función para extraer rutas de un router
    function extractRoutes(stack, basePath = '') {
        stack.forEach(layer => {
            if (layer.route) {
                // Ruta directa
                const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                routes.push({
                    path: basePath + layer.route.path,
                    methods: methods
                });
            } else if (layer.name === 'router' && layer.handle.stack) {
                // Subrouter
                const routePath = layer.regexp.source
                    .replace('\\/?', '')
                    .replace('(?=\\/|$)', '')
                    .replace(/\\\//g, '/')
                    .replace(/\^/g, '')
                    .replace(/\$/g, '')
                    .replace(/\\/g, '');
                extractRoutes(layer.handle.stack, basePath + routePath);
            }
        });
    }

    // Extraer rutas del router principal
    if (router.stack) {
        extractRoutes(router.stack);
    }

    res.json({
        success: true,
        totalRoutes: routes.length,
        routes: routes.filter(r => r.path.includes('super-admin')),
        timestamp: new Date().toISOString(),
        version: 'superadmin-deployment-v2'
    });
});

// ==================== SETUP SUPER ADMIN (TEMPORAL) ====================
router.post('/api/setup/create-super-admin', async (req, res) => {
    try {
        const bcrypt = require('bcrypt');

        // Protección: requiere clave secreta
        const { secret } = req.body;
        if (secret !== 'setup-super-admin-2025') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }

        console.log('🔧 Creando tabla platform_admins...');

        // 1. Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS platform_admins (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role ENUM('super_admin', 'support', 'viewer') DEFAULT 'super_admin',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Tabla creada/verificada');

        // 2. Crear super-admin
        const email = 'admin@stickywork.com';
        const password = 'StickyAdmin2025!';
        const passwordHash = await bcrypt.hash(password, 10);

        // Verificar si existe
        const existing = await db.query(
            'SELECT id FROM platform_admins WHERE email = ?',
            [email]
        );

        if (existing && existing.length > 0) {
            // Actualizar
            await db.query(
                `UPDATE platform_admins
                 SET password_hash = ?,
                     full_name = ?,
                     is_active = TRUE,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE email = ?`,
                [passwordHash, 'Super Admin StickyWork', email]
            );
            console.log('✅ Usuario actualizado');
        } else {
            // Crear nuevo
            await db.query(
                `INSERT INTO platform_admins (email, password_hash, full_name, role, is_active)
                 VALUES (?, ?, ?, 'super_admin', TRUE)`,
                [email, passwordHash, 'Super Admin StickyWork']
            );
            console.log('✅ Usuario creado');
        }

        res.json({
            success: true,
            message: 'Super admin configurado correctamente',
            credentials: {
                email: email,
                password: password,
                url: 'https://stickywork.com/super-admin-login.html'
            }
        });

    } catch (error) {
        console.error('Error creando super admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear super admin',
            error: error.message
        });
    }
});

// ==================== MIGRACIÓN: REPORTES IA ====================
router.post('/api/setup/migrate-ai-reports', async (req, res) => {
    try {
        // Protección: requiere clave secreta
        const { secret } = req.body;
        if (secret !== 'migrate-ai-reports-2026') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado'
            });
        }

        console.log('🚀 Iniciando migración: Sistema de Reportes IA');

        // 1. Agregar columna ai_reports_enabled a businesses
        console.log('📝 Agregando columna ai_reports_enabled...');
        try {
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN ai_reports_enabled BOOLEAN DEFAULT FALSE
                COMMENT 'Habilitar reportes mensuales con IA (plan Premium)'
            `);
            console.log('✅ Columna ai_reports_enabled agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna ai_reports_enabled ya existe');
            } else {
                throw error;
            }
        }

        // 2. Crear tabla ai_reports
        console.log('📝 Creando tabla ai_reports...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_reports (
                id INT PRIMARY KEY AUTO_INCREMENT,
                business_id INT NOT NULL,
                month INT NOT NULL COMMENT 'Mes (1-12)',
                year INT NOT NULL COMMENT 'Año (ej: 2026)',
                stats JSON NOT NULL COMMENT 'Estadísticas calculadas del mes',
                ai_executive_summary TEXT COMMENT 'Resumen ejecutivo generado por IA',
                ai_insights JSON COMMENT 'Array de insights clave detectados por IA',
                ai_strengths JSON COMMENT 'Fortalezas detectadas',
                ai_weaknesses JSON COMMENT 'Áreas de mejora detectadas',
                ai_feedback_analysis TEXT COMMENT 'Análisis de encuestas/feedback',
                ai_recommendations JSON COMMENT 'Recomendaciones priorizadas',
                ai_economic_impact TEXT COMMENT 'Estimación de impacto económico',
                ai_action_plan JSON COMMENT 'Plan de acción con prioridades',
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                generated_by VARCHAR(50) DEFAULT 'claude-sonnet-4' COMMENT 'Modelo de IA usado',
                tokens_used INT COMMENT 'Tokens consumidos en generación',
                generation_time_ms INT COMMENT 'Tiempo de generación en milisegundos',
                pdf_generated BOOLEAN DEFAULT FALSE,
                pdf_path VARCHAR(255) COMMENT 'Ruta al PDF generado',
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_report (business_id, month, year),
                INDEX idx_business_date (business_id, year, month)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Reportes mensuales generados por IA'
        `);
        console.log('✅ Tabla ai_reports creada/verificada');

        // 3. Habilitar reportes para negocios demo
        console.log('📝 Habilitando reportes para negocios demo...');
        await db.query(`
            UPDATE businesses
            SET ai_reports_enabled = TRUE
            WHERE id IN (2, 9)
        `);
        console.log('✅ Reportes habilitados para La Famiglia (ID: 9) y Buen Sabor (ID: 2)');

        // 4. Verificar negocios con reportes habilitados
        const enabledBusinesses = await db.query(`
            SELECT id, name, ai_reports_enabled
            FROM businesses
            WHERE ai_reports_enabled = TRUE
        `);

        console.log('\n📊 Negocios con Reportes IA habilitados:');
        enabledBusinesses.forEach(b => {
            console.log(`   - ${b.name} (ID: ${b.id})`);
        });

        res.json({
            success: true,
            message: 'Migración de Reportes IA completada exitosamente',
            enabledBusinesses: enabledBusinesses.map(b => ({
                id: b.id,
                name: b.name
            }))
        });

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al ejecutar migración',
            error: error.message
        });
    }
});

// ==================== BÚSQUEDA GLOBAL ====================

router.get('/api/search', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        const businessId = req.user.businessId;

        if (!q || q.trim().length < 2) {
            return res.json({ success: true, data: { clients: [], bookings: [], services: [] } });
        }

        const term = `%${q.trim()}%`;

        // Buscar en paralelo en las 3 tablas
        const [clients, bookings, services] = await Promise.all([
            db.query(
                `SELECT id, name, email, phone, status
                 FROM customers
                 WHERE business_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
                 ORDER BY name ASC LIMIT 5`,
                [businessId, term, term, term]
            ),
            db.query(
                `SELECT b.id, b.customer_name, b.customer_phone, b.booking_date, b.booking_time, b.status,
                        s.name as service_name
                 FROM bookings b
                 LEFT JOIN services s ON b.service_id = s.id
                 WHERE b.business_id = ? AND (b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.notes LIKE ?)
                 ORDER BY b.booking_date DESC LIMIT 5`,
                [businessId, term, term, term]
            ),
            db.query(
                `SELECT id, name, duration, price
                 FROM services
                 WHERE business_id = ? AND (name LIKE ? OR description LIKE ?)
                 ORDER BY name ASC LIMIT 5`,
                [businessId, term, term]
            )
        ]);

        res.json({
            success: true,
            data: {
                clients: clients || [],
                bookings: bookings || [],
                services: services || []
            }
        });

    } catch (error) {
        console.error('Error en búsqueda global:', error);
        res.status(500).json({ success: false, message: 'Error en la búsqueda' });
    }
});

// ==================== CONTEXTO DEL NEGOCIO (para Reportes IA) ====================

// Migración: Añadir columna business_context JSON a businesses
router.post('/api/debug/run-business-context-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: Contexto del Negocio para Reportes IA');

        // Añadir columna business_context (JSON) a businesses
        console.log('📝 Añadiendo columna business_context...');
        try {
            await db.query(`
                ALTER TABLE businesses
                ADD COLUMN business_context JSON DEFAULT NULL
                COMMENT 'Contexto del negocio proporcionado por el propietario para mejorar reportes IA'
            `);
            console.log('✅ Columna business_context añadida');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna business_context ya existe');
            } else {
                throw error;
            }
        }

        res.json({
            success: true,
            message: 'Migración de contexto del negocio ejecutada correctamente',
            columns: ['business_context']
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// GET - Obtener contexto del negocio
router.get('/api/businesses/:id/business-context', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.params.id;

        // Verificar que el usuario tiene acceso a este negocio
        if (parseInt(businessId) !== parseInt(req.user.businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a este negocio'
            });
        }

        const businesses = await db.query(
            'SELECT business_context FROM businesses WHERE id = ?',
            [businessId]
        );

        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        let context = businesses[0].business_context;
        if (typeof context === 'string') {
            context = JSON.parse(context);
        }

        res.json({
            success: true,
            data: context || {}
        });

    } catch (error) {
        console.error('Error al obtener contexto del negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener contexto del negocio',
            error: error.message
        });
    }
});

// PATCH - Guardar contexto del negocio
router.patch('/api/businesses/:id/business-context', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.params.id;
        const context = req.body;

        // Verificar que el usuario tiene acceso a este negocio
        if (parseInt(businessId) !== parseInt(req.user.businessId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar este negocio'
            });
        }

        // Validar campos permitidos
        const allowedFields = ['description', 'differentiators', 'services', 'perception', 'challenges', 'target_audience', 'goals'];
        const cleanContext = {};
        for (const field of allowedFields) {
            if (context[field] !== undefined) {
                // Limitar cada campo a 2000 caracteres
                cleanContext[field] = String(context[field] || '').substring(0, 2000);
            }
        }

        const result = await db.query(
            'UPDATE businesses SET business_context = ? WHERE id = ?',
            [JSON.stringify(cleanContext), businessId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contexto del negocio guardado correctamente'
        });

    } catch (error) {
        console.error('Error al guardar contexto del negocio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar contexto del negocio',
            error: error.message
        });
    }
});

// ==================== GESTIÓN DE RESERVA POR CLIENTE ====================

// Migración: Añadir columna manage_token a bookings
router.post('/api/debug/run-manage-token-migration', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.SUPER_ADMIN_SECRET || 'super-admin-test-token';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        console.log('🚀 Iniciando migración: manage_token en bookings');

        try {
            await db.query(`
                ALTER TABLE bookings
                ADD COLUMN manage_token VARCHAR(255) UNIQUE DEFAULT NULL
            `);
            console.log('✅ Columna manage_token añadida');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columna manage_token ya existe');
            } else {
                throw error;
            }
        }

        try {
            await db.query(`
                CREATE INDEX idx_manage_token ON bookings (manage_token)
            `);
            console.log('✅ Índice idx_manage_token creado');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Índice idx_manage_token ya existe');
            } else {
                throw error;
            }
        }

        // Generar tokens para reservas existentes que no tengan
        const existing = await db.query(
            `SELECT id FROM bookings WHERE manage_token IS NULL`
        );
        let updated = 0;
        for (const booking of existing) {
            const token = crypto.randomBytes(32).toString('hex');
            await db.query('UPDATE bookings SET manage_token = ? WHERE id = ?', [token, booking.id]);
            updated++;
        }
        console.log(`✅ ${updated} reservas existentes actualizadas con manage_token`);

        res.json({
            success: true,
            message: 'Migración de manage_token ejecutada correctamente',
            existingUpdated: updated
        });

    } catch (error) {
        console.error('Error en migración:', error);
        res.status(500).json({
            success: false,
            message: 'Error en migración',
            error: error.message
        });
    }
});

// GET - Ver detalles de reserva por token (público, sin auth)
router.get('/api/booking/manage/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const bookings = await db.query(
            `SELECT b.id, b.customer_name, b.booking_date, b.booking_time, b.status,
                    b.num_people, b.notes, b.zone,
                    s.name as service_name,
                    bus.name as business_name, bus.address as business_address, bus.phone as business_phone
             FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             LEFT JOIN businesses bus ON b.business_id = bus.id
             WHERE b.manage_token = ?`,
            [token]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        const booking = bookings[0];

        res.json({
            success: true,
            data: {
                customer_name: booking.customer_name,
                service_name: booking.service_name,
                booking_date: booking.booking_date,
                booking_time: booking.booking_time,
                status: booking.status,
                num_people: booking.num_people,
                notes: booking.notes,
                zone: booking.zone,
                business_name: booking.business_name,
                business_address: booking.business_address,
                business_phone: booking.business_phone
            }
        });

    } catch (error) {
        console.error('Error obteniendo reserva por token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la reserva'
        });
    }
});

// POST - Cancelar reserva por token (público, sin auth)
router.post('/api/booking/manage/:token/cancel', async (req, res) => {
    try {
        const { token } = req.params;

        const bookings = await db.query(
            `SELECT id, status, business_id, customer_name, customer_email, customer_phone
             FROM bookings WHERE manage_token = ?`,
            [token]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        const booking = bookings[0];

        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: `No se puede cancelar una reserva con estado "${booking.status}"`
            });
        }

        await db.query(
            `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
            [booking.id]
        );

        // Registrar nota en el cliente si existe
        try {
            const customers = await db.query(
                'SELECT id FROM customers WHERE business_id = ? AND email = ? AND phone = ?',
                [booking.business_id, booking.customer_email, booking.customer_phone]
            );
            if (customers.length > 0) {
                const now = new Date().toISOString().split('T')[0];
                await db.query(
                    `UPDATE customers SET notes = CONCAT(IFNULL(notes, ''), '\n[${now}] Reserva cancelada por el cliente (autoservicio)') WHERE id = ?`,
                    [customers[0].id]
                );
            }
        } catch (err) {
            console.error('Error registrando nota de cancelación:', err.message);
        }

        res.json({
            success: true,
            message: 'Tu reserva ha sido cancelada correctamente'
        });

    } catch (error) {
        console.error('Error cancelando reserva por token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar la reserva'
        });
    }
});

// ==================== CÓDIGO QR ====================

// Generar código QR para un negocio
router.get('/api/qr/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        // URL de reservas del negocio
        const bookingUrl = `https://stickywork.com/booking.html?business=${businessId}`;

        // Usar API pública de quickchart.io para generar el QR
        const qrApiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(bookingUrl)}&size=300&margin=2`;

        // Redirigir a la imagen del QR
        res.redirect(qrApiUrl);

    } catch (error) {
        console.error('Error generando QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar código QR',
            error: error.message
        });
    }
});

module.exports = router;
