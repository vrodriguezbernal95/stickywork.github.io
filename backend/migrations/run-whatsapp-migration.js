const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración de WhatsApp...\n');

    let connection;

    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stickywork',
            port: process.env.DB_PORT || 3306
        });

        console.log('✓ Conectado a la base de datos\n');

        // =====================================================
        // 1. Verificar y añadir columnas a tabla businesses
        // =====================================================
        console.log('📊 Actualizando tabla "businesses"...');

        // Verificar si las columnas ya existen
        const [businessColumns] = await connection.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'businesses'
            AND COLUMN_NAME IN ('whatsapp_number', 'whatsapp_enabled', 'whatsapp_template')
        `, [process.env.DB_NAME || 'stickywork']);

        const existingBusinessColumns = businessColumns.map(row => row.COLUMN_NAME);

        if (!existingBusinessColumns.includes('whatsapp_number')) {
            await connection.query(`
                ALTER TABLE businesses
                ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL COMMENT 'Número de WhatsApp del negocio (formato internacional sin +)'
            `);
            console.log('  ✓ Columna "whatsapp_number" añadida');
        } else {
            console.log('  ⊘ Columna "whatsapp_number" ya existe');
        }

        if (!existingBusinessColumns.includes('whatsapp_enabled')) {
            await connection.query(`
                ALTER TABLE businesses
                ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT FALSE COMMENT 'Indica si las notificaciones por WhatsApp están activadas'
            `);
            console.log('  ✓ Columna "whatsapp_enabled" añadida');
        } else {
            console.log('  ⊘ Columna "whatsapp_enabled" ya existe');
        }

        if (!existingBusinessColumns.includes('whatsapp_template')) {
            await connection.query(`
                ALTER TABLE businesses
                ADD COLUMN whatsapp_template TEXT DEFAULT NULL COMMENT 'Plantilla personalizada del mensaje de WhatsApp'
            `);
            console.log('  ✓ Columna "whatsapp_template" añadida');
        } else {
            console.log('  ⊘ Columna "whatsapp_template" ya existe');
        }

        // Actualizar plantilla por defecto para negocios que no tengan una
        const defaultTemplate = `¡Hola {nombre}! ✅

Tu reserva en {negocio} ha sido confirmada:

📅 Fecha: {fecha}
🕐 Hora: {hora}
🛠️ Servicio: {servicio}

¡Te esperamos!

{nombre_negocio}`;

        const [updateResult] = await connection.query(`
            UPDATE businesses
            SET whatsapp_template = ?
            WHERE whatsapp_template IS NULL
        `, [defaultTemplate]);

        console.log(`  ✓ Plantilla por defecto aplicada a ${updateResult.affectedRows} negocio(s)\n`);

        // =====================================================
        // 2. Verificar y añadir columna a tabla bookings
        // =====================================================
        console.log('📊 Actualizando tabla "bookings"...');

        const [bookingColumns] = await connection.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'
            AND COLUMN_NAME = 'whatsapp_consent'
        `, [process.env.DB_NAME || 'stickywork']);

        if (bookingColumns.length === 0) {
            await connection.query(`
                ALTER TABLE bookings
                ADD COLUMN whatsapp_consent BOOLEAN DEFAULT FALSE COMMENT 'Indica si el cliente dio consentimiento para recibir notificaciones por WhatsApp'
            `);
            console.log('  ✓ Columna "whatsapp_consent" añadida\n');
        } else {
            console.log('  ⊘ Columna "whatsapp_consent" ya existe\n');
        }

        // =====================================================
        // 3. Verificación final
        // =====================================================
        console.log('✅ Verificación final...');

        const [finalBusinessCheck] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'businesses'
            AND COLUMN_NAME LIKE 'whatsapp%'
            ORDER BY COLUMN_NAME
        `, [process.env.DB_NAME || 'stickywork']);

        console.log('\nColumnas en tabla "businesses":');
        finalBusinessCheck.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });

        const [finalBookingCheck] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'
            AND COLUMN_NAME = 'whatsapp_consent'
        `, [process.env.DB_NAME || 'stickywork']);

        console.log('\nColumnas en tabla "bookings":');
        finalBookingCheck.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });

        console.log('\n🎉 ¡Migración completada exitosamente!');
        console.log('\n✅ Próximos pasos:');
        console.log('  1. Implementar endpoints del backend (Fase 2)');
        console.log('  2. Actualizar el widget (Fase 3)');
        console.log('  3. Actualizar el dashboard (Fase 5 y 6)\n');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ Conexión cerrada');
        }
    }
}

// Ejecutar migración
runMigration();
