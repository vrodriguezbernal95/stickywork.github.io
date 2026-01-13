const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración: Sistema de Reportes IA\n');

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
        const sqlPath = path.join(__dirname, 'add-ai-reports.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('\n📝 Ejecutando migración...\n');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✅ Columna ai_reports_enabled agregada a businesses');
        console.log('✅ Tabla ai_reports creada correctamente');
        console.log('✅ Reportes IA habilitados para La Famiglia (ID: 9)');
        console.log('✅ Reportes IA habilitados para Buen Sabor (ID: 2)');

        // Verificar que todo se creó correctamente
        const [businesses] = await connection.query(
            'SELECT id, name, ai_reports_enabled FROM businesses WHERE ai_reports_enabled = TRUE'
        );

        console.log('\n📊 Negocios con Reportes IA habilitados:');
        businesses.forEach(b => {
            console.log(`   - ${b.name} (ID: ${b.id})`);
        });

        // Verificar estructura de tabla ai_reports
        const [columns] = await connection.query('DESCRIBE ai_reports');
        console.log('\n📋 Estructura de tabla ai_reports:');
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
