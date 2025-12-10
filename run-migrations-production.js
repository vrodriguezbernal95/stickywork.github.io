/**
 * Script para ejecutar migraciones de base de datos en producción
 * Ejecutar: node run-migrations-production.js
 */

const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runMigrations() {
    console.log('🔄 Iniciando ejecución de migraciones en producción...\n');

    try {
        // Crear pool de conexiones
        await db.createPool();

        // Verificar conexión
        const isConnected = await db.testConnection();
        if (!isConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }

        console.log('✅ Conectado a la base de datos\n');

        // Migración 011: Crear tabla service_feedback
        console.log('📋 Ejecutando migración 011: service_feedback...');
        const migration011 = fs.readFileSync(
            path.join(__dirname, 'backend/migrations/011_service_feedback.sql'),
            'utf8'
        );

        // Ejecutar cada statement de la migración 011
        const statements011 = migration011
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements011) {
            await db.query(statement);
        }
        console.log('✅ Migración 011 completada\n');

        // Migración 012: Añadir campos feedback a bookings
        console.log('📋 Ejecutando migración 012: bookings feedback flags...');
        const migration012 = fs.readFileSync(
            path.join(__dirname, 'backend/migrations/012_bookings_feedback_flags.sql'),
            'utf8'
        );

        // Ejecutar cada statement de la migración 012
        const statements012 = migration012
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements012) {
            await db.query(statement);
        }
        console.log('✅ Migración 012 completada\n');

        // Verificar que las tablas existen
        console.log('🔍 Verificando tablas creadas...');

        const tables = await db.query("SHOW TABLES LIKE 'service_feedback'");
        if (tables.length > 0) {
            console.log('✅ Tabla service_feedback existe');
        }

        const columns = await db.query("SHOW COLUMNS FROM bookings LIKE 'feedback_token'");
        if (columns.length > 0) {
            console.log('✅ Campo feedback_token añadido a bookings');
        }

        console.log('\n🎉 ¡Todas las migraciones se ejecutaron exitosamente!\n');
        console.log('📊 Sistema de feedback listo para usar\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error ejecutando migraciones:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Ejecutar migraciones
runMigrations();
