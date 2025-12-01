const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
    console.log('🔐 Ejecutando migración 010: Two-Factor Authentication...\n');

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
        const sql = fs.readFileSync('./backend/migrations/010_two_factor_auth.sql', 'utf8');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✓ Migración 010 ejecutada exitosamente');
        console.log('✓ Columnas de 2FA agregadas a admin_users\n');

        // Verificar las columnas
        const [columns] = await connection.query(
            "SHOW COLUMNS FROM admin_users LIKE 'two_factor%'"
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
