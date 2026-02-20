/**
 * Job: Enviar recordatorios de citas por email
 * Se ejecuta cada día a las 10:00 AM via cron en server.js
 * Solo envía a negocios con reminders_enabled = true (o sin configurar, por compatibilidad)
 * Marca reminder_sent = TRUE tras cada envío para evitar duplicados
 */
async function enviarRecordatoriosCitas(db, emailService) {
    console.log('🔔 [Recordatorios] Iniciando envío de recordatorios...');

    try {
        // Calcular fecha de mañana sin bug UTC (construcción local)
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const tomorrowDate = `${yyyy}-${mm}-${dd}`;

        console.log(`📅 [Recordatorios] Buscando reservas para: ${tomorrowDate}`);

        // Buscar reservas de mañana pendientes de recordatorio
        const bookings = await db.query(`
            SELECT
                b.*,
                s.name as service_name,
                bus.name as business_name,
                bus.email as business_email,
                bus.phone as business_phone,
                bus.address as business_address,
                bus.booking_settings
            FROM bookings b
            LEFT JOIN services s ON b.service_id = s.id
            JOIN businesses bus ON b.business_id = bus.id
            WHERE b.booking_date = ?
            AND b.status IN ('confirmed', 'pending')
            AND b.reminder_sent = FALSE
            AND b.customer_email IS NOT NULL
            AND b.customer_email != ''
        `, [tomorrowDate]);

        if (bookings.length === 0) {
            console.log('✅ [Recordatorios] No hay reservas pendientes de recordatorio.');
            return { success: true, sent: 0, errors: 0 };
        }

        console.log(`📬 [Recordatorios] Encontradas ${bookings.length} reserva(s)`);

        let sentCount = 0;
        let errorCount = 0;

        for (const booking of bookings) {
            try {
                // Comprobar si el negocio tiene los recordatorios activados
                // Si booking_settings es null o reminders_enabled no existe → asumir true (backwards compatible)
                let remindersEnabled = true;
                if (booking.booking_settings) {
                    const bs = typeof booking.booking_settings === 'string'
                        ? JSON.parse(booking.booking_settings)
                        : booking.booking_settings;
                    if (bs.reminders_enabled === false) {
                        remindersEnabled = false;
                    }
                }

                if (!remindersEnabled) {
                    // Marcar como enviado igualmente para no procesar en futuras ejecuciones
                    await db.query('UPDATE bookings SET reminder_sent = TRUE WHERE id = ?', [booking.id]);
                    console.log(`   ⏭️  Recordatorios desactivados para negocio #${booking.business_id} — omitiendo booking #${booking.id}`);
                    continue;
                }

                const businessData = {
                    name: booking.business_name,
                    email: booking.business_email,
                    phone: booking.business_phone,
                    address: booking.business_address
                };

                const result = await emailService.sendBookingReminder(booking, businessData);

                if (result.success) {
                    await db.query('UPDATE bookings SET reminder_sent = TRUE WHERE id = ?', [booking.id]);
                    sentCount++;
                    console.log(`   ✅ Recordatorio enviado a ${booking.customer_name} (${booking.customer_email})`);
                } else {
                    errorCount++;
                    console.log(`   ❌ Error enviando a ${booking.customer_email}: ${result.error || result.message}`);
                }

            } catch (error) {
                errorCount++;
                console.error(`   ❌ Error en booking #${booking.id}: ${error.message}`);
            }
        }

        console.log(`✅ [Recordatorios] Completado — Enviados: ${sentCount}, Errores: ${errorCount}`);
        return { success: true, sent: sentCount, errors: errorCount };

    } catch (error) {
        console.error('❌ [Recordatorios] Error general:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { enviarRecordatoriosCitas };
