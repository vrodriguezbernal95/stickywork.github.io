const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Permitir inyección de la base de datos
let db = require('../../config/database');

function setDatabase(database) {
    db = database;
}

router.setDatabase = setDatabase;

// ==================== ENDPOINTS PÚBLICOS (para widget) ====================

/**
 * GET /api/workshops/public/:businessId
 * Obtener talleres activos y futuros de un negocio (para el widget)
 */
router.get('/public/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        const workshops = await db.query(`
            SELECT
                w.id,
                w.name,
                w.description,
                w.workshop_date,
                w.start_time,
                w.end_time,
                w.capacity,
                w.price,
                w.image_url,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots,
                w.capacity - COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS available_spots
            FROM workshops w
            LEFT JOIN workshop_bookings wb ON w.id = wb.workshop_id
            WHERE w.business_id = ?
              AND w.is_active = TRUE
              AND w.workshop_date >= CURDATE()
            GROUP BY w.id
            HAVING available_spots > 0
            ORDER BY w.workshop_date ASC, w.start_time ASC
        `, [businessId]);

        res.json({
            success: true,
            workshops: workshops
        });

    } catch (error) {
        console.error('Error fetching public workshops:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener talleres'
        });
    }
});

/**
 * POST /api/workshops/book/:workshopId
 * Reservar plazas en un taller (público, desde widget)
 */
router.post('/book/:workshopId', async (req, res) => {
    try {
        const { workshopId } = req.params;
        const {
            customer_name,
            customer_email,
            customer_phone,
            num_people,
            notes,
            whatsapp_consent
        } = req.body;

        // Validaciones básicas
        if (!customer_name || !customer_email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y email son obligatorios'
            });
        }

        const people = parseInt(num_people) || 1;

        // Obtener taller y verificar disponibilidad
        const workshop = await db.query(`
            SELECT
                w.*,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots
            FROM workshops w
            LEFT JOIN workshop_bookings wb ON w.id = wb.workshop_id
            WHERE w.id = ?
            GROUP BY w.id
        `, [workshopId]);

        if (!workshop || workshop.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        const w = workshop[0];

        // Verificar que está activo
        if (!w.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Este taller no está disponible'
            });
        }

        // Verificar fecha (no pasada)
        const workshopDate = new Date(w.workshop_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (workshopDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Este taller ya ha pasado'
            });
        }

        // Verificar capacidad
        const availableSpots = w.capacity - w.booked_spots;
        if (people > availableSpots) {
            return res.status(400).json({
                success: false,
                message: `Solo quedan ${availableSpots} plazas disponibles`
            });
        }

        // Calcular precio total
        const totalPrice = parseFloat(w.price) * people;

        // Crear reserva
        const result = await db.query(`
            INSERT INTO workshop_bookings
            (workshop_id, customer_name, customer_email, customer_phone, num_people, total_price, notes, whatsapp_consent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `, [workshopId, customer_name, customer_email, customer_phone || null, people, totalPrice, notes || null, whatsapp_consent || false]);

        // Obtener la reserva creada
        const newBooking = await db.query(`
            SELECT wb.*, w.name as workshop_name, w.workshop_date, w.start_time, w.end_time
            FROM workshop_bookings wb
            JOIN workshops w ON wb.workshop_id = w.id
            WHERE wb.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: `¡Reserva confirmada! Has reservado ${people} plaza(s) para "${w.name}"`,
            booking: newBooking[0]
        });

    } catch (error) {
        console.error('Error booking workshop:', error);
        res.status(500).json({
            success: false,
            message: 'Error al realizar la reserva'
        });
    }
});

// ==================== ENDPOINTS ADMIN (requieren autenticación) ====================

/**
 * GET /api/workshops
 * Listar todos los talleres del negocio
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { includesPast } = req.query;

        let dateFilter = '';
        if (!includesPast || includesPast === 'false') {
            dateFilter = 'AND w.workshop_date >= CURDATE()';
        }

        const workshops = await db.query(`
            SELECT
                w.*,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots,
                w.capacity - COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS available_spots,
                COUNT(DISTINCT CASE WHEN wb.status NOT IN ('cancelled') THEN wb.id END) AS total_bookings
            FROM workshops w
            LEFT JOIN workshop_bookings wb ON w.id = wb.workshop_id
            WHERE w.business_id = ?
            ${dateFilter}
            GROUP BY w.id
            ORDER BY w.workshop_date ASC, w.start_time ASC
        `, [businessId]);

        res.json({
            success: true,
            workshops: workshops
        });

    } catch (error) {
        console.error('Error fetching workshops:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener talleres'
        });
    }
});

/**
 * GET /api/workshops/:id
 * Obtener detalle de un taller
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;

        const workshop = await db.query(`
            SELECT
                w.*,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots,
                w.capacity - COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS available_spots
            FROM workshops w
            LEFT JOIN workshop_bookings wb ON w.id = wb.workshop_id
            WHERE w.id = ? AND w.business_id = ?
            GROUP BY w.id
        `, [id, businessId]);

        if (!workshop || workshop.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        res.json({
            success: true,
            workshop: workshop[0]
        });

    } catch (error) {
        console.error('Error fetching workshop:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener taller'
        });
    }
});

/**
 * POST /api/workshops
 * Crear un nuevo taller
 */
router.post('/', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const {
            name,
            description,
            workshop_date,
            start_time,
            end_time,
            capacity,
            price,
            is_active,
            image_url
        } = req.body;

        // Validaciones
        if (!name || !workshop_date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, fecha, hora de inicio y hora de fin son obligatorios'
            });
        }

        if (capacity && capacity < 1) {
            return res.status(400).json({
                success: false,
                message: 'La capacidad debe ser al menos 1'
            });
        }

        // Crear taller
        const result = await db.query(`
            INSERT INTO workshops
            (business_id, name, description, workshop_date, start_time, end_time, capacity, price, is_active, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            businessId,
            name,
            description || null,
            workshop_date,
            start_time,
            end_time,
            capacity || 10,
            price || 0,
            is_active !== false,
            image_url || null
        ]);

        // Obtener el taller creado
        const newWorkshop = await db.query('SELECT * FROM workshops WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Taller creado correctamente',
            workshop: newWorkshop[0]
        });

    } catch (error) {
        console.error('Error creating workshop:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear taller'
        });
    }
});

/**
 * PUT /api/workshops/:id
 * Actualizar un taller
 */
router.put('/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;
        const {
            name,
            description,
            workshop_date,
            start_time,
            end_time,
            capacity,
            price,
            is_active,
            image_url
        } = req.body;

        // Verificar que el taller pertenece al negocio
        const existing = await db.query(
            'SELECT id FROM workshops WHERE id = ? AND business_id = ?',
            [id, businessId]
        );

        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        // Actualizar
        await db.query(`
            UPDATE workshops SET
                name = COALESCE(?, name),
                description = ?,
                workshop_date = COALESCE(?, workshop_date),
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                capacity = COALESCE(?, capacity),
                price = COALESCE(?, price),
                is_active = COALESCE(?, is_active),
                image_url = ?
            WHERE id = ? AND business_id = ?
        `, [name, description, workshop_date, start_time, end_time, capacity, price, is_active, image_url, id, businessId]);

        // Obtener el taller actualizado
        const updated = await db.query('SELECT * FROM workshops WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Taller actualizado correctamente',
            workshop: updated[0]
        });

    } catch (error) {
        console.error('Error updating workshop:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar taller'
        });
    }
});

/**
 * DELETE /api/workshops/:id
 * Eliminar un taller
 */
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;

        // Verificar que el taller pertenece al negocio
        const existing = await db.query(
            'SELECT id, name FROM workshops WHERE id = ? AND business_id = ?',
            [id, businessId]
        );

        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        // Verificar si tiene reservas
        const bookings = await db.query(
            'SELECT COUNT(*) as count FROM workshop_bookings WHERE workshop_id = ? AND status NOT IN ("cancelled")',
            [id]
        );

        if (bookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar: hay ${bookings[0].count} reserva(s) activa(s). Cancélalas primero o desactiva el taller.`
            });
        }

        // Eliminar (CASCADE eliminará las reservas canceladas)
        await db.query('DELETE FROM workshops WHERE id = ?', [id]);

        res.json({
            success: true,
            message: `Taller "${existing[0].name}" eliminado correctamente`
        });

    } catch (error) {
        console.error('Error deleting workshop:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar taller'
        });
    }
});

/**
 * PATCH /api/workshops/:id/toggle
 * Activar/Desactivar un taller
 */
router.patch('/:id/toggle', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;

        // Verificar y obtener estado actual
        const workshop = await db.query(
            'SELECT id, name, is_active FROM workshops WHERE id = ? AND business_id = ?',
            [id, businessId]
        );

        if (!workshop || workshop.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        const newState = !workshop[0].is_active;

        await db.query('UPDATE workshops SET is_active = ? WHERE id = ?', [newState, id]);

        res.json({
            success: true,
            message: `Taller ${newState ? 'activado' : 'desactivado'} correctamente`,
            is_active: newState
        });

    } catch (error) {
        console.error('Error toggling workshop:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del taller'
        });
    }
});

// ==================== GESTIÓN DE RESERVAS ====================

/**
 * GET /api/workshops/:id/bookings
 * Obtener reservas de un taller
 */
router.get('/:id/bookings', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;

        // Verificar que el taller pertenece al negocio
        const workshop = await db.query(
            'SELECT id, name FROM workshops WHERE id = ? AND business_id = ?',
            [id, businessId]
        );

        if (!workshop || workshop.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        const bookings = await db.query(`
            SELECT *
            FROM workshop_bookings
            WHERE workshop_id = ?
            ORDER BY created_at DESC
        `, [id]);

        res.json({
            success: true,
            workshop: workshop[0],
            bookings: bookings
        });

    } catch (error) {
        console.error('Error fetching workshop bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservas'
        });
    }
});

/**
 * PATCH /api/workshops/bookings/:bookingId/status
 * Cambiar estado de una reserva
 */
router.patch('/bookings/:bookingId/status', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { bookingId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'attended', 'no_show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido'
            });
        }

        // Verificar que la reserva pertenece a un taller del negocio
        const booking = await db.query(`
            SELECT wb.*, w.business_id
            FROM workshop_bookings wb
            JOIN workshops w ON wb.workshop_id = w.id
            WHERE wb.id = ? AND w.business_id = ?
        `, [bookingId, businessId]);

        if (!booking || booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        await db.query('UPDATE workshop_bookings SET status = ? WHERE id = ?', [status, bookingId]);

        res.json({
            success: true,
            message: 'Estado actualizado correctamente',
            status: status
        });

    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado'
        });
    }
});

module.exports = router;
