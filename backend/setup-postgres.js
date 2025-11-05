const bcrypt = require('bcrypt');
const db = require('../config/database');

async function setupPostgres() {
    const results = [];

    try {
        results.push('🚀 Iniciando configuración de base de datos PostgreSQL...');

        // Crear tabla de negocios
        await db.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                widget_settings JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        results.push('✓ Tabla "businesses" creada');

        // Crear índice en businesses
        await db.query(`CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email)`);

        // Crear tabla de servicios
        await db.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                business_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                duration INT NOT NULL,
                price DECIMAL(10,2),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
            )
        `);
        results.push('✓ Tabla "services" creada');

        // Crear índices en services
        await db.query(`CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active)`);

        // Crear tabla de reservas
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                business_id INT NOT NULL,
                service_id INT,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                notes TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
            )
        `);
        results.push('✓ Tabla "bookings" creada');

        // Crear índices en bookings
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);

        // Crear tabla de administradores
        await db.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                business_id INT NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
            )
        `);
        results.push('✓ Tabla "admin_users" creada');

        // Crear índices en admin_users
        await db.query(`CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_admin_users_business ON admin_users(business_id)`);

        // Crear tabla de mensajes de contacto
        await db.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                business_name VARCHAR(255),
                business_type VARCHAR(100),
                interest VARCHAR(100),
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        results.push('✓ Tabla "contact_messages" creada');

        // Crear índices en contact_messages
        await db.query(`CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email)`);

        // Verificar si ya existe el negocio demo
        const existingBusiness = await db.query(
            'SELECT id FROM businesses WHERE email = $1 LIMIT 1',
            ['demo@stickywork.com']
        );

        let businessId;
        if (existingBusiness.length === 0) {
            // Insertar negocio de ejemplo
            const businessResult = await db.query(`
                INSERT INTO businesses (name, type, email, phone, address, widget_settings)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [
                'Peluquería Demo',
                'Peluquería',
                'demo@stickywork.com',
                '+34 900 000 000',
                'Calle Principal 123, Madrid',
                JSON.stringify({"primaryColor": "#3b82f6", "language": "es"})
            ]);
            businessId = businessResult[0].id;
            results.push(`✓ Negocio demo creado (ID: ${businessId})`);
        } else {
            businessId = existingBusiness[0].id;
            results.push(`✓ Negocio demo ya existía (ID: ${businessId})`);
        }

        // Insertar servicios de ejemplo (si no existen)
        const existingServices = await db.query(
            'SELECT COUNT(*) as count FROM services WHERE business_id = $1',
            [businessId]
        );

        if (parseInt(existingServices[0].count) === 0) {
            await db.query(`
                INSERT INTO services (business_id, name, description, duration, price)
                VALUES
                    ($1, 'Corte de Cabello', 'Corte profesional con lavado incluido', 30, 20.00),
                    ($1, 'Tinte Completo', 'Tinte profesional con tratamiento', 90, 50.00),
                    ($1, 'Peinado Especial', 'Peinado para eventos', 45, 35.00)
            `, [businessId]);
            results.push('✓ Servicios de ejemplo creados');
        } else {
            results.push('✓ Servicios ya existían');
        }

        // Verificar si ya existe el usuario admin
        const existingAdmin = await db.query(
            'SELECT id FROM admin_users WHERE email = $1 LIMIT 1',
            ['admin@demo.com']
        );

        if (existingAdmin.length === 0) {
            // Crear usuario administrador demo
            const demoPassword = 'admin123';
            const passwordHash = await bcrypt.hash(demoPassword, 10);

            await db.query(`
                INSERT INTO admin_users (business_id, email, password_hash, full_name, role)
                VALUES ($1, $2, $3, $4, $5)
            `, [businessId, 'admin@demo.com', passwordHash, 'Administrador Demo', 'owner']);

            results.push('✓ Usuario administrador demo creado');
            results.push('  📧 Email: admin@demo.com');
            results.push('  🔑 Password: admin123');
        } else {
            results.push('✓ Usuario administrador ya existía');
        }

        results.push('');
        results.push('✅ ¡Base de datos configurada exitosamente!');

        return results.join('\n');

    } catch (error) {
        results.push('');
        results.push('✗ Error durante la configuración:');
        results.push(error.message);
        throw new Error(results.join('\n'));
    }
}

module.exports = { setupPostgres };
