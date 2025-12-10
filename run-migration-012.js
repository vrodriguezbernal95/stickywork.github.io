const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
    console.log('📨 Ejecutando migración 012: Bookings Feedback Flags...\n');

    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stickywork',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✓ Conectado a MySQL');

        // Leer el archivo SQL
        const sql = fs.readFileSync('./backend/migrations/012_bookings_feedback_flags.sql', 'utf8');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✓ Migración 012 ejecutada exitosamente');
        console.log('✓ Columnas de feedback agregadas a bookings\n');

        // Verificar las columnas
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM bookings LIKE 'feedback%'"
        );

        console.log('📋 Nuevas columnas agregadas:');
        console.table(columns);

    } catch (error) {
        console.error('❌ Error al ejecutar migración:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
