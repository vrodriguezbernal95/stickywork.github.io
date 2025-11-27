const express = require('express');
const router = express.Router();
const authRoutes = require('./routes/auth');
const setupDemosRoutes = require('./routes/setup-demos');
const { requireAuth, requireBusinessAccess } = require('./middleware/auth');
const emailService = require('./email-service');
const { setupPostgres } = require('./setup-postgres');

// Permitir inyección de la base de datos (MySQL o SQLite)
let db = require('../config/database');

function setDatabase(database) {
    db = database;
    authRoutes.setDatabase(database);
}

router.setDatabase = setDatabase;

// ==================== AUTENTICACIÓN ====================
router.use(authRoutes);

// ==================== SETUP DEMOS ====================
router.use(setupDemosRoutes);

// ==================== SERVICIOS ====================

// Crear un nuevo servicio (requiere autenticación)
router.post('/api/services', requireAuth, requireBusinessAccess, async (req, res) => {
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

// Actualizar un servicio (requiere autenticación)
router.put('/api/services/:id', requireAuth, async (req, res) => {
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

// Eliminar un servicio (requiere autenticación)
router.delete('/api/services/:id', requireAuth, async (req, res) => {
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

// ==================== RESERVAS ====================

// Crear una nueva reserva
router.post('/api/bookings', async (req, res) => {
    try {
        const {
            businessId,
            serviceId,
            customerName,
            customerEmail,
            customerPhone,
            bookingDate,
            bookingTime,
            notes
        } = req.body;

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

        // Verificar si ya existe una reserva para esa fecha/hora
        const existingBooking = await db.query(
            `SELECT id FROM bookings
             WHERE business_id = ?
             AND booking_date = ?
             AND booking_time = ?
             AND status != 'cancelled'`,
            [businessId, bookingDate, bookingTime]
        );

        if (existingBooking.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una reserva para ese horario'
            });
        }

        // Crear la reserva
        const result = await db.query(
            `INSERT INTO bookings
            (business_id, service_id, customer_name, customer_email, customer_phone,
             booking_date, booking_time, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [businessId, serviceId || null, customerName, customerEmail, customerPhone,
             bookingDate, bookingTime, notes || null]
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
            SELECT b.*, s.name as service_name, s.duration, s.price
            FROM bookings b
            LEFT JOIN services s ON b.service_id = s.id
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
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        await db.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [status, id]
        );

        const booking = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);

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

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas de un negocio (requiere autenticación)
router.get('/api/stats/:businessId', requireAuth, requireBusinessAccess, async (req, res) => {
    try {
        const { businessId } = req.params;

        // Total de reservas
        const [totalBookings] = await db.query(
            'SELECT COUNT(*) as total FROM bookings WHERE business_id = ?',
            [businessId]
        );

        // Reservas por estado
        const bookingsByStatus = await db.query(
            'SELECT status, COUNT(*) as count FROM bookings WHERE business_id = ? GROUP BY status',
            [businessId]
        );

        // Reservas este mes
        const [thisMonth] = await db.query(
            `SELECT COUNT(*) as total FROM bookings
             WHERE business_id = ?
             AND MONTH(booking_date) = MONTH(CURRENT_DATE())
             AND YEAR(booking_date) = YEAR(CURRENT_DATE())`,
            [businessId]
        );

        res.json({
            success: true,
            data: {
                totalBookings: totalBookings[0].total,
                bookingsByStatus,
                thisMonth: thisMonth[0].total
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
router.post('/api/contact', async (req, res) => {
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
                    widget_settings, booking_settings
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
        try {
            widgetSettings = business.widget_settings ? JSON.parse(business.widget_settings) : {};
            bookingSettings = business.booking_settings ? JSON.parse(business.booking_settings) : {};
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

        // Para restaurantes, los servicios actúan como zonas/mesas
        const zones = bookingMode === 'tables' ? services.map(s => ({
            id: s.id,
            name: s.name,
            capacity: s.capacity
        })) : [];

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
            // Configuración de horarios
            workHoursStart: bookingSettings.workHoursStart || '09:00',
            workHoursEnd: bookingSettings.workHoursEnd || '20:00',
            workDays: bookingSettings.workDays || [1, 2, 3, 4, 5, 6],
            slotDuration: bookingSettings.slotDuration || 30,
            // Datos
            services: bookingMode === 'services' ? services : [],
            professionals,
            zones,
            classes
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

/**
 * PUT /api/business/:businessId/settings
 * Actualizar configuración del negocio (widget_settings, booking_settings)
 */
router.put('/api/business/:businessId/settings', requireAuth, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { widgetSettings, bookingSettings } = req.body;

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
            updates.push('booking_settings = ?');
            params.push(JSON.stringify(bookingSettings));
        }

        if (updates.length > 0) {
            params.push(businessId);
            await db.query(
                `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
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

module.exports = router;
