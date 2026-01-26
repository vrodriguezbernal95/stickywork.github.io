/**
 * Script para ejecutar la migración de talleres
 * Ejecutar: node run-workshops-migration.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Iniciando migración de talleres...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    try {
        // Leer el archivo de migración
        const migrationPath = path.join(__dirname, 'backend', 'migrations', '013_workshops.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Ejecutando migración...\n');

        // Ejecutar la migración
        await connection.query(migrationSQL);

        console.log('✅ Tablas creadas correctamente:\n');
        console.log('   - workshops');
        console.log('   - workshop_bookings');
        console.log('   - workshops_with_availability (vista)');

        // Verificar que las tablas existen
        const [tables] = await connection.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = ? AND table_name LIKE 'workshop%'
        `, [process.env.DB_NAME]);

        console.log('\n📋 Tablas verificadas:');
        tables.forEach(t => console.log(`   - ${t.TABLE_NAME || t.table_name}`));

        console.log('\n✅ Migración completada exitosamente!');

    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️ Las tablas ya existen, no se requiere migración.');
        } else {
            console.error('❌ Error en la migración:', error.message);
            throw error;
        }
    } finally {
        await connection.end();
    }
}

runMigration().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
