const express = require('express');
const router = express.Router();
const authRoutes = require('./routes/auth');
const setupDemosRoutes = require('./routes/setup-demos');
const superAdminRoutes = require('./routes/super-admin');
const supportRoutes = require('./routes/support');
const feedbackRoutes = require('./routes/feedback');
const { requireAuth, requireBusinessAccess } = require('./middleware/auth');
const emailService = require('./email-service');
const { setupPostgres } = require('./setup-postgres');
const { createBookingLimiter, contactLimiter } = require('./middleware/rate-limit');

// Permitir inyección de la base de datos (MySQL o SQLite)
let db = require('../config/database');

function setDatabase(database) {
    db = database;
    authRoutes.setDatabase(database);
    feedbackRoutes.setDatabase(database);
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
            bookings.forEach(booking => {
                const time = booking.booking_time.substring(0, 5); // "HH:MM"
                const zone = booking.zone || 'Sin zona';

                if (!availability[time]) {
                    availability[time] = {};
                }
                if (!availability[time][zone]) {
                    availability[time][zone] = { occupied: 0 };
                }
                availability[time][zone].occupied += booking.num_people || 1;
            });
        } else if (bookingMode === 'tables') {
            // MODO TABLES SIN ZONAS: Sumar num_people por slot
            bookings.forEach(booking => {
                const time = booking.booking_time.substring(0, 5);
                if (!availability[time]) {
                    availability[time] = { occupied: 0 };
                }
                availability[time].occupied += booking.num_people || 1;
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
        const numPeople = parseInt(req.body.numPeople || req.body.num_people) || 2; // Default 2 personas, convertir a número
        const zone = req.body.zone || null; // Zona (Terraza, Interior, etc.)
        const notes = req.body.notes;
        const whatsappConsent = req.body.whatsappConsent || req.body.whatsapp_consent || false; // Consentimiento para WhatsApp

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

        // Obtener configuración del negocio para validar horarios y capacidad
        const businessSettingsQuery = await db.query(
            'SELECT type_key, booking_settings FROM businesses WHERE id = ?',
            [businessId]
        );

        if (businessSettingsQuery.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Negocio no encontrado'
            });
        }

        const bookingSettings = businessSettingsQuery[0].booking_settings
            ? (typeof businessSettingsQuery[0].booking_settings === 'string'
                ? JSON.parse(businessSettingsQuery[0].booking_settings)
                : businessSettingsQuery[0].booking_settings)
            : {};

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

        // Validar día laboral
        const bookingDay = new Date(bookingDate + 'T00:00:00').getDay() || 7; // 0=Domingo -> 7
        const workDays = bookingSettings.workDays || [1, 2, 3, 4, 5, 6];

        if (!workDays.includes(bookingDay)) {
            return res.status(400).json({
                success: false,
                message: 'El negocio no abre este día de la semana'
            });
        }

        // Validar que no se puedan hacer reservas para horas pasadas del mismo día
        // TEMPORALMENTE DESACTIVADO PARA CREAR DATOS DE PRUEBA
        /*
        const now = new Date();
        const bookingDateTime = new Date(bookingDate + 'T' + bookingTime);

        if (bookingDateTime < now) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden hacer reservas para horas pasadas'
            });
        }
        */

        // Validar horario según tipo de configuración
        const scheduleType = bookingSettings.scheduleType || 'continuous';
        let autoAssignedServiceId = serviceId; // Mantener el serviceId si viene del widget

        if (scheduleType === 'multiple' && bookingSettings.shifts) {
            // Validar que la hora esté dentro de algún turno activo
            let matchedShift = null;
            for (const shift of bookingSettings.shifts) {
                if (shift.enabled && isTimeInRange(bookingTime, shift.startTime, shift.endTime)) {
                    matchedShift = shift;
                    break;
                }
            }

            if (!matchedShift) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora seleccionada está fuera del horario de atención'
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

            const sumQuery = await db.query(
                `SELECT COALESCE(SUM(num_people), 0) as total_people FROM bookings ${queryWhere}`,
                queryParams
            );

            const currentPeople = parseInt(sumQuery[0].total_people) || 0;
            const requestedPeople = parseInt(numPeople) || 1;

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

        // Crear la reserva
        const result = await db.query(
            `INSERT INTO bookings
            (business_id, service_id, customer_name, customer_email, customer_phone,
             booking_date, booking_time, num_people, zone, notes, whatsapp_consent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [businessId, autoAssignedServiceId || null, customerName, customerEmail, customerPhone,
             bookingDate, bookingTime, numPeople, zone, notes || null, whatsappConsent]
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
        const { status, cancellation_reason } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        // Si se está cancelando, guardar información de cancelación
        if (status === 'cancelled') {
            await db.query(
                `UPDATE bookings
                 SET status = ?,
                     cancellation_date = NOW(),
                     cancellation_reason = ?,
                     viewed_by_admin = FALSE
                 WHERE id = ?`,
                [status, cancellation_reason || null, id]
            );
        } else {
            // Para otros estados, solo actualizar el status
            await db.query(
                'UPDATE bookings SET status = ? WHERE id = ?',
                [status, id]
            );
        }

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

// Actualizar configuración de WhatsApp de un negocio (requiere autenticación)
router.patch('/api/businesses/:id/whatsapp-settings', requireAuth, async (req, res) => {
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
 * PUT /api/business/:id
 * Actualizar información básica del negocio
 */
router.put('/api/business/:id', requireAuth, async (req, res) => {
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
 * Actualizar configuración del widget
 */
router.put('/api/business/:businessId/widget-settings', requireAuth, async (req, res) => {
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
 */
router.put('/api/business/:businessId/settings', requireAuth, async (req, res) => {
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
 * Actualizar personalización visual del widget
 */
router.put('/api/business/:businessId/widget-customization', requireAuth, async (req, res) => {
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
