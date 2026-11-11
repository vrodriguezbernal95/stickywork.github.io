/**
 * Job: marcar como completadas las citas que ya han pasado
 *
 * Sin esto, las citas se quedaban en "pendiente" o "confirmada" para siempre:
 * no se generaba la encuesta post-cita (solo se genera para citas completadas)
 * y los reportes de IA no tenían datos.
 *
 * Regla: una cita pasa a 'completed' 3 horas después de terminar (hora + duración del servicio) si:
 *   - está 'confirmed', o
 *   - está 'pending' y el negocio NO usa la confirmación manual
 *     (si la usa, una cita que nunca se aceptó no se da por realizada).
 * El negocio puede cambiarla después a 'no_show' si el cliente no vino.
 *
 * Se ejecuta cada hora, antes del job de feedback.
 */
async function completarCitasPasadas(db) {
    try {
        const result = await db.query(`
            UPDATE bookings b
            JOIN businesses bus ON bus.id = b.business_id
            LEFT JOIN services s ON s.id = b.service_id
            SET b.status = 'completed'
            WHERE (
                b.status = 'confirmed'
                OR (
                    b.status = 'pending'
                    AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(bus.booking_settings, '$.requireConfirmation')), 'false') <> 'true'
                )
            )
            AND TIMESTAMP(b.booking_date, b.booking_time)
                + INTERVAL (COALESCE(s.duration, 60) + 180) MINUTE < NOW()
        `);

        const updated = result?.affectedRows ?? 0;
        console.log(`✅ [Completar citas] ${updated} citas pasadas marcadas como completadas`);
        return { success: true, updated };
    } catch (error) {
        console.error('❌ [Completar citas] Error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { completarCitasPasadas };
