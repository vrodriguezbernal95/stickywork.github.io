const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🚀 Iniciando configuración de base de datos...\n');

    let connection;

    try {
        // Conectar a MySQL sin especificar base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✓ Conectado a MySQL');

        // Crear base de datos si no existe
        const dbName = process.env.DB_NAME || 'stickywork';
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✓ Base de datos '${dbName}' creada/verificada`);

        // Usar la base de datos
        await connection.query(`USE ${dbName}`);

        // Crear tabla de negocios
        await connection.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                widget_settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "businesses" creada/verificada');

        // Crear tabla de servicios
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                duration INT NOT NULL COMMENT 'Duración en minutos',
                price DECIMAL(10,2),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                INDEX idx_business (business_id),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "services" creada/verificada');

        // Crear tabla de reservas
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                service_id INT,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                notes TEXT,
                status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
                INDEX idx_business (business_id),
                INDEX idx_date (booking_date),
                INDEX idx_status (status),
                INDEX idx_email (customer_email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "bookings" creada/verificada');

        // Insertar negocio de ejemplo
        const [businessResult] = await connection.query(`
            INSERT INTO businesses (name, type, email, phone, address, widget_settings)
            SELECT * FROM (SELECT
                'Peluquería Demo' as name,
                'Peluquería' as type,
                'demo@stickywork.com' as email,
                '+34 900 000 000' as phone,
                'Calle Principal 123, Madrid' as address,
                '{"primaryColor": "#3b82f6", "language": "es"}' as widget_settings
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM businesses WHERE email = 'demo@stickywork.com'
            ) LIMIT 1
        `);

        // Obtener ID del negocio demo
        const [businesses] = await connection.query(
            'SELECT id FROM businesses WHERE email = ? LIMIT 1',
            ['demo@stickywork.com']
        );
        const businessId = businesses[0].id;

        console.log(`✓ Negocio demo creado/verificado (ID: ${businessId})`);

        // Insertar servicios de ejemplo
        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price)
            SELECT * FROM (SELECT
                ? as business_id,
                'Corte de Cabello' as name,
                'Corte profesional con lavado incluido' as description,
                30 as duration,
                20.00 as price
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM services WHERE business_id = ? AND name = 'Corte de Cabello'
            ) LIMIT 1
        `, [businessId, businessId]);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price)
            SELECT * FROM (SELECT
                ? as business_id,
                'Tinte Completo' as name,
                'Tinte profesional con tratamiento' as description,
                90 as duration,
                50.00 as price
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM services WHERE business_id = ? AND name = 'Tinte Completo'
            ) LIMIT 1
        `, [businessId, businessId]);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price)
            SELECT * FROM (SELECT
                ? as business_id,
                'Peinado Especial' as name,
                'Peinado para eventos' as description,
                45 as duration,
                35.00 as price
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM services WHERE business_id = ? AND name = 'Peinado Especial'
            ) LIMIT 1
        `, [businessId, businessId]);

        console.log('✓ Servicios de ejemplo creados/verificados');

        console.log('\n✅ ¡Base de datos configurada exitosamente!');
        console.log('\nPuedes iniciar el servidor con: npm start');

    } catch (error) {
        console.error('\n✗ Error durante la configuración:', error.message);
        console.error('\nDetalles:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar setup
setupDatabase();
