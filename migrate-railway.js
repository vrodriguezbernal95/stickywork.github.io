const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrateRailway() {
    console.log('🚀 Conectando a Railway MySQL...\n');

    let connection;

    try {
        // Conectar a Railway
        connection = await mysql.createConnection({
            host: 'switchback.proxy.rlwy.net',
            user: 'root',
            password: process.env.DB_PASSWORD,
            database: 'railway',
            port: 26447,
            multipleStatements: true
        });

        console.log('✅ Conectado a Railway MySQL');
        console.log('📊 Base de datos: railway\n');

        // Leer el archivo SQL
        const sql = fs.readFileSync('./backend/migrations/008_password_reset_tokens.sql', 'utf8');

        console.log('🔄 Ejecutando migración 008...');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✅ Migración ejecutada exitosamente');

        // Verificar que la tabla se creó
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'password_reset_tokens'"
        );

        if (tables.length > 0) {
            console.log('✅ Tabla "password_reset_tokens" creada correctamente');

            // Mostrar estructura de la tabla
            const [columns] = await connection.query(
                "DESCRIBE password_reset_tokens"
            );

            console.log('\n📋 Estructura de la tabla:');
            console.table(columns);
        } else {
            console.log('❌ Error: La tabla no se creó');
        }

        console.log('\n🎉 Migración completada en Railway!');
        console.log('✅ Tu aplicación ya puede usar recuperación de contraseña en producción\n');

    } catch (error) {
        console.error('❌ Error al ejecutar migración:', error.message);
        console.error('\nDetalles:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('👋 Conexión cerrada');
        }
    }
}

migrateRailway();
