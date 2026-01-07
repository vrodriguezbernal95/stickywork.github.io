const crypto = require('crypto');

/**
 * Job: Marcar reservas que necesitan solicitud de feedback
 * Se ejecuta cada hora para buscar reservas completadas hace 24h
 * Genera tokens para que el negocio pueda enviar feedback manualmente por WhatsApp
 */
async function marcarFeedbacksPendientes(db) {
    console.log('🔄 [Feedback Job] Iniciando marcado de feedbacks pendientes...');

    try {
        // Buscar reservas completadas hace 24h sin token de feedback generado
        const reservas = await db.query(`
            SELECT
                b.id,
                b.customer_name,
                b.customer_phone,
                b.booking_date,
                b.business_id,
                s.name as service_name,
                bus.name as business_name,
                bus.whatsapp_enabled,
                bus.whatsapp_number
            FROM bookings b
            LEFT JOIN services s ON b.service_id = s.id
            LEFT JOIN businesses bus ON b.business_id = bus.id
            WHERE b.status = 'completed'
            AND b.feedback_token IS NULL
            AND b.booking_date >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
            AND b.booking_date <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            AND b.customer_phone IS NOT NULL
            AND b.customer_phone != ''
            LIMIT 50
        `);

        if (reservas.length === 0) {
            console.log('✅ [Feedback Job] No hay reservas pendientes de marcar.');
            return { success: true, marked: 0 };
        }

        console.log(`📝 [Feedback Job] Encontradas ${reservas.length} reservas para marcar`);

        let markedCount = 0;

        for (const reserva of reservas) {
            try {
                // Generar token único para esta reserva
                const feedbackToken = crypto.randomBytes(32).toString('hex');

                // Guardar token en la base de datos (NO marcar como enviado aún)
                await db.query(
                    'UPDATE bookings SET feedback_token = ? WHERE id = ?',
                    [feedbackToken, reserva.id]
                );

                markedCount++;
                console.log(`✅ [Feedback Job] Token generado para booking #${reserva.id} (${reserva.customer_name})`);

            } catch (error) {
                console.error(`❌ [Feedback Job] Error generando token para booking #${reserva.id}:`, error.message);
                // Continuar con el siguiente
            }
        }

        console.log(`✅ [Feedback Job] Proceso completado. Marcadas: ${markedCount} reservas`);

        return {
            success: true,
            marked: markedCount
        };

    } catch (error) {
        console.error('❌ [Feedback Job] Error general:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { marcarFeedbacksPendientes };
