// Script para ejecutar setup en la BD de producción (Railway)
const mysql = require('mysql2/promise');

const MYSQL_URL = 'mysql://root:KisshtRHbXmrJeKLOzOIZGZDlmcpLzJQ@switchback.proxy.rlwy.net:26447/railway';

async function setupProduction() {
    console.log('🚀 Conectando a MySQL de Railway...\n');

    let connection;
    try {
        connection = await mysql.createConnection(MYSQL_URL);
        console.log('✓ Conectado a Railway MySQL');

        // Crear tabla business_types
        await connection.query(`
            CREATE TABLE IF NOT EXISTS business_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type_key VARCHAR(50) NOT NULL UNIQUE,
                type_name VARCHAR(100) NOT NULL,
                icon VARCHAR(10),
                description TEXT,
                booking_mode ENUM('services', 'tables', 'classes', 'simple') DEFAULT 'services',
                required_fields JSON,
                default_services JSON,
                widget_config JSON,
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla business_types creada');

        // Insertar tipos de negocio
        await connection.query(`
            INSERT IGNORE INTO business_types (type_key, type_name, icon, description, booking_mode, display_order) VALUES
            ('salon', 'Peluquería / Salón de Belleza', '💇', 'Cortes, tintes, tratamientos capilares', 'services', 1),
            ('clinic', 'Clínica / Consultorio', '🏥', 'Consultas médicas, especialistas', 'services', 2),
            ('restaurant', 'Restaurante / Bar', '🍽️', 'Reservas de mesas para grupos', 'tables', 3),
            ('nutrition', 'Centro de Nutrición', '🥗', 'Consultas nutricionales y seguimiento', 'services', 4),
            ('gym', 'Gimnasio / Centro Deportivo', '💪', 'Clases grupales y entrenamientos', 'classes', 5),
            ('spa', 'Spa / Centro de Bienestar', '🧖', 'Masajes, tratamientos de relax', 'services', 6),
            ('lawyer', 'Despacho de Abogados', '⚖️', 'Consultas legales y asesoría', 'services', 7),
            ('other', 'Otro tipo de negocio', '🎯', 'Configura según tus necesidades', 'simple', 8)
        `);
        console.log('✓ Tipos de negocio insertados');

        // Crear tabla professionals
        await connection.query(`
            CREATE TABLE IF NOT EXISTS professionals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                specialization VARCHAR(255),
                avatar_url VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_business_id (business_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla professionals creada');

        // Añadir columnas a businesses si no existen
        const columnsToAdd = [
            ['slug', 'VARCHAR(100)'],
            ['type_key', 'VARCHAR(50)'],
            ['subscription_status', "VARCHAR(20) DEFAULT 'trial'"],
            ['trial_ends_at', 'DATETIME'],
            ['onboarding_completed', 'BOOLEAN DEFAULT FALSE'],
            ['booking_settings', 'JSON']
        ];

        for (const [col, type] of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE businesses ADD COLUMN ${col} ${type}`);
                console.log(`✓ Columna ${col} añadida a businesses`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  - Columna ${col} ya existe`);
                }
            }
        }

        console.log('\n✅ Setup de producción completado!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupProduction();
