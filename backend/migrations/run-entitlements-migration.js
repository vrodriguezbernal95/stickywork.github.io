const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🚀 Iniciando migración: Sistema de Entitlements\n');

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
        const sqlPath = path.join(__dirname, 'add-entitlements.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        console.log('\n📝 Ejecutando migración...\n');

        // Ejecutar la migración
        await connection.query(sql);

        console.log('✅ Columnas plan y plan_limits agregadas a businesses');
        console.log('✅ Tabla usage_tracking creada correctamente');

        // Verificar que todo se creó correctamente
        const [businesses] = await connection.query(
            'SELECT id, name, plan, plan_limits FROM businesses ORDER BY id'
        );

        console.log('\n📊 Planes asignados a negocios:');
        businesses.forEach(b => {
            console.log(`   - ${b.name} (ID: ${b.id}): Plan ${b.plan.toUpperCase()}`);
        });

        // Verificar estructura de tabla usage_tracking
        const [columns] = await connection.query('DESCRIBE usage_tracking');
        console.log('\n📋 Estructura de tabla usage_tracking:');
        console.log(`   Columnas: ${columns.length}`);

        // Mostrar detalle del plan de La Famiglia
        const [lafamiglia] = await connection.query(
            'SELECT name, plan, plan_limits FROM businesses WHERE id = 9'
        );

        if (lafamiglia.length > 0) {
            console.log('\n🎯 Configuración de La Famiglia (testing):');
            console.log(`   Plan: ${lafamiglia[0].plan}`);
            console.log(`   Límites:`, JSON.parse(lafamiglia[0].plan_limits));
        }

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
