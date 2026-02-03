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
 * Obtener talleres activos con sesiones futuras disponibles (para el widget)
 */
router.get('/public/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        // Obtener talleres activos del negocio
        const workshopsRows = await db.query(`
            SELECT id, name, description, price, image_url
            FROM workshops
            WHERE business_id = ? AND is_active = 1
        `, [businessId]);

        if (workshopsRows.length === 0) {
            return res.json({ success: true, workshops: [] });
        }

        const workshopIds = workshopsRows.map(w => w.id);
        const placeholders = workshopIds.map(() => '?').join(',');

        // Obtener sesiones futuras con disponibilidad
        const sessions = await db.query(`
            SELECT
                ws.id,
                ws.workshop_id,
                ws.session_date,
                ws.start_time,
                ws.end_time,
                ws.capacity,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots,
                ws.capacity - COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS available_spots
            FROM workshop_sessions ws
            LEFT JOIN workshop_bookings wb ON ws.id = wb.session_id
            WHERE ws.workshop_id IN (${placeholders})
              AND ws.session_date >= CURDATE()
            GROUP BY ws.id
            HAVING available_spots > 0
            ORDER BY ws.session_date ASC, ws.start_time ASC
        `, [...workshopIds]);

        // Agrupar sesiones dentro de cada taller
        const workshops = workshopsRows.map(w => ({
            ...w,
            sessions: sessions.filter(s => s.workshop_id === w.id)
        })).filter(w => w.sessions.length > 0);

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
 * POST /api/workshops/book-session/:sessionId
 * Reservar plazas en una sesión de taller (público, desde widget)
 */
router.post('/book-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const {
            customer_name,
            customer_email,
            customer_phone,
            num_people,
            notes,
            whatsapp_consent
        } = req.body;

        if (!customer_name || !customer_email) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y email son obligatorios'
            });
        }

        const people = parseInt(num_people) || 1;

        // Obtener sesión con disponibilidad
        const session = await db.query(`
            SELECT
                ws.*,
                w.name, w.price, w.is_active, w.business_id,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots
            FROM workshop_sessions ws
            JOIN workshops w ON ws.workshop_id = w.id
            LEFT JOIN workshop_bookings wb ON ws.id = wb.session_id
            WHERE ws.id = ?
            GROUP BY ws.id
        `, [sessionId]);

        if (!session || session.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }

        const s = session[0];

        if (!s.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Este taller no está disponible'
            });
        }

        const sessionDate = new Date(s.session_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (sessionDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Esta sesión ya ha pasado'
            });
        }

        const availableSpots = s.capacity - s.booked_spots;
        if (people > availableSpots) {
            return res.status(400).json({
                success: false,
                message: `Solo quedan ${availableSpots} plazas disponibles`
            });
        }

        const totalPrice = parseFloat(s.price) * people;

        const result = await db.query(`
            INSERT INTO workshop_bookings
            (workshop_id, session_id, customer_name, customer_email, customer_phone, num_people, total_price, notes, whatsapp_consent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `, [s.workshop_id, sessionId, customer_name, customer_email, customer_phone || null, people, totalPrice, notes || null, whatsapp_consent || false]);

        const newBooking = await db.query(`
            SELECT wb.*, w.name as workshop_name, ws.session_date as workshop_date, ws.start_time, ws.end_time
            FROM workshop_bookings wb
            JOIN workshop_sessions ws ON wb.session_id = ws.id
            JOIN workshops w ON ws.workshop_id = w.id
            WHERE wb.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: `Reserva confirmada! Has reservado ${people} plaza(s) para "${s.name}"`,
            booking: newBooking[0]
        });

    } catch (error) {
        console.error('Error booking workshop session:', error);
        res.status(500).json({
            success: false,
            message: 'Error al realizar la reserva'
        });
    }
});

/**
 * POST /api/workshops/book/:workshopId
 * Backward compatibility - Reservar usando workshopId (busca primera sesión disponible)
 */
router.post('/book/:workshopId', async (req, res) => {
    try {
        const { workshopId } = req.params;
        const { session_id } = req.body;

        // Si viene session_id en el body, redirigir al nuevo endpoint
        if (session_id) {
            req.params.sessionId = session_id;
            return router.handle(req, res);
        }

        // Buscar primera sesión disponible del taller
        const session = await db.query(`
            SELECT ws.id
            FROM workshop_sessions ws
            LEFT JOIN workshop_bookings wb ON ws.id = wb.session_id AND wb.status NOT IN ('cancelled')
            WHERE ws.workshop_id = ?
              AND ws.session_date >= CURDATE()
            GROUP BY ws.id
            HAVING ws.capacity - COALESCE(SUM(wb.num_people), 0) > 0
            ORDER BY ws.session_date ASC, ws.start_time ASC
            LIMIT 1
        `, [workshopId]);

        if (!session || session.length === 0) {
            // Fallback: intentar con el taller directamente (pre-migración)
            const {
                customer_name,
                customer_email,
                customer_phone,
                num_people,
                notes,
                whatsapp_consent
            } = req.body;

            if (!customer_name || !customer_email) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y email son obligatorios'
                });
            }

            const people = parseInt(num_people) || 1;

            const workshop = await db.query(`
                SELECT w.*,
                    COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots
                FROM workshops w
                LEFT JOIN workshop_bookings wb ON w.id = wb.workshop_id
                WHERE w.id = ?
                GROUP BY w.id
            `, [workshopId]);

            if (!workshop || workshop.length === 0) {
                return res.status(404).json({ success: false, message: 'Taller no encontrado' });
            }

            const w = workshop[0];
            if (!w.is_active) {
                return res.status(400).json({ success: false, message: 'Este taller no está disponible' });
            }

            const availableSpots = w.capacity - w.booked_spots;
            if (people > availableSpots) {
                return res.status(400).json({ success: false, message: `Solo quedan ${availableSpots} plazas disponibles` });
            }

            const totalPrice = parseFloat(w.price) * people;

            const result = await db.query(`
                INSERT INTO workshop_bookings
                (workshop_id, customer_name, customer_email, customer_phone, num_people, total_price, notes, whatsapp_consent, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
            `, [workshopId, customer_name, customer_email, customer_phone || null, people, totalPrice, notes || null, whatsapp_consent || false]);

            const newBooking = await db.query(`
                SELECT wb.*, w.name as workshop_name, w.workshop_date, w.start_time, w.end_time
                FROM workshop_bookings wb
                JOIN workshops w ON wb.workshop_id = w.id
                WHERE wb.id = ?
            `, [result.insertId]);

            return res.status(201).json({
                success: true,
                message: `Reserva confirmada! Has reservado ${people} plaza(s) para "${w.name}"`,
                booking: newBooking[0]
            });
        }

        // Redirigir al endpoint de sesión
        req.params.sessionId = session[0].id.toString();
        // Reenviar manualmente
        const { customer_name, customer_email, customer_phone, num_people, notes, whatsapp_consent } = req.body;

        if (!customer_name || !customer_email) {
            return res.status(400).json({ success: false, message: 'Nombre y email son obligatorios' });
        }

        const people = parseInt(num_people) || 1;

        const sessionData = await db.query(`
            SELECT ws.*, w.name, w.price, w.is_active, w.business_id,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots
            FROM workshop_sessions ws
            JOIN workshops w ON ws.workshop_id = w.id
            LEFT JOIN workshop_bookings wb ON ws.id = wb.session_id
            WHERE ws.id = ?
            GROUP BY ws.id
        `, [session[0].id]);

        const s = sessionData[0];
        const availableSpots = s.capacity - s.booked_spots;
        if (people > availableSpots) {
            return res.status(400).json({ success: false, message: `Solo quedan ${availableSpots} plazas disponibles` });
        }

        const totalPrice = parseFloat(s.price) * people;

        const result = await db.query(`
            INSERT INTO workshop_bookings
            (workshop_id, session_id, customer_name, customer_email, customer_phone, num_people, total_price, notes, whatsapp_consent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `, [s.workshop_id, session[0].id, customer_name, customer_email, customer_phone || null, people, totalPrice, notes || null, whatsapp_consent || false]);

        const newBooking = await db.query(`
            SELECT wb.*, w.name as workshop_name, ws.session_date as workshop_date, ws.start_time, ws.end_time
            FROM workshop_bookings wb
            JOIN workshop_sessions ws ON wb.session_id = ws.id
            JOIN workshops w ON ws.workshop_id = w.id
            WHERE wb.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: `Reserva confirmada! Has reservado ${people} plaza(s) para "${s.name}"`,
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
 * Listar todos los talleres del negocio con info de sesiones
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { includesPast } = req.query;

        let dateFilter = '';
        if (!includesPast || includesPast === 'false') {
            dateFilter = `HAVING next_session_date IS NOT NULL OR total_sessions = 0`;
        }

        const workshops = await db.query(`
            SELECT
                w.id, w.name, w.description, w.price, w.image_url, w.is_active, w.created_at,
                w.workshop_date, w.start_time, w.end_time, w.capacity,
                COUNT(DISTINCT ws.id) AS total_sessions,
                MIN(CASE WHEN ws.session_date >= CURDATE() THEN ws.session_date END) AS next_session_date,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS total_booked,
                COUNT(DISTINCT CASE WHEN wb.status NOT IN ('cancelled') THEN wb.id END) AS total_bookings
            FROM workshops w
            LEFT JOIN workshop_sessions ws ON w.id = ws.workshop_id
            LEFT JOIN workshop_bookings wb ON ws.id = wb.session_id
            WHERE w.business_id = ?
            GROUP BY w.id
            ${dateFilter}
            ORDER BY next_session_date ASC, w.created_at DESC
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
 * Obtener detalle de un taller con sus sesiones
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;

        const workshop = await db.query(`
            SELECT w.*
            FROM workshops w
            WHERE w.id = ? AND w.business_id = ?
        `, [id, businessId]);

        if (!workshop || workshop.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Taller no encontrado'
            });
        }

        // Obtener sesiones con disponibilidad
        const sessions = await db.query(`
            SELECT
                ws.*,
                COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS booked_spots,
                ws.capacity - COALESCE(SUM(CASE WHEN wb.status NOT IN ('cancelled') THEN wb.num_people ELSE 0 END), 0) AS available_spots,
                COUNT(DISTINCT CASE WHEN wb.status NOT IN ('cancelled') THEN wb.id END) AS total_bookings
            FROM workshop_sessions ws
            LEFT JOIN workshop_bookings wb ON ws.id = wb.session_id
            WHERE ws.workshop_id = ?
            GROUP BY ws.id
            ORDER BY ws.session_date ASC, ws.start_time ASC
        `, [id]);

        const workshopData = workshop[0];
        workshopData.sessions = sessions;

        res.json({
            success: true,
            workshop: workshopData
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
 * Crear un nuevo taller con sesiones
 */
router.post('/', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const {
            name,
            description,
            price,
            is_active,
            image_url,
            sessions,
            // Campos legacy (backward compat)
            workshop_date,
            start_time,
            end_time,
            capacity
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del taller es obligatorio'
            });
        }

        // Construir array de sesiones
        let sessionsArray = [];
        if (sessions && Array.isArray(sessions) && sessions.length > 0) {
            sessionsArray = sessions;
        } else if (workshop_date && start_time && end_time) {
            // Backward compat: crear una sesión con los campos legacy
            sessionsArray = [{ session_date: workshop_date, start_time, end_time, capacity: capacity || 10 }];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Debes añadir al menos una sesión con fecha y horario'
            });
        }

        // Validar sesiones
        for (const s of sessionsArray) {
            if (!s.session_date || !s.start_time || !s.end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Cada sesión debe tener fecha, hora de inicio y hora de fin'
                });
            }
        }

        // Usar datos de la primera sesión para campos legacy
        const firstSession = sessionsArray[0];

        const result = await db.query(`
            INSERT INTO workshops
            (business_id, name, description, workshop_date, start_time, end_time, capacity, price, is_active, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            businessId,
            name,
            description || null,
            firstSession.session_date,
            firstSession.start_time,
            firstSession.end_time,
            firstSession.capacity || 10,
            price || 0,
            is_active !== false,
            image_url || null
        ]);

        const workshopId = result.insertId;

        // Insertar sesiones
        for (const s of sessionsArray) {
            await db.query(`
                INSERT INTO workshop_sessions (workshop_id, session_date, start_time, end_time, capacity)
                VALUES (?, ?, ?, ?, ?)
            `, [workshopId, s.session_date, s.start_time, s.end_time, s.capacity || 10]);
        }

        // Obtener el taller creado con sesiones
        const newWorkshop = await db.query('SELECT * FROM workshops WHERE id = ?', [workshopId]);
        const newSessions = await db.query('SELECT * FROM workshop_sessions WHERE workshop_id = ? ORDER BY session_date ASC, start_time ASC', [workshopId]);
        newWorkshop[0].sessions = newSessions;

        res.status(201).json({
            success: true,
            message: `Taller creado con ${sessionsArray.length} sesión(es)`,
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
 * Actualizar un taller y sus sesiones
 */
router.put('/:id', requireAuth, requireRole('owner', 'admin'), async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;
        const {
            name,
            description,
            price,
            is_active,
            image_url,
            sessions
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

        // Actualizar datos del concepto
        await db.query(`
            UPDATE workshops SET
                name = COALESCE(?, name),
                description = ?,
                price = COALESCE(?, price),
                is_active = COALESCE(?, is_active),
                image_url = ?
            WHERE id = ? AND business_id = ?
        `, [name, description, price, is_active, image_url, id, businessId]);

        // Gestionar sesiones si se envían
        if (sessions && Array.isArray(sessions) && sessions.length > 0) {
            // IDs de sesiones que se mantienen
            const keepIds = sessions.filter(s => s.id).map(s => s.id);

            // Eliminar sesiones que ya no están (solo si no tienen reservas activas)
            if (keepIds.length > 0) {
                const keepPlaceholders = keepIds.map(() => '?').join(',');
                await db.query(`
                    DELETE FROM workshop_sessions
                    WHERE workshop_id = ? AND id NOT IN (${keepPlaceholders})
                    AND id NOT IN (
                        SELECT DISTINCT session_id FROM workshop_bookings
                        WHERE status NOT IN ('cancelled') AND session_id IS NOT NULL
                    )
                `, [id, ...keepIds]);
            } else {
                // Eliminar todas las que no tengan reservas activas
                await db.query(`
                    DELETE FROM workshop_sessions
                    WHERE workshop_id = ?
                    AND id NOT IN (
                        SELECT DISTINCT session_id FROM workshop_bookings
                        WHERE status NOT IN ('cancelled') AND session_id IS NOT NULL
                    )
                `, [id]);
            }

            // Upsert cada sesión
            for (const s of sessions) {
                if (s.id) {
                    await db.query(`
                        UPDATE workshop_sessions SET
                            session_date = ?, start_time = ?, end_time = ?, capacity = ?
                        WHERE id = ? AND workshop_id = ?
                    `, [s.session_date, s.start_time, s.end_time, s.capacity || 10, s.id, id]);
                } else {
                    await db.query(`
                        INSERT INTO workshop_sessions (workshop_id, session_date, start_time, end_time, capacity)
                        VALUES (?, ?, ?, ?, ?)
                    `, [id, s.session_date, s.start_time, s.end_time, s.capacity || 10]);
                }
            }

            // Actualizar campos legacy con la primera sesión
            const firstSession = sessions[0];
            await db.query(`
                UPDATE workshops SET workshop_date = ?, start_time = ?, end_time = ?, capacity = ?
                WHERE id = ?
            `, [firstSession.session_date, firstSession.start_time, firstSession.end_time, firstSession.capacity || 10, id]);
        }

        // Obtener taller actualizado con sesiones
        const updated = await db.query('SELECT * FROM workshops WHERE id = ?', [id]);
        const updatedSessions = await db.query('SELECT * FROM workshop_sessions WHERE workshop_id = ? ORDER BY session_date ASC, start_time ASC', [id]);
        updated[0].sessions = updatedSessions;

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

        // Verificar reservas activas a través de sesiones
        const bookings = await db.query(`
            SELECT COUNT(*) as count FROM workshop_bookings wb
            JOIN workshop_sessions ws ON wb.session_id = ws.id
            WHERE ws.workshop_id = ? AND wb.status NOT IN ('cancelled')
        `, [id]);

        // Fallback: verificar también por workshop_id directo (pre-migración)
        const bookingsLegacy = await db.query(
            'SELECT COUNT(*) as count FROM workshop_bookings WHERE workshop_id = ? AND status NOT IN ("cancelled") AND session_id IS NULL',
            [id]
        );

        const totalActive = (bookings[0]?.count || 0) + (bookingsLegacy[0]?.count || 0);

        if (totalActive > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar: hay ${totalActive} reserva(s) activa(s). Cancelalas primero o desactiva el taller.`
            });
        }

        // CASCADE eliminará sesiones y reservas canceladas
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
 * Obtener reservas de un taller (incluye info de sesión)
 */
router.get('/:id/bookings', requireAuth, async (req, res) => {
    try {
        const businessId = req.user.businessId;
        const { id } = req.params;

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
            SELECT wb.*, ws.session_date, ws.start_time as session_start_time, ws.end_time as session_end_time
            FROM workshop_bookings wb
            LEFT JOIN workshop_sessions ws ON wb.session_id = ws.id
            WHERE wb.workshop_id = ?
            ORDER BY ws.session_date ASC, ws.start_time ASC, wb.created_at DESC
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
                message: 'Estado no valido'
            });
        }

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
