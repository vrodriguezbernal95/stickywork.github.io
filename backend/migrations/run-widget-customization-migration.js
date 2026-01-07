const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración de Widget Customization...\n');

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
        // 1. Verificar y añadir columna widget_customization
        // =====================================================
        console.log('📊 Actualizando tabla "businesses"...');

        // Verificar si la columna ya existe
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'businesses'
            AND COLUMN_NAME = 'widget_customization'
        `, [process.env.DB_NAME || 'stickywork']);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE businesses
                ADD COLUMN widget_customization JSON DEFAULT NULL
                COMMENT 'Personalización visual del widget (colores, fuentes, estilos)'
            `);
            console.log('  ✓ Columna "widget_customization" añadida');
        } else {
            console.log('  ⊘ Columna "widget_customization" ya existe');
        }

        console.log('\n✅ Migración completada exitosamente\n');

        // Mostrar valores por defecto de ejemplo
        console.log('📝 Estructura de widget_customization:');
        console.log(JSON.stringify({
            primaryColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            fontFamily: 'system-ui',
            borderRadius: '12px',
            buttonStyle: 'solid',
            darkMode: false
        }, null, 2));

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n👋 Conexión cerrada');
        }
    }
}

// Ejecutar migración
runMigration();
