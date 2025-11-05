const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
let transporter = null;

try {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
} catch (error) {
    console.error('Error inicializando transporter de email:', error.message);
}

// Verify transporter configuration
async function verifyEmailService() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  Email no configurado - las notificaciones están deshabilitadas');
        return false;
    }

    try {
        await transporter.verify();
        console.log('✓ Servicio de email configurado correctamente');
        return true;
    } catch (error) {
        console.log('⚠️  Error en configuración de email:', error.message);
        return false;
    }
}

// Email templates
const emailTemplates = {
    // Booking confirmation email to customer
    bookingConfirmation: (booking, business) => ({
        subject: `✅ Confirmación de Reserva - ${business.name}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #ef4444); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .booking-details { background: #f8f9fa; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .booking-details h2 { margin-top: 0; color: #3b82f6; font-size: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #666; }
        .detail-value { color: #333; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #3b82f6, #ef4444); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">✅</div>
            <h1>¡Reserva Confirmada!</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${booking.customer_name}</strong>,</p>
            <p>Tu reserva ha sido confirmada exitosamente. A continuación encontrarás los detalles:</p>

            <div class="booking-details">
                <h2>Detalles de tu Reserva</h2>

                <div class="detail-row">
                    <span class="detail-label">📍 Negocio:</span>
                    <span class="detail-value">${business.name}</span>
                </div>

                ${booking.service_name ? `
                <div class="detail-row">
                    <span class="detail-label">🛠️ Servicio:</span>
                    <span class="detail-value">${booking.service_name}</span>
                </div>
                ` : ''}

                <div class="detail-row">
                    <span class="detail-label">📅 Fecha:</span>
                    <span class="detail-value">${new Date(booking.booking_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">🕐 Hora:</span>
                    <span class="detail-value">${booking.booking_time}</span>
                </div>

                ${booking.notes ? `
                <div class="detail-row">
                    <span class="detail-label">📝 Notas:</span>
                    <span class="detail-value">${booking.notes}</span>
                </div>
                ` : ''}
            </div>

            <p style="margin-top: 20px;"><strong>Información de Contacto:</strong></p>
            <p style="margin: 5px 0;">📧 Email: ${booking.customer_email}</p>
            <p style="margin: 5px 0;">📞 Teléfono: ${booking.customer_phone}</p>

            ${business.address ? `
            <p style="margin-top: 20px;"><strong>📍 Dirección:</strong></p>
            <p style="margin: 5px 0;">${business.address}</p>
            ` : ''}

            ${business.phone ? `
            <p style="margin-top: 20px;"><strong>💬 ¿Necesitas hacer cambios?</strong></p>
            <p>Contacta con nosotros en: ${business.phone}</p>
            ` : ''}
        </div>

        <div class="footer">
            <p>Gracias por confiar en nosotros</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Booking reminder (24 hours before)
    bookingReminder: (booking, business) => ({
        subject: `⏰ Recordatorio: Tu cita en ${business.name} es mañana`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #eab308, #f59e0b); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .reminder-box { background: #fff3cd; border-left: 4px solid #eab308; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #666; }
        .detail-value { color: #333; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">⏰</div>
            <h1>Recordatorio de Cita</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${booking.customer_name}</strong>,</p>
            <p>Te recordamos que <strong>mañana</strong> tienes una cita programada:</p>

            <div class="reminder-box">
                <div class="detail-row">
                    <span class="detail-label">📍 Lugar:</span>
                    <span class="detail-value">${business.name}</span>
                </div>

                ${booking.service_name ? `
                <div class="detail-row">
                    <span class="detail-label">🛠️ Servicio:</span>
                    <span class="detail-value">${booking.service_name}</span>
                </div>
                ` : ''}

                <div class="detail-row">
                    <span class="detail-label">📅 Fecha:</span>
                    <span class="detail-value">${new Date(booking.booking_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">🕐 Hora:</span>
                    <span class="detail-value">${booking.booking_time}</span>
                </div>
            </div>

            ${business.address ? `
            <p><strong>📍 Dirección:</strong><br>${business.address}</p>
            ` : ''}

            ${business.phone ? `
            <p><strong>💬 ¿Necesitas cancelar o reprogramar?</strong><br>Contacta con nosotros: ${business.phone}</p>
            ` : ''}

            <p style="margin-top: 20px;">¡Te esperamos!</p>
        </div>

        <div class="footer">
            <p>${business.name}</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // New booking notification to admin
    adminNewBooking: (booking, business) => ({
        subject: `🔔 Nueva Reserva - ${booking.customer_name}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .booking-card { background: #f8f9fa; border: 2px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 12px; }
        .detail-row { padding: 8px 0; }
        .detail-label { font-weight: 600; color: #666; display: inline-block; min-width: 120px; }
        .detail-value { color: #333; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #3b82f6, #ef4444); color: white; text-decoration: none; border-radius: 8px; margin: 10px 0; font-weight: 600; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🔔</div>
            <h1>Nueva Reserva Recibida</h1>
        </div>

        <div class="content">
            <p>Has recibido una nueva reserva en <strong>${business.name}</strong></p>

            <div class="booking-card">
                <h2 style="margin-top: 0; color: #22c55e;">Detalles de la Reserva</h2>

                <div class="detail-row">
                    <span class="detail-label">👤 Cliente:</span>
                    <span class="detail-value"><strong>${booking.customer_name}</strong></span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">📧 Email:</span>
                    <span class="detail-value">${booking.customer_email}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">📞 Teléfono:</span>
                    <span class="detail-value">${booking.customer_phone}</span>
                </div>

                ${booking.service_name ? `
                <div class="detail-row">
                    <span class="detail-label">🛠️ Servicio:</span>
                    <span class="detail-value">${booking.service_name}</span>
                </div>
                ` : ''}

                <div class="detail-row">
                    <span class="detail-label">📅 Fecha:</span>
                    <span class="detail-value"><strong>${new Date(booking.booking_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</strong></span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">🕐 Hora:</span>
                    <span class="detail-value"><strong>${booking.booking_time}</strong></span>
                </div>

                ${booking.notes ? `
                <div class="detail-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                    <span class="detail-label">📝 Notas:</span>
                    <span class="detail-value" style="display: block; margin-top: 5px;">${booking.notes}</span>
                </div>
                ` : ''}
            </div>

            <p style="text-align: center;">
                <a href="${process.env.APP_URL}/admin-dashboard.html" class="button">
                    Ver en el Dashboard
                </a>
            </p>
        </div>

        <div class="footer">
            <p>StickyWork - Sistema de Gestión de Reservas</p>
        </div>
    </div>
</body>
</html>
        `
    })
};

// Send email function
async function sendEmail(to, template, data) {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  Email no configurado - saltando envío a:', to);
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: to,
            subject: template.subject,
            html: template.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('✗ Error enviando email:', error.message);
        return { success: false, error: error.message };
    }
}

// Send booking confirmation
async function sendBookingConfirmation(booking, business) {
    const template = emailTemplates.bookingConfirmation(booking, business);
    return await sendEmail(booking.customer_email, template);
}

// Send booking reminder
async function sendBookingReminder(booking, business) {
    const template = emailTemplates.bookingReminder(booking, business);
    return await sendEmail(booking.customer_email, template);
}

// Send admin notification
async function sendAdminNotification(booking, business, adminEmail) {
    const template = emailTemplates.adminNewBooking(booking, business);
    return await sendEmail(adminEmail || business.email, template);
}

module.exports = {
    verifyEmailService,
    sendBookingConfirmation,
    sendBookingReminder,
    sendAdminNotification,
    sendEmail,
    emailTemplates
};
