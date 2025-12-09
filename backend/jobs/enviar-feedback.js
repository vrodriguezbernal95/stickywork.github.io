const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Job: Enviar emails de solicitud de feedback
 * Se ejecuta cada hora para buscar reservas completadas hace 24h sin feedback enviado
 */
async function enviarEmailsFeedback(db, transporter) {
    console.log('🔄 [Feedback Job] Iniciando envío de emails de feedback...');

    if (!transporter) {
        console.log('⚠️  [Feedback Job] Transporter de email no disponible. Saltando...');
        return { success: false, error: 'No email transporter available' };
    }

    try {
        // Buscar reservas completadas hace 24h sin feedback enviado
        const reservas = await db.query(`
            SELECT
                b.id,
                b.customer_name,
                b.customer_email,
                b.booking_date,
                b.business_id,
                s.name as service_name,
                bus.name as business_name,
                bus.email as business_email
            FROM bookings b
            LEFT JOIN services s ON b.service_id = s.id
            LEFT JOIN businesses bus ON b.business_id = bus.id
            WHERE b.status = 'completed'
            AND b.feedback_sent = FALSE
            AND b.booking_date >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
            AND b.booking_date <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            AND b.customer_email IS NOT NULL
            AND b.customer_email != ''
            LIMIT 50
        `);

        if (reservas.length === 0) {
            console.log('✅ [Feedback Job] No hay reservas pendientes de feedback.');
            return { success: true, sent: 0 };
        }

        console.log(`📧 [Feedback Job] Encontradas ${reservas.length} reservas para enviar feedback`);

        let sentCount = 0;
        let errorCount = 0;

        // Leer template de email
        const templatePath = path.join(__dirname, '../templates/email-feedback.html');
        let emailTemplate = await fs.readFile(templatePath, 'utf-8');

        for (const reserva of reservas) {
            try {
                // Generar token único para esta reserva
                const feedbackToken = crypto.randomBytes(32).toString('hex');

                // Guardar token en la base de datos
                await db.query(
                    'UPDATE bookings SET feedback_token = ? WHERE id = ?',
                    [feedbackToken, reserva.id]
                );

                // URL de feedback
                const feedbackUrl = `${process.env.APP_URL || 'https://stickywork.com'}/feedback.html?token=${feedbackToken}`;

                // Formatear fecha
                const bookingDate = new Date(reserva.booking_date);
                const formattedDate = bookingDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Reemplazar variables en el template
                let emailHtml = emailTemplate
                    .replace(/{{businessName}}/g, reserva.business_name)
                    .replace(/{{customerName}}/g, reserva.customer_name)
                    .replace(/{{serviceName}}/g, reserva.service_name)
                    .replace(/{{bookingDate}}/g, formattedDate)
                    .replace(/{{feedbackUrl}}/g, feedbackUrl);

                // Enviar email con nodemailer
                const mailOptions = {
                    from: `${reserva.business_name} <${process.env.EMAIL_USER}>`,
                    to: `${reserva.customer_name} <${reserva.customer_email}>`,
                    subject: `¿Qué te pareció tu visita a ${reserva.business_name}?`,
                    html: emailHtml,
                    replyTo: reserva.business_email || process.env.EMAIL_USER
                };

                await transporter.sendMail(mailOptions);

                // Marcar como enviado
                await db.query(
                    'UPDATE bookings SET feedback_sent = TRUE, feedback_sent_at = NOW() WHERE id = ?',
                    [reserva.id]
                );

                sentCount++;
                console.log(`✅ [Feedback Job] Email enviado a ${reserva.customer_email} (Booking #${reserva.id})`);

            } catch (error) {
                errorCount++;
                console.error(`❌ [Feedback Job] Error enviando email para booking #${reserva.id}:`, error.message);
                // Continuar con el siguiente
            }

            // Pequeña pausa para no saturar el API de Brevo
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`✅ [Feedback Job] Proceso completado. Enviados: ${sentCount}, Errores: ${errorCount}`);

        return {
            success: true,
            sent: sentCount,
            errors: errorCount
        };

    } catch (error) {
        console.error('❌ [Feedback Job] Error general:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { enviarEmailsFeedback };
