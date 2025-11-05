/**
 * Script para enviar recordatorios de citas
 * Se debe ejecutar diariamente (ej: con cron job o task scheduler)
 *
 * Uso: node backend/send-reminders.js
 */

const emailService = require('./email-service');
const db = require('../config/database');
require('dotenv').config();

async function sendReminders() {
    console.log('🔔 Iniciando envío de recordatorios...\n');

    try {
        // Verificar que el servicio de email esté configurado
        const emailConfigured = await emailService.verifyEmailService();

        if (!emailConfigured) {
            console.log('⚠️  Email no configurado - no se pueden enviar recordatorios');
            console.log('📝 Configura EMAIL_USER y EMAIL_PASSWORD en tu archivo .env\n');
            process.exit(0);
        }

        // Calcular la fecha de mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        console.log(`📅 Buscando reservas para: ${tomorrowDate}\n`);

        // Buscar todas las reservas confirmadas para mañana
        const bookings = await db.query(
            `SELECT
                b.*,
                s.name as service_name,
                bus.name as business_name,
                bus.email as business_email,
                bus.phone as business_phone,
                bus.address as business_address
             FROM bookings b
             LEFT JOIN services s ON b.service_id = s.id
             JOIN businesses bus ON b.business_id = bus.id
             WHERE b.booking_date = ?
             AND b.status IN ('confirmed', 'pending')
             ORDER BY b.booking_time`,
            [tomorrowDate]
        );

        if (bookings.length === 0) {
            console.log('✓ No hay reservas para mañana - no se enviarán recordatorios\n');
            process.exit(0);
        }

        console.log(`📬 Encontradas ${bookings.length} reserva(s) para enviar recordatorios:\n`);

        let successCount = 0;
        let errorCount = 0;

        // Enviar recordatorio para cada reserva
        for (const booking of bookings) {
            console.log(`   → Enviando a ${booking.customer_name} (${booking.customer_email})...`);

            const businessData = {
                name: booking.business_name,
                email: booking.business_email,
                phone: booking.business_phone,
                address: booking.business_address
            };

            try {
                const result = await emailService.sendBookingReminder(booking, businessData);

                if (result.success) {
                    console.log(`     ✓ Recordatorio enviado exitosamente`);
                    successCount++;
                } else {
                    console.log(`     ✗ Error: ${result.error || result.message}`);
                    errorCount++;
                }
            } catch (error) {
                console.log(`     ✗ Error: ${error.message}`);
                errorCount++;
            }
        }

        console.log(`\n==================================================`);
        console.log(`✅ Proceso completado`);
        console.log(`   📨 Enviados: ${successCount}`);
        if (errorCount > 0) {
            console.log(`   ❌ Errores: ${errorCount}`);
        }
        console.log(`==================================================\n`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error crítico:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Ejecutar el script
sendReminders();
