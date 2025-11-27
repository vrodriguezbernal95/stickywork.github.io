const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createRemainingDemos() {
    console.log('🎨 Creando los 5 negocios demo restantes...\n');

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

        // Password hash común para todos los demos
        const passwordHash = await bcrypt.hash('demo123', 10);

        // 1. PSICÓLOGO DEMO
        console.log('\n🧠 Creando Psicólogo Demo...');

        const [psicologoResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'Centro de Psicología Mente Clara',
                'psicologo-mente-clara-demo',
                'clinic',
                'Psicólogo/Terapeuta',
                'contacto@menteclara.demo',
                '+34 913 456 789',
                'Calle Serrano 89, Madrid',
                'https://stickywork.com/demos/psicologo.html',
                'active',
                DATE_ADD(NOW(), INTERVAL 365 DAY),
                TRUE,
                JSON_OBJECT(
                    'primaryColor', '#4A90E2',
                    'secondaryColor', '#7B68EE',
                    'language', 'es',
                    'showPrices', true,
                    'showDuration', true
                ),
                JSON_OBJECT(
                    'workDays', JSON_ARRAY(1, 2, 3, 4, 5),
                    'workHoursStart', '09:00',
                    'workHoursEnd', '20:00',
                    'slotDuration', 60,
                    'minAdvanceHours', 24,
                    'maxAdvanceDays', 30
                ),
                'Centro de psicología especializado en terapia cognitivo-conductual, terapia de pareja y atención infantil.'
            )
        `);

        const psicologoId = psicologoResult.insertId;
        console.log(`✓ Psicólogo creado con ID: ${psicologoId}`);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Primera Consulta', 'Evaluación inicial y diagnóstico', 60, 60.00, 1, TRUE, 'Evaluación', '#4A90E2'),
            (?, 'Terapia Individual', 'Sesión de terapia individual', 50, 50.00, 1, TRUE, 'Terapia', '#7B68EE'),
            (?, 'Terapia de Pareja', 'Sesión de terapia para parejas', 60, 70.00, 1, TRUE, 'Terapia', '#9B59B6'),
            (?, 'Terapia Infantil', 'Sesión especializada para niños y adolescentes', 45, 55.00, 1, TRUE, 'Terapia', '#3498DB'),
            (?, 'Terapia Online', 'Sesión de terapia por videollamada', 50, 45.00, 1, TRUE, 'Online', '#1ABC9C')
        `, [psicologoId, psicologoId, psicologoId, psicologoId, psicologoId]);

        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, is_active) VALUES
            (?, 'Dra. Laura Martínez', 'laura@menteclara.demo', 'Psicóloga General Sanitaria', TRUE),
            (?, 'Dr. Javier Sánchez', 'javier@menteclara.demo', 'Psicólogo Clínico', TRUE)
        `, [psicologoId, psicologoId]);

        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@menteclara.demo', ?, 'Admin Mente Clara', 'owner', TRUE)
        `, [psicologoId, passwordHash]);

        console.log('✓ Servicios, profesionales y admin de psicólogo creados');

        // 2. CENTRO DE NUTRICIÓN DEMO
        console.log('\n🥗 Creando Centro de Nutrición Demo...');

        const [nutricionResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'NutriVida - Centro de Nutrición',
                'nutrivida-demo',
                'nutrition',
                'Centro de Nutrición',
                'info@nutrivida.demo',
                '+34 914 567 890',
                'Avenida América 234, Madrid',
                'https://stickywork.com/demos/nutricion.html',
                'active',
                DATE_ADD(NOW(), INTERVAL 365 DAY),
                TRUE,
                JSON_OBJECT(
                    'primaryColor', '#4CAF50',
                    'secondaryColor', '#8BC34A',
                    'language', 'es',
                    'showPrices', true,
                    'showDuration', true
                ),
                JSON_OBJECT(
                    'workDays', JSON_ARRAY(1, 2, 3, 4, 5),
                    'workHoursStart', '09:00',
                    'workHoursEnd', '19:00',
                    'slotDuration', 45,
                    'minAdvanceHours', 12,
                    'maxAdvanceDays', 60
                ),
                'Centro especializado en nutrición deportiva, pérdida de peso y nutrición clínica personalizada.'
            )
        `);

        const nutricionId = nutricionResult.insertId;
        console.log(`✓ Centro de Nutrición creado con ID: ${nutricionId}`);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Primera Consulta Nutricional', 'Valoración inicial completa con bioimpedancia', 60, 50.00, 1, TRUE, 'Consulta', '#4CAF50'),
            (?, 'Seguimiento Mensual', 'Revisión y ajuste del plan nutricional', 30, 35.00, 1, TRUE, 'Seguimiento', '#8BC34A'),
            (?, 'Nutrición Deportiva', 'Plan personalizado para deportistas', 60, 60.00, 1, TRUE, 'Especialidad', '#2196F3'),
            (?, 'Plan Pérdida de Peso', 'Programa integral de adelgazamiento', 45, 55.00, 1, TRUE, 'Especialidad', '#FF9800'),
            (?, 'Nutrición Infantil', 'Consulta especializada en niños', 45, 50.00, 1, TRUE, 'Especialidad', '#E91E63')
        `, [nutricionId, nutricionId, nutricionId, nutricionId, nutricionId]);

        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, is_active) VALUES
            (?, 'Dra. Carmen Flores', 'carmen@nutrivida.demo', 'Nutricionista Clínica', TRUE),
            (?, 'Dr. Roberto Vega', 'roberto@nutrivida.demo', 'Nutricionista Deportivo', TRUE)
        `, [nutricionId, nutricionId]);

        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@nutrivida.demo', ?, 'Admin NutriVida', 'owner', TRUE)
        `, [nutricionId, passwordHash]);

        console.log('✓ Servicios, profesionales y admin de nutrición creados');

        // 3. GIMNASIO / ENTRENADOR PERSONAL DEMO
        console.log('\n💪 Creando Gimnasio Demo...');

        const [gimnasioResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'PowerFit Gym & Training',
                'powerfit-gym-demo',
                'gym',
                'Gimnasio/Entrenador Personal',
                'reservas@powerfit.demo',
                '+34 915 678 012',
                'Calle Bravo Murillo 456, Madrid',
                'https://stickywork.com/demos/gimnasio.html',
                'active',
                DATE_ADD(NOW(), INTERVAL 365 DAY),
                TRUE,
                JSON_OBJECT(
                    'primaryColor', '#FF5722',
                    'secondaryColor', '#FFC107',
                    'language', 'es',
                    'showPrices', true,
                    'showDuration', true
                ),
                JSON_OBJECT(
                    'workDays', JSON_ARRAY(1, 2, 3, 4, 5, 6),
                    'workHoursStart', '07:00',
                    'workHoursEnd', '22:00',
                    'slotDuration', 60,
                    'minAdvanceHours', 2,
                    'maxAdvanceDays', 14
                ),
                'Centro de fitness con entrenamiento personalizado, clases grupales y asesoramiento deportivo profesional.'
            )
        `);

        const gimnasioId = gimnasioResult.insertId;
        console.log(`✓ Gimnasio creado con ID: ${gimnasioId}`);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Entrenamiento Personal', 'Sesión individual con entrenador certificado', 60, 40.00, 1, TRUE, 'Personal', '#FF5722'),
            (?, 'Yoga Grupal', 'Clase de yoga para todos los niveles', 60, 15.00, 15, TRUE, 'Clases', '#9C27B0'),
            (?, 'Spinning', 'Clase de ciclismo indoor intensivo', 45, 12.00, 20, TRUE, 'Clases', '#F44336'),
            (?, 'CrossFit', 'Entrenamiento funcional de alta intensidad', 60, 18.00, 12, TRUE, 'Clases', '#FF9800'),
            (?, 'Pilates', 'Clase de pilates con máquinas y suelo', 50, 20.00, 10, TRUE, 'Clases', '#4CAF50')
        `, [gimnasioId, gimnasioId, gimnasioId, gimnasioId, gimnasioId]);

        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, is_active) VALUES
            (?, 'Marcos Ruiz', 'marcos@powerfit.demo', 'Entrenador Personal', TRUE),
            (?, 'Elena Torres', 'elena@powerfit.demo', 'Instructora de Yoga y Pilates', TRUE),
            (?, 'David Moreno', 'david@powerfit.demo', 'Coach de CrossFit', TRUE)
        `, [gimnasioId, gimnasioId, gimnasioId]);

        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@powerfit.demo', ?, 'Admin PowerFit', 'owner', TRUE)
        `, [gimnasioId, passwordHash]);

        console.log('✓ Servicios, profesionales y admin de gimnasio creados');

        // 4. CENTRO DE ESTÉTICA DEMO
        console.log('\n💅 Creando Centro de Estética Demo...');

        const [esteticaResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'Estética Bella & Bella',
                'estetica-bella-demo',
                'spa',
                'Centro de Estética',
                'citas@bellabella.demo',
                '+34 916 789 123',
                'Calle Goya 178, Madrid',
                'https://stickywork.com/demos/estetica.html',
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
                    'workHoursStart', '10:00',
                    'workHoursEnd', '20:00',
                    'slotDuration', 30,
                    'minAdvanceHours', 4,
                    'maxAdvanceDays', 30
                ),
                'Centro de estética especializado en tratamientos faciales, manicura, pedicura y depilación.'
            )
        `);

        const esteticaId = esteticaResult.insertId;
        console.log(`✓ Centro de Estética creado con ID: ${esteticaId}`);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Manicura Completa', 'Arreglo y esmaltado de uñas', 45, 25.00, 1, TRUE, 'Manicura', '#E91E63'),
            (?, 'Pedicura Spa', 'Tratamiento completo para pies', 60, 35.00, 1, TRUE, 'Pedicura', '#9C27B0'),
            (?, 'Uñas de Gel', 'Aplicación de uñas de gel con diseño', 90, 45.00, 1, TRUE, 'Manicura', '#FF4081'),
            (?, 'Tratamiento Facial Hidratante', 'Limpieza profunda e hidratación facial', 60, 50.00, 1, TRUE, 'Facial', '#AB47BC'),
            (?, 'Tratamiento Anti-Edad', 'Tratamiento facial rejuvenecedor avanzado', 75, 70.00, 1, TRUE, 'Facial', '#7B1FA2'),
            (?, 'Depilación Láser Facial', 'Depilación definitiva zona facial', 30, 40.00, 1, TRUE, 'Depilación', '#E040FB')
        `, [esteticaId, esteticaId, esteticaId, esteticaId, esteticaId, esteticaId]);

        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, is_active) VALUES
            (?, 'Patricia Gómez', 'patricia@bellabella.demo', 'Esteticista Senior', TRUE),
            (?, 'Silvia Ramírez', 'silvia@bellabella.demo', 'Especialista en Uñas', TRUE),
            (?, 'Cristina Ortiz', 'cristina@bellabella.demo', 'Especialista Facial', TRUE)
        `, [esteticaId, esteticaId, esteticaId]);

        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@bellabella.demo', ?, 'Admin Bella & Bella', 'owner', TRUE)
        `, [esteticaId, passwordHash]);

        console.log('✓ Servicios, profesionales y admin de estética creados');

        // 5. DESPACHO DE ABOGADOS DEMO
        console.log('\n⚖️  Creando Despacho de Abogados Demo...');

        const [abogadosResult] = await connection.query(`
            INSERT INTO businesses (
                name, slug, type_key, type, email, phone, address, website,
                subscription_status, trial_ends_at, onboarding_completed,
                widget_settings, booking_settings, description
            ) VALUES (
                'Despacho Jurídico Lex & Partners',
                'despacho-lex-partners-demo',
                'lawyer',
                'Despacho de Abogados',
                'consultas@lexpartners.demo',
                '+34 917 890 234',
                'Paseo de la Castellana 95, Madrid',
                'https://stickywork.com/demos/abogados.html',
                'active',
                DATE_ADD(NOW(), INTERVAL 365 DAY),
                TRUE,
                JSON_OBJECT(
                    'primaryColor', '#1976D2',
                    'secondaryColor', '#424242',
                    'language', 'es',
                    'showPrices', false,
                    'showDuration', true
                ),
                JSON_OBJECT(
                    'workDays', JSON_ARRAY(1, 2, 3, 4, 5),
                    'workHoursStart', '09:00',
                    'workHoursEnd', '19:00',
                    'slotDuration', 60,
                    'minAdvanceHours', 48,
                    'maxAdvanceDays', 60
                ),
                'Despacho de abogados especializado en derecho civil, mercantil, laboral y penal.'
            )
        `);

        const abogadosId = abogadosResult.insertId;
        console.log(`✓ Despacho de Abogados creado con ID: ${abogadosId}`);

        await connection.query(`
            INSERT INTO services (business_id, name, description, duration, price, capacity, is_active, category, color) VALUES
            (?, 'Consulta Inicial', 'Primera consulta legal sin compromiso', 30, 0.00, 1, TRUE, 'Consultas', '#1976D2'),
            (?, 'Asesoramiento Civil', 'Consulta sobre derecho civil', 60, 0.00, 1, TRUE, 'Derecho Civil', '#2196F3'),
            (?, 'Asesoramiento Mercantil', 'Consulta sobre derecho mercantil y empresarial', 60, 0.00, 1, TRUE, 'Derecho Mercantil', '#1565C0'),
            (?, 'Asesoramiento Laboral', 'Consulta sobre derecho laboral', 60, 0.00, 1, TRUE, 'Derecho Laboral', '#0D47A1'),
            (?, 'Defensa Penal', 'Consulta sobre procesos penales', 60, 0.00, 1, TRUE, 'Derecho Penal', '#424242'),
            (?, 'Derecho de Familia', 'Divorcios, custodias y herencias', 60, 0.00, 1, TRUE, 'Derecho Familia', '#0288D1')
        `, [abogadosId, abogadosId, abogadosId, abogadosId, abogadosId, abogadosId]);

        await connection.query(`
            INSERT INTO professionals (business_id, name, email, role, is_active) VALUES
            (?, 'Letrado Miguel Ángel Pérez', 'miguel@lexpartners.demo', 'Abogado Civilista', TRUE),
            (?, 'Letrada Isabel Fernández', 'isabel@lexpartners.demo', 'Abogada Mercantilista', TRUE),
            (?, 'Letrado Antonio Castro', 'antonio@lexpartners.demo', 'Abogado Penalista', TRUE)
        `, [abogadosId, abogadosId, abogadosId]);

        await connection.query(`
            INSERT INTO admin_users (business_id, email, password_hash, full_name, role, is_active) VALUES
            (?, 'admin@lexpartners.demo', ?, 'Admin Lex & Partners', 'owner', TRUE)
        `, [abogadosId, passwordHash]);

        console.log('✓ Servicios, profesionales y admin de abogados creados');

        console.log('\n🎉 ¡Todos los negocios demo creados exitosamente!');
        console.log(`\n📝 IDs creados:`);
        console.log(`   - Psicólogo: ${psicologoId}`);
        console.log(`   - Nutrición: ${nutricionId}`);
        console.log(`   - Gimnasio: ${gimnasioId}`);
        console.log(`   - Estética: ${esteticaId}`);
        console.log(`   - Abogados: ${abogadosId}`);

        console.log(`\n🔑 Credenciales de acceso (todas con contraseña: demo123):`);
        console.log(`   - admin@menteclara.demo`);
        console.log(`   - admin@nutrivida.demo`);
        console.log(`   - admin@powerfit.demo`);
        console.log(`   - admin@bellabella.demo`);
        console.log(`   - admin@lexpartners.demo`);

        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

createRemainingDemos();
