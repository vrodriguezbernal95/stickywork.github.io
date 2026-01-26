const nodemailer = require('nodemailer');
require('dotenv').config();

// Determinar si usar API HTTP de Brevo o SMTP
const useBrevoAPI = !!process.env.BREVO_API_KEY;

// Create email transporter (solo para SMTP fallback)
let transporter = null;

if (!useBrevoAPI) {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            connectionTimeout: 10000,  // 10 seconds
            greetingTimeout: 10000,    // 10 seconds
            socketTimeout: 30000       // 30 seconds
        });
    } catch (error) {
        console.error('Error inicializando transporter de email:', error.message);
    }
}

// Enviar email via API HTTP de Brevo
async function sendEmailViaBrevoAPI(to, subject, htmlContent) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'noreply@stickywork.com';
    const senderName = process.env.EMAIL_FROM?.match(/^([^<]+)/)?.[1]?.trim() || 'StickyWork';

    const body = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✓ Email enviado via Brevo API:', data.messageId);
            return { success: true, messageId: data.messageId };
        } else {
            console.error('✗ Error Brevo API:', data.message || data);
            return { success: false, error: data.message || 'Error desconocido' };
        }
    } catch (error) {
        console.error('✗ Error enviando email via Brevo API:', error.message);
        return { success: false, error: error.message };
    }
}

// Verify email service configuration
async function verifyEmailService() {
    // Preferir Brevo API
    if (useBrevoAPI) {
        console.log('✓ Servicio de email configurado (Brevo API HTTP)');
        return true;
    }

    // Fallback a SMTP
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  Email no configurado - las notificaciones están deshabilitadas');
        return false;
    }

    try {
        await transporter.verify();
        console.log('✓ Servicio de email configurado correctamente (SMTP)');
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

    // Password reset email
    passwordReset: (user, resetToken, resetUrl) => ({
        subject: '🔐 Recuperación de Contraseña - StickyWork',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .reset-box { background: #f8f9fa; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .button:hover { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .icon { font-size: 50px; margin-bottom: 10px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .code { background: #f1f3f5; padding: 10px 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 14px; margin: 10px 0; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🔐</div>
            <h1>Recuperación de Contraseña</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name || user.email}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en StickyWork.</p>

            <div class="reset-box">
                <p><strong>Para restablecer tu contraseña, haz clic en el siguiente botón:</strong></p>

                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </div>

                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                    O copia y pega este enlace en tu navegador:
                </p>
                <div class="code">${resetUrl}</div>
            </div>

            <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Este enlace <strong>expira en 1 hora</strong></li>
                    <li>Solo puede usarse <strong>una vez</strong></li>
                    <li>Si no solicitaste este cambio, ignora este email</li>
                </ul>
            </div>

            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Si tienes problemas con el botón, contacta con soporte.
            </p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong> - Sistema de Gestión de Reservas</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
            <p style="font-size: 12px; color: #999;">
                Si no solicitaste este cambio, tu cuenta sigue segura.
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
    }),

    // Team member welcome email (with credentials)
    teamMemberWelcome: (user, business, temporaryPassword) => ({
        subject: `🎉 Bienvenido al equipo de ${business.name} - StickyWork`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .credentials-box { background: #f8f9fa; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .credentials-box strong { color: #10b981; }
        .credential-item { margin: 10px 0; padding: 10px; background: white; border-radius: 6px; font-family: monospace; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; text-align: center; }
        .button:hover { background: linear-gradient(135deg, #059669, #10b981); }
        .role-badge { display: inline-block; padding: 5px 12px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👥 ¡Bienvenido al Equipo!</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name}</strong>,</p>

            <p>Has sido agregado al equipo de <strong>${business.name}</strong> en StickyWork con el rol de <span class="role-badge">${user.role === 'admin' ? 'ADMINISTRADOR' : 'PERSONAL'}</span></p>

            <div class="credentials-box">
                <p><strong>🔐 Tus credenciales de acceso:</strong></p>
                <div class="credential-item">
                    <strong>Email:</strong> ${user.email}
                </div>
                <div class="credential-item">
                    <strong>Contraseña:</strong> ${temporaryPassword}
                </div>
            </div>

            <div class="warning">
                <strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después de tu primer inicio de sesión.
            </div>

            <p><strong>Accede al panel de administración:</strong></p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-login.html" class="button">
                Ir al Panel Admin
            </a>

            <p><strong>¿Qué puedes hacer según tu rol?</strong></p>
            ${user.role === 'admin' ? `
            <ul>
                <li>✅ Gestionar todas las reservas del negocio</li>
                <li>✅ Crear, editar y eliminar servicios</li>
                <li>✅ Ver estadísticas y reportes</li>
                <li>✅ Configurar ajustes del widget</li>
                <li>✅ Acceder a encuestas de feedback</li>
            </ul>
            ` : `
            <ul>
                <li>✅ Ver todas las reservas</li>
                <li>✅ Confirmar y cancelar reservas</li>
                <li>✅ Acceder al calendario</li>
            </ul>
            `}

            <p style="margin-top: 30px;">Si tienes alguna pregunta, no dudes en contactar con el propietario del negocio.</p>

            <p>¡Bienvenido al equipo! 🎉</p>
        </div>

        <div class="footer">
            <p><strong>${business.name}</strong></p>
            <p style="margin-top: 10px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Team member role changed notification
    teamMemberRoleChanged: (user, business, newRole, changedBy) => ({
        subject: `🔄 Tu rol ha sido actualizado en ${business.name}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .change-box { background: #f8f9fa; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .role-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .role-admin { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
        .role-staff { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Cambio de Rol</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name}</strong>,</p>

            <p>Tu rol en <strong>${business.name}</strong> ha sido actualizado por <strong>${changedBy}</strong>.</p>

            <div class="change-box">
                <p><strong>Tu nuevo rol es:</strong></p>
                <p style="font-size: 20px; margin: 15px 0;">
                    <span class="role-badge ${newRole === 'admin' ? 'role-admin' : 'role-staff'}">
                        ${newRole === 'admin' ? '👔 ADMINISTRADOR' : '👤 PERSONAL'}
                    </span>
                </p>
            </div>

            <p><strong>Tus nuevos permisos incluyen:</strong></p>
            ${newRole === 'admin' ? `
            <ul>
                <li>✅ Gestionar todas las reservas</li>
                <li>✅ Crear, editar y eliminar servicios</li>
                <li>✅ Ver estadísticas y reportes</li>
                <li>✅ Configurar ajustes del widget</li>
                <li>✅ Acceder a encuestas de feedback</li>
            </ul>
            ` : `
            <ul>
                <li>✅ Ver todas las reservas</li>
                <li>✅ Confirmar y cancelar reservas</li>
                <li>✅ Acceder al calendario</li>
            </ul>
            `}

            <p style="margin-top: 30px;">Estos cambios son efectivos inmediatamente. La próxima vez que inicies sesión, verás tus nuevos permisos.</p>

            <p>Si tienes alguna pregunta sobre estos cambios, contacta con el propietario del negocio.</p>
        </div>

        <div class="footer">
            <p><strong>${business.name}</strong></p>
            <p style="margin-top: 10px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Team member deactivated notification
    teamMemberDeactivated: (user, business, reason) => ({
        subject: `⏸️ Tu cuenta en ${business.name} ha sido desactivada`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .notice-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; color: #92400e; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏸️ Cuenta Desactivada</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name}</strong>,</p>

            <p>Te informamos que tu cuenta en <strong>${business.name}</strong> ha sido desactivada temporalmente.</p>

            <div class="notice-box">
                <p><strong>⚠️ Esto significa que:</strong></p>
                <ul>
                    <li>No podrás iniciar sesión en el panel de administración</li>
                    <li>Tu acceso a las funciones del negocio está suspendido</li>
                    <li>Esta es una medida temporal y reversible</li>
                </ul>
                ${reason ? `
                <p style="margin-top: 15px;"><strong>Motivo:</strong> ${reason}</p>
                ` : ''}
            </div>

            <p>Si crees que esto es un error o necesitas más información, por favor contacta directamente con el propietario del negocio.</p>

            <p style="margin-top: 30px;">Tu cuenta puede ser reactivada en cualquier momento por el administrador.</p>
        </div>

        <div class="footer">
            <p><strong>${business.name}</strong></p>
            <p style="margin-top: 10px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // ========== SUBSCRIPTION EMAILS ==========

    // Subscription welcome email (when subscription is activated)
    subscriptionWelcome: (business, plan, user) => ({
        subject: `🎉 ¡Bienvenido a StickyWork ${plan.name}!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 32px; }
        .content { padding: 30px; }
        .plan-badge { display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border-radius: 25px; font-size: 18px; font-weight: 700; margin: 10px 0; }
        .features-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .features-box h3 { margin-top: 0; color: #059669; }
        .features-box ul { margin: 0; padding-left: 20px; }
        .features-box li { margin: 8px 0; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #3b82f6, #ef4444); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .next-steps { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .next-steps h3 { margin-top: 0; color: #333; }
        .step { display: flex; align-items: flex-start; margin: 15px 0; }
        .step-number { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 12px; flex-shrink: 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .icon { font-size: 60px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🎉</div>
            <h1>¡Bienvenido a StickyWork!</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name || business.name}</strong>,</p>

            <p>¡Enhorabuena! Tu suscripción ha sido activada correctamente.</p>

            <p style="text-align: center;">
                <span class="plan-badge">Plan ${plan.name}</span>
            </p>

            <div class="features-box">
                <h3>✨ Lo que incluye tu plan:</h3>
                <ul>
                    ${plan.name === 'Founders' || plan.name === 'Profesional' ? `
                    <li><strong>3 usuarios</strong> administradores</li>
                    <li><strong>Reservas ilimitadas</strong></li>
                    <li><strong>1 reporte IA</strong> al mes</li>
                    <li>Soporte de implementación incluido</li>
                    ` : ''}
                    ${plan.name === 'Premium' ? `
                    <li><strong>10 usuarios</strong> administradores</li>
                    <li><strong>Reservas ilimitadas</strong></li>
                    <li><strong>2 reportes IA</strong> a la semana</li>
                    <li><strong>1 hora de consultoría</strong> al mes</li>
                    <li><strong>Landing page gratis</strong> (valor 200€)</li>
                    <li>Soporte prioritario</li>
                    ` : ''}
                    <li>Widget personalizable</li>
                    <li>Notificaciones WhatsApp</li>
                    <li>Encuestas de feedback</li>
                </ul>
            </div>

            <div class="next-steps">
                <h3>🚀 Próximos pasos:</h3>
                <div class="step">
                    <span class="step-number">1</span>
                    <div>
                        <strong>Configura tus servicios</strong><br>
                        <span style="color: #666;">Define los servicios que ofreces con precios y duración</span>
                    </div>
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    <div>
                        <strong>Personaliza tu widget</strong><br>
                        <span style="color: #666;">Adapta los colores y textos a tu marca</span>
                    </div>
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    <div>
                        <strong>Integra en tu web</strong><br>
                        <span style="color: #666;">Copia el código del widget en tu página</span>
                    </div>
                </div>
            </div>

            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://stickywork.com'}/admin-dashboard.html" class="button">
                    Ir a mi Dashboard
                </a>
            </p>

            <p style="margin-top: 30px;">¿Necesitas ayuda? Respondemos en menos de 24 horas.</p>
            <p>📧 <a href="mailto:soporte@stickywork.com">soporte@stickywork.com</a></p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong> - Sistema de Gestión de Reservas</p>
            <p style="margin-top: 10px;">
                Gracias por confiar en nosotros. ¡Estamos aquí para ayudarte a crecer!
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Trial ending reminder (3 days before trial ends)
    trialEnding: (business, user, daysLeft, trialEndDate) => ({
        subject: `⏰ Tu prueba gratuita termina en ${daysLeft} días - StickyWork`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .countdown-box { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center; }
        .countdown-number { font-size: 48px; font-weight: 700; color: #d97706; }
        .countdown-label { font-size: 18px; color: #92400e; }
        .benefits-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .benefits-box h3 { margin-top: 0; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #3b82f6, #ef4444); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .button-secondary { display: inline-block; padding: 12px 30px; background: white; color: #3b82f6; text-decoration: none; border-radius: 8px; margin: 10px; font-weight: 600; border: 2px solid #3b82f6; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">⏰</div>
            <h1>Tu prueba termina pronto</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name || business.name}</strong>,</p>

            <p>Esperamos que estés disfrutando de StickyWork. Queremos recordarte que tu período de prueba gratuita está a punto de terminar.</p>

            <div class="countdown-box">
                <div class="countdown-number">${daysLeft}</div>
                <div class="countdown-label">días restantes</div>
                <p style="margin-bottom: 0; color: #92400e;">Tu prueba termina el <strong>${new Date(trialEndDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
            </div>

            <div class="benefits-box">
                <h3>📊 Lo que has conseguido hasta ahora:</h3>
                <p>Has estado usando StickyWork para gestionar tus reservas. Para no perder el acceso a todas las funcionalidades, te recomendamos activar tu suscripción antes de que termine la prueba.</p>
            </div>

            <p><strong>¿Qué pasa cuando termina la prueba?</strong></p>
            <ul>
                <li>Tu cuenta pasará automáticamente al <strong>Plan Gratuito</strong> (30 reservas/mes)</li>
                <li>Tus datos y configuración se mantienen</li>
                <li>Puedes actualizar a un plan de pago en cualquier momento</li>
            </ul>

            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://stickywork.com'}/admin-dashboard.html#billing" class="button">
                    Ver Planes y Precios
                </a>
            </p>

            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://stickywork.com'}/contacto.html" class="button-secondary">
                    ¿Tienes dudas? Contáctanos
                </a>
            </p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong></p>
            <p style="margin-top: 10px;">
                Si decides no continuar, gracias por probar StickyWork. ¡Siempre serás bienvenido!
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Payment failed notification
    paymentFailed: (business, user, invoice, nextRetryDate) => ({
        subject: `⚠️ Problema con tu pago - StickyWork`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .alert-box h3 { margin-top: 0; color: #dc2626; }
        .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .invoice-row:last-child { border-bottom: none; font-weight: 700; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .grace-period { background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">⚠️</div>
            <h1>Problema con tu pago</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name || business.name}</strong>,</p>

            <div class="alert-box">
                <h3>No hemos podido procesar tu pago</h3>
                <p style="margin-bottom: 0;">Hemos intentado cobrar tu suscripción pero el pago ha sido rechazado. Por favor, actualiza tu método de pago para evitar la interrupción del servicio.</p>
            </div>

            <div class="invoice-details">
                <h4 style="margin-top: 0;">Detalles del pago:</h4>
                <div class="invoice-row">
                    <span>Concepto:</span>
                    <span>Suscripción StickyWork</span>
                </div>
                <div class="invoice-row">
                    <span>Importe:</span>
                    <span>${(invoice.amount / 100).toFixed(2)}€</span>
                </div>
                <div class="invoice-row">
                    <span>Fecha del intento:</span>
                    <span>${new Date().toLocaleDateString('es-ES')}</span>
                </div>
            </div>

            <div class="grace-period">
                <p style="margin: 0;"><strong>⏳ Período de gracia:</strong> Tienes <strong>5 días</strong> para actualizar tu método de pago antes de que tu cuenta pase al plan gratuito.</p>
                ${nextRetryDate ? `<p style="margin: 10px 0 0 0;">Volveremos a intentar el cobro el <strong>${new Date(nextRetryDate).toLocaleDateString('es-ES')}</strong>.</p>` : ''}
            </div>

            <p><strong>¿Cómo solucionarlo?</strong></p>
            <ol>
                <li>Accede a tu panel de administración</li>
                <li>Ve a la sección "Facturación"</li>
                <li>Actualiza tu tarjeta o método de pago</li>
            </ol>

            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://stickywork.com'}/admin-dashboard.html#billing" class="button">
                    Actualizar Método de Pago
                </a>
            </p>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <strong>¿Necesitas ayuda?</strong> Contacta con nosotros en <a href="mailto:soporte@stickywork.com">soporte@stickywork.com</a> y te ayudaremos a resolver cualquier problema.
            </p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong></p>
            <p style="margin-top: 10px;">
                Este es un mensaje importante sobre tu cuenta. Por favor, actúa lo antes posible.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // ========== CONSULTANCY EMAILS ==========

    // New consultancy request notification (to admin)
    consultancyRequestAdmin: (request, business, user) => ({
        subject: `💼 Nueva solicitud de consultoría - ${business.name}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .request-box { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .request-box h3 { margin-top: 0; color: #7c3aed; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #666; display: block; margin-bottom: 5px; }
        .detail-value { color: #333; }
        .dates-box { background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .icon { font-size: 50px; margin-bottom: 10px; }
        .client-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">💼</div>
            <h1>Nueva Solicitud de Consultoría</h1>
        </div>

        <div class="content">
            <p>Has recibido una nueva solicitud de consultoría de un cliente Premium.</p>

            <div class="client-info">
                <p style="margin: 0;"><strong>👤 Cliente:</strong> ${business.name}</p>
                <p style="margin: 5px 0 0;"><strong>📧 Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0 0;"><strong>👔 Solicitado por:</strong> ${user.full_name || user.email}</p>
            </div>

            <div class="request-box">
                <h3>📋 Detalles de la solicitud</h3>

                <div class="detail-row">
                    <span class="detail-label">Tema:</span>
                    <span class="detail-value"><strong>${request.topic}</strong></span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Descripción:</span>
                    <span class="detail-value">${request.description}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Franja horaria preferida:</span>
                    <span class="detail-value">${request.preferred_time_slot === 'morning' ? 'Mañana (9:00 - 13:00)' : request.preferred_time_slot === 'afternoon' ? 'Tarde (15:00 - 19:00)' : 'Noche (19:00 - 21:00)'}</span>
                </div>
            </div>

            <div class="dates-box">
                <p style="margin: 0;"><strong>📅 Fechas preferidas por el cliente:</strong></p>
                <ul style="margin: 10px 0 0; padding-left: 20px;">
                    <li><strong>Opción 1:</strong> ${new Date(request.preferred_date_1).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</li>
                    ${request.preferred_date_2 ? `<li><strong>Opción 2:</strong> ${new Date(request.preferred_date_2).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</li>` : ''}
                    ${request.preferred_date_3 ? `<li><strong>Opción 3:</strong> ${new Date(request.preferred_date_3).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</li>` : ''}
                </ul>
            </div>

            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://stickywork.com'}/super-admin.html#consultancy" class="button">
                    Ver en Super Admin
                </a>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Recuerda contactar al cliente para confirmar la fecha y hora de la consultoría.
            </p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong> - Panel Super Admin</p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Consultancy scheduled confirmation (to client)
    consultancyScheduled: (request, business, user) => ({
        subject: `✅ Tu consultoría ha sido agendada - StickyWork`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .schedule-box { background: #f0fdf4; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center; }
        .schedule-date { font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 10px; }
        .schedule-time { font-size: 20px; color: #333; }
        .meeting-link { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .meeting-link a { color: #2563eb; font-weight: 600; }
        .topic-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .tips-box { background: #fefce8; border-left: 4px solid #eab308; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">✅</div>
            <h1>¡Consultoría Agendada!</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name || business.name}</strong>,</p>

            <p>¡Excelentes noticias! Tu consultoría ha sido agendada. Aquí tienes los detalles:</p>

            <div class="schedule-box">
                <div class="schedule-date">
                    📅 ${new Date(request.scheduled_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div class="schedule-time">
                    🕐 ${request.scheduled_time}
                </div>
            </div>

            ${request.meeting_link ? `
            <div class="meeting-link">
                <p style="margin: 0;"><strong>🔗 Enlace a la reunión:</strong></p>
                <p style="margin: 10px 0 0;"><a href="${request.meeting_link}">${request.meeting_link}</a></p>
            </div>
            ` : ''}

            <div class="topic-box">
                <p style="margin: 0;"><strong>📋 Tema de la consultoría:</strong></p>
                <p style="margin: 10px 0 0;">${request.topic}</p>
            </div>

            <div class="tips-box">
                <h3 style="margin-top: 0; color: #92400e;">💡 Para aprovechar al máximo tu consultoría:</h3>
                <ul style="margin-bottom: 0; padding-left: 20px;">
                    <li>Ten a mano las preguntas específicas que quieras resolver</li>
                    <li>Prepara ejemplos o datos relevantes de tu negocio</li>
                    <li>Asegúrate de tener buena conexión a internet</li>
                    <li>Busca un lugar tranquilo sin interrupciones</li>
                </ul>
            </div>

            <p><strong>¿Necesitas cambiar la fecha?</strong></p>
            <p>Contacta con nosotros al menos 24 horas antes de la consultoría programada para reprogramar.</p>

            <p style="text-align: center;">
                <a href="mailto:soporte@stickywork.com" class="button">
                    Contactar Soporte
                </a>
            </p>

            <p style="margin-top: 30px;">¡Nos vemos pronto!</p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong> - Consultoría Premium</p>
            <p style="margin-top: 10px;">
                Este email es una confirmación automática de tu consultoría agendada.
            </p>
        </div>
    </div>
</body>
</html>
        `
    }),

    // Subscription canceled confirmation
    subscriptionCanceled: (business, user, endDate) => ({
        subject: `😢 Tu suscripción ha sido cancelada - StickyWork`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6b7280, #4b5563); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .info-box { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .highlight-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #3b82f6, #ef4444); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .icon { font-size: 50px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">😢</div>
            <h1>Suscripción Cancelada</h1>
        </div>

        <div class="content">
            <p>Hola <strong>${user.full_name || business.name}</strong>,</p>

            <p>Confirmamos que tu suscripción a StickyWork ha sido cancelada.</p>

            <div class="info-box">
                <h3 style="margin-top: 0;">📋 Información importante:</h3>
                <ul style="margin-bottom: 0;">
                    <li>Tu cuenta pasará al <strong>Plan Gratuito</strong> el <strong>${new Date(endDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></li>
                    <li>Mantendrás acceso a tus datos y configuración</li>
                    <li>El plan gratuito incluye hasta 30 reservas al mes</li>
                    <li>Puedes volver a suscribirte en cualquier momento</li>
                </ul>
            </div>

            <div class="highlight-box">
                <h3 style="margin-top: 0;">💡 ¿Sabías que...?</h3>
                <p style="margin-bottom: 0;">Si cancelas por precio, escríbenos. Tenemos opciones para negocios con propósito social y descuentos especiales. Queremos que StickyWork sea accesible para todos.</p>
            </div>

            <p><strong>¿Qué pasa ahora?</strong></p>
            <ul>
                <li>Hasta la fecha de fin, mantienes todas las funcionalidades de tu plan actual</li>
                <li>Después, tu cuenta pasa automáticamente al plan gratuito</li>
                <li>Tus datos nunca se eliminan</li>
            </ul>

            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://stickywork.com'}/admin-dashboard.html#billing" class="button">
                    Reactivar Suscripción
                </a>
            </p>

            <p style="margin-top: 30px;">Lamentamos verte marchar. Si hay algo que podamos mejorar, nos encantaría saberlo.</p>
            <p>📧 <a href="mailto:feedback@stickywork.com">feedback@stickywork.com</a></p>
        </div>

        <div class="footer">
            <p><strong>StickyWork</strong></p>
            <p style="margin-top: 10px;">
                Gracias por haber confiado en nosotros. ¡Siempre serás bienvenido de vuelta!
            </p>
        </div>
    </div>
</body>
</html>
        `
    })
};

// Send email function
async function sendEmail(to, template, data) {
    // Preferir Brevo API HTTP si está configurada
    if (useBrevoAPI) {
        return await sendEmailViaBrevoAPI(to, template.subject, template.html);
    }

    // Fallback a SMTP
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

// Send password reset email
async function sendPasswordResetEmail(user, resetToken, resetUrl) {
    const template = emailTemplates.passwordReset(user, resetToken, resetUrl);
    return await sendEmail(user.email, template);
}

// Send team member welcome email
async function sendTeamMemberWelcome(user, business, temporaryPassword) {
    const template = emailTemplates.teamMemberWelcome(user, business, temporaryPassword);
    return await sendEmail(user.email, template);
}

// Send role changed notification email
async function sendRoleChangedEmail(user, business, newRole, changedBy) {
    const template = emailTemplates.teamMemberRoleChanged(user, business, newRole, changedBy);
    return await sendEmail(user.email, template);
}

// Send deactivation notification email
async function sendDeactivationEmail(user, business, reason) {
    const template = emailTemplates.teamMemberDeactivated(user, business, reason);
    return await sendEmail(user.email, template);
}

// ========== SUBSCRIPTION EMAIL FUNCTIONS ==========

// Send subscription welcome email
async function sendSubscriptionWelcome(business, plan, user) {
    const template = emailTemplates.subscriptionWelcome(business, plan, user);
    return await sendEmail(user.email, template);
}

// Send trial ending reminder
async function sendTrialEndingEmail(business, user, daysLeft, trialEndDate) {
    const template = emailTemplates.trialEnding(business, user, daysLeft, trialEndDate);
    return await sendEmail(user.email, template);
}

// Send payment failed notification
async function sendPaymentFailedEmail(business, user, invoice, nextRetryDate) {
    const template = emailTemplates.paymentFailed(business, user, invoice, nextRetryDate);
    return await sendEmail(user.email, template);
}

// Send subscription canceled confirmation
async function sendSubscriptionCanceledEmail(business, user, endDate) {
    const template = emailTemplates.subscriptionCanceled(business, user, endDate);
    return await sendEmail(user.email, template);
}

// ========== CONSULTANCY EMAIL FUNCTIONS ==========

// Send new consultancy request notification to admin
async function sendConsultancyRequestToAdmin(request, business, user, adminEmail) {
    const template = emailTemplates.consultancyRequestAdmin(request, business, user);
    const recipient = adminEmail || process.env.ADMIN_EMAIL || 'soporte@stickywork.com';
    return await sendEmail(recipient, template);
}

// Send consultancy scheduled confirmation to client
async function sendConsultancyScheduledEmail(request, business, user) {
    const template = emailTemplates.consultancyScheduled(request, business, user);
    return await sendEmail(user.email, template);
}

// Get transporter (for jobs that need direct access)
function getTransporter() {
    return transporter;
}

module.exports = {
    verifyEmailService,
    sendBookingConfirmation,
    sendBookingReminder,
    sendAdminNotification,
    sendPasswordResetEmail,
    sendTeamMemberWelcome,
    sendRoleChangedEmail,
    sendDeactivationEmail,
    // Subscription emails
    sendSubscriptionWelcome,
    sendTrialEndingEmail,
    sendPaymentFailedEmail,
    sendSubscriptionCanceledEmail,
    // Consultancy emails
    sendConsultancyRequestToAdmin,
    sendConsultancyScheduledEmail,
    sendEmail,
    emailTemplates,
    getTransporter
};
