const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createDemoBusinesses() {
    console.log('🎨 Creando negocios de demo...\n');

    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'stickywork',
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4'
        });

        console.log('✓ Conectado a MySQL');

        // 1. PELUQUERÍA DEMO
        console.log('\n📍 Creando Peluquería Demo...');

        const [peluqueriaResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'Salón Bella Vista',
                'salon-bella-vista-demo',
                'salon',
                'Peluquería/Salón',
                'contacto@bellавista.demo',
                '+34 912 345 678',
                'Calle Mayor 123, Madrid',
                'https://stickywork.com/demos/peluqueria.html',
                'active',
                DATE_ADD(NOW(), INTERVAL 365 DAY),
                TRUE,
                JSON_OBJECT(
                    'primaryColor', '#E91E63',
                    'secondaryColor', '#9C27B0',
                    'language', 'es',
                    'showPrices', true,
                    'showDuration', true
                ),
                JSON_OBJECT(
                    'workDays', JSON_ARRAY(1, 2, 3, 4, 5, 6),
                    'workHoursStart', '09:00',
                    'workHoursEnd', '20:00',
                    'slotDuration', 30,
                    'minAdvanceHours', 2,
                    'maxAdvanceDays', 30
                ),
                'Salón de belleza profesional especializado en cortes, tintes y tratamientos capilares. Más de 15 años de experiencia.'
            )
        `);

        const peluqueriaId = peluqueriaResult.insertId;
        console.log(`✓ Peluquería creada con ID: ${peluqueriaId}`);

        // Servicios de peluquería
        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Corte de Cabello', 'Corte profesional personalizado', 30, 25.00, 1, TRUE, 'Corte', '#E91E63'),
            (?, 'Tinte Completo', 'Tinte de raíces y puntas con productos de calidad', 120, 65.00, 1, TRUE, 'Color', '#9C27B0'),
            (?, 'Mechas', 'Mechas californianas o balayage', 150, 85.00, 1, TRUE, 'Color', '#FF9800'),
            (?, 'Tratamiento Capilar', 'Hidratación profunda y reparación', 45, 35.00, 1, TRUE, 'Tratamientos', '#4CAF50'),
            (?, 'Peinado para Eventos', 'Recogido o peinado para ocasiones especiales', 60, 45.00, 1, TRUE, 'Peinados', '#2196F3')
        `, [peluqueriaId, peluqueriaId, peluqueriaId, peluqueriaId, peluqueriaId]);

        console.log('✓ Servicios de peluquería creados');

        // Profesionales de peluquería
        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, is_active) VALUES
            (?, 'Ana García', 'ana@bellavista.demo', 'Estilista Senior', TRUE),
            (?, 'Carlos Ruiz', 'carlos@bellavista.demo', 'Colorista Experto', TRUE),
            (?, 'María López', 'maria@bellavista.demo', 'Especialista en Tratamientos', TRUE)
        `, [peluqueriaId, peluqueriaId, peluqueriaId]);

        console.log('✓ Profesionales de peluquería creados');

        // Usuario admin para peluquería
        const passwordHash = await bcrypt.hash('demo123', 10);
        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@bellavista.demo', ?, 'Admin Bella Vista', 'owner', TRUE)
        `, [peluqueriaId, passwordHash]);

        console.log('✓ Usuario admin de peluquería creado (email: admin@bellavista.demo, pass: demo123)');

        // 2. RESTAURANTE DEMO
        console.log('\n🍽️  Creando Restaurante Demo...');

        const [restauranteResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'Restaurante El Buen Sabor',
                'restaurante-buen-sabor-demo',
                'restaurant',
                'Restaurante/Bar',
                'reservas@buensabor.demo',
                '+34 915 678 901',
                'Plaza España 45, Madrid',
                'https://stickywork.com/demos/restaurante.html',
                'active',
                DATE_ADD(NOW(), INTERVAL 365 DAY),
                TRUE,
                JSON_OBJECT(
                    'primaryColor', '#FF5722',
                    'secondaryColor', '#FFC107',
                    'language', 'es',
                    'showPrices', false,
                    'showDuration', false
                ),
                JSON_OBJECT(
                    'workDays', JSON_ARRAY(1, 2, 3, 4, 5, 6, 0),
                    'workHoursStart', '13:00',
                    'workHoursEnd', '23:00',
                    'slotDuration', 60,
                    'minAdvanceHours', 1,
                    'maxAdvanceDays', 14
                ),
                'Restaurante de cocina mediterránea con ambiente acogedor. Especialidad en paellas y pescados frescos.'
            )
        `);

        const restauranteId = restauranteResult.insertId;
        console.log(`✓ Restaurante creado con ID: ${restauranteId}`);

        // Servicios del restaurante (turnos)
        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Almuerzo', 'Reserva para almuerzo (13:00 - 16:00)', 120, 0.00, 50, TRUE, 'Comidas', '#FF5722'),
            (?, 'Cena', 'Reserva para cena (20:00 - 23:00)', 120, 0.00, 50, TRUE, 'Comidas', '#FFC107')
        `, [restauranteId, restauranteId]);

        console.log('✓ Servicios de restaurante creados');

        // Usuario admin para restaurante
        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@buensabor.demo', ?, 'Admin Buen Sabor', 'owner', TRUE)
        `, [restauranteId, passwordHash]);

        console.log('✓ Usuario admin de restaurante creado (email: admin@buensabor.demo, pass: demo123)');

        console.log('\n🎉 ¡Negocios de demo creados exitosamente!');
        console.log(`\n📝 IDs creados:`);
        console.log(`   - Peluquería: ${peluqueriaId}`);
        console.log(`   - Restaurante: ${restauranteId}`);

        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

createDemoBusinesses();
