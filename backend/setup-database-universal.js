// Setup universal de base de datos - Funciona con MySQL y PostgreSQL
require('dotenv').config();

const usePostgres = process.env.DATABASE_URL || process.env.USE_POSTGRES === 'true';

async function setupDatabase() {
    console.log('🚀 Iniciando configuración de base de datos...\n');
    console.log(`📦 Usando: ${usePostgres ? 'PostgreSQL' : 'MySQL'}\n`);

    try {
        const db = require('../config/database');

        // Verificar conexión
        const connected = await db.testConnection();
        if (!connected) {
            console.log('⚠️ No se pudo conectar a la BD, saltando setup');
            return;
        }

        if (usePostgres) {
            await setupPostgres(db);
        } else {
            console.log('ℹ️ MySQL: usando setup-database.js estándar');
        }

        console.log('\n✅ Setup completado exitosamente');

    } catch (error) {
        console.error('⚠️ Error en setup (no fatal):', error.message);
        // No lanzar error para que el servidor pueda iniciar
    }
}

async function setupPostgres(db) {
    // Crear tabla business_types
    await db.query(`
        CREATE TABLE IF NOT EXISTS business_types (
            id SERIAL PRIMARY KEY,
            type_key VARCHAR(50) NOT NULL UNIQUE,
            type_name VARCHAR(100) NOT NULL,
            icon VARCHAR(10),
            description TEXT,
            booking_mode VARCHAR(20) DEFAULT 'services',
            required_fields JSONB,
            default_services JSONB,
            widget_config JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ Tabla "business_types" creada/verificada');

    // Insertar tipos de negocio predefinidos
    const businessTypes = [
        ['salon', 'Peluquería / Salón de Belleza', '💇', 'Cortes, tintes, tratamientos capilares', 'services', 1],
        ['clinic', 'Clínica / Consultorio', '🏥', 'Consultas médicas, especialistas', 'services', 2],
        ['restaurant', 'Restaurante / Bar', '🍽️', 'Reservas de mesas para grupos', 'tables', 3],
        ['nutrition', 'Centro de Nutrición', '🥗', 'Consultas nutricionales y seguimiento', 'services', 4],
        ['gym', 'Gimnasio', '💪', 'Clases grupales y entrenamientos', 'classes', 5],
        ['spa', 'Spa / Centro de Bienestar', '🧖', 'Masajes, tratamientos corporales', 'services', 6],
        ['lawyer', 'Despacho de Abogados', '⚖️', 'Consultas y asesoramiento legal', 'services', 7],
        ['other', 'Otro tipo de negocio', '🎯', 'Configúralo a tu medida', 'simple', 8]
    ];

    for (const bt of businessTypes) {
        await db.query(`
            INSERT INTO business_types (type_key, type_name, icon, description, booking_mode, display_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (type_key) DO NOTHING
        `, bt);
    }
    console.log('✓ Tipos de negocio insertados');

    // Crear tabla professionals
    await db.query(`
        CREATE TABLE IF NOT EXISTS professionals (
            id SERIAL PRIMARY KEY,
            business_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            specialization VARCHAR(255),
            avatar_url VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ Tabla "professionals" creada/verificada');

    // Añadir columnas a businesses si no existen
    const businessColumns = [
        ['slug', 'VARCHAR(100) UNIQUE'],
        ['type_key', 'VARCHAR(50)'],
        ['subscription_status', "VARCHAR(20) DEFAULT 'trial'"],
        ['trial_ends_at', 'TIMESTAMP'],
        ['onboarding_completed', 'BOOLEAN DEFAULT FALSE'],
        ['booking_settings', 'JSONB']
    ];

    for (const [col, type] of businessColumns) {
        try {
            await db.query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ${col} ${type}`);
        } catch (e) {
            // Columna puede ya existir
        }
    }
    console.log('✓ Tabla "businesses" actualizada');

    // Añadir columnas a services si no existen
    const serviceColumns = [
        ['capacity', 'INT DEFAULT 1'],
        ['category', 'VARCHAR(100)'],
        ['color', 'VARCHAR(7)'],
        ['display_order', 'INT DEFAULT 0']
    ];

    for (const [col, type] of serviceColumns) {
        try {
            await db.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS ${col} ${type}`);
        } catch (e) {
            // Columna puede ya existir
        }
    }
    console.log('✓ Tabla "services" actualizada');

    // Añadir columnas a bookings si no existen
    const bookingColumns = [
        ['professional_id', 'INT'],
        ['num_people', 'INT'],
        ['zone', 'VARCHAR(100)'],
        ['custom_fields', 'JSONB']
    ];

    for (const [col, type] of bookingColumns) {
        try {
            await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ${col} ${type}`);
        } catch (e) {
            // Columna puede ya existir
        }
    }
    console.log('✓ Tabla "bookings" actualizada');
}

async function setupMySQL(db) {
    // Redirigir al setup MySQL existente
    const mysqlSetup = require('./setup-database');
    // El setup MySQL ya se ejecuta por sí solo
}

// Ejecutar setup y salir correctamente
setupDatabase()
    .then(() => {
        console.log('Setup finalizado, iniciando servidor...');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error en setup:', err.message);
        process.exit(0); // Salir con código 0 para que el servidor inicie
    });

module.exports = { setupDatabase };
