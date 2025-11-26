/**
 * Script de prueba para verificar configuración de email con Brevo
 * Ejecutar con: node test-email.js
 */

require('dotenv').config();
const emailService = require('./backend/email-service');

async function testEmailService() {
    console.log('\n🧪 Probando servicio de email con Brevo...\n');

    // Verificar configuración
    console.log('📋 Configuración actual:');
    console.log('  Host:', process.env.EMAIL_HOST);
    console.log('  Port:', process.env.EMAIL_PORT);
    console.log('  User:', process.env.EMAIL_USER);
    console.log('  From:', process.env.EMAIL_FROM);
    console.log('');

    // Verificar conexión
    console.log('🔌 Verificando conexión con Brevo...');
    const isConfigured = await emailService.verifyEmailService();

    if (!isConfigured) {
        console.log('❌ Error: No se pudo conectar con Brevo');
        console.log('Revisa las credenciales en el archivo .env');
        return;
    }

    console.log('✅ Conexión exitosa con Brevo\n');

    // Datos de prueba
    const testBooking = {
        customer_name: 'Victor Rodriguez',
        customer_email: 'v.rodriguezbernal95@gmail.com',
        customer_phone: '+34 600 123 456',
        booking_date: new Date(),
        booking_time: '15:00',
        service_name: 'Corte de Pelo',
        notes: 'Esta es una reserva de prueba'
    };

    const testBusiness = {
        name: 'StickyWork Demo',
        address: 'Calle Principal 123, Madrid',
        phone: '+34 900 123 456',
        email: 'info@stickywork.com'
    };

    // Enviar email de prueba
    console.log('📧 Enviando email de confirmación de prueba...');
    console.log('   Destinatario:', testBooking.customer_email);

    const result = await emailService.sendBookingConfirmation(testBooking, testBusiness);

    if (result.success) {
        console.log('✅ Email enviado exitosamente!');
        console.log('   Message ID:', result.messageId);
        console.log('\n📬 Revisa tu bandeja de entrada en:', testBooking.customer_email);
        console.log('   (puede tardar unos segundos en llegar)');
    } else {
        console.log('❌ Error al enviar email:', result.error);
    }

    console.log('\n✨ Prueba completada\n');
}

// Ejecutar prueba
testEmailService().catch(error => {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
});
