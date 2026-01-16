const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración: Histórico de Cambios de Plan\n');

    let connection;

    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✅ Conectado a la base de datos');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'add-plan-history.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('\n📝 Ejecutando migración...\n');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✅ Tabla plan_changes creada correctamente');

        // Verificar estructura de tabla
        const [columns] = await connection.query('DESCRIBE plan_changes');
        console.log('\n📋 Estructura de tabla plan_changes:');
        console.log(`   Columnas: ${columns.length}`);

        console.log('\n✅ Migración completada exitosamente!\n');

    } catch (error) {
        console.error('\n❌ Error durante la migración:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

runMigration();
