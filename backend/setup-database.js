const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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

        // Crear tabla de tipos de negocio (plantillas)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS business_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type_key VARCHAR(50) NOT NULL UNIQUE,
                type_name VARCHAR(100) NOT NULL,
                icon VARCHAR(10),
                description TEXT,
                booking_mode ENUM('services', 'tables', 'classes', 'simple') DEFAULT 'services',
                required_fields JSON COMMENT 'Campos requeridos en el widget',
                default_services JSON COMMENT 'Servicios sugeridos al crear',
                widget_config JSON COMMENT 'Configuración por defecto del widget',
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "business_types" creada/verificada');

        // Insertar tipos de negocio predefinidos
        await connection.query(`
            INSERT IGNORE INTO business_types (type_key, type_name, icon, description, booking_mode, required_fields, default_services, display_order) VALUES
            ('salon', 'Peluquería / Salón de Belleza', '💇', 'Cortes, tintes, tratamientos capilares', 'services',
                '["service", "professional", "date", "time", "customer_name", "customer_phone", "customer_email"]',
                '[{"name": "Corte de cabello", "duration": 30, "price": 15}, {"name": "Tinte completo", "duration": 120, "price": 50}, {"name": "Peinado", "duration": 45, "price": 25}]', 1),
            ('clinic', 'Clínica / Consultorio', '🏥', 'Consultas médicas, especialistas', 'services',
                '["service", "professional", "date", "time", "customer_name", "customer_phone", "customer_email", "notes"]',
                '[{"name": "Consulta general", "duration": 30, "price": 50}, {"name": "Revisión", "duration": 20, "price": 30}]', 2),
            ('restaurant', 'Restaurante / Bar', '🍽️', 'Reservas de mesas para grupos', 'tables',
                '["num_people", "zone", "date", "time", "customer_name", "customer_phone", "customer_email"]',
                '[{"name": "Mesa interior", "capacity": 6}, {"name": "Mesa terraza", "capacity": 4}, {"name": "Reservado privado", "capacity": 12}]', 3),
            ('nutrition', 'Centro de Nutrición', '🥗', 'Consultas nutricionales y seguimiento', 'services',
                '["service", "professional", "date", "time", "customer_name", "customer_phone", "customer_email", "notes"]',
                '[{"name": "Primera consulta", "duration": 60, "price": 60}, {"name": "Seguimiento", "duration": 30, "price": 35}]', 4),
            ('gym', 'Gimnasio / Centro Deportivo', '💪', 'Clases grupales y entrenamientos', 'classes',
                '["class", "date", "time", "customer_name", "customer_phone", "customer_email"]',
                '[{"name": "Spinning", "duration": 45, "capacity": 20}, {"name": "Yoga", "duration": 60, "capacity": 15}, {"name": "CrossFit", "duration": 60, "capacity": 12}]', 5),
            ('spa', 'Spa / Centro de Bienestar', '🧖', 'Masajes, tratamientos de relax', 'services',
                '["service", "professional", "date", "time", "customer_name", "customer_phone", "customer_email"]',
                '[{"name": "Masaje relajante", "duration": 60, "price": 45}, {"name": "Tratamiento facial", "duration": 45, "price": 40}]', 6),
            ('lawyer', 'Despacho de Abogados', '⚖️', 'Consultas legales y asesoría', 'services',
                '["service", "professional", "date", "time", "customer_name", "customer_phone", "customer_email", "notes"]',
                '[{"name": "Consulta inicial", "duration": 60, "price": 80}, {"name": "Asesoría legal", "duration": 45, "price": 60}]', 7),
            ('other', 'Otro tipo de negocio', '🎯', 'Configura según tus necesidades', 'simple',
                '["service", "date", "time", "customer_name", "customer_phone", "customer_email"]',
                '[{"name": "Cita estándar", "duration": 30, "price": 0}]', 99)
        `);
        console.log('✓ Tipos de negocio predefinidos insertados');

        // Crear tabla de negocios (mejorada)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE COMMENT 'URL amigable del negocio',
                type_key VARCHAR(50) NOT NULL DEFAULT 'other',
                type VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                phone VARCHAR(50),
                address TEXT,
                website VARCHAR(255),
                logo_url VARCHAR(500),
                description TEXT,
                subscription_status ENUM('trial', 'active', 'cancelled', 'expired') DEFAULT 'trial',
                trial_ends_at TIMESTAMP NULL,
                onboarding_completed BOOLEAN DEFAULT FALSE,
                widget_settings JSON,
                booking_settings JSON COMMENT 'Configuración de reservas: horarios, anticipación, etc.',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_slug (slug),
                INDEX idx_type (type_key),
                INDEX idx_subscription (subscription_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "businesses" creada/verificada');

        // Añadir columnas nuevas a businesses si no existen (para actualizar tablas antiguas)
        const businessColumns = [
            ['slug', 'VARCHAR(255) UNIQUE'],
            ['type_key', "VARCHAR(50) NOT NULL DEFAULT 'other'"],
            ['website', 'VARCHAR(255)'],
            ['logo_url', 'VARCHAR(500)'],
            ['description', 'TEXT'],
            ['subscription_status', "ENUM('trial', 'active', 'cancelled', 'expired') DEFAULT 'trial'"],
            ['trial_ends_at', 'TIMESTAMP NULL'],
            ['onboarding_completed', 'BOOLEAN DEFAULT FALSE'],
            ['widget_settings', 'JSON'],
            ['booking_settings', 'JSON']
        ];

        for (const [col, type] of businessColumns) {
            try {
                await connection.query(`ALTER TABLE businesses ADD COLUMN ${col} ${type}`);
                console.log(`  ✓ Columna "${col}" añadida a businesses`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    // Columna ya existe, ok
                } else {
                    console.log(`  ⚠ Error añadiendo columna ${col}:`, e.message);
                }
            }
        }

        // Crear tabla de servicios (mejorada)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                duration INT NOT NULL DEFAULT 30 COMMENT 'Duración en minutos',
                price DECIMAL(10,2) DEFAULT 0,
                capacity INT DEFAULT 1 COMMENT 'Capacidad (para clases/mesas)',
                category VARCHAR(100) COMMENT 'Categoría del servicio',
                color VARCHAR(7) DEFAULT '#3b82f6' COMMENT 'Color para el calendario',
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                INDEX idx_business (business_id),
                INDEX idx_active (is_active),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "services" creada/verificada');

        // Añadir columnas nuevas a services si no existen
        const serviceColumns = [
            ['capacity', 'INT DEFAULT 1'],
            ['category', 'VARCHAR(100)'],
            ['color', "VARCHAR(7) DEFAULT '#3b82f6'"],
            ['display_order', 'INT DEFAULT 0']
        ];

        for (const [col, type] of serviceColumns) {
            try {
                await connection.query(`ALTER TABLE services ADD COLUMN ${col} ${type}`);
                console.log(`  ✓ Columna "${col}" añadida a services`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    // Columna ya existe, ok
                } else {
                    console.log(`  ⚠ Error añadiendo columna ${col}:`, e.message);
                }
            }
        }

        // Crear tabla de profesionales/empleados
        await connection.query(`
            CREATE TABLE IF NOT EXISTS professionals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                role VARCHAR(100) COMMENT 'estilista, doctor, instructor, etc.',
                avatar_url VARCHAR(500),
                bio TEXT,
                services JSON COMMENT 'IDs de servicios que puede realizar',
                schedule JSON COMMENT 'Horario de disponibilidad',
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                INDEX idx_business (business_id),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "professionals" creada/verificada');

        // Crear tabla de reservas (mejorada)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                service_id INT,
                professional_id INT COMMENT 'Profesional asignado',
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                duration INT COMMENT 'Duración en minutos (calculada del servicio)',
                num_people INT DEFAULT 1 COMMENT 'Número de personas (para restaurantes)',
                zone VARCHAR(100) COMMENT 'Zona/mesa preferida',
                notes TEXT,
                custom_fields JSON COMMENT 'Campos adicionales personalizados',
                status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
                reminder_sent BOOLEAN DEFAULT FALSE,
                source VARCHAR(50) DEFAULT 'widget' COMMENT 'widget, manual, phone, etc.',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
                FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL,
                INDEX idx_business (business_id),
                INDEX idx_professional (professional_id),
                INDEX idx_date (booking_date),
                INDEX idx_status (status),
                INDEX idx_email (customer_email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "bookings" creada/verificada');

        // Añadir columnas nuevas a bookings si no existen
        const bookingColumns = [
            ['professional_id', 'INT'],
            ['num_people', 'INT DEFAULT 1'],
            ['zone', 'VARCHAR(100)'],
            ['custom_fields', 'JSON']
        ];

        for (const [col, type] of bookingColumns) {
            try {
                await connection.query(`ALTER TABLE bookings ADD COLUMN ${col} ${type}`);
                console.log(`  ✓ Columna "${col}" añadida a bookings`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    // Columna ya existe, ok
                } else {
                    console.log(`  ⚠ Error añadiendo columna ${col}:`, e.message);
                }
            }
        }

        // Crear tabla de administradores
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_id INT NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) DEFAULT NULL,
                role ENUM('owner', 'admin', 'staff') DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                INDEX idx_email (email),
                INDEX idx_business (business_id),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "admin_users" creada/verificada');

        // Crear tabla de mensajes de contacto
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                business_name VARCHAR(255),
                business_type VARCHAR(100),
                interest VARCHAR(100),
                message TEXT NOT NULL,
                status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_email (email),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Tabla "contact_messages" creada/verificada');

        // Insertar negocio de ejemplo
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 14); // 14 días de prueba

        const [businessResult] = await connection.query(`
            INSERT INTO businesses (name, slug, type_key, type, email, phone, address, subscription_status, trial_ends_at, onboarding_completed, widget_settings, booking_settings)
            SELECT * FROM (SELECT
                'Peluquería Demo' as name,
                'peluqueria-demo' as slug,
                'salon' as type_key,
                'Peluquería / Salón de Belleza' as type,
                'demo@stickywork.com' as email,
                '+34 900 000 000' as phone,
                'Calle Principal 123, Madrid' as address,
                'trial' as subscription_status,
                ? as trial_ends_at,
                TRUE as onboarding_completed,
                '{"primaryColor": "#3b82f6", "language": "es", "showPrices": true, "showDuration": true}' as widget_settings,
                '{"workDays": [1,2,3,4,5,6], "workHoursStart": "09:00", "workHoursEnd": "20:00", "slotDuration": 30, "minAdvanceHours": 2, "maxAdvanceDays": 30}' as booking_settings
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM businesses WHERE email = 'demo@stickywork.com'
            ) LIMIT 1
        `, [trialEnds]);

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

        // Insertar profesional de ejemplo
        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, services, schedule)
            SELECT * FROM (SELECT
                ? as business_id,
                'María García' as name,
                'maria@demo.com' as email,
                'Estilista Senior' as role,
                '[]' as services,
                '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "10:00", "end": "14:00"}}' as schedule
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM professionals WHERE business_id = ? AND email = 'maria@demo.com'
            ) LIMIT 1
        `, [businessId, businessId]);
        console.log('✓ Profesional de ejemplo creado/verificado');

        // Crear usuario administrador demo
        const demoPassword = 'admin123';
        const passwordHash = await bcrypt.hash(demoPassword, 10);

        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role)
            SELECT * FROM (SELECT
                ? as business_id,
                'admin@demo.com' as email,
                ? as password_hash,
                'Administrador Demo' as full_name,
                'owner' as role
            ) AS tmp
            WHERE NOT EXISTS (
                SELECT id FROM admin_users WHERE email = 'admin@demo.com'
            ) LIMIT 1
        `, [businessId, passwordHash]);

        console.log('✓ Usuario administrador demo creado/verificado');
        console.log('  📧 Email: admin@demo.com');
        console.log('  🔑 Password: admin123');

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
