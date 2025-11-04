const express = require('express');
const router = express.Router();

// Permitir inyección de la base de datos (MySQL o SQLite)
let db = require('../config/database');

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

// ==================== SERVICIOS ====================

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

        // Obtener la reserva creada
        const booking = await db.query(
            'SELECT * FROM bookings WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente',
            data: booking[0]
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

// Obtener todas las reservas de un negocio
router.get('/api/bookings/:businessId', async (req, res) => {
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

// Actualizar estado de una reserva
router.patch('/api/booking/:id', async (req, res) => {
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

// Obtener estadísticas de un negocio
router.get('/api/stats/:businessId', async (req, res) => {
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

// Obtener todos los mensajes de contacto
router.get('/api/contact', async (req, res) => {
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

// Obtener un mensaje específico
router.get('/api/contact/:id', async (req, res) => {
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

// Actualizar estado de un mensaje
router.patch('/api/contact/:id', async (req, res) => {
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

// Eliminar un mensaje
router.delete('/api/contact/:id', async (req, res) => {
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

module.exports = router;
